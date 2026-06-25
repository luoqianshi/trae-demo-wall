var Teahouse = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  茶馆核心模块 — 云落镇·茶馆
    //  掌柜经营、阿福打理、茶品配方、升级任务
    // ═══════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────
    //  工具函数
    // ─────────────────────────────────────────────────────────

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function uid() {
        return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }

    // ─────────────────────────────────────────────────────────
    //  老板娘背景：三界茶守
    //  玩家只知道她是"老板娘"，身份随升级逐步揭开
    // ─────────────────────────────────────────────────────────

    var MOTHER_LORE = {
        name: '老板娘',
        trueName: '苏婉清',
        trueTitle: '三界茶守',
        desc: '云落镇人人只知她叫"老板娘"，经营茶馆多年，待人和善却从不提过往。她留给你的不只是茶馆——茶馆建在三界泉眼之上，她是镇守此眼的最后一任茶守。每升一级，封印松一层，你便多知道一些真相。',
        letters: {
            1: { title: '老板娘的留言·壹', content: '茶馆交给你了。别嫌小，好好经营，茶香自会引路。——老板娘' },
            2: { title: '老板娘的留言·贰', content: '有些客人不太一样吧？别怕，茶馆本就不只是给人开的。柜台底下有个暗格，里面有枚旧印，你用得上。——老板娘' },
            3: { title: '老板娘的留言·叁', content: '你拿到镇魔茶印了。茶馆地下是三界泉眼，魔界的裂缝最先松动。拿着这枚印，你能穿过裂缝进入魔界。那里的人……也喝茶。——老板娘' },
            4: { title: '老板娘的留言·肆', content: '灵界的裂缝也开了。通灵茶令在茶馆的灵泉井里，我藏了很多年。灵界的人比魔界讲规矩，但别掉以轻心。——老板娘' },
            5: { title: '老板娘的留言·终', content: '仙界也来了。升仙茶契是我当年的信物——我本是上界仙茶师，因以茶渡魂被贬下凡，镇守泉眼。如今三界齐聚，你已超越了我。三界茶尊阁不只是茶馆，它是三界和平的锚。去吧，替我守住这壶茶。——老板娘·苏婉清' }
        }
    };

    // ─────────────────────────────────────────────────────────
    //  三界通行道具
    //  每个界有独立地图和通行道具，升级时获得
    // ─────────────────────────────────────────────────────────

    var REALM_ITEMS = {
        3: { id: 'demon_seal',    name: '镇魔茶印', desc: '刻着茶纹的黑玉印章，持之可穿行魔界裂缝', realm: 'demon_realm',    realmName: '魔界', emoji: '👹' },
        4: { id: 'spirit_token',  name: '通灵茶令', desc: '半透明的玉令，灵界泉水凝结而成',       realm: 'spirit_realm',   realmName: '灵界', emoji: '👻' },
        5: { id: 'immortal_deed', name: '升仙茶契', desc: '金光流转的契约，仙界茶守的信物',       realm: 'immortal_realm', realmName: '仙界', emoji: '☁️' }
    };

    // ─────────────────────────────────────────────────────────
    //  等级配置
    // ─────────────────────────────────────────────────────────

    var LEVEL_CONFIG = {
        1: { level: 1, name: '路边小茶摊',   seats: 3,  upgradeCost: 0,    passiveIncome: 20,  fullIncome: 50,
             lore: '老板娘留下的茶摊，虽小却是家', unlockMap: null, unlockDesc: '', realmItem: null },
        2: { level: 2, name: '柳河小茶馆',   seats: 5,  upgradeCost: 200,  passiveIncome: 50,  fullIncome: 120,
             lore: '茶香渐远，连散修都被引来了', unlockMap: null, unlockDesc: '', realmItem: null },
        3: { level: 3, name: '云落名茶楼',   seats: 8,  upgradeCost: 500,  passiveIncome: 100, fullIncome: 250,
             lore: '地下裂缝松动，魔气涌出，有客自魔界来', unlockMap: 'demon_realm', unlockDesc: '获得镇魔茶印，可进入魔界', realmItem: 'demon_seal' },
        4: { level: 4, name: '苍梧雅轩',     seats: 10, upgradeCost: 1200, passiveIncome: 200, fullIncome: 500,
             lore: '灵泉井中浮现玉令，灵界裂缝开启', unlockMap: 'spirit_realm', unlockDesc: '获得通灵茶令，可进入灵界', realmItem: 'spirit_token' },
        5: { level: 5, name: '三界茶尊阁',   seats: 12, upgradeCost: 3000, passiveIncome: 400, fullIncome: 1000,
             lore: '三界以茶为约，以馆为桥', unlockMap: 'immortal_realm', unlockDesc: '获得升仙茶契，可进入仙界', realmItem: 'immortal_deed' }
    };

    var MAX_LEVEL = 5;

    // ─────────────────────────────────────────────────────────
    //  材料定义
    // ─────────────────────────────────────────────────────────

    var MATERIALS = {
        tea_leaves:      { id: 'tea_leaves',      name: '茶叶',     desc: '普通茶叶，山野间随处可见',      rarity: 'common' },
        fine_tea_leaves: { id: 'fine_tea_leaves', name: '好茶叶',   desc: '精心采摘的上等茶叶',            rarity: 'uncommon' },
        spring_water:   { id: 'spring_water',    name: '山泉水',   desc: '清冽甘甜的山间泉水',            rarity: 'common' },
        osmanthus:       { id: 'osmanthus',       name: '桂花',     desc: '金秋时节采摘的桂花',            rarity: 'uncommon' },
        spirit_leaves:   { id: 'spirit_leaves',   name: '灵茶叶',   desc: '沾染灵气的茶叶，微微发光',      rarity: 'rare' },
        spirit_water:   { id: 'spirit_water',    name: '灵泉水',   desc: '灵界涌出的泉水，入口清凉',      rarity: 'rare' },
        immortal_leaves: { id: 'immortal_leaves', name: '仙茶叶',   desc: '仙界茶树所产，叶脉流转金光',    rarity: 'legend' },
        immortal_dew:    { id: 'immortal_dew',    name: '仙泉露',   desc: '仙界晨露凝结而成，晶莹剔透',    rarity: 'legend' },
        moonlight_essence: { id: 'moonlight_essence', name: '月华精华', desc: '月圆之夜凝聚的精华，如银似水', rarity: 'legend' }
    };

    // ─────────────────────────────────────────────────────────
    //  茶品配方
    // ─────────────────────────────────────────────────────────

    var TEA_RECIPES = {
        cu_cha: {
            id: 'cu_cha',
            name: '粗茶',
            desc: '粗茶淡饭，也是人间滋味',
            price: 5,
            materials: { tea_leaves: 2, spring_water: 1 },
            minLevel: 1,
            moodBonus: 2
        },
        lv_cha: {
            id: 'lv_cha',
            name: '绿茶',
            desc: '清茶一盏，回甘悠长',
            price: 12,
            materials: { fine_tea_leaves: 2, spring_water: 1 },
            minLevel: 1,
            moodBonus: 5
        },
        hua_cha: {
            id: 'hua_cha',
            name: '花茶',
            desc: '桂花入茶，满室生香',
            price: 25,
            materials: { fine_tea_leaves: 1, osmanthus: 2, spring_water: 1 },
            minLevel: 2,
            moodBonus: 10
        },
        ling_cha: {
            id: 'ling_cha',
            name: '灵茶',
            desc: '灵气氤氲，饮之通明',
            price: 60,
            materials: { spirit_leaves: 2, spirit_water: 1 },
            minLevel: 3,
            moodBonus: 20
        },
        xian_lu: {
            id: 'xian_lu',
            name: '仙露',
            desc: '仙茶入喉，如饮星河',
            price: 150,
            materials: { immortal_leaves: 1, immortal_dew: 1, moonlight_essence: 1 },
            minLevel: 4,
            moodBonus: 40
        }
    };

    // ─────────────────────────────────────────────────────────
    //  升级任务门控
    // ─────────────────────────────────────────────────────────

    var UPGRADE_QUESTS = {
        2: { id: 'quest_hill_tea',      name: '后山采茶',   desc: '前往后山采摘好茶叶，证明你用心经营', completed: false },
        3: { id: 'quest_demon_seal',    name: '暗格旧印',   desc: '老板娘留言提到柜台暗格，找到镇魔茶印', completed: false },
        4: { id: 'quest_spirit_token',  name: '灵泉玉令',   desc: '灵泉井中浮现半透明玉令，取出通灵茶令', completed: false },
        5: { id: 'quest_immortal_deed', name: '三界齐聚',   desc: '仙界来客带来升仙茶契，三界以茶为约', completed: false }
    };

    // ─────────────────────────────────────────────────────────
    //  支线任务模板（25个）
    // ─────────────────────────────────────────────────────────

    var SIDE_QUEST_TEMPLATES = [
        // ── 跑腿类（4个） ──
        { id: 'sq_errand_1', category: 'errand',   name: '帮刘大娘送柴',     desc: '刘大娘年纪大了，帮她把柴送到家' },
        { id: 'sq_errand_2', category: 'errand',   name: '替赵婶跑腿',       desc: '赵婶让你去集市帮她买点东西' },
        { id: 'sq_errand_3', category: 'errand',   name: '给铁匠送饭',       desc: '铁匠忙得顾不上吃饭，给他送口热乎的' },
        { id: 'sq_errand_4', category: 'errand',   name: '帮老陈取信',       desc: '老陈不识字，帮他去驿站取信并念给他听' },
        // ── 调解类（3个） ──
        { id: 'sq_mediate_1', category: 'mediate',  name: '邻里纠纷',         desc: '两家因为地界吵起来了，去帮忙说和说和' },
        { id: 'sq_mediate_2', category: 'mediate',  name: '兄弟分家',         desc: '兄弟俩因分家产闹了矛盾，掌柜出面调停' },
        { id: 'sq_mediate_3', category: 'mediate',  name: '婆媳口角',         desc: '婆媳又拌嘴了，端壶茶去劝劝' },
        // ── 安慰类（3个） ──
        { id: 'sq_comfort_1', category: 'comfort',  name: '独居老人',         desc: '村头独居的老人很久没人说话了，去陪陪' },
        { id: 'sq_comfort_2', category: 'comfort',  name: '丧子之痛',         desc: '有人失去了孩子，茶馆是他唯一愿意待的地方' },
        { id: 'sq_comfort_3', category: 'comfort',  name: '落榜书生',         desc: '书生又没考上，坐在角落一壶接一壶地喝' },
        // ── 小游戏类（3个） ──
        { id: 'sq_minigame_1', category: 'minigame', name: '投壶比赛',        desc: '茶馆里有人摆了投壶，赢了有赏' },
        { id: 'sq_minigame_2', category: 'minigame', name: '猜茶谜',          desc: '有人出了茶谜，猜对免单' },
        { id: 'sq_minigame_3', category: 'minigame', name: '飞花令',          desc: '以"茶"字行飞花令，接不上就罚一杯' },
        // ── 故事类（3个） ──
        { id: 'sq_story_1', category: 'story',     name: '老陈的往事',       desc: '老陈喝多了，讲起了年轻时的事' },
        { id: 'sq_story_2', category: 'story',     name: '河里的传说',       desc: '有人说柳河里住着一条老龙' },
        { id: 'sq_story_3', category: 'story',     name: '茶馆旧事',         desc: '老板娘留下的茶馆，原来有这么多故事' },
        // ── RPG改编类（9个） ──
        { id: 'sq_rpg_herbalist',  category: 'rpg', name: '采药人的苦衷',     desc: '采药人为什么总是深夜才回来？' },
        { id: 'sq_rpg_bridge',     category: 'rpg', name: '守桥的老卒',       desc: '那座桥早就没人走了，老卒为何还守着？' },
        { id: 'sq_rpg_teacher',    category: 'rpg', name: '私塾先生',         desc: '私塾先生的眼睛越来越看不清了' },
        { id: 'sq_rpg_carver',     category: 'rpg', name: '雕版匠的叹息',     desc: '雕版匠说，这手艺怕是要断在他手里了' },
        { id: 'sq_rpg_soldier',    category: 'rpg', name: '军营里的年轻人',   desc: '那个年轻人不是来当兵的，他是来找人的' },
        { id: 'sq_rpg_reader',     category: 'rpg', name: '读信的老妇',       desc: '老妇每周来茶馆读一封信，信是谁写的？' },
        { id: 'sq_rpg_crier',      category: 'rpg', name: '告示前的哭声',     desc: '告示贴了什么，让那人站在那里哭？' },
        { id: 'sq_rpg_cook',       category: 'rpg', name: '伙夫的锅',         desc: '伙夫说他那口锅是师父留下的，不能换' },
        { id: 'sq_rpg_oldpage',    category: 'rpg', name: '旧书页',           desc: '夹在旧书里的一页纸，写满了谁的字？' }
    ];

    // ─────────────────────────────────────────────────────────
    //  天气/季节对客流的影响
    // ─────────────────────────────────────────────────────────

    var WEATHER_CUSTOMER_MOD = {
        sunny:   0,
        cloudy:  0,
        rainy:   2,
        windy:   -1,
        foggy:   -1,
        stormy:  -3,
        snowy:   -1,
        drizzle: 1
    };

    var SEASON_CUSTOMER_MOD = {
        spring: 1,
        summer: 0,
        autumn: -1,
        winter: -2
    };

    // ─────────────────────────────────────────────────────────
    //  内部状态
    // ─────────────────────────────────────────────────────────

    var _state = {
        level: 1,
        copper: 0,
        isPlayerInTeahouse: true,
        isOpen: false,
        dayIncome: 0,           // 今日主动收入
        dayPassiveIncome: 0,    // 今日被动收入
        dayServedCount: 0,      // 今日已上茶数
        totalDaysOpen: 0,       // 累计营业天数
        totalCopperEarned: 0,   // 累计铜钱收入
        materials: {},          // 材料库存 { materialId: count }
        customers: [],          // 当前座位上的顾客
        completedUpgradeQuests: [],  // 已完成的升级任务id
        activeSideQuests: [],        // 已注册的支线任务
        activeMandatoryQuests: [],   // 已注册的强制任务
        registeredRecipes: [],       // 已注册的自定义配方
        todayWeather: null,
        todaySeason: null,
        motherLetters: [1],  // 已解锁的老板娘留言（初始有第1封）
        realmItems: [],      // 已获得的通行道具（如镇魔茶印等）
        decorations: []       // 已获得的装饰品（NPC任务奖励，提供被动加成）
    };

    var _initialized = false;

    // ─────────────────────────────────────────────────────────
    //  顾客生成
    // ─────────────────────────────────────────────────────────

    var CUSTOMER_NAMES = [
        '赶路商人', '行脚僧人', '落魄书生', '卖花姑娘', '巡城兵丁',
        '算命先生', '远行游子', '采药老人', '赶考举人', '江湖侠客',
        '织布妇人', '牧童', '猎户', '渔夫', '货郎',
        '说书人', '画师', '琴师', '道士', '云游僧'
    ];

    var CUSTOMER_DESIRES = [
        { teaId: 'cu_cha',  weight: 40 },
        { teaId: 'lv_cha',  weight: 30 },
        { teaId: 'hua_cha', weight: 15 },
        { teaId: 'ling_cha', weight: 10 },
        { teaId: 'xian_lu', weight: 5 }
    ];

    function generateCustomer() {
        var name = pick(CUSTOMER_NAMES);
        var desireTea = weightedTeaPick();
        var recipe = TEA_RECIPES[desireTea] || TEA_RECIPES.cu_cha;

        return {
            uid: uid(),
            name: name,
            desireTea: desireTea,
            mood: randInt(40, 80),
            patience: randInt(3, 6),
            seated: true,
            served: false,
            tipMultiplier: 1.0
        };
    }

    // ─────────────────────────────────────────────────────────
    //  装饰品系统 — NPC任务奖励，提供被动加成
    // ─────────────────────────────────────────────────────────

    var DECORATION_DEFS = {
        chen_chapet: { id: 'chen_chapet', name: '老陈的茶宠', desc: '小陶壶摆件，老陈的心头好', emoji: '🏺', bonus: { customerBonus: 2 }, source: 'lao_chen' },
        shen_window: { id: 'shen_window', name: '赵婶的窗花', desc: '红色剪纸装饰，喜气洋洋', emoji: '🏮', bonus: { reputationBonus: 5 }, source: 'zhao_shen' },
        liu_marble: { id: 'liu_marble', name: '小六子的弹珠', desc: '彩色玻璃弹珠，童趣十足', emoji: '🔮', bonus: { moodBonus: 3 }, source: 'xiao_liu' },
        wang_plant: { id: 'wang_plant', name: '王婆婆的盆栽', desc: '绿意盎然的盆栽，灵茶产量提升', emoji: '🌱', bonus: { teaYieldBonus: 0.15 }, source: 'wang_popo' },
        tie_ironflower: { id: 'tie_ironflower', name: '铁匠的小铁花', desc: '铁艺花朵摆件，刚柔并济', emoji: '⚙️', bonus: { incomeBonus: 0.05 }, source: 'tie_jiang' },
        yun_flower: { id: 'yun_flower', name: '云溪的野花', desc: '一束新鲜的野花，清香怡人', emoji: '💐', bonus: { customerBonus: 1 }, source: 'yunxi' },
        shi_carving: { id: 'shi_carving', name: '石安的木雕', desc: '精致的小木雕，阿福效率提升', emoji: '🪵', bonus: { afuEfficiency: 0.1 }, source: 'shi_an' }
    };

    function addDecoration(decoId) {
        if (!DECORATION_DEFS[decoId]) return false;
        for (var i = 0; i < _state.decorations.length; i++) {
            if (_state.decorations[i] === decoId) return false;
        }
        _state.decorations.push(decoId);
        if (window.Logger) Logger.info('Teahouse', '获得装饰品', { decoId: decoId, name: DECORATION_DEFS[decoId].name });
        return true;
    }

    function getDecorations() {
        var result = [];
        for (var i = 0; i < _state.decorations.length; i++) {
            var id = _state.decorations[i];
            if (DECORATION_DEFS[id]) result.push(DECORATION_DEFS[id]);
        }
        return result;
    }

    function getDecorationBonuses() {
        var bonuses = { customerBonus: 0, reputationBonus: 0, moodBonus: 0, teaYieldBonus: 0, incomeBonus: 0, afuEfficiency: 0 };
        for (var i = 0; i < _state.decorations.length; i++) {
            var id = _state.decorations[i];
            var def = DECORATION_DEFS[id];
            if (!def || !def.bonus) continue;
            for (var key in def.bonus) {
                if (def.bonus.hasOwnProperty(key) && bonuses.hasOwnProperty(key)) {
                    bonuses[key] += def.bonus[key];
                }
            }
        }
        return bonuses;
    }

    function getDecorationDefs() { return DECORATION_DEFS; }

    function weightedTeaPick() {
        var level = _state.level;
        var available = [];
        var totalWeight = 0;

        for (var i = 0; i < CUSTOMER_DESIRES.length; i++) {
            var d = CUSTOMER_DESIRES[i];
            var r = TEA_RECIPES[d.teaId];
            if (r && r.minLevel <= level) {
                available.push(d);
                totalWeight += d.weight;
            }
        }

        if (available.length === 0) return 'cu_cha';

        var r = Math.random() * totalWeight;
        var acc = 0;
        for (var j = 0; j < available.length; j++) {
            acc += available[j].weight;
            if (r <= acc) return available[j].teaId;
        }
        return available[available.length - 1].teaId;
    }

    // ─────────────────────────────────────────────────────────
    //  材料操作
    // ─────────────────────────────────────────────────────────

    function hasMaterials(recipe) {
        var mats = recipe.materials;
        for (var key in mats) {
            if (!mats.hasOwnProperty(key)) continue;
            if ((_state.materials[key] || 0) < mats[key]) return false;
        }
        return true;
    }

    function consumeMaterials(recipe) {
        var mats = recipe.materials;
        // 先检查所有材料是否足够
        for (var key in mats) {
            if (!mats.hasOwnProperty(key)) continue;
            if ((_state.materials[key] || 0) < mats[key]) {
                log('材料不足，无法消耗: ' + key + ' 需要:' + mats[key] + ' 拥有:' + (_state.materials[key] || 0));
                return false;
            }
        }
        // 备份当前材料状态
        var backup = JSON.parse(JSON.stringify(_state.materials));
        // 一次性扣除
        for (var k in mats) {
            if (!mats.hasOwnProperty(k)) continue;
            _state.materials[k] = (_state.materials[k] || 0) - mats[k];
            if (_state.materials[k] < 0) {
                // 回滚
                _state.materials = backup;
                log('材料扣除异常，已回滚: ' + k);
                return false;
            }
        }
        if (window.Logger) Logger.info('Teahouse', '消耗材料', { recipe: recipe.id, materials: mats });
        return true;
    }

    function addMaterial(materialId, count) {
        if (!MATERIALS[materialId]) return false;
        if (typeof count !== 'number' || count <= 0) {
            log('addMaterial参数无效: count=' + count);
            return false;
        }
        _state.materials[materialId] = (_state.materials[materialId] || 0) + count;
        if (window.Logger) Logger.info('Teahouse', '材料增减', { materialId: materialId, count: count, total: _state.materials[materialId] });
        return true;
    }

    // ─────────────────────────────────────────────────────────
    //  天气/季节辅助
    // ─────────────────────────────────────────────────────────

    function getWeather() {
        if (typeof GameTime !== 'undefined' && GameTime.getWeather) {
            return GameTime.getWeather();
        }
        return _state.todayWeather || 'sunny';
    }

    function getSeason() {
        if (typeof GameTime !== 'undefined' && GameTime.getSeason) {
            return GameTime.getSeason();
        }
        return _state.todaySeason || 'spring';
    }

    // ─────────────────────────────────────────────────────────
    //  日志
    // ─────────────────────────────────────────────────────────

    function log(msg) {
        if (typeof Logger !== 'undefined' && Logger.info) {
            Logger.info('[Teahouse] ' + msg);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  公开方法
    // ═══════════════════════════════════════════════════════════

    /**
     * 初始化茶馆
     * @param {Object} [opts] - 可选初始参数
     * @param {number} [opts.level] - 初始等级
     * @param {number} [opts.copper] - 初始铜钱
     * @param {Object} [opts.materials] - 初始材料
     */
    function init(opts) {
        opts = opts || {};
        _state.level = clamp(opts.level || 1, 1, MAX_LEVEL);
        _state.copper = opts.copper || 0;
        _state.isPlayerInTeahouse = true;
        _state.isOpen = false;
        _state.dayIncome = 0;
        _state.dayPassiveIncome = 0;
        _state.dayServedCount = 0;
        _state.customers = [];
        _state.completedUpgradeQuests = opts.completedUpgradeQuests || [];
        _state.activeSideQuests = [];
        _state.activeMandatoryQuests = [];
        _state.registeredRecipes = [];

        // 初始化材料
        _state.materials = {};
        if (opts.materials) {
            for (var key in opts.materials) {
                if (!opts.materials.hasOwnProperty(key)) continue;
                _state.materials[key] = opts.materials[key];
            }
        } else {
            // 默认给点起步材料
            _state.materials.tea_leaves = 10;
            _state.materials.spring_water = 5;
        }

        _initialized = true;
        log('茶馆初始化完成 — 等级:' + _state.level + ' 铜钱:' + _state.copper);
    }

    /**
     * 开张 — 生成今日顾客，应用天气/季节影响
     * @returns {Object} 开张结果
     */
    function openForBusiness() {
        if (!_initialized) {
            log('茶馆未初始化，请先调用 init()');
            return { success: false, reason: 'not_initialized' };
        }
        if (_state.isOpen) {
            log('茶馆已在营业中');
            return { success: false, reason: 'already_open' };
        }

        _state.isOpen = true;
        _state.dayIncome = 0;
        _state.dayPassiveIncome = 0;
        _state.dayServedCount = 0;
        _state.customers = [];

        // 记录天气/季节
        var weatherObj = getWeather();
        var seasonObj = getSeason();
        _state.todayWeather = weatherObj ? weatherObj.id : 'sunny';
        _state.todaySeason = seasonObj ? seasonObj.id : 'spring';

        // 计算今日客流量
        var cfg = LEVEL_CONFIG[_state.level];
        var baseCustomers = cfg.seats;
        var weatherMod = WEATHER_CUSTOMER_MOD[_state.todayWeather] || 0;
        var seasonMod = SEASON_CUSTOMER_MOD[_state.todaySeason] || 0;
        var customerCount = clamp(baseCustomers + weatherMod + seasonMod, 1, cfg.seats);

        // 生成顾客
        for (var i = 0; i < customerCount; i++) {
            _state.customers.push(generateCustomer());
        }

        log('茶馆开张！今日天气:' + _state.todayWeather + ' 季节:' + _state.todaySeason + ' 顾客:' + customerCount);
        if (window.Logger) Logger.info('Teahouse', '营业开始', { weather: _state.todayWeather, season: _state.todaySeason, customerCount: customerCount });

        return {
            success: true,
            weather: _state.todayWeather,
            season: _state.todaySeason,
            customerCount: customerCount,
            customers: _state.customers.slice()
        };
    }

    /**
     * 上茶 — 检查材料/扣除材料/加收入/影响心情
     * @param {string} customerUid - 顾客唯一标识
     * @param {string} teaId - 茶品id
     * @returns {Object} 上茶结果
     */
    function serveTea(customerUid, teaId) {
        if (!_state.isOpen) {
            return { success: false, reason: 'not_open' };
        }
        if (!customerUid || !teaId) {
            log('serveTea参数无效: customerUid=' + customerUid + ' teaId=' + teaId);
            return { success: false, reason: 'invalid_params' };
        }

        // 查找顾客
        var customer = null;
        var seatIndex = -1;
        for (var i = 0; i < _state.customers.length; i++) {
            if (_state.customers[i].uid === customerUid) {
                customer = _state.customers[i];
                seatIndex = i;
                break;
            }
        }
        if (!customer) {
            return { success: false, reason: 'customer_not_found' };
        }
        if (customer.served) {
            return { success: false, reason: 'already_served' };
        }

        // 查找茶品配方（先查自定义配方，再查内置配方）
        var recipe = null;
        for (var r = 0; r < _state.registeredRecipes.length; r++) {
            if (_state.registeredRecipes[r].id === teaId) {
                recipe = _state.registeredRecipes[r];
                break;
            }
        }
        if (!recipe) {
            recipe = TEA_RECIPES[teaId];
        }
        if (!recipe) {
            return { success: false, reason: 'tea_not_found' };
        }

        // 检查茶馆等级是否满足
        if (recipe.minLevel > _state.level) {
            return { success: false, reason: 'level_too_low', required: recipe.minLevel };
        }

        // 检查材料
        if (!hasMaterials(recipe)) {
            return { success: false, reason: 'materials_not_enough' };
        }

        // 扣除材料
        if (!consumeMaterials(recipe)) {
            return { success: false, reason: 'materials_consume_failed' };
        }

        // 计算收入
        var income = recipe.price;
        var isDesired = (customer.desireTea === teaId);
        if (isDesired) {
            income = Math.floor(income * 1.5);
            customer.mood = clamp(customer.mood + recipe.moodBonus + 10, 0, 100);
        } else {
            customer.mood = clamp(customer.mood + recipe.moodBonus, 0, 100);
        }

        // 玩家不在茶馆时阿福打理，收益50%
        if (!_state.isPlayerInTeahouse) {
            income = Math.floor(income * 0.5);
        }

        _state.copper += income;
        _state.dayIncome += income;
        _state.dayServedCount++;
        customer.served = true;

        log('上茶成功 — 顾客:' + customer.name + ' 茶品:' + recipe.name + ' 收入:' + income + (isDesired ? '(满意加成)' : ''));

        return {
            success: true,
            income: income,
            isDesired: isDesired,
            customerMood: customer.mood,
            teaName: recipe.name,
            aFuServed: !_state.isPlayerInTeahouse
        };
    }

    /**
     * 打烊结算 — 被动收益+主动收益+阿福打理
     * @returns {Object} 结算结果
     */
    function closeBusiness() {
        if (!_state.isOpen) {
            return { success: false, reason: 'not_open' };
        }

        var cfg = LEVEL_CONFIG[_state.level];

        // 被动收益
        var passiveIncome = cfg.passiveIncome;

        // 未上茶的顾客由阿福打理（收益50%）
        var aFuServedCount = 0;
        var aFuIncome = 0;
        for (var i = 0; i < _state.customers.length; i++) {
            if (!_state.customers[i].served) {
                var teaRecipe = TEA_RECIPES[_state.customers[i].desireTea] || TEA_RECIPES.cu_cha;
                var tip = Math.floor(teaRecipe.price * 0.5);
                aFuIncome += tip;
                aFuServedCount++;
            }
        }

        _state.dayPassiveIncome = passiveIncome;
        var totalDayIncome = _state.dayIncome + passiveIncome + aFuIncome;
        _state.copper += passiveIncome + aFuIncome;
        _state.totalCopperEarned += totalDayIncome;
        _state.totalDaysOpen++;

        var result = {
            success: true,
            dayIncome: _state.dayIncome,
            passiveIncome: passiveIncome,
            aFuIncome: aFuIncome,
            aFuServedCount: aFuServedCount,
            totalDayIncome: totalDayIncome,
            servedCount: _state.dayServedCount,
            totalCustomers: _state.customers.length,
            copper: _state.copper
        };

        // 重置营业状态
        _state.isOpen = false;
        _state.customers = [];
        _state.dayIncome = 0;
        _state.dayPassiveIncome = 0;
        _state.dayServedCount = 0;

        log('打烊结算 — 主动:' + result.dayIncome + ' 被动:' + result.passiveIncome + ' 阿福:' + result.aFuIncome + ' 合计:' + result.totalDayIncome);
        if (window.Logger) Logger.info('Teahouse', '打烊', { dayIncome: result.dayIncome, passiveIncome: result.passiveIncome, aFuIncome: result.aFuIncome, totalDayIncome: result.totalDayIncome, servedCount: result.servedCount, totalCustomers: result.totalCustomers });

        return result;
    }

    /**
     * 升级茶馆 — 检查铜钱+任务门控
     * @returns {Object} 升级结果
     */
    function upgradeTeahouse() {
        if (!_initialized) {
            return { success: false, reason: 'not_initialized' };
        }

        var currentLevel = _state.level;
        if (currentLevel >= MAX_LEVEL) {
            return { success: false, reason: 'already_max_level' };
        }

        var nextLevel = currentLevel + 1;
        var nextCfg = LEVEL_CONFIG[nextLevel];

        // 检查铜钱
        if (_state.copper < nextCfg.upgradeCost) {
            return { success: false, reason: 'not_enough_copper', required: nextCfg.upgradeCost, current: _state.copper };
        }

        // 检查升级任务
        var questReq = UPGRADE_QUESTS[nextLevel];
        if (questReq) {
            var questDone = false;
            for (var i = 0; i < _state.completedUpgradeQuests.length; i++) {
                if (_state.completedUpgradeQuests[i] === questReq.id) {
                    questDone = true;
                    break;
                }
            }
            if (!questDone) {
                return { success: false, reason: 'quest_not_completed', questId: questReq.id, questName: questReq.name };
            }
        }

        // 执行升级
        _state.copper -= nextCfg.upgradeCost;
        _state.level = nextLevel;

        // 解锁老板娘留言
        if (!_state.motherLetters) _state.motherLetters = [1];
        if (_state.motherLetters.indexOf(nextLevel) === -1) {
            _state.motherLetters.push(nextLevel);
        }

        // 发放通行道具
        if (nextCfg.realmItem) {
            if (!_state.realmItems) _state.realmItems = [];
            if (_state.realmItems.indexOf(nextCfg.realmItem) === -1) {
                _state.realmItems.push(nextCfg.realmItem);
            }
        }

        log('茶馆升级！→ ' + nextCfg.name + '（等级' + nextLevel + '）');

        return {
            success: true,
            level: nextLevel,
            newLevel: nextLevel,
            newName: nextCfg.name,
            newSeats: nextCfg.seats,
            copperRemaining: _state.copper,
            realmItem: nextCfg.realmItem ? REALM_ITEMS[nextLevel] : null
        };
    }

    /**
     * 获取茶馆状态
     * @returns {Object} 茶馆完整状态
     */
    function getStatus() {
        var cfg = LEVEL_CONFIG[_state.level];
        return {
            level: _state.level,
            title: cfg.name,
            name: cfg.name,
            seats: cfg.seats,
            gold: _state.copper,
            copper: _state.copper,
            reputation: Math.floor(_state.totalCopperEarned / 100),
            isOpen: _state.isOpen,
            isPlayerInTeahouse: _state.isPlayerInTeahouse,
            materials: JSON.parse(JSON.stringify(_state.materials)),
            customerCount: _state.customers.length,
            todayRevenue: _state.dayIncome + _state.dayPassiveIncome,
            dayIncome: _state.dayIncome,
            dayPassiveIncome: _state.dayPassiveIncome,
            dayServedCount: _state.dayServedCount,
            totalDaysOpen: _state.totalDaysOpen,
            totalCopperEarned: _state.totalCopperEarned,
            gameDay: _state.totalDaysOpen,
            incomeBonus: cfg.fullIncome,
            completedUpgradeQuests: _state.completedUpgradeQuests.slice(),
            motherLetters: _state.motherLetters || [1],
            realmItems: getRealmItems(),
            unlockMap: cfg.unlockMap,
            unlockDesc: cfg.unlockDesc,
            lore: cfg.lore,
            nextUpgrade: _state.level < MAX_LEVEL ? {
                level: _state.level + 1,
                title: LEVEL_CONFIG[_state.level + 1].name,
                cost: LEVEL_CONFIG[_state.level + 1].upgradeCost,
                questRequired: UPGRADE_QUESTS[_state.level + 1] ? UPGRADE_QUESTS[_state.level + 1].id : null
            } : null
        };
    }

    /**
     * 获取座位上的顾客
     * @param {number} index - 座位索引
     * @returns {Object|null} 顾客信息或null
     */
    function getCustomerAtSeat(index) {
        if (index < 0 || index >= _state.customers.length) return null;
        var c = _state.customers[index];
        return {
            uid: c.uid,
            name: c.name,
            desireTea: c.desireTea,
            mood: c.mood,
            patience: c.patience,
            served: c.served
        };
    }

    /**
     * 获取茶品列表
     * @returns {Array} 当前等级可用的茶品
     */
    function getTeaItems() {
        var result = [];
        for (var key in TEA_RECIPES) {
            if (!TEA_RECIPES.hasOwnProperty(key)) continue;
            var r = TEA_RECIPES[key];
            result.push({
                id: r.id,
                name: r.name,
                desc: r.desc,
                price: r.price,
                materials: JSON.parse(JSON.stringify(r.materials)),
                minLevel: r.minLevel,
                moodBonus: r.moodBonus,
                available: r.minLevel <= _state.level,
                canBrew: r.minLevel <= _state.level && hasMaterials(r)
            });
        }
        // 附加自定义配方
        for (var i = 0; i < _state.registeredRecipes.length; i++) {
            var cr = _state.registeredRecipes[i];
            result.push({
                id: cr.id,
                name: cr.name,
                desc: cr.desc || '',
                price: cr.price,
                materials: JSON.parse(JSON.stringify(cr.materials)),
                minLevel: cr.minLevel || 1,
                moodBonus: cr.moodBonus || 0,
                available: (cr.minLevel || 1) <= _state.level,
                canBrew: (cr.minLevel || 1) <= _state.level && hasMaterials(cr),
                custom: true
            });
        }
        return result;
    }

    /**
     * 玩家是否在茶馆
     * @returns {boolean}
     */
    function isPlayerPresent() {
        return _state.isPlayerInTeahouse;
    }

    /**
     * 设置玩家是否在茶馆
     * @param {boolean} bool
     */
    function setPlayerPresent(bool) {
        _state.isPlayerInTeahouse = !!bool;
        log('玩家' + (_state.isPlayerInTeahouse ? '回到' : '离开') + '茶馆');
    }

    // ─────────────────────────────────────────────────────────
    //  留白接口
    // ─────────────────────────────────────────────────────────

    /**
     * 注册支线任务
     * @param {Object} quest - 任务对象 { id, name, desc, category, ... }
     * @returns {boolean}
     */
    function registerSideQuest(quest) {
        if (!quest || !quest.id) return false;
        // 检查是否已注册
        for (var i = 0; i < _state.activeSideQuests.length; i++) {
            if (_state.activeSideQuests[i].id === quest.id) return false;
        }
        _state.activeSideQuests.push(quest);
        log('注册支线任务: ' + quest.name);
        return true;
    }

    /**
     * 注册强制任务（升级门控任务）
     * @param {Object} quest - 任务对象 { id, name, desc, targetLevel, ... }
     * @returns {boolean}
     */
    function registerMandatoryQuest(quest) {
        if (!quest || !quest.id) return false;
        for (var i = 0; i < _state.activeMandatoryQuests.length; i++) {
            if (_state.activeMandatoryQuests[i].id === quest.id) return false;
        }
        _state.activeMandatoryQuests.push(quest);
        log('注册强制任务: ' + quest.name);
        return true;
    }

    /**
     * 注册茶品配方
     * @param {Object} recipe - 配方对象 { id, name, desc, price, materials, minLevel, moodBonus }
     * @returns {boolean}
     */
    function registerRecipe(recipe) {
        if (!recipe || !recipe.id) return false;
        // 检查是否与内置配方冲突
        if (TEA_RECIPES[recipe.id]) return false;
        // 检查是否已注册
        for (var i = 0; i < _state.registeredRecipes.length; i++) {
            if (_state.registeredRecipes[i].id === recipe.id) return false;
        }
        _state.registeredRecipes.push({
            id: recipe.id,
            name: recipe.name || '未知茶品',
            desc: recipe.desc || '',
            price: recipe.price || 5,
            materials: recipe.materials || {},
            minLevel: recipe.minLevel || 1,
            moodBonus: recipe.moodBonus || 0
        });
        log('注册茶品配方: ' + (recipe.name || recipe.id));
        return true;
    }

    // ─────────────────────────────────────────────────────────
    //  额外辅助方法
    // ─────────────────────────────────────────────────────────

    /**
     * 完成升级任务
     * @param {string} questId - 任务id
     * @returns {boolean}
     */
    function completeUpgradeQuest(questId) {
        for (var i = 0; i < _state.completedUpgradeQuests.length; i++) {
            if (_state.completedUpgradeQuests[i] === questId) return false;
        }
        _state.completedUpgradeQuests.push(questId);
        log('完成升级任务: ' + questId);
        return true;
    }

    /**
     * 获取材料库存
     * @returns {Object}
     */
    function getMaterials() {
        return JSON.parse(JSON.stringify(_state.materials));
    }

    /**
     * 添加材料
     * @param {string} materialId
     * @param {number} count
     * @returns {boolean}
     */
    function addMaterialToInventory(materialId, count) {
        return addMaterial(materialId, count || 1);
    }

    /**
     * 扣减铜钱
     * @param {number} amount - 扣减金额
     * @returns {boolean} 是否扣减成功
     */
    function spendCopper(amount) {
        if (_state.copper < amount) return false;
        _state.copper -= amount;
        return true;
    }

    /**
     * 从存档恢复茶馆状态
     * @param {Object} saved - 保存的状态数据
     */
    function loadState(saved) {
        if (!saved) return;
        if (typeof saved.level === 'number') _state.level = saved.level;
        if (typeof saved.copper === 'number') _state.copper = saved.copper;
        if (saved.materials && typeof saved.materials === 'object') _state.materials = saved.materials;
        if (Array.isArray(saved.decorations)) _state.decorations = saved.decorations;
        if (Array.isArray(saved.completedUpgradeQuests)) _state.completedUpgradeQuests = saved.completedUpgradeQuests;
        if (Array.isArray(saved.realmItems)) _state.realmItems = saved.realmItems;
        if (Array.isArray(saved.motherLetters)) _state.motherLetters = saved.motherLetters;
    }

    /**
     * 获取所有材料定义
     * @returns {Object}
     */
    function getMaterialDefs() {
        return JSON.parse(JSON.stringify(MATERIALS));
    }

    /**
     * 获取等级配置
     * @returns {Object}
     */
    function getLevelConfigs() {
        return JSON.parse(JSON.stringify(LEVEL_CONFIG));
    }

    /**
     * 获取升级任务列表
     * @returns {Object}
     */
    function getUpgradeQuests() {
        var result = {};
        for (var key in UPGRADE_QUESTS) {
            if (!UPGRADE_QUESTS.hasOwnProperty(key)) continue;
            var q = UPGRADE_QUESTS[key];
            var done = false;
            for (var i = 0; i < _state.completedUpgradeQuests.length; i++) {
                if (_state.completedUpgradeQuests[i] === q.id) { done = true; break; }
            }
            result[key] = {
                id: q.id,
                name: q.name,
                desc: q.desc,
                completed: done
            };
        }
        return result;
    }

    /**
     * 获取支线任务模板列表
     * @returns {Array}
     */
    function getSideQuestTemplates() {
        return JSON.parse(JSON.stringify(SIDE_QUEST_TEMPLATES));
    }

    /**
     * 获取阿福信息
     * @returns {Object}
     */
    function getAFuInfo() {
        return {
            id: 'a_fu',
            name: '阿福',
            role: '茶馆小二',
            desc: '常驻茶馆的小二，掌柜不在时打理茶馆',
            incomeRate: 0.5,
            isManaging: !_state.isPlayerInTeahouse
        };
    }

    /**
     * 获取老板娘背景设定
     * @returns {Object}
     */
    function getMotherLore() {
        return MOTHER_LORE;
    }

    /**
     * 获取指定等级的老板娘留言
     * @param {number} level - 等级（1-5）
     * @returns {Object|null}
     */
    function getMotherLetter(level) {
        return MOTHER_LORE.letters[level] || null;
    }

    /**
     * 获取已解锁的老板娘留言列表
     * @returns {Array}
     */
    function getUnlockedLetters() {
        return _state.motherLetters || [1];
    }

    /**
     * 获取已获得的通行道具
     * @returns {Array}
     */
    function getRealmItems() {
        if (!_state.realmItems || _state.realmItems.length === 0) return [];
        var result = [];
        for (var i = 0; i < _state.realmItems.length; i++) {
            var itemId = _state.realmItems[i];
            for (var lv in REALM_ITEMS) {
                if (REALM_ITEMS[lv].id === itemId) {
                    result.push(REALM_ITEMS[lv]);
                    break;
                }
            }
        }
        return result;
    }

    /**
     * 检查是否有某个界的通行道具
     * @param {string} realmId 界域ID（demon_realm/spirit_realm/immortal_realm）
     * @returns {boolean}
     */
    function hasRealmAccess(realmId) {
        if (!_state.realmItems) return false;
        for (var lv in REALM_ITEMS) {
            if (REALM_ITEMS[lv].realm === realmId && _state.realmItems.indexOf(REALM_ITEMS[lv].id) !== -1) {
                return true;
            }
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════
    //  导出
    // ═══════════════════════════════════════════════════════════

    return {
        // 核心方法
        init: init,
        openForBusiness: openForBusiness,
        serveTea: serveTea,
        closeBusiness: closeBusiness,
        upgradeTeahouse: upgradeTeahouse,
        getStatus: getStatus,
        getCustomerAtSeat: getCustomerAtSeat,
        getTeaItems: getTeaItems,
        isPlayerPresent: isPlayerPresent,
        setPlayerPresent: setPlayerPresent,

        // 留白接口
        registerSideQuest: registerSideQuest,
        registerMandatoryQuest: registerMandatoryQuest,
        registerRecipe: registerRecipe,

        // 辅助方法
        completeUpgradeQuest: completeUpgradeQuest,
        getMaterials: getMaterials,
        addMaterialToInventory: addMaterialToInventory,
        spendCopper: spendCopper,
        loadState: loadState,
        getMaterialDefs: getMaterialDefs,
        getLevelConfigs: getLevelConfigs,
        getUpgradeQuests: getUpgradeQuests,
        getSideQuestTemplates: getSideQuestTemplates,
        getAFuInfo: getAFuInfo,
        getMotherLore: getMotherLore,
        getMotherLetter: getMotherLetter,
        getUnlockedLetters: getUnlockedLetters,
        getRealmItems: getRealmItems,
        hasRealmAccess: hasRealmAccess,
        addDecoration: addDecoration,
        getDecorations: getDecorations,
        getDecorationBonuses: getDecorationBonuses,
        getDecorationDefs: getDecorationDefs
    };

})();

window.Teahouse = Teahouse;
