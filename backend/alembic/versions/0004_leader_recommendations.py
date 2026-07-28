"""users: add points column; add leader_recommendations and recommendation_cooldowns tables

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("points", sa.Integer(), nullable=False, server_default="0"),
    )
    op.alter_column("users", "points", server_default=None)

    op.create_table(
        "leader_recommendations",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("leader_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("study_id", sa.Integer(), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("points_given", sa.Integer(), nullable=False),
        sa.Column("reason_tag", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "recommendation_cooldowns",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("study_id", sa.Integer(), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("last_recommended_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "study_id", name="uq_recommendation_cooldown"),
    )


def downgrade() -> None:
    op.drop_table("recommendation_cooldowns")
    op.drop_table("leader_recommendations")
    op.drop_column("users", "points")
