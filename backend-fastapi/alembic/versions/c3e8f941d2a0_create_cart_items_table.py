"""create_cart_items_table

Revision ID: c3e8f941d2a0
Revises: a8d7615f99e9
Create Date: 2026-10-25 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3e8f941d2a0"
down_revision: Union[str, Sequence[str], None] = "a8d7615f99e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cart_items",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("quantity >= 1 AND quantity <= 99", name="ck_cart_items_quantity_range"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="uq_cart_items_user_product"),
    )
    op.execute("ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY")
    op.execute("CREATE POLICY cart_items_select_own ON cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id)")
    op.execute("CREATE POLICY cart_items_insert_own ON cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)")
    op.execute("CREATE POLICY cart_items_update_own ON cart_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)")
    op.execute("CREATE POLICY cart_items_delete_own ON cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id)")


def downgrade() -> None:
    op.drop_table("cart_items")
