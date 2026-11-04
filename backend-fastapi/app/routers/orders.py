"""Authenticated orders API routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.core.rate_limit import (
    WRITE_POLICY,
    enforce_read_rate_limit,
    get_client_ip,
    rate_limiter,
)
from app.schemas.order import OrderCreate, OrderRead
from app.schemas.user import CurrentUser
from app.services import order_service

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


async def enforce_order_write_rate_limit(request: Request) -> None:
    """Apply the order write allowance before creating or paying an order."""
    result = await rate_limiter.check(WRITE_POLICY, get_client_ip(request))
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(result.retry_after)},
        )


@router.post("", response_model=OrderRead)
async def create_order(
    payload: OrderCreate,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(enforce_order_write_rate_limit),
) -> OrderRead:
    return await order_service.create_order(db, current_user.id, payload)


@router.get(
    "",
    response_model=list[OrderRead],
    dependencies=[Depends(enforce_read_rate_limit)],
)
async def list_orders(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrderRead]:
    return await order_service.list_orders(db, current_user.id)


@router.post("/{order_id}/pay", response_model=OrderRead)
async def pay_order(
    order_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _rate_limit: None = Depends(enforce_order_write_rate_limit),
) -> OrderRead:
    return await order_service.pay_order(db, current_user.id, order_id)


@router.get(
    "/{order_id}",
    response_model=OrderRead,
    dependencies=[Depends(enforce_read_rate_limit)],
)
async def get_order(
    order_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    return await order_service.get_order(db, current_user.id, order_id)
