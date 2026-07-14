"""
⚙️ AI 引擎配置页

功能：
1. 6 种 AI 模型卡片切换（DeepSeek / 通义千问 / 智谱 / Kimi / OpenAI / Ollama）
2. API Key 输入、验证、保存（仅内存）
3. Ollama 特殊处理（无需 API Key，检查服务状态）
4. 高级配置（自定义 API 地址 / 模型名）
5. 测试生成（真实调用 API）
6. 底部配置摘要
"""

import streamlit as st
import sys
import os

# 确保项目根目录在 Python 路径中
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from components.navigation import render_top_nav
from core.ai_providers import (
    PROVIDER_INFO,
    DEFAULT_CONFIGS,
    API_KEY_LINKS,
    get_ai_provider,
)
from core.router import generate_plan_ai

VERSION = "v1.0.0"

# ============================================
# 初始化 session_state
# ============================================
if 'ai_provider' not in st.session_state:
    st.session_state['ai_provider'] = 'deepseek'  # 默认 DeepSeek
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
# 临时输入框值（切换 Provider 时清空）
if '_ai_key_input' not in st.session_state:
    st.session_state['_ai_key_input'] = ''


# ============================================
# 页面主体
# ============================================
render_top_nav("ai_settings")
st.title("⚙️ AI 引擎配置")
st.markdown("选择你喜欢的 AI 模型，API Key 仅保存在本地浏览器")
st.divider()

# ---------- 1. AI 模型选择区 ----------
st.subheader("① 选择 AI 模型")
st.markdown("点击下方卡片切换 AI 引擎")

current_provider = st.session_state['ai_provider']

# 3 列 × 2 行展示 6 个模型
provider_ids = list(PROVIDER_INFO.keys())
cols = st.columns(3)
for idx, pid in enumerate(provider_ids):
    info = PROVIDER_INFO[pid]
    with cols[idx % 3]:
        is_selected = (pid == current_provider)
        # 卡片样式
        border_color = "rgba(102, 126, 234, 0.6)" if is_selected else "rgba(15, 23, 42, 0.08)"
        bg_color = "rgba(102, 126, 234, 0.15)" if is_selected else "rgba(15, 23, 42, 0.05)"
        check_mark = "✅" if is_selected else ""
        rec_badge = '<span style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;font-size:0.7rem;padding:2px 8px;border-radius:10px;margin-left:6px;">推荐</span>' if info.get('recommended') else ''

        st.markdown(f"""
        <div style="
            background:{bg_color};
            backdrop-filter:blur(20px);
            -webkit-backdrop-filter:blur(20px);
            border:1px solid {border_color};
            border-radius:16px;
            padding:18px 16px;
            box-shadow:0 8px 32px rgba(0,0,0,0.1);
            text-align:center;
            margin-bottom:8px;
            transition:all 0.3s ease;
        ">
            <div style="font-size:2.2rem;margin-bottom:6px;">{info['icon']} {check_mark}</div>
            <div style="font-size:1.05rem;font-weight:600;color:#1e293b;margin-bottom:4px;">
                {info['name']}{rec_badge}
            </div>
            <div style="font-size:0.78rem;color:#64748b;line-height:1.4;">{info['desc']}</div>
        </div>
        """, unsafe_allow_html=True)

        # 切换按钮
        btn_label = f"✓ 使用中" if is_selected else f"选择 {info['name']}"
        btn_type = "primary" if is_selected else "secondary"
        if st.button(btn_label, key=f"select_provider_{pid}", use_container_width=True, type=btn_type):
            if not is_selected:
                # 切换 Provider，清空临时 API Key 输入框
                st.session_state['ai_provider'] = pid
                st.session_state['_ai_key_input'] = ''
                st.rerun()

st.divider()

# ---------- 2. API Key 配置区 ----------
st.subheader("② 配置 API Key")

pid = st.session_state['ai_provider']
info = PROVIDER_INFO[pid]
default_cfg = DEFAULT_CONFIGS.get(pid, {})

# Ollama 特殊处理
if pid == 'ollama':
    st.info("🦙 Ollama 为本地部署，无需 API Key，请确保已启动 `ollama serve` 服务")
    col_check, col_link = st.columns([2, 1])
    with col_check:
        if st.button("🔌 检查服务状态", key="check_ollama_btn", use_container_width=True, type="primary"):
            with st.spinner("正在检查 Ollama 服务..."):
                provider = get_ai_provider('ollama', {
                    'api_url': st.session_state['ai_custom_configs'].get('ollama', {}).get('api_url', default_cfg.get('api_url')),
                    'model': st.session_state['ai_custom_configs'].get('ollama', {}).get('model', default_cfg.get('model')),
                })
                if provider is None:
                    st.error("❌ 无法初始化 Ollama Provider")
                else:
                    ok, msg = provider.validate_api_key('')
                    if ok:
                        st.success(f"✅ {msg}")
                        st.session_state['ai_config_valid']['ollama'] = True
                    else:
                        st.error(f"❌ {msg}")
                        st.session_state['ai_config_valid']['ollama'] = False
    with col_link:
        st.markdown(f"[📥 下载 Ollama]({API_KEY_LINKS.get('ollama', '#')})")
else:
    st.markdown(f"**当前引擎：** {info['icon']} {info['name']}  |  **默认模型：** `{default_cfg.get('model', '')}`")
    st.caption("🔒 API Key 仅保存在本地浏览器内存中，不会写入任何文件或发送到第三方")

    # 显示已保存的 Key（脱敏）
    saved_key = st.session_state['ai_api_keys'].get(pid, '')
    masked = ''
    if saved_key:
        # 脱敏显示：前 4 位 + **** + 后 4 位
        if len(saved_key) > 8:
            masked = f"{saved_key[:4]}{'*' * (len(saved_key) - 8)}{saved_key[-4:]}"
        else:
            masked = '*' * len(saved_key)
        st.caption(f"📌 已保存 Key：`{masked}`")

    # API Key 输入框（切换 Provider 时自动清空，通过 _ai_key_input 控制）
    # 注意：widget key 必须与 session_state 中清空/同步使用的键名一致，
    # 否则设置 st.session_state['_ai_key_input'] = '' 不会真正清空输入框。
    key_input = st.text_input(
        "API Key",
        type="password",
        placeholder=f"请输入 {info['name']} 的 API Key",
        key="_ai_key_input",
    )

    col_validate, col_clear, col_link = st.columns([2, 1, 1])
    with col_validate:
        validate_btn = st.button("🔍 验证", key="validate_key_btn", use_container_width=True, type="primary",
                                 disabled=(not key_input or not key_input.strip()))
    with col_clear:
        clear_btn = st.button("🗑️ 清空", key="clear_key_btn", use_container_width=True,
                              disabled=(not key_input))
    with col_link:
        st.markdown(f"[🔑 获取 API Key]({API_KEY_LINKS.get(pid, '#')})")

    if validate_btn and key_input and key_input.strip():
        with st.spinner(f"正在验证 {info['name']} API Key..."):
            # 临时构造 provider 进行验证（使用当前高级配置中的 api_url/model）
            custom = st.session_state['ai_custom_configs'].get(pid, {})
            prov_config = {
                'api_key': key_input.strip(),
                'api_url': custom.get('api_url', default_cfg.get('api_url')),
                'model': custom.get('model', default_cfg.get('model')),
            }
            provider = get_ai_provider(pid, prov_config)
            if provider is None:
                st.error("❌ 无法初始化 Provider")
            else:
                ok, msg = provider.validate_api_key(key_input.strip())
                if ok:
                    st.success(f"✅ {msg}")
                    # 保存到 session_state
                    st.session_state['ai_api_keys'][pid] = key_input.strip()
                    st.session_state['ai_config_valid'][pid] = True
                    st.session_state['_ai_key_input'] = ''
                    st.rerun()
                else:
                    st.error(f"❌ {msg}")
                    st.session_state['ai_config_valid'][pid] = False

    if clear_btn:
        st.session_state['_ai_key_input'] = ''
        st.rerun()

st.divider()

# ---------- 3. 高级配置 ----------
st.subheader("③ 高级配置（可选）")
with st.expander("🔧 自定义 API 地址与模型名", expanded=False):
    custom = st.session_state['ai_custom_configs'].get(pid, {})
    adv_api_url = st.text_input(
        "API 地址",
        value=custom.get('api_url', default_cfg.get('api_url', '')),
        key="adv_api_url_input",
        help="留空则使用默认地址",
    )
    adv_model = st.text_input(
        "模型名称",
        value=custom.get('model', default_cfg.get('model', '')),
        key="adv_model_input",
        help="留空则使用默认模型",
    )

    col_save, col_reset = st.columns(2)
    with col_save:
        if st.button("💾 保存高级配置", key="save_adv_btn", use_container_width=True, type="primary"):
            st.session_state['ai_custom_configs'][pid] = {
                'api_url': adv_api_url.strip(),
                'model': adv_model.strip(),
            }
            st.success("✅ 高级配置已保存")
    with col_reset:
        if st.button("↩️ 重置为默认", key="reset_adv_btn", use_container_width=True):
            if pid in st.session_state['ai_custom_configs']:
                del st.session_state['ai_custom_configs'][pid]
            st.success("✅ 已重置为默认配置")
            st.rerun()

st.divider()

# ---------- 4. 测试区域 ----------
st.subheader("④ 测试生成")
st.markdown("输入测试需求，调用当前 AI 引擎生成方案预览")

test_input = st.text_input(
    "测试需求",
    placeholder="例如：我想要一个安全的家",
    key="test_input_widget",
)

if st.button("🚀 测试生成", key="test_generate_btn", use_container_width=True, type="primary",
             disabled=(not test_input or not test_input.strip())):
    # 检查配置
    if pid != 'ollama' and not st.session_state['ai_api_keys'].get(pid):
        st.error("❌ 请先配置并验证 API Key")
    else:
        with st.spinner(f"正在调用 {info['name']} 生成方案（最多 15 秒）..."):
            try:
                # 临时将当前 provider 写入 session_state（generate_plan_ai 读取）
                result = generate_plan_ai(
                    user_input=test_input.strip(),
                    floorplan='两室一厅',
                    budget_tier='平衡',
                )
                if result:
                    st.success("✅ 生成成功！")
                    # 展示 JSON 结果
                    display_result = {
                        'scene_name': result.get('scene_name', ''),
                        'description': result.get('description', ''),
                        'source': result.get('source', ''),
                        'confidence': result.get('confidence', 0),
                        'device_count': len(result.get('devices', [])),
                        'devices': [
                            {
                                'id': d.get('id', ''),
                                'name': d.get('name', ''),
                                'category': d.get('category', ''),
                                'price': d.get('price', 0),
                            } for d in result.get('devices', [])
                        ],
                        'actions': result.get('actions', []),
                    }
                    st.json(display_result)
                else:
                    st.error("❌ 生成失败：AI 未返回有效结果（请检查 API Key、网络或模型名称）")
            except Exception as e:
                st.error(f"❌ 调用异常：{str(e)}")

st.divider()

# ---------- 5. 底部配置摘要 ----------
st.subheader("📋 当前配置摘要")

# 当前 AI 引擎
st.markdown(f"**🧠 当前 AI 引擎：** {info['icon']} {info['name']}")

# API Key 状态
if pid == 'ollama':
    key_status = "无需配置"
    valid = st.session_state['ai_config_valid'].get('ollama', False)
    valid_status = "✅ 已验证" if valid else "❌ 未验证（请检查服务状态）"
else:
    saved = st.session_state['ai_api_keys'].get(pid, '')
    key_status = f"已配置（{masked}）" if saved else "未配置"
    valid = st.session_state['ai_config_valid'].get(pid, False)
    valid_status = "✅ 验证通过" if valid else "❌ 未验证"

st.markdown(f"**🔑 API Key 状态：** {key_status}")
st.markdown(f"**✓ 配置有效性：** {valid_status}")

# 自定义配置摘要
custom = st.session_state['ai_custom_configs'].get(pid, {})
if custom:
    st.markdown(f"**🔧 自定义配置：** API 地址=`{custom.get('api_url', '默认')}`  模型=`{custom.get('model', '默认')}`")
else:
    st.markdown(f"**🔧 自定义配置：** 使用默认（API 地址=`{default_cfg.get('api_url', '')}`  模型=`{default_cfg.get('model', '')}`）")

# 全局开关
st.markdown("---")
st.markdown("**🏠 首页 AI 集成：**")
col_toggle, col_mode = st.columns(2)
with col_toggle:
    use_ai = st.toggle("🧠 启用 AI 增强", value=st.session_state.get('use_ai', True), key="use_ai_toggle")
    st.session_state['use_ai'] = use_ai
with col_mode:
    mode_options = ["🔄 智能切换 (auto)", "🧠 AI 优先 (ai)", "📋 仅本地规则 (local)"]
    mode_values = ['auto', 'ai', 'local']
    current_mode = st.session_state.get('ai_mode', 'auto')
    current_idx = mode_values.index(current_mode) if current_mode in mode_values else 0
    selected_mode = st.radio(
        "生成模式",
        options=mode_options,
        index=current_idx,
        key="ai_mode_radio",
        label_visibility="collapsed",
    )
    # 解析选中的模式
    for mv, mo in zip(mode_values, mode_options):
        if mo == selected_mode:
            st.session_state['ai_mode'] = mv
            break

st.caption(f"🔧 版本号: {VERSION}")
