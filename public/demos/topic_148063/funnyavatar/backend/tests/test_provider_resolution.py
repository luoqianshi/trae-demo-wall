"""Provider 解析逻辑单元测试。

覆盖本次修复的核心场景：
1. IMAGE_PROVIDER=external 时，provider='auto' 应走 external（不走 DCGAN）
2. provider='external' 显式指定时走 external
3. provider='dcgan-celeba-local' 显式指定时走 DCGAN
4. provider='local' 显式指定时走 local-fallback
5. provider=None / '' / 'auto' 时读 .env 配置
6. 大小写 / 空格容错（'External' / ' external '）
7. 缓存命中时不重新生成
8. _do_generate 的 provider 解析与 get_generator 一致

运行：
    cd backend
    python -m pytest tests/test_provider_resolution.py -v
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from schemas import Analysis, GeneratedImage  # noqa: E402
from services import image_generator  # noqa: E402
from services.image_generator import (  # noqa: E402
    ExternalImageGenerator,
    LocalFallbackGenerator,
    get_generator,
)


def make_analysis() -> Analysis:
    return Analysis(
        styles=["科技感"], colors=["蓝色"], subjects=["程序员"],
        usages=["GitHub"], directions=[], negative_keywords=[],
    )


def make_generated(provider: str) -> GeneratedImage:
    return GeneratedImage(
        image_url=f"/outputs/x_{provider}.png",
        prompt="p", negative_prompt="n",
        provider=provider, seed=42, metadata={},
    )


@pytest.fixture
def reset_settings_cache():
    """每个测试前后清掉 settings 缓存，确保环境变量生效。"""
    from config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def reset_generator_cache():
    """清掉 image_generator 模块级单例缓存。"""
    image_generator._generator = None
    yield
    image_generator._generator = None


# ============ 1. get_generator provider 解析 ============

class TestGetGeneratorProviderResolution:
    """验证 get_generator() 对 provider 参数的解析。"""

    def test_auto_reads_env_external(self, reset_settings_cache, monkeypatch):
        """provider='auto' 时读 .env，IMAGE_PROVIDER=external → ExternalImageGenerator。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        gen = get_generator("auto")
        assert isinstance(gen, ExternalImageGenerator)

    def test_none_reads_env_external(self, reset_settings_cache, monkeypatch):
        """provider=None 时读 .env。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        gen = get_generator(None)
        assert isinstance(gen, ExternalImageGenerator)

    def test_empty_reads_env_external(self, reset_settings_cache, monkeypatch):
        """provider='' 时读 .env。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        gen = get_generator("")
        assert isinstance(gen, ExternalImageGenerator)

    def test_explicit_external_overrides_env_local(self, reset_settings_cache, monkeypatch):
        """provider='external' 显式指定时，即使 .env 是 local 也走 external。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "local")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        gen = get_generator("external")
        assert isinstance(gen, ExternalImageGenerator)

    def test_explicit_local_overrides_env_external(self, reset_settings_cache, monkeypatch):
        """provider='local' 显式指定时，即使 .env 是 external 也走 local。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        gen = get_generator("local")
        assert isinstance(gen, LocalFallbackGenerator)

    def test_auto_reads_env_local(self, reset_settings_cache, monkeypatch):
        """provider='auto' 且 .env=local → LocalFallbackGenerator。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "local")
        gen = get_generator("auto")
        assert isinstance(gen, LocalFallbackGenerator)

    def test_auto_default_when_env_unset(self, reset_settings_cache, monkeypatch):
        """provider='auto' 且 .env 显式设为空 → 默认 local。"""
        # 注意：pydantic-settings 会读 .env 文件，monkeypatch.delenv 不能清掉 .env 里的值，
        # 所以这里显式设为空字符串来模拟「未配置」。
        monkeypatch.setenv("IMAGE_PROVIDER", "")
        gen = get_generator("auto")
        assert isinstance(gen, LocalFallbackGenerator)

    def test_case_insensitive(self, reset_settings_cache, monkeypatch):
        """大小写不敏感：'External' / 'EXTERNAL' 都能识别。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "local")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        assert isinstance(get_generator("External"), ExternalImageGenerator)
        assert isinstance(get_generator("EXTERNAL"), ExternalImageGenerator)

    def test_whitespace_trimmed(self, reset_settings_cache, monkeypatch):
        """首尾空格被去除：'  external  ' → external。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "local")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        gen = get_generator("  external  ")
        assert isinstance(gen, ExternalImageGenerator)

    def test_unknown_provider_falls_to_local(self, reset_settings_cache, monkeypatch):
        """未知 provider 名 → 默认 local（不抛错）。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "local")
        gen = get_generator("some-unknown-provider")
        assert isinstance(gen, LocalFallbackGenerator)


# ============ 2. external provider 不应走 DCGAN ============

class TestExternalDoesNotUseDcgan:
    """关键回归：IMAGE_PROVIDER=external 时绝不能走 DCGAN。"""

    def test_external_provider_is_not_dcgan(self, reset_settings_cache, monkeypatch):
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        gen = get_generator("auto")
        # 必须是 ExternalImageGenerator，不是 DCGANCelebAGenerator
        assert gen.provider_name == "external"
        assert gen.provider_name != "dcgan-celeba-local"

    def test_dcgan_only_when_explicit(self, reset_settings_cache, monkeypatch):
        """只有显式 provider='dcgan-celeba-local' 才走 DCGAN。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        gen = get_generator("dcgan-celeba-local")
        assert gen.provider_name == "dcgan-celeba-local"


# ============ 3. _do_generate provider 解析 ============

class TestDoGenerateProviderResolution:
    """验证 main._do_generate 的 provider 解析与 get_generator 一致。"""

    def _run(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)

    def _patch_main_settings(self, monkeypatch, **overrides):
        """重新构造一个 Settings 并替换 main.settings，确保 _do_generate 读到最新配置。"""
        from config import Settings
        from main import settings as old_settings
        new_kwargs = dict(
            image_provider=old_settings.image_provider,
            image_api_key=old_settings.image_api_key,
            image_api_base_url=old_settings.image_api_base_url,
            image_model=old_settings.image_model,
            output_dir=str(old_settings.output_path),
            cache_dir=str(old_settings.cache_path),
            generate_timeout=old_settings.generate_timeout,
            max_input_length=old_settings.max_input_length,
        )
        new_kwargs.update(overrides)
        new_settings = Settings(**new_kwargs)
        monkeypatch.setattr("main.settings", new_settings)
        return new_settings

    def test_auto_with_env_external_calls_external(self, reset_settings_cache, monkeypatch):
        """provider='auto' + .env=external → 调用 ExternalImageGenerator.generate。"""
        self._patch_main_settings(monkeypatch,
                                  image_provider="external",
                                  image_api_key="any-non-empty")

        from main import _do_generate
        fake_result = make_generated("external")
        with patch.object(ExternalImageGenerator, "generate", return_value=fake_result) as m:
            with patch.object(LocalFallbackGenerator, "generate") as m_local:
                # mock 掉 cache，避免命中磁盘上的旧缓存
                with patch("main.cache.get", return_value=None), \
                     patch("main.cache.set"):
                    result = self._run(_do_generate(
                        "p", "n", make_analysis(), "text", "auto", False,
                    ))
        assert result.provider == "external"
        m.assert_called_once()
        m_local.assert_not_called()

    def test_explicit_external_does_not_call_dcgan(self, reset_settings_cache, monkeypatch):
        """provider='external' 时绝不调用 DCGAN 的 generate。"""
        self._patch_main_settings(monkeypatch,
                                  image_provider="local",  # 故意设成 local
                                  image_api_key="any-non-empty")

        from main import _do_generate
        fake_result = make_generated("external")
        with patch.object(ExternalImageGenerator, "generate", return_value=fake_result) as m_ext:
            # 如果错误地走了 DCGAN，这里会触发 DCGAN 的 generate；我们让它抛错以暴露问题
            with patch("services.dcgan_celeba_generator.get_dcgan_generator") as m_dcgan_factory:
                m_dcgan_factory.side_effect = AssertionError("DCGAN should NOT be called when provider=external")
                with patch("main.cache.get", return_value=None), \
                     patch("main.cache.set"):
                    result = self._run(_do_generate(
                        "p", "n", make_analysis(), "text", "external", False,
                    ))
        assert result.provider == "external"
        m_ext.assert_called_once()

    def test_auto_with_env_local_uses_local(self, reset_settings_cache, monkeypatch):
        """provider='auto' + .env=local → LocalFallbackGenerator。"""
        self._patch_main_settings(monkeypatch, image_provider="local")

        from main import _do_generate
        fake_result = make_generated("local-fallback")
        with patch.object(LocalFallbackGenerator, "generate", return_value=fake_result) as m_local:
            with patch.object(ExternalImageGenerator, "generate") as m_ext:
                with patch("main.cache.get", return_value=None), \
                     patch("main.cache.set"):
                    result = self._run(_do_generate(
                        "p", "n", make_analysis(), "text", "auto", False,
                    ))
        assert result.provider == "local-fallback"
        m_local.assert_called_once()
        m_ext.assert_not_called()


# ============ 4. 缓存命中时不重新生成 ============

class TestCacheBehavior:
    """验证 local/external 走缓存。"""

    def _run(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)

    def test_external_uses_cache(self, reset_settings_cache, monkeypatch, tmp_path):
        """external 第二次调用相同 prompt 应命中缓存，不重新生成。"""
        monkeypatch.setenv("IMAGE_PROVIDER", "external")
        monkeypatch.setenv("IMAGE_API_KEY", "any-non-empty")
        monkeypatch.setenv("OUTPUT_DIR", str(tmp_path))
        monkeypatch.setenv("CACHE_DIR", str(tmp_path / "cache"))

        from main import _do_generate
        fake_result = make_generated("external")
        with patch.object(ExternalImageGenerator, "generate", return_value=fake_result) as m:
            # 第一次：缓存未命中，调用真实 generate，写缓存
            with patch("main.cache.get", return_value=None) as m_cache_get:
                with patch("main.cache.set") as m_cache_set:
                    self._run(_do_generate("same-prompt", "n", make_analysis(), "text", "external", False))
                    # 第二次：模拟缓存命中
                    m_cache_get.return_value = fake_result.model_dump()
                    self._run(_do_generate("same-prompt", "n", make_analysis(), "text", "external", False))

        # 真实 generate 只应被调用一次（第二次走缓存）
        assert m.call_count == 1
        assert m_cache_set.call_count == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
