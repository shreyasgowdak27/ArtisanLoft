"""FastAPI application factory.

Startup does NOT create tables via SQLAlchemy — that is Alembic's job.
`Base.metadata.create_all()` is intentionally absent; always run
`alembic upgrade head` before starting the app.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.health import router as health_router
from app.routers.orders import router as orders_router
from app.routers.products import router as products_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Nothing to do on startup: schema is managed by Alembic.
    yield


app = FastAPI(
    title="ArtisanLoft Furniture API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(auth_router)
app.include_router(health_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "ArtisanLoft API v2 — Postgres edition"}
