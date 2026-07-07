/**
 * ui-fridge.js — 食材库模块
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.uiFridge（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用；ES5 兼容（var / function / 字符串拼接）
 *
 * 职责：
 *  1) init()   绑定"添加食材 / 语音录入"按钮与列表内事件委托，订阅 store
 *  2) render() 读取 store.get('fridge')，按分类分组渲染，含保质期进度条与临期角标
 *  3) 添加食材模态：手动联想 / 拍照识别(AI) / 语音录入 三种方式
 *
 * 依赖：
 *  SMART_MENU.store（store.js）
 *  SMART_MENU.ingredients / getIngredientById / findIngredientByName（data-ingredients.js）
 *  SMART_MENU.aiAdapter.recognizeIngredients（ai-adapter.js）
 *  SMART_MENU.showToast（引导脚本）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.uiFridge = (function () {
    'use strict';

    var SM = SMART_MENU;
    var inited = false;

    var DAY = 24 * 60 * 60 * 1000;   // 一天的毫秒数，用于保质期计算
    var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };

    /* ============ 分类顺序与文案 ============ */
    var CATEGORIES = [
        { key: 'vegetable', label: '蔬菜' },
        { key: 'meat',      label: '肉类' },
        { key: 'seafood',   label: '水产' },
        { key: 'eggdairy',  label: '蛋奶' },
        { key: 'soy',       label: '豆制品' },
        { key: 'staple',    label: '主食' },
        { key: 'condiment', label: '调料' },
        { key: 'fruit',     label: '水果' }
    ];

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
    function triggerReveal(root) {
        var els = root.querySelectorAll('.reveal:not(.visible)');
        if (!els.length) return;
        raf(function () {
            for (var i = 0; i < els.length; i++) {
                (function (el, idx) {
                    setTimeout(function () { el.classList.add('visible'); }, 50 * idx);
                })(els[i], i);
            }
        });
    }
    // 数值保留两位
    function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

    /* ============ 保质期计算 ============
     * 剩余天数 = shelfLifeDays - Math.floor((Date.now() - addedAt) / 86400000)
     */
    function calcRemain(item, ing) {
        var shelf = ing.shelfLifeDays || 0;
        var addedAt = item.addedAt || Date.now();
        var elapsed = Math.floor((Date.now() - addedAt) / DAY);
        return shelf - elapsed;
    }

    /* ============ 样式注入 ============ */
    function injectStyle() {
        if (document.getElementById('ui-fridge-style')) return;
        var css = '' +
            '.fridge-group{margin-bottom:1.5rem}' +
            '.fridge-group-title{display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1.1rem;font-weight:600;color:var(--text);margin-bottom:.85rem;padding-bottom:.4rem;border-bottom:2px solid var(--border-light)}' +
            '.fridge-group-title .bi{color:var(--primary)}' +
            '.fridge-group-count{font-size:.8rem;color:var(--text-muted);background:var(--bg-warm);padding:.1rem .5rem;border-radius:50px;font-weight:500}' +
            '.fridge-group-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}' +
            '.fridge-item{position:relative;padding:1.1rem;display:flex;flex-direction:column;gap:.8rem}' +
            '.fridge-item-head{display:flex;align-items:center;gap:.7rem}' +
            '.fridge-item-emoji{font-size:1.8rem;line-height:1}' +
            '.fridge-item-info{flex:1;min-width:0}' +
            '.fridge-item-name{font-family:var(--font-display);font-weight:600;font-size:1.05rem;color:var(--text)}' +
            '.fridge-item-amount{font-size:.85rem;color:var(--text-muted);margin-top:.15rem}' +
            '.fridge-shelf-label{display:flex;align-items:center;gap:.35rem;font-size:.78rem;color:var(--text-muted);margin-bottom:.35rem}' +
            '.fridge-expiring-badge{position:absolute;top:.6rem;right:.6rem;font-size:.7rem;font-weight:600;color:#fff;background:#F0A932;padding:.15rem .5rem;border-radius:50px}' +
            '.fridge-item-actions{display:flex;gap:.4rem;margin-top:.2rem}' +
            '.fridge-item-actions .btn{flex:1;padding:0 .5rem}' +
            /* 模态内组件 */
            '.tab-bar{display:flex;gap:.4rem;margin-bottom:1.25rem;border-bottom:1px solid var(--border)}' +
            '.tab-item{padding:.6rem 1rem;font-size:.9rem;font-weight:600;color:var(--text-muted);border-bottom:2px solid transparent;cursor:pointer;transition:var(--transition)}' +
            '.tab-item.is-active{color:var(--primary);border-color:var(--primary)}' +
            '.tab-pane{display:none}.tab-pane.is-active{display:block}' +
            '.suggestion-list{margin-top:.4rem;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;display:none;max-height:240px;overflow-y:auto;background:var(--card)}' +
            '.suggestion-item{display:flex;align-items:center;gap:.5rem;padding:.6rem .8rem;cursor:pointer;border-bottom:1px solid var(--border-light);transition:background .2s}' +
            '.suggestion-item:hover{background:var(--bg-warm)}' +
            '.suggestion-item:last-child{border-bottom:none}' +
            '.suggestion-item .sg-emoji{font-size:1.2rem}' +
            '.suggestion-item .sg-name{font-weight:600;color:var(--text)}' +
            '.suggestion-item .sg-alias{font-size:.78rem;color:var(--text-muted);margin-left:auto}' +
            '.suggestion-empty{padding:.8rem;color:var(--text-muted);font-size:.85rem;text-align:center}' +
            '.fg-selected{color:var(--text-muted);font-size:.9rem}' +
            '.ai-area{display:flex;flex-direction:column;align-items:center;gap:.8rem;padding:1.5rem 1rem;text-align:center;background:var(--bg-warm);border-radius:var(--radius-sm)}' +
            '.ai-hint{font-size:.82rem;color:var(--text-muted)}' +
            '.ai-spinner{display:flex;align-items:center;gap:.6rem;color:var(--primary);font-weight:600}' +
            '.spinner{width:18px;height:18px;border:2.5px solid rgba(232,106,51,.25);border-top-color:var(--primary);border-radius:50%;display:inline-block;animation:spin .8s linear infinite}' +
            '@keyframes spin{to{transform:rotate(360deg)}}' +
            '.ai-empty{padding:1rem;text-align:center;color:var(--text-muted);font-size:.88rem}' +
            '.recognize-list{display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem}' +
            '.recognize-item{display:flex;align-items:center;gap:.6rem;padding:.6rem .7rem;background:var(--bg-warm);border-radius:var(--radius-sm)}' +
            '.recognize-item input[type=checkbox]{width:18px;height:18px;accent-color:var(--primary)}' +
            '.recognize-item .sg-emoji{font-size:1.3rem}' +
            '.recognize-name{flex:1;font-weight:600;color:var(--text)}' +
            '.recognize-amount{width:72px!important;min-height:auto!important;padding:.3rem .5rem!important;text-align:center}' +
            '.recognize-unit{font-size:.8rem;color:var(--text-muted);min-width:1.5rem}' +
            '.voice-transcript{margin-top:.8rem;padding:.7rem .9rem;background:var(--bg-warm);border-radius:var(--radius-sm);font-size:.9rem;color:var(--text-light);min-height:1.2rem}' +
            '.voice-listening{display:inline-flex;align-items:center;gap:.4rem;color:var(--primary)}' +
            '.voice-listening .dot{width:8px;height:8px;border-radius:50%;background:var(--primary);animation:blink 1s infinite}' +
            '@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}' +
            '.voice-error{color:#D9534F}';
        var style = document.createElement('style');
        style.id = 'ui-fridge-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ============================================================
     *  render() —— 按 category 分组渲染
     * ============================================================ */
    function render() {
        var box = document.getElementById('fridge-list');
        if (!box) return;
        var fridge = (SM.store && SM.store.get('fridge')) || [];
        box.innerHTML = '';

        if (!fridge.length) {
            box.innerHTML =
                '<div class="empty-state js-empty">' +
                  '<div class="empty-icon"><i class="bi bi-fridge"></i></div>' +
                  '<div class="empty-title">冰箱还是空的</div>' +
                  '<div class="empty-desc">添加现有食材，系统将优先用库存生成菜单</div>' +
                '</div>';
            return;
        }

        // 按 category 分组
        var groups = {};
        for (var i = 0; i < fridge.length; i++) {
            var item = fridge[i];
            var ing = SM.getIngredientById(item.ingredientId);
            if (!ing) continue;            // 食材库中已不存在的条目跳过
            var key = ing.category || '__other';
            if (!groups[key]) groups[key] = [];
            groups[key].push({ item: item, ing: ing, remain: calcRemain(item, ing) });
        }

        var html = '';
        // 已知分类按固定顺序渲染
        for (var c = 0; c < CATEGORIES.length; c++) {
            var key = CATEGORIES[c].key;
            if (groups[key] && groups[key].length) {
                html += renderGroup(CATEGORIES[c].label, groups[key]);
                groups[key] = null;
            }
        }
        // 剩余未知分类归入"其他"
        for (var k in groups) {
            if (groups.hasOwnProperty(k) && groups[k] && groups[k].length) {
                html += renderGroup('其他', groups[k]);
            }
        }
        box.innerHTML = html;
        triggerReveal(box);
    }

    /* ---- 渲染分组（标题 + 网格） ---- */
    function renderGroup(label, arr) {
        var cards = '';
        for (var i = 0; i < arr.length; i++) {
            cards += renderFridgeCard(arr[i].item, arr[i].ing, arr[i].remain);
        }
        return '' +
        '<div class="fridge-group reveal">' +
          '<div class="fridge-group-title"><i class="bi bi-tags"></i> ' + esc(label) +
            '<span class="fridge-group-count">' + arr.length + '</span>' +
          '</div>' +
          '<div class="fridge-group-grid">' + cards + '</div>' +
        '</div>';
    }

    /* ---- 渲染单个食材卡片 ---- */
    function renderFridgeCard(item, ing, remain) {
        var total = ing.shelfLifeDays || 1;
        var pct = Math.max(0, Math.min(100, Math.round((remain / total) * 100)));
        var expiring = remain <= 2;      // 临期 ≤ 2 天
        var expired = remain <= 0;

        var barColor = expired ? '#D9534F' : (expiring ? '#F0A932' : '');
        var barStyle = barColor ? ('background:' + barColor) : '';
        var badge = '';
        if (expired) badge = '<span class="fridge-expiring-badge" style="background:#D9534F">已过期</span>';
        else if (expiring) badge = '<span class="fridge-expiring-badge">临期</span>';

        var remainText = expired ? '已过期' : ('剩余 ' + remain + ' 天');

        return '' +
        '<div class="card fridge-item">' +
          badge +
          '<div class="fridge-item-head">' +
            '<span class="fridge-item-emoji">' + esc(ing.emoji || '🥡') + '</span>' +
            '<div class="fridge-item-info">' +
              '<div class="fridge-item-name">' + esc(ing.name) + '</div>' +
              '<div class="fridge-item-amount">' + esc(item.amount) + ' ' + esc(ing.unit) + '</div>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div class="fridge-shelf-label"><i class="bi bi-clock"></i> ' + remainText + '</div>' +
            '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;' + barStyle + '"></div></div>' +
          '</div>' +
          '<div class="fridge-item-actions">' +
            '<button class="btn btn-ghost btn-sm" data-action="dec-fridge" data-id="' + esc(item.id) + '" title="减量">' +
              '<i class="bi bi-dash-lg"></i></button>' +
            '<button class="btn btn-ghost btn-sm" data-action="inc-fridge" data-id="' + esc(item.id) + '" title="加量">' +
              '<i class="bi bi-plus-lg"></i></button>' +
            '<button class="btn btn-danger btn-sm" data-action="del-fridge" data-id="' + esc(item.id) + '" title="删除">' +
              '<i class="bi bi-trash"></i></button>' +
          '</div>' +
        '</div>';
    }

    /* ============================================================
     *  添加食材模态（手动 / 拍照 / 语音）
     * ============================================================ */
    var modalEl = null;
    var currentTab = 'manual';
    // 待入库集合：{ ingredientId: { ing, amount, checked } }
    var pending = {};

    function ensureModal() {
        if (modalEl) return modalEl;
        modalEl = document.createElement('div');
        modalEl.className = 'modal';
        modalEl.id = 'modal-fridge';
        modalEl.innerHTML = buildModalHTML();
        document.body.appendChild(modalEl);

        // 搜索联想
        var search = modalEl.querySelector('#fg-search');
        if (search) search.addEventListener('input', onSearchInput);

        // 事件委托：tab / 关闭 / 提交 / 选中联想 / 拍照 / 语音
        modalEl.addEventListener('click', function (e) {
            var el = closest(e.target, '[data-action]');
            if (!el) {
                if (e.target === modalEl) closeModal();
                return;
            }
            var action = el.getAttribute('data-action');
            if (action === 'tab') switchTab(el.getAttribute('data-tab'));
            else if (action === 'close-modal') closeModal();
            else if (action === 'submit-fridge') submitFridge();
            else if (action === 'pick-ing') pickIngredient(el.getAttribute('data-id'));
            else if (action === 'recognize-photo') recognizePhoto();
            else if (action === 'start-voice') startVoice();
        });

        // 复选框 / 数量变化（识别结果列表）
        modalEl.addEventListener('change', function (e) {
            var t = e.target;
            if (t.getAttribute && t.getAttribute('data-action') === 'toggle-recognize') {
                var id1 = t.getAttribute('data-id');
                if (pending[id1]) pending[id1].checked = t.checked;
            } else if (t.classList && t.classList.contains('recognize-amount')) {
                var id2 = t.getAttribute('data-id');
                if (pending[id2]) pending[id2].amount = parseFloat(t.value) || 0;
            } else if (t.id === 'fg-amount') {
                // 手动模式下同步所选食材数量
                for (var k in pending) {
                    if (pending.hasOwnProperty(k) && pending[k].checked) {
                        pending[k].amount = parseFloat(t.value) || 0;
                    }
                }
            }
        });

        return modalEl;
    }

    function buildModalHTML() {
        return '' +
        '<div class="modal-card">' +
          '<div class="modal-header">' +
            '<div class="modal-title">添加食材</div>' +
            '<button type="button" class="modal-close" data-action="close-modal" aria-label="关闭"><i class="bi bi-x-lg"></i></button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<div class="tab-bar">' +
              '<button class="tab-item is-active" data-action="tab" data-tab="manual"><i class="bi bi-keyboard"></i> 手动添加</button>' +
              '<button class="tab-item" data-action="tab" data-tab="photo"><i class="bi bi-camera"></i> 拍照识别</button>' +
              '<button class="tab-item" data-action="tab" data-tab="voice"><i class="bi bi-mic"></i> 语音录入</button>' +
            '</div>' +
            // 手动添加
            '<div class="tab-pane is-active" data-pane="manual">' +
              '<div class="form-group">' +
                '<label class="form-label">食材名称</label>' +
                '<input class="form-input" id="fg-search" type="text" placeholder="输入名称或别名，如 西红柿" autocomplete="off">' +
                '<div class="suggestion-list" id="fg-suggest"></div>' +
              '</div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label class="form-label">数量</label>' +
                  '<input class="form-input" id="fg-amount" type="number" min="0" step="0.1" value="1"></div>' +
                '<div class="form-group"><label class="form-label">已选食材</label>' +
                  '<div class="form-input fg-selected" id="fg-selected-display">未选择</div></div>' +
              '</div>' +
            '</div>' +
            // 拍照识别
            '<div class="tab-pane" data-pane="photo">' +
              '<div class="ai-area" id="fg-photo-area">' +
                '<button class="btn btn-primary" data-action="recognize-photo"><i class="bi bi-camera"></i> 模拟拍照识别</button>' +
                '<div class="ai-hint">本地模式将模拟识别冰箱照片中的食材</div>' +
              '</div>' +
              '<div id="fg-photo-result"></div>' +
            '</div>' +
            // 语音录入
            '<div class="tab-pane" data-pane="voice">' +
              '<div class="ai-area" id="fg-voice-area">' +
                '<button class="btn btn-primary" data-action="start-voice"><i class="bi bi-mic"></i> 开始语音录入</button>' +
                '<div class="ai-hint">点击后说话，例如"我冰箱里有鸡蛋、青菜"</div>' +
              '</div>' +
              '<div class="voice-transcript" id="fg-voice-transcript"></div>' +
              '<div id="fg-voice-result"></div>' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-ghost" data-action="close-modal">取消</button>' +
            '<button type="button" class="btn btn-primary" data-action="submit-fridge"><i class="bi bi-check-lg"></i> 加入冰箱</button>' +
          '</div>' +
        '</div>';
    }

    /* ---- 打开模态（重置状态） ---- */
    function openModal(tab) {
        ensureModal();
        pending = {};
        // 重置手动 tab
        var search = modalEl.querySelector('#fg-search');
        if (search) search.value = '';
        var suggest = modalEl.querySelector('#fg-suggest');
        if (suggest) { suggest.innerHTML = ''; suggest.style.display = 'none'; }
        var amt = modalEl.querySelector('#fg-amount');
        if (amt) amt.value = '1';
        var disp = modalEl.querySelector('#fg-selected-display');
        if (disp) disp.textContent = '未选择';
        // 重置拍照 tab
        var photoArea = modalEl.querySelector('#fg-photo-area');
        if (photoArea) {
            photoArea.innerHTML = '<button class="btn btn-primary" data-action="recognize-photo"><i class="bi bi-camera"></i> 模拟拍照识别</button>' +
                '<div class="ai-hint">本地模式将模拟识别冰箱照片中的食材</div>';
        }
        var photoRes = modalEl.querySelector('#fg-photo-result');
        if (photoRes) photoRes.innerHTML = '';
        // 重置语音 tab
        var voiceTrans = modalEl.querySelector('#fg-voice-transcript');
        if (voiceTrans) voiceTrans.innerHTML = '';
        var voiceRes = modalEl.querySelector('#fg-voice-result');
        if (voiceRes) voiceRes.innerHTML = '';

        switchTab(tab || 'manual');
        modalEl.classList.add('is-open');
    }

    function closeModal() {
        if (modalEl) modalEl.classList.remove('is-open');
    }

    function switchTab(name) {
        currentTab = name;
        var tabs = modalEl.querySelectorAll('.tab-item');
        var panes = modalEl.querySelectorAll('.tab-pane');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('is-active', tabs[i].getAttribute('data-tab') === name);
        }
        for (var j = 0; j < panes.length; j++) {
            panes[j].classList.toggle('is-active', panes[j].getAttribute('data-pane') === name);
        }
    }

    /* ---- 手动联想：名称 / 别名匹配 ---- */
    function onSearchInput() {
        var search = modalEl.querySelector('#fg-search');
        var box = modalEl.querySelector('#fg-suggest');
        if (!search || !box) return;
        var q = search.value.trim().toLowerCase();
        if (!q) { box.innerHTML = ''; box.style.display = 'none'; return; }

        var matches = [];
        var list = SM.ingredients || [];
        for (var i = 0; i < list.length; i++) {
            if (matchIng(list[i], q)) matches.push(list[i]);
        }

        if (!matches.length) {
            box.innerHTML = '<div class="suggestion-empty">未找到匹配食材</div>';
            box.style.display = 'block';
            return;
        }
        var html = '';
        for (var j = 0; j < matches.length && j < 8; j++) {
            var ing = matches[j];
            html += '<div class="suggestion-item" data-action="pick-ing" data-id="' + esc(ing.id) + '">' +
              '<span class="sg-emoji">' + esc(ing.emoji || '') + '</span>' +
              '<span class="sg-name">' + esc(ing.name) + '</span>' +
              '<span class="sg-alias">' + esc((ing.aliases || []).join(' / ')) + '</span>' +
            '</div>';
        }
        box.innerHTML = html;
        box.style.display = 'block';
    }
    function matchIng(ing, q) {
        if (ing.name.toLowerCase().indexOf(q) > -1) return true;
        var al = ing.aliases || [];
        for (var i = 0; i < al.length; i++) {
            if (al[i].toLowerCase().indexOf(q) > -1) return true;
        }
        return false;
    }

    /* ---- 选中联想项（手动模式，单选） ---- */
    function pickIngredient(id) {
        var ing = SM.getIngredientById(id);
        if (!ing) return;
        pending = {};                       // 手动模式仅保留一个
        var amtEl = modalEl.querySelector('#fg-amount');
        var amt = amtEl ? (parseFloat(amtEl.value) || 1) : 1;
        pending[id] = { ing: ing, amount: amt, checked: true };

        var disp = modalEl.querySelector('#fg-selected-display');
        if (disp) {
            disp.innerHTML = '<span class="sg-emoji">' + esc(ing.emoji || '') + '</span> ' +
                esc(ing.name) + ' (' + esc(ing.unit) + ')';
        }
        var search = modalEl.querySelector('#fg-search');
        if (search) search.value = ing.name;
        var suggest = modalEl.querySelector('#fg-suggest');
        if (suggest) { suggest.innerHTML = ''; suggest.style.display = 'none'; }
    }

    /* ---- 拍照识别：spinner 1.5s → aiAdapter ---- */
    function recognizePhoto() {
        var area = modalEl.querySelector('#fg-photo-area');
        var result = modalEl.querySelector('#fg-photo-result');
        if (!area || !result) return;
        area.innerHTML = '<div class="ai-spinner"><span class="spinner"></span> AI 分析中…</div>';
        result.innerHTML = '';
        setTimeout(function () {
            var res = SM.aiAdapter ? SM.aiAdapter.recognizeIngredients(null) : { success: false, message: 'AI 适配器不可用' };
            area.innerHTML = '<button class="btn btn-ghost btn-sm" data-action="recognize-photo"><i class="bi bi-arrow-repeat"></i> 重新识别</button>' +
                '<div class="ai-hint">识别完成，勾选要入库的食材并设置数量</div>';
            renderRecognizedResult(result, res);
        }, 1500);
    }

    /* ---- 渲染识别结果（拍照 / 语音复用） ---- */
    function renderRecognizedResult(box, res) {
        if (!res || !res.success || !(res.details || []).length) {
            box.innerHTML = '<div class="ai-empty">' + esc((res && res.message) || '未识别到食材') + '</div>';
            return;
        }
        var details = res.details;
        var html = '<div class="recognize-list">';
        for (var i = 0; i < details.length; i++) {
            var d = details[i];
            var ing = SM.getIngredientById(d.ingredientId);
            var unit = ing ? ing.unit : (d.unit || '');
            var emoji = d.emoji || (ing ? ing.emoji : '');
            // 入待入库集合（默认勾选，数量 1）
            if (ing) {
                pending[d.ingredientId] = { ing: ing, amount: 1, checked: true };
            }
            html += '<label class="recognize-item">' +
              '<input type="checkbox" data-action="toggle-recognize" data-id="' + esc(d.ingredientId) + '" checked>' +
              '<span class="sg-emoji">' + esc(emoji) + '</span>' +
              '<span class="recognize-name">' + esc(d.name) + '</span>' +
              '<input type="number" class="form-input recognize-amount" data-id="' + esc(d.ingredientId) + '" value="1" min="0" step="0.1">' +
              '<span class="recognize-unit">' + esc(unit) + '</span>' +
            '</label>';
        }
        html += '</div>';
        box.innerHTML = html;
    }

    /* ---- 语音录入 ---- */
    function startVoice() {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            SM.showToast('当前浏览器不支持语音识别', 'error');
            return;
        }
        var rec = new SR();
        rec.lang = 'zh-CN';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        var transcriptEl = modalEl.querySelector('#fg-voice-transcript');
        var resultEl = modalEl.querySelector('#fg-voice-result');
        if (transcriptEl) transcriptEl.innerHTML = '<span class="voice-listening"><span class="dot"></span> 正在聆听…</span>';
        if (resultEl) resultEl.innerHTML = '';

        rec.onresult = function (ev) {
            var text = ev.results[0][0].transcript;
            if (transcriptEl) transcriptEl.innerHTML = '<i class="bi bi-chat-quote"></i> "' + esc(text) + '"';
            parseVoiceText(text, resultEl);
        };
        rec.onerror = function () {
            if (transcriptEl) transcriptEl.innerHTML = '<span class="voice-error">未识别到语音，请重试</span>';
        };
        try { rec.start(); } catch (e) { /* 忽略启动异常 */ }
    }

    /* ---- 解析语音文本 → 匹配食材 ---- */
    function parseVoiceText(text, resultEl) {
        // 去掉常见前缀"我冰箱里有/冰箱里有/我有"等
        var cleaned = text
            .replace(/我(的)?(冰箱|家里)?(里|中)?有/g, '')
            .replace(/冰箱里有?/g, '')
            .replace(/添加|加入/g, '');
        var tokens = cleaned.split(/[，,、\s]+/);
        var matched = [];
        var seen = {};
        for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i].trim();
            if (!t) continue;
            var ing = SM.findIngredientByName ? SM.findIngredientByName(t) : null;
            if (ing && !seen[ing.id]) { matched.push(ing); seen[ing.id] = true; }
        }
        if (!matched.length) {
            if (resultEl) resultEl.innerHTML = '<div class="ai-empty">未匹配到已知食材，请尝试手动添加</div>';
            return;
        }
        // 复用识别结果渲染
        var res = { success: true, details: [] };
        for (var j = 0; j < matched.length; j++) {
            res.details.push({
                ingredientId: matched[j].id,
                name: matched[j].name,
                emoji: matched[j].emoji,
                unit: matched[j].unit
            });
        }
        renderRecognizedResult(resultEl, res);
    }

    /* ---- 提交：把 pending 中勾选项加入冰箱 ---- */
    function submitFridge() {
        var count = 0;
        for (var id in pending) {
            if (pending.hasOwnProperty(id)) {
                var p = pending[id];
                if (p.checked && p.amount > 0) {
                    SM.store.addFridgeItem(id, round2(p.amount));
                    count++;
                }
            }
        }
        if (!count) {
            SM.showToast('请先选择要添加的食材', 'error');
            return;
        }
        SM.showToast('已加入 ' + count + ' 种食材', 'success');
        pending = {};
        closeModal();
        render();
    }

    /* ============================================================
     *  init()
     * ============================================================ */
    function init() {
        if (inited) return;
        inited = true;
        injectStyle();

        var addBtn = document.getElementById('btn-add-ingredient');
        if (addBtn) addBtn.addEventListener('click', function () { openModal('manual'); });

        var voiceBtn = document.getElementById('btn-voice-input');
        if (voiceBtn) voiceBtn.addEventListener('click', function () { openModal('voice'); });

        // 列表事件委托：加量 / 减量 / 删除
        var box = document.getElementById('fridge-list');
        if (box) {
            box.addEventListener('click', function (e) {
                var btn = closest(e.target, '[data-action]');
                if (!btn) return;
                var action = btn.getAttribute('data-action');
                var id = btn.getAttribute('data-id');
                if (!id) return;
                var item = SM.store.findFridgeItem(id);
                if (!item) return;

                if (action === 'inc-fridge') {
                    SM.store.updateFridgeItem(id, { amount: round2(Number(item.amount) + 1) });
                } else if (action === 'dec-fridge') {
                    // 减量：>1 则减 1，否则直接移除
                    if (Number(item.amount) > 1) {
                        SM.store.updateFridgeItem(id, { amount: round2(Number(item.amount) - 1) });
                    } else {
                        SM.store.removeFridgeItem(id);
                        SM.showToast('已移除', 'info');
                    }
                } else if (action === 'del-fridge') {
                    var ing = SM.getIngredientById(item.ingredientId);
                    if (window.confirm('确定移除' + (ing ? '「' + ing.name + '」' : '该食材') + '？')) {
                        SM.store.removeFridgeItem(id);
                        SM.showToast('已移除', 'info');
                    }
                }
            });
        }

        // 订阅 store 变化（跨模块同步，如 loadSampleData 同时改了家庭）
        if (SM.store && SM.store.subscribe) {
            SM.store.subscribe(function () { render(); });
        }

        render();
    }

    /* ============ 对外暴露 ============ */
    return {
        init: init,
        render: render,
        openModal: openModal,
        closeModal: closeModal
    };
})();

/* ============ 模块加载后自动初始化 ============
 * DOM 已就绪（脚本位于 body 末尾），依赖的 store / ingredients / aiAdapter 均已加载。
 * init() 内部用 inited 标志保证幂等：若后续 app.js 再次调用 init() 也不会重复绑定。
 * 若 app.js 在 store.load() 后需刷新视图，可直接调用 SMART_MENU.uiFridge.render()。
 */
SMART_MENU.uiFridge.init();
