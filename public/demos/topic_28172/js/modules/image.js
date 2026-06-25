// 图片格式转换模块
class ImageModule {
    constructor() {
        this.title = '图片工具';
        this.currentImage = null;
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div id="image-drop-area" style="padding:16px;background:var(--bg-card);border:2px dashed var(--border);border-radius:8px;text-align:center;cursor:pointer;" onclick="document.getElementById('image-file').click()">
                    <input type="file" id="image-file" accept="image/*" style="display:none;" onchange="app.modules.image.handleFile(event)">
                    <div style="font-size:40px;margin-bottom:8px;">📷</div>
                    <div style="font-size:13px;color:var(--text-secondary);">点击选择图片 或 拖拽图片到此处</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">支持 PNG, JPG, GIF, WEBP, BMP 等</div>
                </div>

                <div id="image-preview-section" style="display:none;padding:16px;background:var(--bg-card);border-radius:8px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">
                        <div style="text-align:center;">
                            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">原图</div>
                            <img id="image-preview" style="max-width:100%;max-height:300px;border-radius:8px;">
                            <div id="image-info" style="margin-top:8px;font-size:12px;color:var(--text-secondary);"></div>
                        </div>
                        <div>
                            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">转换设置</div>
                            <div style="display:grid;gap:10px;">
                                <div>
                                    <label style="font-size:12px;color:var(--text-secondary);">输出格式</label>
                                    <select id="image-format" style="width:100%;padding:8px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);margin-top:4px;">
                                        <option value="image/png">PNG</option>
                                        <option value="image/jpeg" selected>JPEG</option>
                                        <option value="image/webp">WebP</option>
                                        <option value="image/bmp">BMP</option>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size:12px;color:var(--text-secondary);">质量 (仅 JPEG/WebP)</label>
                                    <input type="range" id="image-quality" min="10" max="100" value="90" style="width:100%;margin-top:4px;">
                                    <div style="font-size:11px;color:var(--text-secondary);text-align:right;"><span id="quality-value">90</span>%</div>
                                </div>
                                <div>
                                    <label style="font-size:12px;color:var(--text-secondary);">调整尺寸（可选）</label>
                                    <div style="display:flex;gap:8px;margin-top:4px;">
                                        <input type="number" id="image-width" placeholder="宽" min="1" style="flex:1;padding:8px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
                                        <span style="color:var(--text-secondary);align-self:center;">×</span>
                                        <input type="number" id="image-height" placeholder="高" min="1" style="flex:1;padding:8px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
                                    </div>
                                </div>
                                <button class="btn btn-primary" onclick="app.modules.image.convert()" style="padding:10px;">转换并下载</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加质量显示
        setTimeout(() => {
            const qualityEl = document.getElementById('image-quality');
            if (qualityEl) {
                qualityEl.addEventListener('input', (e) => {
                    document.getElementById('quality-value').textContent = e.target.value;
                });
            }

            // 添加拖拽支持
            const dropArea = document.getElementById('image-drop-area');
            if (dropArea) {
                dropArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropArea.style.borderColor = 'var(--accent)';
                    dropArea.style.background = 'rgba(99, 102, 241, 0.1)';
                });

                dropArea.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    dropArea.style.borderColor = 'var(--border)';
                    dropArea.style.background = 'var(--bg-card)';
                });

                dropArea.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                });

                dropArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropArea.style.borderColor = 'var(--border)';
                    dropArea.style.background = 'var(--bg-card)';

                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('image/')) {
                            const event = { target: { files: [file] } };
                            app.modules.image.handleFile(event);
                        } else {
                            app.setStatus('请选择图片文件', 'error');
                        }
                    }
                });
            }
        }, 100);
    }

    handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            app.setStatus('请选择图片文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            const img = document.getElementById('image-preview');
            img.src = this.currentImage;

            // 显示信息
            const sizeKB = (file.size / 1024).toFixed(2);
            const sizeDisplay = sizeKB > 1024 ? (sizeKB / 1024).toFixed(2) + ' MB' : sizeKB + ' KB';
            document.getElementById('image-info').textContent = `${file.name} | ${sizeDisplay} | ${file.type}`;

            document.getElementById('image-preview-section').style.display = 'block';

            // 获取图片尺寸
            img.onload = () => {
                document.getElementById('image-width').placeholder = img.naturalWidth;
                document.getElementById('image-height').placeholder = img.naturalHeight;
            };

            app.setStatus('图片加载成功');
        };
        reader.readAsDataURL(file);
    }

    convert() {
        if (!this.currentImage) {
            app.setStatus('请先选择图片', 'error');
            return;
        }

        const format = document.getElementById('image-format').value;
        const quality = parseInt(document.getElementById('image-quality').value) / 100;
        const width = parseInt(document.getElementById('image-width').value);
        const height = parseInt(document.getElementById('image-height').value);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let targetW = width || img.width;
            let targetH = height || img.height;

            // 如果只设置了一个，按比例
            if (width && !height) {
                targetH = Math.round(img.height * (width / img.width));
            } else if (height && !width) {
                targetW = Math.round(img.width * (height / img.height));
            }

            canvas.width = targetW;
            canvas.height = targetH;

            // 对于 JPEG 填充白色背景
            if (format === 'image/jpeg' || format === 'image/bmp') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, targetW, targetH);
            }

            ctx.drawImage(img, 0, 0, targetW, targetH);

            const mimeType = format;
            const dataUrl = canvas.toDataURL(mimeType, quality);

            // 下载
            const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
            const link = document.createElement('a');
            link.download = `converted_${Date.now()}.${ext}`;
            link.href = dataUrl;
            link.click();

            app.setStatus('转换成功');
        };
        img.src = this.currentImage;
    }
}
