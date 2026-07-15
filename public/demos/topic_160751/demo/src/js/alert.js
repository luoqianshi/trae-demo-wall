/**
 * 告警管理模块 - 负责告警触发、展示、处置等功能
 * 该模块是整个监控系统的核心，处理从检测到响应的全流程
 */

// 从 data.js 导入场景配置、检测标签和边界框位置数据
import { scenes, detectionLabels, bboxPositions } from './data.js';
// 从 camera.js 导入截图捕获功能，用于保存告警发生时的画面
import { captureScreenshot } from './camera.js';
// 从 storage.js 导入存储相关函数，用于事件的持久化与查询
import { saveEvent, updateEvent, getEventById, getTodayStats } from './storage.js';

// 累计触发的告警总数，用于统计面板展示
let alertCount = 0;
// 累计已处置的告警数量，用于计算处置率
let resolvedCount = 0;
// 最近一次告警触发时的截图数据（Base64 字符串），用于详情弹窗展示
let lastScreenshot = null;
// 最近一次检测框的位置信息（top/left/width/height），用于在截图上标注目标
let lastBboxPos = null;
// 最近一次告警的类型标识（如 fall、run、crowd 等），用于标签显示和逻辑判断
let lastAlertType = null;
// 最近一次检测的置信度（0.0 ~ 1.0），用于展示检测可信度
let lastConfidence = 0;
// 当前正在处理的事件 ID，用于关联告警横幅与事件日志中的记录
let currentEventId = null;

/**
 * 触发模拟告警
 * 该函数模拟一次完整的告警检测与上报流程，包括随机选择告警类型、
 * 生成截图、保存事件、更新 UI、触发响应动画，并在 5 秒后自动处置。
 * @param {string} sceneId - 当前场景ID，用于从 scenes 配置中读取对应场景的告警列表
 */
export function simulateAlert(sceneId) {
    // 根据传入的 sceneId 获取对应场景配置；若找不到则使用默认的 subway 场景，保证健壮性
    const scene = scenes[sceneId] || scenes.subway;
    // 从当前场景的 alerts 数组中随机选取一条告警配置，模拟真实场景中随机发生的事件
    const alert = scene.alerts[Math.floor(Math.random() * scene.alerts.length)];
    // 获取当前时间对象，用于生成时间戳字符串
    const now = new Date();
    // 将时间格式化为 HH:MM:SS 的 8 位字符串，用于横幅和日志展示
    const timeStr = now.toTimeString().slice(0, 8);

    // 调用摄像头模块捕获当前画面截图，用于后续保存和展示
    const screenshotData = captureScreenshot();
    // 将截图缓存到全局变量，供其他函数（如详情弹窗）复用
    lastScreenshot = screenshotData;

    // 获取预定义的边界框位置数组
    const positions = bboxPositions;
    // 随机选择一个边界框位置，使每次告警的检测框出现在不同区域，增强真实感
    lastBboxPos = positions[Math.floor(Math.random() * positions.length)];
    // 缓存当前告警类型，供后续详情弹窗和检测框标签使用
    lastAlertType = alert.type;
    // 生成 0.7 ~ 1.0 之间的随机置信度，模拟 AI 模型输出的高置信度检测结果
    lastConfidence = Math.random() * 0.3 + 0.7;

    // 将本次告警事件保存到本地存储（IndexedDB 或 localStorage），返回包含 id 的事件对象
    const savedEvent = saveEvent({
        title: alert.title,       // 告警标题，如"人员摔倒"
        desc: alert.desc,         // 告警详细描述
        level: alert.level,       // 告警级别（high / medium / low），决定 UI 颜色
        type: alert.type,         // 告警类型标识
        scene: sceneId,           // 所属场景 ID，便于按场景筛选
        status: 'pending',        // 初始状态为"待处置"
        icon: alert.icon,         // 展示用图标字符
        confidence: lastConfidence, // AI 检测置信度
        screenshot: screenshotData  // 告警瞬间的截图数据
    });
    
    // 保存当前事件的唯一 ID，用于后续自动处置时更新对应记录
    currentEventId = savedEvent.id;

    // 更新顶部告警横幅，展示当前告警的摘要信息
    updateAlertBanner(alert, timeStr);
    // 在视频画面上添加检测框覆盖层，标示异常目标位置
    addDetectionOverlay(alert.type);
    // 将新事件插入到右侧事件日志列表中
    addEventToDOM(savedEvent);

    // 累计告警计数加 1，用于更新统计面板
    alertCount++;
    // 刷新顶部统计数字（告警总数、已处置数、AI 响应数）
    updateStats();

    // 触发响应流程的阶梯动画（检测 → 分析 → 调度 → 处置），增强视觉反馈
    animateResponseFlow();
    // 弹出右上角 Toast 通知，第一时间引起用户注意
    showToast('error', '🚨 ' + alert.title, alert.desc);

    // 设置 5 秒定时器，模拟工作人员到场处置完成后自动解除告警
    setTimeout(() => resolveAlert(alert, savedEvent.id), 5000);
}

/**
 * 更新告警横幅
 * 将当前告警的关键信息（标题、描述、时间、级别、截图）渲染到顶部横幅组件中。
 * @param {Object} alert - 告警对象，包含 title / desc / level 等字段
 * @param {string} timeStr - 格式化后的时间字符串 HH:MM:SS
 */
function updateAlertBanner(alert, timeStr) {
    // 获取顶部告警横幅的 DOM 元素
    const banner = document.getElementById('alert-banner');
    // 若横幅元素不存在则直接返回，避免后续操作报错
    if (!banner) return;

    // 将最新截图设置到横幅左侧的缩略图 <img> 元素中
    document.getElementById('screenshot-img').src = lastScreenshot;
    // 设置告警标题文本
    document.getElementById('alert-title').textContent = alert.title;
    // 设置告警描述文本
    document.getElementById('alert-desc').textContent = alert.desc;
    // 设置告警触发时间
    document.getElementById('alert-time').textContent = timeStr;
    // 设置告警级别文本，并转换为大写形式（如 HIGH）以增强警示效果
    document.getElementById('alert-level').textContent = alert.level.toUpperCase();
    
    // 添加 CSS 类名使横幅从隐藏状态滑入显示
    banner.classList.add('show');
}

/**
 * 添加检测框覆盖层
 * 在视频画面上动态创建一个带标签的边界框，标示 AI 检测到的异常目标位置。
 * @param {string} type - 检测类型标识，如 fall / run / crowd / emergency
 */
export function addDetectionOverlay(type) {
    // 获取用于放置检测框的覆盖层容器
    const overlay = document.getElementById('detection-overlay');
    // 若容器不存在则直接退出，保证健壮性
    if (!overlay) return;

    // 使用最近一次缓存的边界框位置；若不存在则使用默认居中位置作为兜底
    const pos = lastBboxPos || { top: '40%', left: '40%', width: '13%', height: '18%' };
    // 判断当前检测类型是否属于需要高亮警示的告警类型（摔倒、紧急按钮、奔跑、聚集）
    const isAlert = ['fall', 'emergency', 'run', 'crowd'].includes(type);

    // 创建一个 div 元素作为检测框
    const bbox = document.createElement('div');
    // 设置 CSS 类名：基础样式 bbox，若属于告警类型则额外添加 alert 类以显示红色高亮边框
    bbox.className = `bbox ${isAlert ? 'alert' : ''}`;
    // 将位置参数应用到检测框的内联样式中，使其覆盖在视频画面正确区域
    Object.assign(bbox.style, {
        top: pos.top,       // 距离顶部的百分比位置
        left: pos.left,     // 距离左侧的百分比位置
        width: pos.width,   // 框的宽度占比
        height: pos.height  // 框的高度占比
    });
    // 在检测框内部插入标签，显示检测类型名称和置信度数值（保留两位小数）
    bbox.innerHTML = `<div class="bbox-label">${getLabel(type)} ${lastConfidence.toFixed(2)}</div>`;
    
    // 将检测框追加到覆盖层容器中，使其渲染在视频画面上方
    overlay.appendChild(bbox);

    // 设置 5 秒定时器，自动移除检测框，避免界面堆积
    setTimeout(() => bbox.remove(), 5000);
}

/**
 * 获取检测类型标签
 * 根据检测类型标识返回对应的中文描述，用于检测框标签和详情展示。
 * @param {string} type - 检测类型标识
 * @returns {string} 对应的中文标签，若找不到则返回默认"检测"
 */
function getLabel(type) {
    // 从 detectionLabels 映射表中查找对应标签；若未定义则返回兜底文本"检测"
    return detectionLabels[type] || '检测';
}

/**
 * 添加事件到 DOM
 * 将一条事件记录渲染为事件日志列表中的一项，插入到最顶部，并限制列表最大长度。
 * @param {Object} event - 事件对象，包含 id / title / desc / level / status / icon / createdAt 等字段
 */
export function addEventToDOM(event) {
    // 获取右侧事件日志列表容器
    const log = document.getElementById('event-log');
    // 若容器不存在则直接返回，防止空指针异常
    if (!log) return;

    // 优先使用事件创建时间生成时间字符串；若无创建时间则使用当前时间作为兜底
    const timeStr = event.createdAt ? new Date(event.createdAt).toTimeString().slice(0, 8) : new Date().toTimeString().slice(0, 8);
    
    // 创建事件项的容器 div
    const item = document.createElement('div');
    // 设置类名包含 event-item 和对应级别（high / medium / low），用于不同颜色的左边框样式
    item.className = `event-item ${event.level}`;
    // 将事件 ID 缓存到 dataset 中，便于后续根据 ID 查找和更新对应事件项
    item.dataset.eventId = event.id;
    
    // 根据事件状态映射为对应的中文状态文本，若状态异常则默认显示"待处置"
    const statusText = { pending: '待处置', processing: '处置中', resolved: '已处置' }[event.status || 'pending'] || '待处置';
    
    // 组装事件项的 HTML 结构：图标区 + 内容区（标题、描述、元信息）
    item.innerHTML = `
        <div class="event-icon ${event.level}">${event.icon || '⚠️'}</div>
        <div class="event-content">
            <div class="event-title">${event.title}</div>
            <div class="event-desc">${event.desc}</div>
            <div class="event-meta">
                <span class="event-time">${timeStr}</span>
                <span class="event-status ${event.status || 'pending'}">${statusText}</span>
            </div>
        </div>
    `;
    
    // 将新事件插入到列表最前面，使最新事件始终置顶显示
    log.insertBefore(item, log.firstChild);

    // 当列表中的事件项超过 20 条时，从末尾移除旧事件，防止 DOM 过度膨胀影响性能
    while (log.children.length > 20) {
        log.removeChild(log.lastChild);
    }
}

/**
 * 解决告警
 * 当告警处置完成后调用，隐藏横幅、更新存储状态、添加已处置记录到日志，并弹出成功提示。
 * @param {Object} alert - 告警对象
 * @param {string} eventId - 事件ID，用于更新对应存储记录的状态
 */
export function resolveAlert(alert, eventId) {
    // 获取顶部告警横幅元素
    const banner = document.getElementById('alert-banner');
    // 若横幅存在，则移除 show 类使其滑出隐藏
    if (banner) {
        banner.classList.remove('show');
    }

    // 生成当前时间字符串，用于已处置事件日志的展示
    const timeStr = new Date().toTimeString().slice(0, 8);
    
    // 若提供了有效的事件 ID，则将存储中该事件的状态更新为"已处置"
    if (eventId) {
        updateEvent(eventId, { status: 'resolved' });
    }
    
    // 构造一条"已处置"的衍生事件对象，用于在事件日志中展示处置结果
    const resolvedEvent = {
        id: eventId,                         // 保留原事件 ID，维持关联关系
        title: alert.title + ' · 已处置',     // 在原标题后追加处置状态标识
        desc: '工作人员已到场处理，险情解除', // 固定的处置完成描述
        level: 'low',                        // 处置完成后级别降为 low（绿色）
        icon: '✅',                          // 使用对勾图标表示完成
        status: 'resolved'                   // 状态标记为已处置
    };
    
    // 将已处置事件渲染到事件日志列表中
    addEventToDOM(resolvedEvent);
    // 累计已处置计数加 1
    resolvedCount++;
    // 刷新顶部统计数据
    updateStats();
    
    // 弹出绿色 Toast 通知，告知用户处置完成
    showToast('success', '✅ 处置完成', '险情已解除');
}

/**
 * 动画化响应流程
 * 依次高亮"检测 → 分析 → 调度 → 处置"四个步骤，模拟 AI 自动响应的完整流程。
 * 动画分阶段执行：逐个点亮当前步骤 → 全部标记完成 → 全部重置。
 */
export function animateResponseFlow() {
    // 定义四个响应步骤的 DOM 元素 ID，顺序对应处理流程
    const steps = ['step-detect', 'step-analyze', 'step-dispatch', 'step-resolve'];
    
    // 遍历每个步骤，设置递增的延时，实现依次点亮的阶梯动画效果
    steps.forEach((step, idx) => {
        setTimeout(() => {
            // 先清除所有步骤的 active 和 completed 状态，保证每次只高亮一个当前步骤
            document.querySelectorAll('.response-step').forEach(s => {
                s.classList.remove('active', 'completed');
            });
            
            // 将当前步骤之前的所有步骤标记为 completed（已完成）状态
            for (let i = 0; i < idx; i++) {
                document.getElementById(steps[i]).classList.add('completed');
            }
            
            // 将当前步骤标记为 active（进行中）状态，高亮显示
            document.getElementById(step).classList.add('active');
        }, idx * 700); // 每个步骤间隔 700 毫秒
    });

    // 在所有步骤依次点亮完成后，再过 500 毫秒，将所有步骤统一标记为 completed
    setTimeout(() => {
        document.querySelectorAll('.response-step').forEach(s => {
            s.classList.remove('active');
            s.classList.add('completed');
        });
    }, steps.length * 700 + 500);

    // 在全部标记完成后，再过 2500 毫秒，清除所有 completed 状态，恢复初始样式，为下一次动画做准备
    setTimeout(() => {
        document.querySelectorAll('.response-step').forEach(s => {
            s.classList.remove('completed');
        });
    }, steps.length * 700 + 2500);
}

/**
 * 更新统计数据
 * 将当前的告警总数、已处置数和 AI 响应数渲染到页面顶部的统计面板中。
 */
function updateStats() {
    // 获取告警总数对应的 DOM 元素
    const alertsEl = document.getElementById('stat-alerts');
    // 获取已处置数对应的 DOM 元素
    const resolvedEl = document.getElementById('stat-resolved');
    // 获取 AI 响应数对应的 DOM 元素
    const responsesEl = document.getElementById('ai-responses');

    // 若元素存在，则更新告警总数文本
    if (alertsEl) alertsEl.textContent = alertCount;
    // 若元素存在，则更新已处置数文本
    if (resolvedEl) resolvedEl.textContent = resolvedCount;
    // 若元素存在，则更新 AI 响应数；基础值 156 加上当前累计告警数，并做本地化数字格式（如千分位）
    if (responsesEl) responsesEl.textContent = (156 + alertCount).toLocaleString();
}

/**
 * 显示Toast通知
 * 在页面右下角弹出一条临时通知，4 秒后自动淡出消失。
 * @param {string} type - 通知类型（success / error / warning / info），决定颜色和图标
 * @param {string} title - 通知标题
 * @param {string} desc - 通知描述
 */
export function showToast(type, title, desc) {
    // 获取 Toast 容器的 DOM 元素
    const container = document.getElementById('toast-container');
    // 若容器不存在则直接退出
    if (!container) return;

    // 创建 Toast 项的 div 元素
    const toast = document.createElement('div');
    // 设置类名包含基础样式 toast 和类型样式（如 error），用于背景色和边框色区分
    toast.className = `toast ${type}`;
    
    // 定义不同类型对应的图标映射表
    const icons = { success: '✅', error: '🚨', warning: '⚠️', info: 'ℹ️' };
    
    // 组装 Toast 的 HTML：左侧图标 + 右侧文本（标题和描述）
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
        <div class="toast-text">
            <div class="toast-title">${title}</div>
            <div class="toast-desc">${desc}</div>
        </div>
    `;
    
    // 将 Toast 追加到容器中，立即显示在页面上
    container.appendChild(toast);

    // 设置 4 秒定时器，触发淡出动画：降低透明度并向右位移
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        // 在 CSS 过渡动画（300 毫秒）完成后，从 DOM 中彻底移除 Toast 元素
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * 显示截图详情
 * 弹出模态框，展示最近一次告警的截图、检测框位置、类型标签和元数据信息。
 */
export function showScreenshotDetail() {
    // 若尚未产生任何告警截图，则直接退出，避免展示空内容
    if (!lastScreenshot) return;

    // 获取截图详情弹窗的 DOM 元素
    const modal = document.getElementById('screenshot-modal');
    // 若弹窗元素不存在则直接返回
    if (!modal) return;

    // 将最近一次截图设置到弹窗中的大图中
    document.getElementById('detail-screenshot').src = lastScreenshot;
    
    // 获取详情弹窗中的检测框元素
    const bbox = document.getElementById('detail-bbox');
    // 若存在缓存的边界框位置，则应用到详情弹窗的检测框上并显示；否则隐藏检测框
    if (lastBboxPos) {
        Object.assign(bbox.style, lastBboxPos);
        bbox.style.display = 'block';
    } else {
        bbox.style.display = 'none';
    }

    // 设置检测框标签的文本内容（如"人员摔倒 检测框"）
    document.getElementById('detail-label').textContent = `${getLabel(lastAlertType)} 检测框`;
    // 将标签的水平位置与检测框的 left 对齐，使标签悬停于框上方
    document.getElementById('detail-label').style.left = lastBboxPos ? lastBboxPos.left : '0';
    
    // 填充弹窗底部的元数据信息：当前时间、检测类型、置信度百分比
    document.getElementById('meta-time').textContent = new Date().toLocaleTimeString();
    document.getElementById('meta-type').textContent = getLabel(lastAlertType);
    document.getElementById('meta-conf').textContent = (lastConfidence * 100).toFixed(1) + '%';
    
    // 添加 show 类，使弹窗从隐藏状态渐显或滑入
    modal.classList.add('show');
}

/**
 * 获取告警统计
 * 提供对外接口，返回当前累计的告警总数和已处置数量。
 * @returns {Object} 包含 alertCount（告警总数）和 resolvedCount（已处置数）的对象
 */
export function getAlertStats() {
    // 以对象形式返回两个统计变量，供外部模块读取和展示
    return { alertCount, resolvedCount };
}
