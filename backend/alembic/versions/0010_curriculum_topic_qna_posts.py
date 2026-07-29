"""add curricula, topics, user_skills, topic_messages, posts, post_tags tables; users.curriculum_id

Revision ID: 0010
Revises: 0009
Create Date: 2026-07-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "curricula",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "topics",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("curriculum_id", sa.Integer(), sa.ForeignKey("curricula.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
    )
    op.create_index("ix_topics_curriculum_id", "topics", ["curriculum_id"])

    op.add_column(
        "users",
        sa.Column(
            "curriculum_id",
            sa.Integer(),
            sa.ForeignKey("curricula.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    op.create_table(
        "user_skills",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("level", sa.String(length=10), nullable=False),
        sa.UniqueConstraint("user_id", "category", name="uq_user_skill_category"),
    )

    op.create_table(
        "topic_messages",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("topic_id", sa.Integer(), sa.ForeignKey("topics.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_question", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("reply_to_id", sa.Integer(), sa.ForeignKey("topic_messages.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_accepted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_topic_messages_topic_id", "topic_messages", ["topic_id"])

    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("curriculum_id", sa.Integer(), sa.ForeignKey("curricula.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_posts_curriculum_id", "posts", ["curriculum_id"])

    op.create_table(
        "post_tags",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag", sa.String(length=50), nullable=False),
        sa.UniqueConstraint("post_id", "tag", name="uq_post_tag"),
    )
    op.create_index("ix_post_tags_tag", "post_tags", ["tag"])


def downgrade() -> None:
    op.drop_index("ix_post_tags_tag", table_name="post_tags")
    op.drop_table("post_tags")
    op.drop_index("ix_posts_curriculum_id", table_name="posts")
    op.drop_table("posts")
    op.drop_index("ix_topic_messages_topic_id", table_name="topic_messages")
    op.drop_table("topic_messages")
    op.drop_table("user_skills")
    op.drop_column("users", "curriculum_id")
    op.drop_index("ix_topics_curriculum_id", table_name="topics")
    op.drop_table("topics")
    op.drop_table("curricula")
