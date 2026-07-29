"""
단원(Topic)별 Q&A 채팅 메시지 모델.
StudyMessage(폴링 기반 그룹 채팅)와 동일한 구조에 질문 등록/답변 채택 필드를 추가한 것.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class TopicMessage(Base):
    __tablename__ = "topic_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # 이 메시지를 질문으로 등록했는지 여부. True인 경우에만 category가 의미를 가진다.
    is_question: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # 답변 메시지가 어떤 질문 메시지에 달린 것인지 (질문 메시지 자신은 null).
    reply_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("topic_messages.id", ondelete="SET NULL"), nullable=True
    )
    # 질문 작성자가 이 답변을 채택했는지 여부.
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    topic: Mapped["Topic"] = relationship(foreign_keys=[topic_id])
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    reply_to: Mapped["TopicMessage | None"] = relationship(
        foreign_keys=[reply_to_id], remote_side=[id]
    )
