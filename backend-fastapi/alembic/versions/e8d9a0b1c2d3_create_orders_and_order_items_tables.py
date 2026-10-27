"""create_orders_and_order_items_tables

Revision ID: e8d9a0b1c2d3
Revises: c3e8f941d2a0
Create Date: 2026-10-27 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8d9a0b1c2d3"
down_revision: Union[str, Sequence[str], None] = "c3e8f941d2a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("total_cents", sa.BigInteger(), nullable=False),
        sa.Column("shipping_name", sa.String(length=255), nullable=False),
        sa.Column("shipping_line1", sa.String(length=255), nullable=False),
        sa.Column("shipping_line2", sa.String(length=255), nullable=True),
        sa.Column("shipping_city", sa.String(length=100), nullable=False),
        sa.Column("shipping_state", sa.String(length=100), nullable=False),
        sa.Column("shipping_pincode", sa.String(length=20), nullable=False),
        sa.Column("shipping_country", sa.String(length=2), server_default="IN", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("total_cents > 0", name="ck_orders_total_cents_positive"),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.execute("ALTER TABLE orders ENABLE ROW LEVEL SECURITY")
    op.execute("CREATE POLICY orders_select_own ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id)")
    op.execute("CREATE POLICY orders_insert_own ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)")
    op.execute("CREATE POLICY orders_update_own ON orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)")
    op.execute("CREATE POLICY orders_delete_own ON orders FOR DELETE TO authenticated USING (auth.uid() = user_id)")

    op.create_table(
        "order_items",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("product_name", sa.String(length=255), nullable=False),
        sa.Column("unit_price_cents", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("line_total_cents", sa.BigInteger(), nullable=False),
        sa.CheckConstraint("quantity >= 1", name="ck_order_items_quantity_positive"),
        sa.CheckConstraint("unit_price_cents > 0", name="ck_order_items_unit_price_positive"),
        sa.CheckConstraint("line_total_cents > 0", name="ck_order_items_line_total_positive"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.execute("ALTER TABLE order_items ENABLE ROW LEVEL SECURITY")
    op.execute("CREATE POLICY order_items_select_own ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()))")
    op.execute("CREATE POLICY order_items_insert_own ON order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()))")
    op.execute("CREATE POLICY order_items_delete_own ON order_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()))")


def downgrade() -> None:
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_table("orders")
