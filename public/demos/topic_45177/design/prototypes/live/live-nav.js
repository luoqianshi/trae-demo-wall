// 赛事直播平台 - 导航脚本

// 系统时间更新
function updateSystemTime() {
    const timeElement = document.getElementById('systemTime');
    if (timeElement) {
        const now = new Date();
        const timeStr = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        timeElement.textContent = timeStr;
    }
}

// 初始化系统时间
setInterval(updateSystemTime, 1000);
updateSystemTime();

// 系统切换菜单
function toggleSystemMenu() {
    const menu = document.getElementById('systemMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// 点击外部关闭菜单
document.addEventListener('click', function(event) {
    const menu = document.getElementById('systemMenu');
    const button = event.target.closest('[onclick="toggleSystemMenu()"]');
    if (menu && !menu.contains(event.target) && !button) {
        menu.classList.add('hidden');
    }
});

// 系统切换函数
function switchToCommandSystem() {
    if (confirm('确定要切换到赛事指挥调度系统吗？')) {
        window.location.href = '../command/dashboard.html';
    }
}

function switchToOperationSystem() {
    if (confirm('确定要切换到赛事运营管理系统吗？')) {
        window.location.href = '../operation/event_management.html';
    }
}

function switchToDeviceSystem() {
    if (confirm('确定要切换到智能设备管理平台吗？')) {
        window.location.href = '../device/device_home.html';
    }
}

function switchToAppletSystem() {
    if (confirm('确定要切换到选手服务小程序吗？')) {
        window.location.href = '../applet/applet_home.html';
    }
}

function switchToLiveSystem() {
    // 当前已在直播系统，无需切换
    console.log('当前已在赛事直播平台');
}

// 返回系统选择页面
function goToSystemSelect() {
    if (confirm('确定要返回系统选择页面吗？')) {
        window.location.href = '../index.html';
    }
}

// 右侧面板折叠
function toggleRightPanel() {
    const panel = document.getElementById('rightPanel');
    const toggleBtn = document.getElementById('panelToggle');
    
    if (panel && toggleBtn) {
        panel.classList.toggle('open');
        
        if (panel.classList.contains('open')) {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
    }
}

// 全屏功能
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('无法进入全屏模式:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// 地图图层切换
function toggleLayer(layerName, button) {
    const layerElements = document.querySelectorAll(`[data-layer="${layerName}"]`);
    const isActive = button.classList.contains('active');
    
    layerElements.forEach(el => {
        el.style.display = isActive ? 'none' : 'block';
    });
    
    button.classList.toggle('active');
}

// 选手搜索
function searchRunner(query) {
    console.log('搜索选手:', query);
    // 静态展示，不实现实际搜索
}

// 显示选手详情
function showRunnerDetail(runnerId) {
    window.location.href = `runner_detail.html?id=${runnerId}`;
}

// 视频窗口控制
function toggleVideoWindow() {
    const videoWindow = document.getElementById('videoWindow');
    if (videoWindow) {
        videoWindow.classList.toggle('hidden');
    }
}

function toggleVideoFullscreen() {
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) {
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                console.log('无法进入全屏模式:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
}

// 地图控件
function zoomIn() {
    console.log('放大地图');
    const map = document.getElementById('mapContainer');
    if (map) {
        const currentScale = parseFloat(map.dataset.scale || 1);
        const newScale = Math.min(currentScale * 1.2, 3);
        map.style.transform = `scale(${newScale})`;
        map.dataset.scale = newScale;
    }
}

function zoomOut() {
    console.log('缩小地图');
    const map = document.getElementById('mapContainer');
    if (map) {
        const currentScale = parseFloat(map.dataset.scale || 1);
        const newScale = Math.max(currentScale / 1.2, 0.5);
        map.style.transform = `scale(${newScale})`;
        map.dataset.scale = newScale;
    }
}

function resetMapView() {
    console.log('重置地图视图');
    const map = document.getElementById('mapContainer');
    if (map) {
        map.style.transform = 'scale(1)';
        map.dataset.scale = 1;
    }
}

// 页面导航
function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function goToMapFullscreen() {
    window.location.href = 'map_fullscreen.html';
}

function goToSettings() {
    window.location.href = 'settings.html';
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        window.location.href = 'login.html';
    }
}

// 数字动画
function animateNumber(element, target, duration = 1000) {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// 初始化数字动画
function initNumberAnimations() {
    const numbers = document.querySelectorAll('[data-animate-number]');
    numbers.forEach(el => {
        const target = parseInt(el.dataset.animateNumber);
        animateNumber(el, target);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('赛事直播平台初始化');
    
    // 初始化数字动画
    setTimeout(initNumberAnimations, 500);
    
    // 添加淡入动画类
    document.querySelectorAll('.data-card, .fade-in-target').forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
        el.classList.add('fade-in');
    });
});
