"""WebSocket 客户端封装 — 支持实时消息收发"""
from __future__ import annotations
import json
import threading
import time
import logging
from websocket import WebSocketApp, WebSocketConnectionClosedException
from .session import session
from .utils.config import WS_URL

logger = logging.getLogger("chat.ws")


class WSClient:
    """WebSocket 客户端，运行在独立线程中"""

    def __init__(self):
        self.ws: WebSocketApp | None = None
        self.thread: threading.Thread | None = None
        self._running = False
        self._reconnect_delay = 3       # 当前重连延迟（秒）
        self._max_reconnect_delay = 60  # 最大重连延迟
        self._message_handlers: list = []
        self._token_expired_handler = None  # Token 过期回调

    def on_token_expired(self, handler):
        """注册 Token 过期回调"""
        self._token_expired_handler = handler

    def start(self):
        if self._running:
            return
        self._running = True
        self._reconnect_delay = 3
        self.thread = threading.Thread(target=self._connect, daemon=True)
        self.thread.start()

    def stop(self):
        self._running = False
        if self.ws:
            try:
                self.ws.close()
            except Exception:
                pass

    def _connect(self):
        while self._running:
            token = session.access_token
            if not token:
                time.sleep(1)
                continue

            ws_url = f"{WS_URL}?token={token}"
            self.ws = WebSocketApp(
                ws_url,
                on_message=self._on_message,
                on_close=self._on_close,
                on_error=self._on_error,
            )

            try:
                self.ws.run_forever(ping_interval=30, ping_timeout=10)
            except Exception as exc:
                logger.warning("WS 连接异常: %s", exc)

            if not self._running:
                break

            # ★ 指数退避重连
            logger.info("WS 将在 %d 秒后重连...", self._reconnect_delay)
            time.sleep(self._reconnect_delay)
            self._reconnect_delay = min(self._reconnect_delay * 2, self._max_reconnect_delay)

    def _on_message(self, ws, raw_message):
        try:
            data = json.loads(raw_message)
        except json.JSONDecodeError:
            return

        # ★ 处理服务端关闭通知
        if data.get("type") == "server_shutdown":
            logger.info("服务端正在关闭，断开连接")
            self._running = False
            return

        for handler in self._message_handlers:
            try:
                handler(data)
            except Exception as exc:
                logger.warning("消息处理器异常: %s", exc)

    def _on_close(self, ws, close_status_code, close_msg):
        logger.info("WS 关闭 code=%s msg=%s", close_status_code, close_msg)
        # ★ Token 过期 (4001) → 触发重新登录
        if close_status_code == 4001:
            logger.warning("Token 已过期，需要重新登录")
            self._running = False
            if self._token_expired_handler:
                self._token_expired_handler()
            return
        # 正常断开 → 重置延迟，准备重连
        self._reconnect_delay = 3

    def _on_error(self, ws, error):
        logger.warning("WS 错误: %s", error)

    def add_handler(self, handler):
        self._message_handlers.append(handler)

    def remove_handler(self, handler):
        if handler in self._message_handlers:
            self._message_handlers.remove(handler)

    def send_private_message(self, to_user_id: int, content: str):
        if not self.ws:
            return
        try:
            self.ws.send(json.dumps({
                "type": "private_message",
                "to_user_id": to_user_id,
                "content": content,
            }))
        except WebSocketConnectionClosedException:
            pass
        except Exception as exc:
            logger.warning("发送消息失败: %s", exc)


ws_client = WSClient()
