// 日期转换模块
class DateModule {
    constructor() {
        this.title = '日期转换';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">选择日期时间</label>
                    <input type="datetime-local" id="date-input" style="width:100%;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:14px;">
                    <div style="display:flex;gap:8px;margin-top:12px;">
                        <button class="btn btn-primary" onclick="app.modules.date.setNow()" style="flex:1;padding:8px;">当前时间</button>
                        <button class="btn btn-primary" onclick="app.modules.date.convert()" style="flex:1;padding:8px;">转换</button>
                    </div>
                </div>

                <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">时间戳（秒或毫秒）</label>
                    <div style="display:flex;gap:8px;">
                        <input type="text" id="ts-input" placeholder="输入时间戳，如: 1718608000" style="flex:1;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:14px;">
                        <button class="btn btn-primary" onclick="app.modules.date.tsToDate()" style="padding:8px 16px;">时间戳→日期</button>
                    </div>
                </div>

                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">转换结果</label>
                    <textarea id="date-output" readonly style="width:100%;min-height:280px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:13px;"></textarea>
                </div>
                <div style="text-align:right;">
                    <button class="btn btn-secondary" onclick="app.modules.date.copyResult()" style="font-size:12px;padding:6px 16px;">复制结果</button>
                </div>
            </div>
        `;
    }

    setNow() {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const localStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        document.getElementById('date-input').value = localStr;
        this.displayDateResults(now);
        app.setStatus('已获取当前时间');
    }

    convert() {
        const input = document.getElementById('date-input').value;
        if (!input) {
            app.setStatus('请选择日期', 'error');
            return;
        }

        const date = new Date(input);
        if (isNaN(date.getTime())) {
            app.setStatus('无效的日期', 'error');
            return;
        }

        this.displayDateResults(date);
        app.setStatus('转换成功');
    }

    tsToDate() {
        const input = document.getElementById('ts-input').value.trim();
        if (!input) {
            app.setStatus('请输入时间戳', 'error');
            return;
        }

        let ts = parseInt(input);
        if (isNaN(ts)) {
            app.setStatus('无效的时间戳', 'error');
            return;
        }

        // 自动识别：小于 1e10 视为秒，否则为毫秒
        if (ts < 1e10) {
            ts = ts * 1000;
        }

        const date = new Date(ts);
        if (isNaN(date.getTime())) {
            app.setStatus('无效的时间戳', 'error');
            return;
        }

        this.displayDateResults(date);
        app.setStatus('转换成功');
    }

    displayDateResults(date) {
        const pad = n => n.toString().padStart(2, '0');
        const localString = date.toLocaleString('zh-CN');

        const utcParts = [
            date.getUTCFullYear(),
            pad(date.getUTCMonth() + 1),
            pad(date.getUTCDate()),
            pad(date.getUTCHours()),
            pad(date.getUTCMinutes()),
            pad(date.getUTCSeconds())
        ];

        const results = [
            '═══════════════════════════════════════',
            `📅 本地时间: ${localString}`,
            `🌍 UTC 时间: ${utcParts[0]}-${utcParts[1]}-${utcParts[2]} ${utcParts[3]}:${utcParts[4]}:${utcParts[5]}`,
            '═══════════════════════════════════════',
            `⏱ Unix 时间戳(秒): ${Math.floor(date.getTime() / 1000)}`,
            `⏱ Unix 时间戳(毫秒): ${date.getTime()}`,
            '═══════════════════════════════════════',
            `📝 ISO 8601: ${date.toISOString()}`,
            `📝 RFC 2822: ${date.toUTCString()}`,
            '═══════════════════════════════════════',
            `🏮 北京时间: ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
            `🕐 时区偏移: UTC${(date.getTimezoneOffset() <= 0 ? '+' : '-')}${pad(Math.floor(Math.abs(date.getTimezoneOffset()) / 60))}:${pad(Math.abs(date.getTimezoneOffset()) % 60)}`,
            '═══════════════════════════════════════',
            `📅 年: ${date.getFullYear()}`,
            `📅 月: ${date.getMonth() + 1} (${['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][date.getMonth()]})`,
            `📅 日: ${date.getDate()}`,
            `🕐 时: ${date.getHours()}`,
            `🕐 分: ${date.getMinutes()}`,
            `🕐 秒: ${date.getSeconds()}`,
            `📅 星期: ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]}`
        ].join('\n');

        document.getElementById('date-output').value = results;
    }

    copyResult() {
        const output = document.getElementById('date-output').value;
        if (!output) {
            app.setStatus('没有可复制的内容', 'error');
            return;
        }
        app.copyText(output);
    }
}
