"""
📋 推荐方案页面 — 纯 DIY 模式
无模式检查，所有组件内联，不依赖 recommend_components
"""

import streamlit as st
import sys
import os
import time
import csv
import io
import json
from datetime import datetime

# 确保项目根目录在 Python 路径中
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import pandas as pd
from st_aggrid import AgGrid, GridOptionsBuilder, GridUpdateMode, JsCode

from utils.helpers import calculate_total_price, detect_conflicts
from utils.export import export_excel, export_csv
from core.router import (
    generate_multi_plans_route, generate_plan, generate_plan_local,
    generate_plan_ai, match_rules, get_matched_scenes,
)
from constants import RULE_CATEGORIES
from components.navigation import render_top_nav, render_back_button

VERSION = "v1.0.0"

# 预算档位显示名映射（与 home.py 保持一致，避免跨模块导入）
BUDGET_TIERS = {
    "经济": {"display_name": "L1 基础智能"},
    "平衡": {"display_name": "L3 场景智能"},
    "高端": {"display_name": "L5 高阶智能"},
}


# ============================================
# 生成方式标签 / 匹配度星级 辅助函数
# ============================================

def get_source_label(source):
    """根据 source 字段返回 (标签文本, 标签类型)。
    标签类型用于 UI 配色：ai=蓝色发光 / fallback=橙色 / local=灰色。"""
    if not source:
        return ("📋 本地规则生成", "local")
    if source.startswith('ai:'):
        provider = source.split(':', 1)[1]
        provider_names = {
            'deepseek': 'DeepSeek', 'tongyi': '通义千问', 'zhipu': '智谱GLM',
            'kimi': 'Kimi', 'openai': 'OpenAI', 'ollama': 'Ollama',
        }
        pname = provider_names.get(provider, provider)
        return (f"🧠 由 {pname} AI 生成", "ai")
    if source == 'fallback':
        return ("🔄 兜底方案", "fallback")
    # local / local_rules / keyword_fallback 统一为本地规则
    return ("📋 本地规则生成", "local")


def score_to_stars(score):
    """将 0-1 的匹配度得分转换为 5 星字符串。"""
    if score is None:
        score = 0.5
    score = max(0.0, min(1.0, float(score)))
    if score >= 0.8:
        n = 5
    elif score >= 0.6:
        n = 4
    elif score >= 0.4:
        n = 3
    elif score >= 0.2:
        n = 2
    else:
        n = 1
    return "★" * n + "☆" * (5 - n)


def render_automation_rules(devices, plan_key=""):
    """渲染联动规则展示区：从 rule_library 匹配当前方案设备，显示 Top 5 规则卡片。"""
    matched = match_rules(devices, top_n=5, min_match_rate=0.3)
    # 同时存入 session_state 供其他组件使用
    try:
        st.session_state['matched_rules'] = matched
    except Exception:
        pass

    if not matched:
        st.info("🔗 暂无匹配的联动规则（当前方案设备较少）")
        return

    rule_count = len(matched)
    with st.expander(f"🔗 本方案支持的自动化场景（{rule_count} 条匹配）", expanded=True):
        # 规则卡片网格（2 列）
        cols = st.columns(2)
        for idx, rule in enumerate(matched):
            with cols[idx % 2]:
                cat_info = RULE_CATEGORIES.get(rule.get('category', ''), {})
                cat_icon = cat_info.get('icon', '🔗')
                cat_color = cat_info.get('color', '#667eea')
                match_rate = int(rule.get('match_rate', 0) * 100)
                rule_name = rule.get('name', '未命名规则')
                rule_desc = rule.get('description', '')
                trigger_obj = rule.get('trigger', {})
                if isinstance(trigger_obj, dict):
                    trigger_text = trigger_obj.get('condition', trigger_obj.get('type', ''))
                else:
                    trigger_text = str(trigger_obj)
                actions = rule.get('actions', []) or []
                required = rule.get('required_devices', []) or []
                matched_devs = rule.get('matched_devices', []) or []

                # 所需设备标记（已包含 ✅ / 未包含 ⬜）
                dev_marks = []
                for rid in required[:6]:
                    mark = "✅" if rid in matched_devs else "⬜"
                    dev_marks.append(f"{mark}`{rid}`")
                dev_text = " ".join(dev_marks) if dev_marks else "—"

                # 动作列表（取前 3 条）
                action_text = " → ".join(actions[:3]) if actions else "—"

                st.markdown(f"""
                <div style="
                    background: #f1f5f9;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid #e2e8f0;
                    border-left: 3px solid {cat_color};
                    border-radius: 12px;
                    padding: 14px 16px;
                    margin-bottom: 10px;
                ">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span style="font-size:1.05rem;font-weight:600;color:#1e293b;">
                            {cat_icon} {rule_name}
                        </span>
                        <span style="font-size:0.7rem;color:{cat_color};background:#e2e8f0;
                             padding:2px 8px;border-radius:10px;">匹配 {match_rate}%</span>
                    </div>
                    <div style="font-size:0.8rem;color:#64748b;margin-bottom:6px;">{rule_desc}</div>
                    <div style="font-size:0.78rem;color:#475569;margin-bottom:4px;">
                        <span style="color:#FFD700;">⚡触发：</span>{trigger_text}
                    </div>
                    <div style="font-size:0.78rem;color:#475569;margin-bottom:6px;">
                        <span style="color:#22c55e;">▶动作：</span>{action_text}
                    </div>
                    <div style="font-size:0.72rem;color:#64748b;line-height:1.6;">
                        <span style="color:#64748b;">所需设备：</span>{dev_text}
                    </div>
                </div>
                """, unsafe_allow_html=True)

# ============================================
# 设备图标 / 类别映射
# ============================================
device_icons = {
    'lighting': '💡', 'curtain': '🪟', 'socket': '🔌', 'switch': '🔘',
    'gateway': '📡', 'speaker': '🔊', 'aircon': '❄️', 'sensor': '🌡️',
    'camera': '📷', 'lock': '🔒', 'tv': '📺', 'humidifier': '💧', 'purifier': '🌬️',
}

category_names = {
    'lighting': '照明', 'curtain': '窗帘', 'socket': '插座', 'switch': '开关',
    'gateway': '网关', 'speaker': '音响', 'aircon': '空调', 'sensor': '传感器',
    'camera': '摄像头', 'humidifier': '加湿器', 'purifier': '净化器',
}

# 类别中文 → 英文映射（用于统计归类）
CATEGORY_CN_TO_EN = {
    '照明': 'lighting', '窗帘': 'curtain', '插座': 'socket', '开关': 'switch',
    '网关': 'gateway', '音箱': 'speaker', '音响': 'speaker', '空调': 'aircon',
    '传感器': 'sensor', '摄像头': 'camera', '门锁': 'lock', '电视': 'tv',
    '加湿器': 'humidifier', '净化器': 'purifier', '环境': 'environment',
    '安防': 'lock', '家电': 'appliance',
}

# 看板四大类别：显示名 → 匹配的英文 category 集合
DASHBOARD_CATEGORIES = {
    '照明': {'lighting', 'switch'},
    '安防': {'camera', 'sensor', 'lock'},
    '环境': {'aircon', 'humidifier', 'purifier', 'environment'},
    '遮阳': {'curtain'},
}


# ============================================
# 辅助函数
# ============================================
def get_all_devices():
    """获取所有设备库中的设备"""
    try:
        json_path = os.path.join(project_root, 'data', 'device_library.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('devices', [])
    except Exception:
        return []


# 设备库 recommendation_note 查找缓存（按 id / name 匹配）
_device_note_cache = None


def _lookup_recommendation_note(device):
    """从设备库按 id 或 name 查找 recommendation_note；找不到时回退到设备自带字段。"""
    global _device_note_cache
    if _device_note_cache is None:
        _device_note_cache = {}
        for d in get_all_devices():
            note = d.get('recommendation_note', '')
            if not note:
                continue
            if d.get('id'):
                _device_note_cache[d['id']] = note
            if d.get('name'):
                _device_note_cache[d['name']] = note
    return (
        _device_note_cache.get(device.get('id'))
        or _device_note_cache.get(device.get('name'))
        or device.get('recommendation_note', '')
    )


def render_dashboard(devices):
    """渲染全屋动态看板：总设备数、在线数、总价、四大类别统计"""
    if not devices:
        return

    total_count = sum(d.get('quantity', 1) for d in devices)
    total_price = sum(d.get('price', 0) * d.get('quantity', 1) for d in devices)
    online_count = total_count  # 暂固定为总设备数

    # 统计四大类别
    category_counts = {'照明': 0, '安防': 0, '环境': 0, '遮阳': 0}
    for d in devices:
        cn_cat = d.get('category', '')
        en_cat = CATEGORY_CN_TO_EN.get(cn_cat, cn_cat.lower() if isinstance(cn_cat, str) else '')
        for dash_name, en_set in DASHBOARD_CATEGORIES.items():
            if en_cat in en_set:
                category_counts[dash_name] += d.get('quantity', 1)
                break

    dashboard_icons = {'照明': '💡', '安防': '🛡️', '环境': '🌡️', '遮阳': '🪟'}

    st.markdown("""
    <div class="dashboard-container">
        <div style="font-size: 1.1rem; font-weight: 600; color: #475569; margin-bottom: 16px;">
            📊 全屋动态看板
        </div>
    """, unsafe_allow_html=True)

    # 关键指标行
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown(f"""
        <div class="dashboard-stat-card">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">📦</div>
            <div style="font-size: 1.4rem; font-weight: 700; color: #1e293b;">{total_count}台</div>
            <div style="font-size: 0.75rem; color: #64748b;">总设备数</div>
        </div>
        """, unsafe_allow_html=True)
    with c2:
        st.markdown(f"""
        <div class="dashboard-stat-card">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">🟢</div>
            <div style="font-size: 1.4rem; font-weight: 700; color: #22c55e;">{online_count}台</div>
            <div style="font-size: 0.75rem; color: #64748b;">在线设备</div>
        </div>
        """, unsafe_allow_html=True)
    with c3:
        st.markdown(f"""
        <div class="dashboard-stat-card">
            <div style="font-size: 1.8rem; margin-bottom: 4px;">💰</div>
            <div style="font-size: 1.4rem; font-weight: 700; color: #ffd700;">¥{total_price:,}</div>
            <div style="font-size: 0.75rem; color: #64748b;">总价</div>
        </div>
        """, unsafe_allow_html=True)

    # 类别统计行
    c4, c5, c6, c7 = st.columns(4)
    for i, (dash_name, count) in enumerate(category_counts.items()):
        icon = dashboard_icons.get(dash_name, '📦')
        col = [c4, c5, c6, c7][i]
        with col:
            st.markdown(f"""
            <div class="dashboard-stat-card">
                <div style="font-size: 1.8rem; margin-bottom: 4px;">{icon}</div>
                <div style="font-size: 1.4rem; font-weight: 700; color: #1e293b;">{count}</div>
                <div style="font-size: 0.75rem; color: #64748b;">{dash_name}</div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("</div>", unsafe_allow_html=True)


# ============================================
# 房间分组
# ============================================
ROOM_EMOJI = {
    '客厅': '🛋️', '主卧': '🛏️', '次卧': '🛏️', '卧室': '🛏️',
    '厨房': '🍳', '卫生间': '🚿', '主卫': '🚿', '次卫': '🚿',
    '玄关': '🚪', '阳台': '🌿', '书房': '📚', '餐厅': '🍽️',
    '通用': '📦',
}


def load_floorplan_rooms():
    """加载当前选中户型的房间列表"""
    # 优先从 session_state 读取缓存的户型模板
    floorplan_template = st.session_state.get('floorplan_template')
    if floorplan_template and 'rooms' in floorplan_template:
        return floorplan_template['rooms']

    floorplan_name = st.session_state.get('selected_floorplan', '')
    if not floorplan_name:
        return []
    file_map = {
        '一室一厅': 'one_bedroom.json',
        '两室一厅': 'two_bedroom.json',
        '三室一厅': 'three_bedroom.json',
    }
    filename = file_map.get(floorplan_name)
    if not filename:
        return []
    try:
        json_path = os.path.join(project_root, 'data', 'floorplan_templates', filename)
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('rooms', [])
    except Exception:
        return []


def group_devices_by_room(devices, rooms):
    """将设备按 applicable_area 分配到对应房间"""
    if not rooms:
        return [('通用', devices)]

    room_names = [r['name'] for r in rooms]
    grouped = {rn: [] for rn in room_names}
    unassigned = []

    # 构建通用名→具体名映射：将设备 applicable_area 中的通用名（如"卧室"）映射到
    # 户型模板中的具体房间名（如"主卧"或"次卧"）
    generic_to_specific = {}
    for rn in room_names:
        # "主卧"/"次卧"/"卧室" → 映射到第一个匹配的卧室
        if '卧' in rn:
            generic_to_specific.setdefault('卧室', rn)
        # "主卫"/"客卫"/"卫生间" → 映射到第一个匹配的卫生间
        if '卫' in rn and '生' not in rn:
            generic_to_specific.setdefault('卫生间', rn)

    for device in devices:
        area_str = device.get('applicable_area', '')
        if not area_str or area_str == '全屋':
            unassigned.append(device)
            continue

        areas = [a.strip() for a in area_str.replace('，', '、').split('、')]
        assigned = False

        for area in areas:
            # 1) 精确/子串匹配
            for room_name in room_names:
                if area == room_name or area in room_name or room_name in area:
                    grouped[room_name].append(device)
                    assigned = True
                    break
            if assigned:
                break

            # 2) 通用名→具体名映射
            if area in generic_to_specific:
                specific_room = generic_to_specific[area]
                grouped[specific_room].append(device)
                assigned = True
                break

        if not assigned:
            if any(kw in area_str for kw in ['入户', '门口', '门窗', '走廊']):
                if '玄关' in grouped:
                    grouped['玄关'].append(device)
                else:
                    unassigned.append(device)
            elif '电视墙' in area_str or '氛围' in area_str:
                if '客厅' in grouped:
                    grouped['客厅'].append(device)
                else:
                    unassigned.append(device)
            else:
                unassigned.append(device)

    result = []
    for room_name in room_names:
        if grouped[room_name]:
            result.append((room_name, grouped[room_name]))
    if unassigned:
        result.append(('通用', unassigned))

    return result


def group_devices_by_category(room_devices):
    """将房间内设备按 category 聚合，返回 [(category, [devices]), ...]。
    只有同类别设备 >=2 时才聚合；单个设备保持独立。
    """
    from collections import OrderedDict
    grouped = OrderedDict()
    for d in room_devices:
        cat = d.get('category', '')
        grouped.setdefault(cat, []).append(d)

    result = []
    for cat, devices in grouped.items():
        result.append((cat, devices))
    return result


def render_aggregate_card(category, devices, plan_key, device_idx_map, room_name=""):
    """渲染聚合卡片：类别图标 + 类别名称 + 设备数量，点击展开显示设备详情"""
    icon = device_icons.get(category, '📦')
    category_cn = category_names.get(category, category)
    count = len(devices)

    # 使用 st.expander 实现折叠/展开，以聚合卡片样式为标题
    expander_key = f"agg_{plan_key}_{room_name}_{category}"
    with st.expander(f"{icon} {category_cn} × {count}", expanded=False, key=expander_key):
        # 展开后逐个渲染设备卡片
        for d in devices:
            real_idx = device_idx_map.get(d.get('id', ''), 0)
            render_device_card(d, real_idx, plan_key=plan_key)


def render_device_card(device, idx, plan_key=""):
    """简化 DIY 设备卡片：图标、名称、品牌、类别、价格、数量 + ➖/➕ 按钮 + 匹配度星级 + 来源标记"""
    device_name = device.get('name', '未知设备')
    device_price = device.get('price', 0)
    device_brand = device.get('brand', '-')
    category = device.get('category', '')
    icon = device_icons.get(category, '📦')
    category_cn = category_names.get(category, category)
    quantity = device.get('quantity', 1)

    # 匹配度星级（基于 rank_score）
    rank_score = device.get('rank_score')
    stars = score_to_stars(rank_score)

    # 来源标记（AI 推荐 / 本地匹配）
    try:
        plan_source = st.session_state.get('plan_result', {}).get('source', 'local')
    except Exception:
        plan_source = 'local'
    if plan_source and plan_source.startswith('ai:'):
        source_tag = '<span style="font-size:0.65rem;color:#60a5fa;background:rgba(96,165,250,0.15);padding:1px 6px;border-radius:8px;">🧠 AI 推荐</span>'
    elif plan_source == 'fallback':
        source_tag = '<span style="font-size:0.65rem;color:#f59e0b;background:rgba(245,158,11,0.15);padding:1px 6px;border-radius:8px;">🔄 兜底</span>'
    else:
        source_tag = '<span style="font-size:0.65rem;color:#94a3b8;background:rgba(148,163,184,0.15);padding:1px 6px;border-radius:8px;">📋 本地匹配</span>'

    # 推荐说明气泡：从设备库按 id/name 查找 recommendation_note
    _note = _lookup_recommendation_note(device)
    if _note:
        _scene = st.session_state.get('selected_scenes', ['智能'])
        _scene_text = _scene[0] if isinstance(_scene, list) and _scene else '智能'
        _note_text = _note.replace('{场景}', _scene_text)
        _note_html = f'<div style="font-size: 0.75rem; color: #666; margin-top: 4px; font-style: italic;">💡 {_note_text}</div>'
    else:
        _note_html = ''

    # 价格显示：数量>1 时显示单价与小计，避免与总价对不上
    subtotal = device_price * quantity
    if quantity > 1:
        price_html = (
            f'<p style="color: #94a3b8; font-size: 0.72rem; margin: 0; text-decoration: line-through;">¥{device_price}/件 × {quantity}</p>'
            f'<p style="color: #667eea; font-size: 1.2rem; font-weight: bold; margin: 0;">¥{subtotal}</p>'
        )
    else:
        price_html = f'<p style="color: #667eea; font-size: 1.2rem; font-weight: bold; margin: 0;">¥{device_price}</p>'

    st.markdown(f"""
    <div class="device-card fade-up" style="animation-delay: {idx * 0.1}s;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 2rem;">{icon}</div>
            <div style="flex: 1;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <h4 style="margin: 0 0 2px 0;">{device_name}</h4>
                    {source_tag}
                </div>
                <p style="color: #64748b; font-size: 0.8rem; margin: 0;">{device_brand} · {category_cn}</p>
                <p style="color: #FFD700; font-size: 0.72rem; margin: 2px 0 0 0;">推荐匹配度 {stars}</p>
            </div>
            <div style="text-align: right;">
                {price_html}
            </div>
        </div>
        {_note_html}
    </div>
    """, unsafe_allow_html=True)

    # 数量增减
    qty_col1, qty_col2, qty_col3 = st.columns([1, 1, 2])
    with qty_col1:
        if st.button("➖", key=f"qty_minus_{plan_key}_{idx}", use_container_width=True):
            if f'edited_devices_{plan_key}' in st.session_state:
                edited = st.session_state[f'edited_devices_{plan_key}']
                if idx < len(edited):
                    current_qty = edited[idx].get('quantity', 1)
                    if current_qty > 1:
                        edited[idx]['quantity'] = current_qty - 1
                        st.rerun()
    with qty_col2:
        if st.button("➕", key=f"qty_plus_{plan_key}_{idx}", use_container_width=True):
            if f'edited_devices_{plan_key}' in st.session_state:
                edited = st.session_state[f'edited_devices_{plan_key}']
                if idx < len(edited):
                    current_qty = edited[idx].get('quantity', 1)
                    edited[idx]['quantity'] = current_qty + 1
                    st.rerun()
    with qty_col3:
        st.markdown(
            f"<div style='text-align:center;padding-top:6px;font-size:0.9rem;color:#475569;'>数量：{quantity}</div>",
            unsafe_allow_html=True,
        )


def generate_scene_narration(plan, devices):
    """将自动化规则转化为生活化描述"""
    scene_name = plan.get('scene_name', '')
    narrations = []

    if '观影' in scene_name or '电影' in scene_name:
        narrations.append("当您准备看电影时，只需说一句『小爱同学，打开观影模式』，系统就会为您自动调整客厅环境")
        if any(d.get('category') == 'lighting' for d in devices):
            narrations.append("智能灯泡自动调暗至温馨的观影亮度，营造沉浸式影院氛围")
        if any(d.get('category') == 'curtain' for d in devices):
            narrations.append("窗帘缓缓关闭，隔绝外界光线，让您专注享受电影时光")
        if any(d.get('category') == 'speaker' for d in devices):
            narrations.append("小爱音箱自动连接电视，为您带来震撼的环绕音效")
        narrations.append("所有设备协同工作，让您足不出户就能享受影院级观影体验")
    elif '起夜' in scene_name:
        narrations.append("深夜起夜时，无需摸黑找开关，系统会为您照亮前行的路")
        if any(d.get('category') == 'sensor' for d in devices):
            narrations.append("卧室的人体传感器检测到您起身，自动触发夜灯模式")
        if any(d.get('category') == 'lighting' for d in devices):
            narrations.append("走廊和卫生间的智能灯缓缓亮起，亮度柔和不刺眼")
        narrations.append("当您返回卧室后，灯光会自动延时关闭，不打扰家人休息")
    elif '离家' in scene_name:
        narrations.append("准备出门时，只需轻轻按一下离家模式按钮")
        if any(d.get('category') == 'socket' for d in devices):
            narrations.append("家中所有非必要电器自动断电，节能环保又安全")
        if any(d.get('category') == 'curtain' for d in devices):
            narrations.append("窗帘自动关闭，保护家中隐私")
        if any(d.get('category') == 'camera' for d in devices):
            narrations.append("智能摄像机自动切换到看家模式，实时监控家中安全")
        narrations.append("一键离家，安心出门")
    elif '起床' in scene_name:
        narrations.append("清晨，智能闹钟响起的同时，新的一天从智能场景开始")
        if any(d.get('category') == 'curtain' for d in devices):
            narrations.append("窗帘缓缓打开，让阳光温柔地唤醒您")
        if any(d.get('category') == 'lighting' for d in devices):
            narrations.append("卧室灯光渐亮，模拟自然日出效果")
        if any(d.get('category') == 'speaker' for d in devices):
            narrations.append("小爱音箱播放您喜欢的晨间新闻或音乐")
        narrations.append("美好的一天从舒适的起床体验开始")
    elif '回家' in scene_name:
        narrations.append("当您下班回家，开门的那一刻，智能场景已为您准备就绪")
        if any(d.get('category') == 'lighting' for d in devices):
            narrations.append("玄关和客厅的灯光自动亮起，迎接您回家")
        if any(d.get('category') == 'aircon' for d in devices):
            narrations.append("空调自动调节到您最喜欢的温度")
        if any(d.get('category') == 'speaker' for d in devices):
            narrations.append("小爱音箱播放您最爱的欢迎音乐")
        narrations.append("让您一回家就能享受舒适的居家环境")
    else:
        narrations.append(f"当您启动{scene_name}时，以下设备将协同工作")
        for device in devices[:3]:
            narrations.append(f"{device.get('name', '')}将根据预设规则自动运行")
        narrations.append("打造智能化的生活体验")

    return narrations


def generate_markdown(plan, plan_name="推荐方案"):
    """生成 Markdown 格式的方案文档"""
    scene_name = plan.get('scene_name', plan_name)
    description = plan.get('description', '')
    devices = plan.get('devices', [])
    actions = plan.get('actions', [])
    source = plan.get('source') or 'unknown'
    total_price = calculate_total_price(devices)

    if source.startswith('ai:'):
        provider = source.split(':', 1)[1]
        source_text = f"AI 推荐（{provider}）"
    elif source == 'fallback':
        source_text = "兜底方案"
    else:
        source_text = "本地规则匹配"

    md = f"""# {scene_name}

> {description}

## 📦 设备清单

| 序号 | 设备名称 | 类别 | 单价 | 数量 | 小计 | 需要网关 |
|------|----------|------|------|------|------|----------|
"""
    for i, device in enumerate(devices, 1):
        name = device.get('name', '未知设备')
        category = device.get('category', '未知')
        price = device.get('price', 0)
        quantity = device.get('quantity', 1)
        subtotal = price * quantity
        gateway = "是" if device.get('gateway_required', False) else "否"
        md += f"| {i} | {name} | {category} | ¥{price} | {quantity} | ¥{subtotal} | {gateway} |\n"

    md += f"""
## 🔄 自动化动作

"""
    for i, action in enumerate(actions, 1):
        md += f"{i}. {action}\n"

    md += f"""
## 💰 预估总价

**¥{total_price}**

## 📌 方案来源

{source_text}

---
*本文档由 HomeWizard 智能家居场景规划器自动生成*
*生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    return md


# ============================================
# Session State 初始化
# ============================================
if 'favorites' not in st.session_state:
    st.session_state['favorites'] = []
if 'user_preferences' not in st.session_state:
    st.session_state['user_preferences'] = {
        'preferred_tier': 'balanced',
        'preferred_categories': [],
        'click_count': {'economy': 0, 'balanced': 0, 'premium': 0}
    }
# 联动规则 / 生成日志 / 当前模式
if 'matched_rules' not in st.session_state:
    st.session_state['matched_rules'] = []
if 'generation_log' not in st.session_state:
    st.session_state['generation_log'] = ''
if 'current_generation_mode' not in st.session_state:
    st.session_state['current_generation_mode'] = 'auto'

# ============================================
# 顶部导航栏
# ============================================
render_top_nav("recommend")


def _regenerate_with_mode(mode):
    """用指定模式重新生成 plan_result 并刷新页面。"""
    user_input = st.session_state.get('user_input', '')
    budget = st.session_state.get('budget', 3000)
    floorplan = st.session_state.get('selected_floorplan', '')
    budget_tier = st.session_state.get('selected_budget_tier', '')
    if not user_input:
        st.warning("请先返回首页输入需求")
        return
    with st.spinner("正在重新生成方案..."):
        result = generate_plan(
            user_input, budget=budget, mode=mode,
            floorplan=floorplan, budget_tier=budget_tier,
        )
    if result:
        st.session_state['plan_result'] = result
        st.session_state['current_generation_mode'] = mode
        st.rerun()
    else:
        st.error("重新生成失败，请返回首页重试")


# ============================================
# 页面顶部
# ============================================
st.title("📋 推荐方案")

# 顶部操作区：返回首页 | 生成模式切换 | 重新生成
col_back, col_mode, col_regen = st.columns([1, 2, 1])
with col_back:
    if st.button("← 返回首页", key="back_home_btn", use_container_width=True):
        st.switch_page("views/home.py")
with col_mode:
    mode_options = ["🔄 智能切换 (auto)", "📋 本地规则 (local)", "🧠 AI 生成 (ai)"]
    mode_values = ['auto', 'local', 'ai']
    current_mode = st.session_state.get('current_generation_mode', 'auto')
    # 兼容内部 mode 标记（auto_local / auto_ai / ai_fallback 等归并为 auto）
    if current_mode not in mode_values:
        current_mode = 'auto' if 'auto' in current_mode else ('ai' if 'ai' in current_mode else 'local')
    current_idx = mode_values.index(current_mode) if current_mode in mode_values else 0
    selected_mode_label = st.selectbox(
        "生成模式",
        options=mode_options,
        index=current_idx,
        key="recommend_mode_switcher",
        label_visibility="collapsed",
    )
    # 解析选中的模式
    for mv, mo in zip(mode_values, mode_options):
        if mo == selected_mode_label:
            if mv != st.session_state.get('current_generation_mode'):
                # 模式切换后自动重新生成
                _regenerate_with_mode(mv)
            break
with col_regen:
    if st.button("🔄 重新生成", key="regenerate_plan_btn", use_container_width=True, type="secondary"):
        # 用当前选中的模式重新生成
        _sel = st.session_state.get('recommend_mode_switcher', mode_options[0])
        _mode = 'auto'
        for mv, mo in zip(mode_values, mode_options):
            if mo == _sel:
                _mode = mv
                break
        _regenerate_with_mode(_mode)

st.markdown("---")

# ============================================
# 主逻辑：方案展示
# ============================================
if 'plan_result' not in st.session_state or not st.session_state['plan_result']:
    # 无数据自动跳转首页
    st.warning("⚠️ 未检测到方案数据，正在返回首页...")
    time.sleep(1.5)
    try:
        st.switch_page("views/home.py")
    except Exception:
        # AppTest 环境或路径解析失败时静默忽略（生产环境由 st.navigation 处理）
        pass
else:
    result = st.session_state['plan_result']
    user_input = st.session_state.get('user_input', '')
    scene_name = result.get('scene_name', '智能方案')
    description = result.get('description', '')
    source = result.get('source') or 'unknown'
    # 统一生成方式标签（本地/AI/兜底）
    source_label_text, source_type = get_source_label(source)
    budget = st.session_state.get('budget', 3000)
    # AI 推荐理由
    ai_reason = result.get('reason', '') if source.startswith('ai:') else ''

    # === 方案概览卡片（毛玻璃，核心枢纽顶部） ===
    _fp_name = st.session_state.get('selected_floorplan', '')
    _bt_display = BUDGET_TIERS.get(st.session_state.get('selected_budget_tier', ''), {}).get('display_name', '')
    # 优先使用编辑后的设备列表，确保与看板/总价卡片一致
    _sel_key = st.session_state.get('recommend_plan_selector')
    _edited = st.session_state.get(f'edited_devices_{_sel_key}') if _sel_key else None
    _devices_list = list(_edited) if _edited else result.get('devices', [])
    _device_total = sum(d.get('quantity', 1) for d in _devices_list)
    _total_price = sum(d.get('price', 0) * d.get('quantity', 1) for d in _devices_list)

    st.markdown(f"""
    <div style="background:#f1f5f9;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
                border:1px solid #e2e8f0;border-radius:16px;padding:20px 24px;margin-bottom:20px;
                box-shadow:0 8px 32px rgba(0,0,0,0.08);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
                <h2 style="margin:0 0 6px 0;color:#1e293b;font-size:1.3rem;">{_fp_name} · {_bt_display} 方案</h2>
                <span style="color:#64748b;font-size:0.85rem;">共 {_device_total} 件设备</span>
                <span style="color:#444;margin:0 8px;">|</span>
                <span style="color:#0284c7;font-size:0.85rem;">{source_label_text}</span>
            </div>
            <div style="text-align:right;">
                <div style="color:#64748b;font-size:0.8rem;">💰 预估总价</div>
                <div style="color:#FFD700;font-size:1.6rem;font-weight:700;">¥{_total_price}</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # === 快速操作按钮组（核心枢纽） ===
    def _current_selected_devices():
        """获取当前选中方案的设备列表（用户切换 economy/balanced/premium 后实时反映）。"""
        sel_key = st.session_state.get('recommend_plan_selector')
        if sel_key:
            edited = st.session_state.get(f'edited_devices_{sel_key}')
            if edited:
                return list(edited)
        # 兜底：plan_result 的设备
        return list(_devices_list)

    _quick_cols = st.columns(4)
    with _quick_cols[0]:
        if st.button("🚀 开始配置", key="hub_goto_setup", use_container_width=True, type="primary"):
            st.session_state['setup_devices'] = _current_selected_devices()
            st.switch_page("views/setup.py")
    with _quick_cols[1]:
        if st.button("📐 查看户型图", key="hub_goto_floorplan", use_container_width=True):
            st.switch_page("views/floorplan.py")
    with _quick_cols[2]:
        if st.button("🎮 进入控制台", key="hub_goto_dashboard", use_container_width=True):
            st.session_state['setup_devices'] = _current_selected_devices()
            st.switch_page("views/dashboard.py")
    with _quick_cols[3]:
        if st.button("📤 导出清单", key="hub_export", use_container_width=True):
            st.session_state['_scroll_to_export'] = True
            st.rerun()

    st.markdown("")

    # === 用户原始需求与系统理解摘要 ===
    with st.expander("💬 您的需求与系统理解", expanded=True):
        if user_input:
            st.markdown(f"> 💬 **您的原始需求：**\n>\n> {user_input}")
        else:
            st.markdown("> 💬 您的原始需求：（未记录）")

        extracted_keywords = st.session_state.get('extracted_keywords', [])
        if extracted_keywords:
            keywords_text = "、".join(extracted_keywords)
            st.markdown(f"我们理解您的需求主要围绕：**{keywords_text}** 等。")
        else:
            st.markdown("我们为您推荐了全屋基础方案，您可以在下方调整。")
    st.markdown("")

    # 匹配度计算
    devices = result.get('devices', [])
    if devices and 'rank_score' in devices[0]:
        avg_score = sum(d.get('rank_score', 0) for d in devices) / len(devices)
        match_percent = int(avg_score * 100)
    else:
        match_percent = int(result.get('confidence', 0.5) * 100)

    # 需求摘要
    def _gen_need_summary(text):
        kws = ['客厅', '卧室', '厨房', '卫生间', '阳台', '全屋', '灯光', '窗帘', '空调', '音箱', '监控', '安防', '观影', '起夜', '起床', '离家', '回家', '睡眠']
        matched = [kw for kw in kws if kw in text]
        if matched:
            return f"您想要在{matched[0]}实现{matched[-1] if len(matched) > 1 else '智能化'}的需求"
        return "您想要打造智能家居的需求"

    need_summary = _gen_need_summary(user_input)

    # 匹配度展示（毛玻璃深色卡片）
    st.markdown("""
    <div style="background: #f1f5f9; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-weight: 600; color: #1e293b;">系统认为最匹配你的方案是：</span>
            <span style="color: #0284c7; font-weight: 700; font-size: 1.1rem;">{}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 0.85rem; color: #64748b;">匹配度</span>
                    <span style="font-size: 0.85rem; font-weight: 600; color: #0284c7;">{}%</span>
                </div>
                <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: {}%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); border-radius: 4px;"></div>
                </div>
            </div>
            <div style="padding: 8px 16px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); border-radius: 20px;">
                <span style="color: #16a34a; font-weight: 500;">匹配度 {}%</span>
            </div>
        </div>
    </div>
    """.format(scene_name, match_percent, match_percent, match_percent), unsafe_allow_html=True)

    st.markdown(f"""
    <div style="background: rgba(245,158,11,0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 20px;">
        <div style="color: #b45309;">💡 <span style="font-weight: 500;">我们理解你的需求是：</span>{need_summary}</div>
    </div>
    """, unsafe_allow_html=True)

    # 场景标题卡片（含生成方式标签 + AI 推荐理由）
    # 根据来源类型配置标签样式
    if source_type == 'ai':
        source_badge_style = (
            "background: rgba(96,165,250,0.25); border: 1px solid rgba(96,165,250,0.6); "
            "box-shadow: 0 0 12px rgba(96,165,250,0.4); padding: 4px 12px; "
            "border-radius: 20px; font-size: 0.85rem; color: #1d4ed8;"
        )
    elif source_type == 'fallback':
        source_badge_style = (
            "background: rgba(245,158,11,0.25); border: 1px solid rgba(245,158,11,0.5); "
            "padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; color: #b45309;"
        )
    else:
        source_badge_style = (
            "background: #e2e8f0; padding: 4px 12px; "
            "border-radius: 20px; font-size: 0.85rem; color: #475569;"
        )

    # AI 推荐理由块（仅 AI 来源显示）
    reason_html = ''
    if ai_reason:
        reason_html = (
            f'<div style="margin-top:10px;padding:10px 14px;background:rgba(96,165,250,0.12);'
            f'border-left:3px solid #60a5fa;border-radius:0 8px 8px 0;font-size:0.85rem;color:#1d4ed8;">'
            f'💡 <span style="font-weight:500;">推荐理由：</span>{ai_reason}</div>'
        )

    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; color: white; margin-bottom: 24px;">
        <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 8px;">{scene_name}</div>
        <div style="opacity: 0.9; margin-bottom: 12px;">{description}</div>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <span style="{source_badge_style}">{source_label_text}</span>
            <span style="background: #e2e8f0; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; color: #475569;">💬 您的需求：{user_input[:30]}{'...' if len(user_input) > 30 else ''}</span>
        </div>
        {reason_html}
    </div>
    """, unsafe_allow_html=True)

    if source == 'keyword_fallback':
        matched_keywords = result.get('matched_keywords', [])
        if matched_keywords:
            st.info(f"💡 根据 【{'、'.join(matched_keywords[:3])}】 关键词，我们为你推荐以下组合。")

    # 生成多方案（优先使用 home.py 缓存的 multi_plans，避免每次 rerun 重新生成）
    with st.spinner("正在加载方案..."):
        multi_plans = st.session_state.get('multi_plans')
        if not multi_plans:
            try:
                multi_plans = generate_multi_plans_route(st.session_state.get('user_input', ''), budget)
                if multi_plans:
                    st.session_state['multi_plans'] = multi_plans
            except Exception as e:
                st.error(f"加载方案时出错: {str(e)}")
                multi_plans = None

    if multi_plans:
        st.info(f"📊 当前预算范围：0 - ¥{budget}")

        # 根据用户选择的预算档位确定默认选中的方案
        tier_to_key = {'经济': 'economy', '平衡': 'balanced', '高端': 'premium'}
        selected_tier = st.session_state.get('selected_budget_tier', '平衡')
        default_key = tier_to_key.get(selected_tier, 'balanced')

        plan_keys = ['economy', 'balanced', 'premium']
        default_index = plan_keys.index(default_key)

        # 使用 radio 作为方案选择器（替代 tabs，支持默认选中）
        selected_plan_key = st.radio(
            "选择方案档位",
            options=plan_keys,
            format_func=lambda k: multi_plans[k]['name'],
            index=default_index,
            horizontal=True,
            label_visibility="collapsed",
            key="recommend_plan_selector"
        )

        plan = multi_plans[selected_plan_key]
        key = selected_plan_key

        st.header(plan['name'])
        st.write(plan['description'])
        if plan.get('warning'):
            st.warning(f"⚠️ {plan['warning']}")

        edit_key = f'edited_devices_{key}'
        if edit_key not in st.session_state:
            st.session_state[edit_key] = list(plan.get('devices', []))

        # 准备数据（tabs 之前定义，供各 Tab 共用）
        plan_devices = st.session_state[edit_key]

        # === 3-Tab 内容区（匹配 UI 示例：设备清单 / 联动规则 / 方案分析）===
        tab_devices, tab_rules, tab_analysis = st.tabs(["📋 设备清单", "🔗 联动规则", "📊 方案分析"])

        # ---------- Tab 1: 设备清单 ----------
        with tab_devices:
            st.subheader("📦 设备清单")
            if plan_devices:
                # 全屋动态看板
                render_dashboard(plan_devices)

                # ===== AgGrid 物料清单表格 =====
                with st.expander("📊 物料清单表格（可筛选/排序/点击查看详情）", expanded=True):
                    bom_data = []
                    for i, d in enumerate(plan_devices):
                        icon = device_icons.get(d.get('category', ''), '📦')
                        cat_cn = category_names.get(d.get('category', ''), d.get('category', ''))
                        rank_score = d.get('rank_score', 0.5)
                        if rank_score >= 0.8:
                            stars = "★★★★★"
                        elif rank_score >= 0.6:
                            stars = "★★★★☆"
                        elif rank_score >= 0.4:
                            stars = "★★★☆☆"
                        elif rank_score >= 0.2:
                            stars = "★★☆☆☆"
                        else:
                            stars = "★☆☆☆☆"
                        bom_data.append({
                            '序号': i + 1,
                            '设备': f"{icon} {d.get('name', '')}",
                            '类别': cat_cn,
                            '品牌': d.get('brand', '-'),
                            '单价(¥)': d.get('price', 0),
                            '数量': d.get('quantity', 1),
                            '小计(¥)': d.get('price', 0) * d.get('quantity', 1),
                            '适用区域': d.get('applicable_area', '-'),
                            '匹配度': stars,
                            'id': d.get('id', ''),
                        })

                    df = pd.DataFrame(bom_data)

                    gb = GridOptionsBuilder.from_dataframe(df)
                    gb.configure_default_column(
                        sortable=True,
                        filter=True,
                        resizable=True,
                    )
                    gb.configure_column('序号', width=70, pinned='left')
                    gb.configure_column('设备', width=220)
                    gb.configure_column('类别', width=90)
                    gb.configure_column('品牌', width=100)
                    gb.configure_column('单价(¥)', width=90, type=['numericColumn'])
                    gb.configure_column('数量', width=80, type=['numericColumn'])
                    gb.configure_column('小计(¥)', width=90, type=['numericColumn'])
                    gb.configure_column('适用区域', width=120)
                    gb.configure_column('匹配度', width=100)
                    gb.configure_column('id', hide=True)
                    gb.configure_selection(
                        selection_mode='single',
                        use_checkbox=False,
                        pre_selected_rows=[0],
                    )
                    gb.configure_grid_options(
                        domLayout='normal',
                        rowHeight=42,
                        headerHeight=48,
                    )
                    grid_options = gb.build()

                    grid_response = AgGrid(
                        df,
                        gridOptions=grid_options,
                        update_mode=GridUpdateMode.SELECTION_CHANGED,
                        height=360,
                        theme='streamlit',
                        key=f"aggrid_bom_{key}",
                        allow_unsafe_jscode=True,
                    )

                    selected_rows = grid_response.get('selected_rows', [])
                    if selected_rows is not None and len(selected_rows) > 0:
                        sel = selected_rows.iloc[0] if hasattr(selected_rows, 'iloc') else selected_rows[0]
                        sel_id = sel.get('id', '') if isinstance(sel, dict) else sel['id']
                        sel_device = next((d for d in plan_devices if d.get('id') == sel_id), None)
                        if sel_device:
                            st.markdown("---")
                            st.markdown(f"### 🔍 {sel_device.get('name', '设备详情')}")
                            dcol1, dcol2 = st.columns([2, 1])
                            with dcol1:
                                st.markdown(f"""
                                <div style="background: #f1f5f9; backdrop-filter: blur(20px); border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                                    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">品牌</div>
                                    <div style="font-weight: 500; color: #1e293b; margin-bottom: 12px;">{sel_device.get('brand', '-')}</div>
                                    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">类别</div>
                                    <div style="font-weight: 500; color: #1e293b; margin-bottom: 12px;">{category_names.get(sel_device.get('category', ''), sel_device.get('category', ''))}</div>
                                    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">适用区域</div>
                                    <div style="font-weight: 500; color: #1e293b; margin-bottom: 12px;">{sel_device.get('applicable_area', '-')}</div>
                                    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">通讯协议</div>
                                    <div style="font-weight: 500; color: #1e293b; margin-bottom: 12px;">{sel_device.get('protocol', '米家 BLE')}</div>
                                    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">是否需要网关</div>
                                    <div style="font-weight: 500; color: #1e293b;">{'是' if sel_device.get('gateway_required', False) else '否'}</div>
                                </div>
                                """, unsafe_allow_html=True)
                            with dcol2:
                                st.markdown(f"""
                                <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2)); backdrop-filter: blur(20px); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 12px; padding: 16px; text-align: center;">
                                    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">单价</div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #FFD700; margin-bottom: 12px;">¥{sel_device.get('price', 0)}</div>
                                    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">数量</div>
                                    <div style="font-size: 1.2rem; font-weight: 600; color: #1e293b; margin-bottom: 12px;">× {sel_device.get('quantity', 1)}</div>
                                    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">小计</div>
                                    <div style="font-size: 1.3rem; font-weight: 700; color: #22c55e;">¥{sel_device.get('price', 0) * sel_device.get('quantity', 1)}</div>
                                </div>
                                """, unsafe_allow_html=True)

                            _note = _lookup_recommendation_note(sel_device)
                            if _note:
                                st.markdown("")
                                st.markdown(f"""
                                <div style="background: rgba(96,165,250,0.1); border-left: 3px solid #60a5fa; padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 0.85rem; color: #1d4ed8;">
                                    💡 <span style="font-weight: 500;">推荐说明：</span>{_note}
                                </div>
                                """, unsafe_allow_html=True)

                            features = sel_device.get('features') or []
                            if features:
                                st.markdown("")
                                st.markdown("**主要功能：**")
                                feat_html = " ".join([f"<span style='display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;padding:4px 10px;border-radius:16px;font-size:0.75rem;color:#475569;margin:2px 4px 2px 0;'>{f}</span>" for f in features])
                                st.markdown(feat_html, unsafe_allow_html=True)

                rooms = load_floorplan_rooms()
                room_groups = group_devices_by_room(plan_devices, rooms)

                # 构建 device id → 扁平列表索引 的映射，确保按钮回调修改正确的设备
                device_idx_map = {d.get('id', ''): i for i, d in enumerate(plan_devices)}

                for room_name, room_devices in room_groups:
                    emoji = ROOM_EMOJI.get(room_name, '📦')
                    device_count = len(room_devices)
                    if room_name == '通用':
                        st.markdown(f"### {emoji} 通用设备 · {device_count}件")
                        st.caption("以下设备建议根据实际情况摆放")
                    else:
                        st.markdown(f"### {emoji} {room_name} · {device_count}件")

                    # 房间内按 category 聚合
                    cat_groups = group_devices_by_category(room_devices)
                    for cat, cat_devices in cat_groups:
                        if len(cat_devices) >= 2:
                            # 同类设备 >=2：聚合卡片
                            render_aggregate_card(cat, cat_devices, plan_key=key, device_idx_map=device_idx_map, room_name=room_name)
                        else:
                            # 单设备：保持原有卡片样式
                            real_idx = device_idx_map.get(cat_devices[0].get('id', ''), 0)
                            render_device_card(cat_devices[0], real_idx, plan_key=key)
                    st.markdown("")

                # 总价卡片（保留在设备清单 Tab 底部）
                st.markdown("---")
                total_price = calculate_total_price(plan_devices)
                local_count = sum(1 for d in plan_devices if d.get('local_control_supported', False))
                local_percent = int((local_count / len(plan_devices)) * 100) if plan_devices else 0
                if plan_devices and total_price > 0:
                    total_features = sum(len(d.get('features') or []) for d in plan_devices)
                    stars = min(int((total_features / total_price) * 100), 5)
                    rating_stars = "⭐" * stars + "☆" * (5 - stars)
                else:
                    rating_stars = "⭐⭐⭐⭐"

                st.markdown(f"""
                <div class="total-price-card total-price-card-gold">
                    <div style="opacity: 0.9; color: #1e293b;">💰 预估总价</div>
                    <div class="price">¥{total_price}</div>
                    <div style="opacity: 0.8; font-size: 0.85rem; color: #64748b;">预算使用率: {min((total_price / budget) * 100, 100):.1f}%</div>
                    <div style="opacity: 0.8; font-size: 0.85rem; margin-top: 8px; color: #64748b;">🟢 本地控制设备占比: {local_percent}%</div>
                    <div style="opacity: 0.8; font-size: 0.85rem; margin-top: 8px; color: #64748b;">⭐ 性价比评级: {rating_stars}</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.info("暂无设备推荐")

        # ---------- Tab 2: 联动规则 ----------
        with tab_rules:
            if plan_devices:
                render_automation_rules(plan_devices, plan_key=key)
            else:
                st.info("暂无设备，无法生成联动规则")

            # 自动化动作
            st.markdown("---")
            st.subheader("🔄 自动化动作")
            actions = plan.get('actions', [])
            for idx_a, action in enumerate(actions, 1):
                st.write(f"{idx_a}. {action}")
            if not actions:
                st.info("暂无自动化动作")

        # ---------- Tab 3: 方案分析 ----------
        with tab_analysis:
            # 生成摘要
            gen_log = st.session_state.get('generation_log', '')
            if gen_log:
                st.markdown(f"""
                <div style="
                    background: #f1f5f9;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 14px 18px;
                    margin-top: 12px;
                    font-size: 0.85rem;
                    color: #475569;
                    line-height: 1.6;
                ">
                    <span style="font-weight:600;color:#1e293b;">📝 生成摘要</span><br/>
                    {gen_log}
                </div>
                """, unsafe_allow_html=True)

            # 生态兼容性
            st.markdown("---")
            st.subheader("🔗 生态兼容性")
            protocols = sorted({d.get('protocol', '') for d in plan_devices} - {''})
            need_gateway = any(d.get('gateway_required', False) for d in plan_devices)
            has_gateway = any(d.get('category') == 'gateway' for d in plan_devices)
            tips_html = f'<div>🔌 支持协议：{", ".join(protocols) if protocols else "未知"}</div>'
            if has_gateway:
                tips_html += '<div>🟢 已包含网关，无需额外购买</div>'
            elif need_gateway and not has_gateway:
                tips_html += '<div>⚠️ 部分设备需要网关，建议搭配米家网关使用</div>'
            elif not need_gateway:
                tips_html += '<div>✅ 所有设备即插即用，无需额外网关</div>'
            st.markdown(f"""
            <div style="background: rgba(34,197,94,0.08); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 4px solid #22c55e; padding: 16px; border-radius: 0 8px 8px 0;">
                <div style="font-weight: 500; color: #16a34a; margin-bottom: 8px;">✅ 本方案内所有设备均兼容米家App</div>
                <div style="color: #64748b; font-size: 0.9rem;">{tips_html}</div>
            </div>
            """, unsafe_allow_html=True)

            # 场景叙事
            st.markdown("---")
            st.subheader("🎬 场景叙事")
            for idx_n, narration in enumerate(generate_scene_narration(plan, plan_devices), 1):
                st.markdown(f"""
                <div style="background: #f1f5f9; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 4px solid #667eea; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 8px; color: #64748b;">
                    <span style="font-weight: 500; color: #0284c7;">{idx_n}.</span> {narration}
                </div>
                """, unsafe_allow_html=True)
    else:
        # 单方案回退 — 也按房间分组
        st.header(result.get('scene_name', '未命名场景'))
        if description:
            st.write(description)
        if result.get('warning'):
            st.warning(f"⚠️ {result['warning']}")
        st.subheader("📦 设备清单")
        # 初始化编辑后的设备列表，确保 ➕/➖ 修改能同步到看板/总价卡片
        if 'edited_devices_single' not in st.session_state:
            st.session_state['edited_devices_single'] = list(result.get('devices', []))
        devices_single = st.session_state['edited_devices_single']
        if devices_single:
            # 全屋动态看板
            render_dashboard(devices_single)

            # ===== AgGrid 物料清单表格 =====
            with st.expander("📊 物料清单表格（可筛选/排序/点击查看详情）", expanded=True):
                bom_data_single = []
                for i, d in enumerate(devices_single):
                    icon = device_icons.get(d.get('category', ''), '📦')
                    cat_cn = category_names.get(d.get('category', ''), d.get('category', ''))
                    rank_score = d.get('rank_score', 0.5)
                    if rank_score >= 0.8:
                        stars = "★★★★★"
                    elif rank_score >= 0.6:
                        stars = "★★★★☆"
                    elif rank_score >= 0.4:
                        stars = "★★★☆☆"
                    elif rank_score >= 0.2:
                        stars = "★★☆☆☆"
                    else:
                        stars = "★☆☆☆☆"
                    bom_data_single.append({
                        '序号': i + 1,
                        '设备': f"{icon} {d.get('name', '')}",
                        '类别': cat_cn,
                        '品牌': d.get('brand', '-'),
                        '单价(¥)': d.get('price', 0),
                        '数量': d.get('quantity', 1),
                        '小计(¥)': d.get('price', 0) * d.get('quantity', 1),
                        '适用区域': d.get('applicable_area', '-'),
                        '匹配度': stars,
                        'id': d.get('id', ''),
                    })

                df_single = pd.DataFrame(bom_data_single)

                gb_single = GridOptionsBuilder.from_dataframe(df_single)
                gb_single.configure_default_column(
                    sortable=True,
                    filter=True,
                    resizable=True,
                )
                gb_single.configure_column('序号', width=70, pinned='left')
                gb_single.configure_column('设备', width=220)
                gb_single.configure_column('类别', width=90)
                gb_single.configure_column('品牌', width=100)
                gb_single.configure_column('单价(¥)', width=90, type=['numericColumn'])
                gb_single.configure_column('数量', width=80, type=['numericColumn'])
                gb_single.configure_column('小计(¥)', width=90, type=['numericColumn'])
                gb_single.configure_column('适用区域', width=120)
                gb_single.configure_column('匹配度', width=100)
                gb_single.configure_column('id', hide=True)
                gb_single.configure_selection(
                    selection_mode='single',
                    use_checkbox=False,
                    pre_selected_rows=[0],
                )
                gb_single.configure_grid_options(
                    domLayout='normal',
                    rowHeight=42,
                    headerHeight=48,
                )
                grid_options_single = gb_single.build()

                grid_response_single = AgGrid(
                    df_single,
                    gridOptions=grid_options_single,
                    update_mode=GridUpdateMode.SELECTION_CHANGED,
                    height=360,
                    theme='streamlit',
                    key="aggrid_bom_single",
                    allow_unsafe_jscode=True,
                )

                selected_rows_single = grid_response_single.get('selected_rows', [])
                if selected_rows_single is not None and len(selected_rows_single) > 0:
                    sel_s = selected_rows_single.iloc[0] if hasattr(selected_rows_single, 'iloc') else selected_rows_single[0]
                    sel_id_s = sel_s.get('id', '') if isinstance(sel_s, dict) else sel_s['id']
                    sel_device_s = next((d for d in devices_single if d.get('id') == sel_id_s), None)
                    if sel_device_s:
                        st.markdown("---")
                        st.markdown(f"### 🔍 {sel_device_s.get('name', '设备详情')}")
                        dcol1_s, dcol2_s = st.columns([2, 1])
                        with dcol1_s:
                            st.markdown(f"""
                            <div style="background: #f1f5f9; backdrop-filter: blur(20px); border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">品牌</div>
                                <div style="font-weight: 500; color: #1e293b; margin-bottom: 12px;">{sel_device_s.get('brand', '-')}</div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">类别</div>
                                <div style="font-weight: 500; color: #1e293b; margin-bottom: 12px;">{category_names.get(sel_device_s.get('category', ''), sel_device_s.get('category', ''))}</div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">适用区域</div>
                                <div style="font-weight: 500; color: #1e293b; margin-bottom: 12px;">{sel_device_s.get('applicable_area', '-')}</div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">通讯协议</div>
                                <div style="font-weight: 500; color: #1e293b; margin-bottom: 12px;">{sel_device_s.get('protocol', '米家 BLE')}</div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">是否需要网关</div>
                                <div style="font-weight: 500; color: #1e293b;">{'是' if sel_device_s.get('gateway_required', False) else '否'}</div>
                            </div>
                            """, unsafe_allow_html=True)
                        with dcol2_s:
                            st.markdown(f"""
                            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2)); backdrop-filter: blur(20px); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 12px; padding: 16px; text-align: center;">
                                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">单价</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: #FFD700; margin-bottom: 12px;">¥{sel_device_s.get('price', 0)}</div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">数量</div>
                                <div style="font-size: 1.2rem; font-weight: 600; color: #1e293b; margin-bottom: 12px;">× {sel_device_s.get('quantity', 1)}</div>
                                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 4px;">小计</div>
                                <div style="font-size: 1.3rem; font-weight: 700; color: #22c55e;">¥{sel_device_s.get('price', 0) * sel_device_s.get('quantity', 1)}</div>
                            </div>
                            """, unsafe_allow_html=True)

                        _note_s = _lookup_recommendation_note(sel_device_s)
                        if _note_s:
                            st.markdown("")
                            st.markdown(f"""
                            <div style="background: rgba(96,165,250,0.1); border-left: 3px solid #60a5fa; padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 0.85rem; color: #1d4ed8;">
                                💡 <span style="font-weight: 500;">推荐说明：</span>{_note_s}
                            </div>
                            """, unsafe_allow_html=True)

                        features_s = sel_device_s.get('features') or []
                        if features_s:
                            st.markdown("")
                            st.markdown("**主要功能：**")
                            feat_html_s = " ".join([f"<span style='display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;padding:4px 10px;border-radius:16px;font-size:0.75rem;color:#475569;margin:2px 4px 2px 0;'>{f}</span>" for f in features_s])
                            st.markdown(feat_html_s, unsafe_allow_html=True)

            rooms = load_floorplan_rooms()
            room_groups = group_devices_by_room(devices_single, rooms)

            # 构建 device id → 扁平列表索引 的映射
            device_idx_map = {d.get('id', ''): i for i, d in enumerate(devices_single)}

            for room_name, room_devices in room_groups:
                emoji = ROOM_EMOJI.get(room_name, '📦')
                device_count = len(room_devices)
                if room_name == '通用':
                    st.markdown(f"### {emoji} 通用设备 · {device_count}件")
                    st.caption("以下设备建议根据实际情况摆放")
                else:
                    st.markdown(f"### {emoji} {room_name} · {device_count}件")

                # 房间内按 category 聚合
                cat_groups = group_devices_by_category(room_devices)
                for cat, cat_devices in cat_groups:
                    if len(cat_devices) >= 2:
                        # 同类设备 >=2：聚合卡片
                        render_aggregate_card(cat, cat_devices, plan_key="single", device_idx_map=device_idx_map, room_name=room_name)
                    else:
                        # 单设备：保持原有卡片样式
                        real_idx = device_idx_map.get(cat_devices[0].get('id', ''), 0)
                        render_device_card(cat_devices[0], real_idx, plan_key="single")
                st.markdown("")
        else:
            st.info("暂无设备推荐")
        st.markdown("---")
        st.markdown(
            f'<div class="total-price-card"><div style="opacity:0.9;">💰 预估总价</div><div class="price">¥{calculate_total_price(devices_single)}</div></div>',
            unsafe_allow_html=True,
        )

    # ============================================
    # 导出区域：Excel（primary） + CSV + 冲突检测
    # ============================================
    st.markdown("---")
    st.subheader("📤 导出方案")

    _export_devices = []
    if multi_plans:
        # 导出当前选中方案的设备
        _export_key = st.session_state.get('recommend_plan_selector', 'balanced')
        _edit_key = f'edited_devices_{_export_key}'
        if _edit_key in st.session_state:
            _export_devices = st.session_state[_edit_key]
    elif result:
        _export_devices = st.session_state.get('edited_devices_single', result.get('devices', []))

    if _export_devices:
        _export_name = scene_name
        _today = datetime.now().strftime('%Y%m%d')

        # 文件命名：HomeWizard_方案清单_{户型}_{预算档位}_{日期}.xlsx
        _fp_name = st.session_state.get('selected_floorplan', '')
        _bt_name = st.session_state.get('selected_budget_tier', '')
        # 预算档位映射为显示名（复用 BUDGET_TIERS，与页面显示保持一致）
        _bt_display = BUDGET_TIERS.get(_bt_name, {}).get('display_name', _bt_name or '未指定')
        _file_base = f"HomeWizard_方案清单_{_fp_name}_{_bt_display}_{_today}"

        # ===== 冲突检测 =====
        _conflicts = detect_conflicts(_export_devices, budget)
        st.session_state['export_conflicts'] = _conflicts

        _warning_count = sum(1 for c in _conflicts if c.get('level') == 'warning')
        _error_count = sum(1 for c in _conflicts if c.get('level') == 'error')
        _device_count = len(_export_devices)

        if not _conflicts:
            # 无冲突
            st.markdown(f"""
            <div style="
                background: rgba(34,197,94,0.12);
                border: 1px solid rgba(34,197,94,0.4);
                border-radius: 12px;
                padding: 12px 18px;
                margin-bottom: 16px;
                font-size: 0.9rem;
                color: #16a34a;
            ">✅ 清单检查通过，共 {_device_count} 件设备，无冲突</div>
            """, unsafe_allow_html=True)
        else:
            # 有冲突：分别展示警告和错误
            if _warning_count > 0:
                _warn_msgs = ''.join(
                    f'<div style="padding:4px 0;">· {c["message"]}</div>'
                    for c in _conflicts if c.get('level') == 'warning'
                )
                st.markdown(f"""
                <div style="
                    background: rgba(245,158,11,0.12);
                    border: 1px solid rgba(245,158,11,0.4);
                    border-radius: 12px;
                    padding: 12px 18px;
                    margin-bottom: 10px;
                    font-size: 0.88rem;
                    color: #b45309;
                ">⚠️ 检测到 {_warning_count} 个警告：{_warn_msgs}</div>
                """, unsafe_allow_html=True)

            if _error_count > 0:
                _err_msgs = ''.join(
                    f'<div style="padding:4px 0;">· {c["message"]}</div>'
                    for c in _conflicts if c.get('level') == 'error'
                )
                st.markdown(f"""
                <div style="
                    background: rgba(239,68,68,0.12);
                    border: 1px solid rgba(239,68,68,0.4);
                    border-radius: 12px;
                    padding: 12px 18px;
                    margin-bottom: 16px;
                    font-size: 0.88rem;
                    color: #b91c1c;
                ">🔴 检测到 {_error_count} 个错误（仍可导出，建议修正）：{_err_msgs}</div>
                """, unsafe_allow_html=True)

        # ===== 导出按钮组 =====
        # 获取匹配的联动规则（传给导出函数生成 Sheet2）
        _matched_rules = st.session_state.get('matched_rules', []) or []

        export_col1, export_col2 = st.columns(2)

        with export_col1:
            # 用 spinner 包装生成过程
            with st.spinner("正在生成 Excel 清单..."):
                _excel_data = export_excel(
                    _export_devices, _export_name, budget,
                    matched_rules=_matched_rules,
                    floorplan=_fp_name, budget_tier=_bt_display,
                )
            if _excel_data:
                st.download_button(
                    label="📋 导出 Excel（推荐）",
                    data=_excel_data,
                    file_name=f"{_file_base}.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    use_container_width=True,
                    key="download_excel_diy",
                    type="primary",
                )
            else:
                st.error("❌ Excel 生成失败，请重试")

        with export_col2:
            with st.spinner("正在生成 CSV 清单..."):
                _csv_data = export_csv(
                    _export_devices, _export_name, budget,
                    matched_rules=_matched_rules,
                    floorplan=_fp_name, budget_tier=_bt_display,
                )
            if _csv_data:
                st.download_button(
                    label="📊 导出 CSV",
                    data=_csv_data.encode('utf-8'),
                    file_name=f"{_file_base}.csv",
                    mime="text/csv",
                    use_container_width=True,
                    key="download_csv_diy",
                )
            else:
                st.error("❌ CSV 生成失败，请重试")

        # 导出提示
        st.caption("💡 导出文件包含购买链接，可直接点击跳转京东比价；Sheet2 含使用说明和联动规则")
    else:
        st.info("请先生成方案后再导出")

    # ============================================
    # 自定义设备表单（简化版）
    # ============================================
    if result:
        with st.expander("➕ 添加自定义设备"):
            with st.form("diy_custom_device", clear_on_submit=True):
                diy_c1, diy_c2 = st.columns(2)
                with diy_c1:
                    diy_name = st.text_input("设备名称", placeholder="如：智能台灯", key="diy_cd_name")
                    diy_brand = st.text_input("品牌", placeholder="如：米家", key="diy_cd_brand")
                with diy_c2:
                    diy_price = st.number_input("价格（元）", min_value=0, value=99, step=10, key="diy_cd_price")
                    diy_area = st.selectbox("安装区域", options=['客厅', '卧室', '厨房', '卫生间', '阳台', '玄关', '书房', '全屋'], key="diy_cd_area")
                if st.form_submit_button("➕ 添加到方案", use_container_width=True):
                    if diy_name.strip():
                        custom_dev = {
                            'id': f'diy_custom_{int(time.time())}',
                            'name': diy_name.strip(),
                            'brand': diy_brand.strip() or '自定义',
                            'price': diy_price,
                            'category': '自定义',
                            'applicable_area': diy_area,
                            'quantity': 1,
                            'is_custom': True,
                        }
                        # 添加到当前选中方案的设备列表
                        _export_key = st.session_state.get('recommend_plan_selector', 'balanced')
                        _edit_key = f'edited_devices_{_export_key}'
                        if _edit_key in st.session_state:
                            st.session_state[_edit_key].append(custom_dev)
                        # 单方案模式下同步到 result.devices（multi_plans 模式下避免污染 plan_result）
                        if not multi_plans:
                            result.setdefault('devices', []).append(custom_dev)
                        st.success(f"已添加：{diy_name}")
                        st.rerun()

    # ============================================
    # 平面图预览（动态渲染，根据选中户型）
    # ============================================
    st.markdown("---")
    with st.expander("📐 查看平面图预览（只读）"):
        st.caption("以下为设备位置示意图，仅供参考安装位置")
        _fp_rooms = load_floorplan_rooms()
        _fp_devices = _export_devices if _export_devices else []
        _fp_icons = {
            'lighting': '💡', 'curtain': '🪟', 'socket': '🔌', 'switch': '🔘',
            'gateway': '📡', 'speaker': '🔊', 'sensor': '🌡️', 'camera': '📷', 'lock': '🔒',
        }

        if _fp_rooms:
            # 计算户型画布边界
            _max_x = max(r['x'] + r['width'] for r in _fp_rooms)
            _max_y = max(r['y'] + r['height'] for r in _fp_rooms)

            # 缩放到 400px 高度
            _container_h = 400
            _scale = _container_h / _max_y
            _container_w = int(_max_x * _scale)

            # 将设备按 applicable_area 分配到房间
            _device_room_map = {}
            for _fd in _fp_devices:
                _area = _fd.get('applicable_area', '')
                _assigned = False
                if _area:
                    _areas = [a.strip() for a in _area.replace('，', '、').split('、')]
                    for _a in _areas:
                        for _room in _fp_rooms:
                            _rn = _room['name']
                            if _a == _rn or _a in _rn or _rn in _a:
                                _device_room_map.setdefault(_rn, []).append(_fd)
                                _assigned = True
                                break
                        if _assigned:
                            break
                if not _assigned:
                    _device_room_map.setdefault('_unassigned', []).append(_fd)

            _html_parts = [
                f'<div style="position:relative;width:{_container_w}px;height:{_container_h}px;'
                f'background:#f8fafc;border-radius:12px;border:2px solid #e2e8f0;overflow:hidden;margin:0 auto;">'
            ]

            # 渲染房间
            for _room in _fp_rooms:
                _left = _room['x'] * _scale
                _top = _room['y'] * _scale
                _w = _room['width'] * _scale
                _h = _room['height'] * _scale
                _color = _room.get('color', '#dbeafe')
                _name = _room['name']
                _html_parts.append(
                    f'<div style="position:absolute;left:{_left}px;top:{_top}px;'
                    f'width:{_w}px;height:{_h}px;background:{_color}40;'
                    f'border-radius:8px;display:flex;align-items:center;justify-content:center;'
                    f'color:#64748b;font-size:{max(0.7, _scale * 0.8)}rem;font-weight:500;">'
                    f'{_name}</div>'
                )

                # 渲染该房间内的设备
                _room_devices = _device_room_map.get(_name, [])
                for _di, _dev in enumerate(_room_devices):
                    _emoji = _fp_icons.get(_dev.get('category', ''), '📦')
                    _label = _dev.get('name', f'设备{_di+1}')[:8]
                    # 在房间内均匀分布设备图标
                    _dx = _left + _w * 0.2 + (_di % 3) * _w * 0.25
                    _dy = _top + _h * 0.3 + (_di // 3) * _h * 0.35
                    _html_parts.append(
                        f'<div style="position:absolute;left:{_dx}px;top:{_dy}px;text-align:center;'
                        f'transform:translate(-50%,-50%);">'
                        f'<div style="font-size:1.2rem;">{_emoji}</div>'
                        f'<div style="font-size:0.6rem;color:#475569;background:white;'
                        f'padding:1px 4px;border-radius:4px;white-space:nowrap;">{_label}</div>'
                        f'</div>'
                    )

            # 渲染未分配的设备
            _unassigned = _device_room_map.get('_unassigned', [])
            if _unassigned:
                _html_parts.append(
                    f'<div style="position:absolute;right:8px;bottom:8px;'
                    f'background:#f1f5f9;border-radius:8px;padding:4px 8px;font-size:0.7rem;color:#94a3b8;">'
                    f'其他设备: {len(_unassigned)}件</div>'
                )

            _html_parts.append('</div>')
            st.markdown(''.join(_html_parts), unsafe_allow_html=True)
        else:
            st.info("请先在首页选择户型模板")

    # ============================================
    # 设备配置入口：开始配置全屋设备
    # ============================================
    if _export_devices:
        st.markdown("---")
        _device_count = len(_export_devices)
        # 估算安装时间：每设备 5-15 分钟，取平均值
        _install_min = _device_count * 5
        _install_max = _device_count * 15
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, #e0f2fe, #ede9fe);
                    border: 1px solid #c7d2fe;
                    border-radius: 16px; padding: 24px; margin-top: 16px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
            <h3 style="margin:0 0 8px 0;color:#1e293b;">🎯 准备安装您的智能家居</h3>
            <p style="color:#64748b;font-size:0.9rem;margin:4px 0;">
                方案已生成，共 <b style="color:#667eea;">{_device_count}</b> 件设备
                · 预计安装时间：{_install_min}-{_install_max} 分钟
            </p>
            <p style="color:#6b7280;font-size:0.8rem;margin:4px 0;">
                💡 点击后将模拟设备配网流程（WiFi 连接 → 搜索设备 → 逐个配置 → 完成）
            </p>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🚀 开始配置全屋设备",
                     key="recommend_start_setup",
                     use_container_width=True,
                     type="primary"):
            # 将方案设备列表存入 session_state
            st.session_state['setup_devices'] = list(_export_devices)
            st.switch_page("views/setup.py")

    # 底部操作栏：返回首页 + 重新生成
    st.markdown("")
    _bottom_cols = st.columns([1, 1])
    with _bottom_cols[0]:
        if st.button("🏠 返回首页", key="back_home_bottom",
                     use_container_width=True, type="secondary"):
            st.switch_page("views/home.py")
    with _bottom_cols[1]:
        if st.button("🔄 重新生成", key="regenerate_bottom",
                     use_container_width=True, type="secondary"):
            _regenerate_with_mode(st.session_state.get('current_generation_mode', 'auto'))

# ============================================
# 页面底部
# ============================================
st.markdown("---")
st.caption(f"🔧 版本号: {VERSION}")
