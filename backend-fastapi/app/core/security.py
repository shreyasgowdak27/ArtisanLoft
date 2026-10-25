"""Security and Supabase JWT verification.

Verifies Supabase JWT access tokens using the project's JWKS endpoint:
https://<SUPABASE_URL>/auth/v1/.well-known/jwks.json

Algorithms allowed: ES256, RS256
Audience: authenticated
"""

from typing import Any

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.core.config import settings

_jwks_client: PyJWKClient | None = None
ALLOWED_ALGORITHMS = ["ES256", "RS256"]
AUDIENCE = "authenticated"


def get_jwks_client() -> PyJWKClient:
    """Return a cached PyJWKClient configured for Supabase's JWKS endpoint."""
    global _jwks_client
    if _jwks_client is None:
        jwks_url = settings.supabase_jwks_url
        if not jwks_url or not settings.SUPABASE_URL.strip():
            raise RuntimeError(
                "SUPABASE_URL is not configured. Set SUPABASE_URL in your environment."
            )
        _jwks_client = PyJWKClient(
            uri=jwks_url,
            cache_jwk_set=True,
            lifespan=3600,
        )
    return _jwks_client


def reset_jwks_client() -> None:
    """Reset the cached JWKS client (primarily for testing)."""
    global _jwks_client
    _jwks_client = None


def verify_supabase_jwt(
    token: str,
    jwks_client: PyJWKClient | None = None,
) -> dict[str, Any]:
    """Verify a Supabase JWT access token using PyJWT PyJWKClient.

    Checks:
    - Token signature matches a key in the JWKS endpoint
    - Algorithm is ES256 or RS256
    - Audience is 'authenticated'
    - Token is not expired

    Returns:
        The decoded token payload dictionary.

    Raises:
        HTTPException 401 on any verification failure.
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    client = jwks_client or get_jwks_client()

    try:
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALLOWED_ALGORITHMS,
            audience=AUDIENCE,
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except jwt.InvalidAudienceError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except (jwt.PyJWTError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
