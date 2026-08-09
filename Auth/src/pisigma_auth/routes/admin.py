"""Admin user and product-grant management."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from pisigma_auth.db import get_db
from pisigma_auth.models import ProductGrant, User
from pisigma_auth.routes.auth import current_user
from pisigma_auth.schemas import GrantRequest, UserOut
from pisigma_auth.services import user_to_out

router = APIRouter(prefix="/admin", tags=["admin"])


def require_platform_admin(user: User = Depends(current_user)) -> User:
    if not user.is_platform_admin:
        raise HTTPException(status_code=403, detail="Platform admin required")
    return user


@router.get("/users", response_model=list[UserOut])
def list_users(
    _: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
) -> list[UserOut]:
    users = db.query(User).order_by(User.created_at).all()
    return [user_to_out(u) for u in users]


@router.post("/grants")
def set_grant(
    body: GrantRequest,
    _: User = Depends(require_platform_admin),
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.id == body.user_id).one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.role not in {"admin", "operator", "viewer"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    grant = (
        db.query(ProductGrant)
        .filter(ProductGrant.user_id == body.user_id, ProductGrant.audience == body.audience)
        .one_or_none()
    )
    if grant:
        grant.role = body.role
    else:
        db.add(ProductGrant(user_id=body.user_id, audience=body.audience, role=body.role))
    db.commit()
    return {"ok": True, "user_id": body.user_id, "audience": body.audience, "role": body.role}
