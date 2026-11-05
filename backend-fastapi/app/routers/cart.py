"""Authenticated cart API routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.core.rate_limit import (
    WRITE_POLICY,
    enforce_read_rate_limit,
    get_client_ip,
    rate_limiter,
)
from app.schemas.cart import CartItemAdd, CartItemRead, CartItemUpdate, CartRead
from app.schemas.user import CurrentUser
from app.services import cart_service

router = APIRouter(prefix="/api/v1/cart", tags=["cart"])


async def enforce_cart_write_rate_limit(request: Request) -> None:
    """Apply the cart write allowance before mutating cart state."""
    result = await rate_limiter.check(WRITE_POLICY, get_client_ip(request))
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(result.retry_after)},
        )


@router.get(
    "",
    response_model=CartRead,
    dependencies=[Depends(enforce_read_rate_limit)],
)
async def read_cart(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartRead:
    return await cart_service.get_cart(db, current_user.id)


@router.post(
    "/items",
    response_model=CartItemRead,
    dependencies=[Depends(enforce_cart_write_rate_limit)],
)
async def add_cart_item(
    payload: CartItemAdd,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartItemRead:
    return await cart_service.add_item(db, current_user.id, payload)


@router.patch(
    "/items/{product_id}",
    response_model=CartItemRead,
    dependencies=[Depends(enforce_cart_write_rate_limit)],
)
async def update_cart_item(
    product_id: uuid.UUID,
    payload: CartItemUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartItemRead | Response:
    item = await cart_service.update_item(db, current_user.id, product_id, payload)
    if item is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return item


@router.delete(
    "/items/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(enforce_cart_write_rate_limit)],
)
async def delete_cart_item(
    product_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await cart_service.delete_item(db, current_user.id, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
