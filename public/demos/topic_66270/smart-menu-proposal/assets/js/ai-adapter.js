/**
 * ai-adapter.js — AI 能力适配层（本地优先，可降级）
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.aiAdapter（全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用；无网络时全部降级到本地模板/模拟
 *
 * 暴露能力：
 *  - mode               ：当前模式（'local' / 'remote'），读取 localStorage 的 aiMode
 *  - setMode(mode)      ：切换 local/remote 并持久化
 *  - getNutritionComment(recipe, family)
 *      返回营养师点评文本。local 用模板生成；remote 留 fetch 接口，try-catch 降级
 *  - recognizeIngredients(imageData)
 *      拍照识别。local 从 SMART_MENU.sample.sampleFridgePhotos 随机模拟；
 *      remote 留视觉 API 接口，try-catch 降级
 *
 * 设计原则：
 *  1) 本地优先：所有能力在离线状态下均可用，不因网络缺失而报错
 *  2) 留接口：remote 分支预留 fetch 调用位置与端点配置，实际项目接入即可启用
 *  3) try-catch 降级：任何 remote 异常都静默回退到本地模板/模拟
 *
 * 依赖：SMART_MENU.sample.sampleFridgePhotos（data-sample.js 提供）
 *      SMART_MENU.store（store.js 提供，读取/同步 aiMode）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.aiAdapter = (function () {
    'use strict';

    /* ============ 常量 ============ */
    var STORAGE_KEY = 'aiMode';     // localStorage 中存储 AI 模式的键名

    /* ============ remote 端点配置（留接口，默认为空 → 自动降级本地） ============
     * 实际项目中可在外部设置：
     *   SMART_MENU.aiAdapter.remoteConfig.nutritionEndpoint = 'https://.../llm';
     *   SMART_MENU.aiAdapter.remoteConfig.visionEndpoint    = 'https://.../vision';
     */
    var remoteConfig = {
        nutritionEndpoint: '',
        visionEndpoint: '',
        apiKey: ''
    };

    /* ============ 模式读写 ============ */
    // 读取当前模式：localStorage 优先，store 次之，默认 'local'
    function getMode() {
        try {
            var m = localStorage.getItem(STORAGE_KEY);
            if (m === 'local' || m === 'remote') return m;
        } catch (e) { /* localStorage 不可用时忽略 */ }

        // 兜底：从 store 读取（store 内部亦持久化 aiMode）
        try {
            if (SMART_MENU.store) {
                var sm = SMART_MENU.store.get('aiMode');
                if (sm === 'local' || sm === 'remote') return sm;
                // 兼容 store 早期使用的 'cloud' 值
                if (sm === 'cloud') return 'remote';
            }
        } catch (e) { /* 忽略 */ }

        return 'local';
    }

    // 切换模式并持久化（同时写入 localStorage 与 store）
    function setMode(mode) {
        if (mode !== 'local' && mode !== 'remote') mode = 'local';
        try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) { /* 忽略 */ }
        try {
            if (SMART_MENU.store) SMART_MENU.store.set('aiMode', mode);
        } catch (e) { /* 忽略 */ }
        return mode;
    }

    /* ============================================================
     *  能力一：getNutritionComment(recipe, family)
     *  返回营养师点评文本（字符串）
     * ============================================================ */

    // 收集家庭出现过的所有慢病
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

    // 本地模板生成点评（核心逻辑，无网络依赖）
    function getNutritionCommentLocal(recipe, family) {
        family = family || [];
        var lines = [];

        // 标题
        lines.push('【营养师点评】' + (recipe.emoji || '') + ' ' + recipe.name);

        // 基础营养概算
        var n = recipe.nutrition || {};
        lines.push('本菜每份约 ' + (n.calories || 0) + ' 千卡，' +
            '蛋白质 ' + (n.protein || 0) + 'g、碳水 ' + (n.carbs || 0) + 'g、脂肪 ' + (n.fat || 0) + 'g。');

        // 菜谱标签 → 对应营养解读
        var tagComments = {
            '低盐': '低盐烹饪，适合需要控盐的家庭成员。',
            '低脂': '脂肪含量较低，有助于控制血脂与体重。',
            '低糖': '含糖量低，适合控糖人群。',
            '低嘌呤': '嘌呤含量低，痛风人群可放心食用。',
            '高蛋白': '富含优质蛋白，有助于肌肉合成与免疫。',
            '高钙': '钙含量丰富，有益骨骼与牙齿健康。',
            '高纤维': '膳食纤维丰富，促进肠道蠕动。',
            '易消化': '质地软嫩易消化，适合老人与儿童。',
            '软嫩易做': '口感软嫩，咀嚼弱人群也易进食。',
            '养胃': '温和养胃，适合肠胃敏感者。',
            '补铁': '富含铁元素，有助于预防贫血。',
            '补钙': '补钙佳品，适合成长期与缺钙人群。',
            '清淡': '口味清淡，适合需要清淡饮食的家庭。',
            '儿童友好': '适合儿童食用，营养均衡。',
            '老人友好': '适合老人食用，软嫩易消化。'
        };
        var tags = recipe.tags || [];
        for (var i = 0; i < tags.length; i++) {
            if (tagComments[tags[i]]) lines.push(tagComments[tags[i]]);
        }

        // 家庭慢病 → 个性化建议
        var conditions = collectConditions(family);
        if (conditions.indexOf('高血压') > -1) {
            lines.push('高血压提醒：建议出锅前再放盐，每人每日盐摄入控制在 5g 以内。');
        }
        if (conditions.indexOf('糖尿病') > -1) {
            lines.push('糖尿病提醒：注意搭配主食总量，避免餐后血糖骤升；先吃菜后吃主食。');
        }
        if (conditions.indexOf('高血脂') > -1) {
            lines.push('高血脂提醒：建议少油烹饪，可用蒸煮替代煎炒，控制每日脂肪摄入。');
        }
        if (conditions.indexOf('痛风') > -1) {
            lines.push('痛风提醒：注意食材嘌呤含量，避免浓汤与海鲜、动物内脏。');
        }
        if (conditions.indexOf('缺钙') > -1) {
            lines.push('缺钙提醒：建议搭配牛奶或豆制品同食，促进钙吸收。');
        }

        // 适老适配建议
        var hasChewingWeak = false;
        var hasChild = false;
        for (var c = 0; c < family.length; c++) {
            if (family[c].chewingWeak) hasChewingWeak = true;
            if (family[c].isChild) hasChild = true;
        }
        if (hasChewingWeak && recipe.adaptations && recipe.adaptations.elderly) {
            lines.push('适老建议：' + recipe.adaptations.elderly.softTip);
        }
        if (hasChild && recipe.adaptations && recipe.adaptations.child) {
            var ch = recipe.adaptations.child;
            if (ch.antiChoke) lines.push('儿童安全：' + ch.antiChoke);
            if (ch.nutrition) lines.push('儿童营养：' + ch.nutrition);
        }

        return lines.join('\n');
    }

    // remote 模式调用（留接口）：实际项目中替换为真实 LLM fetch
    // 因 fetch 为异步且需网络，此处用 try-catch 包裹同步占位逻辑，
    // 任何异常或未配置端点都降级到本地模板。
    function getNutritionCommentRemote(recipe, family) {
        try {
            // —— 留接口：真实 LLM 调用示例（需异步，此处仅作占位）——
            // if (remoteConfig.nutritionEndpoint && remoteConfig.apiKey) {
            //     return fetch(remoteConfig.nutritionEndpoint, {
            //         method: 'POST',
            //         headers: { 'Authorization': 'Bearer ' + remoteConfig.apiKey,
            //                    'Content-Type': 'application/json' },
            //         body: JSON.stringify({ recipe: recipe, family: family })
            //     }).then(function (r) { return r.text(); });
            // }
            // 未配置端点 → 抛出以触发降级
            if (!remoteConfig.nutritionEndpoint) {
                throw new Error('remote endpoint not configured');
            }
            // 端点已配置但同步无法完成 fetch → 降级
            throw new Error('sync remote unavailable');
        } catch (e) {
            // 降级到本地模板
            return getNutritionCommentLocal(recipe, family);
        }
    }

    // 对外入口：按当前模式分发
    function getNutritionComment(recipe, family) {
        recipe = recipe || { name: '未知菜品', tags: [], nutrition: {} };
        family = family || [];

        if (getMode() === 'remote') {
            return getNutritionCommentRemote(recipe, family);
        }
        return getNutritionCommentLocal(recipe, family);
    }

    /* ============================================================
     *  能力二：recognizeIngredients(imageData)
     *  拍照识别冰箱食材，返回识别结果对象
     * ============================================================ */

    // 本地模拟：从 sampleFridgePhotos 随机选一张，返回其食材列表
    function recognizeIngredientsLocal(imageData) {
        var photos = (SMART_MENU.sample && SMART_MENU.sample.sampleFridgePhotos) || [];
        if (!photos.length) {
            return {
                success: false,
                source: 'local',
                label: '',
                ingredients: [],
                message: '暂无模拟数据，无法识别'
            };
        }
        var pick = photos[Math.floor(Math.random() * photos.length)];

        // 将食材 id 解析为带名称的明细，便于 UI 直接展示
        var details = [];
        var ids = pick.ingredients || [];
        for (var i = 0; i < ids.length; i++) {
            var ing = SMART_MENU.getIngredientById(ids[i]);
            if (ing) {
                details.push({
                    ingredientId: ing.id,
                    name: ing.name,
                    emoji: ing.emoji,
                    category: ing.category,
                    unit: ing.unit
                });
            } else {
                details.push({ ingredientId: ids[i], name: ids[i], emoji: '', category: '', unit: '' });
            }
        }

        return {
            success: true,
            source: 'local',
            label: pick.label || '',
            ingredients: ids.slice(),          // 食材 id 列表（原始）
            details: details,                 // 带名称的明细（便于展示）
            message: '（本地模拟）识别到 ' + ids.length + ' 种食材'
        };
    }

    // remote 模式调用（留接口）：实际项目中替换为真实视觉 API fetch
    function recognizeIngredientsRemote(imageData) {
        try {
            // —— 留接口：真实视觉 API 调用示例（需异步，此处仅作占位）——
            // if (remoteConfig.visionEndpoint && remoteConfig.apiKey && imageData) {
            //     return fetch(remoteConfig.visionEndpoint, { ... }).then(...);
            // }
            if (!remoteConfig.visionEndpoint) {
                throw new Error('vision endpoint not configured');
            }
            throw new Error('sync remote unavailable');
        } catch (e) {
            // 降级到本地模拟
            return recognizeIngredientsLocal(imageData);
        }
    }

    // 对外入口：按当前模式分发
    function recognizeIngredients(imageData) {
        if (getMode() === 'remote') {
            return recognizeIngredientsRemote(imageData);
        }
        return recognizeIngredientsLocal(imageData);
    }

    /* ============ 组装对外 API ============ */
    var api = {
        setMode: setMode,
        getNutritionComment: getNutritionComment,
        recognizeIngredients: recognizeIngredients,
        remoteConfig: remoteConfig
    };

    // mode 作为动态属性：每次读取都反映最新的 localStorage 值
    Object.defineProperty(api, 'mode', {
        get: getMode,
        enumerable: true,
        configurable: true
    });

    return api;
})();
