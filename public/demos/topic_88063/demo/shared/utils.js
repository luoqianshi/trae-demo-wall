/**
 * 路见 Demo - 工具函数库
 * 提供时间格式化、距离计算、ID 生成、存储封装等通用方法
 * 挂载到 window.LJ.utils
 */
(function (global) {
    const LJ = global.LJ || (global.LJ = {})

    /**
     * 生成唯一 ID
     * @param {string} [prefix=''] - 前缀
     * @returns {string} 唯一ID
     */
    function generateId(prefix = '') {
        const timestamp = Date.now().toString(36)
        const random = Math.random().toString(36).substr(2, 8)
        return `${prefix}${timestamp}${random}`
    }

    /**
     * 生成工单编号
     * 格式：LJ + 年月日 + 4位随机数
     * @returns {string} 工单编号
     */
    function generateOrderId() {
        const now = new Date()
        const dateStr = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0')
        ].join('')
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        return `LJ${dateStr}${random}`
    }

    /**
     * 格式化日期时间
     * @param {Date|string|number} date - 日期
     * @param {string} [fmt='YYYY-MM-DD HH:mm'] - 格式
     * @returns {string} 格式化后的日期字符串
     */
    function formatDate(date, fmt = 'YYYY-MM-DD HH:mm') {
        if (!date) return ''
        const d = new Date(date)
        if (isNaN(d.getTime())) return ''

        const map = {
            YYYY: d.getFullYear(),
            MM: String(d.getMonth() + 1).padStart(2, '0'),
            DD: String(d.getDate()).padStart(2, '0'),
            HH: String(d.getHours()).padStart(2, '0'),
            mm: String(d.getMinutes()).padStart(2, '0'),
            ss: String(d.getSeconds()).padStart(2, '0')
        }

        let result = fmt
        Object.keys(map).forEach((key) => {
            result = result.replace(key, map[key])
        })
        return result
    }

    /**
     * 计算两个经纬度之间的距离（Haversine 公式）
     * @param {number} lat1 - 纬度1
     * @param {number} lng1 - 经度1
     * @param {number} lat2 - 纬度2
     * @param {number} lng2 - 经度2
     * @returns {number} 距离（米）
     */
    function calcDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLng = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    /**
     * 格式化距离显示
     * @param {number} meters - 距离（米）
     * @returns {string} 格式化后的距离
     */
    function formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}米`
        }
        return `${(meters / 1000).toFixed(1)}公里`
    }

    /**
     * WGS84 坐标转 GCJ02（火星坐标系）
     * 用于将浏览器原生定位结果转换为高德地图坐标系
     * @param {number} lng - WGS84 经度
     * @param {number} lat - WGS84 纬度
     * @returns {{longitude: number, latitude: number}} GCJ02 坐标
     */
    function wgs84ToGcj02(lng, lat) {
        const a = 6378245.0
        const ee = 0.00669342162296594323
        let dLat = transformLat(lng - 105.0, lat - 35.0)
        let dLng = transformLng(lng - 105.0, lat - 35.0)
        const radLat = (lat / 180.0) * Math.PI
        let magic = Math.sin(radLat)
        magic = 1 - ee * magic * magic
        const sqrtMagic = Math.sqrt(magic)
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI)
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI)
        return { longitude: lng + dLng, latitude: lat + dLat }
    }

    /**
     * 纬度转换辅助函数
     */
    function transformLat(x, y) {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
        ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
        ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
        return ret
    }

    /**
     * 经度转换辅助函数
     */
    function transformLng(x, y) {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
        ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
        ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
        return ret
    }

    /**
     * LocalStorage 封装 - 获取数据
     * @param {string} key - 存储键
     * @param {*} [defaultValue=null] - 默认值
     * @returns {*} 存储的数据
     */
    function getStorage(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key)
            if (!value) return defaultValue
            const parsed = JSON.parse(value)
            return parsed
        } catch (err) {
            console.error('读取存储失败（数据已损坏，将清除重置）：', key, err)
            // 数据损坏时清除该 key，避免反复报错
            try { localStorage.removeItem(key) } catch (e) { }
            return defaultValue
        }
    }

    /**
     * LocalStorage 封装 - 设置数据
     * @param {string} key - 存储键
     * @param {*} value - 存储值
     */
    function setStorage(key, value) {
        try {
            const jsonStr = JSON.stringify(value)
            localStorage.setItem(key, jsonStr)
        } catch (err) {
            console.error('写入存储失败：', key, err)
        }
    }

    /**
     * LocalStorage 封装 - 删除数据
     * @param {string} key - 存储键
     */
    function removeStorage(key) {
        try {
            localStorage.removeItem(key)
        } catch (err) {
            console.error('删除存储失败：', err)
        }
    }

    /**
     * 模拟网络延迟
     * @param {number} [min=200] - 最小延迟（毫秒）
     * @param {number} [max=600] - 最大延迟（毫秒）
     * @returns {Promise<void>}
     */
    function delay(min = 200, max = 600) {
        const ms = min + Math.random() * (max - min)
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    /**
     * 根据状态 ID 获取状态信息
     * @param {string} statusId - 状态ID
     * @returns {Object} 状态对象
     */
    function getStatusInfo(statusId) {
        const { STATUS_LIST } = LJ.constants
        return STATUS_LIST.find((s) => s.id === statusId) || STATUS_LIST[0]
    }

    /**
     * 根据问题类型 ID 获取类型信息
     * @param {string} typeId - 类型ID
     * @returns {Object} 类型对象
     */
    function getTypeInfo(typeId) {
        const { PROBLEM_TYPES } = LJ.constants
        return PROBLEM_TYPES.find((t) => t.id === typeId) || { id: 'other', name: '其他问题' }
    }

    /**
     * 根据分类 ID 获取分类信息
     * @param {string} categoryId - 分类ID
     * @returns {Object} 分类对象
     */
    function getCategoryInfo(categoryId) {
        const { PROBLEM_CATEGORIES } = LJ.constants
        return PROBLEM_CATEGORIES.find((c) => c.id === categoryId) || { id: 'other', name: '其他' }
    }

    /**
     * 根据统计数据计算用户等级
     * @param {Object} stats - 统计数据 { totalReports, verifyCount, fixedCount }
     * @returns {Object} 等级信息
     */
    function calcLevel(stats) {
        const { LEVELS, MEDALS } = LJ.constants
        const totalExp = (stats.totalReports || 0) * 10 + (stats.verifyCount || 0) * 5

        let currentLevel = LEVELS[0]
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (totalExp >= LEVELS[i].minExp) {
                currentLevel = LEVELS[i]
                break
            }
        }

        const range = currentLevel.nextExp - currentLevel.minExp
        const progress = range > 0
            ? Math.min(100, ((totalExp - currentLevel.minExp) / range) * 100)
            : 100

        const medals = MEDALS.map((m) => ({
            id: m.id,
            name: m.name,
            icon: m.icon,
            unlocked: m.condition(stats)
        }))

        return {
            levelTitle: currentLevel.title,
            currentExp: totalExp,
            nextLevelExp: currentLevel.nextExp,
            progress: Math.round(progress),
            medals
        }
    }

    /**
     * HTML 转义，防止 XSS
     * @param {string} str - 原始字符串
     * @returns {string} 转义后的字符串
     */
    function escapeHtml(str) {
        if (str == null) return ''
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    /**
     * 防抖函数
     * @param {Function} fn - 要执行的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    function debounce(fn, wait = 300) {
        let timer = null
        return function (...args) {
            clearTimeout(timer)
            timer = setTimeout(() => fn.apply(this, args), wait)
        }
    }

    LJ.utils = {
        generateId,
        generateOrderId,
        formatDate,
        calcDistance,
        formatDistance,
        wgs84ToGcj02,
        getStorage,
        setStorage,
        removeStorage,
        delay,
        getStatusInfo,
        getTypeInfo,
        getCategoryInfo,
        calcLevel,
        escapeHtml,
        debounce
    }
})(window)
