"""Async SQLAlchemy engine and session factory for Supabase Postgres.

Uses asyncpg driver. Prepared statement caching is disabled because Supabase
uses PgBouncer in transaction mode, which doesn't support server-side prepared
statements across connections.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# statement_cache_size=0 disables prepared-statement caching — required for
# PgBouncer / Supabase pooler in transaction mode.
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    connect_args={"statement_cache_size": 0},
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields an async DB session and closes it afterwards."""
    async with AsyncSessionLocal() as session:
        yield session

