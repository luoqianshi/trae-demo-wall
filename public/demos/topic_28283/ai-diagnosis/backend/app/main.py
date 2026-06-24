from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.routers import monitor, alerts, diagnosis, cases, proposal
from app.config import get_settings

app = FastAPI(
    title="AI炼化智诊",
    description="化工装置异常智能诊断与技改方案助手",
    version="1.0.0",
)

# 注册路由
app.include_router(monitor.router)
app.include_router(alerts.router)
app.include_router(diagnosis.router)
app.include_router(cases.router)
app.include_router(proposal.router)

# 静态文件
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def root():
    """返回前端页面"""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "AI炼化智诊 API", "docs": "/docs"}


@app.get("/api/config")
async def get_config():
    """获取前端配置信息"""
    settings = get_settings()
    return {
        "llm_mock": settings.llm_mock,
        "llm_model": settings.llm_model,
    }
