import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { ChatServer } from './websocket.js';
// 获取本机局域网IP（优先真实网卡，排除VPN虚拟网卡）
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const vpnKeywords = ['radmin', 'hamachi', 'zerotier', 'tailscale', 'tun', 'vpn', 'virtual', 'vmware', 'virtualbox', 'hyper-v', 'docker', 'wsl', 'ppp', 'bluetooth', 'usb'];
    const lanKeywords = ['wlan', 'wi-fi', 'wireless', 'ethernet', 'eth', 'en', 'local', 'lan', 'bridge', 'br'];
    // 收集所有候选地址，按优先级排序
    const candidates = [];
    for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];
        if (!iface)
            continue;
        const nameLower = name.toLowerCase();
        for (const addr of iface) {
            if (addr.family !== 'IPv4' || addr.internal)
                continue;
            let priority = 0;
            if (lanKeywords.some(k => nameLower.includes(k))) {
                priority = 2;
            }
            else if (vpnKeywords.some(k => nameLower.includes(k))) {
                priority = -1;
            }
            else {
                priority = 1;
            }
            candidates.push({ addr: addr.address, name, priority });
        }
    }
    // 按优先级排序，返回最高的
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates[0]?.addr || '127.0.0.1';
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
// 中间件
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
// 静态文件服务 - 提供前端构建产物
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
// 缓存本机IP（服务启动时计算一次）
const cachedLocalIP = getLocalIP();
// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});
// 返回本机局域网IP（供HTA等客户端获取）
app.get('/api/ip', (req, res) => {
    res.json({ ip: cachedLocalIP });
});
// SPA fallback - 所有非API路由返回index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});
// 初始化WebSocket服务器
new ChatServer(server);
const PORT = parseInt(process.env.PORT || '12345', 10);
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
    // 将 IP 写入文件，供 HTA 等客户端读取
    const ipFilePath = path.resolve(__dirname, '../../.local_ip');
    try {
        fs.writeFileSync(ipFilePath, cachedLocalIP, 'utf-8');
    }
    catch (e) { }
    console.log(`\n========================================`);
    console.log(`  Kindchat Server`);
    console.log(`========================================`);
    console.log(`  Address:  http://${cachedLocalIP}:${PORT}`);
    console.log(`========================================`);
    console.log(`  WebSocket: ready`);
    console.log(`  Static:    ${clientDistPath}`);
    console.log(`========================================\n`);
});
