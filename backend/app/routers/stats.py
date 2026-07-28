"""
로그인한 회원 누구나 볼 수 있는 서비스 통계 API (전체 가입자 수, 캠퍼스별 인원).
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.enums import CAMPUS_LABELS
from app.models.user import User
from app.schemas.stats import CampusCount, MemberStatsResponse

router = APIRouter(prefix="/api/stats", tags=["통계"])


@router.get("/members", response_model=MemberStatsResponse, summary="전체 가입자 수 및 캠퍼스별 인원")
def get_member_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = db.scalar(select(func.count()).select_from(User)) or 0

    rows = db.execute(select(User.campus, func.count()).group_by(User.campus)).all()
    counts_by_code = {campus: count for campus, count in rows}

    campus_counts = [
        CampusCount(code=code, label=label, count=counts_by_code.get(code, 0))
        for code, label in CAMPUS_LABELS.items()
    ]

    return MemberStatsResponse(total_members=total, campus_counts=campus_counts)
