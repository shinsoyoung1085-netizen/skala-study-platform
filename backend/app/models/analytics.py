"""
회원별/기능별 방문 로그 모델. 관리자 이용 분석 대시보드(캠퍼스별/기능별/회원별 이용률)의 원본 데이터로 쓰인다.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class PageVisit(Base):
    """회원이 특정 기능(화면)에 진입할 때마다 한 행씩 쌓이는 방문 로그."""

    __tablename__ = "page_visits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feature: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
