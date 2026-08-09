"""Auth service configuration."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AUTH_", env_file=".env", extra="ignore")

    database_url: str = "sqlite+pysqlite:////tmp/pisigma_auth.db"
    issuer: str = "https://auth.pisigma.local"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8787"
    access_token_minutes: int = 60
    refresh_token_days: int = 30
    open_registration: bool = True
    spa_callback_url: str = "http://localhost:5173/auth/callback"
    jwt_private_key: str = ""
    jwt_public_key: str = ""
    jwt_private_key_file: str = ""
    jwt_public_key_file: str = ""
    jwt_kid: str = "pisigma-auth-1"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8090/v1/oauth/google/callback"
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:8090/v1/oauth/github/callback"
    host: str = "127.0.0.1"
    port: int = 8090
    # Comma-separated product audiences to auto-grant on signup (empty = none).
    # Set per deployment via AUTH_DEFAULT_AUDIENCES — Auth itself is product-agnostic.
    default_audiences: str = ""
    default_role: str = "operator"

    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def default_audience_list(self) -> list[str]:
        return [a.strip() for a in self.default_audiences.split(",") if a.strip()]

    def private_key_pem(self) -> str:
        if self.jwt_private_key.strip():
            return self.jwt_private_key.replace("\\n", "\n")
        if self.jwt_private_key_file:
            return Path(self.jwt_private_key_file).read_text(encoding="utf-8")
        return ""

    def public_key_pem(self) -> str:
        if self.jwt_public_key.strip():
            return self.jwt_public_key.replace("\\n", "\n")
        if self.jwt_public_key_file:
            return Path(self.jwt_public_key_file).read_text(encoding="utf-8")
        return ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
