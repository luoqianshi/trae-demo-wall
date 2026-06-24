// JSON 格式化模块
class JsonModule {
    constructor() {
        this.title = 'JSON 格式化';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输入内容</label>
                    <textarea id="json-input" placeholder='输入 JSON，如: {"name":"张三","age":25}&#10;或输入 XML，或输入需要转义的文本...' style="width:100%;min-height:200px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                    <div id="json-error" style="margin-top:8px;padding:8px 12px;background:rgba(239,68,68,0.15);color:var(--danger);border-radius:6px;font-size:12px;display:none;"></div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                    <button class="btn btn-primary" onclick="app.modules.json.format()" style="padding:10px 20px;">格式化</button>
                    <button class="btn btn-primary" onclick="app.modules.json.minify()" style="padding:10px 20px;">压缩</button>
                    <button class="btn btn-secondary" onclick="app.modules.json.validate()" style="padding:10px 20px;">校验</button>
                    <button class="btn btn-secondary" onclick="app.modules.json.escape()" style="padding:10px 20px;">转义</button>
                    <button class="btn btn-secondary" onclick="app.modules.json.unescape()" style="padding:10px 20px;">去转义</button>
                    <button class="btn btn-primary" onclick="app.modules.json.jsonToXml()" style="padding:10px 20px;">JSON → XML</button>
                    <button class="btn btn-primary" onclick="app.modules.json.xmlToJson()" style="padding:10px 20px;">XML → JSON</button>
                    <button class="btn btn-outline" onclick="app.modules.json.clearAll()" style="padding:10px 20px;">清空</button>
                </div>
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">输出结果</label>
                    <textarea id="json-output" placeholder="结果将显示在这里..." readonly style="width:100%;min-height:250px;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;"></textarea>
                </div>
                <div style="text-align:right;">
                    <button class="btn btn-secondary" onclick="app.modules.json.copyResult()" style="font-size:12px;padding:6px 16px;">复制结果</button>
                </div>
            </div>
        `;
    }

    getInput() {
        return document.getElementById('json-input').value.trim();
    }

    setOutput(value) {
        document.getElementById('json-output').value = value;
    }

    showError(msg) {
        const err = document.getElementById('json-error');
        if (err) {
            err.textContent = msg;
            err.style.display = 'block';
        }
    }

    hideError() {
        const err = document.getElementById('json-error');
        if (err) {
            err.textContent = '';
            err.style.display = 'none';
        }
    }

    format() {
        const input = this.getInput();
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }
        this.hideError();

        try {
            const parsed = JSON.parse(input);
            this.setOutput(JSON.stringify(parsed, null, 2));
            app.setStatus('格式化成功');
        } catch (e) {
            this.showError('JSON 解析错误: ' + e.message);
            app.setStatus('格式化失败', 'error');
        }
    }

    minify() {
        const input = this.getInput();
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }
        this.hideError();

        try {
            const parsed = JSON.parse(input);
            this.setOutput(JSON.stringify(parsed));
            app.setStatus('压缩成功');
        } catch (e) {
            this.showError('JSON 解析错误: ' + e.message);
            app.setStatus('压缩失败', 'error');
        }
    }

    validate() {
        const input = this.getInput();
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }

        try {
            JSON.parse(input);
            this.hideError();
            this.setOutput('JSON 有效！\n\n字符串长度: ' + input.length + ' 字符');
            app.setStatus('JSON 格式有效');
        } catch (e) {
            this.showError('JSON 解析错误: ' + e.message);
            this.setOutput('');
            app.setStatus('JSON 格式无效', 'error');
        }
    }

    escape() {
        const input = document.getElementById('json-input').value;
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }

        const escaped = input
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');

        this.setOutput(escaped);
        app.setStatus('转义成功');
    }

    unescape() {
        const input = document.getElementById('json-input').value;
        if (!input) {
            app.setStatus('请输入内容', 'error');
            return;
        }

        try {
            const unescaped = input
                .replace(/\\\\/g, '\\')
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t');
            this.setOutput(unescaped);
            app.setStatus('去转义成功');
        } catch (e) {
            app.setStatus('去转义失败', 'error');
        }
    }

    jsonToXml() {
        const input = this.getInput();
        if (!input) {
            app.setStatus('请输入 JSON', 'error');
            return;
        }

        try {
            const obj = JSON.parse(input);
            const xml = this._jsonToXml(obj, 'root');
            const formatted = this._formatXmlString(xml);
            this.setOutput(formatted);
            this.hideError();
            app.setStatus('JSON → XML 成功');
        } catch (e) {
            this.showError('JSON 解析错误: ' + e.message);
            app.setStatus('转换失败', 'error');
        }
    }

    _jsonToXml(obj, nodeName) {
        let xml = '';
        if (Array.isArray(obj)) {
            xml += `<${nodeName}>\n`;
            obj.forEach((item) => {
                xml += this._jsonToXml(item, 'item');
            });
            xml += `</${nodeName}>\n`;
        } else if (typeof obj === 'object' && obj !== null) {
            const keys = Object.keys(obj);
            if (keys.length > 0 && typeof obj[keys[0]] === 'object') {
                xml += `<${nodeName}>\n`;
                for (const key in obj) {
                    xml += this._jsonToXml(obj[key], key);
                }
                xml += `</${nodeName}>\n`;
            } else {
                xml += `<${nodeName}>`;
                for (const key in obj) {
                    const safeValue = String(obj[key])
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    xml += `<${key}>${safeValue}</${key}>`;
                }
                xml += `</${nodeName}>\n`;
            }
        } else {
            const safeValue = String(obj)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            xml += `<${nodeName}>${safeValue}</${nodeName}>\n`;
        }
        return xml;
    }

    _formatXmlString(xmlContent) {
        let result = '<?xml version="1.0" encoding="UTF-8"?>\n';
        let indent = 0;
        const lines = xmlContent.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line.startsWith('</')) {
                indent = Math.max(0, indent - 1);
            }
            result += '  '.repeat(indent) + line + '\n';
            if (line.match(/^<[^/?][^>]*[^/]$/) && !line.includes('</')) {
                indent++;
            }
        }
        return result;
    }

    xmlToJson() {
        const input = document.getElementById('json-input').value.trim();
        if (!input) {
            app.setStatus('请输入 XML', 'error');
            return;
        }

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(input, 'text/xml');

            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML 格式错误');
            }

            const jsonObj = this._xmlToJson(xmlDoc.documentElement);
            this.setOutput(JSON.stringify(jsonObj, null, 2));
            this.hideError();
            app.setStatus('XML → JSON 成功');
        } catch (e) {
            this.showError('XML 解析错误: ' + e.message);
            app.setStatus('转换失败', 'error');
        }
    }

    _xmlToJson(xmlElement) {
        const obj = {};

        if (xmlElement.attributes && xmlElement.attributes.length > 0) {
            obj['@attributes'] = {};
            for (let i = 0; i < xmlElement.attributes.length; i++) {
                obj['@attributes'][xmlElement.attributes[i].name] = xmlElement.attributes[i].value;
            }
        }

        const children = xmlElement.childNodes;
        const textContent = [];
        const childNodes = [];

        for (let i = 0; i < children.length; i++) {
            if (children[i].nodeType === 1) {
                childNodes.push(children[i]);
            } else if (children[i].nodeType === 3) {
                const text = children[i].textContent.trim();
                if (text) textContent.push(text);
            }
        }

        if (childNodes.length === 0) {
            if (textContent.length > 0) {
                return textContent.join(' ');
            }
            return obj;
        }

        childNodes.forEach(child => {
            const childName = child.nodeName;
            const childValue = this._xmlToJson(child);

            if (obj[childName] !== undefined) {
                if (!Array.isArray(obj[childName])) {
                    obj[childName] = [obj[childName]];
                }
                obj[childName].push(childValue);
            } else {
                obj[childName] = childValue;
            }
        });

        return obj;
    }

    clearAll() {
        document.getElementById('json-input').value = '';
        this.setOutput('');
        this.hideError();
        app.setStatus('已清空');
    }

    copyResult() {
        const output = document.getElementById('json-output').value;
        if (!output) {
            app.setStatus('没有可复制的内容', 'error');
            return;
        }
        app.copyText(output);
    }
}
