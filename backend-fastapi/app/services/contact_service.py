"""Contact service handling validation, honeypot detection, and persistence."""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import ContactMessage
from app.schemas.contact import ContactMessageCreate, ContactMessageRead


async def submit_contact_message(
    db: AsyncSession,
    payload: ContactMessageCreate,
) -> ContactMessageRead:
    """Submit a contact inquiry.

    1. Checks the honeypot field. If populated, silently returns a dummy success response
       without persisting to the database.
    2. Persists the valid message into the database.
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

    contact_message = ContactMessage(
        name=payload.name.strip(),
        email=str(payload.email),
        message=payload.message.strip(),
    )
    db.add(contact_message)
    await db.commit()
    await db.refresh(contact_message)
    return ContactMessageRead.model_validate(contact_message)

