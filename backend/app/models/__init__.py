"""
모든 ORM 모델을 한 곳에서 import하여 SQLAlchemy Base의 메타데이터에
전부 등록되도록 보장한다. (Base.metadata.create_all, Alembic autogenerate에서 사용)
"""
from app.models.user import User, UserInterest  # noqa: F401
from app.models.study import Study, StudyDay, StudyMember  # noqa: F401
from app.models.recommendation import LeaderRecommendation, RecommendationCooldown  # noqa: F401
from app.models.update import Update  # noqa: F401
from app.models.message import StudyMessage  # noqa: F401

__all__ = [
    "User",
    "UserInterest",
    "Study",
    "StudyDay",
    "StudyMember",
    "LeaderRecommendation",
    "RecommendationCooldown",
    "Update",
    "StudyMessage",
]
