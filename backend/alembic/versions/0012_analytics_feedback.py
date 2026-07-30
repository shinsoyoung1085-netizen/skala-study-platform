"""add page_visits (usage analytics) and feedbacks (anonymous review board) tables

Revision ID: 0012
Revises: 0011
Create Date: 2026-07-30

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "page_visits",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("feature", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_page_visits_user_id", "page_visits", ["user_id"])
    op.create_index("ix_page_visits_feature", "page_visits", ["feature"])
    op.create_index("ix_page_visits_created_at", "page_visits", ["created_at"])

    op.create_table(
        "feedbacks",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("feedbacks")

    op.drop_index("ix_page_visits_created_at", table_name="page_visits")
    op.drop_index("ix_page_visits_feature", table_name="page_visits")
    op.drop_index("ix_page_visits_user_id", table_name="page_visits")
    op.drop_table("page_visits")
