"""Pydantic request/response schemas."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class GrantOut(BaseModel):
    audience: str
    role: str


class OrgOut(BaseModel):
    id: str
    name: str
    role: str
    workspace_id: str | None = None


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str | None
    is_platform_admin: bool
    orgs: list[OrgOut] = Field(default_factory=list)
    grants: list[GrantOut] = Field(default_factory=list)


class CreateOrgRequest(BaseModel):
    name: str = Field(min_length=1)


class AddMemberRequest(BaseModel):
    user_id: str
    role: str = "member"
    workspace_id: str | None = None


class GrantRequest(BaseModel):
    user_id: str
    audience: str
    role: str


class IntrospectRequest(BaseModel):
    token: str


class IntrospectResponse(BaseModel):
    active: bool
    claims: dict | None = None
