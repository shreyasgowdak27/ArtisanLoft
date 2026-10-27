"""Pydantic schemas for authenticated cart endpoints."""

import uuid

from pydantic import BaseModel, ConfigDict, Field


class CartItemAdd(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=0, le=99)


class CartProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    image_url: str | None = None
    price_cents: int
    currency: str
    stock: int
    is_active: bool


class CartItemRead(BaseModel):
    product_id: uuid.UUID
    quantity: int
    product: CartProductRead
    line_total_cents: int


class CartRead(BaseModel):
    items: list[CartItemRead]
    item_count: int
    total_quantity: int
    subtotal_cents: int
    currency: str = "INR"
