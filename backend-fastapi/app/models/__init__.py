"""Model package — re-exports all ORM classes for convenient imports."""

from app.models.product import Product
from app.models.cart import CartItem

__all__ = ["CartItem", "Product"]
