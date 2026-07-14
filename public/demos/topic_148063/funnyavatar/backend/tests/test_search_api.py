"""头像搜索接口测试。

验证 /api/search 接口正常返回真实匹配数据（使用 mock 避免真实网络请求）。

运行：
    cd backend
    python -m pytest tests/test_search_api.py -v
"""
from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture
def client(reset_settings_cache):
    from main import app
    return TestClient(app)


@pytest.fixture
def reset_settings_cache():
    from config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_search_returns_real_matches(client, monkeypatch):
    """/api/search 应返回包含 match_reason 的真实匹配结果。"""
    monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
    from config import get_settings
    get_settings.cache_clear()

    # mock 探活返回可达
    from services import avatar_search
    with patch.object(avatar_search, "_check_sources_reachable",
                      return_value=[True, True, True]):
        # 清缓存避免命中旧缓存
        from services import cache
        cache.get.__wrapped__ if hasattr(cache.get, "__wrapped__") else None
        resp = client.post("/api/search", json={"text": "蓝色科技感程序员头像", "limit": 6})

    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert len(data["results"]) > 0

    for r in data["results"]:
        assert r["source"] != "Local Demo", "不应出现 Demo 占位"
        assert r["match_reason"], f"{r['title']} 缺少 match_reason"
        assert r["license"], f"{r['title']} 缺少 license"
        assert r["source"], f"{r['title']} 缺少 source"


def test_search_different_inputs_different_results(client, monkeypatch):
    """不同输入应产生不同的匹配结果。"""
    monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
    from config import get_settings
    get_settings.cache_clear()

    from services import avatar_search
    with patch.object(avatar_search, "_check_sources_reachable",
                      return_value=[True, True, True]):
        r1 = client.post("/api/search", json={"text": "科技感程序员头像", "limit": 3})
        r2 = client.post("/api/search", json={"text": "像素风游戏头像", "limit": 3})

    urls1 = {r["thumbnail_url"] for r in r1.json()["results"]}
    urls2 = {r["thumbnail_url"] for r in r2.json()["results"]}
    assert urls1 != urls2, "不同输入应产生不同结果"


def test_recommend_includes_matches(client, monkeypatch):
    """/api/avatar/recommend 应包含 matches 字段且为真实匹配。"""
    monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
    monkeypatch.setenv("IMAGE_PROVIDER", "local")
    from config import get_settings
    get_settings.cache_clear()

    from services import avatar_search
    with patch.object(avatar_search, "_check_sources_reachable",
                      return_value=[True, True, True]):
        resp = client.post("/api/avatar/recommend", json={
            "text": "赛博朋克程序员头像",
            "generate": True,
            "search": True,
            "limit": 6,
        })

    assert resp.status_code == 200
    data = resp.json()
    assert "matches" in data
    assert len(data["matches"]) > 0
    for m in data["matches"]:
        assert m["source"] != "Local Demo"
        assert m["match_reason"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
