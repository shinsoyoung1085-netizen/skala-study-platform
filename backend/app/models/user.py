"""
회원(User) 및 회원 관심분야(UserInterest) 모델.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.enums import CAMPUS_LABELS


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    # Google 계정으로만 가입한 회원은 비밀번호가 없다 (로그인은 항상 Google로만 가능).
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Google 로그인 연동 정보 (구글의 고유 사용자 ID, 프로필 사진)
    google_id: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    picture_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    skala_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    campus: Mapped[str] = mapped_column(String(20), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 메인 관리자(최초 관리자) 여부. 관리자 신청 승인 등 민감한 작업은 메인 관리자만 할 수 있다.
    # 신청 승인으로 관리자가 된 회원은 is_admin=True, is_main_admin=False (부관리자)로 남는다.
    is_main_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 익명 모임장 추천으로 적립되는 소액 포인트 누적값
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # 소속 교육과정 (커리큘럼별 대시보드/Q&A 스페이스 분리에 사용). 관리자가 만든 커리큘럼 중 본인이 선택.
    curriculum_id: Mapped[int | None] = mapped_column(
        ForeignKey("curricula.id", ondelete="SET NULL"), nullable=True
    )
    # 소속 반 (캠퍼스 내 리더보드 계층: 캠퍼스 > 반 > 개인). 관리자가 배정.
    class_id: Mapped[int | None] = mapped_column(
        ForeignKey("study_classes.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # 회원의 관심분야 목록
    interests: Mapped[list["UserInterest"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    # 회원의 분야별 이해도(역량) 프로필
    skills: Mapped[list["UserSkill"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    # 소속 교육과정
    curriculum: Mapped["Curriculum | None"] = relationship(back_populates="members")
    # 소속 반 (리더보드)
    study_class: Mapped["StudyClass | None"] = relationship(back_populates="members")
    # 회원이 생성한 스터디 목록
    created_studies: Mapped[list["Study"]] = relationship(
        back_populates="creator", foreign_keys="Study.creator_id"
    )
    # 회원이 참여한 스터디 (StudyMember를 통한 다대다)
    study_memberships: Mapped[list["StudyMember"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def campus_label(self) -> str:
        """캠퍼스 코드에 대응하는 한글 라벨 (API 응답 직렬화 시 자동으로 함께 사용됨)."""
        return CAMPUS_LABELS.get(self.campus, self.campus)


class UserInterest(Base):
    __tablename__ = "user_interests"
    __table_args__ = (UniqueConstraint("user_id", "interest", name="uq_user_interest"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    interest: Mapped[str] = mapped_column(String(50), nullable=False)

    user: Mapped["User"] = relationship(back_populates="interests")


class UserSkill(Base):
    """회원의 분야별 이해도(역량) 프로필 한 건. 분야는 자유 텍스트이며 Q&A 전문가 추천 매칭 기준으로 쓰인다."""

    __tablename__ = "user_skills"
    __table_args__ = (UniqueConstraint("user_id", "category", name="uq_user_skill_category"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    level: Mapped[str] = mapped_column(String(10), nullable=False)

    user: Mapped["User"] = relationship(back_populates="skills")
