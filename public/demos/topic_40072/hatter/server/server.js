const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // Token 有效期 7 天

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===== 限流中间件 =====
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 分钟窗口
const RATE_LIMIT_MAX = 10; // 每窗口最多 10 次请求

const rateLimiter = (keyFn) => (req, res, next) => {
  const key = keyFn(req);
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.startTime > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { startTime: now, count: 1 });
    return next();
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
  }
  next();
};

// 定期清理过期限流记录
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap) {
    if (now - record.startTime > RATE_LIMIT_WINDOW) rateLimitMap.delete(key);
  }
}, 60 * 1000);

// 初始化数据库（使用绝对路径，避免工作目录变更导致数据丢失）
const db = new Database(path.resolve(__dirname, 'data', 'hatter.db'));
db.pragma('journal_mode = WAL');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    messages TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, updated_at DESC);
`);

// ===== 用户认证 =====

// 生成 token（含时间戳）
const generateToken = (userId) => {
  const timestamp = Date.now().toString(36);
  return crypto.randomBytes(16).toString('hex') + ':' + userId + ':' + timestamp;
};

// 解析 token（含过期校验）
const parseToken = (token) => {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length < 2) return null;
  const userId = parts[1];
  // 校验过期时间
  if (parts.length >= 3) {
    const timestamp = parseInt(parts[2], 36);
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return null;
  }
  return userId;
};

// 密码哈希
const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

// 鉴权中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token;
  const userId = parseToken(token);
  if (!userId) {
    // 区分 token 缺失和过期
    if (token && token.split(':').length >= 3) {
      const timestamp = parseInt(token.split(':')[2], 36);
      if (Date.now() - timestamp > TOKEN_EXPIRY_MS) {
        return res.status(401).json({ error: '登录已过期，请重新登录', code: 'TOKEN_EXPIRED' });
      }
    }
    return res.status(401).json({ error: '未登录' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  req.userId = userId;
  next();
};

// 注册（限流：按 IP 15分钟10次）
app.post('/api/register', rateLimiter(req => req.ip), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    // 用户名校验
    if (typeof username !== 'string') {
      return res.status(400).json({ error: '用户名格式错误' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度 3-20 个字符' });
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return res.status(400).json({ error: '用户名只能包含字母、数字、下划线和中文' });
    }

    // 密码复杂度校验
    if (typeof password !== 'string') {
      return res.status(400).json({ error: '密码格式错误' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: '密码至少 8 个字符' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: '密码不能超过 128 个字符' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: '密码需包含小写字母' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: '密码需包含大写字母' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: '密码需包含数字' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      return res.status(400).json({ error: '密码需包含特殊字符（如 !@#$%^&*）' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const id = crypto.randomBytes(8).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const now = Date.now();

    db.prepare('INSERT INTO users (id, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, username, passwordHash, salt, now);

    const token = generateToken(id);
    res.json({ success: true, token, username });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录（限流：按 IP 15分钟10次）
app.post('/api/login', rateLimiter(req => req.ip), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const hash = hashPassword(password, user.salt);
    if (hash !== user.password_hash) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken(user.id);
    res.json({ success: true, token, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

// ===== 对话管理 =====

// 保存对话
app.post('/api/conversations/save', authMiddleware, (req, res) => {
  try {
    const { id, title, messages } = req.body;
    if (!id || !messages) {
      return res.status(400).json({ error: 'Missing id or messages' });
    }

    const now = Date.now();
    const existing = db.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').get(id, req.userId);

    if (existing) {
      db.prepare('UPDATE conversations SET title = ?, messages = ?, updated_at = ? WHERE id = ? AND user_id = ?')
        .run(title || '未命名对话', JSON.stringify(messages), now, id, req.userId);
    } else {
      db.prepare('INSERT INTO conversations (id, user_id, title, messages, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, req.userId, title || '未命名对话', JSON.stringify(messages), now, now);
    }

    res.json({ success: true, id, updatedAt: now });
  } catch (err) {
    console.error('Save conversation error:', err);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// 获取对话列表
app.get('/api/conversations/list', authMiddleware, (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, title, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100');
    const rows = stmt.all(req.userId);
    res.json({ conversations: rows });
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

// 获取单个对话
app.get('/api/conversations/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, req.userId);

    if (!row) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// 删除对话
app.delete('/api/conversations/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Hatter server running on port ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  db.close();
  process.exit(0);
});
