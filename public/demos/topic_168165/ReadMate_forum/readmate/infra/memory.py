"""屏幕记忆模块 - 后台定时截图，保留最近 N 张作为上下文"""
import threading
import time
import io
from collections import deque
from typing import Optional

import mss
from PIL import Image

from ..core.config import get_config
from ..core.logger import get_logger

logger = get_logger(__name__)


class ScreenMemory:
    """后台线程定时截图，保留最近 N 张作为视觉记忆。

    线程安全：所有 buffer 操作在 _lock 保护下进行。
    """

    def __init__(self):
        cfg = get_config()
        self.interval = cfg.get("screen_capture_interval", 30.0)
        self.max_keep = cfg.get("max_screenshots", 12)
        self.quality = cfg.get("screenshot_quality", 70)
        self._buffer: deque = deque(maxlen=self.max_keep)
        self._lock = threading.Lock()
        self._lifecycle_lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self._stop = threading.Event()
        self._sct = None
        self._consecutive_errors = 0

    def start(self):
        with self._lifecycle_lock:
            if self._thread and self._thread.is_alive():
                return
            self._stop.clear()
            self._consecutive_errors = 0
            self._thread = threading.Thread(target=self._run, daemon=True, name="ScreenMemory")
            self._thread.start()
            logger.info("屏幕记忆已启动")

    def stop(self):
        with self._lifecycle_lock:
            self._stop.set()
            if self._thread:
                self._thread.join(timeout=3)
                self._thread = None
            if self._sct is not None:
                try:
                    self._sct.close()
                except Exception:
                    pass
                self._sct = None
            logger.info("屏幕记忆已停止")

    def _run(self):
        try:
            self._sct = mss.mss()
        except Exception as e:
            logger.error(f"mss 初始化失败，屏幕记忆不可用: {e}")
            return
        try:
            while not self._stop.is_set():
                try:
                    self._capture()
                    self._consecutive_errors = 0
                except Exception as e:
                    self._consecutive_errors += 1
                    wait = min(self.interval, 2 ** min(self._consecutive_errors, 4))
                    logger.error(f"截图失败 (连续{self._consecutive_errors}次)，{wait:.0f}s 后重试: {e}")
                    self._stop.wait(wait)
                    continue
                self._stop.wait(self.interval)
        finally:
            if self._sct is not None:
                try:
                    self._sct.close()
                except Exception:
                    pass
                self._sct = None

    def _capture(self):
        if self._sct is None:
            return
        monitors = self._sct.monitors
        if not monitors:
            return
        monitor = monitors[1] if len(monitors) > 1 else monitors[0]
        raw = self._sct.grab(monitor)
        img = Image.frombytes("RGB", raw.size, raw.bgra, "raw", "BGRX")
        try:
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=self.quality, optimize=True)
            data = buf.getvalue()
        finally:
            buf.close()
            img.close()
        with self._lock:
            self._buffer.append(data)
        logger.debug(f"截图已存 ({len(data)//1024}KB), 记忆库={len(self._buffer)}")

    def get_recent(self, n: int = 3) -> list:
        n = max(1, min(int(n), self.max_keep))
        with self._lock:
            items = list(self._buffer)
        return items[-n:] if items else []

    def get_latest(self) -> Optional[bytes]:
        with self._lock:
            return self._buffer[-1] if self._buffer else None
