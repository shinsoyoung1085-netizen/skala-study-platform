"""
업데이트 사항 / 공지 관리 모델.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
from app.models.enums import UPDATE_CATEGORY_LABELS


class Update(Base):
    """관리자가 작성하는 업데이트 공지 1건."""

    __tablename__ = "updates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str | None] = mapped_column(String(30), nullable=True)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @property
    def category_label(self) -> str:
        return UPDATE_CATEGORY_LABELS.get(self.category, self.category)
