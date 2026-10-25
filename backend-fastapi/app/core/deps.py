"""FastAPI dependency providers.

Keep this file thin — it wires dependencies together; no business logic here.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import verify_supabase_jwt
from app.db.session import get_db
from app.schemas.user import CurrentUser

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    """FastAPI dependency that extracts and verifies Supabase JWT from Authorization: Bearer.

    Verifies the token using PyJWT PyJWKClient against {SUPABASE_URL}/auth/v1/.well-known/jwks.json,
    allowing ES256 and RS256, with audience 'authenticated'.

    Returns:
        CurrentUser with user id (sub claim) and email.

    Raises:
        HTTPException 401 if token is missing, invalid, or expired.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_supabase_jwt(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject (sub) claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    return CurrentUser(id=str(user_id), email=email)


__all__ = ["get_db", "get_current_user"]
