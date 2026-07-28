"""
마이페이지 등 로그인한 회원 본인 정보 관련 API.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.study import StudyMember
from app.models.user import User
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
        interests=[i.interest for i in user.interests],
        joined_study_count=joined_study_count or 0,
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
