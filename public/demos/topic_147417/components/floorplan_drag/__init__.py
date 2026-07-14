"""
自定义 Streamlit 组件：可拖拽的设备平面图画布

替代 st.components.v1.html，通过 Streamlit 组件协议（postMessage）
实现 JS→Python 双向通信，解决 iframe 沙盒限制导致 parent.location.search 不可用的问题。
"""
import streamlit.components.v1 as components
from pathlib import Path

_frontend_dir = Path(__file__).parent / "frontend"

_component_func = components.declare_component(
    "floorplan_drag",
    path=str(_frontend_dir),
)

# declare_component 只在 ScriptRunContext 存在时注册到 component_registry。
# 某些场景下（如模块在 ctx 建立前被 import）组件不会注册，前端请求组件 URL 会 404。
# 这里主动注册作为兜底，重复注册是安全的（registry 内部按 name 覆盖）。
try:
    from streamlit.runtime import get_instance
    get_instance().component_registry.register_component(_component_func)
except Exception:
    pass


def floorplan_drag_component(devices, rules, type_emoji, type_color, rule_lines, key=None):
    """
    渲染可拖拽的设备平面图画布。

    参数:
        devices:     设备列表，每个设备含 id/type/x/y/label/room/is_on/brightness
        rules:       联动规则列表
        type_emoji:  设备类型→Emoji 映射
        type_color:  设备类型→颜色映射
        rule_lines:  规则连线 SVG 路径列表
        key:         组件唯一 key

    返回:
        None（未交互）或 dict:
            {action: 'save', positions: [{id,x,y},...], nonce: <timestamp>}
    """
    component_value = _component_func(
        devices=devices,
        rules=rules,
        type_emoji=type_emoji,
        type_color=type_color,
        rule_lines=rule_lines,
        key=key,
        default=None,
    )
    return component_value
