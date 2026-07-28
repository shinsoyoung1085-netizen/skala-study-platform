"""add home_visit_counter table

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "home_visit_counter",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("total_visits", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute("INSERT INTO home_visit_counter (id, total_visits) VALUES (1, 0)")


def downgrade() -> None:
    op.drop_table("home_visit_counter")
