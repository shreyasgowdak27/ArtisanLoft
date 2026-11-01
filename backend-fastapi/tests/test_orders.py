"""Unit and integration tests for orders backend according to spec 0002."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.db.session import engine
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderItemRead, OrderRead
from app.schemas.user import CurrentUser
from app.services import order_service

USER_A = "550e8400-e29b-41d4-a716-446655440000"
USER_B = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
PRODUCT_A_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
PRODUCT_B_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
ORDER_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")

VALID_SHIPPING_PAYLOAD = {
    "shipping_name": "Shreyas Gowda",
    "shipping_line1": "12 MG Road",
    "shipping_line2": "Apt 4B",
    "shipping_city": "Bengaluru",
    "shipping_state": "Karnataka",
    "shipping_pincode": "560001",
    "shipping_country": "IN",
}


@pytest.fixture()
def authenticated_client(client):
    async def override_db():
        yield object()

    app = client.app
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(id=USER_A, email="a@example.com")
    app.dependency_overrides[get_db] = override_db
    yield client
    app.dependency_overrides.clear()


def sample_order(user_id: str = USER_A) -> OrderRead:
    return OrderRead(
        id=ORDER_ID,
        status="pending",
        total_cents=5999800,
        shipping_name="Shreyas Gowda",
        shipping_line1="12 MG Road",
        shipping_line2="Apt 4B",
        shipping_city="Bengaluru",
        shipping_state="Karnataka",
        shipping_pincode="560001",
        shipping_country="IN",
        created_at=datetime.now(timezone.utc),
        items=[
            OrderItemRead(
                id=uuid.uuid4(),
                product_id=PRODUCT_A_ID,
                product_name="Oak Dining Table",
                unit_price_cents=2999900,
                quantity=2,
                line_total_cents=5999800,
            )
        ],
    )


def sample_order_model(user_id: str = USER_A, order_status: str = "pending") -> Order:
    return Order(
        id=ORDER_ID,
        user_id=uuid.UUID(user_id),
        status=order_status,
        total_cents=5999800,
        shipping_name="Shreyas Gowda",
        shipping_line1="12 MG Road",
        shipping_line2="Apt 4B",
        shipping_city="Bengaluru",
        shipping_state="Karnataka",
        shipping_pincode="560001",
        shipping_country="IN",
        created_at=datetime.now(timezone.utc),
        items=[],
    )


# ---------------------------------------------------------------------------
# Auth requirements (AC-7)
# ---------------------------------------------------------------------------


def test_order_routes_require_login(client):
    """AC-7: All order endpoints require a verified JWT and return 401 when unauthenticated."""
    responses = [
        client.post("/api/v1/orders", json=VALID_SHIPPING_PAYLOAD),
        client.get("/api/v1/orders"),
        client.post(f"/api/v1/orders/{ORDER_ID}/pay"),
        client.get(f"/api/v1/orders/{ORDER_ID}"),
    ]
    assert all(r.status_code == status.HTTP_401_UNAUTHORIZED for r in responses)


# ---------------------------------------------------------------------------
# Order creation router tests (AC-1, AC-4, AC-2)
# ---------------------------------------------------------------------------


def test_create_order_endpoint_success(authenticated_client, monkeypatch):
    """AC-1: POST /api/v1/orders returns the created order with status pending."""
    async def fake_create_order(_db, user_id, payload):
        assert user_id == USER_A
        assert payload.shipping_name == "Shreyas Gowda"
        return sample_order()

    monkeypatch.setattr(order_service, "create_order", fake_create_order)

    response = authenticated_client.post("/api/v1/orders", json=VALID_SHIPPING_PAYLOAD)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == str(ORDER_ID)
    assert data["status"] == "pending"
    assert data["total_cents"] == 5999800
    assert len(data["items"]) == 1
    assert data["items"][0]["unit_price_cents"] == 2999900
    assert data["items"][0]["line_total_cents"] == 5999800


def test_create_order_empty_cart_returns_400(authenticated_client, monkeypatch):
    """AC-4: Empty cart checkout returns 400."""
    async def fake_create_order(_db, _user_id, _payload):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot place order: cart is empty")

    monkeypatch.setattr(order_service, "create_order", fake_create_order)

    response = authenticated_client.post("/api/v1/orders", json=VALID_SHIPPING_PAYLOAD)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "cart is empty" in response.json()["detail"]


def test_create_order_insufficient_stock_returns_400(authenticated_client, monkeypatch):
    """AC-2: Insufficient stock returns 400 with clear message."""
    async def fake_create_order(_db, _user_id, _payload):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock for product 'Oak Dining Table'. Available: 1, requested: 2",
        )

    monkeypatch.setattr(order_service, "create_order", fake_create_order)

    response = authenticated_client.post("/api/v1/orders", json=VALID_SHIPPING_PAYLOAD)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Insufficient stock" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Order list and detail router tests (AC-5, AC-6)
# ---------------------------------------------------------------------------


def test_list_orders_endpoint(authenticated_client, monkeypatch):
    """AC-5: GET /api/v1/orders returns user's orders list."""
    async def fake_list_orders(_db, user_id):
        assert user_id == USER_A
        return [sample_order()]

    monkeypatch.setattr(order_service, "list_orders", fake_list_orders)

    response = authenticated_client.get("/api/v1/orders")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(ORDER_ID)


def test_get_order_detail_own_order(authenticated_client, monkeypatch):
    """AC-6: GET /api/v1/orders/{id} returns own order with items."""
    async def fake_get_order(_db, user_id, order_id):
        assert user_id == USER_A
        assert order_id == ORDER_ID
        return sample_order()

    monkeypatch.setattr(order_service, "get_order", fake_get_order)

    response = authenticated_client.get(f"/api/v1/orders/{ORDER_ID}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == str(ORDER_ID)


def test_get_order_detail_another_user_returns_404(authenticated_client, monkeypatch):
    """AC-6 & prompt: another user's order returns 404, not 403."""
    async def fake_get_order(_db, user_id, _order_id):
        assert user_id == USER_A
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    monkeypatch.setattr(order_service, "get_order", fake_get_order)

    response = authenticated_client.get(f"/api/v1/orders/{ORDER_ID}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == "Order not found"


# ---------------------------------------------------------------------------
# Service layer tests: Atomic transactions, locking, rollback, stock (AC-1, AC-2, AC-3)
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_order_service_empty_cart_rollback():
    """AC-4: Service raises 400 and calls rollback when cart is empty."""
    db = AsyncMock()
    db.add = MagicMock()
    # Cart items query returns empty
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    db.execute.return_value = mock_result

    payload = OrderCreate(**VALID_SHIPPING_PAYLOAD)

    with pytest.raises(HTTPException) as exc_info:
        await order_service.create_order(db, USER_A, payload)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "cart is empty" in exc_info.value.detail
    db.rollback.assert_awaited_once()
    db.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_order_service_insufficient_stock_rollback():
    """AC-2: Service raises 400 and rolls back when product stock is insufficient."""
    db = AsyncMock()
    db.add = MagicMock()

    cart_item = CartItem(
        id=uuid.uuid4(),
        user_id=uuid.UUID(USER_A),
        product_id=PRODUCT_A_ID,
        quantity=5,
    )
    product = Product(
        id=PRODUCT_A_ID,
        name="Oak Table",
        slug="oak-table",
        price_cents=2999900,
        stock=2,  # Requested 5, available 2
        is_active=True,
    )

    cart_result = MagicMock()
    cart_result.scalars.return_value.all.return_value = [cart_item]

    prod_result = MagicMock()
    prod_result.scalars.return_value.all.return_value = [product]

    db.execute.side_effect = [cart_result, prod_result]

    payload = OrderCreate(**VALID_SHIPPING_PAYLOAD)

    with pytest.raises(HTTPException) as exc_info:
        await order_service.create_order(db, USER_A, payload)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "Insufficient stock" in exc_info.value.detail
    assert product.stock == 2  # Stock not decremented
    db.rollback.assert_awaited_once()
    db.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_order_service_success_atomic_transaction():
    """AC-1: Successful checkout decrements stock, creates order, clears cart, commits in one transaction."""
    db = AsyncMock()
    db.add = MagicMock()

    cart_item = CartItem(
        id=uuid.uuid4(),
        user_id=uuid.UUID(USER_A),
        product_id=PRODUCT_A_ID,
        quantity=2,
    )
    product = Product(
        id=PRODUCT_A_ID,
        name="Oak Table",
        slug="oak-table",
        price_cents=2999900,
        stock=10,
        is_active=True,
    )

    cart_result = MagicMock()
    cart_result.scalars.return_value.all.return_value = [cart_item]

    prod_result = MagicMock()
    prod_result.scalars.return_value.all.return_value = [product]

    del_result = MagicMock()

    db.execute.side_effect = [cart_result, prod_result, del_result]

    payload = OrderCreate(**VALID_SHIPPING_PAYLOAD)
    order_read = await order_service.create_order(db, USER_A, payload)

    # Stock decremented atomically
    assert product.stock == 8

    # Order details verified
    assert order_read.status == "pending"
    assert order_read.total_cents == 5999800
    assert len(order_read.items) == 1
    assert order_read.items[0].product_name == "Oak Table"
    assert order_read.items[0].unit_price_cents == 2999900
    assert order_read.items[0].quantity == 2
    assert order_read.items[0].line_total_cents == 5999800

    # Ensure integer paise (no floats)
    assert isinstance(order_read.total_cents, int)
    assert isinstance(order_read.items[0].unit_price_cents, int)
    assert isinstance(order_read.items[0].line_total_cents, int)

    # Added to session and committed
    db.add.assert_called_once()
    db.commit.assert_awaited_once()
    db.rollback.assert_not_awaited()


@pytest.mark.anyio
async def test_order_service_concurrent_checkout_one_succeeds_one_fails():
    """AC-3: Two checkouts competing for stock=1: first succeeds, second gets 400."""
    product = Product(
        id=PRODUCT_A_ID,
        name="Rare Chair",
        slug="rare-chair",
        price_cents=1000000,
        stock=1,
        is_active=True,
    )

    # First request
    db1 = AsyncMock()
    db1.add = MagicMock()
    cart1 = CartItem(id=uuid.uuid4(), user_id=uuid.UUID(USER_A), product_id=PRODUCT_A_ID, quantity=1)
    r1_cart = MagicMock(); r1_cart.scalars.return_value.all.return_value = [cart1]
    r1_prod = MagicMock(); r1_prod.scalars.return_value.all.return_value = [product]
    db1.execute.side_effect = [r1_cart, r1_prod, MagicMock()]

    order1 = await order_service.create_order(db1, USER_A, OrderCreate(**VALID_SHIPPING_PAYLOAD))
    assert order1.status == "pending"
    assert product.stock == 0
    db1.commit.assert_awaited_once()

    # Second request with now-exhausted stock
    db2 = AsyncMock()
    cart2 = CartItem(id=uuid.uuid4(), user_id=uuid.UUID(USER_B), product_id=PRODUCT_A_ID, quantity=1)
    r2_cart = MagicMock(); r2_cart.scalars.return_value.all.return_value = [cart2]
    r2_prod = MagicMock(); r2_prod.scalars.return_value.all.return_value = [product]
    db2.execute.side_effect = [r2_cart, r2_prod]

    with pytest.raises(HTTPException) as exc_info:
        await order_service.create_order(db2, USER_B, OrderCreate(**VALID_SHIPPING_PAYLOAD))

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "Insufficient stock" in exc_info.value.detail
    assert product.stock == 0  # Stock stays 0, never negative
    db2.rollback.assert_awaited_once()
    db2.commit.assert_not_awaited()


@pytest.mark.anyio
async def test_order_service_get_order_checks_ownership():
    """AC-6 & prompt: get_order checks ownership before anything else; returns 404 for other user."""
    db = AsyncMock()
    db.add = MagicMock()

    other_user_order = Order(
        id=ORDER_ID,
        user_id=uuid.UUID(USER_B),  # Belongs to USER_B
        status="pending",
        total_cents=1000,
        shipping_name="User B",
        shipping_line1="B Street",
        shipping_city="City",
        shipping_state="State",
        shipping_pincode="123456",
        shipping_country="IN",
        items=[],
    )
    db.scalar.return_value = other_user_order

    # USER_A tries to fetch USER_B's order
    with pytest.raises(HTTPException) as exc_info:
        await order_service.get_order(db, USER_A, ORDER_ID)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert exc_info.value.detail == "Order not found"


# ---------------------------------------------------------------------------
# Mock payment service tests (spec 0003)
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_pay_order_transitions_owned_pending_order_atomically():
    """AC-1 and AC-2: one conditional update pays the caller's pending order."""
    db = AsyncMock()
    update_result = MagicMock()
    update_result.scalar_one_or_none.return_value = ORDER_ID
    db.execute.return_value = update_result
    db.scalar.return_value = sample_order_model(order_status="paid")

    paid_order = await order_service.pay_order(db, USER_A, ORDER_ID)

    statement = db.execute.await_args.args[0]
    compiled = statement.compile(dialect=postgresql.dialect())
    sql = str(compiled)
    assert "UPDATE orders SET status=" in sql
    assert "orders.id" in sql
    assert "orders.user_id" in sql
    assert "orders.status" in sql
    assert "pending" in compiled.params.values()
    assert paid_order.status == "paid"
    db.commit.assert_awaited_once()
    db.rollback.assert_not_awaited()


@pytest.mark.anyio
async def test_pay_order_retry_on_paid_order_returns_paid_order():
    """AC-3: a retry cannot transition twice and still returns the paid order."""
    db = AsyncMock()
    update_result = MagicMock()
    update_result.scalar_one_or_none.return_value = None
    db.execute.return_value = update_result
    db.scalar.return_value = sample_order_model(order_status="paid")

    paid_order = await order_service.pay_order(db, USER_A, ORDER_ID)

    assert paid_order.status == "paid"
    db.commit.assert_not_awaited()
    db.rollback.assert_awaited_once()


@pytest.mark.anyio
async def test_pay_order_for_another_users_order_returns_404():
    """AC-4: another user's order is indistinguishable from a missing order."""
    db = AsyncMock()
    update_result = MagicMock()
    update_result.scalar_one_or_none.return_value = None
    db.execute.return_value = update_result
    db.scalar.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await order_service.pay_order(db, USER_A, ORDER_ID)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert exc_info.value.detail == "Order not found"
    db.rollback.assert_awaited_once()


@pytest.mark.anyio
async def test_pay_order_for_cancelled_order_returns_409():
    """AC-4: cancelled orders cannot be paid by the demo flow."""
    db = AsyncMock()
    update_result = MagicMock()
    update_result.scalar_one_or_none.return_value = None
    db.execute.return_value = update_result
    db.scalar.return_value = sample_order_model(order_status="cancelled")

    with pytest.raises(HTTPException) as exc_info:
        await order_service.pay_order(db, USER_A, ORDER_ID)

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert "cancelled" in exc_info.value.detail
    db.rollback.assert_awaited_once()


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("order_status", "expected_status_code"),
    [("paid", None), ("cancelled", status.HTTP_409_CONFLICT)],
)
async def test_pay_order_handles_expired_order_after_rollback_with_real_async_session(
    order_status, expected_status_code
):
    """Regression: rollback expires loaded ORM state before payment result handling."""
    connection = None
    try:
        connection = await engine.connect()
    except (OSError, SQLAlchemyError) as error:
        pytest.skip(f"Postgres is unavailable for this async session regression test: {error}")

    try:
        await connection.execute(
            text(
                """
                CREATE TEMPORARY TABLE orders (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    total_cents BIGINT NOT NULL,
                    shipping_name VARCHAR(255) NOT NULL,
                    shipping_line1 VARCHAR(255) NOT NULL,
                    shipping_line2 VARCHAR(255),
                    shipping_city VARCHAR(100) NOT NULL,
                    shipping_state VARCHAR(100) NOT NULL,
                    shipping_pincode VARCHAR(20) NOT NULL,
                    shipping_country VARCHAR(2) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL
                ) ON COMMIT PRESERVE ROWS
                """
            )
        )
        await connection.execute(
            text(
                """
                CREATE TEMPORARY TABLE order_items (
                    id UUID PRIMARY KEY,
                    order_id UUID NOT NULL,
                    product_id UUID NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    unit_price_cents BIGINT NOT NULL,
                    quantity INTEGER NOT NULL,
                    line_total_cents BIGINT NOT NULL
                ) ON COMMIT PRESERVE ROWS
                """
            )
        )
        await connection.commit()

        async with AsyncSession(bind=connection, expire_on_commit=False) as db:
            order = sample_order_model(order_status=order_status)
            order.items = [
                OrderItem(
                    id=uuid.uuid4(),
                    order_id=ORDER_ID,
                    product_id=PRODUCT_A_ID,
                    product_name="Oak Dining Table",
                    unit_price_cents=2999900,
                    quantity=2,
                    line_total_cents=5999800,
                )
            ]
            db.add(order)
            await db.commit()

            if expected_status_code is None:
                paid_order = await order_service.pay_order(db, USER_A, ORDER_ID)
                assert paid_order.status == "paid"
                assert len(paid_order.items) == 1
            else:
                with pytest.raises(HTTPException) as exc_info:
                    await order_service.pay_order(db, USER_A, ORDER_ID)

                assert exc_info.value.status_code == expected_status_code
                assert "cancelled" in exc_info.value.detail
    finally:
        if connection is not None:
            await connection.close()
        await engine.dispose()


# ---------------------------------------------------------------------------
# Locking and Postgres query generation tests (AC-3, Spec Option 2)
# ---------------------------------------------------------------------------


def test_lock_products_statement_enforces_sorted_for_update():
    """Spec requirement: Locks are taken with SELECT ... FOR UPDATE, sorted by product_id ASC."""
    # Pass out-of-order IDs
    product_ids = [PRODUCT_B_ID, PRODUCT_A_ID]
    sorted_ids = sorted(product_ids)
    assert sorted_ids[0] == PRODUCT_A_ID
    assert sorted_ids[1] == PRODUCT_B_ID

    stmt = order_service._lock_products_statement(sorted_ids)
    sql = str(stmt.compile(dialect=postgresql.dialect()))

    assert "FOR UPDATE" in sql
    assert "ORDER BY products.id ASC" in sql


@pytest.mark.anyio
async def test_create_order_serializes_response():
    """AC-1 & regression: runs create_order, verifies ORM persistence doesn't raise NoReferencedTableError, and serializes response cleanly."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    test_engine = create_engine("sqlite:///:memory:")
    Order.__table__.create(test_engine)
    OrderItem.__table__.create(test_engine)

    with Session(test_engine) as test_session:
        oid = uuid.uuid4()
        item = OrderItem(
            id=uuid.uuid4(),
            order_id=oid,
            product_id=PRODUCT_A_ID,
            product_name="Oak Table",
            unit_price_cents=2999900,
            quantity=2,
            line_total_cents=5999800,
        )
        order_obj = Order(
            id=oid,
            user_id=uuid.UUID(USER_A),
            status="pending",
            total_cents=5999800,
            shipping_name="Shreyas Gowda",
            shipping_line1="12 MG Road",
            shipping_city="Bengaluru",
            shipping_state="Karnataka",
            shipping_pincode="560001",
            shipping_country="IN",
            items=[item],
        )
        test_session.add(order_obj)
        # Flush succeeds without raising NoReferencedTableError for auth.users
        test_session.flush()

    db = AsyncMock()
    db.add = MagicMock()
    cart_item = CartItem(
        id=uuid.uuid4(),
        user_id=uuid.UUID(USER_A),
        product_id=PRODUCT_A_ID,
        quantity=2,
    )
    product = Product(
        id=PRODUCT_A_ID,
        name="Oak Table",
        slug="oak-table",
        price_cents=2999900,
        stock=10,
        is_active=True,
    )
    cart_result = MagicMock()
    cart_result.scalars.return_value.all.return_value = [cart_item]
    prod_result = MagicMock()
    prod_result.scalars.return_value.all.return_value = [product]
    del_result = MagicMock()
    db.execute.side_effect = [cart_result, prod_result, del_result]

    payload = OrderCreate(**VALID_SHIPPING_PAYLOAD)
    order_read = await order_service.create_order(db, USER_A, payload)

    # Test serialization of response model
    dumped = order_read.model_dump(mode="json")
    assert dumped["id"] == str(order_read.id)
    assert dumped["status"] == "pending"
    assert dumped["total_cents"] == 5999800
    assert isinstance(dumped["total_cents"], int)
    assert len(dumped["items"]) == 1
    assert dumped["items"][0]["product_name"] == "Oak Table"
    assert dumped["items"][0]["unit_price_cents"] == 2999900
    assert isinstance(dumped["items"][0]["unit_price_cents"], int)
    assert dumped["items"][0]["quantity"] == 2
    assert dumped["items"][0]["line_total_cents"] == 5999800
    assert isinstance(dumped["items"][0]["line_total_cents"], int)
    assert "created_at" in dumped

