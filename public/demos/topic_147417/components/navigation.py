"""
统一顶部导航组件

提供可复用的顶部导航栏，使用 st.columns 布局：
- 左：🏠 HomeWizard Logo（点击回到首页）
- 中左：当前页面名称
- 中右：步骤指示器（st.progress）
- 右：⚙️ AI 引擎设置入口

所有页面通过 render_top_nav() 注入统一导航，保证视觉一致性。
"""

import streamlit as st


# 页面元信息：标识 → (显示名, 图标, 父页面标识, 父页面文件路径)
_PAGE_META = {
    "home":        ("首页",     "📋", None,        None),
    "recommend":   ("方案详情", "📦", "home",      "views/home.py"),
    "setup":       ("设备配置", "⚙️", "recommend", "views/recommend.py"),
    "floorplan":   ("户型图",   "📐", "recommend", "views/recommend.py"),
    "dashboard":   ("智能联动", "🎮", "recommend", "views/recommend.py"),
    "ai_settings": ("AI 引擎",  "🧠", "home",      "views/home.py"),
}


def render_top_nav(current_page, step_info=None):
    """
    渲染统一顶部导航栏（st.columns 布局）。

    参数:
        current_page: 当前页面标识（home/recommend/setup/floorplan/dashboard/ai_settings）
        step_info: 步骤信息字典，如 {"current": 2, "total": 4, "label": "生成方案"}
                   传入 None 则不显示步骤指示器。
    """
    meta = _PAGE_META.get(current_page)
    if not meta:
        return

    page_name, page_icon, parent_key, parent_path = meta

    # 四列布局：Logo | 页面名 | 步骤指示器 | 设置按钮
    col1, col2, col3, col4 = st.columns([1, 2, 3, 1])

    with col1:
        # Logo 按钮（点击回首页）
        if st.button("🏠 HomeWizard", key=f"nav_logo_{current_page}",
                     use_container_width=True, type="secondary"):
            st.switch_page("views/home.py")

    with col2:
        # 当前页面名称
        st.markdown(f"**{page_icon} {page_name}**")

    with col3:
        # 步骤指示器（如果有）
        if step_info:
            _progress = step_info.get("current", 1) / max(step_info.get("total", 1), 1)
            _label = step_info.get("label", "")
            st.progress(_progress, text=f"Step {step_info.get('current',1)}/{step_info.get('total',1)}: {_label}")

    with col4:
        # AI 引擎设置入口
        if st.button("⚙️", key=f"nav_settings_{current_page}", help="AI 引擎设置",
                     use_container_width=True):
            st.switch_page("views/ai_settings.py")

    st.markdown("")


def render_back_button(current_page, key_suffix=""):
    """
    渲染"← 返回"按钮，点击跳转到逻辑父页面。

    参数:
        current_page: 当前页面标识
        key_suffix: 按钮 key 后缀（避免多处返回按钮冲突）
    返回:
        True 表示用户点击了返回按钮
    """
    meta = _PAGE_META.get(current_page)
    if not meta or not meta[3]:
        return False

    parent_name = _PAGE_META.get(meta[2], ("", "", None, None))[0]
    if st.button(f"← 返回{parent_name}", key=f"nav_back_{current_page}{key_suffix}",
                 use_container_width=False, type="secondary"):
        st.switch_page(meta[3])
        return True
    return False


def render_step_dots(current_step, total_steps, labels=None):
    """
    渲染步骤进度点（○───○───○）。

    参数:
        current_step: 当前步骤（1-based）
        total_steps: 总步骤数
        labels: 各步骤标签列表
    """
    if labels is None:
        labels = [f"Step {i+1}" for i in range(total_steps)]

    dots = []
    for i in range(total_steps):
        step_num = i + 1
        if step_num < current_step:
            dots.append("✅")
        elif step_num == current_step:
            dots.append("🔵")
        else:
            dots.append("⚪")

    # 构建进度点 HTML
    parts = []
    for i, (dot, label) in enumerate(zip(dots, labels)):
        is_current = (i + 1 == current_step)
        color = "#4FC3F7" if is_current else ("#22c55e" if i + 1 < current_step else "#666")
        weight = "700" if is_current else "400"
        parts.append(f'<span style="color:{color};font-weight:{weight};">{dot} {label}</span>')
        if i < total_steps - 1:
            parts.append('<span style="color:#444;">───</span>')

    st.markdown(
        '<div style="text-align:center;padding:8px 0 16px 0;font-size:0.85rem;">'
        + "".join(parts) + '</div>',
        unsafe_allow_html=True
    )
