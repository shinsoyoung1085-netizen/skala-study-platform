"""
스터디 리더(개설자) 익명 추천 및 포인트 지급 관련 모델.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class LeaderRecommendation(Base):
    """
    스터디 리더에게 전달된 익명 추천 기록 (공개/관리자 열람용).
    익명성 보장을 위해 누가 추천했는지(회원 식별 정보)는 이 테이블에 절대 저장하지 않는다.
    """

    __tablename__ = "leader_recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    leader_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    study_id: Mapped[int] = mapped_column(ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    points_given: Mapped[int] = mapped_column(Integer, nullable=False)
    reason_tag: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    leader: Mapped["User"] = relationship(foreign_keys=[leader_id])
    study: Mapped["Study"] = relationship(foreign_keys=[study_id])


class RecommendationCooldown(Base):
    """
    회원당 스터디별 추천을 하루 1회로 제한하기 위한 내부 전용 테이블.
    익명성 유지를 위해 이 테이블의 user_id는 어떤 API 응답에도 절대 노출하지 않는다
    (추천 남용 방지 목적의 서버 내부 상태일 뿐, 공개/관리자용 조회 대상이 아니다).
    """

    __tablename__ = "recommendation_cooldowns"
    __table_args__ = (UniqueConstraint("user_id", "study_id", name="uq_recommendation_cooldown"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    study_id: Mapped[int] = mapped_column(ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    last_recommended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
