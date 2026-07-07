/**
 * data-sample.js — 示例家庭与示例冰箱
 * -----------------------------------------------------------
 * 挂载方式：window.SMART_MENU.sample = { family, fridge, sampleFridgePhotos }
 *           （全局对象，非 ES Module）
 * 适用环境：file:// 直接打开可用
 *
 * 设计意图：提供一个"三代同堂且存在饮食冲突"的典型家庭，用于演示
 *          智能菜单如何兼顾老幼忌口、营养与口味。
 *
 * 冲突点设计（用于考验适配逻辑）：
 *  - 爷爷高血压+糖尿病，需控盐控糖、偏淡、不吃海鲜 → 清蒸鲈鱼/虾仁类禁用
 *  - 爷爷、奶奶咀嚼弱 → 菜品需软嫩处理
 *  - 儿媳偏辣不吃香菜 → 口味与忌口冲突
 *  - 孙子挑食不吃胡萝卜 → 胡萝卜炖牛肉需做儿童版胡萝卜切小丁或替换
 *  - 孙子 6 岁需防呛噎 → 木耳、鱼刺、整粒坚果类需切碎/去刺
 *
 * 成员字段（与 store.addMember 兼容）：
 *  id / name / nickname(称呼) / role / age / gender
 *  conditions(慢病) / chewingWeak(咀嚼弱) / tastePreference(口味偏好)
 *  dislikes(不吃/忌口) / allergies(过敏) / appetite(食量)
 *  isChild / childSafety(是否需防呛噎) / notes
 *
 * 冰箱条目字段（与 store.addFridgeItem 兼容）：
 *  id / ingredientId(引用 data-ingredients 的 id) / amount / addedAt(毫秒时间戳) / note
 * -----------------------------------------------------------
 */
window.SMART_MENU = window.SMART_MENU || {};

// 以"今天"为基准生成相对时间戳，模拟最近几天陆续放入冰箱的食材
(function () {
    var DAY = 24 * 60 * 60 * 1000;
    var now = Date.now();
    var ago = function (d) { return now - d * DAY; };

    SMART_MENU.sample = {

        /* ============ 示例家庭（三代同堂） ============ */
        family: [
            {
                id: 'm_zhang',
                name: '老张',
                nickname: '爷爷',
                role: 'grandfather',      // 祖父
                age: 65,
                gender: 'male',
                conditions: ['高血压', '糖尿病'],
                chewingWeak: true,         // 咀嚼弱
                tastePreference: 'mild',   // 偏淡
                dislikes: ['seafood'],     // 不吃海鲜
                allergies: [],
                appetite: 'small',         // 小食量
                isChild: false,
                childSafety: false,
                notes: '高血压糖尿病需严格控盐控糖，清淡软烂为主'
            },
            {
                id: 'm_li',
                name: '老李',
                nickname: '奶奶',
                role: 'grandmother',      // 祖母
                age: 63,
                gender: 'female',
                conditions: ['缺钙'],
                chewingWeak: true,         // 咀嚼弱
                tastePreference: 'mild',   // 偏淡
                dislikes: [],              // 无明显忌口
                allergies: [],
                appetite: 'medium',        // 中食量
                isChild: false,
                childSafety: false,
                notes: '需补钙，可多安排豆腐、鲫鱼汤、牛奶'
            },
            {
                id: 'm_wang',
                name: '小王',
                nickname: '儿媳',
                role: 'parent',            // 子辈
                age: 30,
                gender: 'female',
                conditions: [],             // 无慢病
                chewingWeak: false,
                tastePreference: 'spicy',  // 偏辣
                dislikes: ['香菜'],        // 不吃香菜
                allergies: [],
                appetite: 'medium',        // 中食量
                isChild: false,
                childSafety: false,
                notes: '口味偏辣，可单独配一份开味小菜'
            },
            {
                id: 'm_bao',
                name: '小宝',
                nickname: '孙子',
                role: 'child',             // 孙辈
                age: 6,
                gender: 'male',
                conditions: [],            // 无慢病
                chewingWeak: false,
                tastePreference: 'sweet',  // 偏甜
                dislikes: ['carrot'],      // 挑食不吃胡萝卜
                allergies: [],
                appetite: 'small',         // 小食量
                isChild: true,
                childSafety: true,         // 儿童需防呛噎
                notes: '6 岁儿童，需去刺/切碎防呛噎；不吃胡萝卜，需替换或藏匿'
            }
        ],

        /* ============ 示例冰箱（引用食材 id） ============
         * 番茄4个、鸡蛋6个、瘦猪肉半斤、豆腐1块、青菜1把、
         * 土豆2个、胡萝卜1根、小米1袋、葱2根、姜1块
         */
        fridge: [
            { id: 'f_s_01', ingredientId: 'i_tomato',  amount: 4,   addedAt: ago(1), note: '冰箱冷藏' },
            { id: 'f_s_02', ingredientId: 'i_egg',     amount: 6,   addedAt: ago(2), note: '鸡蛋托' },
            { id: 'f_s_03', ingredientId: 'i_pork',    amount: 0.5, addedAt: ago(1), note: '瘦猪肉半斤' },
            { id: 'f_s_04', ingredientId: 'i_tofu',    amount: 1,   addedAt: ago(0), note: '今天买的，需尽快食用' },
            { id: 'f_s_05', ingredientId: 'i_greens',  amount: 1,   addedAt: ago(1), note: '青菜一把' },
            { id: 'f_s_06', ingredientId: 'i_potato',  amount: 2,   addedAt: ago(4), note: '' },
            { id: 'f_s_07', ingredientId: 'i_carrot',  amount: 1,   addedAt: ago(5), note: '孙子不吃，可做泥' },
            { id: 'f_s_08', ingredientId: 'i_millet',  amount: 1,   addedAt: ago(10), note: '小米一袋' },
            { id: 'f_s_09', ingredientId: 'i_scallion', amount: 2, addedAt: ago(2), note: '' },
            { id: 'f_s_10', ingredientId: 'i_ginger',  amount: 1,   addedAt: ago(6), note: '' }
        ],

        /* ============ 示例冰箱照片模拟数据 ============
         * 用于"拍照识别食材"功能的离线模拟：
         * 拍照后命中该照片，返回其识别到的食材 id 列表。
         * url 为空时表示使用占位图（file:// 下不依赖网络）。
         */
        sampleFridgePhotos: [
            {
                url: '',
                label: '蔬菜保鲜层',
                ingredients: ['i_tomato', 'i_egg', 'i_pork']
            },
            {
                url: '',
                label: '蛋奶层',
                ingredients: ['i_egg', 'i_milk']
            },
            {
                url: '',
                label: '豆制品与蔬菜',
                ingredients: ['i_tofu', 'i_greens', 'i_carrot']
            }
        ]
    };
})();

/* ============ 便捷方法：一键导入示例数据到 store ============ */
// 在 UI 层点击"导入示例家庭"按钮时调用，可同时导入家庭与冰箱
SMART_MENU.loadSampleData = function (opts) {
    opts = opts || {};
    var store = SMART_MENU.store;
    var sample = SMART_MENU.sample;
    if (!store || !sample) return;

    if (opts.family !== false) {
        // 深拷贝 family，避免直接引用示例数据导致后续修改污染原始数据
        store.set('family', JSON.parse(JSON.stringify(sample.family)));
    }
    if (opts.fridge !== false) {
        store.set('fridge', JSON.parse(JSON.stringify(sample.fridge)));
    }
};
