var BusinessLogic = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  注意：此模块为早期设计，当前游戏主流程使用 Teahouse.js
    //  NPC ID 和地点 ID 与 DailyEngine 中的实际 ID 不一致
    //  保留作为数据参考，不建议直接调用
    // ═══════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════
    //  材料定义
    // ═══════════════════════════════════════════════════════════

    var MATERIALS = {
        tea_leaves:       { id: 'tea_leaves',       name: '茶叶',     rarity: 'common',    desc: '普通茶叶，后山到处都是', buyPrice: 2 },
        good_tea_leaves:  { id: 'good_tea_leaves',  name: '好茶叶',   rarity: 'uncommon',   desc: '雨前采摘的嫩芽', buyPrice: 8 },
        mountain_spring:  { id: 'mountain_spring',  name: '山泉水',   rarity: 'common',    desc: '后山灵泉的水', buyPrice: 3 },
        osmanthus:        { id: 'osmanthus',        name: '桂花',     rarity: 'uncommon',   desc: '村里桂花树上的金桂', buyPrice: 6 },
        spirit_tea_leaves:{ id: 'spirit_tea_leaves',name: '灵茶叶',   rarity: 'rare',      desc: '灵界裂缝附近生长的茶', buyPrice: 30 },
        spirit_spring:    { id: 'spirit_spring',    name: '灵泉水',   rarity: 'rare',      desc: '灵界流出的泉水', buyPrice: 25 },
        immortal_tea:     { id: 'immortal_tea',     name: '仙茶叶',   rarity: 'legendary', desc: '仙界才有的茶树叶子', buyPrice: 100 },
        immortal_dew:      { id: 'immortal_dew',     name: '仙泉露',   rarity: 'legendary', desc: '仙界甘露凝结而成', buyPrice: 80 },
        moonlight_essence: { id: 'moonlight_essence', name: '月华精华', rarity: 'legendary', desc: '满月之夜才能收集的精华', buyPrice: 120 }
    };

    // ═══════════════════════════════════════════════════════════
    //  茶品配方 — 每种茶需要什么材料
    // ═══════════════════════════════════════════════════════════

    var RECIPES = {
        basic:    { teaId: 'basic',    name: '粗茶',     materials: { tea_leaves: 1 },                                   minLevel: 1 },
        green:    { teaId: 'green',    name: '雨前绿茶', materials: { good_tea_leaves: 1, mountain_spring: 1 },           minLevel: 2 },
        flower:   { teaId: 'flower',   name: '桂花花茶', materials: { good_tea_leaves: 1, osmanthus: 1 },                minLevel: 3 },
        spirit:   { teaId: 'spirit',   name: '灵露茶',   materials: { spirit_tea_leaves: 1, spirit_spring: 1 },          minLevel: 4 },
        immortal: { teaId: 'immortal', name: '仙露琼浆', materials: { immortal_tea: 1, immortal_dew: 1, moonlight_essence: 1 }, minLevel: 5 }
    };

    // ═══════════════════════════════════════════════════════════
    //  材料来源 — 探索/购买/NPC赠送
    // ═══════════════════════════════════════════════════════════

    var MATERIAL_SOURCES = {
        tea_leaves: {
            explore:  { location: 'back_mountain', chance: 0.8, desc: '后山茶树丛' },
            buy:     { location: 'market', price: 2 },
            npcGift: { npcIds: ['yunxi', 'liu_daniang'], chance: 0.1, condition: function(rel) { return rel > 40; } }
        },
        good_tea_leaves: {
            explore:  { location: 'back_mountain_deep', chance: 0.4, desc: '后山深处古茶树' },
            buy:     { location: 'market', price: 8 },
            npcGift: { npcIds: ['wang_popo'], chance: 0.08, condition: function(rel) { return rel > 60; } }
        },
        mountain_spring: {
            explore:  { location: 'spirit_spring', chance: 0.6, desc: '灵泉取水点' },
            buy:     { location: 'market', price: 3 },
            npcGift: null
        },
        osmanthus: {
            explore:  { location: 'village_osmanthus_tree', chance: 0.7, desc: '村口桂花树' },
            buy:     { location: 'market', price: 6 },
            npcGift: { npcIds: ['zhang_shen'], chance: 0.1, condition: function(rel) { return rel > 50; } }
        },
        spirit_tea_leaves: {
            explore:  { location: 'boundary_crack', chance: 0.2, desc: '界壁裂缝附近' },
            buy:     null,
            npcGift: { npcIds: ['fox_spirit', 'spirit_seer'], chance: 0.05, condition: function(rel) { return rel > 70; } }
        },
        spirit_spring: {
            explore:  { location: 'boundary_crack', chance: 0.25, desc: '界壁裂缝渗出的泉水' },
            buy:     null,
            npcGift: { npcIds: ['spirit_refugee'], chance: 0.08, condition: function(rel) { return rel > 60; } }
        },
        immortal_tea: {
            explore: null,
            buy:     null,
            npcGift: { npcIds: ['immortal_wanderer', 'celestial_maiden'], chance: 0.03, condition: function(rel) { return rel > 80; } }
        },
        immortal_dew: {
            explore:  { location: 'full_moon_peak', chance: 0.05, desc: '满月之夜的山顶', timeCondition: 'full_moon' },
            buy:     null,
            npcGift: { npcIds: ['immortal_exile'], chance: 0.04, condition: function(rel) { return rel > 80; } }
        },
        moonlight_essence: {
            explore:  { location: 'full_moon_peak', chance: 0.03, desc: '满月之夜山顶收集', timeCondition: 'full_moon' },
            buy:     null,
            npcGift: { npcIds: ['spirit_sage', 'ancient_beast'], chance: 0.02, condition: function(rel) { return rel > 90; } }
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  强逻辑任务 — 升级必经之路
    // ═══════════════════════════════════════════════════════════

    var MANDATORY_QUESTS = {
        2: {
            id: 'first_harvest',
            name: '第一次采茶',
            desc: '后山有野茶树，去采些茶叶回来。这是开茶馆的基本功。',
            steps: [
                { type: 'explore', location: 'back_mountain', desc: '前往后山', target: 1 },
                { type: 'collect', material: 'tea_leaves', count: 3, desc: '采集3份茶叶' },
                { type: 'brew', tea: 'basic', count: 1, desc: '泡一杯粗茶' }
            ],
            reward: { gold: 50, reputation: 10 },
            unlockDesc: '完成后山采茶任务才能升级茶馆'
        },
        3: {
            id: 'flower_trade',
            name: '花茶之路',
            desc: '张婶说集市上有桂花卖，去找她聊聊。',
            steps: [
                { type: 'talk', npcId: 'zhang_shen', desc: '找张婶打听桂花' },
                { type: 'buy', material: 'osmanthus', count: 2, desc: '购买2份桂花' },
                { type: 'brew', tea: 'flower', count: 1, desc: '泡一杯花茶' }
            ],
            reward: { gold: 100, reputation: 20 },
            unlockDesc: '完成花茶交易任务才能升级茶馆'
        },
        4: {
            id: 'spirit_visitor',
            name: '灵界来客',
            desc: '茶馆声名远播，据说有修行者慕名而来。提升声望，等待有缘人。',
            steps: [
                { type: 'reputation', value: 80, desc: '声望达到80' },
                { type: 'serve', realm: 'spirit', count: 1, desc: '接待一位灵界来客' },
                { type: 'brew', tea: 'spirit', count: 1, desc: '泡一杯灵露茶' }
            ],
            reward: { gold: 300, reputation: 40 },
            unlockDesc: '接待过灵界来客才能升级茶馆'
        },
        5: {
            id: 'three_realms',
            name: '三界茶尊',
            desc: '三界来客齐聚茶府，这是前所未有的盛事。',
            steps: [
                { type: 'reputation', value: 200, desc: '声望达到200' },
                { type: 'serve', realm: 'demon', count: 1, desc: '接待一位魔界来客' },
                { type: 'serve', realm: 'immortal', count: 1, desc: '接待一位仙界来客' },
                { type: 'brew', tea: 'immortal', count: 1, desc: '泡一杯仙露琼浆' }
            ],
            reward: { gold: 1000, reputation: 100 },
            unlockDesc: '接待过三界来客才能升级至最高等级'
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  支线任务 — 保留现有+留白
    // ═══════════════════════════════════════════════════════════

    var SIDE_QUESTS = [
        // ═══════ 跑腿类 ═══════
        {
            id: 'missing_cat',
            name: '刘大娘的猫',
            desc: '刘大娘的猫丢了，她很着急。',
            tier: 'daily',
            category: 'errand',
            steps: [
                { type: 'talk', npcId: 'liu_daniang', desc: '和刘大娘说话' },
                { type: 'explore', location: 'back_mountain', desc: '去后山找猫' },
                { type: 'return_to', npcId: 'liu_daniang', desc: '把猫送回去' }
            ],
            reward: { gold: 20, reputation: 5, npcRelation: { liu_daniang: 10 } },
            repeatable: true,
            cooldown: 5
        },
        {
            id: 'herb_delivery',
            name: '王婆婆的药材',
            desc: '王婆婆需要后山的草药。',
            tier: 'uncommon',
            category: 'errand',
            steps: [
                { type: 'talk', npcId: 'wang_popo', desc: '听王婆婆说需要什么' },
                { type: 'collect', material: 'tea_leaves', count: 5, desc: '采集5份茶叶' },
                { type: 'return_to', npcId: 'wang_popo', desc: '把茶叶送给王婆婆' }
            ],
            reward: { gold: 30, reputation: 8, npcRelation: { wang_popo: 8 } },
            repeatable: true,
            cooldown: 7
        },
        {
            id: 'forge_material',
            name: '铁匠的矿石',
            desc: '铁匠需要人帮忙搬运矿石。',
            tier: 'daily',
            category: 'errand',
            steps: [
                { type: 'talk', npcId: 'tie_jiang', desc: '和铁匠说话' },
                { type: 'explore', location: 'back_mountain', desc: '去后山找矿石' },
                { type: 'return_to', npcId: 'tie_jiang', desc: '把矿石送给铁匠' }
            ],
            reward: { gold: 25, reputation: 5, npcRelation: { tie_jiang: 8 } },
            repeatable: true,
            cooldown: 3
        },
        {
            id: 'market_run',
            name: '张婶的跑腿',
            desc: '张婶让你去集市帮她带点东西。',
            tier: 'daily',
            category: 'errand',
            steps: [
                { type: 'talk', npcId: 'zhang_shen', desc: '问张婶要带什么' },
                { type: 'explore', location: 'market', desc: '去集市买东西' },
                { type: 'return_to', npcId: 'zhang_shen', desc: '把东西交给张婶' }
            ],
            reward: { gold: 15, reputation: 3, npcRelation: { zhang_shen: 5 } },
            repeatable: true,
            cooldown: 4
        },

        // ═══════ 调节矛盾类 ═══════
        {
            id: 'neighbor_dispute',
            name: '邻里纠纷',
            desc: '刘大娘和张婶因为一块晾衣裳的地方吵起来了。你去劝劝？',
            tier: 'daily',
            category: 'mediate',
            steps: [
                { type: 'talk', npcId: 'liu_daniang', desc: '听刘大娘说' },
                { type: 'talk', npcId: 'zhang_shen', desc: '听张婶说' },
                { type: 'choose', options: ['劝刘大娘让一步', '劝张婶让一步', '建议轮流用'], desc: '你决定怎么调解' },
                { type: 'return_to', npcId: 'liu_daniang', desc: '告诉她们你的想法' }
            ],
            reward: { gold: 30, reputation: 10, npcRelation: { liu_daniang: 5, zhang_shen: 5 } },
            repeatable: true,
            cooldown: 10
        },
        {
            id: 'price_quarrel',
            name: '价钱之争',
            desc: '张婶嫌铁匠要价太高，铁匠说材料涨了。两个人在茶馆里就吵起来了。',
            tier: 'uncommon',
            category: 'mediate',
            steps: [
                { type: 'talk', npcId: 'zhang_shen', desc: '听张婶的委屈' },
                { type: 'talk', npcId: 'tie_jiang', desc: '听铁匠的苦衷' },
                { type: 'choose', options: ['帮张婶砍价', '帮铁匠说话', '提议分期付款'], desc: '你决定怎么调解' },
                { type: 'return_to', npcId: 'tie_jiang', desc: '传达调解方案' }
            ],
            reward: { gold: 40, reputation: 15, npcRelation: { zhang_shen: 5, tie_jiang: 5 } },
            repeatable: true,
            cooldown: 12
        },
        {
            id: 'garden_dispute',
            name: '菜地之争',
            desc: '刘大娘说王婆婆的草药种到了她的菜地那边，王婆婆说那块地一直是她的。',
            tier: 'uncommon',
            category: 'mediate',
            steps: [
                { type: 'talk', npcId: 'liu_daniang', desc: '听刘大娘说地的事' },
                { type: 'talk', npcId: 'wang_popo', desc: '听王婆婆说地的事' },
                { type: 'explore', location: 'herb_garden', desc: '去看看那块地到底怎么回事' },
                { type: 'choose', options: ['把地划两半', '让王婆婆挪草药', '让刘大娘让一步'], desc: '你决定怎么调解' }
            ],
            reward: { gold: 35, reputation: 12, npcRelation: { liu_daniang: 5, wang_popo: 5 } },
            repeatable: true,
            cooldown: 15
        },

        // ═══════ 调节情绪类 ═══════
        {
            id: 'yunxi_homesick',
            name: '云溪想家了',
            desc: '云溪最近总是一个人发呆，好像在想什么心事。',
            tier: 'uncommon',
            category: 'comfort',
            steps: [
                { type: 'talk', npcId: 'yunxi', desc: '试着跟云溪说话' },
                { type: 'choose', options: ['陪她坐一会儿', '给她泡杯茶', '讲个笑话逗她开心'], desc: '你决定怎么安慰她' },
                { type: 'talk', npcId: 'wang_popo', desc: '问王婆婆云溪最近怎么了' },
                { type: 'return_to', npcId: 'yunxi', desc: '再去找云溪' }
            ],
            reward: { gold: 20, reputation: 10, npcRelation: { yunxi: 15 } },
            repeatable: true,
            cooldown: 8
        },
        {
            id: 'shi_an_lonely',
            name: '石安的沉默',
            desc: '石安最近话更少了，一个人在河边坐到天黑。',
            tier: 'uncommon',
            category: 'comfort',
            steps: [
                { type: 'talk', npcId: 'shi_an', desc: '试着跟石安说话' },
                { type: 'choose', options: ['坐在他旁边不说话', '给他带碗热茶', '问他要不要帮忙干活'], desc: '你决定怎么接近他' },
                { type: 'talk', npcId: 'tie_jiang', desc: '问铁匠石安最近怎么样' },
                { type: 'return_to', npcId: 'shi_an', desc: '再去找石安' }
            ],
            reward: { gold: 25, reputation: 12, npcRelation: { shi_an: 15 } },
            repeatable: true,
            cooldown: 10
        },
        {
            id: 'wang_popo_night',
            name: '王婆婆的夜',
            desc: '王婆婆最近晚上总是不睡觉，在院子里走来走去。',
            tier: 'rare',
            category: 'comfort',
            steps: [
                { type: 'talk', npcId: 'wang_popo', desc: '问王婆婆怎么了' },
                { type: 'choose', options: ['陪她坐一会儿', '给她泡杯安神茶', '听她讲过去的事'], desc: '你决定怎么安慰她' },
                { type: 'talk', npcId: 'liu_daniang', desc: '问刘大娘知不知道王婆婆的事' },
                { type: 'return_to', npcId: 'wang_popo', desc: '再去找王婆婆' }
            ],
            reward: { gold: 30, reputation: 15, npcRelation: { wang_popo: 15 } },
            repeatable: true,
            cooldown: 12
        },

        // ═══════ 休闲小游戏类 ═══════
        {
            id: 'tea_tasting',
            name: '品茶大会',
            desc: '今天村里办品茶大会，来比比谁品茶品得准！',
            tier: 'uncommon',
            category: 'minigame',
            steps: [
                { type: 'talk', npcId: 'zhang_shen', desc: '报名参加品茶大会' },
                { type: 'minigame', game: 'tea_taste', desc: '品茶小游戏：猜茶的种类' },
                { type: 'return_to', npcId: 'zhang_shen', desc: '看结果' }
            ],
            reward: { gold: 50, reputation: 15 },
            repeatable: true,
            cooldown: 7
        },
        {
            id: 'cooking_contest',
            name: '厨艺比拼',
            desc: '刘大娘和张婶又要比厨艺了，这次让你当评委！',
            tier: 'daily',
            category: 'minigame',
            steps: [
                { type: 'talk', npcId: 'liu_daniang', desc: '刘大娘让你尝她的饼' },
                { type: 'talk', npcId: 'zhang_shen', desc: '张婶让你尝她的饼' },
                { type: 'minigame', game: 'taste_judge', desc: '品尝打分小游戏' },
                { type: 'choose', options: ['刘大娘的饼好吃', '张婶的饼好吃', '都好吃，不分上下'], desc: '宣布结果' }
            ],
            reward: { gold: 20, reputation: 8, npcRelation: { liu_daniang: 3, zhang_shen: 3 } },
            repeatable: true,
            cooldown: 5
        },
        {
            id: 'herb_guess',
            name: '猜草药',
            desc: '王婆婆拿出一堆草药让你猜名字，猜对了有奖！',
            tier: 'uncommon',
            category: 'minigame',
            steps: [
                { type: 'talk', npcId: 'wang_popo', desc: '王婆婆要考你' },
                { type: 'minigame', game: 'herb_quiz', desc: '猜草药小游戏' },
                { type: 'return_to', npcId: 'wang_popo', desc: '看成绩' }
            ],
            reward: { gold: 30, reputation: 10, npcRelation: { wang_popo: 8 } },
            repeatable: true,
            cooldown: 6
        },

        // ═══════ 故事类（不可重复） ═══════
        {
            id: 'yunxi_dream',
            name: '云溪的梦',
            desc: '云溪最近总是做同一个梦，她很不安。',
            tier: 'rare',
            category: 'story',
            steps: [
                { type: 'talk', npcId: 'yunxi', desc: '听云溪说她的梦' },
                { type: 'talk', npcId: 'wang_popo', desc: '问王婆婆关于梦的解释' },
                { type: 'explore', location: 'back_mountain', desc: '去后山寻找线索' },
                { type: 'return_to', npcId: 'yunxi', desc: '告诉云溪你发现了什么' }
            ],
            reward: { gold: 50, reputation: 15, npcRelation: { yunxi: 15 }, unlockStory: 'yunxi_dream_meaning' },
            repeatable: false,
            cooldown: 0
        },
        {
            id: 'shi_an_knife',
            name: '石安的刀',
            desc: '石安总是带着那把没开刃的刀，它有什么来历？',
            tier: 'rare',
            category: 'story',
            steps: [
                { type: 'talk', npcId: 'shi_an', desc: '试着和石安聊那把刀' },
                { type: 'talk', npcId: 'tie_jiang', desc: '问铁匠关于那把刀' },
                { type: 'explore', location: 'back_mountain', desc: '去后山找刀的材料来源' },
                { type: 'return_to', npcId: 'shi_an', desc: '把发现告诉石安' }
            ],
            reward: { gold: 80, reputation: 20, npcRelation: { shi_an: 20 }, unlockStory: 'shi_an_blade_origin' },
            repeatable: false,
            cooldown: 0
        },
        {
            id: 'wang_popo_past',
            name: '王婆婆的过去',
            desc: '王婆婆偶尔会提起年轻时候的事，但每次说到一半就不说了。她到底经历过什么？',
            tier: 'rare',
            category: 'story',
            steps: [
                { type: 'talk', npcId: 'wang_popo', desc: '试着让王婆婆多说一些' },
                { type: 'talk', npcId: 'liu_daniang', desc: '问刘大娘知不知道王婆婆的过去' },
                { type: 'explore', location: 'herb_garden', desc: '在王婆婆的药园里找线索' },
                { type: 'return_to', npcId: 'wang_popo', desc: '把你的发现告诉王婆婆' }
            ],
            reward: { gold: 60, reputation: 20, npcRelation: { wang_popo: 20 }, unlockStory: 'wang_popo_youth' },
            repeatable: false,
            cooldown: 0
        },

        // ═══════ RPG剧情改编支线（来自原序章+第一章） ═══════
        {
            id: 'herb_gatherer_plight',
            name: '采药人的苦衷',
            desc: '后山的采药人被征了劳役，家里老小没人照顾。你能帮帮他吗？',
            tier: 'uncommon',
            category: 'errand',
            steps: [
                { type: 'talk', npcId: 'wang_popo', desc: '王婆婆说采药人好几天没回来了' },
                { type: 'explore', location: 'back_mountain', desc: '去后山找采药人' },
                { type: 'choose', options: ['帮他送药回家', '给他带点干粮', '帮他跟里正说情'], desc: '你决定怎么帮他' },
                { type: 'return_to', npcId: 'wang_popo', desc: '告诉王婆婆结果' }
            ],
            reward: { gold: 40, reputation: 12, npcRelation: { wang_popo: 8 } },
            repeatable: true,
            cooldown: 10
        },
        {
            id: 'old_soldier_bridge',
            name: '守桥的老卒',
            desc: '官道桥头有个老兵，守了半辈子桥，说不想走了。他说走了就没人记得了。',
            tier: 'rare',
            category: 'comfort',
            steps: [
                { type: 'explore', location: 'mountain_road', desc: '去桥头找老卒' },
                { type: 'talk', npcId: 'wang_popo', desc: '问王婆婆关于老卒的事' },
                { type: 'choose', options: ['听他讲当年的事', '给他带壶茶', '劝他回家'], desc: '你决定怎么做' },
                { type: 'return_to', npcId: 'wang_popo', desc: '告诉王婆婆老卒的情况' }
            ],
            reward: { gold: 30, reputation: 15, npcRelation: { wang_popo: 10 } },
            repeatable: false,
            cooldown: 0
        },
        {
            id: 'schoolmaster_fired',
            name: '私塾先生',
            desc: '村里的私塾先生被辞了，说是因为不肯教那些"新编"的书。他说，教了一辈子，到头来连口饭都吃不上。',
            tier: 'uncommon',
            category: 'comfort',
            steps: [
                { type: 'talk', npcId: 'wang_popo', desc: '王婆婆说先生最近常来茶馆发呆' },
                { type: 'explore', location: 'village_square', desc: '去村口找先生' },
                { type: 'choose', options: ['请他喝杯茶', '帮他找新的活计', '听他讲讲那些"新编"的书'], desc: '你决定怎么做' }
            ],
            reward: { gold: 25, reputation: 10, npcRelation: { wang_popo: 5 } },
            repeatable: false,
            cooldown: 0
        },
        {
            id: 'carver_unemployed',
            name: '雕版匠的叹息',
            desc: '镇上的雕版匠说，现在都用手抄了，没人要雕版了。他干了一辈子的手艺，说丢就丢了。',
            tier: 'uncommon',
            category: 'comfort',
            steps: [
                { type: 'talk', npcId: 'tie_jiang', desc: '铁匠说雕版匠最近常来铁铺叹气' },
                { type: 'explore', location: 'market', desc: '去集市找雕版匠' },
                { type: 'choose', options: ['请他喝杯茶', '帮他想想别的出路', '听他讲雕版的故事'], desc: '你决定怎么做' }
            ],
            reward: { gold: 30, reputation: 10, npcRelation: { tie_jiang: 5 } },
            repeatable: false,
            cooldown: 0
        },
        {
            id: 'young_recruit',
            name: '军营里的年轻人',
            desc: '有人说军营里有个年轻人，是被强征来的。他不想打仗，只想回家种地。',
            tier: 'rare',
            category: 'errand',
            steps: [
                { type: 'talk', npcId: 'shi_an', desc: '石安说他在后山见过逃出来的年轻人' },
                { type: 'explore', location: 'back_mountain', desc: '去后山找那个年轻人' },
                { type: 'choose', options: ['给他带点吃的', '帮他藏起来', '劝他自首'], desc: '你决定怎么做' },
                { type: 'return_to', npcId: 'shi_an', desc: '告诉石安结果' }
            ],
            reward: { gold: 50, reputation: 20, npcRelation: { shi_an: 12 } },
            repeatable: false,
            cooldown: 0
        },
        {
            id: 'old_letter',
            name: '读信的老妇',
            desc: '镇上有个老妇人，每周都来茶馆，点最便宜的茶，坐一下午，反复读一封旧信。',
            tier: 'rare',
            category: 'comfort',
            steps: [
                { type: 'explore', location: 'market', desc: '去集市找老妇人' },
                { type: 'choose', options: ['坐在她旁边不说话', '请她喝杯好茶', '问她信上写了什么'], desc: '你决定怎么做' },
                { type: 'talk', npcId: 'wang_popo', desc: '问王婆婆关于老妇人的事' }
            ],
            reward: { gold: 20, reputation: 15, npcRelation: { wang_popo: 8 } },
            repeatable: false,
            cooldown: 0
        },
        {
            id: 'notice_cry',
            name: '告示前的哭声',
            desc: '镇上告示前总有人在哭。说是征兵的告示，又一批名字贴上去了。',
            tier: 'uncommon',
            category: 'comfort',
            steps: [
                { type: 'explore', location: 'market', desc: '去告示前看看' },
                { type: 'choose', options: ['安慰哭泣的人', '帮忙读告示', '默默走开'], desc: '你决定怎么做' },
                { type: 'talk', npcId: 'liu_daniang', desc: '跟刘大娘说起这件事' }
            ],
            reward: { gold: 15, reputation: 10, npcRelation: { liu_daniang: 5 } },
            repeatable: true,
            cooldown: 8
        },
        {
            id: 'cook_pot',
            name: '伙夫的锅',
            desc: '军营的伙夫说，他煮了二十年的大锅饭，从没想过有一天会煮不下去——因为吃饭的人越来越少了。',
            tier: 'rare',
            category: 'comfort',
            steps: [
                { type: 'explore', location: 'mountain_road', desc: '在路上遇到伙夫' },
                { type: 'choose', options: ['听他讲军营的事', '请他喝杯茶', '给他带点家里的味道'], desc: '你决定怎么做' }
            ],
            reward: { gold: 25, reputation: 12 },
            repeatable: false,
            cooldown: 0
        },
        {
            id: 'old_page',
            name: '旧书页',
            desc: '你在后山捡到一张旧书页，上面有三行不同的笔迹："爹，我想回家。""考上了也没用。""谁说的。至少不用守桥。"——三个人在一张纸上对话，没有人会看到。',
            tier: 'legendary',
            category: 'story',
            steps: [
                { type: 'explore', location: 'back_mountain', desc: '在后山发现旧书页' },
                { type: 'talk', npcId: 'wang_popo', desc: '给王婆婆看这张纸' },
                { type: 'talk', npcId: 'shi_an', desc: '给石安看这张纸' },
                { type: 'choose', options: ['把纸夹在茶馆的账本里', '把纸烧了', '把纸放回原处'], desc: '你决定怎么处理这张纸' }
            ],
            reward: { gold: 10, reputation: 30, unlockStory: 'three_voices_on_paper' },
            repeatable: false,
            cooldown: 0
        }
        // ── 留白：后期添加更多支线任务 ──
        // 任务类型：errand（跑腿）/ mediate（调解）/ comfort（安慰）/ minigame（小游戏）/ story（故事）
    ];

    // ═══════════════════════════════════════════════════════════
    //  内部状态
    // ═══════════════════════════════════════════════════════════

    var _inventory = {};       // 材料仓库 { materialId: count }
    var _questProgress = {};   // 任务进度 { questId: { currentStep, completed, ... } }
    var _completedQuests = {}; // 已完成 { questId: completionDay }
    var _totalTeaServed = 0;
    var _consecutiveFullDays = 0;

    // ═══════════════════════════════════════════════════════════
    //  材料管理
    // ═══════════════════════════════════════════════════════════

    function addMaterial(materialId, count) {
        if (!materialId || typeof materialId !== 'string') return false;
        if (typeof count !== 'number' || count <= 0) return false;
        if (!MATERIALS[materialId]) return false;

        if (!_inventory[materialId]) _inventory[materialId] = 0;
        _inventory[materialId] += count;

        if (window.Logger) Logger.info('Business', '材料入库', { material: materialId, count: count, total: _inventory[materialId] });
        return true;
    }

    function removeMaterial(materialId, count) {
        if (!materialId || typeof count !== 'number' || count <= 0) return false;
        if (!_inventory[materialId] || _inventory[materialId] < count) return false;

        _inventory[materialId] -= count;
        if (_inventory[materialId] <= 0) delete _inventory[materialId];
        return true;
    }

    function getMaterialCount(materialId) {
        if (!materialId) return 0;
        return _inventory[materialId] || 0;
    }

    function getInventory() {
        var result = {};
        for (var k in _inventory) {
            if (_inventory.hasOwnProperty(k)) result[k] = _inventory[k];
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════
    //  茶品制作
    // ═══════════════════════════════════════════════════════════

    function canBrewTea(teaId) {
        var recipe = RECIPES[teaId];
        if (!recipe) return false;

        for (var matId in recipe.materials) {
            if (recipe.materials.hasOwnProperty(matId)) {
                var needed = recipe.materials[matId];
                var have = _inventory[matId] || 0;
                if (have < needed) return false;
            }
        }
        return true;
    }

    function brewTea(teaId) {
        if (!canBrewTea(teaId)) return { success: false, reason: 'missing_materials' };

        var recipe = RECIPES[teaId];
        for (var matId in recipe.materials) {
            if (recipe.materials.hasOwnProperty(matId)) {
                removeMaterial(matId, recipe.materials[matId]);
            }
        }

        if (window.Logger) Logger.info('Business', '茶品制作成功', { tea: recipe.name });
        return { success: true, teaId: teaId, name: recipe.name };
    }

    function getMissingMaterials(teaId) {
        var recipe = RECIPES[teaId];
        if (!recipe) return null;

        var missing = [];
        for (var matId in recipe.materials) {
            if (recipe.materials.hasOwnProperty(matId)) {
                var needed = recipe.materials[matId];
                var have = _inventory[matId] || 0;
                if (have < needed) {
                    missing.push({ materialId: matId, name: MATERIALS[matId] ? MATERIALS[matId].name : matId, need: needed, have: have });
                }
            }
        }
        return missing;
    }

    // ═══════════════════════════════════════════════════════════
    //  购买材料
    // ═══════════════════════════════════════════════════════════

    function buyMaterial(materialId, count, availableGold) {
        if (!materialId || typeof count !== 'number' || count <= 0) return { success: false, reason: 'invalid_params' };

        var source = MATERIAL_SOURCES[materialId];
        if (!source || !source.buy) return { success: false, reason: 'not_buyable' };

        var totalCost = source.buy.price * count;
        if (typeof availableGold !== 'number' || availableGold < totalCost) {
            return { success: false, reason: 'not_enough_gold', need: totalCost, have: availableGold || 0 };
        }

        addMaterial(materialId, count);
        return { success: true, materialId: materialId, count: count, cost: totalCost };
    }

    // ═══════════════════════════════════════════════════════════
    //  强逻辑任务检查
    // ═══════════════════════════════════════════════════════════

    function canUpgradeToLevel(targetLevel) {
        var quest = MANDATORY_QUESTS[targetLevel];
        if (!quest) return { canUpgrade: true, reason: null };

        var progress = _questProgress[quest.id];
        if (progress && progress.completed) return { canUpgrade: true, reason: null };

        return { canUpgrade: false, reason: quest.unlockDesc, questId: quest.id, questName: quest.name };
    }

    function getMandatoryQuest(level) {
        return MANDATORY_QUESTS[level] || null;
    }

    function getQuestProgress(questId) {
        return _questProgress[questId] || null;
    }

    function advanceQuestStep(questId) {
        var progress = _questProgress[questId];
        if (!progress || progress.completed) return false;

        progress.currentStep++;
        return true;
    }

    function completeQuest(questId, gameDay) {
        var progress = _questProgress[questId];
        if (!progress) return false;

        progress.completed = true;
        progress.completionDay = gameDay || 0;
        _completedQuests[questId] = progress.completionDay;
        return true;
    }

    // ═══════════════════════════════════════════════════════════
    //  支线任务
    // ═══════════════════════════════════════════════════════════

    function getAvailableSideQuests(gameDay) {
        var available = [];
        for (var i = 0; i < SIDE_QUESTS.length; i++) {
            var sq = SIDE_QUESTS[i];
            var completed = _completedQuests[sq.id];

            if (completed && !sq.repeatable) continue;
            if (completed && sq.repeatable && sq.cooldown > 0) {
                if (gameDay - completed < sq.cooldown) continue;
            }

            available.push(sq);
        }
        return available;
    }

    function startSideQuest(questId) {
        if (!questId) return false;
        var quest = null;
        for (var i = 0; i < SIDE_QUESTS.length; i++) {
            if (SIDE_QUESTS[i].id === questId) { quest = SIDE_QUESTS[i]; break; }
        }
        if (!quest) return false;

        if (!_questProgress[questId]) {
            _questProgress[questId] = { currentStep: 0, completed: false, completionDay: 0 };
        }
        return true;
    }

    // ═══════════════════════════════════════════════════════════
    //  统计
    // ═══════════════════════════════════════════════════════════

    function incrementTeaServed() { _totalTeaServed++; }
    function getTotalTeaServed() { return _totalTeaServed; }
    function setConsecutiveFullDays(count) { _consecutiveFullDays = count; }
    function getConsecutiveFullDays() { return _consecutiveFullDays; }

    // ═══════════════════════════════════════════════════════════
    //  公开接口
    // ═══════════════════════════════════════════════════════════

    function init() {
        _inventory = {};
        _questProgress = {};
        _completedQuests = {};
        _totalTeaServed = 0;
        _consecutiveFullDays = 0;

        // 初始赠送一些茶叶
        addMaterial('tea_leaves', 10);
        addMaterial('mountain_spring', 5);

        if (window.Logger) Logger.info('Business', '经营逻辑系统初始化');
    }

    return {
        init: init,
        // 材料
        addMaterial: addMaterial,
        removeMaterial: removeMaterial,
        getMaterialCount: getMaterialCount,
        getInventory: getInventory,
        buyMaterial: buyMaterial,
        // 茶品
        canBrewTea: canBrewTea,
        brewTea: brewTea,
        getMissingMaterials: getMissingMaterials,
        // 强逻辑任务
        canUpgradeToLevel: canUpgradeToLevel,
        getMandatoryQuest: getMandatoryQuest,
        getQuestProgress: getQuestProgress,
        advanceQuestStep: advanceQuestStep,
        completeQuest: completeQuest,
        // 支线任务
        getAvailableSideQuests: getAvailableSideQuests,
        startSideQuest: startSideQuest,
        // 统计
        incrementTeaServed: incrementTeaServed,
        getTotalTeaServed: getTotalTeaServed,
        setConsecutiveFullDays: setConsecutiveFullDays,
        getConsecutiveFullDays: getConsecutiveFullDays,
        // 常量导出
        MATERIALS: MATERIALS,
        RECIPES: RECIPES,
        MATERIAL_SOURCES: MATERIAL_SOURCES
    };
})();

window.BusinessLogic = BusinessLogic;
