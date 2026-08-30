"""Fetch unique Unsplash image URLs for each catalog product."""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

PRODUCT_QUERIES: dict[str, str] = {
    "Sheesham Wood 3-Seater Sofa": "wooden frame sofa",
    "Royal Velvet Armchair": "green velvet armchair",
    "Makrana Marble Coffee Table": "marble coffee table",
    "Leather L-Shape Sofa": "leather sectional sofa",
    "Cane Lounge Chair": "rattan lounge chair",
    "Rosewood TV Unit": "wooden tv console",
    "Teak Wood 8-Seater Dining Table": "large wooden dining table",
    "Brass Inlay Dining Chairs Set": "wooden dining chairs",
    "Mango Wood Extendable Table": "rustic wood dining table",
    "Upholstered Dining Bench": "upholstered dining bench",
    "Round Marble Dining Table": "round marble table",
    "Sheesham King Size Bed": "wooden bed frame",
    "Tufted Linen Headboard": "tufted headboard",
    "Bedside Tables Pair": "wooden nightstand",
    "Almirah with Mirror": "wardrobe with mirror",
    "Velvet Storage Ottoman": "storage ottoman",
    "6-Drawer Chest with Mirror": "dresser with mirror",
    "Industrial Bookshelf": "industrial bookshelf",
    "Executive Office Desk": "executive wood desk",
    "Ergonomic Office Chair": "ergonomic office chair",
    "Standing Desk Converter": "standing desk",
    "Vintage Filing Cabinet": "vintage filing cabinet",
    "Teak Garden Sofa Set": "outdoor teak sofa",
    "Cane Outdoor Dining Set": "outdoor rattan dining set",
    "Macrame Swing Chair": "macrame swing chair",
    "Terracotta Fire Pit": "outdoor fire pit",
    "Brass Pendant Cluster": "brass pendant light",
    "Marble Base Floor Lamp": "floor lamp marble",
    "Blue Pottery Table Lamps": "ceramic table lamp",
    "Crystal Chandelier": "crystal chandelier",
}

SEARCH_URL = "https://api.unsplash.com/search/photos"
OUTPUT_PATH = Path(__file__).resolve().parent / "product_images.json"


def fetch_regular_urls(
    client: httpx.Client, access_key: str, query: str, count: int = 3
) -> list[str]:
    response = client.get(
        SEARCH_URL,
        params={"query": query, "per_page": count, "orientation": "landscape"},
        headers={"Authorization": f"Client-ID {access_key}"},
        timeout=30.0,
    )
    response.raise_for_status()
    results = response.json().get("results") or []
    urls: list[str] = []
    seen: set[str] = set()
    for result in results:
        url = result.get("urls", {}).get("regular")
        if url and url not in seen:
            seen.add(url)
            urls.append(url)
        if len(urls) == count:
            break
    return urls


def main() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(env_path)

    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key:
        raise SystemExit(
            "UNSPLASH_ACCESS_KEY is not set. Add it to backend-fastapi/.env"
        )

    product_images: dict[str, dict[str, str]] = {}
    with httpx.Client() as client:
        for index, (name, query) in enumerate(PRODUCT_QUERIES.items()):
            print(f"[{index + 1}/{len(PRODUCT_QUERIES)}] Searching: {name!r} ({query})")
            urls = fetch_regular_urls(client, access_key, query, count=3)
            if not urls:
                print(f"  No results for {name!r}")
                continue
            image_url = urls[0]
            extra_urls = urls[1:]
            product_images[name] = {
                "imageUrl": image_url,
                "imageUrls": ",".join(extra_urls),
            }
            print(f"  imageUrl -> {image_url}")
            print(f"  imageUrls -> {extra_urls}")
            if index < len(PRODUCT_QUERIES) - 1:
                time.sleep(1)

    print("\nProduct image map:")
    print(product_images)

    OUTPUT_PATH.write_text(json.dumps(product_images, indent=2), encoding="utf-8")
    print(f"\nSaved {len(product_images)} products to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
