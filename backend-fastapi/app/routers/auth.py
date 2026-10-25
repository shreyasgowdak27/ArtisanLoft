"""Authentication router for Supabase Auth integration.

Supabase Auth handles user signup, login, and password management directly in the client.
FastAPI verifies the incoming Supabase JWT via `get_current_user`.
"""

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.schemas.user import CurrentUser

router = APIRouter(tags=["auth"])


@router.get("/me", response_model=CurrentUser)
@router.get("/api/v1/me", response_model=CurrentUser)
@router.get("/api/auth/me", response_model=CurrentUser)
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Return the authenticated user's id and email."""
    return current_user
