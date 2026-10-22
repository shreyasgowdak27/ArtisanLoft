"""FastAPI dependency providers.

Keep this file thin — it wires dependencies together; no business logic here.
"""

from app.db.session import get_db  # re-export so routers import from one place

__all__ = ["get_db"]
