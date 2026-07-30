"""
SKALA STUDY 앱 자체에 대한 익명 후기/건의 게시글 모델.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Feedback(Base):
    """
    익명 후기/건의 게시글 한 건.
    user_id는 본인 글 삭제/도배 방지 판별을 위해 내부적으로만 저장하며, 어떤 API 응답에도 노출하지 않는다.
    """

    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
