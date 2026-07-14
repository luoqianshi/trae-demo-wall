const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
const dbPath = path.join(__dirname, 'learnnote.db');

async function initDB() {
    if (db) return;
    
    const SQL = await initSqlJs();
    
    if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath);
        db = new SQL.Database(data);
    } else {
        db = new SQL.Database();
        createTables();
        saveDB();
    }
}

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tag TEXT NOT NULL,
            file_path TEXT NOT NULL,
            size INTEGER NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            scan_time DATETIME NOT NULL,
            is_favorite INTEGER DEFAULT 0,
            UNIQUE(file_path)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT DEFAULT '#16a34a',
            created_at DATETIME NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            directory TEXT NOT NULL,
            note_count INTEGER NOT NULL,
            scan_time DATETIME NOT NULL
        )
    `);
}

function saveDB() {
    if (db) {
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
    }
}

function inferTag(filePath, content) {
    const lower = (filePath + content).toLowerCase();
    const rules = [
        { tag: '前端', keywords: ['react', 'vue', 'css', 'html', 'javascript', 'typescript'] },
        { tag: '后端', keywords: ['node', 'java', 'python', 'go', 'server', 'api', 'express'] },
        { tag: '工具', keywords: ['git', 'docker', 'webpack', 'vite', 'npm', 'vscode'] },
        { tag: '随笔', keywords: ['心得', '日记', '笔记', '感悟', 'thought'] },
        { tag: '数据库', keywords: ['mysql', 'postgres', 'mongodb', 'redis', 'sql'] },
        { tag: '算法', keywords: ['algorithm', '算法', 'leetcode', '数据结构'] }
    ];
    for (const rule of rules) {
        if (rule.keywords.some(k => lower.includes(k))) return rule.tag;
    }
    return '其他';
}

function extractTitle(content) {
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('# ')) return line.slice(2).trim();
    }
    return null;
}

const Notes = {
    getAll: (callback) => {
        try {
            const stmt = db.prepare('SELECT * FROM notes ORDER BY created_at DESC');
            const notes = [];
            while (stmt.step()) {
                notes.push(stmt.getAsObject());
            }
            stmt.free();
            callback(null, notes);
        } catch (err) {
            callback(err);
        }
    },

    getById: (id, callback) => {
        try {
            const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
            stmt.bind([id]);
            let note = null;
            if (stmt.step()) {
                note = stmt.getAsObject();
            }
            stmt.free();
            callback(null, note);
        } catch (err) {
            callback(err);
        }
    },

    getByTag: (tag, callback) => {
        try {
            const stmt = db.prepare('SELECT * FROM notes WHERE tag = ? ORDER BY created_at DESC');
            stmt.bind([tag]);
            const notes = [];
            while (stmt.step()) {
                notes.push(stmt.getAsObject());
            }
            stmt.free();
            callback(null, notes);
        } catch (err) {
            callback(err);
        }
    },

    getByTimeRange: (startDate, endDate, callback) => {
        try {
            const stmt = db.prepare('SELECT * FROM notes WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC');
            stmt.bind([startDate, endDate]);
            const notes = [];
            while (stmt.step()) {
                notes.push(stmt.getAsObject());
            }
            stmt.free();
            callback(null, notes);
        } catch (err) {
            callback(err);
        }
    },

    search: (query, callback) => {
        try {
            const likeQuery = `%${query}%`;
            const stmt = db.prepare('SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC');
            stmt.bind([likeQuery, likeQuery]);
            const notes = [];
            while (stmt.step()) {
                notes.push(stmt.getAsObject());
            }
            stmt.free();
            callback(null, notes);
        } catch (err) {
            callback(err);
        }
    },

    createOrUpdate: (note, callback) => {
        try {
            const stmt = db.prepare(
                'INSERT OR REPLACE INTO notes (title, content, tag, file_path, size, created_at, updated_at, scan_time, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            stmt.bind([note.title, note.content, note.tag, note.filePath, note.size, note.createdAt, note.updatedAt, note.scanTime, note.isFavorite || 0]);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    update: (id, data, callback) => {
        try {
            const updates = [];
            const values = [];
            
            if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
            if (data.content !== undefined) { updates.push('content = ?'); values.push(data.content); }
            if (data.tag !== undefined) { updates.push('tag = ?'); values.push(data.tag); }
            if (data.isFavorite !== undefined) { updates.push('is_favorite = ?'); values.push(data.isFavorite); }
            updates.push('updated_at = ?'); values.push(new Date().toISOString());
            values.push(id);

            const stmt = db.prepare(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`);
            stmt.bind(values);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    toggleFavorite: (id, callback) => {
        try {
            db.run('UPDATE notes SET is_favorite = 1 - is_favorite WHERE id = ?', [id]);
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    getFavorites: (callback) => {
        try {
            const stmt = db.prepare('SELECT * FROM notes WHERE is_favorite = 1 ORDER BY updated_at DESC');
            const notes = [];
            while (stmt.step()) {
                notes.push(stmt.getAsObject());
            }
            stmt.free();
            callback(null, notes);
        } catch (err) {
            callback(err);
        }
    },

    batchDelete: (ids, callback) => {
        try {
            const placeholders = ids.map(() => '?').join(',');
            const stmt = db.prepare(`DELETE FROM notes WHERE id IN (${placeholders})`);
            stmt.bind(ids);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    deleteById: (id, callback) => {
        try {
            const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
            stmt.bind([id]);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    deleteByFilePath: (filePath, callback) => {
        try {
            const stmt = db.prepare('DELETE FROM notes WHERE file_path = ?');
            stmt.bind([filePath]);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    clearAll: (callback) => {
        try {
            db.run('DELETE FROM notes');
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    getStats: (callback) => {
        try {
            let total = 0;
            const totalStmt = db.prepare('SELECT COUNT(*) as total FROM notes');
            if (totalStmt.step()) {
                total = totalStmt.getAsObject().total || 0;
            }
            totalStmt.free();

            const today = new Date().toISOString().split('T')[0];
            let todayCount = 0;
            const todayStmt = db.prepare('SELECT COUNT(*) as today FROM notes WHERE DATE(created_at) = ?');
            todayStmt.bind([today]);
            if (todayStmt.step()) {
                todayCount = todayStmt.getAsObject().today || 0;
            }
            todayStmt.free();

            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            let weekCount = 0;
            const weekStmt = db.prepare('SELECT COUNT(*) as week FROM notes WHERE DATE(created_at) >= ?');
            weekStmt.bind([weekAgo]);
            if (weekStmt.step()) {
                weekCount = weekStmt.getAsObject().week || 0;
            }
            weekStmt.free();

            const favoriteStmt = db.prepare('SELECT COUNT(*) as favorites FROM notes WHERE is_favorite = 1');
            let favoriteCount = 0;
            if (favoriteStmt.step()) {
                favoriteCount = favoriteStmt.getAsObject().favorites || 0;
            }
            favoriteStmt.free();

            const tagStmt = db.prepare('SELECT tag, COUNT(*) as count FROM notes GROUP BY tag');
            const tags = [];
            while (tagStmt.step()) {
                tags.push(tagStmt.getAsObject());
            }
            tagStmt.free();

            callback(null, {
                total: total,
                today: todayCount,
                week: weekCount,
                favorites: favoriteCount,
                tags: tags
            });
        } catch (err) {
            callback(err);
        }
    },

    getTags: (callback) => {
        try {
            const stmt = db.prepare('SELECT DISTINCT tag FROM notes ORDER BY tag');
            const tags = [];
            while (stmt.step()) {
                tags.push(stmt.getAsObject().tag);
            }
            stmt.free();
            callback(null, tags);
        } catch (err) {
            callback(err);
        }
    }
};

const Tags = {
    getAll: (callback) => {
        try {
            const stmt = db.prepare('SELECT * FROM tags ORDER BY name');
            const tags = [];
            while (stmt.step()) {
                tags.push(stmt.getAsObject());
            }
            stmt.free();
            callback(null, tags);
        } catch (err) {
            callback(err);
        }
    },

    add: (name, color, callback) => {
        try {
            const stmt = db.prepare('INSERT OR IGNORE INTO tags (name, color, created_at) VALUES (?, ?, ?)');
            stmt.bind([name, color || '#16a34a', new Date().toISOString()]);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    delete: (name, callback) => {
        try {
            db.run('UPDATE notes SET tag = "其他" WHERE tag = ?', [name]);
            const stmt = db.prepare('DELETE FROM tags WHERE name = ?');
            stmt.bind([name]);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    update: (name, newName, color, callback) => {
        try {
            db.run('UPDATE notes SET tag = ? WHERE tag = ?', [newName, name]);
            const stmt = db.prepare('UPDATE tags SET name = ?, color = ? WHERE name = ?');
            stmt.bind([newName, color, name]);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    }
};

const ScanHistory = {
    add: (directory, noteCount, callback) => {
        try {
            const stmt = db.prepare('INSERT INTO scan_history (directory, note_count, scan_time) VALUES (?, ?, ?)');
            stmt.bind([directory, noteCount, new Date().toISOString()]);
            stmt.step();
            stmt.free();
            saveDB();
            callback(null);
        } catch (err) {
            callback(err);
        }
    },

    getAll: (callback) => {
        try {
            const stmt = db.prepare('SELECT * FROM scan_history ORDER BY scan_time DESC LIMIT 10');
            const history = [];
            while (stmt.step()) {
                history.push(stmt.getAsObject());
            }
            stmt.free();
            callback(null, history);
        } catch (err) {
            callback(err);
        }
    }
};

module.exports = {
    initDB,
    Notes,
    Tags,
    ScanHistory,
    inferTag,
    extractTitle
};