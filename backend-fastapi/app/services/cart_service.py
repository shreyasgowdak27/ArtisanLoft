"""Cart business logic with owner scoped, atomic mutations."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import and_, delete, func, literal, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.models.cart import CartItem
from app.models.product import Product
from app.schemas.cart import CartItemAdd, CartItemRead, CartItemUpdate, CartProductRead, CartRead


def _user_uuid(user_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(user_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token has an invalid user id") from error


def _cart_statement(user_id: uuid.UUID) -> Select[tuple[CartItem, Product]]:
    return select(CartItem, Product).join(Product, Product.id == CartItem.product_id).where(CartItem.user_id == user_id).order_by(CartItem.created_at)


def _to_cart_item(cart_item: CartItem, product: Product) -> CartItemRead:
    return CartItemRead(
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        product=CartProductRead.model_validate(product),
        line_total_cents=product.price_cents * cart_item.quantity,
    )


async def get_cart(db: AsyncSession, user_id: str) -> CartRead:
    result = await db.execute(_cart_statement(_user_uuid(user_id)))
    items = [_to_cart_item(cart_item, product) for cart_item, product in result.all()]
    return CartRead(items=items, item_count=len(items), total_quantity=sum(item.quantity for item in items), subtotal_cents=sum(item.line_total_cents for item in items))


async def _get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    product = await db.scalar(select(Product).where(Product.id == product_id))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


async def _require_available_product(db: AsyncSession, product_id: uuid.UUID, quantity: int) -> Product:
    product = await _get_product(db, product_id)
    if not product.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product is unavailable")
    if quantity > product.stock:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested quantity exceeds stock")
    return product


def _add_item_statement(user_id: uuid.UUID, product_id: uuid.UUID, quantity: int):
    stock_limit = select(Product.stock).where(Product.id == product_id, Product.is_active.is_(True)).scalar_subquery()
    insert_values = select(literal(user_id), Product.id, literal(quantity)).where(Product.id == product_id, Product.is_active.is_(True), Product.stock >= quantity)
    return (
        insert(CartItem)
        .from_select(["user_id", "product_id", "quantity"], insert_values)
        .on_conflict_do_update(
            index_elements=[CartItem.user_id, CartItem.product_id],
            set_={"quantity": CartItem.quantity + quantity, "updated_at": func.now()},
            where=and_(CartItem.quantity + quantity <= 99, CartItem.quantity + quantity <= stock_limit),
        )
        .returning(CartItem.id)
    )


async def _get_cart_item(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> CartItemRead:
    result = await db.execute(_cart_statement(user_id).where(CartItem.product_id == product_id))
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    return _to_cart_item(*row)


async def add_item(db: AsyncSession, user_id: str, payload: CartItemAdd) -> CartItemRead:
    owner_id = _user_uuid(user_id)
    result = await db.execute(_add_item_statement(owner_id, payload.product_id, payload.quantity))
    if result.scalar_one_or_none() is None:
        product = await _require_available_product(db, payload.product_id, payload.quantity)
        existing_item = await db.scalar(
            select(CartItem).where(CartItem.user_id == owner_id, CartItem.product_id == payload.product_id)
        )
        if existing_item is not None and existing_item.quantity + payload.quantity > product.stock:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested quantity exceeds stock")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested quantity exceeds the cart or stock limit")
    await db.commit()
    return await _get_cart_item(db, owner_id, payload.product_id)


async def update_item(db: AsyncSession, user_id: str, product_id: uuid.UUID, payload: CartItemUpdate) -> CartItemRead | None:
    owner_id = _user_uuid(user_id)
    await _get_product(db, product_id)
    if payload.quantity == 0:
        result = await db.execute(delete(CartItem).where(CartItem.user_id == owner_id, CartItem.product_id == product_id).returning(CartItem.id))
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        await db.commit()
        return None

    stock_limit = select(Product.stock).where(Product.id == product_id, Product.is_active.is_(True)).scalar_subquery()
    result = await db.execute(
        update(CartItem)
        .where(CartItem.user_id == owner_id, CartItem.product_id == product_id, payload.quantity <= stock_limit)
        .values(quantity=payload.quantity, updated_at=func.now())
        .returning(CartItem.id)
    )
    if result.scalar_one_or_none() is None:
        existing_item = await db.scalar(
            select(CartItem.id).where(CartItem.user_id == owner_id, CartItem.product_id == product_id)
        )
        if existing_item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        await _require_available_product(db, product_id, payload.quantity)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested quantity exceeds stock")
    await db.commit()
    return await _get_cart_item(db, owner_id, product_id)


async def delete_item(db: AsyncSession, user_id: str, product_id: uuid.UUID) -> None:
    owner_id = _user_uuid(user_id)
    await _get_product(db, product_id)
    await db.execute(delete(CartItem).where(CartItem.user_id == owner_id, CartItem.product_id == product_id))
    await db.commit()
