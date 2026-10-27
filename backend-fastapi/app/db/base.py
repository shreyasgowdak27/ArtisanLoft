"""Shared SQLAlchemy declarative base.

Import all model modules here so that Alembic's `env.py` can pick them up
via `from app.db.base import Base` — keeping migrations in sync with models.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so Alembic sees them during autogenerate.
from app.models import cart, order, product  # noqa: E402, F401

