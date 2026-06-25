var DailyEngine = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  NPC需求驱动AI引擎 — 云落镇·茶馆
    //  每个NPC拥有独立性格、每日状态、决策逻辑
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

    function randFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function weightedPick(weights) {
        // weights: [{value, weight}, ...]
        var total = 0;
        for (var i = 0; i < weights.length; i++) { total += weights[i].weight; }
        var r = Math.random() * total;
        var acc = 0;
        for (var j = 0; j < weights.length; j++) {
            acc += weights[j].weight;
            if (r <= acc) return weights[j].value;
        }
        return weights[weights.length - 1].value;
    }

    // ─────────────────────────────────────────────────────────
    //  档位定义
    // ─────────────────────────────────────────────────────────

    var TIER = {
        DAILY:    { id: 'daily',    name: '日常', color: '#aaaaaa', chance: 0.60 },
        UNCOMMON: { id: 'uncommon', name: '稀有', color: '#4fc3f7', chance: 0.25 },
        RARE:     { id: 'rare',     name: '珍稀', color: '#ab47bc', chance: 0.10 },
        LEGEND:   { id: 'legend',   name: '传说', color: '#ffd54f', chance: 0.04 },
        HIDDEN:   { id: 'hidden',   name: '隐藏', color: '#ef5350', chance: 0.01 }
    };

    function rollTier() {
        return weightedPick([
            { value: TIER.DAILY.id,    weight: 60 },
            { value: TIER.UNCOMMON.id, weight: 25 },
            { value: TIER.RARE.id,     weight: 10 },
            { value: TIER.LEGEND.id,   weight: 4 },
            { value: TIER.HIDDEN.id,   weight: 1 }
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  心情标签
    // ─────────────────────────────────────────────────────────

    var MOOD_LABELS = [
        { min: 0,  max: 20,  label: '低落', emoji: '😞' },
        { min: 21, max: 40,  label: '烦闷', emoji: '😤' },
        { min: 41, max: 60,  label: '平静', emoji: '😐' },
        { min: 61, max: 80,  label: '愉快', emoji: '😊' },
        { min: 81, max: 100, label: '开心', emoji: '😄' }
    ];

    function getMoodInfo(mood) {
        var m = clamp(Math.round(mood), 0, 100);
        for (var i = 0; i < MOOD_LABELS.length; i++) {
            if (m >= MOOD_LABELS[i].min && m <= MOOD_LABELS[i].max) {
                return { mood: m, label: MOOD_LABELS[i].label, emoji: MOOD_LABELS[i].emoji };
            }
        }
        return { mood: m, label: '平静', emoji: '😐' };
    }

    // ─────────────────────────────────────────────────────────
    //  季节影响
    // ─────────────────────────────────────────────────────────

    var SEASON_MOOD_EFFECT = {
        spring: 5,
        summer: 0,
        autumn: -3,
        winter: -5
    };

    function getCurrentSeason() {
        // 优先从 GameTime 获取，否则按月份推算
        if (typeof GameTime !== 'undefined' && GameTime.getSeason) {
            return GameTime.getSeason();
        }
        var month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    function getCurrentPeriod() {
        // 修复：优先用getPeriod（返回对象），兼容getCurrentPeriod（返回字符串）
        if (typeof GameTime !== 'undefined') {
            if (GameTime.getPeriod) {
                var p = GameTime.getPeriod();
                return (p && p.id) ? p.id : 'morning';
            }
            if (GameTime.getCurrentPeriod) {
                return GameTime.getCurrentPeriod();
            }
        }
        // 回退：用真实时间（仅用于无GameTime的测试环境）
        var h = new Date().getHours();
        if (h < 5) return 'night';
        if (h < 8) return 'dawn';
        if (h < 12) return 'morning';
        if (h < 14) return 'noon';
        if (h < 17) return 'afternoon';
        if (h < 20) return 'evening';
        return 'night';
    }

    // ═══════════════════════════════════════════════════════════
    //  NPC档案 — 22位云落镇居民
    // ═══════════════════════════════════════════════════════════

    var NPC_PROFILES = {

        // ── 茶馆常客 ──────────────────────────────────────

        lao_chen: {
            id: 'lao_chen',
            name: '老陈',
            personality: { social: 80, curiosity: 30, emotion: 40, diligence: 20, adventure: 10, warmth: 75, humor: 60, stubbornness: 40, caution: 30, patience: 70, pride: 30, loyalty: 65 },
            homeLocation: 'east_street',
            favoriteLocation: 'teahouse',
            moodEmoji: '🍵',
            bodyColor: '#8d6e63',
            greeting: '来来来，坐这头，今儿个茶不错。',
            type: 'teahouse_regular',
            workLocation: null
        },

        zhao_shen: {
            id: 'zhao_shen',
            name: '赵婶',
            personality: { social: 90, curiosity: 60, emotion: 70, diligence: 80, adventure: 15, warmth: 90, humor: 50, stubbornness: 70, caution: 20, patience: 40, pride: 50, loyalty: 85 },
            homeLocation: 'south_street',
            favoriteLocation: 'teahouse',
            moodEmoji: '🧣',
            bodyColor: '#e57373',
            greeting: '哎哟，你可算来了！我正想找人说话呢。',
            type: 'teahouse_regular',
            workLocation: 'market'
        },

        xiao_liu: {
            id: 'xiao_liu',
            name: '小六子',
            personality: { social: 60, curiosity: 80, emotion: 50, diligence: 60, adventure: 70, warmth: 65, humor: 80, stubbornness: 25, caution: 35, patience: 55, pride: 25, loyalty: 60 },
            homeLocation: 'west_alley',
            favoriteLocation: 'teahouse',
            moodEmoji: '🏃',
            bodyColor: '#81c784',
            greeting: '嘿！今天有啥新鲜事没？',
            type: 'teahouse_regular',
            workLocation: 'dock'
        },

        // ── 宗门外门 ──────────────────────────────────────

        su_shijie: {
            id: 'su_shijie',
            name: '苏师姐',
            personality: { social: 30, curiosity: 60, emotion: 30, diligence: 90, adventure: 50, warmth: 20, humor: 15, stubbornness: 75, caution: 80, patience: 30, pride: 85, loyalty: 70 },
            homeLocation: 'sect_outer',
            favoriteLocation: 'training_ground',
            moodEmoji: '⚔️',
            bodyColor: '#7986cb',
            greeting: '……嗯，你也来了。',
            type: 'sect_outer',
            workLocation: 'training_ground'
        },

        liu_shixiong: {
            id: 'liu_shixiong',
            name: '刘师兄',
            personality: { social: 70, curiosity: 40, emotion: 60, diligence: 50, adventure: 40, warmth: 75, humor: 70, stubbornness: 30, caution: 25, patience: 60, pride: 55, loyalty: 75 },
            homeLocation: 'sect_outer',
            favoriteLocation: 'tavern',
            moodEmoji: '🍺',
            bodyColor: '#ffb74d',
            greeting: '哈哈！来来来，喝一杯！',
            type: 'sect_outer',
            workLocation: 'sect_gate'
        },

        han_shimei: {
            id: 'han_shimei',
            name: '韩师妹',
            personality: { social: 50, curiosity: 90, emotion: 60, diligence: 40, adventure: 80, warmth: 55, humor: 45, stubbornness: 35, caution: 50, patience: 65, pride: 40, loyalty: 60 },
            homeLocation: 'sect_outer',
            favoriteLocation: 'back_mountain',
            moodEmoji: '🔍',
            bodyColor: '#f48fb1',
            greeting: '你听说了吗？后山好像有奇怪的声音！',
            type: 'sect_outer',
            workLocation: 'library'
        },

        // ── 散修 ──────────────────────────────────────────

        du_xing: {
            id: 'du_xing',
            name: '独行客',
            personality: { social: 10, curiosity: 50, emotion: 20, diligence: 70, adventure: 90, warmth: 5, humor: 10, stubbornness: 85, caution: 90, patience: 20, pride: 80, loyalty: 15 },
            homeLocation: 'inn',
            favoriteLocation: 'back_mountain',
            moodEmoji: '🗡️',
            bodyColor: '#546e7a',
            greeting: '……',
            type: 'wanderer',
            workLocation: null
        },

        yao_fengzi: {
            id: 'yao_fengzi',
            name: '药疯子',
            personality: { social: 20, curiosity: 95, emotion: 80, diligence: 90, adventure: 30, warmth: 30, humor: 60, stubbornness: 90, caution: 10, patience: 45, pride: 20, loyalty: 30 },
            homeLocation: 'herb_hut',
            favoriteLocation: 'herb_garden',
            moodEmoji: '🌿',
            bodyColor: '#66bb6a',
            greeting: '等等！你看这株草的纹路……啧啧啧！',
            type: 'wanderer',
            workLocation: 'herb_garden'
        },

        suan_ming_xia: {
            id: 'suan_ming_xia',
            name: '算命瞎子',
            personality: { social: 60, curiosity: 70, emotion: 40, diligence: 30, adventure: 50, warmth: 55, humor: 65, stubbornness: 50, caution: 60, patience: 75, pride: 60, loyalty: 40 },
            homeLocation: 'bridge',
            favoriteLocation: 'bridge',
            moodEmoji: '🔮',
            bodyColor: '#9575cd',
            greeting: '这位施主，贫道观你面相……今日宜饮茶。',
            type: 'wanderer',
            workLocation: 'bridge'
        },

        // ── 商贩 ──────────────────────────────────────────

        wang_zhanggui: {
            id: 'wang_zhanggui',
            name: '王掌柜',
            personality: { social: 70, curiosity: 40, emotion: 40, diligence: 90, adventure: 20, warmth: 70, humor: 35, stubbornness: 45, caution: 65, patience: 65, pride: 50, loyalty: 55 },
            homeLocation: 'shop',
            favoriteLocation: 'shop',
            moodEmoji: '💰',
            bodyColor: '#d4a056',
            greeting: '客官里面请！今天新到了好货。',
            type: 'merchant',
            workLocation: 'shop'
        },

        bu_li: {
            id: 'bu_li',
            name: '布匹李',
            personality: { social: 50, curiosity: 30, emotion: 50, diligence: 80, adventure: 10, warmth: 45, humor: 25, stubbornness: 55, caution: 70, patience: 70, pride: 35, loyalty: 60 },
            homeLocation: 'market',
            favoriteLocation: 'market',
            moodEmoji: '🧵',
            bodyColor: '#bcaaa4',
            greeting: '您看看，这布料，摸着多舒服。',
            type: 'merchant',
            workLocation: 'market'
        },

        yu_fan_zhang: {
            id: 'yu_fan_zhang',
            name: '鱼贩张',
            personality: { social: 80, curiosity: 30, emotion: 70, diligence: 70, adventure: 20, warmth: 80, humor: 70, stubbornness: 30, caution: 25, patience: 45, pride: 30, loyalty: 70 },
            homeLocation: 'dock',
            favoriteLocation: 'dock',
            moodEmoji: '🐟',
            bodyColor: '#4fc3f7',
            greeting: '新鲜的！今早刚打的鱼！来两条？',
            type: 'merchant',
            workLocation: 'dock'
        },

        // ── 手艺人 ────────────────────────────────────────

        tie_zhao: {
            id: 'tie_zhao',
            name: '铁匠赵',
            personality: { social: 30, curiosity: 40, emotion: 30, diligence: 95, adventure: 15, warmth: 20, humor: 10, stubbornness: 80, caution: 60, patience: 25, pride: 75, loyalty: 50 },
            homeLocation: 'forge',
            favoriteLocation: 'forge',
            moodEmoji: '🔨',
            bodyColor: '#78909c',
            greeting: '嗯。要打什么？',
            type: 'artisan',
            workLocation: 'forge',
            personalDialogue: {
                openings: {
                    mid: ['嗯，来了。', '要打什么？', '坐。'],
                    high: ['嘿！来了！', '今天手感不错！', '来，看看我今天打的！']
                },
                topics: {
                    idle: ['今天没活儿。', '没事做，就磨磨刀。', '闲着也是闲着。'],
                    rainy: ['下雨天，铁铺里潮，打不了铁。', '雨天铁容易生锈，得赶紧擦油。', '下雨天就适合待在铁铺里，炉子暖和。'],
                    stormy: ['暴风雨，炉火都点不着。', '打雷的时候别靠近铁炉，导电。'],
                    snowy: ['下雪天冷，铁淬火快，反而好打。', '下雪了，炉子边最暖和。', '冷天打铁，铁冷得快，得趁热。'],
                    sunny: ['天气好，炉火旺，打铁正合适。', '今天天好，适合打铁。', '太阳好，铁不容易生锈。']
                },
                closings: {
                    friend: ['明天来，我给你看点好东西。', '路上小心。', '下次来请你喝酒。']
                },
                intentReplies: {
                    listen: ['嗯，我知道了。', '你说得对。', '嗯，有道理。'],
                    comfort: ['没事，不用操心。', '嗯，谢了。', '我没事。'],
                    share_joy: ['嗯，不错。', '挺好。', '那敢情好。'],
                    help: ['行，我帮你。', '没问题，交给我。', '这点事，一句话。'],
                    encourage: ['嗯，谢了。', '有你这话就行。', '我会的。'],
                    accompany: ['嗯，坐吧。炉子边暖和。', '……行，你坐。我继续干活。', '难得有人来坐坐。'],
                    default: ['嗯。', '你说得对。', '有道理。', '嗯，知道了。']
                }
            }
        },

        mu_sun: {
            id: 'mu_sun',
            name: '木匠孙',
            personality: { social: 25, curiosity: 50, emotion: 35, diligence: 90, adventure: 20, warmth: 25, humor: 15, stubbornness: 65, caution: 55, patience: 60, pride: 55, loyalty: 50 },
            homeLocation: 'workshop',
            favoriteLocation: 'workshop',
            moodEmoji: '🪵',
            bodyColor: '#a1887f',
            greeting: '这榫卯……差一点就严丝合缝了。',
            type: 'artisan',
            workLocation: 'workshop'
        },

        chu_liu: {
            id: 'chu_liu',
            name: '厨娘刘',
            personality: { social: 75, curiosity: 55, emotion: 65, diligence: 95, adventure: 10, warmth: 85, humor: 55, stubbornness: 50, caution: 30, patience: 50, pride: 35, loyalty: 75 },
            homeLocation: 'kitchen',
            favoriteLocation: 'kitchen',
            moodEmoji: '🍳',
            bodyColor: '#ff8a65',
            greeting: '饿了吧？刚出锅的，趁热吃！',
            type: 'artisan',
            workLocation: 'kitchen'
        },

        // ── 镇民 ──────────────────────────────────────────

        lie_wu: {
            id: 'lie_wu',
            name: '猎户吴',
            personality: { social: 40, curiosity: 60, emotion: 40, diligence: 80, adventure: 85, warmth: 35, humor: 30, stubbornness: 60, caution: 70, patience: 70, pride: 45, loyalty: 65 },
            homeLocation: 'north_cabin',
            favoriteLocation: 'back_mountain',
            moodEmoji: '🏹',
            bodyColor: '#6d4c41',
            greeting: '山里今天雾大，不过猎到了只野兔。',
            type: 'townsfolk',
            workLocation: 'back_mountain'
        },

        gengfu_zhou: {
            id: 'gengfu_zhou',
            name: '更夫老周',
            personality: { social: 35, curiosity: 25, emotion: 30, diligence: 85, adventure: 10, warmth: 30, humor: 20, stubbornness: 50, caution: 80, patience: 80, pride: 25, loyalty: 80 },
            homeLocation: 'east_street',
            favoriteLocation: 'east_street',
            moodEmoji: '🏮',
            greeting: '天干物燥，小心火烛……啊，白天呢。',
            bodyColor: '#8d6e63',
            type: 'townsfolk',
            workLocation: 'east_street'
        },

        si_shu_xiansheng: {
            id: 'si_shu_xiansheng',
            name: '私塾先生',
            personality: { social: 45, curiosity: 80, emotion: 50, diligence: 70, adventure: 25, warmth: 50, humor: 40, stubbornness: 55, caution: 65, patience: 85, pride: 70, loyalty: 60 },
            homeLocation: 'academy',
            favoriteLocation: 'academy',
            moodEmoji: '📖',
            bodyColor: '#90a4ae',
            greeting: '学而时习之……哦，是你啊，请坐。',
            type: 'townsfolk',
            workLocation: 'academy'
        },

        guafu_ma: {
            id: 'guafu_ma',
            name: '寡妇马',
            personality: { social: 30, curiosity: 35, emotion: 55, diligence: 90, adventure: 15, warmth: 35, humor: 20, stubbornness: 45, caution: 80, patience: 60, pride: 45, loyalty: 55 },
            homeLocation: 'south_street',
            favoriteLocation: 'riverside',
            moodEmoji: '🧺',
            bodyColor: '#a1887f',
            greeting: '衣服洗完了，正好歇歇脚。',
            type: 'townsfolk',
            workLocation: null
        },

        // ── 茶馆 ──────────────────────────────────────────

        a_fu: {
            id: 'a_fu',
            name: '阿福',
            personality: { social: 65, curiosity: 45, emotion: 60, diligence: 95, adventure: 10, warmth: 80, humor: 55, stubbornness: 25, caution: 30, patience: 65, pride: 20, loyalty: 80 },
            homeLocation: 'teahouse',
            favoriteLocation: 'teahouse',
            moodEmoji: '🍵',
            bodyColor: '#ffe0b2',
            greeting: '客官里面坐！今天有新到的碧螺春！',
            type: 'teahouse_staff',
            workLocation: 'teahouse',
            // 个人对话微调（覆盖类型默认）
            personalDialogue: {
                openings: {
                    mid: ['客官里面请诶！', '来了啊，坐！今天有新茶诶！', '快坐快坐，我给你沏茶诶！'],
                    high: ['诶！客官快来！今天好茶诶！', '今天热闹诶！快来快来！']
                },
                topics: {
                    idle: ['闲着没事，数数茶叶罐子诶。', '今天没什么客人，就坐门口看看街诶。'],
                    rainy: ['下雨天泡茶最好了诶，水汽足。', '外头雨大，进来喝杯热茶诶！', '雨天客人少，正好歇歇诶。'],
                    stormy: ['暴风雨天，一个客人都没有诶。', '这雷打得，茶杯都在抖诶。'],
                    snowy: ['下雪天来杯热茶最舒服了诶！', '冷吧诶？来来来，靠近火盆坐！'],
                    sunny: ['天好客人多诶！', '好天气配好茶诶，客官来一杯？']
                },
                closings: {
                    friend: ['明天还来啊诶，我给你留最好的茶！', '别走太久诶，茶馆没你冷清！']
                },
                intentReplies: {
                    listen: ['是啊诶，我也听人这么说来着。', '嗯诶，你说得在理。'],
                    comfort: ['没事没事诶，有你这句话就好了。'],
                    share_joy: ['哈哈！那可太好了诶！', '恭喜恭喜诶！得请您喝杯好茶！'],
                    help: ['没问题诶，包在我身上！'],
                    encourage: ['有您这句话诶，我干劲十足！'],
                    accompany: ['那敢情好诶！我给你沏壶好茶！', '你坐诶，我给你拿点心。'],
                    default: ['嗯诶，您说得对。', '是啊诶，我也这么觉得。']
                }
            }
        },

        yunxi: {
            id: 'yunxi',
            name: '云溪',
            personality: { social: 70, curiosity: 90, emotion: 65, diligence: 50, adventure: 85, warmth: 75, humor: 65, stubbornness: 20, caution: 25, patience: 50, pride: 30, loyalty: 70 },
            homeLocation: 'north_cabin',
            favoriteLocation: 'back_mountain',
            moodEmoji: '🌿',
            bodyColor: '#aed581',
            greeting: '嘿！你来了！我正想去山里转转呢！',
            type: 'townsfolk',
            workLocation: 'back_mountain',
            personalDialogue: {
                openings: {
                    mid: ['嘿，你来啦！', '正好，我在这儿呢！', '哟，是你呀！'],
                    high: ['太好了太好了！你来了！', '哈哈！正想你呢！', '快快快，我跟你说个事！']
                },
                topics: {
                    idle: ['闲着没事，数数蚂蚁也挺好玩的。', '就这样坐着，也挺好。'],
                    rainy: ['雨好大啊，我差点回不来！', '雨天的山里特别安静，只听得见雨声。', '雨打在叶子上好好听。'],
                    stormy: ['打雷了好吓人！我不敢出门了！', '暴风雨的时候山里很危险，不能去。'],
                    snowy: ['下雪了！好漂亮！我们去堆雪人吧！', '雪地里的脚印好好看，像画一样。'],
                    sunny: ['今天太阳真好，适合去山里转转！', '阳光暖洋洋的，晒得人想睡觉。']
                },
                closings: {
                    friend: ['明天还来啊，我等你！', '记得常来找我！', '路上小心啊！']
                },
                intentReplies: {
                    listen: ['嗯，我在听呢，你继续说。', '哇，真的吗？那后来呢？'],
                    comfort: ['别担心，有我在呢！', '你别难过啦，我陪你。'],
                    share_joy: ['太好了！我就知道你能行！', '哈哈！恭喜恭喜！'],
                    help: ['我来帮你！我力气可大了！', '没问题，交给我吧！'],
                    encourage: ['加油加油！你一定行的！', '别怕，有我给你撑腰！'],
                    accompany: ['太好了！我正想找人说说话呢！', '你陪我坐会儿？我给你讲山里的故事。'],
                    default: ['嗯，你说得对。', '是啊，我也这么觉得。']
                }
            }
        },

        // ── 隐藏 ──────────────────────────────────────────

        liulang_mao: {
            id: 'liulang_mao',
            name: '流浪猫',
            personality: { social: 5, curiosity: 95, emotion: 20, diligence: 5, adventure: 95, warmth: 10, humor: 5, stubbornness: 90, caution: 95, patience: 10, pride: 5, loyalty: 5 },
            homeLocation: 'rooftop',
            favoriteLocation: 'rooftop',
            moodEmoji: '🐱',
            bodyColor: '#ffcc80',
            greeting: '喵。',
            type: 'animal_cat',
            workLocation: null,
            isAnimal: true,
            // 猫叫声库：根据情绪/好感度/天气选择
            animalSounds: {
                greeting: {
                    stranger: ['喵。', '……', '嘶——！'],
                    acquaintance: ['喵~', '喵呜~', '咪？'],
                    friend: ['喵呜~~', '呼噜呼噜……', '咪咪！']
                },
                mood: {
                    happy: ['喵呜~', '呼噜呼噜……', '咪~'],
                    neutral: ['喵。', '……', '咪。'],
                    sad: ['呜……', '喵……', '……'],
                    angry: ['嘶——！', '哈——！', '喵！！'],
                    scared: ['喵！！', '呜呜……', '……！']
                },
                weather: {
                    rainy: ['喵……（缩在屋檐下）', '呜……（抖了抖毛）', '……（舔湿了的爪子）'],
                    sunny: ['喵~（眯着眼晒太阳）', '……（翻了个身）', '咪~（伸懒腰）'],
                    snowy: ['喵……（缩成一团）', '呜……（抖了抖雪）'],
                    stormy: ['喵！！（躲进角落）', '呜呜……（竖起毛）']
                },
                action: [
                    '（蹭了蹭你的腿）喵~',
                    '（竖起尾巴走过）咪~',
                    '（歪头看你）喵？',
                    '（舔了舔爪子）……',
                    '（打了个哈欠）喵……',
                    '（突然跳开）咪！',
                    '（蹲在墙头看你）喵。',
                    '（追着什么东西跑）喵喵喵！',
                    '（翻肚皮）咪~',
                    '（用头蹭你的手）呼噜呼噜……',
                    '（叼来一只虫子放你脚边）喵！',
                    '（蹲在门口不让你走）喵……',
                    '（跳到你肩上）咪~',
                    '（用爪子拍你的手）喵！',
                    '（蜷在你旁边）呼噜呼噜……'
                ]
            },
            // 猫行为模式：影响soul_tick的决策
            animalBehaviors: {
                // 时间段行为偏好
                schedule: {
                    dawn: ['patrol', 'hunt'],       // 黎明：巡逻、捕猎
                    morning: ['sunbathe', 'groom'], // 上午：晒太阳、理毛
                    midday: ['nap', 'sunbathe'],    // 正午：午睡、晒太阳
                    afternoon: ['patrol', 'explore'],// 下午：巡逻、探索
                    evening: ['hunt', 'play'],      // 傍晚：捕猎、玩耍
                    night: ['patrol', 'hunt'],      // 夜晚：巡逻、捕猎
                    late_night: ['nap', 'patrol']   // 深夜：小睡、巡逻
                },
                // 天气影响
                weatherBehavior: {
                    rainy: ['shelter', 'groom', 'nap'],     // 下雨：躲雨、理毛、睡觉
                    stormy: ['shelter', 'hide'],             // 暴风雨：躲藏
                    snowy: ['shelter', 'warm_up', 'nap'],   // 下雪：取暖、睡觉
                    sunny: ['sunbathe', 'play', 'explore'], // 晴天：晒太阳、玩耍、探索
                    clear: ['patrol', 'hunt', 'explore']    // 晴朗：巡逻、捕猎、探索
                },
                // 好感度影响行为
                affinityBehavior: {
                    low: ['avoid', 'watch', 'hiss'],        // 低好感：躲避、观察、哈气
                    mid: ['watch', 'approach', 'beg'],      // 中好感：观察、靠近、讨食
                    high: ['rub', 'purr', 'follow', 'gift'] // 高好感：蹭人、呼噜、跟随、送礼物
                },
                // 地点偏好
                locationPreference: {
                    favorite: ['rooftop', 'wall', 'market'],   // 喜欢高处和市场（找吃的）
                    shelter: ['rooftop', 'teahouse_door'],     // 躲雨地点
                    avoid: ['forge', 'forest_deep']            // 避开铁铺（吵）和深林
                }
            }
        },

        shenmi_laoren: {
            id: 'shenmi_laoren',
            name: '神秘老人',
            personality: { social: 15, curiosity: 90, emotion: 10, diligence: 20, adventure: 100, warmth: 15, humor: 25, stubbornness: 80, caution: 85, patience: 90, pride: 80, loyalty: 40 },
            homeLocation: 'old_well',
            favoriteLocation: 'old_well',
            moodEmoji: '🌀',
            bodyColor: '#b0bec5',
            greeting: '年轻人……你来了。',
            type: 'hidden',
            workLocation: null
        },

        // ── 三界NPC（仅在对应界域出现）──────────────────────

        yan_lord: {
            id: 'yan_lord',
            name: '焰主',
            personality: { social: 40, curiosity: 60, emotion: 30, diligence: 80, adventure: 50, warmth: 25, humor: 30, stubbornness: 85, caution: 40, patience: 35, pride: 95, loyalty: 30 },
            homeLocation: 'teahouse',
            favoriteLocation: 'teahouse',
            moodEmoji: '🔥',
            bodyColor: '#c62828',
            greeting: '哼，人界的茶……倒也凑合。',
            type: 'hidden',
            workLocation: null
        },

        ling_nvx: {
            id: 'ling_nvx',
            name: '灵女',
            personality: { social: 70, curiosity: 80, emotion: 60, diligence: 50, adventure: 40, warmth: 65, humor: 45, stubbornness: 30, caution: 55, patience: 75, pride: 40, loyalty: 80 },
            homeLocation: 'teahouse',
            favoriteLocation: 'teahouse',
            moodEmoji: '💧',
            bodyColor: '#1565c0',
            greeting: '这里的茶香……和灵泉一样清冽。',
            type: 'hidden',
            workLocation: null
        },

        xian_zun: {
            id: 'xian_zun',
            name: '仙尊',
            personality: { social: 20, curiosity: 95, emotion: 10, diligence: 90, adventure: 30, warmth: 10, humor: 15, stubbornness: 90, caution: 80, patience: 95, pride: 90, loyalty: 50 },
            homeLocation: 'teahouse',
            favoriteLocation: 'teahouse',
            moodEmoji: '☁️',
            bodyColor: '#f9a825',
            greeting: '三界茶守……原来如此。',
            type: 'hidden',
            workLocation: null
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  决策规则 — 8条
    // ═══════════════════════════════════════════════════════════

    var DECISION_RULES = [

        // 规则1：社交需求高 → 去茶馆/酒楼
        {
            id: 'social_high',
            name: '社交需求旺盛',
            condition: function(state, profile) {
                return state.socialNeed > 60;
            },
            resolve: function(state, profile) {
                return pick(['teahouse', 'tavern', 'market']);
            }
        },

        // 规则2：探索欲高 → 去后山/溪边/古井
        {
            id: 'explore_high',
            name: '探索欲旺盛',
            condition: function(state, profile) {
                return state.exploreDesire > 60;
            },
            resolve: function(state, profile) {
                return pick(['back_mountain', 'riverside', 'old_well']);
            }
        },

        // 规则3：心情低 → 去酒楼/祠堂
        {
            id: 'mood_low',
            name: '心情低落',
            condition: function(state, profile) {
                return state.mood < 30;
            },
            resolve: function(state, profile) {
                return pick(['tavern', 'shrine', 'riverside']);
            }
        },

        // 规则4：肚子饿 → 去集市/酒楼
        {
            id: 'hungry',
            name: '腹中空空',
            condition: function(state, profile) {
                return state.hunger < 40;
            },
            resolve: function(state, profile) {
                return pick(['market', 'tavern', 'teahouse']);
            }
        },

        // 规则5：勤劳且上午 → 去工作地点
        {
            id: 'diligent_work',
            name: '勤劳工作',
            condition: function(state, profile) {
                var period = getCurrentPeriod();
                return profile.personality.diligence > 70 && (period === 'morning' || period === 'dawn') && profile.workLocation;
            },
            resolve: function(state, profile) {
                return profile.workLocation;
            }
        },

        // 规则6：好奇心强 → 去书院/古井
        {
            id: 'curious',
            name: '好奇心驱使',
            condition: function(state, profile) {
                return profile.personality.curiosity > 70;
            },
            resolve: function(state, profile) {
                return pick(['academy', 'old_well', 'library']);
            }
        },

        // 规则7：冒险心强 → 去宗门山门/官道
        {
            id: 'adventurous',
            name: '冒险心驱使',
            condition: function(state, profile) {
                return profile.personality.adventure > 70;
            },
            resolve: function(state, profile) {
                return pick(['sect_gate', 'official_road', 'back_mountain']);
            }
        },

        // 规则8：默认 → 喜欢的地方(70%) 或 随机(30%)
        {
            id: 'default',
            name: '日常去处',
            condition: function() { return true; },
            resolve: function(state, profile) {
                var allLocations = [
                    'teahouse', 'tavern', 'market', 'dock', 'forge',
                    'workshop', 'kitchen', 'academy', 'library', 'shrine',
                    'back_mountain', 'riverside', 'old_well', 'sect_gate',
                    'official_road', 'bridge', 'herb_garden', 'east_street',
                    'south_street', 'west_alley', 'north_cabin', 'rooftop'
                ];
                if (Math.random() < 0.7) {
                    return profile.favoriteLocation;
                }
                return pick(allLocations);
            }
        }
    ];

    // ═══════════════════════════════════════════════════════════
    //  对话系统 — 上下文感知
    // ═══════════════════════════════════════════════════════════

    // ── 开头语（按心情分3类）──

    var OPENINGS = {
        low: [
            '唉……', '今天真是不顺……', '别提了……',
            '心里堵得慌……', '烦……', '没什么心情说话……',
            '你说这日子……', '唉，不想说话……', '心里头闷闷的……',
            // 新增11条
            '今天心里不痛快……', '唉，倒霉事一桩接一桩。',
            '别问了，烦着呢。', '今天诸事不顺。',
            '心里头沉甸甸的。', '唉，不想提今天的事。',
            '烦心事一堆。', '今天真够呛。',
            '心里五味杂陈的。', '唉，人倒霉喝凉水都塞牙。'
        ],
        mid: [
            '嗯，你好。', '来了啊。', '今天还行。', '哦，是你。',
            '坐吧。', '正好，歇会儿。', '嗯，没什么事。', '还行吧。',
            // 新增12条
            '哟，来了。', '嗯，坐。', '今天没什么特别。',
            '还行，老样子。', '来了？坐。', '嗯，你来了。',
            '今天平淡。', '没什么大事。', '嗯，还好。',
            '来了就好。', '坐坐吧。', '嗯。'
        ],
        high: [
            '嘿！你好啊！', '今天真不错！', '来来来！',
            '哈哈，见到你真高兴！', '今天运气好！', '心情好着呢！',
            '哟！稀客稀客！', '正好正好，来坐！',
            // 新增12条
            '哎呀！你来得正好！', '今天心情美！',
            '哈哈！今天真顺！', '哟！稀客！快坐！',
            '见到你心情都好了！', '今天事事顺心！',
            '来来来，今天好！', '哈哈，正想你呢！',
            '今天走路都带风！', '哟！来了来了！',
            '心情好，看啥都顺眼！', '今天福气旺！'
        ]
    };

    // ── 话题（按状态分5种）──

    var TOPICS = {
        social_high: [
            '最近都没怎么跟人说话，闷得慌。',
            '你有没有觉得，有时候就想找个人聊聊天？',
            '好些日子没这么热闹了，真舒坦。',
            '人啊，总得有人说说话才好。',
            '今天能碰到你，真好。',
            // 新增10条
            '一个人待久了，话都不会说了。',
            '有时候就想找人说说话，不管说啥都行。',
            '今天总算有人陪我聊了，痛快。',
            '闷了好多天了，今天可算开张了。',
            '你来了正好，我憋了一肚子话。',
            '有人说话的日子才像个日子。',
            '今天聊得真尽兴。',
            '好久没这么痛快聊过了。',
            '有人听我说话，心里舒坦。',
            '今天话匣子打开了，收不住。'
        ],
        explore_high: [
            '我总觉得这镇上还有不少没去过的地方。',
            '你有没有发现什么新鲜事？',
            '最近总觉得该出去走走，老待一个地方没意思。',
            '听说那边好像有点不一样了？',
            '我昨天发现了一条没走过的小路！',
            // 新增10条
            '老待在一个地方，人都生锈了。',
            '最近腿痒，想出去转转。',
            '听说镇东头开了家新店，去看看？',
            '今天想往远处走走。',
            '老在这几条街转，没意思。',
            '想去没去过的地方看看。',
            '最近总想着往外跑。',
            '你有没有去过镇外那条河？',
            '今天天气好，适合出去逛逛。',
            '听说后山有新鲜事，想去看看。'
        ],
        hungry: [
            '你闻到什么香味没有？我肚子都在叫了。',
            '今天还没好好吃东西呢……',
            '有什么吃的没？饿得前胸贴后背了。',
            '这味道……是隔壁在做饭吧？',
            '人一饿，啥心思都没了。',
            // 新增10条
            '肚子咕咕叫，丢人。',
            '今天忙得忘了吃饭。',
            '饿得头晕眼花的。',
            '闻到饭味就走不动道。',
            '今天到现在还没吃东西。',
            '饿得心慌。',
            '有吃的没？先垫垫。',
            '饿得前胸贴后背。',
            '今天饭点都过了。',
            '饿得不行了，有啥吃的没？'
        ],
        tired: [
            '今天干了不少活，累得慌。',
            '真想找个地方好好歇歇。',
            '这身子骨，不如从前了。',
            '忙了一天，腿都软了。',
            '累是累了点，不过心里踏实。',
            // 新增10条
            '今天累得够呛。',
            '腰酸背痛的。',
            '累得不想动弹。',
            '今天活儿多，累瘫了。',
            '腿跟灌了铅似的。',
            '累得眼睛都睁不开。',
            '今天真累，不想说话。',
            '累得直想躺着。',
            '今天忙一天，散架了。',
            '累，但充实。'
        ],
        idle: [
            '今天天气不错，适合发呆。',
            '没什么事，就随便走走。',
            '日子嘛，平平淡淡也挺好。',
            '闲着也是闲着，出来转转。',
            '有时候什么都不做，也挺好的。',
            // 新增10条
            '今天闲得发慌。',
            '没事干，出来晒晒太阳。',
            '闲着无聊，到处转转。',
            '今天没什么事，清闲。',
            '闲着也是闲着。',
            '今天难得清闲。',
            '没事，就坐坐。',
            '今天闲，随便看看。',
            '闲着没事，发发呆。',
            '今天没什么事，歇着。'
        ],
        // ── 天气专属话题（通用） ──
        rainy: [
            '下雨了，你带伞了没？',
            '这雨下得真不小啊。',
            '下雨天就适合待在屋里。',
            '雨天的味道，你闻到了没？泥土味。',
            '这雨什么时候能停啊。',
            // 新增10条
            '下雨天客人少，清静。',
            '雨下得烦人。',
            '下雨路滑，小心点。',
            '雨天适合喝茶。',
            '这雨下得没完没了。',
            '下雨天闷得慌。',
            '雨天湿气重。',
            '下雨了，早点回去吧。',
            '雨天适合睡觉。',
            '这雨来得突然。'
        ],
        stormy: [
            '暴风雨来了，千万别出门！',
            '打雷了，吓我一跳。',
            '这天气，出门太危险了。',
            // 新增7条
            '雷雨交加的，吓人。',
            '暴风雨，待在屋里最安全。',
            '打雷闪电的，别出去。',
            '这暴风雨来势汹汹。',
            '雷打得真响。',
            '暴风雨天，没事别出门。',
            '这天气吓人。'
        ],
        snowy: [
            '下雪了！好漂亮。',
            '雪天路滑，走路小心点。',
            '冷死了，得多穿点。',
            // 新增7条
            '雪下得不小啊。',
            '雪天适合吃热乎的。',
            '下雪了，年味有了。',
            '雪景真美。',
            '雪天冷，注意保暖。',
            '下雪了，路上慢点。',
            '雪天窝屋里最舒服。'
        ],
        sunny: [
            '今天天气真好，心情都好了。',
            '太阳出来了，暖和。',
            '这么好的天，不出来走走可惜了。',
            // 新增7条
            '天好，适合出门。',
            '阳光明媚，舒坦。',
            '今天天好，心情也好。',
            '这么好的天，别浪费了。',
            '天好，适合晒太阳。',
            '今天天气真不错。',
            '好天气，好心情。'
        ]
    };

    // ── 结束语（按关系分3种）──

    var CLOSINGS = {
        stranger: [
            '那……我先走了。', '嗯，再会。', '告辞了。',
            '打扰了。', '嗯，就这样吧。'
        ],
        acquaintance: [
            '有空再来坐坐。', '下次聊！', '回头见啊。',
            '改天一起喝茶。', '慢走啊。'
        ],
        friend: [
            '明天还来啊，我等你！', '记得常来！', '咱们下次再聊！',
            '路上小心啊！', '别走太久，我会想你的！',
            '明天见！我请你喝茶！'
        ]
    };

    // ── 昨日追忆 ──

    var YESTERDAY_MEMORIES = [
        '对了，昨天的事你还记得吗？',
        '昨天好像也是这样的天气。',
        '昨天碰到件有意思的事……',
        '昨天晚上我还在想呢……',
        '跟昨天比，今天感觉不太一样。'
    ];

    // ── 各类型NPC对话风格定制 ──

    var TYPE_DIALOGUE_STYLE = {
        teahouse_regular: {
            low: ['这茶怎么喝着不是味儿……', '唉，连茶都泡不好……', '今天没心情喝茶……'],
            mid: ['来杯茶？今天这批还行。', '坐坐，喝口茶。', '今天茶不错，来一壶？', '又来喝茶了？坐。'],
            high: ['今儿个茶好！来来来！', '哈哈！有好茶有好伴！', '今天茶香！你来得正好！'],
            // 类型专属话题
            topics: {
                idle: ['今天没来几个喝茶的，闲。', '坐这儿看看街也挺好。', '茶馆里就这点好处，坐着没人管。'],
                rainy: ['下雨天喝茶最舒服了。', '雨天客人少，清静。', '下雨了，来杯热茶？'],
                snowy: ['冷天喝热茶，舒坦。', '下雪天坐茶馆，美。'],
                sunny: ['天好，坐窗边喝茶最惬意。', '今天适合在茶馆门口晒太阳。']
            }
        },
        sect_outer: {
            low: ['修炼不顺……', '道心不稳……', '今天练功总差一口气……'],
            mid: ['今日功课做完了。', '嗯，一切如常。', '师门日子，平平淡淡。', '刚做完功课，歇会儿。'],
            high: ['今天悟了点东西！', '师门日子，充实！', '练功顺利，心情不错！'],
            topics: {
                idle: ['今天没什么事，出来走走。', '师门清闲，难得。', '闲着就出来转转。'],
                rainy: ['下雨天没法练功。', '雨天适合在屋里看书。', '下雨了，今天就在屋里待着吧。'],
                snowy: ['下雪天冷，练功都提不起劲。', '雪天路滑，少出门。'],
                sunny: ['天气好，适合练功。', '今天天好，出去走走。']
            }
        },
        wanderer: {
            low: ['……', '别管我。', '……没什么好说的。'],
            mid: ['嗯。', '……还行。', '路过。', '……你有什么事？'],
            high: ['嘿！', '今天运气不错。', '嗯，还行。', '……你来了。'],
            topics: {
                idle: ['……没事。', '……随便走走。', '……嗯。'],
                rainy: ['……下雨了。', '……雨天麻烦。'],
                snowy: ['……冷。', '……雪大。'],
                sunny: ['……天不错。', '……嗯。']
            }
        },
        merchant: {
            low: ['生意不好做啊……', '今天没什么客人……', '唉，东西卖不动……'],
            mid: ['来看看？', '生意还行。', '今天有新货。', '客官要点什么？'],
            high: ['客官来啦！', '今天生意不错！', '新到了好货，您看看！'],
            topics: {
                idle: ['今天没什么客人。', '闲着也是闲着，收拾收拾铺子。', '没什么生意，坐门口看看街。'],
                rainy: ['下雨天客人更少了。', '雨天没法摆摊。', '下雨了，早点收摊吧。'],
                snowy: ['下雪天没人出门。', '冷天生意难做。'],
                sunny: ['天好客人多！', '今天适合出摊。']
            }
        },
        artisan: {
            low: ['这手艺……唉……', '怎么都不对……', '今天手感差……'],
            mid: ['还在干活。', '嗯，忙。', '手头有活儿。', '正干着呢。'],
            high: ['今天手感不错！', '做出来的东西自己都满意！', '今天干得顺手！'],
            topics: {
                idle: ['今天没活儿。', '闲着就磨磨工具。', '没活儿的时候收拾收拾。'],
                rainy: ['下雨天干不了活。', '雨天材料潮。', '下雨就歇着吧。'],
                snowy: ['冷天干活手僵。', '下雪天窝在屋里。'],
                sunny: ['天好干活利索。', '今天适合赶活儿。']
            }
        },
        townsfolk: {
            low: ['日子不好过啊……', '唉……', '今天不太顺……'],
            mid: ['还行吧。', '过日子嘛。', '嗯，没什么事。', '今天跟平时一样。'],
            high: ['今天挺顺的！', '日子有盼头！', '今天心情不错！'],
            topics: {
                idle: ['没什么事，出来转转。', '闲着也是闲着。', '今天没什么事。'],
                rainy: ['下雨了，你带伞没？', '雨天就适合待在屋里。', '这雨下得不小。'],
                snowy: ['下雪了，路滑小心。', '冷死了，得多穿点。'],
                sunny: ['今天天气真好。', '天好，出来走走。']
            }
        },
        teahouse_staff: {
            low: ['今天客人少……', '唉，闲得慌。', '茶都凉了也没人来……'],
            mid: ['客官里面请。', '欢迎光临。', '今天有新茶。', '快坐，我给你沏茶。'],
            high: ['今天热闹！', '客官快来！有好茶！', '生意好，心情也好！'],
            topics: {
                idle: ['今天没什么客人。', '闲着就擦擦茶具。', '没客人的时候就研究研究新茶。'],
                rainy: ['下雨天客人少，正好歇歇。', '雨天泡茶最好了，水汽足。', '外头雨大，进来喝杯热茶？'],
                snowy: ['下雪天来杯热茶最舒服了。', '冷天喝热茶，暖和。'],
                sunny: ['天好客人多！', '好天气配好茶。']
            }
        },
        hidden: {
            low: ['……', '……无趣。'],
            mid: ['……嗯。', '……你来了。'],
            high: ['……有意思。', '……今天不错。'],
            topics: {
                idle: ['……', '……嗯。'],
                rainy: ['……雨。'],
                snowy: ['……冷。'],
                sunny: ['……嗯。']
            }
        },
        // 动物类型：猫 — 只有叫声和动作，没有人类语言
        animal_cat: {
            low: ['喵。', '……', '嘶——！'],
            mid: ['喵~', '咪？', '喵呜~'],
            high: ['喵呜~~', '呼噜呼噜……', '咪咪！'],
            topics: {
                idle: ['喵。', '……', '咪。'],
                rainy: ['喵……', '呜……'],
                snowy: ['喵……', '呜……'],
                sunny: ['喵~', '咪~'],
                stormy: ['喵！！', '呜呜……']
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  内部状态存储
    // ═══════════════════════════════════════════════════════════

    var _dailyStates = {};   // npcId → 当日状态
    var _yesterdayMoods = {}; // npcId → 昨日心情
    var _yesterdayAngerLevels = {}; // npcId → 昨日愤怒值（跨日衰减用）
    var _customRules = [];    // 自定义决策规则
    var _customDialogueHints = []; // 自定义对话提示

    // ═══════════════════════════════════════════════════════════
    //  动物NPC对话系统（只有叫声+动作，没有人类语言）
    // ═══════════════════════════════════════════════════════════

    /**
     * 生成动物NPC的初始对话（叫声+动作）
     * @param {string} npcId - NPC的ID
     * @param {object} profile - NPC配置
     * @param {string} relation - 关系: 'stranger' / 'acquaintance' / 'friend'
     * @returns {object} 对话内容 { opening, topic, closing, memory, fullDialogue }
     */
    function _generateAnimalDialogue(npcId, profile, relation) {
        var sounds = profile.animalSounds;
        var state = _dailyStates[npcId];
        var mood = state ? state.mood : 50;
        var rel = (window.getRel) ? getRel(npcId) : 0;

        // 好感度决定招呼叫声
        var greetLevel = rel >= 60 ? 'friend' : (rel >= 30 ? 'acquaintance' : 'stranger');
        var opening = pick(sounds.greeting[greetLevel] || sounds.greeting.stranger);

        // 话题：天气优先(85%)，其次心情
        var topic = '';
        var weather = (window.GameTime) ? GameTime.getWeather() : 'sunny';
        if ((weather === 'rainy' || weather === 'stormy' || weather === 'snowy') && sounds.weather && sounds.weather[weather] && Math.random() < 0.85) {
            topic = pick(sounds.weather[weather]);
        } else if (sounds.mood) {
            var moodKey = mood > 65 ? 'happy' : (mood > 35 ? 'neutral' : (mood > 15 ? 'sad' : 'angry'));
            topic = pick(sounds.mood[moodKey] || sounds.mood.neutral);
        }

        // 结束语：随机动作
        var closing = pick(sounds.action || ['……']);

        var parts = [opening];
        if (topic) parts.push(topic);
        if (closing) parts.push(closing);

        return {
            opening: opening,
            topic: topic,
            closing: closing,
            memory: null,
            fullDialogue: parts.join(' ')
        };
    }

    /**
     * 生成动物NPC的后续回复（叫声+动作反应）
     * @param {string} npcId - NPC的ID
     * @param {string} playerOption - 玩家选项文本
     * @param {object} dlgCtx - 对话上下文
     * @returns {string} 动物回复文本
     */
    function _generateAnimalReply(npcId, playerOption, dlgCtx) {
        var profile = NPC_PROFILES[npcId];
        if (!profile || !profile.animalSounds) return '……';
        var sounds = profile.animalSounds;
        var state = _dailyStates[npcId];
        var mood = state ? state.mood : 50;
        var rel = (window.getRel) ? getRel(npcId) : 0;

        // 去重：避免重复最近3条回复
        var recent = (dlgCtx && dlgCtx.recentUtterances) ? dlgCtx.recentUtterances.slice(-3) : [];
        function dedupPick(arr) {
            if (!arr || arr.length === 0) return '';
            var tries = 0;
            while (tries < 8) {
                var s = pick(arr);
                if (!s || recent.indexOf(s) < 0) return s;
                tries++;
            }
            return pick(arr); // fallback
        }

        // 检测玩家语气
        var pText = (typeof playerOption === 'string') ? playerOption : '';
        var isGentle = /摸|喂|乖|轻轻|小鱼|逗|抱|拍/.test(pText);
        var isLoud = /走开|滚|打|踢|吵|别叫/.test(pText);

        // 1) 玩家大声/凶 → 害怕叫声
        if (isLoud && sounds.mood && sounds.mood.scared) {
            return dedupPick(sounds.mood.scared);
        }

        // 2) 玩家温柔 → 亲昵动作
        if (isGentle && rel >= 30) {
            var affectionActions = sounds.action.filter(function(a) {
                return /蹭|呼噜|翻肚|舔|靠|咪/.test(a);
            });
            if (affectionActions.length > 0) {
                return dedupPick(affectionActions);
            }
        }

        // 3) 天气相关叫声(50%)
        var weather = (window.GameTime) ? GameTime.getWeather() : 'sunny';
        if ((weather === 'rainy' || weather === 'stormy' || weather === 'snowy') && sounds.weather && sounds.weather[weather] && Math.random() < 0.5) {
            return dedupPick(sounds.weather[weather]);
        }

        // 4) 随机动作(40%)
        if (sounds.action && Math.random() < 0.4) {
            return dedupPick(sounds.action);
        }

        // 5) 心情叫声
        var moodKey = mood > 65 ? 'happy' : (mood > 35 ? 'neutral' : (mood > 15 ? 'sad' : 'angry'));
        if (sounds.mood && sounds.mood[moodKey]) {
            return dedupPick(sounds.mood[moodKey]);
        }

        return dedupPick(sounds.greeting.stranger) || _getDefaultAnimalSound(profile.type);
    }

    /**
     * 根据动物类型返回默认叫声（fallback）
     */
    function _getDefaultAnimalSound(animalType) {
        var defaults = {
            'animal_cat': '喵。',
            'animal_dog': '汪。',
            'animal_bird': '啾。',
            'animal_chicken': '咯。',
            'animal_cow': '哞。',
            'animal_horse': '嘶。',
            'animal_fish': '……'
        };
        return defaults[animalType] || '……';
    }

    /**
     * 生成动物NPC的玩家选项（基于好感度和动物类型的互动方式）
     * @param {string} npcId - NPC的ID
     * @param {string} npcText - NPC上一句话
     * @param {object} state - NPC状态
     * @param {string} relation - 关系
     * @returns {Array} 玩家选项列表
     */
    function _generateAnimalOptions(npcId, npcText, state, relation) {
        var profile = NPC_PROFILES[npcId];
        if (!profile) return [{ playerOption: '离开', intent: 'leave' }];
        var rel = (window.getRel) ? getRel(npcId) : 0;
        var animalType = profile.type || 'animal_cat';
        var options = [];

        // 根据动物类型获取互动选项模板
        var templates = _getAnimalOptionTemplates(animalType);

        if (rel >= 60) {
            options = templates.high.slice();
        } else if (rel >= 30) {
            options = templates.mid.slice();
        } else {
            options = templates.low.slice();
        }

        // 检测NPC害怕 → 加安抚选项
        if (/嘶|跑|躲|吓|呜呜/.test(npcText)) {
            options[0] = { playerOption: '别怕别怕', intent: 'comfort' };
        }

        // 检测NPC亲昵 → 加回应选项
        if (/蹭|呼噜|翻肚|舔|靠|摇尾/.test(npcText)) {
            options[0] = { playerOption: templates.careAction, intent: 'care' };
        }

        // 固定离开选项
        options.push({ playerOption: '离开', intent: 'leave' });

        return options;
    }

    /**
     * 根据动物类型获取互动选项模板
     */
    function _getAnimalOptionTemplates(animalType) {
        var templates = {
            'animal_cat': {
                high: [
                    { playerOption: '摸摸头', intent: 'care' },
                    { playerOption: '喂点小鱼干', intent: 'care' },
                    { playerOption: '逗它玩', intent: 'tease' }
                ],
                mid: [
                    { playerOption: '轻轻靠近', intent: 'approach' },
                    { playerOption: '蹲下来', intent: 'approach' },
                    { playerOption: '伸出手指', intent: 'approach' }
                ],
                low: [
                    { playerOption: '远远看着', intent: 'observe' },
                    { playerOption: '慢慢靠近', intent: 'approach' },
                    { playerOption: '轻声说话', intent: 'approach' }
                ],
                careAction: '轻轻抚摸'
            },
            'animal_dog': {
                high: [
                    { playerOption: '摸摸头', intent: 'care' },
                    { playerOption: '喂根骨头', intent: 'care' },
                    { playerOption: '扔个树枝', intent: 'tease' }
                ],
                mid: [
                    { playerOption: '蹲下来', intent: 'approach' },
                    { playerOption: '伸出手', intent: 'approach' },
                    { playerOption: '叫它名字', intent: 'approach' }
                ],
                low: [
                    { playerOption: '远远看着', intent: 'observe' },
                    { playerOption: '慢慢靠近', intent: 'approach' },
                    { playerOption: '轻声说话', intent: 'approach' }
                ],
                careAction: '拍拍它'
            },
            'animal_bird': {
                high: [
                    { playerOption: '伸出手', intent: 'care' },
                    { playerOption: '撒点米', intent: 'care' },
                    { playerOption: '吹个口哨', intent: 'tease' }
                ],
                mid: [
                    { playerOption: '静静看着', intent: 'observe' },
                    { playerOption: '慢慢靠近', intent: 'approach' },
                    { playerOption: '伸出手', intent: 'approach' }
                ],
                low: [
                    { playerOption: '远远看着', intent: 'observe' },
                    { playerOption: '不要动', intent: 'observe' },
                    { playerOption: '轻声说话', intent: 'approach' }
                ],
                careAction: '轻轻碰碰'
            },
            'animal_chicken': {
                high: [
                    { playerOption: '撒点谷子', intent: 'care' },
                    { playerOption: '轻轻靠近', intent: 'approach' },
                    { playerOption: '蹲下来看', intent: 'observe' }
                ],
                mid: [
                    { playerOption: '慢慢靠近', intent: 'approach' },
                    { playerOption: '撒点米', intent: 'care' },
                    { playerOption: '蹲下来', intent: 'approach' }
                ],
                low: [
                    { playerOption: '远远看着', intent: 'observe' },
                    { playerOption: '不要动', intent: 'observe' },
                    { playerOption: '轻声说话', intent: 'approach' }
                ],
                careAction: '轻轻摸摸'
            },
            'animal_cow': {
                high: [
                    { playerOption: '摸摸头', intent: 'care' },
                    { playerOption: '喂把草', intent: 'care' },
                    { playerOption: '拍拍背', intent: 'care' }
                ],
                mid: [
                    { playerOption: '慢慢靠近', intent: 'approach' },
                    { playerOption: '伸出手', intent: 'approach' },
                    { playerOption: '轻声说话', intent: 'approach' }
                ],
                low: [
                    { playerOption: '远远看着', intent: 'observe' },
                    { playerOption: '不要惊动它', intent: 'observe' },
                    { playerOption: '绕路走', intent: 'leave' }
                ],
                careAction: '轻轻拍拍'
            },
            'animal_horse': {
                high: [
                    { playerOption: '摸摸鬃毛', intent: 'care' },
                    { playerOption: '喂根胡萝卜', intent: 'care' },
                    { playerOption: '拍拍脖子', intent: 'care' }
                ],
                mid: [
                    { playerOption: '慢慢靠近', intent: 'approach' },
                    { playerOption: '伸出手', intent: 'approach' },
                    { playerOption: '轻声说话', intent: 'approach' }
                ],
                low: [
                    { playerOption: '远远看着', intent: 'observe' },
                    { playerOption: '不要惊动它', intent: 'observe' },
                    { playerOption: '绕路走', intent: 'leave' }
                ],
                careAction: '轻轻抚摸'
            }
        };
        return templates[animalType] || templates['animal_cat'];
    }

    // ═══════════════════════════════════════════════════════════
    //  核心功能
    // ═══════════════════════════════════════════════════════════

    /**
     * 生成NPC每日状态
     * @param {string} npcId - NPC的ID
     * @returns {object} 每日状态对象
     */
    function generateDailyState(npcId) {
        var profile = NPC_PROFILES[npcId];
        if (!profile) return null;

        var p = profile.personality;

        // 心情：昨天基础 + 随机波动(-20~+20) + 季节影响 + 愤怒余波
        var yesterdayMood = _yesterdayMoods[npcId] !== undefined ? _yesterdayMoods[npcId] : 50;
        var moodFluctuation = randInt(-20, 20);
        var seasonEffect = SEASON_MOOD_EFFECT[getCurrentSeason()] || 0;
        var mood = clamp(yesterdayMood + moodFluctuation + seasonEffect, 0, 100);

        // ── 愤怒跨日继承：昨日愤怒值衰减50%继承到今日 ──
        // 愤怒影响次日心情：昨日愤怒越高，今日心情越低
        var yesterdayAnger = _yesterdayAngerLevels[npcId] !== undefined ? _yesterdayAngerLevels[npcId] : 0;
        var inheritedAnger = Math.round(yesterdayAnger * 0.5); // 衰减50%
        if (inheritedAnger > 0) {
            // 愤怒余波影响心情：每10点愤怒降低1点心情
            mood = clamp(mood - Math.round(inheritedAnger / 10), 0, 100);
        }

        // 饱腹：随机40-100
        var hunger = randInt(40, 100);

        // 社交需求：基于社交性 + 随机
        var socialNeed = clamp(Math.round(p.social * 0.6 + randInt(0, 40)), 0, 100);

        // 探索欲：基于冒险心 + 随机
        var exploreDesire = clamp(Math.round(p.adventure * 0.6 + randInt(0, 40)), 0, 100);

        // 疲劳：基于勤劳度反比 + 随机
        var fatigue = clamp(Math.round((100 - p.diligence) * 0.4 + randInt(0, 30)), 0, 100);

        // 档位
        var tier = rollTier();

        // 心情信息
        var moodInfo = getMoodInfo(mood);

        // 临时状态（用于决策）
        var tempState = {
            mood: mood,
            hunger: hunger,
            socialNeed: socialNeed,
            exploreDesire: exploreDesire,
            fatigue: fatigue
        };

        // 决策：根据规则选择去处
        var decidedLocation = decideLocation(tempState, profile);

        // 组装完整状态
        var state = {
            npcId: npcId,
            name: profile.name,
            mood: mood,
            moodLabel: moodInfo.label,
            moodEmoji: moodInfo.emoji,
            hunger: hunger,
            socialNeed: socialNeed,
            exploreDesire: exploreDesire,
            fatigue: fatigue,
            tier: tier,
            decidedLocation: decidedLocation,
            homeLocation: profile.homeLocation,
            favoriteLocation: profile.favoriteLocation,
            bodyColor: profile.bodyColor,
            angerLevel: inheritedAnger, // 愤怒跨日继承（已衰减50%）
            coldTurns: 0,        // 新的一天冷淡期重置
            angerHistory: [],    // 新的一天愤怒历史清空
            generatedAt: new Date().toISOString()
        };

        _dailyStates[npcId] = state;
        
        // 接入灵魂调度脑
        if (window.SoulBridge) {
            state = window.SoulBridge.ensureSchedulerState(state, profile);
        }
        
        return state;
    }

    /**
     * 根据决策规则选择去处
     */
    function decideLocation(state, profile) {
        // 先检查自定义规则
        for (var i = 0; i < _customRules.length; i++) {
            var rule = _customRules[i];
            if (rule.condition(state, profile)) {
                return rule.resolve(state, profile);
            }
        }

        // 按优先级检查内置规则
        for (var j = 0; j < DECISION_RULES.length; j++) {
            if (DECISION_RULES[j].condition(state, profile)) {
                return DECISION_RULES[j].resolve(state, profile);
            }
        }

        // 兜底
        return profile.favoriteLocation;
    }

    /**
     * 生成上下文感知对话
     * @param {string} npcId - NPC的ID
     * @param {string} relation - 关系: 'stranger' / 'acquaintance' / 'friend'
     * @returns {object} 对话内容 { opening, topic, closing, memory, fullDialogue }
     */
    function generateContextDialogue(npcId, relation) {
        var profile = NPC_PROFILES[npcId];
        if (!profile) return null;

        // ── 动物NPC特殊处理：只有叫声+动作，没有人类语言 ──
        if (profile.isAnimal && profile.animalSounds) {
            return _generateAnimalDialogue(npcId, profile, relation);
        }

        var state = _dailyStates[npcId];
        relation = relation || 'stranger';
        var pd = profile.personalDialogue || null; // 个人对话微调
        var typeStyle = TYPE_DIALOGUE_STYLE[profile.type] || TYPE_DIALOGUE_STYLE.townsfolk;

        // 确定心情档位
        var moodLevel = 'mid';
        if (state) {
            if (state.mood < 40) moodLevel = 'low';
            else if (state.mood > 60) moodLevel = 'high';
        }

        // ── 开场白：personalDialogue > typeStyle > OPENINGS ──
        var opening;
        if (pd && pd.openings && pd.openings[moodLevel] && Math.random() < 0.7) {
            opening = pick(pd.openings[moodLevel]);
        } else if (typeStyle[moodLevel] && typeStyle[moodLevel].length > 0 && Math.random() < 0.6) {
            opening = pick(typeStyle[moodLevel]);
        } else {
            opening = pick(OPENINGS[moodLevel]);
        }

        // 话题：根据当前状态选择
        var topicCategory = 'idle';
        if (state) {
            if (state.socialNeed > 60) topicCategory = 'social_high';
            else if (state.exploreDesire > 60) topicCategory = 'explore_high';
            else if (state.hunger < 40) topicCategory = 'hungry';
            else if (state.fatigue > 60) topicCategory = 'tired';
        }

        // ── 天气优先话题 ──
        var weatherTopicCategory = null;
        var currentWeather = (window.GameTime) ? GameTime.getWeather() : null;
        var weatherId = currentWeather ? currentWeather.id : 'clear';
        if (weatherId === 'rainy' || weatherId === 'drizzle') { weatherTopicCategory = 'rainy'; }
        else if (weatherId === 'stormy') { weatherTopicCategory = 'stormy'; }
        else if (weatherId === 'snowy') { weatherTopicCategory = 'snowy'; }
        else if (weatherId === 'sunny' && Math.random() < 0.3) { weatherTopicCategory = 'sunny'; }

        // ── 话题选择优先级：天气 > 状态（恶劣天气90%优先） ──
        var effectiveCategory = (weatherTopicCategory && Math.random() < 0.9) ? weatherTopicCategory : topicCategory;

        // ── 性格偏移：根据personality偏移话题类别 ──
        effectiveCategory = _shiftTopicCategory(profile.personality, effectiveCategory);

        // ── 话题来源：personalDialogue.topics > typeStyle.topics > TOPICS ──
        var topic;
        if (pd && pd.topics && pd.topics[effectiveCategory] && Math.random() < 0.7) {
            topic = pick(pd.topics[effectiveCategory]);
        } else if (typeStyle.topics && typeStyle.topics[effectiveCategory] && Math.random() < 0.6) {
            topic = pick(typeStyle.topics[effectiveCategory]);
        } else {
            topic = pick(TOPICS[effectiveCategory] || TOPICS[topicCategory]);
        }

        // 结束语：personalDialogue.closings > CLOSINGS
        var closing;
        if (pd && pd.closings && pd.closings[relation] && Math.random() < 0.7) {
            closing = pick(pd.closings[relation]);
        } else {
            closing = pick(CLOSINGS[relation] || CLOSINGS.stranger);
        }

        // ── 性格偏移：对开场白、话题、结束语应用personality偏移 ──
        opening = _applyPersonalityShift(npcId, profile, opening, 'opening');
        topic = _applyPersonalityShift(npcId, profile, topic, 'topic');
        closing = _applyPersonalityShift(npcId, profile, closing, 'closing');

        // 30%概率追忆昨日——优先使用真实玩家事件记忆，无记忆时回退到预设短语
        var memory = null;
        if (Math.random() < 0.3) {
            // 优先读取玩家事件记忆（真实记忆）
            var realMemory = '';
            try { realMemory = _readPlayerMemoryForOpening(npcId); } catch (e) { realMemory = ''; }
            if (realMemory) {
                memory = realMemory;
            } else {
                memory = pick(YESTERDAY_MEMORIES);
            }
        }

        // ── NPC主动话题：根据记忆/情绪/关系/性格生成主动开场 ──
        // 优先级：记忆追忆 > 愤怒余气 > 情绪倾诉 > 关系驱动 > 性格驱动
        // 有主动话题时覆盖默认opening，让NPC有自主意识
        var rel = (window.getRel) ? getRel(npcId) : 0;
        var initiativeTopic = '';
        try { initiativeTopic = _generateInitiativeTopic(npcId, profile, state, rel); } catch (e) { initiativeTopic = ''; }
        if (initiativeTopic) {
            opening = initiativeTopic;
            // 主动话题时直接清空memory，避免opening+memory硬拼
            // 理由：initiativeTopic本身已是完整话题，再补memory会导致
            // "来来来，坐会儿！今天能碰到你，真好。"这种前言不搭后语的硬拼
            memory = null;
        }

        // 自定义对话提示
        for (var i = 0; i < _customDialogueHints.length; i++) {
            var hint = _customDialogueHints[i];
            if (hint.npcId === npcId || hint.npcId === '*') {
                if (hint.opening) opening = hint.opening;
                if (hint.topic) topic = hint.topic;
                if (hint.closing) closing = hint.closing;
                break;
            }
        }

        // 开场白组合：opening/topic/memory三选一，不硬拼
        // 理由：opening（简短招呼）、topic（具体话题）、memory（昨日追忆）三者语义无关，
        // 硬拼会导致"今天天气不错，适合发呆。 对了，昨天的事你还记得吗？"这种前言不搭后语
        // realMemory（玩家事件记忆）已在_generateInitiativeTopic优先级0处理，这里不重复
        var fullDialogue;
        if (initiativeTopic) {
            // 有主动话题时（opening已被initiativeTopic覆盖），直接用opening
            fullDialogue = opening;
        } else if (topic) {
            // 无主动话题时，只用topic（具体话题自带完整内容）
            fullDialogue = topic;
        } else if (memory) {
            // 无topic时，用memory（昨日追忆）
            fullDialogue = memory;
        } else {
            fullDialogue = opening || '嗯，今天天气不错，你最近咋样？';
        }

        // 首轮对话不加结束语（结束语留给对话结尾检测系统处理）

        return {
            npcId: npcId,
            name: profile.name,
            opening: opening,
            topic: topic,
            closing: closing,
            memory: memory,
            moodLevel: moodLevel,
            topicCategory: topicCategory,
            relation: relation,
            fullDialogue: fullDialogue
        };
    }

    /**
     * 从NPC回复中提取关键词（2-6字）
     * 用于生成实时对话选项
     * @param {string} text - NPC说的话
     * @returns {Array} 关键词数组
     */
    function extractKeywords(text) {
        if (!text) return [];
        var stopwords = '的了是在我你他她它们这那有没会不能都也就还而又但或如果虽然因为所以什么怎么哪谁几多少不过可是却已曾经正在将要可以应该需要必须可能大概也许似乎不过然后其实只是就是还是这样那样一些这些那些不过然后其实只是就是还是这样那样一些这些那些跟把被让给向从到用对为以之于';
        var swSet = {};
        for (var si = 0; si < stopwords.length; si++) { swSet[stopwords.charAt(si)] = true; }

        // ── 核心策略：优先从引号中提取说话内容 ──
        // generateFollowUpReply 输出格式如：阿福兴奋地说，"茶馆，你猜怎么着？"
        // 只提取引号内的内容，彻底避免描述前缀泄漏
        var speechContent = text;
        var quoteMatch = text.match(/[\u201c"]([^"\u201d]+)[\u201d"]/);
        if (quoteMatch && quoteMatch[1].trim().length >= 2) {
            speechContent = quoteMatch[1];
        } else {
            // 无引号时，去掉NPC名字+描述性前缀
            var namePattern = /^(阿福|云溪|铁匠|老张|小芳|掌柜|店小二)[^\u3001\u3002\uff01\uff1f\u201c\u201d]*/;
            speechContent = text.replace(namePattern, '');
        }

        // 去掉标点，按标点和停用词分词
        var cleaned = speechContent.replace(/[，。！？、；：""''……—\-\s\n\r]/g, '|');
        var segments = cleaned.split('|');
        var keywords = [];

        // NPC名字黑名单（不应作为关键词出现在玩家选项中）
        var npcNames = ['阿福', '云溪', '铁匠', '老张', '小芳', '掌柜', '店小二'];

        // 代词+动词模式，不应作为关键词
        var badPatterns = ['你跟我来', '你跟我', '跟我来', '你来看', '跟我走', '你等着', '你听我', '听我说', '你看看', '给你看', '你过来', '过来吧', '你走吧', '跟我去'];

        // 描述性词语模式（同时包含 的/地 变体，不应出现在玩家选项中）
        var descPatterns = [
            '兴奋地说', '兴奋的说', '叹了口气', '犹豫了一下', '深吸一口气',
            '看了看四周', '压低声音', '沉默了片刻', '认真地说', '认真的说',
            '眉飞色舞', '打起了精神', '伸了个懒腰', '深有同感', '有些意外',
            '有些失望', '有些自豪', '勉强笑了笑', '眼睛一亮', '凑近了些',
            '感慨道', '感激地说', '感激的说', '来了精神', '认真回忆',
            '考虑了一下', '好奇起来', '露出了笑容', '松了口气', '抹了把雨水',
            '搓了搓手', '拍了拍手', '高兴地站', '高兴的站', '神秘地笑', '神秘地笑',
            '轻声说', '笑了笑', '点了点头', '想了想', '顿了顿', '看着你',
            '眼睛亮了', '有些失望', '来了精神', '打起了精神'
        ];

        // 描述性动词+的/地 的通用模式（如 XX地说、XX的笑）
        var descVerbPattern = /[说笑道叹点摇头想看回忆站起拉抹搓拍伸凑压沉默犹豫兴奋感激认真轻声勉强眉飞露松打]/;

        for (var i = 0; i < segments.length; i++) {
            var seg = segments[i].trim();

            // ── 长segment处理：按停用词切分，不跨停用词切 ──
            // 理由：滑动窗口会切出"今天生"（来自"今天生意不好"）、"昨天路"（来自"昨天路上碰到狼了"）
            // 这种残缺词，塞进topicWord模板导致NPC说"今天生？这事儿挺有意思的"这种前言不搭后语的话
            // 改为按停用词切分：只在停用词处切，保证子串是完整词组
            // 例："我儿子要考书院了" → 按停用词"我/要/了"切分 → ["儿子", "考书院"]
            var segCandidates = [seg];
            if (seg.length > 4) {
                segCandidates = [];
                var subStart = 0;
                for (var si2 = 0; si2 < seg.length; si2++) {
                    if (swSet[seg.charAt(si2)]) {
                        if (si2 > subStart) {
                            segCandidates.push(seg.substring(subStart, si2));
                        }
                        subStart = si2 + 1;
                    }
                }
                if (subStart < seg.length) {
                    segCandidates.push(seg.substring(subStart));
                }
            }

            for (var sc = 0; sc < segCandidates.length; sc++) {
                var segItem = segCandidates[sc];
                if (segItem.length < 2 || segItem.length > 6) continue;

                // 检查是否全由停用字组成
                var allStop = true;
                for (var j = 0; j < segItem.length; j++) {
                    if (!swSet[segItem.charAt(j)]) { allStop = false; break; }
                }
                if (allStop) continue;

                // 检查是否是NPC名字
                var isName = false;
                for (var n = 0; n < npcNames.length; n++) {
                    if (segItem === npcNames[n] || segItem.indexOf(npcNames[n]) >= 0) { isName = true; break; }
                }
                if (isName) continue;

                // 检查是否是代词+动词模式
                var isBad = false;
                for (var b = 0; b < badPatterns.length; b++) {
                    if (segItem === badPatterns[b]) { isBad = true; break; }
                }
                if (isBad) continue;

                // 检查是否是描述性词语
                var isDesc = false;
                for (var d = 0; d < descPatterns.length; d++) {
                    if (segItem === descPatterns[d] || segItem.indexOf(descPatterns[d]) >= 0 || descPatterns[d].indexOf(segItem) >= 0) {
                        isDesc = true; break;
                    }
                }
                if (isDesc) continue;

                // 通用描述性动词过滤：以"地/的"结尾且含描述动词的片段
                if (segItem.length >= 3 && (segItem.charAt(segItem.length - 1) === '地' || segItem.charAt(segItem.length - 1) === '的')) {
                    var prefix = segItem.substring(0, segItem.length - 1);
                    var hasDescVerb = false;
                    for (var v = 0; v < prefix.length; v++) {
                        if (descVerbPattern.test(prefix.charAt(v))) { hasDescVerb = true; break; }
                    }
                    if (hasDescVerb) continue;
                }

                keywords.push(segItem);
            }
        }
        // 去重，最多5个
        var unique = [];
        var seen = {};
        for (var k = 0; k < keywords.length && unique.length < 5; k++) {
            if (!seen[keywords[k]]) { seen[keywords[k]] = true; unique.push(keywords[k]); }
        }
        return unique;
    }

    /**
     * 基于NPC刚说的话实时生成3个玩家选项
     * 选项根据NPC说话内容、情绪、语境动态生成
     * @param {string} npcId
     * @param {string} npcText - NPC刚说的话
     * @param {object} state - NPC当前状态
     * @param {string} relation - 关系等级
     * @returns {Array} 3个选项 [{playerOption, npcReply, intent, category}]
     */
    function generateLiveOptions(npcId, npcText, state, relation, lastPlayerOption) {
        var profile = NPC_PROFILES[npcId];

        // ── 动物NPC：基于好感度的互动选项，不走人类选项逻辑 ──
        if (profile && profile.isAnimal) {
            return _generateAnimalOptions(npcId, npcText, state, relation);
        }

        var name = profile ? profile.name : npcId;
        var keywords = extractKeywords(npcText);
        var moodLevel = 'mid';
        if (state) {
            if (state.mood < 40) moodLevel = 'low';
            else if (state.mood > 60) moodLevel = 'high';
        }

        var rel = (window.getRel) ? getRel(npcId) : 0;

        // 分析NPC说话的语境
        var ctx = _analyzeNpcSpeech(npcText, keywords, moodLevel, state);

        // 根据语境选择3个不同角度的选项
        var optionPool = _buildContextualOptions(npcId, name, ctx, keywords, state, profile, moodLevel, relation, rel);

        // ── 去重：过滤掉与玩家上一次选项相同或过于相似的选项 ──
        if (lastPlayerOption && typeof lastPlayerOption === 'string') {
            optionPool = optionPool.filter(function(opt) {
                // 完全相同 → 过滤
                if (opt.playerOption === lastPlayerOption) return false;
                // 玩家上一次选项的关键词
                var lastKw = extractKeywords(lastPlayerOption);
                // 如果新选项和上一次选项共享关键词且都很短 → 过滤（避免"茶馆怎么了？"反复出现）
                if (lastKw.length > 0 && opt.playerOption.length <= 8) {
                    for (var k = 0; k < lastKw.length; k++) {
                        if (opt.playerOption.indexOf(lastKw[k]) >= 0 && lastPlayerOption.indexOf(lastKw[k]) >= 0) {
                            return false;
                        }
                    }
                }
                return true;
            });
        }

        // 从选项池中选3个不同角度的
        var selected = _pickDiverseOptions(optionPool, 3);

        // 应用好感度影响
        for (var i = 0; i < selected.length; i++) {
            selected[i].npcReply = _applyFavorabilityTone(selected[i].npcReply, rel, name);
        }

        return selected;
    }

    /**
     * 分析NPC说话的语境，返回结构化语境对象
     */
    function _analyzeNpcSpeech(npcText, keywords, moodLevel, state) {
        var text = (typeof npcText === 'string') ? npcText : '';
        var safeKeywords = (Array.isArray(keywords)) ? keywords : [];
        var safeMood = (typeof moodLevel === 'number') ? moodLevel : 50;
        var ctx = {
            hasComplaint: false,    // 抱怨/不满
            hasQuestion: false,     // 疑问
            hasJoy: false,          // 开心/兴奋
            hasWorry: false,        // 担忧/焦虑
            hasMemory: false,       // 提到过去的事
            hasSuggestion: false,   // 建议/邀请
            hasWeather: false,      // 提到天气
            hasFood: false,         // 提到吃的
            hasWork: false,         // 提到工作/活计
            hasTiredness: false,    // 提到累/困
            hasLoneliness: false,   // 提到孤独/无聊
            hasBoast: false,        // 炫耀/得意
            hasSelfMock: false,     // 自嘲
            hasSurprise: false,     // 惊讶/意外
            hasRefuse: false,       // 拒绝/推辞
            hasGratitude: false,    // 感谢
            hasAnger: false,        // 生气/愤怒
            hasIdle: false,         // 闲/没事做
            hasDifficulty: false,   // 困境/瓶颈
            // 时间维度（新增）：让选项感知当前时段
            timePeriod: getCurrentPeriod(),  // dawn/morning/noon/afternoon/evening/night
            isNight: false,         // 夜晚（evening/night）
            isMorning: false,       // 上午（dawn/morning）
            topicKeyword: '',       // 核心话题词
            moodLevel: safeMood,
            rawText: text
        };
        // 根据时段设置时间标志
        if (ctx.timePeriod === 'evening' || ctx.timePeriod === 'night') {
            ctx.isNight = true;
        }
        if (ctx.timePeriod === 'dawn' || ctx.timePeriod === 'morning') {
            ctx.isMorning = true;
        }

        // 语境关键词检测
        // 注意：
        // 1. "累"从complaintWords移除，由tiredWords专门处理，避免"累得慌"误触发"谁惹你了"
        // 2. "气"从complaintWords移除，避免"运气/天气/口气"误触发，保留"气死/生气/气呼呼"
        // 3. "茶"从foodWords移除，避免茶馆场景下"没来几个喝茶的"误触发hasFood，由hasIdle/hasWork处理
        // 4. "难"从complaintWords移除，避免"难得/难免/难住"误触发hasComplaint（"师门清闲，难得"走hasIdle）
        //    保留"困难/难受/难住"等双字词由difficultyWords处理
        var complaintWords = ['烦', '讨厌', '受不了', '倒霉', '糟', '苦', '不公', '凭什么', '别提了', '烦人', '气死', '混账', '岂有此理', '太过分', '欺负', '忍不了', '倒霉蛋', '命苦', '亏', '亏了', '赔', '赔了', '折了', '糟心', '闹心', '烦心', '倒霉事', '不顺', '不痛快', '憋屈', '委屈', '生气', '气呼呼'];
        var questionWords = ['？', '?', '吗', '呢', '什么', '为什么', '哪', '谁', '咋'];
        // 注意：
        // 1. "几"从questionWords移除，因为"没来几个/几十个"等数词用法会误触发hasQuestion
        // 2. "怎么"从questionWords移除，因为"都没怎么/不怎么"等陈述用法会误触发hasQuestion
        // 真正的疑问句通常还有"？/吗/呢"等其他疑问词
        // 反问句/寒暄句模式：这些虽然含"咋/什么"但不是真问句，应走hasJoy/hasIdle等分支
        var rhetoricalPatterns = ['你猜怎么着', '你最近咋样', '你咋样', '你说呢', '你猜', '猜怎么着'];
        var isRhetorical = false;
        for (var ri = 0; ri < rhetoricalPatterns.length; ri++) {
            if (text.indexOf(rhetoricalPatterns[ri]) >= 0) {
                isRhetorical = true;
                break;
            }
        }
        var joyWords = ['开心', '高兴', '哈哈', '太好了', '运气', '顺', '舒坦', '痛快', '乐', '喜庆', '热闹', '真好', '太棒', '不错', '喜事', '好事', '悟了', '突破', '成功', '搞定', '办成', '悟点'];
        var worryWords = ['担心', '怕', '焦虑', '不安', '万一', '会不会', '危险', '小心', '愁', '愁人', '发愁', '犯愁', '忧心', '操心', '挂心', '揪心', '犯难', '没底', '忐忑', '吓', '吓死', '吓人', '吓死我', '后怕', '惊魂'];
        var memoryWords = ['以前', '记得', '那时候', '曾经', '上次', '昨天', '过去', '回忆'];
        // 扩充suggestWords：加入"来来来/坐会儿/坐坐/来杯/来壶/坐吧"
        var suggestWords = ['要不', '不如', '一起', '走吧', '来吧', '试试', '要不要', '来来来', '坐会儿', '坐坐', '来杯', '来壶', '坐吧', '来一壶', '来一盏'];
        var weatherWords = ['雨', '雪', '风', '晴', '冷', '热', '晒', '天气', '刮风', '下雨', '下雪'];
        // "茶"和"喝"从foodWords移除：
        // - "茶"：茶馆场景下"没来几个喝茶的"误触发hasFood
        // - "喝"：茶馆场景下"一起喝杯茶"误触发hasFood（应走hasSuggestion邀请语境）
        // 真正的食物语境由"饿/饭/菜/汤/点心/糕"等词触发
        var foodWords = ['吃', '饿', '饭', '菜', '汤', '点心', '糕'];
        // workWords：移除单字"做/干/工/打"（歧义太大），保留"活/忙"及双字词
        // - "做"会匹配"做完了/做梦"（"今日功课做完了"是闲适不是工作）
        // - "干"会匹配"干完了/干净"
        // - "工"会匹配"功课"（sect_outer的日常学习不是工作）
        // - "打"会匹配"打算/打扮"
        // 保留"活"（干活/活计/活儿）、"忙"（忙了一天/正忙着）及双字词
        var workWords = ['活', '忙', '活计', '生意', '买卖', '干活', '活儿'];
        var tiredWords = ['累', '困', '乏', '疲', '歇', '睡', '休息', '没劲', '身子骨', '不如从前', '老了', '撑不住', '吃不消', '腰', '腿'];
        var lonelyWords = ['无聊', '寂寞', '孤单', '没人', '一个人', '闷', '没人说话', '找个人', '聊聊天', '说说话'];
        var boastWords = ['厉害', '最好', '第一', '没人比', '当然', '那必须', '我可是'];
        var selfMockWords = ['命苦', '倒霉蛋', '没办法', '谁让我', '也就我', '我这人', '不如从前', '老了', '不中用', '愁人', '发愁', '没本事', '没用'];
        var surpriseWords = ['啊？', '什么！', '不会吧', '真的假的', '竟然', '居然', '没想到'];
        var refuseWords = ['不用', '算了', '别', '不行', '没空', '再说吧', '下次吧'];
        var gratitudeWords = ['谢', '多亏', '亏得', '承蒙', '感谢', '欠你'];
        var angerWords = ['气死', '混账', '岂有此理', '太过分', '欺负', '忍不了'];
        // 新增：闲/没事做语境
        var idleWords = ['闲', '没事做', '没事干', '清闲', '空闲', '闲着', '闲得'];
        // 新增：困境/瓶颈语境（"不简单"指困难时加入）
        var difficultyWords = ['卡在', '瓶颈', '难住', '棘手', '不顺', '卡住', '没头绪', '摸不着', '搞不定', '弄不懂', '不简单', '差点没'];

        for (var i = 0; i < complaintWords.length; i++) { if (text.indexOf(complaintWords[i]) >= 0) { ctx.hasComplaint = true; break; } }
        for (var j = 0; j < questionWords.length; j++) { if (text.indexOf(questionWords[j]) >= 0) { ctx.hasQuestion = true; break; } }
        // 反问句/寒暄句不算真问句（"你猜怎么着？"应走hasJoy，"你最近咋样？"应走hasIdle/寒暄）
        if (isRhetorical) ctx.hasQuestion = false;
        for (var k = 0; k < joyWords.length; k++) { if (text.indexOf(joyWords[k]) >= 0) { ctx.hasJoy = true; break; } }
        for (var l = 0; l < worryWords.length; l++) { if (text.indexOf(worryWords[l]) >= 0) { ctx.hasWorry = true; break; } }
        for (var m = 0; m < memoryWords.length; m++) { if (text.indexOf(memoryWords[m]) >= 0) { ctx.hasMemory = true; break; } }
        for (var n = 0; n < suggestWords.length; n++) { if (text.indexOf(suggestWords[n]) >= 0) { ctx.hasSuggestion = true; break; } }
        for (var o = 0; o < weatherWords.length; o++) { if (text.indexOf(weatherWords[o]) >= 0) { ctx.hasWeather = true; break; } }
        for (var p = 0; p < foodWords.length; p++) { if (text.indexOf(foodWords[p]) >= 0) { ctx.hasFood = true; break; } }
        for (var q = 0; q < workWords.length; q++) { if (text.indexOf(workWords[q]) >= 0) { ctx.hasWork = true; break; } }
        for (var r = 0; r < tiredWords.length; r++) { if (text.indexOf(tiredWords[r]) >= 0) { ctx.hasTiredness = true; break; } }
        for (var s = 0; s < lonelyWords.length; s++) { if (text.indexOf(lonelyWords[s]) >= 0) { ctx.hasLoneliness = true; break; } }
        for (var b1 = 0; b1 < boastWords.length; b1++) { if (text.indexOf(boastWords[b1]) >= 0) { ctx.hasBoast = true; break; } }
        for (var b2 = 0; b2 < selfMockWords.length; b2++) { if (text.indexOf(selfMockWords[b2]) >= 0) { ctx.hasSelfMock = true; break; } }
        for (var b3 = 0; b3 < surpriseWords.length; b3++) { if (text.indexOf(surpriseWords[b3]) >= 0) { ctx.hasSurprise = true; break; } }
        for (var b4 = 0; b4 < refuseWords.length; b4++) { if (text.indexOf(refuseWords[b4]) >= 0) { ctx.hasRefuse = true; break; } }
        for (var b5 = 0; b5 < gratitudeWords.length; b5++) { if (text.indexOf(gratitudeWords[b5]) >= 0) { ctx.hasGratitude = true; break; } }
        for (var b6 = 0; b6 < angerWords.length; b6++) { if (text.indexOf(angerWords[b6]) >= 0) { ctx.hasAnger = true; break; } }
        for (var b7 = 0; b7 < idleWords.length; b7++) { if (text.indexOf(idleWords[b7]) >= 0) { ctx.hasIdle = true; break; } }
        for (var b8 = 0; b8 < difficultyWords.length; b8++) { if (text.indexOf(difficultyWords[b8]) >= 0) { ctx.hasDifficulty = true; break; } }

        // ── 语境冲突仲裁（新增）──
        // 根因：真实词库语句常含多语境污染（如"师门清闲，难得"同时触发hasIdle+hasComplaint），
        // 第一层_generateReactiveOptions按if-else顺序命中，hasComplaint(第2位)先于hasIdle(第14位)，
        // 导致"清闲难得"走抱怨分支返回"谁惹你了"——完全错误。
        // 原则：具体语境优先于泛化语境，在语境检测完成后统一仲裁冲突。
        // 1. hasSuggestion > hasFood："一起喝杯茶"应走邀请，不走食物
        if (ctx.hasSuggestion && ctx.hasFood) ctx.hasFood = false;
        // 2. hasIdle > hasComplaint："清闲难得"应走闲适，不走抱怨
        if (ctx.hasIdle && ctx.hasComplaint) ctx.hasComplaint = false;
        // 3. hasTiredness > hasWork："累得慌"应走累，不走工作
        if (ctx.hasTiredness && ctx.hasWork) ctx.hasWork = false;
        // 4. hasIdle > hasWork："闲着磨工具"应走闲适，不走工作
        if (ctx.hasIdle && ctx.hasWork) ctx.hasWork = false;
        // 5. hasJoy > hasComplaint："运气好"应走开心，不走抱怨
        if (ctx.hasJoy && ctx.hasComplaint) ctx.hasComplaint = false;
        // 6. hasDifficulty > hasComplaint："卡住/瓶颈"应走困境，不走抱怨
        if (ctx.hasDifficulty && ctx.hasComplaint) ctx.hasComplaint = false;

        // 核心话题词
        ctx.topicKeyword = safeKeywords.length > 0 ? safeKeywords[0] : '';

        return ctx;
    }

    /**
     * 根据语境构建选项池 — 活人感优先
     * 核心原则：选项是对NPC原话的即时反应，不是模板填空
     */
    function _buildContextualOptions(npcId, name, ctx, keywords, state, profile, moodLevel, relation, rel) {
        var pool = [];
        var kw = ctx.topicKeyword;
        var type = profile ? profile.type : 'townsfolk';
        var raw = ctx.rawText || '';

        // ── 第一层：对NPC原话的即时反应（最活人感） ──
        var reactive = _generateReactiveOptions(raw, kw, ctx, name);
        for (var ri = 0; ri < reactive.length; ri++) pool.push(reactive[ri]);

        // ── 核心修复：第一层已返回3个选项时，第二层不再添加 ──
        // 理由：第一层_generateReactiveOptions已针对语境生成3个针对性选项，
        // 第二层继续添加会导致选项池混合多语境，_pickDiverseOptions按权重排序后
        // 可能挤掉第一层的针对性选项，出现"谁惹你了？/搭把手？/有新货没？"这种混乱组合
        if (pool.length >= 3) {
            return pool;
        }

        // ── 第二层：语境情绪反应 ──
        // 注意：如果第一层已经为该语境生成了针对性选项，这里不再重复加通用选项
        // 避免"带了/可不是嘛/进来坐坐"这种只有1个针对性的组合

        // 检测第一层是否已处理某语境（通过reactive的intent判断）
        var reactiveIntents = {};
        for (var ri2 = 0; ri2 < reactive.length; ri2++) {
            reactiveIntents[reactive[ri2].intent] = true;
        }
        // 是非问/选择问/特殊问已在第一层处理（confirm/deny/bounce/think/choose_a/choose_b/either）
        var questionHandled = reactiveIntents.confirm || reactiveIntents.deny ||
                              reactiveIntents.choose_a || reactiveIntents.choose_b || reactiveIntents.either;

        // ── 核心原则：问题语境优先，其他情绪语境不污染选项池 ──
        // 当NPC在问问题时，玩家应该回答问题，而不是表达其他情绪
        // 如"你带伞了没？"不应有"沾沾喜气！"选项（即使NPC说了"今天手感不错"）
        var questionPriority = ctx.hasQuestion && questionHandled;

        // NPC在抱怨/生气（问题语境优先时不加）
        if ((ctx.hasComplaint || ctx.hasAnger) && !questionPriority) {
            pool.push({ playerOption: '谁惹你了？', npcReply: '', intent: 'listen', category: 'empathy', weight: 28 });
            pool.push({ playerOption: '消消气。', npcReply: '', intent: 'comfort', category: 'empathy', weight: 22 });
            if (ctx.hasAnger) {
                pool.push({ playerOption: '太过分了。', npcReply: '', intent: 'resonate', category: 'empathy', weight: 25 });
            }
        }

        // NPC在问问题（仅当第一层未处理时才加通用问句选项）
        if (ctx.hasQuestion && !questionHandled) {
            pool.push({ playerOption: '我想想……', npcReply: '', intent: 'think', category: 'probe', weight: 22 });
            pool.push({ playerOption: '你先说？', npcReply: '', intent: 'bounce', category: 'probe', weight: 20 });
        }

        // NPC很开心/炫耀（问题语境优先时不加）
        if ((ctx.hasJoy || ctx.hasBoast) && !questionPriority) {
            pool.push({ playerOption: '啥好事！', npcReply: '', intent: 'share_joy', category: 'probe', weight: 28 });
            pool.push({ playerOption: '沾沾喜气！', npcReply: '', intent: 'celebrate', category: 'empathy', weight: 22 });
            if (ctx.hasBoast) {
                pool.push({ playerOption: '吹吧你。', npcReply: '', intent: 'tease', category: 'empathy', weight: 18 });
            }
        }

        // NPC在担忧（问题语境优先时不加）
        if (ctx.hasWorry && !questionPriority) {
            pool.push({ playerOption: '别怕，有我呢。', npcReply: '', intent: 'reassure', category: 'empathy', weight: 28 });
            pool.push({ playerOption: '最坏能怎样？', npcReply: '', intent: 'solve', category: 'action', weight: 22 });
        }

        // NPC提到过去/自嘲（问题语境优先时不加）
        if (ctx.hasMemory && !questionPriority) {
            pool.push({ playerOption: '后来呢？', npcReply: '', intent: 'listen_memory', category: 'probe', weight: 28 });
            pool.push({ playerOption: '都过去了。', npcReply: '', intent: 'move_on', category: 'empathy', weight: 18 });
        }
        if (ctx.hasSelfMock && !questionPriority) {
            pool.push({ playerOption: '别这么说。', npcReply: '', intent: 'comfort', category: 'empathy', weight: 25 });
            pool.push({ playerOption: '你也不容易。', npcReply: '', intent: 'understand', category: 'empathy', weight: 22 });
        }

        // NPC在邀请/建议（问题语境优先时不加）
        // 时间感知：与第一层保持一致，晚上→明天吧/太晚了，白天→走/等会儿
        if (ctx.hasSuggestion && !questionPriority) {
            if (ctx.isNight) {
                pool.push({ playerOption: '明天吧。', npcReply: '', intent: 'delay', category: 'action', weight: 28 });
                pool.push({ playerOption: '太晚了，改天。', npcReply: '', intent: 'delay', category: 'action', weight: 22 });
            } else {
                pool.push({ playerOption: '走！', npcReply: '', intent: 'accept', category: 'action', weight: 28 });
                pool.push({ playerOption: '等会儿……', npcReply: '', intent: 'delay', category: 'action', weight: 15 });
            }
        }

        // NPC惊讶（问题语境优先时不加）
        if (ctx.hasSurprise && !questionPriority) {
            pool.push({ playerOption: '我也没想到！', npcReply: '', intent: 'resonate', category: 'empathy', weight: 25 });
            pool.push({ playerOption: '真的假的？', npcReply: '', intent: 'confirm', category: 'probe', weight: 28 });
        }

        // NPC拒绝/推辞（问题语境优先时不加）
        if (ctx.hasRefuse && !questionPriority) {
            pool.push({ playerOption: '行吧。', npcReply: '', intent: 'accept_refuse', category: 'empathy', weight: 25 });
            pool.push({ playerOption: '那我下次再约。', npcReply: '', intent: 'arrange', category: 'action', weight: 20 });
        }

        // NPC感谢（问题语境优先时不加）
        if (ctx.hasGratitude && !questionPriority) {
            pool.push({ playerOption: '客气啥。', npcReply: '', intent: 'downplay', category: 'empathy', weight: 28 });
            pool.push({ playerOption: '应该的。', npcReply: '', intent: 'accept_thanks', category: 'empathy', weight: 22 });
        }

        // NPC提到天气（问题语境优先时不加）
        if (ctx.hasWeather && !questionPriority) {
            pool.push({ playerOption: '可不是嘛。', npcReply: '', intent: 'agree', category: 'empathy', weight: 22 });
            pool.push({ playerOption: '进来坐坐？', npcReply: '', intent: 'invite', category: 'action', weight: 25 });
        }

        // NPC提到吃的（问题语境优先时不加）
        // 注意：hasIdle优先于hasFood，避免"没来几个喝茶的，闲"误触发hasFood
        // 时间感知：与第一层保持一致，晚上→吃点夜宵，白天→一起吃
        if (ctx.hasFood && !questionPriority && !ctx.hasIdle) {
            if (ctx.isNight) {
                pool.push({ playerOption: '吃点夜宵？', npcReply: '', intent: 'treat', category: 'action', weight: 28 });
                pool.push({ playerOption: '这么晚别吃太饱。', npcReply: '', intent: 'care', category: 'empathy', weight: 20 });
            } else {
                pool.push({ playerOption: '一起吃？我请。', npcReply: '', intent: 'treat', category: 'action', weight: 28 });
                pool.push({ playerOption: '记得吃饭啊。', npcReply: '', intent: 'care', category: 'empathy', weight: 18 });
            }
        }

        // NPC提到工作（问题语境优先时不加）
        // 时间感知：与第一层保持一致，晚上→这么晚还忙/明天再说，白天→别太拼了/搭把手
        if (ctx.hasWork && !questionPriority) {
            if (ctx.isNight) {
                pool.push({ playerOption: '这么晚还忙？', npcReply: '', intent: 'care', category: 'empathy', weight: 28 });
                pool.push({ playerOption: '明天再说吧。', npcReply: '', intent: 'delay', category: 'action', weight: 22 });
            } else {
                pool.push({ playerOption: '别太拼了。', npcReply: '', intent: 'care', category: 'empathy', weight: 22 });
                pool.push({ playerOption: '搭把手？', npcReply: '', intent: 'help', category: 'action', weight: 25 });
            }
        }

        // NPC说累/困（问题语境优先时不加）
        // 时间感知：与第一层保持一致，晚上→早点睡/别熬了，白天→去歇会儿/昨晚没睡好
        if (ctx.hasTiredness && !questionPriority) {
            if (ctx.isNight) {
                pool.push({ playerOption: '早点睡吧。', npcReply: '', intent: 'care', category: 'action', weight: 30 });
                pool.push({ playerOption: '这么晚了，别熬了。', npcReply: '', intent: 'care', category: 'empathy', weight: 25 });
            } else {
                pool.push({ playerOption: '去歇会儿。', npcReply: '', intent: 'care', category: 'action', weight: 28 });
                pool.push({ playerOption: '昨晚没睡好？', npcReply: '', intent: 'probe', category: 'probe', weight: 22 });
            }
        }

        // NPC说无聊/孤独（问题语境优先时不加）
        // 时间感知：与第一层保持一致，晚上→这么晚别一个人待着，白天→出去转转
        // 注意：两个选项用不同category，避免_pickDiverseOptions按category去重时挤掉一个
        if (ctx.hasLoneliness && !questionPriority) {
            pool.push({ playerOption: '我陪你待会儿。', npcReply: '', intent: 'accompany', category: 'empathy', weight: 28 });
            if (ctx.isNight) {
                pool.push({ playerOption: '这么晚别一个人待着。', npcReply: '', intent: 'care', category: 'action', weight: 24 });
            } else {
                pool.push({ playerOption: '出去转转？', npcReply: '', intent: 'invite', category: 'action', weight: 22 });
            }
        }

        // ── 核心修复：第二层结束后去重，避免第一层与第二层添加完全相同的选项 ──
        // 问题：第一层_generateReactiveOptions对hasSuggestion/hasSurprise/hasRefuse等语境
        // 返回2个选项后，第二层会添加完全相同的选项（如'走！'/'等会儿……'），
        // 导致_pickDiverseOptions因category去重只能选出2个选项
        // 修复：按playerOption文本原地去重，保留首次出现的（第一层的权重通常更高）
        var _seenOptTexts = {};
        for (var _dupIdx = pool.length - 1; _dupIdx >= 0; _dupIdx--) {
            var _optText = pool[_dupIdx].playerOption;
            if (_seenOptTexts[_optText]) {
                pool.splice(_dupIdx, 1);
            } else {
                _seenOptTexts[_optText] = true;
            }
        }

        // ── 第三层：基于NPC类型的特色选项 ──
        // 问题语境优先时不加，避免"带了/有新货没？/没带"组合
        if (pool.length < 6 && !questionPriority) {
            var typeOptions = _getTypeSpecificOptions(name, type, kw, moodLevel);
            for (var t = 0; t < typeOptions.length; t++) pool.push(typeOptions[t]);
        }

        // ── 第四层：调度脑目标相关选项 ──
        var schedulerState = (window.SoulTick) ? SoulTick.getNpcState(npcId) : null;
        var goalType = schedulerState && schedulerState.intent ? schedulerState.intent.goalType : '';
        if (goalType && pool.length < 8) {
            var goalOptions = _getGoalBasedOptions(name, goalType, kw);
            for (var g = 0; g < goalOptions.length; g++) pool.push(goalOptions[g]);
        }

        // ── 第五层：环境即时反应 ──
        // 注意：当问题已处理时，不加环境选项，避免"带了/没带/进来避避雨？"组合
        var weather = (window.GameTime) ? GameTime.getWeather() : null;
        var weatherId = weather ? weather.id : 'clear';
        if ((weatherId === 'rainy' || weatherId === 'stormy' || weatherId === 'drizzle') && pool.length < 8 && !questionHandled) {
            pool.push({ playerOption: '进来避避雨？', npcReply: '', intent: 'shelter', category: 'action', weight: 18 });
        }
        if (weatherId === 'snowy' && pool.length < 8 && !questionHandled) {
            pool.push({ playerOption: '进来暖和暖和？', npcReply: '', intent: 'warm', category: 'action', weight: 18 });
        }

        // ── 质疑选项：当NPC骗人倾向较高时，添加质疑选项 ──
        // 玩家可以质疑NPC说的话，NPC会根据是否在骗人做出反应
        var deceitTendency = _calculateDeceitTendency(profile, state, rel);
        if (deceitTendency >= 45 && pool.length < 7 && !questionPriority) {
            pool.push({ playerOption: '真的假的？', npcReply: '', intent: 'doubt', category: 'probe', weight: 12 });
        }

        // ── 兜底选项 ──
        if (pool.length < 3) {
            // 如果有关键词，优先用关键词生成引用式追问，避免选项与NPC话题完全无关
            if (kw && kw.length >= 2 && _isValidTopicWord(kw)) {
                pool.push({ playerOption: kw + '咋回事？', npcReply: '', intent: 'listen', category: 'probe', weight: 20 });
                pool.push({ playerOption: kw + '咋样了？', npcReply: '', intent: 'listen', category: 'probe', weight: 18 });
                pool.push({ playerOption: '嗯。', npcReply: '', intent: 'agree', category: 'empathy', weight: 5 });
            } else {
                pool.push({ playerOption: '嗯。', npcReply: '', intent: 'agree', category: 'empathy', weight: 5 });
                pool.push({ playerOption: '然后呢？', npcReply: '', intent: 'continue', category: 'probe', weight: 5 });
                pool.push({ playerOption: '改天聊？', npcReply: '', intent: 'arrange', category: 'action', weight: 3 });
            }
        }

        return pool;
    }

    /**
     * 识别NPC问题类型（CoT Step 1：听懂NPC问什么）
     * @param {string} speech - NPC原话
     * @returns {string} 'yesno'|'special'|'choice'|'general'
     */
    function _identifyQuestionType(speech) {
        if (!speech) return 'general';

        // 选择问：包含"还是"（A还是B）
        if (speech.indexOf('还是') >= 0) return 'choice';

        // 是非问：需要"动词+没/吗"或"是不是/有没有"等明确结构
        // 注意：单纯"没"字不算（如"闻到没"是祈使句不是是非问）
        // 必须以问号结尾，或包含"没？/吗？/没吗"等明确是非问标志
        var hasQuestionMark = /[？?]/.test(speech);
        if (hasQuestionMark) {
            // 明确的是非问结构
            var yesnoPatterns = ['是不是', '有没有', '能不能', '会不会', '要不要', '去不去', '看不看', '吃不吃', '喝不喝', '来不来', '带没带', '去没去', '吃没吃', '看没看'];
            for (var p = 0; p < yesnoPatterns.length; p++) {
                if (speech.indexOf(yesnoPatterns[p]) >= 0) return 'yesno';
            }
            // "X没？"结构（如"带伞没？""吃饭没？"）
            if (/没[？?]$/.test(speech)) return 'yesno';
            // "X了吗/了呢"结构
            if (/[了吗呢][？?]$/.test(speech)) return 'yesno';
        }

        // 特殊问：包含"什么/怎么/为什么/哪/谁/咋/几"
        var specialMarkers = ['什么', '怎么', '为什么', '哪', '谁', '咋', '几', '多少'];
        for (var j = 0; j < specialMarkers.length; j++) {
            if (speech.indexOf(specialMarkers[j]) >= 0) return 'special';
        }

        // 默认：通用问句
        return 'general';
    }

    /**
     * 根据问题类型生成针对性回答（CoT Step 3：生成针对性回答）
     * @param {string} speech - NPC原话
     * @param {string} qType - 问题类型
     * @param {string} coreKw - NPC原话核心关键词
     * @returns {Array} 选项数组
     */
    function _generateQuestionReply(speech, qType, coreKw) {
        var opts = [];

        if (qType === 'yesno') {
            // 是非问：生成"肯定/否定/反问"回答
            // 尝试从NPC原话提取核心动词，生成"动词了/没动词"
            var verb = _extractCoreVerb(speech);

            if (verb) {
                // 提取到动词：生成针对性回答
                opts.push({ playerOption: verb + '了。', npcReply: '', intent: 'confirm', category: 'probe', weight: 30 });
                opts.push({ playerOption: '没' + verb + '。', npcReply: '', intent: 'deny', category: 'probe', weight: 28 });
                opts.push({ playerOption: '你呢？', npcReply: '', intent: 'bounce', category: 'probe', weight: 22 });
            } else {
                // 没提取到动词：用通用肯定/否定
                opts.push({ playerOption: '嗯，是。', npcReply: '', intent: 'confirm', category: 'probe', weight: 30 });
                opts.push({ playerOption: '没呢。', npcReply: '', intent: 'deny', category: 'probe', weight: 28 });
                opts.push({ playerOption: '你呢？', npcReply: '', intent: 'bounce', category: 'probe', weight: 22 });
            }
            return opts;
        }

        if (qType === 'choice') {
            // 选择问：从NPC原话提取选项，生成"A/B/都行/都不"
            var choices = _extractChoices(speech);
            if (choices.length >= 2) {
                opts.push({ playerOption: choices[0] + '。', npcReply: '', intent: 'choose_a', category: 'probe', weight: 30 });
                opts.push({ playerOption: choices[1] + '。', npcReply: '', intent: 'choose_b', category: 'probe', weight: 28 });
                opts.push({ playerOption: '都行。', npcReply: '', intent: 'either', category: 'probe', weight: 20 });
                return opts;
            }
            // 提取失败：回退到通用
            opts.push({ playerOption: '都行。', npcReply: '', intent: 'either', category: 'probe', weight: 25 });
            opts.push({ playerOption: '你定吧。', npcReply: '', intent: 'bounce', category: 'probe', weight: 22 });
            return opts;
        }

        if (qType === 'special') {
            // 特殊问：根据问题内容生成更自然的回答
            // "今天咋样" → "还行"/"老样子"/"不太行"
            // "你在想什么" → "没什么"/"你猜"/"不想说"
            // "最近生意怎么样" → "还行"/"不太好"/"老样子"

            // 检测是否是"咋样/怎么样"类问题（询问状态）
            if (speech.indexOf('咋样') >= 0 || speech.indexOf('怎么样') >= 0) {
                opts.push({ playerOption: '还行。', npcReply: '', intent: 'confirm', category: 'probe', weight: 28 });
                opts.push({ playerOption: '老样子。', npcReply: '', intent: 'bounce', category: 'probe', weight: 26 });
                opts.push({ playerOption: '不太行。', npcReply: '', intent: 'deny', category: 'probe', weight: 24 });
                return opts;
            }

            // 检测是否是"想什么/在想什么"类问题（询问想法）
            if (speech.indexOf('想') >= 0 && (speech.indexOf('什么') >= 0 || speech.indexOf('啥') >= 0)) {
                opts.push({ playerOption: '没什么。', npcReply: '', intent: 'deny', category: 'probe', weight: 26 });
                opts.push({ playerOption: '你猜。', npcReply: '', intent: 'bounce', category: 'probe', weight: 24 });
                opts.push({ playerOption: '不想说。', npcReply: '', intent: 'deny', category: 'probe', weight: 22 });
                return opts;
            }

            // 检测是否是"为什么/咋"类问题（询问原因）
            if (speech.indexOf('为什么') >= 0 || speech.indexOf('咋') >= 0) {
                opts.push({ playerOption: '不知道。', npcReply: '', intent: 'deny', category: 'probe', weight: 25 });
                opts.push({ playerOption: '你说呢？', npcReply: '', intent: 'bounce', category: 'probe', weight: 24 });
                opts.push({ playerOption: '我想想。', npcReply: '', intent: 'think', category: 'probe', weight: 22 });
                return opts;
            }

            // 通用特殊问
            opts.push({ playerOption: '不知道。', npcReply: '', intent: 'deny', category: 'probe', weight: 25 });
            opts.push({ playerOption: '你说呢？', npcReply: '', intent: 'bounce', category: 'probe', weight: 24 });
            opts.push({ playerOption: '我想想。', npcReply: '', intent: 'think', category: 'probe', weight: 22 });
            return opts;
        }

        // general：通用问句
        opts.push({ playerOption: '嗯……', npcReply: '', intent: 'think', category: 'probe', weight: 24 });
        opts.push({ playerOption: '你说呢？', npcReply: '', intent: 'bounce', category: 'probe', weight: 22 });
        if (coreKw) {
            opts.push({ playerOption: coreKw + '咋说？', npcReply: '', intent: 'listen', category: 'probe', weight: 26 });
        }
        return opts;
    }

    /**
     * 从NPC原话提取核心事物（用于deny/confirm针对性回应）
     * 如"下雨带伞没" → "伞"；"你吃饭了吗" → "饭"；"去没去茶馆" → "茶馆"
     * @param {string} speech - NPC原话
     * @returns {string} 核心事物（1-3字）
     */
    function _extractTopicObject(speech) {
        if (!speech) return '';

        // 常见事物词列表（按场景分组）
        // 用途：从NPC原话中提取具体事物词作为topicWord，避免extractKeywords切出残缺词
        var objects = [
            // 天气相关
            '伞', '雨', '雪', '风',
            // 饮食相关
            '饭', '茶', '酒', '水', '点心', '菜', '汤',
            // 地点相关
            '茶馆', '铁匠铺', '集市', '家里', '山上',
            // 物品相关
            '货', '布匹', '茶叶', '盐', '糖',
            // 动作相关
            '吃', '喝', '去', '来', '睡', '歇',
            // 人物相关（扩充：解决"我儿子要考书院了"提取不出topicWord的问题）
            '儿子', '女儿', '妻子', '丈夫', '师傅', '徒弟', '掌柜', '家人', '老头', '孩子',
            // 事务相关（扩充：解决"今天生意不好"提取不出topicWord的问题）
            '生意', '买卖', '活计', '手艺', '功法', '修炼', '任务', '考书院', '考功名',
            // 动物相关（扩充：解决"昨天路上碰到狼了"提取不出topicWord的问题）
            '狼', '虎', '蛇', '马', '牛', '羊',
            // 路径相关（扩充：解决"这条路啊，比预想的难走"提取不出topicWord的问题）
            '路',
            // 地点相关（扩充）
            '书院', '山下', '镇上', '路上', '山里'
        ];

        // 优先匹配2-3字事物（避免1字词误匹配，如"去"匹配"过去"）
        var multiCharObjs = ['茶馆', '铁匠铺', '集市', '家里', '山上', '点心', '布匹', '茶叶',
                             '儿子', '女儿', '妻子', '丈夫', '师傅', '徒弟', '掌柜', '家人', '老头', '孩子',
                             '生意', '买卖', '活计', '手艺', '功法', '修炼', '任务', '考书院', '考功名',
                             '书院', '山下', '镇上', '路上', '山里'];
        for (var m = 0; m < multiCharObjs.length; m++) {
            if (speech.indexOf(multiCharObjs[m]) >= 0) {
                return multiCharObjs[m];
            }
        }

        // 匹配1字事物
        for (var i = 0; i < objects.length; i++) {
            if (speech.indexOf(objects[i]) >= 0) {
                return objects[i];
            }
        }

        return '';
    }

    /**
     * 从NPC原话提取核心动词（用于是非问回答）
     * 如"下雨带伞没" → "带"；"你吃饭了吗" → "吃"；"去没去茶馆" → "去"
     * @param {string} speech - NPC原话
     * @returns {string} 核心动词（1-2字）
     */
    function _extractCoreVerb(speech) {
        if (!speech) return '';

        // 常见动词列表（按使用频率排序）
        var verbs = ['带', '吃', '喝', '去', '来', '看', '听', '买', '卖', '做', '打', '走', '歇', '睡',
                     '忙', '等', '找', '问', '说', '想', '用', '给', '拿', '送', '带', '碰', '见',
                     '知道', '听说', '见过', '去过', '吃过', '喝过', '买过'];

        // 优先匹配2字动词
        var twoCharVerbs = ['知道', '听说', '见过', '去过', '吃过', '喝过', '买过', '做过', '来过', '到过'];
        for (var t = 0; t < twoCharVerbs.length; t++) {
            if (speech.indexOf(twoCharVerbs[t]) >= 0) {
                return twoCharVerbs[t];
            }
        }

        // 匹配1字动词
        for (var i = 0; i < verbs.length; i++) {
            if (speech.indexOf(verbs[i]) >= 0) {
                return verbs[i];
            }
        }

        return '';
    }

    /**
     * 从NPC原话提取选择问的选项（A还是B）
     * 如"喝茶还是喝酒" → ['喝茶', '喝酒']
     * @param {string} speech - NPC原话
     * @returns {Array} 选项数组
     */
    function _extractChoices(speech) {
        if (!speech) return [];

        var parts = speech.split('还是');
        if (parts.length < 2) return [];

        var a = parts[0].trim();
        var b = parts[1].trim();

        // 提取A的最后一个动词+宾语（如"喝茶还是喝酒"的A="喝茶"）
        // 从A的末尾找动词
        var aMatch = a.match(/[\u4e00-\u9fa5]{1,3}$/);
        var bMatch = b.match(/^[\u4e00-\u9fa5]{1,3}/);

        if (aMatch && bMatch) {
            return [aMatch[0], bMatch[0]];
        }

        return [];
    }

    /**
     * 基于NPC原话生成即时反应选项
     * 这是最核心的活人感来源：不是模板填空，而是对NPC说了什么的具体回应
     */
    function _generateReactiveOptions(raw, kw, ctx, name) {
        var opts = [];

        // 从引号中提取NPC原话
        var quoteMatch = raw.match(/[\u201c"]([^"\u201d]+)[\u201d"]/);
        var speech = quoteMatch ? quoteMatch[1].trim() : raw;
        // 去掉名字前缀
        var namePrefix = /^(阿福|云溪|铁匠|老张|小芳|掌柜|店小二)/;
        speech = speech.replace(namePrefix, '').trim();
        // 去掉描述性前缀（到第一个引号或逗号）
        var descPrefix = /^[^，。！？\u201c"]*[，,]/;
        var speechBeforeTrim = speech;
        speech = speech.replace(descPrefix, '').trim();
        // 修复：如果截断后speech太短（<2字），回退到截断前
        // 原因："今天没来几个喝茶的，闲"截断后只剩"闲"（1字），导致hasIdle等语境检测全部跳过
        if (speech.length < 2) {
            speech = speechBeforeTrim;
        }

        if (!speech || speech.length < 2) return opts;

        // ── 新增：引用NPC原话关键词生成选项 ──
        // 从NPC原话提取核心名词（2-4字），生成引用式选项
        // 这样选项和NPC原话有语义关联，不会出现"NPC说A，选项全是B"
        // kw 可能是字符串（ctx.topicKeyword）或数组（keywords），统一处理
        var kwArr = [];
        if (Array.isArray(kw)) {
            kwArr = kw;
        } else if (typeof kw === 'string' && kw.length >= 2) {
            kwArr = [kw];
        }
        // 同时从NPC原话提取关键词作为补充
        // 修复：优先用_extractTopicObject提取具体事物词（如"茶/伞/儿子"），避免正则切出残缺词
        if (kwArr.length === 0 && speech) {
            var topicObj = _extractTopicObject(speech);
            if (topicObj) {
                kwArr = [topicObj];
            } else {
                var speechMatches = speech.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
                kwArr = speechMatches.filter(function(k) { return _isValidTopicWord(k); });
            }
        }
        // 修复：如果kwArr[0]是残缺词（长度>2且_extractTopicObject能提取出更短的事物词），用事物词替代
        // 例如"起喝杯茶"（残缺）→"茶"（_extractTopicObject提取）
        if (kwArr.length > 0 && kwArr[0].length > 2 && speech) {
            var betterTopic = _extractTopicObject(speech);
            if (betterTopic && betterTopic.length < kwArr[0].length) {
                kwArr[0] = betterTopic;
            }
        }
        var speechKws = kwArr.filter(function(k) {
            return k && k.length >= 2 && k.length <= 4 && _isValidTopicWord(k);
        });
        var coreKw = speechKws.length > 0 ? speechKws[0] : '';

        // ── 核心原则：选项基于语境类型，不是机械拼接关键词 ──
        // 每种语境只生成1-2个最贴切的选项，避免堆砌

        // 1. NPC在问问题 → 针对性问题类型生成回答（CoT思考方式）
        // Step 1: 听懂NPC问什么（识别问题类型）
        // Step 2: 判断期待什么回答（是非问→是/否，特殊问→信息，选择问→选择）
        // Step 3: 生成针对性回答（从NPC原话提取核心动词）
        if (ctx.hasQuestion) {
            var qType = _identifyQuestionType(speech);
            var qOpts = _generateQuestionReply(speech, qType, coreKw);
            for (var qi = 0; qi < qOpts.length; qi++) {
                opts.push(qOpts[qi]);
            }
            // 如果针对性回答不足3个，补充通用选项
            if (opts.length < 2) {
                opts.push({ playerOption: '你说呢？', npcReply: '', intent: 'bounce', category: 'probe', weight: 20 });
            }
            return opts;
        }

        // 2. NPC在抱怨/生气 → 同情类选项（直接回应抱怨语境）
        // 注意：hasTiredness优先于hasComplaint检测，避免"累得慌"误触发"谁惹你了"
        // 所以hasComplaint分支不再处理"累"（已从complaintWords移除）
        if ((ctx.hasComplaint || ctx.hasAnger) && !ctx.hasTiredness) {
            opts.push({ playerOption: '谁惹你了？', npcReply: '', intent: 'listen', category: 'empathy', weight: 28 });
            opts.push({ playerOption: '消消气。', npcReply: '', intent: 'comfort', category: 'empathy', weight: 22 });
            // 如果NPC原话有关键词，加一个引用式追问（嵌入话题词，让选项与NPC原话相关）
            if (coreKw) {
                opts.push({ playerOption: coreKw + '咋回事？', npcReply: '', intent: 'listen', category: 'probe', weight: 26 });
            } else {
                opts.push({ playerOption: '然后呢？', npcReply: '', intent: 'listen', category: 'probe', weight: 24 });
            }
            return opts;
        }

        // 3. NPC很开心/炫耀 → 共享类选项
        if (ctx.hasJoy || ctx.hasBoast) {
            opts.push({ playerOption: '啥好事！', npcReply: '', intent: 'share_joy', category: 'probe', weight: 28 });
            if (ctx.hasBoast) {
                opts.push({ playerOption: '吹吧你。', npcReply: '', intent: 'tease', category: 'empathy', weight: 22 });
            } else {
                opts.push({ playerOption: '沾沾喜气！', npcReply: '', intent: 'celebrate', category: 'empathy', weight: 22 });
            }
            // 自然追问（嵌入话题词）
            if (coreKw) {
                opts.push({ playerOption: coreKw + '咋样了？', npcReply: '', intent: 'listen', category: 'probe', weight: 26 });
            } else {
                opts.push({ playerOption: '然后呢？', npcReply: '', intent: 'listen', category: 'probe', weight: 24 });
            }
            return opts;
        }

        // 4. NPC在担忧 → 安慰类选项
        if (ctx.hasWorry) {
            opts.push({ playerOption: '别怕，有我呢。', npcReply: '', intent: 'reassure', category: 'empathy', weight: 28 });
            opts.push({ playerOption: '最坏能怎样？', npcReply: '', intent: 'solve', category: 'action', weight: 22 });
            if (coreKw) {
                opts.push({ playerOption: coreKw + '咋整？', npcReply: '', intent: 'listen', category: 'probe', weight: 26 });
            } else {
                opts.push({ playerOption: '那咋整？', npcReply: '', intent: 'listen', category: 'probe', weight: 24 });
            }
            return opts;
        }

        // 5. NPC提到过去/回忆 → 追问类选项
        if (ctx.hasMemory) {
            opts.push({ playerOption: '后来呢？', npcReply: '', intent: 'listen_memory', category: 'probe', weight: 28 });
            opts.push({ playerOption: '都过去了。', npcReply: '', intent: 'move_on', category: 'empathy', weight: 18 });
            if (coreKw) {
                opts.push({ playerOption: coreKw + '后来咋样？', npcReply: '', intent: 'listen_memory', category: 'probe', weight: 26 });
            }
            return opts;
        }

        // 6. NPC在自嘲 → 安慰类选项
        if (ctx.hasSelfMock) {
            opts.push({ playerOption: '别这么说。', npcReply: '', intent: 'comfort', category: 'empathy', weight: 25 });
            opts.push({ playerOption: '你也不容易。', npcReply: '', intent: 'understand', category: 'empathy', weight: 22 });
            if (coreKw) {
                opts.push({ playerOption: coreKw + '咋了？', npcReply: '', intent: 'listen', category: 'probe', weight: 26 });
            } else {
                opts.push({ playerOption: '咋了？', npcReply: '', intent: 'listen', category: 'probe', weight: 24 });
            }
            return opts;
        }

        // 7. NPC在邀请/建议 → 接受类选项
        // 时间感知：晚上邀请→太晚了/明天吧，白天邀请→走/好啊
        if (ctx.hasSuggestion) {
            if (ctx.isNight) {
                opts.push({ playerOption: '明天吧。', npcReply: '', intent: 'delay', category: 'action', weight: 28 });
                opts.push({ playerOption: '太晚了，改天。', npcReply: '', intent: 'delay', category: 'action', weight: 22 });
            } else {
                opts.push({ playerOption: '走！', npcReply: '', intent: 'accept', category: 'action', weight: 28 });
                opts.push({ playerOption: '等会儿……', npcReply: '', intent: 'delay', category: 'action', weight: 15 });
            }
            return opts;
        }

        // 8. NPC惊讶 → 共鸣类选项
        if (ctx.hasSurprise) {
            opts.push({ playerOption: '我也没想到！', npcReply: '', intent: 'resonate', category: 'empathy', weight: 25 });
            opts.push({ playerOption: '真的假的？', npcReply: '', intent: 'confirm', category: 'probe', weight: 28 });
            return opts;
        }

        // 9. NPC拒绝 → 接受类选项
        if (ctx.hasRefuse) {
            opts.push({ playerOption: '行吧。', npcReply: '', intent: 'accept_refuse', category: 'empathy', weight: 25 });
            opts.push({ playerOption: '那我下次再约。', npcReply: '', intent: 'arrange', category: 'action', weight: 20 });
            return opts;
        }

        // 10. NPC感谢 → 淡化类选项
        if (ctx.hasGratitude) {
            opts.push({ playerOption: '客气啥。', npcReply: '', intent: 'downplay', category: 'empathy', weight: 28 });
            opts.push({ playerOption: '应该的。', npcReply: '', intent: 'accept_thanks', category: 'empathy', weight: 22 });
            return opts;
        }

        // 11. NPC提到天气 → 附和类选项
        if (ctx.hasWeather) {
            opts.push({ playerOption: '可不是嘛。', npcReply: '', intent: 'agree', category: 'empathy', weight: 22 });
            opts.push({ playerOption: '进来坐坐？', npcReply: '', intent: 'invite', category: 'action', weight: 25 });
            return opts;
        }

        // 12. NPC提到吃的 → 邀请类选项
        // 注意：hasIdle优先于hasFood检测，避免"没来几个喝茶的，闲"误触发hasFood
        // 时间感知：晚上→吃点夜宵，白天→一起吃
        if (ctx.hasFood && !ctx.hasIdle) {
            if (ctx.isNight) {
                opts.push({ playerOption: '吃点夜宵？', npcReply: '', intent: 'treat', category: 'action', weight: 28 });
                opts.push({ playerOption: '这么晚别吃太饱。', npcReply: '', intent: 'care', category: 'empathy', weight: 20 });
            } else {
                opts.push({ playerOption: '一起吃？我请。', npcReply: '', intent: 'treat', category: 'action', weight: 28 });
                opts.push({ playerOption: '记得吃饭啊。', npcReply: '', intent: 'care', category: 'empathy', weight: 18 });
            }
            return opts;
        }

        // 13. NPC说累/困 → 关心类选项（直接回应"累"语境，不依赖coreKw）
        // 时间感知：晚上说累→早点睡，白天说累→歇会儿
        // 注意：hasTiredness优先于hasWork，因为"累得慌"比"活"更具体
        if (ctx.hasTiredness) {
            if (ctx.isNight) {
                opts.push({ playerOption: '早点睡吧。', npcReply: '', intent: 'care', category: 'action', weight: 30 });
                opts.push({ playerOption: '这么晚了，别熬了。', npcReply: '', intent: 'care', category: 'empathy', weight: 25 });
            } else {
                opts.push({ playerOption: '歇会儿吧。', npcReply: '', intent: 'care', category: 'action', weight: 30 });
                opts.push({ playerOption: '别硬撑，身子骨要紧。', npcReply: '', intent: 'care', category: 'empathy', weight: 25 });
            }
            return opts;
        }

        // 14. NPC说闲/没事做 → 陪伴/找事类选项
        // 注意：hasIdle优先于hasWork，因为"闲着就磨磨工具"同时含"闲"和"磨"，hasIdle更具体
        // 时间感知：晚上→早点休息/明天再说，白天→出去转转/聊聊天
        if (ctx.hasIdle) {
            opts.push({ playerOption: '我陪你待会儿。', npcReply: '', intent: 'accompany', category: 'empathy', weight: 28 });
            if (ctx.isNight) {
                opts.push({ playerOption: '早点休息吧。', npcReply: '', intent: 'care', category: 'action', weight: 24 });
                opts.push({ playerOption: '明天再说？', npcReply: '', intent: 'delay', category: 'action', weight: 20 });
            } else {
                opts.push({ playerOption: '出去转转？', npcReply: '', intent: 'invite', category: 'action', weight: 24 });
                if (coreKw) {
                    opts.push({ playerOption: coreKw + '咋样？', npcReply: '', intent: 'listen', category: 'probe', weight: 22 });
                } else {
                    opts.push({ playerOption: '聊聊天？', npcReply: '', intent: 'invite', category: 'action', weight: 20 });
                }
            }
            return opts;
        }

        // 15. NPC提到工作 → 关心类选项（直接回应工作语境）
        // 时间感知：晚上→这么晚还忙/明天再说，白天→别太拼了/搭把手
        if (ctx.hasWork) {
            if (ctx.isNight) {
                opts.push({ playerOption: '这么晚还忙？', npcReply: '', intent: 'care', category: 'empathy', weight: 28 });
                opts.push({ playerOption: '明天再说吧。', npcReply: '', intent: 'delay', category: 'action', weight: 22 });
            } else {
                opts.push({ playerOption: '别太拼了。', npcReply: '', intent: 'care', category: 'empathy', weight: 22 });
                opts.push({ playerOption: '搭把手？', npcReply: '', intent: 'help', category: 'action', weight: 25 });
            }
            if (coreKw) {
                opts.push({ playerOption: '然后呢？', npcReply: '', intent: 'listen', category: 'probe', weight: 24 });
            }
            return opts;
        }

        // 16. NPC说无聊/孤独 → 陪伴类选项
        // 时间感知：晚上→这么晚别一个人待着，白天→出去转转
        // 注意：两个选项用不同category，避免_pickDiverseOptions按category去重时挤掉一个
        if (ctx.hasLoneliness) {
            opts.push({ playerOption: '我陪你待会儿。', npcReply: '', intent: 'accompany', category: 'empathy', weight: 28 });
            if (ctx.isNight) {
                opts.push({ playerOption: '这么晚别一个人待着。', npcReply: '', intent: 'care', category: 'action', weight: 24 });
            } else {
                opts.push({ playerOption: '出去转转？', npcReply: '', intent: 'invite', category: 'action', weight: 22 });
            }
            return opts;
        }

        // 17. NPC说困境/瓶颈（新增）→ 鼓励/帮助类选项
        if (ctx.hasDifficulty) {
            opts.push({ playerOption: '咋整？', npcReply: '', intent: 'solve', category: 'action', weight: 28 });
            opts.push({ playerOption: '别急，慢慢来。', npcReply: '', intent: 'comfort', category: 'empathy', weight: 25 });
            if (coreKw) {
                opts.push({ playerOption: coreKw + '咋回事？', npcReply: '', intent: 'listen', category: 'probe', weight: 24 });
            } else {
                opts.push({ playerOption: '说说？', npcReply: '', intent: 'listen', category: 'probe', weight: 22 });
            }
            return opts;
        }

        // ── 以下是无明确语境时的通用反应 ──

        // 如果有核心关键词，生成自然追问（确保选项和NPC原话有关联）
        if (coreKw && opts.length < 2) {
            // 用多样的自然追问，避免"咋说"太生硬
            var naturalFollowUps = ['然后呢？', '后来呢？', '具体点？', '怎么说？'];
            opts.push({ playerOption: pick(naturalFollowUps), npcReply: '', intent: 'listen', category: 'probe', weight: 22 });
        }

        // NPC原话以感叹号结尾 → 情绪回应
        if (/[！!]$/.test(speech)) {
            opts.push({ playerOption: '真的！', npcReply: '', intent: 'confirm', category: 'empathy', weight: 22 });
        }

        // NPC原话以省略号结尾 → 催促或安慰
        if (/[……]$/.test(speech)) {
            opts.push({ playerOption: '接着说。', npcReply: '', intent: 'detail', category: 'probe', weight: 25 });
            opts.push({ playerOption: '没事，慢慢说。', npcReply: '', intent: 'comfort', category: 'empathy', weight: 22 });
        }

        // NPC说了"你" → 跟玩家有关
        if (speech.indexOf('你') >= 0 && speech.indexOf('你') < speech.length / 2) {
            opts.push({ playerOption: '我？', npcReply: '', intent: 'clarify', category: 'probe', weight: 22 });
        }

        // NPC原话很短（2-4字）→ 简短回应或追问
        if (speech.length >= 2 && speech.length <= 4) {
            opts.push({ playerOption: '嗯？', npcReply: '', intent: 'clarify', category: 'probe', weight: 20 });
        }

        // NPC原话较长 → 挑重点回应
        if (speech.length > 15) {
            opts.push({ playerOption: '等等，慢点说。', npcReply: '', intent: 'slow_down', category: 'probe', weight: 18 });
        }

        return opts;
    }

    /**
     * NPC类型特色选项
     */
    function _getTypeSpecificOptions(name, type, kw, moodLevel) {
        var opts = [];
        var typeMap = {
            teahouse_staff: [
                { playerOption: '今天忙不？', npcReply: '', intent: 'ask_work', category: 'probe', weight: 15 },
                { playerOption: '来壶好茶。', npcReply: '', intent: 'order', category: 'action', weight: 15 }
            ],
            merchant: [
                { playerOption: '最近啥好卖？', npcReply: '', intent: 'ask_trade', category: 'probe', weight: 15 },
                { playerOption: '有新货没？', npcReply: '', intent: 'browse', category: 'action', weight: 15 }
            ],
            artisan: [
                { playerOption: '最近在做啥？', npcReply: '', intent: 'ask_craft', category: 'probe', weight: 15 },
                { playerOption: '让我瞧瞧手艺？', npcReply: '', intent: 'admire', category: 'action', weight: 15 }
            ],
            sect_outer: [
                { playerOption: '修炼上有啥感悟？', npcReply: '', intent: 'ask_cultivation', category: 'probe', weight: 15 },
                { playerOption: '教我两手呗？', npcReply: '', intent: 'learn', category: 'action', weight: 15 }
            ],
            wanderer: [
                { playerOption: '走过哪些地方？', npcReply: '', intent: 'ask_travel', category: 'probe', weight: 15 },
                { playerOption: '外面有啥新鲜事？', npcReply: '', intent: 'ask_news', category: 'probe', weight: 15 }
            ]
        };
        if (typeMap[type]) {
            for (var i = 0; i < typeMap[type].length; i++) opts.push(typeMap[type][i]);
        }
        return opts;
    }

    /**
     * 基于调度脑目标的选项
     */
    function _getGoalBasedOptions(name, goalType, kw) {
        var opts = [];
        if (goalType === 'go_home_rest') {
            opts.push({ playerOption: '你看着累了，早点歇吧。', npcReply: '', intent: 'care', category: 'action', weight: 20 });
        }
        if (goalType === 'seek_food') {
            opts.push({ playerOption: '一起找点吃的？', npcReply: '', intent: 'invite', category: 'action', weight: 20 });
        }
        if (goalType === 'seek_social') {
            opts.push({ playerOption: '去茶馆坐坐？', npcReply: '', intent: 'invite', category: 'action', weight: 20 });
        }
        return opts;
    }

    /**
     * 从选项池中选出N个不同角度的选项
     * 优先选高权重，保证角度多样性
     */
    function _pickDiverseOptions(pool, count) {
        if (pool.length <= count) return pool.slice(0, count);

        // 按权重排序
        pool.sort(function(a, b) { return (b.weight || 10) - (a.weight || 10); });

        var selected = [];
        var usedCategories = {};

        // 第一轮：每个类别只选最高权重的
        for (var i = 0; i < pool.length && selected.length < count; i++) {
            var cat = pool[i].category || 'other';
            if (!usedCategories[cat]) {
                selected.push(pool[i]);
                usedCategories[cat] = true;
            }
        }

        // 第二轮：如果还不够，从剩余中补（去重playerOption文本）
        if (selected.length < count) {
            var usedTexts = {};
            for (var s = 0; s < selected.length; s++) {
                usedTexts[selected[s].playerOption] = true;
            }
            for (var j = 0; j < pool.length && selected.length < count; j++) {
                if (!usedTexts[pool[j].playerOption] && selected.indexOf(pool[j]) < 0) {
                    selected.push(pool[j]);
                    usedTexts[pool[j].playerOption] = true;
                }
            }
        }

        // 打乱顺序，避免empathy永远在第一个
        for (var k = selected.length - 1; k > 0; k--) {
            var r = Math.floor(Math.random() * (k + 1));
            var tmp = selected[k];
            selected[k] = selected[r];
            selected[r] = tmp;
        }

        return selected.slice(0, count);
    }

    /**
     * 好感度影响回复 - 回复长度/温暖度随好感度变化
     */
    // ── 性格偏移系统 ──────────────────────────────────────

    /**
     * 根据NPC的personality数值自动偏移对话风格
     * 核心思路：同类型NPC共享TYPE_DIALOGUE_STYLE基础数据，但通过personality偏移产生差异
     * 不需要手写每个NPC的personalDialogue，所有NPC自动获得差异化
     *
     * 偏移维度：
     * - warmth(热情度): 高→开场更热情、加感叹词、话题偏向关心别人
     * - humor(幽默感): 高→话题更轻松、回复加调侃、选项更有趣
     * - stubbornness(固执度): 高→拒绝/犹豫概率更高、话题更坚持己见
     * - caution(谨慎度): 高→回复更保守、不轻易透露信息、话题更谨慎
     * - social(社交性): 高→话题偏向社交、结束语更亲切
     * - curiosity(好奇心): 高→话题偏向探索/新鲜事、追问更多
     * - emotion(感性): 高→回复更感性、情绪词更多
     * - diligence(勤劳): 高→话题偏向工作/手艺
     * - adventure(冒险): 高→话题偏向探索/冒险
     *
     * @param {string} npcId - NPC ID
     * @param {object} profile - NPC profile
     * @param {string} text - 待偏移的文本
     * @param {string} context - 偏移上下文: 'opening'/'topic'/'reply'/'closing'
     * @returns {string} 偏移后的文本
     */
    function _applyPersonalityShift(npcId, profile, text, context) {
        if (!text || !profile || !profile.personality) return text;

        var p = profile.personality;
        var warmth = p.warmth || 50;
        var humor = p.humor || 50;
        var stubbornness = p.stubbornness || 50;
        var caution = p.caution || 50;
        var social = p.social || 50;
        var curiosity = p.curiosity || 50;
        var emotion = p.emotion || 50;
        var diligence = p.diligence || 50;
        var adventure = p.adventure || 50;

        var result = text;
        var shiftCount = 0; // 偏移计数器，最多1层后缀（模板本身可能已有修饰）
        var MAX_SHIFTS = 1;

        // ── warmth偏移：热情度影响开场和话题的温度 ──
        if (warmth >= 70 && (context === 'opening' || context === 'reply')) {
            // 高热情：随机加热情语气词（只在句尾是句号时替换，避免"来了啊呢！"这种不自然组合）
            if (Math.random() < 0.3) {
                var lastChar = result.charAt(result.length - 1);
                if (lastChar === '。') {
                    // 句号→感叹号，最自然
                    result = result.slice(0, -1) + '！';
                } else if (lastChar === '，') {
                    // 逗号→感叹号+截断（变成短句感叹）
                    result = result.slice(0, -1) + '！';
                }
                // 不在！和？后面再加语气词，避免堆叠
            }
        } else if (warmth <= 25 && context === 'opening') {
            // 低热情：缩短开场，加冷淡语气
            if (result.length > 8 && Math.random() < 0.4) {
                var cutPoint = result.indexOf('，');
                if (cutPoint > 2) {
                    result = result.substring(0, cutPoint) + '。';
                }
            }
        }

        // ── humor偏移：幽默感影响回复风格 ──
        if (shiftCount < MAX_SHIFTS && humor >= 70 && context === 'reply' && Math.random() < 0.25) {
            // 高幽默：随机加调侃/玩笑后缀
            var humorSuffixes = [
                ' 哈哈，开玩笑的。',
                ' 你信不信？',
                ' 嘿嘿。',
                ' 别当真啊。'
            ];
            result = result + pick(humorSuffixes);
            shiftCount++;
        }

        // ── stubbornness偏移：固执度影响拒绝/坚持概率 ──
        if (shiftCount < MAX_SHIFTS && stubbornness >= 70 && context === 'reply' && Math.random() < 0.2) {
            // 高固执：随机加坚持己见的后缀
            var stubbornSuffixes = [
                ' 我就这脾气，改不了。',
                ' 反正我是这么想的。',
                ' 你说你的，我做我的。',
                ' 嗯，我主意已定。'
            ];
            result = result + pick(stubbornSuffixes);
            shiftCount++;
        } else if (shiftCount < MAX_SHIFTS && stubbornness <= 25 && context === 'reply' && Math.random() < 0.15) {
            // 低固执：加随和后缀
            var easySuffixes = [
                ' 你说呢？',
                ' 也行，听你的。',
                ' 都行，我不挑。'
            ];
            result = result + pick(easySuffixes);
            shiftCount++;
        }

        // ── caution偏移：谨慎度影响信息透露程度 ──
        if (shiftCount < MAX_SHIFTS && caution >= 70 && context === 'reply' && Math.random() < 0.2) {
            // 高谨慎：加保留/含糊后缀
            var cautionSuffixes = [
                ' ……算了，不说了。',
                ' 这事儿别往外传。',
                ' 你知道就行了，别跟别人说。',
                ' 嗯……我再想想。'
            ];
            result = result + pick(cautionSuffixes);
            shiftCount++;
        } else if (shiftCount < MAX_SHIFTS && caution <= 25 && context === 'reply' && Math.random() < 0.15) {
            // 低谨慎：加直率后缀
            var bluntSuffixes = [
                ' 跟你说实话吧。',
                ' 我这人说话直，你别介意。',
                ' 没啥不能说的。'
            ];
            result = result + pick(bluntSuffixes);
            shiftCount++;
        }

        // ── curiosity偏移：好奇心影响话题选择倾向 ──
        // 注意：topic上下文不加后缀，避免开场话题啰嗦（"你有没有发现新鲜事？你知道吗？"不自然）
        // curiosity偏移已通过_shiftTopicCategory在话题类别选择中实现
        if (curiosity >= 80 && context === 'reply' && Math.random() < 0.15) {
            var curiositySuffixes = [
                ' 你知道吗？',
                ' 我一直想搞明白。',
                ' 你有没有听说过？'
            ];
            result = result + pick(curiositySuffixes);
            shiftCount++;
        }

        // ── diligence偏移：勤劳度影响话题内容 ──
        // 注意：topic上下文不加后缀，diligence偏移已通过_shiftTopicCategory实现
        if (diligence >= 85 && context === 'reply' && Math.random() < 0.15) {
            var workSuffixes = [
                ' 手头的活儿不能停。',
                ' 得赶紧干活了。',
                ' 忙着呢。'
            ];
            result = result + pick(workSuffixes);
            shiftCount++;
        }

        // ── patience偏移：耐心度影响回复节奏 ──
        var patience = p.patience || 50;
        if (shiftCount < MAX_SHIFTS && patience <= 25 && context === 'reply' && Math.random() < 0.25) {
            // 低耐心：加催促/不耐烦后缀
            var impatientSuffixes = [
                ' 行了行了。',
                ' 别磨蹭了。',
                ' 说重点。',
                ' 快点说。'
            ];
            result = result + pick(impatientSuffixes);
            shiftCount++;
        } else if (shiftCount < MAX_SHIFTS && patience >= 80 && context === 'reply' && Math.random() < 0.15) {
            // 高耐心：加耐心后缀
            var patientSuffixes = [
                ' 慢慢说，不急。',
                ' 你慢慢想，我等着。',
                ' 没事，你接着说。'
            ];
            result = result + pick(patientSuffixes);
            shiftCount++;
        }

        // ── pride偏移：自尊心影响被质疑/赞美的反应 ──
        var pride = p.pride || 50;
        if (shiftCount < MAX_SHIFTS && pride >= 80 && context === 'reply' && Math.random() < 0.2) {
            // 高自尊：加自尊/面子相关后缀
            var prideSuffixes = [
                ' 我可不是那种人。',
                ' 你别小看我。',
                ' 我好歹也是……算了。',
                ' 这事儿我说了算。'
            ];
            result = result + pick(prideSuffixes);
            shiftCount++;
        } else if (shiftCount < MAX_SHIFTS && pride <= 20 && context === 'reply' && Math.random() < 0.15) {
            // 低自尊：加自嘲/谦虚后缀
            var humbleSuffixes = [
                ' 我也就这样了。',
                ' 嘿嘿，我这点本事你又不是不知道。',
                ' 我哪行啊。'
            ];
            result = result + pick(humbleSuffixes);
            shiftCount++;
        }

        // ── loyalty偏移：忠诚度影响信息分享和关系维护 ──
        var loyalty = p.loyalty || 50;
        if (loyalty >= 80 && context === 'closing' && Math.random() < 0.3) {
            // 高忠诚：结束语更关心对方
            var loyalClosings = [
                ' 有事随时找我。',
                ' 你要是有啥需要，尽管说。',
                ' 咱们之间不用客气。'
            ];
            result = pick(loyalClosings);
        } else if (loyalty <= 20 && context === 'closing' && Math.random() < 0.3) {
            // 低忠诚：结束语更疏远
            var distantClosings = [
                ' 那就这样吧。',
                ' 我先走了。',
                ' 没别的事我就不陪了。'
            ];
            result = pick(distantClosings);
        }

        return result;
    }

    /**
     * 根据personality选择话题类别偏移
     * 不同性格的NPC在相同状态下倾向不同话题
     * @param {object} personality - NPC性格
     * @param {string} baseCategory - 基础话题类别（由状态决定）
     * @returns {string} 偏移后的话题类别
     */
    function _shiftTopicCategory(personality, baseCategory) {
        if (!personality) return baseCategory;

        // 高社交 → 偏向社交话题
        if (personality.social >= 75 && baseCategory === 'idle' && Math.random() < 0.4) {
            return 'social_high';
        }
        // 高冒险 → 偏向探索话题
        if (personality.adventure >= 75 && baseCategory === 'idle' && Math.random() < 0.35) {
            return 'explore_high';
        }
        // 高勤劳 + 空闲 → 偏向工作相关
        if (personality.diligence >= 80 && baseCategory === 'idle' && Math.random() < 0.3) {
            return 'tired'; // 用tired类话题（偏向忙碌/手艺）
        }
        // 高好奇 → 偏向探索
        if (personality.curiosity >= 80 && baseCategory === 'idle' && Math.random() < 0.3) {
            return 'explore_high';
        }

        return baseCategory;
    }

    /**
     * 根据personality生成NPC特有的口癖/语气词
     * 让同一类型的NPC说话方式不同
     * @param {object} personality
     * @param {string} name
     * @returns {string} 口癖（可能为空）
     */
    function _getPersonalityVerbalTick(personality, name) {
        if (!personality) return '';

        var warmth = personality.warmth || 50;
        var humor = personality.humor || 50;
        var stubbornness = personality.stubbornness || 50;
        var caution = personality.caution || 50;

        // 只在30%概率下添加口癖，避免过度
        if (Math.random() > 0.3) return '';

        // 高热情+高幽默 → 活泼口癖
        if (warmth >= 70 && humor >= 60) {
            return pick(['诶', '嘿', '哈哈', '哟']);
        }
        // 高固执+低热情 → 冷硬口癖
        if (stubbornness >= 70 && warmth <= 30) {
            return pick(['哼', '嗯', '……']);
        }
        // 高谨慎 → 犹豫口癖
        if (caution >= 70) {
            return pick(['嗯……', '这个嘛……', '……']);
        }
        // 高幽默 → 调侃口癖
        if (humor >= 70) {
            return pick(['嘿嘿', '哈', '哎']);
        }

        return '';
    }

    function _applyFavorabilityTone(reply, rel, name) {
        if (!reply) return reply;

        // 高好感：加温暖后缀
        if (rel >= 70) {
            var warmSuffixes = [
                ' 跟你说这些，也就你了。',
                ' 嘿嘿。',
                ' 你是我在这个镇上最信任的人了。',
                ''
            ];
            var suffix = warmSuffixes[Math.floor(Math.random() * warmSuffixes.length)];
            return reply + suffix;
        }

        // 低好感：缩短回复，加冷淡
        if (rel < 25) {
            var firstEnd = reply.indexOf('。');
            if (firstEnd > 0 && firstEnd < reply.length - 2) {
                return reply.substring(0, firstEnd + 1);
            }
        }

        return reply;
    }

    // ── 玩家选项分析 + 语境桥接 ──────────────────────────────

    /**
     * 分析玩家选项文本，提取关键词和语义意图
     * 这是让NPC"听懂"玩家说了什么的关键
     * @param {string} optionText - 玩家选项文本
     * @returns {Object} {keywords:[], hasQuestion, hasAction, hasEmotion, emotionType, targetRef}
     */
    function _analyzePlayerOption(optionText) {
        var text = (typeof optionText === 'string') ? optionText : '';
        var result = {
            keywords: [],
            hasQuestion: false,
            hasAction: false,
            hasEmotion: false,
            emotionType: 'neutral',  // positive/negative/neutral
            targetRef: '',           // 玩家选项指向的对象（你/我/他/具体事物）
            rawText: text
        };

        if (!text) return result;

        // 提取关键词（复用 extractKeywords）
        result.keywords = extractKeywords(text);

        // 检测行动（优先于疑问，因为"搭把手？"/"进来坐坐？"是行动提议不是提问）
        var actionMarkers = ['走', '来', '去', '吃', '喝', '坐', '歇', '帮', '搭把手', '一起', '进去', '出去', '转转', '坐坐'];
        for (var a = 0; a < actionMarkers.length; a++) {
            if (text.indexOf(actionMarkers[a]) >= 0) {
                result.hasAction = true;
                break;
            }
        }

        // 检测疑问 — 只有非行动选项才检测疑问
        // 这样"搭把手？"/"进来坐坐？"会被识别为行动，而不是提问
        if (!result.hasAction) {
            var questionMarkers = ['？', '?', '吗', '呢', '啥', '什么', '怎么', '为什么', '哪', '谁', '咋'];
            for (var q = 0; q < questionMarkers.length; q++) {
                if (text.indexOf(questionMarkers[q]) >= 0) {
                    result.hasQuestion = true;
                    break;
                }
            }
        }

        // 检测情绪
        var positiveMarkers = ['好', '太好了', '真的', '沾沾', '应该的', '客气', '别怕', '消消气', '别愁'];
        var negativeMarkers = ['咋了', '怎么了', '谁惹', '太过分', '别这么说', '不容易', '累', '苦'];
        for (var p = 0; p < positiveMarkers.length; p++) {
            if (text.indexOf(positiveMarkers[p]) >= 0) {
                result.hasEmotion = true;
                result.emotionType = 'positive';
                break;
            }
        }
        if (result.emotionType === 'neutral') {
            for (var n = 0; n < negativeMarkers.length; n++) {
                if (text.indexOf(negativeMarkers[n]) >= 0) {
                    result.hasEmotion = true;
                    result.emotionType = 'negative';
                    break;
                }
            }
        }

        // 检测指向对象
        if (text.indexOf('你') >= 0) result.targetRef = 'npc';
        else if (text.indexOf('我') >= 0 && text.indexOf('你') < 0) result.targetRef = 'player';
        else if (text.indexOf('他') >= 0 || text.indexOf('她') >= 0) result.targetRef = 'third_party';

        return result;
    }

    /**
     * 语境桥接 — 建立玩家选项与NPC原话的语义关联
     * 核心功能：让NPC的回复同时回应"玩家说了什么"和"自己刚才说了什么"
     * @param {Object} playerAnalysis - _analyzePlayerOption 的返回值
     * @param {string} npcLastSpeech - NPC上一句说话内容（已提取引号内）
     * @param {string} topicWord - 从NPC原话提取的话题关键词
     * @returns {Object} {connectionType, connectionWord, replyStrategy}
     *   connectionType: 'echo_topic'(回应话题) / 'answer_question'(回答问题) / 'react_emotion'(情绪回应) / 'accept_action'(接受行动) / 'generic'(通用)
     *   connectionWord: 用于回复中引用的词
     *   replyStrategy: 回复策略指导
     */
    function _contextBridge(playerAnalysis, npcLastSpeech, topicWord) {
        var bridge = {
            connectionType: 'generic',
            connectionWord: '',
            replyStrategy: 'default'
        };

        if (!playerAnalysis) return bridge;

        var pKeywords = playerAnalysis.keywords || [];
        var pText = playerAnalysis.rawText || '';

        // ── 核心原则：connectionWord 只使用NPC的话题词，绝不使用玩家选项关键词 ──
        // 旧逻辑用玩家选项关键词作为回退，导致NPC回复包含玩家选项原文（如玩家选"亏了多少？"，
        // NPC回复"亏了不少，这里头门道可不少"——"亏了不少"是玩家选项词被拼进回复）
        // 现在：如果NPC没有话题词，connectionWord为空，走无话题词的通用模板
        // 这样NPC回复保持独立话语，不重复玩家的话

        // 1. 玩家在问问题 → NPC应该回答
        if (playerAnalysis.hasQuestion) {
            bridge.connectionType = 'answer_question';
            bridge.replyStrategy = 'answer';
            // 只用NPC的话题词，绝不使用玩家关键词
            bridge.connectionWord = topicWord || '';
        }
        // 2. 玩家在表达情绪（关心/同情/开心） → NPC应该情绪回应
        else if (playerAnalysis.hasEmotion) {
            bridge.connectionType = 'react_emotion';
            bridge.replyStrategy = playerAnalysis.emotionType === 'positive' ? 'share_joy' : 'comfort';
            bridge.connectionWord = topicWord || '';
        }
        // 3. 玩家在提议行动 → NPC应该接受/拒绝/犹豫
        else if (playerAnalysis.hasAction) {
            bridge.connectionType = 'accept_action';
            bridge.replyStrategy = 'accept_or_decline';
            bridge.connectionWord = topicWord || '';
        }
        // 4. 玩家选项包含NPC的话题关键词 → 回应话题
        else if (topicWord && pText.indexOf(topicWord) >= 0) {
            bridge.connectionType = 'echo_topic';
            bridge.replyStrategy = 'expand_topic';
            bridge.connectionWord = topicWord;
        }
        // 5. 玩家选项指向NPC → NPC回应自己
        else if (playerAnalysis.targetRef === 'npc') {
            bridge.connectionType = 'react_emotion';
            bridge.replyStrategy = 'self_reflect';
            bridge.connectionWord = topicWord || '';
        }
        // 6. 通用：用NPC的话题词接话，无话题词则走通用模板
        else if (topicWord) {
            bridge.connectionType = 'echo_topic';
            bridge.replyStrategy = 'expand_topic';
            bridge.connectionWord = topicWord;
        }

        return bridge;
    }

    /**
     * 验证topicWord是否适合嵌入模板造句
     * 只有名词性、可独立成话题的词才适合，避免形容词/短句/语气词被塞进模板
     * 如"真舒坦"、"还行吧"不适合 → 返回false
     * 如"茶馆"、"打铁"、"小路"适合 → 返回true
     * @param {string} word - 待验证的topicWord
     * @returns {boolean}
     */
    function _isValidTopicWord(word) {
        if (!word || word.length < 2 || word.length > 4) return false;

        // 排除含语气助词的短句（吧/呢/啊/嘛/了/的/得）
        var badSuffixes = ['吧', '呢', '啊', '嘛', '了', '的', '得', '哦', '哈', '嘿', '哎', '吗', '呀', '哇', '呗', '喽'];
        for (var i = 0; i < badSuffixes.length; i++) {
            if (word.charAt(word.length - 1) === badSuffixes[i]) return false;
        }

        // 排除疑问句（含"没/吗/呢/啥"结尾的，如"有新货没"、"啥好事"）
        var questionSuffixes = ['没', '吗', '呢', '啥'];
        for (var qi = 0; qi < questionSuffixes.length; qi++) {
            if (word.charAt(word.length - 1) === questionSuffixes[qi]) return false;
        }
        // 排除含疑问词的短句
        var questionWords = ['什么', '怎么', '为什么', '哪', '谁', '咋'];
        for (var qw = 0; qw < questionWords.length; qw++) {
            if (word.indexOf(questionWords[qw]) >= 0) return false;
        }

        // 排除纯形容词/副词（常见的不可独立成话题的词）
        var invalidWords = [
            '真舒坦', '还行', '不错', '挺好', '很好', '真棒', '好着呢',
            '不太好', '不行', '一般', '可以', '没事', '算了', '随便',
            '确实', '当然', '可能', '应该', '大概', '也许', '反正',
            '其实', '不过', '但是', '然而', '所以', '因为', '虽然',
            '就是', '而且', '或者', '如果', '那么', '这样', '那样',
            '这么', '那么', '怎么', '什么', '为什么', '哪里',
            '舒服', '开心', '高兴', '难过', '生气', '害怕', '担心',
            '累', '饿', '困', '渴', '冷', '热', '烦', '闷',
            '好', '坏', '大', '小', '多', '少', '快', '慢',
            '你知道吗', '你信不信', '别当真', '说真的', '说实话',
            '闷得慌', '有新货', '啥好事', '沾沾', '消消气',
            '话说', '说起来', '对了', '不过也', '反正我', '你看',
            '这个', '那个', '这些', '那些', '什么', '怎么',
            '今天', '昨天', '明天', '现在', '刚才', '后来',
            '流水', '门道', '回事',  // 常见模板词，不适合做话题词
            '愁人', '发愁', '犯愁', '忧心', '操心', '揪心',  // 情绪词，不是事物词
            '吓死', '吓人', '后怕', '惊魂', '害怕', '担心',
            '糟心', '闹心', '烦心', '憋屈', '委屈', '不顺',  // 情绪词
            '大事', '小事', '稀罕事', '新鲜事', '麻烦事'  // 泛指词，不够具体
        ];
        for (var j = 0; j < invalidWords.length; j++) {
            if (word === invalidWords[j]) return false;
        }

        return true;
    }

    // ── 天气感知回复生成 ──────────────────────────────────────

    /**
     * 根据NPC身份和天气生成天气相关回复
     * @param {string} npcId - NPC ID
     * @param {string} name - NPC名字
     * @param {string} weatherId - 天气ID
     * @param {boolean} usePureDialogue - 是否纯对话格式
     * @param {boolean} useShortDesc - 是否短描述格式
     * @returns {Array} 回复数组
     */
    function _getWeatherReplies(npcId, name, weatherId, usePureDialogue, useShortDesc) {
        var replies = [];
        var isRain = (weatherId === 'rainy' || weatherId === 'drizzle');
        var isStorm = (weatherId === 'stormy');
        var isSnow = (weatherId === 'snowy');

        // 身份特色天气回复
        if (npcId === 'yunxi') {
            if (isRain) {
                if (usePureDialogue) {
                    replies = ['雨好大，我差点回不来！你淋湿了没？', '下雨天山里特别安静，只听得见雨声，可好听了。', '这雨什么时候停啊？我还想去山里采蘑菇呢。'];
                } else {
                    replies = [name + '甩了甩头发上的水珠，"雨好大，我差点回不来！你淋湿了没？"', name + '听了听外面的雨声，"下雨天山里特别安静，只听得见雨声，可好听了。"', name + '望着窗外，"这雨什么时候停啊？我还想去山里采蘑菇呢。"'];
                }
            } else if (isStorm) {
                if (usePureDialogue) {
                    replies = ['打雷了好吓人！我不敢出门了！', '暴风雨的时候山里很危险，你可别出去！'];
                } else {
                    replies = [name + '缩了缩脖子，"打雷了好吓人！我不敢出门了！"', name + '认真地说，"暴风雨的时候山里很危险，你可别出去！"'];
                }
            } else if (isSnow) {
                if (usePureDialogue) {
                    replies = ['下雪了！好漂亮！我们等雪停了去堆雪人吧！', '雪地里的脚印好好看，像画一样。'];
                } else {
                    replies = [name + '眼睛亮了，"下雪了！好漂亮！我们等雪停了去堆雪人吧！"', name + '趴在窗边看，"雪地里的脚印好好看，像画一样。"'];
                }
            }
        } else if (npcId === 'a_fu') {
            if (isRain) {
                if (usePureDialogue) {
                    replies = ['下雨天客人少，正好歇歇。来杯热茶？', '雨天的茶馆最舒服了，暖和又安静。', '外头雨大，客官进来坐坐，喝杯热茶！'];
                } else {
                    replies = [name + '擦了擦柜台，"下雨天客人少，正好歇歇。来杯热茶？"', name + '倒了杯茶递过来，"雨天的茶馆最舒服了，暖和又安静。"', name + '招呼道，"外头雨大，客官进来坐坐，喝杯热茶！"'];
                }
            } else if (isStorm) {
                if (usePureDialogue) {
                    replies = ['暴风雨天，一个客人都没有。', '这雷打得，茶杯都在抖。'];
                } else {
                    replies = [name + '叹了口气，"暴风雨天，一个客人都没有。"', name + '看了看发抖的茶杯，"这雷打得，茶杯都在抖。"'];
                }
            } else if (isSnow) {
                if (usePureDialogue) {
                    replies = ['下雪天来杯热茶最舒服了！', '雪天的茶馆，暖和，客官多坐会儿。'];
                } else {
                    replies = [name + '端来一杯热茶，"下雪天来杯热茶最舒服了！"', name + '添了把火，"雪天的茶馆，暖和，客官多坐会儿。"'];
                }
            }
        } else if (npcId === 'tie_zhao') {
            if (isRain) {
                if (usePureDialogue) {
                    replies = ['下雨天铁铺里潮，打不了铁。', '雨天铁容易生锈，得赶紧擦油。', '下雨天就适合待在铁铺里，炉子暖和。'];
                } else {
                    replies = [name + '看了看炉子，"下雨天铁铺里潮，打不了铁。"', name + '擦着一把旧刀，"雨天铁容易生锈，得赶紧擦油。"', name + '坐在炉边，"下雨天就适合待在铁铺里，炉子暖和。"'];
                }
            } else if (isStorm) {
                if (usePureDialogue) {
                    replies = ['暴风雨，炉火都点不着。', '打雷的时候别靠近铁炉，导电。'];
                } else {
                    replies = [name + '摇了摇头，"暴风雨，炉火都点不着。"', name + '严肃地说，"打雷的时候别靠近铁炉，导电。"'];
                }
            } else if (isSnow) {
                if (usePureDialogue) {
                    replies = ['下雪天冷，铁淬火快，反而好打。', '下雪了，炉子边最暖和。'];
                } else {
                    replies = [name + '锤了锤铁块，"下雪天冷，铁淬火快，反而好打。"', name + '往炉子里加了块炭，"下雪了，炉子边最暖和。"'];
                }
            }
        } else {
            // 通用天气回复
            if (isRain) {
                if (usePureDialogue) {
                    replies = ['下雨了，你带伞了没？', '下雨天就适合待在屋里。', '这雨下得真不小啊。'];
                } else {
                    replies = [name + '看了看窗外，"下雨了，你带伞了没？"', name + '坐了下来，"下雨天就适合待在屋里。"', name + '听了听雨声，"这雨下得真不小啊。"'];
                }
            } else if (isStorm) {
                if (usePureDialogue) {
                    replies = ['暴风雨来了，千万别出门！', '打雷了，吓我一跳。'];
                } else {
                    replies = [name + '关紧了门窗，"暴风雨来了，千万别出门！"', name + '缩了缩脖子，"打雷了，吓我一跳。"'];
                }
            } else if (isSnow) {
                if (usePureDialogue) {
                    replies = ['下雪了！好漂亮。', '冷死了，得多穿点。'];
                } else {
                    replies = [name + '看着窗外，"下雪了！好漂亮。"', name + '搓了搓手，"冷死了，得多穿点。"'];
                }
            }
        }
        return replies;
    }

    // ── 身份特色回复生成 ──────────────────────────────────────
    // 解决"NPC不说具体内容，只说通用词汇"的问题
    // 三层维度：身份（type）+ 性格（personality）+ 心情（mood）
    // 所有 intent 都走这里，确保每个NPC的回复都符合个人特征

    /**
     * 各类型NPC的具体事物词库 — 让回复有"干货"而不是通用模板
     * key = profile.type，value = { ask_trade: [...], ask_craft: [...], ... }
     * 覆盖8种类型：merchant/artisan/sect_outer/wanderer/teahouse_staff/teahouse_regular/townsfolk/hidden
     */
    var TYPE_TOPIC_WORDS = {
        merchant: {
            ask_trade: ['茶叶', '布匹', '盐', '糖', '瓷器', '药材', '丝绸', '香料', '铜器', '漆器', '米面', '腊肉'],
            ask_work: ['进货', '算账', '招呼客人', '盘货', '讨价还价', '走商'],
            ask_news: ['哪边又打仗了', '哪条路不通了', '哪样货紧俏了', '哪家的买卖黄了'],
            listen: ['这批货', '这笔买卖', '这个客人', '今天的流水', '那笔账'],
            confirm: ['这批货', '这笔买卖', '今天的行情'],
            comfort: ['生意难做', '行情不好', '客人难缠'],
            share_joy: ['今天大赚了一笔', '来了个大主顾', '货卖得特别顺'],
            help: ['搭把手盘货', '帮我看会儿摊子', '帮我搬几箱货'],
            accompany: ['一起去进点货', '一起去趟集市', '陪我看看新货'],
            encourage: ['生意会好起来的', '行情会转的', '别愁卖不出去']
        },
        artisan: {
            ask_craft: ['这把刀', '这个榫卯', '这炉火', '这把锤子', '这道工序', '这块料子'],
            ask_work: ['打铁', '刨木', '上釉', '纺线', '雕刻', '淬火'],
            ask_news: ['哪家的活儿急', '哪位师傅收徒了', '哪种料子涨价了'],
            listen: ['这活儿', '这件家什', '这炉火', '这块料'],
            confirm: ['这活儿', '这件家什', '这道工序'],
            comfort: ['活儿不顺手', '料子不趁手', '火候没掌握好'],
            share_joy: ['今天打出件好东西', '来了个大活儿', '手艺被夸了'],
            help: ['搭把手拉风箱', '帮我递个工具', '帮我看会儿炉子'],
            accompany: ['一起去选料', '一起去送活儿', '陪我去趟铁铺'],
            encourage: ['手艺会精进的', '活儿会越做越顺', '别急，慢慢来']
        },
        sect_outer: {
            ask_cultivation: ['吐纳', '站桩', '剑法', '心法', '步法', '丹道'],
            ask_work: ['晨练', '巡山', '洒扫', '抄经', '值守'],
            ask_news: ['哪位师兄突破了', '山门外来了生人', '掌门闭关了'],
            listen: ['修炼', '这门功法', '这次任务', '师门的事'],
            confirm: ['修炼', '这门功法', '师门的规矩'],
            comfort: ['修炼遇瓶颈', '功法练岔了', '被师傅训了'],
            share_joy: ['突破了', '师傅夸我了', '功法练成了'],
            help: ['陪我练练手', '帮我护法', '帮我看着点'],
            accompany: ['一起去后山', '一起去藏经阁', '陪我巡趟山'],
            encourage: ['修炼贵在坚持', '瓶颈总会过的', '心静自然成']
        },
        wanderer: {
            ask_travel: ['北边的大漠', '南边的瘴气林', '东海的渔村', '西边的古道', '中原的集市'],
            ask_news: ['哪边闹山贼了', '哪座城换了主人', '哪条河发大水了'],
            ask_work: ['赶路', '找落脚点', '打探消息', '修整装备'],
            listen: ['这条路', '这趟差事', '这个地界', '外头的事'],
            confirm: ['这条路', '这个地界', '外头的消息'],
            comfort: ['路上不顺', '碰上麻烦了', '盘缠不够了'],
            share_joy: ['今天碰到件稀罕事', '路上交了个朋友', '捡了个便宜'],
            help: ['搭把手搬行李', '帮我看着马', '帮我打听个事'],
            accompany: ['一起走段路', '一起去下个镇子', '结伴同行'],
            encourage: ['路会越走越顺', '前头总有落脚处', '别愁，走着走着就有了']
        },
        teahouse_staff: {
            ask_work: ['沏茶', '擦桌子', '招呼客人', '算茶钱', '添水', '备茶点'],
            ask_news: ['哪位茶客说了新鲜事', '哪家的八卦', '镇上来了生面孔'],
            listen: ['这壶茶', '这位客官', '今天的生意', '茶馆的事'],
            confirm: ['这壶茶', '这位客官', '茶馆的规矩'],
            comfort: ['忙得脚不沾地', '客人难伺候', '茶具被打碎了'],
            share_joy: ['今天客人特别多', '茶钱收了不少', '新茶到了'],
            help: ['搭把手擦桌子', '帮我添下水', '帮我招呼下客人'],
            accompany: ['一起去进茶叶', '一起去趟水井', '陪我去后厨'],
            encourage: ['忙过这阵就好了', '客人会越来越多的', '别累着了']
        },
        teahouse_regular: {
            ask_news: ['茶馆里听来的', '哪位茶客说的', '镇上的新鲜事'],
            ask_work: ['喝茶', '听书', '闲聊', '下棋'],
            listen: ['这壶茶', '这局棋', '这段书', '茶馆的事'],
            confirm: ['这壶茶', '这段书', '茶馆的八卦'],
            comfort: ['茶凉了', '棋输了', '书没听全'],
            share_joy: ['今天茶特别好', '棋赢了', '书听痛快了'],
            help: ['帮我倒杯茶', '帮我看着位子', '帮我点个心'],
            accompany: ['一起喝一壶', '一起听段书', '陪我下盘棋'],
            encourage: ['茶会越喝越有味', '棋会越下越好', '别愁，喝茶']
        },
        townsfolk: {
            ask_work: ['干活', '操持家务', '跑腿', '张罗日子'],
            ask_news: ['镇上的新鲜事', '邻里的八卦', '谁家出事了'],
            listen: ['家里的事', '这档子事', '日子的事'],
            confirm: ['家里的事', '这档子事', '镇上的事'],
            comfort: ['日子难过', '家里出了点事', '手头紧'],
            share_joy: ['家里有喜事', '日子顺当了', '孩子出息了'],
            help: ['搭把手搬个东西', '帮我看会儿孩子', '帮我跑个腿'],
            accompany: ['一起去趟集市', '一起去井边', '陪我走走'],
            encourage: ['日子会好起来的', '别愁，慢慢来', '总会过去的']
        },
        hidden: {
            ask_cultivation: ['天道', '因果', '机缘', '命数', '心魔', '道心'],
            ask_news: ['天象有变', '气运流转', '劫数将至', '因果纠缠'],
            ask_travel: ['三界之外', '虚空深处', '禁地', '古战场'],
            listen: ['天机', '这段因果', '这个劫数', '命数'],
            confirm: ['天机', '命数', '因果'],
            comfort: ['道心不稳', '心魔作祟', '劫数难逃'],
            share_joy: ['悟了点东西', '破了层心魔', '机缘到了'],
            help: ['替我看着点', '帮我护法', '帮我办件事'],
            accompany: ['一起去个地方', '陪我去办件事', '随我走一趟'],
            encourage: ['道心要稳', '劫数总会过的', '机缘未到而已']
        }
    };

    /**
     * 性格修饰器 — 根据NPC性格维度调整回复语气
     * 让相同身份的NPC因性格不同而说话方式不同
     * 限制：每条回复最多2层修饰，避免过度堆叠
     */
    function _applyPersonalityFlavor(text, personality, npcType) {
        if (!personality) return text;
        var p = personality;
        var shiftCount = 0;  // 已应用的修饰层数
        var MAX_SHIFTS = 1;  // 最多1层修饰（避免堆叠）

        // hidden类型NPC（神秘老人/隐士）不加冒险/好奇修饰，保持神秘感
        var isHidden = (npcType === 'hidden');

        // 高热情 → 加感叹号、更亲切
        if (shiftCount < MAX_SHIFTS && p.warmth >= 70 && Math.random() < 0.3) {
            text = text.replace(/。$/, '！');
            shiftCount++;
        }
        // 低热情 → 去感叹号、更冷淡
        if (shiftCount < MAX_SHIFTS && p.warmth <= 25 && Math.random() < 0.4) {
            text = text.replace(/！$/, '。');
            text = text.replace(/啊/g, '').replace(/呢/g, '');
            shiftCount++;
        }
        // 高幽默 → 加调侃后缀
        if (shiftCount < MAX_SHIFTS && p.humor >= 70 && Math.random() < 0.2) {
            var jokes = ['哈哈！', '你说是不是？', '逗你的。', '别当真。'];
            if (!/[！。]$/.test(text) || Math.random() < 0.5) {
                text = text + ' ' + pick(jokes);
                shiftCount++;
            }
        }
        // 高固执 → 加"反正我就是这么想的"
        if (shiftCount < MAX_SHIFTS && p.stubbornness >= 80 && Math.random() < 0.15) {
            text = text + ' 反正我是这么想的。';
            shiftCount++;
        }
        // 高谨慎 → 加"不过也不好说"
        if (shiftCount < MAX_SHIFTS && p.caution >= 80 && Math.random() < 0.15) {
            text = text + ' 不过也不好说。';
            shiftCount++;
        }
        // 高自尊 → 加"我可不是那种人"
        if (shiftCount < MAX_SHIFTS && p.pride >= 80 && Math.random() < 0.15) {
            var prideSuffixes = [' 我可不是那种人。', ' 这事儿我说了算。', ' 嗯，我主意已定。'];
            text = text + pick(prideSuffixes);
            shiftCount++;
        }
        // 低耐心 → 加"行了行了"（概率从0.2降到0.1，避免频繁出现）
        if (shiftCount < MAX_SHIFTS && p.patience <= 25 && Math.random() < 0.1) {
            text = text + ' 行了行了，不说了。';
            shiftCount++;
        }
        // 高好奇 → 加"你知道吗？"（hidden类型跳过）
        if (!isHidden && shiftCount < MAX_SHIFTS && p.curiosity >= 80 && Math.random() < 0.15) {
            text = text + ' 你知道吗？';
            shiftCount++;
        }
        // 高冒险 → 加"改天一起去"（hidden类型跳过）
        if (!isHidden && shiftCount < MAX_SHIFTS && p.adventure >= 70 && Math.random() < 0.15) {
            text = text + ' 改天一起去？';
            shiftCount++;
        }
        return text;
    };

    /**
     * 心情修饰器 — 根据NPC当前心情调整回复
     * mood < 30: 低落；30-70: 平静；> 70: 高兴
     */
    function _applyMoodFlavor(text, mood) {
        if (mood < 30 && Math.random() < 0.4) {
            // 低落：加叹息、省略号
            var lowSuffixes = [' ……算了。', ' 唉。', ' ……不说了。', ' 没意思。'];
            if (!/[。！]$/.test(text) || Math.random() < 0.5) {
                text = text + pick(lowSuffixes);
            }
        } else if (mood > 70 && Math.random() < 0.4) {
            // 高兴：加笑声、感叹
            var highSuffixes = [' 哈哈！', ' 今天真顺！', ' 心情好着呢！', ' 真舒坦！'];
            text = text + pick(highSuffixes);
        }
        return text;
    };

    // ── 记忆系统：玩家对话写入记忆 + 开场白读取记忆 ──

    /**
     * 玩家关键事件关键词库（用于识别玩家选项中的关键事件）
     * 当玩家选项包含这些词时，写入NPC记忆
     */
    var PLAYER_EVENT_PATTERNS = {
        // 健康/身体相关
        health: { words: ['生病', '病', '不舒服', '难受', '疼', '头痛', '发烧', '咳嗽', '受伤', '摔'], template: '玩家生病/身体不适', importance: 80 },
        // 出行相关
        travel: { words: ['出远门', '远行', '上路', '离开', '回来', '刚到', '路过', '经过'], template: '玩家出行/归来', importance: 60 },
        // 麻烦/困境
        trouble: { words: ['麻烦', '困境', '难处', '困难', '倒霉', '出事', '惹事', '被人欺负'], template: '玩家遇到麻烦', importance: 75 },
        // 好事
        good: { words: ['发财', '升官', '中举', '喜事', '婚事', '添丁', '丰收', '赚了'], template: '玩家遇到好事', importance: 70 },
        // 家事
        family: { words: ['家里', '父亲', '母亲', '妻子', '丈夫', '儿子', '女儿', '老父', '老母'], template: '玩家提到家事', importance: 65 },
        // 生意
        business: { words: ['生意', '买卖', '店铺', '货物', '亏本', '赚钱', '开张'], template: '玩家提到生意', importance: 55 }
    };

    /**
     * 从玩家选项提取关键事件
     * @param {string} playerOption - 玩家选项文本
     * @returns {object|null} {category, template, importance} 或 null
     */
    function _extractPlayerEvent(playerOption) {
        if (!playerOption) return null;
        var text = playerOption;

        for (var cat in PLAYER_EVENT_PATTERNS) {
            var pattern = PLAYER_EVENT_PATTERNS[cat];
            for (var i = 0; i < pattern.words.length; i++) {
                if (text.indexOf(pattern.words[i]) >= 0) {
                    return {
                        category: cat,
                        keyword: pattern.words[i],
                        template: pattern.template,
                        importance: pattern.importance
                    };
                }
            }
        }
        return null;
    }

    /**
     * 将玩家关键事件写入NPC记忆
     * @param {string} npcId - NPC ID
     * @param {string} playerOption - 玩家选项文本
     * @returns {boolean} 是否写入成功
     */
    function _writePlayerMemory(npcId, playerOption) {
        if (!window.SoulTick || !window.SoulBridge) return false;

        var event = _extractPlayerEvent(playerOption);
        if (!event) return false;

        var state = SoulTick.getNpcState(npcId);
        if (!state) return false;

        // 写入important记忆（玩家事件属于重要记忆）
        SoulBridge.addTaggedMemory(state, 'important', 'player_event', event.template + '：' + event.keyword, {
            importance: event.importance,
            emotionValue: 0,
            confidence: 1.0,
            tags: ['player_event', event.category]
        });

        return true;
    }

    /**
     * 从NPC记忆读取玩家相关事件，生成开场白追忆
     * @param {string} npcId - NPC ID
     * @returns {string} 追忆文本（空字符串表示无记忆）
     */
    function _readPlayerMemoryForOpening(npcId) {
        if (!window.SoulTick || !window.SoulBridge) return '';

        var state = SoulTick.getNpcState(npcId);
        if (!state) return '';

        // 获取玩家事件记忆
        var memories = SoulBridge.getTopMemories(state, ['player_event'], 1);
        if (!memories || memories.length === 0) return '';

        var mem = memories[0];
        var content = mem.content || '';

        // 根据记忆类别生成追忆
        // 解析记忆内容（格式："类别描述：关键词"）
        var parts = content.split('：');
        var keyword = parts.length > 1 ? parts[1] : parts[0];

        // 根据category生成不同的追忆
        var tags = mem.tags || [];
        var category = '';
        for (var i = 0; i < tags.length; i++) {
            if (tags[i] !== 'player_event') {
                category = tags[i];
                break;
            }
        }

        var memoryReplies = {
            health: [
                '对了，你上次说' + keyword + '，好点没？',
                '你那' + keyword + '的毛病，咋样了？',
                '上次听你说' + keyword + '，现在没事了吧？'
            ],
            travel: [
                '上次你说要' + keyword + '，去了没？',
                '你那趟' + keyword + '，咋样？',
                '上次听你说' + keyword + '，回来了？'
            ],
            trouble: [
                '上次你说的' + keyword + '，解决了没？',
                '你那' + keyword + '的事，咋样了？',
                '上次听你说' + keyword + '，现在没事了吧？'
            ],
            good: [
                '上次你说的' + keyword + '，恭喜啊！',
                '你那' + keyword + '的好事，成了？',
                '上次听你说' + keyword + '，真好啊！'
            ],
            family: [
                '上次你说' + keyword + '，家里都好？',
                '你家里那事，咋样了？',
                '上次听你说' + keyword + '，没事吧？'
            ],
            business: [
                '上次你说' + keyword + '，生意咋样？',
                '你那' + keyword + '的事，成了没？',
                '上次听你说' + keyword + '，现在咋样？'
            ]
        };

        var replies = memoryReplies[category] || memoryReplies.trouble;
        return pick(replies);
    }

    // ── NPC主动话题：根据记忆/情绪/关系/性格主动发起不同类型对话 ──

    /**
     * 生成NPC主动话题
     * 触发优先级：记忆追忆 > 愤怒余气 > 情绪倾诉 > 关系驱动 > 性格驱动
     * @param {string} npcId - NPC ID
     * @param {object} profile - NPC档案
     * @param {object} state - NPC状态
     * @param {number} rel - 好感度
     * @returns {string} 主动话题文本（空字符串表示不触发，走默认开场白）
     */
    function _generateInitiativeTopic(npcId, profile, state, rel) {
        if (!profile || !state) return '';

        var name = profile.name;
        var mood = state.mood || 50;
        var angerLevel = state.angerLevel || 0;
        var coldTurns = state.coldTurns || 0;
        var p = profile.personality || {};

        // ── 优先级0：记忆追忆——NPC记得玩家上次说的事，主动提起 ──
        // 让记忆系统真正影响主动话题，形成"写入→读取→主动提起"闭环
        if (Math.random() < 0.35) {
            try {
                var memoryTopic = _readPlayerMemoryForOpening(npcId);
                if (memoryTopic) {
                    return memoryTopic;
                }
            } catch (e) { /* 忽略，走后续优先级 */ }
        }

        // ── 优先级0.5：裂痕事件追忆——NPC刚发生冲突/崩溃/被安慰，主动提起 ──
        // 让裂痕事件影响主动话题，形成"事件触发→记录历史→主动提起"闭环
        if (state.recentRiftEvents && state.recentRiftEvents.length > 0 && Math.random() < 0.5) {
            var recentRift = state.recentRiftEvents[0];
            var otherName = recentRift.counterpartName || '那个人';
            // 10分钟内的事件才提起
            if (Date.now() - recentRift.timestamp < 10 * 60 * 1000) {
                var riftTopics = [];
                if (recentRift.type === 'npc_conflict') {
                    riftTopics = [
                        '（气呼呼）刚才跟' + otherName + '吵了一架，真是气死我了！',
                        '别提了，' + otherName + '那家伙，简直不可理喻。',
                        '我跟' + otherName + '闹翻了，你说我该咋办？'
                    ];
                } else if (recentRift.type === 'npc_breakdown') {
                    riftTopics = [
                        '（眼眶红红的）刚才真是不好意思，失态了……',
                        '唉，刚才没控制住情绪，让你见笑了。',
                        '刚才那会儿，我差点就撑不住了。'
                    ];
                } else if (recentRift.type === 'npc_nostalgia') {
                    riftTopics = [
                        '刚才路过老地方，想起不少往事……',
                        '触景生情啊，这地方承载了太多回忆。',
                        '刚才站在那儿，恍惚间像回到了从前。'
                    ];
                } else if (recentRift.type === 'npc_comfort') {
                    riftTopics = [
                        '刚才' + otherName + '来安慰我，心里好受多了。',
                        '没想到' + otherName + '还挺会关心人的。',
                        '刚才那会儿多亏了' + otherName + '，不然我还缓不过来。'
                    ];
                }
                if (riftTopics.length > 0) {
                    return pick(riftTopics);
                }
            }
        }

        // ── 优先级1：愤怒余气——NPC还在生气，开场带刺 ──
        if (angerLevel > 50 || coldTurns > 0) {
            return pick([
                '（看了你一眼，没好气）又来了？',
                '哼，你还记得来找我？',
                '（爱理不理）有事？',
                '我现在不想说话。'
            ]);
        }

        // ── 优先级2：情绪倾诉——NPC心情极端时主动倾诉 ──
        // 心情极低：倾诉烦恼
        if (mood < 20) {
            var sadTopics = [
                '唉，今天心里不痛快，想找人说说话。',
                '你来了正好，我最近烦得很。',
                '不知道该跟谁说，跟你说说吧。',
                '今天倒霉透了，听我念叨念叨。'
            ];
            // 高好感更愿意倾诉
            if (rel >= 60) {
                sadTopics.push('也就你了，别人我才不说。');
                sadTopics.push('跟你说实话吧，我最近不太好。');
            }
            return pick(sadTopics);
        }
        // 心情极高：分享喜悦
        if (mood > 80) {
            var joyTopics = [
                '今天太高兴了，必须跟你说说！',
                '你猜怎么着？今天好事不断！',
                '哈哈，今天运气真好！',
                '心情好得很，跟你分享个事！'
            ];
            return pick(joyTopics);
        }

        // ── 优先级3：关系驱动 ──
        // 高好感：分享秘密/私人话题
        if (rel >= 75 && Math.random() < 0.4) {
            var intimateTopics = [
                '跟你说个事，你别告诉别人。',
                '最近我一直在想一件事……',
                '有些话一直想跟你说。',
                '你算是我在这个镇上最信得过的人了。'
            ];
            return pick(intimateTopics);
        }
        // 低好感：客套疏远
        if (rel < 25 && Math.random() < 0.3) {
            return pick([
                '（礼貌点头）有事？',
                '嗯，你好。',
                '（客套）今天怎么想到来找我？'
            ]);
        }

        // ── 优先级4：性格驱动 ──
        // 高好奇：追问玩家近况
        if ((p.curiosity || 0) >= 80 && Math.random() < 0.35) {
            return pick([
                '对了，你最近咋样？',
                '说说你呗，最近有啥新鲜事？',
                '你最近忙啥呢？',
                '好久没听你说你的事了。'
            ]);
        }
        // 高热情：主动邀请
        if ((p.warmth || 0) >= 75 && Math.random() < 0.3) {
            return pick([
                '来来来，坐会儿！',
                '正好你来了，一起喝杯茶？',
                '稀客啊！快坐快坐。',
                '你来得正好，我正想找人聊聊。'
            ]);
        }
        // 高孤独：找人聊天
        if ((state.socialNeed || 0) > 70 && Math.random() < 0.4) {
            return pick([
                '一个人待着闷得慌，你来了正好。',
                '总算有人来了，一个人快闷死了。',
                '你不知道，一个人待着多无聊。',
                '有人说话就是好。'
            ]);
        }

        return ''; // 不触发主动话题，走默认开场白
    }

    // ── 愤怒机制：NPC在特定场景下会生气，影响回复风格、mood、好感度 ──

    /**
     * 愤怒触发场景配置
     * 每个场景定义：NPC语境条件 + 玩家反面intent → 愤怒增量、mood影响、rel影响
     */
    var ANGER_TRIGGERS = {
        // 场景1：NPC伤心/沮丧 + 玩家幸灾乐祸/调侃/漠不关心
        // 注意：hasComplaint中'气'字会误匹配"运气/天气"，所以要求mood<40才认hasComplaint
        npc_sad_player_jeer: {
            npcCond: function(ctx, mood) { return mood < 30 || ctx.hasSelfMock || (ctx.hasComplaint && mood < 40 && !ctx.hasAnger); },
            badIntents: ['celebrate', 'tease', 'downplay', 'share_joy'],
            angerDelta: 35,
            moodDelta: -8,
            relDelta: -5,
            angerReply: function(name) {
                return pick([
                    '（脸色一沉）我现在没心情听这些。',
                    '你觉得这好笑？',
                    '我跟你掏心窝子，你就这态度？',
                    '行了，不想说了。',
                    '你压根没把我说的当回事。'
                ]);
            }
        },
        // 场景2：NPC分享喜悦 + 玩家泼冷水/调侃
        npc_joy_player_cold: {
            npcCond: function(ctx, mood) { return ctx.hasJoy || ctx.hasBoast; },
            badIntents: ['tease'],
            angerDelta: 20,
            moodDelta: -5,
            relDelta: -3,
            angerReply: function(name) {
                return pick([
                    '我高兴一下怎么了？',
                    '你就不能替我高兴一回？',
                    '行吧，扫兴。',
                    '（撇嘴）随便你。'
                ]);
            }
        },
        // 场景3：NPC求助/建议 + 玩家无视/拒绝
        npc_suggest_player_ignore: {
            npcCond: function(ctx, mood) { return ctx.hasSuggestion; },
            badIntents: ['delay', 'accept_refuse'],
            angerDelta: 15,
            moodDelta: -3,
            relDelta: -2,
            angerReply: function(name) {
                return pick([
                    '行吧，当我没说。',
                    '那就算了。',
                    '（叹气）也是，你忙。',
                    '没事，我自己想办法。'
                ]);
            }
        },
        // 场景4：NPC感谢 + 玩家过度轻视
        npc_thanks_player_dismiss: {
            npcCond: function(ctx, mood) { return ctx.hasGratitude; },
            badIntents: ['downplay'],
            angerDelta: 10,
            moodDelta: -2,
            relDelta: -1,
            angerReply: function(name) {
                return pick([
                    '我真心谢你，你这样倒显得生分。',
                    '行吧。',
                    '（欲言又止）算了。'
                ]);
            }
        }
    };

    /**
     * 检测是否触发愤怒，并返回愤怒回复
     * @param {object} ctx - NPC语境对象（_analyzeNpcSpeech返回）
     * @param {number} mood - NPC当前心情
     * @param {string} intent - 玩家选项意图
     * @param {string} name - NPC名字
     * @param {object} state - NPC状态（用于读取和更新angerLevel/coldTurns/angerHistory）
     * @returns {object|null} {reply, angerDelta, moodDelta, relDelta, trigger} 或 null（未触发）
     */
    function _checkAngerTrigger(ctx, mood, intent, name, state) {
        if (!ctx || !intent || !state) return null;

        // 冷淡期内：玩家选正面选项可缩短冷淡期
        if (state.coldTurns > 0) {
            var warmIntents = ['comfort', 'care', 'reassure', 'understand', 'accompany', 'listen', 'help', 'encourage'];
            if (warmIntents.indexOf(intent) >= 0) {
                state.coldTurns = Math.max(0, state.coldTurns - 2);
                // 冷淡期内选正面选项，NPC会缓和但仍带点余气
                if (state.angerLevel > 30) {
                    return {
                        reply: pick([
                            '……你还知道关心我。',
                            '（看了你一眼）算你还有良心。',
                            '哼，现在想起来安慰我了。',
                            '……行了，我没事。'
                        ]),
                        angerDelta: -15,
                        moodDelta: 3,
                        relDelta: 2,
                        trigger: 'cold_period_warm'
                    };
                }
            }
        }

        // 检测各愤怒触发场景
        for (var key in ANGER_TRIGGERS) {
            var trigger = ANGER_TRIGGERS[key];
            if (!trigger.npcCond(ctx, mood)) continue;
            if (trigger.badIntents.indexOf(intent) < 0) continue;

            // 检测连续反面选项：angerHistory中最近2次有同类反面intent → 加重愤怒
            var history = state.angerHistory || [];
            var recentBad = history.slice(-2).filter(function(h) {
                return trigger.badIntents.indexOf(h) >= 0;
            });
            var angerMultiplier = 1;
            if (recentBad.length >= 1) {
                angerMultiplier = 1.5; // 连续反面选项加重50%
            }

            var angerDelta = Math.round(trigger.angerDelta * angerMultiplier);
            var moodDelta = Math.round(trigger.moodDelta * angerMultiplier);
            var relDelta = Math.round(trigger.relDelta * angerMultiplier);

            // 记录到angerHistory（保留最近5条）
            state.angerHistory = history.concat([intent]).slice(-5);

            // 设置冷淡期：愤怒值越高，冷淡期越长
            var newAngerLevel = Math.min(100, (state.angerLevel || 0) + angerDelta);
            if (newAngerLevel > 50 && state.coldTurns < 2) {
                state.coldTurns = 2;
            }
            if (newAngerLevel > 80 && state.coldTurns < 4) {
                state.coldTurns = 4;
            }

            return {
                reply: trigger.angerReply(name),
                angerDelta: angerDelta,
                moodDelta: moodDelta,
                relDelta: relDelta,
                trigger: key
            };
        }

        return null;
    }

    /**
     * 冷淡期回复修饰：NPC处于冷淡期时，正常回复被改为冷淡风格
     * @param {string} reply - 原始回复
     * @param {object} state - NPC状态
     * @returns {string} 修饰后的回复
     */
    function _applyColdPeriodTone(reply, state) {
        if (!reply || !state || state.coldTurns <= 0) return reply;

        // 冷淡期内：截断回复，加冷淡语气
        var coldReplies = [
            '嗯。',
            '哦。',
            '知道了。',
            '行吧。',
            '随便。',
            '……',
            '你说啥就是啥。',
            '懒得说了。'
        ];

        // 50%概率直接用冷淡回复，50%概率截断原回复
        if (Math.random() < 0.5) {
            return pick(coldReplies);
        }
        // 截断到第一个句号
        var firstEnd = reply.indexOf('。');
        if (firstEnd > 0 && firstEnd < reply.length - 2) {
            return reply.substring(0, firstEnd + 1);
        }
        return reply;
    }

    // ── NPC骗人系统：基于性格+身份+记忆+情绪判断是否骗人 ──
    // 核心原则：不是所有NPC都会骗人，骗人倾向由多因素综合决定

    /**
     * 计算NPC的骗人倾向值（0-100）
     * 综合因素：性格维度（caution/loyalty/humor/pride）+ 身份 + 情绪 + 关系 + 愤怒
     * @param {object} profile - NPC档案
     * @param {object} state - NPC状态
     * @param {number} rel - 好感度
     * @returns {number} 骗人倾向值 0-100（>50有骗人倾向）
     */
    function _calculateDeceitTendency(profile, state, rel) {
        if (!profile || !profile.personality) return 0;
        var p = profile.personality;
        var mood = state ? (state.mood || 50) : 50;
        var angerLevel = state ? (state.angerLevel || 0) : 0;

        // ── 性格维度基础分（0-60）──
        // 高谨慎 → 倾向隐瞒（+）
        // 低忠诚 → 更可能骗人（+）
        // 高幽默 → 玩笑式欺骗（+，但程度轻）
        // 高自尊 → 被质疑时死撑（+，但只在被质疑时）
        var cautionScore = (p.caution || 50) / 100 * 20;        // 0-20
        var loyaltyScore = (100 - (p.loyalty || 50)) / 100 * 20; // 0-20（低忠诚加分）
        var humorScore = (p.humor || 50) / 100 * 10;             // 0-10
        var prideScore = (p.pride || 50) / 100 * 10;             // 0-10
        var baseScore = cautionScore + loyaltyScore + humorScore + prideScore; // 0-60

        // ── 身份修正（-10~+25）──
        // merchant：商人最容易夸大（+15）
        // wanderer：散修会编故事（+20）
        // sect_outer：宗门弟子相对诚实（-5）
        // artisan：手艺人相对实在（-10）
        // teahouse_regular/townsfolk：普通镇民（0）
        // hidden：神秘人物会隐瞒（+25）
        var typeModifier = 0;
        var type = profile.type || 'townsfolk';
        if (type === 'merchant') typeModifier = 15;
        else if (type === 'wanderer') typeModifier = 20;
        else if (type === 'hidden') typeModifier = 25;
        else if (type === 'sect_outer') typeModifier = -5;
        else if (type === 'artisan') typeModifier = -10;
        else if (type === 'teahouse_staff') typeModifier = -5;

        // ── 情绪修正（-15~+20）──
        // 愤怒中 → 恶意骗人倾向大增（+20）
        // 心情极低 → 可能掩饰困境（+10）
        // 心情极高 → 不太会骗人（-5）
        var moodModifier = 0;
        if (angerLevel > 50) moodModifier = 20;
        else if (mood < 25) moodModifier = 10;
        else if (mood > 75) moodModifier = -5;

        // ── 关系修正（-30~0）──
        // 高好感（≥70）→ 几乎不骗人（-30）
        // 中好感（50-69）→ 轻微减少（-10）
        // 低好感（<30）→ 不修正（0）
        var relModifier = 0;
        if (rel >= 70) relModifier = -30;
        else if (rel >= 50) relModifier = -10;

        var total = baseScore + typeModifier + moodModifier + relModifier;
        return Math.max(0, Math.min(100, Math.round(total)));
    }

    /**
     * 骗人触发场景配置
     * 每个场景定义：话题条件 + 骗人类型 + 骗人回复生成
     */
    var DECEIT_TRIGGERS = {
        // 场景1：被问到生意/收入 → 商人夸大
        business_exaggerate: {
            topicCond: function(playerOption, lastNpcText) {
                var businessWords = ['生意', '买卖', '赚', '收入', '多少钱', '生意咋样', '开张'];
                for (var i = 0; i < businessWords.length; i++) {
                    if (playerOption.indexOf(businessWords[i]) >= 0 || lastNpcText.indexOf(businessWords[i]) >= 0) return true;
                }
                return false;
            },
            typeCond: ['merchant'],
            minTendency: 45,
            generateLie: function(name, profile) {
                return pick([
                    '生意？还行吧，这几天每天都有大主顾。',
                    '凑合，比上不足比下有余，养家糊口没问题。',
                    '还行还行，刚接了个大单子，忙不过来。',
                    '马马虎虎，这年头能稳住就不错了。'
                ]);
            },
            flawWords: ['还行吧', '凑合', '马马虎虎', '大主顾', '大单子']
        },
        // 场景2：被问到过去/来历 → 散修编故事
        past_fabricate: {
            topicCond: function(playerOption, lastNpcText) {
                var pastWords = ['以前', '过去', '来历', '哪里人', '从哪来', '老家', '从前', '当年'];
                for (var i = 0; i < pastWords.length; i++) {
                    if (playerOption.indexOf(pastWords[i]) >= 0) return true;
                }
                return false;
            },
            typeCond: ['wanderer', 'hidden'],
            minTendency: 50,
            generateLie: function(name, profile) {
                return pick([
                    '我？走过的地方多了，最远到过北境，那边雪能埋人。',
                    '以前的事记不太清了，好像是跟着商队走过几趟。',
                    '老家？早没了，记不清了，好像是个小村子。',
                    '当年闯荡过一阵子，见过些世面，具体不说了。'
                ]);
            },
            flawWords: ['记不太清', '好像', '具体不说', '最远到过']
        },
        // 场景3：被问到失败/困境 → 高自尊NPC掩饰
        failure_conceal: {
            topicCond: function(playerOption, lastNpcText) {
                var failWords = ['失败', '输了', '赔了', '亏了', '没成', '搞砸', '倒霉', '出事'];
                for (var i = 0; i < failWords.length; i++) {
                    if (playerOption.indexOf(failWords[i]) >= 0 || lastNpcText.indexOf(failWords[i]) >= 0) return true;
                }
                return false;
            },
            typeCond: null, // 任何身份都可能，取决于pride
            minTendency: 55,
            requireHighPride: true,
            generateLie: function(name, profile) {
                return pick([
                    '没事，小意思，早处理好了。',
                    '哪有什么事？你听谁说的？',
                    '嗐，小事一桩，不值一提。',
                    '没什么大不了的，我心里有数。'
                ]);
            },
            flawWords: ['小意思', '小事一桩', '不值一提', '心里有数', '哪有什么']
        },
        // 场景4：被问到秘密/他人 → 高谨慎NPC隐瞒
        secret_conceal: {
            topicCond: function(playerOption, lastNpcText) {
                var secretWords = ['秘密', '听说', '别人', '那个谁', '怎么回事', '出了什么事', '告诉我'];
                for (var i = 0; i < secretWords.length; i++) {
                    if (playerOption.indexOf(secretWords[i]) >= 0) return true;
                }
                return false;
            },
            typeCond: null,
            minTendency: 60,
            requireHighCaution: true,
            generateLie: function(name, profile) {
                return pick([
                    '这个……我不太清楚。',
                    '没听说啊，你从哪听来的？',
                    '这种事不好乱说。',
                    '我啥也不知道，你别问我。'
                ]);
            },
            flawWords: ['不太清楚', '没听说', '不好乱说', '啥也不知道']
        },
        // 场景5：愤怒中 → 恶意误导
        anger_mislead: {
            topicCond: function() { return true; }, // 愤怒中任何话题都可能
            typeCond: null,
            minTendency: 70,
            requireAnger: true,
            generateLie: function(name, profile) {
                return pick([
                    '你问这个？去问别人吧。',
                    '不知道，自己想去。',
                    '（冷笑）你觉得我会告诉你？',
                    '想知道？自己打听去。'
                ]);
            },
            flawWords: ['去问别人', '自己想', '自己打听']
        }
    };

    /**
     * 检测是否触发骗人，返回骗人回复
     * @param {string} playerOption - 玩家选项
     * @param {string} lastNpcText - NPC上一句话
     * @param {object} profile - NPC档案
     * @param {object} state - NPC状态
     * @param {number} rel - 好感度
     * @returns {object|null} {reply, flawWords, trigger} 或 null（未触发）
     */
    function _checkDeceitTrigger(playerOption, lastNpcText, profile, state, rel) {
        if (!profile || !profile.personality) return null;

        var tendency = _calculateDeceitTendency(profile, state, rel);
        if (tendency < 45) return null; // 骗人倾向太低，不触发

        var p = profile.personality;
        var angerLevel = state ? (state.angerLevel || 0) : 0;

        // 遍历骗人触发场景
        for (var key in DECEIT_TRIGGERS) {
            var trigger = DECEIT_TRIGGERS[key];

            // 检查骗人倾向是否达到该场景阈值
            if (tendency < trigger.minTendency) continue;

            // 检查话题条件
            if (!trigger.topicCond(playerOption, lastNpcText)) continue;

            // 检查身份条件
            if (trigger.typeCond && trigger.typeCond.indexOf(profile.type) < 0) continue;

            // 检查特殊性格要求
            if (trigger.requireHighPride && (p.pride || 0) < 70) continue;
            if (trigger.requireHighCaution && (p.caution || 0) < 70) continue;
            if (trigger.requireAnger && angerLevel < 50) continue;

            // 触发骗人
            var lie = trigger.generateLie(profile.name, profile);
            return {
                reply: lie,
                flawWords: trigger.flawWords,
                trigger: key,
                tendency: tendency
            };
        }

        return null;
    }

    /**
     * 被质疑反应：玩家质疑NPC时，根据性格和是否在骗人做出反应
     * @param {object} profile - NPC档案
     * @param {object} state - NPC状态
     * @param {boolean} wasLying - 上一轮是否在骗人
     * @returns {string} 被质疑反应回复
     */
    function _generateDoubtReaction(profile, state, wasLying) {
        if (!profile || !profile.personality) return '你说啥？';
        var p = profile.personality;
        var name = profile.name;

        if (wasLying) {
            // 在骗人被质疑：根据性格反应
            // 低自尊 → 可能承认（优先判断，因为低自尊更容易松口）
            if ((p.pride || 0) < 40) {
                return pick([
                    '……好吧，其实没那么回事。',
                    '让你看出来了，其实……算了。',
                    '（叹气）跟你说实话吧，其实没那么好。',
                    '瞒不住你，其实情况没那么好。'
                ]);
            }
            // 高自尊 → 死撑
            if ((p.pride || 0) >= 75) {
                return pick([
                    '嘿！我说的可是真的，你不信拉倒！',
                    '你这是啥意思？我骗你不成？',
                    '爱信不信，反正我说的是真的。',
                    '（板着脸）我像骗人的人吗？'
                ]);
            }
            // 高幽默 → 打哈哈混过去
            if ((p.humor || 0) >= 70) {
                return pick([
                    '哈哈，你这话说的，我哪敢骗你。',
                    '别多想，跟你说着玩呢。',
                    '嗐，你还挺精，不过我真没骗你。',
                    '（干笑）你想多了。'
                ]);
            }
            // 默认：半推半就
            return pick([
                '你咋不信呢？真的是这样。',
                '我骗你干啥？',
                '信不信由你。',
                '……算了，你爱怎么想怎么想。'
            ]);
        } else {
            // 没骗人被质疑：委屈/生气
            // 愤怒中 → 更生气
            if (state && (state.angerLevel || 0) > 50) {
                return pick([
                    '你还不信我？行。',
                    '（冷笑）随便你怎么想。',
                    '我懒得解释。'
                ]);
            }
            return pick([
                '嘿，我好心跟你说，你还怀疑我？',
                '你不信？那我也没办法。',
                '真的，我骗你干啥。',
                '你这是看不起人啊。'
            ]);
        }
    }

    // ── 裂痕系统：NPC自主意识驱动的事件引擎 ──
    // 核心原则：事件由NPC的关系网、性格、情绪、地点等自主因素动态触发
    // 让玩家仿佛在体验一个真实的世界

    /**
     * 裂痕事件类型配置
     * 每种事件定义：触发条件 + 事件描述生成 + 效果（关系/心情/传播）
     */
    var RIFT_EVENT_TYPES = {
        // 事件1：NPC冲突——两个关系差的NPC相遇，某方愤怒爆发
        npc_conflict: {
            check: function(npcA, stateA, profileA, npcB, stateB, profileB, rel) {
                // 条件：关系<30 + 某方愤怒>50 + 某方固执高（不肯让步）
                if (rel >= 30) return null;
                var angerA = (stateA && stateA.angerLevel) || 0;
                var angerB = (stateB && stateB.angerLevel) || 0;
                if (angerA < 50 && angerB < 50) return null;
                var stubbornA = (profileA && profileA.personality && profileA.personality.stubbornness) || 50;
                var stubbornB = (profileB && profileB.personality && profileB.personality.stubbornness) || 50;
                if (stubbornA < 60 && stubbornB < 60) return null;

                // 谁先发火
                var initiator = angerA >= angerB ? npcA : npcB;
                var target = angerA >= angerB ? npcB : npcA;
                var initProfile = angerA >= angerB ? profileA : profileB;
                var initName = initProfile ? initProfile.name : initiator;

                return {
                    initiator: initiator,
                    target: target,
                    desc: pick([
                        initName + '脸色一沉，跟旁边的人呛了起来："你还有脸出现在这？"',
                        initName + '冷哼一声："看见你就来气。"',
                        initName + '猛地拍桌子："我忍你很久了！"',
                        initName + '瞪着对方："咱俩的事，今天说清楚。"'
                    ]),
                    effect: { relDelta: -8, moodDeltaA: -5, moodDeltaB: -8, spreadRadius: 200 }
                };
            }
        },
        // 事件2：NPC崩溃——心情极低 + 社交需求高 + 无人理
        npc_breakdown: {
            check: function(npcA, stateA, profileA) {
                if (!stateA) return null;
                var mood = stateA.mood || 50;
                var socialNeed = stateA.socialNeed || 0;
                var angerLevel = stateA.angerLevel || 0;
                // 条件：心情<15 + 社交需求>70（孤独到极点）
                if (mood >= 15 || socialNeed < 70) return null;
                // 愤怒中的NPC更容易崩溃
                if (angerLevel < 30 && Math.random() > 0.3) return null;

                var name = profileA ? profileA.name : npcA;
                return {
                    initiator: npcA,
                    target: null,
                    desc: pick([
                        name + '一个人蹲在角落，肩膀微微发抖，不知道在想什么。',
                        name + '突然红了眼眶，别过头去："没事……就是心里堵得慌。"',
                        name + '长叹一口气，整个人像是被抽空了："这日子，什么时候是个头。"',
                        name + '攥紧了拳头，又慢慢松开，低声说："算了，说了也没人懂。"'
                    ]),
                    effect: { relDelta: 0, moodDeltaA: -3, moodDeltaB: 0, spreadRadius: 150 }
                };
            }
        },
        // 事件3：触景生情——NPC路过喜爱地点 + 心情低 + 有记忆
        npc_nostalgia: {
            check: function(npcA, stateA, profileA) {
                if (!stateA || !profileA) return null;
                var mood = stateA.mood || 50;
                var currentLocation = stateA.decidedLocation;
                var favoriteLocation = profileA.favoriteLocation;
                // 条件：在喜爱地点 + 心情<30
                if (!currentLocation || !favoriteLocation || currentLocation !== favoriteLocation) return null;
                if (mood >= 30) return null;
                // 30%概率触发
                if (Math.random() > 0.3) return null;

                var name = profileA.name;
                return {
                    initiator: npcA,
                    target: null,
                    desc: pick([
                        name + '站在这地方，眼神有些恍惚："以前……算了。"',
                        name + '摸了摸门框，轻声说："还是老样子，一点没变。"',
                        name + '望着远处发呆："那时候要是……唉，不说了。"',
                        name + '苦笑了一下："这地方，多少年没变过了。"'
                    ]),
                    effect: { relDelta: 0, moodDeltaA: -2, moodDeltaB: 0, spreadRadius: 100 }
                };
            }
        },
        // 事件4：NPC安慰他人——高热情NPC遇到低心情NPC
        npc_comfort: {
            check: function(npcA, stateA, profileA, npcB, stateB, profileB, rel) {
                if (!stateA || !stateB || !profileA) return null;
                var warmthA = (profileA.personality && profileA.personality.warmth) || 50;
                var moodB = stateB.mood || 50;
                // 条件：A热情>75 + B心情<30 + 关系>40
                if (warmthA < 75 || moodB >= 30 || rel < 40) return null;
                // 25%概率触发
                if (Math.random() > 0.25) return null;

                var nameA = profileA.name;
                var nameB = profileB ? profileB.name : npcB;
                return {
                    initiator: npcA,
                    target: npcB,
                    desc: pick([
                        nameA + '拍了拍' + nameB + '的肩膀："别丧气，有啥过不去的？"',
                        nameA + '递了杯水给' + nameB + '："喝点，缓缓。"',
                        nameA + '凑过去："咋了这是？跟我说说。"',
                        nameA + '拉了把椅子坐下："我陪你待会儿。"'
                    ]),
                    effect: { relDelta: 3, moodDeltaA: 0, moodDeltaB: 5, spreadRadius: 120 }
                };
            }
        }
    };

    /**
     * 检测所有NPC的裂痕事件
     * 在日初（generateDailyState后）或tick中调用
     * @returns {Array} 触发的事件列表
     */
    function detectRiftEvents() {
        var events = [];
        var allIds = getAllNpcIds();
        if (allIds.length < 1) return events;

        // ── 单NPC事件：崩溃、触景生情 ──
        for (var i = 0; i < allIds.length; i++) {
            var npcId = allIds[i];
            var state = _dailyStates[npcId];
            var profile = NPC_PROFILES[npcId];
            if (!state || !profile) continue;

            // 检测崩溃
            var breakdownEvent = RIFT_EVENT_TYPES.npc_breakdown.check(npcId, state, profile);
            if (breakdownEvent) {
                events.push({
                    type: 'npc_breakdown',
                    npcA: npcId,
                    npcB: null,
                    initiator: breakdownEvent.initiator,
                    target: null,
                    desc: breakdownEvent.desc,
                    effect: breakdownEvent.effect
                });
            }

            // 检测触景生情
            var nostalgiaEvent = RIFT_EVENT_TYPES.npc_nostalgia.check(npcId, state, profile);
            if (nostalgiaEvent) {
                events.push({
                    type: 'npc_nostalgia',
                    npcA: npcId,
                    npcB: null,
                    initiator: nostalgiaEvent.initiator,
                    target: null,
                    desc: nostalgiaEvent.desc,
                    effect: nostalgiaEvent.effect
                });
            }
        }

        // ── 双NPC事件：冲突、安慰 ──
        for (var a = 0; a < allIds.length; a++) {
            for (var b = a + 1; b < allIds.length; b++) {
                var idA = allIds[a];
                var idB = allIds[b];
                var stateA = _dailyStates[idA];
                var stateB = _dailyStates[idB];
                var profileA = NPC_PROFILES[idA];
                var profileB = NPC_PROFILES[idB];
                if (!stateA || !stateB || !profileA || !profileB) continue;

                // 同地点才检测双NPC事件
                if (stateA.decidedLocation !== stateB.decidedLocation) continue;

                // 获取关系值
                var rel = 50;
                if (window.EncounterSystem && EncounterSystem.getRelation) {
                    rel = EncounterSystem.getRelation(idA, idB);
                }

                // 检测冲突
                var conflictEvent = RIFT_EVENT_TYPES.npc_conflict.check(idA, stateA, profileA, idB, stateB, profileB, rel);
                if (conflictEvent) {
                    events.push({
                        type: 'npc_conflict',
                        npcA: idA,
                        npcB: idB,
                        initiator: conflictEvent.initiator,
                        target: conflictEvent.target,
                        desc: conflictEvent.desc,
                        effect: conflictEvent.effect
                    });
                    continue; // 冲突和安慰不会同时发生
                }

                // 检测安慰（双向检测：A安慰B 或 B安慰A）
                var comfortEvent = RIFT_EVENT_TYPES.npc_comfort.check(idA, stateA, profileA, idB, stateB, profileB, rel);
                var comfortInitiator = idA;
                var comfortTarget = idB;
                if (!comfortEvent) {
                    // 反向检测：B安慰A
                    comfortEvent = RIFT_EVENT_TYPES.npc_comfort.check(idB, stateB, profileB, idA, stateA, profileA, rel);
                    comfortInitiator = idB;
                    comfortTarget = idA;
                }
                if (comfortEvent) {
                    // 确保npcA=initiator, npcB=target，这样moodDeltaA应用到initiator，moodDeltaB应用到target
                    events.push({
                        type: 'npc_comfort',
                        npcA: comfortInitiator,
                        npcB: comfortTarget,
                        initiator: comfortEvent.initiator,
                        target: comfortEvent.target,
                        desc: comfortEvent.desc,
                        effect: comfortEvent.effect
                    });
                }
            }
        }

        return events;
    }

    /**
     * 应用裂痕事件效果：修改当事人状态 + 关系网传播
     * @param {object} event - 裂痕事件
     * @returns {object} 应用结果
     */
    function applyRiftEvent(event) {
        if (!event || !event.effect) return { applied: false };

        var effect = event.effect;
        var result = {
            applied: true,
            event: event,
            moodChanges: [],
            relChanges: [],
            spreadEffects: []
        };

        // ── 记录裂痕事件历史到当事人state，供主动话题系统读取 ──
        var riftRecord = {
            type: event.type,
            timestamp: Date.now(),
            counterpart: event.npcB || '',  // 对方NPC ID
            counterpartName: event.npcB ? (DailyEngine.getNpcProfile(event.npcB) ? DailyEngine.getNpcProfile(event.npcB).name : event.npcB) : ''
        };
        if (event.npcA && _dailyStates[event.npcA]) {
            if (!_dailyStates[event.npcA].recentRiftEvents) _dailyStates[event.npcA].recentRiftEvents = [];
            _dailyStates[event.npcA].recentRiftEvents.unshift(riftRecord);
            if (_dailyStates[event.npcA].recentRiftEvents.length > 3) _dailyStates[event.npcA].recentRiftEvents.pop();
        }
        if (event.npcB && _dailyStates[event.npcB]) {
            var riftRecordB = {
                type: event.type,
                timestamp: Date.now(),
                counterpart: event.npcA || '',
                counterpartName: event.npcA ? (DailyEngine.getNpcProfile(event.npcA) ? DailyEngine.getNpcProfile(event.npcA).name : event.npcA) : ''
            };
            if (!_dailyStates[event.npcB].recentRiftEvents) _dailyStates[event.npcB].recentRiftEvents = [];
            _dailyStates[event.npcB].recentRiftEvents.unshift(riftRecordB);
            if (_dailyStates[event.npcB].recentRiftEvents.length > 3) _dailyStates[event.npcB].recentRiftEvents.pop();
        }

        // ── 修改当事人心情 ──
        if (event.npcA && typeof effect.moodDeltaA === 'number' && effect.moodDeltaA !== 0) {
            var stateA = _dailyStates[event.npcA];
            if (stateA) {
                var oldMoodA = stateA.mood;
                stateA.mood = Math.max(0, Math.min(100, stateA.mood + effect.moodDeltaA));
                var moodInfoA = getMoodInfo(stateA.mood);
                stateA.moodLabel = moodInfoA.label;
                stateA.moodEmoji = moodInfoA.emoji;
                result.moodChanges.push({ npcId: event.npcA, oldMood: oldMoodA, newMood: stateA.mood, delta: effect.moodDeltaA });
            }
        }
        if (event.npcB && typeof effect.moodDeltaB === 'number' && effect.moodDeltaB !== 0) {
            var stateB = _dailyStates[event.npcB];
            if (stateB) {
                var oldMoodB = stateB.mood;
                stateB.mood = Math.max(0, Math.min(100, stateB.mood + effect.moodDeltaB));
                var moodInfoB = getMoodInfo(stateB.mood);
                stateB.moodLabel = moodInfoB.label;
                stateB.moodEmoji = moodInfoB.emoji;
                result.moodChanges.push({ npcId: event.npcB, oldMood: oldMoodB, newMood: stateB.mood, delta: effect.moodDeltaB });
            }
        }

        // ── 修改当事人关系 ──
        if (event.npcA && event.npcB && typeof effect.relDelta === 'number' && effect.relDelta !== 0) {
            if (window.EncounterSystem && EncounterSystem.updateRelation) {
                EncounterSystem.updateRelation(event.npcA, event.npcB, effect.relDelta, 'rift_event:' + event.type);
                result.relChanges.push({ npcA: event.npcA, npcB: event.npcB, delta: effect.relDelta });
            }
        }

        // ── 关系网传播：其他NPC根据与当事人的关系做出反应 ──
        if (effect.spreadRadius > 0 && (event.npcA || event.npcB)) {
            var allIds = getAllNpcIds();
            for (var i = 0; i < allIds.length; i++) {
                var bystanderId = allIds[i];
                if (bystanderId === event.npcA || bystanderId === event.npcB) continue;
                var bystanderState = _dailyStates[bystanderId];
                if (!bystanderState) continue;

                // 同地点的NPC才会被影响
                var eventLocation = event.npcA ? (_dailyStates[event.npcA].decidedLocation) : '';
                if (bystanderState.decidedLocation !== eventLocation) continue;

                var spreadEffect = _calculateSpreadEffect(bystanderId, event, bystanderState);
                if (spreadEffect) {
                    // 应用传播效果
                    var oldMood = bystanderState.mood;
                    bystanderState.mood = Math.max(0, Math.min(100, bystanderState.mood + spreadEffect.moodDelta));
                    var spreadMoodInfo = getMoodInfo(bystanderState.mood);
                    bystanderState.moodLabel = spreadMoodInfo.label;
                    bystanderState.moodEmoji = spreadMoodInfo.emoji;
                    result.spreadEffects.push({
                        npcId: bystanderId,
                        oldMood: oldMood,
                        newMood: bystanderState.mood,
                        delta: spreadEffect.moodDelta,
                        reaction: spreadEffect.reaction
                    });
                }
            }
        }

        return result;
    }

    /**
     * 计算旁观者对事件的反应（关系网传播）
     * 根据旁观者与当事人的关系、性格决定反应
     */
    function _calculateSpreadEffect(bystanderId, event, bystanderState) {
        var profile = NPC_PROFILES[bystanderId];
        if (!profile) return null;

        var moodDelta = 0;
        var reaction = '';

        // 冲突事件：旁观者根据关系站队或劝架
        if (event.type === 'npc_conflict') {
            var relWithA = 50, relWithB = 50;
            if (window.EncounterSystem && EncounterSystem.getRelation) {
                relWithA = EncounterSystem.getRelation(bystanderId, event.npcA);
                relWithB = EncounterSystem.getRelation(bystanderId, event.npcB);
            }
            var warmth = (profile.personality && profile.personality.warmth) || 50;
            var patience = (profile.personality && profile.personality.patience) || 50;

            if (relWithA > 60 || relWithB > 60) {
                // 与某方关系好 → 心情受负面影响（担心朋友）
                moodDelta = -3;
                reaction = pick(['皱了皱眉。', '看了一眼，没说话。', '叹了口气。']);
            } else if (warmth > 70 && patience > 60) {
                // 高热情高耐心 → 想劝架，心情略降
                moodDelta = -2;
                reaction = pick(['想上去劝劝。', '犹豫了一下。', '"别吵了。"']);
            } else if (relWithA < 20 && relWithB < 20) {
                // 与双方都不熟 → 无感
                return null;
            } else {
                // 中立 → 轻微不适
                moodDelta = -1;
                reaction = pick(['摇了摇头。', '别过脸去。', '继续干自己的事。']);
            }
        }
        // 崩溃事件：旁观者根据关系和性格反应
        else if (event.type === 'npc_breakdown') {
            var relWithBreakdown = 50;
            if (window.EncounterSystem && EncounterSystem.getRelation) {
                relWithBreakdown = EncounterSystem.getRelation(bystanderId, event.npcA);
            }
            var warmthB = (profile.personality && profile.personality.warmth) || 50;

            if (relWithBreakdown > 60) {
                // 关系好 → 同情，心情受影响
                moodDelta = -4;
                reaction = pick(['看着心疼。', '想过去安慰。', '"这可咋整。"']);
            } else if (warmthB > 70) {
                // 高热情 → 即使不熟也同情
                moodDelta = -2;
                reaction = pick(['叹了口气。', '有些不忍。']);
            } else {
                return null; // 不熟也不热情 → 无感
            }
        }
        // 触景生情：只有同地点且心情也低的人才会被触动
        else if (event.type === 'npc_nostalgia') {
            if ((bystanderState.mood || 50) < 40) {
                moodDelta = -2;
                reaction = pick(['也跟着沉默了。', '触景生情。', '想起了自己的事。']);
            } else {
                return null;
            }
        }
        // 安慰事件：旁观者看到温暖场景，心情微升
        else if (event.type === 'npc_comfort') {
            var warmthC = (profile.personality && profile.personality.warmth) || 50;
            if (warmthC > 60) {
                moodDelta = 2;
                reaction = pick(['微微一笑。', '看着挺暖心的。']);
            } else {
                return null;
            }
        }

        if (moodDelta === 0) return null;
        return { moodDelta: moodDelta, reaction: reaction };
    }

    /**
     * 莫名选项检测+性格分流回应
     * 当玩家选项与NPC原话无语义关联时，NPC按性格回应，强化自主意识
     * 双重判定：关键词交集为0 + intent不匹配
     * 按性格分流：高固执/低耐心→拉回原话题；高好奇/高热情→顺新话题；其他→随机
     * @param {string} playerOption - 玩家选项文本
     * @param {string} lastNpcText - NPC上一句话
     * @param {string} intent - 玩家选项意图
     * @param {object} profile - NPC档案
     * @param {string} name - NPC名字
     * @param {number} mood - NPC心情
     * @returns {string} 回复文本（空字符串表示未触发）
     */
    function _generateWeirdOptionReply(playerOption, lastNpcText, intent, profile, name, mood) {
        if (!playerOption || !lastNpcText || !profile || !profile.personality) return '';

        var p = profile.personality;

        // ── Step 1: 双重判定 ──
        // 判定1：关键词交集为0
        var playerKws = extractKeywords(playerOption);
        var npcKws = extractKeywords(lastNpcText);
        var hasOverlap = false;
        for (var i = 0; i < playerKws.length; i++) {
            for (var j = 0; j < npcKws.length; j++) {
                if (playerKws[i] === npcKws[j] && playerKws[i].length >= 2) {
                    hasOverlap = true;
                    break;
                }
            }
            if (hasOverlap) break;
        }
        // 特殊：玩家选项是"带了/没带/吃了/没吃"等简短回答，与NPC问句有动词关联，不算莫名
        // 检测玩家选项是否是简短回答（≤3字）且NPC在问问题
        var isShortAnswer = playerOption.length <= 3;
        var npcAskingQuestion = /[？?]/.test(lastNpcText);
        if (isShortAnswer && npcAskingQuestion) return '';  // 简短回答问句，不算莫名

        if (hasOverlap) return '';  // 有关键词交集，不算莫名

        // 判定2：intent不匹配（NPC问问题，玩家选了share_joy/celebrate/tease等情绪类intent）
        var weirdIntents = ['share_joy', 'celebrate', 'tease', 'resonate', 'downplay', 'accept_thanks', 'accept_refuse', 'arrange'];
        var isWeirdIntent = weirdIntents.indexOf(intent) >= 0;
        // 豁免列表：这些intent是正常对话回应，即使关键词无交集也不算莫名
        // 收窄范围：只保留真正安全的intent（回答/附和/确认/否认/思考/反弹/澄清）
        // 移除listen/comfort/help/invite等，这些在NPC问句场景下应触发莫名选项检测
        var safeIntents = ['answer', 'agree', 'confirm', 'deny', 'think', 'bounce', 'clarify'];
        var isSafeIntent = safeIntents.indexOf(intent) >= 0;
        // 安全intent直接豁免，不管是否问句都不算莫名
        if (isSafeIntent) return '';
        // 非安全intent且非莫名intent且非问句场景，也不算莫名
        if (!isWeirdIntent && !npcAskingQuestion) return '';

        // ── Step 2: 提取NPC原话题核心词（用于拉回） ──
        // 优先用_extractTopicObject提取具体事物词（如"伞/饭/茶"），而非泛指词（如"下雨/天气"）
        // 这样拉回时说"伞呢？"而不是"下雨呢？"，更精准
        var npcTopic = _extractTopicObject(lastNpcText);
        // 回退：如果_extractTopicObject没提取到，用extractKeywords的结果
        if (!npcTopic) {
            for (var k = 0; k < npcKws.length; k++) {
                if (npcKws[k].length >= 2 && npcKws[k].length <= 4 && _isValidTopicWord(npcKws[k])) {
                    npcTopic = npcKws[k];
                    break;
                }
            }
        }

        // ── Step 3: 按性格分流回应 ──
        var reply = '';

        // 高固执（≥80）：坚持原话题，直接拉回
        if (p.stubbornness >= 80) {
            if (npcTopic) {
                reply = pick([
                    '别打岔，' + npcTopic + '呢？',
                    '我说的是' + npcTopic + '。',
                    '先说' + npcTopic + '的事。',
                    '你扯哪去了？' + npcTopic + '呢？'
                ]);
            } else {
                reply = pick(['别打岔。', '我说我的呢。', '先说刚才的事。']);
            }
            return reply;
        }

        // 低耐心（≤25）：不耐烦，简短拉回
        if (p.patience <= 25) {
            if (npcTopic) {
                reply = pick([
                    '行了，' + npcTopic + '呢？',
                    '说' + npcTopic + '呢。',
                    '别绕，' + npcTopic + '咋样？'
                ]);
            } else {
                reply = pick(['行了。', '说刚才的。', '别绕。']);
            }
            return reply;
        }

        // 高好奇（≥80）：被玩家新话题吸引，顺新话题聊
        if (p.curiosity >= 80 && Math.random() < 0.6) {
            var playerTopic = '';
            for (var pi = 0; pi < playerKws.length; pi++) {
                if (playerKws[pi].length >= 2 && _isValidTopicWord(playerKws[pi])) {
                    playerTopic = playerKws[pi];
                    break;
                }
            }
            if (playerTopic) {
                reply = pick([
                    '等等，' + playerTopic + '？细说。',
                    '你说的' + playerTopic + '有点意思，咋回事？',
                    '先放放，' + playerTopic + '咋了？',
                    '诶，' + playerTopic + '？你说说。'
                ]);
            } else {
                reply = pick(['等等，你说的有点意思，细说。', '诶？这个怎么说？', '先放放刚才的，你这个咋回事？']);
            }
            return reply;
        }

        // 高热情（≥70）：友善引导回话题
        if (p.warmth >= 70) {
            if (npcTopic) {
                reply = pick([
                    '哈哈，你扯远了。话说回来，' + npcTopic + '呢？',
                    '嗨，先不说这个。' + npcTopic + '咋样了？',
                    '你说的也有意思，不过先说' + npcTopic + '？',
                    '哈哈，跑题了。' + npcTopic + '呢？'
                ]);
            } else {
                reply = pick(['哈哈，你扯远了。', '嗨，先不说这个。', '跑题了跑题了。']);
            }
            return reply;
        }

        // 低热情（≤25）：冷淡带过，拉回
        if (p.warmth <= 25) {
            if (npcTopic) {
                reply = pick([
                    '嗯。我说的是' + npcTopic + '。',
                    '哦。' + npcTopic + '呢？',
                    '……' + npcTopic + '。'
                ]);
            } else {
                reply = pick(['嗯。', '哦。', '……']);
            }
            return reply;
        }

        // 高幽默（≥70）：调侃玩家，拉回
        if (p.humor >= 70) {
            if (npcTopic) {
                reply = pick([
                    '你这脑回路跑哪去了？' + npcTopic + '呢？',
                    '哈哈，想啥呢？说' + npcTopic + '呢。',
                    '跑题大师啊你。' + npcTopic + '咋说？',
                    '扯哪去了？' + npcTopic + '呢？'
                ]);
            } else {
                reply = pick(['你这脑回路跑哪去了？', '哈哈，想啥呢？', '跑题大师啊你。']);
            }
            return reply;
        }

        // 默认：中庸性格，自然拉回
        if (npcTopic) {
            reply = pick([
                '嗯？我说的是' + npcTopic + '啊。',
                '话说' + npcTopic + '呢？',
                '先说' + npcTopic + '吧。',
                '嗯，' + npcTopic + '咋说？'
            ]);
        } else {
            reply = pick(['嗯？我说刚才的事。', '话说刚才那个。', '先说刚才的吧。']);
        }
        return reply;
    }

    /**
     * 生成身份特色的具体回复 — 三层维度：身份+性格+心情
     * 覆盖所有 intent，确保每个NPC的回复都符合个人特征
     * @returns {string} 回复文本
     */
    function _generateTypeSpecificReply(npcId, profile, name, intent, topicWord, usePureDialogue, useShortDesc, mood, playerOption, lastNpcText) {
        var type = profile ? (profile.type || 'townsfolk') : 'townsfolk';
        var personality = profile ? profile.personality : null;
        var typeWords = TYPE_TOPIC_WORDS[type] || TYPE_TOPIC_WORDS.townsfolk;
        var pOpt = (typeof playerOption === 'string') ? playerOption : '';
        var npcSpeech = (typeof lastNpcText === 'string') ? lastNpcText : '';

        // 根据 intent 选具体事物词
        var concreteWord = '';
        var wordList = typeWords[intent] || typeWords.listen || typeWords.confirm || [];
        if (wordList.length > 0) {
            concreteWord = pick(wordList);
        }

        // topicWord 只用NPC之前说的话题，不用玩家选项文本
        var refWord = (topicWord && _isValidTopicWord(topicWord)) ? topicWord : (concreteWord || '');

        // ── 核心修复：提取NPC上一句话的话题词，用于listen/confirm/agree等追问类intent承接话题 ──
        // 旧逻辑：从TYPE_TOPIC_WORDS[intent]随机选concreteWord，与NPC上一句话无关
        // 新逻辑：优先用NPC上一句话的话题词，让回复承接上一句话
        // 注意：_extractTopicObject可能返回1字词（如"货""茶""活"），不经过_isValidTopicWord过滤
        var lastTopic = _extractTopicObject(npcSpeech);

        // ═══════════════════════════════════════════════════════════════
        // 意图驱动回复：根据玩家选项的意图生成语义对应的回复
        // 核心原则：NPC"接住"玩家的话，而不是把玩家的话当话题词塞模板
        // ═══════════════════════════════════════════════════════════════

        // ── 关心类意图（care/encourage）：玩家关心NPC，NPC回应关心 ──
        if (intent === 'care' || intent === 'encourage') {
            var careReplies = {
                merchant: [
                    '歇啥啊，这买卖走不开。', '忙惯了，闲下来反而不自在。', '没事，做买卖的，身子骨硬着呢。',
                    '放心吧，赚了钱才能歇。', '不拼不行啊，一家老小指望这摊子呢。'
                ],
                artisan: [
                    '歇不了，这炉子不能停。', '手艺人哪有歇的份，活儿赶着呢。', '没事，干惯了，不干反而不舒服。',
                    '这活儿不能半途而废，得一口气干完。', '放心，我这身子骨硬着呢。'
                ],
                sect_outer: [
                    '修炼的事，不能松懈。', '师命在身，不敢懈怠。', '没事，修炼之人，耐力好着呢。',
                    '师父说过，吃得苦中苦。', '不练不行，落后要挨训的。'
                ],
                wanderer: [
                    '歇啥，路还长着呢。', '走惯了，停不下来。', '没事，风餐露宿惯了。',
                    '到了下个镇子再说吧。', '赶路的人哪有歇的份。'
                ],
                teahouse_staff: [
                    '忙完了就歇，不急。', '客官您放心，我撑得住。', '茶馆的活儿，忙完一波又一波。',
                    '没事，年轻人，累不着。', '等客人少了再歇。'
                ],
                teahouse_regular: [
                    '喝茶的人，歇着呢。', '我这不就是歇着嘛。', '放心，喝茶养身。',
                    '不急，慢慢喝。', '日子清闲着呢。'
                ],
                townsfolk: [
                    '歇不了，一堆事呢。', '忙惯了，闲不住。', '没事，身子骨还硬朗。',
                    '等忙完这阵再说。', '不干不行啊，日子得张罗。'
                ],
                hidden: [
                    '……凡人的事，不必挂心。', '命数如此，何须多言。', '天机不可泄，你不必担心。',
                    '我自有分寸。', '……'
                ]
            };
            var careList = careReplies[type] || careReplies.townsfolk;
            var careText = pick(careList);
            if (useShortDesc && Math.random() < 0.4) {
                return name + '摆摆手，"' + careText + '"';
            }
            return careText;
        }

        // ── 帮助类意图（help）：玩家提议帮忙，NPC回应行动 ──
        if (intent === 'help') {
            var helpReplies = {
                merchant: [
                    '行啊，帮我看会儿摊子。', '正好，帮我搬几箱货。', '那敢情好，帮我盘盘货。',
                    '行，帮我把这批货码好。', '好啊，帮我招呼下客人。'
                ],
                artisan: [
                    '正好，帮我拉拉风箱。', '行啊，帮我递个工具。', '那敢情好，帮我看会儿炉子。',
                    '行，帮我扶着这块料。', '好啊，帮我打个下手。'
                ],
                sect_outer: [
                    '好，陪我练练手。', '行，帮我护法。', '那敢情好，帮我看着点。',
                    '行，陪我巡趟山。', '好啊，帮我跑个腿。'
                ],
                wanderer: [
                    '行，帮我看会儿马。', '正好，帮我搬搬行李。', '那敢情好，帮我打听个事。',
                    '行，结伴走段路。', '好啊，帮我看看这地图。'
                ],
                teahouse_staff: [
                    '行啊，帮我擦擦桌子。', '正好，帮我添下水。', '那敢情好，帮我招呼下客人。',
                    '行，帮我端几壶茶。', '好啊，帮我备点茶点。'
                ],
                teahouse_regular: [
                    '行，帮我倒杯茶。', '正好，帮我看着位子。', '那敢情好，陪我下盘棋。',
                    '行，帮我点个心。', '好啊，陪我喝一壶。'
                ],
                townsfolk: [
                    '行啊，搭把手搬个东西。', '正好，帮我看会儿孩子。', '那敢情好，帮我跑个腿。',
                    '行，帮我张罗张罗。', '好啊，帮我搭把手。'
                ],
                hidden: [
                    '……替我看着点。', '帮我护法。', '那好，帮我办件事。',
                    '……随我走一趟。', '好，帮我看着。'
                ]
            };
            var helpList = helpReplies[type] || helpReplies.townsfolk;
            var helpText = pick(helpList);
            if (useShortDesc && Math.random() < 0.4) {
                return name + '眼睛一亮，"' + helpText + '"';
            }
            return helpText;
        }

        // ── 分享喜悦类意图（share_joy）：玩家沾喜气，NPC分享具体好事 ──
        if (intent === 'share_joy') {
            var joyReplies = {
                merchant: [
                    '今天来了个大主顾！', '这批货卖得特别顺！', '今天大赚了一笔！',
                    '来了个大买卖！', '今天客人络绎不绝！'
                ],
                artisan: [
                    '今天打出件好东西！', '来了个大活儿！', '手艺被人夸了！',
                    '这把刀淬火淬得漂亮！', '今天活儿干得特别顺！'
                ],
                sect_outer: [
                    '今天突破了！', '师傅夸我了！', '功法练成了！',
                    '今天练功特别顺！', '师兄说我进步了！'
                ],
                wanderer: [
                    '今天碰到件稀罕事！', '路上交了个朋友！', '捡了个便宜！',
                    '今天赶路特别顺！', '碰到个好心的店家！'
                ],
                teahouse_staff: [
                    '今天客人特别多！', '茶钱收了不少！', '新茶到了！',
                    '今天小费给得多！', '老板夸我了！'
                ],
                teahouse_regular: [
                    '今天茶特别好！', '棋赢了！', '书听痛快了！',
                    '今天碰到个老朋友！', '这壶茶泡得绝了！'
                ],
                townsfolk: [
                    '家里有喜事！', '日子顺当了！', '孩子出息了！',
                    '今天运气不错！', '家里添了件好事！'
                ],
                hidden: [
                    '悟了点东西。', '破了层心魔。', '机缘到了。',
                    '窥得天机一二。', '道心更稳了。'
                ]
            };
            var joyList = joyReplies[type] || joyReplies.townsfolk;
            var joyText = pick(joyList);
            if (useShortDesc && Math.random() < 0.4) {
                return name + '眉开眼笑，"' + joyText + '"';
            }
            return joyText;
        }

        // ── 安慰类意图（comfort）：玩家安慰NPC，NPC接受安慰 ──
        if (intent === 'comfort') {
            var comfortReplies = {
                merchant: [
                    '唉，生意难做啊。', '算了，做生意嘛，啥人都能碰上。',
                    '你这么一说心里好受多了。', '没事，做买卖的，见多了。'
                ],
                artisan: [
                    '唉，活儿不顺手。', '行吧，不气了。', '算了，手艺人的事，急不得。',
                    '你这么一说心里好受多了。', '没事，干我们这行，难免的。'
                ],
                sect_outer: [
                    '唉，修炼遇瓶颈。', '行吧，不气了。', '算了，修炼的事，急不得。',
                    '你这么一说心里好受多了。', '没事，师门的事，难免的。'
                ],
                wanderer: [
                    '唉，路上不顺。', '行吧，不气了。', '算了，江湖上的事，难免的。',
                    '你这么一说心里好受多了。', '没事，走南闯北的，啥事都能碰上。'
                ],
                teahouse_staff: [
                    '唉，忙得脚不沾地。', '行吧，不气了。', '算了，茶馆里的事，难免的。',
                    '你这么一说心里好受多了。', '没事，客人多了就这样。'
                ],
                teahouse_regular: [
                    '唉，茶凉了。', '行吧，不气了。', '算了，下棋嘛，有输有赢。',
                    '你这么一说心里好受多了。', '没事，喝茶的人，不急。'
                ],
                townsfolk: [
                    '唉，日子难过。', '行吧，不气了。', '算了，过日子嘛，难免的。',
                    '你这么一说心里好受多了。', '没事，日子得继续过。'
                ],
                hidden: [
                    '……道心不稳。', '罢了。', '命数如此，何须气。',
                    '你不必挂心。', '……'
                ]
            };
            var comfortList = comfortReplies[type] || comfortReplies.townsfolk;
            var comfortText = pick(comfortList);
            if (useShortDesc && Math.random() < 0.4) {
                return name + '叹了口气，"' + comfortText + '"';
            }
            return comfortText;
        }

        // ── 否定回答意图（deny）：玩家回答"没/不知道"，NPC回应 ──
        // 核心：基于NPC原话提取核心事物，生成针对性回应
        // 如"没带伞"→"快进来避避雨"；"没吃饭"→"饿不饿？我这有点心"
        if (intent === 'deny') {
            // 从NPC原话提取核心事物
            var denyTopic = _extractTopicObject(npcSpeech);

            // 针对性回应：基于核心事物
            if (denyTopic === '伞') {
                return pick(['快进来避避雨。', '没事，先擦擦。', '我这有把旧的，你先用。', '淋着了？快进来。']);
            }
            if (denyTopic === '饭' || denyTopic === '吃') {
                return pick(['饿不饿？我这有点心。', '正好，一起吃点？', '别饿着，身子骨要紧。', '走走，我请你。']);
            }
            if (denyTopic === '茶馆' || denyTopic === '茶') {
                return pick(['改天一起去。', '没事，下次叫你。', '正好我也要去，走着？', '不急，有空再去。']);
            }
            if (denyTopic === '铁匠铺') {
                return pick(['改天一起去。', '没事，下次叫你。', '不急，有空再去。']);
            }

            // 通用否定回应（未提取到核心事物）
            var denyReplies = {
                merchant: ['没事。', '嗨，谁还没个忘的时候。', '不要紧。'],
                artisan: ['没事。', '嗨，忙起来就忘了。', '不要紧。'],
                sect_outer: ['无妨。', '没事。', '嗨，不拘小节。'],
                wanderer: ['没事。', '嗨，走南闯北的。', '不要紧。'],
                teahouse_staff: ['没事，客官快进来。', '嗨，谁还没个忘的时候。', '不要紧，先喝口热的。'],
                teahouse_regular: ['没事。', '嗨，忘了就忘了。', '不要紧。'],
                townsfolk: ['没事。', '嗨，谁还没个忘的时候。', '不要紧。'],
                hidden: ['……无妨。', '罢了。', '……']
            };
            var denyList = denyReplies[type] || denyReplies.townsfolk;
            return pick(denyList);
        }

        // ── 肯定回答意图（confirm）：玩家回答"是/带了"，NPC回应 ──
        // 核心：基于NPC原话提取核心事物，生成针对性回应
        if (intent === 'confirm') {
            var confirmTopic = _extractTopicObject(npcSpeech);

            if (confirmTopic === '伞') {
                return pick(['那就好。', '行，没淋着就行。', '进来坐坐？']);
            }
            if (confirmTopic === '饭' || confirmTopic === '吃') {
                return pick(['吃饱了？', '行，别饿着。', '吃啥了？']);
            }
            if (confirmTopic === '茶馆' || confirmTopic === '茶') {
                return pick(['茶咋样？', '行，有空再去。', '喝啥茶了？']);
            }

            // 通用肯定回应
            var confirmReplies = {
                merchant: ['那就好。', '行。', '嗯。'],
                artisan: ['那就好。', '行。', '嗯。'],
                sect_outer: ['善。', '那就好。', '嗯。'],
                wanderer: ['那就好。', '行。', '嗯。'],
                teahouse_staff: ['那就好。', '行。', '嗯。'],
                teahouse_regular: ['那就好。', '行。', '嗯。'],
                townsfolk: ['那就好。', '行。', '嗯。'],
                hidden: ['……善。', '……嗯。', '……']
            };
            var confirmList = confirmReplies[type] || confirmReplies.townsfolk;
            return pick(confirmList);
        }

        // ── 选择问回答意图（choose_a/choose_b/either）：玩家选择A/B/都行 ──
        if (intent === 'choose_a' || intent === 'choose_b' || intent === 'either') {
            var choiceReplies = {
                merchant: ['行，就这个。', '好嘞，听你的。', '成，就它了。'],
                artisan: ['行，就这个。', '好，听你的。', '成，就它了。'],
                sect_outer: ['可。', '行，就这个。', '好，听你的。'],
                wanderer: ['行，就这个。', '好嘞。', '成，走着。'],
                teahouse_staff: ['好嘞，马上！', '行，就这个。', '成，听客官的。'],
                teahouse_regular: ['行，就这个。', '好，听你的。', '成，就它了。'],
                townsfolk: ['行，就这个。', '好嘞。', '成，就它了。'],
                hidden: ['……可。', '……行。', '……'
                ]
            };
            var choiceList = choiceReplies[type] || choiceReplies.townsfolk;
            return pick(choiceList);
        }

        // ── 倾听类意图（listen）：玩家倾听，NPC承接上一句话的话题继续说 ──
        // 核心修复：不再随机选回复，而是基于NPC上一句话的话题词生成承接回复
        // 旧逻辑：从listen模板池随机选，话题会从"货颠簸"跳到"生意差"
        // 新逻辑：优先用lastTopic从listenFollowUps选承接回复，回退到通用承接句，最终回退到扩充后的模板池
        if (intent === 'listen') {
            // 按话题词选回复的承接句库（key是_extractTopicObject提取的具体事物词）
            var listenFollowUps = {
                merchant: {
                    '货': ['货啊，后来到了，多亏帮忙搬。', '货的事，后来处理完了，亏了点但没大碍。', '货嘛，颠簸是颠簸，总算到了。', '货的事，说来话长，不过现在好了。'],
                    '生意': ['生意嘛，时好时坏，习惯了。', '生意的事，急不得，慢慢来。', '生意就这样，今天差明天可能就好。', '生意的事，后来还算顺利。'],
                    '买卖': ['买卖的事，门道多着呢。', '买卖嘛，有赚有赔，正常。', '买卖的事，后来总算谈成了。'],
                    '客人': ['客人嘛，什么样的都有。', '客人的事，不好说，看缘分。', '客人的事，后来走了，没买什么。'],
                    '账': ['账的事，算清楚了，没大问题。', '账嘛，对上了，差点出错。', '账的事，后来盘清楚了。'],
                    '茶叶': ['茶叶的事，新到一批，还不错。', '茶叶嘛，卖得挺好。', '茶叶的事，后来补了货。'],
                    '布匹': ['布匹的事，卖得差不多了。', '布匹嘛，后来有人订了一批。'],
                    '盐': ['盐的事，紧俏着呢。', '盐嘛，后来又到了一批。'],
                    '糖': ['糖的事，卖得快。', '糖嘛，后来补了货。']
                },
                artisan: {
                    '活': ['活儿啊，费了三天功夫才弄好。', '活的事，总算完工了。', '活嘛，急不得，慢慢来。', '活的事，后来交付了，主顾满意。'],
                    '家什': ['家什的事，工序复杂，差点出岔子。', '家什嘛，做好了，自己满意。', '家什的事，后来打磨好了。'],
                    '炉火': ['炉火的事，不好控制，今天废了两块料。', '炉火嘛，总算稳住了。', '炉火的事，后来调好了。'],
                    '料': ['料子的事，硬得费劲，不过弄好了。', '料嘛，不好对付，但成器了。', '料子的事，后来换了一批。'],
                    '工序': ['工序的事，最吃功夫，急不得。', '工序嘛，一道一道来，错不得。', '工序的事，后来总算走完了。'],
                    '铁匠铺': ['铁匠铺的事，忙不完。', '铁匠铺嘛，后来清静了些。'],
                    '手艺': ['手艺的事，越练越精。', '手艺嘛，后来摸着门道了。']
                },
                sect_outer: {
                    '修炼': ['修炼的事，今天卡在瓶颈上了。', '修炼嘛，急不得，慢慢悟。', '修炼的事，有点进展了。', '修炼的事，后来总算突破了。'],
                    '功法': ['功法的事，练了三天才摸到门道。', '功法嘛，总算入门了。', '功法的事，后来练顺了。'],
                    '任务': ['任务的事，不简单，差点没完成。', '任务嘛，完成了，累得够呛。', '任务的事，后来交差了。'],
                    '师门': ['师门的事，不好多说，反正挺烦的。', '师门嘛，规矩多，习惯了。', '师门的事，后来消停了。'],
                    '师傅': ['师傅今天训我了，说我心不在焉。', '师傅嘛，严厉是严厉，也是为我好。', '师傅的事，后来夸我了。'],
                    '书院': ['书院的事，说来话长。', '书院嘛，后来去了，没白跑。']
                },
                wanderer: {
                    '路': ['路的事，比预想的难走，绕了好远。', '路嘛，总算走过来了。', '路的事，碰到点麻烦，但过去了。', '路的事，后来总算到了。'],
                    '差事': ['差事的事，碰到点麻烦，总算脱身了。', '差事嘛，完成了，不容易。', '差事的事，后来交差了。'],
                    '地界': ['地界的事，不太平，夜里听见狼嚎。', '地界嘛，小心点就行。', '地界的事，后来过去了。'],
                    '事': ['事嘛，三天三夜说不完。', '事的事，最惊险的是过山那会儿。', '事的事，后来总算消停了。'],
                    '马': ['马的事，后来喂饱了。', '马嘛，路上多亏了它。']
                },
                teahouse_staff: {
                    '茶': ['茶的事，泡老了，可惜了。', '茶嘛，新到的，还不错。', '茶的事，今天泡得挺顺手。', '茶的事，后来又泡了一壶。'],
                    '客官': ['客官的事，有点意思，出手挺大方。', '客官嘛，什么样的都有。', '客官的事，后来走了。'],
                    '生意': ['生意的事，比昨天好些，忙得脚不沾地。', '生意嘛，忙完一波又一波。', '生意的事，后来又来了一波。'],
                    '茶馆': ['茶馆的事，忙不完。', '茶馆嘛，刚收拾完一桌又来一桌。', '茶馆的事，后来清静了些。']
                },
                teahouse_regular: {
                    '茶': ['茶的事，品出味了，比上次的好。', '茶嘛，今天这壶泡得绝了。', '茶的事，越喝越有味。', '茶的事，后来又续了一壶。'],
                    '书': ['书的事，有意思，说书人今天讲到关键处。', '书嘛，听痛快了。', '书的事，后来讲到精彩处。'],
                    '棋': ['棋的事，下得精彩，险胜。', '棋嘛，今天手感不错。', '棋的事，后来又来一局。'],
                    '八卦': ['八卦的事，多着呢，听说老张家出事了。', '八卦嘛，茶馆里每天都有新鲜的。', '八卦的事，后来又有新的。']
                },
                townsfolk: {
                    '家': ['家的事，孩子最近不太听话。', '家嘛，柴米油盐，哪样都操心。', '家的事，总算办妥了。', '家的事，后来消停了。'],
                    '事': ['事嘛，折腾了好几天，总算办妥了。', '事的事，跟邻居闹了点别扭。', '事的事，后来过去了。'],
                    '日子': ['日子的事，柴米油盐，哪样都操心。', '日子嘛，平平淡淡也挺好。', '日子的事，后来顺当了。'],
                    '镇': ['镇上的事，多着呢，最近不太平。', '镇嘛，还是老样子。', '镇上的事，后来消停了。'],
                    '孩子': ['孩子的事，最近不太听话。', '孩子嘛，后来乖了。'],
                    '儿子': ['儿子的事，最近挺出息。', '儿子嘛，后来考上了。'],
                    '女儿': ['女儿的事，最近挺懂事。', '女儿嘛，后来嫁了好人家。']
                },
                hidden: {
                    '天机': ['天机……不可全泄。', '天机嘛，你不必全知。', '天机的事，后来应验了。'],
                    '因果': ['因果的事，前因后果，皆有定数。', '因果嘛，躲不过。', '因果的事，后来了结了。'],
                    '劫数': ['劫数的事，躲不过，只能硬扛。', '劫数嘛，命数如此。', '劫数的事，后来过去了。'],
                    '命数': ['命数的事，不可违。', '命数嘛，自有定数。'],
                    '道心': ['道心的事，需慢慢磨。', '道心嘛，后来稳了。']
                }
            };

            // 按话题词选回复：优先用lastTopic（NPC上一句话的话题词），回退到refWord
            var typeFollowUps = listenFollowUps[type] || listenFollowUps.townsfolk;

            // 回退逻辑：如果lastTopic是地点词或为空，检查NPC上一句话是否包含listenFollowUps的key
            // 原因1：_extractTopicObject会优先匹配"路上"等2字地点词，但真正的话题词可能是"货""茶"等
            // 原因2：_extractTopicObject词典有限，可能提取不到"活""家什""炉火"等词
            // 优先匹配长key（2字以上），避免1字词误匹配
            var locationWords = ['路上', '山上', '山里', '镇上', '山下', '家里'];
            if (locationWords.indexOf(lastTopic) >= 0 || !lastTopic) {
                var typeFollowUpsKeys = Object.keys(typeFollowUps);
                typeFollowUpsKeys.sort(function(a, b) { return b.length - a.length; });
                for (var fk = 0; fk < typeFollowUpsKeys.length; fk++) {
                    if (npcSpeech.indexOf(typeFollowUpsKeys[fk]) >= 0) {
                        lastTopic = typeFollowUpsKeys[fk];
                        break;
                    }
                }
            }

            var followUpList = typeFollowUps[lastTopic] || typeFollowUps[refWord] || [];

            if (followUpList.length > 0) {
                var listenText = pick(followUpList);
                if (useShortDesc && Math.random() < 0.4) {
                    return name + '清了清嗓子，"' + listenText + '"';
                }
                return listenText;
            }

            // 回退1：如果话题词没有对应回复，用通用承接句（话题词+的事，后来...）
            if (lastTopic) {
                var genericFollowUps = [
                    lastTopic + '的事，后来处理完了。',
                    lastTopic + '嘛，总算过去了。',
                    lastTopic + '的事，说来话长，不过现在好了。',
                    lastTopic + '的事，后来还算顺利。'
                ];
                return pick(genericFollowUps);
            }

            // 回退2：用扩充后的listen模板池（最终回退，每身份15条）
            var listenReplies = {
                merchant: [
                    '这批货啊，路上颠簸坏了几件，亏了点。', '今天的生意，比往常差了点，客人不多。', '这笔买卖，门道多着呢，差点被人坑了。',
                    '那个客人，可难缠了，讨价还价半天。', '今天的流水，不太对劲，算下来没赚多少。',
                    '后来啊，货总算到了，亏了点但没大碍。', '生意嘛，时好时坏，习惯了。', '买卖的事，后来总算谈成了。',
                    '客人后来走了，没买什么。', '账的事，后来盘清楚了。', '茶叶卖得挺好，后来又补了货。',
                    '布匹后来有人订了一批。', '盐紧俏着呢，后来又到了一批。', '糖卖得快，后来补了货。', '今天算下来，还行。'
                ],
                artisan: [
                    '这活儿啊，费了我三天功夫才弄好。', '这件家什，工序复杂，差点出了岔子。', '这炉火，不好控制，今天废了两块料。',
                    '这块料子，不好对付，硬得费劲。', '这道工序，最吃功夫，急不得。',
                    '活儿后来交付了，主顾满意。', '家什后来打磨好了。', '炉火后来调好了。', '料子后来换了一批。', '工序后来总算走完了。',
                    '手艺越练越精。', '铁匠铺后来清静了些。', '后来又接了个新活儿。', '今天干得挺顺。', '后来完工了。'
                ],
                sect_outer: [
                    '修炼的事，今天卡在瓶颈上了。', '这门功法，练了三天才摸到门道。', '这次任务，不简单，差点没完成。',
                    '师门的事，不好多说，反正挺烦的。', '师傅今天训我了，说我心不在焉。',
                    '修炼后来总算突破了。', '功法后来练顺了。', '任务后来交差了。', '师门后来消停了。', '师傅后来夸我了。',
                    '书院后来去了，没白跑。', '后来又悟了点东西。', '今天练功挺顺。', '后来师兄说我进步了。', '后来总算消停了。'
                ],
                wanderer: [
                    '这条路啊，比预想的难走，绕了好远。', '这趟差事，碰到点麻烦，总算脱身了。', '这个地界，不太平，夜里听见狼嚎。',
                    '外头的事，三天三夜说不完，最惊险的是过山那会儿。', '路上碰到件稀罕事，有人送了我干粮。',
                    '路后来总算到了。', '差事后来交差了。', '地界后来过去了。', '事后来总算消停了。', '马后来喂饱了。',
                    '后来又碰到件稀罕事。', '后来交了个朋友。', '后来捡了个便宜。', '后来赶路特别顺。', '后来碰到个好心的店家。'
                ],
                teahouse_staff: [
                    '这壶茶啊，泡老了，可惜了。', '这位客官，有点意思，出手挺大方。', '今天的生意，比昨天好些，忙得脚不沾地。',
                    '茶馆的事，忙不完，刚收拾完一桌又来一桌。', '那个客人，可挑剔了，嫌茶凉了。',
                    '茶后来又泡了一壶。', '客官后来走了。', '生意后来又来了一波。', '茶馆后来清静了些。', '后来老板夸我了。',
                    '后来小费给得多。', '后来新茶到了。', '后来忙完了歇会儿。', '后来又来了一桌。', '后来总算消停了。'
                ],
                teahouse_regular: [
                    '这壶茶啊，品出味了，比上次的好。', '这段书，有意思，说书人今天讲到关键处。', '这局棋，下得精彩，险胜。',
                    '茶馆的八卦，多着呢，听说老张家出事了。', '今天听到个新鲜事，镇东头开了家新店。',
                    '茶后来又续了一壶。', '书后来讲到精彩处。', '棋后来又来一局。', '八卦后来又有新的。', '后来碰到个老朋友。',
                    '后来这壶茶泡得绝了。', '后来棋赢了。', '后来书听痛快了。', '后来运气不错。', '后来又听到个新鲜事。'
                ],
                townsfolk: [
                    '家里的事，孩子最近不太听话。', '这档子事，折腾了好几天，总算办妥了。', '日子的事，柴米油盐，哪样都操心。',
                    '镇上的事，多着呢，最近不太平。', '今天碰到件烦心事，跟邻居闹了点别扭。',
                    '家后来消停了。', '事后来过去了。', '日子后来顺当了。', '镇后来消停了。', '孩子后来乖了。',
                    '儿子后来考上了。', '女儿后来嫁了好人家。', '后来家里有喜事。', '后来日子顺当了。', '后来孩子出息了。'
                ],
                hidden: [
                    '天机……不可全泄。', '这段因果，你听好——前因后果，皆有定数。', '这个劫数，躲不过，只能硬扛。',
                    '命数……你不必全知。', '……',
                    '天机后来应验了。', '因果后来了结了。', '劫数后来过去了。', '命数自有定数。', '道心后来稳了。',
                    '……罢了。', '……命数如此。', '……你不必知道。', '……机缘未到。', '……'
                ]
            };
            var listenList = listenReplies[type] || listenReplies.townsfolk;
            var listenText = pick(listenList);
            if (useShortDesc && Math.random() < 0.4) {
                return name + '清了清嗓子，"' + listenText + '"';
            }
            return listenText;
        }

        // ── 确认类意图（confirm/agree）：玩家确认，NPC承接上一句话的话题继续展开 ──
        // 核心修复：不再随机选回复，而是基于NPC上一句话的话题词生成承接回复
        // 注意：是非问的confirm（如"下雨带伞没"→"带了"）已在前面分支处理，这里主要处理agree和陈述句confirm
        if (intent === 'confirm' || intent === 'agree') {
            // 按话题词选回复的承接句库
            var agreeFollowUps = {
                merchant: {
                    '货': ['可不是嘛，货的事就是这样。', '你说得对，货不好弄。', '嗯，货的事，后来总算办妥了。'],
                    '生意': ['可不是嘛，生意就是这样。', '你说得对，生意不好做。', '嗯，生意的事，急不得。'],
                    '买卖': ['可不是嘛，买卖就是这样。', '你说得对，买卖不好干。', '嗯，买卖的事，门道多。'],
                    '客人': ['可不是嘛，客人什么样的都有。', '你说得对，客人难伺候。', '嗯，客人的事，看缘分。'],
                    '账': ['可不是嘛，账的事马虎不得。', '你说得对，账不好算。', '嗯，账的事，后来对上了。']
                },
                artisan: {
                    '活': ['可不是嘛，活儿就是这样。', '你说得对，活儿不好干。', '嗯，活的事，急不得。'],
                    '家什': ['可不是嘛，家什就是这样。', '你说得对，家什不好做。', '嗯，家什的事，讲究手艺。'],
                    '炉火': ['可不是嘛，炉火就是这样。', '你说得对，炉火不好控制。', '嗯，炉火的事，看经验。'],
                    '料': ['可不是嘛，料子就是这样。', '你说得对，料不好对付。', '嗯，料的事，得挑。'],
                    '工序': ['可不是嘛，工序就是这样。', '你说得对，工序急不得。', '嗯，工序的事，一道一道来。']
                },
                sect_outer: {
                    '修炼': ['可不是嘛，修炼就是这样。', '你说得对，修炼不好走。', '嗯，修炼的事，急不得。'],
                    '功法': ['可不是嘛，功法就是这样。', '你说得对，功法不好练。', '嗯，功法的事，讲究悟性。'],
                    '任务': ['可不是嘛，任务就是这样。', '你说得对，任务不简单。', '嗯，任务的事，得小心。'],
                    '师门': ['可不是嘛，师门就是这样。', '你说得对，师门规矩多。', '嗯，师门的事，习惯了。'],
                    '师傅': ['可不是嘛，师傅就是这样。', '你说得对，师傅严厉。', '嗯，师傅的事，也是为我好。']
                },
                wanderer: {
                    '路': ['可不是嘛，路就是这样。', '你说得对，路不好走。', '嗯，路的事，走惯了。'],
                    '差事': ['可不是嘛，差事就是这样。', '你说得对，差事不简单。', '嗯，差事的事，得小心。'],
                    '地界': ['可不是嘛，地界就是这样。', '你说得对，地界不太平。', '嗯，地界的事，小心点。'],
                    '事': ['可不是嘛，事就是这样。', '你说得对，事不好说。', '嗯，事的事，三天三夜说不完。']
                },
                teahouse_staff: {
                    '茶': ['可不是嘛，茶就是这样。', '你说得对，茶不好泡。', '嗯，茶的事，讲究水温。'],
                    '客官': ['可不是嘛，客官就是这样。', '你说得对，客官什么样的都有。', '嗯，客官的事，看缘分。'],
                    '生意': ['可不是嘛，生意就是这样。', '你说得对，生意忙不完。', '嗯，生意的事，一波又一波。'],
                    '茶馆': ['可不是嘛，茶馆就是这样。', '你说得对，茶馆忙不完。', '嗯，茶馆的事，习惯了。']
                },
                teahouse_regular: {
                    '茶': ['可不是嘛，茶就是这样。', '你说得对，好茶难得。', '嗯，茶的事，越喝越有味。'],
                    '书': ['可不是嘛，书就是这样。', '你说得对，好书听痛快了。', '嗯，书的事，讲究说书人。'],
                    '棋': ['可不是嘛，棋就是这样。', '你说得对，棋有输有赢。', '嗯，棋的事，看手感。'],
                    '八卦': ['可不是嘛，八卦就是这样。', '你说得对，八卦多着呢。', '嗯，八卦的事，每天都有新的。']
                },
                townsfolk: {
                    '家': ['可不是嘛，家就是这样。', '你说得对，家事操心。', '嗯，家的事，习惯了。'],
                    '事': ['可不是嘛，事就是这样。', '你说得对，事不好办。', '嗯，事的事，后来过去了。'],
                    '日子': ['可不是嘛，日子就是这样。', '你说得对，日子不好过。', '嗯，日子的事，平平淡淡。'],
                    '镇': ['可不是嘛，镇上就是这样。', '你说得对，镇上不太平。', '嗯，镇上的事，多着呢。'],
                    '孩子': ['可不是嘛，孩子就是这样。', '你说得对，孩子操心。', '嗯，孩子的事，慢慢教。']
                },
                hidden: {
                    '天机': ['……天道如此。', '……天机不可泄。', '……命数。'],
                    '因果': ['……因果有定数。', '……命数不可违。', '……你悟了。'],
                    '劫数': ['……劫数难逃。', '……命数如此。', '……硬扛。'],
                    '命数': ['……命数不可违。', '……自有定数。', '……罢了。'],
                    '道心': ['……道心要稳。', '……慢慢磨。', '……罢了。']
                }
            };

            // 按话题词选回复：优先用lastTopic，回退到refWord
            var typeAgreeFollowUps = agreeFollowUps[type] || agreeFollowUps.townsfolk;

            // 回退逻辑：如果lastTopic是地点词或为空，检查NPC上一句话是否包含agreeFollowUps的key
            // 原因1：_extractTopicObject会优先匹配"路上"等2字地点词，但真正的话题词可能是"货""茶"等
            // 原因2：_extractTopicObject词典有限，可能提取不到"活""家什""炉火"等词
            // 优先匹配长key（2字以上），避免1字词误匹配
            var agreeLocationWords = ['路上', '山上', '山里', '镇上', '山下', '家里'];
            if (agreeLocationWords.indexOf(lastTopic) >= 0 || !lastTopic) {
                var agreeFollowUpsKeys = Object.keys(typeAgreeFollowUps);
                agreeFollowUpsKeys.sort(function(a, b) { return b.length - a.length; });
                for (var afk = 0; afk < agreeFollowUpsKeys.length; afk++) {
                    if (npcSpeech.indexOf(agreeFollowUpsKeys[afk]) >= 0) {
                        lastTopic = agreeFollowUpsKeys[afk];
                        break;
                    }
                }
            }

            var agreeList = typeAgreeFollowUps[lastTopic] || typeAgreeFollowUps[refWord] || [];

            if (agreeList.length > 0) {
                return pick(agreeList);
            }

            // 回退1：如果话题词没有对应回复，用通用承接句
            if (lastTopic) {
                var genericAgreeFollowUps = [
                    '可不是嘛，' + lastTopic + '的事就是这样。',
                    '你说得对，' + lastTopic + '不好弄。',
                    '嗯，' + lastTopic + '的事，急不得。',
                    '可不是嘛，' + lastTopic + '就这样。'
                ];
                return pick(genericAgreeFollowUps);
            }

            // 回退2：用原有模板池
            var confirmReplies = {
                merchant: ['可不是嘛，做生意就是这样。', '你说得对，这行不好干。', '嗯，买卖人的苦，外人不懂。'],
                artisan: ['可不是嘛，手艺人就是这样。', '你说得对，这活儿不好干。', '嗯，手艺人的苦，外人不懂。'],
                sect_outer: ['可不是嘛，修炼就是这样。', '你说得对，这条路不好走。', '嗯，修炼的苦，外人不懂。'],
                wanderer: ['可不是嘛，走南闯北就是这样。', '你说得对，这路不好走。', '嗯，江湖的苦，外人不懂。'],
                teahouse_staff: ['可不是嘛，茶馆就是这样。', '你说得对，这活儿不好干。', '嗯，伙计的苦，外人不懂。'],
                teahouse_regular: ['可不是嘛，喝茶就是这样。', '你说得对，这日子清闲。', '嗯，茶馆的事，门儿清。'],
                townsfolk: ['可不是嘛，过日子就是这样。', '你说得对，日子不好过。', '嗯，老百姓的苦，外人不懂。'],
                hidden: ['……天道如此。', '命数，不可违。', '……你悟了。']
            };
            var confirmList = confirmReplies[type] || confirmReplies.townsfolk;
            return pick(confirmList);
        }

        // ── 接受邀请类意图（accept）：玩家接受，NPC高兴 ──
        if (intent === 'accept') {
            var acceptReplies = {
                merchant: ['走！正好我也想歇歇。', '好啊，摊子先不管了。', '行，难得有人作伴。'],
                artisan: ['走！正好也该歇了。', '好啊，活儿先放着。', '行，难得清闲。'],
                sect_outer: ['走！正好也该松散松散。', '好啊，修炼也不急这一时。', '行，难得有空。'],
                wanderer: ['走！正好同路。', '好啊，结伴同行。', '行，路上有个伴。'],
                teahouse_staff: ['走！等我招呼完这桌。', '好啊，等客人少了。', '行，忙完这阵。'],
                teahouse_regular: ['走！换个地方坐坐。', '好啊，这茶也喝淡了。', '行，换个口味。'],
                townsfolk: ['走！正好也该出去透透气。', '好啊，难得有空。', '行，一起走走。'],
                hidden: ['……随你。', '也好。', '……走。']
            };
            return pick(acceptReplies[type] || acceptReplies.townsfolk);
        }

        // ── 拖延类意图（delay）：玩家犹豫，NPC催促或等待 ──
        if (intent === 'delay') {
            var delayReplies = {
                merchant: '行，等你忙完。', artisan: '行，等你手头空了。', sect_outer: '行，等你修炼告一段落。',
                wanderer: '行，我在路口等你。', teahouse_staff: '行，等你忙完。', teahouse_regular: '行，茶馆里等你。',
                townsfolk: '行，不急。', hidden: '……命数未到。'
            };
            return pick([delayReplies[type] || delayReplies.townsfolk, '不急，你先忙。', '行，我等你。']);
        }

        // ── 请客类意图（treat）：玩家请客，NPC高兴接受 ──
        if (intent === 'treat') {
            var treatReplies = {
                merchant: '那敢情好，你请客我还能推？', artisan: '行啊，你请客那必须去。', sect_outer: '好啊，破费了。',
                wanderer: '那感情好，路上正馋呢。', teahouse_staff: '诶，客官破费了！', teahouse_regular: '好啊，换我请你也行。',
                townsfolk: '那敢情好，不客气了。', hidden: '……不必。'
            };
            return pick([treatReplies[type] || treatReplies.townsfolk, '好啊，走着！', '行，不跟你客气。']);
        }

        // ── 邀请类意图（invite）：玩家邀请，NPC回应 ──
        if (intent === 'invite') {
            var inviteReplies = {
                merchant: ['行啊，进去坐坐。', '好啊，正好歇歇脚。', '行，进去喝口茶。'],
                artisan: ['行啊，进去坐坐。', '好啊，活儿先放着。', '行，歇会儿。'],
                sect_outer: ['行啊，进去坐坐。', '好啊，难得清闲。', '行，歇会儿。'],
                wanderer: ['行啊，进去坐坐。', '好啊，正好歇歇脚。', '行，进去喝口茶。'],
                teahouse_staff: ['诶，客官里面请！', '好啊，我给您沏茶。', '行，您坐！'],
                teahouse_regular: ['走！换个地方坐坐。', '好啊，这茶也喝淡了。', '行，换个口味。'],
                townsfolk: ['行啊，进去坐坐。', '好啊，正好歇歇。', '行，进去喝口水。'],
                hidden: ['……也好。', '随你。', '……']
            };
            return pick(inviteReplies[type] || inviteReplies.townsfolk);
        }

        // ── 陪伴类意图（accompany）：玩家陪伴，NPC感激 ──
        if (intent === 'accompany') {
            var accompanyReplies = {
                merchant: '那敢情好，有人陪着不闷。', artisan: '行啊，有人说话干活不累。', sect_outer: '好啊，有人陪着不孤单。',
                wanderer: '那感情好，路上有个伴。', teahouse_staff: '诶，客官您坐，我陪着。', teahouse_regular: '好啊，坐着喝茶。',
                townsfolk: '那敢情好，有人陪着不闷。', hidden: '……你不必。'
            };
            return pick([accompanyReplies[type] || accompanyReplies.townsfolk, '好啊，坐会儿。', '行，陪你待会儿。']);
        }

        // ── 调侃类意图（tease）：玩家调侃，NPC回应 ──
        if (intent === 'tease') {
            return pick([
                '哈哈，你这话说的。', '去去去，别拿我开涮。', '嘿，你这人。',
                '行行行，我吹还不行嘛。', '你这话，我可不爱听。'
            ]);
        }

        // ── 安抚类意图（reassure）：玩家安抚，NPC感激 ──
        if (intent === 'reassure') {
            return pick([
                '嗯，有你在心里踏实。', '你这么一说，我好多了。', '放心，没事的。',
                '嗯，没事，就是发发牢骚。', '有你这话就行。'
            ]);
        }

        // ── 理解类意图（understand）：玩家表示理解，NPC感动 ──
        if (intent === 'understand') {
            return pick([
                '你懂就好。', '难得有人理解。', '嗯，你是个明白人。',
                '你这么说我心里舒服多了。', '懂我的人不多。'
            ]);
        }

        // ── 共鸣类意图（resonate）：玩家共鸣，NPC认同 ──
        if (intent === 'resonate') {
            return pick([
                '可不是嘛！', '就是啊！', '你也这么觉得？',
                '对吧，我没说错吧。', '嗯，就是这样。'
            ]);
        }

        // ── 反弹类意图（bounce）：玩家让NPC先说，NPC回应 ──
        if (intent === 'bounce') {
            return pick([
                '行，那我先说——其实就是前两天那事儿，现在过去了。', '嗯，让我想想——对了，就是昨天碰到点麻烦，解决了。', '这事儿吧，核心就是花了不少功夫，总算办妥了。',
                '算了，不说了。', '你真想听？'
            ]);
        }

        // ── 思考类意图（think）：玩家思考，NPC等待 ──
        if (intent === 'think') {
            return pick([
                '不急，你慢慢想。', '行，你想想。', '嗯，我也想想。',
                '想好了告诉我。', '这事儿是得想想。'
            ]);
        }

        // ── 庆祝类意图（celebrate）：玩家庆祝，NPC高兴 ──
        if (intent === 'celebrate') {
            return pick([
                '哈哈，一起乐呵乐呵！', '今天确实值得高兴！', '难得有好事！',
                '走走走，庆祝去！', '今天运气不错！'
            ]);
        }

        // ── 安排类意图（arrange）：玩家改天再约，NPC接受 ──
        if (intent === 'arrange') {
            return pick([
                '行，下次再说。', '好，改天见。', '嗯，不急这一时。',
                '行，你忙你的。', '好，回头再聊。'
            ]);
        }

        // ── 淡化类意图（downplay）：玩家淡化，NPC接受 ──
        if (intent === 'downplay') {
            return pick([
                '哈哈，客气啥。', '没事没事，举手之劳。', '别这么说，应该的。',
                '嗨，小事一桩。', '你太客气了。'
            ]);
        }

        // ── 接受感谢类意图（accept_thanks）──
        if (intent === 'accept_thanks') {
            return pick([
                '应该的。', '别客气。', '举手之劳。',
                '你太客气了。', '没事，换我你也一样。'
            ]);
        }

        // ── 接受拒绝类意图（accept_refuse）──
        if (intent === 'accept_refuse') {
            return pick([
                '行吧，不勉强。', '嗯，下次吧。', '没事，理解。',
                '行，你忙你的。', '好，那改天。'
            ]);
        }

        // ── 翻篇类意图（move_on）──
        if (intent === 'move_on') {
            return pick([
                '嗯，都过去了。', '行，不提了。', '嗯，往前看。',
                '算了，想这些没用。', '对，日子得继续过。'
            ]);
        }

        // ── 听记忆类意图（listen_memory）：玩家追问记忆，NPC继续说 ──
        if (intent === 'listen_memory') {
            return pick([
                '后来啊……后来就那样了。', '后来的事儿，折腾了好一阵，总算消停了。', '后来？后来也没啥好说的。',
                '嗯，后来的事你都知道了。', '后来的事儿，不提也罢。'
            ]);
        }

        // ── 探询类意图（probe）：玩家探询，NPC结合话题回应 ──
        if (intent === 'probe') {
            // 结合NPC上一句话的话题词生成回复，避免各说各的
            if (topicWord) {
                return pick([
                    topicWord + '的事，我心里有数。',
                    topicWord + '啊，说来话长。',
                    topicWord + '的具体情况，我也说不准。',
                    topicWord + '？唉，先不说这个了。',
                    topicWord + '的事，急不来。'
                ]);
            }
            return pick([
                '也没啥，就是有点累。', '没事，就是随便问问。', '嗯，最近有点不顺。',
                '也没什么大事。', '嗨，小事。'
            ]);
        }

        // ── 解决类意图（solve）：玩家帮想办法，NPC回应 ──
        if (intent === 'solve') {
            return pick([
                '最坏也就这样了。', '嗯，你说得有道理。', '行，我试试你的法子。',
                '最坏？最坏能咋样。', '嗯，车到山前必有路。'
            ]);
        }

        // ── 点单类意图（order）：玩家点单，NPC回应 ──
        if (intent === 'order') {
            var orderReplies = {
                merchant: ['好嘞，您要什么？', '行，我给您拿。', '来了！您稍等。'],
                artisan: ['行，您要什么家什？', '好，我给您做。', '来了，您说规格。'],
                sect_outer: ['嗯，你需要什么？', '行，我帮你。', '好，你说。'],
                wanderer: ['行，你要什么？', '好，我帮你打听。', '来了，你说。'],
                teahouse_staff: ['诶！客官稍等，马上来！', '好嘞！给您沏！', '来了！新茶刚到！'],
                teahouse_regular: ['哈哈，你也学会品茶了。', '行，我帮你叫伙计。', '来，一起喝。'],
                townsfolk: ['行，你要什么？', '好，我帮你。', '来了，你说。'],
                hidden: ['……你不需要。', '命数自有安排。', '……']
            };
            return pick(orderReplies[type] || orderReplies.townsfolk);
        }

        // ── 欣赏类意图（admire）：玩家欣赏NPC手艺，NPC回应 ──
        if (intent === 'admire') {
            var admireReplies = {
                merchant: ['哈哈，过奖了！', '哪里哪里，混口饭吃。', '您眼光好！'],
                artisan: ['嘿嘿，手艺还行。', '过奖了，干这行久了。', '您懂行！'],
                sect_outer: ['不敢当，还差得远。', '师傅教得好。', '过奖了。'],
                wanderer: ['哈哈，见笑了。', '走南闯北学的。', '您也厉害。'],
                teahouse_staff: ['诶，客官过奖了！', '哪里哪里，分内的事。', '您满意就好！'],
                teahouse_regular: ['哈哈，我就一喝茶的。', '过奖过奖。', '你也有眼光。'],
                townsfolk: ['哈哈，过奖了。', '哪里哪里，混日子。', '您太客气了。'],
                hidden: ['……凡人的夸赞，无意义。', '命数而已。', '……']
            };
            return pick(admireReplies[type] || admireReplies.townsfolk);
        }

        // ── 浏览类意图（browse）：玩家问有没有新货，NPC回应 ──
        if (intent === 'browse') {
            var browseReplies = {
                merchant: ['有！刚到了一批新货。', '行，我给您看看。', '来了批新货，您瞧瞧。'],
                artisan: ['有！刚做了几件新的。', '行，我给您看看。', '刚完工一件，您瞧。'],
                sect_outer: ['嗯，最近有些新得。', '行，我跟你说说。', '有些新感悟。'],
                wanderer: ['有！路上碰到不少新鲜事。', '行，我跟你讲讲。', '新鲜事多着呢。'],
                teahouse_staff: ['诶！新茶刚到！', '有！今天的新茶。', '来了批好茶！'],
                teahouse_regular: ['有！今天听到个新的。', '行，我跟你讲讲。', '新鲜事多着呢。'],
                townsfolk: ['有！家里添了点新东西。', '行，我给你看看。', '最近有些新鲜事。'],
                hidden: ['……天机有变。', '命数流转。', '……有。']
            };
            return pick(browseReplies[type] || browseReplies.townsfolk);
        }

        // ── 商人 — ask_trade：具体说哪些货好卖 ──
        if (type === 'merchant' && (intent === 'ask_trade' || intent === 'ask_work')) {
            var goods = concreteWord || '茶叶';
            var otherGoods = pick(['布匹', '盐', '糖', '瓷器']);
            if (usePureDialogue) {
                return pick([
                    goods + '最近卖得最好！都快断货了。',
                    '要说好卖，' + goods + '排第一，刚到就被人抢光了。',
                    goods + '走得快，' + otherGoods + '也还行。',
                    '这几天就' + goods + '最紧俏，别的都一般。',
                    goods + '啊，来一批走一批，供不上卖！'
                ]);
            } else {
                return pick([
                    name + '来了精神，"要说最近啥好卖，' + goods + '第一！刚到货就被抢光了。还有' + otherGoods + '也还行。"',
                    name + '翻了翻账本，"' + goods + '走得最快，一批货三天就见底。"',
                    name + '压低声音，"' + goods + '最紧俏，我给你留点。"'
                ]);
            }
        }

        // ── 手艺人 — ask_craft：具体说手艺细节 ──
        if (type === 'artisan' && (intent === 'ask_craft' || intent === 'ask_work')) {
            var craft = concreteWord || '这活儿';
            if (usePureDialogue) {
                return pick([
                    craft + '最吃功夫，急不来。',
                    '你看这' + craft + '，火候差一点都不行。',
                    craft + '我干了二十年了，闭着眼都能做。',
                    '要说门道，' + craft + '里头讲究可多了。'
                ]);
            } else {
                return pick([
                    name + '擦了擦手，"' + craft + '最吃功夫，急不来。"',
                    name + '拿起活儿比划，"你看这' + craft + '，火候差一点都不行。"',
                    name + '有些自豪，"' + craft + '我干了二十年了。"'
                ]);
            }
        }

        // ── 外门弟子 — ask_cultivation ──
        if (type === 'sect_outer' && (intent === 'ask_cultivation' || intent === 'learn')) {
            var cult = concreteWord || '吐纳';
            if (usePureDialogue) {
                return pick([
                    cult + '是基础，每天不能断。',
                    cult + '讲究心静，心不静练啥都白搭。',
                    cult + '我练了三年才摸着点门道。',
                    '要说感悟，' + cult + '最关键，别的都是花架子。'
                ]);
            } else {
                return pick([
                    name + '正色道，"' + cult + '是基础，每天不能断。"',
                    name + '想了想，"' + cult + '讲究心静，心不静练啥都白搭。"',
                    name + '认真说，"' + cult + '我练了三年才摸着门道。"'
                ]);
            }
        }

        // ── 游侠 — ask_travel/ask_news ──
        if (type === 'wanderer' && (intent === 'ask_travel' || intent === 'ask_news')) {
            var place = concreteWord || '外头';
            if (usePureDialogue) {
                return pick([
                    place + '我去过，那地方可不太平。',
                    place + '？那地方有意思，回头慢慢跟你说。',
                    '要说新鲜事，' + place + '最多。',
                    place + '那边最近出了点事，你听说了没？'
                ]);
            } else {
                return pick([
                    name + '喝了口水，"' + place + '我去过，那地方可不太平。"',
                    name + '来了兴致，"' + place + '？那地方有意思。"',
                    name + '压低声音，"' + place + '那边最近出了点事。"'
                ]);
            }
        }

        // ── 茶馆伙计 — ask_work/ask_news ──
        if (type === 'teahouse_staff' && (intent === 'ask_work' || intent === 'ask_news')) {
            var work = concreteWord || '沏茶';
            if (usePureDialogue) {
                return pick([
                    work + '最讲究，水温差一点都不行。',
                    work + '忙完了歇会儿，一天到晚不停。',
                    '要说新鲜事，茶客嘴里最多，' + work + '的时候听着呢。'
                ]);
            } else {
                return pick([
                    name + '擦着桌子，"' + work + '最讲究，水温差一点都不行。"',
                    name + '笑了笑，"' + work + '忙完了歇会儿。"'
                ]);
            }
        }

        // ── 隐世NPC — ask_cultivation ──
        if (type === 'hidden' && (intent === 'ask_cultivation' || intent === 'learn')) {
            var cult2 = concreteWord || '天道';
            if (usePureDialogue) {
                return pick([
                    cult2 + '？凡人难懂，我也只窥得一二。',
                    cult2 + '，这事儿深着呢，三言两语说不透。',
                    cult2 + '，机缘未到，强求无用。',
                    '要说' + cult2 + '，我也只窥得一二，不敢妄言。'
                ]);
            } else {
                return pick([
                    name + '闭了闭眼，"' + cult2 + '？凡人难懂，我也只窥得一二。"',
                    name + '缓缓开口，"' + cult2 + '，这事儿深着呢，三言两语说不透。"',
                    name + '看了你一眼，"' + cult2 + '，机缘未到。"'
                ]);
            }
        }

        // ── 隐世NPC通用：玄乎、简短 ──
        if (type === 'hidden') {
            if (usePureDialogue) {
                return pick([
                    '……天机不可泄露。', '你不必知道。', '命数如此。', '……'
                ]);
            } else {
                return pick([
                    name + '沉默片刻，"……天机不可泄露。"',
                    name + '看了你一眼，"你不必知道。"',
                    name + '缓缓道，"命数如此。"'
                ]);
            }
        }

        // ── 通用回退：用 refWord（NPC之前的话题词）造句 ──
        if (refWord) {
            if (usePureDialogue) {
                return pick([
                    refWord + '？这事儿挺有意思的，前两天我还专门琢磨了一下。',
                    refWord + '，这个嘛，其实也不难，就是得用心去琢磨。',
                    refWord + '，这里头门道可不少，我也是摸索了好一阵才弄明白。'
                ]);
            } else {
                return pick([
                    name + '来了精神，"' + refWord + '？这事儿挺有意思的，前两天我还专门琢磨了一下。"',
                    name + '想了想，"' + refWord + '，这个嘛，其实也不难，就是得用心去琢磨。"',
                    name + '认真地说，"' + refWord + '，这里头门道可不少，我也是摸索了好一阵才弄明白。"'
                ]);
            }
        }

        // 完全无话题词的回退
        return pick(['嗯，就是前两天那事儿，现在过去了。', '这事儿吧，挺复杂的，不过总算解决了。', '其实也没啥，就是花了点功夫。', '嗯，现在想想也不算啥大事。']);
    }

    // ── NPC跟进回复生成 ──────────────────────────────────────

    /**
     * 根据玩家选项的intent和对话上下文，动态生成NPC跟进回复
     * 替代静态的opt.npcReply，让NPC能真正"听懂"玩家说了什么
     * @param {string} npcId - NPC ID
     * @param {string} playerOption - 玩家选择的选项文本
     * @param {string} intent - 选项意图（listen/confirm/accept/help等）
     * @param {object} dlgCtx - 对话上下文（turnCount/lastNpcText/currentTopic等）
     * @returns {string} NPC的跟进回复
     */
    function generateFollowUpReply(npcId, playerOption, intent, dlgCtx) {
        // 确保 playerOption 是字符串
        if (typeof playerOption !== 'string') {
            playerOption = (playerOption && playerOption.playerOption) ? playerOption.playerOption : String(playerOption || '');
        }
        var profile = NPC_PROFILES[npcId];

        // ── 动物NPC：只有叫声+动作，不走人类对话逻辑 ──
        if (profile && profile.isAnimal) {
            return _generateAnimalReply(npcId, playerOption, dlgCtx);
        }

        var name = profile ? profile.name : npcId;
        var state = _dailyStates[npcId];
        var mood = state ? state.mood : 50;
        var rel = (window.getRel) ? getRel(npcId) : 0;
        var turnCount = dlgCtx ? dlgCtx.turnCount : 0;

        // ── 记忆系统：将玩家关键事件写入NPC记忆 ──
        // 这样NPC能在后续对话中提起玩家说过的事
        if (typeof playerOption === 'string' && playerOption.length > 0) {
            _writePlayerMemory(npcId, playerOption);
        }

        // 提取NPC刚才说的关键词，用于接话
        var lastNpcText = (dlgCtx && dlgCtx.lastNpcText) ? dlgCtx.lastNpcText : '';
        var lastKw = extractKeywords(lastNpcText);
        // topicWord 优先使用 NPC上一句话的关键词（这才是当前对话的真正话题）
        // currentTopic 是开场白话题，可能与当前对话无关（如开场白聊"这块料"，
        // 但NPC刚才说"昨天路上碰到狼了"，此时topicWord应该是"狼/路上"而不是"这块料"）
        var topicWord = '';
        var currentTopic = (dlgCtx && dlgCtx.currentTopic) ? dlgCtx.currentTopic : '';
        var playerText = (typeof playerOption === 'string') ? playerOption : '';

        // 优先用_extractTopicObject提取具体事物词（如"伞/茶/儿子/狼/生意"）
        // 理由：extractKeywords按停用词切分后仍可能切出泛指词或漏切，
        // _extractTopicObject直接匹配词典，能稳定提取具体事物词，避免残缺词
        var npcObj = _extractTopicObject(lastNpcText);
        if (npcObj && npcObj.length >= 1 && playerText.indexOf(npcObj) < 0) {
            topicWord = npcObj;
        }
        // 回退：如果_extractTopicObject提取失败，才用extractKeywords
        if (!topicWord) {
            for (var twi = 0; twi < lastKw.length; twi++) {
                var kw = lastKw[twi];
                if (kw.length >= 2 && kw.length <= 4 && playerText.indexOf(kw) < 0 && _isValidTopicWord(kw)) {
                    topicWord = kw;
                    break;
                }
            }
        }
        // 回退：如果NPC上一句话没有合适的话题词，才用currentTopic（开场白话题）
        if (!topicWord && currentTopic) {
            var ctKw = extractKeywords(currentTopic);
            for (var cti = 0; cti < ctKw.length; cti++) {
                if (ctKw[cti].length >= 2 && ctKw[cti].length <= 4 && playerText.indexOf(ctKw[cti]) < 0 && _isValidTopicWord(ctKw[cti])) {
                    topicWord = ctKw[cti];
                    break;
                }
            }
        }

        // ── topicWord质量验证：只有名词性关键词才适合嵌入模板造句 ──
        // 如"真舒坦"、"还行吧"不适合 → 清空，走无topicWord的通用模板
        if (topicWord && !_isValidTopicWord(topicWord)) {
            topicWord = '';
        }

        // ── 核心：分析玩家选项，建立语境桥接 ──
        var playerAnalysis = _analyzePlayerOption(playerOption);
        var bridge = _contextBridge(playerAnalysis, lastNpcText, topicWord);
        var connWord = bridge.connectionWord || topicWord;

        // ⚠️ 注意：不再用 connWord 覆盖 topicWord
        // 旧逻辑：if (!topicWord && connWord) { topicWord = connWord; }
        // 这会导致NPC回复包含玩家选项关键词，让用户感觉"NPC在重复玩家的话"
        // 现在：topicWord 只来自NPC话题（currentTopic 或 NPC上一句话），保持NPC话语独立性
        // _generateTypeSpecificReply 会用身份特色词（concreteWord）作为 refWord，不依赖玩家选项

        // ── 回复格式多样化 ──
        var styleRoll = Math.random();
        var usePureDialogue = (turnCount >= 3 && styleRoll < 0.5) || styleRoll < 0.25;
        var useShortDesc = !usePureDialogue && styleRoll < 0.6;

        var reply = '';

        // ── 天气感知回复：当天气恶劣且玩家提到天气时，NPC优先聊天气 ──
        var curWeather = (window.GameTime) ? GameTime.getWeather() : null;
        var curWeatherId = curWeather ? curWeather.id : 'clear';
        var isBadWeather = (curWeatherId === 'rainy' || curWeatherId === 'stormy' || curWeatherId === 'drizzle' || curWeatherId === 'snowy');
        var playerMentionsWeather = (playerOption.indexOf('雨') >= 0 || playerOption.indexOf('雪') >= 0 || playerOption.indexOf('天气') >= 0 || playerOption.indexOf('避') >= 0 || playerOption.indexOf('暖') >= 0);

        if (isBadWeather && playerMentionsWeather && Math.random() < 0.9) {
            // 天气相关回复（身份特色）
            var weatherReplies = _getWeatherReplies(npcId, name, curWeatherId, usePureDialogue, useShortDesc);
            if (weatherReplies.length > 0) {
                reply = pick(weatherReplies);
            }
        }

        // ── 优先使用语境桥接策略生成回复 ──
        // 如果天气回复已命中，跳过桥接策略
        if (!reply) {

        // ── 愤怒机制：检测是否触发愤怒，触发则直接使用愤怒回复 ──
        // 场景：NPC伤心+反面选项 / NPC分享喜悦+泼冷水 / NPC求助+无视 / NPC感谢+轻视
        var angerCtx = null;
        try { angerCtx = _analyzeNpcSpeech(lastNpcText, lastKw, (mood < 40 ? 'low' : (mood > 60 ? 'high' : 'mid')), state); } catch (e) { angerCtx = null; }
        if (angerCtx && state) {
            var angerResult = _checkAngerTrigger(angerCtx, mood, intent, name, state);
            if (angerResult && angerResult.reply) {
                reply = angerResult.reply;
                state._lastReplyWasAnger = true; // 标记为愤怒回复，跳过冷淡修饰
                // 应用愤怒等级和mood/rel调整
                if (typeof angerResult.angerDelta === 'number') {
                    state.angerLevel = Math.max(0, Math.min(100, (state.angerLevel || 0) + angerResult.angerDelta));
                }
                if (typeof angerResult.moodDelta === 'number' && angerResult.moodDelta !== 0) {
                    adjustMood(npcId, angerResult.moodDelta, 'anger_trigger:' + angerResult.trigger);
                    mood = state.mood; // 更新本地mood变量
                }
                if (typeof angerResult.relDelta === 'number' && angerResult.relDelta !== 0 && window.adjRel) {
                    adjRel(npcId, angerResult.relDelta);
                }
            }
        }

        // ── 被质疑反应：玩家选doubt intent时，根据是否在骗人反应 ──
        // doubt intent表示玩家质疑NPC上一句话的真实性
        if (intent === 'doubt' && !reply) {
            var wasLying = state && state._lastReplyWasLie === true;
            reply = _generateDoubtReaction(profile, state, wasLying);
            // 被质疑后重置骗人标记
            if (state) state._lastReplyWasLie = false;
        }

        // ── 骗人检测：基于性格+身份+情绪+关系判断是否骗人 ──
        // 不是所有NPC都会骗人，骗人倾向由多因素综合决定
        // 注意：愤怒回复和被质疑反应优先，不覆盖
        if (!reply) {
            var deceitResult = _checkDeceitTrigger(playerOption, lastNpcText, profile, state, rel);
            if (deceitResult && deceitResult.reply) {
                reply = deceitResult.reply;
                // 记录这一轮在骗人，供下一轮被质疑时判断
                if (state) state._lastReplyWasLie = true;
            } else {
                // 没骗人，重置标记
                if (state) state._lastReplyWasLie = false;
            }
        }

        // ── 莫名选项检测：玩家选项与NPC原话无语义关联时，NPC按性格回应 ──
        // 双重判定：关键词交集为0 + intent不匹配
        // 这样既不强行接莫名选项，也不突兀跳转，反而强化NPC自主意识
        // 注意：愤怒回复优先，不覆盖
        if (!reply) {
            var weirdReply = _generateWeirdOptionReply(playerOption, lastNpcText, intent, profile, name, mood);
            if (weirdReply) {
                reply = weirdReply;
            }
        }
        }

        if (!reply) {
        // ── 身份特色回复优先：所有 intent 都先尝试身份特色回复 ──
        // 这样每个NPC的回复都符合个人身份/特征，而不是通用模板
        // ask_* 类 intent 直接走身份特色；其他 intent 也走，确保有身份感
        reply = _generateTypeSpecificReply(npcId, profile, name, intent, topicWord, usePureDialogue, useShortDesc, mood, playerOption, lastNpcText);
        }
        if (!reply) {
        if (bridge.connectionType === 'answer_question') {
            // 玩家在问问题 → NPC回答，把话说完整
            if (connWord) {
                if (usePureDialogue) {
                    reply = pick([
                        connWord + '啊，其实不算啥大事，就是昨天碰上点麻烦，后来自己解决了。',
                        connWord + '，说白了就是运气不好，碰上了，不过现在已经过去了。',
                        connWord + '？这事儿吧，前两天闹心了一阵，今天总算消停了。',
                        connWord + '，也没啥好隐瞒的，就是亏了点小钱，吃一堑长一智吧。'
                    ]);
                } else if (useShortDesc) {
                    reply = pick([
                        name + '点了点头，"' + connWord + '啊，其实不算啥大事，就是昨天碰上点麻烦，后来自己解决了。"',
                        name + '想了想，"' + connWord + '，说白了就是运气不好，碰上了，不过现在已经过去了。"',
                        name + '叹了口气，"' + connWord + '，前两天闹心了一阵，今天总算消停了。"'
                    ]);
                } else {
                    reply = pick([
                        name + '认真回忆了一下，"' + connWord + '啊，这事儿说起来话长。昨天我去' + connWord + '的时候正好碰上了，折腾了半天才弄好。"',
                        name + '看了看四周，压低声音，"' + connWord + '，其实也不是什么大不了的事，就是让人心里不痛快，现在已经想开了。"',
                        name + '深吸一口气，"' + connWord + '，前两天确实烦得不行，今天跟你聊聊，心里舒坦多了。"'
                    ]);
                }
            } else {
                if (usePureDialogue) {
                    reply = pick(['也没啥大事，就是前两天有点不顺，现在好了。', '就是些琐碎事，攒一块儿就烦人，过去了。', '说来话长，不过核心就是亏了点小钱，不碍事。']);
                } else {
                    reply = pick([
                        name + '想了想，"也没啥大事，就是前两天有点不顺，现在好了。"',
                        name + '"就是些琐碎事，攒一块儿就烦人，过去了。"',
                        name + '顿了顿，"说来话长，不过核心就是亏了点小钱，不碍事。"'
                    ]);
                }
            }
        }
        else if (bridge.connectionType === 'react_emotion' && bridge.replyStrategy === 'comfort') {
            // 玩家在关心/同情 → NPC感动回应，把话说完整
            if (connWord) {
                if (usePureDialogue) {
                    reply = pick([
                        connWord + '……唉，但愿能过去吧。你也别太担心。',
                        '……谢谢你。有你这句话我心里好受多了。',
                        connWord + '，唉，走一步看一步吧。急也没用。',
                        connWord + '，其实也不是啥大事，就是心里堵得慌。'
                    ]);
                } else {
                    reply = pick([
                        name + '勉强笑了笑，"' + connWord + '……唉，但愿能过去吧。你也别太担心。"',
                        name + '沉默了一会儿，"……谢谢你。有你这句话我心里好受多了。"',
                        name + '叹了口气，"' + connWord + '，走一步看一步吧。急也没用。"',
                        name + '轻声说，"' + connWord + '，其实也不是啥大事，就是心里堵得慌。"'
                    ]);
                }
            } else {
                if (usePureDialogue) {
                    reply = pick(['但愿吧，你也别太担心我了。', '谢谢你，有你这句话就好。', '嗯，你说得对，想太多没用。']);
                } else {
                    reply = pick([
                        name + '勉强笑了笑，"但愿吧，你也别太担心我了。"',
                        name + '沉默了一会儿，"谢谢你，有你这句话就好。"',
                        name + '轻声说，"嗯，你说得对，想太多没用。"'
                    ]);
                }
            }
        }
        else if (bridge.connectionType === 'react_emotion' && bridge.replyStrategy === 'share_joy') {
            // 玩家在分享喜悦 → NPC开心回应，把话说完整
            if (connWord) {
                if (usePureDialogue) {
                    reply = pick([
                        connWord + '！今天可把我乐坏了，盼了好久的事儿总算成了！',
                        connWord + '，哈哈！你不知道今天多顺，一下就办妥了！',
                        connWord + '，你猜怎么着？本来以为要折腾好几天，结果一下就成了！',
                        connWord + '！这回算是心想事成，心里那块石头总算落了地。'
                    ]);
                } else {
                    reply = pick([
                        name + '眉飞色舞，"' + connWord + '！今天可把我乐坏了，盼了好久的事儿总算成了！"',
                        name + '笑得更开心了，"' + connWord + '，哈哈！你不知道今天多顺，一下就办妥了！"',
                        name + '兴奋地说，"' + connWord + '，你猜怎么着？本来以为要折腾好几天，结果一下就成了！"',
                        name + '拉着你的手，"' + connWord + '！这回算是心想事成，心里那块石头总算落了地。"'
                    ]);
                }
            } else {
                if (usePureDialogue) {
                    reply = pick(['今天可把我乐坏了，盼了好久的事儿总算成了！', '哈哈！你不知道今天多顺，一下就办妥了！', '你猜怎么着？本来以为要折腾好几天，结果一下就成了！']);
                } else {
                    reply = pick([
                        name + '眉飞色舞地讲了起来，"今天可把我乐坏了，盼了好久的事儿总算成了！"',
                        name + '笑得更开心了，"哈哈！你不知道今天多顺，一下就办妥了！"',
                        name + '兴奋地说，"你猜怎么着？本来以为要折腾好几天，结果一下就成了！"'
                    ]);
                }
            }
        }
        else if (bridge.connectionType === 'accept_action') {
            // 玩家在提议行动 → NPC接受
            if (usePureDialogue) {
                reply = pick(['走！正好我也想出去转转。', '好啊！那就不客气了。', '说走就走！你带路。', '行啊，反正闲着也是闲着。']);
            } else {
                reply = pick([
                    name + '高兴地站起来，"走！正好我也想出去转转。"',
                    name + '眼睛一亮，"好啊！那就不客气了。"',
                    name + '笑了，"说走就走！你带路。"',
                    name + '拍了拍手，"行啊，反正闲着也是闲着。"'
                ]);
            }
        }
        else if (bridge.connectionType === 'echo_topic' && connWord) {
            // 玩家选项包含话题词 → NPC展开话题，把话说完整
            if (usePureDialogue) {
                reply = pick([
                    connWord + '，就这事儿。其实也没你想的那么复杂。',
                    '是啊，' + connWord + '嘛……不过也不是啥坏事。',
                    connWord + '你也看出来了？眼光不错嘛。',
                    '嗯，' + connWord + '，就是这么回事。你咋知道的？'
                ]);
            } else {
                reply = pick([
                    name + '点了点头，"' + connWord + '，就这事儿。其实也没你想的那么复杂。"',
                    name + '叹了口气，"是啊，' + connWord + '嘛……不过也不是啥坏事。"',
                    name + '看了你一眼，"' + connWord + '你也看出来了？眼光不错嘛。"',
                    name + '"嗯，' + connWord + '，就是这么回事。你咋知道的？"'
                ]);
            }
        }
        else {
            // ── 优先使用NPC个人意图回复 ──
            var pd = NPC_PROFILES[npcId] ? (NPC_PROFILES[npcId].personalDialogue || null) : null;
            if (pd && pd.intentReplies) {
                var intentStr = (typeof intent === 'string') ? intent : 'default';
                var pdReplies = pd.intentReplies[intentStr];
                if (!pdReplies && intentStr.indexOf('_') > 0) {
                    pdReplies = pd.intentReplies[intentStr.split('_')[0]];
                }
                if (!pdReplies) { pdReplies = pd.intentReplies.default; }
                if (pdReplies && Math.random() < 0.6) {
                    var pdReply = pick(pdReplies);
                    if (usePureDialogue) {
                        reply = pdReply;
                    } else if (useShortDesc) {
                        reply = name + '想了想，"' + pdReply + '"';
                    } else {
                        reply = name + '认真地说，"' + pdReply + '"';
                    }
                }
            }

            // ── 如果个人回复未命中，回退到 intent 匹配（通用模板） ──
            if (!reply) {
            switch (intent) {
            // 倾听类 → NPC继续展开话题
            case 'listen':
            case 'listen_memory':
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([
                            topicWord + '这事儿吧，其实也不复杂，就是前两天出了点岔子，折腾了半天才弄好。',
                            topicWord + '，你也知道，那地方不好弄，跑了好几趟才算办妥。',
                            topicWord + '的事，昨天可把我烦坏了，好在今天总算消停了。',
                            topicWord + '，唉，说起来都是小事，但攒一块儿就让人头疼，现在过去了。'
                        ]);
                    } else if (useShortDesc) {
                        reply = pick([
                            name + '点了点头，"' + topicWord + '这事儿吧，其实也不复杂，就是前两天出了点岔子，折腾了半天才弄好。"',
                            name + '叹了口气，"' + topicWord + '，你也知道，那地方不好弄，跑了好几趟才算办妥。"',
                            name + '"嗯，' + topicWord + '的事，昨天可把我烦坏了，好在今天总算消停了。"'
                        ]);
                    } else {
                        reply = pick([
                            name + '深吸一口气，"' + topicWord + '这事儿吧，其实也不复杂，就是前两天出了点岔子，折腾了半天才弄好。你听我慢慢说。"',
                            name + '犹豫了一下，"' + topicWord + '，你也知道，那地方不好弄。昨天我去的时候正好赶上了，跑了好几趟。"',
                            name + '看了看四周，压低声音，"' + topicWord + '的事，昨天可把我烦坏了，好在今天总算消停了。你别往外传。"',
                            name + '沉默了片刻，"' + topicWord + '，唉，说起来都是小事，但攒一块儿就让人头疼，现在过去了。"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['也没啥大事，就是前两天有点不顺，现在好了。', '就是些琐碎事，攒一块儿就烦人，过去了。', '其实也没啥，就是亏了点小钱，吃一堑长一智吧。']);
                    } else {
                        reply = pick([
                            name + '深吸了一口气，"也没啥大事，就是前两天有点不顺，现在好了。"',
                            name + '犹豫了一下，"就是些琐碎事，攒一块儿就烦人，过去了。"',
                            name + '沉默了片刻，然后说，"其实也没啥，就是亏了点小钱，吃一堑长一智吧。"'
                        ]);
                    }
                }
                break;

            // 确认类 → NPC顺着话题确认
            case 'confirm':
            case 'clarify':
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([
                            topicWord + '，就这事儿。没跑。',
                            '是啊，' + topicWord + '嘛。你也看出来了？',
                            topicWord + '，嗯，就是这么回事。',
                            '对，' + topicWord + '。你消息挺灵通啊。'
                        ]);
                    } else {
                        reply = pick([
                            name + '点了点头，"' + topicWord + '，就这事儿。没跑。"',
                            name + '叹了口气，"是啊，' + topicWord + '嘛。你也看出来了？"',
                            name + '看了你一眼，"' + topicWord + '，嗯，就是这么回事。"',
                            name + '"对，' + topicWord + '。你消息挺灵通啊。"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['你也看出来了，眼光不错嘛。', '是啊，就这么回事，没啥复杂的。', '嗯，没错，就是你想的那样。']);
                    } else {
                        reply = pick([
                            name + '点了点头，"你也看出来了，眼光不错嘛。"',
                            name + '叹了口气，"是啊，就这么回事，没啥复杂的。"',
                            name + '"嗯，没错，就是你想的那样。"'
                        ]);
                    }
                }
                break;

            // 共鸣类 → NPC因共鸣展开更多
            case 'resonate':
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([
                            '你也碰过' + topicWord + '？那你怎么弄的？快跟我说说。',
                            topicWord + '你也遇到过？快说说，我正愁没人商量呢。',
                            topicWord + '，原来不止我一个，我心里好受多了。',
                            '那后来呢？你咋处理的？'
                        ]);
                    } else {
                        reply = pick([
                            name + '有些意外，"你也碰过' + topicWord + '？那你怎么弄的？快跟我说说。"',
                            name + '眼睛亮了，"' + topicWord + '你也遇到过？快说说，我正愁没人商量呢。"',
                            name + '感慨道，"' + topicWord + '，原来不止我一个，我心里好受多了。"',
                            name + '凑近了些，"那后来呢？你咋处理的？"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['真的？那你怎么处理的？快说说。', '你也遇到过？那咱俩可算同病相怜了。', '原来不止我一个，我心里好受多了。']);
                    } else {
                        reply = pick([
                            name + '有些意外，"真的？那你怎么处理的？快说说。"',
                            name + '眼睛亮了，"你也遇到过？那咱俩可算同病相怜了。"',
                            name + '感慨道，"原来不止我一个人这样，我心里好受多了。"'
                        ]);
                    }
                }
                break;

            // 安慰类 → NPC根据话题回应
            case 'comfort':
            case 'reassure':
            case 'care':
                if (mood < 40) {
                    if (topicWord) {
                        if (usePureDialogue) {
                            reply = pick([
                                topicWord + '，但愿能过去吧，你也别太担心我了。',
                                '谢谢你，有你这句话我心里好受多了。',
                                topicWord + '，唉，走一步看一步吧，急也没用。',
                                topicWord + '，其实也不是啥大事，就是心里堵得慌。'
                            ]);
                        } else {
                            reply = pick([
                                name + '勉强笑了笑，"' + topicWord + '，但愿能过去吧，你也别太担心我了。"',
                                name + '沉默了一会儿，"谢谢你，有你这句话我心里好受多了。"',
                                name + '轻声说，"' + topicWord + '，唉，走一步看一步吧，急也没用。"',
                                name + '叹了口气，"' + topicWord + '，其实也不是啥大事，就是心里堵得慌。"'
                            ]);
                        }
                    } else {
                        if (usePureDialogue) {
                            reply = pick(['但愿吧，你也别太担心我了。', '谢谢你，有你这句话就好。', '嗯，你说得对，想太多没用。']);
                        } else {
                            reply = pick([
                                name + '勉强笑了笑，"但愿吧，你也别太担心我了。"',
                                name + '沉默了一会儿，"谢谢你，有你这句话就好。"',
                                name + '轻声说，"嗯，你说得对，想太多没用。"'
                            ]);
                        }
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['你说得对，想太多了。', '嗯，有你这句话就好。', '也是，愁也没用。']);
                    } else {
                        reply = pick([
                            name + '笑了笑，"你说得对，想太多了。"',
                            name + '点了点头，"嗯，有你这句话就好。"',
                            name + '心情好了些，"也是，愁也没用。"'
                        ]);
                    }
                }
                break;

            // 接受邀请
            case 'accept':
                if (usePureDialogue) {
                    reply = pick(['走！正好我也想出去转转。', '好啊！那就不客气了。', '那我不客气了，走着！', '说走就走！你带路。']);
                } else {
                    reply = pick([
                        name + '高兴地站起来，"走！正好我也想出去转转。"',
                        name + '眼睛一亮，"好啊！那就不客气了。"',
                        name + '笑了，"那我不客气了，走着！"',
                        name + '拍了拍手，"说走就走！你带路。"'
                    ]);
                }
                break;

            // 延迟/犹豫
            case 'delay':
                if (usePureDialogue) {
                    reply = pick(['哦……那下次吧。', '行，不急。', '没事，改天也行。']);
                } else {
                    reply = pick([
                        name + '有些失望，"哦……那下次吧。"',
                        name + '点了点头，"行，不急。"',
                        name + '"没事，改天也行。"'
                    ]);
                }
                break;

            // 帮忙类
            case 'help':
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([
                            topicWord + '，不会太麻烦你吧？那可太好了。',
                            topicWord + '，那太好了！我正愁一个人弄不过来呢。',
                            topicWord + '，你真想帮忙？那我可就不客气了。',
                            '真的？那我可就不客气了！'
                        ]);
                    } else {
                        reply = pick([
                            name + '犹豫了一下，"' + topicWord + '，不会太麻烦你吧？那可太好了。"',
                            name + '感激地说，"' + topicWord + '，那太好了！我正愁一个人弄不过来呢。"',
                            name + '想了想，"' + topicWord + '，你真想帮忙？那我可就不客气了。"',
                            name + '"真的？那我可就不客气了！"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['不会太麻烦你吧？那可太好了。', '那太好了！我正愁一个人弄不过来呢。', '真的？那我可就不客气了！']);
                    } else {
                        reply = pick([
                            name + '犹豫了一下，"不会太麻烦你吧？那可太好了。"',
                            name + '感激地说，"那太好了！我正愁一个人弄不过来呢。"',
                            name + '"真的？那我可就不客气了！"'
                        ]);
                    }
                }
                break;

            // 分享喜悦
            case 'share_joy':
            case 'celebrate':
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([
                            topicWord + '！今天可把我乐坏了，盼了好久总算成了！',
                            topicWord + '，哈哈！你不知道今天多顺，一下就办妥了！',
                            topicWord + '，你猜怎么着？本来以为要折腾好几天，结果一下就成了！',
                            topicWord + '！这回算是心想事成，心里那块石头落了地。'
                        ]);
                    } else {
                        reply = pick([
                            name + '眉飞色舞，"' + topicWord + '！今天可把我乐坏了，盼了好久总算成了！"',
                            name + '笑得更开心了，"' + topicWord + '，哈哈！你不知道今天多顺，一下就办妥了！"',
                            name + '兴奋地说，"' + topicWord + '，你猜怎么着？本来以为要折腾好几天，结果一下就成了！"',
                            name + '拉着你的手，"' + topicWord + '！这回算是心想事成，心里那块石头落了地。"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['今天可把我乐坏了，盼了好久总算成了！', '哈哈！你不知道今天多顺，一下就办妥了！', '你猜怎么着？本来以为要折腾好几天，结果一下就成了！']);
                    } else {
                        reply = pick([
                            name + '眉飞色舞地讲了起来，"今天可把我乐坏了，盼了好久总算成了！"',
                            name + '笑得更开心了，"哈哈！你不知道今天多顺，一下就办妥了！"',
                            name + '兴奋地说，"你猜怎么着？本来以为要折腾好几天，结果一下就成了！"'
                        ]);
                    }
                }
                break;

            // 陪伴类
            case 'accompany':
                if (usePureDialogue) {
                    reply = pick(['那太好了，正好有个伴。', '有你陪着就好，心里踏实多了。', '谢谢你，难得有人愿意陪我坐会儿。', '那就坐会儿吧，反正也没啥事。']);
                } else {
                    reply = pick([
                        name + '露出了笑容，"那太好了，正好有个伴。"',
                        name + '松了口气，"有你陪着就好，心里踏实多了。"',
                        name + '轻声说，"谢谢你，难得有人愿意陪我坐会儿。"',
                        name + '笑了笑，"那就坐会儿吧，反正也没啥事。"'
                    ]);
                }
                break;

            // 邀请类
            case 'invite':
            case 'shelter':
            case 'warm':
                if (usePureDialogue) {
                    reply = pick(['那就打扰了，正好歇歇脚。', '那就不客气了，正好避避雨！', '那敢情好！求之不得呢。', '那就谢谢了，你真客气。']);
                } else {
                    reply = pick([
                        name + '犹豫了一下，"那就打扰了，正好歇歇脚。"',
                        name + '抹了把雨水，"那就不客气了，正好避避雨！"',
                        name + '搓了搓手，"那敢情好！求之不得呢。"',
                        name + '笑了笑，"那就谢谢了，你真客气。"'
                    ]);
                }
                break;

            // 请教/学习 — 按 NPC 类型给出身份特色的具体内容，避免通用模板
            case 'learn':
            case 'ask_cultivation':
            case 'ask_craft':
            case 'ask_trade':
            case 'ask_travel':
            case 'ask_news':
            case 'ask_work':
                reply = _generateTypeSpecificReply(npcId, profile, name, intent, topicWord, usePureDialogue, useShortDesc, mood, playerOption, lastNpcText);
                break;

            // 欣赏/赞美/点单
            case 'admire':
            case 'treat':
            case 'order':
            case 'browse':
                if (usePureDialogue) {
                    reply = pick(['当然！你看这个，保你满意。', '好嘞！马上就来。', '你跟我来，我给你挑好的。', '那我不客气了！']);
                } else {
                    reply = pick([
                        name + '有些自豪，"当然！你看这个，保你满意。"',
                        name + '笑了，"好嘞！马上就来。"',
                        name + '神秘地笑了笑，"你跟我来，我给你挑好的。"',
                        name + '眼睛亮了，"那我不客气了！"'
                    ]);
                }
                break;

            // 继续追问
            case 'detail':
            case 'probe':
            case 'think':
            case 'bounce':
            case 'slow_down':
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([
                            topicWord + '，具体来说就是前两天碰上点麻烦，后来找人帮忙才弄好。',
                            topicWord + '，让我想想——对了，主要是花了不少功夫，总算办妥了。',
                            topicWord + '，你想知道细节？其实就是跑了趟远路，费了点周折。',
                            topicWord + '，核心就是昨天那事儿有了结果，比预想的顺利。'
                        ]);
                    } else {
                        reply = pick([
                            name + '想了想，"' + topicWord + '，具体来说就是前两天碰上点麻烦，后来找人帮忙才弄好。"',
                            name + '认真回忆了一下，"' + topicWord + '，让我想想——对了，主要是花了不少功夫，总算办妥了。"',
                            name + '看着你，"' + topicWord + '，你想知道细节？其实就是跑了趟远路，费了点周折。"',
                            name + '顿了顿，"' + topicWord + '，核心就是昨天那事儿有了结果，比预想的顺利。"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['具体就是前两天碰上点麻烦，后来找人帮忙才弄好。', '主要是花了不少功夫，总算办妥了。', '其实就是跑了趟远路，费了点周折。']);
                    } else {
                        reply = pick([
                            name + '想了想，"具体就是前两天碰上点麻烦，后来找人帮忙才弄好。"',
                            name + '认真回忆了一下，"主要是花了不少功夫，总算办妥了。"',
                            name + '顿了顿，"其实就是跑了趟远路，费了点周折。"'
                        ]);
                    }
                }
                break;

            // 同意/附和
            case 'agree':
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([topicWord + '，可不是嘛。', topicWord + '，说得有道理。', topicWord + '，我也这么觉得。']);
                    } else {
                        reply = pick([
                            name + '点了点头，"' + topicWord + '，可不是嘛。"',
                            name + '"' + topicWord + '，说得有道理。"',
                            name + '深有同感，"' + topicWord + '，我也这么觉得。"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['可不是嘛，你说到点子上了。', '说得有道理，我咋没想到呢。', '我也这么觉得，英雄所见略同。']);
                    } else {
                        reply = pick([
                            name + '点了点头，"可不是嘛，你说到点子上了。"',
                            name + '"嗯，说得有道理，我咋没想到呢。"',
                            name + '深有同感，"我也这么觉得，英雄所见略同。"'
                        ]);
                    }
                }
                break;

            // 解决问题
            case 'solve':
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([
                            topicWord + '，你说得对，光担心也没用，得想办法解决。',
                            topicWord + '，行，咱们合计合计，总会有办法的。',
                            topicWord + '，嗯，先这样试试？不行再说。'
                        ]);
                    } else {
                        reply = pick([
                            name + '想了想，"' + topicWord + '，你说得对，光担心也没用，得想办法解决。"',
                            name + '打起了精神，"' + topicWord + '，行，咱们合计合计，总会有办法的。"',
                            name + '"' + topicWord + '，嗯，先这样试试？不行再说。"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['你说得对，光担心也没用，得想办法解决。', '行，咱们合计合计，总会有办法的。', '嗯，先这样试试？不行再说。']);
                    } else {
                        reply = pick([
                            name + '想了想，"你说得对，光担心也没用，得想办法解决。"',
                            name + '打起了精神，"行，咱们合计合计，总会有办法的。"',
                            name + '"嗯，先这样试试？不行再说。"'
                        ]);
                    }
                }
                break;

            // 鼓励
            case 'encourage':
                if (usePureDialogue) {
                    reply = pick(['就等你这句话了，有你在我就有底了。', '有你在就好，心里踏实多了。', '嗯！有你撑腰，我又有劲儿了。']);
                } else {
                    reply = pick([
                        name + '伸了个懒腰，"就等你这句话了，有你在我就有底了。"',
                        name + '笑了笑，"有你在就好，心里踏实多了。"',
                        name + '打起了精神，"嗯！有你撑腰，我又有劲儿了。"'
                    ]);
                }
                break;

            // 协商
            case 'negotiate':
                if (usePureDialogue) {
                    reply = pick(['也行，你说去哪？我跟你走。', '嗯，换个地方也好，这儿确实吵了点。', '可以，听你的安排。']);
                } else {
                    reply = pick([
                        name + '想了想，"也行，你说去哪？我跟你走。"',
                        name + '"嗯，换个地方也好，这儿确实吵了点。"',
                        name + '考虑了一下，"可以，听你的安排。"'
                    ]);
                }
                break;

            // 推荐
            case 'recommend':
                if (usePureDialogue) {
                    reply = pick(['没有啊，好吃吗？你给好好说说。', '下次去试试，你推荐的一定不错。', '你推荐的一定不错，我记下了。']);
                } else {
                    reply = pick([
                        name + '好奇起来，"没有啊，好吃吗？你给好好说说。"',
                        name + '想了想，"下次去试试，你推荐的一定不错。"',
                        name + '"你推荐的一定不错，我记下了。"'
                    ]);
                }
                break;

            // 调侃
            case 'tease':
                if (usePureDialogue) {
                    reply = pick(['嘿！我说的可是真的，你不信拉倒！', '不信拉倒！反正我亲眼见的。', '你不信？那我也没办法，反正我说的是真的。']);
                } else {
                    reply = pick([
                        name + '急了，"嘿！我说的可是真的，你不信拉倒！"',
                        name + '"不信拉倒！反正我亲眼见的。"',
                        name + '瞪了你一眼，"你不信？那我也没办法，反正我说的是真的。"'
                    ]);
                }
                break;

            // 淡化感谢
            case 'downplay':
            case 'accept_thanks':
            case 'accept_refuse':
                if (usePureDialogue) {
                    reply = pick(['没事，举手之劳而已。', '不客气，咱谁跟谁啊。', '行吧，下次再说，不急这一时。']);
                } else {
                    reply = pick([
                        name + '笑了笑，"没事，举手之劳而已。"',
                        name + '"不客气，咱谁跟谁啊。"',
                        name + '点了点头，"行吧，下次再说，不急这一时。"'
                    ]);
                }
                break;

            // 默认
            default:
                if (topicWord) {
                    if (usePureDialogue) {
                        reply = pick([
                            topicWord + '，嗯，就是这么回事。',
                            topicWord + '，你说得对，我也这么想。',
                            topicWord + '，这事儿吧，其实挺有意思的。'
                        ]);
                    } else {
                        reply = pick([
                            name + '点了点头，"' + topicWord + '，嗯，就是这么回事。"',
                            name + '"' + topicWord + '，你说得对，我也这么想。"',
                            name + '想了想，"' + topicWord + '，这事儿吧，其实挺有意思的。"'
                        ]);
                    }
                } else {
                    if (usePureDialogue) {
                        reply = pick(['嗯，就是这么回事。', '你说得对，我也这么想。', '这事儿吧，其实挺有意思的。']);
                    } else {
                        reply = pick([
                            name + '点了点头，"嗯，就是这么回事。"',
                            name + '"你说得对，我也这么想。"',
                            name + '看了你一眼，"这事儿吧，其实挺有意思的。"'
                        ]);
                    }
                }
                break;
        }
            } // end of if (!reply)
        } // end of else (intent fallback)
        } // end of if (!reply) - 天气回复优先

        // ── 上下文修饰（统一为单层修饰，避免堆叠） ──

        // 心情差时，回复更短更消极（不加后缀，只截断）
        if (mood < 30 && reply.length > 20) {
            if (Math.random() < 0.4) {
                var endIdx = reply.indexOf('。');
                if (endIdx > 0) reply = reply.substring(0, endIdx + 1);
            }
        }

        // ── 去重：如果和最近的NPC回复相同，尝试换一个 ──
        if (dlgCtx) {
            var usedReplies = (dlgCtx.recentUtterances || []).slice(-3);
            // 检查是否和最近3条回复中的任何一条相同
            if (usedReplies.indexOf(reply) >= 0) {
                var variants = ['不过话说回来，你最近咋样？', '嗯，就是这事儿。', '你说呢？', '这事儿吧，挺复杂的。', '嗯，我想想。'];
                for (var vi = 0; vi < variants.length; vi++) {
                    if (usedReplies.indexOf(variants[vi]) < 0) {
                        reply = variants[vi];
                        break;
                    }
                }
            }
        }

        // ── 统一修饰系统：只保留性格修饰 + 心情修饰，总共最多1层后缀 ──
        // 旧的 _applyPersonalityShift / _applyFavorabilityTone / openSuffixes 已移除（会导致5层堆叠）
        // 性格修饰概率降低，且只在高性格值时触发
        if (profile && profile.personality && reply) {
            reply = _applyPersonalityFlavor(reply, profile.personality, profile.type);
        }

        // 心情修饰：只在性格修饰未触发后缀时才加，避免堆叠
        if (reply && typeof mood === 'number') {
            // 检查性格修饰是否已加了后缀（通过对比是否包含典型后缀标记）
            var hasPersonalitySuffix = /反正我是这么想的|不过也不好说|我可不是那种人|行了行了|你知道吗|改天一起去|哈哈！|你说是不是|逗你的|别当真/.test(reply);
            if (!hasPersonalitySuffix) {
                reply = _applyMoodFlavor(reply, mood);
            }
        }

        // ── 冷淡期修饰：NPC处于冷淡期时，正常回复被改为冷淡风格 ──
        // 注意：愤怒回复本身不修饰（已经是冷淡的），只修饰正常回复
        if (state && state.coldTurns > 0 && !state._lastReplyWasAnger) {
            reply = _applyColdPeriodTone(reply, state);
        }

        // ── 愤怒衰减：每轮对话自然衰减愤怒值和冷淡期 ──
        // 玩家选正面选项时额外衰减
        if (state) {
            var warmIntentsForDecay = ['comfort', 'care', 'reassure', 'understand', 'accompany', 'listen', 'help', 'encourage', 'agree', 'accept'];
            var isWarmIntent = warmIntentsForDecay.indexOf(intent) >= 0;
            // 自然衰减
            state.angerLevel = Math.max(0, (state.angerLevel || 0) - 3);
            // 正面选项额外衰减
            if (isWarmIntent && state.angerLevel > 0) {
                state.angerLevel = Math.max(0, state.angerLevel - 5);
            }
            // 冷淡期递减（每轮-1，正面选项额外-1已在_checkAngerTrigger处理）
            if (state.coldTurns > 0 && !state._coldTurnsDecremented) {
                state.coldTurns = Math.max(0, state.coldTurns - 1);
            }
            state._coldTurnsDecremented = false;
            state._lastReplyWasAnger = false;
        }

        return reply;
    }

    /**
     * 调整NPC心情
     * @param {string} npcId
     * @param {number} delta - 变化量（正负均可）
     * @param {string} reason - 原因描述
     */
    function adjustMood(npcId, delta, reason) {
        var state = _dailyStates[npcId];
        if (!state) return false;

        var oldMood = state.mood;
        state.mood = clamp(state.mood + delta, 0, 100);

        var moodInfo = getMoodInfo(state.mood);
        state.moodLabel = moodInfo.label;
        state.moodEmoji = moodInfo.emoji;

        return {
            npcId: npcId,
            name: state.name,
            oldMood: oldMood,
            newMood: state.mood,
            delta: delta,
            reason: reason || '',
            moodLabel: state.moodLabel,
            moodEmoji: state.moodEmoji
        };
    }

    /**
     * 获取所有NPC ID列表
     */
    function getAllNpcIds() {
        return Object.keys(NPC_PROFILES);
    }

    /**
     * 获取NPC当日状态
     */
    function getDailyState(npcId) {
        return _dailyStates[npcId] || null;
    }

    /**
     * 获取NPC档案
     */
    function getNpcProfile(npcId) {
        return NPC_PROFILES[npcId] || null;
    }

    /**
     * 获取所有NPC当日状态
     */
    function getAllDailyStates() {
        return _dailyStates;
    }

    // ═══════════════════════════════════════════════════════════
    //  留白接口 — 可扩展
    // ═══════════════════════════════════════════════════════════

    /**
     * 注册自定义NPC档案
     * @param {object} profile - NPC档案对象
     */
    function registerNpcProfile(profile) {
        if (!profile || !profile.id) return false;
        NPC_PROFILES[profile.id] = profile;
        return true;
    }

    /**
     * 注册自定义对话提示
     * @param {object} hint - { npcId: 'xxx'|'*', opening?, topic?, closing? }
     */
    function registerDialogueHint(hint) {
        if (!hint) return false;
        _customDialogueHints.push(hint);
        return true;
    }

    /**
     * 注册自定义决策规则
     * @param {object} rule - { condition(state, profile), resolve(state, profile) }
     */
    function registerDecisionRule(rule) {
        if (!rule || typeof rule.condition !== 'function' || typeof rule.resolve !== 'function') {
            return false;
        }
        _customRules.push(rule);
        return true;
    }

    /**
     * 内部：日终结算，保存当日心情和愤怒值为昨日基础
     * 愤怒值跨日衰减50%，冷淡期清零
     */
    function _dayEndSave() {
        for (var npcId in _dailyStates) {
            if (_dailyStates.hasOwnProperty(npcId)) {
                _yesterdayMoods[npcId] = _dailyStates[npcId].mood;
                // 保存愤怒值（跨日继承用，generateDailyState中会衰减50%）
                _yesterdayAngerLevels[npcId] = _dailyStates[npcId].angerLevel || 0;
            }
        }
    }

    /**
     * 情绪传染：所有NPC的心情向群体平均靠拢
     * 高社交性NPC更容易被传染，低社交性NPC更独立
     * 应在所有NPC的dailyState生成后调用
     * @returns {object} 传染结果统计
     */
    function applyEmotionContagion() {
        var npcIds = [];
        var totalMood = 0;
        var count = 0;

        for (var id in _dailyStates) {
            if (_dailyStates.hasOwnProperty(id)) {
                npcIds.push(id);
                totalMood += _dailyStates[id].mood || 50;
                count++;
            }
        }

        if (count < 2) return { applied: false, reason: 'less_than_2_npcs' };

        var avgMood = Math.round(totalMood / count);
        var adjustments = [];

        for (var i = 0; i < npcIds.length; i++) {
            var npcId = npcIds[i];
            var state = _dailyStates[npcId];
            var profile = NPC_PROFILES[npcId];
            var currentMood = state.mood || 50;

            // 只在心情与群体平均差异>15时才传染
            var diff = avgMood - currentMood;
            if (Math.abs(diff) < 15) continue;

            // 传染强度：高社交性NPC更容易被传染（靠拢20-30%），低社交性更独立（靠拢10%）
            var social = (profile && profile.personality && profile.personality.social) || 50;
            var contagionRate = 0.1 + (social / 100) * 0.2; // 0.1~0.3

            // 愤怒中的NPC不容易被传染（还在生气）
            if ((state.angerLevel || 0) > 50) {
                contagionRate *= 0.3;
            }

            var adjustment = Math.round(diff * contagionRate);
            if (adjustment !== 0) {
                var oldMood = state.mood;
                state.mood = clamp(state.mood + adjustment, 0, 100);
                var moodInfo = getMoodInfo(state.mood);
                state.moodLabel = moodInfo.label;
                state.moodEmoji = moodInfo.emoji;
                adjustments.push({
                    npcId: npcId,
                    oldMood: oldMood,
                    newMood: state.mood,
                    adjustment: adjustment
                });
            }
        }

        return {
            applied: true,
            avgMood: avgMood,
            npcCount: count,
            adjustedCount: adjustments.length,
            adjustments: adjustments
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  导出
    // ═══════════════════════════════════════════════════════════

    return {
        // 核心功能
        generateDailyState: generateDailyState,
        generateContextDialogue: generateContextDialogue,
        generateLiveOptions: generateLiveOptions,
        generateFollowUpReply: generateFollowUpReply,
        extractKeywords: extractKeywords,
        adjustMood: adjustMood,
        applyEmotionContagion: applyEmotionContagion,
        _calculateDeceitTendency: _calculateDeceitTendency,
        detectRiftEvents: detectRiftEvents,
        applyRiftEvent: applyRiftEvent,

        // 查询
        getAllNpcIds: getAllNpcIds,
        getDailyState: getDailyState,
        getNpcProfile: getNpcProfile,
        getAllDailyStates: getAllDailyStates,

        // 留白接口
        registerNpcProfile: registerNpcProfile,
        registerDialogueHint: registerDialogueHint,
        registerDecisionRule: registerDecisionRule,

        // 内部钩子
        _dayEndSave: _dayEndSave,
        _isValidTopicWord: _isValidTopicWord,

        // 常量引用
        TIER: TIER,
        DECISION_RULES: DECISION_RULES,
        NPC_PROFILES: NPC_PROFILES
    };

})();

window.DailyEngine = DailyEngine;
