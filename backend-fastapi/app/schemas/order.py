"""Pydantic schemas for orders and order items."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    shipping_name: str = Field(min_length=1, max_length=255)
    shipping_line1: str = Field(min_length=1, max_length=255)
    shipping_line2: str | None = Field(default=None, max_length=255)
    shipping_city: str = Field(min_length=1, max_length=100)
    shipping_state: str = Field(min_length=1, max_length=100)
    shipping_pincode: str = Field(min_length=1, max_length=20)
    shipping_country: str = Field(default="IN", min_length=2, max_length=2)


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    unit_price_cents: int
    quantity: int
    line_total_cents: int


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    total_cents: int
    shipping_name: str
    shipping_line1: str
    shipping_line2: str | None = None
    shipping_city: str
    shipping_state: str
    shipping_pincode: str
    shipping_country: str
    created_at: datetime
    items: list[OrderItemRead]
