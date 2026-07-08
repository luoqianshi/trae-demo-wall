/**
 * 路见 Demo - 全局常量定义
 * 包含设计系统、问题类型、状态、等级、勋章等常量
 * 挂载到 window.LJ.constants
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})

    /**
     * 设计系统色值
     * 与小程序端保持一致
     */
    const COLORS = {
        primary: '#E8792B',
        primaryDark: '#C6601A',
        primaryLight: '#FDECD5',
        secondary: '#0D9488',
        secondaryLight: '#D1FAE5',
        bg: '#FAFAF9',
        text: '#1C1917',
        textSecondary: '#57534E',
        textTertiary: '#A8A29E',
        border: '#E7E5E4',
        card: '#FFFFFF'
    }

    /**
     * 问题类型列表
     * 用于上报页面选择具体问题类型
     */
    const PROBLEM_TYPES = [
        { id: 'blind_path_blocked', name: '盲道被占用', category: 'blind_facility' },
        { id: 'blind_path_damaged', name: '盲道损坏', category: 'blind_facility' },
        { id: 'ramp_missing', name: '无坡道', category: 'ramp_facility' },
        { id: 'ramp_damaged', name: '坡道损坏', category: 'ramp_facility' },
        { id: 'elevator_broken', name: '无障碍电梯故障', category: 'elevator' },
        { id: 'toilet_inaccessible', name: '无障碍卫生间不可用', category: 'toilet' },
        { id: 'tactile_paving_missing', name: '触觉指示缺失', category: 'blind_facility' },
        { id: 'handrail_missing', name: '扶手缺失或损坏', category: 'other' },
        { id: 'parking_blocked', name: '无障碍停车位被占', category: 'parking' },
        { id: 'other', name: '其他问题', category: 'other' }
    ]

    /**
     * 问题分类列表
     * 用于问题归类和筛选
     */
    const PROBLEM_CATEGORIES = [
        { id: 'blind_facility', name: '盲道设施' },
        { id: 'ramp_facility', name: '坡道设施' },
        { id: 'elevator', name: '无障碍电梯' },
        { id: 'toilet', name: '无障碍卫生间' },
        { id: 'parking', name: '无障碍停车位' },
        { id: 'other', name: '其他' }
    ]

    /**
     * 状态列表及对应颜色
     * 5 种状态流转：待审核 → 已审核待处理 → 处理中 → 已修复待验证 → 已验证通过
     */
    const STATUS_LIST = [
        { id: 'pending', name: '待审核', color: '#78716C', bgColor: '#F5F5F4' },
        { id: 'approved', name: '已审核待处理', color: '#E8792B', bgColor: '#FDECD5' },
        { id: 'processing', name: '处理中', color: '#D97706', bgColor: '#FEF3C7' },
        { id: 'fixed', name: '已修复待验证', color: '#0D9488', bgColor: '#D1FAE5' },
        { id: 'verified', name: '已验证通过', color: '#16A34A', bgColor: '#DCFCE7' },
        { id: 'rejected', name: '已驳回', color: '#DC2626', bgColor: '#FEE2E2' }
    ]

    /**
     * 状态流转关系
     * 用于后台工单操作按钮显示
     */
    const STATUS_FLOW = {
        pending: ['approved', 'rejected'],
        approved: ['processing'],
        processing: ['fixed'],
        fixed: ['verified'],
        verified: [],
        rejected: []
    }

    /**
     * 每页加载数量
     */
    const PAGE_SIZE = 10

    /**
     * 后台管理员角色
     */
    const ADMIN_ROLES = [
        { id: 'super_admin', name: '超级管理员' },
        { id: 'auditor', name: '审核员' },
        { id: 'handler', name: '处理员' }
    ]

    /**
     * 后台侧边栏菜单
     */
    const ADMIN_MENUS = [
        { id: 'dashboard', name: '数据看板', icon: '📊', path: '#/dashboard' },
        { id: 'reports', name: '工单管理', icon: '📋', path: '#/reports' },
        { id: 'statistics', name: '统计分析', icon: '📈', path: '#/statistics' },
        { id: 'users', name: '上报者管理', icon: '👥', path: '#/users' }
    ]

    /**
     * 用户等级配置
     * 根据经验值计算等级
     */
    const LEVELS = [
        { title: '初级守护者', minExp: 0, nextExp: 50 },
        { title: '热心市民', minExp: 50, nextExp: 150 },
        { title: '路见达人', minExp: 150, nextExp: 350 },
        { title: '无障碍先锋', minExp: 350, nextExp: 700 },
        { title: '城市守护者', minExp: 700, nextExp: 1200 },
        { title: '传奇守护者', minExp: 1200, nextExp: 9999 }
    ]

    /**
     * 勋章配置
     */
    const MEDALS = [
        { id: 'first_report', name: '初次上报', icon: '🌟', condition: (s) => s.totalReports >= 1 },
        { id: 'ten_reports', name: '十次上报', icon: '🔥', condition: (s) => s.totalReports >= 10 },
        { id: 'first_verify', name: '初次验证', icon: '✅', condition: (s) => s.verifyCount >= 1 },
        { id: 'five_fixed', name: '修复达人', icon: '🔧', condition: (s) => s.fixedCount >= 5 },
        { id: 'hundred_reports', name: '百次上报', icon: '💎', condition: (s) => s.totalReports >= 100 },
        { id: 'pioneer', name: '先锋守护者', icon: '🏆', condition: (s) => s.totalReports >= 50 && s.verifyCount >= 20 }
    ]

    /**
     * 最大验证距离（米）
     */
    const MAX_VERIFY_DISTANCE = 50

    /**
     * 高德地图配置
     */
    const AMAP_CONFIG = {
        key: 'a47b35619b3fd91ba3c61ee001ccf472',
        version: '2.0',
        center: [116.397470, 39.908823],
        zoom: 14
    }

    /**
     * LocalStorage 存储键
     */
    const STORAGE_KEYS = {
        reports: 'lujian_reports',
        currentUser: 'lujian_current_user',
        adminUser: 'lujian_admin_user',
        userStats: 'lujian_user_stats',
        initialized: 'lujian_initialized',
        lastViewedTime: 'lujian_last_viewed_time',
        dataVersion: 'lujian_data_version',
        locationCache: 'lujian_location_cache'
    }

    /**
     * 模拟数据版本号（修改 mock-data 后递增，触发自动重新初始化）
     */
    const DATA_VERSION = '2'

    LJ.constants = {
        COLORS,
        PROBLEM_TYPES,
        PROBLEM_CATEGORIES,
        STATUS_LIST,
        STATUS_FLOW,
        PAGE_SIZE,
        ADMIN_ROLES,
        ADMIN_MENUS,
        LEVELS,
        MEDALS,
        MAX_VERIFY_DISTANCE,
        AMAP_CONFIG,
        STORAGE_KEYS,
        DATA_VERSION
    }
})(window)
