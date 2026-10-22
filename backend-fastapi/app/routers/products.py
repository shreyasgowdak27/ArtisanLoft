"""Products router — public, read-only endpoints.

Phase 2 scope: list all products and fetch by slug.
Full search/filter/pagination lives in Phase 6; this builds the minimal
contract the frontend homepage needs today.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models.product import Product
from app.schemas.product import ProductRead

router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
async def list_products(
    db: AsyncSession = Depends(get_db),
) -> list[Product]:
    """Return all active products (no pagination yet — Phase 6 adds it)."""
    result = await db.execute(select(Product).where(Product.is_active.is_(True)))
    return list(result.scalars().all())


@router.get("/{slug}", response_model=ProductRead)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)) -> Product:
    """Fetch a single product by its URL slug."""
    result = await db.execute(select(Product).where(Product.slug == slug))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
