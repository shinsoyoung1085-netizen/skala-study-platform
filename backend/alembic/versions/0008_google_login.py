"""support Google login: nullable password, google_id, picture_url

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "hashed_password", existing_type=sa.String(length=255), nullable=True)
    op.add_column("users", sa.Column("google_id", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("picture_url", sa.String(length=500), nullable=True))
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "picture_url")
    op.drop_column("users", "google_id")
    op.alter_column("users", "hashed_password", existing_type=sa.String(length=255), nullable=False)
