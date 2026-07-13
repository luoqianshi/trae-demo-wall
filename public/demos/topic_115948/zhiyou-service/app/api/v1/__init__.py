"""API v1 路由"""
from fastapi import APIRouter
from app.api.v1 import auth, friends, chat, memories

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(friends.router)
router.include_router(chat.router)
router.include_router(memories.router)
