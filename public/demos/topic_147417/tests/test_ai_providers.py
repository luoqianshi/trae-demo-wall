"""AI Provider 单元测试 — HomeWizard 智能家居规划器

测试范围：
1. Provider 工厂函数（get_ai_provider）与 PROVIDER_INFO 元数据
2. _build_prompt 提示词构建逻辑
3. _parse_plan_response 响应解析逻辑
4. validate_api_key API Key 校验逻辑
5. auto 模式下的本地兜底机制

所有测试均为离线测试，不发起任何真实 HTTP 请求。
HTTP 调用通过 unittest.mock 进行 mock。
"""
import os
import sys
import json
import pytest
from unittest.mock import patch

# 项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# 设置 streamlit session_state（router.py 部分函数读取 session_state）
import streamlit as st

from core.ai_providers import (
    AIProvider,
    DeepSeekProvider,
    TongyiProvider,
    ZhipuProvider,
    KimiProvider,
    OpenAIProvider,
    OllamaProvider,
    get_ai_provider,
    PROVIDER_INFO,
    DEFAULT_CONFIGS,
    DEFAULT_TIMEOUT,
)
from core.router import generate_plan


# ============================================
# 1. Provider 工厂函数测试
# ============================================
class TestProviderFactory:
    """测试 get_ai_provider 工厂函数与 PROVIDER_INFO 元数据。"""

    def test_get_deepseek_provider(self):
        """get_ai_provider('deepseek') 应返回非 None 的 DeepSeekProvider 实例。"""
        provider = get_ai_provider('deepseek')
        assert provider is not None
        assert isinstance(provider, DeepSeekProvider)

    def test_get_tongyi_provider(self):
        """get_ai_provider('tongyi') 应返回非 None 的 TongyiProvider 实例。"""
        provider = get_ai_provider('tongyi')
        assert provider is not None
        assert isinstance(provider, TongyiProvider)

    def test_get_zhipu_provider(self):
        """get_ai_provider('zhipu') 应返回非 None 的 ZhipuProvider 实例。"""
        provider = get_ai_provider('zhipu')
        assert provider is not None
        assert isinstance(provider, ZhipuProvider)

    def test_get_kimi_provider(self):
        """get_ai_provider('kimi') 应返回非 None 的 KimiProvider 实例。"""
        provider = get_ai_provider('kimi')
        assert provider is not None
        assert isinstance(provider, KimiProvider)

    def test_get_openai_provider(self):
        """get_ai_provider('openai') 应返回非 None 的 OpenAIProvider 实例。"""
        provider = get_ai_provider('openai')
        assert provider is not None
        assert isinstance(provider, OpenAIProvider)

    def test_get_ollama_provider(self):
        """get_ai_provider('ollama') 应返回非 None 的 OllamaProvider 实例。"""
        provider = get_ai_provider('ollama')
        assert provider is not None
        assert isinstance(provider, OllamaProvider)

    def test_invalid_provider(self):
        """get_ai_provider('nonexistent') 应返回 None。"""
        provider = get_ai_provider('nonexistent')
        assert provider is None

    def test_provider_info(self):
        """PROVIDER_INFO 应包含全部 6 个 provider 的元数据，且字段齐全。"""
        expected_providers = {'deepseek', 'tongyi', 'zhipu', 'kimi', 'openai', 'ollama'}
        assert expected_providers.issubset(set(PROVIDER_INFO.keys()))
        # 每个 provider 信息应包含必需字段
        for name in expected_providers:
            info = PROVIDER_INFO[name]
            assert 'icon' in info, f"{name} 缺少 icon 字段"
            assert 'name' in info, f"{name} 缺少 name 字段"
            assert 'recommended' in info, f"{name} 缺少 recommended 字段"
            assert 'desc' in info, f"{name} 缺少 desc 字段"


# ============================================
# 2. 提示词构建测试
# ============================================
class TestPromptBuilding:
    """测试 AIProvider._build_prompt 方法。"""

    def _make_provider(self):
        """创建一个 DeepSeekProvider 实例用于测试 _build_prompt。"""
        return DeepSeekProvider()

    def _make_devices(self, count=2):
        """生成指定数量的 mock 设备列表。"""
        return [
            {
                'id': f'dev_{i}',
                'name': f'设备{i}',
                'price': 50 + i,
                'category': '照明',
                'applicable_area': '客厅',
                'features': ['语音控制', '远程控制'],
            }
            for i in range(count)
        ]

    def test_prompt_contains_user_input(self):
        """prompt 应包含用户输入的原始文本。"""
        provider = self._make_provider()
        prompt = provider._build_prompt(
            user_input='我需要全屋灯光',
            floorplan='两室一厅',
            budget_tier='平衡',
            devices=self._make_devices(),
        )
        assert '我需要全屋灯光' in prompt

    def test_prompt_contains_budget(self):
        """prompt 应包含预算档位信息。"""
        provider = self._make_provider()
        budget_tier = '高端'
        prompt = provider._build_prompt(
            user_input='我需要全屋灯光',
            floorplan='两室一厅',
            budget_tier=budget_tier,
            devices=self._make_devices(),
        )
        assert budget_tier in prompt

    def test_prompt_device_limit(self):
        """设备列表超过 200 个时，prompt 应只包含前 200 个。"""
        provider = self._make_provider()
        devices = self._make_devices(count=250)
        prompt = provider._build_prompt(
            user_input='我需要全屋灯光',
            floorplan='两室一厅',
            budget_tier='平衡',
            devices=devices,
        )
        # 前 200 个设备（索引 0~199）的 id 应出现在 prompt 中
        assert 'id=dev_199' in prompt
        # 第 201 个及之后的设备 id 不应出现
        assert 'id=dev_200' not in prompt
        # 统计设备行数应为 200
        assert prompt.count('id=dev_') == 200

    def test_prompt_has_json_instruction(self):
        """prompt 应包含 JSON 格式返回要求。"""
        provider = self._make_provider()
        prompt = provider._build_prompt(
            user_input='我需要全屋灯光',
            floorplan='两室一厅',
            budget_tier='平衡',
            devices=self._make_devices(),
        )
        assert 'JSON' in prompt


# ============================================
# 3. 响应解析测试
# ============================================
class TestResponseParsing:
    """测试 AIProvider._parse_plan_response 方法。"""

    @pytest.fixture
    def device_map(self):
        """mock 设备映射字典，用于 _parse_plan_response 测试。"""
        return {
            'xiaomi_bulb': {
                'id': 'xiaomi_bulb',
                'name': '智能灯泡',
                'price': 49,
                'category': '照明',
            },
            'xiaomi_socket': {
                'id': 'xiaomi_socket',
                'name': '智能插座',
                'price': 59,
                'category': '插座',
            },
        }

    def _make_provider(self):
        """创建一个 DeepSeekProvider 实例用于测试 _parse_plan_response。"""
        return DeepSeekProvider()

    def test_parse_valid_response(self, device_map):
        """有效的 JSON 响应（含设备 id）应正确解析为方案字典。"""
        provider = self._make_provider()
        response = json.dumps({
            'scene_name': '全屋灯光方案',
            'description': '智能灯光组合',
            'devices': [
                {'id': 'xiaomi_bulb', 'reason': '主灯'},
                {'id': 'xiaomi_socket', 'reason': '供电'},
            ],
            'actions': ['语音开灯', '定时关灯'],
            'confidence': 0.9,
        }, ensure_ascii=False)
        result = provider._parse_plan_response(
            response, list(device_map.values()), 'deepseek'
        )
        assert result is not None
        assert result['scene_name'] == '全屋灯光方案'
        assert result['description'] == '智能灯光组合'
        # 设备应被映射为完整字典
        assert len(result['devices']) == 2
        assert result['devices'][0]['id'] == 'xiaomi_bulb'
        assert result['devices'][0]['name'] == '智能灯泡'
        assert result['devices'][1]['id'] == 'xiaomi_socket'
        assert result['devices'][1]['name'] == '智能插座'
        assert result['actions'] == ['语音开灯', '定时关灯']
        assert result['confidence'] == 0.9
        assert result['source'] == 'ai:deepseek'
        assert result['matched_keywords'] == []

    def test_parse_code_block_response(self, device_map):
        """被 ```json ... ``` 包裹的响应应能正确解析。"""
        provider = self._make_provider()
        raw_json = json.dumps({
            'scene_name': '代码块方案',
            'description': '测试代码块解析',
            'devices': [{'id': 'xiaomi_bulb', 'reason': '照明'}],
            'actions': ['开灯'],
            'confidence': 0.8,
        }, ensure_ascii=False)
        response = f"```json\n{raw_json}\n```"
        result = provider._parse_plan_response(
            response, list(device_map.values()), 'deepseek'
        )
        assert result is not None
        assert result['scene_name'] == '代码块方案'
        assert len(result['devices']) == 1
        assert result['devices'][0]['id'] == 'xiaomi_bulb'

    def test_parse_invalid_json(self, device_map):
        """格式错误的 JSON 应返回 None。"""
        provider = self._make_provider()
        response = '这不是合法的 JSON {{{'
        result = provider._parse_plan_response(
            response, list(device_map.values()), 'deepseek'
        )
        assert result is None

    def test_parse_empty_response(self, device_map):
        """空字符串响应应返回 None。"""
        provider = self._make_provider()
        result = provider._parse_plan_response(
            '', list(device_map.values()), 'deepseek'
        )
        assert result is None

    def test_parse_no_matching_devices(self, device_map):
        """响应中设备 id 均不在 device_map 中时返回 None。"""
        provider = self._make_provider()
        response = json.dumps({
            'scene_name': '无匹配方案',
            'description': '设备 id 均不存在',
            'devices': [
                {'id': 'nonexistent_device_1', 'reason': '不存在'},
                {'id': 'nonexistent_device_2', 'reason': '不存在'},
            ],
            'actions': [],
            'confidence': 0.5,
        }, ensure_ascii=False)
        result = provider._parse_plan_response(
            response, list(device_map.values()), 'deepseek'
        )
        assert result is None


# ============================================
# 4. API Key 校验测试
# ============================================
class TestApiKeyValidation:
    """测试各 Provider 的 validate_api_key 方法。"""

    def test_empty_api_key(self):
        """空字符串 API Key 应返回 (False, ...)。"""
        provider = DeepSeekProvider()
        is_valid, msg = provider.validate_api_key('')
        assert is_valid is False
        assert isinstance(msg, str)
        assert msg  # 消息非空

    def test_none_api_key(self):
        """None 值 API Key 应返回 (False, ...)。"""
        provider = DeepSeekProvider()
        is_valid, msg = provider.validate_api_key(None)
        assert is_valid is False
        assert isinstance(msg, str)
        assert msg  # 消息非空

    def test_ollama_no_key_needed(self):
        """Ollama 无需 API Key，mock HTTP 返回成功时应返回 (True, ...)。"""
        provider = OllamaProvider()
        # mock _http_get 返回 Ollama /api/tags 的成功响应（不发起真实请求）
        with patch('core.ai_providers._http_get') as mock_get:
            mock_get.return_value = {
                'models': [{'name': 'qwen:7b'}, {'name': 'llama3:8b'}]
            }
            is_valid, msg = provider.validate_api_key('')
            assert is_valid is True
            assert isinstance(msg, str)
            # 确认仅调用了 mock，未发起真实 HTTP 请求
            mock_get.assert_called_once()


# ============================================
# 5. 自动兜底机制测试
# ============================================
class TestAutoFallback:
    """测试 auto 模式下 AI 失败时降级到本地规则的机制。"""

    def test_fallback_to_local(self):
        """mode='auto' 且无 API Key 时，应返回本地规则生成的有效方案。

        场景：启用 AI（use_ai=True）但未配置 API Key，
        AI 调用会因缺少 Key 返回 None，路由应降级到本地规则。
        """
        # 重置并配置 streamlit session_state
        st.session_state['use_ai'] = True
        st.session_state['ai_provider'] = 'deepseek'
        st.session_state['ai_api_keys'] = {}  # 无 API Key
        st.session_state['ai_custom_configs'] = {}

        result = generate_plan(
            user_input='我需要全屋灯光',
            budget=3000,
            mode='auto',
            floorplan='两室一厅',
            budget_tier='平衡',
        )
        # 应返回有效的本地方案（非 None，且包含设备列表）
        assert result is not None
        assert 'devices' in result
        assert isinstance(result['devices'], list)
        # 本地兜底应至少包含一个设备
        assert len(result['devices']) >= 1
        # source 应为本地来源（local / keyword_fallback / fallback 之一）
        assert result.get('source') in ('local', 'keyword_fallback', 'fallback')
