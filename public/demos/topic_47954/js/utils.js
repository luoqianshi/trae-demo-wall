/**
 * utils.js - 工具函数模块
 * 包含：房间名称映射、设备状态文本、tooltip 文本、时间格式化等
 */

// 房间名称映射
const ROOM_MAP = {
    living: '客厅',
    bedroom: '卧室',
    kitchen: '厨房',
    bathroom: '浴室',
    study: '书房'
};

// 设备类型常量
const DEVICE_TYPES = {
    LIGHT: 'light',
    AC: 'ac',
    TV: 'tv',
    CURTAIN: 'curtain',
    PURIFIER: 'purifier',
    HEATER: 'heater',
    FRIDGE: 'fridge',
    COMPUTER: 'computer',
    EXHAUST: 'exhaust',
    LOCK: 'lock',
    ROBOT: 'robot'
};

// 设备配置常量 - 集中管理所有设备类型的中文显示配置
const DEVICE_CONFIG = {
    // 空调模式名称
    AC_MODE_NAMES: {
        cool: '制冷',
        heat: '制热',
        fan: '送风',
        auto: '自动'
    },
    // 净化器风速名称
    PURIFIER_SPEED_NAMES: {
        1: '低速',
        2: '中速',
        3: '高速'
    },
    // 获取设备状态文本
    getStatusText(device) {
        if (!device.on) {
            if (device.type === DEVICE_TYPES.LOCK) return '已解锁';
            return '已关闭';
        }
        switch (device.type) {
            case DEVICE_TYPES.LIGHT: return `亮度 ${device.brightness}%`;
            case DEVICE_TYPES.AC: return `${device.temperature}°C ${this.AC_MODE_NAMES[device.mode] || '制冷'}`;
            case DEVICE_TYPES.CURTAIN: return `开合 ${device.openPercent}%`;
            case DEVICE_TYPES.TV: return `音量 ${device.volume}%`;
            case DEVICE_TYPES.HEATER: return `${device.temperature}°C`;
            case DEVICE_TYPES.PURIFIER: return '净化中';
            case DEVICE_TYPES.LOCK: return '已上锁';
            case DEVICE_TYPES.ROBOT: return '清扫中';
            case DEVICE_TYPES.FRIDGE: return `${device.temperature}°C`;
            default: return '运行中';
        }
    },
    // 获取设备 Tooltip 文本
    getTooltipText(device) {
        if (!device) return '';
        const status = !device.on
            ? (device.type === DEVICE_TYPES.LOCK ? '已解锁' : '已关闭')
            : '开启';
        switch (device.type) {
            case DEVICE_TYPES.LIGHT: {
                const brightness = device.brightness != null ? device.brightness : 0;
                return device.on
                    ? `${device.name} - 开启 ${brightness}%`
                    : `${device.name} - 已关闭`;
            }
            case DEVICE_TYPES.AC: {
                const modeName = this.AC_MODE_NAMES[device.mode] || '制冷';
                return device.on
                    ? `${device.name} - 开启 ${device.temperature}°C ${modeName}`
                    : `${device.name} - 已关闭`;
            }
            case DEVICE_TYPES.CURTAIN: {
                return device.on
                    ? `${device.name} - 开启 ${device.openPercent}%`
                    : `${device.name} - 已关闭`;
            }
            case DEVICE_TYPES.TV: {
                return device.on
                    ? `${device.name} - 开启 音量 ${device.volume}%`
                    : `${device.name} - 已关闭`;
            }
            case DEVICE_TYPES.HEATER: {
                return device.on
                    ? `${device.name} - 开启 ${device.temperature}°C`
                    : `${device.name} - 已关闭`;
            }
            case DEVICE_TYPES.PURIFIER: {
                const speed = this.PURIFIER_SPEED_NAMES[device.speed] || '中速';
                return device.on
                    ? `${device.name} - 开启 ${speed}`
                    : `${device.name} - 已关闭`;
            }
            case DEVICE_TYPES.LOCK: {
                return `${device.name} - ${status}`;
            }
            case DEVICE_TYPES.ROBOT: {
                return device.on
                    ? `${device.name} - 清扫中`
                    : `${device.name} - 已停止`;
            }
            case DEVICE_TYPES.FRIDGE: {
                return device.on
                    ? `${device.name} - 运行中 ${device.temperature}°C`
                    : `${device.name} - 已关闭`;
            }
            case DEVICE_TYPES.EXHAUST: {
                return device.on
                    ? `${device.name} - 运行中`
                    : `${device.name} - 已关闭`;
            }
            case DEVICE_TYPES.COMPUTER: {
                return device.on
                    ? `${device.name} - 开启`
                    : `${device.name} - 已关闭`;
            }
            default:
                return `${device.name} - ${status}`;
        }
    }
};

// 获取房间名称
function getRoomName(room) {
    return ROOM_MAP[room] || room;
}

// 格式化时间 (HH:MM)
function formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

// 格式化日期 (YYYY/MM/DD 周X)
function formatDate(date) {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${y}/${mo}/${d} ${weekDays[date.getDay()]}`;
}

// 判断当前是否为白天（6:00-18:00为白天）
function checkDaytime() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 6 && hour < 18;
}