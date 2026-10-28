"""create_contact_messages_table

Revision ID: 981b0404bdba
Revises: e8d9a0b1c2d3
Create Date: 2026-10-28 18:43:46.972359

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '981b0404bdba'
down_revision: Union[str, Sequence[str], None] = 'e8d9a0b1c2d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contact_messages",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute("ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_table("contact_messages")
