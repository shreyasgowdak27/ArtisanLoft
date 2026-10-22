"""Pydantic schemas for the Product API.

The frontend expects:
  - id (string UUID)
  - name, description, category
  - imageUrl, imageUrls (camelCase)
  - price (float INR) — derived from price_cents so the frontend doesn't change
  - stock, is_active, slug

Money rule: price_cents is the source of truth; price (float) is a
presentation-only field calculated at serialization time (price_cents / 100).
"""

import uuid

from pydantic import BaseModel, ConfigDict, Field, computed_field


class ProductRead(BaseModel):
    """Product response matching the frontend API contract."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    price_cents: int
    currency: str = "INR"
    category: str | None = None
    image_url: str | None = Field(default=None, alias="image_url")
    image_urls: str | None = Field(default=None, alias="image_urls")
    stock: int
    is_active: bool

    # Derived presentation field: float rupees for the frontend.
    # The frontend currently reads `price`; this keeps backward compatibility.
    @computed_field  # type: ignore[misc]
    @property
    def price(self) -> float:
        return round(self.price_cents / 100, 2)

    # camelCase aliases for the React frontend
    @computed_field  # type: ignore[misc]
    @property
    def imageUrl(self) -> str | None:  # noqa: N802
        return self.image_url

    @computed_field  # type: ignore[misc]
    @property
    def imageUrls(self) -> str | None:  # noqa: N802
        return self.image_urls
