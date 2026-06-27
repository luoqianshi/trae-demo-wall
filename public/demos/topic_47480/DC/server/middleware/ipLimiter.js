class IPLimiter {
    constructor(options = {}) {
        this.blacklist = new Set(options.blacklist || []);
        this.whitelist = new Set(options.whitelist || []);
        this.dynamicBlacklist = new Map();
        this.autoBanThreshold = options.autoBanThreshold || 100;
        this.banDuration = options.banDuration || 60 * 60 * 1000;
        this.requestCount = new Map();
        this.windowMs = options.windowMs || 60 * 1000;
        this.logger = options.logger || console;
    }

    addToBlacklist(ip, reason = 'manual', duration = null) {
        this.blacklist.add(ip);
        this.dynamicBlacklist.set(ip, {
            reason: reason,
            addedAt: Date.now(),
            expireAt: duration ? Date.now() + duration : null
        });
        this.logger.warn(`[IP黑名单] IP ${ip} 已加入黑名单，原因: ${reason}`);
    }

    removeFromBlacklist(ip) {
        this.blacklist.delete(ip);
        this.dynamicBlacklist.delete(ip);
        this.logger.info(`[IP黑名单] IP ${ip} 已从黑名单移除`);
    }

    addToWhitelist(ip) {
        this.whitelist.add(ip);
        this.logger.info(`[IP白名单] IP ${ip} 已加入白名单`);
    }

    removeFromWhitelist(ip) {
        this.whitelist.delete(ip);
        this.logger.info(`[IP白名单] IP ${ip} 已从白名单移除`);
    }

    isWhitelisted(ip) {
        return this.whitelist.has(ip);
    }

    isBlacklisted(ip) {
        if (this.whitelist.has(ip)) return false;

        const entry = this.dynamicBlacklist.get(ip);
        if (entry && entry.expireAt && Date.now() > entry.expireAt) {
            this.dynamicBlacklist.delete(ip);
            this.blacklist.delete(ip);
            return false;
        }

        return this.blacklist.has(ip);
    }

    recordRequest(ip) {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        if (!this.requestCount.has(ip)) {
            this.requestCount.set(ip, []);
        }

        const timestamps = this.requestCount.get(ip);
        timestamps.push(now);

        const filtered = timestamps.filter(t => t > windowStart);
        this.requestCount.set(ip, filtered);

        if (filtered.length > this.autoBanThreshold) {
            this.addToBlacklist(ip, 'auto_ban_exceed_threshold', this.banDuration);
            return true;
        }

        return false;
    }

    middleware() {
        const self = this;
        return function ipLimitMiddleware(req, res, next) {
            const ip = self.getClientIP(req);

            if (self.isWhitelisted(ip)) {
                req.isWhitelisted = true;
                return next();
            }

            if (self.isBlacklisted(ip)) {
                const entry = self.dynamicBlacklist.get(ip);
                return res.status(403).json({
                    code: 50002,
                    message: 'IP地址被限制访问',
                    data: null,
                    details: {
                        ip: ip,
                        reason: entry ? entry.reason : 'blacklisted',
                        expire_at: entry && entry.expireAt ? new Date(entry.expireAt).toISOString() : 'permanent'
                    },
                    request_id: req.requestId || '',
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }

            const isBanned = self.recordRequest(ip);
            if (isBanned) {
                return res.status(403).json({
                    code: 50002,
                    message: 'IP地址因异常请求被临时限制',
                    data: null,
                    details: {
                        ip: ip,
                        reason: 'auto_ban',
                        ban_duration_ms: self.banDuration
                    },
                    request_id: req.requestId || '',
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }

            req.clientIP = ip;
            next();
        };
    }

    getClientIP(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.connection.remoteAddress || 'unknown';
    }

    getStats() {
        return {
            whitelist_count: this.whitelist.size,
            blacklist_count: this.blacklist.size,
            monitored_ips: this.requestCount.size
        };
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, entry] of this.dynamicBlacklist) {
            if (entry.expireAt && now > entry.expireAt) {
                this.dynamicBlacklist.delete(ip);
                this.blacklist.delete(ip);
            }
        }
    }
}

module.exports = IPLimiter;
