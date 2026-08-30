"""Create tables and seed products from the original Java data.sql catalog."""

import json
from pathlib import Path

from app.database import Base, SessionLocal, engine
from app.models.product import Product

_PRODUCT_IMAGES_PATH = Path(__file__).resolve().parent / "product_images.json"


def _load_product_images() -> dict[str, dict[str, str]]:
    if not _PRODUCT_IMAGES_PATH.exists():
        return {}
    raw = json.loads(_PRODUCT_IMAGES_PATH.read_text(encoding="utf-8"))
    normalized: dict[str, dict[str, str]] = {}
    for name, value in raw.items():
        if isinstance(value, str):
            normalized[name] = {"imageUrl": value, "imageUrls": ""}
        else:
            normalized[name] = {
                "imageUrl": value.get("imageUrl", ""),
                "imageUrls": value.get("imageUrls", ""),
            }
    return normalized


def _apply_image_data(target: dict | Product, data: dict[str, str]) -> None:
    if data.get("imageUrl"):
        if isinstance(target, dict):
            target["image_url"] = data["imageUrl"]
        else:
            target.image_url = data["imageUrl"]
    if "imageUrls" in data:
        if isinstance(target, dict):
            target["image_urls"] = data["imageUrls"]
        else:
            target.image_urls = data["imageUrls"]


def _with_fetched_images(products: list[dict]) -> list[dict]:
    images = _load_product_images()
    updated: list[dict] = []
    for item in products:
        copy = dict(item)
        if copy["name"] in images:
            _apply_image_data(copy, images[copy["name"]])
        updated.append(copy)
    return updated


SAMPLE_PRODUCTS = [
    # Living Room Collection
    {
        "name": "Sheesham Wood 3-Seater Sofa",
        "description": "Handcrafted 3-seater sofa with premium Sheesham wood frame. Features high-density foam cushions and durable cotton upholstery. Made in Jodhpur.",
        "price": 89999.00,
        "category": "Living Room",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800",
    },
    {
        "name": "Royal Velvet Armchair",
        "description": "Deep emerald green velvet with brass-finished trim. Exceptional comfort with traditional Indian craftsmanship.",
        "price": 34999.00,
        "category": "Living Room",
        "image_url": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
    },
    {
        "name": "Makrana Marble Coffee Table",
        "description": "Genuine Makrana marble top with hand-carved brass base. Each piece features unique veining patterns from Rajasthan.",
        "price": 45999.00,
        "category": "Living Room",
        "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800",
    },
    {
        "name": "Leather L-Shape Sofa",
        "description": "Premium full-grain leather sectional with deep seating. Solid teak wood frame with 10-year warranty.",
        "price": 149999.00,
        "category": "Living Room",
        "image_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800",
    },
    {
        "name": "Cane Lounge Chair",
        "description": "Traditional cane weaving with mango wood frame. Handcrafted by artisans from Assam.",
        "price": 28999.00,
        "category": "Living Room",
        "image_url": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
    },
    {
        "name": "Rosewood TV Unit",
        "description": "Handcrafted rosewood entertainment center with brass inlay work. Soft-close drawers and cable management.",
        "price": 67999.00,
        "category": "Living Room",
        "image_url": "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800",
    },
    # Dining Collection
    {
        "name": "Teak Wood 8-Seater Dining Table",
        "description": "Solid teak wood table for 8 people. Hand-finished with natural lacquer. Made in Kerala.",
        "price": 125999.00,
        "category": "Dining",
        "image_url": "https://images.unsplash.com/photo-1577482439275-81422da567c1?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800",
    },
    {
        "name": "Brass Inlay Dining Chairs Set",
        "description": "Set of 6 chairs with traditional brass inlay work. Solid Sheesham wood with cushioned seats.",
        "price": 78999.00,
        "category": "Dining",
        "image_url": "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1551298370-9d3d53b43ed7?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
    },
    {
        "name": "Mango Wood Extendable Table",
        "description": "Rustic mango wood dining table with butterfly leaf extension. Seats 6-10 comfortably.",
        "price": 89999.00,
        "category": "Dining",
        "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1577482439275-81422da567c1?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800",
    },
    {
        "name": "Upholstered Dining Bench",
        "description": "Luxurious cotton velvet bench with brass legs. Perfect for modern Indian homes.",
        "price": 24999.00,
        "category": "Dining",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800",
    },
    {
        "name": "Round Marble Dining Table",
        "description": "Elegant marble-top round table on carved wooden pedestal. Seats 4 perfectly.",
        "price": 95999.00,
        "category": "Dining",
        "image_url": "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1577482439275-81422da567c1?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800",
    },
    # Bedroom Collection
    {
        "name": "Sheesham King Size Bed",
        "description": "King size platform bed in solid Sheesham wood. Traditional Rajasthani carving with storage drawers.",
        "price": 85999.00,
        "category": "Bedroom",
        "image_url": "https://images.unsplash.com/photo-1505693357370-58c35b54718b?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800",
    },
    {
        "name": "Tufted Linen Headboard",
        "description": "Luxurious hand-tufted cotton headboard in ivory. Easy wall-mount installation.",
        "price": 18999.00,
        "category": "Bedroom",
        "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1505693357370-58c35b54718b?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800",
    },
    {
        "name": "Bedside Tables Pair",
        "description": "Set of 2 bedside tables with hidden drawer. Solid mango wood with brass handles.",
        "price": 32999.00,
        "category": "Bedroom",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1551298370-9d3d53b43ed7?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800",
    },
    {
        "name": "Almirah with Mirror",
        "description": "Spacious 3-door almirah with full-length mirror. Solid teak with adjustable shelving.",
        "price": 145999.00,
        "category": "Bedroom",
        "image_url": "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1505693357370-58c35b54718b?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800",
    },
    {
        "name": "Velvet Storage Ottoman",
        "description": "Bedroom ottoman in dusty rose velvet with brass legs. Hidden storage compartment.",
        "price": 15999.00,
        "category": "Bedroom",
        "image_url": "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800",
    },
    {
        "name": "6-Drawer Chest with Mirror",
        "description": "Six-drawer dresser in walnut finish with brass hardware. Includes matching mirror frame.",
        "price": 78999.00,
        "category": "Bedroom",
        "image_url": "https://images.unsplash.com/photo-1551298370-9d3d53b43ed7?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800",
    },
    # Office Collection
    {
        "name": "Industrial Bookshelf",
        "description": "Iron frame with reclaimed railway sleeper wood shelves. Industrial heritage meets modern design.",
        "price": 45999.00,
        "category": "Office",
        "image_url": "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
    },
    {
        "name": "Executive Office Desk",
        "description": "Solid rosewood desk with leather inlay writing surface. Three drawers with brass pulls.",
        "price": 95999.00,
        "category": "Office",
        "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
    },
    {
        "name": "Ergonomic Office Chair",
        "description": "Premium mesh back chair with adjustable lumbar support. 12-hour comfort certified.",
        "price": 24999.00,
        "category": "Office",
        "image_url": "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800",
    },
    {
        "name": "Standing Desk Converter",
        "description": "Bamboo desktop riser with smooth pneumatic lift. Dual monitor capacity. Eco-friendly.",
        "price": 18999.00,
        "category": "Office",
        "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800",
    },
    {
        "name": "Vintage Filing Cabinet",
        "description": "Retro-style filing cabinet in teak veneer. Two deep drawers on soft-close rails.",
        "price": 28999.00,
        "category": "Office",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800",
    },
    # Outdoor Collection
    {
        "name": "Teak Garden Sofa Set",
        "description": "Weather-resistant teak sofa set with Sunbrella cushions. Perfect for Indian weather conditions.",
        "price": 189999.00,
        "category": "Outdoor",
        "image_url": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800",
    },
    {
        "name": "Cane Outdoor Dining Set",
        "description": "All-weather rattan 6-piece dining set with tempered glass top. UV and monsoon resistant.",
        "price": 75999.00,
        "category": "Outdoor",
        "image_url": "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800",
    },
    {
        "name": "Macrame Swing Chair",
        "description": "Handwoven cotton macrame swing chair with teak spreader bar. Artisan made in Gujarat.",
        "price": 12999.00,
        "category": "Outdoor",
        "image_url": "https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800",
    },
    {
        "name": "Terracotta Fire Pit",
        "description": "Traditional terracotta fire pit with iron stand. Includes weather cover. Made in Khurja.",
        "price": 35999.00,
        "category": "Outdoor",
        "image_url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&w=800",
    },
    # Lighting Collection
    {
        "name": "Brass Pendant Cluster",
        "description": "Adjustable 5-globe pendant in antique brass finish. Perfect over dining tables.",
        "price": 18999.00,
        "category": "Lighting",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=800",
    },
    {
        "name": "Marble Base Floor Lamp",
        "description": "Iconic curved floor lamp with Makrana marble base. Adjustable height with dimmer.",
        "price": 24999.00,
        "category": "Lighting",
        "image_url": "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=800",
    },
    {
        "name": "Blue Pottery Table Lamps",
        "description": "Pair of Jaipur blue pottery table lamps with cotton shades. Hand-painted by artisans.",
        "price": 15999.00,
        "category": "Lighting",
        "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=800",
    },
    {
        "name": "Crystal Chandelier",
        "description": "Traditional crystal chandelier with 12 LED bulbs. Statement piece for entryways or dining rooms.",
        "price": 65999.00,
        "category": "Lighting",
        "image_url": "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=800",
        "image_urls": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=800,https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800",
    },
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    products = _with_fetched_images(SAMPLE_PRODUCTS)
    db = SessionLocal()
    try:
        existing = db.query(Product).all()
        if existing:
            images = _load_product_images()
            updated = 0
            for product in existing:
                if product.name in images:
                    _apply_image_data(product, images[product.name])
                    updated += 1
            db.commit()
            print(f"Products already seeded; updated {updated} image URLs from product_images.json.")
            return

        for item in products:
            db.add(Product(**item))
        db.commit()
        print(f"Seeded {len(products)} products.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
