/**
 * 智感温盾 - 实验室实时温度监测与预警系统
 * Express 后端服务器
 *
 * 功能：
 * - RESTful API 接口
 * - JWT 身份认证
 * - WebSocket 实时推送
 * - MQTT 数据采集
 * - 企业微信告警通知
 * - 模拟数据模式（--dev）
 *
 * 启动方式：
 *   node server.js          # 生产模式（需要MQTT Broker）
 *   node server.js --dev    # 开发模式（自动生成模拟数据）
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const cron = require('node-cron');

// MQTT客户端
let mqttClient = null;
// 模拟器实例（开发模式/演示模式）
let simulatorInstance = null;
let simulatorTimer = null;
let demoModeEnabled = false;
let demoModeManualOverride = false; // 用户手动控制后，自动兜底不再生效
try {
    mqttClient = require('mqtt');
} catch (e) {
    console.log('[WARN] mqtt模块加载失败，将以模拟数据模式运行');
}

// WebSocket
const WebSocket = require('ws');

// 数据库操作
const DB = require('./db');

// ============================================================
// 配置
// ============================================================

const CONFIG = {
    PORT: 5678,
    JWT_SECRET: process.env.JWT_SECRET || 'smart-temp-guard-secret-key-2024',
    JWT_EXPIRES_IN: '24h',
    // MQTT配置
    MQTT_BROKER: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
    MQTT_TOPIC: 'sensor/+/data',
    // 企业微信Webhook（留空则不发送）
    WECHAT_WEBHOOK_URL: process.env.WECHAT_WEBHOOK_URL || '',
    // 模拟数据模式
    DEV_MODE: process.argv.includes('--dev'),
    // 模拟数据间隔（毫秒）
    SIMULATE_INTERVAL: 1200,
};

// ============================================================
// Express 应用初始化
// ============================================================

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 速率限制（简易内存实现）
const rateLimitBuckets = {};
function rateLimit(req, res, next) {
    const ip = getClientIP(req);
    const now = Date.now();
    if (!rateLimitBuckets[ip]) rateLimitBuckets[ip] = [];
    // 清理1分钟前的记录
    rateLimitBuckets[ip] = rateLimitBuckets[ip].filter(t => now - t < 60000);
    if (rateLimitBuckets[ip].length >= 60) {
        return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }
    rateLimitBuckets[ip].push(now);
    next();
}
app.use(rateLimit);

// 安全头
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// 静态文件服务（public目录）— 开发模式下禁用缓存
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// ============================================================
// 工具函数
// ============================================================

/**
 * 获取客户端IP
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || 'unknown';
}

/**
 * 获取本机局域网IP列表
 */
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
        }
    }
    return ips;
}

/**
 * JWT认证中间件
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: '令牌已过期，请重新登录' });
        }
        return res.status(401).json({ error: '无效的认证令牌' });
    }
}

/**
 * 角色权限检查中间件
 * @param {string[]} allowedRoles - 允许的角色列表
 */
function roleMiddleware(...allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: '权限不足' });
        }
        next();
    };
}

// ============================================================
// WebSocket 管理
// ============================================================

const wss = new WebSocket.Server({ noServer: true });

/**
 * 广播消息给所有连接的WebSocket客户端
 * @param {string} type - 消息类型
 * @param {object} data - 消息数据
 */
function broadcast(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    let sent = 0;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sent++;
        }
    });
    return sent;
}

// ============================================================
// 企业微信告警通知
// ============================================================

/**
 * 发送企业微信告警通知
 * @param {string} content - 告警内容（Markdown格式）
 */
async function sendWechatAlert(content) {
    const state = DB.getSystemState();
    const webhookUrl = state.wechat_webhook_url || CONFIG.WECHAT_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        const https = require('https');
        const url = new URL(webhookUrl);

        const postData = JSON.stringify({
            msgtype: 'markdown',
            markdown: { content }
        });

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('[企业微信] 告警通知发送成功');
                        resolve();
                    } else {
                        console.error(`[企业微信] 发送失败: ${res.statusCode} ${body}`);
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    } catch (err) {
        console.error(`[企业微信] 告警通知异常: ${err.message}`);
    }
}

// ============================================================
// MQTT 数据处理
// ============================================================

/**
 * 处理传感器数据（来自MQTT或模拟器）
 * @param {string} deviceId - 设备编号（如 A-101）
 * @param {object} data - 传感器数据 { temperature, humidity, battery }
 */
function processSensorData(deviceId, data) {
    const device = DB.getDeviceByDeviceId(deviceId);
    if (!device) {
        console.warn(`[MQTT] 未知设备编号: ${deviceId}`);
        return;
    }

    const { temperature, humidity, battery } = data;

    // 判断温度状态
    let status = 'normal';
    if (temperature > device.max_threshold || temperature < device.min_threshold) {
        status = 'alarm';
    } else if (
        temperature > device.max_threshold - (device.max_threshold - device.min_threshold) * 0.1 ||
        temperature < device.min_threshold + (device.max_threshold - device.min_threshold) * 0.1
    ) {
        status = 'warning';
    }

    // 保存温度记录
    const record = DB.addTemperatureRecord(device.id, temperature, humidity, status);

    // 更新设备状态
    DB.updateDeviceStatus(device.id, status === 'alarm' ? 'alarm' : 'online');
    if (battery !== undefined) {
        DB.updateDevice(device.id, { battery });
    }

    // 如果是告警状态，创建告警记录
    if (status === 'alarm') {
        const alertType = temperature > device.max_threshold ? 'temperature_high' : 'temperature_low';
        const alertMsg = `${device.name}(${deviceId}) 温度${alertType === 'temperature_high' ? '过高' : '过低'}: ${temperature}°C (阈值: ${device.min_threshold}~${device.max_threshold}°C)`;

        const alert = DB.addAlert(device.id, alertType, 'critical', alertMsg);

        // WebSocket推送告警
        broadcast('alert', {
            id: alert.id,
            device_id: deviceId,
            device_name: device.name,
            type: alertType,
            level: 'critical',
            message: alertMsg,
            temperature
        });

        // 企业微信通知
        sendWechatAlert(`## 温度告警\n> **${device.name}** (${deviceId})\n> - 温度: **${temperature}°C**\n> - 阈值范围: ${device.min_threshold}~${device.max_threshold}°C\n> - 时间: ${new Date().toLocaleString('zh-CN')}`);
    }

    // WebSocket推送温度更新
    broadcast('temperature_update', {
        device_id: deviceId,
        device_name: device.name,
        temperature,
        humidity,
        battery,
        status,
        recorded_at: record.recorded_at || new Date().toISOString()
    });

    console.log(`[数据] ${device.name}(${deviceId}): ${temperature}°C${humidity !== undefined ? ` / ${humidity}%` : ''} [${status}]`);
}

// ============================================================
// MQTT 客户端初始化
// ============================================================

let mqttConnected = false;
let mqttFailoverTimer = null;

function startSimulationAsFallback() {
    if (simulatorInstance) return;
    if (demoModeManualOverride && !demoModeEnabled) return; // 用户已手动关闭，不再自动兜底
    console.log('[MQTT] 未检测到可用Broker，自动启用模拟数据生成器作为兜底');
    console.log('='.repeat(55));
    simulatorInstance = startSimulator();
    demoModeEnabled = true;
}

function initMQTT() {
    if (!mqttClient) {
        console.log('[MQTT] 模块不可用，启用模拟数据兜底');
        startSimulationAsFallback();
        return;
    }

    console.log(`[MQTT] 正在连接到 ${CONFIG.MQTT_BROKER} ...`);

    // 6秒内未连接成功则自动切换到模拟数据
    mqttFailoverTimer = setTimeout(() => {
        if (!mqttConnected) {
            console.log('[MQTT] 连接超时，启用模拟数据兜底');
            startSimulationAsFallback();
        }
    }, 6000);

    const client = mqttClient.connect(CONFIG.MQTT_BROKER, {
        clientId: 'smart-temp-guard-server',
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 5000,
    });

    client.on('connect', () => {
        mqttConnected = true;
        if (mqttFailoverTimer) { clearTimeout(mqttFailoverTimer); mqttFailoverTimer = null; }
        console.log('[MQTT] 连接成功');
        client.subscribe(CONFIG.MQTT_TOPIC, { qos: 0 }, (err) => {
            if (err) {
                console.error(`[MQTT] 订阅失败: ${err.message}`);
            } else {
                console.log(`[MQTT] 已订阅主题: ${CONFIG.MQTT_TOPIC}`);
            }
        });
    });

    client.on('message', (topic, message) => {
        try {
            const parts = topic.split('/');
            const deviceId = parts[1];
            const data = JSON.parse(message.toString());
            processSensorData(deviceId, data);
        } catch (err) {
            console.error(`[MQTT] 消息解析失败: ${err.message}`);
        }
    });

    client.on('error', (err) => {
        console.error(`[MQTT] 连接错误: ${err.message}`);
    });

    client.on('reconnect', () => {
        console.log('[MQTT] 正在重新连接...');
    });

    client.on('offline', () => {
        mqttConnected = false;
        console.log('[MQTT] 连接断开');
        if (!simulatorInstance && !mqttFailoverTimer) {
            mqttFailoverTimer = setTimeout(() => {
                if (!mqttConnected) startSimulationAsFallback();
            }, 6000);
        }
    });
}

// ============================================================
// 模拟数据生成器（开发模式）— 增强版
// ============================================================

/**
 * Box-Muller 正态分布随机数
 */
function gaussianRandom(mean = 0, stdev = 1) {
    const u1 = Math.random(), u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * stdev + mean;
}

/**
 * 设备模拟引擎 — 每个设备独立维护状态，模拟真实传感器行为
 */
class DeviceSimulator {
    constructor() {
        this.devices = new Map();
        this.tickCount = 0;
        this.alarmProbability = 0.03;    // 3% 概率产生异常
        this.offlineProbability = 0.002; // 0.2% 概率设备离线
        this.recoveryTime = 30;          // 离线后约30个tick恢复
    }

    /**
     * 注册一个模拟设备
     */
    register(deviceId, profile) {
        this.devices.set(deviceId, {
            ...profile,
            deviceId,
            currentTemp: profile.baseTemp,
            currentHumidity: profile.baseHumidity,
            battery: 85 + Math.random() * 15,
            status: 'online',
            offlineTicks: 0,
            // 温度漂移状态（模拟缓慢漂移）
            drift: 0,
            driftDirection: Math.random() > 0.5 ? 1 : -1,
            driftSpeed: 0.01 + Math.random() * 0.02,
            // 周期性波动（模拟环境变化）
            phase: Math.random() * Math.PI * 2,
        });
    }

    /**
     * 注销一个模拟设备
     */
    unregister(deviceId) {
        if (this.devices.has(deviceId)) {
            this.devices.delete(deviceId);
            console.log(`[模拟] 注销设备: ${deviceId}`);
        }
    }

    /**
     * 生成一个tick的数据
     */
    tick() {
        this.tickCount++;
        const results = [];

        for (const [deviceId, dev] of this.devices) {
            // 设备离线逻辑
            if (dev.status === 'offline') {
                dev.offlineTicks++;
                if (dev.offlineTicks >= this.recoveryTime) {
                    dev.status = 'online';
                    dev.offlineTicks = 0;
                    DB.updateDeviceStatus(deviceId, 'online');
                    console.log(`[模拟] ${dev.name}(${deviceId}) 恢复在线`);
                }
                continue; // 离线设备不产生数据
            }

            // 随机离线
            if (Math.random() < this.offlineProbability) {
                dev.status = 'offline';
                dev.offlineTicks = 0;
                DB.updateDeviceStatus(deviceId, 'offline');
                console.log(`[模拟] ${dev.name}(${deviceId}) 离线`);
                // 广播离线状态
                this._broadcast({ type: 'device_status', deviceId, status: 'offline', name: dev.name });
                continue;
            }

            // 温度生成：基础值 + 漂移 + 周期波动 + 噪声
            // 1) 缓慢漂移（模拟传感器老化/环境渐变）
            dev.drift += dev.driftDirection * dev.driftSpeed * gaussianRandom(0.1, 0.05);
            if (Math.abs(dev.drift) > dev.maxDrift) dev.driftDirection *= -1;

            // 2) 周期性波动（模拟昼夜/空调循环等）
            const cyclic = Math.sin(dev.phase + this.tickCount * 0.05) * dev.cyclicAmplitude;

            // 3) 随机噪声（高斯分布）
            const noise = gaussianRandom(0, dev.noiseStd);

            // 4) 异常事件（模拟门未关紧/制冷故障等）
            let anomaly = 0;
            const isAnomaly = Math.random() < this.alarmProbability;
            if (isAnomaly) {
                const severity = 1.5 + Math.random() * 2.5;
                anomaly = (Math.random() > 0.5 ? 1 : -1) * dev.noiseStd * severity * 3;
                console.log(`[模拟] ${dev.name}(${deviceId}) 产生异常温度偏移: ${anomaly > 0 ? '+' : ''}${anomaly.toFixed(2)}°C`);
            }

            dev.currentTemp = dev.baseTemp + dev.drift + cyclic + noise + anomaly;
            dev.currentTemp = Math.round(dev.currentTemp * 100) / 100;

            // 湿度生成（有湿度传感器的设备）
            let humidity = undefined;
            if (dev.hasHumidity) {
                const hNoise = gaussianRandom(0, 2);
                const hCyclic = Math.sin(dev.phase + this.tickCount * 0.03) * 5;
                dev.currentHumidity = dev.baseHumidity + hCyclic + hNoise;
                dev.currentHumidity = Math.max(20, Math.min(95, dev.currentHumidity));
                humidity = Math.round(dev.currentHumidity * 10) / 10;
            }

            // 电池缓慢下降
            dev.battery = Math.max(10, dev.battery - 0.001 * Math.random());
            const battery = Math.round(dev.battery * 10) / 10;

            results.push({
                deviceId,
                temperature: dev.currentTemp,
                humidity,
                battery,
                isAnomaly
            });
        }

        return results;
    }

    _broadcast(data) {
        const msg = JSON.stringify(data);
        wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
    }

    /**
     * 获取所有设备状态摘要
     */
    getStatus() {
        const status = [];
        for (const [id, dev] of this.devices) {
            status.push({
                deviceId: id,
                name: dev.name,
                status: dev.status,
                currentTemp: dev.currentTemp?.toFixed(1),
                battery: dev.battery?.toFixed(1)
            });
        }
        return status;
    }
}

function startSimulator() {
    const sim = new DeviceSimulator();

    // 先检查是否有演示设备，没有则自动创建
    let demoDevices = DB.getDemoDevices();
    if (!demoDevices || demoDevices.length === 0) {
        console.log('[模拟] 无演示设备，自动创建默认演示设备');
        const demoConfigs = [
            { name: '1号培养箱', device_id: 'A-101', type: 'temperature', location: '培养室A', sensor_model: 'DHT22', connection_type: 'wifi', status: 'online', min_threshold: 35, max_threshold: 40, battery: 100, is_demo: 1 },
            { name: '2号冷藏柜', device_id: 'A-102', type: 'temperature', location: '冷藏室B', sensor_model: 'DS18B20', connection_type: 'wifi', status: 'online', min_threshold: 2, max_threshold: 8, battery: 100, is_demo: 1 },
            { name: '3号超低温冰箱', device_id: 'A-103', type: 'temperature', location: '超低温室C', sensor_model: 'PT100', connection_type: 'wifi', status: 'online', min_threshold: -85, max_threshold: -70, battery: 100, is_demo: 1 },
            { name: '4号恒温箱', device_id: 'A-104', type: 'temperature', location: '恒温室D', sensor_model: 'SHT30', connection_type: 'wifi', status: 'online', min_threshold: 36, max_threshold: 40, battery: 100, is_demo: 1 }
        ];
        demoConfigs.forEach(cfg => {
            try {
                DB.createDevice(cfg);
                console.log(`[模拟] 创建演示设备: ${cfg.name}(${cfg.device_id})`);
            } catch (err) {
                // 设备可能已存在，忽略错误
            }
        });
        demoDevices = DB.getDemoDevices();
    }

    // 注册模拟设备 — 只读取演示设备
    const dbDevices = demoDevices.length > 0 ? demoDevices : DB.getDevices();
    dbDevices.forEach(d => {
        const range = (d.max_threshold - d.min_threshold);
        const baseTemp = (d.min_threshold + d.max_threshold) / 2;
        sim.register(d.device_id, {
            name: d.name,
            baseTemp: baseTemp,
            baseHumidity: 55,
            hasHumidity: d.device_id !== 'A-103',
            noiseStd: range * 0.08,
            maxDrift: range * 0.15,
            cyclicAmplitude: range * 0.05,
        });
        console.log(`[模拟] 注册设备: ${d.name}(${d.device_id}) 基准=${baseTemp}°C 量程=${range}°C`);
    });

    console.log(`[模拟] 增强模式已启用 — ${sim.devices.size}台设备, 间隔${CONFIG.SIMULATE_INTERVAL}ms`);
    console.log(`[模拟] 异常概率: ${(sim.alarmProbability * 100).toFixed(1)}% | 离线概率: ${(sim.offlineProbability * 100).toFixed(1)}%`);

    // 主循环
    simulatorTimer = setInterval(() => {
        const results = sim.tick();
        results.forEach(r => {
            processSensorData(r.deviceId, {
                temperature: r.temperature,
                humidity: r.humidity,
                battery: r.battery
            });
        });
    }, CONFIG.SIMULATE_INTERVAL);

    return sim;
}

function stopSimulator() {
    if (simulatorTimer) {
        clearInterval(simulatorTimer);
        simulatorTimer = null;
    }
    if (simulatorInstance) {
        simulatorInstance.devices.clear();
        simulatorInstance = null;
    }
    // Clear ALL devices and demo data when demo mode stops
    try {
        DB.deleteDemoDevices();
        const allDevices = DB.getDevices();
        allDevices.forEach(d => {
            try { DB.deleteDevice(d.id); } catch (e) {}
        });
        DB.clearAllAlerts();
        DB.clearAllRecords();
        console.log('[模拟] 所有设备及演示数据已清空');
    } catch (err) {
        console.error('[模拟] 清理演示数据失败:', err.message);
    }
    demoModeEnabled = false;
    console.log('[模拟] 演示模式已停止');
}

// ============================================================
// API 路由
// ============================================================

// ----- 认证相关 -----

/**
 * POST /api/auth/login - 用户登录
 */
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = DB.getUserByUsername(username);
    if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }

    if (!DB.verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 更新最后登录时间
    DB.updateLastLogin(user.id);

    // 记录审计日志
    DB.addAuditLog(user.id, 'login', `用户 ${username} 登录系统`, getClientIP(req));

    // 生成JWT令牌
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        CONFIG.JWT_SECRET,
        { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        },
        message: '登录成功'
    });
});

/**
 * POST /api/auth/change-password - 修改密码
 */
app.post('/api/auth/change-password', authMiddleware, (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: '请输入原密码和新密码' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: '新密码长度不能少于6位' });
    }

    const user = DB.getUserById(req.user.id);
    if (!user || !DB.verifyPassword(oldPassword, user.password_hash)) {
        return res.status(401).json({ error: '原密码错误' });
    }

    DB.changePassword(req.user.id, newPassword);
    DB.addAuditLog(req.user.id, 'change_password', '用户修改密码', getClientIP(req));

    res.json({ message: '密码修改成功' });
});

// ----- 设备相关 -----

/**
 * GET /api/devices - 获取设备列表
 */
app.get('/api/devices', authMiddleware, (req, res) => {
    const devices = DB.getDevices();

    // 附加最新温度数据
    const latestRecords = DB.getLatestRecords();
    const recordMap = {};
    latestRecords.forEach(r => { recordMap[r.device_id] = r; });

    const devicesWithTemp = devices.map(d => ({
        ...d,
        latest_temp: recordMap[d.id] ? recordMap[d.id].temperature : null,
        latest_humidity: recordMap[d.id] ? recordMap[d.id].humidity : null,
        latest_status: recordMap[d.id] ? recordMap[d.id].status : null,
        latest_time: recordMap[d.id] ? recordMap[d.id].recorded_at : null,
    }));

    res.json(devicesWithTemp);
});

/**
 * POST /api/devices - 添加设备
 */
app.post('/api/devices', authMiddleware, roleMiddleware('admin', 'operator'), (req, res) => {
    const { name, device_id, type, location, sensor_model, connection_type, min_threshold, max_threshold } = req.body;

    if (!name || !device_id) {
        return res.status(400).json({ error: '设备名称和编号不能为空' });
    }

    // 检查设备编号是否已存在
    const existing = DB.getDeviceByDeviceId(device_id);
    if (existing) {
        return res.status(409).json({ error: `设备编号 ${device_id} 已存在` });
    }

    const device = DB.createDevice({
        name, device_id, type, location, sensor_model,
        connection_type, min_threshold, max_threshold
    });

    // 开发模式：自动注册到模拟器
    if (simulatorInstance && device_id) {
        const range = (max_threshold - min_threshold) || 10;
        const baseTemp = (min_threshold + max_threshold) / 2;
        simulatorInstance.register(device_id, {
            name: name,
            baseTemp: baseTemp,
            baseHumidity: 55,
            hasHumidity: type !== 'temperature' && device_id !== 'A-103',
            noiseStd: range * 0.08,
            maxDrift: range * 0.15,
            cyclicAmplitude: range * 0.05,
        });
        console.log(`[模拟] 动态注册新设备: ${name}(${device_id}) 基准=${baseTemp}°C`);
    }

    DB.addAuditLog(req.user.id, 'create_device', `添加设备: ${name}(${device_id})`, getClientIP(req));
    broadcast('device_update', { action: 'create', device });

    res.status(201).json({ message: '设备添加成功', device });
});

/**
 * PUT /api/devices/:id - 更新设备
 */
app.put('/api/devices/:id', authMiddleware, roleMiddleware('admin', 'operator'), (req, res) => {
    const id = parseInt(req.params.id);
    const device = DB.getDeviceById(id);

    if (!device) {
        return res.status(404).json({ error: '设备不存在' });
    }

    // 如果更新了device_id，检查唯一性
    if (req.body.device_id && req.body.device_id !== device.device_id) {
        const existing = DB.getDeviceByDeviceId(req.body.device_id);
        if (existing) {
            return res.status(409).json({ error: `设备编号 ${req.body.device_id} 已存在` });
        }
    }

    DB.updateDevice(id, req.body);
    DB.addAuditLog(req.user.id, 'update_device', `更新设备: ${device.name}(${device.device_id})`, getClientIP(req));

    const updated = DB.getDeviceById(id);
    broadcast('device_update', { action: 'update', device: updated });

    res.json({ message: '设备更新成功', device: updated });
});

/**
 * DELETE /api/devices/:id - 删除设备
 */
app.delete('/api/devices/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const device = DB.getDeviceById(id);

    if (!device) {
        return res.status(404).json({ error: '设备不存在' });
    }

    // 开发模式：从模拟器注销
    if (simulatorInstance && device.device_id) {
        simulatorInstance.unregister(device.device_id);
    }

    DB.deleteDevice(id);
    DB.addAuditLog(req.user.id, 'delete_device', `删除设备: ${device.name}(${device.device_id})`, getClientIP(req));

    broadcast('device_update', { action: 'delete', device_id: id });

    res.json({ message: '设备删除成功' });
});

// ----- 温度记录相关 -----

/**
 * GET /api/devices/:id/records - 获取设备温度记录
 * 查询参数: start, end, page, limit
 */
app.get('/api/devices/:id/records', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const device = DB.getDeviceById(id);

    if (!device) {
        return res.status(404).json({ error: '设备不存在' });
    }

    const { start, end, page = 1, limit = 50, sampling } = req.query;
    const result = DB.getRecordsByDevice(id, { start, end, page, limit, sampling });

    res.json(result);
});

/**
 * GET /api/devices/:id/stats - 获取设备统计数据
 * 查询参数: start, end
 */
app.get('/api/devices/:id/stats', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const device = DB.getDeviceById(id);

    if (!device) {
        return res.status(404).json({ error: '设备不存在' });
    }

    const { start, end } = req.query;
    const stats = DB.getDeviceStats(id, start, end);

    res.json({
        device_id: device.device_id,
        device_name: device.name,
        min_threshold: device.min_threshold,
        max_threshold: device.max_threshold,
        ...stats
    });
});

// ----- 告警相关 -----

/**
 * GET /api/alerts - 获取告警列表
 * 查询参数: resolved, level, device_id
 */
app.get('/api/alerts', authMiddleware, (req, res) => {
    const { resolved, level, device_id } = req.query;

    const options = { limit: 200 };
    if (resolved !== undefined) options.resolved = resolved === 'true';
    if (level) options.level = level;
    if (device_id) options.device_id = parseInt(device_id);

    const alerts = DB.getAlerts(options);
    res.json(alerts);
});

/**
 * PUT /api/alerts/:id/resolve - 解决告警
 */
app.put('/api/alerts/:id/resolve', authMiddleware, roleMiddleware('admin', 'operator'), (req, res) => {
    const id = parseInt(req.params.id);
    const success = DB.resolveAlert(id);

    if (!success) {
        return res.status(404).json({ error: '告警不存在或已解决' });
    }

    DB.addAuditLog(req.user.id, 'resolve_alert', `解决告警 #${id}`, getClientIP(req));
    broadcast('alert_resolved', { alert_id: id });

    res.json({ message: '告警已解决' });
});

// ----- 仪表盘 -----

/**
 * GET /api/dashboard - 仪表盘汇总数据
 */
app.get('/api/dashboard', authMiddleware, (req, res) => {
    const summary = DB.getDashboardSummary();
    res.json(summary);
});

// ----- 审计日志 -----

/**
 * GET /api/audit-logs - 获取审计日志
 */
app.get('/api/audit-logs', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { limit = 100, offset = 0 } = req.query;
    const logs = DB.getAuditLogs({ limit, offset });
    res.json(logs);
});

// ----- 模拟器状态 API -----
app.get('/api/simulator', authMiddleware, (req, res) => {
    if (!simulatorInstance) return res.json({ enabled: false });
    res.json({
        enabled: true,
        deviceCount: simulatorInstance.devices.size,
        tickCount: simulatorInstance.tickCount,
        alarmProbability: simulatorInstance.alarmProbability,
        offlineProbability: simulatorInstance.offlineProbability,
        devices: simulatorInstance.getStatus()
    });
});

// ----- 演示模式 API -----
app.get('/api/demo-mode', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const state = DB.getSystemState();
    res.json({
        enabled: demoModeEnabled,
        simulatorRunning: !!simulatorInstance,
        mqttConnected: mqttConnected,
        devModeFlag: CONFIG.DEV_MODE,
        hasDemoDevices: (DB.getDemoDevices().length > 0)
    });
});

app.post('/api/demo-mode', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { enabled } = req.body;
    demoModeManualOverride = true;
    if (enabled) {
        if (!simulatorInstance) {
            simulatorInstance = startSimulator();
            demoModeEnabled = true;
            DB.setSystemState({ demo_mode_enabled: 1, demo_mode_override: 1 });
            console.log('[演示模式] 用户手动开启演示模式');
        }
        res.json({ message: '演示模式已开启', enabled: true });
    } else {
        if (simulatorInstance) {
            stopSimulator();
            DB.setSystemState({ demo_mode_enabled: 0, demo_mode_override: 1 });
            console.log('[演示模式] 用户手动关闭演示模式');
        }
        res.json({ message: '演示模式已关闭', enabled: false });
    }
});

// ----- 系统配置 API -----
app.get('/api/configs', authMiddleware, roleMiddleware('admin'), (req, res) => {
    res.json([
        { key: 'MQTT_HOST', value: process.env.MQTT_HOST || 'localhost', label: 'MQTT 服务器地址', type: 'text' },
        { key: 'MQTT_PORT', value: process.env.MQTT_PORT || '1883', label: 'MQTT 端口', type: 'number' },
        { key: 'MQTT_TOPIC', value: process.env.MQTT_TOPIC || 'sensor/temperature', label: 'MQTT 主题', type: 'text' },
        { key: 'WECHAT_WEBHOOK', value: process.env.WECHAT_WEBHOOK || '', label: '企业微信 Webhook', type: 'text', secret: true },
        { key: 'ALERT_CHECK_INTERVAL', value: process.env.ALERT_CHECK_INTERVAL || '30', label: '告警检查间隔(秒)', type: 'number' },
        { key: 'DATA_RETENTION_DAYS', value: process.env.DATA_RETENTION_DAYS || '90', label: '数据保留天数', type: 'number' },
    ]);
});

app.put('/api/configs/:key', authMiddleware, roleMiddleware('admin'), (req, res) => {
    // 配置通过环境变量管理，运行时不可修改
    res.json({ message: '配置已保存（需重启生效）' });
});

// ----- 数据导出 API -----
app.get('/api/export', authMiddleware, roleMiddleware('admin'), (req, res) => {
    try {
        const { date, sampling } = req.query;
        const exportDate = date || new Date().toISOString().split('T')[0];
        const result = DB.exportRecordsToCSV(exportDate, exportDate, sampling);

        if (result.count === 0) {
            return res.status(404).json({ error: '该日期无数据记录' });
        }

        const suffix = sampling === 'daily_twice' ? '_sampled' : '';
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="records_${exportDate}${suffix}.csv"`);
        res.send('\uFEFF' + result.csv);
    } catch (err) {
        console.error('[导出] 手动导出失败:', err.message);
        res.status(500).json({ error: '导出失败' });
    }
});

app.get('/api/export/settings', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const state = DB.getSystemState();
    res.json({
        export_path: state.export_path || './exports',
        export_time: state.export_time || '10:00',
        auto_export: true,
        frequency: 'monthly'
    });
});

app.post('/api/export/settings', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { export_path, export_time } = req.body;
    const updates = {};
    if (export_path) updates.export_path = export_path;
    if (export_time && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(export_time)) {
        updates.export_time = export_time;
    }
    if (Object.keys(updates).length > 0) {
        DB.setSystemState(updates);
        res.json({ message: '导出设置已更新', ...updates });
    } else {
        res.status(400).json({ error: '请提供有效的导出路径或时间（格式 HH:MM）' });
    }
});

// ----- 微信告警配置 API -----
app.get('/api/wechat-config', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const state = DB.getSystemState();
    res.json({
        webhook_url: state.wechat_webhook_url || '',
        enabled: !!(state.wechat_webhook_url || CONFIG.WECHAT_WEBHOOK_URL)
    });
});

app.post('/api/wechat-config', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const { webhook_url } = req.body;
    if (webhook_url === undefined) {
        return res.status(400).json({ error: '请提供 Webhook URL' });
    }
    DB.setSystemState({ wechat_webhook_url: webhook_url || null });
    res.json({ message: '微信告警配置已保存', webhook_url });
});

app.post('/api/wechat-config/test', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    const state = DB.getSystemState();
    const webhookUrl = state.wechat_webhook_url || CONFIG.WECHAT_WEBHOOK_URL;
    if (!webhookUrl) {
        return res.status(400).json({ error: '未配置 Webhook URL，请先保存配置' });
    }

    const testContent = `## 智感温盾 - 测试通知\n\n` +
        `> **时间**：${new Date().toLocaleString('zh-CN')}\n` +
        `> **来源**：系统测试\n\n` +
        `这是一条测试消息，用于验证企业微信告警通知是否正常工作。\n\n` +
        `如收到此消息，说明告警通道已配置成功。`;

    try {
        await sendWechatAlert(testContent);
        res.json({ message: '测试消息已发送，请检查企业微信' });
    } catch (err) {
        res.status(500).json({ error: '发送失败: ' + err.message });
    }
});

// ----- 用户列表 API -----
app.get('/api/users', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const users = DB.getUsers();
    res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role, created_at: u.created_at })));
});

// ----- SPA 回退路由 -----
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// HTTP/HTTPS 服务器创建
// ============================================================

const server = http.createServer(app);

// WebSocket升级处理
server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// WebSocket连接事件
wss.on('connection', (ws) => {
    console.log(`[WebSocket] 新客户端连接 (当前连接数: ${wss.clients.size})`);

    // 发送欢迎消息
    ws.send(JSON.stringify({
        type: 'connected',
        data: { message: '智感温盾 WebSocket连接成功' },
        timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
        console.log(`[WebSocket] 客户端断开 (当前连接数: ${wss.clients.size})`);
    });
});

// ============================================================
// 定时任务
// ============================================================

// 每分钟检查离线设备（超过5分钟无数据上报）
cron.schedule('* * * * *', () => {
    const devices = DB.getDevices();
    const now = new Date();

    devices.forEach(device => {
        if (device.status === 'online' && device.last_report) {
            const lastReport = new Date(device.last_report);
            const diffMinutes = (now - lastReport) / 1000 / 60;

            if (diffMinutes > 5) {
                DB.updateDeviceStatus(device.id, 'offline');
                const alertMsg = `${device.name}(${device.device_id}) 已离线超过5分钟，最后上报时间: ${device.last_report}`;
                const alert = DB.addAlert(device.id, 'disconnect_offline', 'warning', alertMsg);

                broadcast('device_offline', {
                    device_id: device.device_id,
                    device_name: device.name,
                    message: alertMsg
                });

                sendWechatAlert(`## 设备离线告警\n> **${device.name}** (${device.device_id})\n> - 最后上报: ${device.last_report}\n> - 时间: ${now.toLocaleString('zh-CN')}`);
            }
        }
    });
});

// ============================================================
// 启动服务器
// ============================================================

// 确保数据库已初始化
try {
    DB.getDevices();
    console.log('[OK] 数据库连接成功');
} catch (err) {
    console.error('[ERROR] 数据库连接失败，请先运行: node db/init.js');
    console.error(`  错误信息: ${err.message}`);
    process.exit(1);
}

// ============================================================
// 数据定时导出（每月一次）
// ============================================================
function runMonthlyExport() {
    try {
        const now = new Date();
        // 导出上个月的数据
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = lastMonth.getFullYear();
        const month = String(lastMonth.getMonth() + 1).padStart(2, '0');
        const monthStr = `${year}-${month}`;
        const startDate = `${monthStr}-01`;
        const endDate = `${monthStr}-${new Date(year, lastMonth.getMonth() + 1, 0).getDate()}`;

        const state = DB.getSystemState();
        const exportDir = state.export_path || './exports';
        const exportPath = path.join(exportDir, `records_${monthStr}.csv`);

        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const result = DB.exportRecordsToCSV(startDate, endDate);
        if (result.count > 0) {
            fs.writeFileSync(exportPath, result.csv, 'utf8');
            console.log(`[导出] 已导出 ${monthStr} 共 ${result.count} 条记录到 ${exportPath}`);
        } else {
            console.log(`[导出] ${monthStr} 无记录，跳过导出`);
        }
    } catch (err) {
        console.error('[导出] 定时导出失败:', err.message);
    }
}

// 每月1号按配置时间执行导出
function scheduleMonthlyExport() {
    const state = DB.getSystemState();
    const timeStr = state.export_time || '10:00';
    const [hour, minute] = timeStr.split(':').map(Number);

    const now = new Date();
    // 计算下个月的1号
    let nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1, hour, minute, 0);
    // 如果今天是1号且还没到导出时间，则今天执行
    if (now.getDate() === 1 && (now.getHours() < hour || (now.getHours() === hour && now.getMinutes() < minute))) {
        nextRun = new Date(now.getFullYear(), now.getMonth(), 1, hour, minute, 0);
    }

    const msUntil = nextRun - now;
    const daysUntil = Math.ceil(msUntil / (24 * 60 * 60 * 1000));

    setTimeout(() => {
        runMonthlyExport();
        // 之后每月执行一次
        setInterval(runMonthlyExport, 30 * 24 * 60 * 60 * 1000);
    }, msUntil);

    console.log(`[导出] 已设置每月定时导出，时间: ${timeStr}，下次执行: ${nextRun.toLocaleString('zh-CN')}（约${daysUntil}天后）`);
}

// ============================================================
// 启动服务器
// ============================================================

server.listen(CONFIG.PORT, () => {
    const ips = getLocalIPs();

    console.log('='.repeat(55));
    console.log('  智感温盾 - 实验室实时温度监测与预警系统');
    console.log('='.repeat(55));
    console.log(`  HTTP 服务: http://localhost:${CONFIG.PORT}`);
    ips.forEach(ip => console.log(`  局域网访问: http://${ip}:${CONFIG.PORT}`));
    console.log(`  WebSocket: ws://localhost:${CONFIG.PORT}/ws`);
    console.log('='.repeat(55));

    // 断电恢复：读取系统状态
    const sysState = DB.getSystemState();
    if (sysState.demo_mode_enabled === 1) {
        console.log('[恢复] 检测到上次为演示模式，自动恢复...');
        simulatorInstance = startSimulator();
        demoModeEnabled = true;
        console.log('='.repeat(55));
    } else if (CONFIG.DEV_MODE) {
        console.log('  [开发模式] 模拟数据生成已启用');
        console.log('='.repeat(55));
        simulatorInstance = startSimulator();
    } else {
        console.log('  [生产模式] MQTT数据采集已启用');
        console.log('='.repeat(55));
        initMQTT();
    }

    // 启动定时导出（每月）
    scheduleMonthlyExport();

    console.log(`  默认账号: admin / admin123`);
    console.log('='.repeat(55));
});

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n[INFO] 正在关闭服务器...');
    DB.setSystemState({ last_shutdown: new Date().toISOString() });
    if (simulatorInstance) stopSimulator();
    if (mqttClient) mqttClient.end(true);
    wss.close();
    server.close(() => {
        console.log('[INFO] 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n[INFO] 收到终止信号，正在关闭...');
    DB.setSystemState({ last_shutdown: new Date().toISOString() });
    if (simulatorInstance) stopSimulator();
    if (mqttClient) mqttClient.end(true);
    wss.close();
    server.close(() => {
        process.exit(0);
    });
});
