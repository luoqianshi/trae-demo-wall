/**
 * engine-menu.js — 智能菜单生成引擎
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.engineMenu（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用，无任何网络依赖
 *
 * 职责：
 *  1) generateMemberTags(member) ：依据成员慢病/咀嚼弱/儿童/口味偏好生成自动标签
 *  2) generateMenu(family, fridge, config) ：生成全家适配的三餐菜单方案
 *
 * 算法概览：
 *  - 慢病规则映射 CONDITION_RULES
 *  - 硬约束过滤（过敏原 / 忌口 / 痛风海鲜浓汤）
 *  - 软约束评分（食材匹配 40 + 家庭适配 35 + 临期 15 + 多样 10 + 随机扰动 5）
 *  - 按餐次填充，保证 dishType 多样（主食 / 荤 / 素 / 汤 / 凉菜搭配）
 *  - 适配版本判定（全家通用 / 老人软嫩 / 儿童营养，一道菜可多版本）
 *  - 安全报告 + 营养汇总
 *
 * 返回 MenuPlan：
 *  { generatedAt, meals:{breakfast,lunch,dinner},
 *    safetyReport:{passed,warnings}, nutritionSummary, config, familyTags }
 *
 * 依赖：SMART_MENU.recipes / SMART_MENU.ingredients / SMART_MENU.getIngredientById
 *      （均由 data-recipes.js / data-ingredients.js 提供）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.engineMenu = (function () {
    'use strict';

    /* ============ 常量 ============ */
    var DAY = 24 * 60 * 60 * 1000;  // 一天的毫秒数，用于临期判定

    /* ============ 慢病规则映射 ============
     * 每种慢病对应：盐量上限 / 低GI标识 / 推荐标签 / 需避开的食材类别或名称
     * 用于生成成员标签与硬约束过滤。
     */
    var CONDITION_RULES = {
        '高血压': { maxSalt: 'low', tags: ['低盐', '低脂'] },
        '糖尿病': { lowGI: true, tags: ['低糖', '低脂'] },
        '高血脂': { tags: ['低脂'] },
        '痛风': { avoid: ['seafood', '动物内脏', '浓汤'], tags: ['低嘌呤'] },
        '缺钙': { tags: ['高钙'] }
    };

    /* ============ 成员标签生成 ============
     * 根据慢病 / 咀嚼弱 / 儿童 / 口味偏好，汇总为 autoTags 数组。
     * 这些标签随后用于"家庭适配度"评分：菜谱 tags 命中越多分越高。
     */
    function generateMemberTags(member) {
        var tags = [];
        if (!member) return tags;

        // 1) 慢病 → 注入推荐标签（低盐/低脂/低糖/高钙/低嘌呤 等）
        var conditions = member.conditions || [];
        for (var i = 0; i < conditions.length; i++) {
            var rule = CONDITION_RULES[conditions[i]];
            if (rule && rule.tags) {
                for (var j = 0; j < rule.tags.length; j++) {
                    if (tags.indexOf(rule.tags[j]) === -1) tags.push(rule.tags[j]);
                }
            }
        }

        // 2) 咀嚼弱 → 需软嫩处理
        if (member.chewingWeak && tags.indexOf('软嫩') === -1) {
            tags.push('软嫩');
        }

        // 3) 儿童 → 儿童友好
        if (member.isChild && tags.indexOf('儿童友好') === -1) {
            tags.push('儿童友好');
        }

        // 4) 口味偏好
        if (member.tastePreference === 'mild') {
            if (tags.indexOf('清淡') === -1) tags.push('清淡');
        } else if (member.tastePreference === 'spicy') {
            if (tags.indexOf('开胃') === -1) tags.push('开胃');
        } else if (member.tastePreference === 'sweet') {
            if (tags.indexOf('微甜') === -1) tags.push('微甜');
        }

        return tags;
    }

    /* ============ 家庭级标签聚合 ============ */
    // 汇总全家所有成员的 autoTags，去重后返回（用于适配度评分分母）
    function collectFamilyTags(family) {
        var tags = [];
        for (var i = 0; i < family.length; i++) {
            var mt = generateMemberTags(family[i]);
            for (var j = 0; j < mt.length; j++) {
                if (tags.indexOf(mt[j]) === -1) tags.push(mt[j]);
            }
        }
        return tags;
    }

    /* ============ 家庭慢病汇总 ============ */
    // 收集全家出现过的所有慢病（用于痛风等家庭级过滤）
    function collectConditions(family) {
        var conds = [];
        for (var i = 0; i < family.length; i++) {
            var cl = family[i].conditions || [];
            for (var j = 0; j < cl.length; j++) {
                if (conds.indexOf(cl[j]) === -1) conds.push(cl[j]);
            }
        }
        return conds;
    }

    /* ============ 食材与"禁忌词"匹配 ============
     * dislikes / allergies 里的词可能是：
     *   - 食材分类（如 'seafood' 'meat'）
     *   - 食材名/别名（如 '香菜' '胡萝卜'）
     *   - 食材 id 派生词（如 'carrot' → 匹配 'i_carrot'）
     * 这里统一判定某个食材是否命中某个禁忌词。
     */
    function matchesForbiddenTerm(ingredient, term) {
        if (!ingredient || !term) return false;
        var t = String(term).trim();
        if (!t) return false;
        // 分类匹配（'seafood' / 'meat' / 'vegetable' ...）
        if (ingredient.category === t) return true;
        // id 派生匹配（'carrot' → 'i_carrot'）
        if (ingredient.id === 'i_' + t) return true;
        // 名称匹配
        if (ingredient.name === t) return true;
        // 别名匹配
        var al = ingredient.aliases || [];
        for (var i = 0; i < al.length; i++) {
            if (al[i] === t) return true;
        }
        return false;
    }

    /* ============ 菜谱是否含禁忌食材 ============
     * terms 为禁忌词数组，命中任一即返回 true。
     * 特殊处理：'浓汤' 不指具体食材，而指汤类菜品（dishType==='汤'），
     *          用于痛风家庭排除浓汤类。
     */
    function recipeContainsForbidden(recipe, terms) {
        if (!terms || !terms.length) return false;
        var ings = recipe.ingredients || [];
        for (var i = 0; i < ings.length; i++) {
            var ingredient = SMART_MENU.getIngredientById(ings[i].id);
            for (var j = 0; j < terms.length; j++) {
                var term = terms[j];
                // '浓汤' → 匹配汤类菜品
                if (term === '浓汤') {
                    if (recipe.dishType === '汤') return true;
                    continue;
                }
                if (matchesForbiddenTerm(ingredient, term)) return true;
            }
        }
        return false;
    }

    /* ============ 硬约束过滤 ============
     * 1) 排除含任意成员过敏原的菜谱
     * 2) 排除含成员 dislikes 食材的菜谱（除非菜 suitableFor 含 child 且成员是 child，
     *    则保留但标注"已为XX调整"）
     * 3) 痛风家庭排除海鲜 / 浓汤类
     * 返回 { recipes:[{recipe, adjustments[]}], warnings[] }
     */
    function hardFilter(recipes, family) {
        var warnings = [];
        var familyConditions = collectConditions(family);
        var hasGout = familyConditions.indexOf('痛风') > -1;
        var goutAvoid = hasGout ? (CONDITION_RULES['痛风'].avoid || []) : [];

        var passed = [];

        for (var r = 0; r < recipes.length; r++) {
            var recipe = recipes[r];
            var excluded = false;
            var adjustments = [];

            /* 1) 过敏原硬过滤（任一成员过敏即排除） */
            for (var i = 0; i < family.length; i++) {
                var m = family[i];
                var allergies = m.allergies || [];
                if (allergies.length && recipeContainsForbidden(recipe, allergies)) {
                    excluded = true;
                    warnings.push('过敏过滤："' + recipe.name + '"含 ' + (m.nickname || m.name) +
                        ' 的过敏原(' + allergies.join('/') + ')，已排除');
                    break;
                }
            }
            if (excluded) continue;

            /* 3) 痛风家庭排除海鲜/浓汤类 */
            if (goutAvoid.length && recipeContainsForbidden(recipe, goutAvoid)) {
                warnings.push('痛风忌口："' + recipe.name + '"属海鲜/浓汤类，已排除');
                continue;
            }

            /* 2) dislikes 处理 */
            for (var d = 0; d < family.length; d++) {
                var mem = family[d];
                var dl = mem.dislikes || [];
                if (!dl.length) continue;
                if (recipeContainsForbidden(recipe, dl)) {
                    var isChildRecipe = (recipe.suitableFor || []).indexOf('child') > -1;
                    if (isChildRecipe && mem.isChild) {
                        // 儿童忌口但菜谱可做儿童版 → 保留并标注调整
                        adjustments.push('已为' + (mem.nickname || mem.name) + '调整');
                    } else {
                        excluded = true;
                        warnings.push('忌口过滤："' + recipe.name + '"含 ' + (mem.nickname || mem.name) +
                            ' 不吃的食材(' + dl.join('/') + ')，已排除');
                        break;
                    }
                }
            }

            if (excluded) continue;

            passed.push({ recipe: recipe, adjustments: adjustments });
        }

        return { recipes: passed, warnings: warnings };
    }

    /* ============ 冰箱库存映射 ============
     * 将 fridge 数组按 ingredientId 聚合，便于快速查询库存与临期。
     * 结构：{ ingredientId: { amount, items:[] } }
     */
    function buildFridgeMap(fridge) {
        var map = {};
        for (var i = 0; i < fridge.length; i++) {
            var item = fridge[i];
            var key = item.ingredientId;
            if (!map[key]) map[key] = { amount: 0, items: [] };
            map[key].amount += Number(item.amount) || 0;
            map[key].items.push(item);
        }
        return map;
    }

    /* ============ 临期判定 ============
     * addedAt 距今超过 (shelfLifeDays - 2) 天即视为临期，优先使用。
     */
    function isExpiring(item, ingredient) {
        if (!ingredient || !item.addedAt) return false;
        var ageDays = (Date.now() - item.addedAt) / DAY;
        return ageDays > (ingredient.shelfLifeDays - 2);
    }

    /* ============ 已有食材计数 ============ */
    function countMatched(recipe, fridgeMap) {
        var ings = recipe.ingredients || [];
        var matched = 0;
        for (var i = 0; i < ings.length; i++) {
            var entry = fridgeMap[ings[i].id];
            if (entry && entry.amount > 0) matched++;
        }
        return matched;
    }

    /* ============ 是否含临期食材 ============ */
    function hasExpiringIngredient(recipe, fridgeMap) {
        var ings = recipe.ingredients || [];
        for (var i = 0; i < ings.length; i++) {
            var entry = fridgeMap[ings[i].id];
            if (!entry) continue;
            var ingredient = SMART_MENU.getIngredientById(ings[i].id);
            if (!ingredient) continue;
            for (var j = 0; j < entry.items.length; j++) {
                if (isExpiring(entry.items[j], ingredient)) return true;
            }
        }
        return false;
    }

    /* ============ 菜谱标签命中家庭标签数 ============ */
    function countHitTags(recipe, familyTags) {
        var tags = recipe.tags || [];
        var hit = 0;
        for (var i = 0; i < tags.length; i++) {
            if (familyTags.indexOf(tags[i]) > -1) hit++;
        }
        return hit;
    }

    /* ============ 软约束基础评分（不含多样性，多样性在选择时动态加） ============
     * 食材匹配度 = matched / total × 40
     * 家庭适配度 = hitTags / familyTags.length × 35
     * 临期优先   = 含临期食材 +15
     * 随机扰动   = Math.random() × 5（支持"换一批"）
     */
    function baseScore(recipe, fridgeMap, familyTags) {
        var total = (recipe.ingredients || []).length;
        var matched = countMatched(recipe, fridgeMap);
        var matchScore = total > 0 ? (matched / total) * 40 : 0;

        var familyTagCount = familyTags.length;
        var hitTags = countHitTags(recipe, familyTags);
        var adaptScore = familyTagCount > 0 ? (hitTags / familyTagCount) * 35 : 0;

        var expiringBonus = hasExpiringIngredient(recipe, fridgeMap) ? 15 : 0;

        var randomBonus = Math.random() * 5;

        return {
            score: matchScore + adaptScore + expiringBonus + randomBonus,
            matched: matched,
            total: total
        };
    }

    /* ============ 多样性贪心选择 ============
     * 每轮在剩余候选中选"基础分 + 多样性加成"最高者：
     *   若其 dishType 与已选不重复 +10，否则 +0。
     * 这样能尽量凑出 主食+荤+素+汤 搭配。
     */
    function selectDishes(candidates, dishCount) {
        var remaining = candidates.slice();
        var selected = [];
        var usedDishTypes = [];

        while (selected.length < dishCount && remaining.length > 0) {
            var bestIdx = -1;
            var bestScore = -Infinity;
            for (var i = 0; i < remaining.length; i++) {
                var cand = remaining[i];
                var diversity = (usedDishTypes.indexOf(cand.recipe.dishType) === -1) ? 10 : 0;
                var score = cand.baseScore + diversity;
                if (score > bestScore) {
                    bestScore = score;
                    bestIdx = i;
                }
            }
            if (bestIdx === -1) break;
            var picked = remaining[bestIdx];
            selected.push(picked);
            usedDishTypes.push(picked.recipe.dishType);
            remaining.splice(bestIdx, 1);
        }

        return selected;
    }

    /* ============ 适配版本判定 ============
     * - 家庭含 chewingWeak 成员 且 菜谱有 adaptations.elderly → 'elderly'(老人软嫩款)
     * - 家庭含 isChild 成员 且 菜谱有 adaptations.child   → 'child'(儿童营养款)
     * - 菜本身 suitableFor 含 'family'                    → 'family'(全家通用款)
     * 一道菜可同时为多版本。
     */
    function determineVariants(recipe, family) {
        var variants = [];
        var hasChewingWeak = false;
        var hasChild = false;
        for (var i = 0; i < family.length; i++) {
            if (family[i].chewingWeak) hasChewingWeak = true;
            if (family[i].isChild) hasChild = true;
        }
        if ((recipe.suitableFor || []).indexOf('family') > -1) {
            variants.push('family');
        }
        if (hasChewingWeak && recipe.adaptations && recipe.adaptations.elderly) {
            variants.push('elderly');
        }
        if (hasChild && recipe.adaptations && recipe.adaptations.child) {
            variants.push('child');
        }
        return variants;
    }

    /* ============ 营养数值四舍五入 ============ */
    function roundNutrition(n) {
        return {
            calories: Math.round(Number(n.calories) || 0),
            protein: Math.round((Number(n.protein) || 0) * 10) / 10,
            carbs: Math.round((Number(n.carbs) || 0) * 10) / 10,
            fat: Math.round((Number(n.fat) || 0) * 10) / 10
        };
    }

    /* ============ 单餐营养累加 ============ */
    function accumulateNutrition(dishes) {
        var sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        for (var i = 0; i < dishes.length; i++) {
            var n = (dishes[i].recipe && dishes[i].recipe.nutrition) || {};
            sum.calories += Number(n.calories) || 0;
            sum.protein += Number(n.protein) || 0;
            sum.carbs += Number(n.carbs) || 0;
            sum.fat += Number(n.fat) || 0;
        }
        return roundNutrition(sum);
    }

    /* ============================================================
     *  主函数：generateMenu(family, fridge, config)
     * ============================================================ */
    function generateMenu(family, fridge, config) {
        config = config || {};
        var mealType = config.mealType || 'all';            // 'all' / 'breakfast' / 'lunch' / 'dinner'
        var dishesPerMeal = config.dishesPerMeal || 2;      // 每餐菜品数
        var preferFridge = config.preferFridge !== false;   // 是否优先用冰箱库存（评分已体现）

        // 默认从 store 取数据（允许调用方省略参数）
        if (!family && SMART_MENU.store) family = SMART_MENU.store.get('family');
        if (!fridge && SMART_MENU.store) fridge = SMART_MENU.store.get('fridge');
        family = family || [];
        fridge = fridge || [];

        var fridgeMap = buildFridgeMap(fridge);
        var familyTags = collectFamilyTags(family);
        var recipes = SMART_MENU.recipes || [];

        /* 1) 硬约束过滤 */
        var filtered = hardFilter(recipes, family);
        var warnings = filtered.warnings.slice();

        /* 2) 确定要生成的餐次 */
        var mealKeys = (mealType === 'all')
            ? ['breakfast', 'lunch', 'dinner']
            : [mealType];

        var meals = { breakfast: [], lunch: [], dinner: [] };
        var nutritionSummary = {
            breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            total: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        };

        /* 3) 逐餐次：评分 → 排序 → 多样性选择 → 适配版本 */
        for (var mi = 0; mi < mealKeys.length; mi++) {
            var meal = mealKeys[mi];
            var candidates = [];

            for (var ci = 0; ci < filtered.recipes.length; ci++) {
                var fr = filtered.recipes[ci];
                var recipe = fr.recipe;
                // 仅取适用该餐次的菜谱
                if ((recipe.mealType || []).indexOf(meal) === -1) continue;

                var bs = baseScore(recipe, fridgeMap, familyTags);
                candidates.push({
                    recipe: recipe,
                    baseScore: bs.score,
                    matched: bs.matched,
                    total: bs.total,
                    adjustments: fr.adjustments
                });
            }

            // 按基础分降序（多样性在选择阶段动态加成）
            candidates.sort(function (a, b) { return b.baseScore - a.baseScore; });

            var chosen = selectDishes(candidates, dishesPerMeal);

            // 组装菜品条目
            meals[meal] = [];
            for (var k = 0; k < chosen.length; k++) {
                var c = chosen[k];
                meals[meal].push({
                    recipeId: c.recipe.id,
                    recipe: c.recipe,
                    matchScore: Math.round(c.baseScore * 10) / 10,
                    matched: c.matched,
                    total: c.total,
                    variants: determineVariants(c.recipe, family),
                    adjustments: c.adjustments
                });
            }

            // 该餐营养汇总
            nutritionSummary[meal] = accumulateNutrition(meals[meal]);
        }

        /* 4) 营养总计 */
        for (var ti = 0; ti < mealKeys.length; ti++) {
            var mk = mealKeys[ti];
            nutritionSummary.total.calories += nutritionSummary[mk].calories;
            nutritionSummary.total.protein += nutritionSummary[mk].protein;
            nutritionSummary.total.carbs += nutritionSummary[mk].carbs;
            nutritionSummary.total.fat += nutritionSummary[mk].fat;
        }
        nutritionSummary.total = roundNutrition(nutritionSummary.total);

        /* 5) 安全报告：已过滤所有过敏/禁忌项，passed=true，warnings 记录处理详情 */
        var safetyReport = {
            passed: true,
            warnings: warnings
        };

        /* 6) 返回完整 MenuPlan */
        return {
            generatedAt: Date.now(),
            meals: meals,
            safetyReport: safetyReport,
            nutritionSummary: nutritionSummary,
            config: {
                mealType: mealType,
                dishesPerMeal: dishesPerMeal,
                preferFridge: preferFridge
            },
            familyTags: familyTags
        };
    }

    /* ============ 对外暴露 ============ */
    return {
        generateMenu: generateMenu,
        generateMemberTags: generateMemberTags,
        // 暴露规则表，便于 UI / 测试查阅
        CONDITION_RULES: CONDITION_RULES
    };
})();
