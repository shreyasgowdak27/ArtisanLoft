"""Tests for /health endpoint and CORS_ORIGINS parsing."""

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app


def test_health_endpoint_liveness(client: TestClient) -> None:
    """GET /health must return status ok with 200, requiring no auth or database calls."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_endpoint_trailing_slash(client: TestClient) -> None:
    """GET /health/ must also resolve cleanly and return status ok."""
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_origins_parsing_default() -> None:
    """When CORS_ORIGINS is None, empty, or whitespace, default to http://localhost:3000."""
    assert Settings.parse_cors_origins(None) == ["http://localhost:3000"]
    assert Settings.parse_cors_origins("") == ["http://localhost:3000"]
    assert Settings.parse_cors_origins("   ") == ["http://localhost:3000"]
    assert Settings.parse_cors_origins([]) == ["http://localhost:3000"]


def test_cors_origins_parsing_comma_separated() -> None:
    """Comma-separated origins must be split and stripped of whitespace."""
    raw = "http://localhost:3000, https://artisanloft.vercel.app , https://artisanloft.onrender.com"
    expected = [
        "http://localhost:3000",
        "https://artisanloft.vercel.app",
        "https://artisanloft.onrender.com",
    ]
    assert Settings.parse_cors_origins(raw) == expected


def test_cors_origins_parsing_single_string() -> None:
    """Single origin string is parsed into a single-item list."""
    assert Settings.parse_cors_origins("https://artisanloft.vercel.app") == [
        "https://artisanloft.vercel.app"
    ]


def test_cors_origins_parsing_list_input() -> None:
    """Pre-formed lists of strings are preserved and cleaned."""
    origins = [" http://localhost:3000 ", "https://artisanloft.vercel.app"]
    assert Settings.parse_cors_origins(origins) == [
        "http://localhost:3000",
        "https://artisanloft.vercel.app",
    ]


def test_cors_middleware_headers(client: TestClient) -> None:
    """CORS middleware returns access-control-allow-origin for allowed origins only."""
    # Test allowed origin
    allowed_resp = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert allowed_resp.status_code == 200
    assert allowed_resp.headers.get("access-control-allow-origin") == "http://localhost:3000"

    # Test disallowed origin
    disallowed_resp = client.get(
        "/health", headers={"Origin": "https://untrusted-site.example.com"}
    )
    assert disallowed_resp.status_code == 200
    assert "access-control-allow-origin" not in disallowed_resp.headers


def test_cors_dev_mode_permits_localhost() -> None:
    """In development mode, http://localhost:3000 is always allowed."""
    dev_settings = Settings(
        DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
        JWT_SECRET="test-secret-at-least-32-chars-long-12345",
        ENV="development",
        CORS_ORIGINS="https://artisanloft.vercel.app",
    )
    assert "http://localhost:3000" in dev_settings.CORS_ORIGINS
    assert "https://artisanloft.vercel.app" in dev_settings.CORS_ORIGINS


def test_cors_production_mode_excludes_localhost() -> None:
    """In production mode, localhost is removed and production origins remain unchanged."""
    prod_settings = Settings(
        DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/db",
        JWT_SECRET="test-secret-at-least-32-chars-long-12345",
        ENV="production",
        CORS_ORIGINS="https://artisanloft.vercel.app,http://localhost:3000",
    )
    assert "http://localhost:3000" not in prod_settings.CORS_ORIGINS
    assert prod_settings.CORS_ORIGINS == ["https://artisanloft.vercel.app"]


