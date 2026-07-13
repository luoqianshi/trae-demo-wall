const express = require('express');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, 'data', 'wardrobe.db');
let db = null;

async function initDatabase() {
  try {
    const SQL = await initSqlJs({});
    
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
      createTables();
      insertDefaultItems();
      saveDatabase();
    }
    console.log('Connected to SQLite database');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
}

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cat TEXT NOT NULL,
    color TEXT NOT NULL,
    emoji TEXT NOT NULL,
    season TEXT DEFAULT '四季',
    scene TEXT DEFAULT '通勤',
    note TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_worn TIMESTAMP NULL
  )`);
}

function insertDefaultItems() {
  const defaultItems = [
    { name: '白衬衫', cat: '上装', color: '白色', emoji: '👔', season: '四季', scene: '通勤' },
    { name: '深蓝西裤', cat: '下装', color: '深蓝', emoji: '👖', season: '四季', scene: '通勤' },
    { name: '灰色卫衣', cat: '上装', color: '灰色', emoji: '👕', season: '春秋', scene: '休闲' },
    { name: '牛仔裤', cat: '下装', color: '蓝色', emoji: '👖', season: '四季', scene: '休闲' },
    { name: '黑色西裤', cat: '下装', color: '黑色', emoji: '👖', season: '四季', scene: '通勤' },
    { name: '卡其半裙', cat: '下装', color: '卡其', emoji: '👗', season: '春秋', scene: '休闲' },
    { name: '米色风衣', cat: '上装', color: '米色', emoji: '🧥', season: '春秋', scene: '通勤' },
    { name: '杏色毛衣', cat: '上装', color: '杏色', emoji: '🧶', season: '冬季', scene: '休闲' },
    { name: '驼色围巾', cat: '配饰', color: '驼色', emoji: '🧣', season: '冬季', scene: '通勤' },
    { name: '乐福鞋', cat: '鞋包', color: '黑色', emoji: '👞', season: '四季', scene: '通勤' },
    { name: '帆布鞋', cat: '鞋包', color: '白色', emoji: '👟', season: '四季', scene: '休闲' },
    { name: '白T恤', cat: '上装', color: '白色', emoji: '👕', season: '夏季', scene: '休闲' }
  ];

  const stmt = db.prepare('INSERT INTO items (name, cat, color, emoji, season, scene) VALUES (?, ?, ?, ?, ?, ?)');
  defaultItems.forEach(item => {
    stmt.run(item.name, item.cat, item.color, item.emoji, item.season, item.scene);
  });
  stmt.free();
  console.log(`Inserted ${defaultItems.length} default items`);
}

function saveDatabase() {
  try {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (err) {
    console.error('Error saving database:', err.message);
  }
}

function getRowAsObject(statement) {
  const columns = statement.getColumnNames();
  const values = statement.get();
  if (!values) return null;
  const result = {};
  columns.forEach((col, idx) => {
    result[col] = values[idx];
  });
  return result;
}

function getAllRowsAsObjects(statement) {
  const columns = statement.getColumnNames();
  const results = [];
  while (statement.step()) {
    const row = {};
    columns.forEach((col, idx) => {
      row[col] = statement.get()[idx];
    });
    results.push(row);
  }
  return results;
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/items', (req, res) => {
  const { cat, color, season, scene } = req.query;
  let query = 'SELECT * FROM items ORDER BY created_at DESC';
  const params = [];

  if (cat) {
    query = 'SELECT * FROM items WHERE cat = ? ORDER BY created_at DESC';
    params.push(cat);
  }

  try {
    const stmt = db.prepare(query);
    const rows = getAllRowsAsObjects(stmt);
    stmt.free();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
    stmt.run(id);
    const row = getRowAsObject(stmt);
    stmt.free();
    if (!row) {
      res.status(404).json({ error: 'Item not found' });
    } else {
      res.json(row);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items', (req, res) => {
  const { name, cat, color, emoji, season, scene, note } = req.body;
  if (!name || !cat || !color || !emoji) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO items (name, cat, color, emoji, season, scene, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(name, cat, color, emoji, season || '四季', scene || '通勤', note || '');
    stmt.free();
    
    const lastStmt = db.prepare('SELECT * FROM items ORDER BY id DESC LIMIT 1');
    lastStmt.run();
    const row = getRowAsObject(lastStmt);
    lastStmt.free();
    
    saveDatabase();
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { name, cat, color, emoji, season, scene, note, last_worn } = req.body;

  try {
    const stmt = db.prepare(
      'UPDATE items SET name = ?, cat = ?, color = ?, emoji = ?, season = ?, scene = ?, note = ?, last_worn = ? WHERE id = ?'
    );
    stmt.run(name, cat, color, emoji, season, scene, note, last_worn, id);
    const changes = stmt.get()[0];
    stmt.free();
    
    if (changes === 0) {
      res.status(404).json({ error: 'Item not found' });
    } else {
      const getStmt = db.prepare('SELECT * FROM items WHERE id = ?');
      getStmt.run(id);
      const row = getRowAsObject(getStmt);
      getStmt.free();
      saveDatabase();
      res.json(row);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM items WHERE id = ?');
    stmt.run(id);
    const changes = stmt.get()[0];
    stmt.free();
    
    if (changes === 0) {
      res.status(404).json({ error: 'Item not found' });
    } else {
      saveDatabase();
      res.json({ message: 'Item deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/count', (req, res) => {
  try {
    const stmt = db.prepare('SELECT COUNT(*) AS count FROM items');
    stmt.run();
    const row = getRowAsObject(stmt);
    stmt.free();
    res.json({ count: row.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
