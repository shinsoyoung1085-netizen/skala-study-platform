"""
모든 ORM 모델을 한 곳에서 import하여 SQLAlchemy Base의 메타데이터에
전부 등록되도록 보장한다. (Base.metadata.create_all, Alembic autogenerate에서 사용)
"""
from app.models.user import User, UserInterest, UserSkill  # noqa: F401
from app.models.study import Study, StudyDay, StudyMember  # noqa: F401
from app.models.recommendation import LeaderRecommendation, RecommendationCooldown  # noqa: F401
from app.models.update import Update  # noqa: F401
from app.models.message import StudyMessage  # noqa: F401
from app.models.admin_application import AdminApplication  # noqa: F401
from app.models.site_visit import HomeVisitCounter  # noqa: F401
from app.models.curriculum import Curriculum, Topic  # noqa: F401
from app.models.topic_message import TopicMessage  # noqa: F401
from app.models.post import Post, PostTag  # noqa: F401

__all__ = [
    "User",
    "UserInterest",
    "UserSkill",
    "Study",
    "StudyDay",
    "StudyMember",
    "LeaderRecommendation",
    "RecommendationCooldown",
    "Update",
    "StudyMessage",
    "AdminApplication",
    "HomeVisitCounter",
    "Curriculum",
    "Topic",
    "TopicMessage",
    "Post",
    "PostTag",
]
