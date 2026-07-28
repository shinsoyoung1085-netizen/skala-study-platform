"""
마이페이지 등 로그인한 회원 본인 정보 관련 API.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password, verify_password
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.admin_application import AdminApplication
from app.models.enums import APPLICATION_STATUS_LABELS, RECOMMENDATION_TAG_LABELS, ApplicationStatus
from app.models.recommendation import LeaderRecommendation
from app.models.study import StudyMember
from app.models.user import User
from app.schemas.admin_application import AdminApplicationCreateRequest, AdminApplicationResponse
from app.schemas.recommendation import MyPointsResponse, ReceivedRecommendationItem
from app.schemas.user import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    UpdateProfileRequest,
    UserProfileResponse,
)

router = APIRouter(prefix="/api/users", tags=["회원"])


def _build_profile_response(user: User, db: Session) -> UserProfileResponse:
    joined_study_count = db.scalar(
        select(func.count()).select_from(StudyMember).where(StudyMember.user_id == user.id)
    )
    return UserProfileResponse(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        skala_id=user.skala_id,
        campus=user.campus,
        campus_label=user.campus_label,
        is_admin=user.is_admin,
        is_main_admin=user.is_main_admin,
        interests=[i.interest for i in user.interests],
        joined_study_count=joined_study_count or 0,
        points=user.points,
        created_at=user.created_at,
    )


@router.get("/me", response_model=UserProfileResponse, summary="내 정보 조회 (마이페이지)")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _build_profile_response(current_user, db)


@router.patch("/me", response_model=UserProfileResponse, summary="내 정보 수정 (아이디/이메일/캠퍼스)")
def update_my_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.username is not None and payload.username != current_user.username:
        exists = db.scalar(
            select(User).where(User.username == payload.username, User.id != current_user.id)
        )
        if exists is not None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 사용 중인 아이디입니다.")
        current_user.username = payload.username

    if payload.email is not None and payload.email != current_user.email:
        exists = db.scalar(select(User).where(User.email == payload.email, User.id != current_user.id))
        if exists is not None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 사용 중인 이메일입니다.")
        current_user.email = payload.email

    if payload.campus is not None:
        current_user.campus = payload.campus.value

    db.commit()
    db.refresh(current_user)
    return _build_profile_response(current_user, db)


@router.post("/me/change-password", summary="비밀번호 변경")
def change_my_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다.")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "비밀번호가 변경되었습니다."}


def _to_application_response(application: AdminApplication) -> AdminApplicationResponse:
    return AdminApplicationResponse(
        id=application.id,
        reason=application.reason,
        status=application.status,
        status_label=APPLICATION_STATUS_LABELS.get(application.status, application.status),
        created_at=application.created_at,
        reviewed_at=application.reviewed_at,
    )


@router.post(
    "/me/admin-application",
    response_model=AdminApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="관리자 권한 신청 (메인 관리자 승인 후 부관리자로 전환)",
)
def apply_for_admin(
    payload: AdminApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_admin:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 관리자입니다.")

    existing_pending = db.scalar(
        select(AdminApplication).where(
            AdminApplication.user_id == current_user.id,
            AdminApplication.status == ApplicationStatus.PENDING.value,
        )
    )
    if existing_pending is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 심사중인 신청이 있습니다.")

    application = AdminApplication(user_id=current_user.id, reason=payload.reason)
    db.add(application)
    db.commit()
    db.refresh(application)
    return _to_application_response(application)


@router.get(
    "/me/admin-application",
    response_model=AdminApplicationResponse | None,
    summary="내 관리자 신청 현황 조회 (가장 최근 1건)",
)
def get_my_admin_application(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(AdminApplication)
        .where(AdminApplication.user_id == current_user.id)
        .order_by(AdminApplication.created_at.desc())
        .limit(1)
    )
    return _to_application_response(application) if application else None


@router.get("/me/points", response_model=MyPointsResponse, summary="내 포인트 및 익명 칭찬 내역 조회")
def get_my_points(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(LeaderRecommendation)
        .options(selectinload(LeaderRecommendation.study))
        .where(LeaderRecommendation.leader_id == current_user.id)
        .order_by(LeaderRecommendation.created_at.desc())
    ).all()

    return MyPointsResponse(
        points=current_user.points,
        recommendations_received=[
            ReceivedRecommendationItem(
                study_name=r.study.name,
                reason_tag=r.reason_tag,
                reason_label=RECOMMENDATION_TAG_LABELS.get(r.reason_tag, r.reason_tag),
                points_given=r.points_given,
                created_at=r.created_at,
            )
            for r in rows
        ],
    )


@router.delete("/me", summary="회원 탈퇴")
def delete_my_account(
    payload: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "비밀번호가 올바르지 않습니다.")
    if current_user.is_admin:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "관리자 계정은 탈퇴할 수 없습니다. 다른 관리자에게 문의해주세요."
        )

    # 본인이 개설한 스터디도 함께 삭제되고(참여자 포함), 참여중이던 스터디에서는 자동으로 빠지게 된다.
    db.delete(current_user)
    db.commit()
    return {"message": "회원 탈퇴가 완료되었습니다."}
