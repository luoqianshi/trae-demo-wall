// 全局系统切换脚本

// 系统切换菜单切换功能
function toggleSystemMenu() {
    const menu = document.getElementById('systemMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// 点击页面其他地方关闭菜单
document.addEventListener('click', function(event) {
    const menu = document.getElementById('systemMenu');
    const button = event.target.closest('[onclick="toggleSystemMenu()"]');
    if (menu && !menu.contains(event.target) && !button) {
        menu.classList.add('hidden');
    }
});

// 系统切换功能
function switchToCommandSystem() {
    if (confirm('确定要切换到赛事指挥调度系统吗？')) {
        // 同步数据
        syncSystemData('command');
        window.location.href = '../command/dashboard.html';
    }
}

function switchToOperationSystem() {
    if (confirm('确定要切换到赛事运营管理系统吗？')) {
        // 同步数据
        syncSystemData('operation');
        window.location.href = '../operation/event_management.html';
    }
}

function switchToDeviceSystem() {
    if (confirm('确定要切换到智能设备管理平台吗？')) {
        // 同步数据
        syncSystemData('device');
        window.location.href = '../device/device_home.html';
    }
}

function switchToAppletSystem() {
    if (confirm('确定要切换到选手服务小程序吗？')) {
        // 同步数据
        syncSystemData('applet');
        window.location.href = '../applet/applet_home.html';
    }
}

function switchToLiveSystem() {
    if (confirm('确定要切换到赛事直播平台吗？')) {
        // 同步数据
        syncSystemData('live');
        window.location.href = '../live/dashboard.html';
    }
}

// 返回系统选择页面
function goToSystemSelect() {
    if (confirm('确定要返回系统选择页面吗？')) {
        window.location.href = '../index.html';
    }
}

// 数据同步功能
function syncSystemData(targetSystem) {
    console.log('正在同步数据到', targetSystem, '系统...');
    
    // 模拟数据同步过程
    // 在实际项目中，这里应该调用API进行数据同步
    try {
        // 1. 保存当前系统的状态
        saveCurrentSystemState();
        
        // 2. 加载目标系统的状态
        loadTargetSystemState(targetSystem);
        
        // 3. 同步关键数据
        syncCriticalData();
        
        console.log('数据同步完成');
    } catch (error) {
        console.error('数据同步失败:', error);
    }
}

// 保存当前系统状态
function saveCurrentSystemState() {
    // 模拟保存状态
    const currentState = {
        timestamp: new Date().toISOString(),
        system: getCurrentSystem(),
        user: 'admin',
        lastAction: 'system_switch'
    };
    
    // 存储到localStorage
    localStorage.setItem('systemState', JSON.stringify(currentState));
    console.log('当前系统状态已保存');
}

// 加载目标系统状态
function loadTargetSystemState(targetSystem) {
    // 模拟加载状态
    console.log('加载', targetSystem, '系统状态');
    
    // 从localStorage获取目标系统状态
    const targetState = localStorage.getItem(targetSystem + 'State');
    if (targetState) {
        console.log('已加载目标系统状态');
    }
}

// 同步关键数据
function syncCriticalData() {
    // 模拟同步关键数据
    const criticalData = {
        eventId: 'EV2026001',
        eventName: '2026北京马拉松',
        timestamp: new Date().toISOString()
    };
    
    // 存储到localStorage，供所有系统使用
    localStorage.setItem('criticalData', JSON.stringify(criticalData));
    console.log('关键数据已同步');
}

// 获取当前系统
function getCurrentSystem() {
    const path = window.location.pathname;
    if (path.includes('/command/')) return 'command';
    if (path.includes('/operation/')) return 'operation';
    if (path.includes('/device/')) return 'device';
    if (path.includes('/applet/')) return 'applet';
    if (path.includes('/live/')) return 'live';
    return 'index';
}

// 初始化系统切换功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('系统切换功能初始化');
    
    // 检查是否有未同步的数据
    checkPendingSync();
    
    // 显示当前系统信息
    showCurrentSystemInfo();
});

// 检查未同步的数据
function checkPendingSync() {
    const pendingSync = localStorage.getItem('pendingSync');
    if (pendingSync) {
        console.log('发现未同步的数据，正在处理...');
        // 处理未同步的数据
        localStorage.removeItem('pendingSync');
    }
}

// 显示当前系统信息
function showCurrentSystemInfo() {
    const currentSystem = getCurrentSystem();
    console.log('当前系统:', currentSystem);
    
    // 可以在这里添加系统状态显示逻辑
}

// 批量操作功能
function batchOperation(operation, items) {
    if (!items || items.length === 0) {
        alert('请选择要操作的项目');
        return;
    }
    
    console.log('执行批量操作:', operation, '对象:', items);
    
    // 模拟批量操作过程
    showGlobalLoading('正在执行批量操作...');
    
    setTimeout(() => {
        hideGlobalLoading();
        alert(`批量${operation}成功，共处理 ${items.length} 项`);
    }, 1000);
}

// 表单填写优化 - 自动保存功能
let autoSaveTimer = null;

function enableAutoSave(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('input', function() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            autoSaveForm(formId);
        }, 1000);
    });
}

function autoSaveForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    // 存储到localStorage
    localStorage.setItem('form_' + formId, JSON.stringify(data));
    console.log('表单已自动保存');
    
    // 显示保存成功提示
    showToast('表单已自动保存');
}

// 加载保存的表单数据
function loadSavedFormData(formId) {
    const savedData = localStorage.getItem('form_' + formId);
    if (!savedData) return;
    
    const data = JSON.parse(savedData);
    const form = document.getElementById(formId);
    if (!form) return;
    
    // 填充表单数据
    Object.keys(data).forEach(key => {
        const element = form.querySelector('[name="' + key + '"]');
        if (element) {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = (element.value === data[key]);
            } else {
                element.value = data[key];
            }
        }
    });
    
    console.log('已加载保存的表单数据');
}

// 显示全局加载
function showGlobalLoading(message) {
    // 检查是否已存在加载元素
    let loadingElement = document.getElementById('globalLoading');
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'globalLoading';
        loadingElement.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        loadingElement.innerHTML = `
            <div class="bg-dark-light border border-accent/30 rounded-lg p-6 flex flex-col items-center">
                <div class="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mb-4"></div>
                <p class="text-white text-lg">${message || '加载中...'}</p>
            </div>
        `;
        document.body.appendChild(loadingElement);
    }
    loadingElement.style.display = 'flex';
}

// 隐藏全局加载
function hideGlobalLoading() {
    const loadingElement = document.getElementById('globalLoading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// 显示提示信息
function showToast(message, duration = 2000) {
    // 检查是否已存在提示元素
    let toastElement = document.getElementById('toast');
    if (!toastElement) {
        toastElement = document.createElement('div');
        toastElement.id = 'toast';
        toastElement.className = 'fixed top-4 right-4 bg-accent text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
        document.body.appendChild(toastElement);
    }
    
    toastElement.textContent = message;
    toastElement.style.transform = 'translateX(0)';
    
    setTimeout(() => {
        toastElement.style.transform = 'translateX(full)';
    }, duration);
}