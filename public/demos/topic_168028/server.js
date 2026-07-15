const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const API_KEY = 'jVNX2f0lbNWXNEqMNvBY5fhB';
const SECRET_KEY = 'nZT57GQ6OZYNUeA0j4ADXLzFeVIt8fck';

let accessToken = null;
let tokenExpiresAt = 0;

function getAccessToken() {
    return new Promise((resolve, reject) => {
        if (accessToken && Date.now() < tokenExpiresAt - 60000) {
            return resolve(accessToken);
        }

        const options = {
            hostname: 'aip.baidubce.com',
            path: `/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.access_token) {
                        accessToken = result.access_token;
                        tokenExpiresAt = Date.now() + result.expires_in * 1000;
                        console.log('Access Token 获取成功');
                        resolve(accessToken);
                    } else {
                        reject(new Error('获取Token失败: ' + data));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

function recognizeSpeech(audioBuffer) {
    return new Promise(async (resolve, reject) => {
        try {
            const token = await getAccessToken();

            const base64 = audioBuffer.toString('base64');
            const body = JSON.stringify({
                format: 'pcm',
                rate: 16000,
                channel: 1,
                cuid: 'forgetting-record-demo',
                token: token,
                speech: base64,
                len: audioBuffer.length,
                dev_pid: 1537
            });

            const options = {
                hostname: 'vop.baidu.com',
                path: '/server_api',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.err_no === 0 && result.result && result.result.length > 0) {
                            resolve(result.result[0]);
                        } else {
                            reject(new Error('识别失败: ' + (result.err_msg || '未知错误')));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    if (req.method === 'GET' && req.url === '/') {
        req.url = '/forgetting-record-demo.html';
    }

    if (req.method === 'GET' && (req.url.endsWith('.html') || req.url.endsWith('.js') || req.url.endsWith('.css'))) {
        const filePath = path.join(__dirname, req.url);
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const contentType = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'application/javascript' : 'text/css';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    if (req.method === 'POST' && req.url === '/api/recognize') {
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', async () => {
            try {
                const audioBuffer = Buffer.concat(body);
                console.log(`收到音频数据: ${audioBuffer.length} 字节`);
                const text = await recognizeSpeech(audioBuffer);
                console.log(`识别结果: ${text}`);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, text }));
            } catch (e) {
                console.error('识别错误:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
