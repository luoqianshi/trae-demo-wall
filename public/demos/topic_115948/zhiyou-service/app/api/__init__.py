"""API 路由"""
from fastapi import APIRouter
from app.api.v1 import router as v1_router

router = APIRouter()
router.include_router(v1_router)
