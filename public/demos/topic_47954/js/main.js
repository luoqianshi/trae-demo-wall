/**
 * main.js - 入口模块
 * 包含：SmartHome 主类定义、事件绑定、初始化流程
 */

class SmartHome {
    constructor() {
        this.currentRoom = 'all';
        this.currentScene = null;
        this.devices = getDefaultDevices();
        this.toastTimeout = null;
        this.energyHistory = generateEnergyHistory();
        this.isDaytime = checkDaytime();
        this.lastMinute = -1;
        this.runtimeTimer = null;
        this.envData = initEnvData();
        this.lastSensorValues = {};
        this.sidebarCollapsed = false;
        
        this.initEventListeners();
        initModalEvents();
        initRuntimeTracking(this);
        render(this);
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        updateSummary(this);
        updateSimulation(this);
        drawEnergyChart(this);
        updateDayNightMode(this);
        startSensorUpdates(this);
    }

    initEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Room navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clicked = e.target.closest('.nav-btn');
                document.querySelectorAll('.nav-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                clicked.classList.add('active');
                clicked.setAttribute('aria-pressed', 'true');
                this.currentRoom = clicked.dataset.room;
                render(this);
            });
        });

        // Scene buttons
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clicked = e.target.closest('.scene-btn');
                document.querySelectorAll('.scene-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                clicked.classList.add('active');
                clicked.setAttribute('aria-pressed', 'true');
                const scene = clicked.dataset.scene;
                this.currentScene = scene;
                applyScene(this, scene);
            });
        });

        // Simulation device click events - 使用事件委托
        const simRooms = document.getElementById('simRooms');
        if (simRooms) {
            simRooms.addEventListener('click', (e) => {
                const device = e.target.closest('[data-device-id]');
                if (device) {
                    const deviceId = device.dataset.deviceId;
                    if (deviceId) {
                        this.toggleDevice(deviceId);
                    }
                }
            });
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }

        setTimeout(() => {
            drawEnergyChart(this);
        }, 300);
    }

    toggleDevice(id) {
        const device = this.devices.find(d => d.id === id);
        if (!device) return;

        device.on = !device.on;
        if (device.on) {
            device.startedAt = Date.now();
        } else {
            device.startedAt = null;
        }

        render(this);
        updateSummary(this);
        updateSimulation(this);
        updateRuntimeDisplays(this);
        updateEnergyStats(this);

        if (device.on) {
            showToast(this, `${device.icon} ${device.name} 已开启`, 'success');
        } else {
            showToast(this, `${device.icon} ${device.name} 已关闭`, 'info');
        }
    }

    updateDeviceSlider(id, value) {
        const device = this.devices.find(d => d.id === id);
        if (!device) return;

        const v = parseInt(value);
        device.sliderValue = v;

        switch (device.type) {
            case 'light': device.brightness = v; break;
            case 'ac': device.temperature = v; break;
            case 'heater': device.temperature = v; break;
            case 'curtain': device.openPercent = v; break;
            case 'tv': device.volume = v; break;
        }

        // Update card status text
        const card = document.querySelector(`[data-device-id="${id}"]`);
        if (card) {
            const statusText = card.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = getDeviceStatusText(device);
            }
        }

        updateSimulation(this);
        updateEnergyStats(this);
    }

    updateDeviceColorTemp(id, colorTemp) {
        const device = this.devices.find(d => d.id === id);
        if (!device || device.type !== 'light') return;

        device.colorTemp = colorTemp;
        updateSimulation(this);
    }

    setDeviceTimer(id, time, action) {
        const device = this.devices.find(d => d.id === id);
        if (!device) return;

        device.timerTime = time;
        device.timerAction = action;

        const actionText = action === 'on' ? '开启' : '关闭';
        showToast(this, `⏰ 已设置 ${device.name} 在 ${time} ${actionText}`, 'success');
    }

    clearDeviceTimer(id) {
        const device = this.devices.find(d => d.id === id);
        if (!device) return;

        device.timerTime = null;
        device.timerAction = null;

        showToast(this, `已取消 ${device.name} 的定时任务`, 'info');
    }

    checkTimers() {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        this.devices.forEach(device => {
            if (device.timerTime && device.timerTime === currentTime) {
                if (device.timerAction === 'on' && !device.on) {
                    device.on = true;
                    device.startedAt = Date.now();
                    showToast(this, `⏰ 定时任务执行：${device.icon} ${device.name} 已自动开启`, 'success');
                } else if (device.timerAction === 'off' && device.on) {
                    device.on = false;
                    device.startedAt = null;
                    showToast(this, `⏰ 定时任务执行：${device.icon} ${device.name} 已自动关闭`, 'info');
                }
                device.timerTime = null;
                device.timerAction = null;
                render(this);
                updateSummary(this);
                updateSimulation(this);
                updateRuntimeDisplays(this);
                updateEnergyStats(this);
            }
        });
    }

    updateClock() {
        const now = new Date();
        document.getElementById('envTime').textContent = formatTime(now);
        document.getElementById('envDate').textContent = formatDate(now);

        const currentMinute = now.getMinutes();
        if (currentMinute !== this.lastMinute) {
            this.lastMinute = currentMinute;
            updateDayNightMode(this);
            this.checkTimers();
        }
    }
}

// 启动应用
const app = new SmartHome();