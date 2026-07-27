"""users: add campus column

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 기존에 가입된 회원(예: 관리자 계정)이 있을 수 있으므로 기본값을 둔 뒤 NOT NULL로 고정한다.
    op.add_column(
        "users",
        sa.Column("campus", sa.String(length=20), nullable=False, server_default="PANGYO"),
    )
    op.alter_column("users", "campus", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "campus")
