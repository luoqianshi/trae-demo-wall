const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const responseTime = require('response-time');
const { v4: uuidv4 } = require('uuid');

const requestIdMiddleware = require('./middleware/requestId');
const TokenBucketRateLimiter = require('./middleware/tokenBucketLimiter');
const IPLimiter = require('./middleware/ipLimiter');
const SignatureAuth = require('./middleware/signatureAuth');
const DegradeManager = require('./middleware/degradeManager');
const SimpleWAF = require('./middleware/simpleWaf');

const app = express();
const PORT = process.env.PORT || 3000;

const logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
    error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`)
};

const ipLimiter = new IPLimiter({
    autoBanThreshold: 500,
    banDuration: 30 * 60 * 1000,
    windowMs: 60 * 1000,
    whitelist: [
        '127.0.0.1',
        '::1',
        '10.0.0.0/8',
        '192.168.0.0/16'
    ],
    logger: logger
});

const rateLimiter = new TokenBucketRateLimiter({
    bucketCapacity: 100,
    refillRate: 50,
    refillInterval: 1000,
    maxKeys: 100000,
    routeLimits: {
        'POST:/v1/emergency/location/report': { capacity: 30, rate: 1 },
        'GET:/v1/emergency/location/query': { capacity: 200, rate: 100 },
        'POST:/v1/emergency/call/status': { capacity: 100, rate: 50 },
        'GET:/v1/emergency/history/list': { capacity: 50, rate: 20 },
        'GET:/v1/statistics/overview': { capacity: 20, rate: 5 }
    },
    logger: logger
});

const signatureAuth = new SignatureAuth({
    appSecrets: {
        'test_app_key_001': 'test_secret_key_abcdef123456',
        'emergency_sdk_v2': 'sdk_secret_2024_miaoda_v2'
    },
    timestampTolerance: 300,
    enableNonceCheck: true,
    logger: logger
});

const degradeManager = new DegradeManager({
    maxNormalQps: 10000,
    thresholds: {
        L1: { qps: 0.7 },
        L2: { qps: 1.0 },
        L3: { qps: 1.5 },
        L4: { qps: 2.5 },
        L5: { qps: 4.0 }
    },
    logger: logger,
    onLevelChange: (oldLevel, newLevel, reason) => {
        logger.warn(`降级级别变更: ${oldLevel} -> ${newLevel}, 原因: ${reason}`);
    }
});

const waf = new SimpleWAF({ logger: logger });

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: ['https://*.miaoda.gov.cn'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-App-Key', 'X-Timestamp', 'X-Nonce', 'X-Signature', 'X-Device-Id', 'X-Request-Id']
}));

app.use(express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(responseTime());

app.use(requestIdMiddleware());

app.use(ipLimiter.middleware());

app.use(waf.middleware());

app.use(degradeManager.middleware());

const rateLimitMiddleware = rateLimiter.middleware();
app.use((req, res, next) => {
    if (req.path.startsWith('/v1/public/') || req.path === '/health' || req.path === '/stats') {
        return next();
    }
    return rateLimitMiddleware(req, res, next);
});

app.use((req, res, next) => {
    if (req.path.startsWith('/v1/public/') || req.path === '/health' || req.path === '/stats') {
        return next();
    }
    return signatureAuth.middleware()(req, res, next);
});

const locationData = new Map();
const callSessions = new Map();
let totalReports = 0;

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Math.floor(Date.now() / 1000),
        uptime: process.uptime(),
        degrade_level: degradeManager.getLevel()
    });
});

app.get('/stats', (req, res) => {
    res.json({
        code: 0,
        data: {
            total_reports: totalReports,
            active_sessions: callSessions.size,
            degrade: degradeManager.getStats(),
            rate_limiter: rateLimiter.getStats(),
            ip_limiter: ipLimiter.getStats(),
            waf: waf.getStats(),
            signature: signatureAuth.getStats()
        },
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.post('/v1/public/test-signature', (req, res) => {
    const { method, path, timestamp, nonce, body, appKey } = req.body;
    const secret = signatureAuth.appSecrets[appKey] || 'test_secret';

    const crypto = require('crypto');
    const bodyHash = crypto.createHash('sha256').update(body || '').digest('hex').toLowerCase();

    const stringToSign = [
        method || 'POST',
        path || '/v1/emergency/location/report',
        timestamp || Math.floor(Date.now() / 1000),
        nonce || uuidv4().replace(/-/g, ''),
        bodyHash
    ].join('\n');

    const signature = crypto
        .createHmac('sha256', secret)
        .update(stringToSign)
        .digest('hex')
        .toLowerCase();

    res.json({
        code: 0,
        data: {
            string_to_sign: stringToSign,
            body_hash: bodyHash,
            signature: signature
        },
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.post('/v1/emergency/location/report', (req, res) => {
    const body = req.body;

    if (!body.call_session_id || !body.emergency_type || !body.caller_number_hash || !body.location) {
        return res.status(400).json({
            code: 30001,
            message: '缺少必填参数',
            data: null,
            details: {
                required: ['call_session_id', 'emergency_type', 'caller_number_hash', 'location']
            },
            request_id: req.requestId,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    totalReports++;
    const reportId = `rep_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const receivedAt = Math.floor(Date.now() / 1000);

    const reportData = {
        report_id: reportId,
        call_session_id: body.call_session_id,
        emergency_type: body.emergency_type,
        caller_number: body.caller_number || '',
        caller_number_hash: body.caller_number_hash,
        callee_number: body.callee_number || '',
        device_id: body.device_id || '',
        device_type: body.device_type || '',
        location: body.location,
        altitude: body.altitude || null,
        bearing: body.bearing || null,
        speed: body.speed || null,
        network_type: body.network_type || '',
        carrier: body.carrier || '',
        battery_level: body.battery_level || null,
        report_time: receivedAt,
        sdk_version: body.sdk_version || ''
    };

    locationData.set(body.call_session_id, reportData);

    if (!callSessions.has(body.call_session_id)) {
        callSessions.set(body.call_session_id, {
            session_id: body.call_session_id,
            status: 'calling',
            reports: [],
            first_report_at: receivedAt,
            last_report_at: receivedAt
        });
    }

    const session = callSessions.get(body.call_session_id);
    session.reports.push(reportId);
    session.last_report_at = receivedAt;

    res.json({
        code: 0,
        message: 'success',
        data: {
            report_id: reportId,
            received_at: receivedAt,
            dispatch_status: 'dispatched',
            estimated_arrival_seconds: 2
        },
        request_id: req.requestId,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.get('/v1/emergency/location/query', (req, res) => {
    const { call_session_id, caller_number_hash, report_id } = req.query;

    let targetReport = null;

    if (call_session_id) {
        targetReport = locationData.get(call_session_id);
    } else if (report_id) {
        for (const [sessionId, data] of locationData) {
            if (data.report_id === report_id) {
                targetReport = data;
                break;
            }
        }
    } else if (caller_number_hash) {
        for (const [sessionId, data] of locationData) {
            if (data.caller_number_hash === caller_number_hash) {
                targetReport = data;
                break;
            }
        }
    }

    if (!targetReport) {
        return res.json({
            code: 40002,
            message: '位置信息不存在',
            data: null,
            details: {},
            request_id: req.requestId,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    const session = callSessions.get(targetReport.call_session_id) || {};

    res.json({
        code: 0,
        message: 'success',
        data: {
            call_session_id: targetReport.call_session_id,
            emergency_type: targetReport.emergency_type,
            caller_number: targetReport.caller_number,
            status: session.status || 'connected',
            location: targetReport.location,
            address: generateMockAddress(targetReport.location),
            first_report_at: session.first_report_at,
            last_report_at: session.last_report_at,
            report_count: (session.reports || []).length,
            device_info: {
                device_type: targetReport.device_type,
                network_type: targetReport.network_type,
                battery_level: targetReport.battery_level
            }
        },
        request_id: req.requestId,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.post('/v1/emergency/call/status', (req, res) => {
    const { call_session_id, status, caller_number, callee_number } = req.body;

    if (!call_session_id || !status) {
        return res.status(400).json({
            code: 30001,
            message: '缺少必填参数',
            data: null,
            request_id: req.requestId,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    let session = callSessions.get(call_session_id);
    if (!session) {
        session = {
            session_id: call_session_id,
            status: status,
            reports: [],
            first_report_at: Math.floor(Date.now() / 1000),
            last_report_at: Math.floor(Date.now() / 1000)
        };
        callSessions.set(call_session_id, session);
    }

    session.status = status;

    res.json({
        code: 0,
        message: 'success',
        data: {
            synced: true
        },
        request_id: req.requestId,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.get('/v1/emergency/history/list', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.page_size) || 20;

    const allReports = Array.from(locationData.values());
    const total = allReports.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const list = allReports.slice(start, start + pageSize).map(r => ({
        report_id: r.report_id,
        call_session_id: r.call_session_id,
        emergency_type: r.emergency_type,
        caller_number: r.caller_number,
        first_location: r.location,
        address: generateMockAddress(r.location),
        report_time: r.report_time,
        dispatch_duration: 2
    }));

    res.json({
        code: 0,
        message: 'success',
        data: {
            list,
            total,
            page,
            page_size: pageSize,
            total_pages: totalPages
        },
        request_id: req.requestId,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.get('/v1/statistics/overview', (req, res) => {
    const stats = {
        total_calls: totalReports,
        avg_dispatch_time: 4.2,
        success_rate: 99.7,
        police_count: Math.floor(totalReports * 0.6),
        fire_count: Math.floor(totalReports * 0.2),
        medical_count: Math.floor(totalReports * 0.2),
        avg_accuracy: 28.5,
        active_calls: callSessions.size
    };

    res.json({
        code: 0,
        message: 'success',
        data: stats,
        request_id: req.requestId,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.post('/admin/degrade/set', (req, res) => {
    const { level, reason } = req.body;
    degradeManager.setLevel(level, reason || 'manual_admin');
    res.json({
        code: 0,
        data: {
            current_level: degradeManager.getLevel()
        },
        request_id: req.requestId,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.use((err, req, res, next) => {
    logger.error(`未处理的错误: ${err.message}`);
    res.status(500).json({
        code: 10001,
        message: '系统内部错误',
        data: null,
        request_id: req.requestId,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

app.use((req, res) => {
    res.status(404).json({
        code: 30004,
        message: '接口不存在',
        data: null,
        request_id: req.requestId,
        timestamp: Math.floor(Date.now() / 1000)
    });
});

function generateMockAddress(location) {
    const areas = ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区'];
    const streets = ['长安街', '王府井大街', '建国路', '中关村大街', '三里屯路'];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const num = Math.floor(Math.random() * 100) + 1;
    return `北京市${area}${street}${num}号`;
}

setInterval(() => {
    ipLimiter.cleanup();
    rateLimiter.cleanup();
    signatureAuth.cleanupNonceCache();
    degradeManager.autoCheck();
}, 60 * 1000);

app.listen(PORT, () => {
    logger.info(`========================================`);
    logger.info(`  秒达定位 API 服务已启动`);
    logger.info(`  端口: ${PORT}`);
    logger.info(`  环境: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`========================================`);
    logger.info(`  健康检查: http://localhost:${PORT}/health`);
    logger.info(`  系统状态: http://localhost:${PORT}/stats`);
    logger.info(`  签名测试: http://localhost:${PORT}/v1/public/test-signature`);
    logger.info(`========================================`);
});

module.exports = app;
