/**
 * 应用主入口模块 - 负责初始化、协调各模块等功能
 */

// 导入摄像头管理模块的初始化函数和启动函数
import { initCamera, startCamera } from './camera.js';
// 导入菜单管理模块的渲染函数、点击处理函数、导航函数和关闭弹窗函数
import { renderMenu, handleMenuClick, navigateToView, closeModal } from './menu.js';
// 导入场景管理模块的场景切换、摄像头网格渲染、获取当前场景和选择摄像头函数
import { switchScene, renderCameraGrid, getCurrentScene, selectCamera } from './scene.js';
// 导入告警管理模块的模拟告警、显示提示、添加事件到DOM和显示截图详情函数
import { simulateAlert, showToast, addEventToDOM, showScreenshotDetail } from './alert.js';
// 导入数据存储模块的初始化存储、获取事件、获取今日统计和下载CSV函数
import { initStorage, getEvents, getTodayStats, downloadCSV } from './storage.js';

/**
 * 应用初始化函数
 * 负责按顺序初始化所有子系统和模块
 */
export function initApp() {
    // 初始化本地存储系统，设置默认数据结构
    initStorage();
    // 初始化摄像头组件，绑定到 video 元素
    initCamera('main-video');
    // 渲染左侧侧边栏菜单
    renderMenu();
    // 渲染摄像头网格视图
    renderCameraGrid();
    // 从本地存储加载历史事件并显示到页面
    loadStoredEvents();
    // 更新顶部统计面板的数据
    updateDashboardStats();
    // 启动后台模拟事件定时器
    startSimulation();
    // 立即更新一次时间显示
    updateTime();

    // 每秒更新一次顶部时间显示
    setInterval(updateTime, 1000);

    // 延迟500毫秒后尝试启动摄像头
    setTimeout(() => {
        startCamera().then(success => {
            if (success) {
                // 摄像头成功连接，显示成功提示
                showToast('success', '摄像头连接成功', '实时画面已接入');
            } else {
                // 摄像头连接失败，显示警告提示
                showToast('warning', '摄像头未连接', '将使用模拟画面');
            }
        });
    }, 500);
}

/**
 * 加载存储的事件到 DOM
 * 从 localStorage 读取历史事件并渲染到事件列表
 */
function loadStoredEvents() {
    // 获取所有事件，只取前20条避免页面卡顿
    const events = getEvents().slice(0, 20);
    // 遍历每条事件，添加到页面DOM中
    events.forEach(event => {
        addEventToDOM(event);
    });
}

/**
 * 更新仪表盘统计数据
 * 刷新顶部统计面板的告警数和已处置数
 */
function updateDashboardStats() {
    // 获取今日告警统计数据
    const todayStats = getTodayStats();

    // 获取告警数DOM元素
    const alertsEl = document.getElementById('stat-alerts');
    // 获取已处置数DOM元素
    const resolvedEl = document.getElementById('stat-resolved');

    // 更新告警总数显示
    if (alertsEl) alertsEl.textContent = todayStats.total;
    // 更新已处置数量显示
    if (resolvedEl) resolvedEl.textContent = todayStats.resolved;
}

/**
 * 更新时间显示
 * 刷新顶部导航栏的实时时钟
 */
function updateTime() {
    // 获取当前时间
    const now = new Date();
    // 格式化为 HH:MM:SS 字符串
    const timeStr = now.toTimeString().slice(0, 8);
    // 获取时间显示DOM元素
    const el = document.getElementById('time-indicator');
    // 更新DOM元素文本
    if (el) el.textContent = timeStr;
}

/**
 * 启动模拟事件定时器
 * 定期生成系统事件（巡检、模型更新、心跳等）
 */
function startSimulation() {
    // 每10秒执行一次
    setInterval(() => {
        // 30%概率触发模拟事件
        if (Math.random() > 0.7) {
            // 定义模拟事件列表
            const events = [
                { title: '常规巡检完成', desc: '所有监控点位运行正常', level: 'low', icon: '✓', status: 'resolved' },
                { title: 'AI 模型更新', desc: '视觉识别模型已自动更新', level: 'low', icon: '🔄', status: 'resolved' },
                { title: '心跳检测', desc: 'Agent 智能体状态正常', level: 'low', icon: '💚', status: 'resolved' }
            ];
            // 随机选择一条事件
            const evt = events[Math.floor(Math.random() * events.length)];
            // 添加到页面DOM中显示
            addEventToDOM(evt);
        }
    }, 10000);
}

/**
 * 触发告警（全局接口）
 * 供外部调用，在当前场景触发模拟告警
 */
export function triggerAlert() {
    // 获取当前激活的场景
    const scene = getCurrentScene();
    // 在当前场景执行模拟告警
    simulateAlert(scene);
}

/**
 * 全局 API 暴露对象
 * 对外提供应用级别的接口
 */
window.app = {
    init: initApp,          // 应用初始化函数
    triggerAlert: triggerAlert  // 触发告警函数
};

/**
 * 全局函数暴露（供内联 onclick 使用）
 * 将模块函数挂载到 window 对象，供 HTML 内联事件调用
 */
window.triggerAlert = triggerAlert;           // 触发告警
window.handleMenuClick = handleMenuClick;     // 菜单点击处理
window.navigateToView = navigateToView;       // 视图导航
window.closeModal = closeModal;               // 关闭弹窗
window.switchScene = switchScene;             // 场景切换
window.selectCamera = selectCamera;           // 选择摄像头
window.startCamera = startCamera;             // 启动摄像头
window.showToast = showToast;                 // 显示提示消息
window.showScreenshotDetail = showScreenshotDetail;  // 显示截图详情
window.showAbout = () => handleMenuClick('showAbout', 'about');  // 显示关于弹窗
window.downloadCSV = downloadCSV;             // 下载CSV文件

/**
 * 页面加载完成后初始化
 * DOM 就绪后自动启动应用
 */
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});
