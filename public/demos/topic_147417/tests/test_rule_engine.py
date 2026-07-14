"""规则引擎测试模块。

测试 HomeWizard 智能家居规划器的核心规则匹配与方案生成功能，
覆盖 core/rule_engine.py 与 core/router.py 中的关键函数。

依赖：pytest
运行：pytest tests/test_rule_engine.py -v
"""
import os
import sys

import pytest

# 项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# 设置 streamlit session_state（router.py 部分函数读取 session_state）
import streamlit as st
if 'selected_floorplan' not in st.session_state:
    st.session_state['selected_floorplan'] = '三室一厅'
if 'selected_budget_tier' not in st.session_state:
    st.session_state['selected_budget_tier'] = '平衡'
if 'use_ai' not in st.session_state:
    st.session_state['use_ai'] = False

from core.rule_engine import (
    load_rules,
    load_devices,
    match_rules_by_keywords,
    match_by_rules,
)
from core.router import (
    keyword_extraction,
    match_rules,
    generate_plan_local,
    generate_plan,
)


# ============================================
# 测试类 1：关键词提取
# ============================================
class TestKeywordExtraction:
    """测试 router.keyword_extraction 函数的关键词提取能力。"""

    def test_extract_security(self):
        """输入包含「安防」时应返回安防相关关键词。"""
        keywords = keyword_extraction("我需要安防")
        assert isinstance(keywords, list)
        assert len(keywords) > 0
        # synonym_map 中「安防」映射为标准场景标签「安防」
        assert '安防' in keywords

    def test_extract_lighting(self):
        """输入包含照明相关词时应返回照明关键词。"""
        keywords = keyword_extraction("智能灯泡照明")
        assert isinstance(keywords, list)
        assert len(keywords) > 0
        # 应至少包含照明类关键词之一（灯泡/照明/灯/智能）
        assert any(kw in keywords for kw in ['灯泡', '照明', '灯', '智能'])

    def test_extract_empty_input(self):
        """空或纯空白输入不应崩溃，应返回兜底关键词列表。"""
        # 空字符串
        keywords = keyword_extraction("")
        assert isinstance(keywords, list)
        assert len(keywords) > 0  # 兜底机制应返回非空列表

        # 纯空白字符串
        keywords_ws = keyword_extraction("   ")
        assert isinstance(keywords_ws, list)
        assert len(keywords_ws) > 0

    def test_extract_normal_input(self):
        """正常输入如「客厅灯光控制」应返回非空关键词列表。"""
        keywords = keyword_extraction("客厅灯光控制")
        assert isinstance(keywords, list)
        assert len(keywords) > 0
        # 应包含客厅或灯光相关词
        assert any(kw in keywords for kw in ['客厅', '灯光', '照明', '灯'])


# ============================================
# 测试类 2：规则匹配
# ============================================
class TestRuleMatching:
    """测试 rule_engine.match_rules_by_keywords 与 router.match_rules。"""

    def test_match_by_keywords_security(self):
        """关键词 ['安防'] 应能匹配到安防相关规则。"""
        results = match_rules_by_keywords(['安防'])
        assert isinstance(results, list)
        assert len(results) > 0
        # 每条结果应包含 rule、match_score、matched_keywords 三个字段
        for item in results:
            assert 'rule' in item
            assert 'match_score' in item
            assert 'matched_keywords' in item
            # 「安防」应出现在匹配关键词中
            assert '安防' in item['matched_keywords']

    def test_match_by_keywords_empty(self):
        """空关键词列表应返回空结果。"""
        results = match_rules_by_keywords([])
        assert isinstance(results, list)
        assert len(results) == 0

    def test_match_rules_with_devices(self):
        """给定设备列表，match_rules 应返回 match_rate > 0 的规则。"""
        devices_dict = load_devices()
        all_devices = list(devices_dict.values())
        assert len(all_devices) > 0  # 确保设备库加载成功

        # 传入全部设备，应能匹配到多条规则
        results = match_rules(all_devices, top_n=5, min_match_rate=0.3)
        assert isinstance(results, list)
        assert len(results) > 0
        for item in results:
            assert 'match_rate' in item
            assert item['match_rate'] > 0
            assert 'matched_devices' in item

    def test_match_rules_empty_devices(self):
        """空设备列表应返回空结果。"""
        results = match_rules([], top_n=5, min_match_rate=0.3)
        assert isinstance(results, list)
        assert len(results) == 0


# ============================================
# 测试类 3：方案生成
# ============================================
class TestPlanGeneration:
    """测试 router.generate_plan_local 与 generate_plan。"""

    def test_generate_plan_local_basic(self):
        """generate_plan_local('客厅照明') 应返回包含 devices 键的字典。"""
        plan = generate_plan_local("客厅照明", budget=3000)
        assert plan is not None
        assert isinstance(plan, dict)
        assert 'devices' in plan
        assert isinstance(plan['devices'], list)

    def test_generate_plan_local_empty(self):
        """空输入不应崩溃，函数返回 None 或兜底方案均可接受。"""
        plan = generate_plan_local("", budget=3000)
        # 空输入时函数返回 None，重点验证不抛出异常
        assert plan is None or isinstance(plan, dict)

    def test_generate_plan_local_with_budget(self):
        """生成方案的总价应不超过预算。"""
        budget = 3000
        plan = generate_plan_local("客厅照明", budget=budget)
        assert plan is not None
        assert isinstance(plan, dict)
        assert 'devices' in plan

        # 校验 total_price 字段（若存在）
        if 'total_price' in plan:
            assert plan['total_price'] <= budget

        # 校验设备单价总和不超过预算（兜底机制保证总额在预算内）
        total = sum(d.get('price', 0) for d in plan['devices'])
        assert total <= budget

    def test_generate_plan_local_mode(self):
        """generate_plan 以 mode='local' 应返回包含 devices 与 source 的方案。"""
        plan = generate_plan("客厅照明", budget=3000, mode='local')
        assert plan is not None
        assert isinstance(plan, dict)
        assert 'devices' in plan
        assert 'source' in plan


# ============================================
# 测试类 4：置信度与兜底
# ============================================
class TestConfidenceAndFallback:
    """测试无匹配时的兜底机制与方案字段完整性。"""

    def test_fallback_on_no_match(self):
        """无匹配规则的输入仍应通过兜底机制返回方案。"""
        # 使用无意义输入确保不命中任何规则关键词与标签
        plan = generate_plan("xyzabc12345", budget=3000, mode='local')
        assert plan is not None
        assert isinstance(plan, dict)
        assert 'devices' in plan
        # 兜底方案应至少包含 1 个设备
        assert len(plan['devices']) > 0

    def test_plan_has_required_fields(self):
        """生成的方案应包含 devices、actions、source 三个必需字段。"""
        plan = generate_plan("客厅照明", budget=3000, mode='local')
        assert plan is not None
        assert isinstance(plan, dict)
        assert 'devices' in plan
        assert 'actions' in plan
        assert 'source' in plan

    def test_plan_devices_have_price(self):
        """方案中所有设备应包含 price 字段且为非负数值。"""
        plan = generate_plan("客厅照明", budget=3000, mode='local')
        assert plan is not None
        assert 'devices' in plan
        assert len(plan['devices']) > 0
        for device in plan['devices']:
            assert 'price' in device, f"设备 {device.get('id', '?')} 缺少 price 字段"
            assert isinstance(device['price'], (int, float))
            assert device['price'] >= 0
