"""ExternalImageGenerator（DiceBear）单元测试。

覆盖：
1. 正常调用 DiceBear API 成功生成头像
2. 无 API Key 时走 fallback
3. 外部接口异常时走 fallback（网络异常 / 非 2xx / 空响应 / 非图片内容）
4. size 参数解析
5. 不在日志中泄露 API Key

运行：
    cd backend
    python -m pytest tests/test_image_generator.py -v
"""
from __future__ import annotations

import io
import logging
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# 让 tests/ 可以导入 backend 包内的模块
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from schemas import Analysis, GeneratedImage  # noqa: E402
from services.image_generator import (  # noqa: E402
    DICEBEAR_DEFAULT_BASE,
    ExternalImageGenerator,
    LocalFallbackGenerator,
    _parse_size,
    _pick_dicebear_style,
    _stable_seed,
)


# ============ 测试夹具 ============

def make_analysis(styles=None, subjects=None, colors=None, usages=None) -> Analysis:
    """构造一个 Analysis 对象用于测试。"""
    return Analysis(
        styles=styles or [],
        colors=colors or [],
        subjects=subjects or [],
        usages=usages or [],
        directions=[],
        negative_keywords=[],
    )


@pytest.fixture
def tmp_outputs(tmp_path, monkeypatch):
    """把 outputs 目录重定向到临时目录，避免污染真实 outputs/。"""
    outputs = tmp_path / "outputs"
    outputs.mkdir()
    monkeypatch.setenv("OUTPUT_DIR", str(outputs))
    # 清掉 settings 缓存，让新环境变量生效
    from config import get_settings
    get_settings.cache_clear()
    yield outputs
    get_settings.cache_clear()


@pytest.fixture
def fake_png_bytes() -> bytes:
    """构造一份合法的 PNG 文件字节（最小 PNG 头 + IHDR + IEND）。"""
    # PNG 签名 + 一个最小 IHDR chunk + IEND chunk
    sig = b"\x89PNG\r\n\x1a\n"
    # IHDR: 13 bytes data, width=1 height=1 bitdepth=8 colortype=2 ...
    ihdr = (
        b"\x00\x00\x00\x0dIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00"
        b"\x90wS\xde"
    )
    # IDAT (空图像数据，仅用于测试文件头校验)
    idat = b"\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfeA\x8e\x15\x7f"
    # IEND
    iend = b"\x00\x00\x00\x00IEND\xaeB`\x82"
    return sig + ihdr + idat + iend


def make_fake_response(content: bytes, status_code: int = 200):
    """构造一个假的 httpx.Response 对象。"""
    resp = MagicMock()
    resp.status_code = status_code
    resp.content = content
    return resp


# ============ 1. size 参数解析 ============

class TestParseSize:
    def test_wxh_format(self):
        assert _parse_size("78x78") == 78
        assert _parse_size("128x128") == 128
        assert _parse_size("512x512") == 256  # 截断到 256

    def test_uppercase(self):
        assert _parse_size("128X128") == 128

    def test_invalid_returns_default(self):
        assert _parse_size("junk") == 128
        assert _parse_size("") == 128
        assert _parse_size(None) == 128

    def test_too_small_returns_default(self):
        assert _parse_size("0x0") == 128
        assert _parse_size("-5x-5") == 128


# ============ 2. style 推断 ============

class TestPickStyle:
    def test_tech_programmer_returns_bottts(self):
        a = make_analysis(styles=["科技感"], subjects=["程序员"])
        assert _pick_dicebear_style(a) == "bottts"

    def test_robot_returns_bottts(self):
        a = make_analysis(styles=[], subjects=["机器人"])
        assert _pick_dicebear_style(a) == "bottts"

    def test_pixel_game_returns_pixel_art(self):
        a = make_analysis(styles=["像素风", "游戏风"])
        assert _pick_dicebear_style(a) == "pixel-art"

    def test_anime_returns_adventurer(self):
        a = make_analysis(styles=["二次元"])
        assert _pick_dicebear_style(a) == "adventurer"

    def test_healing_returns_lorelei(self):
        a = make_analysis(styles=["治愈系"])
        assert _pick_dicebear_style(a) == "lorelei"

    def test_default_pixel_art(self):
        a = make_analysis(styles=[], subjects=[])
        assert _pick_dicebear_style(a) == "pixel-art"


# ============ 3. stable seed ============

class TestStableSeed:
    def test_same_input_same_output(self):
        assert _stable_seed("hello") == _stable_seed("hello")

    def test_different_input_different_output(self):
        assert _stable_seed("hello") != _stable_seed("world")

    def test_returns_hex_string(self):
        s = _stable_seed("test")
        assert len(s) == 16
        int(s, 16)  # 能解析为 hex 即合法


# ============ 4. 无 API Key 时走 fallback ============

class TestNoKeyFallback:
    def test_no_key_uses_local_fallback(self, tmp_outputs, monkeypatch):
        # 不设置 IMAGE_API_KEY
        monkeypatch.setenv("IMAGE_API_KEY", "")
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        from config import get_settings
        get_settings.cache_clear()

        gen = ExternalImageGenerator()
        assert gen._has_key is False

        analysis = make_analysis(styles=["科技感"])
        result = gen.generate("prompt", "neg", "128x128", analysis, "text")

        # 应该走 fallback，provider 是 local-fallback
        assert result.provider == "local-fallback"
        # 不应该出现 dicebear 相关 metadata
        assert "dicebear_style" not in result.metadata


# ============ 5. 正常调用 DiceBear 成功 ============

class TestDicebearSuccess:
    def test_successful_generation(self, tmp_outputs, monkeypatch, fake_png_bytes):
        # 配置 API Key（任意非空值即可，DiceBear 不需要真实 Key）
        monkeypatch.setenv("IMAGE_API_KEY", "test-key-xxx")
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        from config import get_settings
        get_settings.cache_clear()

        gen = ExternalImageGenerator()
        assert gen._has_key is True

        # mock httpx.Client
        fake_resp = make_fake_response(fake_png_bytes, status_code=200)

        with patch("httpx.Client") as mock_client_cls:
            client = MagicMock()
            client.__enter__.return_value = client
            client.__exit__.return_value = None
            client.get.return_value = fake_resp
            mock_client_cls.return_value = client

            analysis = make_analysis(styles=["科技感"], subjects=["程序员"])
            result = gen.generate("a tech avatar", "no bad", "128x128", analysis, "蓝色科技感")

        # 验证返回值
        assert isinstance(result, GeneratedImage)
        assert result.provider == "external"
        assert result.image_url.startswith("/outputs/")
        assert result.image_url.endswith(".png")
        assert result.seed is not None
        assert result.metadata["dicebear_style"] == "bottts"
        assert result.metadata["source"] == "DiceBear"
        assert result.metadata["size_px"] == 128

        # 验证文件确实保存了
        file_path = tmp_outputs / Path(result.image_url).name
        assert file_path.exists()
        assert file_path.read_bytes() == fake_png_bytes

        # 验证 httpx 调用的 URL 包含正确参数
        call_args = client.get.call_args
        url = call_args[0][0] if call_args[0] else call_args[1].get("url", "")
        assert "dicebear.com" in url or "api.dicebear.com" in url
        assert "/bottts/png" in url
        assert "seed=" in url
        assert "size=128" in url

    def test_stable_seed_for_same_text(self, tmp_outputs, monkeypatch, fake_png_bytes):
        """相同 text 应该产生相同 seed（URL 中的 seed 一致）。"""
        monkeypatch.setenv("IMAGE_API_KEY", "test-key")
        from config import get_settings
        get_settings.cache_clear()

        gen = ExternalImageGenerator()
        fake_resp = make_fake_response(fake_png_bytes, 200)
        analysis = make_analysis(styles=["像素风"])

        urls_seen = []
        with patch("httpx.Client") as mock_client_cls:
            client = MagicMock()
            client.__enter__.return_value = client
            client.__exit__.return_value = None
            client.get.return_value = fake_resp
            mock_client_cls.return_value = client

            gen.generate("p", "n", "128x128", analysis, "same text")
            urls_seen.append(client.get.call_args[0][0])
            gen.generate("p", "n", "128x128", analysis, "same text")
            urls_seen.append(client.get.call_args[0][0])

        # 两次 seed 应该一致
        assert "seed=" in urls_seen[0]
        assert urls_seen[0] == urls_seen[1]


# ============ 6. 外部接口异常时走 fallback ============

class TestDicebearFallback:
    def _make_gen_with_key(self, monkeypatch):
        monkeypatch.setenv("IMAGE_API_KEY", "test-key-xxx")
        from config import get_settings
        get_settings.cache_clear()
        return ExternalImageGenerator()

    def test_non_2xx_falls_back(self, tmp_outputs, monkeypatch, fake_png_bytes):
        gen = self._make_gen_with_key(monkeypatch)
        fake_resp = make_fake_response(b"error page", status_code=500)
        analysis = make_analysis(styles=["科技感"])

        with patch("httpx.Client") as mock_client_cls:
            client = MagicMock()
            client.__enter__.return_value = client
            client.__exit__.return_value = None
            client.get.return_value = fake_resp
            mock_client_cls.return_value = client

            result = gen.generate("p", "n", "128x128", analysis, "text")

        assert result.provider == "local-fallback"

    def test_empty_content_falls_back(self, tmp_outputs, monkeypatch):
        gen = self._make_gen_with_key(monkeypatch)
        fake_resp = make_fake_response(b"", status_code=200)
        analysis = make_analysis(styles=["科技感"])

        with patch("httpx.Client") as mock_client_cls:
            client = MagicMock()
            client.__enter__.return_value = client
            client.__exit__.return_value = None
            client.get.return_value = fake_resp
            mock_client_cls.return_value = client

            result = gen.generate("p", "n", "128x128", analysis, "text")

        assert result.provider == "local-fallback"

    def test_non_png_content_falls_back(self, tmp_outputs, monkeypatch):
        gen = self._make_gen_with_key(monkeypatch)
        # 非 PNG 内容（HTML 错误页）
        fake_resp = make_fake_response(b"<html>error</html>", status_code=200)
        analysis = make_analysis(styles=["科技感"])

        with patch("httpx.Client") as mock_client_cls:
            client = MagicMock()
            client.__enter__.return_value = client
            client.__exit__.return_value = None
            client.get.return_value = fake_resp
            mock_client_cls.return_value = client

            result = gen.generate("p", "n", "128x128", analysis, "text")

        assert result.provider == "local-fallback"

    def test_network_exception_falls_back(self, tmp_outputs, monkeypatch):
        gen = self._make_gen_with_key(monkeypatch)
        analysis = make_analysis(styles=["科技感"])

        with patch("httpx.Client") as mock_client_cls:
            client = MagicMock()
            client.__enter__.return_value = client
            client.__exit__.return_value = None
            # 模拟网络异常
            client.get.side_effect = Exception("network timeout")
            mock_client_cls.return_value = client

            result = gen.generate("p", "n", "128x128", analysis, "text")

        assert result.provider == "local-fallback"

    def test_request_exception_falls_back(self, tmp_outputs, monkeypatch):
        """httpx 构造阶段就抛异常也应回退。"""
        gen = self._make_gen_with_key(monkeypatch)
        analysis = make_analysis(styles=["科技感"])

        with patch("httpx.Client", side_effect=Exception("client init failed")):
            result = gen.generate("p", "n", "128x128", analysis, "text")

        assert result.provider == "local-fallback"


# ============ 7. 日志不泄露 API Key ============

class TestNoKeyLeak:
    def test_api_key_not_in_logs(self, tmp_outputs, monkeypatch, fake_png_bytes, caplog):
        secret = "super-secret-key-do-not-leak-12345"
        monkeypatch.setenv("IMAGE_API_KEY", secret)
        from config import get_settings
        get_settings.cache_clear()

        gen = ExternalImageGenerator()
        fake_resp = make_fake_response(fake_png_bytes, 200)
        analysis = make_analysis(styles=["科技感"], subjects=["程序员"])

        with patch("httpx.Client") as mock_client_cls:
            client = MagicMock()
            client.__enter__.return_value = client
            client.__exit__.return_value = None
            client.get.return_value = fake_resp
            mock_client_cls.return_value = client

            with caplog.at_level(logging.DEBUG, logger="avatar.imagegen"):
                gen.generate("prompt", "neg", "128x128", analysis, "text")

        # 收集所有日志输出
        log_text = caplog.text
        assert secret not in log_text, f"API Key 泄露到日志中: {log_text}"

        # 但应该有正常的工作日志（style / size）
        assert "dicebear" in log_text.lower() or "external" in log_text.lower()

    def test_safe_log_dict_hides_key(self, tmp_outputs, monkeypatch):
        monkeypatch.setenv("IMAGE_API_KEY", "secret-xyz")
        from config import get_settings
        get_settings.cache_clear()

        s = get_settings()
        d = s.safe_log_dict()
        # safe_log_dict 不应包含 key 字段
        assert "image_api_key" not in d
        assert "secret-xyz" not in str(d)
        # 但应包含是否配置的状态
        assert d["image_api_key_configured"] is True


# ============ 8. base_url 解析 ============

class TestBaseUrl:
    def test_default_base_when_not_configured(self, tmp_outputs, monkeypatch):
        monkeypatch.setenv("IMAGE_API_KEY", "x")
        monkeypatch.delenv("IMAGE_API_BASE_URL", raising=False)
        from config import get_settings
        get_settings.cache_clear()

        gen = ExternalImageGenerator()
        assert gen._resolve_base_url() == DICEBEAR_DEFAULT_BASE

    def test_custom_base(self, tmp_outputs, monkeypatch):
        monkeypatch.setenv("IMAGE_API_KEY", "x")
        monkeypatch.setenv("IMAGE_API_BASE_URL", "https://custom.dicebear.example/9.x/")
        from config import get_settings
        get_settings.cache_clear()

        gen = ExternalImageGenerator()
        # 应去掉尾部斜杠
        assert gen._resolve_base_url() == "https://custom.dicebear.example/9.x"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
