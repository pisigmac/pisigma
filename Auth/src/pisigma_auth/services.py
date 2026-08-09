"""Domain helpers for users, tokens, orgs."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from pisigma_auth.config import Settings, get_settings
from pisigma_auth.crypto import (
    hash_password,
    hash_token,
    issue_access_token,
    new_refresh_token,
    verify_password,
)
from pisigma_auth.models import Identity, Membership, Org, ProductGrant, RefreshToken, User
from pisigma_auth.schemas import GrantOut, OrgOut, TokenResponse, UserOut


def user_to_out(user: User) -> UserOut:
    orgs = [
        OrgOut(
            id=m.org.id,
            name=m.org.name,
            role=m.role,
            workspace_id=m.workspace_id,
        )
        for m in user.memberships
    ]
    grants = [GrantOut(audience=g.audience, role=g.role) for g in user.grants]
    return UserOut(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_platform_admin=user.is_platform_admin,
        orgs=orgs,
        grants=grants,
    )


def primary_org(user: User) -> Membership | None:
    if not user.memberships:
        return None
    owners = [m for m in user.memberships if m.role == "owner"]
    return owners[0] if owners else user.memberships[0]


def issue_tokens(db: Session, user: User, settings: Settings | None = None) -> TokenResponse:
    settings = settings or get_settings()
    membership = primary_org(user)
    roles = {g.audience: g.role for g in user.grants}
    audiences = list(roles.keys())
    access = issue_access_token(
        sub=user.id,
        email=user.email,
        org_id=membership.org_id if membership else None,
        workspace_id=membership.workspace_id if membership else None,
        audiences=audiences,
        roles=roles,
        settings=settings,
    )
    refresh = new_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days),
        )
    )
    db.commit()
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.access_token_minutes * 60,
    )


def ensure_default_grant(
    db: Session,
    user: User,
    audience: str,
    role: str = "operator",
) -> None:
    existing = next((g for g in user.grants if g.audience == audience), None)
    if existing:
        return
    grant = ProductGrant(user_id=user.id, audience=audience, role=role)
    db.add(grant)
    db.commit()
    db.refresh(user)


def _apply_default_grants(db: Session, user: User, *, role: str) -> None:
    settings = get_settings()
    for audience in settings.default_audience_list():
        db.add(ProductGrant(user_id=user.id, audience=audience, role=role))


def create_user_with_password(
    db: Session,
    *,
    email: str,
    password: str,
    display_name: str | None = None,
    is_platform_admin: bool = False,
    default_role: str | None = None,
) -> User:
    settings = get_settings()
    role = default_role or ("admin" if is_platform_admin else settings.default_role)
    user = User(
        email=email.lower().strip(),
        password_hash=hash_password(password),
        display_name=display_name,
        is_platform_admin=is_platform_admin,
    )
    db.add(user)
    db.flush()
    db.add(Identity(user_id=user.id, provider="password", provider_subject=user.email))
    org = Org(name=f"{user.email}'s org")
    db.add(org)
    db.flush()
    db.add(Membership(org_id=org.id, user_id=user.id, role="owner", workspace_id=org.id))
    _apply_default_grants(db, user, role=role)
    db.commit()
    db.refresh(user)
    return user


def authenticate_password(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email.lower().strip()).one_or_none()
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def find_or_create_oauth_user(
    db: Session,
    *,
    provider: str,
    provider_subject: str,
    email: str,
    display_name: str | None,
) -> User:
    identity = (
        db.query(Identity)
        .filter(Identity.provider == provider, Identity.provider_subject == provider_subject)
        .one_or_none()
    )
    if identity:
        return identity.user

    email_l = email.lower().strip()
    user = db.query(User).filter(User.email == email_l).one_or_none()
    if user is None:
        settings = get_settings()
        user = User(email=email_l, display_name=display_name, password_hash=None)
        db.add(user)
        db.flush()
        org = Org(name=f"{email_l}'s org")
        db.add(org)
        db.flush()
        db.add(Membership(org_id=org.id, user_id=user.id, role="owner", workspace_id=org.id))
        _apply_default_grants(db, user, role=settings.default_role)
    db.add(Identity(user_id=user.id, provider=provider, provider_subject=provider_subject))
    db.commit()
    db.refresh(user)
    return user


def rotate_refresh(db: Session, refresh_token: str, settings: Settings | None = None) -> TokenResponse | None:
    settings = settings or get_settings()
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(refresh_token)).one_or_none()
    if not row or row.revoked:
        return None
    if row.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return None
    row.revoked = True
    user = db.query(User).filter(User.id == row.user_id).one()
    db.commit()
    return issue_tokens(db, user, settings)


def revoke_refresh(db: Session, refresh_token: str) -> bool:
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_token(refresh_token)).one_or_none()
    if not row:
        return False
    row.revoked = True
    db.commit()
    return True
