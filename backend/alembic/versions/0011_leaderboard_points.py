"""add study_classes, users.class_id, study_daily_logs, weekly_snapshots, point_transactions

Revision ID: 0011
Revises: 0010
Create Date: 2026-07-30

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "study_classes",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("campus", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("campus", "name", name="uq_class_campus_name"),
    )
    op.create_index("ix_study_classes_campus", "study_classes", ["campus"])

    op.add_column(
        "users",
        sa.Column(
            "class_id",
            sa.Integer(),
            sa.ForeignKey("study_classes.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    op.create_table(
        "study_daily_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("log_date", sa.Date(), nullable=False),
        sa.Column("seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "log_date", name="uq_study_log_user_date"),
    )
    op.create_index("ix_study_daily_logs_user_id", "study_daily_logs", ["user_id"])
    op.create_index("ix_study_daily_logs_log_date", "study_daily_logs", ["log_date"])

    op.create_table(
        "weekly_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("scope", sa.String(length=20), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column(
            "class_id", sa.Integer(), sa.ForeignKey("study_classes.id", ondelete="CASCADE"), nullable=True
        ),
        sa.Column("campus", sa.String(length=20), nullable=True),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("metric_seconds", sa.Integer(), nullable=False),
        sa.Column("points_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_weekly_snapshots_week_start", "weekly_snapshots", ["week_start"])

    op.create_table(
        "point_transactions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=30), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_point_transactions_user_id", "point_transactions", ["user_id"])
    op.create_index("ix_point_transactions_week_start", "point_transactions", ["week_start"])


def downgrade() -> None:
    op.drop_index("ix_point_transactions_week_start", table_name="point_transactions")
    op.drop_index("ix_point_transactions_user_id", table_name="point_transactions")
    op.drop_table("point_transactions")

    op.drop_index("ix_weekly_snapshots_week_start", table_name="weekly_snapshots")
    op.drop_table("weekly_snapshots")

    op.drop_index("ix_study_daily_logs_log_date", table_name="study_daily_logs")
    op.drop_index("ix_study_daily_logs_user_id", table_name="study_daily_logs")
    op.drop_table("study_daily_logs")

    op.drop_column("users", "class_id")

    op.drop_index("ix_study_classes_campus", table_name="study_classes")
    op.drop_table("study_classes")
