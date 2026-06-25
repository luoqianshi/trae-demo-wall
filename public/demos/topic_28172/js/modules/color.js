// 颜色转换模块
class ColorModule {
    constructor() {
        this.title = '颜色转换';
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div>
                    <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">选择颜色或输入</label>
                    <div style="display:flex;gap:8px;">
                        <input type="color" id="color-picker" value="#4f46e5" style="width:60px;height:50px;cursor:pointer;border:none;background:transparent;">
                        <input type="text" id="color-input" value="#4f46e5" placeholder="#4f46e5, rgb(79,70,229)" style="flex:1;padding:12px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;">
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;">
                        <button class="btn btn-primary" onclick="app.modules.color.convert()" style="flex:1;padding:8px;">转换</button>
                        <button class="btn btn-secondary" onclick="app.modules.color.random()" style="flex:1;padding:8px;">随机颜色</button>
                    </div>
                </div>

                <div id="color-preview" style="height:120px;border-radius:8px;transition:background 0.3s;"></div>

                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;text-align:center;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">HEX</div>
                        <div id="color-hex" style="font-family:monospace;font-size:14px;color:var(--success)">#4F46E5</div>
                    </div>
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;text-align:center;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">RGB</div>
                        <div id="color-rgb" style="font-family:monospace;font-size:14px;color:var(--success)">rgb(79, 70, 229)</div>
                    </div>
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;text-align:center;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">HSL</div>
                        <div id="color-hsl" style="font-family:monospace;font-size:14px;color:var(--success)">hsl(239, 65%, 59%)</div>
                    </div>
                    <div style="padding:12px;background:var(--bg-card);border-radius:8px;text-align:center;">
                        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">RGBA</div>
                        <div id="color-rgba" style="font-family:monospace;font-size:14px;color:var(--success)">rgba(79, 70, 229, 1)</div>
                    </div>
                </div>
            </div>
        `;

        // 监听颜色选择器
        const picker = document.getElementById('color-picker');
        picker.addEventListener('input', (e) => {
            document.getElementById('color-input').value = e.target.value;
            this.doConvert(e.target.value);
        });
    }

    convert() {
        const input = document.getElementById('color-input').value.trim();
        if (!input) {
            app.setStatus('请输入颜色', 'error');
            return;
        }
        this.doConvert(input);
        app.setStatus('转换成功');
    }

    random() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
        document.getElementById('color-input').value = hex;
        document.getElementById('color-picker').value = hex;
        this.doConvert(hex);
        app.setStatus('已生成随机颜色');
    }

    doConvert(input) {
        let r, g, b;

        // 解析 HEX
        if (input.startsWith('#')) {
            let hex = input.slice(1);
            if (hex.length === 3) {
                hex = hex.split('').map(c => c + c).join('');
            }
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        // 解析 RGB
        else if (input.toLowerCase().startsWith('rgb')) {
            const match = input.match(/rgb[a]?\s*\(\s*(\d+)\s*[,\s]*(\d+)\s*[,\s]*(\d+)/i);
            if (match) {
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
            }
        }
        // 解析 HSL
        else if (input.toLowerCase().startsWith('hsl')) {
            const match = input.match(/hsl[a]?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%/i);
            if (match) {
                const hsl = this.hslToRgb(parseInt(match[1]) / 360, parseInt(match[2]) / 100, parseInt(match[3]) / 100);
                r = hsl[0]; g = hsl[1]; b = hsl[2];
            }
        }

        if (r === undefined || isNaN(r) || isNaN(g) || isNaN(b)) {
            // 默认颜色
            app.setStatus('无效的颜色格式', 'error');
            return;
        }

        // 更新预览
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
        document.getElementById('color-preview').style.background = hex;

        // 更新 HEX 值
        document.getElementById('color-hex').textContent = hex;
        document.getElementById('color-hex').style.cursor = 'text';
        document.getElementById('color-hex').onclick = () => app.copyText(hex);

        // RGB
        const rgbStr = `rgb(${r}, ${g}, ${b})`;
        document.getElementById('color-rgb').textContent = rgbStr;
        document.getElementById('color-rgb').style.cursor = 'text';
        document.getElementById('color-rgb').onclick = () => app.copyText(rgbStr);

        // HSL
        const hsl = this.rgbToHsl(r, g, b);
        const hslStr = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
        document.getElementById('color-hsl').textContent = hslStr;
        document.getElementById('color-hsl').style.cursor = 'text';
        document.getElementById('color-hsl').onclick = () => app.copyText(hslStr);

        // RGBA
        const rgbaStr = `rgba(${r}, ${g}, ${b}, 1)`;
        document.getElementById('color-rgba').textContent = rgbaStr;
        document.getElementById('color-rgba').onclick = () => app.copyText(rgbaStr);

        // 应用背景色
        document.getElementById('color-preview').style.background = `rgb(${r},${g},${b})`;
        document.getElementById('color-picker').value = hex.toLowerCase();
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}
