"""Agnes AI 视频生成客户端（异步任务模式）。

流程：
1. POST /v1/videos 创建任务（5 秒间隔，20 RPM 保险），返回 task_id / video_id
2. GET /agnesapi?video_id=<VIDEO_ID> 轮询结果（每个任务独立 10 秒间隔）

注意：查询端点 `/agnesapi` 不在 `/v1` 前缀下，需从 base_url 去掉 `/v1`。
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.config import settings
from app.services.rate_limiter import acquire

logger = logging.getLogger(__name__)

# 复用 httpx 客户端，视频下载可能较慢，超时 600 秒
_http: httpx.AsyncClient | None = None

# 429/503 重试配置
_MAX_RETRIES = 3
_RETRY_DELAYS = [10, 30, 60]  # 秒


def _get_http() -> httpx.AsyncClient:
    global _http
    if _http is None or _http.is_closed:
        _http = httpx.AsyncClient(
            timeout=httpx.Timeout(600.0, connect=10.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
    return _http


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.agnes_api_key}",
        "Content-Type": "application/json",
    }


def _agnes_api_root() -> str:
    """从 agnes_base_url 推导出根域名：去掉末尾的 /v1。

    例如 https://apihub.agnes-ai.com/v1 → https://apihub.agnes-ai.com
    """
    root = settings.agnes_base_url.rstrip("/")
    if root.endswith("/v1"):
        root = root[:-3]
    return root


async def create_video_task(prompt: str, image_url: str | None = None) -> dict[str, Any]:
    """创建 Agnes 视频任务，返回创建响应。

    响应字段示例：{id, task_id, video_id, status: queued, progress, seconds, size}

    Args:
        prompt: 视频内容文本描述
        image_url: 图生视频的图片 URL（顶层参数 image）
    """
    await acquire("video_create", settings.video_create_interval)

    payload: dict[str, Any] = {
        "model": settings.agnes_video_model,
        "prompt": prompt,
        "width": settings.agnes_video_width,
        "height": settings.agnes_video_height,
        "num_frames": settings.agnes_video_num_frames,
        "frame_rate": settings.agnes_video_frame_rate,
    }
    if image_url:
        payload["image"] = image_url

    http = _get_http()
    # 429 rate limit / 503 service busy 时自动重试
    resp = None
    for attempt in range(_MAX_RETRIES):
        resp = await http.post(
            f"{settings.agnes_base_url}/videos",
            json=payload,
            headers=_headers(),
        )
        if resp.status_code in (429, 503):
            if attempt < _MAX_RETRIES - 1:
                delay = _RETRY_DELAYS[attempt]
                logger.warning(
                    "Agnes 视频 API %d，%d秒后重试 (attempt %d/%d)",
                    resp.status_code, delay, attempt + 1, _MAX_RETRIES,
                )
                await asyncio.sleep(delay)
                continue
        break

    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        text = resp.text[:500]
        raise RuntimeError(f"Agnes 视频创建 API 错误 ({resp.status_code}): {text}") from e

    data = resp.json()
    logger.info(
        "Agnes 视频任务已创建: prompt 长度=%d, image=%s, task_id=%s, video_id=%s",
        len(prompt),
        "有" if image_url else "无",
        data.get("task_id") or data.get("id"),
        data.get("video_id"),
    )
    return data


async def poll_video(video_id: str) -> dict[str, Any]:
    """查询视频任务状态，返回完整响应。

    每个任务用独立频道 `video_poll_{video_id}`，互不影响。
    完成时响应含 url（mp4 公网地址）；失败时含 error。
    """
    await acquire(f"video_poll_{video_id}", settings.video_poll_interval)

    http = _get_http()
    resp = await http.get(
        f"{_agnes_api_root()}/agnesapi",
        params={"video_id": video_id},
        headers=_headers(),
    )

    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        text = resp.text[:500]
        raise RuntimeError(f"Agnes 视频查询 API 错误 ({resp.status_code}): {text}") from e

    return resp.json()


async def download_video(url: str) -> bytes:
    """下载 mp4 URL 为 bytes。"""
    http = _get_http()
    resp = await http.get(url)
    resp.raise_for_status()
    return resp.content


async def close_http() -> None:
    """关闭底层 httpx 客户端。"""
    global _http
    if _http and not _http.is_closed:
        await _http.aclose()
        _http = None
