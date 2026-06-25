"""
System health and info routes.
"""

import time
from typing import Optional
from fastapi import APIRouter, Header

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
async def health_check():
    """Service health check (no auth required)."""
    return {"status": "ok", "timestamp": time.time()}


@router.get("/system/info")
async def system_info(authorization: Optional[str] = Header(default=None)):
    """Get system resource usage."""
    router.state.check_auth(authorization)
    import psutil
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    return {
        "cpuPercent": psutil.cpu_percent(interval=0.1),
        "memory": {
            "total": mem.total,
            "used": mem.used,
            "percent": mem.percent,
        },
        "disk": {
            "total": disk.total,
            "used": disk.used,
            "percent": disk.percent,
        },
    }
