// Redis 直连模块（纯前端模拟）
class RedisPlugin {
    constructor() {
        this.title = 'Redis 直连';
        this.data = {};
        this.connectionName = null;
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;height:calc(100vh - 180px);min-height:500px;">
                <!-- 左侧：连接管理 -->
                <div style="display:grid;gap:12px;align-content:start;">
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">连接配置（本地模式）</div>
                        <div style="display:grid;gap:8px;">
                            <input type="text" id="redis-name" placeholder="连接名称（如: my-redis）" value="local-redis" style="padding:8px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;">
                            <button class="btn btn-primary" onclick="app.modules.redis.connect()" style="padding:8px;">连接 / 创建</button>
                            <button class="btn btn-secondary" onclick="app.modules.redis.disconnect()" style="padding:6px;">断开连接</button>
                        </div>
                    </div>

                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;overflow-y:auto;max-height:calc(100% - 180px);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="font-size:12px;color:var(--text-secondary);">Key 列表</div>
                            <span id="redis-count" style="font-size:11px;color:var(--text-secondary);">0 keys</span>
                        </div>
                        <div id="redis-keys" style="display:grid;gap:4px;">
                            <div style="font-size:12px;color:var(--text-secondary);text-align:center;padding:20px;">请先连接</div>
                        </div>
                    </div>
                </div>

                <!-- 右侧：命令执行 / Key 操作 -->
                <div style="display:grid;gap:12px;align-content:start;">
                    <!-- 操作面板 -->
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">添加 / 设置 Key</div>
                        <div style="display:grid;gap:8px;grid-template-columns:1fr 2fr auto;">
                            <input type="text" id="redis-key" placeholder="key 名称" style="padding:8px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;">
                            <input type="text" id="redis-value" placeholder="value 值" style="padding:8px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;">
                            <button class="btn btn-primary" onclick="app.modules.redis.setKey()" style="padding:8px 16px;">SET</button>
                        </div>
                    </div>

                    <!-- 命令执行 -->
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">执行命令</div>
                        <div style="display:flex;gap:8px;">
                            <input type="text" id="redis-cmd" placeholder="如: SET key value, GET key, KEYS *, DEL key, FLUSHALL" onkeypress="if(event.key==='Enter')app.modules.redis.execCommand()" style="flex:1;padding:10px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-family:monospace;font-size:13px;">
                            <button class="btn btn-primary" onclick="app.modules.redis.execCommand()" style="padding:10px 16px;">执行</button>
                        </div>
                        <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);">
                            支持命令: GET / SET / DEL / KEYS / EXISTS / TYPE / STRLEN / APPEND / INCR / DECR / LPUSH / RPUSH / LPOP / RPOP / LLEN / LRANGE / HSET / HGET / HGETALL / HDEL / HKEYS / HVALS / FLUSHALL / CLEAR
                        </div>
                    </div>

                    <!-- 输出结果 -->
                    <div style="flex:1;padding:12px;background:var(--bg-card);border-radius:8px;overflow-y:auto;min-height:200px;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">执行结果</div>
                        <div id="redis-output" style="font-family:monospace;font-size:13px;line-height:1.6;color:var(--success);white-space:pre-wrap;word-break:break-all;">(empty)</div>
                    </div>
                </div>
            </div>
        `;
    }

    connect() {
        const name = document.getElementById('redis-name').value.trim();
        if (!name) {
            app.setStatus('请输入连接名称', 'error');
            return;
        }

        this.connectionName = name;
        const storageKey = `devtools_redis_${name}`;
        const stored = localStorage.getItem(storageKey);
        this.data = stored ? JSON.parse(stored) : {};

        this.refreshKeys();
        document.getElementById('redis-output').textContent = `[OK] Connected to "${name}"\nTotal keys: ${Object.keys(this.data).length}`;
        app.setStatus(`已连接到 ${name}`);
    }

    disconnect() {
        this.data = {};
        this.connectionName = null;
        document.getElementById('redis-keys').innerHTML = '<div style="font-size:12px;color:var(--text-secondary);text-align:center;padding:20px;">请先连接</div>';
        document.getElementById('redis-count').textContent = '0 keys';
        document.getElementById('redis-output').textContent = '(disconnected)';
        app.setStatus('已断开');
    }

    save() {
        if (this.connectionName) {
            localStorage.setItem(`devtools_redis_${this.connectionName}`, JSON.stringify(this.data));
        }
    }

    refreshKeys() {
        const keys = Object.keys(this.data);
        document.getElementById('redis-count').textContent = `${keys.length} keys`;
        const container = document.getElementById('redis-keys');
        if (keys.length === 0) {
            container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);text-align:center;padding:20px;">(empty)</div>';
            return;
        }
        container.innerHTML = keys.map(k => {
            const type = this.data[k].type;
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg-sidebar);border-radius:6px;font-size:12px;cursor:pointer;" onclick="app.modules.redis.getKey('${k.replace(/'/g, "\\'")}')">
                <span style="color:var(--text-primary);word-break:break-all;flex:1;">${k}</span>
                <span style="color:var(--accent);font-size:11px;padding:2px 6px;background:rgba(100,181,246,0.15);border-radius:4px;">${type}</span>
            </div>`;
        }).join('');
    }

    setKey() {
        if (!this.connectionName) {
            app.setStatus('请先连接', 'error');
            return;
        }
        const key = document.getElementById('redis-key').value.trim();
        const value = document.getElementById('redis-value').value;
        if (!key) {
            app.setStatus('请输入 key', 'error');
            return;
        }
        this.data[key] = { type: 'string', value: value };
        this.save();
        this.refreshKeys();
        document.getElementById('redis-output').textContent = `[OK] SET "${key}" = "${value}"`;
        document.getElementById('redis-key').value = '';
        document.getElementById('redis-value').value = '';
        app.setStatus('设置成功');
    }

    getKey(key) {
        const item = this.data[key];
        if (!item) return;

        let display = '';
        if (item.type === 'string') {
            display = item.value;
        } else if (item.type === 'list') {
            display = item.value.map((v, i) => `${i}) ${v}`).join('\n');
        } else if (item.type === 'hash') {
            display = Object.entries(item.value).map(([k, v]) => `${k}: ${v}`).join('\n');
        }
        document.getElementById('redis-output').textContent = `["${key}"] (${item.type})\n\n${display}`;
    }

    execCommand() {
        if (!this.connectionName) {
            app.setStatus('请先连接', 'error');
            return;
        }

        const cmdLine = document.getElementById('redis-cmd').value.trim();
        if (!cmdLine) return;

        const parts = this.parseCommand(cmdLine);
        const cmd = parts[0].toUpperCase();
        const args = parts.slice(1);

        let result = '';

        try {
            switch (cmd) {
                case 'GET':
                    if (this.data[args[0]]) result = this.data[args[0]].value;
                    else result = '(nil)';
                    break;
                case 'SET':
                    this.data[args[0]] = { type: 'string', value: args.slice(1).join(' ') };
                    result = 'OK';
                    break;
                case 'DEL':
                    args.forEach(k => delete this.data[k]);
                    result = `(integer) ${args.length}`;
                    break;
                case 'KEYS':
                    const allKeys = Object.keys(this.data);
                    result = allKeys.length ? allKeys.map((k, i) => `${i+1}) "${k}"`).join('\n') : '(empty list)';
                    break;
                case 'EXISTS':
                    result = `(integer) ${args.filter(a => this.data[a]).length}`;
                    break;
                case 'TYPE':
                    result = this.data[args[0]] ? this.data[args[0]].type : '(nil)';
                    break;
                case 'STRLEN':
                    result = this.data[args[0]] ? `(integer) ${String(this.data[args[0]].value).length}` : '(integer) 0';
                    break;
                case 'APPEND':
                    if (!this.data[args[0]]) this.data[args[0]] = { type: 'string', value: '' };
                    this.data[args[0]].value += args.slice(1).join(' ');
                    result = `(integer) ${String(this.data[args[0]].value).length}`;
                    break;
                case 'INCR':
                    if (!this.data[args[0]]) this.data[args[0]] = { type: 'string', value: '0' };
                    const nv = parseInt(this.data[args[0]].value) + 1;
                    this.data[args[0]].value = String(nv);
                    result = `(integer) ${nv}`;
                    break;
                case 'DECR':
                    if (!this.data[args[0]]) this.data[args[0]] = { type: 'string', value: '0' };
                    const dv = parseInt(this.data[args[0]].value) - 1;
                    this.data[args[0]].value = String(dv);
                    result = `(integer) ${dv}`;
                    break;
                case 'LPUSH':
                    if (!this.data[args[0]]) this.data[args[0]] = { type: 'list', value: [] };
                    if (this.data[args[0]].type !== 'list') this.data[args[0]] = { type: 'list', value: [] };
                    args.slice(1).forEach(v => this.data[args[0]].value.unshift(v));
                    result = `(integer) ${this.data[args[0]].value.length}`;
                    break;
                case 'RPUSH':
                    if (!this.data[args[0]]) this.data[args[0]] = { type: 'list', value: [] };
                    if (this.data[args[0]].type !== 'list') this.data[args[0]] = { type: 'list', value: [] };
                    args.slice(1).forEach(v => this.data[args[0]].value.push(v));
                    result = `(integer) ${this.data[args[0]].value.length}`;
                    break;
                case 'LPOP':
                    if (this.data[args[0]] && this.data[args[0]].type === 'list') {
                        result = this.data[args[0]].value.shift() || '(nil)';
                    } else result = '(nil)';
                    break;
                case 'RPOP':
                    if (this.data[args[0]] && this.data[args[0]].type === 'list') {
                        result = this.data[args[0]].value.pop() || '(nil)';
                    } else result = '(nil)';
                    break;
                case 'LLEN':
                    result = this.data[args[0]] && this.data[args[0]].type === 'list'
                        ? `(integer) ${this.data[args[0]].value.length}` : '(integer) 0';
                    break;
                case 'LRANGE':
                    if (this.data[args[0]] && this.data[args[0]].type === 'list') {
                        const list = this.data[args[0]].value;
                        const start = parseInt(args[1]) || 0;
                        const end = args[2] === '-1' ? list.length - 1 : (parseInt(args[2]) || list.length - 1);
                        const sub = list.slice(start, end + 1);
                        result = sub.map((v, i) => `${start+i}) "${v}"`).join('\n') || '(empty list)';
                    } else result = '(empty list)';
                    break;
                case 'HSET':
                    if (!this.data[args[0]]) this.data[args[0]] = { type: 'hash', value: {} };
                    if (this.data[args[0]].type !== 'hash') this.data[args[0]] = { type: 'hash', value: {} };
                    for (let i = 1; i < args.length; i += 2) {
                        this.data[args[0]].value[args[i]] = args[i+1] || '';
                    }
                    result = 'OK';
                    break;
                case 'HGET':
                    result = (this.data[args[0]] && this.data[args[0]].type === 'hash')
                        ? (this.data[args[0]].value[args[1]] || '(nil)') : '(nil)';
                    break;
                case 'HGETALL':
                    if (this.data[args[0]] && this.data[args[0]].type === 'hash') {
                        const h = this.data[args[0]].value;
                        result = Object.entries(h).map(([k, v]) => `${k}\n${v}`).join('\n') || '(empty hash)';
                    } else result = '(empty hash)';
                    break;
                case 'HDEL':
                    if (this.data[args[0]] && this.data[args[0]].type === 'hash') {
                        args.slice(1).forEach(k => delete this.data[args[0]].value[k]);
                    }
                    result = 'OK';
                    break;
                case 'HKEYS':
                    result = (this.data[args[0]] && this.data[args[0]].type === 'hash')
                        ? Object.keys(this.data[args[0]].value).map((k, i) => `${i+1}) "${k}"`).join('\n') || '(empty list)'
                        : '(empty list)';
                    break;
                case 'HVALS':
                    result = (this.data[args[0]] && this.data[args[0]].type === 'hash')
                        ? Object.values(this.data[args[0]].value).map((v, i) => `${i+1}) "${v}"`).join('\n') || '(empty list)'
                        : '(empty list)';
                    break;
                case 'FLUSHALL':
                case 'CLEAR':
                    this.data = {};
                    result = 'OK';
                    break;
                case 'HELP':
                    result = '支持命令: GET, SET, DEL, KEYS, EXISTS, TYPE, STRLEN, APPEND, INCR, DECR, LPUSH, RPUSH, LPOP, RPOP, LLEN, LRANGE, HSET, HGET, HGETALL, HDEL, HKEYS, HVALS, FLUSHALL';
                    break;
                default:
                    result = `(error) ERR unknown command '${cmd}'`;
            }
            this.save();
            this.refreshKeys();
            document.getElementById('redis-output').textContent = `> ${cmdLine}\n\n${result}`;
            document.getElementById('redis-cmd').value = '';
            app.setStatus('执行完成');
        } catch (e) {
            document.getElementById('redis-output').textContent = `(error) ${e.message}`;
        }
    }

    parseCommand(line) {
        const result = [];
        let current = '';
        let inQuote = false;
        let quoteChar = '';

        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (inQuote) {
                if (c === quoteChar) {
                    inQuote = false;
                    result.push(current);
                    current = '';
                } else {
                    current += c;
                }
            } else if (c === '"' || c === "'") {
                inQuote = true;
                quoteChar = c;
                if (current) {
                    result.push(current);
                    current = '';
                }
            } else if (c === ' ') {
                if (current) {
                    result.push(current);
                    current = '';
                }
            } else {
                current += c;
            }
        }
        if (current) result.push(current);
        return result;
    }
}
