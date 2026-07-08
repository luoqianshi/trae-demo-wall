"""FastAPI 应用入口"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi.middleware import SlowAPIMiddleware
from .limiter import limiter
from .database import init_db, get_db, get_db_session
from .routers import auth, users, friends, messages
from .websocket.manager import manager
from .websocket.handlers import handle_websocket_message
from .utils.security import decode_access_token
from .services.friend_service import get_friend_ids

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时初始化数据库，关闭时清理连接"""
    await init_db()
    logger.info("Chat Platform 后端启动 - http://127.0.0.1:8000")
    yield
    # 优雅关闭：通知在线用户
    logger.info("正在关闭服务...")
    for user_id in list(manager.active_connections.keys()):
        try:
            await manager.send_to_user(user_id, {"type": "server_shutdown"})
            ws = manager.active_connections.get(user_id)
            if ws:
                await ws.close()
        except Exception:
            pass
    manager.active_connections.clear()
    logger.info("服务已关闭")


app = FastAPI(
    title="Chat Platform API",
    description="聊天平台后端 API",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(messages.router)

static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "avatars"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
async def root():
    return {"message": "Chat Platform API is running"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # 验证 Token
    user_id = decode_access_token(token)
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    # 注册连接
    await manager.connect(user_id, websocket)

    try:
        # 广播上线
        async with get_db_session() as db:
            friend_ids = await get_friend_ids(db, user_id)
        await manager.broadcast_to_users(
            friend_ids,
            {"type": "status_change", "user_id": user_id, "status": "online"},
        )

        # 消息循环：每条消息创建独立 DB 会话
        while True:
            raw_text = await websocket.receive_text()
            try:
                async with get_db_session() as db_session:
                    await handle_websocket_message(raw_text, user_id, db_session, manager)
            except Exception as exc:
                logger.warning("消息处理异常 user=%s: %s", user_id, exc)

    except WebSocketDisconnect:
        logger.info("WebSocket 断开 user=%s", user_id)
    except Exception as exc:
        logger.error("WebSocket 异常 user=%s: %s", user_id, exc)
    finally:
        manager.disconnect(user_id)
        # 广播离线
        try:
            async with get_db_session() as db:
                friend_ids = await get_friend_ids(db, user_id)
            await manager.broadcast_to_users(
                friend_ids,
                {"type": "status_change", "user_id": user_id, "status": "offline"},
            )
        except Exception as exc:
            logger.warning("离线广播失败 user=%s: %s", user_id, exc)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
