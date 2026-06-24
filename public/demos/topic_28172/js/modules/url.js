// URL 编码/解码模块
class UrlModule {
    constructor() {
        this.title = 'URL 编码/解码';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输入内容</label>
                    <textarea id="url-input" placeholder="输入需要编码/解码的 URL 或文本..." style="width:100%;min-height:180px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                    <button class="btn btn-primary" onclick="app.modules.url.encode()" style="padding:10px 20px;">编码 →</button>
                    <button class="btn btn-primary" onclick="app.modules.url.decode()" style="padding:10px 20px;">← 解码</button>
                    <button class="btn btn-secondary" onclick="app.modules.url.encodeComponent()" style="padding:10px 20px;">完整编码</button>
                    <button class="btn btn-outline" onclick="app.modules.url.clearAll()" style="padding:10px 20px;">清空</button>
                </div>
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输出结果</label>
                    <textarea id="url-output" placeholder="结果将显示在这里..." readonly style="width:100%;min-height:200px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="text-align:right;">
                    <button class="btn btn-secondary" onclick="app.modules.url.copyResult()" style="font-size:12px;padding:6px 16px;">复制结果</button>
                </div>
            </div>
        `;
    }

    encode() {
        const input = document.getElementById('url-input').value;
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }
        document.getElementById('url-output').value = encodeURI(input);
        app.setStatus('编码成功');
    }

    decode() {
        const input = document.getElementById('url-input').value;
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }
        try {
            document.getElementById('url-output').value = decodeURI(input);
            app.setStatus('解码成功');
        } catch (e) {
            document.getElementById('url-output').value = '';
            app.setStatus('解码失败：包含非法字符', 'error');
        }
    }

    encodeComponent() {
        const input = document.getElementById('url-input').value;
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }
        document.getElementById('url-output').value = encodeURIComponent(input);
        app.setStatus('完整编码成功');
    }

    clearAll() {
        document.getElementById('url-input').value = '';
        document.getElementById('url-output').value = '';
        app.setStatus('已清空');
    }

    copyResult() {
        const output = document.getElementById('url-output').value;
        if (!output) {
            app.setStatus('没有可复制的内容', 'error');
            return;
        }
        app.copyText(output);
    }
}
