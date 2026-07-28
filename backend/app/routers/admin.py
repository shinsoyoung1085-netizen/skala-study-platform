"""
관리자 전용 API: 회원/스터디 목록 조회 및 삭제.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.dependencies import get_current_admin
from app.models.enums import RECOMMENDATION_TAG_LABELS
from app.models.recommendation import LeaderRecommendation
from app.models.study import Study
from app.models.user import User
from app.schemas.recommendation import AdminRecommendationLogItem
from app.schemas.study import StudyListResponse
from app.schemas.user import AdminUserResponse
from app.utils.study_mapper import to_study_response

router = APIRouter(prefix="/api/admin", tags=["관리자"], dependencies=[Depends(get_current_admin)])


@router.get("/users", response_model=list[AdminUserResponse], summary="[관리자] 회원 목록 조회")
def list_all_users(db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return users


@router.delete("/users/{user_id}", summary="[관리자] 회원 삭제")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "회원을 찾을 수 없습니다.")
    db.delete(user)
    db.commit()
    return {"message": "회원이 삭제되었습니다."}


@router.get("/studies", response_model=StudyListResponse, summary="[관리자] 스터디 목록 조회")
def list_all_studies(db: Session = Depends(get_db)):
    query = select(Study).options(
        selectinload(Study.creator), selectinload(Study.members), selectinload(Study.days)
    ).order_by(Study.created_at.desc())
    studies = db.scalars(query).unique().all()
    items = [to_study_response(s) for s in studies]
    return StudyListResponse(total=len(items), items=items)


@router.delete("/studies/{study_id}", summary="[관리자] 스터디 삭제")
def delete_study(study_id: int, db: Session = Depends(get_db)):
    study = db.get(Study, study_id)
    if study is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "스터디를 찾을 수 없습니다.")
    db.delete(study)
    db.commit()
    return {"message": "스터디가 삭제되었습니다."}


@router.get(
    "/leader-recommendations",
    response_model=list[AdminRecommendationLogItem],
    summary="[관리자] 모임장 추천/포인트 지급 내역 (추천자 정보는 포함되지 않음)",
)
def list_leader_recommendations(db: Session = Depends(get_db)):
    query = (
        select(LeaderRecommendation)
        .options(selectinload(LeaderRecommendation.leader), selectinload(LeaderRecommendation.study))
        .order_by(LeaderRecommendation.created_at.desc())
    )
    rows = db.scalars(query).all()
    return [
        AdminRecommendationLogItem(
            id=r.id,
            leader_name=r.leader.name,
            leader_username=r.leader.username,
            study_name=r.study.name,
            points_given=r.points_given,
            reason_tag=r.reason_tag,
            reason_label=RECOMMENDATION_TAG_LABELS.get(r.reason_tag, r.reason_tag),
            created_at=r.created_at,
        )
        for r in rows
    ]
