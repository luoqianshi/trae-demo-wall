// XML 格式化模块
class XmlModule {
    constructor() {
        this.title = 'XML 格式化';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输入 XML</label>
                    <textarea id="xml-input" placeholder='例如: <root><name>张三</name><age>25</age></root>' style="width:100%;min-height:200px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                    <button class="btn btn-primary" onclick="app.modules.xml.format()" style="padding:10px 20px;">格式化</button>
                    <button class="btn btn-primary" onclick="app.modules.xml.minify()" style="padding:10px 20px;">压缩</button>
                    <button class="btn btn-secondary" onclick="app.modules.xml.validate()" style="padding:10px 20px;">校验</button>
                    <button class="btn btn-outline" onclick="app.modules.xml.clearAll()" style="padding:10px 20px;">清空</button>
                </div>
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输出结果</label>
                    <textarea id="xml-output" placeholder="结果将显示在这里..." readonly style="width:100%;min-height:250px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="text-align:right;">
                    <button class="btn btn-secondary" onclick="app.modules.xml.copyResult()" style="font-size:12px;padding:6px 16px;">复制结果</button>
                </div>
            </div>
        `;
    }

    format() {
        const input = document.getElementById('xml-input').value.trim();
        if (!input) {
            app.setStatus('请输入 XML', 'error');
            return;
        }

        try {
            // 先检查格式
            const parser = new DOMParser();
            const doc = parser.parseFromString(input, 'text/xml');
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML 格式错误');
            }

            // 简化版格式化：逐行处理
            let result = '';
            let indent = 0;
            // 处理自闭合标签和正常标签
            const tokens = input.replace(/>\s*</g, '>\n<').split('\n');

            for (let line of tokens) {
                line = line.trim();
                if (!line) continue;

                if (line.startsWith('</')) {
                    indent = Math.max(0, indent - 1);
                    result += '  '.repeat(indent) + line + '\n';
                } else if (line.match(/^<[^?][^>]*\/>$/) || line.startsWith('<?')) {
                    result += '  '.repeat(indent) + line + '\n';
                } else if (line.startsWith('<')) {
                    result += '  '.repeat(indent) + line + '\n';
                    indent++;
                } else {
                    result += '  '.repeat(indent) + line + '\n';
                }
            }

            document.getElementById('xml-output').value = result.trim();
            app.setStatus('格式化成功');
        } catch (e) {
            document.getElementById('xml-output').value = '';
            app.setStatus('格式化失败：' + e.message, 'error');
        }
    }

    minify() {
        const input = document.getElementById('xml-input').value;
        if (!input.trim()) {
            app.setStatus('请输入 XML', 'error');
            return;
        }

        try {
            const minified = input.replace(/>\s+</g, '><').trim();
            document.getElementById('xml-output').value = minified;
            app.setStatus('压缩成功');
        } catch (e) {
            app.setStatus('压缩失败', 'error');
        }
    }

    validate() {
        const input = document.getElementById('xml-input').value.trim();
        if (!input) {
            app.setStatus('请输入 XML', 'error');
            return;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(input, 'text/xml');
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                document.getElementById('xml-output').value = 'XML 格式错误';
                app.setStatus('XML 格式无效', 'error');
            } else {
                document.getElementById('xml-output').value = 'XML 格式有效！';
                app.setStatus('XML 格式有效');
            }
        } catch (e) {
            document.getElementById('xml-output').value = '';
            app.setStatus('校验失败', 'error');
        }
    }

    clearAll() {
        document.getElementById('xml-input').value = '';
        document.getElementById('xml-output').value = '';
        app.setStatus('已清空');
    }

    copyResult() {
        const output = document.getElementById('xml-output').value;
        if (!output) {
            app.setStatus('没有可复制的内容', 'error');
            return;
        }
        app.copyText(output);
    }
}
