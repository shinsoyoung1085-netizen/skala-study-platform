"""
교육과정(Curriculum) 및 단원(Topic) 모델.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Curriculum(Base):
    __tablename__ = "curricula"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    topics: Mapped[list["Topic"]] = relationship(
        back_populates="curriculum", cascade="all, delete-orphan", order_by="Topic.order_index"
    )
    members: Mapped[list["User"]] = relationship(back_populates="curriculum")


class Topic(Base):
    """교육과정 안의 단원/주차. order_index는 SQL 예약어(order)를 피하기 위한 컬럼명이며 API에서는 order로 노출된다."""

    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    curriculum_id: Mapped[int] = mapped_column(
        ForeignKey("curricula.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    curriculum: Mapped["Curriculum"] = relationship(back_populates="topics")
