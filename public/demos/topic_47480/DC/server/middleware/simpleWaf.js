class SimpleWAF {
    constructor(options = {}) {
        this.rules = [];
        this.logger = options.logger || console;
        this.blockedCount = 0;
        this._initDefaultRules();
    }

    _initDefaultRules() {
        this.addRule('sql_injection', {
            type: 'body',
            patterns: [
                /['"](\s*or\s+['"][^'"]+['"]\s*=\s*['"][^'"]+)/i,
                /(\bunion\b.*\bselect\b)/i,
                /(\bdrop\s+table\b)/i,
                /(\binsert\s+into\b)/i,
                /(\bdelete\s+from\b)/i,
                /(\bupdate\b.*\bset\b)/i,
                /(--\s)/,
                /(\bexec(\s|\+)+(s|x)p\w+)/i,
                /['"]\s*or\s+\d+\s*=\s*\d+/i,
                /\bselect\b.*\bfrom\b/i,
                /\bwhere\b.*\b=.*\bor\b/i,
                /'?\s*or\s*'?\d+'?\s*=\s*'?\d+/i,
                /;\s*drop\s+table/i,
                /\bxp_cmdshell\b/i
            ],
            action: 'block'
        });

        this.addRule('xss', {
            type: 'body',
            patterns: [
                /(<script[^>]*>)/i,
                /(javascript\s*:)/i,
                /(on\w+\s*=\s*["'])/i,
                /(<iframe[^>]*>)/i,
                /(eval\s*\()/i,
                /(<img[^>]+onerror\s*=)/i
            ],
            action: 'block'
        });

        this.addRule('path_traversal', {
            type: 'path',
            patterns: [
                /\.\.\//,
                /\.\.\\/,
                /%2e%2e%2f/i,
                /%2e%2e%5c/i
            ],
            action: 'block'
        });

        this.addRule('command_injection', {
            type: 'body',
            patterns: [
                /[;&|]\s*(ls|cat|rm|cp|mv|chmod|chown|wget|curl|nc|bash|sh)\s/i,
                /(\$\(.*\))/,
                /(`.*`)/,
                /(\|\s*(rm|dd|mkfs)\s)/i
            ],
            action: 'block'
        });

        this.addRule('malicious_user_agent', {
            type: 'header',
            header: 'user-agent',
            patterns: [
                /sqlmap/i,
                /nmap/i,
                /nikto/i,
                /burp/i,
                /dirbuster/i,
                /hydra/i,
                /masscan/i
            ],
            action: 'block'
        });
    }

    addRule(name, rule) {
        this.rules.push({ name, ...rule });
    }

    check(req) {
        const method = req.method;
        const path = req.path || req.url;
        const body = req.body ? JSON.stringify(req.body) : '';
        const query = req.query ? JSON.stringify(req.query) : '';
        const headers = req.headers || {};
        const fullPath = req.originalUrl || req.url;

        for (const rule of this.rules) {
            let target = '';

            if (rule.type === 'path') {
                target = fullPath;
            } else if (rule.type === 'body') {
                target = body + query;
            } else if (rule.type === 'header') {
                target = headers[rule.header] || '';
            }

            for (const pattern of rule.patterns) {
                if (pattern.test(target)) {
                    return {
                        blocked: true,
                        rule: rule.name,
                        pattern: pattern.toString(),
                        action: rule.action
                    };
                }
            }
        }

        return { blocked: false };
    }

    middleware() {
        const self = this;
        return function wafMiddleware(req, res, next) {
            const result = self.check(req);

            if (result.blocked) {
                self.blockedCount++;
                const ip = req.headers['x-forwarded-for']
                    ? req.headers['x-forwarded-for'].split(',')[0].trim()
                    : req.ip;

                self.logger.warn(
                    `[WAF] 拦截请求: ${result.rule}, IP: ${ip}, ` +
                    `路径: ${req.path}, 规则: ${result.pattern}`
                );

                return res.status(403).json({
                    code: 20007,
                    message: '请求包含非法内容，已被拦截',
                    data: null,
                    details: {
                        rule: result.rule
                    },
                    request_id: req.requestId || '',
                    timestamp: Math.floor(Date.now() / 1000)
                });
            }

            next();
        };
    }

    getStats() {
        return {
            total_rules: this.rules.length,
            blocked_count: this.blockedCount
        };
    }
}

module.exports = SimpleWAF;
