"""
健康检查路由模块
提供服务健康状态接口
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["系统"])


@router.get("/health", summary="健康检查")
def health_check():
    """
    检查服务是否正常运行
    """
    return {"status": "ok", "version": "0.1.0"}