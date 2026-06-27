class DegradeManager {
    constructor(options = {}) {
        this.currentLevel = 'L0';
        this.levels = {
            L0: { name: '正常', description: '全部功能正常' },
            L1: { name: '预警', description: '关闭非核心接口的详细日志' },
            L2: { name: '轻度降级', description: '关闭统计报表、历史查询等P3接口' },
            L3: { name: '中度降级', description: '只保留P0、P1核心接口' },
            L4: { name: '重度降级', description: '只保留紧急位置上报核心功能' },
            L5: { name: '紧急模式', description: '只读模式，只接收位置上报' }
        };
        this.priorityRoutes = {
            P0: [
                'POST:/v1/emergency/location/report',
                'GET:/v1/emergency/location/query'
            ],
            P1: [
                'POST:/v1/emergency/call/status',
                'WS:/v1/emergency/location/ws'
            ],
            P2: [
                'GET:/v1/emergency/history/list',
                'GET:/v1/emergency/history/detail'
            ],
            P3: [
                'GET:/v1/statistics/overview',
                'GET:/v1/statistics/trend',
                'GET:/v1/statistics/distribution'
            ],
            P4: [
                'GET:/v1/admin/users',
                'POST:/v1/admin/config',
                'GET:/v1/admin/logs'
            ]
        };
        this.stats = {
            qps: 0,
            errorRate: 0,
            avgResponseTime: 0,
            cpuUsage: 0,
            memoryUsage: 0
        };
        this.thresholds = options.thresholds || {
            L1: { qps: 0.8 },
            L2: { qps: 1.0 },
            L3: { qps: 1.5 },
            L4: { qps: 2.0 },
            L5: { qps: 3.0, cpu: 0.95, memory: 0.95 }
        };
        this.maxNormalQps = options.maxNormalQps || 10000;
        this.logger = options.logger || console;
        this.onLevelChange = options.onLevelChange || null;
        this.requestCount = 0;
        this.errorCount = 0;
        this.totalResponseTime = 0;
        this.lastCheckTime = Date.now();
        this.history = [];
    }

    setLevel(level, reason = 'manual') {
        const oldLevel = this.currentLevel;
        if (level === oldLevel) return;

        if (!this.levels[level]) {
            this.logger.error(`[降级管理] 无效的降级级别: ${level}`);
            return;
        }

        this.currentLevel = level;
        this.history.push({
            oldLevel,
            newLevel: level,
            reason,
            timestamp: Date.now()
        });

        this.logger.warn(`[降级管理] 级别变更: ${oldLevel} -> ${level} (${this.levels[level].name}), 原因: ${reason}`);

        if (this.onLevelChange) {
            this.onLevelChange(oldLevel, level, reason);
        }
    }

    getLevel() {
        return this.currentLevel;
    }

    isRouteAllowed(routeKey) {
        const level = this.currentLevel;
        const priority = this.getRoutePriority(routeKey);

        if (level === 'L0') return true;
        if (level === 'L1') return true;
        if (level === 'L2') return priority !== 'P3' && priority !== 'P4';
        if (level === 'L3') return priority === 'P0' || priority === 'P1';
        if (level === 'L4') return priority === 'P0';
        if (level === 'L5') return routeKey.startsWith('POST:/v1/emergency/location/report');

        return true;
    }

    getRoutePriority(routeKey) {
        for (const [priority, routes] of Object.entries(this.priorityRoutes)) {
            if (routes.some(r => routeKey === r || routeKey.startsWith(r.replace('*', '')))) {
                return priority;
            }
        }
        return 'P4';
    }

    recordRequest(routeKey, statusCode, responseTime) {
        this.requestCount++;
        this.totalResponseTime += responseTime;
        if (statusCode >= 500) {
            this.errorCount++;
        }
    }

    autoCheck() {
        const now = Date.now();
        const elapsed = (now - this.lastCheckTime) / 1000;
        if (elapsed < 10) return;

        const qps = this.requestCount / elapsed;
        const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
        const avgResp = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;

        this.stats.qps = qps;
        this.stats.errorRate = errorRate;
        this.stats.avgResponseTime = avgResp;

        const qpsRatio = qps / this.maxNormalQps;

        let targetLevel = 'L0';

        if (qpsRatio >= this.thresholds.L5.qps) {
            targetLevel = 'L5';
        } else if (qpsRatio >= this.thresholds.L4.qps) {
            targetLevel = 'L4';
        } else if (qpsRatio >= this.thresholds.L3.qps) {
            targetLevel = 'L3';
        } else if (qpsRatio >= this.thresholds.L2.qps) {
            targetLevel = 'L2';
        } else if (qpsRatio >= this.thresholds.L1.qps) {
            targetLevel = 'L1';
        }

        if (targetLevel !== this.currentLevel) {
            this.setLevel(targetLevel, `auto_qps_${qpsRatio.toFixed(2)}`);
        }

        this.requestCount = 0;
        this.errorCount = 0;
        this.totalResponseTime = 0;
        this.lastCheckTime = now;
    }

    middleware() {
        const self = this;
        return function degradeMiddleware(req, res, next) {
            const routeKey = `${req.method}:${req.path}`;

            if (!self.isRouteAllowed(routeKey)) {
                return res.status(503).json({
                    code: 50003,
                    message: '系统负载过高，该接口暂时不可用',
                    data: null,
                    details: {
                        current_level: self.currentLevel,
                        level_name: self.levels[self.currentLevel].name,
                        route_priority: self.getRoutePriority(routeKey)
                    },
                    request_id: req.requestId || '',
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }

            req.degradeLevel = self.currentLevel;
            const startTime = Date.now();

            const originalEnd = res.end;
            res.end = function(chunk, encoding) {
                const responseTime = Date.now() - startTime;
                self.recordRequest(routeKey, res.statusCode, responseTime);
                res.setHeader('X-Degrade-Level', self.currentLevel);
                return originalEnd.call(res, chunk, encoding);
            };

            next();
        };
    }

    getStats() {
        return {
            current_level: this.currentLevel,
            level_name: this.levels[this.currentLevel].name,
            stats: this.stats,
            history: this.history.slice(-10)
        };
    }
}

module.exports = DegradeManager;
