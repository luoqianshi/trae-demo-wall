"""
共享设备卡片组件

提供统一的设备卡片渲染，供 recommend.py、dashboard.py 等页面复用
"""
import streamlit as st
from constants import COLORS, DEVICE_TYPE_EMOJI


def render_device_card(device, editable=False, on_edit=None, on_delete=None, on_replace=None):
    """
    渲染单个设备卡片
    
    Args:
        device: 设备字典
        editable: 是否可编辑
        on_edit: 编辑回调
        on_delete: 删除回调
        on_replace: 替换回调
    """
    device_id = device.get('id', '')
    name = device.get('name', '未知设备')
    category = device.get('category', '')
    price = device.get('price', 0)
    brand = device.get('brand', '')
    emoji = device.get('emoji', DEVICE_TYPE_EMOJI.get(device_id, '📦'))
    is_on = device.get('is_on', False)
    brightness = device.get('brightness', 100)
    
    # 状态颜色
    status_color = COLORS['success'] if is_on else COLORS['offline']
    status_text = "在线" if is_on else "离线"
    
    col_icon, col_info, col_actions = st.columns([1, 3, 2])
    
    with col_icon:
        st.markdown(f"""
        <div style="text-align: center; padding: 12px; background: {COLORS['bg_secondary']}; border-radius: 12px; border: 2px solid {status_color};">
            <div style="font-size: 2rem;">{emoji}</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col_info:
        bg = COLORS['success_bg'] if is_on else COLORS['border_light']
        txt_color = COLORS['success'] if is_on else COLORS['text_tertiary']
        status_html = f'<span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; background: {bg}; color: {txt_color};">● {status_text}</span>'
        st.markdown(f"""
        <div style="padding: 8px 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <strong style="font-size: 1rem; color: {COLORS['text_primary']};">{name}</strong>
                {status_html}
            </div>
            <div style="font-size: 0.85rem; color: {COLORS['text_secondary']};">
                {brand} · {category} · <span style="color: {COLORS['primary']}; font-weight: 600;">¥{price}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col_actions:
        cols = st.columns(3)
        if editable:
            with cols[0]:
                if st.button("✏️", key=f"edit_{device_id}", use_container_width=True, help="编辑"):
                    if on_edit:
                        on_edit(device)
            with cols[1]:
                if st.button("🗑️", key=f"delete_{device_id}", use_container_width=True, help="删除"):
                    if on_delete:
                        on_delete(device)
            if on_replace:
                with cols[2]:
                    if st.button("🔄", key=f"replace_{device_id}", use_container_width=True, help="替换"):
                        on_replace(device)
        else:
            with cols[0]:
                if st.button("❤️", key=f"favorite_{device_id}", use_container_width=True, help="收藏"):
                    pass


def render_device_grid(devices, editable=False, on_edit=None, on_delete=None, on_replace=None):
    """
    以网格形式渲染设备卡片（3列响应式）
    
    Args:
        devices: 设备列表
        editable: 是否可编辑
        on_edit: 编辑回调
        on_delete: 删除回调
        on_replace: 替换回调
    """
    cols = st.columns(3)
    for i, device in enumerate(devices):
        with cols[i % 3]:
            render_device_card(device, editable, on_edit, on_delete, on_replace)
