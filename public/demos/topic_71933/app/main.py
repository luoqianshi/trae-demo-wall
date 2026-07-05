"""FastAPI 应用入口。"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.api.routes import router
from app.api.browser_routes import router as browser_router
from app.core.config import get_settings
from app.core.logger import setup_logger


def _get_static_dir() -> Path:
    """获取静态文件目录，兼容 PyInstaller 打包。"""
    if getattr(sys, 'frozen', False):
        # PyInstaller 打包后：_MEIPASS 临时目录中的 static
        return Path(sys._MEIPASS) / "static"
    return Path(__file__).resolve().parent.parent / "static"


# 单文件版覆盖：由 build_single_file.py 设置，不为空时替代静态文件
_EMBEDDED_HTML: bytes | None = None

STATIC_DIR = _get_static_dir()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动/关闭。"""
    setup_logger()
    settings = get_settings()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    settings.temp_dir.mkdir(parents=True, exist_ok=True)
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    yield


def create_app() -> FastAPI:
    """创建 FastAPI 应用实例。"""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="多平台短视频一键解析、去重、分发工具",
        version="0.2.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    app.include_router(browser_router)

    # 静态文件
    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    @app.get("/")
    async def root():
        if _EMBEDDED_HTML is not None:
            from fastapi.responses import HTMLResponse
            return HTMLResponse(content=_EMBEDDED_HTML.decode("utf-8"))
        index_path = STATIC_DIR / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return {"message": "一键搬运 API 服务运行中", "docs": "/docs"}

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(exc) if str(exc) else "服务器内部错误"},
        )

    return app


app = create_app()
