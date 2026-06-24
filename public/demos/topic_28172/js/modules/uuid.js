// UUID 生成模块
class UuidModule {
    constructor() {
        this.title = 'UUID';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                    <label style="font-size:13px;color:var(--text-secondary);">版本:</label>
                    <select id="uuid-version" style="padding:6px 10px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
                        <option value="4">UUID v4 (随机)</option>
                        <option value="1">UUID v1 (时间戳)</option>
                    </select>
                    <label style="font-size:13px;color:var(--text-secondary);margin-left:10px;">数量:</label>
                    <select id="uuid-count" style="padding:6px 10px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
                        <option value="1">1</option>
                        <option value="5">5</option>
                        <option value="10" selected>10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                    <label style="font-size:13px;color:var(--text-secondary);margin-left:10px;">格式:</label>
                    <select id="uuid-format" style="padding:6px 10px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
                        <option value="lower">小写</option>
                        <option value="upper">大写</option>
                        <option value="nohyphen">无连字符</option>
                    </select>
                    <button class="btn btn-primary" onclick="app.modules.uuid.generate()" style="padding:8px 20px;margin-left:auto;">生成</button>
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <label style="font-size:13px;color:var(--text-secondary);">生成结果</label>
                        <button class="btn btn-secondary" onclick="app.modules.uuid.copyAll()" style="padding:4px 12px;font-size:12px;">复制全部</button>
                    </div>
                    <div id="uuid-output" style="padding:16px;background:var(--bg-card);border-radius:8px;min-height:200px;font-family:monospace;font-size:13px;line-height:1.8;color:var(--text-primary);"></div>
                </div>
            </div>
        `;
    }

    generate() {
        const version = document.getElementById('uuid-version').value;
        const count = parseInt(document.getElementById('uuid-count').value);
        const format = document.getElementById('uuid-format').value;

        const output = document.getElementById('uuid-output');
        const results = [];

        for (let i = 0; i < count; i++) {
            let uuid = version === '1' ? this.uuidv1() : this.uuidv4();
            if (format === 'upper') {
                uuid = uuid.toUpperCase();
            } else if (format === 'nohyphen') {
                uuid = uuid.replace(/-/g, '');
            }
            results.push(uuid);
        }

        output.innerHTML = results.map((u, i) =>
            `<div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);">
                <span style="color:var(--text-secondary);width:30px;">${i+1}.</span>
                <span style="flex:1;word-break:break-all;">${u}</span>
                <button class="btn btn-secondary" onclick="app.copyText('${u}')" style="padding:2px 8px;font-size:11px;">复制</button>
            </div>`
        ).join('');

        app.setStatus(`已生成 ${count} 个 UUID`);
    }

    copyAll() {
        const items = document.getElementById('uuid-output').querySelectorAll('span:nth-child(2)');
        if (items.length === 0) {
            app.setStatus('请先生成 UUID', 'error');
            return;
        }
        const text = Array.from(items).map(el => el.textContent).join('\n');
        app.copyText(text);
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    uuidv1() {
        let node = '';
        for (let i = 0; i < 6; i++) {
            node += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
        }
        const timestamp = Date.now() - 12219292800000;
        const hexTime = (timestamp * 10000).toString(16).padStart(15, '0');
        const timeLow = hexTime.slice(-8);
        const timeMid = hexTime.slice(-12, -8);
        const timeHiVer = '1' + hexTime.slice(-13, -12);
        const clockSeq = (Math.floor(Math.random() * 0x3FFF) | 0x8000).toString(16);
        return `${timeLow}-${timeMid}-${timeHiVer}-${clockSeq}-${node}`;
    }
}
