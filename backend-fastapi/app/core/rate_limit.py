"""Shared fixed window rate limiting with Redis and a local fallback."""

import asyncio
import logging
import math
import time
from dataclasses import dataclass

import redis.asyncio as redis
from fastapi import Request
from redis.backoff import NoBackoff
from redis.retry import Retry

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RateLimitPolicy:
    """A named request allowance shared by every route in its policy."""

    bucket: str
    limit: int
    window_seconds: int


@dataclass(frozen=True)
class RateLimitResult:
    """The result of counting one request in a fixed time window."""

    allowed: bool
    retry_after: int


CONTACT_POLICY = RateLimitPolicy(bucket="contact", limit=3, window_seconds=3600)
ME_POLICY = RateLimitPolicy(bucket="me", limit=30, window_seconds=60)
WRITE_POLICY = RateLimitPolicy(bucket="write", limit=30, window_seconds=60)

_INCREMENT_WINDOW_COUNTER = """
local server_time = redis.call('TIME')
local now_seconds = tonumber(server_time[1])
local window_seconds = tonumber(ARGV[1])
local window_id = math.floor(now_seconds / window_seconds)
local seconds_remaining = window_seconds - (now_seconds % window_seconds)
local key = KEYS[1] .. ':' .. window_id
local count = redis.call('INCR', key)

if count == 1 then
    redis.call('EXPIRE', key, seconds_remaining)
end

return {count, seconds_remaining}
"""


def get_client_ip(request: Request) -> str:
    """Return the first forwarded address, or the direct socket address."""
    forwarded = request.headers.get("x-forwarded-for", "")
    forwarded_ip = forwarded.split(",", 1)[0].strip()
    if forwarded_ip:
        return forwarded_ip
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


class FixedWindowRateLimiter:
    """Use Redis when configured, otherwise keep fixed windows in this process."""

    def __init__(self, redis_url: str | None = None) -> None:
        self._redis_url = settings.REDIS_URL if redis_url is None else redis_url
        self._redis_client: redis.Redis | None = None
        self._memory_counters: dict[str, tuple[int, float]] = {}
        self._memory_lock = asyncio.Lock()

    def reset(self) -> None:
        """Clear process local counters, primarily for deterministic tests."""
        self._memory_counters.clear()

    def _get_redis_client(self) -> redis.Redis:
        if self._redis_client is None:
            self._redis_client = redis.from_url(
                self._redis_url,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
                retry=Retry(NoBackoff(), retries=0),
            )
        return self._redis_client

    async def check(
        self,
        policy: RateLimitPolicy,
        client_ip: str,
    ) -> RateLimitResult:
        """Count one request, failing open if Redis cannot serve the request."""
        if not self._redis_url:
            return await self._check_memory(policy, client_ip)

        try:
            result = await self._check_redis(policy, client_ip)
        except Exception as error:
            logger.warning(
                "Rate limiter Redis request failed for policy %s: %s",
                policy.bucket,
                type(error).__name__,
            )
            return RateLimitResult(allowed=True, retry_after=0)

        return result

    async def _check_redis(
        self,
        policy: RateLimitPolicy,
        client_ip: str,
    ) -> RateLimitResult:
        prefix = f"rate_limit:{policy.bucket}:{client_ip}"
        raw_result = await self._get_redis_client().eval(
            _INCREMENT_WINDOW_COUNTER,
            1,
            prefix,
            policy.window_seconds,
        )
        count, retry_after = (int(value) for value in raw_result)
        return RateLimitResult(
            allowed=count <= policy.limit,
            retry_after=max(1, retry_after),
        )

    async def _check_memory(
        self,
        policy: RateLimitPolicy,
        client_ip: str,
    ) -> RateLimitResult:
        now = time.time()
        window_start = math.floor(now / policy.window_seconds) * policy.window_seconds
        expires_at = window_start + policy.window_seconds
        key = f"{policy.bucket}:{client_ip}:{int(window_start)}"

        async with self._memory_lock:
            expired_keys = [
                counter_key
                for counter_key, (_, expiry) in self._memory_counters.items()
                if expiry <= now
            ]
            for expired_key in expired_keys:
                del self._memory_counters[expired_key]

            count, _ = self._memory_counters.get(key, (0, expires_at))
            count += 1
            self._memory_counters[key] = (count, expires_at)

        return RateLimitResult(
            allowed=count <= policy.limit,
            retry_after=max(1, math.ceil(expires_at - now)),
        )


rate_limiter = FixedWindowRateLimiter()
