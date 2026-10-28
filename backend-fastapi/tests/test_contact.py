"""Tests for the contact message API endpoint."""

import uuid
from datetime import datetime, timezone

import pytest
from fastapi import status

from app.core.deps import get_db
from app.services.contact_service import rate_limiter


class MockAsyncSession:
    """Mock async DB session to track database operations in tests."""

    def __init__(self):
        self.added = []
        self.committed = False
        self.refreshed = False

    def add(self, instance):
        self.added.append(instance)
        if not getattr(instance, "id", None):
            instance.id = uuid.uuid4()
        if not getattr(instance, "created_at", None):
            instance.created_at = datetime.now(timezone.utc)

    async def commit(self):
        self.committed = True

    async def refresh(self, _instance):
        self.refreshed = True


@pytest.fixture()
def mock_db():
    return MockAsyncSession()


@pytest.fixture()
def contact_client(client, mock_db):
    async def override_get_db():
        yield mock_db

    app = client.app
    app.dependency_overrides[get_db] = override_get_db
    rate_limiter.reset()
    yield client
    app.dependency_overrides.clear()
    rate_limiter.reset()


def test_contact_valid_message(contact_client, mock_db):
    """Submitting a valid message creates a new record and returns 201."""
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "message": "Hello, I would like to inquire about the teak dining table.",
    }
    response = contact_client.post("/api/v1/contact", json=payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"
    assert data["message"] == payload["message"]
    assert "created_at" in data

    # Verify message was saved to database
    assert len(mock_db.added) == 1
    assert mock_db.added[0].name == "Jane Doe"
    assert mock_db.added[0].email == "jane@example.com"
    assert mock_db.committed is True


def test_contact_invalid_email(contact_client, mock_db):
    """Submitting an invalid email address triggers 422 Unprocessable Entity."""
    payload = {
        "name": "Jane Doe",
        "email": "invalid-email-address",
        "message": "Hello, this is a test message.",
    }
    response = contact_client.post("/api/v1/contact", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert len(mock_db.added) == 0


def test_contact_validation_bounds(contact_client, mock_db):
    """Submitting out-of-bound inputs fails validation."""
    # Empty name
    res = contact_client.post(
        "/api/v1/contact",
        json={"name": "", "email": "valid@example.com", "message": "Valid message longer than 10"},
    )
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Name too long (> 100)
    res = contact_client.post(
        "/api/v1/contact",
        json={"name": "A" * 101, "email": "valid@example.com", "message": "Valid message longer than 10"},
    )
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Message too short (< 10)
    res = contact_client.post(
        "/api/v1/contact",
        json={"name": "Jane Doe", "email": "valid@example.com", "message": "Too short"},
    )
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Message too long (> 1000)
    res = contact_client.post(
        "/api/v1/contact",
        json={"name": "Jane Doe", "email": "valid@example.com", "message": "M" * 1001},
    )
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert len(mock_db.added) == 0


def test_contact_honeypot_silently_rejects(contact_client, mock_db):
    """Honeypot field triggers silent rejection (201 response, but nothing saved to DB)."""
    payload = {
        "name": "Spam Bot",
        "email": "bot@spammer.org",
        "message": "Buy cheap watches at our website today!",
        "honeypot": "https://spam.example.com",
    }
    response = contact_client.post("/api/v1/contact", json=payload)

    # Bot sees success
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Spam Bot"
    assert data["email"] == "bot@spammer.org"

    # Database was NOT touched
    assert len(mock_db.added) == 0
    assert mock_db.committed is False


def test_contact_rate_limit(contact_client, mock_db):
    """Enforces 3 messages per IP per hour, rejecting subsequent submissions with 429."""
    headers_ip1 = {"X-Forwarded-For": "198.51.100.10"}
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "message": "Inquiring about delivery schedule for order.",
    }

    # 3 messages succeed
    for _ in range(3):
        res = contact_client.post("/api/v1/contact", json=payload, headers=headers_ip1)
        assert res.status_code == status.HTTP_201_CREATED

    assert len(mock_db.added) == 3

    # 4th message from same IP is rate limited
    res_blocked = contact_client.post("/api/v1/contact", json=payload, headers=headers_ip1)
    assert res_blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Too many messages sent" in res_blocked.json()["detail"]
    assert len(mock_db.added) == 3

    # Different IP can still submit
    headers_ip2 = {"X-Forwarded-For": "198.51.100.11"}
    res_other = contact_client.post("/api/v1/contact", json=payload, headers=headers_ip2)
    assert res_other.status_code == status.HTTP_201_CREATED
    assert len(mock_db.added) == 4


def test_get_client_ip_reads_first_forwarded_for_value():
    """Client IP extraction prefers first X-Forwarded-For value and falls back to client.host."""
    from unittest.mock import MagicMock
    from app.routers.contact import get_client_ip

    # Multiple proxies in X-Forwarded-For: client, proxy1, proxy2
    req_proxy = MagicMock()
    req_proxy.headers = {"x-forwarded-for": "203.0.113.195, 10.0.0.1, 10.0.0.2"}
    req_proxy.client = MagicMock(host="10.0.0.2")
    assert get_client_ip(req_proxy) == "203.0.113.195"

    # Fallback to request.client.host when X-Forwarded-For is missing
    req_direct = MagicMock()
    req_direct.headers = {}
    req_direct.client = MagicMock(host="192.168.1.100")
    assert get_client_ip(req_direct) == "192.168.1.100"

    # Fallback to 127.0.0.1 if client is None
    req_none = MagicMock()
    req_none.headers = {}
    req_none.client = None
    assert get_client_ip(req_none) == "127.0.0.1"


def test_contact_rate_limit_first_x_forwarded_for_behind_proxy(contact_client, mock_db):
    """Rate limit uses first IP in X-Forwarded-For header when behind Render reverse proxy."""
    headers = {"X-Forwarded-For": "203.0.113.55, 10.100.0.1"}
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "message": "Testing rate limit behind reverse proxy.",
    }

    for _ in range(3):
        res = contact_client.post("/api/v1/contact", json=payload, headers=headers)
        assert res.status_code == status.HTTP_201_CREATED

    res_blocked = contact_client.post("/api/v1/contact", json=payload, headers=headers)
    assert res_blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS

