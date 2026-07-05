// server.js —— 零依赖 Node 代理服务（Node ≥ 18，只用内置模块，无需 npm install）
// 作用：1) 托管 src/index.html 静态页；2) 提供 POST /api/explain，转发到大模型 API，
//       从而避开浏览器 CORS，并把 API Key 留在服务端。
// 运行：node server.js  然后浏览器打开 http://localhost:3000
//       （必须通过 http://localhost:3000 访问，不要用 file:// 直接打开 index.html）
//
// 以下为骨架，标注 TODO 的部分交由现场 TRAE Agent 实现（参考 AGENTS.md / prompts/system_prompt.md）。

const http = require('http');
const fs = require('fs');
const path = require('path');

// 读取配置（从 config.js 复制而来；勿把真实 Key 提交仓库）
let CONFIG = { baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash', apiKey: '' };
try {
  CONFIG = Object.assign(CONFIG, require('./config.js')); // config.js: module.exports = { baseUrl, model, apiKey }
} catch (e) {
  console.warn('[warn] 未找到 config.js，请从 config.example.js 复制并填入 apiKey');
}

const PORT = 3010;
const MAX_INPUT = 200000; // 约20万字，远小于 V4 的 1M 上下文；处理长报告/政府文件足够
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, 'prompts', 'system_prompt.md'), 'utf8');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/explain') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body || '{}');
        // 用 AbortController 设置 60s 超时，长文档留足时间
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 60000);

        try {
          const apiRes = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${CONFIG.apiKey}`
            },
            body: JSON.stringify({
              model: CONFIG.model,
              response_format: { type: 'json_object' },  // 关键：强制 JSON，DeepSeek 兼容
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: (text || '').slice(0, MAX_INPUT) }
              ]
            }),
            signal: ctrl.signal
          });

          clearTimeout(timeout);

          if (!apiRes.ok) {
            const errText = await apiRes.text().catch(() => '');
            res.writeHead(apiRes.status, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: `模型接口返回错误(${apiRes.status})：${errText.slice(0, 200)}` }));
            return;
          }

          const data = await apiRes.json();
          const content = data?.choices?.[0]?.message?.content;
          if (!content) {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: '模型返回格式异常，缺少 content' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ content }));
        } catch (e) {
          clearTimeout(timeout);
          const msg = e.name === 'AbortError'
            ? '请求超时（60s），长文档请稍后重试'
            : `请求失败：${e.message}`;
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: msg }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '请求解析失败', detail: String(err) }));
      }
    });
    return;
  }

  // 静态托管：默认返回 src/index.html
  const filePath = req.url === '/' ? '/src/index.html' : req.url;
  const full = path.join(__dirname, filePath);
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    const ext = path.extname(full);
    const type = ext === '.html' ? 'text/html' : ext === '.json' ? 'application/json' : 'text/plain';
    res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`说清楚点 running at http://localhost:${PORT}`));
