from pydantic import BaseModel, ConfigDict, Field


class ProductRead(BaseModel):
    """Product response matching the frontend API contract (camelCase)."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    description: str | None = None
    price: float
    category: str | None = None
    imageUrl: str | None = Field(
        default=None,
        validation_alias="image_url",
        serialization_alias="imageUrl",
    )
    imageUrls: str | None = Field(
        default=None,
        validation_alias="image_urls",
        serialization_alias="imageUrls",
    )
