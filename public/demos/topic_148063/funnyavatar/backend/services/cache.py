"""简单的文件缓存：基于 JSON 落盘，按输入哈希索引。用于缓存生成结果，避免重复调用。"""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any, Optional

from config import get_settings


def _cache_key(*parts: str) -> str:
    raw = "|".join(parts)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:24]


def _cache_file(namespace: str, key: str) -> Path:
    base = get_settings().cache_path / namespace
    base.mkdir(parents=True, exist_ok=True)
    return base / f"{key}.json"


def get(namespace: str, *key_parts: str, ttl: int = 3600) -> Optional[Any]:
    """读取缓存。ttl 秒内有效，过期返回 None。"""
    key = _cache_key(*key_parts)
    f = _cache_file(namespace, key)
    if not f.exists():
        return None
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
        if time.time() - data.get("ts", 0) > ttl:
            return None
        return data.get("value")
    except Exception:
        return None


def set(namespace: str, value: Any, *key_parts: str) -> None:
    """写入缓存。失败静默忽略，不影响主流程。"""
    key = _cache_key(*key_parts)
    f = _cache_file(namespace, key)
    try:
        f.write_text(
            json.dumps({"ts": time.time(), "value": value}, ensure_ascii=False),
            encoding="utf-8",
        )
    except Exception:
        pass
