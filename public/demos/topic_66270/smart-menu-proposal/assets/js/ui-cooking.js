/**
 * ui-cooking.js — 分人群烹饪指引模块
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.uiCooking（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用；ES5 兼容（var / function / 字符串拼接）
 *
 * 职责：
 *  1) init()               绑定 #cooking-list 事件委托（步骤勾选 / 语音播报）
 *  2) showRecipe(recipeId) 渲染某道菜的分人群烹饪指引：
 *      - 顶部：菜名 + emoji + 适配人群 + 预计时长 + 难度
 *      - 营养师点评区（aiAdapter.getNutritionComment）
 *      - 三栏布局（标准做法 / 老人调整 / 儿童调整，移动端折叠）
 *      - 步骤含安全提示时旁附红色安全卡（bi-exclamation-triangle）
 *      - 语音播报：逐步朗读步骤，支持暂停 / 上一句 / 下一句
 *      - 步骤进度条：已勾选步骤数 / 总步骤数
 *
 * 语音播报说明：
 *  由于 uiElderly.speak 为队列朗读且不暴露 onend 回调，本模块采用
 *  "手动逐句播报"模型：播报时记录当前句索引，上一句 / 下一句直接重播对应句。
 *  开始播报 → 从第 1 步朗读；暂停 → stopSpeak；继续 → 从当前句重播。
 *
 * 依赖：
 *  SMART_MENU.store（store.js）
 *  SMART_MENU.getRecipeById（data-recipes.js）
 *  SMART_MENU.aiAdapter.getNutritionComment（ai-adapter.js）
 *  SMART_MENU.uiElderly.speak / stopSpeak / isSpeaking（ui-elderly.js）
 *  SMART_MENU.showToast（引导脚本 / app.js）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.uiCooking = (function () {
    'use strict';

    var SM = SMART_MENU;
    var inited = false;

    /* ============ 当前展示菜谱的运行时状态 ============
     * 因 #cooking-list 同一时刻仅展示一道菜，故用模块级变量保存即可。
     * 每次 showRecipe 会重置这些状态。
     */
    var curSteps = [];        // 当前菜谱的步骤数组（缓存，便于语音播报引用）
    var checkedSteps = {};    // 步骤序号 → 是否已完成
    var playIdx = 0;         // 当前播报到的步骤索引（0 起）
    var playing = false;     // 是否处于播报中

    /* ============ 适配人群徽章 ============ */
    var SUITABLE_BADGE = {
        family:  { cls: 'badge-family',  label: '全家通用', icon: 'bi-people' },
        elderly: { cls: 'badge-elderly', label: '老人软嫩', icon: 'bi-person-walking' },
        child:   { cls: 'badge-child',   label: '儿童营养', icon: 'bi-balloon' }
    };

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

    /* ============ 一次性注入样式 ============ */
    function injectStyle() {
        if (document.getElementById('ui-cooking-style')) return;
        var css = '' +
            '.cook-wrap{display:flex;flex-direction:column;gap:1.1rem;grid-column:1/-1}' +
            /* 顶部头部 */
            '.cook-head{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}' +
            '.cook-head-emoji{font-size:2.6rem;line-height:1}' +
            '.cook-head-info{flex:1;min-width:200px}' +
            '.cook-head-name{font-family:var(--font-display);font-size:1.5rem;font-weight:700;color:var(--text)}' +
            '.cook-head-tags{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem}' +
            '.cook-head-meta{display:flex;gap:1rem;flex-wrap:wrap;font-size:.88rem;color:var(--text-muted)}' +
            '.cook-head-meta span{display:inline-flex;align-items:center;gap:.3rem}' +
            '.cook-head-meta .bi{color:var(--primary)}' +
            /* 营养师点评 */
            '.cook-comment{background:linear-gradient(135deg,rgba(232,106,51,.06),rgba(245,166,35,.06));border:1px solid rgba(232,106,51,.2);border-radius:var(--radius-sm);padding:1rem 1.15rem}' +
            '.cook-comment-title{display:flex;align-items:center;gap:.45rem;font-weight:600;color:var(--primary-dark);margin-bottom:.5rem;font-size:.95rem}' +
            '.cook-comment-body{white-space:pre-wrap;line-height:1.8;color:var(--text-light);font-size:.92rem}' +
            /* 语音控制 + 进度 */
            '.cook-voice{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;background:var(--bg-warm);border-radius:var(--radius-sm);padding:.7rem .9rem}' +
            '.cook-voice .btn{padding:0 1rem}' +
            '.cook-voice-state{font-size:.85rem;color:var(--text-muted);min-width:6rem}' +
            '.cook-voice-state b{color:var(--primary)}' +
            '.cook-progress-wrap{flex:1;min-width:180px;display:flex;align-items:center;gap:.6rem}' +
            '.cook-progress-label{font-size:.82rem;color:var(--text-muted);white-space:nowrap}' +
            '.cook-progress{flex:1;height:10px;background:var(--border-light);border-radius:50px;overflow:hidden}' +
            '.cook-progress-fill{height:100%;background:linear-gradient(90deg,var(--secondary),#6CA335);transition:width .35s}' +
            /* 三栏布局 */
            '.cook-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}' +
            '@media(max-width:900px){.cook-columns{grid-template-columns:1fr}}' +
            '.cook-col{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:1rem 1.1rem}' +
            '.cook-col-head{display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-weight:600;color:var(--text);margin-bottom:.85rem;padding-bottom:.5rem;border-bottom:2px solid var(--border-light)}' +
            '.cook-col-head .bi{font-size:1.1rem}' +
            '.cook-col-head.std .bi{color:var(--primary)}' +
            '.cook-col-head.el .bi{color:#B9791A}' +
            '.cook-col-head.ch .bi{color:#5C8A2E}' +
            '.cook-col-empty{font-size:.86rem;color:var(--text-muted);line-height:1.7}' +
            /* 步骤卡片 */
            '.cook-step{position:relative;border:1px solid var(--border);border-radius:var(--radius-sm);padding:.8rem .9rem .8rem 3.2rem;margin-bottom:.7rem;transition:var(--transition)}' +
            '.cook-step .cook-step-no{position:absolute;left:.7rem;top:.7rem;width:2rem;height:2rem;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem}' +
            '.cook-step-text{font-size:.92rem;color:var(--text);line-height:1.65}' +
            '.cook-step-meta{display:flex;align-items:center;gap:.9rem;flex-wrap:wrap;margin-top:.45rem;font-size:.8rem;color:var(--text-muted)}' +
            '.cook-step-meta span{display:inline-flex;align-items:center;gap:.25rem}' +
            '.cook-step-tip{margin-top:.4rem;font-size:.82rem;color:var(--primary-dark);background:rgba(232,106,51,.08);border-radius:6px;padding:.35rem .6rem}' +
            '.cook-safety{margin-top:.45rem;display:flex;gap:.4rem;align-items:flex-start;background:rgba(217,83,79,.1);border:1px solid rgba(217,83,79,.35);border-radius:6px;padding:.4rem .6rem;font-size:.82rem;color:#C0392B}' +
            '.cook-safety .bi{flex-shrink:0;margin-top:.05rem}' +
            /* 勾选控件 */
            '.cook-step-check{display:inline-flex;align-items:center;gap:.35rem;cursor:pointer;font-size:.82rem;color:var(--text-muted);user-select:none}' +
            '.cook-step-check input{width:16px;height:16px;accent-color:var(--secondary)}' +
            '.cook-step.is-done{opacity:.55;background:var(--bg-warm)}' +
            '.cook-step.is-done .cook-step-no{background:var(--secondary)}' +
            '.cook-step.is-done .cook-step-text{text-decoration:line-through}' +
            '.cook-step.is-done .cook-done-mark{position:absolute;right:.7rem;top:.7rem;color:var(--secondary);font-size:1.1rem;animation:cook-check .35s ease}' +
            '@keyframes cook-check{0%{transform:scale(0);opacity:0}60%{transform:scale(1.25)}100%{transform:scale(1);opacity:1}}' +
            /* 老人/儿童调整项 */
            '.cook-adapt-item{display:flex;gap:.5rem;align-items:flex-start;padding:.5rem 0;border-bottom:1px dashed var(--border-light);font-size:.88rem;line-height:1.6}' +
            '.cook-adapt-item:last-child{border-bottom:none}' +
            '.cook-adapt-item .bi{color:inherit;flex-shrink:0;margin-top:.15rem}' +
            '.cook-adapt-item .k{font-weight:600;color:var(--text);white-space:nowrap}' +
            '.cook-adapt-item .v{color:var(--text-light)}' +
            '.cook-adapt-item.warn .bi{color:#B9791A}' +
            '.cook-adapt-item.warn .k{color:#9C6412}' +
            '.cook-adapt-item.safe .bi{color:#5C8A2E}' +
            '.cook-adapt-item.safe .k{color:#4F7A24}' +
            /* 当前正在播报的步骤高亮 */
            '.cook-step.is-speaking{border-color:var(--primary);box-shadow:0 0 0 2px rgba(232,106,51,.2)}';
        var style = document.createElement('style');
        style.id = 'ui-cooking-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ============ 计算预计总时长 ============ */
    function totalDuration(steps) {
        var sum = 0;
        for (var i = 0; i < steps.length; i++) {
            sum += Number(steps[i].duration) || 0;
        }
        return sum;
    }

    /* ============ 推断难度标签 ============
     * 依据步骤数与总时长综合判定：步骤多或耗时长视为较复杂。
     */
    function difficultyLabel(steps) {
        var n = steps.length;
        var t = totalDuration(steps);
        if (n >= 5 || t >= 30) return { label: '较复杂', icon: 'bi-thermometer-high', color: '#D9534F' };
        if (n >= 3 || t >= 15) return { label: '中等', icon: 'bi-thermometer-half', color: '#F0A932' };
        return { label: '简单', icon: 'bi-thermometer-low', color: '#5C8A2E' };
    }

    /* ============ 渲染适配人群徽章 ============ */
    function renderSuitableBadges(recipe) {
        var arr = recipe.suitableFor || [];
        var html = '';
        for (var i = 0; i < arr.length; i++) {
            var b = SUITABLE_BADGE[arr[i]];
            if (!b) continue;
            html += '<span class="badge ' + b.cls + '"><i class="bi ' + b.icon + '"></i> ' + esc(b.label) + '</span>';
        }
        return html;
    }

    /* ============ 渲染标准做法步骤卡片 ============ */
    function renderSteps(steps) {
        if (!steps || !steps.length) {
            return '<div class="cook-col-empty">暂无步骤</div>';
        }
        var html = '';
        for (var i = 0; i < steps.length; i++) {
            var s = steps[i];
            var no = s.no != null ? s.no : (i + 1);
            var dur = s.duration != null ? (s.duration + ' 分钟') : '';
            var tip = s.tip ? '<div class="cook-step-tip"><i class="bi bi-lightbulb"></i> ' + esc(s.tip) + '</div>' : '';
            var safety = s.safety ? '<div class="cook-safety"><i class="bi bi-exclamation-triangle"></i> <span>安全提示：' + esc(s.safety) + '</span></div>' : '';

            html += '' +
            '<div class="cook-step" data-no="' + esc(no) + '" data-idx="' + i + '">' +
              '<span class="cook-step-no">' + esc(no) + '</span>' +
              '<div class="cook-step-text">' + esc(s.text || '') + '</div>' +
              '<div class="cook-step-meta">' +
                (dur ? '<span><i class="bi bi-clock"></i> ' + dur + '</span>' : '') +
                '<label class="cook-step-check"><input type="checkbox" data-action="toggle-step" data-no="' + esc(no) + '" data-idx="' + i + '"> 已完成</label>' +
              '</div>' +
              tip + safety +
            '</div>';
        }
        return html;
    }

    /* ============ 渲染老人专属调整 ============ */
    function renderElderlyAdapt(adapt) {
        if (!adapt) return '<div class="cook-col-empty">本菜暂无老人专属调整</div>';
        var html = '';
        if (adapt.saltReducePct != null) {
            html += adaptItem('bi-droplet-half', '减盐', '减少 ' + adapt.saltReducePct + '% 用盐量', 'warn');
        }
        if (adapt.cookLongerMin != null) {
            html += adaptItem('bi-clock-history', '延长烹饪', '在标准基础上延长 ' + adapt.cookLongerMin + ' 分钟，使其更软烂', 'warn');
        }
        if (adapt.softTip) {
            html += adaptItem('bi-hand-thumbs-up', '软嫩处理', adapt.softTip, 'warn');
        }
        if (adapt.softnessCheck) {
            html += adaptItem('bi-clipboard-check', '熟度判断', adapt.softnessCheck, 'warn');
        }
        if (!html) html = '<div class="cook-col-empty">本菜暂无老人专属调整</div>';
        return html;
    }

    /* ============ 渲染儿童专属调整 ============ */
    function renderChildAdapt(adapt) {
        if (!adapt) return '<div class="cook-col-empty">本菜暂无儿童专属调整</div>';
        var html = '';
        if (adapt.cutSize) {
            html += adaptItem('bi-scissors', '切配尺寸', adapt.cutSize, 'safe');
        }
        if (adapt.antiChoke) {
            html += adaptItem('bi-shield-lock', '防呛噎', adapt.antiChoke, 'safe');
        }
        if (adapt.nutrition) {
            html += adaptItem('bi-egg-fried', '营养说明', adapt.nutrition, 'safe');
        }
        if (!html) html = '<div class="cook-col-empty">本菜暂无儿童专属调整</div>';
        return html;
    }

    /* 调整项单元 */
    function adaptItem(icon, key, val, tone) {
        return '<div class="cook-adapt-item ' + (tone || '') + '">' +
            '<i class="bi ' + icon + '"></i>' +
            '<div><span class="k">' + esc(key) + '：</span><span class="v">' + esc(val) + '</span></div>' +
          '</div>';
    }

    /* ============ 更新进度条与计数 ============ */
    function updateProgress() {
        var total = curSteps.length;
        var done = 0;
        for (var k in checkedSteps) {
            if (checkedSteps.hasOwnProperty(k) && checkedSteps[k]) done++;
        }
        var fill = document.getElementById('cook-progress-fill');
        var label = document.getElementById('cook-progress-label');
        var pct = total > 0 ? Math.round(done / total * 100) : 0;
        if (fill) fill.style.width = pct + '%';
        if (label) label.textContent = '已完成 ' + done + ' / ' + total + ' 步';
    }

    /* ============ 语音播报：更新控件 UI ============ */
    function updateVoiceUI() {
        var btn = document.getElementById('cook-voice-play');
        var state = document.getElementById('cook-voice-state');
        var prevBtn = document.getElementById('cook-voice-prev');
        var nextBtn = document.getElementById('cook-voice-next');
        if (btn) {
            btn.innerHTML = playing
                ? '<i class="bi bi-pause-fill"></i> 暂停播报'
                : '<i class="bi bi-volume-up"></i> ' + (playIdx > 0 && !playing ? '继续播报' : '开始播报');
        }
        if (state) {
            if (playing) {
                state.innerHTML = '正在播报第 <b>' + (playIdx + 1) + '</b> / ' + curSteps.length + ' 步';
            } else if (playIdx > 0) {
                state.innerHTML = '已暂停于第 <b>' + (playIdx + 1) + '</b> 步';
            } else {
                state.innerHTML = '点击开始逐步朗读步骤';
            }
        }
        if (prevBtn) prevBtn.disabled = (playIdx <= 0);
        if (nextBtn) nextBtn.disabled = (playIdx >= curSteps.length - 1);

        // 高亮当前播报步骤
        var stepsEls = document.querySelectorAll('.cook-step');
        for (var i = 0; i < stepsEls.length; i++) {
            stepsEls[i].classList.toggle('is-speaking', playing && (parseInt(stepsEls[i].getAttribute('data-idx'), 10) === playIdx));
        }
    }

    /* ============ 朗读指定索引步骤 ============ */
    function speakStep(idx) {
        if (idx < 0 || idx >= curSteps.length) return;
        playIdx = idx;
        playing = true;
        if (SM.uiElderly && SM.uiElderly.stopSpeak) SM.uiElderly.stopSpeak();
        if (SM.uiElderly && SM.uiElderly.speak) {
            var text = curSteps[idx].text || ('第' + (idx + 1) + '步');
            SM.uiElderly.speak(text, { rate: 0.95 });
        }
        updateVoiceUI();
    }

    /* ============ 语音控制动作 ============ */
    function voicePlay() {
        if (!SM.uiElderly || !SM.uiElderly.speak) {
            if (SM.showToast) SM.showToast('当前浏览器不支持语音播报', 'error');
            return;
        }
        if (playing) {
            // 当前正在播报 → 暂停
            if (SM.uiElderly.stopSpeak) SM.uiElderly.stopSpeak();
            playing = false;
            updateVoiceUI();
        } else {
            // 继续 / 开始：从当前 playIdx 开始
            if (playIdx >= curSteps.length) playIdx = 0;
            speakStep(playIdx);
        }
    }
    function voicePrev() {
        if (playIdx <= 0) return;
        speakStep(playIdx - 1);
    }
    function voiceNext() {
        if (playIdx >= curSteps.length - 1) {
            if (SM.showToast) SM.showToast('已是最后一步', 'info');
            return;
        }
        speakStep(playIdx + 1);
    }

    /* ============ 切换步骤完成状态 ============ */
    function toggleStep(idx, no, checked) {
        checkedSteps[no] = checked;
        var stepEl = document.querySelector('.cook-step[data-idx="' + idx + '"]');
        if (stepEl) {
            stepEl.classList.toggle('is-done', checked);
            // 打勾标记
            var mark = stepEl.querySelector('.cook-done-mark');
            if (checked && !mark) {
                var m = document.createElement('span');
                m.className = 'cook-done-mark';
                m.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
                stepEl.appendChild(m);
            } else if (!checked && mark) {
                mark.parentNode.removeChild(mark);
            }
        }
        updateProgress();
    }

    /* ============================================================
     *  showRecipe(recipeId) —— 渲染某道菜的烹饪指引
     * ============================================================ */
    function showRecipe(recipeId) {
        var box = document.getElementById('cooking-list');
        if (!box) return;

        var recipe = SM.getRecipeById ? SM.getRecipeById(recipeId) : null;
        if (!recipe) {
            box.innerHTML =
                '<div class="empty-state js-empty">' +
                  '<div class="empty-icon"><i class="bi bi-fire"></i></div>' +
                  '<div class="empty-title">未找到该菜谱</div>' +
                  '<div class="empty-desc">请返回菜单重新选择菜品</div>' +
                '</div>';
            return;
        }

        // 重置运行时状态
        curSteps = (recipe.cookingSteps || []).slice();
        checkedSteps = {};
        playIdx = 0;
        playing = false;

        var steps = recipe.cookingSteps || [];
        var dur = totalDuration(steps);
        var diff = difficultyLabel(steps);
        var family = (SM.store && SM.store.get('family')) || [];

        // 营养师点评
        var comment = '';
        try {
            comment = (SM.aiAdapter && SM.aiAdapter.getNutritionComment)
                ? SM.aiAdapter.getNutritionComment(recipe, family)
                : '（营养点评模块未就绪）';
        } catch (e) {
            comment = '（营养点评生成失败）';
        }

        var n = recipe.nutrition || {};

        var html = '<div class="cook-wrap">';
        // 顶部头部
        html += '' +
        '<div class="cook-head">' +
          '<span class="cook-head-emoji">' + esc(recipe.emoji || '🍽️') + '</span>' +
          '<div class="cook-head-info">' +
            '<div class="cook-head-name">' + esc(recipe.name || '未命名菜品') + '</div>' +
            '<div class="cook-head-tags">' + renderSuitableBadges(recipe) + '</div>' +
          '</div>' +
          '<div class="cook-head-meta">' +
            '<span><i class="bi bi-clock"></i> 预计 ' + dur + ' 分钟</span>' +
            '<span><i class="bi ' + diff.icon + '" style="color:' + diff.color + '"></i> ' + esc(diff.label) + '</span>' +
            '<span><i class="bi bi-list-ol"></i> ' + steps.length + ' 步</span>' +
            '<span><i class="bi bi-fire"></i> ' + (n.calories || 0) + ' 千卡</span>' +
          '</div>' +
        '</div>';

        // 营养师点评
        html += '' +
        '<div class="cook-comment">' +
          '<div class="cook-comment-title"><i class="bi bi-chat-square-heart"></i> 营养师点评</div>' +
          '<div class="cook-comment-body">' + esc(comment) + '</div>' +
        '</div>';

        // 语音播报控制 + 步骤进度
        html += '' +
        '<div class="cook-voice">' +
          '<button class="btn btn-primary btn-sm" id="cook-voice-play" data-action="voice-play">' +
            '<i class="bi bi-volume-up"></i> 开始播报</button>' +
          '<button class="btn btn-ghost btn-sm" id="cook-voice-prev" data-action="voice-prev" disabled>' +
            '<i class="bi bi-skip-start"></i> 上一句</button>' +
          '<button class="btn btn-ghost btn-sm" id="cook-voice-next" data-action="voice-next">' +
            '下一句 <i class="bi bi-skip-end"></i></button>' +
          '<span class="cook-voice-state" id="cook-voice-state">点击开始逐步朗读步骤</span>' +
          '<div class="cook-progress-wrap">' +
            '<div class="cook-progress-label" id="cook-progress-label">已完成 0 / ' + steps.length + ' 步</div>' +
            '<div class="cook-progress"><div class="cook-progress-fill" id="cook-progress-fill" style="width:0%"></div></div>' +
          '</div>' +
        '</div>';

        // 三栏布局
        html += '<div class="cook-columns">' +
          '<div class="cook-col">' +
            '<div class="cook-col-head std"><i class="bi bi-list-check"></i> 标准做法</div>' +
            renderSteps(steps) +
          '</div>' +
          '<div class="cook-col">' +
            '<div class="cook-col-head el"><i class="bi bi-person-walking"></i> 老人专属调整</div>' +
            renderElderlyAdapt(recipe.adaptations && recipe.adaptations.elderly) +
          '</div>' +
          '<div class="cook-col">' +
            '<div class="cook-col-head ch"><i class="bi bi-balloon"></i> 儿童专属调整</div>' +
            renderChildAdapt(recipe.adaptations && recipe.adaptations.child) +
          '</div>' +
        '</div>';

        html += '</div>'; // .cook-wrap

        box.innerHTML = html;
        updateProgress();
        updateVoiceUI();
    }

    /* ============================================================
     *  init() —— 事件委托
     * ============================================================ */
    function init() {
        if (inited) return;
        inited = true;
        injectStyle();

        var box = document.getElementById('cooking-list');
        if (!box) return;

        // 事件委托：步骤勾选 / 语音控制
        box.addEventListener('change', function (e) {
            var t = e.target;
            if (!t || !t.getAttribute) return;
            var action = t.getAttribute('data-action');
            if (action === 'toggle-step') {
                var idx = parseInt(t.getAttribute('data-idx'), 10);
                var no = t.getAttribute('data-no');
                toggleStep(idx, no, t.checked);
            }
        });

        box.addEventListener('click', function (e) {
            var el = closest(e.target, '[data-action]');
            if (!el) return;
            var action = el.getAttribute('data-action');
            if (action === 'voice-play') voicePlay();
            else if (action === 'voice-prev') voicePrev();
            else if (action === 'voice-next') voiceNext();
        });
    }

    /* ============ 对外暴露 ============ */
    return {
        init: init,
        showRecipe: showRecipe
    };
})();

/* ============ 模块加载后自动初始化 ============
 * DOM 已就绪（脚本位于 body 末尾），依赖的 store / getRecipeById / aiAdapter 均已加载。
 * init() 内部用 inited 标志保证幂等：若后续 app.js 再次调用 init() 也不会重复绑定。
 * 菜谱展示由 uiMenu 调用 SMART_MENU.uiCooking.showRecipe(recipeId) 触发。
 */
SMART_MENU.uiCooking.init();
