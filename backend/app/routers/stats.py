"""
로그인한 회원 누구나 볼 수 있는 서비스 통계 API (전체 가입자 수, 캠퍼스별 인원).
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.analytics import PageVisit
from app.models.enums import CAMPUS_LABELS
from app.models.site_visit import HomeVisitCounter
from app.models.user import User
from app.schemas.analytics import TrackVisitRequest
from app.schemas.stats import CampusCount, HomeVisitResponse, MemberStatsResponse

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


@router.post("/visits/ping", response_model=HomeVisitResponse, summary="홈 화면 방문수 1 증가")
def ping_home_visit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counter = db.get(HomeVisitCounter, 1)
    if counter is None:
        counter = HomeVisitCounter(id=1, total_visits=0)
        db.add(counter)
    counter.total_visits += 1
    db.commit()
    db.refresh(counter)
    return HomeVisitResponse(total_visits=counter.total_visits)


@router.post("/track", status_code=204, summary="화면(기능) 방문 기록 (관리자 이용 분석용)")
def track_visit(
    payload: TrackVisitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.add(PageVisit(user_id=current_user.id, feature=payload.feature.value))
    db.commit()
