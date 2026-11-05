"""Authentication router for Supabase Auth integration.

Supabase Auth handles user signup, login, and password management directly in the client.
FastAPI verifies the incoming Supabase JWT via `get_current_user`.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.deps import get_current_user
from app.core.rate_limit import ME_POLICY, get_client_ip, rate_limiter
from app.schemas.user import CurrentUser

router = APIRouter(tags=["auth"])


async def enforce_me_rate_limit(request: Request) -> None:
    """Apply the /me identity allowance before returning user data."""
    result = await rate_limiter.check(ME_POLICY, get_client_ip(request))
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(result.retry_after)},
        )


@router.get(
    "/me",
    response_model=CurrentUser,
    dependencies=[Depends(enforce_me_rate_limit)],
)
@router.get(
    "/api/v1/me",
    response_model=CurrentUser,
    dependencies=[Depends(enforce_me_rate_limit)],
)
@router.get(
    "/api/auth/me",
    response_model=CurrentUser,
    dependencies=[Depends(enforce_me_rate_limit)],
)
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Return the authenticated user's id and email."""
    return current_user
