"""
FastAPI 应用主入口
创建应用实例，配置中间件，注册路由，初始化数据库
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.config import get_config
from app.database.connection import init_db, get_engine
from sqlalchemy import text
from app.routers import notes, folders, tags, health, settings, ai, asr as asr_router, import_data, weakness
from app.services import settings_service

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    启动时初始化数据库
    """
    logger.info("应用启动中...")

    # 创建数据目录（如果不存在）
    config = get_config()
    data_dir = Path(config.DATABASE_PATH).parent
    data_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"数据目录: {data_dir.resolve()}")

    # 初始化数据库（创建表）
    init_db()
    logger.info("数据库初始化完成")

    # 数据迁移：将旧的 schedule 类型通话记录迁移为 call_log
    try:
        engine = get_engine()
        with engine.begin() as conn:
            result = conn.execute(
                text("UPDATE notes SET note_type = 'call_log' WHERE note_type = 'schedule'")
            )
            if result.rowcount > 0:
                logger.info(f"数据迁移完成：{result.rowcount} 条 schedule 记录已更新为 call_log")
    except Exception as e:
        logger.warning(f"数据迁移跳过: {e}")

    # 初始化设置服务
    settings_service.init_settings(str(data_dir))  # 使用数据目录存放 settings.json
    saved = settings_service.load_settings()
    logger.info("设置加载完成")

    # 恢复已保存的 AI 配置
    ai_cfg = saved.get("ai", {})
    if ai_cfg.get("enabled") and ai_cfg.get("api_key"):
        from app.services.ai_service import ai_service
        ai_service.configure(
            provider=ai_cfg.get("provider", "deepseek"),
            api_key=ai_cfg["api_key"],
            model=ai_cfg.get("model") or None,
            base_url=ai_cfg.get("base_url") or None,
        )
        logger.info(f"AI 服务已恢复: {ai_cfg.get('provider')}")

    # 恢复已保存的 ASR 配置
    asr_cfg = saved.get("asr", {})
    if asr_cfg.get("enabled") and asr_cfg.get("engine") != "none":
        from app.services.asr_service import asr_service
        engine = asr_cfg.get("engine", "none")
        if engine == "funasr":
            asr_service.configure_funasr(asr_cfg.get("funasr_url", "http://127.0.0.1:10095"))
            logger.info("ASR 服务已恢复: FunASR")
        elif engine == "tencent":
            asr_service.configure_tencent(
                asr_cfg.get("tencent_secret_id", ""),
                asr_cfg.get("tencent_secret_key", ""),
            )
            logger.info("ASR 服务已恢复: 腾讯云")

    yield

    # 应用关闭时的清理逻辑
    logger.info("应用关闭")


# 创建 FastAPI 实例
app = FastAPI(
    title="进化镜 API",
    description="进化镜 - 个人知识管理后端服务",
    version="0.1.0",
    lifespan=lifespan,
)

# 添加 CORS 中间件（开发阶段允许所有来源）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router)
app.include_router(notes.router)
app.include_router(folders.router)
app.include_router(tags.router)
app.include_router(settings.router)
app.include_router(ai.router)
app.include_router(asr_router.router)
app.include_router(import_data.router)
app.include_router(weakness.router)

logger.info("路由注册完成")


# 提供网页版前端（避免 file:// 协议的安全限制）
WEBAPP_PATH = Path(__file__).parent.parent.parent / "webapp.html"

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def serve_webapp():
    """在根路径提供网页版前端"""
    if WEBAPP_PATH.exists():
        return HTMLResponse(WEBAPP_PATH.read_text(encoding="utf-8"))
    return HTMLResponse("<h1>webapp.html 未找到</h1>", status_code=404)