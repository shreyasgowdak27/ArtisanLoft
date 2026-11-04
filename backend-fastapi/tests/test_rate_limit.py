"""Tests for the shared fixed window rate limiter, including /me, cart write, and order write coverage."""

import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import status

from app.core.deps import get_current_user, get_db
from app.core.rate_limit import (
    FixedWindowRateLimiter,
    RateLimitPolicy,
    WRITE_POLICY,
    get_client_ip,
    rate_limiter,
)
from app.schemas.cart import CartItemRead, CartProductRead, CartRead
from app.schemas.order import OrderRead
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


# ---------------------------------------------------------------------------
# Shared write route rate limit tests (chunk 3 coverage - spec 0004 AC-3)
# ---------------------------------------------------------------------------


@pytest.fixture()
def write_client(client, monkeypatch):
    """Client fixture that overrides auth, db, cart_service, and order_service for write tests."""
    rate_limiter.reset()
    client.app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id="rate-limit-write-user",
        email="write-rate@artisanloft.in",
    )

    fake_product = SimpleNamespace(
        id=uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
        name="Oak Table",
        slug="oak-table",
        description=None,
        price_cents=2999900,
        currency="INR",
        category="tables",
        image_url=None,
        image_urls=None,
        stock=8,
        is_active=True,
    )
    product_result = MagicMock()
    product_result.scalars.return_value.all.return_value = [fake_product]
    product_result.scalar_one_or_none.return_value = fake_product

    class FakeDatabase:
        async def execute(self, *_args, **_kwargs):
            return product_result

    async def override_db():
        yield FakeDatabase()

    client.app.dependency_overrides[get_db] = override_db

    fake_item = CartItemRead(
        product_id=uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
        quantity=1,
        product=CartProductRead(
            id=uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
            slug="oak-table",
            name="Oak Table",
            image_url=None,
            price_cents=2999900,
            currency="INR",
            stock=8,
            is_active=True,
        ),
        line_total_cents=2999900,
    )
    fake_cart = CartRead(
        items=[],
        item_count=0,
        total_quantity=0,
        subtotal_cents=0,
        currency="INR",
    )
    monkeypatch.setattr("app.routers.cart.cart_service.add_item", AsyncMock(return_value=fake_item))
    monkeypatch.setattr("app.routers.cart.cart_service.update_item", AsyncMock(return_value=fake_item))
    monkeypatch.setattr("app.routers.cart.cart_service.delete_item", AsyncMock(return_value=None))
    monkeypatch.setattr("app.routers.cart.cart_service.get_cart", AsyncMock(return_value=fake_cart))

    fake_order = OrderRead(
        id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
        status="pending",
        total_cents=2999900,
        shipping_name="Shreyas Gowda",
        shipping_line1="12 MG Road",
        shipping_line2=None,
        shipping_city="Bengaluru",
        shipping_state="Karnataka",
        shipping_pincode="560001",
        shipping_country="IN",
        created_at=datetime.now(UTC),
        items=[],
    )
    monkeypatch.setattr("app.routers.orders.order_service.create_order", AsyncMock(return_value=fake_order))
    monkeypatch.setattr("app.routers.orders.order_service.pay_order", AsyncMock(return_value=fake_order))
    monkeypatch.setattr("app.routers.orders.order_service.list_orders", AsyncMock(return_value=[fake_order]))
    monkeypatch.setattr("app.routers.orders.order_service.get_order", AsyncMock(return_value=fake_order))

    yield client
    client.app.dependency_overrides.clear()
    rate_limiter.reset()


def test_cart_and_order_writes_drain_same_counter_while_reads_unaffected(write_client):
    """Cart mutations and order writes share one bucket of 30 req/60s, while reads stay unaffected."""
    headers = {"X-Forwarded-For": "203.0.113.70"}
    cart_payload = {"product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "quantity": 1}
    order_payload = {
        "shipping_name": "Shreyas Gowda",
        "shipping_line1": "12 MG Road",
        "shipping_city": "Bengaluru",
        "shipping_state": "Karnataka",
        "shipping_pincode": "560001",
        "shipping_country": "IN",
    }
    order_id = "33333333-3333-3333-3333-333333333333"

    # 20 cart writes drain part of the shared bucket
    for i in range(20):
        res = write_client.post("/api/v1/cart/items", json=cart_payload, headers=headers)
        assert res.status_code == status.HTTP_200_OK, f"Cart write {i + 1} unexpectedly blocked"

    # 10 order writes drain the remainder of the 30 req allowance
    for i in range(10):
        res = write_client.post("/api/v1/orders", json=order_payload, headers=headers)
        assert res.status_code == status.HTTP_200_OK, f"Order write {i + 1} unexpectedly blocked"

    # 31st write request (from either cart or order) is blocked with 429 and Retry-After
    blocked_cart = write_client.post("/api/v1/cart/items", json=cart_payload, headers=headers)
    assert blocked_cart.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Retry-After" in blocked_cart.headers
    assert int(blocked_cart.headers["Retry-After"]) >= 1

    blocked_order = write_client.post(f"/api/v1/orders/{order_id}/pay", headers=headers)
    assert blocked_order.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Retry-After" in blocked_order.headers

    # Reads on cart and orders stay completely unaffected even with an exhausted write bucket
    cart_read = write_client.get("/api/v1/cart", headers=headers)
    assert cart_read.status_code == status.HTTP_200_OK

    orders_read = write_client.get("/api/v1/orders", headers=headers)
    assert orders_read.status_code == status.HTTP_200_OK

    order_detail_read = write_client.get(f"/api/v1/orders/{order_id}", headers=headers)
    assert order_detail_read.status_code == status.HTTP_200_OK


def test_write_rate_limit_different_ip_not_affected(write_client):
    """A second client IP has its own counter and is not blocked by another IP's writes."""
    ip_a = {"X-Forwarded-For": "203.0.113.71"}
    ip_b = {"X-Forwarded-For": "203.0.113.72"}
    cart_payload = {"product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "quantity": 1}
    order_payload = {
        "shipping_name": "Shreyas Gowda",
        "shipping_line1": "12 MG Road",
        "shipping_city": "Bengaluru",
        "shipping_state": "Karnataka",
        "shipping_pincode": "560001",
        "shipping_country": "IN",
    }

    for _ in range(15):
        write_client.post("/api/v1/cart/items", json=cart_payload, headers=ip_a)
    for _ in range(15):
        write_client.post("/api/v1/orders", json=order_payload, headers=ip_a)

    # IP A is blocked
    assert write_client.post("/api/v1/cart/items", json=cart_payload, headers=ip_a).status_code == status.HTTP_429_TOO_MANY_REQUESTS

    # IP B proceeds without interference
    res_b = write_client.post("/api/v1/cart/items", json=cart_payload, headers=ip_b)
    assert res_b.status_code == status.HTTP_200_OK


def test_cart_mutations_share_write_bucket(write_client):
    """POST, PATCH, and DELETE cart routes share the same write rate limit bucket."""
    headers = {"X-Forwarded-For": "203.0.113.73"}
    pid = "3fa85f64-5717-4562-b3fc-2c963f66afa6"

    for _ in range(10):
        res = write_client.post("/api/v1/cart/items", json={"product_id": pid, "quantity": 1}, headers=headers)
        assert res.status_code == status.HTTP_200_OK

    for _ in range(10):
        res = write_client.patch(f"/api/v1/cart/items/{pid}", json={"quantity": 2}, headers=headers)
        assert res.status_code == status.HTTP_200_OK

    for _ in range(10):
        res = write_client.delete(f"/api/v1/cart/items/{pid}", headers=headers)
        assert res.status_code == status.HTTP_204_NO_CONTENT

    # 31st request on any write mutation is blocked
    blocked = write_client.post("/api/v1/cart/items", json={"product_id": pid, "quantity": 1}, headers=headers)
    assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_order_create_and_pay_share_write_bucket(write_client):
    """Order creation and order payment share the write rate limit bucket."""
    headers = {"X-Forwarded-For": "203.0.113.74"}
    payload = {
        "shipping_name": "Shreyas Gowda",
        "shipping_line1": "12 MG Road",
        "shipping_city": "Bengaluru",
        "shipping_state": "Karnataka",
        "shipping_pincode": "560001",
        "shipping_country": "IN",
    }
    order_id = "33333333-3333-3333-3333-333333333333"

    for _ in range(15):
        res = write_client.post("/api/v1/orders", json=payload, headers=headers)
        assert res.status_code == status.HTTP_200_OK

    for _ in range(15):
        res = write_client.post(f"/api/v1/orders/{order_id}/pay", headers=headers)
        assert res.status_code == status.HTTP_200_OK

    # 31st request on either endpoint is blocked
    blocked = write_client.post("/api/v1/orders", json=payload, headers=headers)
    assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS


# ---------------------------------------------------------------------------
# Shared read route rate limit tests (chunk 4 coverage, AC-4 and AC-5)
# ---------------------------------------------------------------------------


def test_product_cart_and_order_reads_share_limit_and_121st_returns_429(write_client):
    """All read routes share 120 requests per IP and return Retry After on request 121."""
    headers = {"X-Forwarded-For": "203.0.113.75"}

    for path in ("/api/v1/products", "/api/v1/cart", "/api/v1/orders"):
        for i in range(40):
            response = write_client.get(path, headers=headers)
            assert response.status_code == status.HTTP_200_OK, (
                f"Read {i + 1} for {path} was unexpectedly blocked"
            )

    blocked = write_client.get("/api/v1/products/oak-table", headers=headers)
    assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert int(blocked.headers["Retry-After"]) >= 1


def test_read_and_write_buckets_do_not_drain_each_other(write_client):
    """Read requests use a different bucket from cart and order mutations."""
    headers = {"X-Forwarded-For": "203.0.113.76"}
    cart_payload = {"product_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "quantity": 1}

    for _ in range(120):
        assert write_client.get("/api/v1/products", headers=headers).status_code == status.HTTP_200_OK

    write_after_read_limit = write_client.post(
        "/api/v1/cart/items", json=cart_payload, headers=headers
    )
    assert write_after_read_limit.status_code == status.HTTP_200_OK

    rate_limiter.reset()

    for _ in range(30):
        assert (
            write_client.post("/api/v1/cart/items", json=cart_payload, headers=headers).status_code
            == status.HTTP_200_OK
        )

    read_after_write_limit = write_client.get("/api/v1/products", headers=headers)
    assert read_after_write_limit.status_code == status.HTTP_200_OK


def test_health_and_options_requests_are_never_limited(write_client):
    """Health probes and browser CORS preflight requests do not consume a limiter bucket."""
    headers = {"X-Forwarded-For": "203.0.113.77"}

    for _ in range(121):
        assert write_client.get("/health", headers=headers).status_code == status.HTTP_200_OK

    preflight_headers = {
        **headers,
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    for _ in range(121):
        response = write_client.options("/api/v1/products", headers=preflight_headers)
        assert response.status_code != status.HTTP_429_TOO_MANY_REQUESTS


def test_unauthenticated_cart_reads_are_limited_before_authentication(client):
    """The read limiter rejects the 121st unauthenticated cart request before auth runs."""
    headers = {"X-Forwarded-For": "203.0.113.78"}
    rate_limiter.reset()

    for _ in range(120):
        assert client.get("/api/v1/cart", headers=headers).status_code == status.HTTP_401_UNAUTHORIZED

    blocked = client.get("/api/v1/cart", headers=headers)
    assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert int(blocked.headers["Retry-After"]) >= 1

    rate_limiter.reset()

