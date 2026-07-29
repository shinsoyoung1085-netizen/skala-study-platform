"""
Curriculum/Topic ORM 객체를 응답 스키마로 변환하는 공용 함수.
"""
from app.models.curriculum import Curriculum, Topic
from app.schemas.curriculum import CurriculumResponse, TopicResponse


def to_curriculum_response(curriculum: Curriculum) -> CurriculumResponse:
    """curriculum.topics/members가 미리 로딩되어 있어야 한다 (selectinload)."""
    return CurriculumResponse(
        id=curriculum.id,
        title=curriculum.title,
        description=curriculum.description,
        topic_count=len(curriculum.topics),
        member_count=len(curriculum.members),
        created_at=curriculum.created_at,
    )


def to_topic_response(topic: Topic, message_count: int) -> TopicResponse:
    """order_index -> order로 이름을 바꿔 응답한다. message_count는 별도 count 쿼리로 계산해 전달받는다."""
    return TopicResponse(
        id=topic.id,
        curriculum_id=topic.curriculum_id,
        title=topic.title,
        order=topic.order_index,
        message_count=message_count,
    )
