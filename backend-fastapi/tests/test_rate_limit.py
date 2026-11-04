"""Tests for the shared fixed window rate limiter, including /me route coverage."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import status

from app.core.deps import get_current_user
from app.core.rate_limit import FixedWindowRateLimiter, RateLimitPolicy, get_client_ip, rate_limiter
from app.schemas.user import CurrentUser


# ---------------------------------------------------------------------------
# Core limiter unit tests (chunk 1 coverage, unchanged)
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_in_memory_fixed_window_blocks_at_policy_limit(monkeypatch):
    """The local fallback enforces the configured limit and returns Retry After."""
    policy = RateLimitPolicy(bucket="test", limit=3, window_seconds=60)
    limiter = FixedWindowRateLimiter(redis_url="")
    monkeypatch.setattr("app.core.rate_limit.time.time", lambda: 120.5)

    for _ in range(3):
        assert (await limiter.check(policy, "198.51.100.10")).allowed is True

    blocked = await limiter.check(policy, "198.51.100.10")
    assert blocked.allowed is False
    assert blocked.retry_after == 60

    monkeypatch.setattr("app.core.rate_limit.time.time", lambda: 180.5)
    renewed = await limiter.check(policy, "198.51.100.10")
    assert renewed.allowed is True
    assert sorted(limiter._memory_counters) == ["test:198.51.100.10:180"]


def test_client_ip_uses_first_forwarded_address_and_socket_fallback():
    """Only the first forwarded address identifies the requesting client."""
    request = MagicMock()
    request.headers = {"x-forwarded-for": "203.0.113.9, 10.0.0.1"}
    request.client = MagicMock(host="10.0.0.1")
    assert get_client_ip(request) == "203.0.113.9"

    request.headers = {"x-forwarded-for": "  "}
    request.client = MagicMock(host="192.0.2.5")
    assert get_client_ip(request) == "192.0.2.5"


@pytest.mark.anyio
@pytest.mark.parametrize("error", [TimeoutError("timed out"), RuntimeError("command failed")])
async def test_redis_error_logs_and_allows_request(caplog, error):
    """Redis failures do not reject a request or disclose the client address."""
    policy = RateLimitPolicy(bucket="contact", limit=3, window_seconds=3600)
    limiter = FixedWindowRateLimiter(redis_url="rediss://example.test:6379")
    limiter._redis_client = AsyncMock()
    limiter._redis_client.eval.side_effect = error

    with caplog.at_level("WARNING"):
        result = await limiter.check(policy, "198.51.100.10")

    assert result.allowed is True
    assert "Redis request failed for policy contact" in caplog.text
    assert "198.51.100.10" not in caplog.text


# ---------------------------------------------------------------------------
# /me route rate limit tests (chunk 2 coverage, AC-2)
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def _rsa_keys_module():
    """Generate an RSA key pair once for the entire module."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return priv_pem, key.public_key()


@pytest.fixture()
def me_client(client):
    """Client fixture that overrides get_current_user and resets the shared limiter."""
    # rate_limiter.reset() relies on auth.py and this fixture importing
    # the same module-level singleton instance from app.core.rate_limit.
    rate_limiter.reset()
    client.app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id="rate-limit-test-user",
        email="rate@artisanloft.in",
    )
    yield client
    client.app.dependency_overrides.clear()
    rate_limiter.reset()


def test_me_rate_limit_31st_request_returns_429(me_client):
    """The 31st GET /me from the same IP returns 429 with a Retry-After header (AC-2)."""
    headers = {"X-Forwarded-For": "203.0.113.42"}

    for i in range(30):
        res = me_client.get("/me", headers=headers)
        assert res.status_code == status.HTTP_200_OK, f"Request {i + 1} unexpectedly blocked"

    blocked = me_client.get("/me", headers=headers)
    assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Retry-After" in blocked.headers
    assert int(blocked.headers["Retry-After"]) >= 1


def test_me_rate_limit_different_user_ip_not_affected(me_client):
    """A second client IP has its own independent counter and is not blocked (AC-2, AC-6)."""
    ip_a = {"X-Forwarded-For": "203.0.113.100"}
    ip_b = {"X-Forwarded-For": "203.0.113.101"}

    # Exhaust ip_a's quota
    for _ in range(30):
        me_client.get("/me", headers=ip_a)

    # ip_a is now blocked
    assert me_client.get("/me", headers=ip_a).status_code == status.HTTP_429_TOO_MANY_REQUESTS

    # ip_b is completely unaffected
    res_b = me_client.get("/me", headers=ip_b)
    assert res_b.status_code == status.HTTP_200_OK


def test_me_rate_limit_all_aliases_share_one_bucket(me_client):
    """Requests across /me, /api/v1/me, and /api/auth/me deplete the same counter (AC-2)."""
    headers = {"X-Forwarded-For": "203.0.113.200"}
    aliases = ["/me", "/api/v1/me", "/api/auth/me"]

    # Send 10 requests to each alias (30 total, filling the quota)
    for alias in aliases:
        for _ in range(10):
            res = me_client.get(alias, headers=headers)
            assert res.status_code == status.HTTP_200_OK

    # The 31st request on any alias must be blocked
    blocked = me_client.get("/me", headers=headers)
    assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_me_rate_limit_redis_error_fails_open(me_client):
    """A Redis error during /me check allows the request and logs a warning (AC-7)."""
    redis_mock = AsyncMock()
    redis_mock.eval.side_effect = TimeoutError("simulated timeout")

    headers = {"X-Forwarded-For": "203.0.113.99"}

    with patch.object(rate_limiter, "_redis_url", "rediss://example.test:6379"), \
         patch.object(rate_limiter, "_redis_client", redis_mock):
        res = me_client.get("/me", headers=headers)

    assert res.status_code == status.HTTP_200_OK
