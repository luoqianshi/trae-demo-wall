"""
🎮 智能联动模拟器 + 📹 AI 摄像头识别演示
左列：设备联动模拟（点击设备卡片触发联动 + 一键模式按钮）
右列：摄像头识别演示（默认预标注图片 + 用户上传识别）
所有联动和识别均为纯模拟，不涉及真实设备控制或真实 AI 模型。
"""

import streamlit as st
import os
import sys
import time
import random
import base64
import io
from datetime import datetime

# 项目根目录加入 sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from components.navigation import render_top_nav
from core.rule_engine import get_linkage_targets, get_mode_actions
from core.router import match_rules
from utils.helpers import get_device_emoji

# ============================================
# 常量定义
# ============================================

# 摄像头识别标签池
_DETECTION_LABELS = ['人', '猫', '狗', '车', '沙发', '电视', '餐桌', '花瓶', '书桌', '床']

# 识别框颜色池（R, G, B）
_DETECTION_COLORS = [
    (255, 68, 68),    # 红
    (68, 136, 255),   # 蓝
    (68, 255, 68),    # 绿
    (255, 170, 68),   # 橙
    (170, 68, 255),   # 紫
]

# 默认预标注图片的检测对象
_DEFAULT_DETECTIONS = [
    {'label': '人', 'confidence': 87, 'color_idx': 0, 'x': 80, 'y': 80, 'w': 100, 'h': 180},
    {'label': '猫', 'confidence': 92, 'color_idx': 1, 'x': 240, 'y': 150, 'w': 80, 'h': 70},
    {'label': '沙发', 'confidence': 76, 'color_idx': 2, 'x': 200, 'y': 200, 'w': 180, 'h': 80},
]

# 一键模式定义（用于按钮显示）
_QUICK_MODES = [
    {'key': '离家', 'icon': '🚪', 'label': '离家模式'},
    {'key': '回家', 'icon': '🏠', 'label': '回家模式'},
    {'key': '晚安', 'icon': '🌙', 'label': '晚安模式'},
]


# ============================================
# 状态初始化
# ============================================
def _init_state():
    """初始化 dashboard 所需的 session_state 变量。"""
    defaults = {
        'dashboard_devices': [],        # 当前方案设备列表
        'dashboard_rules': [],          # 匹配的联动规则列表
        'trigger_log': [],              # 联动日志（最多 20 条）
        'camera_images': [],            # 识别历史（最近 3 张 base64）
        'last_recognition': None,       # 最近识别结果
        'triggered_device_id': None,    # 当前触发的设备 ID（用于动画）
        'triggered_target_ids': [],     # 联动目标设备 ID 列表（用于发光动画）
        'linkage_chain': None,          # 当前联动链路（用于显示）
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


_init_state()


# ============================================
# 获取设备列表
# ============================================
def _get_devices():
    """从 session_state 读取当前方案设备列表。"""
    # 优先：setup 配置过的设备
    devices = st.session_state.get('setup_devices')
    if devices:
        return list(devices)
    # 次选：recommend 页面编辑后的设备
    selector_key = st.session_state.get('recommend_plan_selector', '')
    if selector_key:
        edit_key = f'edited_devices_{selector_key}'
        devs = st.session_state.get(edit_key)
        if devs:
            return list(devs)
    # 再次：multi_plans
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
# 注入 CSS
# ============================================
def _inject_css():
    """注入联动模拟器和摄像头演示的 CSS 动画样式。"""
    css_link = ""
    try:
        css_path = os.path.join(_PROJECT_ROOT, 'static', 'style.css')
        if os.path.exists(css_path):
            css_link = '<link rel="stylesheet" href="/app/static/style.css">'
    except Exception:
        pass

    inline_css = """
    <style>
    /* 设备卡片脉冲动画（触发时） */
    @keyframes device-trigger {
        0%, 100% { box-shadow: 0 0 0 rgba(102,126,234,0); }
        50% { box-shadow: 0 0 30px rgba(102,126,234,0.6); }
    }
    .device-triggered { animation: device-trigger 0.8s ease-in-out 3; }

    /* 联动链路流动动画 */
    @keyframes flow-line {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
    }
    .flow-line {
        background: linear-gradient(90deg, transparent, #4FC3F7, transparent);
        background-size: 200% 100%;
        animation: flow-line 1s ease-in-out infinite;
    }

    /* 识别框标签样式 */
    .detection-box { border: 2px solid #FF4444; position: absolute; border-radius: 4px; }
    .detection-label {
        background: rgba(0,0,0,0.7); color: #fff; padding: 2px 8px;
        border-radius: 4px; font-size: 12px; position: absolute;
        top: -22px; left: -2px; white-space: nowrap;
    }

    /* 一键按钮点击效果 */
    @keyframes button-flash {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    .btn-flash { animation: button-flash 0.3s ease; }

    /* 按钮波纹动画 */
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
    .ripple-btn {
        position: relative;
        overflow: hidden;
    }
    .ripple-btn::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        background: rgba(102, 126, 234, 0.4);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        pointer-events: none;
    }
    .ripple-btn:active::after {
        animation: ripple 0.6s ease-out;
    }

    /* 联动目标设备发光 */
    @keyframes target-glow {
        0%, 100% { border-color: rgba(34,197,94,0.3); box-shadow: 0 0 5px rgba(34,197,94,0.1); }
        50% { border-color: rgba(34,197,94,0.9); box-shadow: 0 0 25px rgba(34,197,94,0.4); }
    }
    .device-target-glow { animation: target-glow 1s ease-in-out 2; }

    /* 联动日志滑入 */
    @keyframes log-slide-in {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
    }
    .log-entry { animation: log-slide-in 0.3s ease-out; }

    /* 扫描线 */
    @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
    .scan-overlay {
        position: absolute; left: 0; width: 100%; height: 2px;
        background: linear-gradient(90deg, transparent, #4FC3F7, transparent);
        animation: scan-line 2s linear infinite;
    }
    </style>
    """
    st.markdown(css_link + inline_css, unsafe_allow_html=True)


# ============================================
# 毛玻璃卡片
# ============================================
def _glass_card_html(title, icon=""):
    """返回毛玻璃卡片标题的 HTML。"""
    return f"""
    <div style="background: #ffffff;
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 16px 20px; margin-bottom: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.08);">
        <h3 style="margin:0;color:#1e293b;">{icon} {title}</h3>
    </div>
    """


# ============================================
# 左列：联动模拟器
# ============================================
def _render_linkage_simulator(devices):
    """渲染左列：设备联动模拟器。"""
    st.markdown(_glass_card_html("设备联动模拟", "🔗"), unsafe_allow_html=True)

    # 方案摘要
    rules = st.session_state.get('dashboard_rules', [])
    device_count = len(devices)
    rule_count = len(rules)
    st.markdown(f"""
    <div style="background:rgba(102,126,234,0.08);border:1px solid rgba(102,126,234,0.3);
                border-radius:12px;padding:10px 16px;margin-bottom:12px;color:#64748b;font-size:0.88rem;">
        已配置 <b style="color:#667eea;">{device_count}</b> 台设备 ·
        <b style="color:#667eea;">{rule_count}</b> 条联动规则
    </div>
    """, unsafe_allow_html=True)

    # 联动链路显示区（触发后显示）
    _render_linkage_chain()

    # 设备卡片网格
    st.markdown("**📱 点击设备卡片触发联动：**")
    _render_device_cards(devices)

    st.markdown("")

    # 一键触发按钮组
    st.markdown("**⚡ 一键场景模式：**")
    _render_quick_mode_buttons(devices)

    st.markdown("")

    # 联动日志
    _render_trigger_log()


def _render_device_cards(devices):
    """渲染设备卡片网格（可点击触发联动）。"""
    if not devices:
        st.info("📋 暂无设备，请先在方案页配置设备后再来体验联动模拟。")
        return

    triggered_id = st.session_state.get('triggered_device_id')
    target_ids = st.session_state.get('triggered_target_ids', [])

    # 每行 3 个设备卡片
    cols_per_row = 3
    for i in range(0, len(devices), cols_per_row):
        row_devices = devices[i:i + cols_per_row]
        cols = st.columns(cols_per_row)
        for j, dev in enumerate(row_devices):
            dev_id = dev.get('id', f'dev_{i+j}')
            dev_name = dev.get('name', '未知设备')
            dev_category = dev.get('category', '')
            emoji = get_device_emoji(dev_category)
            is_triggered = (triggered_id == dev_id)
            is_target = (dev_id in target_ids)

            # 确定卡片样式
            if is_triggered:
                card_class = 'device-triggered'
                border_color = 'rgba(102,126,234,0.6)'
                bg = 'rgba(102,126,234,0.10)'
            elif is_target:
                card_class = 'device-target-glow'
                border_color = 'rgba(34,197,94,0.5)'
                bg = 'rgba(34,197,94,0.10)'
            else:
                card_class = ''
                border_color = '#e2e8f0'
                bg = '#f8fafc'

            with cols[j]:
                # 卡片 HTML
                st.markdown(f"""
                <div class="device-card {card_class}" style="background:{bg};
                            border:1px solid {border_color};border-radius:12px;
                            padding:12px 8px;text-align:center;margin-bottom:8px;">
                    <div style="font-size:1.8rem;">{emoji}</div>
                    <div style="color:#1e293b;font-size:0.8rem;font-weight:600;margin-top:4px;">{dev_name}</div>
                    <div style="color:#22c55e;font-size:0.7rem;margin-top:2px;">● 在线</div>
                </div>
                """, unsafe_allow_html=True)

                # 点击按钮（隐藏在卡片下方）
                if st.button("触发", key=f"trigger_dev_{dev_id}",
                             use_container_width=True, help=f"点击触发 {dev_name} 联动"):
                    _handle_device_trigger(dev, devices)


def _handle_device_trigger(trigger_device, all_devices):
    """处理设备触发事件：查找联动目标、记录日志、设置动画状态。"""
    # 获取联动目标
    targets = get_linkage_targets(trigger_device, all_devices)

    # 查找网关（用于链路显示）
    gateway = next((d for d in all_devices if d.get('category') == '网关'), None)

    # 设置动画状态
    st.session_state['triggered_device_id'] = trigger_device.get('id', '')
    st.session_state['triggered_target_ids'] = [t['device'].get('id', '') for t in targets]

    # 构建联动链路
    chain = {
        'trigger': trigger_device,
        'gateway': gateway,
        'targets': targets,
        'timestamp': datetime.now().strftime('%H:%M:%S'),
        'success': random.random() > 0.05,  # 95% 成功率
    }
    st.session_state['linkage_chain'] = chain

    # 记录联动日志
    trigger_name = trigger_device.get('name', '未知设备')
    for target in targets:
        target_dev = target.get('device', {})
        target_name = target_dev.get('name', '未知设备')
        action = target.get('action', '开启')
        desc = target.get('desc', '')
        log_entry = {
            'time': datetime.now().strftime('%H:%M:%S'),
            'trigger': trigger_name,
            'action': f"{target_name}{action}",
            'desc': desc,
            'success': chain['success'],
        }
        st.session_state['trigger_log'].insert(0, log_entry)

    # 限制日志最多 20 条
    if len(st.session_state['trigger_log']) > 20:
        st.session_state['trigger_log'] = st.session_state['trigger_log'][:20]

    st.rerun()


def _render_linkage_chain():
    """渲染联动链路图（触发后显示）。"""
    chain = st.session_state.get('linkage_chain')
    if not chain:
        return

    trigger = chain.get('trigger', {})
    gateway = chain.get('gateway')
    targets = chain.get('targets', [])
    success = chain.get('success', True)
    timestamp = chain.get('timestamp', '')

    trigger_name = trigger.get('name', '未知设备')
    trigger_emoji = get_device_emoji(trigger.get('category', ''))
    gateway_emoji = '📶'
    gateway_name = gateway.get('name', '网关') if gateway else '网关'

    # 构建链路 HTML
    chain_parts = [
        f'<div style="background:rgba(102,126,234,0.06);border:1px solid rgba(102,126,234,0.3);'
        f'border-radius:12px;padding:14px 16px;margin-bottom:12px;">'
        f'<div style="color:#64748b;font-size:0.8rem;margin-bottom:8px;">📋 联动链路 · {timestamp}</div>'
        f'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">'
        f'<span style="background:rgba(102,126,234,0.15);padding:4px 12px;border-radius:8px;color:#667eea;">'
        f'🟢 {trigger_emoji} {trigger_name}(触发)</span>'
        f'<span class="flow-line" style="width:30px;height:2px;display:inline-block;"></span>'
        f'<span style="background:rgba(118,75,162,0.15);padding:4px 12px;border-radius:8px;color:#764ba2;">'
        f'{gateway_emoji} {gateway_name}(接收)</span>'
    ]

    for target in targets:
        target_dev = target.get('device', {})
        target_name = target_dev.get('name', '未知设备')
        target_emoji = get_device_emoji(target_dev.get('category', ''))
        action = target.get('action', '开启')
        chain_parts.append(
            f'<span class="flow-line" style="width:30px;height:2px;display:inline-block;"></span>'
            f'<span style="background:rgba(34,197,94,0.15);padding:4px 12px;border-radius:8px;color:#16a34a;">'
            f'{target_emoji} {target_name}({action})</span>'
        )

    chain_parts.append('</div>')

    # 执行结果
    if success:
        result_text = f'✅ 执行成功：{trigger_name} 触发联动'
        result_color = '#16a34a'
    else:
        result_text = f'❌ 执行失败：联动超时，请重试'
        result_color = '#fca5a5'

    chain_parts.append(
        f'<div style="color:{result_color};font-size:0.85rem;">{result_text}</div>'
    )
    chain_parts.append('</div>')

    st.markdown(''.join(chain_parts), unsafe_allow_html=True)


def _render_quick_mode_buttons(devices):
    """渲染一键场景模式按钮组。"""
    cols = st.columns(len(_QUICK_MODES))
    for i, mode in enumerate(_QUICK_MODES):
        with cols[i]:
            if st.button(f"{mode['icon']} {mode['label']}",
                         key=f"quick_mode_{mode['key']}",
                         use_container_width=True,
                         type="primary"):
                _handle_mode_trigger(mode['key'], devices)


def _handle_mode_trigger(mode_key, all_devices):
    """处理一键模式触发。"""
    mode_result = get_mode_actions(mode_key, all_devices)
    mode_name = mode_result.get('name', mode_key)
    actions = mode_result.get('actions', [])

    # 无匹配设备时给出提示，不生成空链路
    if not actions:
        st.session_state['linkage_chain'] = None
        st.warning(f"⚠️ 当前方案无匹配「{mode_name}」的可控设备，请先在方案中添加对应设备。")
        return

    # 查找网关
    gateway = next((d for d in all_devices if d.get('category') == '网关'), None)

    # 构建联动链路（一键模式：触发器为模式本身）
    chain = {
        'trigger': {'name': mode_name, 'category': '场景', 'id': f'mode_{mode_key}'},
        'gateway': gateway,
        'targets': [{'device': a['device'], 'action': a['action'], 'desc': a['desc']} for a in actions],
        'timestamp': datetime.now().strftime('%H:%M:%S'),
        'success': random.random() > 0.05,
    }
    st.session_state['linkage_chain'] = chain

    # 设置目标设备发光
    st.session_state['triggered_device_id'] = None
    st.session_state['triggered_target_ids'] = [a['device'].get('id', '') for a in actions]

    # 记录联动日志
    for action in actions:
        target_dev = action.get('device', {})
        target_name = target_dev.get('name', '未知设备')
        act = action.get('action', '')
        desc = action.get('desc', '')
        log_entry = {
            'time': datetime.now().strftime('%H:%M:%S'),
            'trigger': f'{mode_name}',
            'action': f'{target_name}{act}',
            'desc': desc,
            'success': chain['success'],
        }
        st.session_state['trigger_log'].insert(0, log_entry)

    # 限制日志最多 20 条
    if len(st.session_state['trigger_log']) > 20:
        st.session_state['trigger_log'] = st.session_state['trigger_log'][:20]

    st.rerun()


def _render_trigger_log():
    """渲染联动日志区域。"""
    log = st.session_state.get('trigger_log', [])

    st.markdown("""
    <div style="background: #ffffff;
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid #e2e8f0;
                border-radius: 12px; padding: 14px 16px; margin-top: 8px;">
        <div style="color:#1e293b;font-weight:600;margin-bottom:8px;">📋 联动日志</div>
    </div>
    """, unsafe_allow_html=True)

    if not log:
        st.caption("暂无联动记录，点击设备卡片或一键模式按钮开始")
        return

    # 日志列表（最多显示 20 条）
    log_container = st.container()
    with log_container:
        for entry in log[:20]:
            time_str = entry.get('time', '')
            trigger = entry.get('trigger', '')
            action = entry.get('action', '')
            success = entry.get('success', True)
            icon = '🟢' if success else '🔴'

            st.markdown(f"""
            <div class="log-entry" style="background:#f8fafc;
                        border-left:3px solid {'#22c55e' if success else '#ef4444'};
                        padding:8px 12px;margin-bottom:4px;border-radius:0 8px 8px 0;
                        color:#64748b;font-size:0.82rem;">
                <span style="color:#64748b;font-family:monospace;">{time_str}</span>
                &nbsp;{icon}&nbsp;<b style="color:#667eea;">{trigger}</b>
                &nbsp;→&nbsp;{action}
            </div>
            """, unsafe_allow_html=True)


# ============================================
# 右列：摄像头演示
# ============================================
def _render_camera_demo():
    """渲染右列：AI 摄像头识别演示。"""
    st.markdown(_glass_card_html("AI 摄像头识别演示", "📹"), unsafe_allow_html=True)

    # 模式选择
    mode = st.radio(
        "选择演示模式",
        options=["默认演示", "上传识别"],
        horizontal=True,
        key="camera_mode",
        label_visibility="collapsed",
    )

    st.markdown("")

    if mode == "默认演示":
        _render_default_camera()
    else:
        _render_upload_camera()

    # 识别历史
    _render_recognition_history()


def _render_default_camera():
    """渲染默认演示模式：显示预标注图片。"""
    st.caption("📷 默认演示模式 · 内置预标注图片（模拟 AI 识别结果）")

    # 生成预标注图片
    img_bytes = _generate_default_annotated_image()
    if img_bytes:
        st.image(img_bytes, caption="📹 客厅摄像头画面 · AI 识别结果", use_container_width=True)

    # 识别统计
    st.markdown("""
    <div style="background:rgba(102,126,234,0.08);border:1px solid rgba(102,126,234,0.3);
                border-radius:12px;padding:10px 16px;margin-top:8px;">
        <span style="color:#667eea;font-size:0.88rem;">✅ 检测到 <b>3</b> 个物体：</span>
        <span style="color:#1e293b;font-size:0.82rem;margin-left:8px;">
            🔴 人(87%) · 🔵 猫(92%) · 🟢 沙发(76%)
        </span>
    </div>
    """, unsafe_allow_html=True)


def _generate_default_annotated_image():
    """使用 PIL 生成默认预标注图片。"""
    try:
        from PIL import Image, ImageDraw, ImageFont

        # 创建 400x300 的图片，模拟客厅场景
        width, height = 400, 300
        img = Image.new('RGB', (width, height), '#2a2a3e')
        draw = ImageDraw.Draw(img)

        # 绘制背景渐变（模拟房间）
        for y in range(height):
            r = int(42 + (y / height) * 20)
            g = int(42 + (y / height) * 15)
            b = int(62 + (y / height) * 10)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # 绘制简单的家具形状
        # 沙发（底部矩形）
        draw.rectangle([180, 190, 380, 270], fill='#4a4a5e', outline='#6a6a7e', width=2)
        # 人（上部椭圆+矩形身体）
        draw.ellipse([100, 70, 160, 130], fill='#8a7a6a', outline='#aa9a8a', width=2)
        draw.rectangle([105, 130, 155, 250], fill='#6a5a4a', outline='#8a7a6a', width=2)
        # 猫（右侧小椭圆）
        draw.ellipse([250, 140, 330, 210], fill='#5a5a6e', outline='#7a7a8e', width=2)
        # 猫耳朵
        draw.polygon([(260, 140), (270, 120), (280, 140)], fill='#5a5a6e')
        draw.polygon([(300, 140), (310, 120), (320, 140)], fill='#5a5a6e')

        # 尝试加载字体
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
        except Exception:
            font = ImageFont.load_default()

        # 绘制检测框和标签
        for det in _DEFAULT_DETECTIONS:
            x, y, w, h = det['x'], det['y'], det['w'], det['h']
            color = _DETECTION_COLORS[det['color_idx']]
            label = f"{det['label']} {det['confidence']}%"

            # 画检测框
            draw.rectangle([x, y, x + w, y + h], outline=color, width=2)

            # 画标签背景
            label_bbox = draw.textbbox((x, y - 18), label, font=font)
            draw.rectangle(label_bbox, fill=color)
            draw.text((x, y - 18), label, fill='white', font=font)

        # 转为 bytes
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return buf
    except Exception:
        return None


def _render_upload_camera():
    """渲染上传识别模式。"""
    st.caption("📷 上传图片模式 · 支持 JPG/PNG · 模拟 AI 识别")

    uploaded = st.file_uploader(
        "选择图片",
        type=['jpg', 'jpeg', 'png'],
        accept_multiple_files=False,
        key="camera_upload",
        help="上传一张图片，点击识别按钮模拟 AI 检测",
    )

    col_preview, col_btn = st.columns([3, 1])

    with col_preview:
        if uploaded is not None:
            try:
                img_data = uploaded.read()
                st.image(img_data, caption="📷 已上传图片", use_container_width=True)
            except Exception:
                st.warning("⚠️ 图片加载失败")
        else:
            st.info("📁 请上传一张图片（JPG/PNG）")

    with col_btn:
        recognize_clicked = st.button(
            "🧠 识别",
            key="camera_recognize",
            use_container_width=True,
            type="primary",
            disabled=(uploaded is None),
        )

    # 识别处理
    if recognize_clicked and uploaded is not None:
        _handle_recognition(uploaded)

    # 显示最近识别结果
    last_result = st.session_state.get('last_recognition')
    if last_result:
        st.markdown("---")
        st.markdown(f"""
        <div style="background:rgba(34,197,94,0.10);border:1px solid rgba(34,197,94,0.3);
                    border-radius:12px;padding:10px 16px;">
            <span style="color:#16a34a;font-size:0.88rem;">
                ✅ 检测到 <b>{last_result['count']}</b> 个物体：
            </span>
            <span style="color:#64748b;font-size:0.82rem;margin-left:8px;">
                {last_result['summary']}
            </span>
        </div>
        """, unsafe_allow_html=True)

        # 显示标注后的图片
        if last_result.get('annotated_image'):
            st.image(last_result['annotated_image'],
                     caption="📹 AI 识别结果（模拟）",
                     use_container_width=True)


def _handle_recognition(uploaded_file):
    """处理图片识别（模拟）。"""
    # 显示识别中提示（演示模式加速）
    progress = st.progress(0, text="🧠 模型识别中...")
    _recog_delay = 0.1 if st.session_state.get('demo_mode', False) else 0.4
    for i in range(0, 101, 20):
        time.sleep(_recog_delay)
        progress.progress(i, text=f"🧠 模型识别中... {i}%")
    progress.empty()

    try:
        from PIL import Image, ImageDraw, ImageFont

        # 读取上传的图片
        uploaded_file.seek(0)
        img_data = uploaded_file.read()
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        width, height = img.size

        # 限制图片尺寸（避免过大）
        max_dim = 600
        if max(width, height) > max_dim:
            ratio = max_dim / max(width, height)
            img = img.resize((int(width * ratio), int(height * ratio)))
            width, height = img.size

        draw = ImageDraw.Draw(img)

        # 尝试加载字体
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
        except Exception:
            font = ImageFont.load_default()

        # 随机生成 1-4 个检测框
        num_detections = random.randint(1, 4)
        detections = []
        for _ in range(num_detections):
            # 随机位置和大小（确保在图片范围内）
            box_w = random.randint(int(width * 0.15), int(width * 0.4))
            box_h = random.randint(int(height * 0.15), int(height * 0.4))
            box_x = random.randint(10, max(10, width - box_w - 10))
            box_y = random.randint(10, max(10, height - box_h - 10))

            label = random.choice(_DETECTION_LABELS)
            confidence = random.randint(70, 98)
            color = random.choice(_DETECTION_COLORS)

            detections.append({
                'label': label,
                'confidence': confidence,
                'color': color,
                'x': box_x, 'y': box_y, 'w': box_w, 'h': box_h,
            })

            # 画检测框
            draw.rectangle([box_x, box_y, box_x + box_w, box_y + box_h],
                          outline=color, width=2)

            # 画标签
            label_text = f"{label} {confidence}%"
            label_bbox = draw.textbbox((box_x, box_y - 18), label_text, font=font)
            draw.rectangle(label_bbox, fill=color)
            draw.text((box_x, box_y - 18), label_text, fill='white', font=font)

        # 转为 bytes
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        annotated_bytes = buf.getvalue()

        # 构建识别摘要
        summary_parts = [f"🔴{d['label']}({d['confidence']}%)" for d in detections]
        summary = ' · '.join(summary_parts)

        # 保存识别结果
        recognition_result = {
            'count': len(detections),
            'summary': summary,
            'annotated_image': annotated_bytes,
            'timestamp': datetime.now().strftime('%H:%M:%S'),
        }
        st.session_state['last_recognition'] = recognition_result

        # 添加到识别历史（最多 3 张）
        history = st.session_state.get('camera_images', [])
        history.insert(0, {
            'image': annotated_bytes,
            'count': len(detections),
            'summary': summary,
            'timestamp': recognition_result['timestamp'],
        })
        if len(history) > 3:
            history = history[:3]
        st.session_state['camera_images'] = history

    except Exception:
        st.warning("⚠️ 识别过程出错，请重试")


def _render_recognition_history():
    """渲染识别历史区域。"""
    history = st.session_state.get('camera_images', [])
    if not history:
        return

    st.markdown("---")
    st.markdown("""
    <div style="background: #ffffff;
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid #e2e8f0;
                border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
        <span style="color:#1e293b;font-weight:600;">🖼️ 识别历史（最近 3 张）</span>
    </div>
    """, unsafe_allow_html=True)

    cols = st.columns(min(len(history), 3))
    for i, item in enumerate(history[:3]):
        with cols[i]:
            st.image(item['image'],
                     caption=f"{item['timestamp']} · {item['count']}个物体",
                     use_container_width=True)


# ============================================
# 页面头部
# ============================================
def _render_header():
    """渲染页面标题区。"""
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.12) 100%);
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 18px 24px; margin-bottom: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.08);">
        <h1 style="margin:0;font-size:1.6rem;color:#1e293b;">🎮 智能联动模拟器</h1>
        <p style="margin:6px 0 0 0;color:#64748b;font-size:0.9rem;">
            体验设备联动效果，预览未来智能生活 · 模拟演示
        </p>
    </div>
    """, unsafe_allow_html=True)


# ============================================
# 主入口
# ============================================
def main():
    """页面主入口。"""
    _inject_css()
    render_top_nav("dashboard")
    _render_header()

    # 无数据状态处理：无设备时自动跳转方案页
    devices = _get_devices()
    if not devices:
        st.warning("⚠️ 未检测到方案数据，正在返回方案页...")
        time.sleep(1.5)
        try:
            st.switch_page("views/recommend.py")
        except Exception:
            st.switch_page("views/home.py")
        return

    # 缓存设备列表和规则到 session_state
    st.session_state['dashboard_devices'] = devices
    if not st.session_state.get('dashboard_rules'):
        try:
            st.session_state['dashboard_rules'] = match_rules(devices, top_n=10, min_match_rate=0.2)
        except Exception:
            st.session_state['dashboard_rules'] = []

    # 两列布局
    col_left, col_right = st.columns(2)

    with col_left:
        _render_linkage_simulator(devices)

    with col_right:
        _render_camera_demo()

    # 底部
    st.markdown("---")
    _simul_tag = "" if st.session_state.get('demo_mode', False) else " · 模拟演示模式"
    st.caption(f"🏠 HomeWizard · 智能联动模拟器{_simul_tag} · v2.0")


# 执行
try:
    main()
except Exception as e:
    st.error(f"页面加载出错：{str(e)}")
    st.caption("💡 提示：请先在首页生成方案后再访问此页面")
