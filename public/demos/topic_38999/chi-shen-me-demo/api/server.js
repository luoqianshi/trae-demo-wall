/**
 * 「吃什么」DeepSeek API 代理服务
 *
 * 功能：
 * 1. 接收前端对话请求，调用 DeepSeek API 生成 AI 回复
 * 2. 维护用户会话状态（口味画像、食材库存、对话历史）
 * 3. 提供流式/非流式两种响应模式
 *
 * 环境变量：
 *   DEEPSEEK_API_KEY - 必填，你的 DeepSeek API 密钥
 *   PORT - 可选，默认 3000
 *   MODEL - 可选，默认 deepseek-v4-pro
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path_server = require('path');

// ============ 配置 ============
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';
const DEEPSEEK_BASE = 'https://api.deepseek.com';

if (!API_KEY) {
  console.error('错误：请设置环境变量 DEEPSEEK_API_KEY');
  console.error('示例：DEEPSEEK_API_KEY=sk-xxx node server.js');
  process.exit(1);
}

// ============ 系统 Prompt（核心假设画像逻辑） ============
const SYSTEM_PROMPT = `你是「吃什么」——一个为低食欲人群设计的 AI 食欲伙伴。

## 核心原则
1. 不下结论，只提假设。每条判断都标注为猜测，并附带验证邀请。
2. 不教做菜。只搬运网上最诱人的视频/图文，不写菜谱。
3. 不做店铺推荐。推荐的是「菜」和「感觉」，不是具体餐厅。
4. 尊重「第四个选择」。给 3 个选项，但用户想要别的时，认真接住。
5. 食材是长期习惯。记住厨房常态，分常驻品/短期采购/调料冷冻三类生命周期。
6. 越用越懂你。记录触发食欲的内容，长期进化——但始终以假设驱动。

## 多轮对话能力（这是你最核心的价值）
你是一个真正的聊天伙伴，不是一次性推荐引擎：
- **记住上下文**：用户说"太辣了"→ 调整推荐为清淡的；用户说"想吃面"→ 只推荐面食类
- **灵活应对**：用户可能打字说任何事——吐槽、提问、犹豫、改主意。你要像朋友一样自然回应。
- **主动推进**：如果用户犹豫不决，可以问"要不要我帮你抽签？"；如果用户说饿了但不知道吃什么，可以缩小范围问"今天是想吃热的还是凉的？"
- **接受决定**：用户说"就吃这个了"→ 热烈鼓励，给出庆祝感，不要继续推荐

## 回复格式
JSON 对象，包含以下字段：
- "text": string, AI 对话文本（温暖、简短、不压迫）
- "memoryChip": string | null, 如果有引用用户历史记忆，显示 🧠 芯片内容
- "recommendations": array | null, 推荐菜品列表，每项 {name, desc, imgKey, tags}。仅在需要推荐时提供，闲聊时 null
- "showEighth": boolean, 是否显示「第四个选择」输入框
- "profileUpdate": string | null, 画像更新描述
- "actions": array | null, 可选操作按钮 [{label, action}]

## 推荐菜品名称（必须从以下挑选，不要自己编）
番茄鸡蛋汤面、豚骨拉面、部队锅、红油冒菜、蛋包饭、番茄牛肉米线、鲜汤小馄饨、酸辣粉、泡菜炒饭、抱蛋煎饺、日式咖喱饭、清粥小菜、牛油果拌饭、鸡汤面、老式锅包肉、葱油拌面、寿司拼盘、鳗鱼饭、三明治、手抓饼、烤肉拌饭、番茄肉酱意面、酸菜鱼、寿喜烧、麻辣香锅、卤肉饭、猪肚鸡汤、椰子鸡、红烧牛肉面、煲仔饭、螺蛳粉、豆腐汤、广式蒸点、日式姜汁猪肉、大阪烧、牛丼、亲子丼

## 语气
- 像一位理解低食欲痛苦的朋友，不pushy，不judge
- 首句尽量简短，给用户空间
- 用户决定后，热烈鼓励，不要说"你确定吗"之类的话`;

// ============ 内存会话存储（生产环境应换 Redis） ============
const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      profile: {
        tasteHypotheses: [],
        inventory: {
          permanent: ['大米', '鸡蛋', '泡面', '酱油'],
          shortTerm: [],
          frozen: ['速冻饺子', '咖喱块', '火锅底料']
        },
        history: []
      },
      createdAt: Date.now()
    });
  }
  return sessions.get(sessionId);
}

// ============ DeepSeek API 调用（使用原生 fetch，自动走系统代理） ============
async function callDeepSeek(messages) {
  const body = JSON.stringify({
    model: MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.8,
    max_tokens: 800,
    response_format: { type: 'json_object' }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('DeepSeek API 请求超时（40秒）');
    controller.abort();
  }, 40000);

  try {
    console.log(`[DeepSeek] 发送请求，消息数: ${messages.length}`);
    const startTime = Date.now();
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`[DeepSeek] 收到响应，耗时: ${Date.now() - startTime}ms，状态码: ${response.status}`);
    const json = await response.json();

    if (json.error) {
      throw new Error(json.error.message || 'DeepSeek API 错误');
    }
    return json;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('DeepSeek API 请求超时');
    }
    throw error;
  }
}

// ============ HTTP 服务 ============
const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);

  // 健康检查
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', model: MODEL }));
    return;
  }

  // 获取会话状态
  if (parsed.pathname === '/api/session' && req.method === 'GET') {
    const sessionId = parsed.query.id || 'default';
    const session = getSession(sessionId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      profile: session.profile,
      messageCount: session.messages.length
    }));
    return;
  }

  // 聊天接口
  if (parsed.pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { sessionId = 'default', message, context = {} } = JSON.parse(body);
        const session = getSession(sessionId);

        // 构建消息历史
        const apiMessages = session.messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        }));

        // 添加上下文信息
        const contextInfo = [];
        if (context.time) contextInfo.push(`当前时间: ${context.time}`);
        if (context.weather) contextInfo.push(`天气: ${context.weather}`);
        if (context.mood) contextInfo.push(`用户状态: ${context.mood}`);
        if (context.inventory) contextInfo.push(`食材库存: ${JSON.stringify(context.inventory)}`);

        const userContent = contextInfo.length > 0
          ? `[上下文]\n${contextInfo.join('\n')}\n\n[用户输入]\n${message}`
          : message;

        apiMessages.push({ role: 'user', content: userContent });

        // 调用 DeepSeek
        const response = await callDeepSeek(apiMessages);
        const aiMessage = response.choices[0].message;

        // 保存到会话
        session.messages.push({ role: 'user', content: message, timestamp: Date.now() });
        session.messages.push({ role: 'assistant', content: aiMessage.content, timestamp: Date.now() });

        // 解析 AI 回复
        let parsedContent;
        try {
          let content = aiMessage.content;
          // 尝试去除 markdown 代码块包装
          const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) content = codeBlockMatch[1].trim();
          parsedContent = JSON.parse(content);
        } catch (e) {
          // 如果 JSON 解析失败，尝试提取 text 字段
          try {
            const textMatch = aiMessage.content.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (textMatch) {
              parsedContent = { text: textMatch[1], recommendations: null, showEighth: false };
            } else {
              // 截取前 200 个非 JSON 字符作为文本
              const cleanText = aiMessage.content.replace(/```[\s\S]*?```/g, '').replace(/[{}\[\]"]+/g, ' ').trim().slice(0, 200);
              parsedContent = { text: cleanText || '抱歉，我有点走神了。能再说一遍你想吃什么吗？', recommendations: null, showEighth: false };
            }
          } catch(e2) {
            parsedContent = { text: aiMessage.content.slice(0, 200), recommendations: null, showEighth: false };
          }
        }

        // 更新画像（如果 AI 返回了 profileUpdate）
        if (parsedContent.profileUpdate) {
          session.profile.tasteHypotheses.unshift({
            text: parsedContent.profileUpdate,
            confidence: 0.5,
            timestamp: Date.now()
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: parsedContent,
          session: {
            messageCount: session.messages.length,
            profile: session.profile
          }
        }));

      } catch (error) {
        console.error('API Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message,
          fallback: {
            text: '抱歉，AI 服务暂时有点卡。我先按离线模式给你推荐几个选项——',
            recommendations: [
              { name: '番茄牛肉米线', desc: '热乎 · 15分钟', imgKey: 'noodle', tags: ['快手'] },
              { name: '部队锅', desc: '辣到出汗 · 治愈', imgKey: 'budae', tags: ['放纵'] }
            ],
            showEighth: true
          }
        }));
      }
    });
    return;
  }

  // 更新画像接口
  if (parsed.pathname === '/api/profile' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { sessionId = 'default', updates } = JSON.parse(body);
        const session = getSession(sessionId);

        if (updates.tasteHypotheses) {
          session.profile.tasteHypotheses.push(...updates.tasteHypotheses);
        }
        if (updates.inventory) {
          Object.assign(session.profile.inventory, updates.inventory);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, profile: session.profile }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // 静态文件托管
  if (req.method === 'GET') {
    const staticDir = path_server.join(__dirname, '..');
    let filePath = parsed.pathname === '/' || parsed.pathname === '' ? '/chi-shen-me-demo.html' : parsed.pathname;
    filePath = path_server.join(staticDir, filePath);
    // 安全检查：禁止跳出工作目录
    if (!filePath.startsWith(staticDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const extMap = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.json': 'application/json; charset=utf-8',
        '.ttf': 'font/ttf',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
      };
      const ext = path_server.extname(filePath);
      res.writeHead(200, { 'Content-Type': extMap[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`「吃什么」API 服务已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`模型: ${MODEL}`);
  console.log(`接口:`);
  console.log(`  GET  /health          - 健康检查`);
  console.log(`  GET  /api/session?id=xxx  - 获取会话状态`);
  console.log(`  POST /api/chat        - 聊天（需 JSON body: {sessionId, message, context}）`);
  console.log(`  POST /api/profile     - 更新画像（需 JSON body: {sessionId, updates}）`);
  console.log('');
  console.log('示例调用:');
  console.log(`  curl -X POST http://localhost:${PORT}/api/chat \\\n    -H "Content-Type: application/json" \\\n    -d '{"message":"今天好累，想吃辣的","context":{"time":"周五晚","mood":"疲惫"}}'`);
});
