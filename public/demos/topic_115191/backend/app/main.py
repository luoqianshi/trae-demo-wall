"""FastAPI 主入口。"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.agents.events import emit_event
from app.api.assets import router as assets_router
from app.api.director_stages import router as director_stages_router
from app.api.library import router as library_router
from app.api.projects import router as projects_router
from app.api.scripts import router as scripts_router
from app.api.storyboards import router as storyboards_router
from app.api.videos import router as videos_router
from app.api.ws import manager
from app.config import settings
from app.database import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("数据库已初始化")
    yield


app = FastAPI(title="AI 短剧无限画布", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
app.include_router(projects_router)
app.include_router(scripts_router)
app.include_router(assets_router)
app.include_router(storyboards_router)
app.include_router(director_stages_router)
app.include_router(videos_router)
app.include_router(library_router)

# 静态文件：访问生成的图片 /storage/{project_id}/xxx.png
app.mount("/storage", StaticFiles(directory=str(settings.storage_dir)), name="storage")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.websocket("/api/ws/{project_id}")
async def ws_endpoint(websocket: WebSocket, project_id: str) -> None:
    await manager.connect(project_id, websocket)
    try:
        while True:
            # 保持连接，接收客户端心跳（暂不处理客户端消息）
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(project_id, websocket)
        logger.info("WS 断开: project=%s", project_id)


# ===== 前端静态文件（生产构建）=====
# 开发时由 Vite dev server (5173) 提供前端；生产构建后由后端统一服务
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """SPA 回退：非 API/storage 的 GET 请求返回前端文件或 index.html。"""
        file_path = (frontend_dist / full_path).resolve()
        # 安全检查：防止路径穿越
        if str(file_path).startswith(str(frontend_dist)) and file_path.is_file():
            return FileResponse(str(file_path))
        # SPA 回退
        index = frontend_dist / "index.html"
        return FileResponse(str(index))
    logger.info("前端静态文件已挂载: %s", frontend_dist)
else:
    logger.warning("前端 dist 目录不存在（开发模式），请运行 npm run build")
