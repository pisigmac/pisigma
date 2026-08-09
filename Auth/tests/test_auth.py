"""Auth service tests."""

from __future__ import annotations

import os

import jwt
import pytest
from fastapi.testclient import TestClient

os.environ["AUTH_DATABASE_URL"] = "sqlite+pysqlite:////tmp/pisigma_auth_test.db"
os.environ["AUTH_ISSUER"] = "https://auth.test.local"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "auth.db"
    monkeypatch.setenv("AUTH_DATABASE_URL", f"sqlite+pysqlite:///{db_path}")
    monkeypatch.setenv("AUTH_ISSUER", "https://auth.test.local")
    # Deployment-style default audiences (not hardcoded in Auth source)
    monkeypatch.setenv("AUTH_DEFAULT_AUDIENCES", "demo-app")
    from pisigma_auth.config import get_settings
    from pisigma_auth.crypto import _ensure_keys
    from pisigma_auth.db import init_db, reset_engine
    from pisigma_auth.app import create_app

    get_settings.cache_clear()
    _ensure_keys.cache_clear()
    reset_engine()
    init_db()
    app = create_app()
    with TestClient(app) as c:
        yield c
    get_settings.cache_clear()
    _ensure_keys.cache_clear()
    reset_engine()


def test_register_login_me_jwks(client: TestClient):
    r = client.post(
        "/v1/auth/register",
        json={"email": "admin@example.com", "password": "password123", "display_name": "Admin"},
    )
    assert r.status_code == 200, r.text
    tokens = r.json()
    assert tokens["access_token"]
    assert tokens["refresh_token"]

    me = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == "admin@example.com"
    assert body["is_platform_admin"] is True
    assert any(g["audience"] == "demo-app" for g in body["grants"])

    jwks = client.get("/.well-known/jwks.json")
    assert jwks.status_code == 200
    keys = jwks.json()["keys"]
    assert keys[0]["kty"] == "RSA"
    assert keys[0]["kid"]

    from pisigma_auth.crypto import get_key_material

    _, pub, _ = get_key_material()
    claims = jwt.decode(
        tokens["access_token"],
        pub,
        algorithms=["RS256"],
        issuer="https://auth.test.local",
        options={"verify_aud": False},
    )
    assert claims["email"] == "admin@example.com"
    assert "demo-app" in claims["aud"]
    assert claims["roles"]["demo-app"] == "admin"

    login = client.post(
        "/v1/auth/login",
        json={"email": "admin@example.com", "password": "password123"},
    )
    assert login.status_code == 200

    refresh = client.post("/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh.status_code == 200
    new_refresh = refresh.json()["refresh_token"]
    again = client.post("/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert again.status_code == 401

    logout = client.post("/v1/auth/logout", json={"refresh_token": new_refresh})
    assert logout.status_code == 200


def test_org_and_grant(client: TestClient):
    admin = client.post(
        "/v1/auth/register",
        json={"email": "boss@example.com", "password": "password123"},
    ).json()
    user = client.post(
        "/v1/auth/register",
        json={"email": "dev@example.com", "password": "password123"},
    ).json()
    me = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {user['access_token']}"}).json()
    user_id = me["id"]

    org = client.post(
        "/v1/orgs",
        headers={"Authorization": f"Bearer {admin['access_token']}"},
        json={"name": "Acme"},
    )
    assert org.status_code == 200

    grant = client.post(
        "/v1/admin/grants",
        headers={"Authorization": f"Bearer {admin['access_token']}"},
        json={"user_id": user_id, "audience": "other-product", "role": "viewer"},
    )
    assert grant.status_code == 200

    users = client.get(
        "/v1/admin/users",
        headers={"Authorization": f"Bearer {admin['access_token']}"},
    )
    assert users.status_code == 200
    assert len(users.json()) >= 2


def test_oauth_unconfigured(client: TestClient):
    r = client.get("/v1/oauth/google/start", follow_redirects=False)
    assert r.status_code == 501


def test_introspect(client: TestClient):
    tokens = client.post(
        "/v1/auth/register",
        json={"email": "x@example.com", "password": "password123"},
    ).json()
    ok = client.post("/introspect", json={"token": tokens["access_token"]})
    assert ok.status_code == 200
    assert ok.json()["active"] is True
    bad = client.post("/introspect", json={"token": "nope"})
    assert bad.json()["active"] is False


def test_no_product_coupling_in_defaults(client: TestClient, monkeypatch, tmp_path):
    """With empty AUTH_DEFAULT_AUDIENCES, signup creates no product grants."""
    from pisigma_auth.config import get_settings
    from pisigma_auth.crypto import _ensure_keys
    from pisigma_auth.db import init_db, reset_engine
    from pisigma_auth.app import create_app

    monkeypatch.setenv("AUTH_DATABASE_URL", f"sqlite+pysqlite:///{tmp_path / 'bare.db'}")
    monkeypatch.setenv("AUTH_DEFAULT_AUDIENCES", "")
    get_settings.cache_clear()
    _ensure_keys.cache_clear()
    reset_engine()
    init_db()
    with TestClient(create_app()) as c:
        tokens = c.post(
            "/v1/auth/register",
            json={"email": "bare@example.com", "password": "password123"},
        ).json()
        me = c.get("/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}).json()
        assert me["grants"] == []
    get_settings.cache_clear()
    _ensure_keys.cache_clear()
    reset_engine()
