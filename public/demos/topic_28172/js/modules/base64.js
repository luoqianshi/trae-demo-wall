// Base64 编码/解码模块
class Base64Module {
    constructor() {
        this.title = 'Base64 编码/解码';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输入内容</label>
                    <textarea id="base64-input" placeholder="输入要编码/解码的文本..." style="width:100%;min-height:200px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                    <button class="btn btn-primary" onclick="app.modules.base64.encode()" style="padding:10px 20px;">编码 →</button>
                    <button class="btn btn-primary" onclick="app.modules.base64.decode()" style="padding:10px 20px;">← 解码</button>
                    <button class="btn btn-secondary" onclick="app.modules.base64.swap()" style="padding:10px 20px;">↕ 互换</button>
                    <button class="btn btn-outline" onclick="app.modules.base64.clearAll()" style="padding:10px 20px;">清空</button>
                </div>
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输出结果</label>
                    <textarea id="base64-output" placeholder="结果将显示在这里..." readonly style="width:100%;min-height:200px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="text-align:right;">
                    <button class="btn btn-secondary" onclick="app.modules.base64.copyResult()" style="font-size:12px;padding:6px 16px;">复制结果</button>
                </div>
            </div>
        `;
    }

    encode() {
        const input = document.getElementById('base64-input').value;
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }

        try {
            const encoded = btoa(unescape(encodeURIComponent(input)));
            document.getElementById('base64-output').value = encoded;
            app.setStatus('编码成功');
        } catch (e) {
            app.setStatus('编码失败：包含非法字符', 'error');
        }
    }

    decode() {
        const input = document.getElementById('base64-input').value.trim();
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }

        try {
            const decoded = decodeURIComponent(escape(atob(input)));
            document.getElementById('base64-output').value = decoded;
            app.setStatus('解码成功');
        } catch (e) {
            app.setStatus('解码失败：不是有效的 Base64 字符串', 'error');
        }
    }

    swap() {
        const inputEl = document.getElementById('base64-input');
        const outputEl = document.getElementById('base64-output');
        const temp = inputEl.value;
        inputEl.value = outputEl.value;
        outputEl.value = temp;
        app.setStatus('已互换输入输出');
    }

    clearAll() {
        document.getElementById('base64-input').value = '';
        document.getElementById('base64-output').value = '';
        app.setStatus('已清空');
    }

    copyResult() {
        const output = document.getElementById('base64-output').value;
        if (!output) {
            app.setStatus('没有可复制的内容', 'error');
            return;
        }
        app.copyText(output);
    }
}
