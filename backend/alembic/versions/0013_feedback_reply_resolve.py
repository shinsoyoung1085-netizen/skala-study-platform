"""add is_resolved, admin_reply, replied_at to feedbacks

Revision ID: 0013
Revises: 0012
Create Date: 2026-07-30

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "feedbacks",
        sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("feedbacks", "is_resolved", server_default=None)
    op.add_column("feedbacks", sa.Column("admin_reply", sa.Text(), nullable=True))
    op.add_column("feedbacks", sa.Column("replied_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("feedbacks", "replied_at")
    op.drop_column("feedbacks", "admin_reply")
    op.drop_column("feedbacks", "is_resolved")
