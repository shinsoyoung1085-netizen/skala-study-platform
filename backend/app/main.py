"""
SKALA STUDY FastAPI 애플리케이션 진입점.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import SessionLocal
from app.routers import (
    admin,
    auth,
    curricula,
    feedback,
    leaderboard,
    options,
    posts,
    stats,
    studies,
    updates,
    users,
)
from app.services.leaderboard_engine import run_weekly_reset, week_bounds

app = FastAPI(
    title="SKALA STUDY API",
    description="SKALA 교육생 전용 스터디 매칭 플랫폼 - \"너, 내 동료가 돼라.\"",
    version="1.0.0",
)

# CORS 설정: 프론트엔드(React) 개발 서버 및 배포 도메인 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(studies.router)
app.include_router(admin.router)
app.include_router(options.router)
app.include_router(updates.router)
app.include_router(stats.router)
app.include_router(curricula.router)
app.include_router(posts.router)
app.include_router(leaderboard.router)
app.include_router(feedback.router)


@app.get("/api/health", tags=["헬스체크"], summary="서버 상태 확인")
def health_check():
    return {"status": "ok"}


# 주간 리더보드 리셋: 매주 일요일 23:59:59 UTC. 별도 cron 서비스 없이 인프로세스 스케줄러로 처리.
scheduler = BackgroundScheduler(timezone="UTC")


@scheduler.scheduled_job(CronTrigger(day_of_week="sun", hour=23, minute=59, second=59, timezone="UTC"))
def weekly_reset_job():
    db = SessionLocal()
    try:
        week_start, _ = week_bounds()
        run_weekly_reset(db, week_start)
    finally:
        db.close()


@app.on_event("startup")
def start_scheduler():
    scheduler.start()
