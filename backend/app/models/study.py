"""
스터디(Study), 스터디 요일(StudyDay), 스터디 참여(StudyMember) 모델.
"""
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Study(Base):
    __tablename__ = "studies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    time: Mapped[str] = mapped_column(String(20), nullable=False)
    location: Mapped[str] = mapped_column(String(20), nullable=False)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 자격증/어학 시험을 목표로 하는 스터디를 위한 선택적 목표 시험일
    exam_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    creator: Mapped["User"] = relationship(back_populates="created_studies", foreign_keys=[creator_id])
    members: Mapped[list["StudyMember"]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    # 스터디가 진행되는 요일들 (복수 선택 가능: 월수금, 주말, 매일 등 자유 조합)
    days: Mapped[list["StudyDay"]] = relationship(
        back_populates="study", cascade="all, delete-orphan", order_by="StudyDay.id"
    )


class StudyDay(Base):
    """스터디가 진행되는 요일 하나. 스터디당 여러 개를 가질 수 있다 (다대다가 아닌 1:N)."""

    __tablename__ = "study_days"
    __table_args__ = (UniqueConstraint("study_id", "day_of_week", name="uq_study_day"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    study_id: Mapped[int] = mapped_column(ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(10), nullable=False)

    study: Mapped["Study"] = relationship(back_populates="days")


class StudyMember(Base):
    __tablename__ = "study_members"
    __table_args__ = (UniqueConstraint("study_id", "user_id", name="uq_study_member"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    study_id: Mapped[int] = mapped_column(ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    study: Mapped["Study"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="study_memberships")
