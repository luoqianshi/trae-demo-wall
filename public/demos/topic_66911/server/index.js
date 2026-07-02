const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const multer = require('multer');
const mammoth = require('mammoth');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const https = require('https');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: '请求过于频繁，请稍后再试' } });
app.use('/api/auth', authLimiter);
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: 'AI 请求过于频繁，请稍后再试' } });
app.use('/api/ai', aiLimiter);
app.use('/api/chat/ai-response', aiLimiter);

// Database setup
const dbPath = path.join(__dirname, '..', 'data', 'caijianji.db');
const db = new sqlite3.Database(dbPath);

// Password hash helper
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Generate token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ============ AI HELPER FUNCTIONS ============

function callRealAI(config, messages) {
  return new Promise((resolve, reject) => {
    const { provider, apiKey, baseUrl, model } = config;
    const isOllama = provider === 'ollama';
    const endpoint = isOllama ? `${baseUrl}/api/generate` : `${baseUrl}/chat/completions`;
    const url = new URL(endpoint);

    let body;
    if (isOllama) {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      body = JSON.stringify({ model, prompt, stream: false });
    } else {
      body = JSON.stringify({ model, messages, stream: false });
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(apiKey && !isOllama ? { 'Authorization': `Bearer ${apiKey}` } : {}),
        ...(apiKey && isOllama ? { 'Authorization': `Bearer ${apiKey}` } : {})
      }
    };

    const protocol = url.protocol === 'https:' ? https : require('http');
    const request = protocol.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message || JSON.stringify(json.error)));
            return;
          }
          if (isOllama) {
            resolve(json.response || '');
          } else {
            resolve(json.choices?.[0]?.message?.content || '');
          }
        } catch (e) {
          reject(new Error('AI 响应解析失败: ' + e.message));
        }
      });
    });

    request.on('error', (err) => reject(new Error('AI 请求失败: ' + err.message)));
    request.write(body);
    request.end();
  });
}

// Initialize database
function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      passwordHash TEXT NOT NULL,
      displayName TEXT,
      avatar TEXT,
      isGuest INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Sessions table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      expiresAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Plans table (with userId)
    db.run(`CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT NOT NULL,
      totalWords INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      planId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      orderNum INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      targetWords INTEGER DEFAULT 0,
      completedWords INTEGER DEFAULT 0,
      deadline TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (planId) REFERENCES plans(id) ON DELETE CASCADE
    )`);

    // Writing records table
    db.run(`CREATE TABLE IF NOT EXISTS writing_records (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      wordsWritten INTEGER DEFAULT 0,
      writingDate TEXT DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    )`);

    // Chat sessions table
    db.run(`CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT DEFAULT '新对话',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Chat messages table
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionId) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )`);

    // Papers/Literature table
    db.run(`CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      authors TEXT,
      journal TEXT,
      year INTEGER,
      doi TEXT,
      abstract TEXT,
      tags TEXT,
      filePath TEXT,
      readStatus TEXT DEFAULT 'unread',
      notes TEXT,
      rating INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Knowledge base entries table
    db.run(`CREATE TABLE IF NOT EXISTS knowledge_entries (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      tags TEXT,
      sourcePaperId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sourcePaperId) REFERENCES papers(id) ON DELETE SET NULL
    )`);

    // Documents table
    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      planId TEXT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      plainText TEXT DEFAULT '',
      wordCount INTEGER DEFAULT 0,
      fileName TEXT,
      status TEXT DEFAULT 'draft',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (planId) REFERENCES plans(id) ON DELETE SET NULL
    )`);
  });
}

initDatabase();

// Helper functions
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Guest token prefix
const GUEST_TOKEN_PREFIX = 'guest_';

// Auth middleware - supports both real users and guest users
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if it's a guest token
  if (token.startsWith(GUEST_TOKEN_PREFIX)) {
    // Guest user - extract user info from token
    try {
      const guestData = JSON.parse(Buffer.from(token.replace(GUEST_TOKEN_PREFIX, ''), 'base64').toString());
      req.user = {
        id: guestData.id,
        username: guestData.username,
        displayName: guestData.displayName,
        isGuest: true
      };
      req.isGuest = true;
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid guest token' });
    }
  }

  // Real user - check database
  const session = await getQuery('SELECT * FROM sessions WHERE token = ?', [token]);
  if (!session) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = await getQuery('SELECT * FROM users WHERE id = ?', [session.userId]);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  req.isGuest = false;
  next();
}

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existingUser = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const id = uuidv4();
    const passwordHash = await hashPassword(password);

    await runQuery(
      'INSERT INTO users (id, username, email, passwordHash, displayName, isGuest) VALUES (?, ?, ?, ?, ?, 0)',
      [id, username, email || null, passwordHash, displayName || username]
    );

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await runQuery(
      'INSERT INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)',
      [token, id, expiresAt.toISOString()]
    );

    res.status(201).json({
      token,
      user: { id, username, displayName: displayName || username, email, isGuest: false }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await runQuery(
      'INSERT INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)',
      [token, user.id, expiresAt.toISOString()]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        isGuest: false
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guest login - returns a token that identifies the guest
app.post('/api/auth/guest', async (req, res) => {
  try {
    const id = uuidv4();
    const username = `guest_${Date.now()}`;
    const displayName = '游客用户';
    
    // Create a guest token that contains user info
    const guestData = { id, username, displayName };
    const token = GUEST_TOKEN_PREFIX + Buffer.from(JSON.stringify(guestData)).toString('base64');

    res.json({
      token,
      user: {
        id,
        username,
        displayName,
        email: null,
        isGuest: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    displayName: req.user.displayName || req.user.username,
    email: req.user.email,
    isGuest: req.user.isGuest === 1 || req.user.isGuest === true
  });
});

// Logout
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token.startsWith(GUEST_TOKEN_PREFIX)) {
    await runQuery('DELETE FROM sessions WHERE token = ?', [token]);
  }
  res.json({ message: 'Logged out' });
});

// ============ PLANS ROUTES ============

app.get('/api/plans', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      // Guest users get empty plans (stored in localStorage on frontend)
      return res.json([]);
    }
    const plans = await allQuery('SELECT * FROM plans WHERE userId = ? ORDER BY createdAt DESC', [req.user.id]);
    for (const plan of plans) {
      const tasks = await allQuery('SELECT * FROM tasks WHERE planId = ? ORDER BY orderNum', [plan.id]);
      plan.tasks = tasks;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      plan.progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    }
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/plans/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    const plan = await getQuery('SELECT * FROM plans WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    const tasks = await allQuery('SELECT * FROM tasks WHERE planId = ? ORDER BY orderNum', [plan.id]);
    plan.tasks = tasks;
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plans', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, description, deadline, totalWords, status } = req.body;
    const id = uuidv4();
    await runQuery(
      'INSERT INTO plans (id, userId, title, description, deadline, totalWords, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, title, description || '', deadline, totalWords || 0, status || 'active']
    );
    const plan = await getQuery('SELECT * FROM plans WHERE id = ?', [id]);
    plan.tasks = [];
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/plans/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, description, deadline, totalWords, status } = req.body;
    await runQuery(
      'UPDATE plans SET title = ?, description = ?, deadline = ?, totalWords = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?',
      [title, description, deadline, totalWords, status, req.params.id, req.user.id]
    );
    const plan = await getQuery('SELECT * FROM plans WHERE id = ?', [req.params.id]);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/plans/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    await runQuery('DELETE FROM plans WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TASKS ROUTES ============

app.get('/api/plans/:planId/tasks', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json([]);
    }
    const tasks = await allQuery('SELECT * FROM tasks WHERE planId = ? ORDER BY orderNum', [req.params.planId]);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plans/:planId/tasks', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, description, orderNum, status, targetWords, deadline } = req.body;
    const id = uuidv4();
    await runQuery(
      'INSERT INTO tasks (id, planId, title, description, orderNum, status, targetWords, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.planId, title, description || '', orderNum || 0, status || 'pending', targetWords || 0, deadline || '']
    );
    const task = await getQuery('SELECT * FROM tasks WHERE id = ?', [id]);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, description, orderNum, status, targetWords, completedWords, deadline } = req.body;
    await runQuery(
      'UPDATE tasks SET title = ?, description = ?, orderNum = ?, status = ?, targetWords = ?, completedWords = ?, deadline = ? WHERE id = ?',
      [title, description, orderNum, status, targetWords, completedWords, deadline, req.params.id]
    );
    const task = await getQuery('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    await runQuery('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ AI PLANNING ROUTES ============

app.post('/api/ai/generate-plan', authMiddleware, async (req, res) => {
  try {
    const { title, deadline, description, config } = req.body;
    const daysTotal = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const literatureDays = Math.max(5, Math.floor(daysTotal * 0.15));
    const outlineDays = Math.max(3, Math.floor(daysTotal * 0.1));
    const writingDays = Math.max(10, Math.floor(daysTotal * 0.55));
    const revisionDays = Math.max(5, Math.floor(daysTotal * 0.2));

    // fallback 模板生成函数
    const createFallbackPlan = () => ({
      title: title + ' [模板]',
      deadline,
      phases: [
        {
          name: '文献调研期',
          duration: literatureDays,
          tasks: ['检索并筛选核心文献', '阅读并整理文献笔记', '撰写文献综述初稿', '确定研究框架与方法']
        },
        {
          name: '提纲搭建期',
          duration: outlineDays,
          tasks: ['确定论文章节结构', '明确各章核心论点', '分配各章字数目标', '与导师确认提纲']
        },
        {
          name: '分章撰写期',
          duration: writingDays,
          tasks: ['撰写第一章：引言', '撰写第二章：文献综述', '撰写第三章：研究方法', '撰写第四章：实验结果', '撰写第五章：讨论与结论']
        },
        {
          name: '修改润色期',
          duration: revisionDays,
          tasks: ['检查格式与引用规范', '梳理逻辑与衔接', '语言润色与降重', '导师审阅与修改', '最终定稿与提交']
        }
      ]
    });

    let aiPlan;

    if (config && config.provider && config.baseUrl && config.model) {
      // 调用真实 AI 生成规划
      const prompt = `你是一位学术写作规划专家。请根据以下信息生成详细的论文写作规划：

论文标题：${title}
描述：${description || '无'}
截止时间：${deadline}（距今${daysTotal}天）

请生成JSON格式，包含4个阶段：文献调研期、提纲搭建期、分章撰写期、修改润色期。每个阶段包含duration（天数）和tasks（任务列表，5-8个具体任务）。

总天数分配建议：文献调研15%、提纲搭建10%、分章撰写55%、修改润色20%。

只输出JSON，不要其他内容。`;

      const messages = [
        { role: 'system', content: '你是一个专业的学术写作规划助手，只输出纯JSON，不要添加任何markdown代码块标记或其他说明文字。' },
        { role: 'user', content: prompt }
      ];

      try {
        const aiResponse = await callRealAI(config, messages);
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (parsed && parsed.phases && Array.isArray(parsed.phases) && parsed.phases.length === 4) {
          aiPlan = {
            title,
            deadline,
            phases: parsed.phases.map((phase, idx) => ({
              name: phase.name || ['文献调研期', '提纲搭建期', '分章撰写期', '修改润色期'][idx],
              duration: phase.duration || [literatureDays, outlineDays, writingDays, revisionDays][idx],
              tasks: Array.isArray(phase.tasks) ? phase.tasks : ['按计划推进']
            }))
          };
        } else {
          throw new Error('AI 返回格式不符合预期');
        }
      } catch (aiError) {
        // AI 调用失败或解析失败，回退到 fallback 模板
        aiPlan = createFallbackPlan();
      }
    } else {
      // 未配置 AI，直接返回 fallback 模板
      aiPlan = createFallbackPlan();
    }

    res.json(aiPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CHAT ROUTES ============

app.get('/api/chat/sessions', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json([]);
    }
    const sessions = await allQuery(
      'SELECT * FROM chat_sessions WHERE userId = ? ORDER BY updatedAt DESC',
      [req.user.id]
    );
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/sessions', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    if (req.isGuest) {
      // 游客模式：返回临时会话数据
      const id = uuidv4();
      return res.status(201).json({
        id,
        userId: req.user.id,
        title: title || '新对话',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    const id = uuidv4();
    await runQuery(
      'INSERT INTO chat_sessions (id, userId, title) VALUES (?, ?, ?)',
      [id, req.user.id, title || '新对话']
    );
    const session = await getQuery('SELECT * FROM chat_sessions WHERE id = ?', [id]);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chat/sessions/:id/messages', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json([]);
    }
    const messages = await allQuery(
      'SELECT * FROM chat_messages WHERE sessionId = ? ORDER BY createdAt',
      [req.params.id]
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/sessions/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content, role } = req.body;
    const id = uuidv4();
    if (req.isGuest) {
      // 游客模式：返回临时消息数据
      return res.status(201).json({
        id,
        sessionId: req.params.id,
        role: role || 'user',
        content,
        createdAt: new Date().toISOString()
      });
    }
    await runQuery(
      'INSERT INTO chat_messages (id, sessionId, role, content) VALUES (?, ?, ?, ?)',
      [id, req.params.id, role || 'user', content]
    );

    // Update session updatedAt
    await runQuery(
      'UPDATE chat_sessions SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );

    const message = await getQuery('SELECT * FROM chat_messages WHERE id = ?', [id]);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Chat response - SSE streaming with real AI support
app.post('/api/chat/ai-response', authMiddleware, async (req, res) => {
  try {
    const { sessionId, message, config } = req.body;
    let response = '';

    if (config && config.provider && config.baseUrl && config.model) {
      // 调用真实 AI API
      const messages = [
        { role: 'system', content: '你是「才笺记」学术写作助手，专门帮助用户解决论文写作、文献阅读、提纲构建等学术相关问题。请用中文回答，保持专业、友好、简洁。' },
        { role: 'user', content: message }
      ];
      response = await callRealAI(config, messages);
    } else {
      // 未配置 AI，返回友好提示
      response = '您好！我是「才笺记」学术写作助手。\n\n我注意到您尚未在设置中配置 AI 提供商。为了获得更智能、更个性化的回复，请前往「设置」页面配置您的 AI 服务（支持 DeepSeek、OpenAI、Ollama 等）。\n\n配置完成后，我将能够：\n- 针对您的具体问题提供专业建议\n- 协助梳理论文结构和逻辑\n- 帮助生成写作计划和提纲\n- 解答各类学术写作疑问';
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 逐字发送
    for (let i = 0; i < response.length; i++) {
      res.write(`data: ${JSON.stringify({ content: response[i] })}\n\n`);
      // 模拟打字速度
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
    }
    res.write('data: [DONE]\n\n');

    // 保存完整响应到数据库
    if (!req.isGuest) {
      const aiMsgId = uuidv4();
      await runQuery(
        'INSERT INTO chat_messages (id, sessionId, role, content) VALUES (?, ?, ?, ?)',
        [aiMsgId, sessionId, 'assistant', response]
      );
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/chat/sessions/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    await runQuery('DELETE FROM chat_sessions WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PAPERS ROUTES ============

app.get('/api/papers', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json([]);
    }
    const papers = await allQuery(
      'SELECT * FROM papers WHERE userId = ? ORDER BY createdAt DESC',
      [req.user.id]
    );
    res.json(papers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/papers', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, authors, journal, year, doi, abstract, tags } = req.body;
    const id = uuidv4();
    await runQuery(
      'INSERT INTO papers (id, userId, title, authors, journal, year, doi, abstract, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, title, authors || '', journal || '', year || null, doi || '', abstract || '', tags || '']
    );
    const paper = await getQuery('SELECT * FROM papers WHERE id = ?', [id]);
    res.status(201).json(paper);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/papers/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, authors, journal, year, doi, abstract, tags, readStatus, notes, rating } = req.body;
    await runQuery(
      'UPDATE papers SET title = ?, authors = ?, journal = ?, year = ?, doi = ?, abstract = ?, tags = ?, readStatus = ?, notes = ?, rating = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?',
      [title, authors, journal, year, doi, abstract, tags, readStatus, notes, rating, req.params.id, req.user.id]
    );
    const paper = await getQuery('SELECT * FROM papers WHERE id = ?', [req.params.id]);
    res.json(paper);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/papers/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    await runQuery('DELETE FROM papers WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ KNOWLEDGE BASE ROUTES ============

app.get('/api/knowledge', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json([]);
    }
    const entries = await allQuery(
      'SELECT k.*, p.title as sourcePaperTitle FROM knowledge_entries k LEFT JOIN papers p ON k.sourcePaperId = p.id WHERE k.userId = ? ORDER BY k.updatedAt DESC',
      [req.user.id]
    );
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/knowledge', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, content, category, tags, sourcePaperId } = req.body;
    const id = uuidv4();
    await runQuery(
      'INSERT INTO knowledge_entries (id, userId, title, content, category, tags, sourcePaperId) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, title, content, category || 'general', tags || '', sourcePaperId || null]
    );
    const entry = await getQuery('SELECT * FROM knowledge_entries WHERE id = ?', [id]);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/knowledge/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, content, category, tags } = req.body;
    await runQuery(
      'UPDATE knowledge_entries SET title = ?, content = ?, category = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?',
      [title, content, category, tags, req.params.id, req.user.id]
    );
    const entry = await getQuery('SELECT * FROM knowledge_entries WHERE id = ?', [req.params.id]);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/knowledge/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    await runQuery('DELETE FROM knowledge_entries WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STATISTICS ROUTES ============

app.get('/api/plans/:planId/statistics', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json({ totalWords: 0, completedWords: 0, progress: 0, dailyAverage: 0, daysRemaining: 0, riskLevel: 'low' });
    }
    const plan = await getQuery('SELECT * FROM plans WHERE id = ? AND userId = ?', [req.params.planId, req.user.id]);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const tasks = await allQuery('SELECT * FROM tasks WHERE planId = ?', [req.params.planId]);
    const totalWords = plan.totalWords || 0;
    const completedWords = tasks.reduce((sum, t) => sum + (t.completedWords || 0), 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const daysRemaining = Math.ceil((new Date(plan.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const daysTotal = Math.ceil((new Date(plan.deadline) - new Date(plan.createdAt)) / (1000 * 60 * 60 * 24));
    const dailyAverage = daysTotal > 0 ? Math.round(completedWords / Math.max(1, daysTotal - daysRemaining)) : 0;

    const expectedProgress = daysTotal > 0 ? ((daysTotal - daysRemaining) / daysTotal) * 100 : 0;
    const gap = expectedProgress - progress;
    let riskLevel = 'low';
    if (gap > 20) riskLevel = 'high';
    else if (gap > 10) riskLevel = 'medium';

    res.json({ totalWords, completedWords, progress, dailyAverage, daysRemaining, riskLevel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/plans/:planId/trend', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json([]);
    }
    const days = parseInt(req.query.days) || 30;
    const records = await allQuery(
      `SELECT writingDate, SUM(wordsWritten) as words FROM writing_records WHERE taskId IN (SELECT id FROM tasks WHERE planId = ?) AND writingDate >= date('now', '-${days} days') GROUP BY writingDate ORDER BY writingDate`,
      [req.params.planId]
    );

    const trend = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = records.find(r => r.writingDate?.split('T')[0] === dateStr);
      trend.push({ date: dateStr, words: record ? record.words : 0 });
    }
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ OVERVIEW STATISTICS ============

app.get('/api/statistics/overview', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json({ totalPlans: 0, activePlans: 0, totalPapers: 0, totalKnowledge: 0, totalChatSessions: 0, readPapers: 0, unreadPapers: 0, totalDocuments: 0 });
    }
    const plans = await allQuery('SELECT * FROM plans WHERE userId = ?', [req.user.id]);
    const papers = await allQuery('SELECT * FROM papers WHERE userId = ?', [req.user.id]);
    const knowledge = await allQuery('SELECT * FROM knowledge_entries WHERE userId = ?', [req.user.id]);
    const chatSessions = await allQuery('SELECT * FROM chat_sessions WHERE userId = ?', [req.user.id]);
    const documents = await allQuery('SELECT * FROM documents WHERE userId = ?', [req.user.id]);

    const totalTasks = plans.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    const activePlans = plans.filter(p => p.status === 'active').length;

    res.json({
      totalPlans: plans.length,
      activePlans,
      totalPapers: papers.length,
      totalKnowledge: knowledge.length,
      totalChatSessions: chatSessions.length,
      readPapers: papers.filter(p => p.readStatus === 'read').length,
      unreadPapers: papers.filter(p => p.readStatus === 'unread').length,
      totalDocuments: documents.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DOCUMENTS ROUTES ============

// Multer configuration for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx and .doc files are allowed'));
    }
  }
});

// Create document
app.post('/api/documents', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, content, planId } = req.body;
    const id = uuidv4();
    const plainText = content ? content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
    const wordCount = plainText.length;

    await runQuery(
      'INSERT INTO documents (id, userId, planId, title, content, plainText, wordCount) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, planId || null, title || '未命名文档', content || '', plainText, wordCount]
    );
    const doc = await getQuery('SELECT * FROM documents WHERE id = ?', [id]);
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user documents list
app.get('/api/documents', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json([]);
    }
    const documents = await allQuery(
      'SELECT * FROM documents WHERE userId = ? ORDER BY updatedAt DESC',
      [req.user.id]
    );
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single document
app.get('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const doc = await getQuery('SELECT * FROM documents WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update document
app.put('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    const { title, content, status } = req.body;
    const plainText = content ? content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
    const wordCount = plainText.length;

    await runQuery(
      'UPDATE documents SET title = ?, content = ?, plainText = ?, wordCount = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?',
      [title, content, plainText, wordCount, status || 'draft', req.params.id, req.user.id]
    );
    const doc = await getQuery('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
app.delete('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    if (req.isGuest) {
      return res.status(403).json({ error: 'Guest users cannot save data. Please register or login.' });
    }
    await runQuery('DELETE FROM documents WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Word document
app.post('/api/documents/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse docx to HTML using mammoth
    const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
    const html = result.value;
    const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    // Extract title from filename
    const fileName = req.file.originalname;
    const title = fileName.replace(/\.(docx?|DOCX?)$/, '');

    // For guest users, return the parsed document without saving to DB
    if (req.isGuest) {
      const id = uuidv4();
      const doc = {
        id,
        userId: req.user.id,
        planId: null,
        title,
        content: html || '<p></p>',
        plainText,
        wordCount: plainText.length,
        fileName,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return res.status(201).json(doc);
    }

    const id = uuidv4();
    await runQuery(
      'INSERT INTO documents (id, userId, title, content, plainText, wordCount, fileName) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, title, html, plainText, plainText.length, fileName]
    );
    const doc = await getQuery('SELECT * FROM documents WHERE id = ?', [id]);
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI suggestion (simulated)
app.post('/api/documents/:id/ai-suggest', authMiddleware, async (req, res) => {
  try {
    const { context, cursorPosition } = req.body;
    const doc = await getQuery('SELECT * FROM documents WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const text = context || doc.plainText || '';
    const lowerText = text.toLowerCase();

    let suggestions = [];
    let category = 'general';

    if (lowerText.includes('引言') || lowerText.includes('introduction')) {
      category = 'introduction';
      suggestions = [
        '本研究旨在探讨',
        '随着...的快速发展，',
        '近年来，...领域受到了广泛关注。',
        '基于前人的研究成果，',
        '在此背景下，本文提出了一种新的方法'
      ];
    } else if (lowerText.includes('方法') || lowerText.includes('实验') || lowerText.includes('method')) {
      category = 'methodology';
      suggestions = [
        '本实验采用以下步骤：',
        '数据集来源于',
        '我们使用了...模型进行训练，',
        '实验参数设置如下：',
        '为了验证方法的有效性，'
      ];
    } else if (lowerText.includes('结论') || lowerText.includes('conclusion')) {
      category = 'conclusion';
      suggestions = [
        '综上所述，本研究的主要贡献包括：',
        '实验结果表明，',
        '本文提出的方案在...方面取得了显著提升。',
        '未来的研究方向可以包括：',
        '本研究为...提供了新的思路。'
      ];
    } else if (lowerText.includes('文献') || lowerText.includes('综述') || lowerText.includes('related work')) {
      category = 'literature';
      suggestions = [
        '已有研究表明，',
        '张等人[1]提出了一种基于...的方法。',
        '与传统方法相比，',
        '该领域的早期研究主要集中在',
        '近年来，许多学者致力于解决'
      ];
    } else if (lowerText.includes('讨论') || lowerText.includes('discussion')) {
      category = 'discussion';
      suggestions = [
        '从实验结果可以看出，',
        '这一发现与...的研究结果一致。',
        '可能的解释是',
        '值得注意的是，',
        '该结果进一步证实了'
      ];
    } else {
      suggestions = [
        '首先，',
        '其次，',
        '此外，',
        '因此，',
        '基于以上分析，'
      ];
    }

    res.json({
      suggestions,
      category,
      context: text.slice(-200)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI analyze document (simulated)
app.post('/api/documents/:id/ai-analyze', authMiddleware, async (req, res) => {
  try {
    const doc = await getQuery('SELECT * FROM documents WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const text = doc.plainText || '';
    const wordCount = doc.wordCount || text.length;

    // Detect chapter structure
    const chapterRegex = /第[一二三四五六七八九十\d]+章|Chapter\s+\d+|^\d+[\.\s]+[^\n]+/gm;
    const chapters = text.match(chapterRegex) || [];

    // Detect sections
    const sectionRegex = /^\d+[\.\d]*\s+[^\n]+|第[一二三四五六七八九十\d]+节/gm;
    const sections = text.match(sectionRegex) || [];

    // Detect key elements
    const hasAbstract = /摘要|Abstract/i.test(text);
    const hasKeywords = /关键词|Keywords/i.test(text);
    const hasReferences = /参考文献|References/i.test(text);
    const hasConclusion = /结论|Conclusion/i.test(text);

    // Paragraph count
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Writing plan suggestions
    const planSuggestions = [];
    if (!hasAbstract) planSuggestions.push('建议添加摘要部分，简要概述研究目的、方法和主要结论');
    if (!hasKeywords) planSuggestions.push('建议添加关键词，通常3-5个');
    if (chapters.length < 3) planSuggestions.push('论文章节结构尚不完整，建议补充至5章以上');
    if (wordCount < 3000) planSuggestions.push('当前字数较少，建议扩充至目标字数');
    if (!hasReferences) planSuggestions.push('建议添加参考文献列表');
    if (!hasConclusion) planSuggestions.push('建议添加结论部分');

    res.json({
      wordCount,
      paragraphCount: paragraphs.length,
      chapterCount: chapters.length,
      sectionCount: sections.length,
      chapters: chapters.slice(0, 20),
      sections: sections.slice(0, 30),
      structure: {
        hasAbstract,
        hasKeywords,
        hasReferences,
        hasConclusion
      },
      planSuggestions,
      overallScore: Math.min(100, Math.round(
        (hasAbstract ? 15 : 0) +
        (hasKeywords ? 5 : 0) +
        (chapters.length >= 3 ? 30 : chapters.length * 10) +
        (sections.length >= 5 ? 20 : sections.length * 4) +
        (hasReferences ? 15 : 0) +
        (hasConclusion ? 15 : 0)
      ))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI check plan progress (simulated)
app.post('/api/documents/:id/ai-check', authMiddleware, async (req, res) => {
  try {
    const doc = await getQuery('SELECT * FROM documents WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const text = doc.plainText || '';

    // Get associated plan tasks if planId exists
    let tasks = [];
    if (doc.planId) {
      tasks = await allQuery('SELECT * FROM tasks WHERE planId = ? ORDER BY orderNum', [doc.planId]);
    }

    // Check completion status based on content
    const taskResults = tasks.map(task => {
      const taskTitle = task.title.toLowerCase();
      let completed = false;
      let matchScore = 0;

      // Check if document content relates to this task
      const keywords = taskTitle.replace(/[撰写|完成|搭建|检查|修改|确定|整理|阅读|检索]/g, '').trim();
      if (keywords.length > 0) {
        const regex = new RegExp(keywords.split('').join('.*'), 'i');
        if (regex.test(text)) {
          matchScore = Math.min(100, Math.round((text.length / Math.max(500, task.targetWords || 500)) * 100));
          completed = matchScore >= 60;
        }
      }

      return {
        taskId: task.id,
        title: task.title,
        targetWords: task.targetWords,
        completed,
        matchScore,
        status: completed ? 'completed' : (matchScore > 0 ? 'in_progress' : 'not_started')
      };
    });

    const completedCount = taskResults.filter(t => t.completed).length;
    const inProgressCount = taskResults.filter(t => t.status === 'in_progress').length;
    const notStartedCount = taskResults.filter(t => t.status === 'not_started').length;

    res.json({
      documentId: doc.id,
      planId: doc.planId,
      tasks: taskResults,
      summary: {
        total: taskResults.length,
        completed: completedCount,
        inProgress: inProgressCount,
        notStarted: notStartedCount,
        progress: taskResults.length > 0 ? Math.round((completedCount / taskResults.length) * 100) : 0
      },
      suggestions: tasks.length === 0
        ? ['该文档未关联写作计划，建议在创建文档时关联计划以便跟踪进度']
        : notStartedCount > 0
          ? [`还有 ${notStartedCount} 个任务尚未开始，建议按顺序逐步完成`]
          : inProgressCount > 0
            ? [`有 ${inProgressCount} 个任务正在进行中，继续加油`]
            : ['所有任务已完成，建议进行最终检查和润色']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SEED DATA ============

app.post('/api/seed', async (req, res) => {
  try {
    // Create a demo user
    const userId = uuidv4();
    await runQuery(
      'INSERT INTO users (id, username, email, passwordHash, displayName) VALUES (?, ?, ?, ?, ?)',
      [userId, 'demo', 'demo@caijianji.com', await hashPassword('demo123'), '演示用户']
    );

    // Create demo plan
    const planId = uuidv4();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 60);

    await runQuery(
      'INSERT INTO plans (id, userId, title, description, deadline, totalWords, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [planId, userId, '毕业论文：深度学习在医学影像中的应用', '研究深度学习技术在医学影像分析中的最新进展与应用', deadline.toISOString().split('T')[0], 15000, 'active']
    );

    const tasks = [
      { title: '检索核心文献', targetWords: 0, orderNum: 0 },
      { title: '阅读并整理文献笔记', targetWords: 0, orderNum: 1 },
      { title: '撰写文献综述', targetWords: 3000, orderNum: 2 },
      { title: '确定研究方法', targetWords: 0, orderNum: 3 },
      { title: '搭建论文提纲', targetWords: 0, orderNum: 4 },
      { title: '撰写第一章：引言', targetWords: 2000, orderNum: 5 },
      { title: '撰写第二章：相关工作', targetWords: 4000, orderNum: 6 },
      { title: '撰写第三章：方法', targetWords: 3000, orderNum: 7 },
      { title: '撰写第四章：实验', targetWords: 3000, orderNum: 8 },
      { title: '撰写第五章：结论', targetWords: 2000, orderNum: 9 },
      { title: '修改与润色', targetWords: 0, orderNum: 10 },
      { title: '格式检查与提交', targetWords: 0, orderNum: 11 },
    ];

    for (const task of tasks) {
      const taskId = uuidv4();
      const status = task.orderNum < 5 ? 'completed' : task.orderNum < 7 ? 'in_progress' : 'pending';
      const completedWords = status === 'completed' ? task.targetWords : status === 'in_progress' ? Math.floor(task.targetWords * 0.6) : 0;
      await runQuery(
        'INSERT INTO tasks (id, planId, title, orderNum, status, targetWords, completedWords) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [taskId, planId, task.title, task.orderNum, status, task.targetWords, completedWords]
      );
    }

    // Create demo papers
    const demoPapers = [
      { title: 'Deep Learning for Medical Image Analysis: A Comprehensive Review', authors: 'Litjens, G. et al.', journal: 'Medical Image Analysis', year: 2021, doi: '10.1016/j.media.2021.102102', abstract: 'This review covers the latest advances in deep learning for medical image analysis...', tags: 'deep learning, medical imaging, review', readStatus: 'read', rating: 5 },
      { title: 'Attention Is All You Need', authors: 'Vaswani, A. et al.', journal: 'NeurIPS', year: 2017, doi: '10.48550/arXiv.1706.03762', abstract: 'We propose a new simple network architecture, the Transformer...', tags: 'transformer, attention, NLP', readStatus: 'read', rating: 5 },
      { title: 'U-Net: Convolutional Networks for Biomedical Image Segmentation', authors: 'Ronneberger, O. et al.', journal: 'MICCAI', year: 2015, doi: '10.1007/978-3-319-24574-4_28', abstract: 'There is large consent that successful training of deep networks...', tags: 'CNN, segmentation, biomedical', readStatus: 'unread', rating: 0 },
    ];

    for (const paper of demoPapers) {
      const paperId = uuidv4();
      await runQuery(
        'INSERT INTO papers (id, userId, title, authors, journal, year, doi, abstract, tags, readStatus, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [paperId, userId, paper.title, paper.authors, paper.journal, paper.year, paper.doi, paper.abstract, paper.tags, paper.readStatus, paper.rating]
      );
    }

    // Create demo knowledge entries
    const demoKnowledge = [
      { title: 'CNN在医学影像中的应用要点', content: '1. 数据预处理：标准化、归一化\n2. 数据增强：旋转、翻转、缩放\n3. 损失函数选择：Dice Loss, Focal Loss\n4. 评估指标：IoU, Dice Score, Sensitivity', category: 'methodology', tags: 'CNN, medical imaging, deep learning' },
      { title: 'Transformer架构核心思想', content: 'Self-Attention机制允许模型在处理序列时关注不同位置的信息。关键组件：\n1. Multi-Head Attention\n2. Position Encoding\n3. Feed-Forward Networks\n4. Layer Normalization', category: 'theory', tags: 'transformer, attention, architecture' },
    ];

    for (const entry of demoKnowledge) {
      const entryId = uuidv4();
      await runQuery(
        'INSERT INTO knowledge_entries (id, userId, title, content, category, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [entryId, userId, entry.title, entry.content, entry.category, entry.tags]
      );
    }

    // Create demo chat session
    const chatSessionId = uuidv4();
    await runQuery(
      'INSERT INTO chat_sessions (id, userId, title) VALUES (?, ?, ?)',
      [chatSessionId, userId, '论文写作咨询']
    );

    const demoMessages = [
      { role: 'user', content: '你好，我正在写毕业论文，关于深度学习在医学影像中的应用，有什么建议吗？' },
      { role: 'assistant', content: '您好！这是一个非常有前景的研究方向。关于深度学习在医学影像中的应用，我建议您可以：\n\n1. **明确研究问题**：是关注分类、分割还是检测任务？\n2. **数据集选择**：常用的有ChestX-ray14、ISIC、BraTS等\n3. **模型选择**：U-Net系列用于分割，ResNet用于分类，YOLO用于检测\n4. **评估指标**：准确率、敏感性、特异性、AUC等\n\n您目前在哪个阶段？我可以帮您制定更具体的计划。' },
      { role: 'user', content: '我现在在文献综述阶段，感觉文献太多看不完' },
      { role: 'assistant', content: '文献综述确实是一个挑战！建议您采用以下策略：\n\n1. **分层阅读法**：\n   - 第一层：读标题+摘要，筛选相关文献（约30%）\n   - 第二层：读引言+结论，了解核心贡献（约20%）\n   - 第三层：精读全文，提取方法细节（约10%）\n\n2. **建立文献矩阵**：\n   | 作者 | 年份 | 方法 | 数据集 | 主要结论 |\n\n3. **关注高引文献和综述**：先读领域内的经典综述，了解发展脉络\n\n4. **使用工具**：Zotero或Mendeley管理文献，做好标签分类\n\n建议您先聚焦近3-5年的顶会/顶刊论文，数量控制在50-80篇即可。' },
    ];

    for (const msg of demoMessages) {
      await runQuery(
        'INSERT INTO chat_messages (id, sessionId, role, content) VALUES (?, ?, ?, ?)',
        [uuidv4(), chatSessionId, msg.role, msg.content]
      );
    }

    res.json({ message: 'Seed data created successfully', userId, username: 'demo', password: 'demo123' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
