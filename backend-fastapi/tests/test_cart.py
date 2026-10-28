import uuid

import pytest
from fastapi import HTTPException, status
from sqlalchemy.dialects import postgresql

from app.core.deps import get_current_user, get_db
from app.schemas.cart import CartItemRead, CartProductRead, CartRead
from app.schemas.user import CurrentUser
from app.services import cart_service

USER_A = "550e8400-e29b-41d4-a716-446655440000"
USER_B = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
PRODUCT_ID = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
UNKNOWN_PRODUCT_ID = uuid.UUID("0f8fad5b-d9cb-469f-a165-70867728950e")


def cart_item(quantity: int = 2) -> CartItemRead:
    return CartItemRead(
        product_id=PRODUCT_ID,
        quantity=quantity,
        product=CartProductRead(
            id=PRODUCT_ID,
            slug="oak-table",
            name="Oak Table",
            image_url=None,
            price_cents=2999900,
            currency="INR",
            stock=8,
            is_active=True,
        ),
        line_total_cents=2999900 * quantity,
    )


@pytest.fixture()
def authenticated_client(client):
    async def override_db():
        yield object()

    app = client.app
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(id=USER_A, email="a@example.com")
    app.dependency_overrides[get_db] = override_db
    yield client
    app.dependency_overrides.clear()


def test_cart_routes_require_login(client):
    responses = [
        client.get("/api/v1/cart"),
        client.post("/api/v1/cart/items", json={"product_id": str(PRODUCT_ID), "quantity": 1}),
        client.patch(f"/api/v1/cart/items/{PRODUCT_ID}", json={"quantity": 1}),
        client.delete(f"/api/v1/cart/items/{PRODUCT_ID}"),
    ]
    assert all(response.status_code == status.HTTP_401_UNAUTHORIZED for response in responses)


def test_read_cart_returns_current_cart(authenticated_client, monkeypatch):
    async def fake_get_cart(_db, user_id):
        assert user_id == USER_A
        item = cart_item()
        return CartRead(items=[item], item_count=1, total_quantity=2, subtotal_cents=item.line_total_cents)

    monkeypatch.setattr(cart_service, "get_cart", fake_get_cart)

    response = authenticated_client.get("/api/v1/cart")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["subtotal_cents"] == 5999800
    assert response.json()["items"][0]["product_id"] == str(PRODUCT_ID)


def test_add_cart_item_uses_authenticated_owner(authenticated_client, monkeypatch):
    async def fake_add_item(_db, user_id, payload):
        assert user_id == USER_A
        assert payload.product_id == PRODUCT_ID
        assert payload.quantity == 3
        return cart_item(quantity=3)

    monkeypatch.setattr(cart_service, "add_item", fake_add_item)

    response = authenticated_client.post(
        "/api/v1/cart/items", json={"product_id": str(PRODUCT_ID), "quantity": 3}
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["quantity"] == 3


def test_patch_zero_removes_item(authenticated_client, monkeypatch):
    async def fake_update_item(_db, user_id, product_id, payload):
        assert user_id == USER_A
        assert product_id == PRODUCT_ID
        assert payload.quantity == 0
        return None

    monkeypatch.setattr(cart_service, "update_item", fake_update_item)

    response = authenticated_client.patch(f"/api/v1/cart/items/{PRODUCT_ID}", json={"quantity": 0})

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert response.content == b""


def test_patch_unknown_product_returns_not_found(authenticated_client, monkeypatch):
    async def fake_update_item(_db, _user_id, _product_id, _payload):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    monkeypatch.setattr(cart_service, "update_item", fake_update_item)

    response = authenticated_client.patch(
        f"/api/v1/cart/items/{UNKNOWN_PRODUCT_ID}", json={"quantity": 1}
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_user_a_cannot_change_user_b_cart_item(authenticated_client, monkeypatch):
    async def owner_scoped_update(_db, user_id, _product_id, _payload):
        if user_id != USER_B:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        return cart_item()

    monkeypatch.setattr(cart_service, "update_item", owner_scoped_update)

    response = authenticated_client.patch(f"/api/v1/cart/items/{PRODUCT_ID}", json={"quantity": 1})

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_cart_query_is_scoped_to_authenticated_user():
    statement = cart_service._cart_statement(uuid.UUID(USER_A))
    sql = str(statement.compile(dialect=postgresql.dialect()))

    assert "WHERE cart_items.user_id =" in sql
    assert "cart_items.product_id" in sql


def test_delete_cart_item_is_owner_scoped(authenticated_client, monkeypatch):
    async def fake_delete_item(_db, user_id, product_id):
        assert user_id == USER_A
        assert product_id == PRODUCT_ID

    monkeypatch.setattr(cart_service, "delete_item", fake_delete_item)

    response = authenticated_client.delete(f"/api/v1/cart/items/{PRODUCT_ID}")

    assert response.status_code == status.HTTP_204_NO_CONTENT


def test_add_statement_uses_postgres_atomic_upsert():
    statement = cart_service._add_item_statement(uuid.UUID(USER_A), PRODUCT_ID, 1)
    sql = str(statement.compile(dialect=postgresql.dialect()))

    assert "INSERT INTO cart_items" in sql
    assert "ON CONFLICT (user_id, product_id) DO UPDATE" in sql
    assert "cart_items.quantity +" in sql
