from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .routers import warnings_router, devices_router, sensors_router, analysis_router

# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="灾害预警与趋势预测平台 API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(warnings_router, prefix=settings.API_PREFIX)
app.include_router(devices_router, prefix=settings.API_PREFIX)
app.include_router(sensors_router, prefix=settings.API_PREFIX)
app.include_router(analysis_router, prefix=settings.API_PREFIX)

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    init_db()

@app.get("/")
def root():
    """根路径"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "healthy"}

# 获取 API 路由信息
@app.get("/api/info")
def get_api_info():
    """获取 API 信息"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "灾害预警与趋势预测平台 API",
        "endpoints": {
            "warnings": f"{settings.API_PREFIX}/warnings",
            "devices": f"{settings.API_PREFIX}/devices",
            "sensors": f"{settings.API_PREFIX}/sensors",
            "analysis": f"{settings.API_PREFIX}/analysis"
        }
    }
