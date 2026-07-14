/**
 * 阅境 - 网易云音乐 API 代理服务器
 * 版本: v2.0
 * 更新: 2026-06-29
 *
 * 接口说明:
 *   GET /api/netease/search?keywords=xxx&limit=20  -> 搜索歌曲
 *   GET /api/netease/url?id=xxx                    -> 获取播放地址 (返回 {url: string|null})
 *   GET /api/netease/audio?id=xxx                  -> 代理播放音频流
 *
 * 安全增强:
 * - 仅允许本地 IP (127.0.0.1 / ::1 / 内网) 访问代理接口
 * - 可选 Token 认证 (环境变量 NETEASE_PROXY_TOKEN)
 * - 静态文件服务无需认证
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8000;
const TOKEN = process.env.NETEASE_PROXY_TOKEN || '';

const RATE_LIMIT = {
    windowMs: 60 * 1000,
    maxRequests: 60,
    searchMax: 20
};
const rateLimitMap = new Map();

function checkRateLimit(ip, endpoint) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;
    const key = `${ip}:${endpoint}`;

    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, []);
    }

    const timestamps = rateLimitMap.get(key).filter(t => t > windowStart);
    rateLimitMap.set(key, timestamps);

    const maxReq = endpoint === 'search' ? RATE_LIMIT.searchMax : RATE_LIMIT.maxRequests;
    if (timestamps.length >= maxReq) {
        return false;
    }

    timestamps.push(now);
    return true;
}

setInterval(() => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.windowMs;
    for (const [key, timestamps] of rateLimitMap) {
        const filtered = timestamps.filter(t => t > windowStart);
        if (filtered.length === 0) {
            rateLimitMap.delete(key);
        } else {
            rateLimitMap.set(key, filtered);
        }
    }
}, 60 * 1000);

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' https:; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};

const ALLOWED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:' + PORT,
    'http://127.0.0.1:' + PORT
];

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav'
};

const NETEASE_BASE = 'https://music.163.com';
const NETEASE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://music.163.com/',
    'Accept': '*/*'
};

// 播放地址缓存 (进程内存)
const URL_CACHE_MAX = 500;
const urlCache = new Map();
const urlFailCache = new Set();
const URL_FAIL_CACHE_MAX = 200;

function evictCacheIfNeeded(map, maxSize) {
    while (map.size > maxSize) {
        const firstKey = map.keys().next().value;
        map.delete(firstKey);
    }
}

async function getNeteaseAudioUrl(songId, req) {
    const cacheKey = String(songId);
    if (urlCache.has(cacheKey)) {
        const val = urlCache.get(cacheKey);
        urlCache.delete(cacheKey);
        urlCache.set(cacheKey, val);
        return val;
    }
    if (urlFailCache.has(cacheKey)) {
        return null;
    }

    try {
        const outerUrl = `/song/media/outer/url?id=${songId}.mp3`;
        const result = await httpsGet(outerUrl, getNeteaseHeaders(req));

        let realUrl = null;
        if ((result.statusCode === 302 || result.statusCode === 301) && result.headers.location) {
            realUrl = result.headers.location;
        }
        else if (result.statusCode === 200 && result.headers['content-type'] && result.headers['content-type'].includes('audio')) {
            realUrl = NETEASE_BASE + outerUrl;
        }

        if (realUrl && !realUrl.includes('404') && !realUrl.includes('music.163.com/404')) {
            urlCache.set(cacheKey, realUrl);
            evictCacheIfNeeded(urlCache, URL_CACHE_MAX);
            setTimeout(() => urlCache.delete(cacheKey), 30 * 60 * 1000);
            return realUrl;
        } else {
            urlFailCache.add(cacheKey);
            if (urlFailCache.size > URL_FAIL_CACHE_MAX) {
                const first = urlFailCache.values().next().value;
                urlFailCache.delete(first);
            }
            setTimeout(() => urlFailCache.delete(cacheKey), 10 * 60 * 1000);
            return null;
        }
    } catch (err) {
        console.error('[GetUrl] 失败:', err.message);
        urlFailCache.add(cacheKey);
        if (urlFailCache.size > URL_FAIL_CACHE_MAX) {
            const first = urlFailCache.values().next().value;
            urlFailCache.delete(first);
        }
        return null;
    }
}

function getClientIp(req) {
    // 修复 #5：本地代理服务器不应信任 X-Forwarded-For 头部
    // 攻击者可伪造 `X-Forwarded-For: 127.0.0.1` 绕过 isLocalIp 校验，导致任意网络访问代理接口
    // 仅当显式配置 TRUST_PROXY=1（如反向代理部署）时才读取该头部
    const trustProxy = process.env.TRUST_PROXY === '1';
    if (trustProxy) {
        const xff = req.headers['x-forwarded-for'];
        if (xff) return String(xff).split(',')[0].trim();
    }
    // 兼容新版 Node.js（req.connection 已废弃，使用 req.socket）
    return (req.socket && req.socket.remoteAddress)
        || (req.connection && req.connection.remoteAddress)
        || null;
}

/**
 * 校验歌曲 ID 格式（仅允许数字，长度 1-20）
 * @param {string} songId
 * @returns {boolean}
 */
function isValidSongId(songId) {
    if (!songId) return false;
    const s = String(songId);
    return /^\d{1,20}$/.test(s);
}

/**
 * 校验搜索关键词长度
 * @param {string} keywords
 * @returns {boolean}
 */
function isValidKeywords(keywords) {
    if (!keywords) return false;
    return keywords.length <= 100;
}

function ipToLong(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return -1;
    let long = 0;
    for (let i = 0; i < 4; i++) {
        const num = parseInt(parts[i], 10);
        if (isNaN(num) || num < 0 || num > 255) return -1;
        long = (long << 8) + num;
    }
    return long >>> 0;
}

function isPrivateIPv4(ip) {
    const long = ipToLong(ip);
    if (long === -1) return false;
    return (long >>> 24) === 10
        || ((long >>> 16) & 0xffff) === 0xc0a8
        || ((long >>> 12) & 0xfff0) === 0xac10;
}

function isLocalIp(ip) {
    if (!ip) return false;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return true;
    if (ip.startsWith('::ffff:')) {
        const ipv4 = ip.slice(7);
        if (ipv4 === '127.0.0.1') return true;
        return isPrivateIPv4(ipv4);
    }
    if (ip.includes(':')) {
        return ip.startsWith('fe80:') || ip === '::1';
    }
    return isPrivateIPv4(ip);
}

function getCorsOrigin(req) {
    const origin = req.headers['origin'];
    if (!origin) {
        return null;
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
        return origin;
    }
    const host = req.headers['host'];
    if (host) {
        const protocol = req.socket && req.socket.encrypted ? 'https' : 'http';
        const selfOrigin = `${protocol}://${host}`;
        if (ALLOWED_ORIGINS.includes(selfOrigin)) {
            return selfOrigin;
        }
    }
    return null;
}

function applySecurityHeaders(res, req) {
    const headers = { ...SECURITY_HEADERS };
    const corsOrigin = getCorsOrigin(req);
    if (corsOrigin) {
        headers['Access-Control-Allow-Origin'] = corsOrigin;
        headers['Access-Control-Allow-Headers'] = 'Content-Type, x-netease-cookie';
        headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
        headers['Vary'] = 'Origin';
    }
    return headers;
}

function sendJson(res, statusCode, data, req) {
    const headers = applySecurityHeaders(res, req);
    headers['Content-Type'] = 'application/json; charset=utf-8';
    res.writeHead(statusCode, headers);
    res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message, req) {
    sendJson(res, statusCode, { error: message }, req);
}

function getNeteaseHeaders(req) {
    const headers = { ...NETEASE_HEADERS };
    const userCookie = req.headers['x-netease-cookie'];
    if (userCookie) {
        headers['Cookie'] = userCookie;
    }
    return headers;
}

function httpsGet(apiPath, reqHeaders) {
    return new Promise((resolve, reject) => {
        const fullUrl = NETEASE_BASE + apiPath;
        const parsed = url.parse(fullUrl);

        const options = {
            hostname: parsed.hostname,
            port: 443,
            path: parsed.path,
            method: 'GET',
            headers: reqHeaders
        };

        const proxyReq = https.request(options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', (chunk) => { data += chunk; });
            proxyRes.on('end', () => {
                resolve({ statusCode: proxyRes.statusCode, headers: proxyRes.headers, body: data });
            });
        });

        proxyReq.on('error', reject);
        proxyReq.setTimeout(15000, () => {
            proxyReq.destroy();
            reject(new Error('请求超时'));
        });
        proxyReq.end();
    });
}

/**
 * 搜索歌曲
 * 网易云原生: /api/search/get/web?s=xxx&type=1&limit=20
 * 返回结构: { result: { songs: [...] } }
 */
async function handleSearch(req, res, query) {
    const keywords = query.keywords || '';
    const limit = parseInt(query.limit) || 20;
    const offset = parseInt(query.offset) || 0;

    if (!keywords || !isValidKeywords(keywords)) {
        sendError(res, 400, keywords ? '关键词过长（最长100字符）' : '缺少搜索关键词', req);
        return;
    }

    try {
        const apiPath = `/api/search/get/web?s=${encodeURIComponent(keywords)}&type=1&limit=${limit}&offset=${offset}`;
        const result = await httpsGet(apiPath, getNeteaseHeaders(req));

        if (result.statusCode !== 200) {
            console.error('[Search] 网易云返回非200:', result.statusCode);
            sendJson(res, 200, { songs: [] }, req);
            return;
        }

        const data = JSON.parse(result.body);
        const rawSongs = (data.result && data.result.songs) || [];

        const songs = rawSongs.map(s => ({
            id: s.id,
            name: s.name,
            artist: (s.artists || []).map(a => a.name).join(' / '),
            album: s.album ? s.album.name : '',
            duration: s.duration,
            fee: s.fee
        }));

        sendJson(res, 200, { songs }, req);
    } catch (err) {
        console.error('[Search] 失败:', err.message);
        sendJson(res, 200, { songs: [] }, req);
    }
}

/**
 * 获取播放地址
 * 使用 /song/media/outer/url 方式，跟随 302 获取真实地址
 * 返回: { url: string | null }
 */
async function handleGetUrl(req, res, query) {
    const songId = query.id;
    if (!isValidSongId(songId)) {
        sendError(res, 400, '无效的歌曲ID', req);
        return;
    }

    const realUrl = await getNeteaseAudioUrl(songId, req);
    sendJson(res, 200, { url: realUrl }, req);
}

/**
 * 获取歌词
 * 网易云原生: /api/song/lyric?id=xxx&lv=1&kv=1&tv=-1
 * 返回结构: { lrc: { lyric: "..." }, tlyric: { lyric: "..." } }
 */
async function handleLyric(req, res, query) {
    const songId = query.id;
    if (!isValidSongId(songId)) {
        sendError(res, 400, '无效的歌曲ID', req);
        return;
    }

    try {
        const apiPath = '/api/song/lyric?id=' + songId + '&lv=1&kv=1&tv=-1';
        const result = await httpsGet(apiPath, getNeteaseHeaders(req));

        if (result.statusCode !== 200) {
            console.error('[Lyric] 网易云返回非200:', result.statusCode);
            sendJson(res, 200, { lrc: null, tlyric: null, error: '网易云返回状态码 ' + result.statusCode }, req);
            return;
        }

        const data = JSON.parse(result.body);
        sendJson(res, 200, { lrc: data.lrc || null, tlyric: data.tlyric || null }, req);
    } catch (err) {
        console.error('[Lyric] 失败:', err.message);
        sendJson(res, 200, { lrc: null, tlyric: null, error: err.message }, req);
    }
}

/**
 * 代理播放音频流
 * 客户端使用 /api/netease/audio?id=xxx 来播放
 */
async function handleAudioProxy(req, res, query) {
    const songId = query.id;
    if (!isValidSongId(songId)) {
        sendError(res, 400, '无效的歌曲ID', req);
        return;
    }

    const realUrl = await getNeteaseAudioUrl(songId, req);
    if (!realUrl) {
        sendError(res, 404, '无法获取播放地址', req);
        return;
    }

    try {
        const parsed = url.parse(realUrl);
        const isHttps = parsed.protocol === 'https:';
        const transport = isHttps ? https : http;

        const audioReq = transport.request({
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.path,
            method: req.method,
            headers: {
                'User-Agent': NETEASE_HEADERS['User-Agent'],
                'Referer': 'https://music.163.com/',
                'Range': req.headers['range'] || ''
            }
        }, (audioRes) => {
            const corsOrigin = getCorsOrigin(req);
            const headers = {
                'Content-Type': audioRes.headers['content-type'] || 'audio/mpeg',
                'Content-Length': audioRes.headers['content-length'],
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': corsOrigin,
                'Vary': 'Origin',
                'X-Content-Type-Options': 'nosniff'
            };
            if (audioRes.headers['content-range']) {
                headers['Content-Range'] = audioRes.headers['content-range'];
            }
            res.writeHead(audioRes.statusCode, headers);
            audioRes.pipe(res);
        });

        audioReq.on('error', (err) => {
            console.error('[Audio] 代理失败:', err.message);
            if (!res.headersSent) {
                sendError(res, 502, '音频代理失败', req);
            }
        });

        req.pipe(audioReq);
    } catch (err) {
        console.error('[Audio] 异常:', err.message);
        sendError(res, 500, '服务器错误', req);
    }
}

function serveStatic(filePath, res, req) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                sendError(res, 404, '文件未找到', req);
            } else {
                sendError(res, 500, '读取文件失败', req);
            }
            return;
        }
        const secHeaders = { ...SECURITY_HEADERS };
        secHeaders['Content-Type'] = mime;
        res.writeHead(200, secHeaders);
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    const clientIp = getClientIp(req);

    if (req.method === 'OPTIONS') {
        const corsOrigin = getCorsOrigin(req);
        res.writeHead(204, {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-netease-cookie',
            'Vary': 'Origin',
            ...SECURITY_HEADERS
        });
        res.end();
        return;
    }

    if (pathname.startsWith('/api/netease/')) {
        if (!isLocalIp(clientIp)) {
            console.warn(`[Security] 拒绝非本地IP访问代理: ${clientIp}`);
            sendError(res, 403, '代理接口仅限本地访问', req);
            return;
        }

        let endpoint = 'general';
        if (pathname === '/api/netease/search') endpoint = 'search';
        else if (pathname === '/api/netease/url') endpoint = 'url';
        else if (pathname === '/api/netease/audio') endpoint = 'audio';
        else if (pathname === '/api/netease/lyric') endpoint = 'lyric';

        if (!checkRateLimit(clientIp, endpoint)) {
            console.warn(`[RateLimit] ${clientIp} 触发频率限制: ${endpoint}`);
            sendError(res, 429, '请求过于频繁，请稍后再试', req);
            return;
        }

        if (TOKEN) {
            const authHeader = req.headers['authorization'] || '';
            const providedToken = authHeader.replace('Bearer ', '');
            if (providedToken !== TOKEN) {
                console.warn(`[Security] Token 认证失败: ${clientIp}`);
                sendError(res, 401, '需要有效的访问令牌', req);
                return;
            }
        }

        if (pathname === '/api/netease/search') {
            handleSearch(req, res, query);
            return;
        }
        if (pathname === '/api/netease/url') {
            handleGetUrl(req, res, query);
            return;
        }
        if (pathname === '/api/netease/audio') {
            handleAudioProxy(req, res, query);
            return;
        }
        if (pathname === '/api/netease/lyric') {
            handleLyric(req, res, query);
            return;
        }

        sendError(res, 404, '未知 API 端点', req);
        return;
    }

    if (pathname === '/health') {
        sendJson(res, 200, { status: 'ok', time: new Date().toISOString() }, req);
        return;
    }

    let filePath = pathname === '/' ? '/ai-novel-atmosphere-sync-v7.html' : pathname;
    filePath = path.join(__dirname, filePath);

    const rootDir = path.resolve(__dirname);
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(rootDir + path.sep) && resolvedPath !== rootDir) {
        sendError(res, 403, '访问被拒绝', req);
        return;
    }

    fs.realpath(resolvedPath, (err, realPath) => {
        if (err) {
            const fallback = path.join(__dirname, 'ai-novel-atmosphere-sync-v7.html');
            serveStatic(fallback, res, req);
            return;
        }
        if (!realPath.startsWith(rootDir + path.sep) && realPath !== rootDir) {
            sendError(res, 403, '访问被拒绝', req);
            return;
        }
        fs.stat(realPath, (statErr, stats) => {
            if (statErr || !stats.isFile()) {
                const fallback = path.join(__dirname, 'ai-novel-atmosphere-sync-v7.html');
                serveStatic(fallback, res, req);
                return;
            }
            serveStatic(realPath, res, req);
        });
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('============================================');
    console.log('  阅境 - AI小说氛围音乐同步器 代理服务器');
    console.log('  版本: v2.0 | 端口: ' + PORT);
    console.log('============================================');
    console.log('  访问地址: http://localhost:' + PORT);
    console.log('  健康检查: http://localhost:' + PORT + '/health');
    console.log('  代理限制: 仅本地/内网 IP 可访问');
    if (TOKEN) {
        console.log('  Token 认证: 已启用');
    } else {
        console.log('  Token 认证: 未启用 (可通过 NETEASE_PROXY_TOKEN 设置)');
    }
    console.log('============================================');
    console.log('  API 端点:');
    console.log('    GET /api/netease/search?keywords=xxx  搜索歌曲');
    console.log('    GET /api/netease/url?id=xxx          获取播放地址');
    console.log('    GET /api/netease/audio?id=xxx        代理音频流');
    console.log('============================================');
    console.log('');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n[Server] 正在关闭...');
    server.close(() => {
        console.log('[Server] 已关闭');
        process.exit(0);
    });
});
