"""JWKS and token introspection."""

from __future__ import annotations

from fastapi import APIRouter

from pisigma_auth.crypto import decode_access_token, public_jwk
from pisigma_auth.schemas import IntrospectRequest, IntrospectResponse

router = APIRouter(tags=["jwks"])


@router.get("/.well-known/jwks.json")
def jwks() -> dict:
    return {"keys": [public_jwk()]}


@router.post("/introspect", response_model=IntrospectResponse)
def introspect(body: IntrospectRequest) -> IntrospectResponse:
    try:
        claims = decode_access_token(body.token)
        return IntrospectResponse(active=True, claims=claims)
    except Exception:
        return IntrospectResponse(active=False, claims=None)
