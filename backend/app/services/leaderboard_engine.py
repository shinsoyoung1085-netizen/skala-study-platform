"""주간 공부시간 집계, 순위 산정, 포인트 지급, 리셋(스냅샷) 엔진."""
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import MAX_DAILY_STUDY_SECONDS, TIER_POINTS, WEEKLY_QUALIFICATION_SECONDS
from app.models.leaderboard import PointTransaction, StudyClass, StudyDailyLog, WeeklySnapshot
from app.models.user import User

KST = ZoneInfo("Asia/Seoul")


def today_kst() -> date:
    """
    한국 시간(Asia/Seoul) 기준 오늘 날짜. 하루 공부시간 집계/캡핑의 '하루' 경계가 항상 자정(KST)이 되도록,
    배포 서버의 OS 타임존(대부분 UTC)에 의존하는 date.today() 대신 이 함수를 기준으로 삼는다.
    """
    return datetime.now(KST).date()


def week_bounds(today: date | None = None) -> tuple[date, date]:
    """ISO 기준 이번 주 월요일~일요일 범위를 반환한다 (KST 기준)."""
    d = today or today_kst()
    start = d - timedelta(days=d.weekday())  # 월요일
    return start, start + timedelta(days=6)  # 일요일


def record_heartbeat(db: Session, user_id: int, elapsed_seconds: int, today: date | None = None) -> int:
    """
    하트비트 1회 처리: elapsed_seconds만큼 오늘 로그에 더한다.
    - elapsed_seconds는 클라이언트 하트비트 주기(30초)를 넘길 수 없도록 라우터에서 사전 clamp된 값이어야 한다.
    - 하루 총합은 MAX_DAILY_STUDY_SECONDS로 캡핑(어뷰징 방지).
    반환값: 오늘의 최종 누적 초.
    """
    d = today or today_kst()
    log = db.execute(
        select(StudyDailyLog).where(StudyDailyLog.user_id == user_id, StudyDailyLog.log_date == d)
    ).scalar_one_or_none()

    if log is None:
        log = StudyDailyLog(user_id=user_id, log_date=d, seconds=0)
        db.add(log)

    log.seconds = min(log.seconds + max(0, elapsed_seconds), MAX_DAILY_STUDY_SECONDS)
    db.commit()
    return log.seconds


def get_today_seconds(db: Session, user_id: int, today: date | None = None) -> int:
    """오늘(KST) 누적 공부시간(초) 조회. 기록이 없으면 0 (증분 없이 조회만)."""
    d = today or today_kst()
    seconds = db.scalar(
        select(StudyDailyLog.seconds).where(StudyDailyLog.user_id == user_id, StudyDailyLog.log_date == d)
    )
    return seconds or 0


def weekly_totals_by_user(db: Session, week_start: date, week_end: date) -> dict[int, int]:
    """이번 주(week_start~week_end) 사용자별 총 공부시간(초)."""
    from sqlalchemy import func

    rows = db.execute(
        select(StudyDailyLog.user_id, func.sum(StudyDailyLog.seconds))
        .where(StudyDailyLog.log_date.between(week_start, week_end))
        .group_by(StudyDailyLog.user_id)
    ).all()
    return {uid: int(total) for uid, total in rows}


def class_and_campus_averages(
    db: Session, totals: dict[int, int]
) -> tuple[dict[int, float], dict[str, float], dict[int, list[int]], dict[str, list[int]]]:
    """
    반별 1인당 평균, 캠퍼스별 1인당 평균(공정성 지표)을 계산한다.
    함께 반환하는 users_by_class/users_by_campus는 라우터에서 순위 badge 계산에 재사용한다.
    """
    users = db.execute(select(User)).scalars().all()

    users_by_class: dict[int, list[int]] = {}
    users_by_campus: dict[str, list[int]] = {}
    for u in users:
        if u.class_id:
            users_by_class.setdefault(u.class_id, []).append(u.id)
        users_by_campus.setdefault(u.campus, []).append(u.id)

    class_avg = {
        cid: (sum(totals.get(uid, 0) for uid in uids) / len(uids)) if uids else 0
        for cid, uids in users_by_class.items()
    }
    campus_avg = {
        campus: (sum(totals.get(uid, 0) for uid in uids) / len(uids)) if uids else 0
        for campus, uids in users_by_campus.items()
    }
    return class_avg, campus_avg, users_by_class, users_by_campus


def run_weekly_reset(db: Session, week_start: date | None = None) -> None:
    """
    매주 일요일 23:59:59 UTC에 호출. 지난 주 데이터를 집계 -> 순위 스냅샷 저장 -> 포인트 지급.
    study_daily_logs는 날짜로 파티션되어 있어 '카운터 초기화'가 필요 없다 - 다음 주 조회는 자연히 빈 구간에서 시작한다.
    """
    week_start = week_start or week_bounds()[0]
    week_end = week_start + timedelta(days=6)

    totals = weekly_totals_by_user(db, week_start, week_end)
    users = db.execute(select(User)).scalars().all()
    users_by_id = {u.id: u for u in users}
    qualifies = {u.id: totals.get(u.id, 0) >= WEEKLY_QUALIFICATION_SECONDS for u in users}

    users_by_class: dict[int, list[User]] = {}
    for u in users:
        if u.class_id:
            users_by_class.setdefault(u.class_id, []).append(u)

    ledger: list[tuple[int, int, str]] = []  # (user_id, points, reason) - 지급 건별로 개별 기록

    # --- Tier 1: 반 내 개인 1위 (자격 미달자는 후보에서 제외) ---
    for class_id, members in users_by_class.items():
        ranked = sorted(members, key=lambda u: totals.get(u.id, 0), reverse=True)
        qualified_ranked = [u for u in ranked if qualifies[u.id]]
        winner_id = qualified_ranked[0].id if qualified_ranked else None
        for i, u in enumerate(ranked, start=1):
            db.add(
                WeeklySnapshot(
                    week_start=week_start,
                    scope="INDIVIDUAL",
                    user_id=u.id,
                    class_id=class_id,
                    rank=i,
                    metric_seconds=totals.get(u.id, 0),
                    points_awarded=TIER_POINTS["WEEKLY_INDIVIDUAL"] if u.id == winner_id else 0,
                )
            )
        if winner_id is not None:
            ledger.append((winner_id, TIER_POINTS["WEEKLY_INDIVIDUAL"], "WEEKLY_INDIVIDUAL"))

    class_avg, campus_avg, _, users_by_campus_ids = class_and_campus_averages(db, totals)

    # --- Tier 2: 캠퍼스별 우승 반 -> 그 반의 '자격 충족자'만 지급 ---
    classes_by_campus: dict[str, list[StudyClass]] = {}
    for c in db.execute(select(StudyClass)).scalars().all():
        classes_by_campus.setdefault(c.campus, []).append(c)

    for campus, classes in classes_by_campus.items():
        ranked_classes = sorted(classes, key=lambda c: class_avg.get(c.id, 0), reverse=True)
        for i, c in enumerate(ranked_classes, start=1):
            db.add(
                WeeklySnapshot(
                    week_start=week_start,
                    scope="CLASS",
                    class_id=c.id,
                    campus=campus,
                    rank=i,
                    metric_seconds=int(class_avg.get(c.id, 0)),
                    points_awarded=TIER_POINTS["WEEKLY_CLASS"] if i == 1 else 0,
                )
            )
        if ranked_classes:
            for u in users_by_class.get(ranked_classes[0].id, []):
                if qualifies[u.id]:
                    ledger.append((u.id, TIER_POINTS["WEEKLY_CLASS"], "WEEKLY_CLASS"))

    # --- Tier 3: 전체 우승 캠퍼스(1인당 평균) -> 그 캠퍼스 '자격 충족자'만 지급 ---
    ranked_campuses = sorted(campus_avg.items(), key=lambda kv: kv[1], reverse=True)
    for i, (campus, avg) in enumerate(ranked_campuses, start=1):
        db.add(
            WeeklySnapshot(
                week_start=week_start,
                scope="CAMPUS",
                campus=campus,
                rank=i,
                metric_seconds=int(avg),
                points_awarded=TIER_POINTS["WEEKLY_CAMPUS"] if i == 1 else 0,
            )
        )
    if ranked_campuses:
        winning_campus = ranked_campuses[0][0]
        for uid in users_by_campus_ids.get(winning_campus, []):
            if qualifies[uid]:
                ledger.append((uid, TIER_POINTS["WEEKLY_CAMPUS"], "WEEKLY_CAMPUS"))

    # --- 지급 반영: 원장 기록(티어별 개별 행) + 기존 users.points 누적 컬럼 증가 ---
    # 한 사람이 세 티어를 동시에 받을 수 있다(반 1등이면서 반이 캠퍼스 1등, 캠퍼스가 전체 1등인 MVP 시나리오).
    for user_id, pts, reason in ledger:
        db.add(PointTransaction(user_id=user_id, points=pts, reason=reason, week_start=week_start))
        users_by_id[user_id].points += pts

    db.commit()
