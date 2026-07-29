"""
TopicMessage ORM 객체를 응답 스키마로 변환하는 공용 함수.
"""
from app.models.topic_message import TopicMessage
from app.schemas.topic_message import TopicMessageResponse


def to_topic_message_responses(
    messages: list[TopicMessage], current_user_id: int
) -> list[TopicMessageResponse]:
    """목록 조회용: 어떤 질문 메시지가 채택된 답변을 가지고 있는지 한 번에 집계한 뒤 변환한다."""
    accepted_question_ids = {
        m.reply_to_id for m in messages if m.is_accepted and m.reply_to_id is not None
    }
    return [
        TopicMessageResponse(
            id=m.id,
            sender_id=m.user_id,
            sender_name=m.user.name,
            content=m.content,
            is_question=m.is_question,
            category=m.category,
            reply_to_id=m.reply_to_id,
            is_accepted=m.is_accepted,
            is_solved=m.id in accepted_question_ids,
            created_at=m.created_at,
            is_mine=m.user_id == current_user_id,
        )
        for m in messages
    ]


def to_new_topic_message_response(message: TopicMessage, sender_name: str) -> TopicMessageResponse:
    """전송 직후 응답용: 방금 만든 메시지이므로 채택된 답변이 있을 수 없다."""
    return TopicMessageResponse(
        id=message.id,
        sender_id=message.user_id,
        sender_name=sender_name,
        content=message.content,
        is_question=message.is_question,
        category=message.category,
        reply_to_id=message.reply_to_id,
        is_accepted=message.is_accepted,
        is_solved=False,
        created_at=message.created_at,
        is_mine=True,
    )
