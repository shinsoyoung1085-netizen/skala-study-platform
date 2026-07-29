"""
SKALA STUDY FastAPI 애플리케이션 진입점.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import admin, auth, curricula, options, posts, stats, studies, updates, users

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


@app.get("/api/health", tags=["헬스체크"], summary="서버 상태 확인")
def health_check():
    return {"status": "ok"}
