"""
Authentication & authorization helpers.

- Password hashing (sha256 + static salt)
- JWT token creation / verification
- FastAPI dependencies: get_current_user, require_role(*roles)

Role hierarchy (higher number = higher privilege):
    admin(4) > caregiver(3) > family(2) > viewer(1)
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Callable, Dict

import jwt
from fastapi import Depends, HTTPException, Request

# ---------------------------------------------------------------------------
# Auth configuration
# ---------------------------------------------------------------------------
SECRET_KEY = "careai_secret_key_2026"
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7
PASSWORD_SALT = "careai_2026"

# Role hierarchy: higher number == more privileged
ROLE_LEVELS: Dict[str, int] = {
    "admin": 4,
    "caregiver": 3,
    "family": 2,
    "viewer": 1,
}

# Set of all known roles (derived from the hierarchy above)
VALID_ROLES = set(ROLE_LEVELS.keys())


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hash a plaintext password with the static salt using sha256.

    Stored value = sha256((password + "careai_2026")).hexdigest()
    """
    if password is None:
        password = ""
    return hashlib.sha256((password + PASSWORD_SALT).encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plaintext password against the stored sha256 hash."""
    if not hashed_password:
        return False
    return hash_password(plain_password) == hashed_password


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------
def create_access_token(data: dict) -> str:
    """Create a signed JWT carrying the given payload (user info).

    Adds an `exp` claim of TOKEN_EXPIRE_DAYS days from now.
    """
    to_encode = dict(data or {})
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException(401) on any failure."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token 已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的 Token，请重新登录")


def _extract_bearer_token(request: Request) -> str:
    """Pull the raw JWT out of the `Authorization: Bearer <token>` header."""
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="未提供认证信息，请先登录")
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="认证格式错误，请使用 `Bearer <token>`")
    return parts[1]


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------
def get_current_user(request: Request) -> dict:
    """FastAPI dependency: parse the JWT from the Authorization header and
    return the decoded user payload (a dict with user_id, name, email, role).

    Raises HTTPException(401) if the token is missing or invalid.
    """
    token = _extract_bearer_token(request)
    return decode_token(token)


def require_role(*roles) -> Callable:
    """Return a FastAPI dependency that enforces role-based access control.

    A request is allowed when the caller's role is in ``roles`` OR when the
    caller's privilege level is at least the minimum level among ``roles``
    (so ``require_role("caregiver")`` also admits ``admin``).

    Otherwise raises HTTPException(403).
    """
    allowed = set(roles)

    def _checker(current_user: dict = Depends(get_current_user)) -> dict:
        role = (current_user or {}).get("role", "viewer")

        # Explicit match always passes.
        if role in allowed:
            return current_user

        # Level-based fallback: admit any role with >= the least-privileged
        # allowed role (admin > caregiver > family > viewer).
        allowed_levels = [ROLE_LEVELS.get(r, 0) for r in allowed]
        user_level = ROLE_LEVELS.get(role, 0)
        if allowed_levels and user_level >= min(allowed_levels):
            return current_user

        raise HTTPException(status_code=403, detail="权限不足，无法执行此操作")

    return _checker
