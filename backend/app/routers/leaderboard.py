"""
게임화 리더보드 대시보드 API: 공부시간 하트비트 기록 및 순위/포인트 조회.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.enums import CAMPUS_LABELS, WEEKLY_QUALIFICATION_SECONDS
from app.models.leaderboard import StudyClass, StudyDailyLog
from app.models.user import User
from app.schemas.leaderboard import (
    CampusProgress,
    ClassOption,
    DailyBreakdownItem,
    DashboardResponse,
    HeartbeatRequest,
    HeartbeatResponse,
    RankBadge,
)
from app.services.leaderboard_engine import (
    class_and_campus_averages,
    get_today_seconds,
    record_heartbeat,
    week_bounds,
    weekly_totals_by_user,
)

router = APIRouter(prefix="/api/leaderboard", tags=["리더보드"])

# 프론트에서 30초 주기로 하트비트를 보낸다는 전제 - 이보다 크면 조작 의심이므로 서버에서 강제로 clamp한다.
HEARTBEAT_MAX_ELAPSED_SECONDS = 35


@router.get("/classes", response_model=list[ClassOption], summary="캠퍼스 내 반 목록 (마이페이지 반 선택용)")
def list_classes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 항상 '내 캠퍼스' 안의 반만 보여준다 - 리더보드 계층(캠퍼스 > 반 > 개인) 상 다른 캠퍼스 반은 선택 대상이 아니다.
    classes = db.execute(
        select(StudyClass).where(StudyClass.campus == current_user.campus).order_by(StudyClass.name)
    ).scalars().all()
    return classes


@router.get("/today", response_model=HeartbeatResponse, summary="오늘(KST) 누적 공부시간 조회")
def get_today(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return HeartbeatResponse(today_seconds=get_today_seconds(db, current_user.id))


@router.post("/heartbeat", response_model=HeartbeatResponse, summary="공부 시간 하트비트 (30초마다 호출)")
def heartbeat(
    body: HeartbeatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clamped = min(body.elapsed_seconds, HEARTBEAT_MAX_ELAPSED_SECONDS)
    today_seconds = record_heartbeat(db, current_user.id, clamped)
    return HeartbeatResponse(today_seconds=today_seconds)


@router.get("/dashboard", response_model=DashboardResponse, summary="내 리더보드 대시보드")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    week_start, week_end = week_bounds()

    daily_rows = db.execute(
        select(StudyDailyLog.log_date, StudyDailyLog.seconds)
        .where(StudyDailyLog.user_id == current_user.id, StudyDailyLog.log_date.between(week_start, week_end))
        .order_by(StudyDailyLog.log_date)
    ).all()
    breakdown = [DailyBreakdownItem(log_date=d, seconds=s) for d, s in daily_rows]
    my_total = sum(s for _, s in daily_rows)

    totals = weekly_totals_by_user(db, week_start, week_end)
    class_avg, campus_avg, users_by_class, users_by_campus = class_and_campus_averages(db, totals)

    # 개인 순위: 내 반 안에서 총 공부시간 기준
    individual_badge = None
    if current_user.class_id:
        classmate_ids = users_by_class.get(current_user.class_id, [])
        ranked = sorted(classmate_ids, key=lambda uid: totals.get(uid, 0), reverse=True)
        if current_user.id in ranked:
            individual_badge = RankBadge(rank=ranked.index(current_user.id) + 1, total=len(ranked))

    # 반 순위: 같은 캠퍼스 내 다른 반들과 1인당 평균 비교
    class_badge = None
    if current_user.class_id:
        classes_in_campus = db.execute(
            select(StudyClass.id).where(StudyClass.campus == current_user.campus)
        ).scalars().all()
        ranked_classes = sorted(classes_in_campus, key=lambda cid: class_avg.get(cid, 0), reverse=True)
        if current_user.class_id in ranked_classes:
            class_badge = RankBadge(
                rank=ranked_classes.index(current_user.class_id) + 1, total=len(ranked_classes)
            )

    # 캠퍼스 순위: 전체 캠퍼스 중 1인당 평균 비교
    ranked_campuses = sorted(campus_avg.keys(), key=lambda c: campus_avg.get(c, 0), reverse=True)
    campus_badge = (
        RankBadge(rank=ranked_campuses.index(current_user.campus) + 1, total=len(ranked_campuses))
        if current_user.campus in ranked_campuses
        else None
    )

    campus_progress = [
        CampusProgress(campus=code, label=label, avg_seconds=int(campus_avg.get(code, 0)))
        for code, label in CAMPUS_LABELS.items()
    ]

    return DashboardResponse(
        my_weekly_seconds=my_total,
        my_daily_breakdown=breakdown,
        individual_rank_in_class=individual_badge,
        class_rank_in_campus=class_badge,
        campus_rank_overall=campus_badge,
        campus_progress=campus_progress,
        qualifies_this_week=my_total >= WEEKLY_QUALIFICATION_SECONDS,
    )
