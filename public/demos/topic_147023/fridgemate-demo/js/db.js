/**
 * FridgeMate 数据库模块
 * 基于 sql.js (SQLite WebAssembly)，浏览器端持久化
 */

const FridgeDB = (() => {
  const DB_KEY = 'fridgemate_db';
  const CATEGORIES = ['肉类', '蔬菜', '水果', '乳制品', '饮料', '调味品', '冷冻食品', '其他'];

  // 冰箱类型预设
  const FRIDGE_TYPES = {
    '双门冰箱': {
      icon: '🧊',
      zones: [
        { zone: '冷藏', locations: ['冷藏门架', '冷藏上层', '冷藏下层'] },
        { zone: '冷冻', locations: ['冷冻上层', '冷冻下层'] }
      ]
    },
    '三门冰箱': {
      icon: '🪣',
      zones: [
        { zone: '冷藏', locations: ['冷藏门架', '冷藏上层', '冷藏下层'] },
        { zone: '变温', locations: ['变温室'] },
        { zone: '冷冻', locations: ['冷冻上层', '冷冻中层', '冷冻下层'] }
      ]
    },
    '对开门冰箱': {
      icon: '🗄️',
      zones: [
        { zone: '冷藏', locations: ['冷藏左区', '冷藏右区', '冷藏门架'] },
        { zone: '冷冻', locations: ['冷冻左区', '冷冻右区'] }
      ]
    },
    '法式冰箱': {
      icon: '✨',
      zones: [
        { zone: '冷藏', locations: ['冷藏门架', '冷藏上层', '冷藏下层', '果蔬抽屉'] },
        { zone: '冷冻', locations: ['冷冻上层', '冷冻下层'] }
      ]
    }
  };

  let currentFridgeType = '三门冰箱';
  let locations = [];

  let db = null;

  // ========== 初始化 ==========
  async function init() {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });

    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      db = new SQL.Database(new Uint8Array(arr));
    } else {
      db = new SQL.Database();
    }

    createTables();
    loadFridgeConfig();
    seedIfEmpty();
    return db;
  }

  function createTables() {
    db.run(`
      CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        emoji TEXT DEFAULT '📦',
        category TEXT NOT NULL DEFAULT '其他',
        location TEXT NOT NULL DEFAULT '冷藏上层',
        quantity REAL NOT NULL DEFAULT 1,
        unit TEXT NOT NULL DEFAULT '个',
        added_date TEXT NOT NULL DEFAULT (date('now','localtime')),
        expiry_date TEXT,
        status TEXT NOT NULL DEFAULT '新鲜',
        note TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_id INTEGER,
        remind_at TEXT NOT NULL,
        message TEXT NOT NULL,
        done INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (food_id) REFERENCES foods(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  function loadFridgeConfig() {
    const row = queryAll('SELECT value FROM settings WHERE key = ?', ['fridge_type']);
    if (row.length > 0) {
      currentFridgeType = row[0].value;
    } else {
      exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['fridge_type', '三门冰箱']);
    }
    updateLocations();
  }

  function updateLocations() {
    const type = FRIDGE_TYPES[currentFridgeType];
    locations = [];
    if (type) {
      for (const zone of type.zones) {
        locations.push(...zone.locations);
      }
    }
  }

  function setFridgeType(type) {
    if (!FRIDGE_TYPES[type]) return false;
    currentFridgeType = type;
    exec('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['fridge_type', type]);
    updateLocations();
    return true;
  }

  function getFridgeConfig() {
    return {
      type: currentFridgeType,
      icon: FRIDGE_TYPES[currentFridgeType]?.icon || '🧊',
      zones: FRIDGE_TYPES[currentFridgeType]?.zones || [],
      locations: locations
    };
  }

  function getFridgeTypes() {
    return Object.entries(FRIDGE_TYPES).map(([name, config]) => ({
      name, icon: config.icon, zones: config.zones
    }));
  }

  function seedIfEmpty() {
    const count = db.exec('SELECT COUNT(*) as c FROM foods');
    if (count.length > 0 && count[0].values[0][0] > 0) return;

    const today = new Date();
    const fmt = d => d.toISOString().split('T')[0];
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return fmt(r); };

    const seeds = [
      ['牛奶', '🥛', '乳制品', '冷藏门架', 1, '桶', fmt(today), addDays(today, 1), '临期', ''],
      ['鸡蛋', '🥚', '其他', '冷藏门架', 2, '个', fmt(today), addDays(today, 6), '新鲜', ''],
      ['青菜', '🥬', '蔬菜', '冷藏上层', 0, '把', addDays(today, -3), addDays(today, -1), '已吃完', ''],
      ['冰棍', '🍦', '冷冻食品', '冷冻上层', 5, '根', addDays(today, -3), addDays(today, 27), '新鲜', ''],
      ['鸡胸肉', '🍗', '肉类', '冷冻中层', 1, '块', addDays(today, -5), addDays(today, 25), '新鲜', ''],
      ['五花肉', '🥩', '肉类', '冷冻下层', 1, '块', addDays(today, -3), addDays(today, 27), '新鲜', ''],
    ];

    const stmt = db.prepare(
      'INSERT INTO foods (name, emoji, category, location, quantity, unit, added_date, expiry_date, status, note) VALUES (?,?,?,?,?,?,?,?,?,?)'
    );
    for (const s of seeds) {
      stmt.run(s);
    }
    stmt.free();
    persist();
  }

  // ========== 持久化 ==========
  function persist() {
    const data = db.export();
    const arr = Array.from(data);
    localStorage.setItem(DB_KEY, JSON.stringify(arr));
  }

  // ========== 食材 CRUD ==========
  function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  function exec(sql, params = []) {
    db.run(sql, params);
    persist();
  }

  function getFoods(filters = {}) {
    let sql = 'SELECT * FROM foods WHERE 1=1';
    const params = [];

    if (filters.category) { sql += ' AND category = ?'; params.push(filters.category); }
    if (filters.location) { sql += ' AND location = ?'; params.push(filters.location); }
    if (filters.status) { sql += ' AND status = ?'; params.push(filters.status); }
    if (filters.excludeStatus) { sql += ' AND status != ?'; params.push(filters.excludeStatus); }

    sql += ' ORDER BY CASE status WHEN "已过期" THEN 0 WHEN "临期" THEN 1 WHEN "已吃完" THEN 3 ELSE 2 END, expiry_date ASC';
    return queryAll(sql, params);
  }

  function addFood(food) {
    exec(
      `INSERT INTO foods (name, emoji, category, location, quantity, unit, added_date, expiry_date, status, note)
       VALUES (?,?,?,?,?,?,date('now','localtime'),?,?,?)`,
      [food.name, food.emoji || '📦', food.category || '其他', food.location || '冷藏上层',
       food.quantity || 1, food.unit || '个', food.expiry_date || null, food.status || '新鲜', food.note || '']
    );
  }

  function updateFood(id, fields) {
    const sets = [];
    const params = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = ?`);
      params.push(v);
    }
    params.push(id);
    exec(`UPDATE foods SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  function deleteFood(id) {
    exec('DELETE FROM foods WHERE id = ?', [id]);
  }

  function consumeFood(id) {
    const food = queryAll('SELECT * FROM foods WHERE id = ?', [id])[0];
    if (!food) return;
    if (food.quantity <= 1) {
      updateFood(id, { status: '已吃完', quantity: 0 });
    } else {
      updateFood(id, { quantity: food.quantity - 1 });
    }
  }

  // ========== 状态刷新 ==========
  function refreshStatus() {
    const today = new Date().toISOString().split('T')[0];
    // 过期检查
    exec(`UPDATE foods SET status = '已过期' WHERE status != '已吃完' AND expiry_date IS NOT NULL AND expiry_date < ?`, [today]);
    // 临期检查（3天内过期）
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    exec(`UPDATE foods SET status = '临期' WHERE status = '新鲜' AND expiry_date IS NOT NULL AND expiry_date <= ?`, [threeDaysLater.toISOString().split('T')[0]]);
  }

  // ========== 提醒 CRUD ==========
  function getReminders(pendingOnly = true) {
    let sql = 'SELECT r.*, f.name as food_name, f.emoji as food_emoji FROM reminders r LEFT JOIN foods f ON r.food_id = f.id';
    if (pendingOnly) sql += ' WHERE r.done = 0 AND r.remind_at > datetime("now","localtime")';
    sql += ' ORDER BY r.remind_at ASC';
    return queryAll(sql);
  }

  function addReminder(food_id, remind_at, message) {
    exec('INSERT INTO reminders (food_id, remind_at, message) VALUES (?,?,?)', [food_id || null, remind_at, message]);
  }

  function markReminderDone(id) {
    exec('UPDATE reminders SET done = 1 WHERE id = ?', [id]);
  }

  // ========== 统计 ==========
  function getStats() {
    const total = queryAll('SELECT COUNT(*) as c FROM foods WHERE status != "已吃完"')[0].c;
    const urgent = queryAll('SELECT COUNT(*) as c FROM foods WHERE status = "临期" OR status = "已过期"')[0].c;
    const consumed = queryAll('SELECT COUNT(*) as c FROM foods WHERE status = "已吃完"')[0].c;
    return { total, urgent, consumed };
  }

  // ========== 重置 ==========
  function reset() {
    db.run('DROP TABLE IF EXISTS foods');
    db.run('DROP TABLE IF EXISTS reminders');
    db.run('DROP TABLE IF EXISTS settings');
    createTables();
    loadFridgeConfig();
    seedIfEmpty();
  }

  return {
    init, getFoods, addFood, updateFood, deleteFood, consumeFood,
    refreshStatus, getReminders, addReminder, markReminderDone,
    getStats, reset,
    CATEGORIES, getFridgeConfig, setFridgeType, getFridgeTypes,
    get locations() { return locations; }
  };
})();