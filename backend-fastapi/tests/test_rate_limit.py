"""Tests for the shared fixed window rate limiter."""

from unittest.mock import AsyncMock

import pytest

from app.core.rate_limit import FixedWindowRateLimiter, RateLimitPolicy, get_client_ip


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
    from unittest.mock import MagicMock

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
