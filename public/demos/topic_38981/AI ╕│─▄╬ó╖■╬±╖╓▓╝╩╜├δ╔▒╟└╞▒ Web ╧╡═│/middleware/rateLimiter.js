const logger = require('../utils/logger');

class AdvancedRateLimiter {
  constructor(options = {}) {
    this.config = {
      maxRequestsPerSecond: options.maxRequestsPerSecond || 10,
      maxRequestsPerMinute: options.maxRequestsPerMinute || 100,
      maxRequestsPerHour: options.maxRequestsPerHour || 1000,
      blockDurationMinutes: options.blockDurationMinutes || 5,
      allowList: options.allowList || [],
      debugMode: options.debugMode || false
    };

    this.clients = new Map();
    this.blockedIPs = new Map();
    this.blockedUsers = new Map();

    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      rateLimitedRequests: 0,
      allowedRequests: 0
    };

    setInterval(() => this.cleanup(), 60000);
  }

  getClientKey(req) {
    const userId = req.user?.userId || req.user?.id || null;
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    return { userId, ip };
  }

  isAllowListed(ip) {
    return this.config.allowList.some(entry => {
      if (entry.includes('/')) {
        return this.isIPInCIDR(ip, entry);
      }
      return ip === entry || ip === `::ffff:${entry}`;
    });
  }

  isIPInCIDR(ip, cidr) {
    try {
      const [network, prefix] = cidr.split('/');
      const ipNum = this.ipToNumber(ip);
      const networkNum = this.ipToNumber(network);
      const mask = 0xFFFFFFFF << (32 - parseInt(prefix));
      return (ipNum & mask) === (networkNum & mask);
    } catch {
      return false;
    }
  }

  ipToNumber(ip) {
    const normalized = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    return normalized.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  getClientStats(clientKey) {
    const key = JSON.stringify(clientKey);
    if (!this.clients.has(key)) {
      this.clients.set(key, {
        second: { count: 0, reset: Date.now() + 1000 },
        minute: { count: 0, reset: Date.now() + 60000 },
        hour: { count: 0, reset: Date.now() + 3600000 },
        violations: 0,
        lastViolation: null
      });
    }
    return this.clients.get(key);
  }

  check(req) {
    this.stats.totalRequests++;

    const { userId, ip } = this.getClientKey(req);

    if (this.isAllowListed(ip)) {
      this.stats.allowedRequests++;
      return { allowed: true, message: '白名单用户' };
    }

    if (this.blockedIPs.has(ip)) {
      const blockEnd = this.blockedIPs.get(ip);
      if (Date.now() < blockEnd) {
        this.stats.blockedRequests++;
        const remaining = Math.ceil((blockEnd - Date.now()) / 60000);
        return {
          allowed: false,
          blocked: true,
          message: `IP已被封禁，剩余 ${remaining} 分钟`,
          remainingMinutes: remaining
        };
      }
      this.blockedIPs.delete(ip);
    }

    if (userId && this.blockedUsers.has(userId)) {
      const blockEnd = this.blockedUsers.get(userId);
      if (Date.now() < blockEnd) {
        this.stats.blockedRequests++;
        const remaining = Math.ceil((blockEnd - Date.now()) / 60000);
        return {
          allowed: false,
          blocked: true,
          message: `账号已被封禁，剩余 ${remaining} 分钟`,
          remainingMinutes: remaining
        };
      }
      this.blockedUsers.delete(userId);
    }

    const clientKey = { userId, ip };
    const stats = this.getClientStats(clientKey);
    const now = Date.now();

    if (stats.second.reset < now) {
      stats.second = { count: 0, reset: now + 1000 };
    }
    if (stats.minute.reset < now) {
      stats.minute = { count: 0, reset: now + 60000 };
    }
    if (stats.hour.reset < now) {
      stats.hour = { count: 0, reset: now + 3600000 };
    }

    stats.second.count++;
    stats.minute.count++;
    stats.hour.count++;

    const violations = [];
    if (stats.second.count > this.config.maxRequestsPerSecond) {
      violations.push(`秒级超限 (${stats.second.count}/${this.config.maxRequestsPerSecond})`);
    }
    if (stats.minute.count > this.config.maxRequestsPerMinute) {
      violations.push(`分钟级超限 (${stats.minute.count}/${this.config.maxRequestsPerMinute})`);
    }
    if (stats.hour.count > this.config.maxRequestsPerHour) {
      violations.push(`小时级超限 (${stats.hour.count}/${this.config.maxRequestsPerHour})`);
    }

    if (violations.length > 0) {
      stats.violations++;
      stats.lastViolation = now;

      if (stats.violations >= 3 || this.config.debugMode === false) {
        const blockEnd = now + this.config.blockDurationMinutes * 60000;
        if (userId) {
          this.blockedUsers.set(userId, blockEnd);
          logger.warn(`User blocked: ${userId}`, { ip, violations });
        } else {
          this.blockedIPs.set(ip, blockEnd);
          logger.warn(`IP blocked: ${ip}`, { violations });
        }
        this.stats.blockedRequests++;
        return {
          allowed: false,
          blocked: true,
          message: `请求过于频繁，已被封禁 ${this.config.blockDurationMinutes} 分钟`,
          violations
        };
      }

      this.stats.rateLimitedRequests++;
      return {
        allowed: false,
        blocked: false,
        message: `请求过于频繁，请稍后重试`,
        violations,
        retryAfter: 60
      };
    }

    this.stats.allowedRequests++;
    return {
      allowed: true,
      remaining: {
        second: this.config.maxRequestsPerSecond - stats.second.count,
        minute: this.config.maxRequestsPerMinute - stats.minute.count,
        hour: this.config.maxRequestsPerHour - stats.hour.count
      }
    };
  }

  middleware() {
    return (req, res, next) => {
      const result = this.check(req);

      if (!result.allowed) {
        const status = result.blocked ? 423 : 429;
        res.status(status).json({
          code: status,
          message: result.message,
          ...(result.remainingMinutes && { remainingMinutes: result.remainingMinutes }),
          ...(result.retryAfter && { retryAfter: result.retryAfter })
        });
        return;
      }

      res.setHeader('X-RateLimit-Remaining-Second', result.remaining?.second || 'N/A');
      res.setHeader('X-RateLimit-Remaining-Minute', result.remaining?.minute || 'N/A');
      res.setHeader('X-RateLimit-Remaining-Hour', result.remaining?.hour || 'N/A');

      next();
    };
  }

  unblockIP(ip) {
    if (this.blockedIPs.has(ip)) {
      this.blockedIPs.delete(ip);
      logger.info(`IP unblocked: ${ip}`);
      return { success: true, message: 'IP已解封' };
    }
    return { success: false, message: '该IP未被封禁' };
  }

  unblockUser(userId) {
    if (this.blockedUsers.has(userId)) {
      this.blockedUsers.delete(userId);
      logger.info(`User unblocked: ${userId}`);
      return { success: true, message: '用户已解封' };
    }
    return { success: false, message: '该用户未被封禁' };
  }

  getStats() {
    return {
      config: this.config,
      stats: this.stats,
      blockedIPCount: this.blockedIPs.size,
      blockedUserCount: this.blockedUsers.size,
      trackedClientCount: this.clients.size
    };
  }

  cleanup() {
    const now = Date.now();
    this.blockedIPs.forEach((endTime, ip) => {
      if (now > endTime) {
        this.blockedIPs.delete(ip);
      }
    });
    this.blockedUsers.forEach((endTime, userId) => {
      if (now > endTime) {
        this.blockedUsers.delete(userId);
      }
    });
    this.clients.forEach((stats, key) => {
      if (stats.lastViolation && now - stats.lastViolation > 3600000) {
        this.clients.delete(key);
      }
    });
  }
}

const advancedRateLimiter = new AdvancedRateLimiter({
  maxRequestsPerSecond: 5,
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 500,
  blockDurationMinutes: 5,
  allowList: ['127.0.0.1', '::1'],
  debugMode: process.env.NODE_ENV !== 'production'
});

module.exports = {
  AdvancedRateLimiter,
  advancedRateLimiter
};