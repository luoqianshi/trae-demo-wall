/**
 * engine-shopping.js — 智能采购清单引擎
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.engineShopping（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用，无任何网络依赖
 *
 * 职责：
 *  generateShoppingList(menuPlan, fridge, familyOverride)
 *  依据菜单方案与冰箱库存，计算食材缺口并生成采购清单。
 *
 * 算法概览：
 *  1) 汇总菜单所有菜品食材需求量（遍历 menuPlan.meals 每道菜的 recipe.ingredients）
 *  2) 按家庭食量系数（small 0.7 / medium 1.0 / large 1.3）调整需求量
 *  3) 减去冰箱库存（同食材按 id 匹配，amount 相减）
 *  4) 缺口 > 0 入清单，含名称/emoji/分类/需购量/单价/小计
 *  5) 按 category 分组并算总价
 *  6) 检测临期未用食材（在 fridge 中但未被菜单使用的临期食材），返回提示
 *
 * 返回：
 *  { items[], totalEstimated, categoryGroups[], expiringUnused[] }
 *
 * 依赖：SMART_MENU.getIngredientById（data-ingredients.js 提供）
 *      SMART_MENU.store.get('family')（store.js 提供，用于读取家庭食量）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.engineShopping = (function () {
    'use strict';

    /* ============ 常量 ============ */
    var DAY = 24 * 60 * 60 * 1000;  // 一天的毫秒数

    // 食量系数：每位成员的 appetite 对应一个分量倍数
    var APPETITE_COEFF = {
        small: 0.7,
        medium: 1.0,
        large: 1.3
    };

    // 菜谱默认份数基准：假设每道菜谱用量为"4 个标准（中等食量）人份"
    // 实际需求量 = 菜谱用量 × (家庭总食量系数 / STANDARD_SERVINGS)
    var STANDARD_SERVINGS = 4;

    /* ============ 数值四舍五入（保留两位小数） ============ */
    function round2(n) {
        return Math.round((Number(n) || 0) * 100) / 100;
    }

    /* ============ 临期判定 ============
     * addedAt 距今超过 (shelfLifeDays - 2) 天即视为临期。
     */
    function isExpiring(item, ingredient) {
        if (!ingredient || !item.addedAt) return false;
        var ageDays = (Date.now() - item.addedAt) / DAY;
        return ageDays > (ingredient.shelfLifeDays - 2);
    }

    /* ============ 读取家庭食量总系数 ============
     * familyOverride 优先；否则从 store 读取。
     */
    function getFamilyCoefficient(familyOverride) {
        var family = familyOverride;
        if (!family && SMART_MENU.store) {
            try { family = SMART_MENU.store.get('family'); } catch (e) { family = []; }
        }
        family = family || [];

        var coeff = 0;
        for (var i = 0; i < family.length; i++) {
            var ap = family[i].appetite;
            coeff += (APPETITE_COEFF[ap] || 1.0);
        }
        return { coeff: coeff, count: family.length };
    }

    /* ============ 汇总菜单食材需求量 ============
     * 遍历 menuPlan.meals 每道菜的 recipe.ingredients，按 ingredientId 累加。
     * 同时记录被菜单使用到的食材 id 集合（用于临期未用检测）。
     */
    function aggregateRequirements(menuPlan) {
        var reqs = {};            // ingredientId -> 原始需求量（未乘系数）
        var usedIds = {};          // ingredientId -> true（被菜单使用过）
        var meals = (menuPlan && menuPlan.meals) || {};
        var mealKeys = ['breakfast', 'lunch', 'dinner'];

        for (var k = 0; k < mealKeys.length; k++) {
            var dishes = meals[mealKeys[k]] || [];
            for (var d = 0; d < dishes.length; d++) {
                var recipe = dishes[d].recipe;
                if (!recipe || !recipe.ingredients) continue;
                for (var i = 0; i < recipe.ingredients.length; i++) {
                    var ing = recipe.ingredients[i];
                    var id = ing.id;
                    if (!reqs[id]) reqs[id] = 0;
                    reqs[id] += Number(ing.amount) || 0;
                    usedIds[id] = true;
                }
            }
        }

        return { reqs: reqs, usedIds: usedIds };
    }

    /* ============ 构建冰箱库存映射（按 ingredientId 聚合总量） ============ */
    function buildFridgeMap(fridge) {
        var map = {};
        for (var i = 0; i < fridge.length; i++) {
            var item = fridge[i];
            var key = item.ingredientId;
            if (!map[key]) map[key] = 0;
            map[key] += Number(item.amount) || 0;
        }
        return map;
    }

    /* ============================================================
     *  主函数：generateShoppingList(menuPlan, fridge, familyOverride)
     *  - menuPlan: engineMenu.generateMenu() 的返回值
     *  - fridge:   冰箱食材数组（与 store.get('fridge') 同构）
     *  - familyOverride: 可选，传入家庭数组以覆盖 store 默认值
     * ============================================================ */
    function generateShoppingList(menuPlan, fridge, familyOverride) {
        menuPlan = menuPlan || { meals: {} };
        fridge = fridge || (SMART_MENU.store ? SMART_MENU.store.get('fridge') : []) || [];
        fridge = fridge || [];

        /* 1) 汇总需求量 */
        var agg = aggregateRequirements(menuPlan);
        var reqs = agg.reqs;
        var usedIds = agg.usedIds;

        /* 2) 食量系数调整 */
        var fc = getFamilyCoefficient(familyOverride);
        var multiplier = fc.count > 0 ? (fc.coeff / STANDARD_SERVINGS) : 1.0;
        if (!isFinite(multiplier) || multiplier <= 0) multiplier = 1.0;

        /* 3) 冰箱库存映射 */
        var fridgeMap = buildFridgeMap(fridge);

        /* 4) 计算采购项：缺口 = 需求量 × 系数 - 库存 */
        var items = [];
        var reqIds = Object.keys(reqs);
        for (var i = 0; i < reqIds.length; i++) {
            var ingId = reqIds[i];
            var ingredient = SMART_MENU.getIngredientById(ingId);
            if (!ingredient) continue;  // 未知食材跳过

            var needAmount = reqs[ingId] * multiplier;
            var haveAmount = fridgeMap[ingId] || 0;
            var gap = needAmount - haveAmount;

            if (gap > 0) {
                var buyAmount = round2(gap);
                var subtotal = round2(buyAmount * (ingredient.pricePerUnit || 0));
                items.push({
                    ingredientId: ingId,
                    name: ingredient.name,
                    emoji: ingredient.emoji,
                    category: ingredient.category,
                    needAmount: round2(needAmount),
                    haveAmount: round2(haveAmount),
                    buyAmount: buyAmount,
                    unit: ingredient.unit,
                    price: ingredient.pricePerUnit,
                    subtotal: subtotal,
                    purchased: false
                });
            }
        }

        /* 5) 按 category 分组并算小计 */
        var groupMap = {};
        for (var g = 0; g < items.length; g++) {
            var cat = items[g].category;
            if (!groupMap[cat]) groupMap[cat] = [];
            groupMap[cat].push(items[g]);
        }
        var categoryGroups = [];
        var groupKeys = Object.keys(groupMap);
        for (var gi = 0; gi < groupKeys.length; gi++) {
            var gk = groupKeys[gi];
            var gItems = groupMap[gk];
            var gSubtotal = 0;
            for (var s = 0; s < gItems.length; s++) gSubtotal += gItems[s].subtotal;
            categoryGroups.push({
                category: gk,
                items: gItems,
                count: gItems.length,
                subtotal: round2(gSubtotal)
            });
        }

        /* 总价 */
        var totalEstimated = 0;
        for (var t = 0; t < items.length; t++) totalEstimated += items[t].subtotal;
        totalEstimated = round2(totalEstimated);

        /* 6) 检测临期未用食材（在 fridge 中但未被菜单使用的临期食材） */
        var expiringUnused = [];
        for (var f = 0; f < fridge.length; f++) {
            var fItem = fridge[f];
            // 被菜单使用过的食材不提示
            if (usedIds[fItem.ingredientId]) continue;

            var fIng = SMART_MENU.getIngredientById(fItem.ingredientId);
            if (!fIng) continue;
            if (!isExpiring(fItem, fIng)) continue;

            var daysLeft = Math.round(fIng.shelfLifeDays - (Date.now() - fItem.addedAt) / DAY);
            expiringUnused.push({
                fridgeItemId: fItem.id,
                ingredientId: fItem.ingredientId,
                name: fIng.name,
                emoji: fIng.emoji,
                amount: fItem.amount,
                unit: fIng.unit,
                addedAt: fItem.addedAt,
                shelfLifeDays: fIng.shelfLifeDays,
                daysLeft: Math.max(0, daysLeft),
                note: fItem.note || ''
            });
        }

        return {
            items: items,
            totalEstimated: totalEstimated,
            categoryGroups: categoryGroups,
            expiringUnused: expiringUnused
        };
    }

    /* ============ 对外暴露 ============ */
    return {
        generateShoppingList: generateShoppingList,
        // 暴露常量便于 UI / 测试查阅
        APPETITE_COEFF: APPETITE_COEFF,
        STANDARD_SERVINGS: STANDARD_SERVINGS
    };
})();
