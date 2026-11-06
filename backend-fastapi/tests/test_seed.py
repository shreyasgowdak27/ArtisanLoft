import asyncio

from app import seed as seed_module


def test_seed_refuses_production_even_with_confirmation(monkeypatch, capsys):
    monkeypatch.setattr(seed_module.settings, "ENV", "production")
    monkeypatch.setattr(
        seed_module,
        "seed",
        lambda: (_ for _ in ()).throw(AssertionError("database should not be touched")),
    )

    result = seed_module.main(["--confirm"])

    assert result == 1
    assert "production" in capsys.readouterr().err


def test_seed_requires_confirmation(monkeypatch, capsys):
    monkeypatch.setattr(seed_module.settings, "ENV", "development")
    monkeypatch.setattr(
        seed_module,
        "seed",
        lambda: (_ for _ in ()).throw(AssertionError("database should not be touched")),
    )

    result = seed_module.main([])

    assert result == 2
    assert "--confirm" in capsys.readouterr().err


def test_seed_is_idempotent_and_keeps_images_and_categories(monkeypatch):
    class Result:
        def __init__(self, product):
            self.product = product

        def scalar_one_or_none(self):
            return self.product

    class Database:
        def __init__(self):
            self.products = {}
            self.add_count = 0

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def execute(self, statement):
            slug = statement.whereclause.right.value
            return Result(self.products.get(slug))

        def add(self, product):
            self.add_count += 1
            self.products[product.slug] = product

        async def commit(self):
            pass

    class Engine:
        async def dispose(self):
            pass

    db = Database()
    monkeypatch.setattr(seed_module, "create_async_engine", lambda *args, **kwargs: Engine())
    monkeypatch.setattr(
        seed_module,
        "async_sessionmaker",
        lambda **kwargs: lambda: db,
    )

    asyncio.run(seed_module.seed())
    first_product_objects = dict(db.products)
    asyncio.run(seed_module.seed())

    assert len(db.products) == 30
    assert db.add_count == 30
    assert all(db.products[slug] is product for slug, product in first_product_objects.items())
    assert all(product.image_url for product in db.products.values())
    assert all(product.category for product in db.products.values())
