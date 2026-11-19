"""add_order_idempotency_key

Revision ID: f4a7c2d9e1b6
Revises: 981b0404bdba
Create Date: 2026-11-19 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f4a7c2d9e1b6"
down_revision: Union[str, Sequence[str], None] = "981b0404bdba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("idempotency_key", sa.String(length=255), nullable=True),
    )
    op.create_unique_constraint(
        "uq_orders_user_id_idempotency_key",
        "orders",
        ["user_id", "idempotency_key"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_orders_user_id_idempotency_key",
        "orders",
        type_="unique",
    )
    op.drop_column("orders", "idempotency_key")
