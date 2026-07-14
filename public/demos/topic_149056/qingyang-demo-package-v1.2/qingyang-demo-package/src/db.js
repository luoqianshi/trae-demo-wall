/**
 * 数据库封装 - 使用 sql.js (纯JS实现，无需编译)
 * 
 * 兼容 better-sqlite3 的常用 API：
 * - db.pragma(sql)
 * - db.exec(sql)
 * - db.prepare(sql) -> statement
 *   - statement.get(...params)
 *   - statement.all(...params)
 *   - statement.run(...params)
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'qingyang.db');

// 确保 data 目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Statement 类 - 兼容 better-sqlite3 的 Statement API
class Statement {
  constructor(db, sql) {
    this._db = db;
    this._sql = sql;
  }

  get(...params) {
    const stmt = this._db._sqlDb.prepare(this._sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    let result = undefined;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  }

  all(...params) {
    const stmt = this._db._sqlDb.prepare(this._sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  run(...params) {
    const stmt = this._db._sqlDb.prepare(this._sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    stmt.step();
    stmt.free();
    
    // 模拟 better-sqlite3 的返回值
    const lastIdResult = this._db._sqlDb.exec('SELECT last_insert_rowid() as id');
    const changesResult = this._db._sqlDb.exec('SELECT changes() as cnt');
    
    return {
      lastInsertRowid: lastIdResult[0].values[0][0],
      changes: changesResult[0].values[0][0]
    };
  }
}

// Database 类 - 兼容 better-sqlite3 的 Database API
class DatabaseWrapper {
  constructor() {
    this._sqlDb = null;
    this._initPromise = null;
    this._autoSaveTimer = null;
  }

  // 异步初始化
  async init() {
    if (this._sqlDb) return this;
    if (this._initPromise) return this._initPromise;
    
    this._initPromise = this._doInit();
    return this._initPromise;
  }

  async _doInit() {
    const SQL = await initSqlJs();
    
    if (fs.existsSync(DB_PATH)) {
      // 从文件加载数据库
      const fileBuffer = fs.readFileSync(DB_PATH);
      this._sqlDb = new SQL.Database(fileBuffer);
    } else {
      // 创建新数据库
      this._sqlDb = new SQL.Database();
    }
    
    // 启动自动保存（每30秒）
    this._startAutoSave();
    
    return this;
  }

  // 保存数据库到文件
  save() {
    if (!this._sqlDb) return;
    try {
      const data = this._sqlDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (e) {
      console.error('[DB] 保存失败:', e.message);
    }
  }

  _startAutoSave() {
    if (this._autoSaveTimer) return;
    this._autoSaveTimer = setInterval(() => {
      this.save();
    }, 30000);
    
    // 进程退出时保存
    const saveOnExit = () => {
      this.save();
      process.exit();
    };
    process.on('SIGINT', saveOnExit);
    process.on('SIGTERM', saveOnExit);
  }

  pragma(sql) {
    // 解析 pragma 语句：name = value 或 name 或 function(args)
    const setMatch = sql.match(/^(\w+)\s*=\s*(.+)$/);
    if (setMatch) {
      // 设置 pragma
      this._sqlDb.run(`PRAGMA ${setMatch[1]} = ${setMatch[2]}`);
      return;
    }
    
    const funcMatch = sql.match(/^(\w+)\((.+)\)$/);
    if (funcMatch) {
      // pragma 函数形式如 index_list(table)
      const result = this._sqlDb.exec(`PRAGMA ${funcMatch[1]}(${funcMatch[2]})`);
      if (result.length > 0) {
        const columns = result[0].columns;
        return result[0].values.map(row => {
          const obj = {};
          columns.forEach((col, i) => obj[col] = row[i]);
          return obj;
        });
      }
      return [];
    }
    
    // 简单 pragma 查询
    const result = this._sqlDb.exec(`PRAGMA ${sql}`);
    if (result.length > 0) {
      return result[0].values[0][0];
    }
    return undefined;
  }

  exec(sql) {
    this._sqlDb.exec(sql);
  }

  prepare(sql) {
    return new Statement(this, sql);
  }

  function(name, options, func) {
    // sql.js 不支持自定义函数，空实现
  }
  transaction(fn) {
    // sql.js 不支持原生事务，用 BEGIN/COMMIT 模拟
    return (...args) => {
      this._sqlDb.run('BEGIN');
      try {
        const result = fn(...args);
        this._sqlDb.run('COMMIT');
        return result;
      } catch (e) {
        this._sqlDb.run('ROLLBACK');
        throw e;
      }
    };
  }
}

// 创建数据库实例
const db = new DatabaseWrapper();

// 初始化并执行建表和数据填充
async function initDatabase() {
  await db.init();
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  // 迁移：为 recipes 表的 name 字段添加 UNIQUE 约束（如果尚未有）
  try {
    const tableInfo = db.pragma('index_list(recipes)');
    const hasNameIndex = tableInfo.some(idx => idx.name === 'sqlite_autoindex_recipes_1' || idx.name === 'idx_recipes_name');
    if (!hasNameIndex) {
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name)');
      console.log('[DB] 已为 recipes.name 添加唯一索引');
    }
  } catch (e) {
    // 忽略，可能表还不存在
  }
  
  // 创建所有表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      login_name TEXT UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      height REAL,
      weight REAL,
      age INTEGER,
      gender TEXT,
      occupation TEXT,
      diet_habits TEXT,
      sleep_habits TEXT,
      exercise_habits TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      metric_type TEXT,
      value TEXT,
      record_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS diseases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      disease_name TEXT,
      diagnosed_at TEXT,
      medications TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      plan_date TEXT,
      plan_month TEXT,
      status TEXT DEFAULT 'draft',
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, plan_date)
    );

    CREATE TABLE IF NOT EXISTS plan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES daily_plans(id),
      item_type TEXT,
      item_id INTEGER,
      item_name TEXT,
      category TEXT,
      content TEXT,
      time_slot TEXT,
      is_custom INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      completed_at DATETIME,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medical_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      report_type TEXT,
      report_date TEXT,
      file_name TEXT,
      file_data BLOB,
      parsed_data TEXT,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      category TEXT,
      target_conditions TEXT,
      ingredients TEXT,
      steps TEXT,
      nutrition TEXT,
      cook_time INTEGER,
      difficulty TEXT,
      season TEXT,
      image_url TEXT,
      description TEXT,
      benefits TEXT,
      tips TEXT,
      suitable_for TEXT,
      not_suitable TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      category TEXT,
      target_conditions TEXT,
      difficulty TEXT,
      duration INTEGER,
      calories INTEGER,
      calories_per_hour INTEGER,
      equipment TEXT,
      muscle_groups TEXT,
      steps TEXT,
      benefits TEXT,
      tips TEXT,
      common_mistakes TEXT,
      variations TEXT,
      image_url TEXT,
      video_url TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tracking_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      plan_item_id INTEGER REFERENCES plan_items(id),
      track_date DATE,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, plan_item_id, track_date)
    );
    CREATE TABLE IF NOT EXISTS community_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      nickname TEXT,
      avatar_seed TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      profile_id INTEGER REFERENCES community_profiles(id),
      title TEXT,
      content TEXT,
      category TEXT,
      likes INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES posts(id),
      user_id INTEGER REFERENCES users(id),
      profile_id INTEGER REFERENCES community_profiles(id),
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS point_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      points INTEGER,
      event_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      achievement_type TEXT,
      title TEXT,
      description TEXT,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('[DB] 数据表初始化完成');
  
  // 初始化知识库数据
  initKnowledgeBase();

  // 初始化演示账号
  initDemoUser();
  
  console.log(`[DB] 数据库初始化完成: ${DB_PATH}`);
  
  // 初始保存
  db.save();
  
  return db;
}

// ========== 知识库数据初始化 ==========

function initKnowledgeBase() {
  // 检查是否已有数据
  const recipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
  const exerciseCount = db.prepare('SELECT COUNT(*) as count FROM exercises').get().count;

  // 如果已有足够数据，跳过初始化
  if (recipeCount >= 100 && exerciseCount >= 40) {
    console.log('[DB] 知识库数据已存在，跳过初始化');
    return;
  }

  console.log(`[DB] 当前食谱数: ${recipeCount}, 运动数: ${exerciseCount}`);

  // ----- 食谱数据（105道） -----
  const recipes = [
    // 降压食谱 - 早餐
    { name: '芹菜瘦肉粥', category: 'breakfast', target_conditions: JSON.stringify(['hypertension', 'general']),
      ingredients: JSON.stringify([{name:'芹菜',amount:100,unit:'g'},{name:'瘦猪肉',amount:50,unit:'g'},{name:'大米',amount:80,unit:'g'},{name:'盐',amount:1,unit:'g'}]),
      steps: JSON.stringify(['大米淘洗干净，加水煮粥','瘦猪肉切丝，芹菜切小丁','粥将熟时加入肉丝和芹菜丁','小火煮10分钟，加盐调味即可']),
      nutrition: JSON.stringify({calories:280,protein:18,carbs:35,fat:8,sodium:320}),
      cook_time: 30, difficulty: 'easy', season: 'all', image_url: '',
      description: '经典降压养生粥，芹菜富含钾元素，有助于降低血压。',
      benefits: JSON.stringify(['清热平肝','利尿降压','补充优质蛋白']),
      tips: JSON.stringify(['芹菜叶不要丢弃，营养更丰富','脾胃虚寒者不宜多食']),
      suitable_for: JSON.stringify(['高血压患者','肝火旺盛者']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降压','早餐','清淡'])
    },
    { name: '燕麦香蕉粥', category: 'breakfast', target_conditions: JSON.stringify(['hypertension', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'燕麦片',amount:60,unit:'g'},{name:'香蕉',amount:100,unit:'g'},{name:'牛奶',amount:200,unit:'ml'},{name:'蜂蜜',amount:10,unit:'g'}]),
      steps: JSON.stringify(['燕麦片加牛奶小火煮5分钟','香蕉切片备用','粥煮好后加入香蕉片','淋上蜂蜜即可']),
      nutrition: JSON.stringify({calories:320,protein:10,carbs:55,fat:6,sodium:80}),
      cook_time: 10, difficulty: 'easy', season: 'all', image_url: '',
      description: '营养丰富的降压早餐，燕麦富含膳食纤维，香蕉含钾丰富。',
      benefits: JSON.stringify(['降低胆固醇','调节血压','润肠通便']),
      tips: JSON.stringify(['选择无糖燕麦片效果更好','香蕉熟透后食用更佳']),
      suitable_for: JSON.stringify(['高血压患者','便秘人群']),
      not_suitable: JSON.stringify(['糖尿病患者（需减少蜂蜜）']),
      tags: JSON.stringify(['降压','早餐','高纤维'])
    },
    { name: '凉拌黄瓜木耳', category: 'breakfast', target_conditions: JSON.stringify(['hypertension', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'黄瓜',amount:200,unit:'g'},{name:'黑木耳',amount:30,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'醋',amount:15,unit:'ml'},{name:'香油',amount:3,unit:'ml'}]),
      steps: JSON.stringify(['黑木耳泡发后焯水2分钟','黄瓜拍碎切块','蒜切末，加醋、香油调成料汁','所有食材拌匀即可']),
      nutrition: JSON.stringify({calories:85,protein:3,carbs:12,fat:3,sodium:120}),
      cook_time: 15, difficulty: 'easy', season: 'summer', image_url: '',
      description: '清爽开胃的凉拌菜，木耳有"血管清道夫"之称。',
      benefits: JSON.stringify(['清热凉血','软化血管','降低血脂']),
      tips: JSON.stringify(['木耳需充分泡发后再食用','现拌现吃，口感最佳']),
      suitable_for: JSON.stringify(['高血压患者','高血脂患者']),
      not_suitable: JSON.stringify(['脾胃虚寒腹泻者']),
      tags: JSON.stringify(['降压','凉拌','低脂'])
    },
    // 降压食谱 - 午餐
    { name: '芹菜炒香干', category: 'lunch', target_conditions: JSON.stringify(['hypertension', 'general']),
      ingredients: JSON.stringify([{name:'芹菜',amount:200,unit:'g'},{name:'香干',amount:100,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'食用油',amount:5,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['芹菜洗净切段，香干切条，蒜切末备用','锅中热油，爆香蒜末','加入香干翻炒1分钟','加入芹菜段，大火快炒2分钟','加少许盐调味，翻炒均匀即可出锅']),
      nutrition: JSON.stringify({calories:180,protein:12,carbs:15,fat:8,sodium:280}),
      cook_time: 15, difficulty: 'easy', season: 'all', image_url: '',
      description: '经典家常菜，芹菜含丰富的钾和膳食纤维，有助于降压。',
      benefits: JSON.stringify(['平肝清热','祛风利湿','降血压']),
      tips: JSON.stringify(['芹菜要大火快炒，保持脆嫩','少盐更健康']),
      suitable_for: JSON.stringify(['高血压患者','肝火旺盛者']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降压','午餐','家常'])
    },
    { name: '凉拌木耳西芹', category: 'lunch', target_conditions: JSON.stringify(['hypertension', 'hyperlipidemia', 'general']),
      ingredients: JSON.stringify([{name:'木耳',amount:50,unit:'g'},{name:'西芹',amount:150,unit:'g'},{name:'醋',amount:10,unit:'ml'},{name:'生抽',amount:5,unit:'ml'},{name:'香油',amount:3,unit:'ml'},{name:'蒜',amount:10,unit:'g'}]),
      steps: JSON.stringify(['木耳提前泡发，撕成小朵','西芹洗净切斜片','分别焯水后过凉水沥干','蒜切末，加醋、生抽、香油调成料汁','所有食材拌匀即可']),
      nutrition: JSON.stringify({calories:95,protein:4,carbs:14,fat:3,sodium:200}),
      cook_time: 20, difficulty: 'easy', season: 'all', image_url: '',
      description: '清爽可口的降压降脂凉菜，木耳被誉为"血管清道夫"。',
      benefits: JSON.stringify(['清热凉血','软化血管','降低血脂血压']),
      tips: JSON.stringify(['木耳要充分泡发，焯水时间不宜过长','现拌现吃口感最好']),
      suitable_for: JSON.stringify(['高血压患者','高血脂患者']),
      not_suitable: JSON.stringify(['脾胃虚寒腹泻者']),
      tags: JSON.stringify(['降压','降脂','凉拌'])
    },
    { name: '菠菜拌粉丝', category: 'lunch', target_conditions: JSON.stringify(['hypertension', 'general']),
      ingredients: JSON.stringify([{name:'菠菜',amount:200,unit:'g'},{name:'粉丝',amount:50,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'醋',amount:10,unit:'ml'},{name:'生抽',amount:5,unit:'ml'}]),
      steps: JSON.stringify(['菠菜洗净焯水后过凉水，挤干切段','粉丝泡软后焯水过凉','蒜切末，加醋、生抽调成料汁','所有食材拌匀即可']),
      nutrition: JSON.stringify({calories:180,protein:6,carbs:35,fat:2,sodium:250}),
      cook_time: 15, difficulty: 'easy', season: 'all', image_url: '',
      description: '菠菜富含镁和钾，有助于血管舒张，降低血压。',
      benefits: JSON.stringify(['养血止血','润燥滑肠','降压利尿']),
      tips: JSON.stringify(['菠菜先焯水可去除草酸','粉丝不要泡太久，以免太软']),
      suitable_for: JSON.stringify(['高血压患者','便秘人群']),
      not_suitable: JSON.stringify(['肾结石患者']),
      tags: JSON.stringify(['降压','凉拌','高钾'])
    },
    { name: '清蒸鲈鱼', category: 'lunch', target_conditions: JSON.stringify(['hypertension', 'diabetes', 'general']),
      ingredients: JSON.stringify([{name:'鲈鱼',amount:200,unit:'g'},{name:'葱',amount:20,unit:'g'},{name:'姜',amount:10,unit:'g'},{name:'蒸鱼豉油',amount:10,unit:'ml'},{name:'料酒',amount:5,unit:'ml'}]),
      steps: JSON.stringify(['鲈鱼处理干净，两面划几刀','鱼身抹料酒，放上葱姜','水开后上锅蒸8-10分钟','倒掉蒸出的水，淋上蒸鱼豉油','浇上热油激出香味即可']),
      nutrition: JSON.stringify({calories:220,protein:35,carbs:2,fat:8,sodium:350}),
      cook_time: 20, difficulty: 'easy', season: 'all', image_url: '',
      description: '高蛋白低脂肪的健康选择，清蒸最大程度保留营养。',
      benefits: JSON.stringify(['健脾益气','补肝肾','优质蛋白补充']),
      tips: JSON.stringify(['鱼眼凸出表示新鲜','蒸制时间根据鱼大小调整']),
      suitable_for: JSON.stringify(['高血压患者','糖尿病患者']),
      not_suitable: JSON.stringify(['痛风患者']),
      tags: JSON.stringify(['降压','高蛋白','清蒸'])
    },
    { name: '番茄炒蛋', category: 'lunch', target_conditions: JSON.stringify(['hypertension', 'general']),
      ingredients: JSON.stringify([{name:'番茄',amount:200,unit:'g'},{name:'鸡蛋',amount:100,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'食用油',amount:8,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['番茄切块，鸡蛋打散加少许盐','热油炒散蛋液盛出','锅中加油炒番茄至出汁','加入鸡蛋翻炒均匀','加盐调味，撒葱花出锅']),
      nutrition: JSON.stringify({calories:200,protein:14,carbs:12,fat:12,sodium:300}),
      cook_time: 10, difficulty: 'easy', season: 'all', image_url: '',
      description: '国民家常菜，番茄富含番茄红素和维生素C，有助血管健康。',
      benefits: JSON.stringify(['生津止渴','健胃消食','保护心血管']),
      tips: JSON.stringify(['番茄要炒出汁才好吃','鸡蛋要炒嫩一些']),
      suitable_for: JSON.stringify(['高血压患者','一般人群']),
      not_suitable: JSON.stringify(['胃酸过多者']),
      tags: JSON.stringify(['降压','家常','简单'])
    },
    { name: '海带豆腐汤', category: 'lunch', target_conditions: JSON.stringify(['hypertension', 'hyperlipidemia', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'海带',amount:100,unit:'g'},{name:'嫩豆腐',amount:200,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['海带泡发洗净切丝','豆腐切小块','锅中加水烧开，放入海带丝煮5分钟','加入豆腐块煮3分钟','加盐调味，撒葱花即可']),
      nutrition: JSON.stringify({calories:120,protein:10,carbs:8,fat:5,sodium:280}),
      cook_time: 15, difficulty: 'easy', season: 'all', image_url: '',
      description: '清淡鲜美的汤品，海带含丰富的褐藻酸钾，有降压作用。',
      benefits: JSON.stringify(['清热利水','软坚散结','降脂降压']),
      tips: JSON.stringify(['海带要充分泡洗去盐分','豆腐后放，保持嫩滑']),
      suitable_for: JSON.stringify(['高血压患者','高血脂患者']),
      not_suitable: JSON.stringify(['甲状腺功能亢进者']),
      tags: JSON.stringify(['降压','降脂','汤品'])
    },
    // 降压食谱 - 晚餐
    { name: '南瓜小米粥', category: 'dinner', target_conditions: JSON.stringify(['hypertension', 'diabetes', 'general']),
      ingredients: JSON.stringify([{name:'南瓜',amount:150,unit:'g'},{name:'小米',amount:80,unit:'g'},{name:'枸杞',amount:5,unit:'g'}]),
      steps: JSON.stringify(['南瓜去皮切块','小米淘洗干净','锅中加水烧开，加入小米煮20分钟','加入南瓜块煮15分钟至软烂','撒上枸杞即可']),
      nutrition: JSON.stringify({calories:280,protein:8,carbs:55,fat:2,sodium:10}),
      cook_time: 40, difficulty: 'easy', season: 'autumn', image_url: '',
      description: '养胃安神的晚餐粥品，南瓜含丰富的钴元素，有助降糖。',
      benefits: JSON.stringify(['健脾和胃','养心安神','降糖降压']),
      tips: JSON.stringify(['南瓜要煮软烂，口感更好','小米先泡30分钟更易煮烂']),
      suitable_for: JSON.stringify(['高血压患者','糖尿病患者']),
      not_suitable: JSON.stringify(['胃热者不宜多食']),
      tags: JSON.stringify(['降压','降糖','粥品'])
    },
    { name: '蒸茄子', category: 'dinner', target_conditions: JSON.stringify(['hypertension', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'茄子',amount:250,unit:'g'},{name:'蒜',amount:15,unit:'g'},{name:'生抽',amount:10,unit:'ml'},{name:'醋',amount:5,unit:'ml'},{name:'香油',amount:3,unit:'ml'}]),
      steps: JSON.stringify(['茄子洗净切条，上锅蒸15分钟','蒜捣成蒜泥','加生抽、醋、香油调成料汁','蒸好的茄子蘸料汁食用']),
      nutrition: JSON.stringify({calories:90,protein:3,carbs:15,fat:4,sodium:300}),
      cook_time: 20, difficulty: 'easy', season: 'summer', image_url: '',
      description: '低热量高纤维的健康菜品，茄子含丰富的维生素P，保护血管。',
      benefits: JSON.stringify(['清热活血','消肿止痛','保护血管']),
      tips: JSON.stringify(['茄子不要去皮，皮中维生素P含量最高','蒸制时间根据茄子大小调整']),
      suitable_for: JSON.stringify(['高血压患者','减肥人群']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降压','低卡','蒸菜'])
    },
    { name: '茼蒿炒鸡蛋', category: 'dinner', target_conditions: JSON.stringify(['hypertension', 'general']),
      ingredients: JSON.stringify([{name:'茼蒿',amount:200,unit:'g'},{name:'鸡蛋',amount:100,unit:'g'},{name:'食用油',amount:8,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['茼蒿洗净切段','鸡蛋打散','热油炒散蛋液盛出','锅中加油炒茼蒿至断生','加入鸡蛋翻炒均匀','加盐调味出锅']),
      nutrition: JSON.stringify({calories:190,protein:14,carbs:8,fat:12,sodium:280}),
      cook_time: 10, difficulty: 'easy', season: 'spring', image_url: '',
      description: '清香可口的家常菜，茼蒿含挥发油，有开胃健脾、降压补脑作用。',
      benefits: JSON.stringify(['和脾胃','利二便','降压补脑']),
      tips: JSON.stringify(['茼蒿要大火快炒，保持鲜嫩','茼蒿性微寒，脾胃虚寒者少食']),
      suitable_for: JSON.stringify(['高血压患者','心悸失眠者']),
      not_suitable: JSON.stringify(['胃虚泄泻者']),
      tags: JSON.stringify(['降压','晚餐','时令'])
    },
    // 降压食谱 - 加餐
    { name: '香蕉酸奶杯', category: 'snack', target_conditions: JSON.stringify(['hypertension', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'香蕉',amount:100,unit:'g'},{name:'无糖酸奶',amount:150,unit:'g'},{name:'燕麦片',amount:20,unit:'g'},{name:'蜂蜜',amount:5,unit:'g'}]),
      steps: JSON.stringify(['香蕉切片','杯中铺一层酸奶','撒上燕麦片','铺香蕉片','重复叠加，最后淋蜂蜜']),
      nutrition: JSON.stringify({calories:200,protein:8,carbs:35,fat:3,sodium:60}),
      cook_time: 5, difficulty: 'easy', season: 'all', image_url: '',
      description: '美味健康的下午茶，香蕉富含钾，酸奶有益肠道健康。',
      benefits: JSON.stringify(['补充钾元素','调节血压','润肠通便']),
      tips: JSON.stringify(['选择无糖酸奶更健康','燕麦片选即食的更方便']),
      suitable_for: JSON.stringify(['高血压患者','便秘人群']),
      not_suitable: JSON.stringify(['糖尿病患者（不加蜂蜜）']),
      tags: JSON.stringify(['降压','加餐','简单'])
    },
    { name: '菊花茶', category: 'snack', target_conditions: JSON.stringify(['hypertension', 'general']),
      ingredients: JSON.stringify([{name:'干菊花',amount:5,unit:'g'},{name:'枸杞',amount:5,unit:'g'},{name:'冰糖',amount:10,unit:'g'}]),
      steps: JSON.stringify(['菊花和枸杞放入杯中','加入沸水冲泡','加冰糖调味','焖5分钟即可饮用']),
      nutrition: JSON.stringify({calories:40,protein:0,carbs:10,fat:0,sodium:5}),
      cook_time: 5, difficulty: 'easy', season: 'all', image_url: '',
      description: '经典养生茶饮，菊花有平肝明目、清热解毒之效。',
      benefits: JSON.stringify(['平肝明目','清热解毒','降血压']),
      tips: JSON.stringify(['选择杭白菊或贡菊为佳','体质虚寒者不宜长期饮用']),
      suitable_for: JSON.stringify(['高血压患者','肝火旺盛者']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降压','茶饮','养生'])
    },
    { name: '苹果汁', category: 'snack', target_conditions: JSON.stringify(['hypertension', 'general']),
      ingredients: JSON.stringify([{name:'苹果',amount:200,unit:'g'},{name:'胡萝卜',amount:50,unit:'g'}]),
      steps: JSON.stringify(['苹果去皮去核切块','胡萝卜去皮切块','放入榨汁机榨汁','倒出即可饮用']),
      nutrition: JSON.stringify({calories:120,protein:1,carbs:28,fat:0,sodium:15}),
      cook_time: 5, difficulty: 'easy', season: 'all', image_url: '',
      description: '新鲜果蔬汁，苹果含钾丰富，有助排钠降压。',
      benefits: JSON.stringify(['生津止渴','健脾益胃','补充钾元素']),
      tips: JSON.stringify(['现榨现喝，营养不流失','连果肉一起喝更健康']),
      suitable_for: JSON.stringify(['高血压患者','一般人群']),
      not_suitable: JSON.stringify(['糖尿病患者（限量）']),
      tags: JSON.stringify(['降压','果汁','高钾'])
    },

    // 降糖食谱 - 早餐
    { name: '杂粮粥', category: 'breakfast', target_conditions: JSON.stringify(['diabetes', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'燕麦',amount:30,unit:'g'},{name:'糙米',amount:20,unit:'g'},{name:'小米',amount:20,unit:'g'},{name:'红豆',amount:20,unit:'g'},{name:'绿豆',amount:10,unit:'g'}]),
      steps: JSON.stringify(['所有杂粮提前浸泡2小时','锅中加水烧开','加入所有杂粮','小火煮40分钟至软烂','即可食用']),
      nutrition: JSON.stringify({calories:280,protein:10,carbs:55,fat:2,sodium:10,GI:55}),
      cook_time: 50, difficulty: 'easy', season: 'all', image_url: '',
      description: '低GI的健康早餐，多种杂粮搭配，营养均衡。',
      benefits: JSON.stringify(['控制血糖','健脾养胃','补充膳食纤维']),
      tips: JSON.stringify(['杂粮提前浸泡更易煮烂','不要加糖，保持原味']),
      suitable_for: JSON.stringify(['糖尿病患者','减肥人群']),
      not_suitable: JSON.stringify(['脾胃虚弱消化不良者']),
      tags: JSON.stringify(['降糖','低GI','杂粮'])
    },
    { name: '水煮蛋配蔬菜沙拉', category: 'breakfast', target_conditions: JSON.stringify(['diabetes', 'weight_loss', 'hypertension', 'general']),
      ingredients: JSON.stringify([{name:'鸡蛋',amount:100,unit:'g'},{name:'生菜',amount:100,unit:'g'},{name:'番茄',amount:50,unit:'g'},{name:'黄瓜',amount:50,unit:'g'},{name:'橄榄油',amount:3,unit:'ml'},{name:'醋',amount:5,unit:'ml'}]),
      steps: JSON.stringify(['鸡蛋冷水下锅，水开后煮8分钟','生菜洗净撕片，番茄黄瓜切块','橄榄油和醋调成油醋汁','蔬菜淋油醋汁拌匀','配水煮蛋食用']),
      nutrition: JSON.stringify({calories:180,protein:14,carbs:8,fat:11,sodium:120,GI:30}),
      cook_time: 15, difficulty: 'easy', season: 'all', image_url: '',
      description: '高蛋白低GI的营养早餐，适合糖尿病患者。',
      benefits: JSON.stringify(['优质蛋白','低升糖','饱腹感强']),
      tips: JSON.stringify(['鸡蛋不要煮太久，溏心蛋营养更好','蔬菜种类可以丰富些']),
      suitable_for: JSON.stringify(['糖尿病患者','减肥人群']),
      not_suitable: JSON.stringify(['高胆固醇患者（限量蛋黄）']),
      tags: JSON.stringify(['降糖','低卡','高蛋白'])
    },
    { name: '全麦三明治', category: 'breakfast', target_conditions: JSON.stringify(['diabetes', 'general']),
      ingredients: JSON.stringify([{name:'全麦面包',amount:60,unit:'g'},{name:'鸡蛋',amount:50,unit:'g'},{name:'生菜',amount:30,unit:'g'},{name:'番茄',amount:30,unit:'g'},{name:'低脂芝士',amount:20,unit:'g'}]),
      steps: JSON.stringify(['全麦面包烤至微焦','鸡蛋煎成蛋饼','依次放上生菜、番茄、蛋饼、芝士','盖上另一片面包','对角切开即可']),
      nutrition: JSON.stringify({calories:280,protein:18,carbs:30,fat:10,sodium:350,GI:45}),
      cook_time: 10, difficulty: 'easy', season: 'all', image_url: '',
      description: '便捷营养的早餐选择，全麦面包升糖指数低。',
      benefits: JSON.stringify(['低升糖','饱腹感强','营养均衡']),
      tips: JSON.stringify(['选择真正的全麦面包','可以加鸡胸肉增加蛋白']),
      suitable_for: JSON.stringify(['糖尿病患者','上班族']),
      not_suitable: JSON.stringify(['麸质过敏者']),
      tags: JSON.stringify(['降糖','便捷','全麦'])
    },
    // 降糖食谱 - 午餐
    { name: '糙米饭配清蒸鱼', category: 'lunch', target_conditions: JSON.stringify(['diabetes', 'hypertension', 'general']),
      ingredients: JSON.stringify([{name:'糙米',amount:80,unit:'g'},{name:'鲈鱼',amount:150,unit:'g'},{name:'青菜',amount:100,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'蒸鱼豉油',amount:5,unit:'ml'}]),
      steps: JSON.stringify(['糙米提前浸泡，蒸熟备用','鲈鱼处理干净，放葱姜','水开后蒸8-10分钟','淋蒸鱼豉油','青菜焯水摆盘','配糙米饭食用']),
      nutrition: JSON.stringify({calories:420,protein:35,carbs:55,fat:8,sodium:320,GI:50}),
      cook_time: 30, difficulty: 'easy', season: 'all', image_url: '',
      description: '标准的糖尿病营养餐，低GI高蛋白。',
      benefits: JSON.stringify(['控制血糖','优质蛋白','营养均衡']),
      tips: JSON.stringify(['糙米提前浸泡2小时更好煮','鱼要选新鲜的']),
      suitable_for: JSON.stringify(['糖尿病患者','高血压患者']),
      not_suitable: JSON.stringify(['痛风患者（限量）']),
      tags: JSON.stringify(['降糖','降压','正餐'])
    },
    { name: '苦瓜炒肉片', category: 'lunch', target_conditions: JSON.stringify(['diabetes', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'苦瓜',amount:200,unit:'g'},{name:'瘦猪肉',amount:80,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'食用油',amount:8,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['苦瓜去瓤切片，用盐腌一下去苦水','猪肉切片，加少许淀粉腌制','热油炒肉片至变色盛出','锅中加油爆香蒜末','加入苦瓜大火快炒2分钟','加入肉片翻炒均匀','加盐调味出锅']),
      nutrition: JSON.stringify({calories:220,protein:20,carbs:12,fat:10,sodium:280,GI:25}),
      cook_time: 15, difficulty: 'easy', season: 'summer', image_url: '',
      description: '苦瓜含有苦瓜素，有"植物胰岛素"之称，有助降血糖。',
      benefits: JSON.stringify(['清热解暑','明目解毒','辅助降糖']),
      tips: JSON.stringify(['苦瓜用盐腌一下可减少苦味','脾胃虚寒者不宜多食']),
      suitable_for: JSON.stringify(['糖尿病患者','上火人群']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降糖','清热','夏季'])
    },
    { name: '秋葵炒蛋', category: 'lunch', target_conditions: JSON.stringify(['diabetes', 'general']),
      ingredients: JSON.stringify([{name:'秋葵',amount:200,unit:'g'},{name:'鸡蛋',amount:100,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'食用油',amount:8,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['秋葵洗净，焯水1分钟后切斜片','鸡蛋打散加少许盐','热油炒散蛋液盛出','锅中加油爆香蒜末','加入秋葵翻炒1分钟','加入鸡蛋翻炒均匀','加盐调味出锅']),
      nutrition: JSON.stringify({calories:200,protein:15,carbs:10,fat:12,sodium:260,GI:20}),
      cook_time: 12, difficulty: 'easy', season: 'summer', image_url: '',
      description: '秋葵含丰富的黏液蛋白，有助延缓糖分吸收。',
      benefits: JSON.stringify(['利咽通淋','健脾益胃','辅助降糖']),
      tips: JSON.stringify(['秋葵要选嫩的，越小越嫩','焯水时间不要太长']),
      suitable_for: JSON.stringify(['糖尿病患者','一般人群']),
      not_suitable: JSON.stringify(['胃肠虚寒者']),
      tags: JSON.stringify(['降糖','高纤维','夏季'])
    },
    { name: '凉拌苦瓜', category: 'lunch', target_conditions: JSON.stringify(['diabetes', 'weight_loss', 'hypertension', 'general']),
      ingredients: JSON.stringify([{name:'苦瓜',amount:250,unit:'g'},{name:'蒜',amount:15,unit:'g'},{name:'醋',amount:10,unit:'ml'},{name:'生抽',amount:5,unit:'ml'},{name:'香油',amount:3,unit:'ml'}]),
      steps: JSON.stringify(['苦瓜去瓤切薄片','用盐腌10分钟去苦水','冲洗干净后焯水30秒','过凉水沥干','蒜切末，加调料调成料汁','拌匀即可']),
      nutrition: JSON.stringify({calories:80,protein:3,carbs:12,fat:3,sodium:300,GI:15}),
      cook_time: 20, difficulty: 'easy', season: 'summer', image_url: '',
      description: '清爽开胃的降糖凉菜，热量极低。',
      benefits: JSON.stringify(['清热解暑','明目解毒','低热量高纤维']),
      tips: JSON.stringify(['苦瓜越苦效果越好','冰镇后口感更佳']),
      suitable_for: JSON.stringify(['糖尿病患者','减肥人群']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降糖','低卡','凉拌'])
    },
    // 降糖食谱 - 晚餐
    { name: '燕麦粥配水煮菜', category: 'dinner', target_conditions: JSON.stringify(['diabetes', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'燕麦片',amount:50,unit:'g'},{name:'菠菜',amount:150,unit:'g'},{name:'金针菇',amount:50,unit:'g'},{name:'鸡蛋',amount:50,unit:'g'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['燕麦片加水煮10分钟成粥','菠菜和金针菇焯水','鸡蛋煮熟切半','燕麦粥配水煮菜和水煮蛋','淋少许生抽调味']),
      nutrition: JSON.stringify({calories:260,protein:18,carbs:40,fat:5,sodium:200,GI:40}),
      cook_time: 20, difficulty: 'easy', season: 'all', image_url: '',
      description: '清淡低GI的晚餐组合，营养丰富又控糖。',
      benefits: JSON.stringify(['控制血糖','高饱腹感','低热量']),
      tips: JSON.stringify(['选择无糖纯燕麦','蔬菜可以换其他绿叶菜']),
      suitable_for: JSON.stringify(['糖尿病患者','减肥人群']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降糖','低卡','清淡'])
    },
    { name: '豆腐蔬菜汤', category: 'dinner', target_conditions: JSON.stringify(['diabetes', 'weight_loss', 'hypertension', 'general']),
      ingredients: JSON.stringify([{name:'嫩豆腐',amount:200,unit:'g'},{name:'白菜',amount:100,unit:'g'},{name:'香菇',amount:30,unit:'g'},{name:'胡萝卜',amount:30,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['豆腐切小块','白菜撕片，香菇切片，胡萝卜切丝','锅中加水烧开','放入所有食材煮10分钟','加盐调味即可']),
      nutrition: JSON.stringify({calories:150,protein:12,carbs:15,fat:6,sodium:250,GI:20}),
      cook_time: 20, difficulty: 'easy', season: 'all', image_url: '',
      description: '清淡鲜美、营养丰富的低GI汤品。',
      benefits: JSON.stringify(['益气和中','生津润燥','低热量高营养']),
      tips: JSON.stringify(['豆腐后放，保持嫩滑','可以加少许虾皮提鲜']),
      suitable_for: JSON.stringify(['糖尿病患者','高血压患者']),
      not_suitable: JSON.stringify(['痛风患者（限量）']),
      tags: JSON.stringify(['降糖','降压','汤品'])
    },
    // 降糖食谱 - 加餐
    { name: '小番茄', category: 'snack', target_conditions: JSON.stringify(['diabetes', 'hypertension', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'小番茄',amount:200,unit:'g'}]),
      steps: JSON.stringify(['小番茄洗净','直接食用']),
      nutrition: JSON.stringify({calories:40,protein:1,carbs:10,fat:0,sodium:10,GI:30}),
      cook_time: 0, difficulty: 'easy', season: 'all', image_url: '',
      description: '最简单健康的加餐，低GI高维生素。',
      benefits: JSON.stringify(['生津止渴','健胃消食','补充维生素C']),
      tips: JSON.stringify(['选择熟透的小番茄更甜','饭前吃可以减少正餐摄入量']),
      suitable_for: JSON.stringify(['糖尿病患者','减肥人群']),
      not_suitable: JSON.stringify(['胃酸过多者']),
      tags: JSON.stringify(['降糖','水果','简单'])
    },
    { name: '坚果混合', category: 'snack', target_conditions: JSON.stringify(['diabetes', 'general']),
      ingredients: JSON.stringify([{name:'杏仁',amount:10,unit:'g'},{name:'核桃',amount:10,unit:'g'},{name:'腰果',amount:10,unit:'g'}]),
      steps: JSON.stringify(['三种坚果混合','直接食用']),
      nutrition: JSON.stringify({calories:180,protein:6,carbs:8,fat:15,sodium:5,GI:20}),
      cook_time: 0, difficulty: 'easy', season: 'all', image_url: '',
      description: '健康的坚果加餐，富含健康脂肪和微量元素。',
      benefits: JSON.stringify(['补脑益智','补充健康脂肪','低升糖']),
      tips: JSON.stringify(['每天一小把即可，不要多吃','选择原味无盐的坚果']),
      suitable_for: JSON.stringify(['糖尿病患者','脑力劳动者']),
      not_suitable: JSON.stringify(['减肥人群（限量）']),
      tags: JSON.stringify(['降糖','坚果','健康脂肪'])
    },
    { name: '黄瓜蘸酱', category: 'snack', target_conditions: JSON.stringify(['diabetes', 'weight_loss', 'hypertension', 'general']),
      ingredients: JSON.stringify([{name:'黄瓜',amount:200,unit:'g'},{name:'豆瓣酱',amount:10,unit:'g'}]),
      steps: JSON.stringify(['黄瓜洗净切条','蘸豆瓣酱食用']),
      nutrition: JSON.stringify({calories:50,protein:2,carbs:8,fat:1,sodium:200,GI:15}),
      cook_time: 0, difficulty: 'easy', season: 'summer', image_url: '',
      description: '超低热量的健康零食，清爽解渴。',
      benefits: JSON.stringify(['清热利水','解毒消肿','低热量高纤维']),
      tips: JSON.stringify(['选带刺的新鲜黄瓜','酱要选低盐的']),
      suitable_for: JSON.stringify(['糖尿病患者','减肥人群']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降糖','低卡','简单'])
    },

    // 降脂食谱 - 早餐
    { name: '豆浆燕麦粥', category: 'breakfast', target_conditions: JSON.stringify(['hyperlipidemia', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'无糖豆浆',amount:250,unit:'ml'},{name:'燕麦片',amount:40,unit:'g'},{name:'枸杞',amount:5,unit:'g'}]),
      steps: JSON.stringify(['豆浆烧开','加入燕麦片煮5分钟','撒上枸杞即可']),
      nutrition: JSON.stringify({calories:220,protein:12,carbs:35,fat:5,sodium:30}),
      cook_time: 8, difficulty: 'easy', season: 'all', image_url: '',
      description: '大豆含丰富的大豆异黄酮和膳食纤维，有助降低胆固醇。',
      benefits: JSON.stringify(['降低胆固醇','调节血脂','补充植物蛋白']),
      tips: JSON.stringify(['选择无糖豆浆','燕麦选纯燕麦片']),
      suitable_for: JSON.stringify(['高血脂患者','减肥人群']),
      not_suitable: JSON.stringify(['痛风患者']),
      tags: JSON.stringify(['降脂','早餐','高纤维'])
    },
    { name: '玉米红薯粥', category: 'breakfast', target_conditions: JSON.stringify(['hyperlipidemia', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'玉米粒',amount:50,unit:'g'},{name:'红薯',amount:100,unit:'g'},{name:'小米',amount:40,unit:'g'}]),
      steps: JSON.stringify(['红薯去皮切块','小米淘洗干净','锅中加水烧开，加入小米煮15分钟','加入玉米粒和红薯块','再煮20分钟至软烂']),
      nutrition: JSON.stringify({calories:280,protein:6,carbs:60,fat:2,sodium:15}),
      cook_time: 40, difficulty: 'easy', season: 'autumn', image_url: '',
      description: '富含膳食纤维的早餐，有助降低血脂。',
      benefits: JSON.stringify(['健脾养胃','润肠通便','降低胆固醇']),
      tips: JSON.stringify(['红薯要选红心的更甜','玉米选新鲜玉米']),
      suitable_for: JSON.stringify(['高血脂患者','便秘人群']),
      not_suitable: JSON.stringify(['糖尿病患者（限量）']),
      tags: JSON.stringify(['降脂','高纤维','粗粮'])
    },
    // 降脂食谱 - 午餐
    { name: '香菇青菜', category: 'lunch', target_conditions: JSON.stringify(['hyperlipidemia', 'weight_loss', 'hypertension', 'general']),
      ingredients: JSON.stringify([{name:'香菇',amount:50,unit:'g'},{name:'青菜',amount:200,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'食用油',amount:5,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['香菇泡发切片','青菜洗净','热油爆香蒜末','加入香菇翻炒2分钟','加入青菜大火快炒2分钟','加盐调味出锅']),
      nutrition: JSON.stringify({calories:90,protein:4,carbs:12,fat:4,sodium:280}),
      cook_time: 10, difficulty: 'easy', season: 'all', image_url: '',
      description: '香菇含香菇多糖，有助降低胆固醇和甘油三酯。',
      benefits: JSON.stringify(['补气养血','健脾和胃','降脂降压']),
      tips: JSON.stringify(['干香菇比鲜香菇营养更丰富','青菜要大火快炒']),
      suitable_for: JSON.stringify(['高血脂患者','高血压患者']),
      not_suitable: JSON.stringify(['脾胃寒湿气滞者']),
      tags: JSON.stringify(['降脂','降压','素菜'])
    },
    { name: '洋葱炒牛肉', category: 'lunch', target_conditions: JSON.stringify(['hyperlipidemia', 'general']),
      ingredients: JSON.stringify([{name:'洋葱',amount:150,unit:'g'},{name:'瘦牛肉',amount:100,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'食用油',amount:8,unit:'ml'},{name:'生抽',amount:5,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['牛肉切丝，加生抽淀粉腌制','洋葱切丝','热油炒牛肉至变色盛出','锅中加油爆香蒜末','加入洋葱炒至变软','加入牛肉翻炒均匀','加盐调味出锅']),
      nutrition: JSON.stringify({calories:220,protein:25,carbs:10,fat:10,sodium:320}),
      cook_time: 15, difficulty: 'easy', season: 'all', image_url: '',
      description: '洋葱含前列腺素A，有助扩张血管、降低血脂。',
      benefits: JSON.stringify(['发散风寒','降脂降压','补充优质蛋白']),
      tips: JSON.stringify(['牛肉要逆纹切才嫩','洋葱不要炒太烂']),
      suitable_for: JSON.stringify(['高血脂患者','高血压患者']),
      not_suitable: JSON.stringify(['皮肤瘙痒者']),
      tags: JSON.stringify(['降脂','高蛋白','家常'])
    },
    { name: '山楂粥', category: 'lunch', target_conditions: JSON.stringify(['hyperlipidemia', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'山楂',amount:20,unit:'g'},{name:'大米',amount:60,unit:'g'},{name:'冰糖',amount:10,unit:'g'}]),
      steps: JSON.stringify(['山楂洗净去核切片','大米淘洗干净','锅中加水烧开，加入大米煮20分钟','加入山楂片再煮10分钟','加冰糖调味即可']),
      nutrition: JSON.stringify({calories:250,protein:4,carbs:55,fat:1,sodium:10}),
      cook_time: 35, difficulty: 'easy', season: 'autumn', image_url: '',
      description: '山楂含山楂酸等有机酸，有助促进脂肪代谢。',
      benefits: JSON.stringify(['消食化积','活血散瘀','降低血脂']),
      tips: JSON.stringify(['山楂不要空腹吃','胃酸过多者不宜多食']),
      suitable_for: JSON.stringify(['高血脂患者','消化不良者']),
      not_suitable: JSON.stringify(['胃溃疡患者','孕妇']),
      tags: JSON.stringify(['降脂','消食','药食同源'])
    },
    // 降脂食谱 - 晚餐
    { name: '绿豆粥', category: 'dinner', target_conditions: JSON.stringify(['hyperlipidemia', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'绿豆',amount:40,unit:'g'},{name:'大米',amount:40,unit:'g'},{name:'百合',amount:10,unit:'g'}]),
      steps: JSON.stringify(['绿豆提前浸泡2小时','大米淘洗干净','锅中加水烧开，加入绿豆煮20分钟','加入大米和百合','再煮20分钟至软烂']),
      nutrition: JSON.stringify({calories:240,protein:8,carbs:50,fat:1,sodium:10}),
      cook_time: 45, difficulty: 'easy', season: 'summer', image_url: '',
      description: '清热解毒的经典粥品，绿豆含植物固醇，有助降低胆固醇。',
      benefits: JSON.stringify(['清热解毒','消暑利水','降低血脂']),
      tips: JSON.stringify(['绿豆先泡更好煮','不要煮太烂，保持豆皮完整']),
      suitable_for: JSON.stringify(['高血脂患者','暑热人群']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['降脂','清热','夏季'])
    },
    { name: '芹菜拌木耳', category: 'dinner', target_conditions: JSON.stringify(['hyperlipidemia', 'hypertension', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'芹菜',amount:150,unit:'g'},{name:'黑木耳',amount:30,unit:'g'},{name:'胡萝卜',amount:30,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'醋',amount:10,unit:'ml'},{name:'生抽',amount:5,unit:'ml'},{name:'香油',amount:3,unit:'ml'}]),
      steps: JSON.stringify(['木耳泡发撕小朵','芹菜切段，胡萝卜切丝','分别焯水后过凉水沥干','蒜切末，加调料调成料汁','所有食材拌匀即可']),
      nutrition: JSON.stringify({calories:85,protein:3,carbs:12,fat:3,sodium:280}),
      cook_time: 20, difficulty: 'easy', season: 'all', image_url: '',
      description: '"血管清道夫"组合，降脂又降压。',
      benefits: JSON.stringify(['清热凉血','软化血管','降脂降压']),
      tips: JSON.stringify(['木耳要充分泡发','现拌现吃口感好']),
      suitable_for: JSON.stringify(['高血脂患者','高血压患者']),
      not_suitable: JSON.stringify(['脾胃虚寒腹泻者']),
      tags: JSON.stringify(['降脂','降压','凉拌'])
    },
    // 降脂食谱 - 加餐
    { name: '山楂茶', category: 'snack', target_conditions: JSON.stringify(['hyperlipidemia', 'weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'干山楂',amount:10,unit:'g'},{name:'决明子',amount:5,unit:'g'},{name:'菊花',amount:3,unit:'g'}]),
      steps: JSON.stringify(['所有材料放入杯中','加入沸水冲泡','焖10分钟即可饮用']),
      nutrition: JSON.stringify({calories:20,protein:0,carbs:5,fat:0,sodium:5}),
      cook_time: 5, difficulty: 'easy', season: 'all', image_url: '',
      description: '经典降脂茶饮，山楂+决明子+菊花三重功效。',
      benefits: JSON.stringify(['消食降脂','清肝明目','润肠通便']),
      tips: JSON.stringify(['不要空腹饮用','胃酸过多者少喝']),
      suitable_for: JSON.stringify(['高血脂患者','便秘人群']),
      not_suitable: JSON.stringify(['胃溃疡患者','孕妇']),
      tags: JSON.stringify(['降脂','茶饮','养生'])
    },
    { name: '苹果', category: 'snack', target_conditions: JSON.stringify(['hyperlipidemia', 'weight_loss', 'hypertension', 'general']),
      ingredients: JSON.stringify([{name:'苹果',amount:200,unit:'g'}]),
      steps: JSON.stringify(['苹果洗净','直接食用']),
      nutrition: JSON.stringify({calories:100,protein:0,carbs:25,fat:0,sodium:5}),
      cook_time: 0, difficulty: 'easy', season: 'all', image_url: '',
      description: '"一天一苹果，医生远离我"，苹果含果胶和多酚，有助降血脂。',
      benefits: JSON.stringify(['生津润肺','健脾益胃','降低胆固醇']),
      tips: JSON.stringify(['带皮吃营养更丰富','饭前吃有助减肥']),
      suitable_for: JSON.stringify(['高血脂患者','一般人群']),
      not_suitable: JSON.stringify(['糖尿病患者（限量）']),
      tags: JSON.stringify(['降脂','水果','简单'])
    },

    // 减重食谱 - 早餐
    { name: '鸡蛋牛奶燕麦', category: 'breakfast', target_conditions: JSON.stringify(['weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'燕麦片',amount:40,unit:'g'},{name:'鸡蛋',amount:50,unit:'g'},{name:'牛奶',amount:200,unit:'ml'},{name:'蓝莓',amount:30,unit:'g'}]),
      steps: JSON.stringify(['燕麦片加牛奶煮5分钟','鸡蛋煮熟切半','盛出燕麦粥，放上鸡蛋和蓝莓']),
      nutrition: JSON.stringify({calories:320,protein:20,carbs:40,fat:8,sodium:120}),
      cook_time: 10, difficulty: 'easy', season: 'all', image_url: '',
      description: '高蛋白高纤维的减脂早餐，饱腹感强。',
      benefits: JSON.stringify(['高饱腹感','促进代谢','营养均衡']),
      tips: JSON.stringify(['选择无糖燕麦片','蓝莓可以换成其他莓果']),
      suitable_for: JSON.stringify(['减肥人群','健身爱好者']),
      not_suitable: JSON.stringify(['乳糖不耐受者']),
      tags: JSON.stringify(['减重','高蛋白','高纤维'])
    },
    { name: '全麦吐司配牛油果', category: 'breakfast', target_conditions: JSON.stringify(['weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'全麦吐司',amount:60,unit:'g'},{name:'牛油果',amount:50,unit:'g'},{name:'鸡蛋',amount:50,unit:'g'},{name:'黑胡椒',amount:1,unit:'g'}]),
      steps: JSON.stringify(['全麦吐司烤至微焦','牛油果捣成泥，抹在吐司上','鸡蛋煎成水波蛋放在上面','撒上黑胡椒即可']),
      nutrition: JSON.stringify({calories:350,protein:15,carbs:35,fat:16,sodium:200}),
      cook_time: 10, difficulty: 'easy', season: 'all', image_url: '',
      description: '网红减脂早餐，健康脂肪+优质蛋白+慢碳。',
      benefits: JSON.stringify(['高饱腹感','健康脂肪','促进代谢']),
      tips: JSON.stringify(['牛油果要选熟的','水波蛋可以换成水煮蛋']),
      suitable_for: JSON.stringify(['减肥人群','健身爱好者']),
      not_suitable: JSON.stringify(['减肥人群需控制牛油果量']),
      tags: JSON.stringify(['减重','健康脂肪','网红'])
    },
    // 减重食谱 - 午餐
    { name: '鸡胸肉沙拉', category: 'lunch', target_conditions: JSON.stringify(['weight_loss', 'hypertension', 'general']),
      ingredients: JSON.stringify([{name:'鸡胸肉',amount:120,unit:'g'},{name:'生菜',amount:100,unit:'g'},{name:'紫甘蓝',amount:50,unit:'g'},{name:'小番茄',amount:50,unit:'g'},{name:'黄瓜',amount:50,unit:'g'},{name:'橄榄油',amount:5,unit:'ml'},{name:'醋',amount:10,unit:'ml'}]),
      steps: JSON.stringify(['鸡胸肉用盐腌一下，平底锅煎熟切片','所有蔬菜洗净切好','橄榄油和醋调成油醋汁','所有食材放入碗中','淋油醋汁拌匀即可']),
      nutrition: JSON.stringify({calories:280,protein:30,carbs:12,fat:12,sodium:250}),
      cook_time: 20, difficulty: 'easy', season: 'all', image_url: '',
      description: '健身减脂标配，高蛋白低脂肪。',
      benefits: JSON.stringify(['高蛋白低脂肪','高饱腹感','促进肌肉合成']),
      tips: JSON.stringify(['鸡胸肉不要煎太老','蔬菜种类越丰富越好']),
      suitable_for: JSON.stringify(['减肥人群','健身爱好者']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['减重','高蛋白','沙拉'])
    },
    { name: '杂粮饭配鸡胸肉和蔬菜', category: 'lunch', target_conditions: JSON.stringify(['weight_loss', 'diabetes', 'general']),
      ingredients: JSON.stringify([{name:'杂粮饭',amount:100,unit:'g'},{name:'鸡胸肉',amount:100,unit:'g'},{name:'西兰花',amount:100,unit:'g'},{name:'胡萝卜',amount:30,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'食用油',amount:5,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['杂粮饭提前蒸好','鸡胸肉切片腌制','西兰花和胡萝卜焯水','热油爆香蒜末','炒鸡胸肉至变色','加入蔬菜翻炒均匀','配杂粮饭食用']),
      nutrition: JSON.stringify({calories:380,protein:35,carbs:40,fat:8,sodium:280}),
      cook_time: 25, difficulty: 'easy', season: 'all', image_url: '',
      description: '标准减脂餐模板：慢碳+高蛋白+高纤维蔬菜。',
      benefits: JSON.stringify(['营养均衡','高饱腹感','促进脂肪燃烧']),
      tips: JSON.stringify(['杂粮饭可以糙米+藜麦组合','鸡胸肉可以换成鱼虾']),
      suitable_for: JSON.stringify(['减肥人群','健身爱好者']),
      not_suitable: JSON.stringify(['脾胃虚弱者']),
      tags: JSON.stringify(['减重','增肌','均衡营养'])
    },
    // 减重食谱 - 晚餐
    { name: '蔬菜鸡蛋汤', category: 'dinner', target_conditions: JSON.stringify(['weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'鸡蛋',amount:50,unit:'g'},{name:'番茄',amount:100,unit:'g'},{name:'生菜',amount:100,unit:'g'},{name:'金针菇',amount:50,unit:'g'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['番茄切块','锅中加水烧开，放入番茄煮5分钟','加入金针菇煮3分钟','打入蛋花','最后放生菜烫熟','加盐调味即可']),
      nutrition: JSON.stringify({calories:120,protein:10,carbs:12,fat:4,sodium:250}),
      cook_time: 15, difficulty: 'easy', season: 'all', image_url: '',
      description: '低卡高饱腹感的晚餐，减肥必备。',
      benefits: JSON.stringify(['低热量','高饱腹感','营养丰富']),
      tips: JSON.stringify(['蔬菜种类可以自由搭配','不要加太多油']),
      suitable_for: JSON.stringify(['减肥人群']),
      not_suitable: JSON.stringify(['营养不良者']),
      tags: JSON.stringify(['减重','低卡','汤品'])
    },
    { name: '蒸菜拼盘', category: 'dinner', target_conditions: JSON.stringify(['weight_loss', 'hypertension', 'diabetes', 'general']),
      ingredients: JSON.stringify([{name:'南瓜',amount:80,unit:'g'},{name:'红薯',amount:80,unit:'g'},{name:'山药',amount:50,unit:'g'},{name:'玉米',amount:50,unit:'g'},{name:'西兰花',amount:50,unit:'g'}]),
      steps: JSON.stringify(['所有食材洗净切好','南瓜红薯山药玉米先蒸10分钟','最后加西兰花蒸5分钟','摆盘即可']),
      nutrition: JSON.stringify({calories:200,protein:5,carbs:45,fat:1,sodium:20}),
      cook_time: 20, difficulty: 'easy', season: 'all', image_url: '',
      description: '纯素低卡晚餐，丰富的膳食纤维和维生素。',
      benefits: JSON.stringify(['低热量','高纤维','营养丰富']),
      tips: JSON.stringify(['可以蘸少许生抽增加风味','搭配少量蛋白质更佳']),
      suitable_for: JSON.stringify(['减肥人群','三高人群']),
      not_suitable: JSON.stringify(['需要增肌者']),
      tags: JSON.stringify(['减重','低卡','蒸菜'])
    },
    // 减重食谱 - 加餐
    { name: '希腊酸奶', category: 'snack', target_conditions: JSON.stringify(['weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'无糖希腊酸奶',amount:150,unit:'g'},{name:'蓝莓',amount:30,unit:'g'},{name:'奇亚籽',amount:5,unit:'g'}]),
      steps: JSON.stringify(['希腊酸奶放入碗中','撒上蓝莓和奇亚籽','即可食用']),
      nutrition: JSON.stringify({calories:150,protein:15,carbs:12,fat:3,sodium:50}),
      cook_time: 0, difficulty: 'easy', season: 'all', image_url: '',
      description: '高蛋白低热量的健康加餐。',
      benefits: JSON.stringify(['高蛋白','益生菌','促进肠道健康']),
      tips: JSON.stringify(['选择无糖希腊酸奶','奇亚籽需要提前泡吗？不需要，直接吃就行']),
      suitable_for: JSON.stringify(['减肥人群','健身爱好者']),
      not_suitable: JSON.stringify(['乳糖不耐受者']),
      tags: JSON.stringify(['减重','高蛋白','益生菌'])
    },
    { name: '蛋白棒', category: 'snack', target_conditions: JSON.stringify(['weight_loss', 'general']),
      ingredients: JSON.stringify([{name:'燕麦',amount:30,unit:'g'},{name:'蛋白粉',amount:15,unit:'g'},{name:'花生酱',amount:10,unit:'g'},{name:'蜂蜜',amount:5,unit:'g'}]),
      steps: JSON.stringify(['燕麦打成粉','所有材料混合均匀','压成方块状','冷藏30分钟后切块']),
      nutrition: JSON.stringify({calories:250,protein:20,carbs:25,fat:8,sodium:80}),
      cook_time: 40, difficulty: 'easy', season: 'all', image_url: '',
      description: '自制蛋白棒，运动前后补充能量。',
      benefits: JSON.stringify(['补充蛋白质','方便携带','快速供能']),
      tips: JSON.stringify(['可以加坚果增加口感','冷藏保存口感更佳']),
      suitable_for: JSON.stringify(['减肥人群','健身爱好者']),
      not_suitable: JSON.stringify(['减肥人群限量食用']),
      tags: JSON.stringify(['减重','蛋白','自制'])
    },

    // 通用食谱
    { name: '皮蛋瘦肉粥', category: 'breakfast', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'大米',amount:80,unit:'g'},{name:'瘦猪肉',amount:50,unit:'g'},{name:'皮蛋',amount:50,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['大米淘洗干净，加水煮粥','猪肉切丝，皮蛋切丁','粥煮至粘稠时加入肉丝和皮蛋','再煮10分钟','加盐调味，撒葱花即可']),
      nutrition: JSON.stringify({calories:320,protein:18,carbs:45,fat:6,sodium:450}),
      cook_time: 40, difficulty: 'easy', season: 'all', image_url: '',
      description: '经典广式早餐粥品，鲜香可口。',
      benefits: JSON.stringify(['益气养阴','养血生津','增进食欲']),
      tips: JSON.stringify(['皮蛋选无铅的更健康','粥要煮得粘稠才好喝']),
      suitable_for: JSON.stringify(['一般人群','病后体虚者']),
      not_suitable: JSON.stringify(['高尿酸患者']),
      tags: JSON.stringify(['通用','早餐','经典'])
    },
    { name: '小笼包', category: 'breakfast', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'面粉',amount:80,unit:'g'},{name:'猪肉馅',amount:60,unit:'g'},{name:'皮冻',amount:30,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'生抽',amount:5,unit:'ml'}]),
      steps: JSON.stringify(['面粉加热水揉成面团，醒30分钟','猪肉馅加葱姜、生抽、皮冻拌匀','面团分小剂子，擀成薄皮','包入馅料，捏成包子','水开后蒸8分钟即可']),
      nutrition: JSON.stringify({calories:350,protein:15,carbs:45,fat:12,sodium:480}),
      cook_time: 50, difficulty: 'medium', season: 'all', image_url: '',
      description: '江南名点，皮薄馅大，汤汁鲜美。',
      benefits: JSON.stringify(['补充能量','优质蛋白','增进食欲']),
      tips: JSON.stringify(['吃的时候先咬个小口，避免烫嘴','配姜醋汁更美味']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['减肥人群（限量）']),
      tags: JSON.stringify(['通用','早餐','经典'])
    },
    { name: '豆浆油条', category: 'breakfast', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'豆浆',amount:250,unit:'ml'},{name:'油条',amount:80,unit:'g'}]),
      steps: JSON.stringify(['豆浆加热','油条切段','蘸豆浆食用']),
      nutrition: JSON.stringify({calories:420,protein:12,carbs:55,fat:18,sodium:350}),
      cook_time: 5, difficulty: 'easy', season: 'all', image_url: '',
      description: '国民经典早餐组合，豆浆配油条。',
      benefits: JSON.stringify(['补充能量','植物蛋白','经典搭配']),
      tips: JSON.stringify(['油条不要天天吃','豆浆选无糖的更健康']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['减肥人群','高血脂患者（限量）']),
      tags: JSON.stringify(['通用','早餐','经典'])
    },
    { name: '红烧肉', category: 'lunch', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'五花肉',amount:150,unit:'g'},{name:'冰糖',amount:20,unit:'g'},{name:'生抽',amount:15,unit:'ml'},{name:'老抽',amount:5,unit:'ml'},{name:'料酒',amount:10,unit:'ml'},{name:'姜',amount:10,unit:'g'},{name:'八角',amount:2,unit:'g'}]),
      steps: JSON.stringify(['五花肉切块焯水','锅中加糖炒出糖色','放入五花肉翻炒上色','加生抽、老抽、料酒、姜、八角','加水没过肉，大火烧开转小火','炖1小时至软烂收汁']),
      nutrition: JSON.stringify({calories:550,protein:20,carbs:20,fat:45,sodium:580}),
      cook_time: 80, difficulty: 'medium', season: 'all', image_url: '',
      description: '经典家常菜，肥而不腻，入口即化。',
      benefits: JSON.stringify(['补肾养血','滋阴润燥','补充能量']),
      tips: JSON.stringify(['选五花肉要肥瘦相间','小火慢炖才好吃']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['减肥人群','三高人群（限量）']),
      tags: JSON.stringify(['通用','家常菜','经典'])
    },
    { name: '宫保鸡丁', category: 'lunch', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'鸡胸肉',amount:150,unit:'g'},{name:'花生米',amount:20,unit:'g'},{name:'干辣椒',amount:5,unit:'g'},{name:'花椒',amount:2,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'生抽',amount:10,unit:'ml'},{name:'醋',amount:5,unit:'ml'},{name:'糖',amount:5,unit:'g'}]),
      steps: JSON.stringify(['鸡肉切丁，加生抽淀粉腌制','调碗汁：生抽、醋、糖、淀粉、水','热油爆香干辣椒和花椒','放入鸡丁快速翻炒','加葱姜炒香','倒入碗汁翻炒均匀','最后加花生米翻炒出锅']),
      nutrition: JSON.stringify({calories:380,protein:30,carbs:15,fat:20,sodium:420}),
      cook_time: 20, difficulty: 'medium', season: 'all', image_url: '',
      description: '川菜经典名菜，麻辣鲜香，鸡肉嫩滑。',
      benefits: JSON.stringify(['温中益气','补精添髓','开胃消食']),
      tips: JSON.stringify(['鸡丁要滑炒才嫩','花生米最后放，保持酥脆']),
      suitable_for: JSON.stringify(['一般人群','喜欢辣味者']),
      not_suitable: JSON.stringify(['上火者','痔疮患者']),
      tags: JSON.stringify(['通用','川菜','经典'])
    },
    { name: '鱼香肉丝', category: 'lunch', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'猪里脊肉',amount:120,unit:'g'},{name:'胡萝卜',amount:50,unit:'g'},{name:'木耳',amount:30,unit:'g'},{name:'青椒',amount:50,unit:'g'},{name:'泡椒',amount:10,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'生抽',amount:10,unit:'ml'},{name:'醋',amount:8,unit:'ml'},{name:'糖',amount:8,unit:'g'}]),
      steps: JSON.stringify(['猪肉切丝腌制','胡萝卜、木耳、青椒切丝','调鱼香汁：生抽、醋、糖、淀粉、水','热油炒肉丝至变色盛出','锅中加油爆香泡椒、姜蒜','加入蔬菜翻炒','倒入肉丝和鱼香汁','翻炒均匀出锅']),
      nutrition: JSON.stringify({calories:320,protein:22,carbs:20,fat:15,sodium:450}),
      cook_time: 20, difficulty: 'medium', season: 'all', image_url: '',
      description: '川菜经典，咸甜酸辣兼备，鱼香味浓郁。',
      benefits: JSON.stringify(['开胃健脾','补充蛋白质','丰富维生素']),
      tips: JSON.stringify(['鱼香汁的比例要调好','肉丝要嫩，蔬菜要脆']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['胃溃疡患者']),
      tags: JSON.stringify(['通用','川菜','经典'])
    },
    { name: '麻婆豆腐', category: 'lunch', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'嫩豆腐',amount:250,unit:'g'},{name:'牛肉末',amount:50,unit:'g'},{name:'豆瓣酱',amount:15,unit:'g'},{name:'花椒粉',amount:2,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'生抽',amount:5,unit:'ml'},{name:'淀粉',amount:5,unit:'g'}]),
      steps: JSON.stringify(['豆腐切小块焯水备用','热油炒牛肉末至变色','加豆瓣酱炒出红油','加姜蒜末炒香','加水烧开，放入豆腐','小火煮3分钟入味','勾芡，撒花椒粉出锅']),
      nutrition: JSON.stringify({calories:280,protein:18,carbs:15,fat:16,sodium:480}),
      cook_time: 20, difficulty: 'easy', season: 'all', image_url: '',
      description: '川菜代表，麻、辣、烫、香、酥、嫩、鲜、活。',
      benefits: JSON.stringify(['益气和中','生津润燥','开胃消食']),
      tips: JSON.stringify(['豆腐焯水可去除豆腥味','花椒粉最后撒，麻味更浓']),
      suitable_for: JSON.stringify(['一般人群','喜欢辣味者']),
      not_suitable: JSON.stringify(['上火者','痔疮患者']),
      tags: JSON.stringify(['通用','川菜','经典'])
    },
    { name: '番茄牛腩面', category: 'lunch', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'牛腩',amount:100,unit:'g'},{name:'番茄',amount:150,unit:'g'},{name:'面条',amount:100,unit:'g'},{name:'洋葱',amount:30,unit:'g'},{name:'姜',amount:5,unit:'g'},{name:'番茄酱',amount:10,unit:'g'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['牛腩切块焯水','番茄切块，洋葱切丁','热油炒洋葱和番茄','加番茄酱炒出红油','加水和牛腩，小火炖1小时','另起锅煮面条','浇上番茄牛腩汤即可']),
      nutrition: JSON.stringify({calories:480,protein:25,carbs:55,fat:15,sodium:420}),
      cook_time: 90, difficulty: 'medium', season: 'all', image_url: '',
      description: '酸甜可口的经典面食，牛腩软烂入味。',
      benefits: JSON.stringify(['补中益气','滋养脾胃','强筋健骨']),
      tips: JSON.stringify(['牛腩要选带筋的更好吃','番茄要炒出汁才香浓']),
      suitable_for: JSON.stringify(['一般人群','体虚者']),
      not_suitable: JSON.stringify(['减肥人群（限量）']),
      tags: JSON.stringify(['通用','面食','经典'])
    },
    { name: '蛋炒饭', category: 'lunch', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'米饭',amount:150,unit:'g'},{name:'鸡蛋',amount:100,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'豌豆',amount:20,unit:'g'},{name:'胡萝卜',amount:20,unit:'g'},{name:'食用油',amount:10,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['鸡蛋打散','热油炒散蛋液盛出','锅中加油炒胡萝卜和豌豆','加入米饭翻炒均匀','倒入鸡蛋继续翻炒','加盐调味，撒葱花出锅']),
      nutrition: JSON.stringify({calories:420,protein:15,carbs:60,fat:14,sodium:380}),
      cook_time: 10, difficulty: 'easy', season: 'all', image_url: '',
      description: '最简单也最经典的炒饭，金黄诱人。',
      benefits: JSON.stringify(['补充能量','优质蛋白','方便快捷']),
      tips: JSON.stringify(['用隔夜饭炒效果最好','大火快炒，米饭粒粒分明']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['减肥人群（限量）']),
      tags: JSON.stringify(['通用','炒饭','简单'])
    },
    { name: '扬州炒饭', category: 'lunch', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'米饭',amount:150,unit:'g'},{name:'鸡蛋',amount:50,unit:'g'},{name:'虾仁',amount:30,unit:'g'},{name:'火腿',amount:30,unit:'g'},{name:'豌豆',amount:20,unit:'g'},{name:'胡萝卜',amount:20,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'食用油',amount:10,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['虾仁火腿切丁','鸡蛋打散','热油炒散蛋液盛出','炒虾仁和火腿丁','加蔬菜丁翻炒','加米饭翻炒均匀','倒入鸡蛋继续翻炒','加盐调味，撒葱花出锅']),
      nutrition: JSON.stringify({calories:450,protein:20,carbs:55,fat:16,sodium:450}),
      cook_time: 15, difficulty: 'easy', season: 'all', image_url: '',
      description: '扬州名菜，配料丰富，色香味俱全。',
      benefits: JSON.stringify(['补充能量','营养丰富','增进食欲']),
      tips: JSON.stringify(['配料可以根据喜好调整','米饭要粒粒分明']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['减肥人群（限量）','痛风患者（限量）']),
      tags: JSON.stringify(['通用','炒饭','经典'])
    },
    { name: '酸辣土豆丝', category: 'dinner', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'土豆',amount:200,unit:'g'},{name:'干辣椒',amount:5,unit:'g'},{name:'花椒',amount:2,unit:'g'},{name:'醋',amount:15,unit:'ml'},{name:'蒜',amount:10,unit:'g'},{name:'食用油',amount:8,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['土豆去皮切细丝，泡水去淀粉','热油爆香干辣椒和花椒','加土豆丝大火快炒','加醋和盐调味','加蒜末翻炒均匀出锅']),
      nutrition: JSON.stringify({calories:180,protein:3,carbs:30,fat:6,sodium:280}),
      cook_time: 10, difficulty: 'easy', season: 'all', image_url: '',
      description: '国民家常菜，酸辣爽脆，下饭神器。',
      benefits: JSON.stringify(['健脾和胃','益气调中','增进食欲']),
      tips: JSON.stringify(['土豆丝要切细才脆','大火快炒，保持脆嫩']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['胃溃疡患者']),
      tags: JSON.stringify(['通用','家常菜','下饭'])
    },
    { name: '地三鲜', category: 'dinner', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'茄子',amount:150,unit:'g'},{name:'土豆',amount:100,unit:'g'},{name:'青椒',amount:50,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'生抽',amount:10,unit:'ml'},{name:'蚝油',amount:5,unit:'g'},{name:'食用油',amount:15,unit:'ml'}]),
      steps: JSON.stringify(['茄子土豆切滚刀块，青椒切块','茄子和土豆分别过油至金黄','锅中留底油爆香蒜末','加生抽蚝油和少许水','放入所有食材翻炒均匀','勾芡出锅']),
      nutrition: JSON.stringify({calories:320,protein:4,carbs:35,fat:18,sodium:380}),
      cook_time: 20, difficulty: 'easy', season: 'summer', image_url: '',
      description: '东北经典素菜，茄子土豆青椒的完美组合。',
      benefits: JSON.stringify(['清热活血','健脾益气','补充维生素']),
      tips: JSON.stringify(['茄子过油后不吸油的小技巧：先撒淀粉','可以用少油版，更健康']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['减肥人群（限量）']),
      tags: JSON.stringify(['通用','东北菜','素菜'])
    },
    { name: '醋溜白菜', category: 'dinner', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'白菜',amount:250,unit:'g'},{name:'干辣椒',amount:3,unit:'g'},{name:'醋',amount:15,unit:'ml'},{name:'生抽',amount:5,unit:'ml'},{name:'糖',amount:5,unit:'g'},{name:'蒜',amount:10,unit:'g'},{name:'食用油',amount:8,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['白菜切片','调碗汁：醋、生抽、糖、盐、淀粉','热油爆香干辣椒和蒜末','加入白菜大火快炒','倒入碗汁翻炒均匀出锅']),
      nutrition: JSON.stringify({calories:120,protein:3,carbs:18,fat:5,sodium:350}),
      cook_time: 10, difficulty: 'easy', season: 'winter', image_url: '',
      description: '简单快手的家常菜，酸甜可口。',
      benefits: JSON.stringify(['清热利水','养胃生津','促进消化']),
      tips: JSON.stringify(['白菜帮要片薄片才入味','大火快炒保持脆嫩']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['胃酸过多者']),
      tags: JSON.stringify(['通用','家常菜','快手'])
    },
    { name: '紫菜蛋花汤', category: 'dinner', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'紫菜',amount:5,unit:'g'},{name:'鸡蛋',amount:50,unit:'g'},{name:'虾皮',amount:5,unit:'g'},{name:'葱',amount:5,unit:'g'},{name:'香油',amount:3,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['紫菜撕碎','鸡蛋打散','锅中加水烧开','放入紫菜和虾皮','淋入蛋液形成蛋花','加盐调味，撒葱花，淋香油']),
      nutrition: JSON.stringify({calories:100,protein:8,carbs:5,fat:5,sodium:350}),
      cook_time: 5, difficulty: 'easy', season: 'all', image_url: '',
      description: '最简单的汤品，鲜美营养。',
      benefits: JSON.stringify(['清热化痰','补肾养心','补充碘和蛋白']),
      tips: JSON.stringify(['蛋液要慢慢淋，蛋花才好看','虾皮提鲜，盐要少放']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['甲状腺功能亢进者']),
      tags: JSON.stringify(['通用','汤品','简单'])
    },
    { name: '冬瓜排骨汤', category: 'dinner', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'冬瓜',amount:200,unit:'g'},{name:'排骨',amount:100,unit:'g'},{name:'姜',amount:10,unit:'g'},{name:'葱',amount:10,unit:'g'},{name:'料酒',amount:10,unit:'ml'},{name:'盐',amount:2,unit:'g'}]),
      steps: JSON.stringify(['排骨焯水去腥','冬瓜去皮切块','锅中加水，放入排骨、姜片、料酒','大火烧开转小火炖40分钟','加入冬瓜再煮15分钟','加盐调味，撒葱花']),
      nutrition: JSON.stringify({calories:250,protein:20,carbs:8,fat:15,sodium:320}),
      cook_time: 60, difficulty: 'easy', season: 'summer', image_url: '',
      description: '清润滋补的家常汤品，冬瓜利水消肿。',
      benefits: JSON.stringify(['清热利水','滋阴润燥','补充钙质']),
      tips: JSON.stringify(['排骨要先焯水去腥','冬瓜后放，保持清爽']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['痛风患者（限量）']),
      tags: JSON.stringify(['通用','汤品','滋补'])
    },
    { name: '八宝粥', category: 'dinner', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'大米',amount:30,unit:'g'},{name:'糯米',amount:20,unit:'g'},{name:'红豆',amount:15,unit:'g'},{name:'绿豆',amount:10,unit:'g'},{name:'花生',amount:10,unit:'g'},{name:'莲子',amount:10,unit:'g'},{name:'红枣',amount:10,unit:'g'},{name:'桂圆',amount:5,unit:'g'},{name:'冰糖',amount:15,unit:'g'}]),
      steps: JSON.stringify(['所有杂粮提前浸泡2小时','锅中加水烧开','加入所有食材','小火煮60分钟至软烂','加冰糖调味即可']),
      nutrition: JSON.stringify({calories:320,protein:8,carbs:65,fat:5,sodium:15}),
      cook_time: 70, difficulty: 'easy', season: 'all', image_url: '',
      description: '传统养生粥品，八种食材，营养丰富。',
      benefits: JSON.stringify(['健脾养胃','益气补血','安神助眠']),
      tips: JSON.stringify(['杂粮提前浸泡更好煮','可以根据喜好调整配料']),
      suitable_for: JSON.stringify(['一般人群','体虚者']),
      not_suitable: JSON.stringify(['糖尿病患者（不加糖）']),
      tags: JSON.stringify(['通用','养生','粥品'])
    },
    { name: '小米粥配咸菜', category: 'dinner', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'小米',amount:80,unit:'g'},{name:'萝卜干',amount:20,unit:'g'},{name:'花生米',amount:10,unit:'g'}]),
      steps: JSON.stringify(['小米淘洗干净','锅中加水烧开，加入小米','小火煮30分钟至粘稠','配萝卜干和花生米食用']),
      nutrition: JSON.stringify({calories:280,protein:7,carbs:55,fat:5,sodium:200}),
      cook_time: 35, difficulty: 'easy', season: 'all', image_url: '',
      description: '养胃安神的经典搭配，清淡易消化。',
      benefits: JSON.stringify(['健脾和胃','养心安神','补虚益气']),
      tips: JSON.stringify(['小米要煮粘稠才香','可以加红薯或南瓜增加风味']),
      suitable_for: JSON.stringify(['一般人群','脾胃虚弱者']),
      not_suitable: JSON.stringify(['一般人群均可']),
      tags: JSON.stringify(['通用','养胃','粥品'])
    },
    { name: '绿豆汤', category: 'snack', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'绿豆',amount:50,unit:'g'},{name:'冰糖',amount:15,unit:'g'}]),
      steps: JSON.stringify(['绿豆洗净','锅中加水烧开','小火煮30分钟至绿豆开花','加冰糖调味','冰镇后口感更佳']),
      nutrition: JSON.stringify({calories:150,protein:5,carbs:30,fat:1,sodium:10}),
      cook_time: 35, difficulty: 'easy', season: 'summer', image_url: '',
      description: '夏季消暑必备饮品，清热解毒。',
      benefits: JSON.stringify(['清热解毒','消暑利水','补充矿物质']),
      tips: JSON.stringify(['绿豆不要煮太烂，保持豆皮完整','冰镇后更爽口']),
      suitable_for: JSON.stringify(['一般人群','暑热人群']),
      not_suitable: JSON.stringify(['脾胃虚寒者']),
      tags: JSON.stringify(['通用','消暑','夏季'])
    },
    { name: '银耳莲子羹', category: 'snack', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'银耳',amount:15,unit:'g'},{name:'莲子',amount:20,unit:'g'},{name:'红枣',amount:15,unit:'g'},{name:'冰糖',amount:15,unit:'g'},{name:'枸杞',amount:5,unit:'g'}]),
      steps: JSON.stringify(['银耳提前泡发，撕成小朵','莲子去芯','锅中加水，放入银耳、莲子、红枣','小火炖40分钟至粘稠','加冰糖和枸杞再煮5分钟']),
      nutrition: JSON.stringify({calories:180,protein:2,carbs:42,fat:1,sodium:20}),
      cook_time: 50, difficulty: 'easy', season: 'all', image_url: '',
      description: '经典养颜甜品，银耳有"平民燕窝"之称。',
      benefits: JSON.stringify(['滋阴润肺','养胃生津','美容养颜']),
      tips: JSON.stringify(['银耳要选微黄的，太白的可能熏过','莲子去芯才不苦']),
      suitable_for: JSON.stringify(['一般人群','女性']),
      not_suitable: JSON.stringify(['糖尿病患者（不加糖）']),
      tags: JSON.stringify(['通用','甜品','养颜'])
    },
    { name: '双皮奶', category: 'snack', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'牛奶',amount:250,unit:'ml'},{name:'鸡蛋',amount:50,unit:'g'},{name:'糖',amount:15,unit:'g'}]),
      steps: JSON.stringify(['牛奶加热至微开，倒入碗中放凉形成奶皮','蛋清加细砂糖打匀','牛奶倒出，留底奶皮','蛋清液过筛后倒入牛奶中拌匀','倒回奶皮碗中','盖上保鲜膜，上锅蒸15分钟']),
      nutrition: JSON.stringify({calories:220,protein:10,carbs:25,fat:8,sodium:100}),
      cook_time: 30, difficulty: 'medium', season: 'all', image_url: '',
      description: '广式经典甜品，嫩滑香甜。',
      benefits: JSON.stringify(['补充钙质','优质蛋白','滋润养颜']),
      tips: JSON.stringify(['要用全脂牛奶才有奶皮','蒸的时候盖保鲜膜防滴水']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['减肥人群（限量）','乳糖不耐受者']),
      tags: JSON.stringify(['通用','甜品','广式'])
    },
    { name: '芒果班戟', category: 'snack', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'芒果',amount:100,unit:'g'},{name:'淡奶油',amount:80,unit:'g'},{name:'低筋面粉',amount:40,unit:'g'},{name:'鸡蛋',amount:50,unit:'g'},{name:'牛奶',amount:100,unit:'ml'},{name:'糖',amount:20,unit:'g'}]),
      steps: JSON.stringify(['鸡蛋打散，加糖和牛奶搅匀','筛入面粉拌匀成面糊','平底锅小火摊成薄饼','奶油打发','芒果切块','饼皮中放入奶油和芒果，包成四方形']),
      nutrition: JSON.stringify({calories:380,protein:6,carbs:40,fat:22,sodium:80}),
      cook_time: 40, difficulty: 'medium', season: 'summer', image_url: '',
      description: '港式经典甜品，芒果香甜，奶油顺滑。',
      benefits: JSON.stringify(['补充能量','丰富维生素','愉悦心情']),
      tips: JSON.stringify(['芒果要选熟透的才甜','奶油要打发到位']),
      suitable_for: JSON.stringify(['一般人群','喜欢甜品者']),
      not_suitable: JSON.stringify(['减肥人群','糖尿病患者']),
      tags: JSON.stringify(['通用','甜品','港式'])
    },
    { name: '曲奇饼干', category: 'snack', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'黄油',amount:80,unit:'g'},{name:'糖粉',amount:50,unit:'g'},{name:'低筋面粉',amount:120,unit:'g'},{name:'鸡蛋',amount:25,unit:'g'},{name:'香草精',amount:1,unit:'g'}]),
      steps: JSON.stringify(['黄油软化加糖粉打发','分次加入蛋液打发','筛入面粉拌匀','装入裱花袋挤成花型','烤箱170度烤15分钟']),
      nutrition: JSON.stringify({calories:180,protein:2,carbs:20,fat:10,sodium:60}),
      cook_time: 25, difficulty: 'medium', season: 'all', image_url: '',
      description: '经典黄油曲奇，酥松可口。',
      benefits: JSON.stringify(['补充能量','愉悦心情','下午茶好伴侣']),
      tips: JSON.stringify(['黄油要充分打发才酥松','烤的时候注意观察颜色']),
      suitable_for: JSON.stringify(['一般人群']),
      not_suitable: JSON.stringify(['减肥人群','高血脂患者（限量）']),
      tags: JSON.stringify(['通用','烘焙','下午茶'])
    },
    { name: '提拉米苏', category: 'snack', target_conditions: JSON.stringify(['general']),
      ingredients: JSON.stringify([{name:'马斯卡彭奶酪',amount:100,unit:'g'},{name:'手指饼干',amount:50,unit:'g'},{name:'浓缩咖啡',amount:50,unit:'ml'},{name:'蛋黄',amount:30,unit:'g'},{name:'糖',amount:30,unit:'g'},{name:'可可粉',amount:5,unit:'g'}]),
      steps: JSON.stringify(['蛋黄加糖打发至发白','加入马斯卡彭奶酪拌匀','手指饼干快速蘸咖啡','一层饼干一层奶酪糊交替铺','冷藏4小时以上','食用前筛可可粉']),
      nutrition: JSON.stringify({calories:350,protein:8,carbs:35,fat:20,sodium:150}),
      cook_time: 30, difficulty: 'medium', season: 'all', image_url: '',
      description: '意大利经典甜品，咖啡香浓，口感丝滑。',
      benefits: JSON.stringify(['补充能量','浓郁咖啡香','带来幸福感']),
      tips: JSON.stringify(['奶酪要选马斯卡彭才正宗','冷藏时间越长越好吃']),
      suitable_for: JSON.stringify(['一般人群','喜欢咖啡者']),
      not_suitable: JSON.stringify(['减肥人群','孕妇（含生蛋黄）']),
      tags: JSON.stringify(['通用','意式','经典'])
    },
  ];

  // 插入食谱
  const insertRecipe = db.prepare(`
    INSERT OR IGNORE INTO recipes (name, category, target_conditions, ingredients, steps, nutrition, cook_time, difficulty, season, image_url, description, benefits, tips, suitable_for, not_suitable, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let newRecipeCount = 0;
  for (const recipe of recipes) {
    const result = insertRecipe.run(
      recipe.name, recipe.category, recipe.target_conditions,
      recipe.ingredients, recipe.steps, recipe.nutrition,
      recipe.cook_time, recipe.difficulty, recipe.season, recipe.image_url,
      recipe.description, recipe.benefits, recipe.tips,
      recipe.suitable_for, recipe.not_suitable, recipe.tags
    );
    if (result.changes > 0) newRecipeCount++;
  }

  const finalRecipeCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get().count;
  console.log(`[DB] 食谱插入完成，新增 ${newRecipeCount} 道，总计 ${finalRecipeCount} 道`);

  // ----- 运动数据（45项） -----
  const exercises = [
    // 有氧运动
    { name: '快走', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'diabetes', 'weight_loss', 'general']),
      difficulty: 'beginner', duration: 30, calories: 150, equipment: '无',
      steps: JSON.stringify(['抬头挺胸，收腹收臀','手臂自然摆动','步幅适中，脚跟先着地','呼吸均匀，保持微喘但能说话的强度']),
      benefits: JSON.stringify(['提高心肺功能','降低血压','改善血糖','消耗热量']),
      tips: JSON.stringify(['选择平坦的路面','穿舒适的运动鞋','可以循序渐进增加速度和时间']),
      image_url: ''
    },
    { name: '慢跑', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'diabetes', 'weight_loss', 'general']),
      difficulty: 'beginner', duration: 30, calories: 250, equipment: '无',
      steps: JSON.stringify(['热身5-10分钟','身体微微前倾，步伐轻快','全脚掌着地，避免脚跟重击','手臂弯曲90度自然摆动','保持均匀呼吸']),
      benefits: JSON.stringify(['增强心肺功能','促进脂肪燃烧','改善睡眠质量','释放压力']),
      tips: JSON.stringify(['跑步前一定要热身','选择塑胶跑道减少膝盖压力','跑鞋要有良好缓震']),
      image_url: ''
    },
    { name: '游泳', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'weight_loss', 'general']),
      difficulty: 'intermediate', duration: 30, calories: 300, equipment: '泳池、泳衣、泳镜',
      steps: JSON.stringify(['下水前充分热身','从蛙泳开始学习','保持身体水平','呼吸有节奏，吸气抬头，呼气入水','循序渐进增加距离']),
      benefits: JSON.stringify(['全身运动，对关节无压力','提高心肺功能','塑造线条','消暑降温']),
      tips: JSON.stringify(['初学者建议报班学习','注意安全，不要独自游泳','游泳后及时擦干身体']),
      image_url: ''
    },
    { name: '骑自行车', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'diabetes', 'weight_loss', 'general']),
      difficulty: 'beginner', duration: 40, calories: 280, equipment: '自行车、头盔',
      steps: JSON.stringify(['调整座椅高度','保持正确骑行姿势','循序渐进增加距离和速度','注意交通安全','骑行后拉伸腿部']),
      benefits: JSON.stringify(['提高心肺功能','增强腿部力量','改善关节灵活性','低碳环保']),
      tips: JSON.stringify(['一定要戴头盔','遵守交通规则','可以从通勤开始培养习惯']),
      image_url: ''
    },
    { name: '跳绳', category: 'cardio', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 15, calories: 180, equipment: '跳绳',
      steps: JSON.stringify(['选择合适长度的跳绳','大臂贴身体，手腕摇绳','前脚掌着地，膝盖微屈','循序渐进，从1分钟开始']),
      benefits: JSON.stringify(['高效燃脂','提高协调性','增强心肺','方便随时随地']),
      tips: JSON.stringify(['穿有缓冲的运动鞋','在软垫或草地上跳','体重过大者不建议跳绳']),
      image_url: ''
    },
    { name: '椭圆机', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'weight_loss', 'general']),
      difficulty: 'beginner', duration: 30, calories: 220, equipment: '椭圆机',
      steps: JSON.stringify(['调整阻力到合适档位','手握把手，脚踩踏板','保持身体直立','匀速运动，呼吸均匀']),
      benefits: JSON.stringify(['低冲击，保护关节','全身协调运动','提高心肺功能','可调节强度']),
      tips: JSON.stringify(['不要全靠手臂发力','保持核心收紧','可以间歇训练提高效率']),
      image_url: ''
    },
    { name: '爬楼梯', category: 'cardio', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'intermediate', duration: 15, calories: 150, equipment: '无',
      steps: JSON.stringify(['保持背部挺直','一步一个台阶','用脚跟发力','均匀呼吸，不要憋气']),
      benefits: JSON.stringify(['强化腿部力量','提高心肺功能','高效燃脂','随时随地可以做']),
      tips: JSON.stringify(['下楼时注意保护膝盖','体重过大者不建议','可以循序渐进增加楼层']),
      image_url: ''
    },
    { name: 'HIIT训练', category: 'cardio', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'advanced', duration: 20, calories: 250, equipment: '无',
      steps: JSON.stringify(['热身5分钟','30秒高强度运动（如高抬腿）','15秒休息','重复8-10组','最后拉伸放松']),
      benefits: JSON.stringify(['高效燃脂','运动后持续燃脂','提高代谢','省时高效']),
      tips: JSON.stringify(['初学者量力而行','注意动作标准比数量重要','有基础疾病者咨询医生']),
      image_url: ''
    },
    { name: '太极拳', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'general']),
      difficulty: 'beginner', duration: 40, calories: 120, equipment: '无',
      steps: JSON.stringify(['选择开阔安静的场地','穿着宽松舒适','从基础招式学起','动作缓慢柔和，呼吸深长','贵在坚持']),
      benefits: JSON.stringify(['调节血压','改善平衡能力','舒缓压力','修身养性']),
      tips: JSON.stringify(['建议跟专业老师学习','空腹和饭后1小时内不宜练习','持之以恒效果更佳']),
      image_url: ''
    },
    { name: '广场舞', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'weight_loss', 'general']),
      difficulty: 'beginner', duration: 60, calories: 200, equipment: '无',
      steps: JSON.stringify(['选择节奏适中的舞曲','穿着舒适的舞鞋','从简单动作学起','循序渐进增加难度','注意劳逸结合']),
      benefits: JSON.stringify(['愉悦心情','锻炼身体','社交互动','改善睡眠']),
      tips: JSON.stringify(['饭后1小时再跳','注意补充水分','根据身体状况调整强度']),
      image_url: ''
    },
    { name: '爬山', category: 'cardio', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'intermediate', duration: 120, calories: 500, equipment: '登山鞋、登山杖',
      steps: JSON.stringify(['做好充分准备，了解路线','携带足够的水和食物','穿专业登山鞋','循序渐进，不要逞强','下山注意保护膝盖']),
      benefits: JSON.stringify(['增强心肺功能','锻炼下肢力量','亲近自然','释放压力']),
      tips: JSON.stringify(['结伴而行更安全','注意天气变化','带走垃圾，保护环境']),
      image_url: ''
    },
    { name: '羽毛球', category: 'cardio', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 60, calories: 300, equipment: '羽毛球拍、羽毛球',
      steps: JSON.stringify(['充分热身，重点活动手腕和脚踝','学习正确的握拍方式','从基础击球开始','注意跑动步伐','运动后拉伸']),
      benefits: JSON.stringify(['提高反应速度','增强协调性','燃烧脂肪','社交娱乐']),
      tips: JSON.stringify(['选择合适的球拍重量','注意保护膝盖和脚踝','运动前充分热身']),
      image_url: ''
    },
    { name: '乒乓球', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'general']),
      difficulty: 'beginner', duration: 45, calories: 200, equipment: '乒乓球拍、乒乓球、球桌',
      steps: JSON.stringify(['学习正确握拍','从颠球开始练习','练习基本发球和推挡','注意脚步移动','循序渐进提高难度']),
      benefits: JSON.stringify(['提高反应力','锻炼眼手协调','预防近视','社交娱乐']),
      tips: JSON.stringify(['选择合适的球拍','注意保护眼睛','运动后做眼保健操']),
      image_url: ''
    },
    { name: '篮球', category: 'cardio', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'intermediate', duration: 60, calories: 400, equipment: '篮球、篮球场',
      steps: JSON.stringify(['充分热身','从运球和投篮基础开始','注意防守动作规范','避免剧烈碰撞','运动后拉伸']),
      benefits: JSON.stringify(['全身运动','提高协调性','团队协作','增强心肺']),
      tips: JSON.stringify(['佩戴护具减少受伤','注意保护脚踝和膝盖','运动前后拉伸']),
      image_url: ''
    },
    { name: '瑜伽', category: 'cardio', target_conditions: JSON.stringify(['hypertension', 'general']),
      difficulty: 'beginner', duration: 45, calories: 120, equipment: '瑜伽垫',
      steps: JSON.stringify(['选择安静的环境','穿着舒适透气的衣服','从基础体式开始','配合深长呼吸','不要勉强自己']),
      benefits: JSON.stringify(['舒缓压力','提高柔韧性','改善体态','调节身心']),
      tips: JSON.stringify(['空腹练习效果更好','初学者建议跟视频或老师学','每个体式保持呼吸均匀']),
      image_url: ''
    },
    { name: '普拉提', category: 'cardio', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'intermediate', duration: 45, calories: 150, equipment: '瑜伽垫',
      steps: JSON.stringify(['核心收紧是关键','配合呼吸，吸气准备呼气发力','从基础动作开始','注意动作质量而非数量','循序渐进']),
      benefits: JSON.stringify(['强化核心','改善体态','提高柔韧性','塑造线条']),
      tips: JSON.stringify(['动作要慢而有控制','呼吸配合很重要','初学者可以先上私教课']),
      image_url: ''
    },

    // 力量训练
    { name: '深蹲', category: 'strength', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 15, calories: 80, equipment: '无（可加杠铃）',
      steps: JSON.stringify(['双脚与肩同宽，脚尖微外展','核心收紧，背部挺直','臀部向后坐，膝盖不超过脚尖','下蹲至大腿与地面平行','脚跟发力站起']),
      benefits: JSON.stringify(['锻炼下肢力量','促进睾酮分泌','提高代谢','改善体态']),
      tips: JSON.stringify(['膝盖不要内扣','背部保持挺直','初学者先练徒手深蹲']),
      image_url: ''
    },
    { name: '俯卧撑', category: 'strength', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 10, calories: 60, equipment: '无',
      steps: JSON.stringify(['双手略宽于肩','身体成一条直线','核心收紧','屈肘下落至胸部接近地面','发力推起']),
      benefits: JSON.stringify(['锻炼胸肌和三头肌','增强核心力量','提高上肢力量','随时随地可以做']),
      tips: JSON.stringify(['初学者可以跪姿俯卧撑','身体要成一条直线，不要塌腰','下落时吸气，推起时呼气']),
      image_url: ''
    },
    { name: '平板支撑', category: 'strength', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 5, calories: 30, equipment: '瑜伽垫',
      steps: JSON.stringify(['双肘撑地，与肩同宽','身体成一条直线','核心收紧','保持均匀呼吸','从30秒开始逐渐增加']),
      benefits: JSON.stringify(['强化核心肌群','改善体态','提高稳定性','预防腰背痛']),
      tips: JSON.stringify(['不要塌腰或翘臀','保持呼吸均匀','循序渐进增加时间']),
      image_url: ''
    },
    { name: '仰卧起坐', category: 'strength', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 10, calories: 50, equipment: '瑜伽垫',
      steps: JSON.stringify(['仰卧，膝盖弯曲','双手交叉放胸前或轻扶耳边','腹部发力卷起上半身','下背不要离地','缓慢下落，不要用惯性']),
      benefits: JSON.stringify(['锻炼腹肌','增强核心力量','改善体态']),
      tips: JSON.stringify(['不要抱头，用腹部发力','动作要慢，控制速度','呼气卷起，吸气下落']),
      image_url: ''
    },
    { name: '哑铃弯举', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 10, calories: 40, equipment: '哑铃',
      steps: JSON.stringify(['双手握哑铃，自然下垂','大臂贴身体，只有小臂动','弯举时呼气，下放时吸气','控制下放速度','双手可以交替或同时']),
      benefits: JSON.stringify(['锻炼肱二头肌','增加手臂力量','塑造手臂线条']),
      tips: JSON.stringify(['选择合适重量','大臂不要晃动','控制动作速度']),
      image_url: ''
    },
    { name: '哑铃推举', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 10, calories: 50, equipment: '哑铃',
      steps: JSON.stringify(['坐姿或站姿，双手握哑铃举至肩高','核心收紧，背部挺直','发力向上推举，手臂伸直但不锁死','缓慢下放','呼气推举，吸气下放']),
      benefits: JSON.stringify(['锻炼肩部肌肉','增强上肢力量','改善体态']),
      tips: JSON.stringify(['不要借力晃动身体','选择合适的重量','保持核心稳定']),
      image_url: ''
    },
    { name: '哑铃划船', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 10, calories: 50, equipment: '哑铃、凳子',
      steps: JSON.stringify(['单膝跪在凳子上，对侧手撑凳','另一只手握哑铃，自然下垂','背部发力，将哑铃拉向腰部','顶峰收缩1秒','缓慢下放']),
      benefits: JSON.stringify(['锻炼背部肌肉','改善圆肩驼背','增强上肢拉力']),
      tips: JSON.stringify(['背部保持平直','用背阔肌发力，不是手臂','顶峰收缩时挤压肩胛骨']),
      image_url: ''
    },
    { name: '弓步蹲', category: 'strength', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 10, calories: 60, equipment: '无（可加哑铃）',
      steps: JSON.stringify(['双脚前后开立，距离约一步','下蹲至前后腿都成90度','前腿膝盖不超过脚尖','保持身体直立','发力站起，换腿']),
      benefits: JSON.stringify(['锻炼下肢力量','提高平衡能力','塑造臀腿线条']),
      tips: JSON.stringify(['保持身体直立，不要前倾','膝盖不要内扣','初学者可以扶墙保持平衡']),
      image_url: ''
    },
    { name: '臀桥', category: 'strength', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 10, calories: 40, equipment: '瑜伽垫',
      steps: JSON.stringify(['仰卧，膝盖弯曲，双脚踩地','双手放身体两侧','臀部发力向上顶起','身体成一条直线','顶峰收缩2秒，缓慢下落']),
      benefits: JSON.stringify(['锻炼臀部肌肉','改善扁平臀','缓解腰痛','塑造臀线']),
      tips: JSON.stringify(['用臀部发力，不是腰部','顶峰时挤压臀部','可以加杠铃增加难度']),
      image_url: ''
    },
    { name: '卷腹', category: 'strength', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'beginner', duration: 10, calories: 40, equipment: '瑜伽垫',
      steps: JSON.stringify(['仰卧，膝盖弯曲，双手放耳旁','腹部发力，卷起上背部','下背贴地','缓慢下落，不要完全躺平','呼气卷起，吸气下落']),
      benefits: JSON.stringify(['锻炼上腹肌肉','增强核心','比仰卧起坐更安全']),
      tips: JSON.stringify(['不要用手拉头','动作要慢，控制速度','感受腹部肌肉的收缩']),
      image_url: ''
    },
    { name: '俄罗斯转体', category: 'strength', target_conditions: JSON.stringify(['weight_loss', 'general']),
      difficulty: 'intermediate', duration: 10, calories: 50, equipment: '瑜伽垫、哑铃（可选）',
      steps: JSON.stringify(['坐姿，双腿弯曲抬起','身体后仰，腹部收紧','双手合十左右转体','转体时呼气，回正时吸气','可以持哑铃增加难度']),
      benefits: JSON.stringify(['锻炼腹斜肌','收紧腰围','增强核心旋转力量']),
      tips: JSON.stringify(['保持背部挺直','不要用惯性甩动','转体时充分挤压侧腹']),
      image_url: ''
    },
    { name: '引体向上', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'advanced', duration: 10, calories: 60, equipment: '单杠',
      steps: JSON.stringify(['正握单杠，略宽于肩','身体自然下垂','背部发力，将身体向上拉','下巴过杠','缓慢下放']),
      benefits: JSON.stringify(['锻炼背部和手臂','增强上肢拉力','改善体态','增加身高（青少年）']),
      tips: JSON.stringify(['初学者可以用弹力带辅助','下放时也要控制速度','充分沉肩，不要耸肩']),
      image_url: ''
    },
    { name: '硬拉', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'advanced', duration: 15, calories: 80, equipment: '杠铃',
      steps: JSON.stringify(['双脚与髋同宽，脚尖朝前','杠铃靠近小腿','下蹲，双手正握杠铃','背部挺直，核心收紧','脚跟发力，站直身体','缓慢下放']),
      benefits: JSON.stringify(['锻炼全身后链','增加整体力量','提高代谢','改善体态']),
      tips: JSON.stringify(['动作标准比重量重要','一定要收紧核心','初学者先练空手找感觉']),
      image_url: ''
    },
    { name: '卧推', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'intermediate', duration: 15, calories: 70, equipment: '杠铃、卧推凳',
      steps: JSON.stringify(['仰卧在凳上，双脚踩地','双手握杠，略宽于肩','下放杠铃至胸部','发力推起，手臂伸直但不锁死','吸气下放，呼气推起']),
      benefits: JSON.stringify(['锻炼胸肌和三头肌','增加上肢推力','提高上肢力量']),
      tips: JSON.stringify(['最好有保护者','肩胛骨后收下沉','不要弹胸借力']),
      image_url: ''
    },
    { name: '站姿哑铃侧平举', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 10, calories: 40, equipment: '哑铃',
      steps: JSON.stringify(['站姿，双手握哑铃，自然下垂','核心收紧，背部挺直','向两侧举起哑铃至与肩同高','缓慢下放','呼气举起，吸气下放']),
      benefits: JSON.stringify(['锻炼肩中束','塑造直角肩','改善肩部线条']),
      tips: JSON.stringify(['重量不要太大','肘关节微屈','用肩膀发力，不是甩起来']),
      image_url: ''
    },
    { name: '三头肌下压', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 10, calories: 40, equipment: '弹力带或龙门架',
      steps: JSON.stringify(['大臂贴身体，小臂弯曲','三头肌发力，伸直手臂','顶峰收缩1秒','缓慢还原','呼气下压，吸气还原']),
      benefits: JSON.stringify(['锻炼肱三头肌','紧致手臂后侧','增加手臂力量']),
      tips: JSON.stringify(['大臂保持不动','控制下放速度','充分拉伸三头肌']),
      image_url: ''
    },
    { name: '二头弯举', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 10, calories: 40, equipment: '哑铃或杠铃',
      steps: JSON.stringify(['站姿，双手握哑铃','大臂贴身体','二头肌发力弯举','顶峰收缩1秒','缓慢下放']),
      benefits: JSON.stringify(['锻炼肱二头肌','增加手臂力量','塑造手臂线条']),
      tips: JSON.stringify(['不要晃动身体借力','控制下放速度','充分收缩二头肌']),
      image_url: ''
    },
    { name: '小腿提踵', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 10, calories: 30, equipment: '无（可加哑铃）',
      steps: JSON.stringify(['站姿，前脚掌站在台阶边缘','脚跟尽量下沉','小腿发力，踮起脚尖','顶峰收缩2秒','缓慢下落']),
      benefits: JSON.stringify(['锻炼小腿肌肉','提高弹跳力','塑造小腿线条']),
      tips: JSON.stringify(['动作要慢，有控制','可以单腿做增加难度','顶峰时充分收缩']),
      image_url: ''
    },
    { name: '靠墙静蹲', category: 'strength', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 30, equipment: '无',
      steps: JSON.stringify(['背靠墙站立','双脚向前一步','下蹲至大腿与地面平行','膝盖不超过脚尖','保持均匀呼吸']),
      benefits: JSON.stringify(['锻炼大腿肌肉','增强膝盖稳定性','改善下肢力量','保护膝关节']),
      tips: JSON.stringify(['背部贴紧墙','膝盖不要内扣','从30秒开始逐渐增加']),
      image_url: ''
    },

    // 拉伸放松
    { name: '颈部拉伸', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 10, equipment: '无',
      steps: JSON.stringify(['坐直或站直','右手扶头左侧，轻轻向右拉','保持15-30秒','换另一侧','前后各方向都要拉伸']),
      benefits: JSON.stringify(['缓解颈部紧张','改善颈椎不适','增加颈部活动度']),
      tips: JSON.stringify(['动作要轻柔，不要用力过猛','不要转圈式拉伸','每个方向保持呼吸均匀']),
      image_url: ''
    },
    { name: '肩部拉伸', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 10, equipment: '无',
      steps: JSON.stringify(['右臂横过胸前','左手抱住右肘','轻轻向左拉','感受肩部拉伸','保持15-30秒，换边']),
      benefits: JSON.stringify(['放松肩部肌肉','增加肩关节活动度','缓解肩颈酸痛']),
      tips: JSON.stringify(['保持身体直立，不要歪身','拉伸感在可接受范围内','配合深呼吸']),
      image_url: ''
    },
    { name: '胸部拉伸', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 10, equipment: '门框',
      steps: JSON.stringify(['站在门框旁','小臂贴在门框上','身体向前倾','感受胸部拉伸','保持15-30秒']),
      benefits: JSON.stringify(['拉伸胸肌','改善圆肩驼背','增加胸廓活动度']),
      tips: JSON.stringify(['不要过度前倾','保持呼吸均匀','可以上下调整手臂位置']),
      image_url: ''
    },
    { name: '背部拉伸', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 10, equipment: '无',
      steps: JSON.stringify(['坐姿，双腿伸直','身体向前倾，双手够脚尖','感受背部和大腿后侧拉伸','保持15-30秒','也可以用猫牛式活动脊柱']),
      benefits: JSON.stringify(['放松背部肌肉','增加脊柱灵活性','缓解腰背酸痛']),
      tips: JSON.stringify(['不要弓背猛拉','循序渐进，不要勉强','配合深呼吸']),
      image_url: ''
    },
    { name: '大腿前侧拉伸', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 10, equipment: '无',
      steps: JSON.stringify(['单腿站立','另一只脚向后抬，手抓住脚踝','膝盖指向地面','感受大腿前侧拉伸','保持15-30秒，换边']),
      benefits: JSON.stringify(['拉伸股四头肌','缓解大腿前侧紧张','改善腿部线条']),
      tips: JSON.stringify(['可以扶墙保持平衡','膝盖不要外翻','保持身体直立']),
      image_url: ''
    },
    { name: '大腿后侧拉伸', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 10, equipment: '无',
      steps: JSON.stringify(['坐姿，一腿伸直，一腿弯曲','身体向前倾，双手够脚尖','感受大腿后侧拉伸','保持15-30秒','换另一侧']),
      benefits: JSON.stringify(['拉伸腘绳肌','增加髋关节灵活性','预防运动损伤']),
      tips: JSON.stringify(['背部保持挺直','不要弓背猛拉','呼气时加深拉伸']),
      image_url: ''
    },
    { name: '小腿拉伸', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 10, equipment: '墙',
      steps: JSON.stringify(['面对墙站立','一腿在前弯曲，一腿在后伸直','后脚跟着地，身体向前倾','感受小腿拉伸','保持15-30秒，换边']),
      benefits: JSON.stringify(['拉伸腓肠肌','缓解小腿紧张','预防小腿抽筋']),
      tips: JSON.stringify(['后脚脚跟不要离地','身体保持直立','可以调整角度拉伸不同部位']),
      image_url: ''
    },
    { name: '髋部拉伸', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 5, calories: 10, equipment: '瑜伽垫',
      steps: JSON.stringify(['鸽子式：前腿弯曲，后腿伸直','身体向前倾','感受髋部拉伸','保持15-30秒','换另一侧']),
      benefits: JSON.stringify(['拉伸髋部肌群','改善髋关节活动度','缓解久坐不适']),
      tips: JSON.stringify(['动作要轻柔，不要勉强','可以用抱枕垫高髋部','配合深呼吸']),
      image_url: ''
    },
    { name: '全身放松', category: 'stretch', target_conditions: JSON.stringify(['general']),
      difficulty: 'beginner', duration: 10, calories: 15, equipment: '瑜伽垫',
      steps: JSON.stringify(['婴儿式：跪坐，身体前倾，手臂向前伸展','保持30秒-1分钟','然后仰卧，四肢摊开','深呼吸，放松全身','保持2-3分钟']),
      benefits: JSON.stringify(['全身放松','舒缓压力','改善睡眠','缓解疲劳']),
      tips: JSON.stringify(['选择安静舒适的环境','配合腹式呼吸','可以放轻音乐']),
      image_url: ''
    },
  ];

  // 插入运动数据
  const insertExercise = db.prepare(`
    INSERT OR IGNORE INTO exercises (name, category, target_conditions, difficulty, duration, calories, calories_per_hour, equipment, muscle_groups, steps, benefits, tips, common_mistakes, variations, image_url, video_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const existingExNames = db.prepare('SELECT name FROM exercises').all().map(r => r.name);
  let newExerciseCount = 0;

  for (const ex of exercises) {
    if (!existingExNames.includes(ex.name)) {
      const info = insertExercise.run(
        ex.name, ex.category, ex.target_conditions, ex.difficulty,
        ex.duration, ex.calories, (ex.calories_per_hour || null), ex.equipment,
        (ex.muscle_groups || null),
        ex.steps, ex.benefits, ex.tips,
        (ex.common_mistakes || null), (ex.variations || null),
        ex.image_url, (ex.video_url || ''), (ex.description || '')
      );
      if (info.changes > 0) newExerciseCount++;
    }
  }

  const finalExerciseCount = db.prepare('SELECT COUNT(*) as count FROM exercises').get().count;
  console.log(`[DB] 运动插入完成，新增 ${newExerciseCount} 项，总计 ${finalExerciseCount} 项`);
}


// ========== 演示账号初始化 ==========
function initDemoUser() {
  const bcrypt = require('bcryptjs');
  
  const demoLoginName = 'demo';
  const demoPassword = 'demo123';
  const demoPhone = '13000000000';
  
  // 检查演示账号是否已存在
  const existing = db.prepare('SELECT id FROM users WHERE login_name = ?').get(demoLoginName);
  if (existing) {
    console.log('[DB] 演示账号已存在，跳过创建');
    return;
  }
  
  // 创建演示账号
  const passwordHash = bcrypt.hashSync(demoPassword, 10);
  const result = db.prepare(
    'INSERT INTO users (phone, login_name, password_hash, role, status) VALUES (?, ?, ?, ?, ?)'
  ).run(demoPhone, demoLoginName, passwordHash, 'user', 'active');
  
  const userId = result.lastInsertRowid;
  
  // 创建演示用户的健康档案
  db.prepare('INSERT INTO user_profiles (user_id, height, weight, age, gender, occupation, diet_habits, sleep_habits, exercise_habits) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(userId, 170, 65, 30, 'male', 'office', 'irregular', 'poor', 'sometimes');
  
  // 创建社区档案
  const avatarSeed = 'user_' + userId + '_demo';
  db.prepare(
    'INSERT INTO community_profiles (user_id, nickname, avatar_seed) VALUES (?, ?, ?)'
  ).run(userId, '养生达人001', avatarSeed);
  
  // 添加一些健康指标记录（value使用JSON格式，与后端解析兼容）
  db.prepare(
    'INSERT INTO health_metrics (user_id, metric_type, value) VALUES (?, ?, ?)'
  ).run(userId, 'blood_pressure', JSON.stringify({ systolic: 125, diastolic: 82 }));
  db.prepare(
    'INSERT INTO health_metrics (user_id, metric_type, value) VALUES (?, ?, ?)'
  ).run(userId, 'blood_sugar', JSON.stringify({ fasting: 5.6 }));
  db.prepare(
    'INSERT INTO health_metrics (user_id, metric_type, value) VALUES (?, ?, ?)'
  ).run(userId, 'heart_rate', '72');
  
  console.log('[DB] 演示账号创建成功: demo / demo123');
}
// 导出初始化函数和数据库对象
module.exports = {
  db,
  initDatabase
};
