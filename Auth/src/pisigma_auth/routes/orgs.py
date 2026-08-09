"""Org tenancy routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from pisigma_auth.db import get_db
from pisigma_auth.models import Membership, Org, User
from pisigma_auth.routes.auth import current_user
from pisigma_auth.schemas import AddMemberRequest, CreateOrgRequest, OrgOut

router = APIRouter(prefix="/orgs", tags=["orgs"])


@router.get("", response_model=list[OrgOut])
def list_orgs(user: User = Depends(current_user)) -> list[OrgOut]:
    return [
        OrgOut(id=m.org.id, name=m.org.name, role=m.role, workspace_id=m.workspace_id)
        for m in user.memberships
    ]


@router.post("", response_model=OrgOut)
def create_org(
    body: CreateOrgRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> OrgOut:
    org = Org(name=body.name)
    db.add(org)
    db.flush()
    db.add(Membership(org_id=org.id, user_id=user.id, role="owner", workspace_id=org.id))
    db.commit()
    return OrgOut(id=org.id, name=org.name, role="owner", workspace_id=org.id)


@router.post("/{org_id}/members")
def add_member(
    org_id: str,
    body: AddMemberRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> dict:
    membership = (
        db.query(Membership)
        .filter(Membership.org_id == org_id, Membership.user_id == user.id)
        .one_or_none()
    )
    if not membership or membership.role not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Not allowed")
    target = db.query(User).filter(User.id == body.user_id).one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    existing = (
        db.query(Membership)
        .filter(Membership.org_id == org_id, Membership.user_id == body.user_id)
        .one_or_none()
    )
    if existing:
        existing.role = body.role
        existing.workspace_id = body.workspace_id
    else:
        db.add(
            Membership(
                org_id=org_id,
                user_id=body.user_id,
                role=body.role,
                workspace_id=body.workspace_id,
            )
        )
    db.commit()
    return {"ok": True}
