"""头像加载公共工具 — 统一管理图片下载、缓存与 CTkImage 生成"""
from __future__ import annotations
import io
import requests as req
from PIL import Image as PILImage
import customtkinter as ctk
from .config import API_BASE_URL

_cache: dict[str, ctk.CTkImage] = {}


def load_avatar(url: str, size: int = 32) -> ctk.CTkImage | None:
    """从 URL 加载头像为 CTkImage，内置缓存"""
    if not url:
        return None

    cached = _cache.get(url)
    if cached:
        return cached

    try:
        full_url = url if url.startswith("http") else f"{API_BASE_URL}{url}"
        resp = req.get(full_url, timeout=5)
        if resp.status_code == 200:
            img = PILImage.open(io.BytesIO(resp.content))
            img = img.resize((size, size), PILImage.LANCZOS)
            ctk_img = ctk.CTkImage(light_image=img, size=(size, size))
            _cache[url] = ctk_img
            return ctk_img
    except Exception:
        pass
    return None


def clear_cache():
    """清空缓存（用于登出/切换用户）"""
    _cache.clear()
