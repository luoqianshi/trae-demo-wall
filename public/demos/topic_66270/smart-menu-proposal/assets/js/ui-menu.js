/**
 * ui-menu.js — 全龄适配菜单生成模块
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.uiMenu（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用；ES5 兼容（var / function / 字符串拼接）
 *
 * 职责：
 *  1) init()              绑定 #btn-generate-menu 点击 → generateAndRender()
 *  2) generateAndRender() 读取家庭与冰箱，调用引擎生成菜单并自动生成采购清单
 *  3) render()            渲染当前菜单方案（安全报告条 / 营养堆叠条 / 三餐菜品卡片）
 *
 * 菜品卡片交互：
 *  - 点击菜品 → 进入烹饪指引（setActiveStep(4) + uiCooking.showRecipe(recipeId)）
 *  - 底部"换一批"按钮 → 重新 generateAndRender
 *
 * 依赖：
 *  SMART_MENU.store（store.js）
 *  SMART_MENU.engineMenu.generateMenu（engine-menu.js）
 *  SMART_MENU.engineShopping.generateShoppingList（engine-shopping.js）
 *  SMART_MENU.showToast / setActiveStep（引导脚本 / app.js）
 *  SMART_MENU.uiCooking.showRecipe（ui-cooking.js）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.uiMenu = (function () {
    'use strict';

    var SM = SMART_MENU;
    var inited = false;
    var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };

    /* ============ 餐次配置（标题 / 图标） ============ */
    var MEAL_CONFIG = [
        { key: 'breakfast', label: '早餐', icon: 'bi-sunrise' },
        { key: 'lunch',     label: '午餐', icon: 'bi-brightness-high' },
        { key: 'dinner',    label: '晚餐', icon: 'bi-moon-stars' }
    ];

    /* ============ 适配版本徽章配置 ============
     * variants 中的字符串 → 徽章 class / 文案 / 图标
     */
    var VARIANT_BADGE = {
        family:  { cls: 'badge-family',  label: '全家通用', icon: 'bi-people' },
        elderly: { cls: 'badge-elderly', label: '老人软嫩', icon: 'bi-person-walking' },
        child:   { cls: 'badge-child',   label: '儿童营养', icon: 'bi-balloon' }
    };

    /* ============ 小工具 ============ */
    // HTML 转义，避免数据破坏结构
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

    // 对容器内未显示的 .reveal 逐个加 .visible（带错峰淡入）
    function triggerReveal(root) {
        var els = root.querySelectorAll('.reveal:not(.visible)');
        if (!els.length) return;
        raf(function () {
            for (var i = 0; i < els.length; i++) {
                (function (el, idx) {
                    setTimeout(function () { el.classList.add('visible'); }, 60 * idx);
                })(els[i], i);
            }
        });
    }

    function round1(n) { return Math.round((Number(n) || 0) * 10) / 10; }

    /* ============ 一次性注入本模块所需样式 ============ */
    function injectStyle() {
        if (document.getElementById('ui-menu-style')) return;
        var css = '' +
            '.menu-wrap{display:flex;flex-direction:column;gap:1.25rem;grid-column:1/-1}' +
            /* 安全报告条 */
            '.menu-safety{display:flex;gap:.7rem;align-items:flex-start;background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.4);border-radius:var(--radius-sm);padding:.9rem 1.1rem;color:#9C6412}' +
            '.menu-safety .bi{font-size:1.25rem;margin-top:.1rem;flex-shrink:0}' +
            '.menu-safety-title{font-weight:600;margin-bottom:.2rem}' +
            '.menu-safety ul{margin:0;padding-left:1.1rem;line-height:1.7;font-size:.9rem}' +
            /* 营养堆叠条 */
            '.menu-nutrition{background:var(--bg-warm);border-radius:var(--radius-sm);padding:1rem 1.1rem}' +
            '.menu-nutrition-title{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.7rem;flex-wrap:wrap;gap:.5rem}' +
            '.menu-nutrition-title .lbl{font-weight:600;color:var(--text);font-size:.95rem}' +
            '.menu-nutrition-total{font-family:var(--font-display);font-size:1.45rem;font-weight:700;color:var(--primary)}' +
            '.menu-nutrition-total small{font-size:.75rem;font-weight:500;color:var(--text-muted)}' +
            '.menu-nutrition-bar{display:flex;height:14px;border-radius:50px;overflow:hidden;background:var(--border-light)}' +
            '.menu-nutrition-seg{height:100%;transition:width .4s ease}' +
            '.menu-nutrition-legend{display:flex;gap:1.1rem;flex-wrap:wrap;margin-top:.6rem;font-size:.8rem;color:var(--text-muted)}' +
            '.menu-nutrition-legend .dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:.35rem;vertical-align:middle}' +
            /* 餐次区块 */
            '.menu-meal{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.2rem 1.3rem;box-shadow:0 4px 24px var(--shadow)}' +
            '.menu-meal-head{display:flex;align-items:center;gap:.6rem;font-family:var(--font-display);font-size:1.15rem;font-weight:600;color:var(--text);margin-bottom:1rem;padding-bottom:.6rem;border-bottom:2px solid var(--border-light)}' +
            '.menu-meal-head .bi{color:var(--primary)}' +
            '.menu-meal-count{font-size:.8rem;color:var(--text-muted);background:var(--bg-warm);padding:.1rem .6rem;border-radius:50px;font-weight:500;margin-left:auto}' +
            '.menu-meal-empty{font-size:.88rem;color:var(--text-muted);padding:.4rem 0}' +
            '.menu-dish-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}' +
            '@media(max-width:640px){.menu-dish-grid{grid-template-columns:1fr}}' +
            /* 菜品卡片 */
            '.menu-dish{cursor:pointer;display:flex;flex-direction:column;gap:.7rem;padding:1.1rem 1.2rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--card);transition:var(--transition)}' +
            '.menu-dish:hover{transform:translateY(-3px);border-color:var(--primary-light);box-shadow:0 8px 22px var(--shadow)}' +
            '.menu-dish-head{display:flex;align-items:center;gap:.8rem}' +
            '.menu-dish-emoji{font-size:1.9rem;line-height:1;flex-shrink:0}' +
            '.menu-dish-info{flex:1;min-width:0}' +
            '.menu-dish-name{font-family:var(--font-display);font-weight:600;font-size:1.08rem;color:var(--text)}' +
            '.menu-dish-dishType{font-size:.74rem;color:var(--text-muted);margin-top:.1rem}' +
            '.menu-dish-match{font-size:.8rem;color:var(--text-muted);margin-top:.15rem;display:flex;align-items:center;gap:.3rem}' +
            '.menu-dish-match .bi{color:#5C8A2E}' +
            '.menu-dish-score{font-size:.78rem;font-weight:600;color:var(--primary);background:rgba(232,106,51,.1);padding:.2rem .55rem;border-radius:50px;white-space:nowrap}' +
            '.menu-dish-variants,.menu-dish-tags{display:flex;flex-wrap:wrap;gap:.4rem}' +
            '.menu-dish-nutrition{font-size:.82rem;color:var(--text-light);display:flex;gap:.7rem;flex-wrap:wrap;padding-top:.2rem;border-top:1px dashed var(--border-light)}' +
            '.menu-dish-nutrition span{display:inline-flex;align-items:center;gap:.25rem}' +
            '.menu-dish-nutrition .bi{font-size:.85em}' +
            '.menu-foot{display:flex;justify-content:center;padding-top:.6rem}';
        var style = document.createElement('style');
        style.id = 'ui-menu-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ============ 渲染适配版本徽章 ============ */
    function renderVariants(variants) {
        var html = '';
        if (!variants || !variants.length) return html;
        for (var i = 0; i < variants.length; i++) {
            var v = VARIANT_BADGE[variants[i]];
            if (!v) continue;
            html += '<span class="badge ' + v.cls + '"><i class="bi ' + v.icon + '"></i> ' + esc(v.label) + '</span>';
        }
        return html;
    }

    /* ============ 渲染菜品标签（tags 小标签） ============ */
    function renderTags(tags) {
        var html = '';
        if (!tags || !tags.length) return html;
        for (var i = 0; i < tags.length; i++) {
            html += '<span class="tag"><i class="bi bi-tag"></i> ' + esc(tags[i]) + '</span>';
        }
        return html;
    }

    /* ============ 渲染单道菜品卡片 ============ */
    function renderDishCard(dish, idx) {
        var recipe = dish.recipe || {};
        var variants = dish.variants || [];
        var tags = recipe.tags || [];
        var n = recipe.nutrition || {};
        var matched = dish.matched || 0;
        var total = dish.total || 0;
        var score = Math.round(dish.matchScore || 0);

        var nutHtml = '' +
            '<span><i class="bi bi-fire"></i> ' + (n.calories || 0) + ' 千卡</span>' +
            '<span><i class="bi bi-egg-fried"></i> 蛋白 ' + round1(n.protein) + 'g</span>' +
            '<span><i class="bi bi-cake2"></i> 碳水 ' + round1(n.carbs) + 'g</span>' +
            '<span><i class="bi bi-droplet"></i> 脂肪 ' + round1(n.fat) + 'g</span>';

        return '' +
        '<div class="menu-dish reveal" style="transition-delay:' + (idx * 0.07) + 's" data-action="open-recipe" data-id="' + esc(recipe.id) + '">' +
          '<div class="menu-dish-head">' +
            '<span class="menu-dish-emoji">' + esc(recipe.emoji || '🍽️') + '</span>' +
            '<div class="menu-dish-info">' +
              '<div class="menu-dish-name">' + esc(recipe.name || '未命名菜品') + '</div>' +
              '<div class="menu-dish-dishType">' + esc(recipe.dishType || '') + '</div>' +
              '<div class="menu-dish-match"><i class="bi bi-check2-circle"></i> 已匹配 ' + matched + '/' + total + ' 种食材</div>' +
            '</div>' +
            '<span class="menu-dish-score">匹配 ' + score + '</span>' +
          '</div>' +
          (variants.length ? '<div class="menu-dish-variants">' + renderVariants(variants) + '</div>' : '') +
          (tags.length ? '<div class="menu-dish-tags">' + renderTags(tags) + '</div>' : '') +
          '<div class="menu-dish-nutrition">' + nutHtml + '</div>' +
        '</div>';
    }

    /* ============ 渲染单个餐次区块 ============ */
    function renderMealSection(mealCfg, dishes) {
        var cards = '';
        var count = (dishes && dishes.length) || 0;
        if (!count) {
            cards = '<div class="menu-meal-empty">暂无推荐菜品</div>';
        } else {
            for (var i = 0; i < dishes.length; i++) {
                cards += renderDishCard(dishes[i], i);
            }
        }
        return '' +
        '<div class="menu-meal reveal">' +
          '<div class="menu-meal-head">' +
            '<i class="bi ' + mealCfg.icon + '"></i> ' + esc(mealCfg.label) +
            '<span class="menu-meal-count">' + count + ' 道菜</span>' +
          '</div>' +
          '<div class="menu-dish-grid">' + cards + '</div>' +
        '</div>';
    }

    /* ============ 渲染营养堆叠条 ============
     * 以蛋白质/碳水/脂肪的供能占比绘制堆叠条（蛋白4、碳水4、脂肪9 kcal/g）。
     */
    function renderNutritionBar(total) {
        if (!total) return '';
        var pCal = (Number(total.protein) || 0) * 4;
        var cCal = (Number(total.carbs) || 0) * 4;
        var fCal = (Number(total.fat) || 0) * 9;
        var sum = pCal + cCal + fCal;
        if (sum <= 0) {
            return '' +
            '<div class="menu-nutrition">' +
              '<div class="menu-nutrition-title"><span class="lbl">营养汇总</span></div>' +
              '<div class="menu-meal-empty">暂无营养数据</div>' +
            '</div>';
        }
        // 各段宽度百分比（四舍五入到整数，末段兜底补齐 100 避免留白）
        var pPct = Math.round(pCal / sum * 100);
        var cPct = Math.round(cCal / sum * 100);
        var fPct = 100 - pPct - cPct;
        if (fPct < 0) { pPct = Math.max(0, pPct + fPct); fPct = 0; }

        return '' +
        '<div class="menu-nutrition">' +
          '<div class="menu-nutrition-title">' +
            '<span class="lbl"><i class="bi bi-clipboard2-pulse"></i> 三餐营养汇总</span>' +
            '<span class="menu-nutrition-total">' + Math.round(total.calories || 0) + ' <small>千卡</small></span>' +
          '</div>' +
          '<div class="menu-nutrition-bar">' +
            '<div class="menu-nutrition-seg" style="width:' + pPct + '%;background:#E86A33" title="蛋白质供能"></div>' +
            '<div class="menu-nutrition-seg" style="width:' + cPct + '%;background:#7CB342" title="碳水供能"></div>' +
            '<div class="menu-nutrition-seg" style="width:' + fPct + '%;background:#F0A932" title="脂肪供能"></div>' +
          '</div>' +
          '<div class="menu-nutrition-legend">' +
            '<span><span class="dot" style="background:#E86A33"></span>蛋白 ' + round1(total.protein) + 'g</span>' +
            '<span><span class="dot" style="background:#7CB342"></span>碳水 ' + round1(total.carbs) + 'g</span>' +
            '<span><span class="dot" style="background:#F0A932"></span>脂肪 ' + round1(total.fat) + 'g</span>' +
          '</div>' +
        '</div>';
    }

    /* ============ 渲染安全报告条 ============ */
    function renderSafetyBar(warnings) {
        if (!warnings || !warnings.length) return '';
        var items = '';
        for (var i = 0; i < warnings.length; i++) {
            items += '<li>' + esc(warnings[i]) + '</li>';
        }
        return '' +
        '<div class="menu-safety">' +
          '<i class="bi bi-shield-check"></i>' +
          '<div>' +
            '<div class="menu-safety-title">安全适配报告（已为全家过滤风险菜品）</div>' +
            '<ul>' + items + '</ul>' +
          '</div>' +
        '</div>';
    }

    /* ============================================================
     *  render() —— 渲染当前菜单方案
     * ============================================================ */
    function render() {
        var box = document.getElementById('menu-list');
        if (!box) return;
        var menuPlan = SM.store ? SM.store.get('currentMenu') : null;
        box.innerHTML = '';

        // 空状态
        if (!menuPlan || !menuPlan.meals) {
            box.innerHTML =
                '<div class="empty-state js-empty">' +
                  '<div class="empty-icon"><i class="bi bi-journal-text"></i></div>' +
                  '<div class="empty-title">尚未生成菜单</div>' +
                  '<div class="empty-desc">完成前两步后，点击"生成今日菜单"一键得到全家适配方案</div>' +
                '</div>';
            return;
        }

        var meals = menuPlan.meals || {};
        var safety = menuPlan.safetyReport || {};
        var nutrition = menuPlan.nutritionSummary || {};
        var total = nutrition.total || {};

        var html = '<div class="menu-wrap">';
        // 安全报告条
        html += renderSafetyBar(safety.warnings);
        // 营养汇总条
        html += renderNutritionBar(total);
        // 三餐区块
        for (var i = 0; i < MEAL_CONFIG.length; i++) {
            var mc = MEAL_CONFIG[i];
            html += renderMealSection(mc, meals[mc.key] || []);
        }
        // 底部"换一批"按钮
        html += '<div class="menu-foot">' +
            '<button class="btn btn-ghost btn-sm" data-action="regenerate">' +
              '<i class="bi bi-arrow-repeat"></i> 换一批' +
            '</button>' +
          '</div>';
        html += '</div>';

        box.innerHTML = html;
        triggerReveal(box);
    }

    /* ============================================================
     *  generateAndRender() —— 生成菜单 + 采购清单并渲染
     * ============================================================ */
    function generateAndRender() {
        if (!SM.store) return;
        var family = SM.store.get('family') || [];
        var fridge = SM.store.get('fridge') || [];

        // 家庭为空时提示并中止
        if (!family.length) {
            if (SM.showToast) SM.showToast('请先添加家庭成员', 'error');
            return;
        }

        // 生成菜单
        if (!SM.engineMenu || !SM.engineMenu.generateMenu) {
            if (SM.showToast) SM.showToast('菜单引擎未就绪', 'error');
            return;
        }
        var menuPlan = SM.engineMenu.generateMenu(family, fridge, {
            mealType: 'all',
            dishesPerMeal: 2,
            preferFridge: true
        });

        // 存入 store（会触发订阅刷新）
        SM.store.set('currentMenu', menuPlan);

        // 自动生成采购清单并存储
        if (SM.engineShopping && SM.engineShopping.generateShoppingList) {
            var list = SM.engineShopping.generateShoppingList(menuPlan, fridge, family);
            SM.store.set('currentShoppingList', list);
        }

        // 渲染菜单（set 已触发订阅，但显式渲染保证即时反馈）
        render();

        if (SM.showToast) SM.showToast('已生成全家适配菜单', 'success');
    }

    /* ============================================================
     *  init() —— 绑定事件
     * ============================================================ */
    function init() {
        if (inited) return;
        inited = true;
        injectStyle();

        // 生成菜单按钮
        var genBtn = document.getElementById('btn-generate-menu');
        if (genBtn) genBtn.addEventListener('click', function () { generateAndRender(); });

        // 列表内事件委托：打开菜品 / 换一批（按钮随 render 重建，故用委托）
        var box = document.getElementById('menu-list');
        if (box) {
            box.addEventListener('click', function (e) {
                var el = closest(e.target, '[data-action]');
                if (!el) return;
                var action = el.getAttribute('data-action');

                if (action === 'open-recipe') {
                    var id = el.getAttribute('data-id');
                    // 切换到烹饪指引视图并展示该菜谱
                    if (SM.setActiveStep) SM.setActiveStep(4);
                    if (SM.uiCooking && SM.uiCooking.showRecipe) SM.uiCooking.showRecipe(id);
                } else if (action === 'regenerate') {
                    generateAndRender();
                }
            });
        }
    }

    /* ============ 对外暴露 ============ */
    return {
        init: init,
        render: render,
        generateAndRender: generateAndRender
    };
})();

/* ============ 模块加载后自动初始化 ============
 * DOM 已就绪（脚本位于 body 末尾），依赖的 store / engineMenu 均已加载。
 * init() 内部用 inited 标志保证幂等：若后续 app.js 再次调用 init() 也不会重复绑定。
 * 若 app.js 在 store.load() 后需刷新视图，可直接调用 SMART_MENU.uiMenu.render()。
 */
SMART_MENU.uiMenu.init();
