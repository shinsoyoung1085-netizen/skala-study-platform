"""studies: support multiple days per study + optional exam_date

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "study_days",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("study_id", sa.Integer(), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.String(length=10), nullable=False),
        sa.UniqueConstraint("study_id", "day_of_week", name="uq_study_day"),
    )

    # 기존 studies.day_of_week(단일 요일) 데이터를 study_days(복수 요일)로 이관
    conn = op.get_bind()
    existing = conn.execute(sa.text("SELECT id, day_of_week FROM studies")).fetchall()
    for study_id, day_of_week in existing:
        if day_of_week:
            conn.execute(
                sa.text(
                    "INSERT INTO study_days (study_id, day_of_week) VALUES (:study_id, :day_of_week)"
                ),
                {"study_id": study_id, "day_of_week": day_of_week},
            )

    op.drop_column("studies", "day_of_week")
    op.add_column("studies", sa.Column("exam_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.add_column("studies", sa.Column("day_of_week", sa.String(length=10), nullable=True))

    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT DISTINCT ON (study_id) study_id, day_of_week FROM study_days ORDER BY study_id, id")
    ).fetchall()
    for study_id, day_of_week in rows:
        conn.execute(
            sa.text("UPDATE studies SET day_of_week = :day_of_week WHERE id = :study_id"),
            {"day_of_week": day_of_week, "study_id": study_id},
        )

    op.alter_column("studies", "day_of_week", nullable=False)
    op.drop_column("studies", "exam_date")
    op.drop_table("study_days")
