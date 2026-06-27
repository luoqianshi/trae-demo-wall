/**
 * ui.js - UI 渲染模块
 * 包含：设备卡片渲染、模态框、Toast 提示、摘要更新等
 */

// 获取设备状态文本（使用 DEVICE_CONFIG）
function getDeviceStatusText(device) {
    return DEVICE_CONFIG.getStatusText(device);
}

// 生成设备悬停 tooltip 文本（使用 DEVICE_CONFIG）
function getDeviceTooltipText(device) {
    return DEVICE_CONFIG.getTooltipText(device);
}

// 根据 device-id 同步 tooltip 内容
function updateSimTooltip(deviceId, device) {
    if (!deviceId) return;
    const elements = document.querySelectorAll(`[data-device-id="${deviceId}"]`);
    const text = getDeviceTooltipText(device);
    elements.forEach(el => {
        if (el.hasAttribute('data-tooltip')) {
            el.setAttribute('data-tooltip', text);
        }
    });
}

// 获取过滤后的设备列表
function getFilteredDevices(app) {
    if (app.currentRoom === 'all') return app.devices;
    return app.devices.filter(d => d.room === app.currentRoom);
}

// 渲染设备卡片
function render(app) {
    const grid = document.querySelector('.device-grid');
    const devices = getFilteredDevices(app);
    const currentDeviceIds = new Set(devices.map(d => d.id));

    const existingCards = Array.from(grid.querySelectorAll('.device-card'));
    
    existingCards.forEach(card => {
        const cardId = card.dataset.deviceId;
        if (!currentDeviceIds.has(cardId)) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => card.remove(), 200);
        }
    });

    devices.forEach((device, index) => {
        let card = grid.querySelector(`.device-card[data-device-id="${device.id}"]`);
        
        if (!card) {
            card = document.createElement('div');
            card.className = `device-card ${device.on ? 'on' : 'off'} ${device.hasSlider && device.on ? 'show-slider' : ''}`;
            card.dataset.deviceId = device.id;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.style.setProperty('--device-color', device.color);
            card.style.setProperty('--device-glow', device.color + '40');
            card.style.setProperty('--device-bg', device.color + '15');
            card.style.setProperty('--device-border', device.color + '35');
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';

            let sliderHTML = '';
            if (device.hasSlider) {
                sliderHTML = `
                    <div class="device-slider">
                        <div class="slider-row">
                            <span class="slider-label">${device.sliderValue}${device.sliderUnit}</span>
                            <input type="range" min="${device.sliderMin}" max="${device.sliderMax}" value="${device.sliderValue}"
                                data-device-id="${device.id}"
                                aria-label="${device.sliderLabel}调节"
                                ${!device.on ? 'disabled' : ''}>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="device-top">
                    <div class="device-icon-wrap">${device.icon}</div>
                    <label class="toggle-switch" aria-label="开关${device.name}">
                        <input type="checkbox" ${device.on ? 'checked' : ''} data-toggle-id="${device.id}">
                        <div class="toggle-track"></div>
                        <div class="toggle-thumb"></div>
                    </label>
                </div>
                <div class="device-info">
                    <div class="device-name">${device.name}</div>
                    <div class="device-room">${getRoomName(device.room)}</div>
                    <div class="device-status">
                        <span class="status-dot"></span>
                        <span class="status-text">${getDeviceStatusText(device)}</span>
                    </div>
                </div>
                ${sliderHTML}
            `;

            const toggle = card.querySelector(`input[data-toggle-id="${device.id}"]`);
            toggle.addEventListener('change', (e) => {
                e.stopPropagation();
                app.toggleDevice(device.id);
            });

            const slider = card.querySelector(`input[type="range"][data-device-id="${device.id}"]`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    e.stopPropagation();
                    app.updateDeviceSlider(device.id, e.target.value);
                    const label = card.querySelector('.slider-label');
                    if (label) label.textContent = e.target.value + device.sliderUnit;
                });
            }

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.toggle-switch') && !e.target.closest('input[type="range"]')) {
                    openDeviceModal(app, device);
                }
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    app.toggleDevice(device.id);
                }
            });

            grid.appendChild(card);
            
            requestAnimationFrame(() => {
                card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            });
        } else {
            const isOn = device.on;
            const wasOn = card.classList.contains('on');
            
            if (isOn !== wasOn) {
                if (isOn) {
                    card.classList.remove('off');
                    card.classList.add('on');
                    if (device.hasSlider) card.classList.add('show-slider');
                } else {
                    card.classList.remove('on');
                    card.classList.add('off');
                    card.classList.remove('show-slider');
                }
            } else if (device.hasSlider && isOn && !card.classList.contains('show-slider')) {
                card.classList.add('show-slider');
            }

            card.setAttribute('aria-label', `${device.name}，${getRoomName(device.room)}，${isOn ? '已开启' : '已关闭'}`);

            const statusText = card.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = getDeviceStatusText(device);
            }

            const slider = card.querySelector(`input[type="range"][data-device-id="${device.id}"]`);
            if (slider && slider.value !== String(device.sliderValue)) {
                slider.value = device.sliderValue;
            }

            const sliderLabel = card.querySelector('.slider-label');
            if (sliderLabel) {
                sliderLabel.textContent = device.sliderValue + device.sliderUnit;
            }

            const toggle = card.querySelector(`input[data-toggle-id="${device.id}"]`);
            if (toggle && toggle.checked !== isOn) {
                toggle.checked = isOn;
            }

            if (slider && slider.disabled !== !isOn) {
                slider.disabled = !isOn;
            }
        }
    });
}

// 打开设备详情模态框
function openDeviceModal(app, device) {
    const overlay = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    title.textContent = device.name;

    let controlsHTML = '';

    // Toggle
    controlsHTML += `
        <div class="modal-toggle-row">
            <span class="modal-toggle-label">电源开关</span>
            <label class="toggle-switch">
                <input type="checkbox" id="modalToggle" ${device.on ? 'checked' : ''}>
                <div class="toggle-track"></div>
                <div class="toggle-thumb"></div>
            </label>
        </div>
    `;

    // Slider controls
    if (device.hasSlider) {
        controlsHTML += `
            <div class="modal-control-group">
                <span class="modal-control-label">${device.sliderLabel}</span>
                <div class="modal-slider-row">
                    <input type="range" min="${device.sliderMin}" max="${device.sliderMax}" value="${device.sliderValue}" id="modalSlider">
                    <span class="modal-slider-value" id="modalSliderVal">${device.sliderValue}${device.sliderUnit}</span>
                </div>
            </div>
        `;
    }

    // Color temperature slider for lights
    if (device.type === 'light') {
        controlsHTML += `
            <div class="modal-control-group">
                <span class="modal-control-label">色温</span>
                <div class="modal-slider-row">
                    <input type="range" min="3000" max="6000" value="${device.colorTemp || 4000}" id="modalColorTemp">
                    <span class="modal-slider-value" id="modalColorTempVal">${device.colorTemp || 4000}K</span>
                </div>
                <div class="modal-color-temp-labels">
                    <span>暖光 3000K</span>
                    <span>中性 4000K</span>
                    <span>冷光 6000K</span>
                </div>
            </div>
        `;
    }

    // AC mode
    if (device.type === 'ac') {
        const modes = [
            { key: 'cool', icon: '❄️', name: '制冷', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
            { key: 'heat', icon: '🔥', name: '制热', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
            { key: 'fan', icon: '🌀', name: '送风', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
            { key: 'auto', icon: '🤖', name: '自动', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' }
        ];

        const modeButtons = modes.map(m =>
            `<button class="modal-mode-btn ${device.mode === m.key ? 'active' : ''}" data-mode="${m.key}" style="${device.mode === m.key ? `background:${m.bg};color:${m.color};` : ''}">${m.icon} ${m.name}</button>`
        ).join('');

        controlsHTML += `
            <div class="modal-control-group">
                <span class="modal-control-label">运行模式</span>
                <div class="modal-mode-btn-row">
                    ${modeButtons}
                </div>
            </div>
        `;
    }

    // Timer settings
    const timerDisplay = device.timerTime ? `
        <div class="modal-timer-display">
            <span class="modal-timer-display-text">
                <span class="timer-icon">⏰</span> 当前定时：${device.timerTime} ${device.timerAction === 'on' ? '开启' : '关闭'}
            </span>
        </div>
    ` : '';
    const clearBtnDisabled = !device.timerTime ? 'disabled' : '';

    controlsHTML += `
        <div class="modal-control-group modal-timer-group">
            <span class="modal-control-label modal-timer-label">
                <span>⏰</span> 定时设置
            </span>
            <div class="modal-timer-row">
                <input type="time" id="timerTimeInput" value="${device.timerTime || ''}" class="modal-timer-input">
                <select id="timerActionSelect" class="modal-timer-select">
                    <option value="on" ${device.timerAction === 'on' ? 'selected' : ''}>定时开启</option>
                    <option value="off" ${device.timerAction === 'off' ? 'selected' : ''}>定时关闭</option>
                </select>
            </div>
            ${timerDisplay}
            <div class="modal-timer-btn-row">
                <button id="setTimerBtn" class="modal-timer-btn">设置定时</button>
                <button id="clearTimerBtn" class="modal-timer-btn-secondary ${clearBtnDisabled}">取消定时</button>
            </div>
        </div>
    `;

    // 设备图标样式类
    const iconClass = device.on ? 'modal-device-icon modal-device-icon-on' : 'modal-device-icon';
    const iconStyle = device.on
        ? `style="--device-on-bg:${device.color}15;--device-on-border:${device.color}35;--device-on-glow:${device.color}25;"`
        : '';

    body.innerHTML = `
        <div class="${iconClass}" ${iconStyle}>${device.icon}</div>
        <div class="modal-device-name">${device.name}</div>
        <div class="modal-device-room">${getRoomName(device.room)} · ${device.on ? '运行中' : '已关闭'}</div>
        ${controlsHTML}
        <button class="modal-btn" id="modalCloseBtn">完成</button>
    `;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    // Modal toggle
    const modalToggle = document.getElementById('modalToggle');
    modalToggle.addEventListener('change', () => {
        app.toggleDevice(device.id);
        openDeviceModal(app, device); // Re-render modal
    });

    // Modal slider
    const modalSlider = document.getElementById('modalSlider');
    if (modalSlider) {
        modalSlider.addEventListener('input', (e) => {
            app.updateDeviceSlider(device.id, e.target.value);
            document.getElementById('modalSliderVal').textContent = e.target.value + device.sliderUnit;
        });
    }

    // Color temperature slider
    const modalColorTemp = document.getElementById('modalColorTemp');
    if (modalColorTemp) {
        modalColorTemp.addEventListener('input', (e) => {
            app.updateDeviceColorTemp(device.id, parseInt(e.target.value));
            document.getElementById('modalColorTempVal').textContent = e.target.value + 'K';
        });
    }

    // AC mode buttons
    document.querySelectorAll('.modal-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            device.mode = btn.dataset.mode;
            render(app); // 更新设备卡片显示
            updateSimulation(app); // 同步模拟房间状态
            openDeviceModal(app, device); // 重新渲染模态框
            showToast(app, `空调切换为${DEVICE_CONFIG.AC_MODE_NAMES[device.mode]}模式`, 'info');
        });
    });

    // Timer buttons
    const setTimerBtn = document.getElementById('setTimerBtn');
    const clearTimerBtn = document.getElementById('clearTimerBtn');
    const timerTimeInput = document.getElementById('timerTimeInput');
    const timerActionSelect = document.getElementById('timerActionSelect');

    if (setTimerBtn) {
        setTimerBtn.addEventListener('click', () => {
            const time = timerTimeInput.value;
            const action = timerActionSelect.value;
            if (!time) {
                showToast(app, '请选择定时时间', 'error');
                return;
            }
            app.setDeviceTimer(device.id, time, action);
            openDeviceModal(app, device); // Re-render modal
        });
    }

    if (clearTimerBtn) {
        clearTimerBtn.addEventListener('click', () => {
            app.clearDeviceTimer(device.id);
            openDeviceModal(app, device); // Re-render modal
        });
    }

    // Close button
    document.getElementById('modalCloseBtn').addEventListener('click', () => closeModal());
}

// 关闭模态框
function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
}

// 初始化模态框事件
function initModalEvents() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('closeModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            closeModal();
        }
    });
}

// 显示 Toast 提示
function showToast(app, message, type = 'info') {
    const toast = document.getElementById('toast');
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    toast.className = `toast ${type} show`;

    if (app.toastTimeout) clearTimeout(app.toastTimeout);
    app.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// 更新摘要统计
function updateSummary(app) {
    const online = app.devices.length;
    const active = app.devices.filter(d => d.on).length;
    document.getElementById('onlineCount').textContent = online;
    document.getElementById('activeCount').textContent = active;
    updateEnergyStats(app);
}