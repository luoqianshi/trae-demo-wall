/**
 * ui-family.js — 家庭成员档案模块
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.uiFamily（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用；ES5 兼容（var / function / 字符串拼接）
 *
 * 职责：
 *  1) init()   绑定"添加成员 / 导入示例"按钮与列表内事件委托，
 *               并订阅 store 变化自动 render()
 *  2) render() 读取 store.get('family')，渲染成员卡片或空状态
 *  3) 添加 / 编辑成员模态（复用同一表单，预填数据）
 *
 * 依赖：
 *  SMART_MENU.store（store.js）
 *  SMART_MENU.engineMenu.generateMemberTags（engine-menu.js）
 *  SMART_MENU.loadSampleData / showToast（data-sample.js / 引导脚本）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.uiFamily = (function () {
    'use strict';

    var SM = SMART_MENU;
    var inited = false;     // 防止重复初始化

    /* ============ 角色映射：头像图标 / 徽章 / 文案 ============ */
    var ROLE_ICON = {
        grandfather: 'bi-person-walking',
        grandmother: 'bi-person',
        parent: 'bi-person-workspace',
        child: 'bi-balloon'
    };
    var ROLE_LABEL = {
        grandfather: '祖父',
        grandmother: '祖母',
        parent: '子辈',
        child: '儿童'
    };
    // 角色 → 徽章配色（复用既有 .badge-* 变体）
    var ROLE_BADGE = {
        grandfather: 'badge-elderly',
        grandmother: 'badge-elderly',
        parent: 'badge-family',
        child: 'badge-child'
    };
    var TASTE_LABEL = { mild: '清淡', medium: '适中', spicy: '偏辣', sweet: '偏甜' };
    var APPETITE_LABEL = { small: '小食量', medium: '中食量', large: '大食量' };
    var GENDER_LABEL = { male: '男', female: '女' };

    /* ============ 标签内联配色（红=慢病 / 橙=过敏 / 绿=饮食） ============ */
    var TAG_RED    = 'background:rgba(217,83,79,0.12);color:#D9534F;border-color:rgba(217,83,79,0.3);';
    var TAG_ORANGE = 'background:rgba(232,106,51,0.12);color:#C2571E;border-color:rgba(232,106,51,0.3);';
    var TAG_GREEN  = 'background:rgba(124,179,66,0.14);color:#5C8A2E;border-color:rgba(124,179,66,0.3);';

    /* 慢病多选项 */
    var CONDITION_OPTIONS = ['高血压', '糖尿病', '高血脂', '痛风', '缺钙'];

    var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };

    /* ============ 小工具 ============ */
    // HTML 转义，避免用户输入破坏结构
    function esc(str) {
        str = String(str == null ? '' : str);
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // closest 兼容（ES5 环境 / IE 兜底）
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

    // 逗号 / 顿号 / 空格分隔的字符串 → 数组
    function splitCsv(str) {
        if (!str) return [];
        return str.split(/[,，、\s]+/).filter(function (s) { return s.length > 0; });
    }

    // 对容器内未显示的 .reveal 逐个加 .visible（带错峰）
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

    /* ============ 一次性注入本模块所需样式 ============ */
    function injectStyle() {
        if (document.getElementById('ui-family-style')) return;
        var css = '' +
            '.member-card{display:flex;flex-direction:column;gap:.85rem;height:100%}' +
            '.member-card-head{display:flex;align-items:center;gap:.9rem}' +
            '.member-avatar{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0;background:linear-gradient(135deg,rgba(232,106,51,.12),rgba(245,166,35,.12));color:var(--primary)}' +
            '.member-info{flex:1;min-width:0}' +
            '.member-name{font-family:var(--font-display);font-size:1.15rem;font-weight:600;color:var(--text);line-height:1.4}' +
            '.member-meta{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:.3rem}' +
            '.member-meta .member-age,.member-meta .member-gender{font-size:.8rem;color:var(--text-muted)}' +
            '.member-tags,.member-preference{display:flex;flex-wrap:wrap;gap:.4rem}' +
            '.member-notes{font-size:.85rem;color:var(--text-light);background:var(--bg-warm);border-radius:8px;padding:.5rem .7rem;line-height:1.6}' +
            '.member-actions{display:flex;gap:.5rem;margin-top:auto;padding-top:.3rem;border-top:1px solid var(--border-light)}' +
            '.form-row{display:grid;grid-template-columns:1fr 1fr;gap:0 1rem}' +
            '@media(max-width:600px){.form-row{grid-template-columns:1fr}}' +
            '.check-group{display:flex;flex-wrap:wrap;gap:.5rem .9rem}' +
            '.check-chip{display:inline-flex;align-items:center;gap:.35rem;font-size:.88rem;color:var(--text-light);cursor:pointer}' +
            '.check-chip input{width:16px;height:16px;accent-color:var(--primary)}';
        var style = document.createElement('style');
        style.id = 'ui-family-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ============================================================
     *  render() —— 渲染成员列表
     * ============================================================ */
    function render() {
        var list = document.getElementById('family-list');
        if (!list) return;
        var family = (SM.store && SM.store.get('family')) || [];
        list.innerHTML = '';

        // 空状态
        if (!family.length) {
            list.innerHTML =
                '<div class="empty-state js-empty">' +
                  '<div class="empty-icon"><i class="bi bi-people"></i></div>' +
                  '<div class="empty-title">还没有家庭成员</div>' +
                  '<div class="empty-desc">点击"添加成员"，或导入示例家庭快速体验</div>' +
                  '<button class="btn btn-ghost btn-sm" data-action="load-sample">' +
                    '<i class="bi bi-magic"></i> 导入示例家庭</button>' +
                '</div>';
            return;
        }

        var html = '';
        for (var i = 0; i < family.length; i++) {
            html += renderMemberCard(family[i], i);
        }
        list.innerHTML = html;
        triggerReveal(list);
    }

    /* ---- 渲染单个成员卡片 ---- */
    function renderMemberCard(m, idx) {
        var icon = ROLE_ICON[m.role] || 'bi-person';
        var roleLabel = ROLE_LABEL[m.role] || m.role || '成员';
        var roleBadge = ROLE_BADGE[m.role] || 'badge-family';
        var conds = m.conditions || [];
        var allergies = m.allergies || [];
        var dislikes = m.dislikes || [];
        // 引擎生成的自动饮食标签
        var autoTags = (SM.engineMenu && SM.engineMenu.generateMemberTags) ? SM.engineMenu.generateMemberTags(m) : [];

        // 慢病标签（红）
        var condTags = '';
        for (var i = 0; i < conds.length; i++) {
            condTags += '<span class="tag" style="' + TAG_RED + '">' +
                '<i class="bi bi-heart-pulse"></i> ' + esc(conds[i]) + '</span>';
        }
        // 过敏标签（橙）
        var allergyTags = '';
        for (var j = 0; j < allergies.length; j++) {
            allergyTags += '<span class="tag" style="' + TAG_ORANGE + '">' +
                '<i class="bi bi-exclamation-triangle"></i> 过敏:' + esc(allergies[j]) + '</span>';
        }
        // 饮食标签（绿，来自引擎）
        var dietTags = '';
        for (var k = 0; k < autoTags.length; k++) {
            dietTags += '<span class="tag" style="' + TAG_GREEN + '">' +
                '<i class="bi bi-check2-circle"></i> ' + esc(autoTags[k]) + '</span>';
        }
        // 忌口标签（中性）
        var dislikeTags = '';
        for (var d = 0; d < dislikes.length; d++) {
            dislikeTags += '<span class="tag"><i class="bi bi-slash-circle"></i> 忌口:' + esc(dislikes[d]) + '</span>';
        }

        var taste = TASTE_LABEL[m.tastePreference] || '';
        var appetite = APPETITE_LABEL[m.appetite] || '';
        var gender = GENDER_LABEL[m.gender] || '';
        var nameLine = esc(m.name || '未命名') + (m.nickname ? '（' + esc(m.nickname) + '）' : '');
        var tagsLine = condTags + allergyTags + dietTags + dislikeTags;

        return '' +
        '<div class="card member-card reveal" style="transition-delay:' + (idx * 0.06) + 's">' +
          '<div class="member-card-head">' +
            '<div class="member-avatar"><i class="bi ' + icon + '"></i></div>' +
            '<div class="member-info">' +
              '<div class="member-name">' + nameLine + '</div>' +
              '<div class="member-meta">' +
                '<span class="badge ' + roleBadge + '"><i class="bi bi-person-badge"></i> ' + esc(roleLabel) + '</span>' +
                (m.age != null ? '<span class="member-age">' + esc(m.age) + ' 岁</span>' : '') +
                (gender ? '<span class="member-gender">' + esc(gender) + '</span>' : '') +
              '</div>' +
            '</div>' +
          '</div>' +
          (tagsLine ? '<div class="member-tags">' + tagsLine + '</div>' : '') +
          '<div class="member-preference">' +
            (taste ? '<span class="tag"><i class="bi bi-droplet"></i> 口味:' + esc(taste) + '</span>' : '') +
            (appetite ? '<span class="tag"><i class="bi bi-egg-fried"></i> ' + esc(appetite) + '</span>' : '') +
            (m.chewingWeak ? '<span class="tag" style="' + TAG_ORANGE + '"><i class="bi bi-person-wheelchair"></i> 咀嚼弱</span>' : '') +
            (m.isChild ? '<span class="tag" style="' + TAG_GREEN + '"><i class="bi bi-balloon"></i> 儿童' + (m.childSafety ? '·防呛噎' : '') + '</span>' : '') +
          '</div>' +
          (m.notes ? '<div class="member-notes"><i class="bi bi-sticky"></i> ' + esc(m.notes) + '</div>' : '') +
          '<div class="member-actions">' +
            '<button class="btn btn-ghost btn-sm" data-action="edit-member" data-id="' + esc(m.id) + '">' +
              '<i class="bi bi-pencil"></i> 编辑</button>' +
            '<button class="btn btn-danger btn-sm" data-action="delete-member" data-id="' + esc(m.id) + '">' +
              '<i class="bi bi-trash"></i> 删除</button>' +
          '</div>' +
        '</div>';
    }

    /* ============================================================
     *  成员模态（添加 / 编辑复用）
     * ============================================================ */
    var modalEl = null;     // 缓存模态根节点
    var editingId = null;  // 当前编辑成员 id（null 表示新增）

    function ensureModal() {
        if (modalEl) return modalEl;
        modalEl = document.createElement('div');
        modalEl.className = 'modal';
        modalEl.id = 'modal-member';
        modalEl.innerHTML = buildModalHTML();
        document.body.appendChild(modalEl);

        // "是否儿童" → "防呛噎" 联动
        var isChildEl = modalEl.querySelector('#fm-is-child');
        var csEl = modalEl.querySelector('#fm-child-safety');
        if (isChildEl && csEl) {
            isChildEl.addEventListener('change', function () {
                csEl.disabled = !isChildEl.checked;
                if (!isChildEl.checked) csEl.checked = false;
            });
        }

        // 关闭 / 提交 / 回车（事件委托）
        modalEl.addEventListener('click', function (e) {
            var el = closest(e.target, '[data-action]');
            if (!el) {
                // 点击遮罩关闭
                if (e.target === modalEl) closeModal();
                return;
            }
            var action = el.getAttribute('data-action');
            if (action === 'close-modal') closeModal();
            else if (action === 'submit-member') submitMember();
        });
        var form = modalEl.querySelector('#form-member');
        if (form) form.addEventListener('submit', function (e) {
            e.preventDefault();
            submitMember();
        });
        return modalEl;
    }

    function buildModalHTML() {
        // 慢病多选
        var condChecks = '';
        for (var i = 0; i < CONDITION_OPTIONS.length; i++) {
            var c = CONDITION_OPTIONS[i];
            condChecks += '<label class="check-chip"><input type="checkbox" name="fm-conditions" value="' +
                esc(c) + '"> ' + esc(c) + '</label>';
        }
        return '' +
        '<div class="modal-card">' +
          '<div class="modal-header">' +
            '<div class="modal-title" id="fm-title">添加成员</div>' +
            '<button type="button" class="modal-close" data-action="close-modal" aria-label="关闭"><i class="bi bi-x-lg"></i></button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<form id="form-member" autocomplete="off">' +
              '<div class="form-row">' +
                '<div class="form-group"><label class="form-label">姓名<span class="req">*</span></label>' +
                  '<input class="form-input" id="fm-name" type="text" placeholder="如：老张"></div>' +
                '<div class="form-group"><label class="form-label">称呼 / 昵称</label>' +
                  '<input class="form-input" id="fm-nickname" type="text" placeholder="如：爷爷"></div>' +
              '</div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label class="form-label">角色</label>' +
                  '<select class="form-select" id="fm-role">' +
                    '<option value="grandfather">祖父</option>' +
                    '<option value="grandmother">祖母</option>' +
                    '<option value="parent">子辈（父母）</option>' +
                    '<option value="child">儿童（孙辈）</option>' +
                  '</select></div>' +
                '<div class="form-group"><label class="form-label">性别</label>' +
                  '<select class="form-select" id="fm-gender">' +
                    '<option value="male">男</option>' +
                    '<option value="female">女</option>' +
                  '</select></div>' +
              '</div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label class="form-label">年龄</label>' +
                  '<input class="form-input" id="fm-age" type="number" min="0" max="120" placeholder="如：65"></div>' +
                '<div class="form-group"><label class="form-label">食量</label>' +
                  '<select class="form-select" id="fm-appetite">' +
                    '<option value="small">小食量</option>' +
                    '<option value="medium" selected>中食量</option>' +
                    '<option value="large">大食量</option>' +
                  '</select></div>' +
              '</div>' +
              '<div class="form-group"><label class="form-label">慢性病（可多选）</label>' +
                '<div class="check-group">' + condChecks + '</div></div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label class="form-label">过敏食材</label>' +
                  '<input class="form-input" id="fm-allergies" type="text" placeholder="逗号分隔，如：海鲜,花生"></div>' +
                '<div class="form-group"><label class="form-label">忌口 / 不爱吃</label>' +
                  '<input class="form-input" id="fm-dislikes" type="text" placeholder="逗号分隔，如：香菜,胡萝卜"></div>' +
              '</div>' +
              '<div class="form-row">' +
                '<div class="form-group"><label class="form-label">口味偏好</label>' +
                  '<select class="form-select" id="fm-taste">' +
                    '<option value="mild">清淡</option>' +
                    '<option value="medium">适中</option>' +
                    '<option value="spicy">偏辣</option>' +
                    '<option value="sweet">偏甜</option>' +
                  '</select></div>' +
                '<div class="form-group"><label class="form-label">咀嚼与儿童</label>' +
                  '<div class="check-group">' +
                    '<label class="check-chip"><input type="checkbox" id="fm-chewing-weak"> 咀嚼弱</label>' +
                    '<label class="check-chip"><input type="checkbox" id="fm-is-child"> 是儿童</label>' +
                    '<label class="check-chip"><input type="checkbox" id="fm-child-safety" disabled> 防呛噎</label>' +
                  '</div></div>' +
              '</div>' +
              '<div class="form-group"><label class="form-label">备注</label>' +
                '<textarea class="form-textarea" id="fm-notes" placeholder="如：高血压需控盐控糖"></textarea></div>' +
            '</form>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-ghost" data-action="close-modal">取消</button>' +
            '<button type="button" class="btn btn-primary" data-action="submit-member"><i class="bi bi-check-lg"></i> 保存</button>' +
          '</div>' +
        '</div>';
    }

    function openModal(member) {
        ensureModal();
        editingId = member ? member.id : null;
        var title = modalEl.querySelector('#fm-title');
        if (title) title.textContent = member ? '编辑成员' : '添加成员';
        fillForm(member || {});
        modalEl.classList.add('is-open');
    }

    function closeModal() {
        if (modalEl) modalEl.classList.remove('is-open');
        editingId = null;
    }

    /* ---- 预填表单 ---- */
    function fillForm(m) {
        function setVal(id, v) { var el = modalEl.querySelector('#' + id); if (el) el.value = (v == null ? '' : v); }
        function setChecked(id, v) { var el = modalEl.querySelector('#' + id); if (el) el.checked = !!v; }

        setVal('fm-name', m.name);
        setVal('fm-nickname', m.nickname);
        setVal('fm-role', m.role || 'parent');
        setVal('fm-gender', m.gender || 'male');
        setVal('fm-age', m.age);
        setVal('fm-appetite', m.appetite || 'medium');
        setVal('fm-taste', m.tastePreference || 'mild');
        setVal('fm-allergies', (m.allergies || []).join(','));
        setVal('fm-dislikes', (m.dislikes || []).join(','));
        setVal('fm-notes', m.notes);

        // 慢病复选
        var checks = modalEl.querySelectorAll('input[name="fm-conditions"]');
        var conds = m.conditions || [];
        for (var i = 0; i < checks.length; i++) {
            checks[i].checked = conds.indexOf(checks[i].value) > -1;
        }
        setChecked('fm-chewing-weak', m.chewingWeak);
        setChecked('fm-is-child', m.isChild);
        setChecked('fm-child-safety', m.childSafety);

        // 同步"防呛噎"禁用态
        var isChildEl = modalEl.querySelector('#fm-is-child');
        var csEl = modalEl.querySelector('#fm-child-safety');
        if (csEl) csEl.disabled = !(isChildEl && isChildEl.checked);
    }

    /* ---- 收集表单数据为成员对象 ---- */
    function collectForm() {
        function val(id) { var el = modalEl.querySelector('#' + id); return el ? el.value.trim() : ''; }
        function num(id) { var n = parseInt(val(id), 10); return isNaN(n) ? null : n; }

        var checks = modalEl.querySelectorAll('input[name="fm-conditions"]:checked');
        var conds = [];
        for (var i = 0; i < checks.length; i++) conds.push(checks[i].value);

        var isChild = !!modalEl.querySelector('#fm-is-child').checked;

        return {
            name: val('fm-name'),
            nickname: val('fm-nickname'),
            role: val('fm-role'),
            age: num('fm-age'),
            gender: val('fm-gender'),
            conditions: conds,
            allergies: splitCsv(val('fm-allergies')),
            dislikes: splitCsv(val('fm-dislikes')),
            chewingWeak: modalEl.querySelector('#fm-chewing-weak').checked,
            tastePreference: val('fm-taste'),
            appetite: val('fm-appetite'),
            isChild: isChild,
            // 防呛噎仅在勾选儿童时有效
            childSafety: isChild && modalEl.querySelector('#fm-child-safety').checked,
            notes: val('fm-notes')
        };
    }

    /* ---- 提交（新增 / 更新） ---- */
    function submitMember() {
        var data = collectForm();
        if (!data.name) {
            SM.showToast('请填写姓名', 'error');
            return;
        }
        if (editingId) {
            SM.store.updateMember(editingId, data);
            SM.showToast('已更新「' + data.name + '」', 'success');
        } else {
            SM.store.addMember(data);
            SM.showToast('已添加「' + data.name + '」', 'success');
        }
        closeModal();
        render();
    }

    /* ============================================================
     *  init() —— 绑定事件 + 首次渲染
     * ============================================================ */
    function init() {
        if (inited) return;
        inited = true;
        injectStyle();

        // "添加成员"按钮（静态，位于视图标题栏）
        var addBtn = document.getElementById('btn-add-member');
        if (addBtn) addBtn.addEventListener('click', function () { openModal(null); });

        // 列表内事件委托：编辑 / 删除 / 导入示例（按钮随 render() 重建，故用委托）
        var list = document.getElementById('family-list');
        if (list) {
            list.addEventListener('click', function (e) {
                var btn = closest(e.target, '[data-action]');
                if (!btn) return;
                var action = btn.getAttribute('data-action');

                if (action === 'edit-member') {
                    var m = SM.store.findMember(btn.getAttribute('data-id'));
                    if (m) openModal(m);
                } else if (action === 'delete-member') {
                    var id = btn.getAttribute('data-id');
                    var mem = SM.store.findMember(id);
                    if (mem && window.confirm('确定删除「' + (mem.name || '该成员') + '」？')) {
                        SM.store.removeMember(id);
                        SM.showToast('已删除成员', 'info');
                        render();
                    }
                } else if (action === 'load-sample') {
                    // 导入示例家庭（含冰箱），随后刷新
                    if (SM.loadSampleData) SM.loadSampleData();
                    render();
                    SM.showToast('已导入示例家庭', 'success');
                }
            });
        }

        // 订阅 store 变化：跨模块更新（如 loadSampleData 同时改了冰箱）时自动刷新
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
 * DOM 已就绪（脚本位于 body 末尾），依赖的 store / engineMenu 均已加载。
 * init() 内部用 inited 标志保证幂等：若后续 app.js 再次调用 init() 也不会重复绑定。
 * 若 app.js 在 store.load() 后需刷新视图，可直接调用 SMART_MENU.uiFamily.render()。
 */
SMART_MENU.uiFamily.init();
