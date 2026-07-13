"""全局频率限制器：基于 asyncio.Lock + dict 维护各频道最后调用时间。

用于控制 Agnes AI 免费层 RPM 限制：
- 文本 20 RPM → text 频道，3 秒间隔
- 图片 2K 2 RPM → image_2k 频道，32 秒间隔
- 图片 1K 20 RPM → image_1k 频道，4 秒间隔
- 视频 20 RPM → video_create 频道，5 秒间隔
- 视频轮询 → video_poll_{video_id} 频道，10 秒间隔（每个任务独立）
"""
from __future__ import annotations

import asyncio
from datetime import datetime

_lock = asyncio.Lock()
_last_call: dict[str, datetime] = {}


async def acquire(channel: str, interval: float) -> None:
    """等待直到距离上次同频道调用超过 interval 秒。

    全局锁保证跨节点/跨任务的频率控制。每个频道独立维护上次调用时间，
    互不影响（例如 image_2k 和 image_1k 可以并行）。
    """
    async with _lock:
        now = datetime.utcnow()
        last = _last_call.get(channel)
        if last:
            elapsed = (now - last).total_seconds()
            if elapsed < interval:
                await asyncio.sleep(interval - elapsed)
        _last_call[channel] = datetime.utcnow()
