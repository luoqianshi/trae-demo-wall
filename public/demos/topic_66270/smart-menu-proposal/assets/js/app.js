/**
 * app.js — 应用路由与全局调度
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.app（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用；ES5 兼容（var / function / 字符串拼接）
 *
 * 职责：
 *  1) store.load() 加载持久化数据
 *  2) 调用各 UI 模块 init（幂等，内部 inited 标志保证不重复绑定）
 *  3) store.subscribe 全局刷新回调：family/fridge/currentMenu/currentShoppingList
 *     变化时调用对应模块 render()
 *  4) 初始渲染各视图
 *  5) 覆盖 SMART_MENU.setActiveStep：在原逻辑基础上，切换到菜单视图时若
 *     currentMenu 为空给出提示，切换到采购视图时触发 render
 *  6) 重置按钮 #btn-reset：store.reset() → 重置适老化 → 重新渲染 → 返回 hero
 *  7) 下一步 #btn-next 逻辑增强：1→2 校验家庭、2→3 校验冰箱
 *
 * 执行顺序说明：
 *  本文件在 index.html 中位于引导脚本（末尾内联 IIFE）之前加载。
 *  引导脚本会 (a) 绑定 #btn-prev/#btn-next/#btn-reset；(b) 把 setActiveStep
 *  等方法挂到 SMART_MENU。因此"覆盖 setActiveStep"与"接管按钮"必须延迟到
 *  引导脚本执行之后（setTimeout(0)），否则会被引导脚本覆盖 / 失效。
 *
 * 依赖：
 *  SMART_MENU.store / 各 ui-* 模块 / SMART_MENU.showToast / setActiveStep /
 *  currentStep / backToHero（引导脚本提供）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.app = (function () {
    'use strict';

    var SM = SMART_MENU;
    var TOTAL_STEPS = 5;
    var inited = false;

    /* ============================================================
     *  全局刷新回调：当 store 任一字段变化时刷新对应视图
     *  说明：ui-family / ui-fridge / ui-shopping 已各自订阅 store，
     *       这里统一再刷一遍以保证菜单视图与各视图数据一致（重复渲染幂等无害）。
     * ============================================================ */
    function renderAll() {
        if (SM.uiFamily)   { try { SM.uiFamily.render(); } catch (e) {} }
        if (SM.uiFridge)   { try { SM.uiFridge.render(); } catch (e) {} }
        if (SM.uiMenu)     { try { SM.uiMenu.render(); } catch (e) {} }
        if (SM.uiShopping) { try { SM.uiShopping.render(); } catch (e) {} }
    }

    /* ============================================================
     *  覆盖 SMART_MENU.setActiveStep
     *  保留引导脚本原逻辑，叠加：菜单视图空提示 / 采购视图渲染
     * ============================================================ */
    function overrideSetActiveStep() {
        var orig = SM.setActiveStep;
        if (typeof orig !== 'function') return;

        SM.setActiveStep = function (n) {
            // 先执行原逻辑（同步导航 / 视图 / 底栏）
            orig(n);

            // 修复：引导脚本 updateFooter 更新的是旧 prevBtn 引用（已被克隆替换），
            // 需在新的按钮上同步 disabled 状态
            var newPrev = document.getElementById('btn-prev');
            if (newPrev) newPrev.disabled = (n === 1);

            // 切换到菜单视图（步骤3）：若尚无菜单，提示先在前两步准备数据
            if (n === 3 && SM.store) {
                var menu = SM.store.get('currentMenu');
                if (!menu && SM.showToast) {
                    SM.showToast('请先生成今日菜单', 'info');
                }
            }

            // 切换到采购视图（步骤5）：触发一次渲染，确保与最新清单一致
            if (n === 5 && SM.uiShopping) {
                try { SM.uiShopping.render(); } catch (e) {}
            }
        };
    }

    /* ============================================================
     *  接管底栏按钮（克隆替换以剥离引导脚本监听）
     * ============================================================ */
    function takeoverButtons() {
        var prevBtn = document.getElementById('btn-prev');
        var nextBtn = document.getElementById('btn-next');
        var resetBtn = document.getElementById('btn-reset');

        // 克隆替换：cloneNode 不复制 addEventListener 绑定的监听器，
        // 从而干净剥离引导脚本的 handler，由本模块接管。
        function rebind(btn, handler) {
            if (!btn) return null;
            var fresh = btn.cloneNode(true);
            if (btn.parentNode) btn.parentNode.replaceChild(fresh, btn);
            fresh.addEventListener('click', handler);
            return fresh;
        }

        // 上一步：回到上一个步骤
        rebind(prevBtn, function () {
            var cur = currentStepSafe();
            if (cur > 1 && SM.setActiveStep) SM.setActiveStep(cur - 1);
        });

        // 下一步：增强校验后再前进
        rebind(nextBtn, function () {
            var cur = currentStepSafe();
            if (!SM.store) return;

            // 1 → 2：校验家庭
            if (cur === 1) {
                var family = SM.store.get('family') || [];
                if (!family.length) {
                    if (SM.showToast) SM.showToast('请先添加成员', 'error');
                    return;
                }
            }
            // 2 → 3：校验冰箱
            if (cur === 2) {
                var fridge = SM.store.get('fridge') || [];
                if (!fridge.length) {
                    if (SM.showToast) SM.showToast('请先添加食材', 'error');
                    return;
                }
            }

            if (cur < TOTAL_STEPS) {
                if (SM.setActiveStep) SM.setActiveStep(cur + 1);
            } else {
                if (SM.showToast) SM.showToast('已生成全家适配方案', 'success');
            }
        });

        // 步骤导航按钮：重新绑定以使用被覆盖后的 setActiveStep
        var stepNavItems = document.querySelectorAll('.step-item');
        for (var i = 0; i < stepNavItems.length; i++) {
            (function (item) {
                var fresh = item.cloneNode(true);
                if (item.parentNode) item.parentNode.replaceChild(fresh, item);
                fresh.addEventListener('click', function () {
                    var step = parseInt(fresh.getAttribute('data-step'), 10);
                    if (SM.setActiveStep) SM.setActiveStep(step);
                });
            })(stepNavItems[i]);
        }

        // 重置：清空数据 → 重置适老化 → 重渲染 → 返回 hero
        rebind(resetBtn, function () {
            if (SM.store) SM.store.reset();
            // 重置适老化模式
            if (SM.uiElderly && SM.uiElderly.toggleElderly) {
                try { SM.uiElderly.toggleElderly(false); } catch (e) {}
            }
            // 重新渲染全部视图（store.reset 已触发订阅，但显式刷新保证即时）
            renderAll();
            // 返回开屏 hero
            if (SM.backToHero) {
                SM.backToHero();
            } else if (SM.showToast) {
                SM.showToast('已重置', 'info');
            }
        });
    }

    /* ============ 安全读取当前步骤 ============ */
    function currentStepSafe() {
        if (typeof SM.currentStep === 'function') {
            try { return SM.currentStep(); } catch (e) {}
        }
        var c = document.querySelector('.step-item.is-current');
        return c ? parseInt(c.getAttribute('data-step'), 10) || 1 : 1;
    }

    /* ============================================================
     *  init()
     * ============================================================ */
    function init() {
        if (inited) return;
        inited = true;

        // 1) 加载持久化数据
        if (SM.store && SM.store.load) {
            try { SM.store.load(); } catch (e) { /* 读取失败回退默认 state */ }
        }

        // 2) 调用各 UI 模块 init（幂等）
        callInit('uiFamily');
        callInit('uiFridge');
        callInit('uiMenu');
        callInit('uiCooking');
        callInit('uiShopping');
        callInit('uiElderly');

        // 3) 全局刷新订阅
        if (SM.store && SM.store.subscribe) {
            SM.store.subscribe(function (state) {
                if (!state) return;
                // family 变化 → 刷新家庭（顺带菜单依赖家庭，但不自动重生成）
                if (state.family !== undefined && SM.uiFamily) {
                    try { SM.uiFamily.render(); } catch (e) {}
                }
                // fridge 变化 → 刷新冰箱
                if (state.fridge !== undefined && SM.uiFridge) {
                    try { SM.uiFridge.render(); } catch (e) {}
                }
                // currentMenu 变化 → 刷新菜单
                if (state.currentMenu !== undefined && SM.uiMenu) {
                    try { SM.uiMenu.render(); } catch (e) {}
                }
                // currentShoppingList 变化 → 刷新采购
                if (state.currentShoppingList !== undefined && SM.uiShopping) {
                    try { SM.uiShopping.render(); } catch (e) {}
                }
            });
        }

        // 4) 初始渲染（用加载后的数据刷新各视图）
        renderAll();

        // 5) 覆盖 setActiveStep 与接管按钮：延迟到引导脚本执行之后
        //    （引导脚本为本文件之后的内联 IIFE，同步执行于本 init 之后的事件循环）
        setTimeout(function () {
            overrideSetActiveStep();
            takeoverButtons();
        }, 0);
    }

    /* ============ 安全调用某模块 init ============ */
    function callInit(moduleName) {
        var mod = SM[moduleName];
        if (mod && typeof mod.init === 'function') {
            try { mod.init(); } catch (e) { /* 单模块异常不影响整体 */ }
        }
    }

    /* ============ 对外暴露 ============ */
    return {
        init: init,
        renderAll: renderAll
    };
})();

/* ============ 模块加载后自动初始化 ============
 * 注意：本文件位于引导脚本之前加载，故涉及"覆盖 setActiveStep /
 * 接管底栏按钮"的部分已用 setTimeout(0) 延迟到引导脚本执行之后，
 * 确保覆盖生效且不报错。store.load / 模块 init / 订阅 / 初始渲染
 * 立即执行，保证持久化数据第一时间反映到界面。
 */
SMART_MENU.app.init();
