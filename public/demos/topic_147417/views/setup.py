"""
⚙️ 设备配置模拟器 — 完整四步流程
WiFi连接 → 搜索设备 → 逐个配置 → 完成动画
所有配置过程为纯模拟，不涉及真实设备连接。
"""

import streamlit as st
import os
import sys
import time
import random

# 项目根目录加入 sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from components.navigation import render_top_nav

# ============================================
# 常量定义
# ============================================

# 预设 WiFi SSID 列表
_WIFI_SSIDS = [
    "Home_WiFi_5G",
    "Home_WiFi_2.4G",
    "Office_Network",
    "Guest_WiFi",
    "Xiaomi_XXXX",
]

# 配置子状态文字（Step 3 中每隔 1 秒切换）
_CONFIG_SUBSTATUSES = [
    "正在下载固件更新...",
    "正在配对设备...",
    "正在校准传感器...",
    "正在同步时间...",
    "正在测试连接...",
    "正在注册到网关...",
]

# 信号强度选项及颜色
_SIGNAL_LEVELS = [
    ("强", "#22c55e"),
    ("中", "#f59e0b"),
    ("弱", "#ef4444"),
]

# 步骤定义（用于顶部进度指示器）
_STEPS = [
    {"num": 1, "icon": "📶", "label": "WiFi连接"},
    {"num": 2, "icon": "📡", "label": "搜索设备"},
    {"num": 3, "icon": "⚙️", "label": "配置设备"},
    {"num": 4, "icon": "🎉", "label": "完成"},
]


# ============================================
# 状态初始化
# ============================================
def _init_state():
    """初始化配置流程所需的 session_state 变量。"""
    defaults = {
        'setup_step': 1,                    # 当前步骤 1-4
        'setup_devices': [],                # 要配置的设备列表
        'wifi_connected': False,            # WiFi 是否已连接
        'wifi_ssid': '',                    # 已连接的 SSID
        'wifi_ip': '',                      # 模拟 IP 地址
        'devices_discovered': [],           # 已发现的设备列表
        'devices_configured': [],           # 已配置的设备列表 [{device, status, signal}]
        'device_signals': {},               # device_id → 信号强度
        'config_start_time': None,          # Step 3 开始时间戳
        'config_total_time': 0,             # Step 3 总耗时（秒）
        'setup_completed': False,           # 是否已完成全部流程
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


_init_state()


# ============================================
# 演示模式加速因子（路演时缩短所有模拟耗时）
# ============================================
def _speed():
    """返回当前速度因子：演示模式 0.2（5倍速），正常模式 1.0。"""
    return 0.2 if st.session_state.get('demo_mode', False) else 1.0


# ============================================
# 注入 CSS 动画样式（inline + 外部文件双保险）
# ============================================
def _inject_css():
    """注入配置模拟器所需的 CSS 动画样式。"""
    # 优先尝试加载外部 static/style.css
    css_link = ""
    try:
        css_path = os.path.join(_PROJECT_ROOT, 'static', 'style.css')
        if os.path.exists(css_path):
            css_link = '<link rel="stylesheet" href="/app/static/style.css">'
    except Exception:
        pass

    # 内联 CSS（确保即使静态文件服务不可用也能工作）
    inline_css = """
    <style>
    /* 进度条平滑动画 */
    .progress-bar { transition: width 0.3s ease; }

    /* 脉冲动画（配置中设备卡片） */
    @keyframes pulse-border {
        0%, 100% { border-color: rgba(102,126,234,0.3); box-shadow: 0 0 10px rgba(102,126,234,0.1); }
        50% { border-color: rgba(102,126,234,0.8); box-shadow: 0 0 25px rgba(102,126,234,0.3); }
    }
    .device-configuring { animation: pulse-border 1.5s ease-in-out infinite; }

    /* 成功勾选弹出 */
    @keyframes checkmark-pop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.4); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
    }
    .checkmark { animation: checkmark-pop 0.5s ease-out; }

    /* 步骤指示器 */
    .step-indicator-container {
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 12px;
        margin-bottom: 28px;
        flex-wrap: wrap;
        padding: 16px;
        background: rgba(241, 245, 249, 0.8);
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
    .step-item {
        flex: 1;
        min-width: 120px;
        max-width: 180px;
        text-align: center;
        padding: 14px 10px;
        border-radius: 12px;
        transition: all 0.4s ease;
    }
    .step-item .step-icon {
        font-size: 1.5rem;
        margin-bottom: 6px;
    }
    .step-item .step-num {
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 2px;
    }
    .step-item .step-label {
        font-size: 0.75rem;
        opacity: 0.8;
    }
    .step-item.step-active {
        background: rgba(102, 126, 234, 0.15);
        border: 1px solid rgba(102, 126, 234, 0.4);
        animation: setupPulse 2s infinite;
    }
    .step-item.step-active .step-num,
    .step-item.step-active .step-label {
        color: #667eea;
    }
    .step-item.step-done {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .step-item.step-done .step-num,
    .step-item.step-done .step-label {
        color: #16a34a;
    }
    .step-item.step-pending {
        background: rgba(241, 245, 249, 0.8);
        border: 1px solid #e2e8f0;
    }
    .step-item.step-pending .step-icon {
        filter: grayscale(30%);
        opacity: 0.8;
    }
    .step-item.step-pending .step-num,
    .step-item.step-pending .step-label {
        color: #64748b;
    }
    .step-arrow {
        display: flex;
        align-items: center;
        font-size: 1.3rem;
        opacity: 0.5;
        color: #64748b;
    }
    .step-arrow.done {
        color: #22c55e;
        opacity: 0.8;
    }
    @keyframes setupPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.3); }
        50% { box-shadow: 0 0 0 8px rgba(102, 126, 234, 0); }
    }

    /* 卡片悬停 */
    .device-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .device-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }

    /* 配置失败闪烁 */
    @keyframes fail-flash {
        0%, 100% { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.08); }
        50% { border-color: rgba(239,68,68,0.9); background: rgba(239,68,68,0.18); }
    }
    .device-failed { animation: fail-flash 0.6s ease-in-out 3; }

    /* 在线绿点呼吸 */
    @keyframes online-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
        50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
    }
    .online-dot {
        display: inline-block; width: 8px; height: 8px;
        border-radius: 50%; background: #22c55e;
        animation: online-pulse 2s infinite;
    }

    /* 步骤切换淡入 */
    @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .step-content { animation: fade-in-up 0.4s ease-out; }

    /* 配置中转圈 */
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .config-spinner { display: inline-block; animation: spin 1.2s linear infinite; }
    </style>
    """
    st.markdown(css_link + inline_css, unsafe_allow_html=True)


# ============================================
# 顶部步骤进度指示器（增强动画版）
# ============================================
def _render_step_indicator():
    """渲染顶部 4 步进度指示器（带平滑过渡动画）。"""
    current_step = st.session_state.get('setup_step', 1)

    steps_html = []
    steps_html.append('<div class="step-indicator-container">')

    for i, step in enumerate(_STEPS):
        step_num = step['num']
        icon = step['icon']
        label = step['label']

        if step_num < current_step:
            status = 'done'
            status_icon = '✓'
        elif step_num == current_step:
            status = 'active'
            status_icon = icon
        else:
            status = 'pending'
            status_icon = icon

        steps_html.append(f'<div class="step-item step-{status}"><div class="step-icon">{status_icon}</div><div class="step-num">Step {step_num}</div><div class="step-label">{label}</div></div>')

        if i < len(_STEPS) - 1:
            arrow_done = 'done' if step_num < current_step else ''
            steps_html.append(f'<div class="step-arrow {arrow_done}">→</div>')

    steps_html.append('</div>')

    st.markdown(''.join(steps_html), unsafe_allow_html=True)


# ============================================
# 毛玻璃卡片容器
# ============================================
def _glass_card(title, icon=""):
    """渲染一个毛玻璃卡片标题栏（自带闭合 div，Streamlit 控件无法嵌入 HTML 内，故仅作标题卡）。"""
    st.markdown(f"""
    <div style="background: #f1f5f9;
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 20px; margin-bottom: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 12px 0;color:#1e293b;">{icon} {title}</h3>
    </div>
    """, unsafe_allow_html=True)


# ============================================
# Step 1: WiFi 连接
# ============================================
def _render_step1_wifi():
    """渲染 Step 1: WiFi 连接页面。"""
    st.markdown('<div class="step-content">', unsafe_allow_html=True)
    _glass_card("第一步：连接家庭 WiFi", "🔌")

    if st.session_state.get('wifi_connected'):
        # 已连接状态
        ssid = st.session_state.get('wifi_ssid', '')
        ip = st.session_state.get('wifi_ip', '')
        st.success(f"✅ WiFi 已连接：{ssid}")
        st.info(f"🌐 模拟 IP 地址：{ip}")

        # 自动进入下一步（1.5 秒等待）
        _auto_advance(2, 1.5, "WiFi 已连接，准备搜索设备...")
    else:
        # 未连接状态：显示连接表单
        col_form, col_info = st.columns([3, 2])

        with col_form:
            ssid = st.selectbox(
                "选择 WiFi 网络",
                options=_WIFI_SSIDS,
                index=0,
                key="setup_wifi_ssid",
                help="选择要连接的家庭 WiFi 网络",
            )

            # 密码输入（支持显示/隐藏切换）
            if st.session_state.get('setup_show_password', False):
                password = st.text_input(
                    "WiFi 密码",
                    value=st.session_state.get('setup_wifi_password', ''),
                    type="default",
                    key="setup_wifi_password_input",
                    placeholder="请输入 WiFi 密码",
                )
            else:
                password = st.text_input(
                    "WiFi 密码",
                    value=st.session_state.get('setup_wifi_password', ''),
                    type="password",
                    key="setup_wifi_password_input",
                    placeholder="请输入 WiFi 密码",
                )

            # 显示密码切换
            col_toggle, col_btn = st.columns([1, 2])
            with col_toggle:
                if st.button(
                    "👁️ 显示密码" if not st.session_state.get('setup_show_password') else "🙈 隐藏密码",
                    key="setup_toggle_pwd",
                    use_container_width=True,
                ):
                    st.session_state['setup_show_password'] = not st.session_state.get('setup_show_password', False)
                    st.rerun()

            with col_btn:
                connect_clicked = st.button(
                    "🔗 连接 WiFi",
                    key="setup_connect_wifi",
                    use_container_width=True,
                    type="primary",
                )

        with col_info:
            st.markdown("""
            <div style="background: rgba(102,126,234,0.08);
                        border: 1px solid rgba(102,126,234,0.2);
                        border-radius: 12px; padding: 14px;
                        color: #64748b; font-size: 0.85rem;">
                <div style="font-weight:600;margin-bottom:8px;color:#667eea;">💡 连接提示</div>
                · 请选择 2.4G 网络以获得最佳兼容性<br>
                · 确保手机与设备在同一网络<br>
                · 密码区分大小写<br>
                · 模拟环境无需真实密码
            </div>
            """, unsafe_allow_html=True)

        # 处理连接按钮
        if connect_clicked:
            _simulate_wifi_connect(ssid)

    st.markdown('</div>', unsafe_allow_html=True)


def _simulate_wifi_connect(ssid):
    """模拟 WiFi 连接过程（3 秒进度条）。"""
    # 5% 概率连接失败
    if random.random() < 0.05:
        progress_bar = st.progress(0, text="🔗 正在连接 WiFi...")
        for i in range(0, 60, random.randint(5, 15)):
            time.sleep(0.15 * _speed())
            progress_bar.progress(i, text=f"🔗 正在连接 WiFi... {i}%")
        progress_bar.empty()
        st.error("❌ WiFi 连接失败，请检查密码后重试")
        st.session_state['wifi_connected'] = False
        time.sleep(1 * _speed())
        st.rerun()
        return

    # 正常连接：3 秒进度条（演示模式 0.6 秒）
    progress_bar = st.progress(0, text="🔗 正在连接 WiFi...")
    current = 0
    while current < 100:
        increment = random.randint(5, 15)
        current = min(current + increment, 100)
        time.sleep(0.15 * _speed())
        progress_bar.progress(current, text=f"🔗 正在连接 WiFi... {current}%")

    progress_bar.empty()

    # 连接成功
    st.session_state['wifi_connected'] = True
    st.session_state['wifi_ssid'] = ssid
    # 生成模拟 IP 地址
    st.session_state['wifi_ip'] = f"192.168.1.{random.randint(100, 200)}"

    st.success(f"✅ WiFi 已连接：{ssid}")
    st.info(f"🌐 模拟 IP 地址：{st.session_state['wifi_ip']}")
    st.rerun()


# ============================================
# Step 2: 搜索设备
# ============================================
def _render_step2_discover():
    """渲染 Step 2: 搜索设备页面。"""
    st.markdown('<div class="step-content">', unsafe_allow_html=True)
    _glass_card("第二步：搜索全屋设备", "📡")

    devices = st.session_state.get('setup_devices', [])
    if not devices:
        st.warning("⚠️ 未找到设备列表")
        st.markdown('</div>', unsafe_allow_html=True)
        return

    discovered = st.session_state.get('devices_discovered', [])

    if len(discovered) >= len(devices):
        # 全部发现完成
        st.success(f"✅ 已发现 {len(discovered)} 个设备")
        _render_device_discovery_list(discovered, devices, all_done=True)
        # 自动进入下一步
        _auto_advance(3, 1.5, "设备搜索完成，准备开始配置...")
    else:
        # 逐个发现设备
        _simulate_device_discovery(devices, discovered)

    st.markdown('</div>', unsafe_allow_html=True)


def _simulate_device_discovery(devices, already_discovered):
    """模拟设备逐个发现过程（0.5-0.8 秒/个）。"""
    placeholder = st.empty()

    # 生成信号强度（如果尚未生成）
    signals = st.session_state.get('device_signals', {})
    for dev in devices:
        dev_id = dev.get('id', '')
        if dev_id and dev_id not in signals:
            signals[dev_id] = random.choice(_SIGNAL_LEVELS)[0]
    st.session_state['device_signals'] = signals

    # 从上次发现的位置继续
    discovered = list(already_discovered)
    remaining = devices[len(discovered):]

    # 顶部进度
    total = len(devices)

    for i, dev in enumerate(remaining):
        # 等待 0.5-0.8 秒
        time.sleep(random.uniform(0.5, 0.8) * _speed())
        discovered.append(dev)
        st.session_state['devices_discovered'] = list(discovered)

        # 更新显示
        with placeholder.container():
            done_count = len(discovered)
            progress_pct = int(done_count / total * 100)
            st.progress(progress_pct / 100, text=f"📡 搜索中... 已发现 {done_count}/{total}")

            _render_device_discovery_list(discovered, devices, all_done=False)

    # 全部发现完成
    with placeholder.container():
        st.success(f"✅ 已发现 {len(discovered)} 个设备")
        _render_device_discovery_list(discovered, devices, all_done=True)

    st.rerun()


def _render_device_discovery_list(discovered, all_devices, all_done):
    """渲染设备发现列表。"""
    signals = st.session_state.get('device_signals', {})
    discovered_ids = {d.get('id', '') for d in discovered}

    for dev in all_devices:
        dev_id = dev.get('id', '')
        dev_name = dev.get('name', '未知设备')
        brand = dev.get('brand', '-')
        protocol = dev.get('protocol', '-')
        category = dev.get('category', '')

        is_discovered = dev_id in discovered_ids
        signal = signals.get(dev_id, '中')
        signal_color = next((c for s, c in _SIGNAL_LEVELS if s == signal), '#f59e0b')

        if is_discovered:
            status_icon = '✅'
            status_text = '已发现'
            border_color = 'rgba(34,197,94,0.3)'
            bg = 'rgba(34,197,94,0.06)'
        else:
            status_icon = '⏳'
            status_text = '搜索中...'
            border_color = '#e2e8f0'
            bg = '#f1f5f9'

        st.markdown(f"""
        <div class="device-card" style="background:{bg};
                    border:1px solid {border_color};
                    border-radius:12px;padding:12px 16px;margin-bottom:8px;
                    display:flex;justify-content:space-between;align-items:center;">
            <div>
                <span style="font-size:1.1rem;margin-right:8px;">{status_icon}</span>
                <span style="color:#1e293b;font-weight:600;">{dev_name}</span>
                <span style="color:#64748b;font-size:0.85rem;margin-left:8px;">{brand}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <span style="background:rgba(102,126,234,0.15);color:#667eea;
                             padding:2px 8px;border-radius:8px;font-size:0.75rem;">{protocol}</span>
                {'<span style="color:'+signal_color+';font-size:0.85rem;">信号:'+signal+'</span>' if is_discovered else ''}
                <span style="color:#64748b;font-size:0.85rem;">{status_text}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)


# ============================================
# Step 3: 逐个配置（核心动画）
# ============================================
def _render_step3_configure():
    """渲染 Step 3: 逐个配置设备页面。"""
    st.markdown('<div class="step-content">', unsafe_allow_html=True)
    _glass_card("第三步：配置设备", "⚙️")

    devices = st.session_state.get('setup_devices', [])
    if not devices:
        st.warning("⚠️ 未找到设备列表")
        st.markdown('</div>', unsafe_allow_html=True)
        return

    configured = st.session_state.get('devices_configured', [])

    if len(configured) >= len(devices):
        # 全部配置完成
        st.success(f"✅ 全部 {len(configured)} 个设备配置完成")
        _render_device_config_list(configured, devices, configuring_idx=len(devices), sub_status='')
        # 自动进入下一步
        _auto_advance(4, 2.0, "设备配置完成，正在生成报告...")
    else:
        # 逐个配置
        _simulate_device_config(devices, configured)

    st.markdown('</div>', unsafe_allow_html=True)


def _simulate_device_config(devices, already_configured):
    """模拟设备逐个配置过程（2-5 秒/个，含子状态切换）。"""
    placeholder = st.empty()

    # 初始化开始时间
    if st.session_state.get('config_start_time') is None:
        st.session_state['config_start_time'] = time.time()

    configured = list(already_configured)
    remaining = devices[len(configured):]
    total = len(devices)

    for i, dev in enumerate(remaining):
        current_idx = len(configured)
        dev_id = dev.get('id', '')
        dev_name = dev.get('name', '未知设备')

        # 随机配置时长 2-5 秒（演示模式 0.4-1 秒）
        duration = random.uniform(2, 5) * _speed()
        sub_idx = 0
        start = time.time()
        attempt = 1
        max_attempts = 2  # 最多重试 1 次

        while True:
            elapsed = time.time() - start
            progress = min(elapsed / duration, 1.0)

            # 切换子状态文字
            sub_status = _CONFIG_SUBSTATUSES[sub_idx % len(_CONFIG_SUBSTATUSES)]

            # 更新显示
            with placeholder.container():
                # 顶部计时
                total_elapsed = int(time.time() - st.session_state['config_start_time'])
                st.markdown(
                    f'<div style="color:#667eea;font-size:0.9rem;margin-bottom:12px;">'
                    f'⏱️ 已用时：{total_elapsed} 秒</div>',
                    unsafe_allow_html=True
                )

                _render_device_config_list(configured, devices, configuring_idx=current_idx,
                                          sub_status=sub_status, current_progress=progress,
                                          is_retry=(attempt > 1))

                # 底部总进度
                done_count = len(configured)
                st.progress(done_count / total, text=f"总进度：{done_count}/{total} 已完成")

            if progress >= 1.0:
                # 配置完成，判断成功/失败
                if attempt < max_attempts and random.random() < 0.05:
                    # 5% 概率失败，自动重试
                    # 显示失败状态
                    with placeholder.container():
                        total_elapsed = int(time.time() - st.session_state['config_start_time'])
                        st.markdown(
                            f'<div style="color:#667eea;font-size:0.9rem;margin-bottom:12px;">'
                            f'⏱️ 已用时：{total_elapsed} 秒</div>',
                            unsafe_allow_html=True
                        )
                        _render_device_config_list(configured, devices, configuring_idx=current_idx,
                                                  sub_status='❌ 配置失败，正在重试...', current_progress=1.0,
                                                  is_failed=True)
                        st.progress(done_count / total, text=f"总进度：{done_count}/{total} 已完成")

                    time.sleep(1 * _speed())
                    # 重试：重新开始该设备的配置
                    start = time.time()
                    duration = random.uniform(2, 4) * _speed()
                    attempt += 1
                    continue
                else:
                    # 成功
                    signals = st.session_state.get('device_signals', {})
                    configured.append({
                        'device': dev,
                        'status': 'success',
                        'signal': signals.get(dev_id, '中'),
                        'attempts': attempt,
                    })
                    st.session_state['devices_configured'] = list(configured)
                    break

            time.sleep(1 * _speed())  # 每 1 秒更新一次（子状态切换间隔）
            sub_idx += 1

    # 全部配置完成
    total_time = int(time.time() - st.session_state['config_start_time'])
    st.session_state['config_total_time'] = total_time

    with placeholder.container():
        st.success(f"✅ 全部 {len(configured)} 个设备配置完成（用时 {total_time} 秒）")
        _render_device_config_list(configured, devices, configuring_idx=len(devices), sub_status='')
        st.progress(1.0, text=f"总进度：{len(configured)}/{total} 已完成 · 成功率：100%")

    st.rerun()


def _render_device_config_list(configured, all_devices, configuring_idx, sub_status,
                               current_progress=0, is_failed=False, is_retry=False):
    """渲染设备配置列表。"""
    signals = st.session_state.get('device_signals', {})
    configured_ids = {item['device'].get('id', ''): item for item in configured}

    for idx, dev in enumerate(all_devices):
        dev_id = dev.get('id', '')
        dev_name = dev.get('name', '未知设备')
        brand = dev.get('brand', '-')
        protocol = dev.get('protocol', '-')

        if idx < configuring_idx or (idx == configuring_idx and not is_failed and sub_status == ''):
            # 已完成
            item = configured_ids.get(dev_id)
            signal = item['signal'] if item else signals.get(dev_id, '中')
            signal_color = next((c for s, c in _SIGNAL_LEVELS if s == signal), '#f59e0b')
            st.markdown(f"""
            <div class="device-card" style="background:rgba(34,197,94,0.06);
                        border:1px solid rgba(34,197,94,0.3);
                        border-radius:12px;padding:12px 16px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span class="checkmark" style="font-size:1.1rem;margin-right:8px;">✅</span>
                        <span style="color:#1e293b;font-weight:600;">{dev_name}</span>
                        <span style="color:#64748b;font-size:0.85rem;margin-left:8px;">{brand}</span>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span style="background:rgba(102,126,234,0.15);color:#667eea;
                                     padding:2px 8px;border-radius:8px;font-size:0.75rem;">{protocol}</span>
                        <span style="color:{signal_color};font-size:0.85rem;">信号:{signal}</span>
                        <span style="color:#16a34a;font-size:0.85rem;">配置成功 ✓</span>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)

        elif idx == configuring_idx:
            # 当前正在配置
            if is_failed:
                border_class = 'device-failed'
                status_icon = '❌'
                status_text = sub_status or '配置失败'
                progress_html = ''
            else:
                border_class = 'device-configuring'
                status_icon = '🔵'
                status_text = '配置中...'
                progress_pct = int(current_progress * 100)
                progress_html = f'<div style="margin-top:8px;"><div style="background:#e2e8f0;border-radius:8px;overflow:hidden;height:6px;"><div class="progress-bar" style="width:{progress_pct}%;height:100%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:8px;"></div></div></div>'

            st.markdown(f"""
            <div class="device-card {border_class}" style="background:rgba(102,126,234,0.08);
                        border:1px solid rgba(102,126,234,0.4);
                        border-radius:12px;padding:12px 16px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span class="config-spinner" style="font-size:1.1rem;margin-right:8px;">{status_icon}</span>
                        <span style="color:#1e293b;font-weight:600;">{dev_name}</span>
                        <span style="color:#64748b;font-size:0.85rem;margin-left:8px;">{brand}</span>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span style="background:rgba(102,126,234,0.15);color:#667eea;
                                     padding:2px 8px;border-radius:8px;font-size:0.75rem;">{protocol}</span>
                        <span style="color:#667eea;font-size:0.85rem;">{status_text}</span>
                    </div>
                </div>
                <div style="color:#667eea;font-size:0.8rem;margin-top:6px;">↑ {sub_status}</div>
                {progress_html}
            </div>
            """, unsafe_allow_html=True)

        else:
            # 等待配置
            st.markdown(f"""
            <div class="device-card" style="background:#f1f5f9;
                        border:1px solid #e2e8f0;
                        border-radius:12px;padding:12px 16px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <span style="font-size:1.1rem;margin-right:8px;">⏳</span>
                        <span style="color:#64748b;font-weight:500;">{dev_name}</span>
                        <span style="color:#64748b;font-size:0.85rem;margin-left:8px;">{brand}</span>
                    </div>
                    <div>
                        <span style="background:rgba(102,126,234,0.1);color:#64748b;
                                     padding:2px 8px;border-radius:8px;font-size:0.75rem;">{protocol}</span>
                        <span style="color:#64748b;font-size:0.85rem;margin-left:8px;">等待配置...</span>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)


# ============================================
# Step 4: 配置完成
# ============================================
def _render_step4_complete():
    """渲染 Step 4: 配置完成页面。"""
    st.markdown('<div class="step-content">', unsafe_allow_html=True)

    # 标题
    st.markdown("""
    <div style="text-align:center;padding:20px 0;">
        <h1 style="font-size:2rem;color:#1e293b;margin-bottom:8px;">🎉 全屋智能配置完成！</h1>
        <p style="color:#64748b;font-size:0.95rem;">所有设备已成功配网，联动规则已同步</p>
    </div>
    """, unsafe_allow_html=True)

    # 彩带动画
    st.balloons()

    # 获取数据
    devices = st.session_state.get('setup_devices', [])
    configured = st.session_state.get('devices_configured', [])
    signals = st.session_state.get('device_signals', {})
    total_time = st.session_state.get('config_total_time', 0)

    # 统计数据
    success_count = sum(1 for item in configured if item.get('status') == 'success')
    strong_signal_count = sum(1 for item in configured if item.get('signal') == '强')

    # 获取联动规则
    rules = _get_matched_rules(devices)
    rule_count = len(rules)

    # 统计卡片（3 列布局）
    col_a, col_b, col_c = st.columns(3)
    with col_a:
        st.markdown(f"""
        <div style="background:rgba(34,197,94,0.10);
                    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
                    border:1px solid rgba(34,197,94,0.3);
                    border-radius:16px;padding:20px;text-align:center;
                    box-shadow:0 8px 32px rgba(0,0,0,0.08);">
            <div style="font-size:2rem;margin-bottom:4px;">✅</div>
            <div style="font-size:1.8rem;font-weight:700;color:#16a34a;">{success_count}</div>
            <div style="color:#64748b;font-size:0.85rem;">个设备已配好</div>
        </div>
        """, unsafe_allow_html=True)

    with col_b:
        st.markdown(f"""
        <div style="background:rgba(102,126,234,0.10);
                    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
                    border:1px solid rgba(102,126,234,0.3);
                    border-radius:16px;padding:20px;text-align:center;
                    box-shadow:0 8px 32px rgba(0,0,0,0.08);">
            <div style="font-size:2rem;margin-bottom:4px;">🔗</div>
            <div style="font-size:1.8rem;font-weight:700;color:#667eea;">{rule_count}</div>
            <div style="color:#64748b;font-size:0.85rem;">条联动规则已同步</div>
        </div>
        """, unsafe_allow_html=True)

    with col_c:
        st.markdown(f"""
        <div style="background:rgba(118,75,162,0.10);
                    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
                    border:1px solid rgba(118,75,162,0.3);
                    border-radius:16px;padding:20px;text-align:center;
                    box-shadow:0 8px 32px rgba(0,0,0,0.08);">
            <div style="font-size:2rem;margin-bottom:4px;">⚡</div>
            <div style="font-size:1.8rem;font-weight:700;color:#764ba2;">{strong_signal_count}</div>
            <div style="color:#64748b;font-size:0.85rem;">个设备信号强</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("")

    # 配置耗时
    if total_time > 0:
        st.info(f"⏱️ 总配置耗时：{total_time} 秒 · 平均 {total_time / max(success_count, 1):.1f} 秒/设备")

    # 设备清单汇总
    st.markdown("""
    <div style="background: #f1f5f9;
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border: 1px solid #e2e8f0;
                border-radius: 16px; padding: 20px; margin-bottom: 16px;">
        <h3 style="margin:0 0 12px 0;color:#1e293b;">📋 设备清单汇总</h3>
    </div>
    """, unsafe_allow_html=True)

    for item in configured:
        dev = item.get('device', {})
        status = item.get('status', '')
        signal = item.get('signal', '中')
        signal_color = next((c for s, c in _SIGNAL_LEVELS if s == signal), '#f59e0b')

        dev_name = dev.get('name', '未知设备')
        brand = dev.get('brand', '-')
        protocol = dev.get('protocol', '-')

        if status == 'success':
            status_html = '<span style="color:#16a34a;">● 已在线</span>'
        else:
            status_html = '<span style="color:#ef4444;">● 配置失败</span>'

        st.markdown(f"""
        <div class="device-card" style="background:#f1f5f9;
                    border:1px solid #e2e8f0;
                    border-radius:12px;padding:12px 16px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
                                 background:#22c55e;margin-right:8px;" class="online-dot"></span>
                    <span style="color:#1e293b;font-weight:600;">{dev_name}</span>
                    <span style="color:#64748b;font-size:0.85rem;margin-left:8px;">{brand}</span>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <span style="background:rgba(102,126,234,0.15);color:#667eea;
                                 padding:2px 8px;border-radius:8px;font-size:0.75rem;">{protocol}</span>
                    <span style="color:{signal_color};font-size:0.85rem;">信号:{signal}</span>
                    {status_html}
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    # 联动规则同步显示
    if rules:
        st.markdown("""
        <div style="background: #f1f5f9;
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: 1px solid #e2e8f0;
                    border-radius: 16px; padding: 20px; margin: 16px 0;">
            <h3 style="margin:0 0 12px 0;color:#1e293b;">🔗 联动规则已同步</h3>
        </div>
        """, unsafe_allow_html=True)

        for rule in rules[:5]:  # 最多显示 5 条
            rule_name = rule.get('name', '')
            trigger = rule.get('trigger', {})
            trigger_cond = trigger.get('condition', '') if isinstance(trigger, dict) else str(trigger)
            actions = rule.get('actions', []) or []
            actions_text = '；'.join(actions[:3]) if actions else '无'

            st.markdown(f"""
            <div class="device-card" style="background:rgba(118,75,162,0.06);
                        border:1px solid rgba(118,75,162,0.2);
                        border-radius:12px;padding:12px 16px;margin-bottom:8px;">
                <div style="color:#764ba2;font-weight:600;margin-bottom:4px;">🔗 {rule_name}</div>
                <div style="color:#64748b;font-size:0.85rem;">
                    <span style="color:#667eea;">触发：</span>{trigger_cond}
                </div>
                <div style="color:#64748b;font-size:0.85rem;margin-top:2px;">
                    <span style="color:#16a34a;">动作：</span>{actions_text}
                </div>
            </div>
            """, unsafe_allow_html=True)

    # 底部操作按钮
    st.markdown("---")
    col1, col2, col3 = st.columns([2, 2, 1])

    with col1:
        if st.button("🏠 进入控制台", key="setup_goto_dashboard",
                     use_container_width=True, type="primary"):
            # 标记完成
            st.session_state['setup_completed'] = True
            try:
                st.switch_page("views/dashboard.py")
            except Exception:
                st.switch_page("views/home.py")

    with col2:
        if st.button("📐 查看拓扑图", key="setup_goto_floorplan",
                     use_container_width=True):
            st.session_state['setup_completed'] = True
            try:
                st.switch_page("views/floorplan.py")
            except Exception:
                st.switch_page("views/recommend.py")

    with col3:
        if st.button("🔄 重新配置", key="setup_restart"):
            _reset_setup_state()
            st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)


def _get_matched_rules(devices):
    """从 rule_library.json 匹配当前方案设备的联动规则。"""
    try:
        from core.router import match_rules
        return match_rules(devices, top_n=5, min_match_rate=0.3)
    except Exception:
        return []


def _reset_setup_state():
    """重置配置流程的所有状态，回到 Step 1（保留 setup_devices 设备列表）。"""
    keys_to_reset = [
        'setup_step', 'wifi_connected', 'wifi_ssid', 'wifi_ip',
        'devices_discovered', 'devices_configured', 'device_signals',
        'config_start_time', 'config_total_time', 'setup_completed',
        'setup_show_password', 'setup_wifi_password', 'setup_confirm_exit',
    ]
    for k in keys_to_reset:
        if k not in st.session_state:
            continue
        if k == 'setup_step':
            st.session_state[k] = 1
        elif k in ('devices_configured', 'devices_discovered'):
            st.session_state[k] = []
        elif k == 'device_signals':
            st.session_state[k] = {}
        elif k == 'config_start_time':
            st.session_state[k] = None
        elif isinstance(st.session_state.get(k), bool):
            st.session_state[k] = False
        elif isinstance(st.session_state.get(k), (int, float)):
            st.session_state[k] = 0
        else:
            st.session_state[k] = ''


# ============================================
# 自动推进辅助函数
# ============================================
def _auto_advance(next_step, delay_seconds, message=""):
    """显示提示信息，等待指定秒数后自动进入下一步。"""
    if message:
        st.info(f"⏳ {message}")
    time.sleep(delay_seconds * _speed())
    st.session_state['setup_step'] = next_step
    st.rerun()


# ============================================
# 页面入口
# ============================================
def main():
    """页面主入口。"""
    _inject_css()

    # 检查设备列表
    devices = st.session_state.get('setup_devices', [])
    if not devices:
        render_top_nav("setup")
        st.warning("⚠️ 未检测到设备清单，正在返回方案页...")
        time.sleep(1.5)
        st.switch_page("views/recommend.py")
        return

    # 顶部导航 + 步骤指示器
    _step = st.session_state.get('setup_step', 1)
    render_top_nav("setup", step_info={"current": _step, "total": 4,
                                         "label": ["WiFi连接", "搜索设备", "逐个配置", "配置完成"][_step-1]})

    # 退出确认（配置进行中时）
    if _step < 4 and not st.session_state.get('setup_completed', False):
        _confirm_exit = st.session_state.get('setup_confirm_exit', False)
        if not _confirm_exit:
            if st.button("← 返回方案页", key="setup_back_btn", type="secondary"):
                st.session_state['setup_confirm_exit'] = True
                st.rerun()
        else:
            st.warning("⚠️ 配置尚未完成，确定退出吗？")
            _cf_cols = st.columns(2)
            with _cf_cols[0]:
                if st.button("✅ 确认退出", key="setup_confirm_exit_btn", type="primary"):
                    # 重置配置状态
                    st.session_state['setup_step'] = 1
                    st.session_state['wifi_connected'] = False
                    st.session_state['devices_discovered'] = []
                    st.session_state['devices_configured'] = []
                    st.session_state['setup_confirm_exit'] = False
                    st.switch_page("views/recommend.py")
            with _cf_cols[1]:
                if st.button("❌ 取消", key="setup_cancel_exit_btn"):
                    st.session_state['setup_confirm_exit'] = False
                    st.rerun()

    # 渲染顶部步骤指示器
    _render_step_indicator()

    # 根据当前步骤渲染对应内容
    current_step = st.session_state.get('setup_step', 1)

    if current_step == 1:
        _render_step1_wifi()
    elif current_step == 2:
        _render_step2_discover()
    elif current_step == 3:
        _render_step3_configure()
    elif current_step == 4:
        _render_step4_complete()

    # 底部信息
    st.markdown("---")
    _simul_tag = "" if st.session_state.get('demo_mode', False) else " · 模拟演示模式"
    st.caption(f"🏠 HomeWizard · 设备配置模拟器{_simul_tag} · 共 {len(devices)} 个设备")


# 执行
try:
    main()
except Exception as e:
    st.error(f"页面加载出错：{str(e)}")
    st.caption("💡 提示：请先在推荐方案页生成方案后再进入配置流程")
