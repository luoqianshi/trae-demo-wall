class TokenBucketRateLimiter {
    constructor(options = {}) {
        this.bucketCapacity = options.bucketCapacity || 100;
        this.refillRate = options.refillRate || 10;
        this.refillInterval = options.refillInterval || 1000;
        this.keyPrefix = options.keyPrefix || 'rl:';
        this.defaultLimit = options.defaultLimit || { capacity: 100, rate: 10 };
        this.routeLimits = options.routeLimits || {};
        this.maxKeys = options.maxKeys || 100000;
        this.ttl = options.ttl || 5 * 60 * 1000;
        this.cache = new Map();
        this.lastCleanup = Date.now();
        this.cleanupInterval = options.cleanupInterval || 60 * 1000;
    }

    getBucket(key, routeLimit) {
        let bucket = this.cache.get(key);
        const now = Date.now();
        const capacity = routeLimit ? routeLimit.capacity : this.bucketCapacity;
        const rate = routeLimit ? routeLimit.rate : this.refillRate;
        const interval = this.refillInterval;

        if (!bucket) {
            bucket = {
                tokens: capacity,
                lastRefill: now,
                capacity: capacity,
                rate: rate
            };
            this.cache.set(key, bucket);
            return bucket;
        }

        if (now > bucket.lastRefill) {
            const elapsed = now - bucket.lastRefill;
            const tokensToAdd = Math.floor((elapsed / interval) * rate);
            if (tokensToAdd > 0) {
                bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
                bucket.lastRefill = now;
            }
        }

        return bucket;
    }

    tryAcquire(key, tokens = 1, routeLimit = null) {
        const bucket = this.getBucket(key, routeLimit);
        if (bucket.tokens >= tokens) {
            bucket.tokens -= tokens;
            this.cache.set(key, bucket);
            return {
                success: true,
                remaining: bucket.tokens,
                limit: bucket.capacity,
                retryAfter: 0
            };
        }

        const missingTokens = tokens - bucket.tokens;
        const rate = routeLimit ? routeLimit.rate : this.refillRate;
        const retryAfter = Math.ceil((missingTokens / rate) * (this.refillInterval / 1000));

        return {
            success: false,
            remaining: bucket.tokens,
            limit: bucket.capacity,
            retryAfter: retryAfter
        };
    }

    middleware(options = {}) {
        const self = this;
        return function rateLimitMiddleware(req, res, next) {
            const routeKey = req.method + ':' + req.path;
            const routeLimit = self.routeLimits[routeKey];

            const key = self.keyPrefix + self.getKey(req);
            const result = self.tryAcquire(key, 1, routeLimit);

            res.setHeader('X-RateLimit-Limit', result.limit);
            res.setHeader('X-RateLimit-Remaining', result.remaining);

            if (!result.success) {
                res.setHeader('Retry-After', result.retryAfter);
                return res.status(429).json({
                    code: 50001,
                    message: '请求过于频繁，请稍后再试',
                    data: null,
                    details: {
                        retry_after: result.retryAfter,
                        limit: result.limit
                    },
                    request_id: req.requestId || '',
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }

            next();
        };
    }

    getKey(req) {
        const ip = req.headers['x-forwarded-for']
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : req.ip || req.connection.remoteAddress;
        const deviceId = req.headers['x-device-id'] || 'unknown';
        const appKey = req.headers['x-app-key'] || 'unknown';
        return `${ip}:${appKey}:${deviceId}`;
    }

    getStats() {
        return {
            cache_size: this.cache.size,
            max_size: this.maxKeys
        };
    }

    cleanup() {
        const now = Date.now();
        if (now - this.lastCleanup < this.cleanupInterval) return;

        const keysToDelete = [];
        for (const [key, bucket] of this.cache) {
            if (now - bucket.lastRefill > this.ttl) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        this.lastCleanup = now;
    }
}

module.exports = TokenBucketRateLimiter;
