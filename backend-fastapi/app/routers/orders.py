"""Authenticated orders API routes."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.schemas.order import OrderCreate, OrderRead
from app.schemas.user import CurrentUser
from app.services import order_service

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("", response_model=OrderRead)
async def create_order(
    payload: OrderCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    return await order_service.create_order(db, current_user.id, payload)


@router.get("", response_model=list[OrderRead])
async def list_orders(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrderRead]:
    return await order_service.list_orders(db, current_user.id)


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    return await order_service.get_order(db, current_user.id, order_id)
