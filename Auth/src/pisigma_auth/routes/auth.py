"""Auth routes: register, login, refresh, logout, me."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from pisigma_auth.config import get_settings
from pisigma_auth.crypto import decode_access_token
from pisigma_auth.db import get_db
from pisigma_auth.models import User
from pisigma_auth.schemas import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from pisigma_auth.services import (
    authenticate_password,
    create_user_with_password,
    issue_tokens,
    revoke_refresh,
    rotate_refresh,
    user_to_out,
)

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        claims = decode_access_token(creds.credentials)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    user = db.query(User).filter(User.id == claims["sub"]).one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    settings = get_settings()
    if not settings.open_registration:
        raise HTTPException(status_code=403, detail="Registration is closed")
    existing = db.query(User).filter(User.email == body.email.lower().strip()).one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    is_first = db.query(User).count() == 0
    user = create_user_with_password(
        db,
        email=body.email,
        password=body.password,
        display_name=body.display_name,
        is_platform_admin=is_first,
        default_role="admin" if is_first else "operator",
    )
    return issue_tokens(db, user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = authenticate_password(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return issue_tokens(db, user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    tokens = rotate_refresh(db, body.refresh_token)
    if not tokens:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return tokens


@router.post("/logout")
def logout(body: LogoutRequest, db: Session = Depends(get_db)) -> dict:
    revoke_refresh(db, body.refresh_token)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> UserOut:
    return user_to_out(user)
