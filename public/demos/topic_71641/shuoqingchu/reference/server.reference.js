// server.reference.js —— 【完整可用的参考版 / 兜底答案】
// 用法：Agent 若造不出来或时间不够，把本文件复制到项目根目录、改名为 server.js，即可直接用。
// 要求：Node ≥ 18（用到全局 fetch）。运行：node server.js → 打开 http://localhost:3000
//
// 合规提示：优先让 TRAE 的 Agent 自己写。实在不行时，可以把本文件内容粘给 Agent 说
// “用这个实现替换 server.js 的 TODO”，让代码仍然经由 TRAE 落地。

const http = require('http');
const fs = require('fs');
const path = require('path');

let CONFIG = { baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash', apiKey: '' };
try { CONFIG = Object.assign(CONFIG, require('./config.js')); }
catch (e) { console.warn('[warn] 未找到 config.js，请从 config.example.js 复制并填入 apiKey'); }

const PORT = 3000;
const MAX_INPUT = 200000; // 约20万字，远小于V4的1M上下文

// 优先读文件；读不到就用内置兜底，保证到处都能跑
const EMBEDDED_PROMPT = '你是一位资深专业顾问，精通合同、政府文件、报告与条款解读。像顾问一样帮普通人看懂，精准提取关键重要内容（尤其政府文件/报告/合同），只依据原文不臆造，用大白话。严格只输出 json：{"plain":"2-4句总述","keypoints":["3-6条关键点，每条一句"],"warnings":["2-5条需注意的坑，每条一句"],"advice":"针对这份文件的2-4句专业意见与建议"}。只输出 json，不要 markdown 围栏。';
let SYSTEM_PROMPT = EMBEDDED_PROMPT;
try { SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, 'prompts', 'system_prompt.md'), 'utf8'); } catch (_) {}

const server = http.createServer((req, res) => {
  const json = { 'Content-Type': 'application/json; charset=utf-8' };

  if (req.method === 'POST' && req.url === '/api/explain') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      let text = '';
      try { text = (JSON.parse(body || '{}').text || '').slice(0, MAX_INPUT); }
      catch (e) { res.writeHead(400, json); return res.end(JSON.stringify({ error: '请求解析失败' })); }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      try {
        const resp = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.apiKey}` },
          body: JSON.stringify({
            model: CONFIG.model,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: text }
            ]
          }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!resp.ok) {
          const t = await resp.text();
          res.writeHead(resp.status, json);
          return res.end(JSON.stringify({ error: `模型接口 ${resp.status}：${t.slice(0, 200)}` }));
        }
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content ?? '';
        res.writeHead(200, json);
        res.end(JSON.stringify({ content }));
      } catch (e) {
        clearTimeout(timer);
        res.writeHead(502, json);
        res.end(JSON.stringify({ error: e.name === 'AbortError' ? '请求超时（检查网络/换手机热点）' : String(e.message || e) }));
      }
    });
    return;
  }

  // 静态托管
  const filePath = req.url === '/' ? '/src/index.html' : req.url.split('?')[0];
  const full = path.join(__dirname, filePath);
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not Found'); }
    const ext = path.extname(full);
    const type = ext === '.html' ? 'text/html' : ext === '.json' ? 'application/json' : ext === '.js' ? 'text/javascript' : 'text/plain';
    res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`说清楚点 running at http://localhost:${PORT}`));
