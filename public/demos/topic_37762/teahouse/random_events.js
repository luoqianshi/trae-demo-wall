var RandomEvents = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  白天事件池 — 只在白天时段触发
    // ═══════════════════════════════════════════════════════════

    var DAY_EVENTS = [
        {
            id: 'market_hawker',
            name: '集市叫卖',
            desc: '远处传来小贩的叫卖声，今天集市好像很热闹。',
            periods: ['morning', 'noon', 'afternoon'],
            chance: 0.25,
            choices: [
                { text: '去看看', effect: { reputation: 1 }, result: '你在集市逛了逛，听到了不少新鲜事。声望+1' },
                { text: '不理会', effect: {}, result: '你继续忙自己的事。' }
            ]
        },
        {
            id: 'passerby_help',
            name: '路人求助',
            desc: '一个路人急匆匆跑来，说丢了东西，想请你帮忙找找。',
            periods: ['morning', 'afternoon'],
            chance: 0.2,
            choices: [
                { text: '帮忙找', effect: { reputation: 3, relationBonus: 2 }, result: '你帮路人找到了东西，他连声道谢。声望+3' },
                { text: '没空', effect: {}, result: '你摇了摇头，路人失望地走了。' }
            ]
        },
        {
            id: 'tea_competition',
            name: '采茶比赛',
            desc: '村里在办采茶比赛，赢了有奖品！',
            periods: ['morning'],
            chance: 0.12,
            choices: [
                { text: '参加', effect: { gold: 15, reputation: 2 }, result: '你采了一大筐茶叶，得了第三名！铜钱+15 声望+2' },
                { text: '不参加', effect: {}, result: '你看着热闹的人群，决定不凑这个热闹。' }
            ]
        },
        {
            id: 'traveling_merchant',
            name: '行商路过',
            desc: '一个行商推着车经过，车上有些稀罕货。',
            periods: ['morning', 'afternoon'],
            chance: 0.18,
            choices: [
                { text: '买点东西', effect: { gold: -10 }, result: '你花了10铜买了些好茶叶。', giveMaterial: 'fine_tea_leaves', giveCount: 2 },
                { text: '看看就好', effect: {}, result: '你看了看，没买。行商推着车走了。' }
            ]
        },
        {
            id: 'neighbor_dispute',
            name: '邻里纠纷',
            desc: '隔壁传来争吵声，好像是谁家的鸡跑到别人院子里了。',
            periods: ['morning', 'afternoon'],
            chance: 0.15,
            choices: [
                { text: '去调解', effect: { reputation: 2 }, result: '你说了几句公道话，两边都消了气。声望+2' },
                { text: '不管闲事', effect: {}, result: '你关上了窗，争吵声渐渐远了。' }
            ]
        },
        {
            id: 'kid_flower',
            name: '小孩送花',
            desc: '一个小女孩跑过来，塞给你一朵野花就跑了。',
            periods: ['morning', 'afternoon'],
            chance: 0.2,
            choices: [
                { text: '收下', effect: { reputation: 1 }, result: '你把花插在茶馆的花瓶里，客人们都说好看。声望+1' },
                { text: '追上去还给她', effect: { relationBonus: 1 }, result: '你追上去把花还了，小女孩冲你笑了。' }
            ]
        },
        {
            id: 'sun_tea',
            name: '日头正好',
            desc: '阳光洒在茶馆门口，是个晒茶的好天气。',
            periods: ['noon'],
            chance: 0.3,
            choices: [
                { text: '晒茶', effect: { gold: 5 }, result: '你把茶叶搬出来晒了晒，茶香更浓了。今日收入+5' },
                { text: '懒得动', effect: {}, result: '你看了看太阳，又看了看茶叶，还是算了。' }
            ]
        },
        {
            id: 'old_friend_visit',
            name: '故人来访',
            desc: '一个许久不见的老朋友路过云落镇，特地来看你。',
            periods: ['afternoon'],
            chance: 0.1,
            choices: [
                { text: '请他喝茶', effect: { gold: -3, reputation: 5 }, result: '你们聊了很久，他走时说会帮你宣传。声望+5' },
                { text: '太忙了改天', effect: {}, result: '你说了句改天，但心里知道可能不会再见了。' }
            ]
        }
    ];

    // ═══════════════════════════════════════════════════════════
    //  夜晚事件池 — 只在夜晚/傍晚触发
    // ═══════════════════════════════════════════════════════════

    var NIGHT_EVENTS = [
        {
            id: 'night_merchant',
            name: '夜行商人',
            desc: '一个蒙着面的商人在夜色中出现，说有稀罕货，但价格翻倍。',
            periods: ['evening', 'night'],
            chance: 0.15,
            choices: [
                { text: '看看货', effect: { gold: -30 }, result: '你花30铜买了一些灵泉水。', giveMaterial: 'spirit_water', giveCount: 1 },
                { text: '不买', effect: {}, result: '商人消失在夜色中。' }
            ]
        },
        {
            id: 'ghost_fire',
            name: '鬼火传闻',
            desc: '古井方向飘来几团幽蓝色的光，你不确定那是什么……',
            periods: ['night'],
            chance: 0.12,
            minLevel: 2,
            choices: [
                { text: '去看看', effect: { reputation: 5 }, result: '你鼓起勇气走近，发现只是萤火虫。但你的勇气被人知道了。声望+5' },
                { text: '赶紧回屋', effect: {}, result: '你关上门，装作什么都没看见。' }
            ]
        },
        {
            id: 'thief_alert',
            name: '盗贼来袭',
            desc: '半夜传来窸窸窣窣的声音，好像有人在翻东西！',
            periods: ['night'],
            chance: 0.15,
            choices: [
                { text: '追出去', effect: { reputation: 5, gold: -5 }, result: '你追了出去，被石头绊了一跤，但盗贼跑了。声望+5，治伤花了5铜' },
                { text: '装睡', effect: { gold: -10 }, result: '你假装没听见。第二天发现少了10铜钱。' }
            ]
        },
        {
            id: 'owl_letter',
            name: '猫头鹰送信',
            desc: '一只猫头鹰落在窗台上，脚上绑着一封信。',
            periods: ['evening', 'night'],
            chance: 0.1,
            choices: [
                { text: '拆开看', effect: { reputation: 3 }, result: '信上写着远方的消息，你把消息告诉了大家。声望+3' },
                { text: '不管它', effect: {}, result: '猫头鹰等了一会儿，飞走了。' }
            ]
        },
        {
            id: 'moonlight_tea',
            name: '月下品茶',
            desc: '月光洒在茶杯上，茶汤泛着银光。这一刻，格外安宁。',
            periods: ['evening', 'night'],
            chance: 0.2,
            choices: [
                { text: '慢慢品', effect: { gold: 10 }, result: '你静静地品了一杯茶，觉得人生不过如此。今日收入+10' },
                { text: '早点休息', effect: {}, result: '你放下茶杯，去睡了。' }
            ]
        },
        {
            id: 'night_watchman',
            name: '更夫路过',
            desc: '更夫敲着梆子经过，"天干物燥，小心火烛——"',
            periods: ['night'],
            chance: 0.25,
            choices: [
                { text: '聊几句', effect: { reputation: 1 }, result: '更夫告诉你一些镇上的消息。声望+1' },
                { text: '应一声', effect: {}, result: '你应了一声，更夫继续往前走了。' }
            ]
        },
        {
            id: 'night_breeze',
            name: '夜风送香',
            desc: '一阵夜风吹来，带着不知名的花香。茶馆里的客人都深吸了一口气。',
            periods: ['evening'],
            chance: 0.2,
            choices: [
                { text: '开门迎风', effect: { gold: 5 }, result: '你打开了门窗，花香引来了更多客人。今日收入+5' },
                { text: '关窗防虫', effect: {}, result: '你关上了窗，花香被挡在了外面。' }
            ]
        }
    ];

    // ═══════════════════════════════════════════════════════════
    //  内部状态
    // ═══════════════════════════════════════════════════════════

    var _triggeredToday = {};
    var _currentEvent = null;
    var _pendingCallback = null;

    // ═══════════════════════════════════════════════════════════
    //  事件触发逻辑
    // ═══════════════════════════════════════════════════════════

    function rollForEvent(periodId) {
        if (_currentEvent) return null; // 已有事件在进行

        var level = (window.Teahouse && Teahouse.getStatus) ? Teahouse.getStatus().level : 1;
        var isNight = (periodId === 'evening' || periodId === 'night');
        var pool = isNight ? NIGHT_EVENTS : DAY_EVENTS;

        // 筛选当前时段可用的事件
        var available = [];
        for (var i = 0; i < pool.length; i++) {
            var evt = pool[i];
            if (evt.periods.indexOf(periodId) === -1) continue;
            if (evt.minLevel && level < evt.minLevel) continue;
            // 同一天同一事件不重复触发
            if (_triggeredToday[evt.id]) continue;
            available.push(evt);
        }

        if (available.length === 0) return null;

        // 随机选一个，检查概率
        var candidate = available[Math.floor(Math.random() * available.length)];
        if (Math.random() > candidate.chance) return null;

        _triggeredToday[candidate.id] = true;
        _currentEvent = candidate;
        return candidate;
    }

    function makeChoice(choiceIndex) {
        if (!_currentEvent) return;
        var choice = _currentEvent.choices[choiceIndex];
        if (!choice) return;

        // 应用效果
        var effect = choice.effect || {};
        if (effect.gold && window.Teahouse) {
            var st = Teahouse.getStatus();
            if (effect.gold > 0) {
                st.copper = (st.copper || 0) + effect.gold;
            } else if (effect.gold < 0) {
                st.copper = Math.max(0, (st.copper || 0) + effect.gold);
            }
        }
        if (effect.reputation && window.Teahouse) {
            Teahouse.getStatus().reputation = (Teahouse.getStatus().reputation || 0) + effect.reputation;
        }
        if (effect.relationBonus && window.DailyEngine) {
            var ids = DailyEngine.getAllNpcIds();
            for (var i = 0; i < ids.length; i++) {
                if (window.playerRelations) {
                    var id = ids[i];
                    if (!playerRelations[id]) playerRelations[id] = 50;
                    playerRelations[id] = Math.min(100, playerRelations[id] + effect.relationBonus);
                }
            }
        }

        // 给予材料
        if (choice.giveMaterial && window.Teahouse) {
            Teahouse.addMaterialToInventory(choice.giveMaterial, choice.giveCount || 1);
        }

        // 显示结果
        if (window.showToast) showToast(choice.result);

        _currentEvent = null;
        if (_pendingCallback) _pendingCallback();
        _pendingCallback = null;
    }

    function resetDaily() {
        _triggeredToday = {};
        _currentEvent = null;
    }

    function getCurrentEvent() { return _currentEvent; }

    function setPendingCallback(cb) { _pendingCallback = cb; }

    // ═══════════════════════════════════════════════════════════
    //  公开接口
    // ═══════════════════════════════════════════════════════════

    return {
        rollForEvent: rollForEvent,
        makeChoice: makeChoice,
        resetDaily: resetDaily,
        getCurrentEvent: getCurrentEvent,
        setPendingCallback: setPendingCallback
    };
})();

window.RandomEvents = RandomEvents;
