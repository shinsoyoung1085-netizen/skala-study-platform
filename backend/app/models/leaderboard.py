"""
게임화 리더보드/포인트 기능 모델: 반(Class), 일별 공부시간 로그, 주간 스냅샷, 포인트 원장.
"""
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class StudyClass(Base):
    """캠퍼스 내 반(班). 리더보드의 Campus-Class 계층 구분에 사용."""

    __tablename__ = "study_classes"
    __table_args__ = (UniqueConstraint("campus", "name", name="uq_class_campus_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    campus: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    members: Mapped[list["User"]] = relationship(back_populates="study_class")


class StudyDailyLog(Base):
    """
    사용자별 하루 공부시간 누적(초). 하트비트로 증분 업데이트되며 일 최대치로 캡핑된다.
    주간 합계는 이 테이블을 날짜 범위로 SUM해서 구하므로 별도의 '리셋 대상 카운터'가 필요 없다.
    """

    __tablename__ = "study_daily_logs"
    __table_args__ = (UniqueConstraint("user_id", "log_date", name="uq_study_log_user_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class WeeklySnapshot(Base):
    """주간 리셋 시점에 확정된 순위 스냅샷(이력). scope(INDIVIDUAL/CLASS/CAMPUS)별로 한 행씩 남긴다."""

    __tablename__ = "weekly_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    week_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)  # 해당 주 월요일
    scope: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    class_id: Mapped[int | None] = mapped_column(
        ForeignKey("study_classes.id", ondelete="CASCADE"), nullable=True
    )
    campus: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    metric_seconds: Mapped[int] = mapped_column(Integer, nullable=False)  # 개인=총합, 반/캠퍼스=1인당 평균
    points_awarded: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PointTransaction(Base):
    """포인트 지급 원장(감사용). users.points는 기존처럼 누적 총합 컬럼으로 계속 사용하고, 이건 내역 기록 전용."""

    __tablename__ = "point_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(30), nullable=False)
    week_start: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
