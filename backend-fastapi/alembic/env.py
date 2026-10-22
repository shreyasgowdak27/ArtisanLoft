"""Alembic environment — async mode using asyncpg via SQLAlchemy.

Design:
- DATABASE_URL is read from the same .env file as the app (via Settings).
  We never hard-code the URL here.
- We use run_async_migrations() so Alembic can drive an asyncpg connection,
  which matches the async engine used by FastAPI.
- target_metadata points to our shared Base so that `alembic revision
  --autogenerate` can diff the current DB state against our models.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Import Base (which in turn imports all models) so autogenerate sees them.
from app.db.base import Base
from app.core.config import settings

# Alembic Config object — provides access to values in alembic.ini.
config = context.config

# Set up Python logging from alembic.ini if present.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The SQLAlchemy metadata we compare against when autogenerating.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Offline mode: emit SQL to stdout without a live DB connection."""
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Online mode: connect with asyncpg and run migrations."""
    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"statement_cache_size": 0},  # required for PgBouncer
    )
    async with engine.connect() as connection:
        await connection.run_sync(_run_migrations_sync)
    await engine.dispose()


def _run_migrations_sync(sync_connection) -> None:
    context.configure(
        connection=sync_connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Entry point for Alembic — delegates to the async runner."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
