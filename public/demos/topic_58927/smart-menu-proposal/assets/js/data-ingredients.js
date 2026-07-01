/**
 * data-ingredients.js — 食材数据库
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.ingredients = [...] （全局数组，非 ES Module）
 * 适用环境：file:// 直接打开可用
 *
 * 字段说明：
 *  id            食材唯一标识（i_ 前缀）
 *  name          常用名（显示用）
 *  aliases       别名数组（用于文字/语音录入时的模糊匹配，如"番茄"="西红柿"）
 *  category      分类：vegetable(蔬菜) / meat(肉禽) / seafood(水产)
 *                / eggdairy(蛋奶) / soy(豆制品) / staple(主食)
 *                / condiment(调味) / fruit(水果)
 *  emoji         展示图标
 *  shelfLifeDays 常温/冷藏保质期（天），用于临期提醒
 *  unit          计量单位（个/斤/块/把/根/袋/克/瓶 等）
 *  pricePerUnit  参考单价（元），依据国内菜市场零售均价
 *  nutritionTags 营养标签数组（用于菜单营养筛选/标注）
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

SMART_MENU.ingredients = [
    /* ===================== 蔬菜 vegetable ===================== */
    {
        id: 'i_tomato', name: '番茄', aliases: ['西红柿', '洋柿子'],
        category: 'vegetable', emoji: '🍅', shelfLifeDays: 7, unit: '个',
        pricePerUnit: 3.5, nutritionTags: ['维C', '低热量', '番茄红素']
    },
    {
        id: 'i_potato', name: '土豆', aliases: ['马铃薯', '洋芋'],
        category: 'vegetable', emoji: '🥔', shelfLifeDays: 30, unit: '个',
        pricePerUnit: 2.0, nutritionTags: ['碳水', '钾', '低脂']
    },
    {
        id: 'i_carrot', name: '胡萝卜', aliases: ['红萝卜'],
        category: 'vegetable', emoji: '🥕', shelfLifeDays: 30, unit: '根',
        pricePerUnit: 1.5, nutritionTags: ['维A', '胡萝卜素', '护眼']
    },
    {
        id: 'i_greens', name: '青菜', aliases: ['小白菜', '上海青', '油菜'],
        category: 'vegetable', emoji: '🥬', shelfLifeDays: 3, unit: '把',
        pricePerUnit: 3.0, nutritionTags: ['维C', '低热量', '膳食纤维']
    },
    {
        id: 'i_loofah', name: '丝瓜', aliases: ['水瓜'],
        category: 'vegetable', emoji: '🥒', shelfLifeDays: 5, unit: '根',
        pricePerUnit: 3.5, nutritionTags: ['维C', '清热', '低热量']
    },
    {
        id: 'i_cucumber', name: '黄瓜', aliases: ['青瓜'],
        category: 'vegetable', emoji: '🥒', shelfLifeDays: 7, unit: '根',
        pricePerUnit: 2.5, nutritionTags: ['维C', '低热量', '补水']
    },
    {
        id: 'i_broccoli', name: '西兰花', aliases: ['绿菜花', '花椰菜'],
        category: 'vegetable', emoji: '🥦', shelfLifeDays: 5, unit: '个',
        pricePerUnit: 6.0, nutritionTags: ['维C', '高纤维', '抗氧化']
    },
    {
        id: 'i_spinach', name: '菠菜', aliases: ['波斯菜', '赤根菜'],
        category: 'vegetable', emoji: '🥬', shelfLifeDays: 2, unit: '把',
        pricePerUnit: 3.5, nutritionTags: ['铁', '叶酸', '维A']
    },
    {
        id: 'i_wax_gourd', name: '冬瓜', aliases: ['白瓜'],
        category: 'vegetable', emoji: '🫒', shelfLifeDays: 14, unit: '斤',
        pricePerUnit: 2.5, nutritionTags: ['低热量', '清热', '利水']
    },
    {
        id: 'i_pumpkin', name: '南瓜', aliases: ['金瓜', '倭瓜'],
        category: 'vegetable', emoji: '🎃', shelfLifeDays: 30, unit: '斤',
        pricePerUnit: 3.0, nutritionTags: ['维A', '膳食纤维', '低脂']
    },
    {
        id: 'i_shiitake', name: '香菇', aliases: ['冬菇', '花菇'],
        category: 'vegetable', emoji: '🍄', shelfLifeDays: 5, unit: '朵',
        pricePerUnit: 0.8, nutritionTags: ['多糖', '增免疫', '鲜味']
    },
    {
        id: 'i_wood_ear', name: '木耳', aliases: ['黑木耳', '云耳'],
        category: 'vegetable', emoji: '🍄', shelfLifeDays: 180, unit: '克',
        pricePerUnit: 0.5, nutritionTags: ['铁', '清肠', '膳食纤维']
    },
    {
        id: 'i_scallion', name: '葱', aliases: ['小葱', '青葱', '香葱'],
        category: 'vegetable', emoji: '🌿', shelfLifeDays: 7, unit: '根',
        pricePerUnit: 0.5, nutritionTags: ['提味', '低热量']
    },
    {
        id: 'i_ginger', name: '姜', aliases: ['生姜', '老姜'],
        category: 'vegetable', emoji: '🫚', shelfLifeDays: 30, unit: '块',
        pricePerUnit: 2.0, nutritionTags: ['驱寒', '去腥', '提味']
    },
    {
        id: 'i_garlic', name: '蒜', aliases: ['大蒜', '蒜瓣'],
        category: 'vegetable', emoji: '🧄', shelfLifeDays: 30, unit: '瓣',
        pricePerUnit: 0.3, nutritionTags: ['杀菌', '提味']
    },

    /* ===================== 肉禽 meat ===================== */
    {
        id: 'i_pork', name: '瘦猪肉', aliases: ['猪肉', '瘦肉', '里脊'],
        category: 'meat', emoji: '🥩', shelfLifeDays: 3, unit: '斤',
        pricePerUnit: 16.0, nutritionTags: ['高蛋白', '铁', 'B族维生素']
    },
    {
        id: 'i_pork_belly', name: '五花肉', aliases: ['三层肉', '肋条肉'],
        category: 'meat', emoji: '🥓', shelfLifeDays: 3, unit: '斤',
        pricePerUnit: 18.0, nutritionTags: ['脂肪', '高热量']
    },
    {
        id: 'i_chicken_breast', name: '鸡胸肉', aliases: ['鸡胸', '鸡肉'],
        category: 'meat', emoji: '🍗', shelfLifeDays: 3, unit: '块',
        pricePerUnit: 8.0, nutritionTags: ['高蛋白', '低脂', '易消化']
    },
    {
        id: 'i_ribs', name: '排骨', aliases: ['猪排骨', '肋排'],
        category: 'meat', emoji: '🍖', shelfLifeDays: 3, unit: '斤',
        pricePerUnit: 28.0, nutritionTags: ['高蛋白', '钙', '脂肪']
    },
    {
        id: 'i_beef', name: '牛肉', aliases: ['牛腩', '黄牛肉'],
        category: 'meat', emoji: '🥩', shelfLifeDays: 3, unit: '斤',
        pricePerUnit: 45.0, nutritionTags: ['高蛋白', '铁', '锌']
    },

    /* ===================== 水产 seafood ===================== */
    {
        id: 'i_sea_bass', name: '鲈鱼', aliases: ['海鲈鱼', '花鲈'],
        category: 'seafood', emoji: '🐟', shelfLifeDays: 1, unit: '条',
        pricePerUnit: 25.0, nutritionTags: ['高蛋白', '低脂', 'DHA']
    },
    {
        id: 'i_crucian_carp', name: '鲫鱼', aliases: ['鲋鱼', '喜头鱼'],
        category: 'seafood', emoji: '🐟', shelfLifeDays: 1, unit: '条',
        pricePerUnit: 12.0, nutritionTags: ['高蛋白', '下奶', '补钙']
    },
    {
        id: 'i_shrimp', name: '虾仁', aliases: ['虾米', '海虾', '青虾'],
        category: 'seafood', emoji: '🦐', shelfLifeDays: 2, unit: '斤',
        pricePerUnit: 35.0, nutritionTags: ['高蛋白', '钙', '低脂']
    },

    /* ===================== 蛋奶 eggdairy ===================== */
    {
        id: 'i_egg', name: '鸡蛋', aliases: ['鸡子', '土鸡蛋'],
        category: 'eggdairy', emoji: '🥚', shelfLifeDays: 30, unit: '个',
        pricePerUnit: 1.0, nutritionTags: ['高蛋白', '卵磷脂', '易吸收']
    },
    {
        id: 'i_milk', name: '牛奶', aliases: ['纯牛奶', '鲜奶'],
        category: 'eggdairy', emoji: '🥛', shelfLifeDays: 7, unit: '瓶',
        pricePerUnit: 6.0, nutritionTags: ['钙', '高蛋白', '维生素D']
    },

    /* ===================== 豆制品 soy ===================== */
    {
        id: 'i_tofu', name: '豆腐', aliases: ['北豆腐', '水豆腐'],
        category: 'soy', emoji: '🧈', shelfLifeDays: 3, unit: '块',
        pricePerUnit: 3.0, nutritionTags: ['植物蛋白', '高钙', '低脂']
    },
    {
        id: 'i_tofu_skin', name: '豆腐皮', aliases: ['千张', '百叶', '干豆腐'],
        category: 'soy', emoji: '🟨', shelfLifeDays: 5, unit: '张',
        pricePerUnit: 4.0, nutritionTags: ['植物蛋白', '高钙']
    },

    /* ===================== 主食 staple ===================== */
    {
        id: 'i_millet', name: '小米', aliases: ['粟米', '黄小米'],
        category: 'staple', emoji: '🟡', shelfLifeDays: 180, unit: '袋',
        pricePerUnit: 8.0, nutritionTags: ['碳水', '养胃', 'B族维生素']
    },
    {
        id: 'i_rice', name: '大米', aliases: ['粳米', '白米'],
        category: 'staple', emoji: '🍚', shelfLifeDays: 365, unit: '袋',
        pricePerUnit: 25.0, nutritionTags: ['碳水', '能量']
    },
    {
        id: 'i_noodles', name: '面条', aliases: ['挂面', '生面条'],
        category: 'staple', emoji: '🍜', shelfLifeDays: 180, unit: '把',
        pricePerUnit: 3.0, nutritionTags: ['碳水', '能量']
    },
    {
        id: 'i_steamed_bun', name: '馒头', aliases: ['白馒头', '馍'],
        category: 'staple', emoji: '🍞', shelfLifeDays: 3, unit: '个',
        pricePerUnit: 1.0, nutritionTags: ['碳水', '能量']
    },

    /* ===================== 调味 condiment ===================== */
    {
        id: 'i_salt', name: '盐', aliases: ['食盐', '细盐'],
        category: 'condiment', emoji: '🧂', shelfLifeDays: 730, unit: '克',
        pricePerUnit: 0.01, nutritionTags: ['钠']
    },
    {
        id: 'i_soy_sauce', name: '酱油', aliases: ['生抽', '老抽'],
        category: 'condiment', emoji: '🍶', shelfLifeDays: 540, unit: '勺',
        pricePerUnit: 0.2, nutritionTags: ['提鲜', '钠']
    },
    {
        id: 'i_cooking_oil', name: '食用油', aliases: ['花生油', '菜籽油', '油'],
        category: 'condiment', emoji: '🛢️', shelfLifeDays: 540, unit: '勺',
        pricePerUnit: 0.3, nutritionTags: ['脂肪', '能量']
    },
    {
        id: 'i_vinegar', name: '醋', aliases: ['米醋', '陈醋'],
        category: 'condiment', emoji: '🍾', shelfLifeDays: 730, unit: '勺',
        pricePerUnit: 0.1, nutritionTags: ['开胃', '提味']
    },
    {
        id: 'i_cooking_wine', name: '料酒', aliases: ['黄酒', '烹饪酒'],
        category: 'condiment', emoji: '🍶', shelfLifeDays: 730, unit: '勺',
        pricePerUnit: 0.15, nutritionTags: ['去腥']
    },

    /* ===================== 水果 fruit ===================== */
    {
        id: 'i_apple', name: '苹果', aliases: ['红富士', '蛇果'],
        category: 'fruit', emoji: '🍎', shelfLifeDays: 14, unit: '个',
        pricePerUnit: 4.0, nutritionTags: ['维C', '膳食纤维', '低热量']
    },
    {
        id: 'i_banana', name: '香蕉', aliases: ['甘蕉', '金蕉'],
        category: 'fruit', emoji: '🍌', shelfLifeDays: 5, unit: '根',
        pricePerUnit: 2.5, nutritionTags: ['钾', '碳水', '润肠']
    }
];

/* ============ 便捷查询工具（挂载到同一对象，供引擎/UI 使用） ============ */

// 按 id 查找食材
SMART_MENU.getIngredientById = function (id) {
    var list = SMART_MENU.ingredients;
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return list[i];
    }
    return null;
};

// 按名称/别名模糊查找（录入"西红柿"也能命中"番茄"）
SMART_MENU.findIngredientByName = function (name) {
    if (!name) return null;
    var n = String(name).trim().toLowerCase();
    var list = SMART_MENU.ingredients;
    for (var i = 0; i < list.length; i++) {
        if (list[i].name === name) return list[i];
        var al = list[i].aliases || [];
        for (var j = 0; j < al.length; j++) {
            if (al[j] === name) return list[i];
        }
    }
    // 二次：小写包含匹配（兜底）
    for (var k = 0; k < list.length; k++) {
        if (list[k].name.toLowerCase().indexOf(n) > -1) return list[k];
        var al2 = list[k].aliases || [];
        for (var m = 0; m < al2.length; m++) {
            if (al2[m].toLowerCase().indexOf(n) > -1) return list[k];
        }
    }
    return null;
};

// 按分类列出食材
SMART_MENU.getIngredientsByCategory = function (category) {
    return SMART_MENU.ingredients.filter(function (it) {
        return it.category === category;
    });
};
