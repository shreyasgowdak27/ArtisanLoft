"""Product SQLAlchemy model — Postgres-native.

Design choices (interview-ready):
- UUID primary key: avoids sequential-id enumeration attacks and is globally
  unique, so rows can be merged across environments without collisions.
- price_cents (Integer): money is NEVER stored as float; integer paise avoids
  all floating-point rounding errors (e.g. 0.1 + 0.2 ≠ 0.3 in IEEE-754).
- slug (unique): human-readable URL key; indexed for O(log n) lookups.
- stock >= 0 enforced by a DB-level CHECK constraint so no code path can
  create negative stock — defense in depth beyond the application layer.
- is_active flag: soft-delete / draft workflow without losing history.
- updated_at auto-updates via onupdate= so we never forget to set it.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price_cents > 0", name="ck_products_price_positive"),
        CheckConstraint("stock >= 0", name="ck_products_stock_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Money stored as integer paise (100 paise = 1 INR)
    price_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default="INR")

    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    image_urls: Mapped[str | None] = mapped_column(Text, nullable=True)

    stock: Mapped[int] = mapped_column(Integer, nullable=False, server_default="100")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
