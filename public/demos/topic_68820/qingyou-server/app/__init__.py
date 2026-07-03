"""FastAPI 应用工厂"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect

from app.config import Config
from app.database import engine, SessionLocal, Base
from app.seed import seed_database


def _needs_migration():
    """检测旧数据库是否缺少新字段（groups/transport/intensity 等）或数据版本过期。

    create_all 只建新表、不会给已存在的表加列，因此schema 变更后需手动重建。
    同时检测 seed 版本号，描述文案变更时也触发重建。
    """
    SEED_VERSION = 4  # 每次修改 seed 数据内容时递增此版本号
    insp = inspect(engine)

    # 版本表检测
    if insp.has_table('_seed_meta'):
        with engine.connect() as conn:
            from sqlalchemy import text
            try:
                row = conn.execute(text('SELECT version FROM _seed_meta LIMIT 1')).fetchone()
                if row and row[0] == SEED_VERSION:
                    # 版本一致，仅检查列是否存在
                    pass
                else:
                    return True
            except Exception:
                return True
    else:
        return True  # 无版本表，需要重建

    if not insp.has_table('activities'):
        return False  # 全新数据库，无需迁移
    cols = {c['name'] for c in insp.get_columns('activities')}
    if 'groups' not in cols or 'transport' not in cols or 'intensity' not in cols:
        return True
    if 'location' not in cols or 'address' not in cols:
        return True
    plan_cols = {c['name'] for c in insp.get_columns('plans')} if insp.has_table('plans') else set()
    if 'group' not in plan_cols or 'budget_ceiling' not in plan_cols:
        return True
    return False


def _write_seed_version():
    """写入种子数据版本号"""
    SEED_VERSION = 4
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text('CREATE TABLE IF NOT EXISTS _seed_meta (version INTEGER)'))
        conn.execute(text('DELETE FROM _seed_meta'))
        conn.execute(text('INSERT INTO _seed_meta (version) VALUES (:v)'), {'v': SEED_VERSION})
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时建表并写入种子数据"""
    # schema 变更时自动重建表（演示项目，丢弃旧数据可接受）
    if _needs_migration():
        print('[db] 检测到 schema 变更，重建数据表…')
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    _write_seed_version()
    yield


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    # CORS 跨域支持
    app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    # 自定义 HTTPException 响应格式，与 Flask 版本保持一致：{"error": "..."}
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        return JSONResponse(
            status_code=exc.status_code,
            content={'error': exc.detail},
        )

    # 注册 API 路由（先注册，避免被静态文件 mount 捕获）
    from app.routes import api_bp
    app.include_router(api_bp, prefix='/api')

    # 挂载前端静态文件（html=True 使 / 自动返回 index.html）
    app.mount('/', StaticFiles(directory=Config.STATIC_FOLDER, html=True), name='static')

    return app
