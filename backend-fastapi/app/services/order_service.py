"""Order service implementing atomic checkout, stock decrement, and order queries."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select
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


async def create_order(
    db: AsyncSession, user_id: str, payload: OrderCreate
) -> OrderRead:
    """Creates an order atomically within a single transaction.

    Steps:
    1. Fetch cart items for the authenticated user. If empty, raise 400.
    2. Acquire SELECT ... FOR UPDATE locks on product rows sorted by product_id ASC.
    3. Verify active status and sufficient stock for every cart item.
    4. If any item has insufficient stock, rollback and raise 400.
    5. Decrement stock on product rows.
    6. Snapshot product name and unit price (BIGINT integer paise).
    7. Insert Order and OrderItem rows.
    8. Clear user's cart items.
    9. Commit transaction and return OrderRead. Rollback on any failure.
    """
    owner_id = _user_uuid(user_id)
    try:
        cart_items_res = await db.execute(
            select(CartItem).where(CartItem.user_id == owner_id).order_by(CartItem.created_at)
        )
        cart_items = list(cart_items_res.scalars().all())

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
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is no longer available",
                )
            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}'. Available: {product.stock}, requested: {item.quantity}",
                )

            # Atomic stock decrement within the locked transaction
            product.stock -= item.quantity

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

        # Clear cart items in the same transaction
        await db.execute(delete(CartItem).where(CartItem.user_id == owner_id))

        await db.commit()
        # Refresh order and eagerly load items after commit (expire_on_commit=True
        # invalidates in-memory attributes; async sessions cannot lazy-load).
        await db.refresh(order, ["items"])
        return OrderRead.model_validate(order)
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
