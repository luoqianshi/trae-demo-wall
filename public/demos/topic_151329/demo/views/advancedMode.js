/**
 * 高级模式视图 - 漏斗式三层解析（预设数据演示）
 *
 * 三层架构：
 * 1. 专业路由（短路网关）
 * 2. 平行特征抽取
 * 3. 组合造价规则
 *
 * 注：本视图使用预计算结果演示，非真实引擎
 */
window.AdvancedModeView = (function() {

    var containerId = null;

    function init(container) {
        containerId = typeof container === 'string' ? container : 'advancedModeView';
        render();
    }

    function render() {
        var container = document.getElementById(containerId);
        if (!container) return;

        var disciplines = window.Disciplines || [];
        var comboRules = window.CombinationRules || [];
        var results = window.FunnelResults || [];

        container.innerHTML = `
            <div class="flex-col" style="height:100%;">
                <!-- 子工具栏 -->
                <div class="sub-toolbar">
                    <button class="btn" id="advViewDisciplines">📋 专业词典</button>
                    <button class="btn" id="advViewFeatures">📋 特征规则表</button>
                    <button class="btn" id="advViewCombos">📋 组合规则</button>
                    <div class="toolbar-separator"></div>
                    <button class="btn btn-accent" id="advRunFunnel">▶ 三层解析</button>
                    <button class="btn" id="advClearResult">清除结果</button>
                    <div class="toolbar-separator"></div>
                    <span style="font-size:11px;color:#777;">漏斗式三层解析：专业路由 → 特征抽取 → 组合规则</span>
                </div>

                <!-- 主体：左配置预览 + 右解析结果 -->
                <div class="flex-row" style="flex:1;overflow:hidden;">
                    <!-- 配置预览 -->
                    <div class="config-preview">
                        <div class="config-section">
                            <div class="config-section-title">专业词典（第一层）</div>
                            ${disciplines.map(function(d) {
                                return `<div class="config-item"><strong>${escapeHtml(d.code)} ${escapeHtml(d.name)}</strong>（优先级${d.priority}）<br><span style="color:#999;">准入: ${escapeHtml(d.includeCondition)}</span></div>`;
                            }).join('')}
                        </div>
                        <div class="config-section">
                            <div class="config-section-title">组合规则（第三层）</div>
                            ${comboRules.map(function(r) {
                                var typeColor = r.ruleType === 'Conflict' ? '#D93025' : (r.ruleType === 'Default' ? '#CC6600' : '#1A56DB');
                                return `<div class="config-item"><strong>${escapeHtml(r.name)}</strong> <span style="color:${typeColor};">[${r.ruleType}]</span><br><span style="color:#999;">条件: ${escapeHtml(r.condition)}</span><br><span style="color:#999;">输出: ${escapeHtml(r.outputLabel)} = ${escapeHtml(r.outputValue)}</span></div>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- 解析结果表格 -->
                    <div class="flex-col" style="flex:1;">
                        <div class="data-panel-header">
                            <span>三层解析结果（${results.length} 行）</span>
                            <span style="font-size:11px;color:#777;">点击"三层解析"按钮执行演示</span>
                        </div>
                        <div class="data-panel" style="flex:1;overflow:auto;">
                            <table class="data-table" id="advResultTable">
                                <thead>
                                    <tr>
                                        <th style="width:40px;">行号</th>
                                        <th style="width:250px;">原始文本</th>
                                        <th style="width:80px;">专业</th>
                                        <th style="width:200px;">特征字典</th>
                                        <th style="width:200px;">组合结果</th>
                                        <th style="width:150px;">警告/推断</th>
                                    </tr>
                                </thead>
                                <tbody id="advResultBody">
                                    <tr><td colspan="6" style="text-align:center;color:#999;padding:40px;">点击"▶ 三层解析"按钮查看结果</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="stats-panel" id="advStatsPanel">
                            <span class="stat-item"><span class="stat-label">数据行数:</span><span class="stat-value">${results.length}</span></span>
                            <span class="stat-item"><span class="stat-label">专业数:</span><span class="stat-value">${disciplines.length}</span></span>
                            <span class="stat-item"><span class="stat-label">组合规则:</span><span class="stat-value">${comboRules.length}</span></span>
                            <span class="stat-item"><span class="stat-label">解析结果:</span><span class="stat-value" id="advParseCount">未执行</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        bindEvents();
    }

    /**
     * 执行三层解析（动画展示预设结果）
     */
    function runFunnel() {
        var results = window.FunnelResults || [];
        var bodyEl = document.getElementById('advResultBody');
        if (!bodyEl) return;

        bodyEl.innerHTML = '';

        var statusEl = document.getElementById('statusText');
        if (statusEl) statusEl.textContent = '高级模式 - 正在执行三层解析...';

        var idx = 0;
        function showNext() {
            if (idx >= results.length) {
                var countEl = document.getElementById('advParseCount');
                if (countEl) countEl.textContent = results.length + ' 行已解析';
                if (statusEl) statusEl.textContent = `高级模式 - 三层解析完成：${results.length} 行`;
                return;
            }

            var r = results[idx];
            var featuresText = r.features.map(function(f) {
                return f.name + '=' + f.value;
            }).join('; ');

            var combosText = r.combinations.map(function(c) {
                return c.label + '=' + c.value;
            }).join('; ');

            var warningsText = '';
            if (r.warnings && r.warnings.length > 0) {
                warningsText += '<span style="color:#D93025;">⚠ ' + escapeHtml(r.warnings.join('; ')) + '</span>';
            }
            if (r.inferences && r.inferences.length > 0) {
                if (warningsText) warningsText += '<br>';
                warningsText += '<span style="color:#CC6600;">💡 ' + escapeHtml(r.inferences.join('; ')) + '</span>';
            }

            var disciplineCell = r.discipline.matched
                ? `<span style="color:#1A56DB;font-weight:600;">${escapeHtml(r.discipline.code)} ${escapeHtml(r.discipline.name)}</span>`
                : '<span style="color:#D93025;">未识别</span>';

            var tr = document.createElement('tr');
            tr.className = 'highlight-row';
            tr.innerHTML = `
                <td class="numeric-cell">${r.row}</td>
                <td style="font-size:11px;color:#555;">${escapeHtml(r.inputText)}</td>
                <td>${disciplineCell}</td>
                <td style="font-size:11px;">${escapeHtml(featuresText)}</td>
                <td style="font-size:11px;color:#1A56DB;">${escapeHtml(combosText)}</td>
                <td style="font-size:11px;">${warningsText || '<span style="color:#999;">-</span>'}</td>
            `;
            bodyEl.appendChild(tr);

            idx++;
            setTimeout(showNext, 150); // 逐行动画
        }

        showNext();
    }

    /**
     * 清除结果
     */
    function clearResult() {
        var bodyEl = document.getElementById('advResultBody');
        if (bodyEl) {
            bodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:40px;">点击"▶ 三层解析"按钮查看结果</td></tr>';
        }
        var countEl = document.getElementById('advParseCount');
        if (countEl) countEl.textContent = '未执行';
    }

    /**
     * 查看专业词典详情
     */
    function viewDisciplines() {
        var disciplines = window.Disciplines || [];
        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="min-width:700px;">
                <div class="modal-header">
                    <span>专业词典（第一层：专业路由）</span>
                    <span class="modal-close">×</span>
                </div>
                <div class="modal-body">
                    <table class="data-table">
                        <thead><tr><th>编码</th><th>专业名称</th><th>准入关键字</th><th>排除关键字</th><th>优先级</th><th>说明</th></tr></thead>
                        <tbody>
                            ${disciplines.map(function(d) {
                                return `<tr><td>${escapeHtml(d.code)}</td><td>${escapeHtml(d.name)}</td><td style="font-size:11px;">${escapeHtml(d.includeCondition)}</td><td style="font-size:11px;">${escapeHtml(d.excludeCondition || '-')}</td><td class="numeric-cell">${d.priority}</td><td style="font-size:11px;">${escapeHtml(d.description || '')}</td></tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer"><button class="btn btn-accent">关闭</button></div>
            </div>
        `;
        document.getElementById('modalContainer').appendChild(modal);
        modal.querySelector('.modal-close').onclick = function() { modal.remove(); };
        modal.querySelector('.modal-footer button').onclick = function() { modal.remove(); };
    }

    /**
     * 查看组合规则详情
     */
    function viewCombos() {
        var combos = window.CombinationRules || [];
        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="min-width:800px;">
                <div class="modal-header">
                    <span>组合规则（第三层：组合造价规则）</span>
                    <span class="modal-close">×</span>
                </div>
                <div class="modal-body">
                    <table class="data-table">
                        <thead><tr><th>名称</th><th>类型</th><th>条件表达式</th><th>输出标签</th><th>输出值</th><th>警告</th></tr></thead>
                        <tbody>
                            ${combos.map(function(r) {
                                var typeColor = r.ruleType === 'Conflict' ? '#D93025' : (r.ruleType === 'Default' ? '#CC6600' : '#1A56DB');
                                return `<tr><td>${escapeHtml(r.name)}</td><td style="color:${typeColor};font-weight:600;">${r.ruleType}</td><td style="font-size:11px;">${escapeHtml(r.condition)}</td><td>${escapeHtml(r.outputLabel)}</td><td style="font-size:11px;">${escapeHtml(r.outputValue || '-')}</td><td style="font-size:11px;color:#D93025;">${escapeHtml(r.warningMessage || '-')}</td></tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top:12px;font-size:12px;color:#777;">
                        <p><strong style="color:#1A56DB;">Output</strong> - 直接输出组合标签</p>
                        <p><strong style="color:#D93025;">Conflict</strong> - 条件冲突校验，记录警告</p>
                        <p><strong style="color:#CC6600;">Default</strong> - 缺失项默认补齐</p>
                    </div>
                </div>
                <div class="modal-footer"><button class="btn btn-accent">关闭</button></div>
            </div>
        `;
        document.getElementById('modalContainer').appendChild(modal);
        modal.querySelector('.modal-close').onclick = function() { modal.remove(); };
        modal.querySelector('.modal-footer button').onclick = function() { modal.remove(); };
    }

    /**
     * 查看特征规则表
     */
    function viewFeatures() {
        var features = window.FeatureRules || {};
        var html = '';
        for (var disciplineId in features) {
            var tables = features[disciplineId];
            var disciplineName = '';
            var disciplines = window.Disciplines || [];
            for (var i = 0; i < disciplines.length; i++) {
                if (disciplines[i].id === disciplineId) {
                    disciplineName = disciplines[i].name;
                    break;
                }
            }
            html += `<h3 style="color:#4285F4;margin:12px 0 6px;">${escapeHtml(disciplineName)}（${disciplineId}）</h3>`;
            tables.forEach(function(table) {
                html += `<p style="font-weight:600;margin:8px 0 4px;">${escapeHtml(table.name)}（${table.type}）</p>`;
                html += '<table class="data-table"><thead><tr><th>包含条件</th><th>排除条件</th><th>返回值</th><th>属性</th></tr></thead><tbody>';
                table.entries.forEach(function(e) {
                    var attrs = '';
                    for (var k in e.attributes) {
                        attrs += k + '=' + e.attributes[k] + '; ';
                    }
                    html += `<tr><td style="font-size:11px;">${escapeHtml(e.include)}</td><td style="font-size:11px;">${escapeHtml(e.exclude || '-')}</td><td>${escapeHtml(e.returnValue)}</td><td style="font-size:11px;">${escapeHtml(attrs)}</td></tr>`;
                });
                html += '</tbody></table>';
            });
        }

        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="min-width:700px;">
                <div class="modal-header">
                    <span>特征规则表（第二层：平行特征抽取）</span>
                    <span class="modal-close">×</span>
                </div>
                <div class="modal-body">${html}</div>
                <div class="modal-footer"><button class="btn btn-accent">关闭</button></div>
            </div>
        `;
        document.getElementById('modalContainer').appendChild(modal);
        modal.querySelector('.modal-close').onclick = function() { modal.remove(); };
        modal.querySelector('.modal-footer button').onclick = function() { modal.remove(); };
    }

    function bindEvents() {
        var runBtn = document.getElementById('advRunFunnel');
        if (runBtn) runBtn.onclick = runFunnel;

        var clearBtn = document.getElementById('advClearResult');
        if (clearBtn) clearBtn.onclick = clearResult;

        var discBtn = document.getElementById('advViewDisciplines');
        if (discBtn) discBtn.onclick = viewDisciplines;

        var comboBtn = document.getElementById('advViewCombos');
        if (comboBtn) comboBtn.onclick = viewCombos;

        var featBtn = document.getElementById('advViewFeatures');
        if (featBtn) featBtn.onclick = viewFeatures;
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return { init: init };
})();
