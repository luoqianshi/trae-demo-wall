"""用户 API 路由"""
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..utils.dependencies import get_current_user
from ..models.user import User
from ..schemas.user import UserResponse, UpdateProfileRequest
from ..services.user_service import search_users, update_profile, save_avatar

router = APIRouter(prefix="/api/users", tags=["用户"])


@router.get("/search", response_model=list[UserResponse])
async def search(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    users = await search_users(db, q, current_user.id)
    return [
        UserResponse(
            id=u.id, account=u.account, username=u.username,
            avatar_url=u.avatar_url, status=u.status,
            created_at=str(u.created_at),
        ) for u in users
    ]


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id, account=current_user.account,
        username=current_user.username, avatar_url=current_user.avatar_url,
        status=current_user.status, created_at=str(current_user.created_at),
    )


@router.put("/me/profile", response_model=UserResponse)
async def update_my_profile(
    req: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = await update_profile(db, current_user, req.username)
    return UserResponse(
        id=user.id, account=user.account, username=user.username,
        avatar_url=user.avatar_url, status=user.status,
        created_at=str(user.created_at),
    )


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await save_avatar(current_user, file)
    current_user.avatar_url = url
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return {"avatar_url": url}
