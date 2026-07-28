"""
업데이트 공지 조회 API (로그인한 회원 누구나 최신 공지를 확인할 수 있다).
관리자 전용 작성/수정/삭제는 app/routers/admin.py에 있다.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.update import Update
from app.models.user import User
from app.schemas.update import UpdateResponse

router = APIRouter(prefix="/api/updates", tags=["업데이트 공지"])


@router.get("/latest", response_model=UpdateResponse | None, summary="가장 최근 활성화된 업데이트 공지 조회")
def get_latest_update(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update = db.scalar(
        select(Update).where(Update.is_active.is_(True)).order_by(Update.created_at.desc()).limit(1)
    )
    return update
