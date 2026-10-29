"""Health check endpoints.

GET /health       — liveness:  app is running
GET /health/ready — readiness: app can reach the database

These are used by Render (or any container orchestrator) to decide if the
instance should receive traffic. A failing /health/ready causes the load
balancer to stop sending requests until the DB recovers.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
@router.get("/")
async def liveness() -> dict[str, str]:
    """Liveness probe — always returns OK if the process is alive."""
    return {"status": "ok"}


@router.get("/ready")
async def readiness(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Readiness probe — returns OK only if the DB connection works."""
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}

