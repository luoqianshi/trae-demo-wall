/**
 * ui-shopping.js — 智能采购清单模块
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.uiShopping（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用；ES5 兼容（var / function / 字符串拼接）
 *
 * 职责：
 *  1) init()   绑定 #btn-export-list 点击 → 导出纯文本清单（剪贴板 / 下载 txt）
 *              并订阅 store 变化自动 render()
 *  2) render() 读取 store.get('currentShoppingList')，按分类分组渲染：
 *      - 顶部汇总条（总项数 + 预估总价）
 *      - 临期未用食材提示（expiringUnused）
 *      - 按 category 折叠分组，每项含已购勾选框（勾选 → 划线变灰）
 *
 * 依赖：
 *  SMART_MENU.store（store.js）
 *  SMART_MENU.showToast（引导脚本 / app.js）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.uiShopping = (function () {
    'use strict';

    var SM = SMART_MENU;
    var inited = false;

    /* ============ 分类文案映射（与 data-ingredients 的 category 对齐） ============ */
    var CATEGORY_LABEL = {
        vegetable: '蔬菜区',
        meat:      '肉类区',
        seafood:   '水产区',
        eggdairy:  '蛋奶区',
        soy:       '豆制品区',
        staple:    '主食区',
        condiment: '调料区',
        fruit:     '水果区',
        __other:   '其他'
    };
    var CATEGORY_ORDER = ['vegetable', 'meat', 'seafood', 'eggdairy', 'soy', 'staple', 'condiment', 'fruit', '__other'];

    /* ============ 小工具 ============ */
    function esc(str) {
        str = String(str == null ? '' : str);
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function closest(el, sel) {
        while (el && el.nodeType === 1) {
            if (matches(el, sel)) return el;
            el = el.parentNode;
        }
        return null;
    }
    function matches(el, sel) {
        if (el.matches) return el.matches(sel);
        if (el.msMatchesSelector) return el.msMatchesSelector(sel);
        if (el.webkitMatchesSelector) return el.webkitMatchesSelector(sel);
        return false;
    }
    function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
    function money(n) { return round2(n).toFixed(2); }

    /* ============ 样式注入 ============ */
    function injectStyle() {
        if (document.getElementById('ui-shopping-style')) return;
        var css = '' +
            '.shop-wrap{display:flex;flex-direction:column;gap:1.1rem;grid-column:1/-1}' +
            /* 顶部汇总条 */
            '.shop-summary{display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap;background:linear-gradient(135deg,rgba(124,179,66,.1),rgba(232,106,51,.06));border:1px solid rgba(124,179,66,.25);border-radius:var(--radius-sm);padding:1rem 1.2rem}' +
            '.shop-summary-item{display:flex;flex-direction:column;gap:.15rem}' +
            '.shop-summary-label{font-size:.8rem;color:var(--text-muted)}' +
            '.shop-summary-value{font-family:var(--font-display);font-weight:700;color:var(--text);font-size:1.2rem}' +
            '.shop-summary-total{font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--primary)}' +
            '.shop-summary-total small{font-size:.85rem;font-weight:600;color:var(--text-muted)}' +
            '.shop-summary-divider{width:1px;align-self:stretch;background:var(--border-light)}' +
            /* 临期提示 */
            '.shop-expiring{display:flex;gap:.6rem;align-items:flex-start;background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.4);border-radius:var(--radius-sm);padding:.8rem 1rem;color:#9C6412}' +
            '.shop-expiring .bi{font-size:1.15rem;flex-shrink:0;margin-top:.05rem}' +
            '.shop-expiring-title{font-weight:600;margin-bottom:.15rem}' +
            '.shop-expiring-body{font-size:.88rem;line-height:1.7}' +
            /* 分组（可折叠） */
            '.shop-group{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden}' +
            '.shop-group-head{display:flex;align-items:center;gap:.55rem;padding:.8rem 1rem;cursor:pointer;user-select:none;border-bottom:1px solid var(--border-light);transition:background .2s}' +
            '.shop-group-head:hover{background:var(--bg-warm)}' +
            '.shop-group-head .chev{margin-left:auto;color:var(--text-muted);transition:transform .25s}' +
            '.shop-group.is-collapsed .chev{transform:rotate(-90deg)}' +
            '.shop-group.is-collapsed .shop-group-body{display:none}' +
            '.shop-group-title{font-family:var(--font-display);font-weight:600;color:var(--text);font-size:1.02rem}' +
            '.shop-group-count{font-size:.78rem;color:var(--text-muted);background:var(--bg-warm);padding:.1rem .55rem;border-radius:50px}' +
            '.shop-group-sub{font-size:.8rem;color:var(--text-muted);margin-left:.4rem}' +
            '.shop-group-body{padding:.3rem 0}' +
            /* 采购项 */
            '.shop-item{display:flex;align-items:center;gap:.7rem;padding:.65rem 1rem;border-bottom:1px solid var(--border-light);transition:background .2s}' +
            '.shop-item:last-child{border-bottom:none}' +
            '.shop-item:hover{background:var(--bg-warm)}' +
            '.shop-item-emoji{font-size:1.5rem;line-height:1;flex-shrink:0}' +
            '.shop-item-info{flex:1;min-width:0}' +
            '.shop-item-name{font-weight:600;color:var(--text);font-size:.95rem}' +
            '.shop-item-meta{font-size:.78rem;color:var(--text-muted);margin-top:.1rem;display:flex;gap:.7rem;flex-wrap:wrap}' +
            '.shop-item-amount{font-weight:600;color:var(--primary)}' +
            '.shop-item-sub{font-size:.85rem;color:var(--text-light);white-space:nowrap}' +
            '.shop-item .shop-check{display:flex;align-items:center;gap:.3rem;cursor:pointer;font-size:.82rem;color:var(--text-muted);user-select:none}' +
            '.shop-item .shop-check input{width:18px;height:18px;accent-color:var(--secondary)}' +
            '.shop-item.is-purchased{opacity:.5}' +
            '.shop-item.is-purchased .shop-item-name{text-decoration:line-through;color:var(--text-muted)}' +
            '.shop-item.is-purchased .shop-item-amount{text-decoration:line-through}' +
            '.shop-empty-cat{padding:.8rem 1rem;font-size:.85rem;color:var(--text-muted)}';
        var style = document.createElement('style');
        style.id = 'ui-shopping-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ============ 读取分类文案 ============ */
    function categoryLabel(key) {
        return CATEGORY_LABEL[key] || (CATEGORY_LABEL.__other + '（' + (key || '未知') + '）');
    }

    /* ============ 渲染临期未用提示 ============ */
    function renderExpiring(expiringUnused) {
        if (!expiringUnused || !expiringUnused.length) return '';
        var parts = [];
        for (var i = 0; i < expiringUnused.length; i++) {
            var e = expiringUnused[i];
            parts.push(esc(e.name) + '(剩' + e.daysLeft + '天)');
        }
        return '' +
        '<div class="shop-expiring">' +
          '<i class="bi bi-clock-history"></i>' +
          '<div>' +
            '<div class="shop-expiring-title">建议先用这些临期食材</div>' +
            '<div class="shop-expiring-body">' + parts.join('、') + '</div>' +
          '</div>' +
        '</div>';
    }

    /* ============ 渲染单个采购项 ============ */
    function renderShopItem(item) {
        var purchased = !!item.purchased;
        return '' +
        '<div class="shop-item' + (purchased ? ' is-purchased' : '') + '" data-id="' + esc(item.ingredientId) + '">' +
          '<span class="shop-item-emoji">' + esc(item.emoji || '🥡') + '</span>' +
          '<div class="shop-item-info">' +
            '<div class="shop-item-name">' + esc(item.name || '未知食材') + '</div>' +
            '<div class="shop-item-meta">' +
              '<span>需购 <span class="shop-item-amount">' + round2(item.buyAmount) + ' ' + esc(item.unit || '') + '</span></span>' +
              '<span>库存 ' + round2(item.haveAmount) + '</span>' +
              '<span>单价 ' + money(item.price) + ' 元</span>' +
            '</div>' +
          '</div>' +
          '<span class="shop-item-sub">' + money(item.subtotal) + ' 元</span>' +
          '<label class="shop-check"><input type="checkbox" data-action="toggle-purchase" data-id="' + esc(item.ingredientId) + '"' + (purchased ? ' checked' : '') + '> 已购</label>' +
        '</div>';
    }

    /* ============ 渲染单个分类分组 ============ */
    function renderGroup(group, idx) {
        var items = group.items || [];
        var body = '';
        if (!items.length) {
            body = '<div class="shop-empty-cat">该分类暂无采购项</div>';
        } else {
            for (var i = 0; i < items.length; i++) {
                body += renderShopItem(items[i]);
            }
        }
        // 默认第一个分组展开，其余折叠（项数多时更清晰）
        var collapsed = (idx > 0 && items.length > 0) ? ' is-collapsed' : '';
        return '' +
        '<div class="shop-group' + collapsed + '">' +
          '<div class="shop-group-head" data-action="toggle-group">' +
            '<i class="bi bi-tags"></i>' +
            '<span class="shop-group-title">' + esc(categoryLabel(group.category)) + '</span>' +
            '<span class="shop-group-count">' + items.length + ' 项</span>' +
            '<span class="shop-group-sub">小计 ' + money(group.subtotal) + ' 元</span>' +
            '<i class="bi bi-chevron-down chev"></i>' +
          '</div>' +
          '<div class="shop-group-body">' + body + '</div>' +
        '</div>';
    }

    /* ============================================================
     *  render() —— 渲染采购清单
     * ============================================================ */
    function render() {
        var box = document.getElementById('shopping-list');
        if (!box) return;
        var list = SM.store ? SM.store.get('currentShoppingList') : null;
        box.innerHTML = '';

        // 空状态
        if (!list || !list.items || !list.items.length) {
            box.innerHTML =
                '<div class="empty-state js-empty">' +
                  '<div class="empty-icon"><i class="bi bi-cart3"></i></div>' +
                  '<div class="empty-title">暂无采购项</div>' +
                  '<div class="empty-desc">生成菜单后，系统将自动计算食材缺口并生成清单</div>' +
                '</div>';
            return;
        }

        var items = list.items || [];
        var groups = list.categoryGroups || [];
        var total = round2(list.totalEstimated || 0);
        var itemCount = items.length;

        // 若引擎未提供 categoryGroups，则就地按 category 重组
        var useGroups = groups;
        if (!useGroups.length) {
            useGroups = rebuildGroups(items);
        }

        var html = '<div class="shop-wrap">';
        // 顶部汇总条
        html += '' +
        '<div class="shop-summary">' +
          '<div class="shop-summary-item">' +
            '<span class="shop-summary-label">采购项数</span>' +
            '<span class="shop-summary-value">' + itemCount + ' 项</span>' +
          '</div>' +
          '<div class="shop-summary-divider"></div>' +
          '<div class="shop-summary-item">' +
            '<span class="shop-summary-label">预估总价</span>' +
            '<span class="shop-summary-total">' + money(total) + ' <small>元</small></span>' +
          '</div>' +
        '</div>';

        // 临期未用提示
        html += renderExpiring(list.expiringUnused);

        // 分类分组
        for (var i = 0; i < useGroups.length; i++) {
            html += renderGroup(useGroups[i], i);
        }

        html += '</div>';
        box.innerHTML = html;
    }

    /* ============ 就地按 category 重组分组（引擎未返回时兜底） ============ */
    function rebuildGroups(items) {
        var map = {};
        for (var i = 0; i < items.length; i++) {
            var cat = items[i].category || '__other';
            if (!map[cat]) map[cat] = { category: cat, items: [], subtotal: 0 };
            map[cat].items.push(items[i]);
            map[cat].subtotal += Number(items[i].subtotal) || 0;
        }
        var out = [];
        for (var k = 0; k < CATEGORY_ORDER.length; k++) {
            var key = CATEGORY_ORDER[k];
            if (map[key]) { map[key].subtotal = round2(map[key].subtotal); out.push(map[key]); delete map[key]; }
        }
        // 剩余未知分类
        for (var rest in map) {
            if (map.hasOwnProperty(rest)) { map[rest].subtotal = round2(map[rest].subtotal); out.push(map[rest]); }
        }
        return out;
    }

    /* ============ 切换已购状态（直接更新 DOM，静默持久化） ============ */
    function togglePurchase(ingredientId, checked) {
        var list = SM.store ? SM.store.get('currentShoppingList') : null;
        if (list && list.items) {
            for (var i = 0; i < list.items.length; i++) {
                if (list.items[i].ingredientId === ingredientId) {
                    list.items[i].purchased = checked;
                    break;
                }
            }
            // 静默持久化，避免触发全量重渲染导致勾选焦点丢失
            if (SM.store && SM.store.save) {
                try { SM.store.save(); } catch (e) { /* 忽略持久化失败 */ }
            }
        }
        // 更新该行 DOM 样式
        var row = document.querySelector('.shop-item[data-id="' + cssAttr(ingredientId) + '"]');
        if (row) row.classList.toggle('is-purchased', checked);
    }

    // 将字符串转为可用于属性选择器的安全形式（简单转义引号已由 esc 处理，这里再做一层防护）
    function cssAttr(str) {
        return String(str == null ? '' : str).replace(/"/g, '\\"');
    }

    /* ============================================================
     *  导出纯文本清单
     * ============================================================ */
    function buildExportText() {
        var list = SM.store ? SM.store.get('currentShoppingList') : null;
        if (!list || !list.items || !list.items.length) return '';

        var lines = [];
        lines.push('===== 智能采购清单 =====');
        lines.push('生成时间：' + formatTime(list.generatedAt || Date.now()));
        lines.push('共 ' + list.items.length + ' 项，预估总价 ¥' + money(list.totalEstimated));
        lines.push('');

        var groups = (list.categoryGroups && list.categoryGroups.length) ? list.categoryGroups : rebuildGroups(list.items);
        for (var i = 0; i < groups.length; i++) {
            var g = groups[i];
            lines.push('【' + categoryLabel(g.category) + '】（' + g.items.length + ' 项，小计 ¥' + money(g.subtotal) + '）');
            for (var j = 0; j < g.items.length; j++) {
                var it = g.items[j];
                var mark = it.purchased ? '[x]' : '[ ]';
                lines.push('  ' + mark + ' ' + (it.emoji || '') + ' ' + it.name +
                    '  需购 ' + round2(it.buyAmount) + ' ' + (it.unit || '') +
                    '  @' + money(it.price) + '/' + (it.unit || '份') +
                    '  = ¥' + money(it.subtotal));
            }
            lines.push('');
        }

        // 临期提示
        if (list.expiringUnused && list.expiringUnused.length) {
            lines.push('【临期先用提醒】');
            for (var e = 0; e < list.expiringUnused.length; e++) {
                var ex = list.expiringUnused[e];
                lines.push('  ' + ex.name + '(剩' + ex.daysLeft + '天)');
            }
            lines.push('');
        }

        lines.push('合计：¥' + money(list.totalEstimated));
        lines.push('========================');
        return lines.join('\n');
    }

    function formatTime(ts) {
        var d = new Date(ts);
        function pad(n) { return (n < 10 ? '0' : '') + n; }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
            ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function exportList() {
        var text = buildExportText();
        if (!text) {
            if (SM.showToast) SM.showToast('暂无清单可导出', 'error');
            return;
        }

        // 优先尝试剪贴板
        var copied = false;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
                copied = true;
            }
        } catch (e) { /* 忽略，走下载兜底 */ }

        // 兜底：下载 txt 文件（同时兼容不支持剪贴板的 file:// 环境）
        downloadText(text, '采购清单_' + formatTime(Date.now()).replace(/[: ]/g, '-') + '.txt');

        if (SM.showToast) {
            SM.showToast(copied ? '清单已复制到剪贴板并下载' : '清单已下载为文本', 'success');
        }
    }

    function downloadText(text, filename) {
        try {
            var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        } catch (e) {
            // 极端环境（无 Blob）退化为 data URL
            try {
                var a2 = document.createElement('a');
                a2.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
                a2.download = filename;
                document.body.appendChild(a2);
                a2.click();
                document.body.removeChild(a2);
            } catch (e2) { /* 忽略 */ }
        }
    }

    /* ============================================================
     *  init()
     * ============================================================ */
    function init() {
        if (inited) return;
        inited = true;
        injectStyle();

        // 导出按钮
        var expBtn = document.getElementById('btn-export-list');
        if (expBtn) expBtn.addEventListener('click', function () { exportList(); });

        // 列表事件委托：折叠分组 / 勾选已购
        var box = document.getElementById('shopping-list');
        if (box) {
            box.addEventListener('click', function (e) {
                var el = closest(e.target, '[data-action]');
                if (!el) return;
                var action = el.getAttribute('data-action');
                if (action === 'toggle-group') {
                    var group = closest(el, '.shop-group');
                    if (group) group.classList.toggle('is-collapsed');
                }
            });
            box.addEventListener('change', function (e) {
                var t = e.target;
                if (!t || !t.getAttribute) return;
                if (t.getAttribute('data-action') === 'toggle-purchase') {
                    var id = t.getAttribute('data-id');
                    togglePurchase(id, t.checked);
                }
            });
        }

        // 订阅 store 变化：currentShoppingList 改变时自动 render
        if (SM.store && SM.store.subscribe) {
            SM.store.subscribe(function () { render(); });
        }
    }

    /* ============ 对外暴露 ============ */
    return {
        init: init,
        render: render,
        exportList: exportList
    };
})();

/* ============ 模块加载后自动初始化 ============
 * DOM 已就绪（脚本位于 body 末尾），依赖的 store 已加载。
 * init() 内部用 inited 标志保证幂等：若后续 app.js 再次调用 init() 也不会重复绑定。
 * 清单数据由 uiMenu.generateAndRender 自动生成并写入 store，本模块订阅后自动刷新。
 */
SMART_MENU.uiShopping.init();
