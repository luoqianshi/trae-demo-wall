import db from '../config/database';

// 数据库表初始化 - 创建所有核心表
export function initDatabase(): void {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      real_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','teacher','institution_admin','platform_admin')),
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      institution_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 机构表
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('steam','research','art','independent','school')),
      contact_name TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      description TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','disabled')),
      subscription_type TEXT DEFAULT 'free' CHECK(subscription_type IN ('free','personal','studio','institution')),
      subscription_expire DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 系统通知表
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      type TEXT DEFAULT 'system' CHECK(type IN ('system','task','submission')),
      related_type TEXT DEFAULT '',
      related_id INTEGER DEFAULT 0,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 公开任务表
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'other' CHECK(category IN ('science','nature','creative','programming','humanities','life','other','math','chinese','english','history','geography','politics','physics','chemistry','biology','computer','ai')),
      difficulty TEXT DEFAULT 'beginner' CHECK(difficulty IN ('beginner','intermediate','advanced')),
      requirements TEXT DEFAULT '',
      reference_materials TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      grade_level TEXT DEFAULT '',
      estimated_time TEXT DEFAULT '',
      steps_json TEXT DEFAULT '',       -- 结构化步骤教程 JSON格式
      ai_video_url TEXT DEFAULT '',     -- AI生成教程视频URL（后期补）
      external_video_url TEXT DEFAULT '', -- 外部参考视频链接（B站/YouTube）
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived')),
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 学习进度追踪表
    CREATE TABLE IF NOT EXISTS task_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      current_step INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0 CHECK(completed IN (0, 1)),
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      UNIQUE(user_id, task_id)
    );

    -- 作品提交表
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT DEFAULT '',
      file_urls TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('draft','submitted','evaluated')),
      score REAL,
      feedback TEXT DEFAULT '',
      evaluator_id INTEGER,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      evaluated_at DATETIME,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (evaluator_id) REFERENCES users(id)
    );

    -- 项目收藏表
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      UNIQUE(user_id, task_id)
    );

    -- 项目评分表
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      UNIQUE(user_id, task_id)
    );

    -- 项目评论表
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );
  `);

  // 创建索引 - 优化查询性能
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(difficulty)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)',
    'CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON task_progress(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON task_progress(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
    'CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_favorites_task_id ON favorites(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_ratings_task_id ON ratings(task_id)',
    'CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id)',
  ];
  for (const sql of indexes) {
    try { db.exec(sql); } catch { /* 索引已存在 */ }
  }

  // 兼容已有数据库：添加新字段
  try { db.exec(`ALTER TABLE tasks ADD COLUMN grade_level TEXT DEFAULT ''`); } catch { /* 字段已存在 */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN estimated_time TEXT DEFAULT ''`); } catch { /* 字段已存在 */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN steps_json TEXT DEFAULT ''`); } catch { /* 字段已存在 */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN ai_video_url TEXT DEFAULT ''`); } catch { /* 字段已存在 */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN external_video_url TEXT DEFAULT ''`); } catch { /* 字段已存在 */ }
  try { db.exec(`ALTER TABLE notifications ADD COLUMN related_type TEXT DEFAULT ''`); } catch { /* 字段已存在 */ }
  try { db.exec(`ALTER TABLE notifications ADD COLUMN related_id INTEGER DEFAULT 0`); } catch { /* 字段已存在 */ }

  // 迁移：更新已有数据库的category约束（支持新学科分类）
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get() as any;
    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes("'math'")) {
      console.log('[DB] 迁移category约束以支持新学科分类...');
      db.exec(`
        CREATE TABLE tasks_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          category TEXT DEFAULT 'other' CHECK(category IN ('science','nature','creative','programming','humanities','life','other','math','chinese','english','history','geography','politics','physics','chemistry','biology','computer','ai')),
          difficulty TEXT DEFAULT 'beginner' CHECK(difficulty IN ('beginner','intermediate','advanced')),
          requirements TEXT DEFAULT '',
          reference_materials TEXT DEFAULT '',
          cover_image TEXT DEFAULT '',
          grade_level TEXT DEFAULT '',
          estimated_time TEXT DEFAULT '',
          steps_json TEXT DEFAULT '',
          ai_video_url TEXT DEFAULT '',
          external_video_url TEXT DEFAULT '',
          status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived')),
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        );
        INSERT INTO tasks_new SELECT * FROM tasks;
        DROP TABLE tasks;
        ALTER TABLE tasks_new RENAME TO tasks;
      `);
      console.log('[DB] category约束迁移完成');
    }
  } catch (e: any) { console.log('[DB] 迁移跳过:', e.message); }

  console.log('[DB] 数据库表初始化完成');
}

// 初始化默认数据
export function seedDefaultData(): void {
  // 检查是否已有数据
  const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('platform_admin') as { cnt: number };
  if (adminCount.cnt > 0) {
    console.log('[DB] 默认数据已存在，跳过种子数据');
    return;
  }

  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);

  // 创建平台管理员
  db.prepare(`INSERT INTO users (username, password_hash, real_name, role, phone, email) 
    VALUES (?, ?, ?, ?, ?, ?)`).run('admin', adminPassword, '平台管理员', 'platform_admin', '13800000000', 'admin@pbl.cn');

  // 创建默认机构
  db.prepare(`INSERT INTO institutions (name, type, contact_name, contact_phone, description, status, subscription_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    '示例STEAM机构', 'steam', '张老师', '13900000001', '示例STEAM科创教育机构', 'approved', 'personal'
  );

  // 创建示例教师账号
  const teacherPassword = bcrypt.hashSync('teacher123', 10);
  db.prepare(`INSERT INTO users (username, password_hash, real_name, role, phone, institution_id)
    VALUES (?, ?, ?, ?, ?, ?)`).run('teacher', teacherPassword, '张老师', 'teacher', '13900000001', 1);

  // 创建示例学生账号
  const studentPassword = bcrypt.hashSync('student123', 10);
  db.prepare(`INSERT INTO users (username, password_hash, real_name, role, phone, institution_id)
    VALUES (?, ?, ?, ?, ?, ?)`).run('student', studentPassword, '小明', 'student', '13900000002', 1);

  console.log('[DB] 默认数据初始化完成');
  console.log('  - 管理员: admin / admin123');
  console.log('  - 教师: teacher / teacher123');
  console.log('  - 学生: student / student123');
}

// 初始化K-12项目任务种子数据（从JSON文件读取）
export function seedTaskData(): void {
  const taskCount = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get() as { cnt: number };
  if (taskCount.cnt > 0) {
    console.log('[DB] 任务数据已存在，跳过种子任务');
    return;
  }

  const fs = require('fs');
  const path = require('path');
  
  // 尝试多个路径查找 tasks_v3.json（兼容开发和生产环境）
  const possiblePaths = [
    path.join(__dirname, '..', 'data', 'tasks_v3.json'),       // dist/data/
    path.join(__dirname, '..', '..', 'src', 'data', 'tasks_v3.json'), // src/data/
  ];
  
  let dataPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      dataPath = p;
      break;
    }
  }
  
  if (!dataPath) {
    console.error('[DB] 找不到 tasks_v3.json 文件');
    return;
  }
  const tasks = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const insertTask = db.prepare(
    `INSERT INTO tasks (title, description, category, difficulty, requirements, reference_materials, grade_level, estimated_time, steps_json, ai_video_url, external_video_url, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', NULL)`
  );

  const insertMany = db.transaction(() => {
    for (const t of tasks) {
      insertTask.run(
        t.title, t.description, t.category, t.difficulty,
        t.requirements, t.reference_materials, t.grade_level, t.estimated_time,
        JSON.stringify(t.steps || []), t.ai_video_url || '', t.external_video_url || ''
      );
    }
  });

  insertMany();
  console.log(`[DB] 已插入 ${tasks.length} 个K-12项目任务`);
}

// 执行初始化
if (require.main === module) {
  initDatabase();
  seedDefaultData();
  seedTaskData();
  console.log('数据库初始化完成!');
}