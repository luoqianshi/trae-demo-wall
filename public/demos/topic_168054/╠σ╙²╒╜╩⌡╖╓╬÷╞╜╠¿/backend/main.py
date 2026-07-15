"""FastAPI 应用入口"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS, HOST, PORT, UPLOAD_DIR
from storage.database import init_db
from api.upload import router as upload_router
from api.analysis import router as analysis_router
from api.data import router as data_router
from api.websocket import router as websocket_router

# 创建 FastAPI 应用
app = FastAPI(
    title="足球战术分析工具 API",
    description="基于 YOLOv8 和 BoxMOT 的足球比赛视频战术分析后端",
    version="1.0.0",
)

# 配置 CORS（允许前端访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载所有 API 路由
app.include_router(upload_router)
app.include_router(analysis_router)
app.include_router(data_router)
app.include_router(websocket_router)

# 挂载静态文件目录（用于访问上传的视频文件）
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    init_db()
    print(f"数据库已初始化")
    print(f"上传目录: {UPLOAD_DIR}")


@app.get("/")
async def root():
    """根路径，返回 API 信息"""
    return {
        "name": "足球战术分析工具 API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=True,
    )
