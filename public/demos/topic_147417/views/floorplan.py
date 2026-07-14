"""
📐 设备位置示意图（增强版）
- 户型图上传 + AI 分析模拟 + 设备布局叠加 + 设备拓扑图
- 所有识别结果为硬编码模拟，不依赖真实图片内容分析
"""

import streamlit as st
import os
import sys
import json
import time
import math
from io import BytesIO

# 项目根目录加入 sys.path，确保多页模式下模块导入可靠
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from streamlit_drawable_canvas import st_canvas
from PIL import Image, ImageDraw

from components.navigation import render_top_nav

from core.router import assign_device_positions
from utils.helpers import (
    get_room_color, get_device_emoji, get_protocol_color, calculate_total_price,
)

# ============================================
# 房间 Emoji 映射
# ============================================
_ROOM_EMOJI = {
    '客厅': '🛋️', '主卧': '🛏️', '次卧': '🛏️', '卧室': '🛏️',
    '厨房': '🍳', '卫生间': '🚿', '主卫': '🚿', '客卫': '🚿',
    '阳台': '🌿', '玄关': '🚪', '书房': '📚', '餐厅': '🍽️',
    '儿童房': '🧸',
}

# 协议图例（用于拓扑图）
_PROTOCOL_LEGEND = [
    ('Zigbee', '#4CAF50'),
    ('WiFi', '#2196F3'),
    ('蓝牙/BLE', '#FF9800'),
    ('Thread', '#9C27B0'),
    ('其他', '#9E9E9E'),
]

# 模拟 AI 分析结果（按户型类型硬编码）
_MOCK_ANALYSIS = {
    '一居室': {
        'rooms': ['客厅', '卧室', '厨房', '卫生间', '玄关'],
        'confidence': 87,
    },
    '两居室': {
        'rooms': ['客厅', '主卧', '次卧', '厨房', '卫生间', '阳台', '玄关'],
        'confidence': 91,
    },
    '三居室': {
        'rooms': ['客厅', '餐厅', '主卧', '次卧', '书房', '厨房', '主卫', '客卫', '阳台', '玄关'],
        'confidence': 93,
    },
}


# ============================================
# 状态初始化
# ============================================
def _init_state():
    """初始化页面所需的 session_state 变量。"""
    defaults = {
        'uploaded_floorplan': None,         # 上传的图片 bytes
        'uploaded_floorplan_type': None,    # 图片类型（jpg/png/pdf）
        'floorplan_analyzed': False,        # 是否已完成 AI 分析
        'device_positions': {},             # 设备坐标映射
        'topology_svg': None,               # 拓扑图 SVG 字符串
        'fp_canvas_reset_counter': 0,       # 画布重置计数器（变更 key 强制重载）
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


_init_state()


# ============================================
# 获取方案设备列表
# ============================================
def _get_plan_devices():
    """从 session_state 读取当前方案设备列表，无设备返回空列表。"""
    # 优先：recommend 页面编辑后的设备列表
    selector_key = st.session_state.get('recommend_plan_selector', '')
    if selector_key:
        edit_key = f'edited_devices_{selector_key}'
        devices = st.session_state.get(edit_key)
        if devices:
            return list(devices)
    # 次选：pending_plan_devices
    pending = st.session_state.get('pending_plan_devices')
    if pending:
        return list(pending)
    # 再次：multi_plans 中 balanced 方案
    multi_plans = st.session_state.get('multi_plans')
    if multi_plans and isinstance(multi_plans, dict):
        for k in ('balanced', 'economy', 'premium'):
            plan = multi_plans.get(k)
            if plan and plan.get('devices'):
                return list(plan['devices'])
    # 兜底：plan_result（与 home.py / recommend.py 写入键名一致）
    result = st.session_state.get('plan_result')
    if result and result.get('devices'):
        return list(result['devices'])
    return []


# ============================================
# 加载户型模板
# ============================================
def _load_floorplan_template():
    """加载当前选中户型的模板 JSON，失败返回 None。"""
    # 优先使用 session_state 中已缓存的模板
    cached = st.session_state.get('floorplan_template')
    if cached and isinstance(cached, dict) and 'rooms' in cached:
        return cached

    floorplan_name = st.session_state.get('selected_floorplan', '')
    file_map = {
        '一室一厅': 'one_bedroom.json', '一居室': 'one_bedroom.json',
        '两室一厅': 'two_bedroom.json', '两居室': 'two_bedroom.json',
        '三室一厅': 'three_bedroom.json', '三居室': 'three_bedroom.json',
    }
    filename = file_map.get(floorplan_name, 'two_bedroom.json')
    template_path = os.path.join(_PROJECT_ROOT, 'data', 'floorplan_templates', filename)
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template = json.load(f)
        # 缓存到 session_state，避免下次重复读文件
        st.session_state['floorplan_template'] = template
        return template
    except Exception:
        return None


# ============================================
# 1. 页面标题区
# ============================================
def _render_header():
    """渲染页面标题和返回按钮。"""
    col_back, col_title = st.columns([1, 5])
    with col_back:
        if st.button("← 返回方案页", key="fp_back_to_recommend",
                     use_container_width=True):
            try:
                st.switch_page("views/recommend.py")
            except Exception:
                st.switch_page("views/home.py")
    with col_title:
        st.markdown("""
        <div style="background: linear-gradient(135deg, rgba(102,126,234,0.10) 0%, rgba(118,75,162,0.10) 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 16px; padding: 18px 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h1 style="margin:0;font-size:1.6rem;color:#1e293b;">📐 设备位置示意图</h1>
            <p style="margin:6px 0 0 0;color:#64748b;font-size:0.9rem;">
                上传户型图，查看设备摆放位置 · 模拟演示
            </p>
        </div>
        """, unsafe_allow_html=True)


# ============================================
# 2. 户型图上传区
# ============================================
def _render_upload_area():
    """渲染户型图上传区，返回上传的图片 bytes 与类型。"""
    st.markdown("""
    <div style="background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 20px; margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 12px 0;color:#1e293b;">📤 户型图上传</h3>
    </div>
    """, unsafe_allow_html=True)

    uploaded = st.file_uploader(
        "选择户型图文件",
        type=['jpg', 'jpeg', 'png', 'pdf'],
        accept_multiple_files=False,
        key="fp_file_uploader",
        help="支持 JPG / PNG / PDF 格式，最大 10MB",
    )

    if uploaded is not None:
        # 文件大小校验
        file_size = getattr(uploaded, 'size', 0)
        if file_size > 10 * 1024 * 1024:
            st.warning("⚠️ 文件超过 10MB 限制，请压缩后重新上传")
            return None, None

        # 读取文件内容
        try:
            raw = uploaded.read()
        except Exception:
            st.warning("⚠️ 文件读取失败")
            return None, None

        # 获取文件类型
        file_type = (uploaded.name or '').split('.')[-1].lower()
        if file_type == 'jpeg':
            file_type = 'jpg'

        st.session_state['uploaded_floorplan'] = raw
        st.session_state['uploaded_floorplan_type'] = file_type
        st.session_state['floorplan_analyzed'] = False  # 新文件需重新分析

        # 显示预览
        if file_type in ('jpg', 'png'):
            try:
                st.image(raw, caption="📷 户型图预览", use_container_width=True)
                # 显示图片尺寸（尝试用 PIL，失败则跳过）
                _show_image_size(raw)
            except Exception:
                st.warning("⚠️ 图片预览失败，请确认文件未损坏")
        elif file_type == 'pdf':
            st.info("📄 PDF 文件已上传，PDF 内容预览不在此展示，将使用默认户型模板进行布局")
        else:
            st.warning("⚠️ 不支持的文件类型")

        return raw, file_type
    else:
        st.caption("📁 支持 JPG / PNG / PDF，最大 10MB · 未上传时使用默认户型模板")
        return st.session_state.get('uploaded_floorplan'), st.session_state.get('uploaded_floorplan_type')


def _show_image_size(raw_bytes):
    """尝试显示图片尺寸，无法识别则跳过。"""
    # BytesIO 和 Image 已在模块顶部导入；此处仅做异常容错
    try:
        img = Image.open(BytesIO(raw_bytes))
        w, h = img.size
        st.caption(f"📏 图片尺寸：{w} x {h}")
    except Exception:
        pass


# ============================================
# 3. AI 分析模拟区
# ============================================
def _render_ai_analysis_area():
    """渲染 AI 分析按钮和模拟分析过程。"""
    st.markdown("""
    <div style="background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 20px; margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 12px 0;color:#1e293b;">🧠 AI 分析户型图</h3>
    </div>
    """, unsafe_allow_html=True)

    col_btn, col_status = st.columns([1, 3])
    with col_btn:
        analyze_clicked = st.button(
            "🧠 AI 分析户型图",
            key="fp_analyze_btn",
            use_container_width=True,
            type="primary",
        )
    with col_status:
        if st.session_state.get('floorplan_analyzed'):
            st.success("✅ 已完成 AI 分析")

    # 点击按钮触发模拟分析
    if analyze_clicked:
        _simulate_analysis()

    # 展示分析结果
    if st.session_state.get('floorplan_analyzed'):
        _render_analysis_result()


def _simulate_analysis():
    """模拟 AI 分析过程（3 秒进度条）。"""
    floorplan_name = st.session_state.get('selected_floorplan', '') or '两居室'
    # 找到对应的模拟分析结果
    mock = None
    for key, val in _MOCK_ANALYSIS.items():
        if key in floorplan_name or floorplan_name in key:
            mock = val
            break
    if not mock:
        mock = _MOCK_ANALYSIS['两居室']

    progress_bar = st.progress(0, text="⏳ AI 正在识别房间结构...")
    # 模拟 3 秒分析过程（演示模式 1 秒）
    _ai_delay = 0.01 if st.session_state.get('demo_mode', False) else 0.03
    for i in range(101):
        time.sleep(_ai_delay)
        progress_bar.progress(i, text=f"⏳ AI 分析中... {i}%")
    progress_bar.empty()

    # 写入分析结果到 session_state
    st.session_state['floorplan_analyzed'] = True
    st.session_state['mock_rooms'] = list(mock['rooms'])
    st.session_state['mock_confidence'] = mock['confidence']


def _render_analysis_result():
    """展示模拟分析结果。"""
    rooms = st.session_state.get('mock_rooms', [])
    confidence = st.session_state.get('mock_confidence', 0)
    if not rooms:
        return

    rooms_text = '、'.join(rooms)
    st.markdown(f"""
    <div style="background: rgba(34,197,94,0.10);
                border: 1px solid rgba(34,197,94,0.3);
                border-radius: 12px; padding: 14px 18px; margin-top: 10px;
                color: #166534; font-size: 0.92rem;">
        ✅ 已识别 <b>{len(rooms)}</b> 个房间：{rooms_text}<br>
        📊 模拟置信度：<b>{confidence}%</b>
        <span style="display:inline-block;margin-left:8px;padding:2px 8px;
                     background:rgba(0,0,0,0.05);border-radius:8px;
                     font-size:0.75rem;color:#64748b;">模拟演示</span>
    </div>
    """, unsafe_allow_html=True)


# ============================================
# 4. 设备布局展示区（streamlit-drawable-canvas 可拖拽）
# ============================================
def _render_device_layout_area():
    """渲染设备布局展示区，使用 streamlit-drawable-canvas 实现设备拖拽。"""
    st.markdown("""
    <div style="background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 20px; margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 12px 0;color:#1e293b;">📍 设备摆放位置（可拖拽调整）</h3>
        <p style="margin:0;color:#64748b;font-size:0.85rem;">
            💡 拖动设备图标调整位置，松开鼠标即自动保存坐标
        </p>
    </div>
    """, unsafe_allow_html=True)

    devices = _get_plan_devices()
    if not devices:
        st.warning("⚠️ 请先在首页生成方案，再查看设备布局")
        return

    template = _load_floorplan_template()
    if not template:
        st.warning("⚠️ 未找到户型模板，请先在首页选择户型")
        return

    floorplan_name = st.session_state.get('selected_floorplan', '') or '两居室'
    if 'device_positions' not in st.session_state or not st.session_state['device_positions']:
        device_positions = assign_device_positions(devices, floorplan_name)
        st.session_state['device_positions'] = device_positions
    else:
        device_positions = st.session_state['device_positions']

    if not device_positions:
        st.warning("⚠️ 设备坐标分配失败")
        return

    rooms = template.get('rooms', []) or []
    max_x = max((r.get('x', 0) + r.get('width', 0) for r in rooms), default=800)
    max_y = max((r.get('y', 0) + r.get('height', 0) for r in rooms), default=600)

    target_h = 500
    scale = target_h / max(max_y, 1)
    canvas_w = int(max_x * scale)
    canvas_h = target_h

    bg_image = _generate_floorplan_bg(template, scale, canvas_w, canvas_h)
    initial_drawing = _build_initial_drawing(device_positions, scale)

    col_reset, col_info = st.columns([1, 3])
    with col_reset:
        if st.button("🔄 重置位置", key="fp_reset_positions", use_container_width=True):
            device_positions = assign_device_positions(devices, floorplan_name)
            st.session_state['device_positions'] = device_positions
            # 变更画布 key 强制重新加载 initial_drawing
            st.session_state['fp_canvas_reset_counter'] += 1
            st.rerun()
    with col_info:
        st.caption("🎯 提示：直接拖动圆形设备图标调整位置")

    _canvas_key = f"floorplan_canvas_{st.session_state.get('fp_canvas_reset_counter', 0)}"
    canvas_result = st_canvas(
        fill_color="rgba(102, 126, 234, 0.3)",
        stroke_width=2,
        stroke_color="#667eea",
        background_color="rgba(248, 250, 252, 0)",
        background_image=bg_image,
        update_streamlit=True,
        height=canvas_h,
        width=canvas_w,
        drawing_mode="transform",
        initial_drawing=initial_drawing,
        key=_canvas_key,
        display_toolbar=False,
    )

    if canvas_result and hasattr(canvas_result, 'json_data') and canvas_result.json_data:
        try:
            objects = canvas_result.json_data.get('objects', [])
            new_positions = {}
            for obj in objects:
                obj_type = obj.get('type', '')
                if obj_type in ('circle', 'rect'):
                    dev_id = obj.get('name', '')
                    if dev_id and dev_id.startswith('dev_'):
                        actual_id = dev_id.replace('dev_', '', 1)
                        left = obj.get('left', 0)
                        top = obj.get('top', 0)
                        scale_x = obj.get('scaleX', 1)
                        scale_y = obj.get('scaleY', 1)
                        radius = obj.get('radius', 16)
                        width = obj.get('width', 32)
                        if obj_type == 'circle':
                            center_x = (left + radius * scale_x) / scale
                            center_y = (top + radius * scale_y) / scale
                        else:
                            center_x = (left + width * scale_x / 2) / scale
                            center_y = (top + width * scale_y / 2) / scale
                        if actual_id in device_positions:
                            orig = device_positions[actual_id]
                            new_pos = dict(orig)
                            new_pos['x'] = int(center_x)
                            new_pos['y'] = int(center_y)
                            new_positions[actual_id] = new_pos
            if new_positions:
                for k, v in new_positions.items():
                    st.session_state['device_positions'][k] = v
        except Exception:
            pass

    st.caption("💡 设备位置已自动保存，下方拓扑图展示设备连接关系")


def _generate_floorplan_bg(template, scale, canvas_w, canvas_h):
    """用 PIL 生成户型图背景图片，返回 PIL Image 对象。"""
    rooms = template.get('rooms', []) or []
    if not rooms:
        return None

    img = Image.new('RGBA', (canvas_w, canvas_h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    for room in rooms:
        rx = room.get('x', 0) * scale
        ry = room.get('y', 0) * scale
        rw = room.get('width', 100) * scale
        rh = room.get('height', 100) * scale
        room_name = room.get('name', '')
        room_color_hex = room.get('color', get_room_color(room_name))

        try:
            hex_color = room_color_hex.lstrip('#')
            if len(hex_color) == 3:
                hex_color = ''.join(c * 2 for c in hex_color)
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
        except Exception:
            r, g, b = 100, 100, 120

        draw.rectangle(
            [rx, ry, rx + rw, ry + rh],
            fill=(r, g, b, 45),
            outline=(r, g, b, 100),
            width=2
        )

        room_emoji = _ROOM_EMOJI.get(room_name, '🏠')
        label = f"{room_emoji} {room_name}"
        try:
            draw.text((rx + 10, ry + 8), label, fill=(51, 65, 85, 220))
        except Exception:
            pass

    return img


def _build_initial_drawing(device_positions, scale):
    """构建画布初始绘制内容（设备圆形图标）。"""
    objects = []
    for dev_id, pos in device_positions.items():
        if not isinstance(pos, dict):
            continue
        px = pos.get('x', 0) * scale
        py = pos.get('y', 0) * scale
        radius = 18

        objects.append({
            'type': 'circle',
            'name': f'dev_{dev_id}',
            'left': px - radius,
            'top': py - radius,
            'radius': radius,
            'fill': 'rgba(102, 126, 234, 0.35)',
            'stroke': '#667eea',
            'strokeWidth': 2,
            'selectable': True,
            'hasControls': False,
            'lockMovementX': False,
            'lockMovementY': False,
            'lockRotation': True,
            'lockScalingX': True,
            'lockScalingY': True,
            'transparentCorners': False,
        })

    return {'version': '4.6.0', 'objects': objects}


# ============================================
# 5. 拓扑图展示区（纯 SVG）
# ============================================
def _render_topology_area():
    """渲染设备拓扑图（SVG 实现，网关居中 + 设备环绕 + 协议色连线）。"""
    st.markdown("""
    <div style="background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 20px; margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 12px 0;color:#1e293b;">🔗 设备拓扑图</h3>
    </div>
    """, unsafe_allow_html=True)

    devices = _get_plan_devices()
    if not devices:
        st.warning("⚠️ 请先生成方案")
        return

    svg = _build_topology_svg(devices)
    if svg:
        st.session_state['topology_svg'] = svg
        # 优先使用 st.html（Streamlit 1.39+ 现代API），降级到 st.components.v1.html
        try:
            st.html(svg)
        except AttributeError:
            try:
                st.components.v1.html(svg, height=520, scrolling=False)
            except Exception:
                st.markdown(svg, unsafe_allow_html=True)
        except Exception:
            st.markdown(svg, unsafe_allow_html=True)

        # 图例
        _render_protocol_legend()


def _build_topology_svg(devices):
    """构建拓扑图 SVG 字符串。网关居中，设备均匀分布，连线按协议着色。"""
    if not devices:
        return ''

    # 找出网关
    gateway = None
    others = []
    for d in devices:
        if d.get('category') == '网关':
            if gateway is None:
                gateway = d
                continue
        others.append(d)
    if gateway is None:
        # 无网关时，使用第一个设备作为中心
        if others:
            gateway = others.pop(0)
        else:
            return ''

    # SVG 画布参数
    canvas_w = 700
    canvas_h = 480
    center_x = canvas_w / 2
    center_y = canvas_h / 2
    radius = 180  # 设备环绕半径

    n = len(others)
    if n == 0:
        # 只有网关
        return f'''
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas_w} {canvas_h}"
             style="width:100%;max-width:{canvas_w}px;height:auto;">
            <rect width="100%" height="100%" rx="16" fill="#f8fafc"/>
            <circle cx="{center_x}" cy="{center_y}" r="36"
                    fill="#2196F3" stroke="#64B5F6" stroke-width="3"/>
            <text x="{center_x}" y="{center_y + 6}" text-anchor="middle"
                  font-size="22" fill="white">📶</text>
            <text x="{center_x}" y="{center_y + 60}" text-anchor="middle"
                  font-size="13" fill="#475569" font-weight="600">网关</text>
        </svg>'''

    # 计算每个设备的角度（弧度）
    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas_w} {canvas_h}" '
        f'style="width:100%;max-width:{canvas_w}px;height:auto;background:#f8fafc;border-radius:16px;">'
    ]

    # 1. 连线（先画，在节点下方）
    for i, dev in enumerate(others):
        angle = (2 * math.pi * i / n) - math.pi / 2  # 从顶部开始
        dev_x = center_x + radius * math.cos(angle)
        dev_y = center_y + radius * math.sin(angle)
        protocol = dev.get('protocol', '')
        line_color = get_protocol_color(protocol)
        # 箭头标记（使用 marker 定义）
        svg_parts.append(
            f'<defs><marker id="arrow{i}" markerWidth="8" markerHeight="8" '
            f'refX="6" refY="4" orient="auto">'
            f'<polygon points="0,0 8,4 0,8" fill="{line_color}"/></marker></defs>'
        )
        svg_parts.append(
            f'<line x1="{center_x}" y1="{center_y}" x2="{dev_x:.1f}" y2="{dev_y:.1f}" '
            f'stroke="{line_color}" stroke-width="2" opacity="0.65" '
            f'marker-end="url(#arrow{i})"/>'
        )

    # 2. 网关节点（居中大圆，蓝色）
    svg_parts.append(
        f'<circle cx="{center_x}" cy="{center_y}" r="38" fill="#2196F3" '
        f'stroke="#64B5F6" stroke-width="3" opacity="0.9"/>'
    )
    svg_parts.append(
        f'<text x="{center_x}" y="{center_y + 8}" text-anchor="middle" '
        f'font-size="22" fill="white">📶</text>'
    )
    svg_parts.append(
        f'<text x="{center_x}" y="{center_y + 64}" text-anchor="middle" '
        f'font-size="13" fill="#475569" font-weight="600">网关</text>'
    )

    # 3. 设备节点（环绕小圆，按协议着色）
    for i, dev in enumerate(others):
        angle = (2 * math.pi * i / n) - math.pi / 2
        dev_x = center_x + radius * math.cos(angle)
        dev_y = center_y + radius * math.sin(angle)
        protocol = dev.get('protocol', '')
        node_color = get_protocol_color(protocol)
        dev_name = (dev.get('name') or dev.get('id') or '设备')[:8]
        emoji = get_device_emoji(dev.get('category', ''))
        price = dev.get('price', 0)
        brand = dev.get('brand', '')
        # tooltip 内容
        tooltip_text = f"{dev_name}｜{brand}｜¥{price}｜{protocol}"

        # 设备节点
        svg_parts.append(
            f'<g>'
            f'<title>{tooltip_text}</title>'
            f'<circle cx="{dev_x:.1f}" cy="{dev_y:.1f}" r="20" '
            f'fill="{node_color}" stroke="white" stroke-width="1.5" opacity="0.85"/>'
            f'<text x="{dev_x:.1f}" y="{dev_y + 6:.1f}" text-anchor="middle" '
            f'font-size="16">{emoji}</text>'
            f'<text x="{dev_x:.1f}" y="{dev_y + 36:.1f}" text-anchor="middle" '
            f'font-size="11" fill="#475569" font-weight="500">{dev_name}</text>'
            f'</g>'
        )

    svg_parts.append('</svg>')
    return ''.join(svg_parts)


def _render_protocol_legend():
    """渲染协议图例。"""
    legend_items = ''.join(
        f'<span style="display:inline-flex;align-items:center;margin-right:16px;'
        f'font-size:0.85rem;color:#64748b;">'
        f'<span style="display:inline-block;width:12px;height:12px;border-radius:50%;'
        f'background:{color};margin-right:6px;"></span>'
        f'{label}</span>'
        for label, color in _PROTOCOL_LEGEND
    )
    st.markdown(f"""
    <div style="background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px; padding: 12px 18px; margin-top: 12px;">
        <span style="color:#64748b;font-size:0.85rem;font-weight:600;margin-right:12px;">图例：</span>
        {legend_items}
    </div>
    """, unsafe_allow_html=True)


# ============================================
# 6. 设备清单快速查看
# ============================================
def _render_device_summary():
    """渲染设备清单快速查看区。"""
    devices = _get_plan_devices()
    if not devices:
        return

    st.markdown("""
    <div style="background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 20px; margin-bottom: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 12px 0;color:#1e293b;">📦 设备清单</h3>
    </div>
    """, unsafe_allow_html=True)

    total = calculate_total_price(devices)
    col_a, col_b, col_c = st.columns(3)
    with col_a:
        st.metric("设备总数", f"{len(devices)} 件")
    with col_b:
        st.metric("方案总价", f"¥{total}")
    with col_c:
        gateway_count = sum(1 for d in devices if d.get('category') == '网关')
        st.metric("网关数量", f"{gateway_count} 个")

    # 设备列表
    for dev in devices:
        emoji = get_device_emoji(dev.get('category', ''))
        name = dev.get('name', dev.get('id', '未知'))
        price = dev.get('price', 0)
        room = dev.get('applicable_area', '未指定')
        protocol = dev.get('protocol', '-')
        st.write(f"{emoji} **{name}** · {room} · {protocol} · ¥{price}")


# ============================================
# 主入口
# ============================================
def main():
    """页面主入口。"""
    render_top_nav("floorplan")

    # 无数据状态处理：无 plan_result 时自动跳转方案页
    if not st.session_state.get('plan_result'):
        st.warning("⚠️ 未检测到方案数据，正在返回方案页...")
        time.sleep(1.5)
        try:
            st.switch_page("views/recommend.py")
        except Exception:
            st.switch_page("views/home.py")
        return

    _render_header()
    st.markdown("")

    _render_upload_area()
    st.markdown("")

    _render_ai_analysis_area()
    st.markdown("")

    _render_device_layout_area()
    st.markdown("")

    _render_topology_area()
    st.markdown("")

    _render_device_summary()

    # 底部信息
    st.markdown("---")
    st.caption(f"🏠 HomeWizard · 设备位置示意图{' · v2.0' if not st.session_state.get('demo_mode', False) else ''}")


# 执行
try:
    main()
except Exception as e:
    st.error(f"页面加载出错：{str(e)}")
    st.caption("💡 提示：请先在首页生成方案后再访问此页面")
