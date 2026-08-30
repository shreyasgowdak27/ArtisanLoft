def test_signup_success(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "securepass",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_signup_duplicate_email_fails(client):
    payload = {
        "name": "Test User",
        "email": "dup@example.com",
        "password": "securepass",
    }
    first = client.post("/api/auth/signup", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/signup", json=payload)
    assert second.status_code == 400
    assert "email" in second.json()["detail"].lower()


def test_login_success(client):
    client.post(
        "/api/auth/signup",
        json={
            "name": "Login User",
            "email": "login@example.com",
            "password": "securepass",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "securepass"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_fails(client):
    client.post(
        "/api/auth/signup",
        json={
            "name": "Login User",
            "email": "wrongpass@example.com",
            "password": "securepass",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "wrongpass@example.com", "password": "not-correct"},
    )
    assert response.status_code == 401


def test_me_without_token_fails(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
