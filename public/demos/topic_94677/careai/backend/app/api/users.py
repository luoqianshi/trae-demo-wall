"""
User management API.

- GET    /users/                       -> list all users
- POST   /users/                       -> create user {name, email, password, role, notify_levels}
- PUT    /users/{user_id}              -> update user info
- DELETE /users/{user_id}              -> delete user
- POST   /users/{user_id}/reset-password -> reset password {password}

All mutating endpoints require an admin role. Passwords are stored as
sha256((password + "careai_2026")).hexdigest().
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import (
    VALID_ROLES,
    get_current_user,
    hash_password,
    require_role,
)
from app.models.models import User

router = APIRouter(prefix="/users", tags=["users"])

# Fields a client is allowed to set/update directly (password handled separately).
_UPDATABLE_FIELDS = ("name", "email", "role", "permissions", "notify_levels")


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


@router.get("/")
def list_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return all users (requires authentication)."""
    users = db.query(User).order_by(User.id).all()
    return [_user_to_dict(u) for u in users]


@router.post("/")
def create_user(
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Create a new user. Password is hashed with the static salt before storage."""
    name = (user_data.get("name") or "").strip()
    email = (user_data.get("email") or "").strip()
    password = user_data.get("password") or ""
    role = (user_data.get("role") or "viewer").strip()
    notify_levels = user_data.get("notify_levels") or "P0"

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="name, email, password 不能为空")
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"无效的角色: {role}，可选: {', '.join(sorted(VALID_ROLES))}",
        )
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="该邮箱已存在")

    user = User(
        name=name,
        email=email,
        password=hash_password(password),
        role=role,
        permissions=user_data.get("permissions", "") or "",
        notify_levels=notify_levels,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_to_dict(user)


@router.put("/{user_id}")
def update_user(
    user_id: int,
    updates: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Update an existing user's fields. Optional `password` is hashed if provided."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    for field in _UPDATABLE_FIELDS:
        if field in updates and updates[field] is not None:
            value = updates[field]
            if field == "role" and value not in VALID_ROLES:
                raise HTTPException(
                    status_code=400,
                    detail=f"无效的角色: {value}，可选: {', '.join(sorted(VALID_ROLES))}",
                )
            if field == "email":
                value = (value or "").strip()
                # Ensure email uniqueness if it is being changed.
                existing = db.query(User).filter(User.email == value).first()
                if existing and existing.id != user.id:
                    raise HTTPException(status_code=400, detail="该邮箱已存在")
            setattr(user, field, value)

    # Optional password change.
    new_password = updates.get("password")
    if new_password:
        user.password = hash_password(new_password)

    db.commit()
    db.refresh(user)
    return _user_to_dict(user)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Delete a user. The last admin account cannot be removed."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # Guard: never delete the last admin (would lock everyone out).
    if user.role == "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="不能删除最后一个管理员账户")

    db.delete(user)
    db.commit()
    return {"ok": True}


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    """Reset a user's password. Body: {password: <new password>}."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    new_password = body.get("password") or ""
    if not new_password:
        raise HTTPException(status_code=400, detail="新密码不能为空")

    user.password = hash_password(new_password)
    db.commit()
    return {"ok": True}
