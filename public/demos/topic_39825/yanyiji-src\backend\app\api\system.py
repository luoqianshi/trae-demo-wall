"""健康检查 API"""
from fastapi import APIRouter

router = APIRouter(tags=["系统"])


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "研易记 API", "version": "0.1.0"}


@router.get("/api/v1/quota")
async def get_quota():
    """查询用户配额（TODO: 接入认证后实现）"""
    return {
        "total": 50,
        "used": 0,
        "remaining": 50,
        "reset_at": "2026-06-23T00:00:00Z",
    }