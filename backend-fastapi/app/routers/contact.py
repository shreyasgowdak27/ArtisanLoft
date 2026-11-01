"""Public contact API routes."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.rate_limit import CONTACT_POLICY, get_client_ip, rate_limiter
from app.schemas.contact import ContactMessageCreate, ContactMessageRead
from app.services import contact_service

router = APIRouter(prefix="/api/v1/contact", tags=["contact"])


async def enforce_contact_rate_limit(request: Request) -> None:
    """Apply the public contact submission allowance before writing a message."""
    result = await rate_limiter.check(CONTACT_POLICY, get_client_ip(request))
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many messages sent. Please try again later.",
            headers={"Retry-After": str(result.retry_after)},
        )


@router.post(
    "",
    response_model=ContactMessageRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_contact_message(
    payload: ContactMessageCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ContactMessageRead:
    """Submit a public contact message without authentication."""
    await enforce_contact_rate_limit(request)
    return await contact_service.submit_contact_message(db, payload)

