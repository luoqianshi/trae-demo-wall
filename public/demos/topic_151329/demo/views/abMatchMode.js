/**
 * AB表智能匹配视图 - 评分匹配+多候选+加权排序+价格计算
 *
 * 展示：
 * - A表（待匹配数据）与B表（价格库）
 * - 预计算匹配结果
 * - 候选详情弹窗
 * - 价格计算方法切换
 *
 * 注：本视图使用预计算结果演示
 */
window.ABMatchModeView = (function() {

    var containerId = null;
    var currentCalcMethod = 'WeightedAverage';

    function init(container) {
        containerId = typeof container === 'string' ? container : 'abMatchModeView';
        render();
    }

    function render() {
        var container = document.getElementById(containerId);
        if (!container) return;

        var tableA = window.TableA || { columns: [], rows: [] };
        var tableB = window.TableB || { columns: [], rows: [] };
        var results = window.ABMatchResults || [];

        container.innerHTML = `
            <div class="flex-col" style="height:100%;">
                <!-- 子工具栏 -->
                <div class="sub-toolbar">
                    <span class="sub-toolbar-label">A表:</span>
                    <span style="font-size:12px;color:#555;">${tableA.rows.length} 行</span>
                    <span class="sub-toolbar-label" style="margin-left:12px;">B表:</span>
                    <span style="font-size:12px;color:#555;">${tableB.rows.length} 行</span>
                    <div class="toolbar-separator"></div>
                    <span class="sub-toolbar-label">价格计算:</span>
                    <select class="select-box" id="abCalcMethod">
                        <option value="WeightedAverage">加权平均（推荐）</option>
                        <option value="Max">最大值</option>
                        <option value="Min">最小值</option>
                        <option value="Average">算术平均</option>
                        <option value="Median">中位数</option>
                        <option value="FirstMatch">首个匹配</option>
                    </select>
                    <div class="toolbar-separator"></div>
                    <button class="btn btn-accent" id="abRunMatch">▶ 执行匹配</button>
                    <button class="btn" id="abClearResult">清除结果</button>
                </div>

                <!-- A/B双表展示 -->
                <div class="ab-tables" style="height:45%;">
                    <div class="ab-table-section">
                        <div class="ab-table-header">A表（待匹配数据）</div>
                        <div class="ab-table-content">
                            ${renderTable(tableA.columns, tableA.rows)}
                        </div>
                    </div>
                    <div class="ab-table-section">
                        <div class="ab-table-header">B表（价格库）</div>
                        <div class="ab-table-content">
                            ${renderTable(tableB.columns, tableB.rows)}
                        </div>
                    </div>
                </div>

                <!-- 匹配结果区 -->
                <div class="match-results-section" style="flex:1;">
                    <div class="match-results-header">
                        匹配结果（${results.length} 行） — 点击行查看候选详情
                    </div>
                    <div class="match-results-table" id="abResultsContainer">
                        <div class="empty-state">
                            <div class="empty-state-icon">🎯</div>
                            <div>点击"▶ 执行匹配"按钮查看匹配结果</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        bindEvents();
    }

    /**
     * 渲染表格
     */
    function renderTable(columns, rows) {
        if (!columns || columns.length === 0) return '<div class="empty-state">无数据</div>';

        var html = '<table class="data-table"><thead><tr>';
        columns.forEach(function(col) {
            var style = col.numeric ? ' style="text-align:right;"' : '';
            html += '<th' + style + '>' + escapeHtml(col.name) + '</th>';
        });
        html += '</tr></thead><tbody>';

        rows.forEach(function(row) {
            html += '<tr>';
            columns.forEach(function(col) {
                var val = row[col.key] || '';
                var cls = col.numeric ? ' class="numeric-cell"' : '';
                if (col.numeric && typeof val === 'number') {
                    val = formatNumber(val);
                }
                html += '<td' + cls + '>' + escapeHtml(String(val)) + '</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    /**
     * 执行匹配（展示预计算结果）
     */
    function runMatch() {
        var results = window.ABMatchResults || [];
        var container = document.getElementById('abResultsContainer');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠</div><div>无匹配结果数据</div></div>';
            return;
        }

        var statusEl = document.getElementById('statusText');
        if (statusEl) statusEl.textContent = 'AB表匹配 - 正在计算...';

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:40px;">A行</th>
                        <th style="width:80px;">最佳B行</th>
                        <th style="width:80px;">匹配度</th>
                        <th style="width:80px;">加权分</th>
                        <th style="width:100px;">日期</th>
                        <th style="width:100px;">计算价格</th>
                        <th style="width:60px;">候选数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="abResultsBody"></tbody>
            </table>
        `;

        var bodyEl = document.getElementById('abResultsBody');
        var idx = 0;

        function showNext() {
            if (idx >= results.length) {
                if (statusEl) statusEl.textContent = `AB表匹配 - 完成：${results.length} 行匹配`;
                return;
            }

            var r = results[idx];
            var calcPrice = recalcPrice(r.candidates, currentCalcMethod);

            var tr = document.createElement('tr');
            tr.className = 'highlight-row';
            tr.style.cursor = 'pointer';
            tr.setAttribute('data-result-index', idx);
            tr.innerHTML = `
                <td class="numeric-cell">${r.aRowIndex}</td>
                <td class="numeric-cell">${r.bestMatch.bRowIndex}</td>
                <td class="numeric-cell"><span style="color:#1A56DB;font-weight:600;">${(r.bestMatch.matchScore * 100).toFixed(0)}%</span></td>
                <td class="numeric-cell">${r.bestMatch.weightedScore.toFixed(2)}</td>
                <td>${escapeHtml(r.bestMatch.date)}</td>
                <td class="numeric-cell"><span style="color:#CC6600;font-weight:600;">${formatNumber(calcPrice)}</span></td>
                <td class="numeric-cell">${r.candidates.length}</td>
                <td><a href="javascript:void(0)" style="color:#4285F4;cursor:pointer;text-decoration:underline;" data-result-index="${idx}">查看详情</a></td>
            `;
            bodyEl.appendChild(tr);

            idx++;
            setTimeout(showNext, 100);
        }

        showNext();

        // 绑定查看详情：使用事件委托绑定在稳定的 container 上（而非动态创建的 bodyEl）
        container.onclick = function(e) {
            // 向上查找带 data-result-index 的元素（支持点击行或链接）
            var target = e.target;
            var resultIndex = null;
            while (target && target !== container) {
                if (target.tagName === 'TR' || target.tagName === 'A') {
                    var attr = target.getAttribute('data-result-index');
                    if (attr !== null) {
                        resultIndex = parseInt(attr);
                        break;
                    }
                }
                target = target.parentElement;
            }
            if (resultIndex !== null && !isNaN(resultIndex)) {
                showCandidateDetail(resultIndex);
            }
        };
    }

    /**
     * 重新计算价格
     */
    function recalcPrice(candidates, method) {
        if (!candidates || candidates.length === 0) return 0;
        var prices = candidates.map(function(c) { return c.price; });

        switch (method) {
            case 'Max':
                return Math.max.apply(null, prices);
            case 'Min':
                return Math.min.apply(null, prices);
            case 'Average':
                var sum = prices.reduce(function(a, b) { return a + b; }, 0);
                return sum / prices.length;
            case 'Median':
                var sorted = prices.slice().sort(function(a, b) { return a - b; });
                var mid = Math.floor(sorted.length / 2);
                return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
            case 'FirstMatch':
                return prices[0];
            case 'WeightedAverage':
            default:
                var totalWeight = 0;
                var weightedSum = 0;
                candidates.forEach(function(c) {
                    totalWeight += c.weightedScore;
                    weightedSum += c.price * c.weightedScore;
                });
                return totalWeight > 0 ? weightedSum / totalWeight : 0;
        }
    }

    /**
     * 显示候选详情弹窗
     */
    function showCandidateDetail(resultIndex) {
        var results = window.ABMatchResults || [];
        var r = results[resultIndex];
        if (!r) return;

        var tableB = window.TableB || { rows: [] };
        var tableARows = (window.TableA || { rows: [] }).rows;
        var aRow = tableARows.find(function(row) { return row.rowIndex === r.aRowIndex; }) || {};

        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-dialog" style="min-width:700px;">
                <div class="modal-header">
                    <span>A表第 ${r.aRowIndex} 行 - 匹配候选详情</span>
                    <span class="modal-close">×</span>
                </div>
                <div class="modal-body">
                    <div style="background:#F0F4FF;padding:10px;border-radius:4px;margin-bottom:12px;">
                        <strong>A表数据：</strong>${escapeHtml(aRow.name || '')} ${escapeHtml(aRow.spec || '')} ${escapeHtml(aRow.material || '')}
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>B表行号</th>
                                <th>材料名称</th>
                                <th>规格</th>
                                <th>匹配度</th>
                                <th>加权分</th>
                                <th>价格(元)</th>
                                <th>日期</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${r.candidates.map(function(c, idx) {
                                var bRow = tableB.rows.find(function(row) { return row.rowIndex === c.bRowIndex; }) || {};
                                var bestStyle = idx === 0 ? ' style="background:#FFF8E1;"' : '';
                                return `<tr${bestStyle}>
                                    <td class="numeric-cell">${c.bRowIndex}</td>
                                    <td>${escapeHtml(bRow.name || '-')}</td>
                                    <td>${escapeHtml(bRow.spec || '-')}</td>
                                    <td class="numeric-cell"><span style="color:#1A56DB;font-weight:600;">${(c.matchScore * 100).toFixed(0)}%</span></td>
                                    <td class="numeric-cell">${c.weightedScore.toFixed(2)}</td>
                                    <td class="numeric-cell" style="color:#CC6600;font-weight:600;">${formatNumber(c.price)}</td>
                                    <td>${escapeHtml(c.date)}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top:12px;padding:10px;background:#FFF8E1;border-radius:4px;">
                        <strong>价格计算（${currentCalcMethod}）：</strong>
                        <span style="color:#CC6600;font-weight:600;font-size:14px;">${formatNumber(recalcPrice(r.candidates, currentCalcMethod))} 元</span>
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
     * 清除结果
     */
    function clearResult() {
        var container = document.getElementById('abResultsContainer');
        if (container) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><div>点击"▶ 执行匹配"按钮查看匹配结果</div></div>';
        }
    }

    function bindEvents() {
        var runBtn = document.getElementById('abRunMatch');
        if (runBtn) runBtn.onclick = runMatch;

        var clearBtn = document.getElementById('abClearResult');
        if (clearBtn) clearBtn.onclick = clearResult;

        var methodSel = document.getElementById('abCalcMethod');
        if (methodSel) {
            methodSel.value = currentCalcMethod;
            methodSel.onchange = function() {
                currentCalcMethod = this.value;
                // 如果已有结果，重新渲染
                var bodyEl = document.getElementById('abResultsBody');
                if (bodyEl && bodyEl.children.length > 0) {
                    runMatch();
                }
            };
        }
    }

    /**
     * 数字格式化：千分位 + 2位小数
     */
    function formatNumber(num) {
        if (typeof num !== 'number') num = parseFloat(num) || 0;
        return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return { init: init };
})();
