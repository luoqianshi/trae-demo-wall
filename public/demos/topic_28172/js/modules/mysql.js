// MySQL 直连模块（纯前端模拟）
class MySQLPlugin {
    constructor() {
        this.title = 'MySQL 直连';
        this.databases = {};
        this.currentDB = null;
        this.connectionName = null;
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;height:calc(100vh - 180px);min-height:500px;">
                <!-- 左侧：数据库列表 -->
                <div style="display:grid;gap:12px;align-content:start;">
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">连接配置（本地模式）</div>
                        <div style="display:grid;gap:8px;">
                            <input type="text" id="mysql-name" placeholder="连接名称" value="local-mysql" style="padding:8px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;">
                            <button class="btn btn-primary" onclick="app.modules.mysql.connect()" style="padding:8px;">连接</button>
                            <button class="btn btn-secondary" onclick="app.modules.mysql.disconnect()" style="padding:6px;">断开</button>
                        </div>
                    </div>

                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;overflow-y:auto;max-height:calc(100% - 180px);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="font-size:12px;color:var(--text-secondary);">数据库</div>
                            <button class="btn btn-secondary" onclick="app.modules.mysql.createDB()" style="padding:2px 8px;font-size:11px;">+ 新建</button>
                        </div>
                        <div id="mysql-db-list" style="display:grid;gap:4px;">
                            <div style="font-size:12px;color:var(--text-secondary);text-align:center;padding:20px;">请先连接</div>
                        </div>
                    </div>
                </div>

                <!-- 右侧：SQL 执行 + 表操作 -->
                <div style="display:grid;gap:12px;align-content:start;">
                    <!-- 当前数据库信息 -->
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="font-size:12px;color:var(--text-secondary);">
                                当前: <span id="mysql-current-db" style="color:var(--text-primary);font-weight:500;">(none)</span>
                            </div>
                            <button class="btn btn-secondary" onclick="app.modules.mysql.createTable()" style="padding:4px 10px;font-size:11px;">+ 新建表</button>
                        </div>
                        <div id="mysql-tables" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;"></div>
                    </div>

                    <!-- SQL 编辑器 -->
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="font-size:12px;color:var(--text-secondary);">SQL 查询</div>
                            <button class="btn btn-primary" onclick="app.modules.mysql.execSQL()" style="padding:6px 16px;font-size:12px;">执行 (Ctrl+Enter)</button>
                        </div>
                        <textarea id="mysql-sql" placeholder="SELECT * FROM users;&#10;SHOW TABLES;&#10;CREATE TABLE users (id INT, name VARCHAR(50), age INT);&#10;INSERT INTO users VALUES (1, '张三', 25);&#10;DROP TABLE users;" onkeydown="if(event.ctrlKey&&event.key==='Enter')app.modules.mysql.execSQL()" style="width:100%;min-height:120px;padding:10px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-family:monospace;font-size:13px;"></textarea>
                        <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);">
                            支持: CREATE TABLE, DROP TABLE, INSERT, UPDATE, DELETE, SELECT, SHOW TABLES, SHOW DATABASES
                        </div>
                    </div>

                    <!-- 结果输出 -->
                    <div style="flex:1;padding:12px;background:var(--bg-card);border-radius:8px;overflow-y:auto;min-height:200px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">执行结果</div>
                        <div id="mysql-output" style="font-size:13px;color:var(--text-primary);">(empty)</div>
                    </div>
                </div>
            </div>
        `;
    }

    connect() {
        const name = document.getElementById('mysql-name').value.trim();
        if (!name) {
            app.setStatus('请输入连接名称', 'error');
            return;
        }

        this.connectionName = name;
        const storageKey = `devtools_mysql_${name}`;
        const stored = localStorage.getItem(storageKey);
        this.databases = stored ? JSON.parse(stored) : {};

        if (Object.keys(this.databases).length === 0) {
            // 创建默认数据库和表
            this.databases['test'] = {
                users: [
                    { id: 1, name: '张三', age: 25 },
                    { id: 2, name: '李四', age: 30 },
                    { id: 3, name: '王五', age: 22 }
                ],
                orders: [
                    { id: 101, user_id: 1, product: 'iPhone', price: 6999 },
                    { id: 102, user_id: 2, product: 'MacBook', price: 12999 }
                ]
            };
            this.save();
        }

        this.currentDB = Object.keys(this.databases)[0];
        this.refreshDBList();
        this.refreshTables();
        document.getElementById('mysql-output').innerHTML = `
            <div style="color:var(--success);">[OK] Connected to "${name}"</div>
            <div style="color:var(--text-secondary);margin-top:8px;">已切换到: <span style="color:var(--text-primary);">${this.currentDB}</span></div>
            <div style="color:var(--text-secondary);">可用数据库: ${Object.keys(this.databases).join(', ')}</div>
        `;
        app.setStatus(`已连接到 ${name}`);
    }

    disconnect() {
        this.databases = {};
        this.currentDB = null;
        this.connectionName = null;
        document.getElementById('mysql-db-list').innerHTML = '<div style="font-size:12px;color:var(--text-secondary);text-align:center;padding:20px;">请先连接</div>';
        document.getElementById('mysql-tables').innerHTML = '';
        document.getElementById('mysql-current-db').textContent = '(none)';
        document.getElementById('mysql-output').textContent = '(disconnected)';
        app.setStatus('已断开');
    }

    save() {
        if (this.connectionName) {
            localStorage.setItem(`devtools_mysql_${this.connectionName}`, JSON.stringify(this.databases));
        }
    }

    refreshDBList() {
        const container = document.getElementById('mysql-db-list');
        const dbs = Object.keys(this.databases);
        if (dbs.length === 0) {
            container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);text-align:center;padding:20px;">(empty)</div>';
            return;
        }
        container.innerHTML = dbs.map(db =>
            `<div onclick="app.modules.mysql.switchDB('${db}')" style="padding:6px 10px;background:${db === this.currentDB ? 'var(--accent)' : 'var(--bg-sidebar)'};color:${db === this.currentDB ? '#fff' : 'var(--text-primary)'};border-radius:6px;font-size:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                <span>📁 ${db}</span>
                <button onclick="event.stopPropagation();app.modules.mysql.dropDB('${db}')" style="background:transparent;border:none;color:${db === this.currentDB ? '#fff' : 'var(--danger)'};font-size:11px;cursor:pointer;">✕</button>
            </div>`
        ).join('');
    }

    refreshTables() {
        document.getElementById('mysql-current-db').textContent = this.currentDB || '(none)';
        const container = document.getElementById('mysql-tables');
        if (!this.currentDB || !this.databases[this.currentDB]) {
            container.innerHTML = '';
            return;
        }
        const tables = Object.keys(this.databases[this.currentDB]);
        if (tables.length === 0) {
            container.innerHTML = '<span style="font-size:11px;color:var(--text-secondary);">暂无表</span>';
            return;
        }
        container.innerHTML = tables.map(t =>
            `<span onclick="app.modules.mysql.selectTable('${t}')" style="padding:4px 10px;background:var(--bg-sidebar);border-radius:4px;font-size:12px;cursor:pointer;color:var(--text-primary);">📋 ${t} (${this.databases[this.currentDB][t].length})</span>`
        ).join('');
    }

    switchDB(db) {
        this.currentDB = db;
        this.refreshDBList();
        this.refreshTables();
        document.getElementById('mysql-output').innerHTML = `<div style="color:var(--success);">[OK] 已切换到数据库: ${db}</div>`;
        app.setStatus(`已切换到 ${db}`);
    }

    createDB() {
        const name = prompt('请输入数据库名称:');
        if (!name) return;
        if (this.databases[name]) {
            app.setStatus('数据库已存在', 'error');
            return;
        }
        this.databases[name] = {};
        this.currentDB = name;
        this.save();
        this.refreshDBList();
        this.refreshTables();
        app.setStatus(`已创建 ${name}`);
    }

    dropDB(db) {
        if (!confirm(`确认删除数据库 "${db}"?`)) return;
        delete this.databases[db];
        if (this.currentDB === db) {
            this.currentDB = Object.keys(this.databases)[0] || null;
        }
        this.save();
        this.refreshDBList();
        this.refreshTables();
        app.setStatus('已删除');
    }

    createTable() {
        if (!this.currentDB) {
            app.setStatus('请先选择数据库', 'error');
            return;
        }
        const sql = prompt('请输入 CREATE TABLE 语句，如:\nCREATE TABLE products (id INT, name VARCHAR(100), price DECIMAL(10,2))');
        if (!sql) return;
        try {
            const result = this.executeSQL(sql);
            this.save();
            this.refreshTables();
            document.getElementById('mysql-output').innerHTML = `<div style="color:var(--success);">${result}</div>`;
            app.setStatus('已创建表');
        } catch (e) {
            document.getElementById('mysql-output').innerHTML = `<div style="color:var(--danger);">错误: ${e.message}</div>`;
        }
    }

    selectTable(table) {
        if (!this.currentDB || !this.databases[this.currentDB][table]) return;
        const rows = this.databases[this.currentDB][table];
        document.getElementById('mysql-output').innerHTML = this.renderTable(rows, table);
    }

    execSQL() {
        if (!this.connectionName) {
            app.setStatus('请先连接', 'error');
            return;
        }
        const sql = document.getElementById('mysql-sql').value.trim();
        if (!sql) return;

        try {
            const result = this.executeSQL(sql);
            this.save();
            this.refreshTables();
            document.getElementById('mysql-output').innerHTML = result;
            app.setStatus('执行完成');
        } catch (e) {
            document.getElementById('mysql-output').innerHTML = `<div style="color:var(--danger);">错误: ${e.message}</div>`;
        }
    }

    executeSQL(sql) {
        sql = sql.replace(/;$/, '').trim();
        const upper = sql.toUpperCase();

        // SHOW DATABASES
        if (upper.startsWith('SHOW DATABASES')) {
            const dbs = Object.keys(this.databases);
            return this.renderSimpleTable(['Database'], dbs.map(d => [d]));
        }

        // SHOW TABLES
        if (upper.startsWith('SHOW TABLES')) {
            if (!this.currentDB) throw new Error('未选择数据库');
            const tables = Object.keys(this.databases[this.currentDB]);
            return this.renderSimpleTable(['Tables_in_' + this.currentDB], tables.map(t => [t]));
        }

        // USE database
        if (upper.startsWith('USE ')) {
            const dbName = sql.substring(4).trim().replace(/`/g, '');
            if (!this.databases[dbName]) throw new Error(`数据库 "${dbName}" 不存在`);
            this.currentDB = dbName;
            this.refreshDBList();
            this.refreshTables();
            return `<div style="color:var(--success);">[OK] 已切换到: ${dbName}</div>`;
        }

        // CREATE DATABASE
        if (upper.startsWith('CREATE DATABASE')) {
            const dbName = sql.replace(/^CREATE\s+DATABASE\s+/i, '').trim().replace(/`/g, '');
            if (this.databases[dbName]) throw new Error(`数据库 "${dbName}" 已存在`);
            this.databases[dbName] = {};
            return `<div style="color:var(--success);">Query OK, 1 row affected</div>`;
        }

        // DROP DATABASE
        if (upper.startsWith('DROP DATABASE')) {
            const dbName = sql.replace(/^DROP\s+DATABASE\s+/i, '').trim().replace(/`/g, '');
            delete this.databases[dbName];
            if (this.currentDB === dbName) this.currentDB = Object.keys(this.databases)[0] || null;
            return `<div style="color:var(--success);">Query OK</div>`;
        }

        // CREATE TABLE
        if (upper.startsWith('CREATE TABLE')) {
            const match = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\((.+)\)\s*$/i);
            if (!match) throw new Error('语法错误');
            const tableName = match[1];
            if (!this.currentDB) {
                this.currentDB = Object.keys(this.databases)[0] || 'test';
                if (!this.databases[this.currentDB]) this.databases[this.currentDB] = {};
            }
            this.databases[this.currentDB][tableName] = [];
            return `<div style="color:var(--success);">Query OK, 0 rows affected</div><div style="color:var(--text-secondary);margin-top:8px;">已创建表: ${tableName}</div>`;
        }

        // DROP TABLE
        if (upper.startsWith('DROP TABLE')) {
            const tableName = sql.replace(/^DROP\s+TABLE\s+/i, '').trim().replace(/`/g, '');
            if (!this.currentDB) throw new Error('未选择数据库');
            delete this.databases[this.currentDB][tableName];
            return `<div style="color:var(--success);">Query OK</div>`;
        }

        // INSERT INTO
        if (upper.startsWith('INSERT')) {
            const match = sql.match(/INSERT\s+INTO\s+`?(\w+)`?\s*(?:\(([^)]+)\))?\s*VALUES\s*\((.+)\)/i);
            if (!match) throw new Error('INSERT 语法错误');
            const tableName = match[1];
            if (!this.currentDB || !this.databases[this.currentDB]) throw new Error('未选择数据库');
            if (!this.databases[this.currentDB][tableName]) this.databases[this.currentDB][tableName] = [];

            let columns = match[2] ? match[2].split(',').map(c => c.trim().replace(/`/g, '')) : null;
            const values = this.parseValues(match[3]);

            const row = {};
            if (columns) {
                columns.forEach((col, i) => row[col] = values[i]);
            } else {
                // 从已有行获取列名
                const existingRow = this.databases[this.currentDB][tableName][0];
                const cols = existingRow ? Object.keys(existingRow) : values.map((_, i) => `col${i+1}`);
                cols.forEach((col, i) => row[col] = values[i]);
            }
            this.databases[this.currentDB][tableName].push(row);
            return `<div style="color:var(--success);">Query OK, 1 row affected</div>`;
        }

        // UPDATE
        if (upper.startsWith('UPDATE')) {
            const match = sql.match(/UPDATE\s+`?(\w+)`?\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
            if (!match) throw new Error('UPDATE 语法错误');
            const tableName = match[1];
            const setClause = match[2];
            const whereClause = match[3];
            if (!this.currentDB || !this.databases[this.currentDB] || !this.databases[this.currentDB][tableName])
                throw new Error(`表 "${tableName}" 不存在`);

            const rows = this.databases[this.currentDB][tableName];
            const assignments = this.parseAssignments(setClause);
            let count = 0;

            rows.forEach(row => {
                if (!whereClause || this.evalWhere(row, whereClause)) {
                    assignments.forEach(({key, value}) => row[key] = value);
                    count++;
                }
            });
            return `<div style="color:var(--success);">Query OK, ${count} row(s) affected</div>`;
        }

        // DELETE
        if (upper.startsWith('DELETE')) {
            const match = sql.match(/DELETE\s+FROM\s+`?(\w+)`?(?:\s+WHERE\s+(.+))?$/i);
            if (!match) throw new Error('DELETE 语法错误');
            const tableName = match[1];
            const whereClause = match[2];
            if (!this.currentDB || !this.databases[this.currentDB] || !this.databases[this.currentDB][tableName])
                throw new Error(`表 "${tableName}" 不存在`);

            const rows = this.databases[this.currentDB][tableName];
            let count = 0;
            for (let i = rows.length - 1; i >= 0; i--) {
                if (!whereClause || this.evalWhere(rows[i], whereClause)) {
                    rows.splice(i, 1);
                    count++;
                }
            }
            return `<div style="color:var(--success);">Query OK, ${count} row(s) affected</div>`;
        }

        // SELECT
        if (upper.startsWith('SELECT')) {
            const match = sql.match(/SELECT\s+(.+?)\s+FROM\s+`?(\w+)`?(?:\s+WHERE\s+(.+))?(?:\s+LIMIT\s+(\d+))?$/i);
            if (!match) throw new Error('SELECT 语法错误');
            const cols = match[1].trim();
            const tableName = match[2];
            const whereClause = match[3];
            const limit = match[4] ? parseInt(match[4]) : null;
            if (!this.currentDB || !this.databases[this.currentDB] || !this.databases[this.currentDB][tableName])
                throw new Error(`表 "${tableName}" 不存在`);

            let rows = this.databases[this.currentDB][tableName];
            if (whereClause) {
                rows = rows.filter(r => this.evalWhere(r, whereClause));
            }
            if (limit) rows = rows.slice(0, limit);

            if (cols === '*') {
                return this.renderTable(rows, tableName);
            } else {
                const selectedCols = cols.split(',').map(c => c.trim());
                const filteredRows = rows.map(r => {
                    const obj = {};
                    selectedCols.forEach(c => obj[c] = r[c]);
                    return obj;
                });
                return this.renderTable(filteredRows, tableName);
            }
        }

        throw new Error('不支持的 SQL 语句');
    }

    parseValues(str) {
        const result = [];
        let current = '';
        let inStr = false;
        let strChar = '';

        for (let i = 0; i < str.length; i++) {
            const c = str[i];
            if (inStr) {
                if (c === strChar) inStr = false;
                else current += c;
            } else if (c === "'" || c === '"') {
                inStr = true;
                strChar = c;
            } else if (c === ',') {
                result.push(this.parseValue(current.trim()));
                current = '';
            } else {
                current += c;
            }
        }
        if (current) result.push(this.parseValue(current.trim()));
        return result;
    }

    parseValue(v) {
        if (v === 'NULL' || v === 'null') return null;
        if (!isNaN(parseFloat(v)) && isFinite(v)) return parseFloat(v);
        return v;
    }

    parseAssignments(str) {
        return str.split(',').map(part => {
            const [key, value] = part.split('=').map(s => s.trim());
            return { key: key.replace(/`/g, ''), value: this.parseValue(value.replace(/['"]/g, '')) };
        });
    }

    evalWhere(row, where) {
        try {
            const conditions = where.split(/\s+AND\s+/i);
            return conditions.every(cond => {
                const m = cond.match(/`?(\w+)`?\s*(=|>|<|>=|<=|!=|LIKE)\s*(.+)/i);
                if (!m) return true;
                const [, key, op, val] = m;
                const rowVal = row[key];
                const cmpVal = this.parseValue(val.replace(/^['"]|['"]$/g, '').trim());

                switch (op.toLowerCase()) {
                    case '=': return rowVal == cmpVal;
                    case '!=': return rowVal != cmpVal;
                    case '>': return rowVal > cmpVal;
                    case '<': return rowVal < cmpVal;
                    case '>=': return rowVal >= cmpVal;
                    case '<=': return rowVal <= cmpVal;
                    case 'like': return String(rowVal).includes(String(cmpVal).replace(/%/g, ''));
                    default: return true;
                }
            });
        } catch (e) {
            return true;
        }
    }

    renderTable(rows, tableName) {
        if (!rows || rows.length === 0) {
            return `<div style="color:var(--text-secondary);">表 "${tableName}": 0 rows</div>`;
        }
        const cols = Object.keys(rows[0]);
        const header = cols.map(c => `<th style="padding:8px 12px;background:var(--bg-sidebar);border:1px solid var(--border);text-align:left;font-size:12px;font-weight:500;color:var(--text-secondary);">${c}</th>`).join('');
        const body = rows.map(row =>
            `<tr>${cols.map(c => `<td style="padding:8px 12px;border:1px solid var(--border);font-size:12px;color:var(--text-primary);">${row[c] === null ? '<span style="color:var(--text-secondary);">NULL</span>' : row[c]}</td>`).join('')}</tr>`
        ).join('');
        return `
            <div style="color:var(--text-secondary);margin-bottom:8px;">表 "${tableName}": ${rows.length} row(s)</div>
            <div style="overflow-x:auto;">
                <table style="border-collapse:collapse;width:100%;">
                    <thead><tr>${header}</tr></thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        `;
    }

    renderSimpleTable(cols, rows) {
        const header = cols.map(c => `<th style="padding:8px 12px;background:var(--bg-sidebar);border:1px solid var(--border);text-align:left;font-size:12px;font-weight:500;color:var(--text-secondary);">${c}</th>`).join('');
        const body = rows.map(row =>
            `<tr>${row.map(v => `<td style="padding:8px 12px;border:1px solid var(--border);font-size:12px;color:var(--text-primary);">${v}</td>`).join('')}</tr>`
        ).join('');
        return `
            <div style="color:var(--text-secondary);margin-bottom:8px;">${rows.length} row(s)</div>
            <div style="overflow-x:auto;">
                <table style="border-collapse:collapse;width:100%;">
                    <thead><tr>${header}</tr></thead>
                    <tbody>${body}</tbody>
                </table>
            </div>
        `;
    }
}
