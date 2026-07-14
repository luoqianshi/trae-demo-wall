"""
🏠 首页 — 三步引导

流程：
1. Step 1：选户型（一室一厅 / 两室一厅 / 三室一厅）
2. Step 2：选场景（照明 / 安防 / 舒适 / 节能，可多选）
3. Step 3：选预算（L1 基础智能 / L3 场景智能 / L5 高阶智能）
4. 点击"生成方案" → 跳转推荐页
"""

import streamlit as st
import sys
import os
import json
import time

# 确保项目根目录在 Python 路径中
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from components.navigation import render_top_nav

from core.router import generate_plan, keyword_extraction
from utils.helpers import load_json

VERSION = "v1.0.0"

# ============================================
# AI 引擎相关 session_state 初始化
# ============================================
if 'ai_provider' not in st.session_state:
    st.session_state['ai_provider'] = 'deepseek'
if 'ai_api_keys' not in st.session_state:
    st.session_state['ai_api_keys'] = {}
if 'ai_custom_configs' not in st.session_state:
    st.session_state['ai_custom_configs'] = {}
if not isinstance(st.session_state.get('ai_config_valid'), dict):
    st.session_state['ai_config_valid'] = {}
if 'use_ai' not in st.session_state:
    st.session_state['use_ai'] = True
if 'ai_mode' not in st.session_state:
    st.session_state['ai_mode'] = 'auto'

# ============================================
# 数据：快捷模板（Step 2 使用，需在模块级定义以供 on_click 回调引用）
# ============================================
SCENE_TEMPLATES = {
    "💡 照明": "我需要全屋智能灯光控制，根据时间段和人来调节亮度和色温，并支持语音和手机控制。",
    "🔒 安防": "我需要门窗传感器、人体传感器、摄像头和报警器，离家时自动布防，有人闯入立即警报并推送手机通知。",
    "🛋️ 舒适": "我需要电动窗帘、智能空调、背景音乐，支持定时和远程控制，让居家更舒适。",
    "🌱 节能": "我需要智能插座、能耗监测，根据用电习惯自动断电，统计各设备耗电量。",
}


def fill_template(template_key):
    """on_click 回调：将对应模板文本写入 user_input。
    回调在脚本主体之前执行，可安全修改 widget 绑定的 session_state 键。
    template_key 为 SCENE_TEMPLATES 的键名。
    """
    st.session_state['user_input'] = SCENE_TEMPLATES.get(template_key, '')
    st.session_state['_template_filled'] = True


# ============================================
# 演示场景一键加载（路演专用）
# ============================================
def load_demo_scenario(scenario_id):
    """on_click 回调：加载预置演示场景，自动填充户型/预算/需求并跳转 Step 3。
    回调在脚本主体之前执行，可安全修改 widget 绑定的 session_state 键。
    """
    try:
        demo_path = os.path.join(project_root, 'data', 'demo_scenarios.json')
        with open(demo_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        scenarios = data.get('scenarios', [])
        for s in scenarios:
            if s.get('id') == scenario_id:
                st.session_state['selected_floorplan'] = s.get('floorplan')
                st.session_state['selected_budget_tier'] = s.get('budget')
                st.session_state['user_input'] = s.get('user_input', '')
                st.session_state['submitted_user_input'] = s.get('user_input', '')
                st.session_state['demo_loaded'] = True
                st.session_state['demo_name'] = s.get('name', '')
                st.session_state['wizard_step'] = 3
                break
    except Exception:
        st.session_state['demo_loaded'] = False


# ============================================
# 数据：户型模板
# ============================================
FLOORPLAN_TEMPLATES = {
    "一室一厅": {
        "icon": "🏠",
        "desc": "适合单身或情侣",
        "area": "约 50-60㎡",
        "file": "one_bedroom.json"
    },
    "两室一厅": {
        "icon": "🏡",
        "desc": "适合小家庭",
        "area": "约 70-90㎡",
        "file": "two_bedroom.json"
    },
    "三室一厅": {
        "icon": "🏘️",
        "desc": "适合三代同堂",
        "area": "约 100-130㎡",
        "file": "three_bedroom.json"
    }
}

# ============================================
# 数据：场景选项
# ============================================
SCENE_OPTIONS = {
    "照明": {
        "icon": "💡",
        "desc": "智能灯光、灯带、氛围灯",
        "keywords": "灯光照明 智能灯泡 氛围灯"
    },
    "安防": {
        "icon": "🔒",
        "desc": "门锁、摄像头、传感器",
        "keywords": "安全防护 智能门锁 摄像头 传感器"
    },
    "舒适": {
        "icon": "🌡️",
        "desc": "空调、窗帘、温湿度",
        "keywords": "舒适环境 空调 窗帘 温湿度"
    },
    "节能": {
        "icon": "⚡",
        "desc": "智能插座、定时开关",
        "keywords": "节能省电 智能插座 定时开关"
    }
}

# ============================================
# 数据：预算档位
# ============================================
BUDGET_TIERS = {
    "经济": {
        "display_name": "L1 基础智能",
        "icon": "🌱",
        "range": "< ¥3,000",
        "budget_value": 2000,
        "desc": "基础智能化，核心设备覆盖"
    },
    "平衡": {
        "display_name": "L3 场景智能",
        "icon": "⚡",
        "range": "¥3,000 - ¥8,000",
        "budget_value": 6000,
        "desc": "性价比之选，全屋覆盖"
    },
    "高端": {
        "display_name": "L5 高阶智能",
        "icon": "💎",
        "range": "> ¥8,000",
        "budget_value": 12000,
        "desc": "旗舰配置，全场景智能"
    }
}

# ============================================
# 初始化 session_state
# ============================================
if 'wizard_step' not in st.session_state:
    st.session_state['wizard_step'] = 1
if 'selected_floorplan' not in st.session_state:
    st.session_state['selected_floorplan'] = None
if 'selected_scenes' not in st.session_state:
    st.session_state['selected_scenes'] = []
if 'selected_budget_tier' not in st.session_state:
    st.session_state['selected_budget_tier'] = None
if 'user_input' not in st.session_state:
    st.session_state['user_input'] = ''


# ============================================
# 搜索过程展示
# ============================================
def show_matching_process(user_input, budget):
    """展示搜索过程动画"""
    keywords = keyword_extraction(user_input)
    keyword_text = "、".join(keywords[:3]) if keywords else "智能生活"

    # 读取 AI 模式与开关
    ai_mode = st.session_state.get('ai_mode', 'auto')
    use_ai_enabled = st.session_state.get('use_ai', False)
    # 真正传给 generate_plan 的 mode
    if not use_ai_enabled:
        mode = 'local'
    else:
        mode = ai_mode

    floorplan = st.session_state.get('selected_floorplan', '')
    budget_tier = st.session_state.get('selected_budget_tier', '')

    progress_bar = st.progress(0, text="")
    log_placeholder = st.empty()

    log_placeholder.write(f"🔄 步骤 1/4：需求语义分析 — 提取关键词：{keyword_text}")
    time.sleep(0.3)
    progress_bar.progress(25)

    result = generate_plan(
        user_input,
        budget,
        mode=mode,
        floorplan=floorplan,
        budget_tier=budget_tier,
    )
    source = result.get('source', '') if result else ''
    if source and source.startswith('ai:'):
        match_detail = f"🧠 AI 引擎生成（{source.split(':', 1)[1]}）"
    elif source == 'fallback':
        match_detail = "🛟 兜底方案（基础设备组合）"
    elif source == 'local_rules':
        match_detail = "✅ 精准匹配成功"
    else:
        match_detail = "⚡ 启用关键词智能匹配"

    log_placeholder.write(
        f"✅ 步骤 1/4：需求语义分析 — 提取关键词：{keyword_text}\n\n"
        f"🔄 步骤 2/4：规则库匹配 — {match_detail}"
    )
    time.sleep(0.3)
    progress_bar.progress(50)

    log_placeholder.write(
        f"✅ 步骤 1/4：需求语义分析 — 提取关键词：{keyword_text}\n\n"
        f"✅ 步骤 2/4：规则库匹配 — {match_detail}\n\n"
        f"🔄 步骤 3/4：预算筛选排序 — 按 ¥{budget} 预算筛选设备"
    )
    time.sleep(0.3)
    progress_bar.progress(75)

    action_count = len(result.get('actions', [])) if result else 0
    device_count = len(result.get('devices', [])) if result else 0

    log_placeholder.write(
        f"✅ 步骤 1/4：需求语义分析 — 提取关键词：{keyword_text}\n\n"
        f"✅ 步骤 2/4：规则库匹配 — {match_detail}\n\n"
        f"✅ 步骤 3/4：预算筛选排序 — 按 ¥{budget} 预算筛选设备\n\n"
        f"🔄 步骤 4/4：生成方案 — 正在配置 {device_count} 款设备..."
    )
    time.sleep(0.3)
    progress_bar.progress(100)

    log_placeholder.write(
        f"✅ 步骤 1/4：需求语义分析 — 提取关键词：{keyword_text}\n\n"
        f"✅ 步骤 2/4：规则库匹配 — {match_detail}\n\n"
        f"✅ 步骤 3/4：预算筛选排序 — 按 ¥{budget} 预算筛选设备\n\n"
        f"✅ 步骤 4/4：生成方案 — 🎉 推荐 {device_count} 款设备，{action_count} 条联动规则"
    )
    time.sleep(0.5)

    return result


# ============================================
# 渲染步骤进度条
# ============================================
def render_step_progress(current_step):
    """渲染顶部步骤进度条（Step 1/3, 2/3, 3/3）"""
    steps = ["选户型", "选场景", "选预算"]
    cols = st.columns(len(steps) * 2 - 1)

    for i, step_name in enumerate(steps):
        col_idx = i * 2
        with cols[col_idx]:
            if i < current_step - 1:
                # 已完成
                st.markdown(
                    f'<div style="text-align:center;">'
                    f'<div style="width:40px;height:40px;border-radius:50%;background:#22c55e;color:white;'
                    f'display:flex;align-items:center;justify-content:center;font-weight:600;margin:0 auto 4px;">✓</div>'
                    f'<div style="font-size:0.75rem;color:#22c55e;font-weight:500;">{step_name}</div>'
                    f'</div>',
                    unsafe_allow_html=True
                )
            elif i == current_step - 1:
                # 当前步骤
                st.markdown(
                    f'<div style="text-align:center;">'
                    f'<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);'
                    f'color:white;display:flex;align-items:center;justify-content:center;font-weight:600;margin:0 auto 4px;">{i+1}</div>'
                    f'<div style="font-size:0.75rem;color:#667eea;font-weight:600;">{step_name}</div>'
                    f'</div>',
                    unsafe_allow_html=True
                )
            else:
                # 未开始（亮色主题适配）
                st.markdown(
                    f'<div style="text-align:center;">'
                    f'<div style="width:40px;height:40px;border-radius:50%;background:rgba(15,23,42,0.08);color:#64748b;'
                    f'display:flex;align-items:center;justify-content:center;font-weight:600;margin:0 auto 4px;'
                    f'border:1px solid rgba(15,23,42,0.1);">{i+1}</div>'
                    f'<div style="font-size:0.75rem;color:#64748b;">{step_name}</div>'
                    f'</div>',
                    unsafe_allow_html=True
                )

        # 连接线
        if i < len(steps) - 1:
            with cols[col_idx + 1]:
                is_done = i < current_step - 1
                color = "#22c55e" if is_done else "rgba(15,23,42,0.1)"
                st.markdown(
                    f'<div style="height:4px;background:{color};border-radius:2px;margin-top:18px;"></div>',
                    unsafe_allow_html=True
                )


# ============================================
# 页面主体
# ============================================
_step_labels = {1: "选择户型", 2: "描述需求", 3: "选择预算"}
_wizard_step = st.session_state.get('wizard_step', 1)
render_top_nav("home", step_info={"current": _wizard_step, "total": 3,
                                    "label": _step_labels.get(_wizard_step, "")})

# 首次访问欢迎提示
if st.session_state.get('first_visit', True):
    st.info("👋 欢迎使用 HomeWizard！三步生成您的智能家居方案：选户型 → 描述需求 → 选预算")
    if st.button("开始规划 →", key="dismiss_welcome"):
        st.session_state['first_visit'] = False
        st.rerun()

st.title("🏠 智能家居场景规划器")
st.markdown("---")

# 欢迎横幅
st.markdown("""
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;
            padding: 28px; color: white; margin-bottom: 28px; text-align: center;">
    <div style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px;">
        🏡 欢迎使用 HomeWizard - 选户型、选场景、拿清单，3步搞定
    </div>
</div>
""", unsafe_allow_html=True)

current_step = st.session_state.get('wizard_step', 1)

# 渲染进度条
render_step_progress(current_step)
st.markdown("")

# ----- Step 1：选户型 -----
if current_step == 1:
    st.subheader("Step 1/3：选择户型")
    st.markdown("选择最接近你家的户型模板，系统将据此推荐设备布局")

    cols = st.columns(3)
    for i, (name, info) in enumerate(FLOORPLAN_TEMPLATES.items()):
        with cols[i]:
            is_selected = st.session_state.get('selected_floorplan') == name
            card_class = "wizard-card wizard-card-selected" if is_selected else "wizard-card"
            st.markdown(f"""
            <div class="{card_class}">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">{info['icon']}</div>
                <h4 style="margin: 0 0 4px 0; color: #1e293b;">{name}</h4>
                <p style="color: #64748b; font-size: 0.8rem; margin: 0 0 4px 0;">{info['desc']}</p>
                <p style="color: #8a8a9a; font-size: 0.75rem; margin: 0;">{info['area']}</p>
            </div>
            """, unsafe_allow_html=True)
            if st.button(f"选择{name}", key=f"fp_{name}", use_container_width=True,
                         type="primary" if is_selected else "secondary"):
                st.session_state['selected_floorplan'] = name
                st.rerun()

    # 下一步按钮
    if st.session_state.get('selected_floorplan'):
        st.markdown("")
        if st.button("下一步：选场景 →", key="goto_step2", use_container_width=True, type="primary"):
            st.session_state['wizard_step'] = 2
            st.rerun()
    else:
        st.info("👆 请先选择一个户型模板")

# ----- Step 2：描述需求 -----
elif current_step == 2:
    st.subheader("Step 2/3：描述你的需求")
    st.markdown("用自然语言描述你想要的智能家居效果，或点击下方快捷模板填充")

    # 若上一轮通过模板按钮填充，提示已填充
    if st.session_state.pop('_template_filled', False):
        st.success("✨ 已为您填充场景模板，您可以继续编辑")

    # 快捷填充按钮（on_click 回调在脚本主体前执行，可安全修改 user_input）
    cols = st.columns(4)
    for i, (label, _template) in enumerate(SCENE_TEMPLATES.items()):
        with cols[i]:
            st.button(label, key=f"template_{label}", use_container_width=True,
                      on_click=fill_template, args=(label,))

    # 主输入区（通过 key 自动与 session_state['user_input'] 双向绑定）
    user_text = st.text_area(
        "你的需求描述",
        height=150,
        placeholder="描述你想要的智能家居效果，例如：我希望离家时自动关灯并开启安防监控，回家时玄关灯自动亮起，卧室窗帘在早上 8 点自动拉开。",
        key="user_input",
        label_visibility="collapsed",
    )

    # 导航按钮
    st.markdown("")
    col_back, col_next = st.columns([1, 2])
    with col_back:
        if st.button("← 上一步", key="back_step1", use_container_width=True):
            st.session_state['wizard_step'] = 1
            st.rerun()
    with col_next:
        if user_text and user_text.strip():
            if st.button("下一步：选预算 →", key="goto_step3", use_container_width=True, type="primary"):
                st.session_state['submitted_user_input'] = user_text.strip()
                st.session_state['wizard_step'] = 3
                st.rerun()
        else:
            st.info("请先描述你的需求")

# ----- Step 3：选预算 -----
elif current_step == 3:
    st.subheader("Step 3/3：选择预算档位")
    st.markdown("选择你的预算范围，系统将据此筛选合适价位的设备")

    cols = st.columns(3)
    for i, (name, info) in enumerate(BUDGET_TIERS.items()):
        with cols[i]:
            is_selected = st.session_state.get('selected_budget_tier') == name
            card_class = "wizard-card wizard-card-selected" if is_selected else "wizard-card"
            st.markdown(f"""
            <div class="{card_class}">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">{info['icon']}</div>
                <h4 style="margin: 0 0 4px 0; color: #1e293b;">{info['display_name']}</h4>
                <p style="color: #0288d1; font-size: 1.1rem; font-weight: 700; margin: 0 0 4px 0;">{info['range']}</p>
                <p style="color: #64748b; font-size: 0.75rem; margin: 0;">{info['desc']}</p>
            </div>
            """, unsafe_allow_html=True)
            if st.button(f"选择{info['display_name']}", key=f"budget_{name}", use_container_width=True,
                         type="primary" if is_selected else "secondary"):
                st.session_state['selected_budget_tier'] = name
                st.rerun()

    # ----- AI 增强选项 -----
    st.markdown("")
    st.markdown("##### 🧠 AI 增强生成")
    use_ai_toggle = st.toggle(
        "🧠 启用 AI 增强",
        value=st.session_state.get('use_ai', True),
        key="home_use_ai_toggle",
        help="开启后将调用 AI 引擎生成更智能的方案；失败时自动降级到本地规则",
    )
    st.session_state['use_ai'] = use_ai_toggle

    if use_ai_toggle:
        mode_options = ["🔄 智能切换", "🧠 AI 优先", "📋 仅本地规则"]
        mode_values = ['auto', 'ai', 'local']
        current_mode = st.session_state.get('ai_mode', 'auto')
        current_idx = mode_values.index(current_mode) if current_mode in mode_values else 0
        selected_mode = st.radio(
            "生成模式",
            options=mode_options,
            index=current_idx,
            key="home_ai_mode_radio",
            horizontal=True,
            help="智能切换：AI 优先，失败降级本地；AI 优先：仅用 AI；仅本地规则：不调用 AI",
        )
        for mv, mo in zip(mode_values, mode_options):
            if mo == selected_mode:
                st.session_state['ai_mode'] = mv
                break

        # 显示当前 AI 引擎状态
        from core.ai_providers import PROVIDER_INFO
        ai_pid = st.session_state.get('ai_provider', 'deepseek')
        ai_info = PROVIDER_INFO.get(ai_pid, {})
        has_key = (ai_pid == 'ollama') or bool(st.session_state.get('ai_api_keys', {}).get(ai_pid))
        status_emoji = "✅" if has_key else "⚠️"
        st.caption(
            f"{status_emoji} 当前 AI 引擎：{ai_info.get('icon', '')} {ai_info.get('name', '')}  |  "
            f"API Key：{'已配置' if has_key else '未配置'}  |  "
            f"[前往配置页 →](./ai_settings)"
        )

    # 导航按钮
    st.markdown("")
    col_back, col_generate = st.columns([1, 2])
    with col_back:
        if st.button("← 上一步", key="back_step2", use_container_width=True):
            st.session_state['wizard_step'] = 2
            st.rerun()
    with col_generate:
        if st.session_state.get('selected_budget_tier'):
            if st.button("✨ 生成方案", key="generate_plan_btn", use_container_width=True, type="primary"):
                # 从 Step 2 保存的独立 key 获取用户输入（避免 text_area key 丢失）
                user_input = st.session_state.get('submitted_user_input', '') or st.session_state.get('user_input', '')
                user_input = user_input.strip()

                # 获取预算值
                budget_tier = st.session_state['selected_budget_tier']
                budget = BUDGET_TIERS[budget_tier]['budget_value']

                st.session_state['user_input'] = user_input
                st.session_state['budget'] = budget

                # 检查 AI 配置
                ai_mode = st.session_state.get('ai_mode', 'auto')
                use_ai_enabled = st.session_state.get('use_ai', False)
                ai_pid = st.session_state.get('ai_provider', 'deepseek')
                needs_key = ai_pid != 'ollama'
                has_key = bool(st.session_state.get('ai_api_keys', {}).get(ai_pid))

                # AI 优先模式下没有配置 API Key 才提示
                if use_ai_enabled and ai_mode == 'ai' and needs_key and not has_key:
                    st.warning(
                        f"⚠️ AI 优先模式下当前引擎（{ai_pid}）未配置 API Key。"
                        f"请前往 [AI 引擎配置页](./ai_settings) 配置，或切换为「智能切换」模式自动降级到本地规则。"
                    )
                else:
                    # 搜索动画
                    with st.spinner("正在生成方案..."):
                        result = show_matching_process(user_input, budget)

                    if result:
                        st.session_state['plan_result'] = result
                        # 记录当前生成模式（供推荐页判断是否需要重新生成）
                        if not use_ai_enabled:
                            st.session_state['current_generation_mode'] = 'local'
                        else:
                            st.session_state['current_generation_mode'] = ai_mode
                        # 同时生成多方案
                        try:
                            from core.router import generate_multi_plans_route
                            multi_plans = generate_multi_plans_route(user_input, budget)
                            if multi_plans:
                                st.session_state['multi_plans'] = multi_plans
                        except Exception:
                            pass

                        # 加载户型模板数据到 session
                        fp_name = st.session_state.get('selected_floorplan')
                        if fp_name:
                            fp_file = FLOORPLAN_TEMPLATES[fp_name]['file']
                            fp_path = os.path.join(project_root, 'data', 'floorplan_templates', fp_file)
                            try:
                                with open(fp_path, 'r', encoding='utf-8') as f:
                                    st.session_state['floorplan_template'] = json.load(f)
                            except Exception:
                                pass

                        st.success("🎉 方案生成完成！正在跳转...")
                        time.sleep(0.3 if st.session_state.get('demo_mode') else 1)
                        st.switch_page("views/recommend.py")
                    else:
                        st.error("未能生成有效方案，请重试")
        else:
            st.info("请选择一个预算档位")

# 已完成选择的信息摘要
if current_step > 1:
    st.markdown("---")
    _input_preview = st.session_state.get('submitted_user_input') or st.session_state.get('user_input', '')
    _input_short = (_input_preview[:30] + '…') if len(_input_preview) > 30 else (_input_preview or '未填写')
    _floorplan = st.session_state.get('selected_floorplan') or '未选择'
    _budget = st.session_state.get('selected_budget_tier') or '未选择'
    st.caption(f"📍 已选户型：{_floorplan} | "
               f"需求描述：{_input_short} | "
               f"已选预算：{_budget}")

# ============================================
# 演示区域（路演专用，演示模式开启时显示）
# ============================================
if st.session_state.get('demo_mode', False):
    st.markdown("---")
    _demo_expanded = not st.session_state.get('demo_loaded', False)
    with st.expander("🎯 快速演示", expanded=_demo_expanded):
        st.markdown("点击下方按钮，一键加载预置演示方案（自动填充户型、预算、需求）")

        # 读取演示场景
        _demo_scenarios = []
        try:
            _demo_path = os.path.join(project_root, 'data', 'demo_scenarios.json')
            with open(_demo_path, 'r', encoding='utf-8') as f:
                _demo_scenarios = json.load(f).get('scenarios', [])
        except Exception:
            _demo_scenarios = []

        if _demo_scenarios:
            _demo_cols = st.columns(len(_demo_scenarios))
            for _col, _sc in zip(_demo_cols, _demo_scenarios):
                with _col:
                    _budget_label = BUDGET_TIERS.get(_sc.get('budget', ''), {}).get('display_name', _sc.get('budget', ''))
                    st.markdown(f"""
                    <div class="demo-scenario-card">
                        <div style="font-size: 2.2rem; margin-bottom: 6px;">{_sc.get('icon', '🏠')}</div>
                        <div style="font-size: 0.98rem; font-weight: 600; color: #1e293b; margin-bottom: 4px;">{_sc.get('name', '')}</div>
                        <div style="font-size: 0.75rem; color: #0288d1; margin-bottom: 4px;">{_sc.get('floorplan', '')} · {_budget_label}</div>
                        <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 6px;">{_sc.get('highlight', '')}</div>
                        <div style="font-size: 0.78rem; color: #FFD700; font-weight: 600;">¥{_sc.get('total_price', 0)} · {_sc.get('device_count', 0)} 台设备</div>
                    </div>
                    """, unsafe_allow_html=True)
                    if st.button(f"加载 {_sc.get('name', '')[:6]}", key=f"demo_{_sc.get('id', '')}",
                                 use_container_width=True, type="primary",
                                 on_click=load_demo_scenario, args=(_sc.get('id', ''),)):
                        pass  # 回调在脚本主体前执行，此处仅需触发 rerun
        else:
            st.warning("演示数据加载失败，请检查 data/demo_scenarios.json")

        # 已加载提示
        if st.session_state.get('demo_loaded', False):
            st.success(f"✅ 已加载演示方案「{st.session_state.get('demo_name', '')}」，点击上方「✨ 生成方案」即可查看")

st.caption(f"🔧 版本号: {VERSION}")
