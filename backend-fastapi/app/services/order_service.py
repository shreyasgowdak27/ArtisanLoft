"""Order service implementing atomic checkout, stock decrement, and order queries."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderRead


def _user_uuid(user_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(user_id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has an invalid user id",
        ) from error


def _lock_products_statement(product_ids: list[uuid.UUID]):
    """Generates the SELECT ... FOR UPDATE statement ordered by product id ASC to prevent deadlocks."""
    return (
        select(Product)
        .where(Product.id.in_(product_ids))
        .order_by(Product.id.asc())
        .with_for_update()
    )


def _lock_cart_items_statement(user_id: uuid.UUID):
    """Locks the user's checkout cart rows before their quantities are read."""
    return (
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .order_by(CartItem.product_id.asc())
        .with_for_update()
    )


def _order_by_idempotency_key_statement(user_id: uuid.UUID, idempotency_key: str):
    return (
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.user_id == user_id,
            Order.idempotency_key == idempotency_key,
        )
    )


async def create_order(
    db: AsyncSession,
    user_id: str,
    payload: OrderCreate,
    idempotency_key: str | None = None,
) -> OrderRead:
    """Creates an order atomically within a single transaction.

    Steps:
    1. Return an existing order for a previously used idempotency key.
    2. Lock and fetch cart rows for the authenticated user. If empty, raise 400.
    3. Acquire SELECT ... FOR UPDATE locks on product rows sorted by product_id ASC.
    4. Verify active status and sufficient stock for every cart item.
    5. Decrement stock with a conditional SQL UPDATE.
    6. Snapshot product name and unit price (BIGINT integer paise).
    7. Insert Order and OrderItem rows.
    8. Clear the locked cart items.
    9. Commit transaction and return OrderRead. Rollback on any failure.
    """
    owner_id = _user_uuid(user_id)
    try:
        if idempotency_key is not None:
            existing_order = await db.scalar(
                _order_by_idempotency_key_statement(owner_id, idempotency_key)
            )
            if existing_order is not None:
                existing_order_read = OrderRead.model_validate(existing_order)
                await db.rollback()
                return existing_order_read

        cart_items_res = await db.execute(_lock_cart_items_statement(owner_id))
        cart_items = list(cart_items_res.scalars().all())

        # A concurrent request with this key waits for the cart lock above. Once
        # it acquires the lock, this second lookup sees the committed order.
        if idempotency_key is not None:
            existing_order = await db.scalar(
                _order_by_idempotency_key_statement(owner_id, idempotency_key)
            )
            if existing_order is not None:
                existing_order_read = OrderRead.model_validate(existing_order)
                await db.rollback()
                return existing_order_read

        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot place order: cart is empty",
            )

        # Sort product IDs ascending to enforce deterministic lock acquisition order (prevents deadlocks)
        sorted_product_ids = sorted({item.product_id for item in cart_items})

        # Lock product rows with SELECT ... FOR UPDATE
        lock_stmt = _lock_products_statement(sorted_product_ids)
        products_res = await db.execute(lock_stmt)
        locked_products = {p.id: p for p in products_res.scalars().all()}

        # Verify all products still exist
        for pid in sorted_product_ids:
            if pid not in locked_products:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product with id {pid} not found",
                )

        order_id = uuid.uuid4()
        order_items_to_create: list[OrderItem] = []
        total_cents = 0

        for item in cart_items:
            product = locked_products[item.product_id]
            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product '{product.name}' is no longer available",
                )
            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient stock for product '{product.name}'. Available: {product.stock}, requested: {item.quantity}",
                )

            stock_update = await db.execute(
                update(Product)
                .where(Product.id == product.id, Product.stock >= item.quantity)
                .values(stock=Product.stock - item.quantity)
                .returning(Product.id)
            )
            if stock_update.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Insufficient stock for product '{product.name}'",
                )

            # Snapshots of product name and unit price in integer paise
            unit_price_cents = product.price_cents
            line_total_cents = unit_price_cents * item.quantity
            total_cents += line_total_cents

            order_item = OrderItem(
                id=uuid.uuid4(),
                order_id=order_id,
                product_id=product.id,
                product_name=product.name,
                unit_price_cents=unit_price_cents,
                quantity=item.quantity,
                line_total_cents=line_total_cents,
            )
            order_items_to_create.append(order_item)

        order = Order(
            id=order_id,
            user_id=owner_id,
            status="pending",
            total_cents=total_cents,
            idempotency_key=idempotency_key,
            shipping_name=payload.shipping_name,
            shipping_line1=payload.shipping_line1,
            shipping_line2=payload.shipping_line2,
            shipping_city=payload.shipping_city,
            shipping_state=payload.shipping_state,
            shipping_pincode=payload.shipping_pincode,
            shipping_country=payload.shipping_country,
            created_at=datetime.now(timezone.utc),
            items=order_items_to_create,
        )
        db.add(order)
        await db.flush()

        # Clear only the locked rows so an item added while checkout was in
        # progress is not lost.
        await db.execute(delete(CartItem).where(CartItem.id.in_([item.id for item in cart_items])))

        await db.commit()
        return OrderRead.model_validate(order)
    except IntegrityError:
        await db.rollback()
        if idempotency_key is not None:
            existing_order = await db.scalar(
                _order_by_idempotency_key_statement(owner_id, idempotency_key)
            )
            if existing_order is not None:
                existing_order_read = OrderRead.model_validate(existing_order)
                await db.rollback()
                return existing_order_read
        raise
    except Exception:
        await db.rollback()
        raise


async def list_orders(db: AsyncSession, user_id: str) -> list[OrderRead]:
    """Returns all orders belonging to the authenticated user, newest first."""
    owner_id = _user_uuid(user_id)
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == owner_id)
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    return [OrderRead.model_validate(order) for order in orders]


async def get_order(db: AsyncSession, user_id: str, order_id: uuid.UUID) -> OrderRead:
    """Returns a specific order with items.

    Checks ownership before anything else: returns 404 if the order does not exist
    or if it belongs to another user.
    """
    owner_id = _user_uuid(user_id)
    stmt = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = await db.scalar(stmt)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    # Ownership checked before returning any order details
    if order.user_id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return OrderRead.model_validate(order)


async def pay_order(db: AsyncSession, user_id: str, order_id: uuid.UUID) -> OrderRead:
    """Marks one owned pending order as paid for the demo payment flow.

    The conditional UPDATE is the state transition. Its WHERE clause makes the
    transition owner scoped and atomic, so concurrent clicks cannot both change
    the same order. A second request sees the paid order and returns it.
    """
    owner_id = _user_uuid(user_id)
    transition = (
        update(Order)
        .where(
            Order.id == order_id,
            Order.user_id == owner_id,
            Order.status == "pending",
        )
        .values(status="paid")
        .returning(Order.id)
    )
    transition_result = await db.execute(transition)

    if transition_result.scalar_one_or_none() is not None:
        await db.commit()
        return await get_order(db, user_id, order_id)

    existing_order = await db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.user_id == owner_id)
    )
    existing_order_read = (
        OrderRead.model_validate(existing_order) if existing_order is not None else None
    )
    await db.rollback()

    if existing_order_read is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if existing_order_read.status == "paid":
        return existing_order_read

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Order cannot be paid while status is '{existing_order_read.status}'",
    )
