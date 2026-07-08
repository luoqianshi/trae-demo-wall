/**
 * 初中生艾宾浩斯背诵打卡小程序 - 后端服务
 * 技术栈:Node.js + Express + SQLite(better-sqlite3)
 * 启动:node server.js   默认端口 3000
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const eb = require('./ebbinghaus');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ====== 简易鉴权中间件(基于 user_id token)======
// 实际生产中应结合微信 code2session 换取 openid,此处简化
function auth(req, res, next) {
  const token = req.headers['x-user-token'];
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    // token = base64(userId + ':' + sign)
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId, sign] = decoded.split(':');
    if (sign !== 'ebbinghaus2024') return res.status(401).json({ error: 'token 无效' });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(401).json({ error: '用户不存在' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'token 解析失败' });
  }
}

function makeToken(userId) {
  return Buffer.from(`${userId}:ebbinghaus2024`, 'utf8').toString('base64');
}

// ============================================================
// 1. 认证相关
// ============================================================

/**
 * 微信登录(简化版)
 * 实际生产应使用 wx.login() 拿到 code,服务端 code2session 换 openid
 * 这里直接用 openid 登录/注册
 */
app.post('/api/auth/login', (req, res) => {
  const { openid, nickname, avatar } = req.body;
  if (!openid) return res.json({ code: 1, msg: '缺少 openid' });

  let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  if (!user) {
    db.prepare('INSERT INTO users(openid,nickname,avatar) VALUES(?,?,?)')
      .run(openid, nickname || '同学', avatar || '');
    user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  } else if (nickname) {
    db.prepare('UPDATE users SET nickname=?, avatar=? WHERE id=?')
      .run(nickname, avatar || user.avatar, user.id);
    user = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  }
  res.json({ code: 0, data: { user, token: makeToken(user.id) } });
});

/**
 * 测试登录(无需微信,直接生成一个测试用户,方便开发调试)
 */
app.post('/api/auth/test-login', (req, res) => {
  const openid = 'test_' + (req.body.nickname || 'student');
  let user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  if (!user) {
    db.prepare('INSERT INTO users(openid,nickname) VALUES(?,?)')
      .run(openid, req.body.nickname || '测试同学');
    user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  }
  res.json({ code: 0, data: { user, token: makeToken(user.id) } });
});

/**
 * 获取当前用户信息
 */
app.get('/api/user/info', auth, (req, res) => {
  res.json({ code: 0, data: req.user });
});

/**
 * 更新用户设置(学期、每周学新次数)
 */
app.post('/api/user/settings', auth, (req, res) => {
  const { semester, learn_per_week } = req.body;
  const updates = [];
  const params = [];
  if (semester) { updates.push('semester = ?'); params.push(semester); }
  if (learn_per_week) {
    if (![2, 4].includes(Number(learn_per_week))) return res.json({ code: 1, msg: '学新次数只能是 2 或 4' });
    updates.push('learn_per_week = ?'); params.push(Number(learn_per_week));
  }
  if (updates.length === 0) return res.json({ code: 1, msg: '无更新字段' });
  params.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`).run(...params);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  res.json({ code: 0, data: user });
});

// ============================================================
// 2. 学科与内容
// ============================================================

/**
 * 获取所有学科
 */
app.get('/api/subjects', (req, res) => {
  const list = db.prepare('SELECT * FROM subjects ORDER BY sort ASC').all();
  res.json({ code: 0, data: list });
});

/**
 * 获取指定学期/学科下的内容列表
 * query: semester, subject(可选)
 */
app.get('/api/contents', (req, res) => {
  const { semester, subject } = req.query;
  let sql = 'SELECT id,subject_code,semester,unit,title,tip,sort FROM contents WHERE 1=1';
  const params = [];
  if (semester) { sql += ' AND semester=?'; params.push(semester); }
  if (subject) { sql += ' AND subject_code=?'; params.push(subject); }
  sql += ' ORDER BY sort ASC';
  const list = db.prepare(sql).all(...params);
  res.json({ code: 0, data: list });
});

/**
 * 获取内容详情(含正文)
 */
app.get('/api/contents/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM contents WHERE id=?').get(req.params.id);
  if (!c) return res.json({ code: 1, msg: '内容不存在' });
  res.json({ code: 0, data: c });
});

// ============================================================
// 3. 学习与复习(核心)
// ============================================================

/**
 * 学新内容:把某条内容标记为"已学",并生成复习计划
 */
app.post('/api/learn', auth, (req, res) => {
  const { content_id, learn_date } = req.body;
  if (!content_id) return res.json({ code: 1, msg: '缺少 content_id' });
  const content = db.prepare('SELECT * FROM contents WHERE id=?').get(content_id);
  if (!content) return res.json({ code: 1, msg: '内容不存在' });

  const date = learn_date || eb.todayStr();

  // 已存在则更新学新日期
  const exist = db.prepare('SELECT * FROM learn_records WHERE user_id=? AND content_id=?')
    .get(req.user.id, content_id);
  if (exist) {
    db.prepare('UPDATE learn_records SET learn_date=?, completed_rounds="[]", finished=0 WHERE id=?')
      .run(date, exist.id);
  } else {
    db.prepare('INSERT INTO learn_records(user_id,content_id,learn_date) VALUES(?,?,?)')
      .run(req.user.id, content_id, date);
  }

  // 打卡
  db.prepare('INSERT INTO checkins(user_id,content_id,type,read_count,checkin_date) VALUES(?,?,?,?,?)')
    .run(req.user.id, content_id, 'learn', 3, date);

  const plan = eb.buildReviewPlan(date);
  res.json({ code: 0, data: { plan, learn_date: date } });
});

/**
 * 获取今天的复习任务列表
 */
app.get('/api/review/today', auth, (req, res) => {
  const records = db.prepare(`
    SELECT lr.id, lr.content_id, lr.learn_date, lr.completed_rounds, lr.finished,
           c.subject_code, c.semester, c.unit, c.title, c.body, c.tip
    FROM learn_records lr
    JOIN contents c ON lr.content_id = c.id
    WHERE lr.user_id=? AND lr.finished=0
  `).all(req.user.id);

  const today = eb.todayStr();
  const tasks = [];
  for (const r of records) {
    const completedRounds = JSON.parse(r.completed_rounds || '[]');
    const info = eb.getTodayReview(r.learn_date, completedRounds);
    if (info.needReview) {
      tasks.push({
        record_id: r.id,
        content_id: r.content_id,
        subject_code: r.subject_code,
        semester: r.semester,
        unit: r.unit,
        title: r.title,
        body: r.body,
        tip: r.tip,
        round: info.round,
        total_rounds: info.totalRounds,
        learn_date: r.learn_date,
      });
    }
  }

  // 是否是学新日
  const isLearnDay = eb.isLearnDay(req.user.learn_per_week);

  res.json({ code: 0, data: { today, is_learn_day: isLearnDay, tasks } });
});

/**
 * 完成一次复习打卡
 */
app.post('/api/review/finish', auth, (req, res) => {
  const { record_id, read_count } = req.body;
  if (!record_id) return res.json({ code: 1, msg: '缺少 record_id' });
  const record = db.prepare('SELECT * FROM learn_records WHERE id=? AND user_id=?')
    .get(record_id, req.user.id);
  if (!record) return res.json({ code: 1, msg: '记录不存在' });

  const info = eb.getTodayReview(record.learn_date, JSON.parse(record.completed_rounds || '[]'));
  if (!info.needReview) return res.json({ code: 1, msg: '今天该内容无需复习或已完成' });

  // 记录完成轮次
  const completed = JSON.parse(record.completed_rounds || '[]');
  completed.push(info.round);
  const finished = completed.length >= info.totalRounds ? 1 : 0;
  db.prepare('UPDATE learn_records SET completed_rounds=?, finished=? WHERE id=?')
    .run(JSON.stringify(completed), finished, record.id);

  // 打卡
  db.prepare('INSERT INTO checkins(user_id,content_id,type,round,read_count,checkin_date) VALUES(?,?,?,?,?,?)')
    .run(req.user.id, record.content_id, 'review', info.round, read_count || 3, eb.todayStr());

  res.json({ code: 0, data: { round: info.round, finished, total_rounds: info.totalRounds } });
});

/**
 * 获取已学内容列表(含复习进度)
 */
app.get('/api/learn/list', auth, (req, res) => {
  const records = db.prepare(`
    SELECT lr.*, c.subject_code, c.unit, c.title
    FROM learn_records lr
    JOIN contents c ON lr.content_id = c.id
    WHERE lr.user_id=?
    ORDER BY lr.learn_date DESC
  `).all(req.user.id);
  const list = records.map(r => {
    const completed = JSON.parse(r.completed_rounds || '[]');
    const plan = eb.buildReviewPlan(r.learn_date);
    return {
      ...r,
      completed_rounds: completed,
      total_rounds: plan.length,
      next_review: plan.find(p => !completed.includes(p.round))?.date || null,
    };
  });
  res.json({ code: 0, data: list });
});

// ============================================================
// 4. 统计
// ============================================================

/**
 * 学习统计
 */
app.get('/api/stats', auth, (req, res) => {
  const userId = req.user.id;
  const totalLearned = db.prepare('SELECT COUNT(*) as n FROM learn_records WHERE user_id=?').get(userId).n;
  const totalFinished = db.prepare('SELECT COUNT(*) as n FROM learn_records WHERE user_id=? AND finished=1').get(userId).n;
  const todayReviewDone = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE user_id=? AND type='review' AND checkin_date=?`)
    .get(userId, eb.todayStr()).n;
  const todayLearn = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE user_id=? AND type='learn' AND checkin_date=?`)
    .get(userId, eb.todayStr()).n;

  // 连续打卡天数
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = eb.toDateStr(d);
    const has = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE user_id=? AND checkin_date=?`).get(userId, ds).n;
    if (has > 0) streak++;
    else break;
  }

  // 最近 7 天打卡
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = eb.toDateStr(d);
    const n = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE user_id=? AND checkin_date=?`).get(userId, ds).n;
    last7.push({ date: ds, count: n });
  }

  res.json({
    code: 0,
    data: {
      total_learned: totalLearned,
      total_finished: totalFinished,
      today_review_done: todayReviewDone,
      today_learn: todayLearn,
      streak,
      last_7_days: last7,
    },
  });
});

// ============================================================
// 5. 管理后台 API(内容管理 CRUD)
// ============================================================

/**
 * 新增内容
 */
app.post('/api/admin/contents', (req, res) => {
  const { subject_code, semester, unit, title, body, tip } = req.body;
  if (!subject_code || !semester || !title || !body) {
    return res.json({ code: 1, msg: '缺少必填字段' });
  }
  const maxSort = db.prepare('SELECT COALESCE(MAX(sort),0) as m FROM contents').get().m;
  const info = db.prepare(`INSERT INTO contents(subject_code,semester,unit,title,body,tip,sort) VALUES(?,?,?,?,?,?,?)`)
    .run(subject_code, semester, unit || '', title, body, tip || '', maxSort + 1);
  res.json({ code: 0, data: { id: info.lastInsertRowid } });
});

/**
 * 更新内容
 */
app.put('/api/admin/contents/:id', (req, res) => {
  const { subject_code, semester, unit, title, body, tip } = req.body;
  db.prepare(`UPDATE contents SET subject_code=?,semester=?,unit=?,title=?,body=?,tip=? WHERE id=?`)
    .run(subject_code, semester, unit || '', title, body, tip || '', req.params.id);
  res.json({ code: 0 });
});

/**
 * 删除内容
 */
app.delete('/api/admin/contents/:id', (req, res) => {
  db.prepare('DELETE FROM contents WHERE id=?').run(req.params.id);
  res.json({ code: 0 });
});

/**
 * 批量导入内容(JSON 数组)
 */
app.post('/api/admin/contents/batch', (req, res) => {
  const list = req.body.contents;
  if (!Array.isArray(list)) return res.json({ code: 1, msg: '需要 contents 数组' });
  const stmt = db.prepare(`INSERT INTO contents(subject_code,semester,unit,title,body,tip,sort) VALUES(?,?,?,?,?,?,?)`);
  let maxSort = db.prepare('SELECT COALESCE(MAX(sort),0) as m FROM contents').get().m;
  const tx = db.transaction((items) => {
    for (const c of items) {
      if (!c.subject_code || !c.semester || !c.title || !c.body) continue;
      stmt.run(c.subject_code, c.semester, c.unit || '', c.title, c.body, c.tip || '', ++maxSort);
    }
  });
  tx(list);
  res.json({ code: 0, msg: `批量导入完成,共 ${list.length} 条` });
});

// ============================================================
// 静态资源:管理后台页面
// ============================================================
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// 健康检查
app.get('/api/health', (req, res) => res.json({ code: 0, msg: 'ok', time: new Date().toISOString() }));

// 启动
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🎓 背诵打卡后端已启动`);
  console.log(`  📡 API:    http://localhost:${PORT}/api`);
  console.log(`  🛠  管理后台:http://localhost:${PORT}/admin\n`);
});
