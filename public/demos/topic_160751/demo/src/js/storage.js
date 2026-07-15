/**
 * 数据存储模块 - 负责 localStorage 持久化、CSV 导出/导入等功能
 * 该模块封装了所有与浏览器 localStorage 交互的逻辑，提供事件、统计、设置的读写方法
 */

// 存储键名常量对象，集中管理所有 localStorage 使用的键名，避免硬编码字符串导致的拼写错误
const STORAGE_KEYS = {
    // 事件数据存储键
    EVENTS: 'zm_events',
    // 用户设置存储键
    SETTINGS: 'zm_settings',
    // 统计数据存储键
    STATS: 'zm_stats',
    // 摄像头状态存储键
    CAMERA_STATUS: 'zm_camera_status'
};

/**
 * 初始化存储系统
 * 在应用启动时调用，确保各项默认数据已存在于 localStorage 中，
 * 同时清理已有事件数据中的 screenshot 字段并限制事件数量，防止超出浏览器存储配额
 */
export function initStorage() {
    // 检查 localStorage 中是否已存在事件数据
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
        // 如果不存在，初始化一个空数组并写入 localStorage
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    } else {
        // 如果已存在事件数据，执行数据清理逻辑
        try {
            // 从 localStorage 读取现有事件数组
            const events = getEvents();
            // 标记是否需要将清理后的数据写回存储，初始为 false
            let needUpdate = false;
            // 遍历所有事件对象，清理 screenshot 字段
            events.forEach(e => {
                // 如果事件对象包含 screenshot 属性（图片 Base64 数据体积大），则删除该属性
                if (e.screenshot) {
                    delete e.screenshot;
                    // 数据发生变更，设置更新标记
                    needUpdate = true;
                }
            });
            // 限制最多保留 100 条事件，防止 localStorage 配额超限
            if (events.length > 100) {
                // 删除索引 100 之后的所有元素（保留最新的前 100 条，因为新事件 unshift 到头部）
                events.splice(100);
                // 设置更新标记
                needUpdate = true;
            }
            // 如果数据经过清理，将更新后的数组重新序列化并写回 localStorage
            if (needUpdate) {
                localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
            }
        } catch (e) {
            // 如果 JSON 解析失败（数据可能已损坏），重置为空数组以保证后续逻辑正常
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
        }
    }
    // 检查是否已存在设置数据，若不存在则写入默认设置
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        // 定义默认配置对象
        const defaultSettings = {
            // 告警置信度阈值，超过此值触发告警
            alertThreshold: 0.7,
            // 是否启用浏览器桌面通知
            notificationEnabled: true,
            // 是否自动将已处理事件标记为 resolved
            autoResolve: true,
            // 数据保留天数
            dataRetention: 30
        };
        // 将默认设置序列化为 JSON 字符串后存入 localStorage
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
    // 检查是否已存在统计数据，若不存在则写入默认统计值
    if (!localStorage.getItem(STORAGE_KEYS.STATS)) {
        // 定义默认统计对象
        const defaultStats = {
            // 事件总数
            totalEvents: 0,
            // 已解决事件数
            resolvedEvents: 0,
            // 误报数
            falsePositives: 0,
            // 平均响应时间（毫秒或秒）
            avgResponseTime: 0
        };
        // 将默认统计数据序列化后存入 localStorage
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(defaultStats));
    }
}

// ==================== 事件数据操作 ====================

/**
 * 保存事件到 localStorage
 * @param {Object} event - 待保存的事件对象，可包含 title、desc、level、status、type、scene 等字段
 * @returns {Object} - 保存后的事件对象，包含自动生成的 id 和 createdAt / updatedAt 时间戳
 */
export function saveEvent(event) {
    // 获取当前所有事件数组
    const events = getEvents();
    // 解构出 screenshot 字段并将其丢弃，剩余字段存入新对象，避免大图占满 localStorage 配额
    const { screenshot, ...eventWithoutScreenshot } = event;
    // 构建新事件对象，补充系统生成的元数据
    const newEvent = {
        // 生成唯一标识符
        id: generateId(),
        // 合并传入的其余字段
        ...eventWithoutScreenshot,
        // 设置创建时间为当前 ISO 格式时间字符串
        createdAt: new Date().toISOString(),
        // 设置更新时间初始值与创建时间相同
        updatedAt: new Date().toISOString()
    };
    // 将新事件插入数组头部（保证列表按时间倒序排列）
    events.unshift(newEvent);
    try {
        // 尝试将更新后的事件数组序列化写入 localStorage
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (e) {
        // 捕获异常，通常是 QuotaExceededError（存储配额超限）
        // 如果事件数量超过 50 条，删除旧数据（保留前 50 条）后重试写入
        if (events.length > 50) {
            // 从索引 50 开始删除后续所有元素
            events.splice(50);
            // 重新写入缩减后的数组
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        } else {
            // 若数据量已很小但仍超限，向上抛出异常供调用方处理
            throw e;
        }
    }
    // 更新统计中的 totalEvents 为当前事件数组长度
    updateStats('totalEvents', events.length);
    // 返回已保存的新事件对象，供调用方使用（如显示详情、触发通知等）
    return newEvent;
}

/**
 * 获取所有已保存的事件
 * @returns {Array} - 事件对象数组，若未初始化则返回空数组
 */
export function getEvents() {
    // 从 localStorage 读取事件数据的 JSON 字符串
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    // 如果数据存在则解析为 JavaScript 数组，否则返回空数组
    return data ? JSON.parse(data) : [];
}

/**
 * 根据条件查询过滤事件
 * @param {Object} [filters={}] - 过滤条件对象，可选字段包括 level、status、type、scene、startDate、endDate、limit
 * @returns {Array} - 符合所有过滤条件的事件数组
 */
export function queryEvents(filters = {}) {
    // 获取全部事件作为查询基础数据
    let events = getEvents();

    // 如果指定了 level 过滤条件，仅保留 level 严格匹配的事件
    if (filters.level) {
        events = events.filter(e => e.level === filters.level);
    }
    // 如果指定了 status 过滤条件，仅保留 status 严格匹配的事件
    if (filters.status) {
        events = events.filter(e => e.status === filters.status);
    }
    // 如果指定了 type 过滤条件，仅保留 type 严格匹配的事件
    if (filters.type) {
        events = events.filter(e => e.type === filters.type);
    }
    // 如果指定了 scene 过滤条件，仅保留 scene 严格匹配的事件
    if (filters.scene) {
        events = events.filter(e => e.scene === filters.scene);
    }
    // 如果指定了 startDate（起始日期），仅保留创建时间不早于该日期的事件
    if (filters.startDate) {
        events = events.filter(e => new Date(e.createdAt) >= new Date(filters.startDate));
    }
    // 如果指定了 endDate（结束日期），仅保留创建时间不晚于该日期的事件
    if (filters.endDate) {
        events = events.filter(e => new Date(e.createdAt) <= new Date(filters.endDate));
    }
    // 如果指定了 limit（数量限制），截取数组前 limit 条记录
    if (filters.limit) {
        events = events.slice(0, filters.limit);
    }

    // 返回经过所有过滤条件筛选后的事件数组
    return events;
}

/**
 * 根据 ID 查找单个事件
 * @param {string} id - 事件唯一标识符
 * @returns {Object|null} - 匹配的事件对象；若未找到则返回 null
 */
export function getEventById(id) {
    // 读取全部事件数组
    const events = getEvents();
    // 使用 find 方法查找 id 匹配的事件；若不存在返回 undefined，再通过 || 转为 null
    return events.find(e => e.id === id) || null;
}

/**
 * 更新指定事件的部分字段
 * @param {string} id - 待更新事件的唯一标识符
 * @param {Object} updates - 包含需要更新的字段及其新值的对象
 * @returns {Object|null} - 更新后的事件对象；若事件不存在则返回 null
 */
export function updateEvent(id, updates) {
    // 获取当前全部事件数组
    const events = getEvents();
    // 查找目标事件在数组中的索引位置
    const index = events.findIndex(e => e.id === id);
    // 如果索引为 -1，说明未找到对应事件，直接返回 null
    if (index === -1) return null;

    // 使用展开运算符合并原有字段与更新字段，并刷新 updatedAt 时间戳
    events[index] = {
        ...events[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    // 将更新后的数组序列化写回 localStorage
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

    // 如果更新操作将事件状态设为 resolved，则同步增加已解决事件的统计计数
    if (updates.status === 'resolved') {
        // 获取当前统计数据
        const stats = getStats();
        // 将 resolvedEvents 计数加 1，若原值不存在则视为 0
        updateStats('resolvedEvents', (stats.resolvedEvents || 0) + 1);
    }

    // 返回更新后的事件对象
    return events[index];
}

/**
 * 删除指定事件
 * @param {string} id - 待删除事件的唯一标识符
 * @returns {boolean} - 删除成功返回 true，未找到该事件返回 false
 */
export function deleteEvent(id) {
    // 获取当前全部事件数组
    const events = getEvents();
    // 查找目标事件索引
    const index = events.findIndex(e => e.id === id);
    // 若未找到对应事件，返回 false 表示删除失败
    if (index === -1) return false;

    // 从数组中移除目标事件（splice 会改变原数组）
    events.splice(index, 1);
    // 将更新后的数组写回 localStorage
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    // 同步更新统计数据中的 totalEvents 为当前剩余事件数
    updateStats('totalEvents', events.length);
    // 返回 true 表示删除成功
    return true;
}

/**
 * 清空所有事件数据
 * 同时重置 totalEvents 和 resolvedEvents 统计计数为 0
 */
export function clearEvents() {
    // 将事件存储项重置为空数组
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    // 将事件总数统计重置为 0
    updateStats('totalEvents', 0);
    // 将已解决事件数统计重置为 0
    updateStats('resolvedEvents', 0);
}

// ==================== 统计数据操作 ====================

/**
 * 获取统计数据对象
 * @returns {Object} - 统计键值对象；若不存在则返回空对象
 */
export function getStats() {
    // 从 localStorage 读取统计数据的 JSON 字符串
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    // 若数据存在则解析为对象返回，否则返回空对象
    return data ? JSON.parse(data) : {};
}

/**
 * 直接设置（覆盖）指定统计项的值
 * @param {string} key - 统计项名称，如 'totalEvents'、'resolvedEvents'
 * @param {*} value - 要赋给该统计项的新值
 */
export function updateStats(key, value) {
    // 读取当前完整统计对象
    const stats = getStats();
    // 更新指定键对应的值
    stats[key] = value;
    // 将更新后的统计对象序列化写回 localStorage
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

/**
 * 对指定统计项进行增量累加
 * @param {string} key - 统计项名称
 * @param {number} [amount=1] - 增量，默认为 1
 */
export function incrementStats(key, amount = 1) {
    // 读取当前统计对象
    const stats = getStats();
    // 若该统计项当前不存在或为 undefined，则视为 0，然后加上增量 amount
    stats[key] = (stats[key] || 0) + amount;
    // 写回 localStorage
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

// ==================== 设置操作 ====================

/**
 * 获取用户设置对象
 * @returns {Object} - 设置键值对象；若不存在则返回空对象
 */
export function getSettings() {
    // 从 localStorage 读取设置数据的 JSON 字符串
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    // 存在则解析并返回对象，否则返回空对象
    return data ? JSON.parse(data) : {};
}

/**
 * 更新单个设置项的值
 * @param {string} key - 设置项名称
 * @param {*} value - 新的设置值
 */
export function updateSetting(key, value) {
    // 读取当前完整设置对象
    const settings = getSettings();
    // 更新指定键对应的值
    settings[key] = value;
    // 将更新后的设置对象序列化写回 localStorage
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

/**
 * 重置所有设置为默认值
 * 会覆盖用户已修改的所有设置项
 */
export function resetSettings() {
    // 定义默认配置对象，与 initStorage 中保持一致
    const defaultSettings = {
        // 告警阈值：当模型置信度超过 0.7 时触发告警
        alertThreshold: 0.7,
        // 是否启用系统桌面通知
        notificationEnabled: true,
        // 检测到异常后是否自动标记为已解决（通常用于误报自动忽略场景）
        autoResolve: true,
        // 默认数据保留 30 天
        dataRetention: 30
    };
    // 将默认设置写入 localStorage，覆盖现有设置
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
}

// ==================== CSV 导出/导入 ====================

/**
 * 将当前所有事件数据导出为 CSV 格式字符串
 * @returns {string} - CSV 格式文本；若没有任何事件则返回空字符串
 */
export function exportToCSV() {
    // 获取全部事件数组
    const events = getEvents();
    // 若事件数组为空，直接返回空字符串，避免导出只有表头的无效 CSV
    if (events.length === 0) return '';

    // 定义 CSV 表头列名（与导入时解析逻辑对应）
    const headers = ['ID', '标题', '描述', '级别', '状态', '类型', '场景', '创建时间', '更新时间'];
    // 将每个事件对象映射为按表头顺序排列的字段值数组
    const rows = events.map(e => [
        // 事件唯一标识
        e.id,
        // 标题字段做双引号转义并包裹双引号，防止 CSV 内容中包含逗号破坏列结构
        `"${(e.title || '').replace(/"/g, '""')}"`,
        // 描述字段同样做双引号转义处理
        `"${(e.desc || '').replace(/"/g, '""')}"`,
        // 级别（如 high / medium / low），若不存在则输出空字符串
        e.level || '',
        // 状态（如 pending / resolved）
        e.status || '',
        // 事件类型
        e.type || '',
        // 发生场景
        e.scene || '',
        // 创建时间 ISO 字符串
        e.createdAt || '',
        // 最后更新时间 ISO 字符串
        e.updatedAt || ''
    ]);

    // 将表头数组与每一行数组分别用逗号连接成字符串，最终再用换行符拼接成完整 CSV 文本
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 将事件数据导出并触发浏览器下载 CSV 文件
 * @param {string} [filename='zm_events.csv'] - 下载时使用的文件名，默认为 zm_events.csv
 */
export function downloadCSV(filename = 'zm_events.csv') {
    // 调用 exportToCSV 生成 CSV 文本内容
    const csv = exportToCSV();
    // 如果没有任何数据，弹出提示并终止下载
    if (!csv) {
        alert('没有数据可导出');
        return;
    }

    // 创建 Blob 对象，以 UTF-8 BOM（\ufeff）开头，确保 Excel 等软件正确识别中文编码
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    // 生成 Blob 的临时 Object URL
    const url = URL.createObjectURL(blob);
    // 动态创建一个隐藏的 <a> 标签用于触发下载
    const link = document.createElement('a');
    // 设置下载链接为 Blob URL
    link.href = url;
    // 设置下载文件名
    link.download = filename;
    // 模拟点击，触发浏览器下载行为
    link.click();
    // 释放 Object URL，避免内存泄漏
    URL.revokeObjectURL(url);
}

/**
 * 从 CSV 文本内容导入事件数据
 * @param {string} csvContent - 用户上传或粘贴的 CSV 字符串
 * @returns {Object} - 导入结果对象，包含 success（布尔）、count（成功条数）、message（提示信息）
 */
export function importFromCSV(csvContent) {
    try {
        // 按换行符分割 CSV 文本，并过滤掉仅包含空白字符的空行
        const lines = csvContent.split('\n').filter(line => line.trim());
        // 如果有效行数少于 2（至少需要一行表头 + 一行数据），判定格式错误
        if (lines.length < 2) {
            return { success: false, message: 'CSV 文件为空或格式错误' };
        }

        // 解析第一行为表头，去除首尾空白并统一转小写（便于后续 switch 分支匹配）
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        // 用于收集本次成功导入的事件对象
        const imported = [];

        // 从第二行开始遍历所有数据行（索引 1 至末尾）
        for (let i = 1; i < lines.length; i++) {
            // 使用自定义解析函数处理 CSV 行，支持双引号包裹的字段及内部转义双引号
            const values = parseCSVLine(lines[i]);
            // 初始化空事件对象
            const event = {};

            // 遍历表头，根据列名将对应值映射到事件对象的属性上
            headers.forEach((header, idx) => {
                // 获取当前列的值，若不存在则默认为空字符串
                const value = values[idx] || '';
                // 根据表头名称将值写入对应字段
                switch (header) {
                    case 'id': event.id = value; break;
                    case '标题': event.title = value; break;
                    case '描述': event.desc = value; break;
                    case '级别': event.level = value; break;
                    case '状态': event.status = value; break;
                    case '类型': event.type = value; break;
                    case '场景': event.scene = value; break;
                    case '创建时间': event.createdAt = value; break;
                    case '更新时间': event.updatedAt = value; break;
                }
            });

            // 标记该事件为导入来源，便于界面区分展示
            event.imported = true;
            // 将构建好的事件加入导入列表
            imported.push(event);
            // 调用 saveEvent 将事件持久化到 localStorage
            saveEvent(event);
        }

        // 返回导入成功的结果，包含导入条数及提示信息
        return { success: true, count: imported.length, message: `成功导入 ${imported.length} 条记录` };
    } catch (err) {
        // 捕获解析或存储过程中出现的任何异常，返回失败结果及错误详情
        return { success: false, message: 'CSV 解析失败: ' + err.message };
    }
}

/**
 * 解析单条 CSV 数据行，支持双引号包裹的字段以及字段内部的双引号转义
 * @param {string} line - 单条 CSV 行文本
 * @returns {Array} - 解析得到的字段值数组
 */
function parseCSVLine(line) {
    // 结果数组，用于存放解析出的每个字段
    const result = [];
    // 当前正在拼接的字段字符串
    let current = '';
    // 标记当前是否处于双引号包裹区域内
    let inQuotes = false;

    // 逐字符遍历 CSV 行
    for (let i = 0; i < line.length; i++) {
        // 获取当前索引位置的字符
        const char = line[i];

        if (char === '"') {
            // 当前字符为双引号
            if (inQuotes && line[i + 1] === '"') {
                // 如果已处于引号区域内，且下一个字符也是双引号，说明是转义的双引号（"" -> "）
                current += '"';
                // 跳过下一个双引号字符，避免重复处理
                i++;
            } else {
                // 否则切换引号区域状态：进入或退出引号包裹
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // 当前字符为逗号，且不在双引号包裹区域内，说明当前字段结束
            // 将已拼接的字段字符串去除首尾空白后加入结果数组
            result.push(current.trim());
            // 重置当前字段缓冲区，准备解析下一个字段
            current = '';
        } else {
            // 普通字符，直接追加到当前字段字符串
            current += char;
        }
    }
    // 将最后一个字段（末尾无逗号）加入结果数组
    result.push(current.trim());
    // 返回解析结果
    return result;
}

// ==================== 辅助函数 ====================

/**
 * 生成唯一的事件 ID
 * 基于当前时间戳和随机数组合，确保在同一应用会话内高度唯一
 * @returns {string} - 格式为 evt_<时间戳36进制>_<随机数36进制> 的字符串
 */
function generateId() {
    // Date.now() 获取当前时间戳并转为 36 进制字符串，缩短长度
    // Math.random() 生成随机小数，转为 36 进制后截取第 2 位起共 9 个字符（去掉前导 "0."）
    return 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 统计今日发生的事件数量及按级别、状态分布
 * @returns {Object} - 包含 total（总数）、high / medium / low（各级别数）、resolved / pending（状态数）的对象
 */
export function getTodayStats() {
    // 获取今天的日期字符串（不含时分秒，便于比较）
    const today = new Date().toDateString();
    // 获取全部事件数组
    const events = getEvents();

    // 筛选出创建日期为今天的事件
    const todayEvents = events.filter(e =>
        // 将事件的 createdAt 转为日期字符串后与 today 比较
        new Date(e.createdAt).toDateString() === today
    );

    // 返回今日统计结果对象
    return {
        // 今日事件总数
        total: todayEvents.length,
        // 今日高级别事件数
        high: todayEvents.filter(e => e.level === 'high').length,
        // 今日中级别事件数
        medium: todayEvents.filter(e => e.level === 'medium').length,
        // 今日低级别事件数
        low: todayEvents.filter(e => e.level === 'low').length,
        // 今日已解决事件数
        resolved: todayEvents.filter(e => e.status === 'resolved').length,
        // 今日待处理事件数
        pending: todayEvents.filter(e => e.status === 'pending').length
    };
}

/**
 * 获取最近若干天的事件趋势数据，按天聚合总数及高优先级、已解决数量
 * @param {number} [days=7] - 统计天数，默认最近 7 天
 * @returns {Array} - 每天的趋势数据对象数组，按日期从早到晚排列
 */
export function getTrendData(days = 7) {
    // 获取全部事件数组
    const events = getEvents();
    // 结果数组，用于存放每天的趋势数据
    const result = [];

    // 从 days-1 天前遍历到今天（共 days 天），i 表示距离今天的天数偏移
    for (let i = days - 1; i >= 0; i--) {
        // 创建当前遍历日期的 Date 对象
        const date = new Date();
        // 将日期设置为今天往前推 i 天
        date.setDate(date.getDate() - i);
        // 获取该日期的字符串表示（不含时间），用于匹配事件
        const dateStr = date.toDateString();

        // 筛选出创建于该日期的事件
        const dayEvents = events.filter(e =>
            new Date(e.createdAt).toDateString() === dateStr
        );

        // 将当天的统计数据推入结果数组
        result.push({
            // 格式化日期为中文习惯的 "月-日" 形式，如 "7月15日"
            date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
            // 当天事件总数
            total: dayEvents.length,
            // 当天高级别事件数
            high: dayEvents.filter(e => e.level === 'high').length,
            // 当天已解决事件数
            resolved: dayEvents.filter(e => e.status === 'resolved').length
        });
    }

    // 返回按日期顺序排列的趋势数组
    return result;
}

/**
 * 按场景（scene）对事件进行分组统计，包括各场景的总数及高/中/低级别分布
 * @returns {Object} - 以场景名称为键的统计对象，每个值包含 total、high、medium、low 属性
 */
export function getStatsByScene() {
    // 获取全部事件
    const events = getEvents();
    // 初始化空对象用于存放各场景统计结果
    const stats = {};

    // 遍历每个事件，按场景分组累加
    events.forEach(e => {
        // 获取事件场景，若不存在则归类为 'unknown'
        const scene = e.scene || 'unknown';
        // 如果该场景尚未初始化统计对象，则创建默认结构
        if (!stats[scene]) {
            stats[scene] = { total: 0, high: 0, medium: 0, low: 0 };
        }
        // 该场景的总事件数加 1
        stats[scene].total++;
        // 如果事件有 level 属性，则对应对级别的计数加 1
        if (e.level) stats[scene][e.level]++;
    });

    // 返回场景统计对象
    return stats;
}

/**
 * 按类型（type）对事件进行分组计数统计
 * @returns {Object} - 以类型名称为键、事件数量为值的对象
 */
export function getStatsByType() {
    // 获取全部事件数组
    const events = getEvents();
    // 初始化空对象用于按类型累加计数
    const stats = {};

    // 遍历每个事件，按类型统计出现次数
    events.forEach(e => {
        // 获取事件类型，若不存在则归类为 'unknown'
        const type = e.type || 'unknown';
        // 如果该类型尚未初始化计数，则设为 0
        if (!stats[type]) {
            stats[type] = 0;
        }
        // 对应类型的计数加 1
        stats[type]++;
    });

    // 返回类型统计对象
    return stats;
}
