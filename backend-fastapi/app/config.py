"""Legacy shim — Settings now lives in app.core.config.

New code should import `from app.core.config import settings`.
"""

from app.core.config import Settings, settings  # noqa: F401
