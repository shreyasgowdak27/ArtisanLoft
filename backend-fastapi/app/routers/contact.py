"""Public contact API routes."""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.contact import ContactMessageCreate, ContactMessageRead
from app.services import contact_service

router = APIRouter(prefix="/api/v1/contact", tags=["contact"])


def get_client_ip(request: Request) -> str:
    """Extract client IP from request headers or socket address."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


@router.post("", response_model=ContactMessageRead, status_code=status.HTTP_201_CREATED)
async def create_contact_message(
    payload: ContactMessageCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> ContactMessageRead:
    """Submit a public contact message without authentication."""
    client_ip = get_client_ip(request)
    return await contact_service.submit_contact_message(db, payload, client_ip)

