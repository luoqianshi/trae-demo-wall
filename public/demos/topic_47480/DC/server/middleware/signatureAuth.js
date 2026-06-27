const crypto = require('crypto');

class SignatureAuth {
    constructor(options = {}) {
        this.appSecrets = options.appSecrets || {};
        this.timestampTolerance = options.timestampTolerance || 300;
        this.nonceCache = new Map();
        this.nonceExpireMs = options.nonceExpireMs || 5 * 60 * 1000;
        this.logger = options.logger || console;
        this.enableNonceCheck = options.enableNonceCheck !== false;
    }

    registerApp(appKey, appSecret) {
        this.appSecrets[appKey] = appSecret;
    }

    verifySignature(req) {
        const appKey = req.headers['x-app-key'];
        const timestamp = req.headers['x-timestamp'];
        const nonce = req.headers['x-nonce'];
        const signature = req.headers['x-signature'];

        if (!appKey || !timestamp || !nonce || !signature) {
            return { valid: false, reason: 'missing_headers' };
        }

        const appSecret = this.appSecrets[appKey];
        if (!appSecret) {
            return { valid: false, reason: 'invalid_app_key' };
        }

        const ts = parseInt(timestamp, 10);
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - ts) > this.timestampTolerance) {
            return { valid: false, reason: 'timestamp_expired' };
        }

        if (this.enableNonceCheck) {
            const nonceKey = `${appKey}:${nonce}`;
            if (this.nonceCache.has(nonceKey)) {
                return { valid: false, reason: 'nonce_reused' };
            }
            this.nonceCache.set(nonceKey, Date.now());
        }

        const method = req.method.toUpperCase();
        const path = req.originalUrl || req.url;
        const body = req.rawBody || '';
        const bodyHash = crypto.createHash('sha256').update(body).digest('hex').toLowerCase();

        const stringToSign = [
            method,
            path.split('?')[0],
            timestamp,
            nonce,
            bodyHash
        ].join('\n');

        const computedSignature = crypto
            .createHmac('sha256', appSecret)
            .update(stringToSign)
            .digest('hex')
            .toLowerCase();

        if (computedSignature !== signature.toLowerCase()) {
            return { valid: false, reason: 'signature_mismatch' };
        }

        return { valid: true, appKey: appKey };
    }

    middleware(options = {}) {
        const self = this;
        return function signatureAuthMiddleware(req, res, next) {
            if (options.skipPaths && options.skipPaths.some(p => req.path.startsWith(p))) {
                return next();
            }

            const result = self.verifySignature(req);

            if (!result.valid) {
                const errorMessages = {
                    missing_headers: '缺少必要的签名请求头',
                    invalid_app_key: '无效的AppKey',
                    timestamp_expired: '时间戳偏差过大，请校准系统时间',
                    nonce_reused: 'Nonce重复使用',
                    signature_mismatch: '签名验证失败'
                };

                self.logger.warn(`[签名验证] 失败: ${result.reason}, IP: ${req.clientIP || req.ip}`);

                return res.status(401).json({
                    code: 20002,
                    message: errorMessages[result.reason] || '签名验证失败',
                    data: null,
                    details: {
                        reason: result.reason
                    },
                    request_id: req.requestId || '',
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }

            req.appKey = result.appKey;
            next();
        };
    }

    cleanupNonceCache() {
        const now = Date.now();
        for (const [key, value] of this.nonceCache) {
            if (now - value > this.nonceExpireMs) {
                this.nonceCache.delete(key);
            }
        }
    }

    getStats() {
        return {
            registered_apps: Object.keys(this.appSecrets).length,
            nonce_cache_size: this.nonceCache.size
        };
    }
}

module.exports = SignatureAuth;
