"""add is_main_admin column and admin_applications table

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_main_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("users", "is_main_admin", server_default=None)

    # 기존에 이미 관리자였던 회원 중 가장 먼저 만들어진 계정을 메인 관리자로 지정한다.
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE users SET is_main_admin = true
            WHERE id = (SELECT id FROM users WHERE is_admin = true ORDER BY id ASC LIMIT 1)
            """
        )
    )

    op.create_table(
        "admin_applications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="PENDING"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "reviewed_by_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
    )


def downgrade() -> None:
    op.drop_table("admin_applications")
    op.drop_column("users", "is_main_admin")
