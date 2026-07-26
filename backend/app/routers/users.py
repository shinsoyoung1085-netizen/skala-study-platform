"""
마이페이지 등 로그인한 회원 본인 정보 관련 API.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.study import StudyMember
from app.models.user import User
from app.schemas.user import UserProfileResponse

router = APIRouter(prefix="/api/users", tags=["회원"])


@router.get("/me", response_model=UserProfileResponse, summary="내 정보 조회 (마이페이지)")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    joined_study_count = db.scalar(
        select(func.count()).select_from(StudyMember).where(StudyMember.user_id == current_user.id)
    )
    return UserProfileResponse(
        id=current_user.id,
        name=current_user.name,
        username=current_user.username,
        email=current_user.email,
        skala_id=current_user.skala_id,
        is_admin=current_user.is_admin,
        interests=[i.interest for i in current_user.interests],
        joined_study_count=joined_study_count or 0,
        created_at=current_user.created_at,
    )
