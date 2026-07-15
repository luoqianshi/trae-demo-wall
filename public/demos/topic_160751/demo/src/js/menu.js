/**
 * 菜单管理模块 - 负责侧边栏菜单的渲染、导航、交互等功能
 * 同时包含所有页面渲染逻辑（数据分析、事件列表、历史记录、系统设置、地图视图）
 */

// 从 data.js 导入菜单配置数据
import { menuConfig } from './data.js';
// 从 storage.js 导入数据存储相关函数
import {
    getEvents,        // 获取所有事件
    queryEvents,      // 按条件查询事件
    getTodayStats,    // 获取今日统计数据
    getTrendData,     // 获取趋势数据
    getStatsByScene,  // 按场景获取统计
    getStatsByType,   // 按类型获取统计
    downloadCSV,      // 导出CSV文件
    importFromCSV,    // 从CSV导入
    getSettings,      // 获取系统设置
    updateSetting,    // 更新设置项
    resetSettings,    // 重置设置
    deleteEvent,      // 删除事件
    updateEvent,      // 更新事件
    clearEvents       // 清空所有事件
} from './storage.js';
// 从 alert.js 导入告警相关函数
import { showToast, simulateAlert } from './alert.js';
// 从 scene.js 导入获取当前场景函数
import { getCurrentScene } from './scene.js';

// ==================== 模块级状态变量 ====================

// 当前激活的视图名称，默认显示实时监控
let currentView = 'realtime';
// 视图自动刷新定时器引用，用于控制定时刷新
let viewRefreshTimer = null;

// 事件列表分页相关状态
let eventsPage = 1;        // 事件列表当前页码
let eventsPageSize = 10;   // 事件列表每页显示条数
let eventsStartTime = '';  // 事件列表筛选开始时间
let eventsEndTime = '';    // 事件列表筛选结束时间

// 历史记录分页相关状态
let historyPage = 1;        // 历史记录当前页码
let historyPageSize = 10;   // 历史记录每页显示条数
let historyStartTime = '';  // 历史记录筛选开始时间
let historyEndTime = '';    // 历史记录筛选结束时间

// ==================== 菜单渲染 ====================

/**
 * 渲染侧边栏菜单
 * 根据 menuConfig 配置生成菜单 HTML 并插入到页面
 */
export function renderMenu() {
    // 获取侧边栏容器元素
    const sidebar = document.querySelector('.sidebar');
    // 如果侧边栏不存在则直接返回，避免报错
    if (!sidebar) return;

    // 初始化菜单 HTML 字符串
    let menuHTML = '';

    // 遍历菜单配置的每个分区（监控中心、告警管理、系统）
    menuConfig.forEach(section => {
        // 添加分区标题 HTML
        menuHTML += `<div class="nav-section"><div class="nav-title">${section.section}</div>`;

        // 遍历分区内的每个菜单项
        section.items.forEach(item => {
            // 判断当前菜单项是否处于激活状态（与当前视图匹配）
            const isActive = item.target === currentView;
            // 生成菜单项 HTML，包含图标、标签和点击事件
            menuHTML += `<div class="nav-item ${isActive ? 'active' : ''}" data-action="${item.action}" data-target="${item.target || ''}" onclick="handleMenuClick('${item.action}', '${item.target || ''}')"><span class="nav-icon">${item.icon}</span><span class="nav-item-label">${item.label}</span></div>`;
        });

        // 闭合分区容器
        menuHTML += '</div>';
    });

    // 获取菜单内容容器
    const menuContainer = sidebar.querySelector('.menu-container');
    // 如果容器存在则将生成的 HTML 插入
    if (menuContainer) {
        menuContainer.innerHTML = menuHTML;
    }
}

// ==================== 菜单交互 ====================

/**
 * 处理菜单点击事件
 * 根据菜单项的 action 类型执行不同操作
 * @param {string} action - 菜单动作类型（navigate/triggerAlert/showAbout）
 * @param {string} target - 目标视图名称
 */
export function handleMenuClick(action, target) {
    // 只有导航菜单才更新选中状态，操作类菜单（触发告警、关于产品）保持当前选中
    if (target) {
        // 更新菜单选中状态
        updateActiveMenu(target);
    }

    // 根据 action 类型执行对应操作
    switch (action) {
        case 'navigate':
            // 导航到目标视图
            navigateToView(target);
            break;
        case 'triggerAlert':
            // 获取当前场景并触发模拟告警
            const scene = getCurrentScene();
            simulateAlert(scene);
            break;
        case 'showAbout':
            // 显示关于产品弹窗
            showAboutModal();
            break;
        default:
            // 未知的 action 类型，不做处理
            break;
    }
}

/**
 * 更新活动菜单项
 * 移除所有菜单项的 active 类，给目标菜单项添加 active 类
 * @param {string} target - 目标视图的 data-target 值
 */
function updateActiveMenu(target) {
    // 获取所有菜单项元素
    document.querySelectorAll('.nav-item').forEach(item => {
        // 移除所有菜单项的激活状态
        item.classList.remove('active');
        // 如果菜单项的 data-target 与目标匹配，则添加激活状态
        if (item.dataset.target === target) {
            item.classList.add('active');
        }
    });
}

// ==================== 视图导航 ====================

/**
 * 导航到指定视图
 * 更新当前视图状态并加载对应内容，同时管理自动刷新定时器
 * @param {string} view - 目标视图名称
 */
export function navigateToView(view) {
    // 更新当前视图状态
    currentView = view;

    // 获取主内容区域容器
    const mainContent = document.getElementById('main-content');
    // 如果容器不存在则直接返回
    if (!mainContent) return;

    // 加载目标视图的内容
    loadView(view);

    // 定义需要自动刷新的视图列表
    const autoRefreshViews = ['map', 'analytics', 'events', 'history'];
    // 如果目标视图需要自动刷新则启动定时器，否则停止
    if (autoRefreshViews.includes(view)) {
        startViewRefresh();
    } else {
        stopViewRefresh();
    }
}

// ==================== 局部刷新（不重建筛选控件） ====================

/**
 * 刷新事件列表表格（不重建筛选控件）
 * 用于自动刷新时只更新表格数据，避免时间选择器失去焦点
 */
function refreshEventsTableOnly() {
    // 获取所有事件数据
    const allEvents = getEvents();
    // 按时间范围筛选事件
    let filteredEvents = filterEventsByTime(allEvents, eventsStartTime, eventsEndTime);

    // 获取当前的级别筛选值
    const levelFilter = document.getElementById('event-filter-level');
    const level = levelFilter ? levelFilter.value : '';
    // 获取当前的状态筛选值
    const statusFilter = document.getElementById('event-filter-status');
    const status = statusFilter ? statusFilter.value : '';
    // 获取当前的搜索词
    const searchInput = document.getElementById('event-search');
    const searchTerm = searchInput ? searchInput.value : '';

    // 按级别筛选（如果有选择）
    if (level) {
        filteredEvents = filteredEvents.filter(e => e.level === level);
    }
    // 按状态筛选（如果有选择）
    if (status) {
        filteredEvents = filteredEvents.filter(e => e.status === status);
    }
    // 按搜索词筛选（如果有输入）
    if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        filteredEvents = filteredEvents.filter(e =>
            (e.title && e.title.toLowerCase().includes(term)) ||
            (e.desc && e.desc.toLowerCase().includes(term))
        );
    }

    // 计算总页数
    const totalPages = Math.ceil(filteredEvents.length / eventsPageSize);
    // 确保当前页在有效范围内
    if (eventsPage > totalPages && totalPages > 0) {
        eventsPage = totalPages;
    }
    // 计算当前页的起始索引
    const start = (eventsPage - 1) * eventsPageSize;
    // 截取当前页的事件数据
    const pageEvents = filteredEvents.slice(start, start + eventsPageSize);

    // 获取表格容器并更新内容
    const container = document.getElementById('events-table-container');
    if (container) container.innerHTML = renderEventsTable(pageEvents);

    // 获取分页容器并更新分页组件
    const paginationEl = document.getElementById('events-pagination');
    if (paginationEl) paginationEl.innerHTML = renderPagination(eventsPage, totalPages, 'events');
}

/**
 * 刷新历史记录列表（不重建筛选控件）
 * 用于自动刷新时只更新列表数据，避免时间选择器失去焦点
 */
function refreshHistoryListOnly() {
    // 获取所有已处置的事件
    const allEvents = getEvents().filter(e => e.status === 'resolved');
    // 按时间范围筛选事件
    const filteredEvents = filterEventsByTime(allEvents, historyStartTime, historyEndTime);
    // 计算总页数
    const totalPages = Math.ceil(filteredEvents.length / historyPageSize);
    // 计算当前页的起始索引
    const start = (historyPage - 1) * historyPageSize;
    // 截取当前页的事件数据
    const pageEvents = filteredEvents.slice(start, start + historyPageSize);

    // 获取列表容器并更新内容
    const container = document.getElementById('history-list-container');
    if (container) container.innerHTML = renderHistoryList(pageEvents);

    // 获取分页容器并更新分页组件
    const paginationEl = document.getElementById('history-pagination');
    if (paginationEl) paginationEl.innerHTML = renderPagination(historyPage, totalPages, 'history');
}

// ==================== 自动刷新定时器 ====================

/**
 * 启动视图刷新定时器
 * 每秒自动刷新当前视图的数据，实现实时更新效果
 */
function startViewRefresh() {
    // 如果定时器已存在则不再创建，避免重复
    if (viewRefreshTimer) return;
    // 创建每秒执行的定时器
    viewRefreshTimer = setInterval(() => {
        // 根据当前视图类型执行对应的刷新逻辑
        switch (currentView) {
            case 'map':
                // 地图视图：重新渲染整个地图
                const mapEl = document.getElementById('placeholder-content');
                if (mapEl) mapEl.innerHTML = renderMapView();
                break;
            case 'analytics':
                // 数据分析视图：重新渲染整个分析页面
                const analyticsEl = document.getElementById('placeholder-content');
                if (analyticsEl) analyticsEl.innerHTML = renderAnalyticsPage();
                break;
            case 'events':
                // 事件列表：只刷新表格，保留筛选控件
                refreshEventsTableOnly();
                break;
            case 'history':
                // 历史记录：只刷新列表，保留筛选控件
                refreshHistoryListOnly();
                break;
        }
    }, 1000);
}

/**
 * 停止视图刷新定时器
 * 离开需要自动刷新的视图时调用，释放资源
 */
function stopViewRefresh() {
    // 检查定时器是否存在
    if (viewRefreshTimer) {
        // 清除定时器
        clearInterval(viewRefreshTimer);
        // 重置定时器引用为 null
        viewRefreshTimer = null;
    }
}

// ==================== 视图加载 ====================

/**
 * 加载视图内容
 * 根据视图名称加载对应的标题、副标题和页面内容
 * @param {string} view - 视图名称
 */
function loadView(view) {
    // 定义各视图的标题和副标题配置
    const views = {
        realtime: { title: '实时监控中心', subtitle: '多场景 AI 智能险情监控与毫秒级响应' },
        analytics: { title: '数据分析', subtitle: 'AI 检测数据分析与趋势洞察' },
        map: { title: '地图视图', subtitle: '监控点位分布与区域态势' },
        events: { title: '事件列表', subtitle: '历史告警事件管理' },
        history: { title: '历史记录', subtitle: '监控历史与数据追溯' },
        settings: { title: '系统设置', subtitle: '平台配置与参数管理' }
    };

    // 获取目标视图的配置信息，如果不存在则使用默认的实时监控
    const viewInfo = views[view] || views.realtime;

    // 更新顶部导航栏的标题和副标题
    updateTopbar(viewInfo.title, viewInfo.subtitle);

    // 如果是实时监控视图则显示实时监控区域，否则显示占位视图
    if (view === 'realtime') {
        showRealtimeView();
    } else {
        showPlaceholderView(viewInfo.title, viewInfo.subtitle);
    }
}

/**
 * 更新顶部导航栏
 * 修改页面顶部的标题和副标题文本
 * @param {string} title - 主标题
 * @param {string} subtitle - 副标题
 */
function updateTopbar(title, subtitle) {
    // 获取顶部标题元素
    const titleEl = document.querySelector('.topbar-left h2');
    // 获取顶部副标题元素
    const subtitleEl = document.querySelector('.topbar-left p');

    // 更新标题文本
    if (titleEl) titleEl.textContent = title;
    // 更新副标题文本
    if (subtitleEl) subtitleEl.textContent = subtitle;
}

/**
 * 显示实时监控视图
 * 显示实时监控区域，隐藏占位视图区域
 */
function showRealtimeView() {
    // 获取实时监控区域元素
    const realtimeSection = document.getElementById('realtime-section');
    // 获取占位视图区域元素
    const placeholderSection = document.getElementById('placeholder-section');

    // 显示实时监控区域
    if (realtimeSection) realtimeSection.style.display = 'block';
    // 隐藏占位视图区域
    if (placeholderSection) placeholderSection.style.display = 'none';
}

/**
 * 显示占位视图
 * 隐藏实时监控区域，显示占位视图区域并渲染对应内容
 * @param {string} title - 页面标题
 * @param {string} subtitle - 页面副标题
 */
function showPlaceholderView(title, subtitle) {
    // 获取实时监控区域元素
    const realtimeSection = document.getElementById('realtime-section');
    // 获取占位视图区域元素
    const placeholderSection = document.getElementById('placeholder-section');

    // 隐藏实时监控区域
    if (realtimeSection) realtimeSection.style.display = 'none';
    // 显示占位视图区域
    if (placeholderSection) {
        placeholderSection.style.display = 'block';
        // 渲染占位视图的内容
        renderPlaceholderContent(title, subtitle);
    }
}

/**
 * 渲染占位内容
 * 根据当前视图类型渲染对应的页面内容
 * @param {string} title - 页面标题
 * @param {string} subtitle - 页面副标题
 */
function renderPlaceholderContent(title, subtitle) {
    // 获取占位内容容器
    const contentEl = document.getElementById('placeholder-content');
    // 如果容器不存在则直接返回
    if (!contentEl) return;

    // 根据当前视图类型渲染对应的页面
    switch (currentView) {
        case 'analytics':
            // 渲染数据分析页面
            contentEl.innerHTML = renderAnalyticsPage();
            break;
        case 'events':
            // 渲染事件列表页面
            contentEl.innerHTML = renderEventsPage();
            break;
        case 'history':
            // 渲染历史记录页面
            contentEl.innerHTML = renderHistoryPage();
            break;
        case 'settings':
            // 渲染系统设置页面
            contentEl.innerHTML = renderSettingsPage();
            break;
        case 'map':
            // 渲染地图视图页面
            contentEl.innerHTML = renderMapView();
            break;
        default:
            // 默认显示返回按钮的占位页面
            contentEl.innerHTML = `<div class="panel" style="text-align: center; padding: 60px 20px;"><div class="panel-title" style="justify-content: center; margin-bottom: 30px;"><span>${title}</span></div><p style="color: var(--text-muted); font-size: 16px;">${subtitle}</p><button class="btn btn-secondary" style="margin-top: 30px;" onclick="navigateToView('realtime')">← 返回实时监控</button></div>`;
    }
}

// ==================== 数据分析页面 ====================

/**
 * 渲染数据分析页面
 * 展示今日告警统计、近7天趋势、场景分布和告警类型统计
 * @returns {string} 数据分析页面的 HTML 字符串
 */
function renderAnalyticsPage() {
    // 获取今日统计数据
    const todayStats = getTodayStats();
    // 获取近7天趋势数据
    const trendData = getTrendData(7);
    // 按场景获取统计数据
    const sceneStats = getStatsByScene();
    // 按类型获取统计数据
    const typeStats = getStatsByType();

    // 构建近7天趋势柱状图 HTML
    let trendHTML = '';
    trendData.forEach(day => {
        // 计算柱状图的最大值（至少为1，避免除零错误）
        const maxVal = Math.max(day.total, 1);
        // 计算柱状图高度百分比，最高100%
        const height = Math.min((day.total / maxVal) * 100, 100);
        // 添加柱状图 HTML，包含高度动画、日期和数值
        trendHTML += `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;"><div style="width: 100%; height: 120px; background: rgba(255,255,255,0.05); border-radius: 6px; position: relative; overflow: hidden;"><div style="position: absolute; bottom: 0; left: 0; right: 0; height: ${height}%; background: linear-gradient(to top, rgba(59,130,246,0.6), rgba(59,130,246,0.2)); border-radius: 6px 6px 0 0;"></div></div><div style="font-size: 11px; color: var(--text-muted);">${day.date}</div><div style="font-size: 12px; color: #fff; font-weight: 600;">${day.total}</div></div>`;
    });

    // 构建场景分布统计 HTML
    let sceneHTML = '';
    Object.entries(sceneStats).forEach(([scene, stats]) => {
        // 每个场景显示名称和各等级告警数量
        sceneHTML += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #fff;">${getSceneLabel(scene)}</span><div style="display: flex; gap: 12px;"><span style="color: #ef4444; font-size: 12px;">高: ${stats.high}</span><span style="color: #f59e0b; font-size: 12px;">中: ${stats.medium}</span><span style="color: #3b82f6; font-size: 12px;">低: ${stats.low}</span><span style="color: #10b981; font-size: 12px;">计: ${stats.total}</span></div></div>`;
    });
    // 如果没有场景数据则显示提示
    if (!sceneHTML) sceneHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">暂无场景数据</div>';

    // 构建告警类型统计 HTML
    let typeHTML = '';
    Object.entries(typeStats).forEach(([type, count]) => {
        // 每种类型显示名称和发生次数
        typeHTML += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="color: #fff;">${getTypeLabel(type)}</span><span style="color: var(--text-muted); font-size: 12px;">${count} 次</span></div>`;
    });
    // 如果没有类型数据则显示提示
    if (!typeHTML) typeHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">暂无类型数据</div>';

    // 返回完整的数据分析页面 HTML
    return `
        <div class="panel">
            <div class="panel-header">
                <div class="panel-title"><div class="panel-title-icon">📊</div><span>数据分析</span></div>
                <div class="action-bar">
                    <button class="btn btn-primary" onclick="window.downloadCSV()">📥 导出 CSV</button>
                </div>
            </div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${todayStats.total}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">今日告警</div>
                    </div>
                    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${todayStats.high}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">高等级</div>
                    </div>
                    <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${todayStats.medium}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">中等级</div>
                    </div>
                    <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${todayStats.low}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">低等级</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #10b981;">${todayStats.resolved}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">已处置</div>
                    </div>
                    <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #8b5cf6;">${todayStats.pending}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">待处置</div>
                    </div>
                </div>
                <h4 style="margin: 20px 0 12px; color: #fff; font-size: 14px;">近7天趋势</h4>
                <div style="display: flex; gap: 12px; margin-bottom: 24px;">${trendHTML}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="margin: 0 0 12px; color: #fff; font-size: 14px;">场景分布</h4>
                        ${sceneHTML}
                    </div>
                    <div>
                        <h4 style="margin: 0 0 12px; color: #fff; font-size: 14px;">告警类型</h4>
                        ${typeHTML}
                    </div>
                </div>
            </div>
        </div>`;
}

/**
 * 获取场景标签
 * 将场景英文标识转换为中文名称
 * @param {string} scene - 场景英文标识
 * @returns {string} 场景中文名称
 */
function getSceneLabel(scene) {
    // 场景标识到中文名称的映射表
    const labels = { subway: '地铁站台', nursing: '养老院', hospital: '医院急诊', airport: '机场大厅', unknown: '未知场景' };
    // 返回对应中文名称，如果不存在则返回原标识
    return labels[scene] || scene;
}

/**
 * 获取类型标签
 * 将告警类型英文标识转换为中文名称
 * @param {string} type - 告警类型英文标识
 * @returns {string} 类型中文名称
 */
function getTypeLabel(type) {
    // 告警类型标识到中文名称的映射表
    const labels = { fall: '跌倒', crowd: '人群聚集', abnormal: '异常行为', wander: '徘徊', stay: '久坐', emergency: '突发状况', gather: '聚集', queue: '排队', run: '异常奔跑', abandoned: '遗留物', unknown: '未知类型' };
    // 返回对应中文名称，如果不存在则返回原标识
    return labels[type] || type;
}

// ==================== 事件列表页面 ====================

/**
 * 格式化日期时间为 datetime-local 输入框格式
 * 将 Date 对象转换为 YYYY-MM-DDTHH:MM 格式字符串
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTimeLocal(date) {
    // 获取年份
    const year = date.getFullYear();
    // 获取月份并补零（月份从0开始，需要+1）
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // 获取日期并补零
    const day = String(date.getDate()).padStart(2, '0');
    // 获取小时并补零
    const hours = String(date.getHours()).padStart(2, '0');
    // 获取分钟并补零
    const minutes = String(date.getMinutes()).padStart(2, '0');
    // 返回 datetime-local 格式的字符串
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 获取当天的时间范围
 * 返回当天 00:00 到 23:59 的时间范围，用于默认筛选
 * @returns {Object} 包含 start 和 end 属性的对象
 */
function getTodayRange() {
    // 获取当前时间
    const now = new Date();
    // 构建当天开始时间（00:00:00）
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    // 构建当天结束时间（23:59:00）
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0);
    // 返回格式化后的时间范围
    return {
        start: formatDateTimeLocal(start),
        end: formatDateTimeLocal(end)
    };
}

/**
 * 渲染事件列表页面
 * 包含搜索框、级别筛选、状态筛选、时间筛选、分页功能
 * @returns {string} 事件列表页面的 HTML 字符串
 */
function renderEventsPage() {
    // 获取当天默认时间范围
    const range = getTodayRange();
    // 如果开始时间未设置则使用默认值
    if (!eventsStartTime) eventsStartTime = range.start;
    // 如果结束时间未设置则使用默认值
    if (!eventsEndTime) eventsEndTime = range.end;

    // 获取所有事件数据
    const allEvents = getEvents();
    // 按时间范围筛选事件
    const filteredEvents = filterEventsByTime(allEvents, eventsStartTime, eventsEndTime);
    // 计算总页数
    const totalPages = Math.ceil(filteredEvents.length / eventsPageSize);
    // 计算当前页的起始索引
    const start = (eventsPage - 1) * eventsPageSize;
    // 截取当前页的事件数据
    const pageEvents = filteredEvents.slice(start, start + eventsPageSize);

    // 返回完整的事件列表页面 HTML
    return `
        <div class="panel">
            <div class="panel-header">
                <div class="panel-title"><div class="panel-title-icon">📋</div><span>事件列表 (${filteredEvents.length} 条)</span></div>
                <div class="action-bar">
                    <input type="text" id="event-search" placeholder="搜索事件..." oninput="window.filterEvents(this.value)" style="padding: 6px 12px; background: #1a2332; border: 1px solid #2d3a4f; border-radius: 6px; color: #fff; font-size: 13px; width: 150px;">
                    <select id="event-filter-level" onchange="window.filterEvents()" style="padding: 6px 12px; background: #1a2332; border: 1px solid #2d3a4f; border-radius: 6px; color: #fff; font-size: 13px;">
                        <option value="">全部级别</option>
                        <option value="high">高等级</option>
                        <option value="medium">中等级</option>
                        <option value="low">低等级</option>
                    </select>
                    <select id="event-filter-status" onchange="window.filterEvents()" style="padding: 6px 12px; background: #1a2332; border: 1px solid #2d3a4f; border-radius: 6px; color: #fff; font-size: 13px;">
                        <option value="">全部状态</option>
                        <option value="pending">待处置</option>
                        <option value="resolved">已处置</option>
                    </select>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="datetime-local" id="events-start-time" value="${eventsStartTime}" onchange="window.setEventsStartTime(this.value)" style="padding: 6px 10px; background: #1a2332; border: 1px solid #4a6fa5; border-radius: 6px; color: #fff; font-size: 13px; cursor: pointer;">
                        <span style="color: var(--text-muted); font-size: 12px;">至</span>
                        <input type="datetime-local" id="events-end-time" value="${eventsEndTime}" onchange="window.setEventsEndTime(this.value)" style="padding: 6px 10px; background: #1a2332; border: 1px solid #4a6fa5; border-radius: 6px; color: #fff; font-size: 13px; cursor: pointer;">
                    </div>
                    <button class="btn btn-primary" onclick="window.triggerAlert()">🚨 触发告警</button>
                    <button class="btn btn-secondary" onclick="refreshEvents()">🔄 刷新</button>
                </div>
            </div>
            <div id="events-table-container">
                ${renderEventsTable(pageEvents)}
            </div>
            <div id="events-pagination">
                ${renderPagination(eventsPage, totalPages, 'events')}
            </div>
        </div>`;
}

/**
 * 按时间范围筛选事件
 * 根据开始时间和结束时间过滤事件数组
 * @param {Array} events - 事件数组
 * @param {string} startTime - 开始时间字符串
 * @param {string} endTime - 结束时间字符串
 * @returns {Array} 筛选后的事件数组
 */
function filterEventsByTime(events, startTime, endTime) {
    // 如果开始时间和结束时间都没有设置，则返回所有事件
    if (!startTime && !endTime) return events;
    // 过滤事件数组
    return events.filter(e => {
        // 获取事件创建时间的时间戳
        const eventTime = new Date(e.createdAt).getTime();
        // 初始化匹配结果为 true
        let match = true;
        // 如果有开始时间条件，检查事件时间是否大于等于开始时间
        if (startTime) {
            const start = new Date(startTime).getTime();
            match = match && eventTime >= start;
        }
        // 如果有结束时间条件，检查事件时间是否小于等于结束时间
        if (endTime) {
            const end = new Date(endTime).getTime();
            match = match && eventTime <= end;
        }
        // 返回匹配结果
        return match;
    });
}

/**
 * 渲染事件表格
 * 生成事件列表的表格 HTML
 * @param {Array} events - 事件数组
 * @returns {string} 表格 HTML 字符串
 */
function renderEventsTable(events) {
    // 如果没有事件数据则显示提示
    if (events.length === 0) {
        return '<div style="padding: 40px; text-align: center; color: var(--text-muted);">暂无事件记录</div>';
    }

    // 初始化表格 HTML
    let html = '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="border-bottom: 1px solid var(--border-color);">';
    // 添加表头：标题
    html += '<th style="text-align: left; padding: 12px; color: var(--text-muted); font-weight: 500; font-size: 12px;">标题</th>';
    // 添加表头：级别
    html += '<th style="text-align: left; padding: 12px; color: var(--text-muted); font-weight: 500; font-size: 12px;">级别</th>';
    // 添加表头：状态
    html += '<th style="text-align: left; padding: 12px; color: var(--text-muted); font-weight: 500; font-size: 12px;">状态</th>';
    // 添加表头：场景
    html += '<th style="text-align: left; padding: 12px; color: var(--text-muted); font-weight: 500; font-size: 12px;">场景</th>';
    // 添加表头：时间
    html += '<th style="text-align: left; padding: 12px; color: var(--text-muted); font-weight: 500; font-size: 12px;">时间</th>';
    // 添加表头：操作
    html += '<th style="text-align: right; padding: 12px; color: var(--text-muted); font-weight: 500; font-size: 12px;">操作</th>';
    html += '</tr></thead><tbody>';

    // 遍历每条事件数据生成表格行
    events.forEach(e => {
        // 如果事件未处置则显示处置按钮，否则不显示
        const resolveBtn = e.status !== 'resolved'
            ? `<button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px;" onclick="window.resolveEvent('${e.id}')">处置</button>`
            : '';
        // 添加表格行
        html += `<tr style="border-bottom: 1px solid var(--border-color);">`;
        // 标题列
        html += `<td style="padding: 12px; color: #fff; font-size: 13px;">${e.title || '-'}</td>`;
        // 级别列，使用颜色标签显示
        html += `<td style="padding: 12px;"><span class="event-status ${e.level}">${getLevelLabel(e.level)}</span></td>`;
        // 状态列，使用颜色标签显示
        html += `<td style="padding: 12px;"><span class="event-status ${e.status}">${getStatusLabel(e.status)}</span></td>`;
        // 场景列
        html += `<td style="padding: 12px; color: var(--text-muted); font-size: 12px;">${getSceneLabel(e.scene)}</td>`;
        // 时间列
        html += `<td style="padding: 12px; color: var(--text-muted); font-size: 12px;">${formatDateTime(e.createdAt)}</td>`;
        // 操作列（查看、处置、删除按钮）
        html += `<td style="padding: 12px; text-align: right;"><button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="window.viewEvent('${e.id}')">查看</button>${resolveBtn}<button class="btn btn-danger" style="padding: 4px 10px; font-size: 12px; margin-left: 4px;" onclick="window.deleteEventItem('${e.id}')">删除</button></td>`;
        html += `</tr>`;
    });

    // 闭合表格标签
    html += '</tbody></table></div>';
    return html;
}

/**
 * 渲染分页组件
 * 生成上一页、页码、下一页的分页导航 HTML
 * @param {number} currentPage - 当前页码
 * @param {number} totalPages - 总页数
 * @param {string} type - 分页类型（events/history）
 * @returns {string} 分页组件 HTML 字符串
 */
function renderPagination(currentPage, totalPages, type) {
    // 如果只有一页或没有页面则不显示分页
    if (totalPages <= 1) return '';

    // 初始化分页 HTML，使用 flex 布局水平排列
    let html = '<div style="padding: 16px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px;">';
    // 显示当前页码和总页数
    html += `<span style="color: var(--text-muted); font-size: 12px; margin-right: 8px;">第 ${currentPage}/${totalPages} 页</span>`;
    // 上一页按钮，当前为第一页时禁用
    html += `<button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px; white-space: nowrap;" onclick="window.${type}Page(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>`;

    // 最多显示5个页码按钮
    const maxVisible = 5;
    // 计算页码起始位置，确保当前页在中间
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    // 计算页码结束位置
    let end = Math.min(totalPages, start + maxVisible - 1);
    // 如果显示的页码不足5个，调整起始位置
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    // 生成页码按钮
    for (let i = start; i <= end; i++) {
        // 当前页使用主按钮样式，其他页使用次要按钮样式
        html += `<button class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}" style="padding: 4px 10px; font-size: 12px; min-width: 32px;" onclick="window.${type}Page(${i})">${i}</button>`;
    }

    // 下一页按钮，当前为最后一页时禁用
    html += `<button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px; white-space: nowrap;" onclick="window.${type}Page(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>`;
    html += '</div>';
    return html;
}

// ==================== 历史记录页面 ====================

/**
 * 渲染历史记录页面
 * 显示已处置事件的列表，支持时间筛选和分页
 * @returns {string} 历史记录页面的 HTML 字符串
 */
function renderHistoryPage() {
    // 获取当天默认时间范围
    const range = getTodayRange();
    // 如果开始时间未设置则使用默认值
    if (!historyStartTime) historyStartTime = range.start;
    // 如果结束时间未设置则使用默认值
    if (!historyEndTime) historyEndTime = range.end;

    // 获取所有已处置的事件
    const allEvents = getEvents().filter(e => e.status === 'resolved');
    // 按时间范围筛选事件
    const filteredEvents = filterEventsByTime(allEvents, historyStartTime, historyEndTime);
    // 计算总页数
    const totalPages = Math.ceil(filteredEvents.length / historyPageSize);
    // 计算当前页的起始索引
    const start = (historyPage - 1) * historyPageSize;
    // 截取当前页的事件数据
    const pageEvents = filteredEvents.slice(start, start + historyPageSize);

    // 返回完整的历史记录页面 HTML
    return `
        <div class="panel">
            <div class="panel-header">
                <div class="panel-title"><div class="panel-title-icon">📜</div><span>历史记录 (${filteredEvents.length} 条已处置)</span></div>
                <div class="action-bar">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="datetime-local" id="history-start-time" value="${historyStartTime}" onchange="window.setHistoryStartTime(this.value)" style="padding: 6px 10px; background: #1a2332; border: 1px solid #4a6fa5; border-radius: 6px; color: #fff; font-size: 13px; cursor: pointer;">
                        <span style="color: var(--text-muted); font-size: 12px;">至</span>
                        <input type="datetime-local" id="history-end-time" value="${historyEndTime}" onchange="window.setHistoryEndTime(this.value)" style="padding: 6px 10px; background: #1a2332; border: 1px solid #4a6fa5; border-radius: 6px; color: #fff; font-size: 13px; cursor: pointer;">
                    </div>
                    <button class="btn btn-secondary" onclick="refreshHistory()">🔄 刷新</button>
                    <button class="btn btn-danger" onclick="window.clearAllEvents()">🗑️ 清空所有</button>
                </div>
            </div>
            <div id="history-list-container">
                ${renderHistoryList(pageEvents)}
            </div>
            <div id="history-pagination">
                ${renderPagination(historyPage, totalPages, 'history')}
            </div>
        </div>`;
}

/**
 * 渲染历史记录列表
 * 以时间线卡片形式展示已处置事件
 * @param {Array} events - 已处置事件数组
 * @returns {string} 历史记录列表 HTML 字符串
 */
function renderHistoryList(events) {
    // 如果没有历史记录则显示提示
    if (events.length === 0) {
        return '<div style="padding: 40px; text-align: center; color: var(--text-muted);">暂无历史记录</div>';
    }

    // 初始化列表 HTML
    let html = '<div class="event-log" style="max-height: 600px; padding: 16px;">';
    // 遍历每条已处置事件
    events.forEach(e => {
        // 添加事件卡片，点击可查看详情
        html += `<div class="event-item low" style="cursor: pointer; margin-bottom: 8px;" onclick="window.viewEvent('${e.id}')">`;
        // 事件图标（已处置用绿色勾选）
        html += `<div class="event-icon low">✅</div>`;
        // 事件内容区域
        html += `<div class="event-content">`;
        // 事件标题
        html += `<div class="event-title">${e.title || '-'}</div>`;
        // 事件描述
        html += `<div class="event-desc">${e.desc || '-'}</div>`;
        // 事件元信息区域
        html += `<div class="event-meta">`;
        // 事件发生时间
        html += `<span class="event-time">${formatDateTime(e.createdAt)}</span>`;
        // 事件状态标签
        html += `<span class="event-status resolved">已处置</span>`;
        // 事件所属场景
        html += `<span style="color: var(--text-muted); font-size: 12px; margin-left: 8px;">${getSceneLabel(e.scene)}</span>`;
        html += `</div></div></div>`;
    });
    html += '</div>';
    return html;
}

// ==================== 系统设置页面 ====================

/**
 * 渲染系统设置页面
 * 包含告警阈值、通知开关、数据保留天数、数据管理等设置项
 * @returns {string} 系统设置页面的 HTML 字符串
 */
function renderSettingsPage() {
    // 获取当前系统设置
    const settings = getSettings();
    // 返回完整的系统设置页面 HTML
    return `
        <div class="panel">
            <div class="panel-header">
                <div class="panel-title"><div class="panel-title-icon">⚙️</div><span>系统设置</span></div>
            </div>
            <div style="padding: 20px;">
                <!-- 告警阈值设置 -->
                <div style="margin-bottom: 24px;">
                    <h4 style="color: #fff; margin: 0 0 8px; font-size: 14px;">告警阈值</h4>
                    <p style="color: var(--text-muted); font-size: 13px; margin: 0 0 12px;">AI 检测置信度低于此值不触发告警</p>
                    <input type="range" min="0" max="1" step="0.05" value="${settings.alertThreshold || 0.7}" onchange="window.updateSettingValue('alertThreshold', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;" style="width: 100%;">
                    <div style="text-align: right; font-size: 12px; color: var(--text-muted); margin-top: 4px;">${settings.alertThreshold || 0.7}</div>
                </div>
                <!-- 通知开关设置 -->
                <div style="margin-bottom: 24px;">
                    <h4 style="color: #fff; margin: 0 0 8px; font-size: 14px;">通知开关</h4>
                    <p style="color: var(--text-muted); font-size: 13px; margin: 0 0 12px;">是否启用浏览器通知推送</p>
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                        <input type="checkbox" ${settings.notificationEnabled ? 'checked' : ''} onchange="window.updateSettingValue('notificationEnabled', this.checked)" style="width: 18px; height: 18px;">
                        <span style="color: #fff; font-size: 13px;">启用通知</span>
                    </label>
                </div>
                <!-- 数据保留天数设置 -->
                <div style="margin-bottom: 24px;">
                    <h4 style="color: #fff; margin: 0 0 8px; font-size: 14px;">数据保留天数</h4>
                    <p style="color: var(--text-muted); font-size: 13px; margin: 0 0 12px;">超过此天数的记录将被自动清理</p>
                    <input type="number" min="1" max="365" value="${settings.dataRetention || 30}" onchange="window.updateSettingValue('dataRetention', parseInt(this.value))" style="width: 100px; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; font-size: 14px;"> 天
                </div>
                <!-- 数据管理设置 -->
                <div style="margin-bottom: 24px;">
                    <h4 style="color: #fff; margin: 0 0 8px; font-size: 14px;">数据管理</h4>
                    <p style="color: var(--text-muted); font-size: 13px; margin: 0 0 12px;">导入/导出事件数据 (CSV 格式)</p>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-primary" onclick="window.downloadCSV()">📥 导出 CSV</button>
                        <label class="btn btn-secondary" style="cursor: pointer;">
                            📤 导入 CSV
                            <input type="file" accept=".csv" style="display: none;" onchange="window.handleCSVImport(this)">
                        </label>
                    </div>
                </div>
                <!-- 危险操作区域 -->
                <div style="display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <button class="btn btn-danger" onclick="window.clearAllEvents()">🗑️ 清空所有数据</button>
                    <button class="btn btn-secondary" onclick="window.resetAllSettings()">🔄 重置为默认</button>
                </div>
            </div>
        </div>`;
}

// ==================== 地图视图 ====================

/**
 * 渲染地图视图页面
 * 以可视化地图形式展示各监控点位的分布和状态
 * @returns {string} 地图视图页面的 HTML 字符串
 */
function renderMapView() {
    // 获取所有事件数据
    const events = getEvents();

    // 定义监控点位数据（位置坐标和摄像头数量）
    const mapPoints = [
        { id: 'subway', name: '地铁站台', x: '30%', y: '40%', cameras: 4 },
        { id: 'nursing', name: '养老院', x: '60%', y: '25%', cameras: 4 },
        { id: 'hospital', name: '医院急诊', x: '45%', y: '65%', cameras: 4 },
        { id: 'airport', name: '机场大厅', x: '75%', y: '55%', cameras: 4 }
    ].map(point => ({
        ...point,
        // 判断该点位是否有待处置的告警
        active: events.some(e => e.status === 'pending' && e.scene === point.id)
    }));

    // 构建监控点位 HTML
    let pointsHTML = '';
    mapPoints.forEach(point => {
        // 根据状态确定点位颜色（告警红色，正常绿色）
        const pointColor = point.active ? '#ef4444' : '#10b981';
        // 根据状态确定点位图标
        const pointIcon = point.active ? '🚨' : '📡';
        // 添加点位 HTML，包含悬停提示
        pointsHTML += `
            <div style="position: absolute; left: ${point.x}; top: ${point.y}; transform: translate(-50%, -50%); cursor: pointer;" onmouseenter="this.style.zIndex='100'" onmouseleave="this.style.zIndex='10'">
                <div style="width: 40px; height: 40px; background: ${pointColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 0 15px ${pointColor}; border: 2px solid rgba(255,255,255,0.3); z-index: 10;">
                    ${pointIcon}
                </div>
                <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px; white-space: nowrap; background: rgba(0,0,0,0.8); padding: 4px 10px; border-radius: 4px; color: #fff; font-size: 12px; opacity: 0; transition: opacity 0.2s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'">
                    ${point.name}<br>摄像头: ${point.cameras}
                </div>
            </div>
        `;
    });

    // 返回完整的地图视图 HTML
    return `
        <div class="panel">
            <div class="panel-header">
                <div class="panel-title"><div class="panel-title-icon">🗺️</div><span>地图视图</span></div>
                <div class="action-bar">
                    <span style="color: var(--text-muted); font-size: 13px; margin-right: 16px;">📍 4 个监控点位</span>
                    <span style="color: #10b981; font-size: 13px;">● 正常: ${mapPoints.filter(p => !p.active).length}</span>
                    <span style="color: #ef4444; font-size: 13px; margin-left: 12px;">● 告警: ${mapPoints.filter(p => p.active).length}</span>
                </div>
            </div>
            <!-- 地图画布区域 -->
            <div style="height: 450px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 8px; position: relative; overflow: hidden;">
                <!-- 网格背景 -->
                <div style="position: absolute; inset: 0; opacity: 0.1;">
                    <svg width="100%" height="100%">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" stroke-width="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
                <!-- 地图标题 -->
                <div style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 6px;">
                    <div style="color: #fff; font-size: 13px; font-weight: 600;">监控区域分布</div>
                </div>
                <!-- 图例 -->
                <div style="position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%;"></div><span style="color: #fff; font-size: 12px;">正常运行</span></div>
                    <div style="display: flex; align-items: center; gap: 8px;"><div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%;"></div><span style="color: #fff; font-size: 12px;">存在告警</span></div>
                </div>
                <!-- 监控点位 -->
                ${pointsHTML}
            </div>
        </div>`;
}

// ==================== 模态框 ====================

/**
 * 显示关于产品弹窗
 * 显示产品的版本信息、技术栈等介绍
 */
export function showAboutModal() {
    // 获取关于产品弹窗元素
    const modal = document.getElementById('modal');
    // 如果弹窗存在则显示
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * 关闭模态框
 * 点击遮罩层或关闭按钮时关闭弹窗
 * @param {Event} event - 点击事件对象
 */
export function closeModal(event) {
    // 如果没有事件对象（直接调用）或点击的是遮罩层
    if (!event || event.target.classList.contains('modal-overlay')) {
        // 获取关于产品弹窗
        const modal = document.getElementById('modal');
        // 获取截图详情弹窗
        const screenshotModal = document.getElementById('screenshot-modal');
        // 关闭关于产品弹窗
        if (modal) modal.classList.remove('show');
        // 关闭截图详情弹窗
        if (screenshotModal) screenshotModal.classList.remove('show');
    }
}

/**
 * 获取当前视图名称
 * 供外部模块查询当前激活的视图
 * @returns {string} 当前视图名称
 */
export function getCurrentView() {
    return currentView;
}

// ==================== 辅助函数 ====================

/**
 * 获取级别标签
 * 将告警级别英文标识转换为中文
 * @param {string} level - 告警级别（high/medium/low）
 * @returns {string} 中文级别标签
 */
function getLevelLabel(level) {
    // 级别映射表
    const labels = { high: '高', medium: '中', low: '低' };
    // 返回对应中文标签，如果不存在则返回原标识
    return labels[level] || level;
}

/**
 * 获取状态标签
 * 将事件状态英文标识转换为中文
 * @param {string} status - 事件状态（pending/processing/resolved）
 * @returns {string} 中文状态标签
 */
function getStatusLabel(status) {
    // 状态映射表
    const labels = { pending: '待处置', processing: '处置中', resolved: '已处置' };
    // 返回对应中文标签，如果不存在则返回原标识
    return labels[status] || status;
}

/**
 * 格式化日期时间
 * 将 ISO 日期字符串格式化为本地化的中文日期时间格式
 * @param {string} dateStr - ISO 日期字符串
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTime(dateStr) {
    // 如果日期字符串为空则返回占位符
    if (!dateStr) return '-';
    // 解析日期字符串为 Date 对象
    const date = new Date(dateStr);
    // 返回本地化的中文日期时间格式（月/日 时:分:秒）
    return date.toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

// ==================== 全局暴露函数 ====================

// 刷新事件列表（供外部调用）
window.refreshEvents = function() {
    // 只在当前视图是事件列表时执行刷新
    if (getCurrentView() === 'events') {
        refreshEventsTableOnly();
    }
};

// 刷新历史记录（供外部调用）
window.refreshHistory = function() {
    // 只在当前视图是历史记录时执行刷新
    if (getCurrentView() === 'history') {
        refreshHistoryListOnly();
    }
};

/**
 * 筛选事件
 * 根据搜索词、级别和状态筛选事件列表
 * @param {string} searchTerm - 搜索关键词
 */
window.filterEvents = function(searchTerm) {
    // 获取级别筛选下拉框
    const levelFilter = document.getElementById('event-filter-level');
    // 获取状态筛选下拉框
    const statusFilter = document.getElementById('event-filter-status');
    // 获取选中的级别值
    const level = levelFilter ? levelFilter.value : '';
    // 获取选中的状态值
    const status = statusFilter ? statusFilter.value : '';

    // 构建筛选条件对象
    const filters = {};
    // 如果选择了级别则添加到筛选条件
    if (level) filters.level = level;
    // 如果选择了状态则添加到筛选条件
    if (status) filters.status = status;

    // 使用筛选条件查询事件
    let events = queryEvents(filters);

    // 如果有搜索词则进一步按标题和描述过滤
    if (searchTerm && searchTerm.trim()) {
        // 将搜索词转为小写用于不区分大小写匹配
        const term = searchTerm.trim().toLowerCase();
        // 过滤标题或描述包含搜索词的事件
        events = events.filter(e =>
            (e.title && e.title.toLowerCase().includes(term)) ||
            (e.desc && e.desc.toLowerCase().includes(term))
        );
    }

    // 获取表格容器并更新内容
    const container = document.getElementById('events-table-container');
    if (container) {
        container.innerHTML = renderEventsTable(events);
    }
};

/**
 * 查看事件详情
 * 弹出模态框显示事件的完整信息
 * @param {string} id - 事件唯一标识
 */
window.viewEvent = function(id) {
    // 查询所有事件并找到指定 ID 的事件
    const event = queryEvents({ limit: 1000 }).find(e => e.id === id);
    // 如果事件不存在则显示错误提示
    if (!event) {
        showToast('error', '错误', '事件不存在');
        return;
    }

    // 创建详情弹窗元素
    const modal = document.createElement('div');
    // 设置弹窗样式类名
    modal.className = 'modal-overlay show';
    // 设置较高的层级确保弹窗在最上层
    modal.style.zIndex = '2000';
    // 设置弹窗 HTML 内容
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <div class="modal-title">📋 事件详情</div>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 12px;"><strong style="color: #fff; display: inline-block; width: 80px;">标题:</strong> <span style="color: #fff;">${event.title || '-'}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #fff; display: inline-block; width: 80px;">描述:</strong> <span style="color: var(--text-muted);">${event.desc || '-'}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #fff; display: inline-block; width: 80px;">级别:</strong> <span class="event-status ${event.level}">${getLevelLabel(event.level)}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #fff; display: inline-block; width: 80px;">状态:</strong> <span class="event-status ${event.status}">${getStatusLabel(event.status)}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #fff; display: inline-block; width: 80px;">场景:</strong> <span style="color: var(--text-muted);">${getSceneLabel(event.scene)}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #fff; display: inline-block; width: 80px;">类型:</strong> <span style="color: var(--text-muted);">${getTypeLabel(event.type)}</span></div>
                <div style="margin-bottom: 12px;"><strong style="color: #fff; display: inline-block; width: 80px;">时间:</strong> <span style="color: var(--text-muted);">${formatDateTime(event.createdAt)}</span></div>
                ${event.screenshot ? `<div style="margin-top: 16px;"><img src="${event.screenshot}" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color);"></div>` : ''}
            </div>
        </div>`;
    // 将弹窗添加到页面主体
    document.body.appendChild(modal);
};

/**
 * 处置事件
 * 将指定事件标记为已处置状态
 * @param {string} id - 事件唯一标识
 */
window.resolveEvent = function(id) {
    // 更新事件状态为已处置
    updateEvent(id, { status: 'resolved' });
    // 显示处置成功提示
    showToast('success', '处置成功', '事件已标记为已处置');
    // 刷新事件列表显示
    refreshEvents();
};

/**
 * 删除事件
 * 删除指定的事件记录
 * @param {string} id - 事件唯一标识
 */
window.deleteEventItem = function(id) {
    // 弹出确认对话框，防止误操作
    if (confirm('确定要删除此事件吗？')) {
        // 从存储中删除事件
        deleteEvent(id);
        // 显示删除成功提示
        showToast('success', '删除成功', '事件已删除');
        // 刷新事件列表显示
        refreshEvents();
    }
};

/**
 * 清空所有事件
 * 删除所有事件记录并重置分页状态
 */
window.clearAllEvents = function() {
    // 弹出确认对话框，警告此操作不可恢复
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        // 清空所有事件数据
        clearEvents();
        // 显示清空成功提示
        showToast('success', '清空成功', '所有数据已清空');
        // 重置事件列表页码到第一页
        eventsPage = 1;
        // 重置历史记录页码到第一页
        historyPage = 1;
        // 刷新事件列表
        refreshEvents();
        // 刷新历史记录
        refreshHistory();
    }
};

/**
 * 设置事件列表开始时间
 * 更新筛选条件并刷新列表
 * @param {string} value - 开始时间字符串
 */
window.setEventsStartTime = function(value) {
    // 更新开始时间状态
    eventsStartTime = value;
    // 重置到第一页（筛选条件变化后应从第一页开始查看）
    eventsPage = 1;
    // 刷新事件列表
    refreshEvents();
};

/**
 * 设置事件列表结束时间
 * 更新筛选条件并刷新列表
 * @param {string} value - 结束时间字符串
 */
window.setEventsEndTime = function(value) {
    // 更新结束时间状态
    eventsEndTime = value;
    // 重置到第一页
    eventsPage = 1;
    // 刷新事件列表
    refreshEvents();
};

/**
 * 事件列表分页跳转
 * 跳转到指定页码并刷新列表
 * @param {number} page - 目标页码
 */
window.eventsPage = function(page) {
    // 获取所有事件计算总页数
    const totalPages = Math.ceil(getEvents().length / eventsPageSize);
    // 如果页码超出范围则不做任何操作
    if (page < 1 || page > totalPages) return;
    // 更新当前页码
    eventsPage = page;
    // 刷新事件列表
    refreshEvents();
};

/**
 * 设置历史记录开始时间
 * 更新筛选条件并刷新列表
 * @param {string} value - 开始时间字符串
 */
window.setHistoryStartTime = function(value) {
    // 更新开始时间状态
    historyStartTime = value;
    // 重置到第一页
    historyPage = 1;
    // 刷新历史记录
    refreshHistory();
};

/**
 * 设置历史记录结束时间
 * 更新筛选条件并刷新列表
 * @param {string} value - 结束时间字符串
 */
window.setHistoryEndTime = function(value) {
    // 更新结束时间状态
    historyEndTime = value;
    // 重置到第一页
    historyPage = 1;
    // 刷新历史记录
    refreshHistory();
};

/**
 * 历史记录分页跳转
 * 跳转到指定页码并刷新列表
 * @param {number} page - 目标页码
 */
window.historyPage = function(page) {
    // 获取已处置事件
    const filteredEvents = getEvents().filter(e => e.status === 'resolved');
    // 计算总页数
    const totalPages = Math.ceil(filteredEvents.length / historyPageSize);
    // 如果页码超出范围则不做任何操作
    if (page < 1 || page > totalPages) return;
    // 更新当前页码
    historyPage = page;
    // 刷新历史记录
    refreshHistory();
};

/**
 * 更新设置值
 * 更新指定设置项的值并显示提示
 * @param {string} key - 设置项名称
 * @param {*} value - 设置项新值
 */
window.updateSettingValue = function(key, value) {
    // 调用存储模块更新设置
    updateSetting(key, value);
    // 显示更新成功提示
    showToast('success', '设置已更新', `${key} 已设置为 ${value}`);
};

/**
 * 重置所有设置
 * 将所有设置项恢复为默认值
 */
window.resetAllSettings = function() {
    // 弹出确认对话框
    if (confirm('确定要重置所有设置为默认值吗？')) {
        // 重置所有设置
        resetSettings();
        // 显示重置成功提示
        showToast('success', '重置成功', '设置已恢复为默认值');
        // 获取内容容器
        const content = document.getElementById('placeholder-content');
        // 如果当前在设置页面则重新渲染页面
        if (content && getCurrentView() === 'settings') {
            content.innerHTML = renderSettingsPage();
        }
    }
};

/**
 * 处理 CSV 文件导入
 * 读取用户选择的 CSV 文件并导入数据
 * @param {HTMLInputElement} input - 文件输入元素
 */
window.handleCSVImport = function(input) {
    // 获取用户选择的文件
    const file = input.files[0];
    // 如果没有选择文件则直接返回
    if (!file) return;
    // 创建文件读取器
    const reader = new FileReader();
    // 设置文件读取完成后的回调
    reader.onload = function(e) {
        // 调用存储模块导入 CSV 数据
        const result = importFromCSV(e.target.result);
        // 根据导入结果显示对应提示
        if (result.success) {
            showToast('success', '导入成功', result.message);
            refreshEvents();
        } else {
            showToast('error', '导入失败', result.message);
        }
    };
    // 以文本格式读取文件
    reader.readAsText(file);
};

// 页面卸载前停止自动刷新定时器，防止内存泄漏
window.addEventListener('beforeunload', function() {
    stopViewRefresh();
});
