/**
 * 快速模式视图 - 逻辑表达式智能打标签
 *
 * 功能：
 * - 显示规则列表（可增删改）
 * - 显示数据表格（内置示例数据）
 * - 执行匹配（调用真实 MatchEngine）
 * - 展示匹配结果与统计
 */
window.QuickModeView = (function() {

    var containerId = null;
    var rules = [];
    var rows = [];
    var matchResults = []; // 匹配结果缓存
    var selectedRowIndex = -1;

    /**
     * 初始化视图
     */
    function init(container) {
        containerId = typeof container === 'string' ? container : 'quickModeView';
        // 复制数据副本，避免修改原始数据
        rules = (window.QuickRules || []).map(function(r) {
            return Object.assign({}, r);
        });
        var sampleData = window.SampleData || { columns: [], rows: [] };
        rows = sampleData.rows || [];
        matchResults = [];

        render();
    }

    /**
     * 渲染整个视图
     */
    function render() {
        var container = document.getElementById(containerId);
        if (!container) return;

        var dataObj = window.SampleData || {};
        var dataRows = dataObj.rows || [];
        rows = dataRows;

        container.innerHTML = `
            <div class="flex-col" style="height:100%;">
                <!-- 子工具栏 -->
                <div class="sub-toolbar">
                    <span class="sub-toolbar-label">数据源:</span>
                    <select class="select-box" id="quickDataSource">
                        <option value="sample">内置示例数据（20行）</option>
                    </select>
                    <span class="sub-toolbar-label" style="margin-left:12px;">表头行:</span>
                    <input type="text" class="input-text" value="1" style="width:45px;text-align:center;" readonly>
                    <div class="toolbar-separator"></div>
                    <button class="btn btn-accent" id="quickRunMatch">▶ 执行匹配</button>
                    <button class="btn" id="quickClearResult">清除结果</button>
                    <div class="toolbar-separator"></div>
                    <button class="btn" id="quickHelp">📖 语法说明</button>
                </div>

                <!-- 主体：左规则列表 + 右数据表格 -->
                <div class="flex-row" style="flex:1;overflow:hidden;">
                    <!-- 规则列表 -->
                    <div class="rule-list-panel">
                        <div class="rule-list-header">
                            <span>规则列表（${rules.length}）</span>
                            <button class="btn btn-accent" id="quickAddRule" style="padding:2px 8px;font-size:11px;">+ 新增</button>
                        </div>
                        <div class="rule-list" id="quickRuleList"></div>
                    </div>

                    <!-- 数据表格 -->
                    <div class="flex-col" style="flex:1;">
                        <div class="data-panel-header">
                            <span>数据表格（${dataRows.length} 行）</span>
                            <span style="font-size:11px;color:#777;">点击行可选中，执行匹配后查看结果</span>
                        </div>
                        <div class="data-panel" style="flex:1;overflow:auto;">
                            <table class="data-table" id="quickDataTable">
                                <thead><tr id="quickTableHead"></tr></thead>
                                <tbody id="quickTableBody"></tbody>
                            </table>
                        </div>
                        <!-- 统计区 -->
                        <div class="stats-panel" id="quickStatsPanel">
                            <span class="stat-item"><span class="stat-label">数据行数:</span><span class="stat-value">${dataRows.length}</span></span>
                            <span class="stat-item"><span class="stat-label">启用规则:</span><span class="stat-value">${rules.filter(function(r){return r.isEnabled!==false;}).length}</span></span>
                            <span class="stat-item"><span class="stat-label">匹配结果:</span><span class="stat-value" id="quickMatchCount">未执行</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderRuleList();
        renderDataTable();
        bindEvents();
    }

    /**
     * 渲染规则列表
     */
    function renderRuleList() {
        var listEl = document.getElementById('quickRuleList');
        if (!listEl) return;

        listEl.innerHTML = rules.map(function(rule, idx) {
            var conditionDisplay = rule.includeCondition || '(无)';
            if (rule.excludeCondition) {
                conditionDisplay += '  [排除:' + rule.excludeCondition + ']';
            }
            return `
                <div class="rule-item" data-rule-index="${idx}">
                    <div class="rule-item-name">${escapeHtml(rule.name)} ${rule.isEnabled === false ? '<span style="color:#999;">(禁用)</span>' : ''}</div>
                    <div class="rule-item-condition">${escapeHtml(conditionDisplay)}</div>
                    <div class="rule-item-actions">
                        <a data-action="edit" data-index="${idx}">编辑</a>
                        <a data-action="delete" data-index="${idx}">删除</a>
                        <a data-action="toggle" data-index="${idx}">${rule.isEnabled === false ? '启用' : '禁用'}</a>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 渲染数据表格
     */
    function renderDataTable() {
        var dataObj = window.SampleData || {};
        var columns = dataObj.columns || [];
        var dataRows = dataObj.rows || [];

        // 表头
        var headEl = document.getElementById('quickTableHead');
        if (headEl) {
            headEl.innerHTML = columns.map(function(col) {
                var style = col.numeric ? ' style="text-align:right;"' : '';
                return `<th${style}>${escapeHtml(col.name)}</th>`;
            }).join('') + '<th>匹配结果</th>';
        }

        // 表体
        var bodyEl = document.getElementById('quickTableBody');
        if (bodyEl) {
            bodyEl.innerHTML = dataRows.map(function(row, idx) {
                var cells = columns.map(function(col) {
                    var val = row[col.key] || '';
                    var style = col.numeric ? ' class="numeric-cell"' : '';
                    return `<td${style}>${escapeHtml(String(val))}</td>`;
                }).join('');

                // 匹配结果列
                var matchCell = '<td class="no-match-cell">(未匹配)</td>';
                if (matchResults.length > 0) {
                    var matched = matchResults.filter(function(r) {
                        return r.rowIndex === row.rowIndex && r.matched;
                    });
                    if (matched.length > 0) {
                        var labels = matched.map(function(m) { return m.ruleName; });
                        matchCell = '<td class="match-result-cell">' + escapeHtml(labels.join('; ')) + '</td>';
                    }
                }

                var selectedClass = (idx === selectedRowIndex) ? ' selected' : '';
                return `<tr class="data-row${selectedClass}" data-row-index="${idx}">${cells}${matchCell}</tr>`;
            }).join('');
        }
    }

    /**
     * 执行匹配
     */
    function runMatch() {
        var dataObj = window.SampleData || {};
        var dataRows = dataObj.rows || [];
        var synonymGroups = window.SynonymGroups || [];

        // 调用真实引擎
        matchResults = window.MatchEngine.batchMatch(dataRows, rules, synonymGroups);

        // 统计
        var matchedRows = {};
        matchResults.forEach(function(r) {
            if (r.matched) {
                matchedRows[r.rowIndex] = true;
            }
        });
        var matchCount = Object.keys(matchedRows).length;

        // 更新表格
        renderDataTable();

        // 更新统计
        var countEl = document.getElementById('quickMatchCount');
        if (countEl) {
            countEl.textContent = matchCount + '/' + dataRows.length + ' 行匹配';
        }

        // 更新状态栏
        var statusEl = document.getElementById('statusText');
        if (statusEl) {
            statusEl.textContent = `快速模式 - 匹配完成：${matchCount}/${dataRows.length} 行命中规则`;
        }
    }

    /**
     * 清除匹配结果
     */
    function clearResult() {
        matchResults = [];
        renderDataTable();
        var countEl = document.getElementById('quickMatchCount');
        if (countEl) countEl.textContent = '未执行';
    }

    /**
     * 新增/编辑规则弹窗
     */
    function showRuleEditor(ruleIndex) {
        var rule = ruleIndex >= 0 ? rules[ruleIndex] : { id: 'r' + Date.now(), name: '', includeCondition: '', excludeCondition: '', returnValue: '', caseSensitive: false, isEnabled: true };
        var isEdit = ruleIndex >= 0;

        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="min-width:520px;">
                <div class="modal-header">
                    <span>${isEdit ? '编辑规则' : '新增规则'}</span>
                    <span class="modal-close" id="ruleEditClose">×</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">规则名称</label>
                        <input type="text" class="input-text" id="ruleName" value="${escapeHtml(rule.name)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">包含条件</label>
                        <input type="text" class="input-text" id="ruleInclude" value="${escapeHtml(rule.includeCondition)}" placeholder="如：无缝钢管 & DN50">
                        <div class="form-hint">支持 &amp;(与) |(或) !(非) ()(括号) =(精确) *(通配) regex:(正则) \`(边界) $[组名](同义词)</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">排除条件（可选）</label>
                        <input type="text" class="input-text" id="ruleExclude" value="${escapeHtml(rule.excludeCondition || '')}" placeholder="如：电缆">
                    </div>
                    <div class="form-group">
                        <label class="form-label">返回值（匹配标签）</label>
                        <input type="text" class="input-text" id="ruleReturn" value="${escapeHtml(rule.returnValue || '')}">
                    </div>
                    <div class="form-group">
                        <label><input type="checkbox" id="ruleEnabled" ${rule.isEnabled !== false ? 'checked' : ''}> 启用此规则</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" id="ruleEditCancel">取消</button>
                    <button class="btn btn-accent" id="ruleEditSave">保存</button>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').appendChild(modal);

        // 关闭
        document.getElementById('ruleEditClose').onclick = function() { modal.remove(); };
        document.getElementById('ruleEditCancel').onclick = function() { modal.remove(); };

        // 保存
        document.getElementById('ruleEditSave').onclick = function() {
            var newRule = {
                id: rule.id,
                name: document.getElementById('ruleName').value.trim(),
                includeCondition: document.getElementById('ruleInclude').value.trim(),
                excludeCondition: document.getElementById('ruleExclude').value.trim(),
                returnValue: document.getElementById('ruleReturn').value.trim(),
                caseSensitive: false,
                isEnabled: document.getElementById('ruleEnabled').checked
            };

            if (!newRule.name) {
                alert('请填写规则名称');
                return;
            }

            if (isEdit) {
                rules[ruleIndex] = newRule;
            } else {
                rules.push(newRule);
            }

            renderRuleList();
            updateStats();
            modal.remove();
        };
    }

    /**
     * 显示语法说明
     */
    function showHelp() {
        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="min-width:600px;">
                <div class="modal-header">
                    <span>规则语法说明</span>
                    <span class="modal-close" id="helpClose">×</span>
                </div>
                <div class="modal-body" style="font-size:13px;line-height:1.8;">
                    <h3 style="color:#4285F4;margin-bottom:8px;">逻辑运算符</h3>
                    <p><code>&amp;</code> 与 — 同时满足，如 <code>无缝钢管 &amp; DN50</code></p>
                    <p><code>|</code> 或 — 满足任一，如 <code>钢管|铜管</code></p>
                    <p><code>!</code> 非 — 排除条件，如 <code>!电缆</code></p>
                    <p><code>()</code> 括号 — 优先级，如 <code>(无缝&钢管)|(合金&钢管)</code></p>
                    <h3 style="color:#4285F4;margin:12px 0 8px;">匹配方式</h3>
                    <p><code>=A</code> 精确匹配 — 文本完全等于A</p>
                    <p><code>A*</code> / <code>A?</code> 通配符 — *任意多字符，?单字符</p>
                    <p><code>regex:\\d{4}</code> 正则匹配 — regex:前缀</p>
                    <h3 style="color:#4285F4;margin:12px 0 8px;">边界匹配</h3>
                    <p><code>\`321</code> 左边界 — 前面不能是数字/字母</p>
                    <p><code>321\`</code> 右边界 — 后面不能是数字/字母</p>
                    <p><code>\`321\`</code> 双边界 — 前后都不能是数字/字母</p>
                    <h3 style="color:#4285F4;margin:12px 0 8px;">同义词</h3>
                    <p><code>$[组名]</code> 引用同义词组，展开为 <code>(主词|同义词1|同义词2)</code></p>
                    <h3 style="color:#4285F4;margin:12px 0 8px;">全角兼容</h3>
                    <p>全角数字/字母自动归一化：<code>３２１</code> 等价于 <code>321</code></p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-accent" id="helpOk">确定</button>
                </div>
            </div>
        `;
        document.getElementById('modalContainer').appendChild(modal);
        document.getElementById('helpClose').onclick = function() { modal.remove(); };
        document.getElementById('helpOk').onclick = function() { modal.remove(); };
    }

    /**
     * 更新统计
     */
    function updateStats() {
        var dataRows = (window.SampleData || {}).rows || [];
        var enabledCount = rules.filter(function(r) { return r.isEnabled !== false; }).length;
        var panel = document.getElementById('quickStatsPanel');
        if (panel) {
            panel.innerHTML = `
                <span class="stat-item"><span class="stat-label">数据行数:</span><span class="stat-value">${dataRows.length}</span></span>
                <span class="stat-item"><span class="stat-label">启用规则:</span><span class="stat-value">${enabledCount}</span></span>
                <span class="stat-item"><span class="stat-label">匹配结果:</span><span class="stat-value" id="quickMatchCount">${matchResults.length > 0 ? '已执行' : '未执行'}</span></span>
            `;
        }
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
        // 执行匹配
        var runBtn = document.getElementById('quickRunMatch');
        if (runBtn) runBtn.onclick = runMatch;

        // 清除结果
        var clearBtn = document.getElementById('quickClearResult');
        if (clearBtn) clearBtn.onclick = clearResult;

        // 新增规则
        var addBtn = document.getElementById('quickAddRule');
        if (addBtn) addBtn.onclick = function() { showRuleEditor(-1); };

        // 帮助
        var helpBtn = document.getElementById('quickHelp');
        if (helpBtn) helpBtn.onclick = showHelp;

        // 规则列表操作（事件委托）
        var ruleList = document.getElementById('quickRuleList');
        if (ruleList) {
            ruleList.onclick = function(e) {
                var target = e.target;
                if (target.tagName === 'A' && target.dataset.action) {
                    var action = target.dataset.action;
                    var idx = parseInt(target.dataset.index);
                    if (action === 'edit') {
                        showRuleEditor(idx);
                    } else if (action === 'delete') {
                        if (confirm('确定删除规则"' + rules[idx].name + '"？')) {
                            rules.splice(idx, 1);
                            renderRuleList();
                            updateStats();
                        }
                    } else if (action === 'toggle') {
                        rules[idx].isEnabled = !(rules[idx].isEnabled !== false);
                        renderRuleList();
                        updateStats();
                    }
                }
            };
        }

        // 数据表格行选中
        var tableBody = document.getElementById('quickTableBody');
        if (tableBody) {
            tableBody.onclick = function(e) {
                var row = e.target.closest('tr.data-row');
                if (row) {
                    var idx = parseInt(row.dataset.rowIndex);
                    // 取消之前选中
                    document.querySelectorAll('#quickTableBody tr.selected').forEach(function(r) {
                        r.classList.remove('selected');
                    });
                    row.classList.add('selected');
                    selectedRowIndex = idx;
                }
            };
        }
    }

    /**
     * HTML转义
     */
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init: init
    };
})();
