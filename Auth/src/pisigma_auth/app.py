"""FastAPI application factory."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pisigma_auth import __version__
from pisigma_auth.config import get_settings
from pisigma_auth.db import init_db
from pisigma_auth.routes import admin_router, auth_router, jwks_router, oauth_router, orgs_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="PiSigma Auth",
        version=__version__,
        description="Shared identity microservice for PiSigma products (JWKS + OAuth + orgs).",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok", "service": "pisigma-auth", "version": __version__}

    # JWKS at root and under /v1 for product docs
    app.include_router(jwks_router)
    app.include_router(auth_router, prefix="/v1")
    app.include_router(oauth_router, prefix="/v1")
    app.include_router(orgs_router, prefix="/v1")
    app.include_router(admin_router, prefix="/v1")
    app.include_router(jwks_router, prefix="/v1")
    return app


app = create_app()
