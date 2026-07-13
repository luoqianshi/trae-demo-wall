"""图片生成客户端。

支持两种模式：
1. Agnes AI（agnes-image-2.1-flash）— 默认，返回 URL 或 b64_json
2. OpenAI 兼容接口（gpt-image-2）— 降级，返回 b64_json

端点: POST {base_url}/images/generations
Agnes 文档要求 response_format 放在 extra_body 内部。
"""
from __future__ import annotations

import asyncio
import base64
import logging
from pathlib import Path
from typing import Any

import httpx

from app.config import settings
from app.services.rate_limiter import acquire
from app.services.storage import abs_path

logger = logging.getLogger(__name__)

# 复用 httpx 客户端，同步接口需要 180 秒超时
_http: httpx.AsyncClient | None = None

# 503 Service busy 时的重试配置
_MAX_RETRIES = 3
_RETRY_DELAYS = [5, 15, 30]  # 秒，递增等待


def _get_http() -> httpx.AsyncClient:
    global _http
    if _http is None or _http.is_closed:
        _http = httpx.AsyncClient(
            timeout=httpx.Timeout(180.0, connect=10.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
    return _http


def _path_to_b64(rel_path: str) -> str | None:
    """把本地存储的图片相对路径转成 base64 字符串。"""
    p = abs_path(rel_path)
    if not p.exists():
        return None
    return base64.b64encode(p.read_bytes()).decode("ascii")


def _bytes_to_b64(img_bytes: bytes) -> str:
    """把图片字节转成 base64 字符串。"""
    return base64.b64encode(img_bytes).decode("ascii")


def _normalize_ref(ref: bytes | str) -> str | None:
    """统一把参考图转成 base64 字符串。"""
    if isinstance(ref, bytes):
        return _bytes_to_b64(ref)
    if isinstance(ref, str):
        if ref.startswith("data:image"):
            # 去掉前缀，只留 base64 内容
            return ref.split(",", 1)[-1]
        if ref.startswith(("http://", "https://")):
            # URL 需要先下载（本地接口只接受 base64）
            return None
        # 当作本地相对路径
        return _path_to_b64(ref)
    return None


async def generate_image(
    prompt: str,
    reference_images: list[bytes] | list[str] | None = None,
    size: str | None = None,
    quality: str = "high",
    response_format: str = "b64_json",
) -> bytes:
    """调用 OpenAI 兼容接口生成图片，返回图片字节。

    Args:
        prompt: 生图提示词（英文效果更好）
        reference_images: 参考图列表，元素可以是 bytes 或本地相对路径
        size: 图片尺寸，默认使用 settings.image_size
        quality: 图片质量
        response_format: 固定 b64_json
    """
    if not settings.image_base_url or not settings.image_api_key:
        raise RuntimeError("未配置 IMAGE_BASE_URL 或 IMAGE_API_KEY")

    http = _get_http()
    headers = {
        "Authorization": f"Bearer {settings.image_api_key}",
        "Content-Type": "application/json",
    }

    payload: dict[str, Any] = {
        "model": settings.image_model,
        "prompt": prompt,
        "n": 1,
        "size": size or settings.image_size,
        "response_format": response_format,
    }
    if quality:
        payload["quality"] = quality

    # 处理参考图
    images_b64: list[str] = []
    single_image: str | None = None
    if reference_images:
        for ref in reference_images[:10]:  # 最多 10 张
            b64 = _normalize_ref(ref)
            if b64:
                images_b64.append(b64)
        if len(images_b64) == 1:
            single_image = images_b64[0]
            payload["image"] = single_image
        elif len(images_b64) > 1:
            payload["images"] = images_b64

    logger.info(
        "提交图片生成请求，base_url=%s，prompt 长度=%d，参考图数=%d，size=%s",
        settings.image_base_url,
        len(prompt),
        len(images_b64),
        payload["size"],
    )

    resp = await http.post(
        f"{settings.image_base_url}/images/generations",
        json=payload,
        headers=headers,
    )

    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        text = resp.text[:500]
        raise RuntimeError(f"图片生成 API 错误 ({resp.status_code}): {text}") from e

    data = resp.json()
    if not data.get("data"):
        raise RuntimeError(f"图片生成 API 返回异常: {data}")

    b64 = data["data"][0].get("b64_json", "")
    if not b64:
        raise RuntimeError("图片生成 API 返回的 b64_json 为空")

    return base64.b64decode(b64)


# ===== Agnes AI 图片生成 =====


def _to_data_uri(ref: bytes | str) -> str | None:
    """把参考图转成 Data URI 格式（data:image/png;base64,...）。

    支持：bytes、本地相对路径、已有的 data URI、http(s) URL。
    """
    if isinstance(ref, bytes):
        b64 = base64.b64encode(ref).decode("ascii")
        return f"data:image/png;base64,{b64}"
    if isinstance(ref, str):
        if ref.startswith("data:image"):
            return ref  # 已经是 Data URI
        if ref.startswith(("http://", "https://")):
            # Agnes 也支持直接传 URL，不用转
            return ref
        # 当作本地相对路径，读取并转 base64
        b64 = _path_to_b64(ref)
        if b64:
            return f"data:image/png;base64,{b64}"
    return None


async def _download(url: str) -> bytes:
    """下载 URL 内容为 bytes（用于下载 Agnes 返回的图片 URL）。"""
    http = _get_http()
    resp = await http.get(url)
    resp.raise_for_status()
    return resp.content


async def generate_image_with_url(
    prompt: str,
    reference_images: list[bytes] | list[str] | None = None,
    size: str | None = None,
    channel: str = "image_2k",
    interval: float | None = None,
) -> tuple[bytes, str | None]:
    """调用 Agnes 生成图片，返回 (bytes, url|None)。

    url 为 Agnes 返回的公网 URL，供视频生成图生视频使用；
    同时下载 URL 为 bytes 保存本地。

    Args:
        prompt: 生图提示词
        reference_images: 参考图列表（bytes/路径/URL）
        size: 图片尺寸，默认使用 agnes_storyboard_size
        channel: 频率控制频道（image_2k / image_1k）
        interval: 自定义间隔秒数；None 时根据 channel 自动选择
    """
    if not settings.agnes_api_key:
        # 降级到旧 gpt-image-2
        img_bytes = await generate_image(prompt, reference_images, size)
        return img_bytes, None

    # 频率控制
    actual_interval = interval if interval is not None else (
        settings.image_2k_interval if "2k" in channel else settings.image_1k_interval
    )
    await acquire(channel, actual_interval)

    http = _get_http()
    headers = {
        "Authorization": f"Bearer {settings.agnes_api_key}",
        "Content-Type": "application/json",
    }

    payload: dict[str, Any] = {
        "model": settings.agnes_image_model,
        "prompt": prompt,
        "n": 1,
        "size": size or settings.agnes_storyboard_size,
        # 重要：response_format 必须放在 extra_body 内部
        "extra_body": {"response_format": "url"},
    }

    # 参考图转 Data URI
    if reference_images:
        images_data_uri: list[str] = []
        for ref in reference_images[:10]:
            uri = _to_data_uri(ref)
            if uri:
                images_data_uri.append(uri)
        if images_data_uri:
            payload["image"] = images_data_uri

    logger.info(
        "提交 Agnes 图片生成请求，size=%s，prompt 长度=%d，参考图数=%d",
        payload["size"],
        len(prompt),
        len(images_data_uri) if reference_images else 0,
    )

    # 503 Service busy 时自动重试（Agnes 偶尔会返回 503）
    resp = None
    for attempt in range(_MAX_RETRIES):
        resp = await http.post(
            f"{settings.agnes_base_url}/images/generations",
            json=payload,
            headers=headers,
        )
        if resp.status_code == 503:
            if attempt < _MAX_RETRIES - 1:
                delay = _RETRY_DELAYS[attempt]
                logger.warning(
                    "Agnes 图片 API 503 Service busy，%d秒后重试 (attempt %d/%d)",
                    delay, attempt + 1, _MAX_RETRIES,
                )
                await asyncio.sleep(delay)
                continue
        break

    try:
        resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        text = resp.text[:500]
        raise RuntimeError(f"Agnes 图片生成 API 错误 ({resp.status_code}): {text}") from e

    data = resp.json()
    if not data.get("data"):
        raise RuntimeError(f"Agnes 图片生成 API 返回异常: {data}")

    item = data["data"][0]
    url = item.get("url")
    b64 = item.get("b64_json")

    if url:
        # 下载 URL 为 bytes
        img_bytes = await _download(url)
    elif b64:
        img_bytes = base64.b64decode(b64)
    else:
        raise RuntimeError("Agnes 返回既无 url 也无 b64_json")

    return img_bytes, url


async def close_http() -> None:
    """关闭底层 httpx 客户端。"""
    global _http
    if _http and not _http.is_closed:
        await _http.aclose()
        _http = None
