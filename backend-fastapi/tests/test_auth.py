from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa

from app.core.deps import get_current_user
from app.schemas.user import CurrentUser


@pytest.fixture(scope="module")
def rsa_keys():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_key = key.public_key()
    return priv_pem, pub_key


@pytest.fixture(scope="module")
def ec_keys():
    key = ec.generate_private_key(ec.SECP256R1())
    priv_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub_key = key.public_key()
    return priv_pem, pub_key


def test_me_without_token_fails(client):
    """Calling /me without token returns 401 Unauthorized."""
    for path in ["/me", "/api/v1/me", "/api/auth/me"]:
        response = client.get(path)
        assert response.status_code == 401
        assert "WWW-Authenticate" in response.headers
        assert response.headers["WWW-Authenticate"] == "Bearer"


def test_me_with_invalid_token_fails(client):
    """Calling /me with garbage token returns 401 Unauthorized."""
    headers = {"Authorization": "Bearer invalid.garbage.token"}
    response = client.get("/me", headers=headers)
    assert response.status_code == 401


def test_me_with_expired_token_fails(client, rsa_keys):
    """Calling /me with an expired JWT returns 401."""
    priv_pem, pub_key = rsa_keys
    expired_time = datetime.now(UTC) - timedelta(hours=1)
    token = jwt.encode(
        {
            "sub": "user-expired-uuid",
            "email": "expired@example.com",
            "aud": "authenticated",
            "exp": expired_time,
        },
        priv_pem,
        algorithm="RS256",
        headers={"kid": "key-expired"},
    )

    mock_client = MagicMock()
    mock_key = MagicMock()
    mock_key.key = pub_key
    mock_client.get_signing_key_from_jwt.return_value = mock_key

    with patch("app.core.security.get_jwks_client", return_value=mock_client):
        response = client.get("/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()


def test_me_with_wrong_audience_fails(client, rsa_keys):
    """Calling /me with audience != 'authenticated' returns 401."""
    priv_pem, pub_key = rsa_keys
    token = jwt.encode(
        {
            "sub": "user-wrong-aud",
            "email": "wrongaud@example.com",
            "aud": "wrong-audience",
        },
        priv_pem,
        algorithm="RS256",
        headers={"kid": "key-wrong-aud"},
    )

    mock_client = MagicMock()
    mock_key = MagicMock()
    mock_key.key = pub_key
    mock_client.get_signing_key_from_jwt.return_value = mock_key

    with patch("app.core.security.get_jwks_client", return_value=mock_client):
        response = client.get("/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
        assert "audience" in response.json()["detail"].lower()


def test_me_with_unsupported_algorithm_fails(client):
    """Calling /me with an algorithm other than RS256/ES256 (e.g. HS256) returns 401."""
    secret_key = "a" * 32
    token = jwt.encode(
        {
            "sub": "user-hs256",
            "email": "hs256@example.com",
            "aud": "authenticated",
        },
        secret_key,
        algorithm="HS256",
        headers={"kid": "hs256-key"},
    )

    mock_client = MagicMock()
    mock_key = MagicMock()
    mock_key.key = secret_key
    mock_client.get_signing_key_from_jwt.return_value = mock_key

    with patch("app.core.security.get_jwks_client", return_value=mock_client):
        response = client.get("/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401


def test_me_success_with_rs256_token(client, rsa_keys):
    """Calling /me with a valid RS256 token returns user id and email."""
    priv_pem, pub_key = rsa_keys
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    user_email = "artisan.user@example.com"

    token = jwt.encode(
        {
            "sub": user_id,
            "email": user_email,
            "aud": "authenticated",
            "exp": datetime.now(UTC) + timedelta(hours=1),
        },
        priv_pem,
        algorithm="RS256",
        headers={"kid": "rsa-kid-1"},
    )

    mock_client = MagicMock()
    mock_key = MagicMock()
    mock_key.key = pub_key
    mock_client.get_signing_key_from_jwt.return_value = mock_key

    with patch("app.core.security.get_jwks_client", return_value=mock_client):
        for path in ["/me", "/api/v1/me", "/api/auth/me"]:
            response = client.get(path, headers={"Authorization": f"Bearer {token}"})
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == user_id
            assert data["email"] == user_email


def test_me_success_with_es256_token(client, ec_keys):
    """Calling /me with a valid ES256 token returns user id and email."""
    priv_pem, pub_key = ec_keys
    user_id = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    user_email = "ec.user@example.com"

    token = jwt.encode(
        {
            "sub": user_id,
            "email": user_email,
            "aud": "authenticated",
            "exp": datetime.now(UTC) + timedelta(hours=1),
        },
        priv_pem,
        algorithm="ES256",
        headers={"kid": "ec-kid-1"},
    )

    mock_client = MagicMock()
    mock_key = MagicMock()
    mock_key.key = pub_key
    mock_client.get_signing_key_from_jwt.return_value = mock_key

    with patch("app.core.security.get_jwks_client", return_value=mock_client):
        response = client.get("/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == user_email


def test_dependency_override_works(client):
    """Ensure get_current_user dependency can be overridden directly for tests."""
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id="mock-user-id",
        email="mock@artisanloft.in",
    )

    response = client.get("/me")
    assert response.status_code == 200
    assert response.json() == {"id": "mock-user-id", "email": "mock@artisanloft.in"}

    app.dependency_overrides.clear()
