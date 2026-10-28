"""Contact service handling business logic, validation, honeypot detection, and rate limiting."""

import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from threading import Lock

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import ContactMessage
from app.schemas.contact import ContactMessageCreate, ContactMessageRead


class InMemoryRateLimiter:
    """Simple in-memory rate limiter per IP address using a sliding window."""

    def __init__(self, limit: int = 3, window_seconds: int = 3600):
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.lock = Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            cutoff = now - self.window_seconds
            self.requests[key] = [t for t in self.requests[key] if t > cutoff]
            if len(self.requests[key]) >= self.limit:
                return False
            self.requests[key].append(now)
            return True

    def reset(self) -> None:
        with self.lock:
            self.requests.clear()


rate_limiter = InMemoryRateLimiter(limit=3, window_seconds=3600)


async def submit_contact_message(
    db: AsyncSession,
    payload: ContactMessageCreate,
    client_ip: str,
) -> ContactMessageRead:
    """Submit a contact inquiry.

    1. Checks the honeypot field. If populated, silently returns a dummy success response
       without persisting to the database.
    2. Enforces an in-memory limit of 3 submissions per IP per hour.
    3. Persists the valid message into the database.
    """
    # Silently drop bot submissions triggered by the honeypot field
    if payload.honeypot and payload.honeypot.strip():
        return ContactMessageRead(
            id=uuid.uuid4(),
            name=payload.name,
            email=payload.email,
            message=payload.message,
            created_at=datetime.now(timezone.utc),
        )

    # Check IP rate limit
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many messages sent. Please try again later.",
        )

    contact_message = ContactMessage(
        name=payload.name.strip(),
        email=str(payload.email),
        message=payload.message.strip(),
    )
    db.add(contact_message)
    await db.commit()
    await db.refresh(contact_message)
    return ContactMessageRead.model_validate(contact_message)

