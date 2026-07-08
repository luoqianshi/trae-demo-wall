"""
Authentication API.

- POST /auth/login    -> {token, user}
- GET  /auth/me       -> current user (from Authorization: Bearer <token>)
- POST /auth/logout   -> success (frontend clears the token)
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import (
    create_access_token,
    get_current_user,
    verify_password,
)
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_to_dict(user: User) -> dict:
    """Serialize a User ORM object to a JSON-friendly dict (no password)."""
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "permissions": user.permissions,
        "notify_levels": user.notify_levels,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


@router.post("/login")
def login(credentials: dict, db: Session = Depends(get_db)):
    """Authenticate a user with {email, password} and return a JWT + user."""
    email = (credentials.get("email") or "").strip()
    password = credentials.get("password") or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="邮箱和密码不能为空")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    # Update last login timestamp
    user.last_login = datetime.now()
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    })

    return {"token": token, "user": _user_to_dict(user)}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the current user's info, resolved from the JWT in the header."""
    user_id = current_user.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return _user_to_dict(user)


@router.post("/logout")
def logout():
    """Stateless logout - the frontend simply discards the token.

    The server has no session to invalidate, so we just acknowledge success.
    """
    return {"ok": True, "message": "已退出登录"}
