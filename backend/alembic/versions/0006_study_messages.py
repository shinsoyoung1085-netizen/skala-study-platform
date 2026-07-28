"""add study_messages table for in-study group chat

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "study_messages",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("study_id", sa.Integer(), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_study_messages_study_id", "study_messages", ["study_id"])


def downgrade() -> None:
    op.drop_index("ix_study_messages_study_id", table_name="study_messages")
    op.drop_table("study_messages")
