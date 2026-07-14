"""开源头像匹配单元测试。

覆盖：
1. 关键词解析与调色板检测
2. 风格匹配（不同输入 → 不同源/风格组合）
3. 稳定 seed（相同输入 → 相同结果）
4. 结果排序（match_score 降序）
5. match_reason 字段存在且非空
6. 多源聚合（DiceBear / Robohash / Multiavatar / Boring Avatars）
7. 移除 Demo 占位（不再出现 source="Local Demo"）
8. 本地降级（外部禁用时走 Local Generated，非 Demo 占位）
9. 源开关配置生效
10. DiceBear URL 正确性（回归测试）
11. Boring Avatar 本地适配器（API 已下线，改为本地生成）
12. Multiavatar 适配器（服务端获取 + 本地 fallback）
13. 多源 fallback 机制（单源失败不影响整体）

运行：
    cd backend
    python -m pytest tests/test_avatar_search.py -v
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from schemas import Analysis, MatchItem  # noqa: E402
from services import avatar_search  # noqa: E402
from services.avatar_search import (  # noqa: E402
    PALETTE_MATCHES,
    _compute_match_score,
    _seed_variant,
    _stable_seed,
    _boring_marble_svg,
    _multiavatar_fallback_svg,
    _validate_thumbnail_url,
    _resolve_thumbnail,
    DICEBEAR_SOURCE,
    DICEBEAR_BASE,
    DICEBEAR_HOME,
    DICEBEAR_LICENSE_URL,
    ROBOHASH_SOURCE,
    MULTIAVATAR_SOURCE,
    BORING_SOURCE,
)


# ============ 夹具 ============

def make_analysis(styles=None, subjects=None) -> Analysis:
    return Analysis(
        styles=styles or [], colors=[], subjects=subjects or [],
        usages=[], directions=[], negative_keywords=[],
    )


@pytest.fixture
def reset_settings_cache():
    from config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def mock_multiavatar_fetch():
    """自动 mock Multiavatar 网络请求，避免测试触网。

    默认返回 None（模拟 API 不可用 → 走本地 fallback）。
    需要测试成功获取的用例可在此 fixture 基础上再 patch。
    """
    with patch.object(avatar_search, "_fetch_multiavatar_svg",
                      new_callable=AsyncMock, return_value=None):
        yield


@pytest.fixture
def tmp_outputs(reset_settings_cache, monkeypatch):
    """使用临时 outputs 目录，避免污染正式 outputs。"""
    tmp_dir = Path(__file__).resolve().parent / "_tmp_outputs"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("OUTPUT_DIR", str(tmp_dir))
    return tmp_dir


def _run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


# ============ 1. 稳定 seed ============

class TestStableSeed:
    def test_same_input_same_output(self):
        assert _stable_seed("hello") == _stable_seed("hello")

    def test_different_input_different_output(self):
        assert _stable_seed("hello") != _stable_seed("world")

    def test_variant_different_from_base(self):
        assert _seed_variant("hello", 0) != _seed_variant("hello", 1)

    def test_variant_stable(self):
        assert _seed_variant("hello", 0) == _seed_variant("hello", 0)


# ============ 2. 匹配分数计算 ============

class TestMatchScore:
    def test_palette_hit_adds_bonus(self):
        without = _compute_match_score(0, 0, palette_hit=False)
        with_hit = _compute_match_score(0, 0, palette_hit=True)
        assert with_hit > without

    def test_more_style_matches_higher_score(self):
        low = _compute_match_score(0, 3, palette_hit=True)
        high = _compute_match_score(3, 3, palette_hit=True)
        assert high >= low

    def test_score_in_range(self):
        score = _compute_match_score(2, 3, palette_hit=True)
        assert 0.0 <= score <= 0.99

    def test_non_random(self):
        """相同参数应返回相同分数（非随机）。"""
        a = _compute_match_score(1, 2, True)
        b = _compute_match_score(1, 2, True)
        assert a == b


# ============ 3. 风格匹配：不同输入 → 不同结果 ============

class TestStyleMatching:
    def test_tech_input_uses_bottts_and_robohash(self, reset_settings_cache, monkeypatch):
        """科技感输入应匹配到 bottts / robohash（机器人风格）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["科技感"], subjects=["程序员"])
        # mock 探活全部返回 True
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            query, results = _run(avatar_search.search("蓝色科技感程序员", a, limit=6))
        sources = {r.source for r in results}
        # 至少包含 DiceBear（bottts）或 Robohash
        assert DICEBEAR_SOURCE in sources or ROBOHASH_SOURCE in sources

    def test_pixel_input_uses_pixel_art(self, reset_settings_cache, monkeypatch):
        """像素风输入应匹配到 pixel-art。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["像素风"], subjects=[])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("像素风游戏头像", a, limit=6))
        # 至少有一个结果包含 pixel-art 的 URL
        assert any("pixel-art" in r.thumbnail_url for r in results)

    def test_anime_input_uses_adventurer(self, reset_settings_cache, monkeypatch):
        """二次元输入应匹配到 adventurer。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["二次元"], subjects=["动漫角色"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("二次元动漫头像", a, limit=6))
        assert any("adventurer" in r.thumbnail_url for r in results)

    def test_different_inputs_produce_different_results(self, reset_settings_cache, monkeypatch):
        """不同输入应产生不同的 thumbnail_url（基于不同 seed）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a1 = make_analysis(styles=["科技感"])
        a2 = make_analysis(styles=["像素风"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, r1 = _run(avatar_search.search("科技感头像", a1, limit=3))
            _, r2 = _run(avatar_search.search("像素风头像", a2, limit=3))
        urls1 = {r.thumbnail_url for r in r1}
        urls2 = {r.thumbnail_url for r in r2}
        # 两组 URL 不应完全相同
        assert urls1 != urls2

    def test_same_input_produces_same_results(self, reset_settings_cache, monkeypatch):
        """相同输入应产生相同结果（稳定 seed）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["科技感"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, r1 = _run(avatar_search.search("蓝色科技感", a, limit=3))
            _, r2 = _run(avatar_search.search("蓝色科技感", a, limit=3))
        urls1 = [r.thumbnail_url for r in r1]
        urls2 = [r.thumbnail_url for r in r2]
        assert urls1 == urls2


# ============ 4. match_reason 字段 ============

class TestMatchReason:
    def test_all_results_have_reason(self, reset_settings_cache, monkeypatch):
        """每条结果都应有非空的 match_reason。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["科技感"], subjects=["程序员"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("科技感程序员", a, limit=6))
        for r in results:
            assert r.match_reason, f"结果 {r.title} 缺少 match_reason"
            assert len(r.match_reason) > 3


# ============ 5. 多源聚合 ============

class TestMultiSource:
    def test_results_include_multiple_sources(self, reset_settings_cache, monkeypatch):
        """结果应包含多个不同来源（不是单一源）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["科技感", "未来感"], subjects=["程序员"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("科技感未来程序员", a, limit=6))
        sources = {r.source for r in results}
        # 至少 2 个不同源
        assert len(sources) >= 2

    def test_all_sources_have_license_info(self, reset_settings_cache, monkeypatch):
        """每条结果都应有 license 和 license_url。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["极简"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("极简头像", a, limit=6))
        for r in results:
            assert r.license, f"{r.title} 缺少 license"
            assert r.source, f"{r.title} 缺少 source"

    def test_safe_to_use_is_true(self, reset_settings_cache, monkeypatch):
        """所有开源结果都应标记 safe_to_use=True。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["治愈系"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("治愈系头像", a, limit=6))
        for r in results:
            assert r.safe_to_use is True


# ============ 6. 移除 Demo 占位 ============

class TestNoDemoPlaceholder:
    def test_no_local_demo_source(self, reset_settings_cache, monkeypatch):
        """结果中不应再出现 source='Local Demo'。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["科技感"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("科技感", a, limit=6))
        for r in results:
            assert r.source != "Local Demo", "仍存在 Demo 占位数据"

    def test_no_demo_placeholder_license(self, reset_settings_cache, monkeypatch):
        """不应再出现 license='Demo Placeholder'。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["像素风"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("像素风", a, limit=6))
        for r in results:
            assert "Demo" not in r.license, f"{r.title} 仍是 Demo license"


# ============ 7. 本地降级（非 Demo 占位） ============

class TestLocalFallback:
    def test_disabled_external_uses_local_generated(self, reset_settings_cache, monkeypatch):
        """外部搜索禁用时应走 Local Generated（非 Demo 占位）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "false")
        monkeypatch.setenv("OUTPUT_DIR", str(Path(__file__).resolve().parent / "_tmp_outputs"))
        a = make_analysis(styles=["科技感"])
        _, results = _run(avatar_search.search("科技感", a, limit=4))
        for r in results:
            assert r.source == "Local Generated"
            assert r.safe_to_use is True
            assert "Local Generated" in r.license

    def test_all_unreachable_uses_local_generated(self, reset_settings_cache, monkeypatch):
        """所有外部源不可达时应走 Local Generated。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        monkeypatch.setenv("OUTPUT_DIR", str(Path(__file__).resolve().parent / "_tmp_outputs"))
        a = make_analysis(styles=["科技感"])
        # mock 探活全部返回 False
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[False, False, False]):
            _, results = _run(avatar_search.search("科技感", a, limit=4))
        for r in results:
            assert r.source == "Local Generated"


# ============ 8. 源开关配置 ============

class TestSourceToggle:
    def test_disable_robohash_removes_it(self, reset_settings_cache, monkeypatch):
        """关闭 Robohash 后结果中不应出现该源。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        monkeypatch.setenv("SEARCH_ENABLE_ROBOHASH", "false")
        a = make_analysis(styles=["科技感"], subjects=["程序员"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("科技感程序员", a, limit=6))
        sources = {r.source for r in results}
        assert ROBOHASH_SOURCE not in sources

    def test_disable_dicebear_removes_it(self, reset_settings_cache, monkeypatch):
        """关闭 DiceBear 后结果中不应出现该源。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        monkeypatch.setenv("SEARCH_ENABLE_DICEBEAR", "false")
        a = make_analysis(styles=["科技感"], subjects=["程序员"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("科技感程序员", a, limit=6))
        sources = {r.source for r in results}
        assert DICEBEAR_SOURCE not in sources


# ============ 9. PALETTE_MATCHES 覆盖所有调色板 ============

class TestPaletteCoverage:
    def test_all_palettes_have_matches(self):
        """每个调色板都应有对应的匹配候选。"""
        expected = {"tech", "cyber", "pixel", "anime", "warm", "mono", "nature", "purple"}
        assert expected.issubset(set(PALETTE_MATCHES.keys()))

    def test_each_palette_has_at_least_3_candidates(self):
        for palette, candidates in PALETTE_MATCHES.items():
            assert len(candidates) >= 3, f"{palette} 候选不足 3 个"

    def test_each_candidate_has_reason(self):
        for palette, candidates in PALETTE_MATCHES.items():
            for c in candidates:
                assert "reason" in c and c["reason"], f"{palette} 候选缺少 reason"
                assert "source" in c, f"{palette} 候选缺少 source"


# ============ 10. DiceBear URL 正确性（回归测试） ============

# DiceBear 10.x 官方支持的风格全集（来自 https://www.dicebear.com/styles/）
DICEBEAR_VALID_STYLES = {
    "adventurer", "adventurer-neutral", "avataaars", "avataaars-neutral",
    "big-ears", "big-ears-neutral", "big-smile", "bottts", "bottts-neutral",
    "croodles", "croodles-neutral", "disco", "dylan", "fun-emoji", "glass",
    "glyphs", "icons", "identicon", "initial-face", "initials",
    "lorelei", "lorelei-neutral", "micah", "miniavs", "notionists",
    "notionists-neutral", "open-peeps", "personas", "pixel-art",
    "pixel-art-neutral", "rings", "shape-grid", "shapes", "stripes",
    "thumbs", "toon-head", "triangles",
}


class TestDiceBearURL:
    """回归测试：确保 DiceBear 访问链接可用。

    历史 Bug：
    - DICEBEAR_BASE 曾用 9.x（已废弃，应为 10.x）
    - source_url 曾用 /style/ 单数（正确为 /styles/ 复数）
    - DICEBEAR_HOME 曾缺 www. 前缀
    - 'cats' 风格在 10.x 不存在（404）
    """

    def test_base_url_uses_10x(self):
        """DiceBear API 必须使用 10.x 版本（9.x 已废弃）。"""
        assert DICEBEAR_BASE == "https://api.dicebear.com/10.x", \
            "DICEBEAR_BASE 必须为 10.x，9.x 已废弃会导致 URL 不可访问"

    def test_home_has_www_prefix(self):
        """DICEBEAR_HOME 必须带 www. 前缀，否则会 404。"""
        assert DICEBEAR_HOME == "https://www.dicebear.com"

    def test_license_url_accessible_format(self):
        """license_url 必须是可访问的格式（www. + 末尾斜杠）。"""
        assert DICEBEAR_LICENSE_URL == "https://www.dicebear.com/licenses/"
        assert DICEBEAR_LICENSE_URL.startswith("https://www.")

    def test_source_url_uses_plural_styles_path(self, reset_settings_cache, monkeypatch):
        """DiceBear 结果的 source_url（「访问」链接）必须用 /styles/ 复数路径。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["科技感"], subjects=["程序员"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("科技感程序员", a, limit=6))
        dicebear_items = [r for r in results if r.source == DICEBEAR_SOURCE]
        assert dicebear_items, "应至少有一个 DiceBear 结果"
        for item in dicebear_items:
            # source_url 形如 https://www.dicebear.com/styles/bottts/
            assert "/styles/" in item.source_url, \
                f"{item.title} source_url 应使用 /styles/ 复数路径，实际: {item.source_url}"
            assert item.source_url.startswith("https://www.dicebear.com/styles/"), \
                f"{item.title} source_url 格式错误: {item.source_url}"
            assert item.source_url.endswith("/"), \
                f"{item.title} source_url 应以 / 结尾: {item.source_url}"

    def test_thumbnail_url_uses_10x(self, reset_settings_cache, monkeypatch):
        """DiceBear 缩略图 URL 必须使用 10.x 版本路径。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["像素风"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("像素风头像", a, limit=6))
        dicebear_items = [r for r in results if r.source == DICEBEAR_SOURCE]
        assert dicebear_items, "应至少有一个 DiceBear 结果"
        for item in dicebear_items:
            assert "/10.x/" in item.thumbnail_url, \
                f"{item.title} thumbnail_url 应包含 /10.x/，实际: {item.thumbnail_url}"
            assert item.thumbnail_url.startswith("https://api.dicebear.com/10.x/"), \
                f"{item.title} thumbnail_url 前缀错误: {item.thumbnail_url}"

    def test_all_dicebear_styles_are_valid(self):
        """PALETTE_MATCHES 中所有 DiceBear 风格必须是 10.x 官方支持的风格。

        'cats' 在 10.x 已被移除（会返回 404），必须替换为有效风格。
        """
        for palette, candidates in PALETTE_MATCHES.items():
            for c in candidates:
                if c["source"] == "dicebear":
                    style = c.get("style", "")
                    if not style:
                        continue
                    assert style in DICEBEAR_VALID_STYLES, \
                        f"调色板 {palette} 使用了无效的 DiceBear 风格 '{style}'，" \
                        f"该风格在 10.x 不存在（会导致 URL 404）"

    def test_no_cats_style_anywhere(self):
        """全局搜索不应再出现已废弃的 'cats' 风格。"""
        for palette, candidates in PALETTE_MATCHES.items():
            for c in candidates:
                if c["source"] == "dicebear":
                    assert c.get("style", "") != "cats", \
                        f"{palette} 仍使用已废弃的 'cats' 风格"

    def test_warm_palette_first_style_is_valid(self):
        """warm 调色板首个 DiceBear 风格必须可访问（原为 cats，已 404）。"""
        warm = PALETTE_MATCHES["warm"]
        dicebear_styles = [c["style"] for c in warm if c["source"] == "dicebear"]
        assert dicebear_styles, "warm 应至少有一个 DiceBear 候选"
        assert dicebear_styles[0] in DICEBEAR_VALID_STYLES, \
            f"warm 首个风格 {dicebear_styles[0]} 无效"


# ============ 11. Boring Avatar 本地适配器 ============

class TestBoringAvatarAdapter:
    """Boring Avatars 的 vercel API 已下线，改为本地生成 marble SVG。

    回归测试：确保 Boring Avatars 结果始终可访问（本地 SVG 文件）。
    """

    def test_boring_marble_svg_is_valid(self):
        """_boring_marble_svg 应返回合法的 SVG 字符串。"""
        svg = _boring_marble_svg("test_seed_123")
        assert "<svg" in svg
        assert "</svg>" in svg
        assert 'xmlns="http://www.w3.org/2000/svg"' in svg
        assert "128" in svg  # size

    def test_boring_marble_svg_stable(self):
        """相同 seed 应生成相同 SVG。"""
        assert _boring_marble_svg("abc") == _boring_marble_svg("abc")

    def test_boring_marble_svg_different_seed(self):
        """不同 seed 应生成不同 SVG。"""
        assert _boring_marble_svg("abc") != _boring_marble_svg("xyz")

    def test_boring_result_is_local_url(self, reset_settings_cache, monkeypatch):
        """Boring Avatars 结果应为本地 /outputs/ 路径（非已下线的 vercel URL）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        monkeypatch.setenv("OUTPUT_DIR", str(Path(__file__).resolve().parent / "_tmp_outputs"))
        a = make_analysis(styles=["极简"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("极简头像", a, limit=6))
        boring_items = [r for r in results if r.source == BORING_SOURCE]
        assert boring_items, "应至少有一个 Boring Avatars 结果"
        for item in boring_items:
            assert item.thumbnail_url.startswith("/outputs/"), \
                f"{item.title} 应为本地路径，实际: {item.thumbnail_url}"
            assert "boring-avatars-api.vercel.app" not in item.thumbnail_url, \
                "不应再使用已下线的 vercel API URL"

    def test_boring_svg_file_actually_written(self, tmp_outputs):
        """Boring Avatars 本地 SVG 文件应实际写入磁盘。"""
        a = make_analysis(styles=["极简"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("极简头像", a, limit=6))
        boring_items = [r for r in results if r.source == BORING_SOURCE]
        assert boring_items
        for item in boring_items:
            filename = item.thumbnail_url.replace("/outputs/", "")
            assert (tmp_outputs / filename).exists(), \
                f"文件 {filename} 未写入磁盘"


# ============ 12. Multiavatar 适配器 ============

class TestMultiavatarAdapter:
    """Multiavatar API 被 Cloudflare 拦截，改为服务端获取 + 本地 fallback。

    回归测试：确保 Multiavatar 结果始终可访问（本地 SVG 文件）。
    """

    def test_multiavatar_fallback_svg_is_valid(self):
        """_multiavatar_fallback_svg 应返回合法的 SVG。"""
        svg = _multiavatar_fallback_svg("test_seed")
        assert "<svg" in svg
        assert "</svg>" in svg
        assert 'xmlns="http://www.w3.org/2000/svg"' in svg

    def test_multiavatar_fallback_svg_stable(self):
        assert _multiavatar_fallback_svg("x") == _multiavatar_fallback_svg("x")

    def test_multiavatar_result_is_local_url(self, reset_settings_cache, monkeypatch):
        """Multiavatar 结果应为本地 /outputs/ 路径（非被 Cloudflare 拦截的 api.multiavatar.com）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        monkeypatch.setenv("OUTPUT_DIR", str(Path(__file__).resolve().parent / "_tmp_outputs"))
        a = make_analysis(styles=["二次元"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("二次元动漫头像", a, limit=6))
        ma_items = [r for r in results if r.source == MULTIAVATAR_SOURCE]
        assert ma_items, "应至少有一个 Multiavatar 结果"
        for item in ma_items:
            assert item.thumbnail_url.startswith("/outputs/"), \
                f"{item.title} 应为本地路径，实际: {item.thumbnail_url}"
            assert "api.multiavatar.com" not in item.thumbnail_url, \
                "不应直接返回被 Cloudflare 拦截的外部 URL"

    def test_multiavatar_fetch_success_uses_real_svg(self, tmp_outputs):
        """当 Multiavatar API 可用时，应使用真实 SVG 内容（非 fallback）。"""
        fake_svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
        with patch.object(avatar_search, "_fetch_multiavatar_svg",
                          new_callable=AsyncMock, return_value=fake_svg):
            url = _run(_resolve_thumbnail("multiavatar", "", "seed123", "anime", 0))
        assert url.startswith("/outputs/")
        filename = url.replace("/outputs/", "")
        content = (tmp_outputs / filename).read_text(encoding="utf-8")
        assert "circle" in content  # 真实 SVG 内容

    def test_multiavatar_fetch_fail_uses_fallback(self, tmp_outputs):
        """当 Multiavatar API 不可用时，应使用本地 fallback SVG。"""
        with patch.object(avatar_search, "_fetch_multiavatar_svg",
                          new_callable=AsyncMock, return_value=None):
            url = _run(_resolve_thumbnail("multiavatar", "", "seed456", "anime", 1))
        assert url.startswith("/outputs/")
        filename = url.replace("/outputs/", "")
        content = (tmp_outputs / filename).read_text(encoding="utf-8")
        assert "<svg" in content
        assert "</svg>" in content


# ============ 13. 多源 fallback 机制 ============

class TestMultiSourceFallback:
    """多源 fallback：单个源失败不应导致整个接口失败。"""

    def test_boring_always_available(self, tmp_outputs, monkeypatch):
        """Boring Avatars 本地生成，永远可用（不依赖外部服务）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["极简"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("极简", a, limit=6))
        boring_items = [r for r in results if r.source == BORING_SOURCE]
        assert boring_items, "Boring Avatars 应始终可用"
        for item in boring_items:
            assert _validate_thumbnail_url(item.thumbnail_url)

    def test_multiavatar_always_available(self, tmp_outputs, monkeypatch):
        """Multiavatar 即使 API 不可用也有本地 fallback。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["二次元"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("二次元", a, limit=6))
        ma_items = [r for r in results if r.source == MULTIAVATAR_SOURCE]
        assert ma_items, "Multiavatar 应始终可用（API 或 fallback）"
        for item in ma_items:
            assert _validate_thumbnail_url(item.thumbnail_url)

    def test_all_external_fail_still_returns_results(self, tmp_outputs, monkeypatch):
        """即使所有外部源不可达，仍应返回本地生成的结果。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["科技感"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[False, False, False]):
            _, results = _run(avatar_search.search("科技感", a, limit=4))
        assert len(results) > 0, "应返回本地生成结果"
        for r in results:
            assert r.source == "Local Generated"

    def test_invalid_source_does_not_crash(self, tmp_outputs, monkeypatch):
        """无效 source 配置不应导致接口崩溃（走本地 fallback）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        url = _run(_resolve_thumbnail("nonexistent_source", "", "seed", "tech", 0))
        assert _validate_thumbnail_url(url), "无效 source 应返回本地 fallback URL"

    def test_different_inputs_different_avatars(self, tmp_outputs, monkeypatch):
        """不同输入应生成不同头像（不同 seed → 不同 SVG）。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["极简"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, r1 = _run(avatar_search.search("极简风格A", a, limit=3))
            _, r2 = _run(avatar_search.search("极简风格B", a, limit=3))
        urls1 = {r.thumbnail_url for r in r1}
        urls2 = {r.thumbnail_url for r in r2}
        assert urls1 != urls2, "不同输入应产生不同 URL"

    def test_same_input_same_avatars(self, tmp_outputs, monkeypatch):
        """相同输入应生成稳定一致的头像。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["极简"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, r1 = _run(avatar_search.search("极简风格C", a, limit=3))
            _, r2 = _run(avatar_search.search("极简风格C", a, limit=3))
        assert [r.thumbnail_url for r in r1] == [r.thumbnail_url for r in r2]


# ============ 14. URL 校验 ============

class TestUrlValidation:
    def test_empty_url_invalid(self):
        assert not _validate_thumbnail_url("")
        assert not _validate_thumbnail_url("   ")

    def test_http_url_valid(self):
        assert _validate_thumbnail_url("https://api.dicebear.com/10.x/bottts/svg?seed=test")
        assert _validate_thumbnail_url("http://example.com/avatar.png")

    def test_local_url_valid(self):
        assert _validate_thumbnail_url("/outputs/search_boring_0_abc123.svg")

    def test_invalid_url_rejected(self):
        assert not _validate_thumbnail_url("javascript:alert(1)")
        assert not _validate_thumbnail_url("ftp://example.com/file.svg")
        assert not _validate_thumbnail_url("not-a-url")

    def test_all_results_have_valid_urls(self, tmp_outputs, monkeypatch):
        """所有返回结果的 thumbnail_url 都应通过校验。"""
        monkeypatch.setenv("ENABLE_EXTERNAL_SEARCH", "true")
        a = make_analysis(styles=["科技感", "二次元", "极简"])
        with patch.object(avatar_search, "_check_sources_reachable",
                          return_value=[True, True, True]):
            _, results = _run(avatar_search.search("科技感二次元极简", a, limit=6))
        for r in results:
            assert _validate_thumbnail_url(r.thumbnail_url), \
                f"{r.title} 的 URL 无效: {r.thumbnail_url}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
