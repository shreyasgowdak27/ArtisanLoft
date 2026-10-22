"""Legacy shim — kept so any import that still references app.database doesn't
crash immediately.  New code should import from app.db.session and app.db.base.

TODO: remove this file once all references are updated.
"""

# Re-export the things the old interface provided, mapping to new locations.
from app.db.base import Base  # noqa: F401
from app.db.session import AsyncSessionLocal as SessionLocal  # noqa: F401
from app.db.session import engine  # noqa: F401
from app.db.session import get_db  # noqa: F401
