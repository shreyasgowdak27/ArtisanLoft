"""Authenticated cart API routes."""

import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.schemas.cart import CartItemAdd, CartItemRead, CartItemUpdate, CartRead
from app.schemas.user import CurrentUser
from app.services import cart_service

router = APIRouter(prefix="/api/v1/cart", tags=["cart"])


@router.get("", response_model=CartRead)
async def read_cart(current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> CartRead:
    return await cart_service.get_cart(db, current_user.id)


@router.post("/items", response_model=CartItemRead)
async def add_cart_item(payload: CartItemAdd, current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> CartItemRead:
    return await cart_service.add_item(db, current_user.id, payload)


@router.patch("/items/{product_id}", response_model=CartItemRead)
async def update_cart_item(product_id: uuid.UUID, payload: CartItemUpdate, current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> CartItemRead | Response:
    item = await cart_service.update_item(db, current_user.id, product_id, payload)
    if item is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return item


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cart_item(product_id: uuid.UUID, current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> Response:
    await cart_service.delete_item(db, current_user.id, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
