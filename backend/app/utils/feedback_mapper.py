"""
Feedback ORM 객체를 응답 스키마로 변환하는 공용 함수.
"""
from app.models.enums import FEEDBACK_CATEGORY_LABELS
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackResponse


def to_feedback_response(item: Feedback, current_user: User) -> FeedbackResponse:
    return FeedbackResponse(
        id=item.id,
        category=item.category,
        category_label=FEEDBACK_CATEGORY_LABELS.get(item.category, item.category),
        content=item.content,
        is_mine=item.user_id == current_user.id,
        is_resolved=item.is_resolved,
        admin_reply=item.admin_reply,
        replied_at=item.replied_at,
        created_at=item.created_at,
    )
