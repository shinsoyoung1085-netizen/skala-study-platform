"""
정보 공유 게시글(Post) 및 태그(PostTag) 모델.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    curriculum_id: Mapped[int] = mapped_column(
        ForeignKey("curricula.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship()
    tags: Mapped[list["PostTag"]] = relationship(
        back_populates="post", cascade="all, delete-orphan", order_by="PostTag.id"
    )


class PostTag(Base):
    """게시글에 붙는 태그 하나. 게시글당 여러 개를 가질 수 있다 (StudyDay와 같은 1:N 패턴)."""

    __tablename__ = "post_tags"
    __table_args__ = (UniqueConstraint("post_id", "tag", name="uq_post_tag"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    tag: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    post: Mapped["Post"] = relationship(back_populates="tags")
