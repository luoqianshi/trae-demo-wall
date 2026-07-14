"""页面导航测试模块。

本模块使用 Streamlit AppTest 框架（streamlit.testing.v1.AppTest）对
HomeWizard 智能家居场景规划器的页面渲染与导航逻辑进行端到端测试，
覆盖以下场景：

    * 主路径：核心页面在具备数据时能正常渲染
    * 分支路径：次要页面能正常渲染
    * 无数据兜底：缺少关键数据时展示警告而非崩溃
    * 会话状态持久化：运行页面不会清除已有会话状态

说明：
    st.switch_page() 在 AppTest 环境下会抛出 StreamlitAPIException
    （页面未在 AppTest 上下文中注册），各页面通过 try/except 优雅处理。
    因此本测试只校验警告是否展示，不校验页面是否真实跳转。

运行方式：
    在项目根目录执行 ``pytest tests/test_navigation.py -v``
"""

import os

import pytest
from streamlit.testing.v1 import AppTest

# 项目根目录：tests/test_navigation.py 的上两级目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIEWS_DIR = os.path.join(PROJECT_ROOT, "views")

# AppTest 默认超时时间（秒）
DEFAULT_TIMEOUT = 30

# 模拟方案数据，供各测试用例复用
MOCK_PLAN = {
    'scene_name': '三室一厅全屋智能方案',
    'description': 'L5 高阶智能方案',
    'source': 'local_rules',
    'devices': [
        {'id': 'light_1', 'name': '智能灯泡', 'category': 'lighting', 'price': 99,
         'quantity': 3, 'applicable_area': '客厅', 'protocol': 'WiFi',
         'features': ['调光']},
        {'id': 'socket_1', 'name': '智能插座', 'category': 'socket', 'price': 59,
         'quantity': 2, 'applicable_area': '卧室', 'protocol': 'WiFi',
         'features': ['定时']},
        {'id': 'sensor_1', 'name': '人体传感器', 'category': 'sensor', 'price': 89,
         'quantity': 1, 'applicable_area': '玄关', 'protocol': 'Zigbee',
         'features': ['人体检测']},
    ],
    'actions': ['回家时自动开灯'],
    'confidence': 0.85,
}


# ----------------------------------------------------------------------
# 辅助函数
# ----------------------------------------------------------------------
def _view_path(name):
    """返回 views 目录下指定页面的绝对路径。

    :param str name: 页面文件名（不含扩展名），如 ``"home"``
    :returns: 对应 .py 文件的绝对路径
    """
    return os.path.join(VIEWS_DIR, f"{name}.py")


def _element_text(el):
    """获取 AppTest 元素的文本内容。

    按钮类元素使用 ``.label`` 属性，其它元素（markdown/warning/error 等）
    使用 ``.value`` 属性。本函数兼容两种情况。

    :param el: AppTest 元素对象
    :returns: 元素的文本内容，若无法获取则返回空字符串
    """
    label = getattr(el, 'label', None)
    if isinstance(label, str):
        return label
    value = getattr(el, 'value', None)
    if isinstance(value, str):
        return value
    return ''


def _has_text(elements, keyword):
    """检查 AppTest 元素集合中是否存在包含指定关键词的文本。

    :param elements: AppTest 元素集合（如 ``at.warning``、``at.markdown``）
    :param str keyword: 待匹配的关键词
    :returns: 若任一元素文本包含关键词则返回 True，否则返回 False
    """
    for el in elements:
        if keyword in _element_text(el):
            return True
    return False


def _button_labels(at):
    """获取当前 AppTest 实例中所有按钮的标签文本列表。

    :param at: AppTest 实例
    :returns: 按钮标签文本列表
    """
    return [_element_text(b) for b in at.button]


# ----------------------------------------------------------------------
# 主路径测试
# ----------------------------------------------------------------------
class TestMainPath:
    """主路径测试：验证核心页面在具备数据时能正常渲染。"""

    def test_home_renders(self):
        """首页应能无异常地渲染。"""
        at = AppTest.from_file(_view_path("home"), default_timeout=DEFAULT_TIMEOUT)
        at.run()
        assert not at.exception, f"首页渲染出现异常: {at.exception}"

    def test_recommend_with_plan(self):
        """推荐方案页在有方案数据时应渲染四个枢纽操作按钮。"""
        at = AppTest.from_file(_view_path("recommend"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['plan_result'] = MOCK_PLAN
        at.session_state['selected_floorplan'] = '三室一厅'
        at.session_state['selected_budget_tier'] = '高端'
        at.run()
        assert not at.exception, f"推荐方案页渲染出现异常: {at.exception}"
        labels = _button_labels(at)
        joined = '|'.join(labels)
        assert '配置' in joined, f"缺少'开始配置'按钮，当前按钮: {labels}"
        assert '户型' in joined, f"缺少'查看户型图'按钮，当前按钮: {labels}"
        assert '控制台' in joined, f"缺少'进入控制台'按钮，当前按钮: {labels}"
        assert '导出' in joined, f"缺少'导出清单'按钮，当前按钮: {labels}"

    def test_setup_with_devices(self):
        """设备配置页在有设备清单时应渲染 WiFi 连接步骤。"""
        at = AppTest.from_file(_view_path("setup"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['setup_devices'] = MOCK_PLAN['devices']
        at.session_state['setup_step'] = 1
        at.session_state['wifi_connected'] = False
        at.run()
        assert not at.exception, f"设备配置页渲染出现异常: {at.exception}"
        assert _has_text(at.markdown, 'WiFi') or _has_text(at.markdown, '第一步'), \
            "未显示 WiFi 连接步骤"

    def test_dashboard_with_devices(self):
        """联动控制台页在有设备时应无异常渲染。"""
        at = AppTest.from_file(_view_path("dashboard"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['setup_devices'] = MOCK_PLAN['devices']
        at.session_state['plan_result'] = MOCK_PLAN
        at.run()
        assert not at.exception, f"控制台页渲染出现异常: {at.exception}"


# ----------------------------------------------------------------------
# 分支路径测试
# ----------------------------------------------------------------------
class TestBranchPath:
    """分支路径测试：验证次要页面的渲染。"""

    def test_floorplan_with_plan(self):
        """户型图页在有方案数据时应无异常渲染。"""
        at = AppTest.from_file(_view_path("floorplan"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['plan_result'] = MOCK_PLAN
        at.session_state['selected_floorplan'] = '三室一厅'
        at.run()
        assert not at.exception, f"户型图页渲染出现异常: {at.exception}"

    def test_ai_settings_renders(self):
        """AI 引擎设置页应能无异常地渲染。"""
        at = AppTest.from_file(_view_path("ai_settings"), default_timeout=DEFAULT_TIMEOUT)
        at.run()
        assert not at.exception, f"AI 设置页渲染出现异常: {at.exception}"


# ----------------------------------------------------------------------
# 无数据兜底测试
# ----------------------------------------------------------------------
class TestNoDataHandling:
    """无数据兜底测试：验证缺少关键数据时展示警告而非崩溃。

    由于 st.switch_page() 在 AppTest 中会抛异常，各页面通过 try/except
    或外层 try/except 捕获并展示 st.error。本测试只校验 switch_page 调用
    之前已展示的 st.warning 文本。
    """

    def test_recommend_no_plan(self):
        """推荐方案页在无方案数据时应展示'未检测到方案数据'警告。"""
        at = AppTest.from_file(_view_path("recommend"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['plan_result'] = None
        at.run()
        assert _has_text(at.warning, '未检测到方案数据'), \
            "无方案数据时未展示'未检测到方案数据'警告"

    def test_setup_no_devices(self):
        """设备配置页在无设备清单时应展示'未检测到设备清单'警告。"""
        at = AppTest.from_file(_view_path("setup"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['setup_devices'] = []
        at.run()
        assert _has_text(at.warning, '未检测到设备清单'), \
            "无设备清单时未展示'未检测到设备清单'警告"

    def test_floorplan_no_plan(self):
        """户型图页在无方案数据时应展示'未检测到方案数据'警告。"""
        at = AppTest.from_file(_view_path("floorplan"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['plan_result'] = None
        at.run()
        assert _has_text(at.warning, '未检测到方案数据'), \
            "无方案数据时未展示'未检测到方案数据'警告"

    def test_dashboard_no_devices(self):
        """控制台页在无设备时应展示'未检测到方案数据'警告。"""
        at = AppTest.from_file(_view_path("dashboard"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['setup_devices'] = []
        at.session_state['plan_result'] = None
        at.run()
        assert _has_text(at.warning, '未检测到方案数据'), \
            "无设备时未展示'未检测到方案数据'警告"


# ----------------------------------------------------------------------
# 会话状态持久化测试
# ----------------------------------------------------------------------
class TestStatePersistence:
    """会话状态持久化测试：验证运行页面不会清除已有会话状态。"""

    def test_session_state_preserved(self):
        """运行推荐方案页后，预先设置的多个会话状态键应仍然存在。"""
        at = AppTest.from_file(_view_path("recommend"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['plan_result'] = MOCK_PLAN
        at.session_state['selected_floorplan'] = '三室一厅'
        at.session_state['selected_budget_tier'] = '高端'
        at.session_state['user_input'] = '我想打造三室一厅全屋智能'
        at.session_state['budget'] = 5000
        at.run()
        assert 'plan_result' in at.session_state, "plan_result 在运行后丢失"
        assert 'selected_floorplan' in at.session_state, \
            "selected_floorplan 在运行后丢失"
        assert 'selected_budget_tier' in at.session_state, \
            "selected_budget_tier 在运行后丢失"
        assert 'user_input' in at.session_state, "user_input 在运行后丢失"
        assert 'budget' in at.session_state, "budget 在运行后丢失"

    def test_plan_data_passes_through(self):
        """运行推荐方案页后，plan_result 应仍然可访问且数据完整。"""
        at = AppTest.from_file(_view_path("recommend"), default_timeout=DEFAULT_TIMEOUT)
        at.session_state['plan_result'] = MOCK_PLAN
        at.session_state['selected_floorplan'] = '三室一厅'
        at.session_state['selected_budget_tier'] = '高端'
        at.run()
        assert 'plan_result' in at.session_state, "plan_result 在运行后丢失"
        plan = at.session_state['plan_result']
        assert plan is not None, "plan_result 运行后为 None"
        assert plan.get('scene_name') == MOCK_PLAN['scene_name'], \
            "plan_result 的 scene_name 字段数据不一致"
        assert plan.get('devices') == MOCK_PLAN['devices'], \
            "plan_result 的 devices 字段数据不一致"
