/**
 * S3D建库数据自动生成软件 - Web版前端逻辑
 */

// 全局状态
const appState = {
    parsed: false,
    classes: {},
    parts: {},
    config: {},
    logs: [],
};

const CONFIG_FIELDS = [
    'commodity_type_override', 'geometry_type_override', 'symbol_definition',
    'geom_industry_std_override', 'material_grade_override', 'part_data_basis',
    'piping_point_basis', 'end_preparation_override', 'end_standard',
    'flow_direction', 'face_to_center'
];

// =============================================================================
// 初始化
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 文件选择监听
    document.getElementById('specFileInput').addEventListener('change', handleFileSelect);

    // 加载保存的配置
    loadSavedConfig();

    // 开始日志轮询
    setInterval(fetchLogs, 2000);
    fetchLogs();

    logToUI('系统就绪，请上传材料等级表');
});

// =============================================================================
// 文件上传
// =============================================================================

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                document.getElementById('specFilePath').value = data.filename;
                logToUI(`已上传: ${data.filename}`);
            } else {
                logToUI(`上传失败: ${data.message}`, 'error');
            }
        })
        .catch(err => logToUI(`上传错误: ${err}`, 'error'));
}

function setOutputDir() {
    const dir = document.getElementById('outputDir').value;
    fetch('/api/output_dir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output_dir: dir })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            logToUI(`输出目录: ${data.output_dir}`);
        }
    });
}

// =============================================================================
// 解析材料等级表
// =============================================================================

function parseSpec() {
    if (!document.getElementById('specFilePath').value) {
        alert('请先上传材料等级表');
        return;
    }

    showProgress(10, '正在解析材料等级表...');

    fetch('/api/parse', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                appState.parsed = true;
                appState.classes = data.classes;
                appState.parts = data.parts;

                renderClassList(data.classes);
                renderInfoTable(data.classes);
                renderPartsTable(data.parts);

                enableButtons();
                showProgress(100, '解析完成!');
                setTimeout(() => hideProgress(), 1500);

                logToUI(data.message, 'success');
            } else {
                showProgress(0, '');
                hideProgress();
                logToUI(`解析失败: ${data.message}`, 'error');
                if (data.traceback) console.error(data.traceback);
            }
        })
        .catch(err => {
            hideProgress();
            logToUI(`解析错误: ${err}`, 'error');
        });
}

// =============================================================================
// 渲染
// =============================================================================

function renderClassList(classes) {
    const container = document.getElementById('classList');
    container.innerHTML = '';

    Object.keys(classes).forEach(name => {
        const div = document.createElement('div');
        div.className = 'class-item';
        div.innerHTML = `
            <input type="checkbox" id="cls_${name}" value="${name}" checked>
            <label for="cls_${name}">${name}</label>
        `;
        container.appendChild(div);
    });
}

function renderInfoTable(classes) {
    const tbody = document.querySelector('#infoTable tbody');
    tbody.innerHTML = '';

    Object.entries(classes).forEach(([name, info]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${name}</td>
            <td>${info.service || ''}</td>
            <td>${info.design_temp || ''}</td>
            <td>${info.design_pressure || ''}</td>
            <td>${info.piping_material || ''}</td>
            <td>${info.flange_rating || ''}</td>
            <td>${info.flange_face || ''}</td>
            <td>${info.valve_body_material || ''}</td>
            <td>${info.corrosion_allowance || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPartsTable(parts) {
    const tbody = document.querySelector('#partsTable tbody');
    tbody.innerHTML = '';

    Object.entries(parts).forEach(([className, classParts]) => {
        classParts.forEach(part => {
            const dp = part.description_parts || ['', '', '', '', ''];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${className}</td>
                <td>${part.item_type || ''}</td>
                <td>${part.size_range || ''}</td>
                <td>${part.npd_unit_type || ''}</td>
                <td>${part.rating || ''}</td>
                <td>${part.ends || ''}</td>
                <td>${dp[0] || ''}</td>
                <td>${dp[1] || ''}</td>
                <td>${dp[3] || ''}</td>
                <td>${dp[4] || ''}</td>
                <td>${part.commodity_code || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// =============================================================================
// 材料等级选择
// =============================================================================

function selectAllClasses(select) {
    document.querySelectorAll('#classList input[type="checkbox"]').forEach(cb => {
        cb.checked = select;
    });
}

function getSelectedClasses() {
    return Array.from(document.querySelectorAll('#classList input[type="checkbox"]:checked'))
        .map(cb => cb.value);
}

// =============================================================================
// 配置模态框
// =============================================================================

function openConfigModal() {
    if (!appState.parsed) {
        alert('请先解析材料等级表');
        return;
    }

    renderConfigTable();
    document.getElementById('configModal').style.display = 'flex';
}

function closeConfigModal() {
    document.getElementById('configModal').style.display = 'none';
}

function renderConfigTable() {
    const tbody = document.querySelector('#configTable tbody');
    tbody.innerHTML = '';

    // 收集唯一的零件类型，保持首次出现的顺序
    const itemTypes = [];
    Object.values(appState.parts).forEach(classParts => {
        classParts.forEach(part => {
            const it = (part.item_type || '').trim().toUpperCase();
            if (it && !itemTypes.includes(it)) {
                itemTypes.push(it);
            }
        });
    });

    itemTypes.forEach(itemType => {
        const tr = document.createElement('tr');
        let html = `<td><strong>${itemType}</strong></td>`;

        CONFIG_FIELDS.forEach(field => {
            const savedValue = (appState.config[itemType] || {})[field] || '';
            html += `<td><input type="text" data-item-type="${itemType}" data-field="${field}" value="${savedValue}" placeholder=""></td>`;
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function autoFillConfig() {
    fetch('/api/config/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts: appState.parts })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const config = data.config;
            // 填充表格
            document.querySelectorAll('#configTable input').forEach(input => {
                const itemType = input.dataset.itemType;
                const field = input.dataset.field;
                if (config[itemType] && config[itemType][field]) {
                    input.value = config[itemType][field];
                }
            });
            logToUI(`自动填充完成: ${Object.keys(config).length} 种零件类型`, 'success');
        } else {
            logToUI(`自动填充失败: ${data.message}`, 'error');
        }
    })
    .catch(err => logToUI(`自动填充错误: ${err}`, 'error'));
}

function clearAllConfig() {
    if (!confirm('确定要清空所有已填写的值吗？')) return;
    document.querySelectorAll('#configTable input').forEach(input => {
        input.value = '';
    });
}

function saveConfig() {
    const config = {};

    document.querySelectorAll('#configTable input').forEach(input => {
        const itemType = input.dataset.itemType;
        const field = input.dataset.field;
        const value = input.value.trim();

        if (value) {
            if (!config[itemType]) config[itemType] = {};
            config[itemType][field] = value;
        }
    });

    appState.config = config;

    fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            logToUI('配置保存成功', 'success');
            closeConfigModal();
        } else {
            logToUI(`保存失败: ${data.message}`, 'error');
        }
    });
}

function loadSavedConfig() {
    fetch('/api/config/load')
        .then(r => r.json())
        .then(data => {
            if (data.success && data.config) {
                appState.config = data.config;
            }
        });
}

// =============================================================================
// 生成S3D数据
// =============================================================================

function generateData() {
    const selected = getSelectedClasses();
    if (selected.length === 0) {
        alert('请至少选择一个材料等级');
        return;
    }

    if (!confirm(`确定要为 ${selected.length} 个材料等级生成S3D数据吗？`)) return;

    showProgress(30, '正在生成PipingCatalog和SPC数据...');

    fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            selected_classes: selected,
            output_dir: document.getElementById('outputDir').value
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showProgress(100, '生成完成!');
            setTimeout(() => hideProgress(), 1500);
            logToUI(data.message, 'success');
            showResultModal(data);
        } else {
            hideProgress();
            logToUI(`生成失败: ${data.message}`, 'error');
            if (data.traceback) console.error(data.traceback);
        }
    })
    .catch(err => {
        hideProgress();
        logToUI(`生成错误: ${err}`, 'error');
    });
}

// =============================================================================
// 预览
// =============================================================================

function openPreviewModal() {
    if (!appState.parsed) {
        alert('请先解析材料等级表');
        return;
    }

    renderPreviewClasses();
    renderPreviewStats();
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

function renderPreviewClasses() {
    const container = document.getElementById('previewClasses');
    let html = '<table><thead><tr><th>材料等级</th><th>服务介质</th><th>零件数量</th></tr></thead><tbody>';

    Object.entries(appState.classes).forEach(([name, info]) => {
        const partCount = (appState.parts[name] || []).length;
        html += `<tr><td>${name}</td><td>${info.service || ''}</td><td>${partCount}</td></tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderPreviewStats() {
    const container = document.getElementById('previewStats');
    const stats = {};

    Object.values(appState.parts).forEach(classParts => {
        classParts.forEach(part => {
            const it = (part.item_type || '').trim().toUpperCase();
            if (!stats[it]) stats[it] = 0;
            stats[it]++;
        });
    });

    let html = '<table><thead><tr><th>零件类型</th><th>数量</th></tr></thead><tbody>';
    Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        html += `<tr><td>${type}</td><td>${count}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function switchTab(tabEl, contentId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(contentId).style.display = 'block';
}

// =============================================================================
// 结果模态框
// =============================================================================

function showResultModal(data) {
    document.getElementById('resultMessage').textContent = data.message;

    const list = document.getElementById('resultFileList');
    list.innerHTML = '';

    data.files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <span>${file.desc} - ${file.basename}</span>
            <a href="/api/download/${encodeURIComponent(file.basename)}" download>下载</a>
        `;
        list.appendChild(div);
    });

    document.getElementById('resultModal').style.display = 'flex';
}

function closeResultModal() {
    document.getElementById('resultModal').style.display = 'none';
}

// =============================================================================
// 进度条
// =============================================================================

function showProgress(percent, text) {
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('progressText').textContent = text || (percent + '%');
}

function hideProgress() {
    document.getElementById('progressContainer').style.display = 'none';
}

// =============================================================================
// 按钮状态
// =============================================================================

function enableButtons() {
    document.getElementById('btnConfig').disabled = false;
    document.getElementById('btnGenerate').disabled = false;
    document.getElementById('btnPreview').disabled = false;
}

// =============================================================================
// 日志
// =============================================================================

function logToUI(message, type = 'info') {
    const container = document.getElementById('logContent');
    const span = document.createElement('span');
    span.className = `log-${type}`;
    span.textContent = `[${new Date().toLocaleTimeString()}] ${message}\n`;
    container.appendChild(span);
    container.scrollTop = container.scrollHeight;
}

function fetchLogs() {
    fetch('/api/logs')
        .then(r => r.json())
        .then(data => {
            const container = document.getElementById('logContent');
            if (data.logs && data.logs.length > appState.logs.length) {
                appState.logs = data.logs;
                container.innerHTML = '';
                data.logs.forEach(log => {
                    const span = document.createElement('span');
                    let type = 'info';
                    if (log.includes('[错误]') || log.includes('失败')) type = 'error';
                    else if (log.includes('[警告]')) type = 'warn';
                    else if (log.includes('成功') || log.includes('完成')) type = 'success';
                    span.className = `log-${type}`;
                    span.textContent = log + '\n';
                    container.appendChild(span);
                });
                container.scrollTop = container.scrollHeight;
            }
        })
        .catch(() => {});
}

// 点击模态框外部关闭
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
        }
    });
});
