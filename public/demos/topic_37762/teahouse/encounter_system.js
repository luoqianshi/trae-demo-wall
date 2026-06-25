var EncounterSystem = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    //  NPC对偶遇彩蛋 — 两人同地点时触发
    //  条件：两人都在同一地点 + 关系值满足 + 概率命中
    // ═══════════════════════════════════════════════════════════

    var PAIR_ENCOUNTERS = [
        // ── 云溪+石安：少年人的温暖 ──
        {
            pair: ['yunxi', 'shi_an'],
            location: 'any',
            minRelation: 0,
            chance: 0.4,
            tier: 'uncommon',
            scenes: [
                { desc: '云溪把烤红薯掰成两半，大的那半塞给石安。石安低头看了看，没说话，但吃完了。', effect: { relationDelta: 3, moodDelta: 5 } },
                { desc: '石安帮云溪修好了摔坏的木簪，云溪高兴得转了三圈。石安嘴角动了一下，可能是笑了。', effect: { relationDelta: 5, moodDelta: 10 } },
                { desc: '两人坐在河边，谁都不说话，但谁也没走。河面上漂着一片叶子，云溪说："它也有地方去。"', effect: { relationDelta: 2, moodDelta: 3 } },
                { desc: '云溪偷偷往石安口袋里塞了一把糖。石安后来发现了，把糖纸折成一只小船放在窗台上。', effect: { relationDelta: 4, moodDelta: 8 } },
                { desc: '石安在云溪家门口放了一筐柴，敲了敲门就跑了。云溪打开门，对着空巷子喊了声"谢谢"，巷子里没有人回答。', effect: { relationDelta: 6, moodDelta: 12 } }
            ]
        },
        // ── 刘大娘+张婶：邻里日常 ──
        {
            pair: ['liu_daniang', 'zhang_shen'],
            location: 'any',
            minRelation: 0,
            chance: 0.5,
            tier: 'daily',
            scenes: [
                { desc: '刘大娘和张婶开始比赛谁烙的饼好，最后都吃了对方的。刘大娘说："你放多了盐。"张婶说："你放少了油。"', effect: { relationDelta: 2, moodDelta: 5 } },
                { desc: '两人一起数落自家男人的不是，越说越起劲，最后都说"算了，他也不容易"。', effect: { relationDelta: 3, moodDelta: 8 } },
                { desc: '张婶帮刘大娘看了一下午孩子，刘大娘给她装了一篮子菜。张婶说"不用"，但提着篮子走了。', effect: { relationDelta: 5, moodDelta: 5 } },
                { desc: '刘大娘说："你说咱们忙了一辈子，图个啥？"张婶想了想："图个明天还有事忙吧。"', effect: { relationDelta: 2, moodDelta: 3 } }
            ]
        },
        // ── 铁匠+石安：师徒无言 ──
        {
            pair: ['tie_jiang', 'shi_an'],
            location: 'any',
            minRelation: 0,
            chance: 0.3,
            tier: 'rare',
            scenes: [
                { desc: '铁匠把一把没开刃的刀放在石安面前，什么都没说。石安收了。有些话不用讲，铁知道。', effect: { relationDelta: 8, moodDelta: 5 } },
                { desc: '石安帮铁匠搬了一整天的矿石。铁匠给他打了一双铁护腕，石安试了试，大小正好。', effect: { relationDelta: 10, moodDelta: 3 } },
                { desc: '两人对着炉火坐了一夜。天亮时铁匠说："你是个好徒弟。"石安没回答，但他第二天又来了。', effect: { relationDelta: 15, moodDelta: 10 } }
            ]
        },
        // ── 王婆婆+云溪：隔代温情 ──
        {
            pair: ['wang_popo', 'yunxi'],
            location: 'any',
            minRelation: 0,
            chance: 0.35,
            tier: 'uncommon',
            scenes: [
                { desc: '王婆婆教云溪辨认草药，云溪学得很快。王婆婆说："我年轻时候也这么机灵。"云溪说："您现在也机灵。"', effect: { relationDelta: 3, moodDelta: 5 } },
                { desc: '云溪给王婆婆捶背，王婆婆笑着说："这丫头，手劲还挺大。"云溪说："那当然，我可是搬过石头的。"', effect: { relationDelta: 4, moodDelta: 8 } },
                { desc: '王婆婆看着云溪跑远的背影，自言自语："像我年轻时候。"然后低头，把眼角的湿意擦在了袖子上。', effect: { relationDelta: 4, moodDelta: 6 } }
            ]
        },
        // ── 王婆婆+铁匠：老邻居 ──
        {
            pair: ['wang_popo', 'tie_jiang'],
            location: 'any',
            minRelation: 0,
            chance: 0.25,
            tier: 'rare',
            scenes: [
                { desc: '王婆婆拿了一把生锈的剪刀来，铁匠二话不说帮她磨好了。王婆婆说："又麻烦你了。"铁匠说："不麻烦。"', effect: { relationDelta: 3, moodDelta: 3 } },
                { desc: '铁匠帮王婆婆修了院门，王婆婆给他送了一罐药酒。铁匠说："我不喝酒。"王婆婆说："那泡脚也行。"', effect: { relationDelta: 5, moodDelta: 5 } },
                { desc: '王婆婆说："你一个人过了多少年了？"铁匠没回答。王婆婆也没再问。两个人就那么坐着，看天黑下来。', effect: { relationDelta: 4, moodDelta: 2 } }
            ]
        },
        // ── 刘大娘+云溪：母女般的关心 ──
        {
            pair: ['liu_daniang', 'yunxi'],
            location: 'any',
            minRelation: 0,
            chance: 0.3,
            tier: 'uncommon',
            scenes: [
                { desc: '刘大娘塞给云溪两个热饼，云溪说"不饿"，但接过来就咬了一口。刘大娘笑了。', effect: { relationDelta: 3, moodDelta: 5 } },
                { desc: '云溪帮刘大娘洗了一下午碗，刘大娘说："你歇着吧。"云溪说："我手闲着难受。"', effect: { relationDelta: 4, moodDelta: 4 } },
                { desc: '刘大娘看着云溪说："你那件衣裳该补了。"云溪低头看了看："还能穿。"刘大娘没说话，第二天云溪门口多了一块布。', effect: { relationDelta: 5, moodDelta: 8 } }
            ]
        }
        // ── 留白：后期添加更多NPC对偶遇 ──
    ];

    // ═══════════════════════════════════════════════════════════
    //  状态触发彩蛋 — NPC特定状态对玩家说特殊话
    // ═══════════════════════════════════════════════════════════

    var STATE_EGGS = [
        // ── 云溪：想念家人的少女 ──
        {
            npcId: 'yunxi',
            condition: function(state, playerRel) {
                return state.mood > 90 && playerRel > 70;
            },
            tier: 'rare',
            dialogue: '哥，我做了个梦，梦见爹回来了。他笑着摸我的头。醒来的时候，枕头是湿的。',
            effect: { relationDelta: 5 }
        },
        {
            npcId: 'yunxi',
            condition: function(state, playerRel) {
                return state.mood < 20 && playerRel > 40;
            },
            tier: 'uncommon',
            dialogue: '……我没事。就是突然想爹了。你别告诉别人，我不想让他们觉得我矫情。',
            effect: { relationDelta: 3 }
        },
        {
            npcId: 'yunxi',
            condition: function(state, playerRel) {
                return state.hunger < 30 && playerRel > 50;
            },
            tier: 'daily',
            dialogue: '（她肚子叫了一声，脸红了）那个……你家还有粗茶吗？我忘带干粮了。',
            effect: { relationDelta: 2 }
        },
        // ── 石安：不善表达的少年 ──
        {
            npcId: 'shi_an',
            condition: function(state, playerRel) {
                return state.mood < 20 && playerRel > 30;
            },
            tier: 'uncommon',
            dialogue: '……我不太会说话。但你要是愿意坐一会儿，我不赶你走。',
            effect: { relationDelta: 4 }
        },
        {
            npcId: 'shi_an',
            condition: function(state, playerRel) {
                return state.mood > 80 && playerRel > 60;
            },
            tier: 'rare',
            dialogue: '（他从怀里掏出一个小布包）这是……我编的。你要是不喜欢就扔了。',
            effect: { relationDelta: 8 }
        },
        {
            npcId: 'shi_an',
            condition: function(state, playerRel) {
                return state.fatigue > 70 && playerRel > 40;
            },
            tier: 'uncommon',
            dialogue: '（他靠着墙打了个盹，手里还攥着锤子。你给他盖了件衣裳，他没醒。）',
            effect: { relationDelta: 5 }
        },
        // ── 王婆婆：看透世事的老太太 ──
        {
            npcId: 'wang_popo',
            condition: function(state, playerRel) {
                return state.mood > 70 && state.socialNeed > 60;
            },
            tier: 'uncommon',
            dialogue: '来，坐。婆婆给你讲个故事。从前有个年轻人，拼命赚钱想买大房子，等买到了，人也老了，住不动了。',
            effect: { relationDelta: 3 }
        },
        {
            npcId: 'wang_popo',
            condition: function(state, playerRel) {
                return state.mood < 30 && playerRel > 40;
            },
            tier: 'uncommon',
            dialogue: '人老了就爱瞎想。想着想着，就觉得这辈子好像什么都没抓住。你说，是不是这样？',
            effect: { relationDelta: 4 }
        },
        {
            npcId: 'wang_popo',
            condition: function(state, playerRel) {
                return playerRel > 60;
            },
            tier: 'rare',
            dialogue: '我跟你说个事，你别嫌婆婆啰嗦。人这一辈子，最怕的不是没钱，是有钱的时候，想请的人已经不在了。',
            effect: { relationDelta: 5 }
        },
        // ── 刘大娘：热心肠的邻家大娘 ──
        {
            npcId: 'liu_daniang',
            condition: function(state, playerRel) {
                return state.hunger < 30 && playerRel > 30;
            },
            tier: 'daily',
            dialogue: '饿了吧？来，大娘刚烙的饼，趁热吃。别跟我客气，你帮我看了那么多次店呢。',
            effect: { relationDelta: 2, playerHunger: 30 }
        },
        {
            npcId: 'liu_daniang',
            condition: function(state, playerRel) {
                return state.mood > 70 && playerRel > 50;
            },
            tier: 'uncommon',
            dialogue: '我跟你说，隔壁村的老李头，攒了一辈子钱，走的时候一口好棺材都没有。你说这钱，到底是给谁攒的？',
            effect: { relationDelta: 3 }
        },
        {
            npcId: 'liu_daniang',
            condition: function(state, playerRel) {
                return state.fatigue > 60 && playerRel > 40;
            },
            tier: 'uncommon',
            dialogue: '（她揉了揉腰）唉，年轻的时候不觉得，现在干一天活，歇三天都缓不过来。可你不干，谁替你干呢？',
            effect: { relationDelta: 3 }
        },
        // ── 铁匠：沉默的手艺人 ──
        {
            npcId: 'tie_jiang',
            condition: function(state, playerRel) {
                return state.decidedAction === 'working' && playerRel > 50;
            },
            tier: 'uncommon',
            dialogue: '（他头也不抬）你要是没事，帮我拉风箱。有报酬。——不是，我意思是，你也歇着，我也歇着，但活总得有人干。',
            effect: { relationDelta: 4 }
        },
        {
            npcId: 'tie_jiang',
            condition: function(state, playerRel) {
                return state.mood < 30 && playerRel > 40;
            },
            tier: 'uncommon',
            dialogue: '（他停下手里的锤子）……你说，一个人干一辈子活，图什么？我打了二十年的铁，连个说话的人都没有。',
            effect: { relationDelta: 5 }
        },
        {
            npcId: 'tie_jiang',
            condition: function(state, playerRel) {
                return state.mood > 80 && playerRel > 60;
            },
            tier: 'rare',
            dialogue: '（他难得地放下锤子）今天不打铁了。陪我喝杯茶吧。我请你。',
            effect: { relationDelta: 6 }
        },
        // ── 张婶：精明但善良的生意人 ──
        {
            npcId: 'zhang_shen',
            condition: function(state, playerRel) {
                return state.mood > 70 && playerRel > 40;
            },
            tier: 'uncommon',
            dialogue: '我跟你说，做生意最怕什么？最怕熟人来赊账。不赊吧，伤感情；赊吧，伤钱包。做人难啊。',
            effect: { relationDelta: 3 }
        },
        {
            npcId: 'zhang_shen',
            condition: function(state, playerRel) {
                return state.mood < 30 && playerRel > 40;
            },
            tier: 'uncommon',
            dialogue: '（她叹了口气）我家那口子又跟人喝酒去了。你说他怎么就不明白，酒能解愁，也能把家喝散了。',
            effect: { relationDelta: 3 }
        }
        // ── 留白：后期添加更多状态触发蛋 ──
    ];

    // ═══════════════════════════════════════════════════════════
    //  经营彩蛋 — 茶馆经营成就触发
    // ═══════════════════════════════════════════════════════════

    var BUSINESS_EGGS = [
        {
            id: 'full_house_5',
            condition: function(stats) { return stats.consecutiveFullDays >= 5; },
            once: true,
            tier: 'uncommon',
            title: '满座五日',
            desc: '连续五天座无虚席，顾客自发帮你宣传！',
            effect: { reputationBonus: 20, goldBonus: 50 }
        },
        {
            id: 'poor_day',
            condition: function(stats) { return stats.todayRevenue <= 1 && stats.totalServed > 0; },
            once: false,
            tier: 'daily',
            title: '惨淡经营',
            desc: '今天赚的钱只够买一个铜板的糖。但明天会好的。',
            effect: { nextDayCustomerBonus: 2 }
        },
        {
            id: 'tea_100',
            condition: function(stats) { return stats.totalTeaServed >= 100; },
            once: true,
            tier: 'rare',
            title: '百杯之主',
            desc: '你已经卖出了100杯茶。有人说，百杯之后，茶中自有真意。',
            effect: { reputationBonus: 30, unlockTitle: '茶道初成' }
        },
        {
            id: 'tea_500',
            condition: function(stats) { return stats.totalTeaServed >= 500; },
            once: true,
            tier: 'legendary',
            title: '千杯茶尊',
            desc: '500杯。你的茶已经不只是茶了。有人说，喝过你茶的人，运气都会变好。',
            effect: { reputationBonus: 80, unlockTitle: '茶中圣手' }
        },
        {
            id: 'all_tea_served',
            condition: function(stats) { return stats.todayCustomers > 0 && stats.angryCustomers === 0; },
            once: false,
            tier: 'uncommon',
            title: '宾至如归',
            desc: '今天没有一个客人不满意！',
            effect: { reputationBonus: 5 }
        }
        // ── 留白：后期添加更多经营彩蛋 ──
    ];

    // ═══════════════════════════════════════════════════════════
    //  纯随机NPC互动引擎
    //  不依赖预设对——任意两个NPC同地点都可能互动
    //  互动类型由双方性格+心情+关系决定
    // ═══════════════════════════════════════════════════════════

    var INTERACTION_TYPES = {
        chat:     { name: '闲聊', moodRange: [0, 100], relRange: [0, 100], moodDelta: [1, 5], relDelta: [1, 3] },
        joke:     { name: '开玩笑', moodRange: [40, 100], relRange: [30, 100], moodDelta: [3, 8], relDelta: [2, 5] },
        share:    { name: '分享消息', moodRange: [30, 100], relRange: [20, 100], moodDelta: [1, 3], relDelta: [2, 4] },
        argue:    { name: '争执', moodRange: [0, 40], relRange: [0, 100], moodDelta: [-5, -1], relDelta: [-4, -1] },
        comfort:  { name: '安慰', moodRange: [0, 30], relRange: [30, 100], moodDelta: [5, 12], relDelta: [3, 6] },
        help:     { name: '帮忙', moodRange: [20, 80], relRange: [20, 100], moodDelta: [2, 5], relDelta: [3, 6] },
        ignore:   { name: '无视', moodRange: [0, 100], relRange: [0, 30], moodDelta: [-2, 0], relDelta: [-1, 0] }
    };

    var INTERACTION_DESCS = {
        chat:    [
            '{a}和{b}聊了几句闲话。',
            '{a}跟{b}说了说今天的事。',
            '{a}和{b}在{loc}碰到了，随便聊了聊。'
        ],
        joke:    [
            '{a}说了个笑话，{b}笑了。',
            '{a}逗{b}开心，{b}假装不笑但嘴角翘了。',
            '{a}和{b}笑成一团，旁边的人都看过来了。'
        ],
        share:   [
            '{a}跟{b}说了个消息，{b}若有所思地点了点头。',
            '{a}压低声音跟{b}说了什么，{b}的眼睛亮了一下。',
            '{a}告诉{b}一件事，{b}说："真的？那我得想想。"'
        ],
        argue:   [
            '{a}和{b}因为一点小事吵了几句。',
            '{a}说了句什么，{b}脸色变了。两人不欢而散。',
            '{a}和{b}在{loc}起了争执，旁边的人赶紧躲开了。'
        ],
        comfort: [
            '{a}看{b}不太开心，走过去说了几句话。{b}好了一点。',
            '{a}递给{b}一碗热茶，什么都没说。{b}接了。',
            '{a}在{b}旁边坐了一会儿，没说话。{b}轻声说了句"谢谢"。'
        ],
        help:    [
            '{a}帮{b}干了点活，{b}说"谢了"。',
            '{a}搭了把手，{b}松了口气。',
            '{a}和{b}一起忙了一会儿，活干得快多了。'
        ],
        ignore:  [
            '{a}路过{b}，两人谁都没打招呼。',
            '{a}看了{b}一眼，没说话，走了。',
            '{a}和{b}在{loc}擦肩而过，谁也没理谁。'
        ]
    };

    function generateRandomInteractions(dailyStates) {
        if (!dailyStates || typeof dailyStates !== 'object') return [];

        var interactions = [];
        var npcIds = Object.keys(dailyStates);
        if (npcIds.length < 2) return interactions;

        // 按地点分组
        var locationGroups = {};
        for (var i = 0; i < npcIds.length; i++) {
            var id = npcIds[i];
            var state = dailyStates[id];
            if (!state || typeof state !== 'object' || !state.decidedLocation || state.decidedLocation === 'home') continue;
            var loc = state.decidedLocation;
            if (!locationGroups[loc]) locationGroups[loc] = [];
            locationGroups[loc].push(id);
        }

        // 对每个地点的同地点NPC，随机配对互动
        for (var loc in locationGroups) {
            if (!locationGroups.hasOwnProperty(loc)) continue;
            var npcsHere = locationGroups[loc];
            if (npcsHere.length < 2) continue;

            // 随机打乱
            for (var s = npcsHere.length - 1; s > 0; s--) {
                var j = Math.floor(Math.random() * (s + 1));
                var tmp = npcsHere[s]; npcsHere[s] = npcsHere[j]; npcsHere[j] = tmp;
            }

            // 配对（每对最多互动一次）
            for (var p = 0; p < npcsHere.length - 1; p += 2) {
                var idA = npcsHere[p];
                var idB = npcsHere[p + 1];
                var stateA = dailyStates[idA];
                var stateB = dailyStates[idB];

                // 检查意图 - 跳过紧急目标的NPC（中断保护）
                if (stateA.intent) {
                    var aReasons = stateA.intent.reasonTags || [];
                    if (aReasons.indexOf('urgent_need') >= 0 || stateA.intent.priority >= 80) {
                        continue;
                    }
                }
                if (stateB.intent) {
                    var bReasons = stateB.intent.reasonTags || [];
                    if (bReasons.indexOf('urgent_need') >= 0 || stateB.intent.priority >= 80) {
                        continue;
                    }
                }

                // 30%概率不互动（不是每次见面都要说话）
                if (Math.random() < 0.3) continue;

                // 根据双方心情和关系选择互动类型
                var avgMood = (stateA.mood + stateB.mood) / 2;
                var possibleTypes = [];

                for (var typeKey in INTERACTION_TYPES) {
                    if (!INTERACTION_TYPES.hasOwnProperty(typeKey)) continue;
                    var it = INTERACTION_TYPES[typeKey];
                    if (avgMood >= it.moodRange[0] && avgMood <= it.moodRange[1]) {
                        possibleTypes.push(typeKey);
                    }
                }

                if (possibleTypes.length === 0) continue;

                var chosenType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
                var typeInfo = INTERACTION_TYPES[chosenType];

                // 计算效果
                var moodDelta = _randRange(typeInfo.moodDelta[0], typeInfo.moodDelta[1]);
                var relDelta = _randRange(typeInfo.relDelta[0], typeInfo.relDelta[1]);

                // 生成描述
                var descs = INTERACTION_DESCS[chosenType];
                var desc = descs[Math.floor(Math.random() * descs.length)];
                desc = desc.replace('{a}', stateA.name).replace('{b}', stateB.name).replace('{loc}', loc);

                interactions.push({
                    type: 'random_interaction',
                    interactionType: chosenType,
                    npcA: idA,
                    npcB: idB,
                    npcAName: stateA.name,
                    npcBName: stateB.name,
                    location: loc,
                    desc: desc,
                    moodDelta: moodDelta,
                    relDelta: relDelta
                });
            }
        }

        return interactions;
    }

    function _randRange(min, max) {
        if (min > max) { var t = min; min = max; max = t; }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ── 交互效果回写 ──────────────────────────────────────

    /**
     * 将交互效果回写到NPC状态（心情、社交需求等）
     * @param {Object} interaction - 交互结果对象（含npcA, npcB, moodDelta, relDelta）
     * @returns {boolean} 是否成功应用
     */
    function applyInteractionEffects(interaction) {
        if (!interaction || !interaction.npcA || !interaction.npcB) return false;

        var moodDelta = interaction.moodDelta || 0;
        var relDelta = interaction.relDelta || interaction.effect?.relationDelta || 0;

        // ── 更新NPC关系 ──
        if (relDelta !== 0) {
            updateRelation(interaction.npcA, interaction.npcB, relDelta, interaction.desc || 'interaction');
        }

        // ── 关系衰减检查 ──
        decayRelations();

        // 回写心情到 DailyEngine 状态
        if (window.DailyEngine) {
            var stateA = DailyEngine.getDailyState(interaction.npcA);
            var stateB = DailyEngine.getDailyState(interaction.npcB);

            if (stateA && typeof stateA.mood === 'number') {
                stateA.mood = Math.max(0, Math.min(100, stateA.mood + moodDelta));
            }
            if (stateB && typeof stateB.mood === 'number') {
                stateB.mood = Math.max(0, Math.min(100, stateB.mood + moodDelta));
            }

            // 回写社交需求（互动后社交需求降低）
            if (stateA && typeof stateA.socialNeed === 'number') {
                stateA.socialNeed = Math.max(0, stateA.socialNeed - Math.abs(moodDelta) * 0.5);
            }
            if (stateB && typeof stateB.socialNeed === 'number') {
                stateB.socialNeed = Math.max(0, stateB.socialNeed - Math.abs(moodDelta) * 0.5);
            }
        }

        // 回写到 SoulTick 调度脑状态
        if (window.SoulTick) {
            var soulA = SoulTick.getNpcState(interaction.npcA);
            var soulB = SoulTick.getNpcState(interaction.npcB);

            if (soulA && soulA.needs) {
                soulA.needs.loneliness = Math.max(0, (soulA.needs.loneliness || 0) - Math.abs(moodDelta) * 0.3);
                if (moodDelta > 0) {
                    soulA.needs.belonging = Math.max(0, (soulA.needs.belonging || 0) - 1);
                }
            }
            if (soulB && soulB.needs) {
                soulB.needs.loneliness = Math.max(0, (soulB.needs.loneliness || 0) - Math.abs(moodDelta) * 0.3);
                if (moodDelta > 0) {
                    soulB.needs.belonging = Math.max(0, (soulB.needs.belonging || 0) - 1);
                }
            }

            // ── 写回记忆：NPC记住这次互动 ──
            if (soulA && soulA.memory && soulA.memory.shortTerm && interaction.desc) {
                var relValue = getRelation(interaction.npcA, interaction.npcB);
                soulA.memory.shortTerm.push({
                    content: '和' + interaction.npcB + '互动: ' + interaction.desc.substring(0, 30),
                    tags: ['social', 'npc_interaction', getRelationType(relValue)],
                    importance: Math.min(70, 30 + Math.abs(relDelta) * 3),
                    emotion: moodDelta > 0 ? 70 : 40,
                    timestamp: Date.now()
                });
                if (soulA.memory.shortTerm.length > 20) {
                    soulA.memory.shortTerm = soulA.memory.shortTerm.slice(-20);
                }
            }
            if (soulB && soulB.memory && soulB.memory.shortTerm && interaction.desc) {
                var relValueB = getRelation(interaction.npcA, interaction.npcB);
                soulB.memory.shortTerm.push({
                    content: '和' + interaction.npcA + '互动: ' + interaction.desc.substring(0, 30),
                    tags: ['social', 'npc_interaction', getRelationType(relValueB)],
                    importance: Math.min(70, 30 + Math.abs(relDelta) * 3),
                    emotion: moodDelta > 0 ? 70 : 40,
                    timestamp: Date.now()
                });
                if (soulB.memory.shortTerm.length > 20) {
                    soulB.memory.shortTerm = soulB.memory.shortTerm.slice(-20);
                }
            }
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════════
    //  NPC关系系统 — 关系自然演变
    //  关系值: 0-100，默认50（陌生人）
    //  0-20: 冷淡  20-40: 认识  40-60: 熟悉  60-80: 朋友  80-100: 至交
    // ═══════════════════════════════════════════════════════════

    var _npcRelations = {};  // {npcA+npcB: {value, lastInteraction, interactionCount, type}}
    var _lastRelationDecay = Date.now();

    /**
     * 获取两个NPC之间的关系键
     */
    function _relKey(npcA, npcB) {
        return npcA < npcB ? npcA + '+' + npcB : npcB + '+' + npcA;
    }

    /**
     * 获取两个NPC之间的关系值
     * @param {string} npcA - NPC A的ID
     * @param {string} npcB - NPC B的ID
     * @returns {number} 关系值 0-100，默认50
     */
    function getRelation(npcA, npcB) {
        if (!npcA || !npcB || npcA === npcB) return 50;
        var key = _relKey(npcA, npcB);
        var rel = _npcRelations[key];
        return rel ? rel.value : 50;
    }

    /**
     * 获取关系类型
     * @param {number} value - 关系值
     * @returns {string} 关系类型: cold/acquaintance/familiar/friend/best_friend
     */
    function getRelationType(value) {
        if (value < 20) return 'cold';
        if (value < 40) return 'acquaintance';
        if (value < 60) return 'familiar';
        if (value < 80) return 'friend';
        return 'best_friend';
    }

    /**
     * 更新两个NPC之间的关系
     * @param {string} npcA - NPC A的ID
     * @param {string} npcB - NPC B的ID
     * @param {number} delta - 关系变化值（正数增加，负数减少）
     * @param {string} reason - 变化原因
     */
    function updateRelation(npcA, npcB, delta, reason) {
        if (!npcA || !npcB || npcA === npcB || typeof delta !== 'number') return;

        var key = _relKey(npcA, npcB);
        if (!_npcRelations[key]) {
            _npcRelations[key] = {
                value: 50,
                lastInteraction: Date.now(),
                interactionCount: 0,
                type: 'familiar'
            };
        }

        var rel = _npcRelations[key];
        rel.value = Math.max(0, Math.min(100, rel.value + delta));
        rel.lastInteraction = Date.now();
        rel.interactionCount++;
        rel.type = getRelationType(rel.value);
    }

    /**
     * 关系自然衰减 — 长期不互动的关系淡化
     * 每天衰减1点（超过3天不互动），核心关系（friend以上）衰减更慢
     */
    function decayRelations() {
        var now = Date.now();
        // 每24小时衰减一次
        if (now - _lastRelationDecay < 86400000) return;

        var keys = Object.keys(_npcRelations);
        for (var i = 0; i < keys.length; i++) {
            var rel = _npcRelations[keys[i]];
            var daysSinceInteraction = (now - rel.lastInteraction) / 86400000;

            if (daysSinceInteraction > 3) {
                // 超过3天不互动，每天衰减1点
                var decayDays = Math.floor(daysSinceInteraction - 3);
                var decayAmount = decayDays * 1;

                // friend以上关系衰减半速
                if (rel.value >= 60) {
                    decayAmount = decayAmount * 0.5;
                }

                rel.value = Math.max(0, rel.value - decayAmount);
                rel.type = getRelationType(rel.value);
            }
        }

        _lastRelationDecay = now;
    }

    /**
     * 获取NPC的所有关系
     * @param {string} npcId - NPC ID
     * @returns {Array} 关系列表 [{target, value, type, lastInteraction}]
     */
    function getNpcRelations(npcId) {
        if (!npcId) return [];
        var result = [];
        var keys = Object.keys(_npcRelations);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var parts = key.split('+');
            if (parts[0] === npcId || parts[1] === npcId) {
                var target = parts[0] === npcId ? parts[1] : parts[0];
                var rel = _npcRelations[key];
                result.push({
                    target: target,
                    value: rel.value,
                    type: rel.type,
                    lastInteraction: rel.lastInteraction,
                    interactionCount: rel.interactionCount
                });
            }
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════
    //  内部状态
    // ═══════════════════════════════════════════════════════════

    var _triggeredOnce = {};
    var _todayPairEncounters = [];
    var _todayStateEggs = [];
    var _todayBusinessEggs = [];

    // ═══════════════════════════════════════════════════════════
    //  工具
    // ═══════════════════════════════════════════════════════════

    function _pickRandom(arr) {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ═══════════════════════════════════════════════════════════
    //  偶遇检测
    // ═══════════════════════════════════════════════════════════

    function checkPairEncounters(dailyStates, getRelation) {
        if (!dailyStates || typeof getRelation !== 'function') return [];

        var encounters = [];
        var checked = {};

        for (var i = 0; i < PAIR_ENCOUNTERS.length; i++) {
            var pe = PAIR_ENCOUNTERS[i];
            var idA = pe.pair[0];
            var idB = pe.pair[1];
            var pairKey = idA + '+' + idB;

            if (checked[pairKey]) continue;
            checked[pairKey] = true;

            var stateA = dailyStates[idA];
            var stateB = dailyStates[idB];
            if (!stateA || !stateB) continue;

            // 检查是否同地点
            var sameLocation = (stateA.decidedLocation === stateB.decidedLocation) || pe.location === 'any';
            if (!sameLocation) continue;

            // 检查关系值
            var rel = getRelation(idA, idB);
            if (typeof rel !== 'number') rel = 50;
            if (rel < pe.minRelation) continue;

            // 概率命中
            if (Math.random() > pe.chance) continue;

            // 随机选一个场景
            var scene = _pickRandom(pe.scenes);
            if (!scene) continue;

            var encounter = {
                type: 'pair',
                pairKey: pairKey,
                npcA: idA,
                npcB: idB,
                npcAName: stateA.name,
                npcBName: stateB.name,
                desc: scene.desc,
                effect: scene.effect,
                tier: pe.tier
            };

            encounters.push(encounter);
        }

        _todayPairEncounters = encounters;
        return encounters;
    }

    // ═══════════════════════════════════════════════════════════
    //  状态触发蛋检测
    // ═══════════════════════════════════════════════════════════

    function checkStateEggs(npcId, dailyState, playerRelation) {
        if (!npcId || !dailyState) return null;

        var rel = (typeof playerRelation === 'number') ? playerRelation : 50;

        for (var i = 0; i < STATE_EGGS.length; i++) {
            var egg = STATE_EGGS[i];
            if (egg.npcId !== npcId) continue;

            try {
                if (egg.condition(dailyState, rel)) {
                    // 检查是否已触发（一次性蛋）
                    var eggKey = 'state_' + npcId + '_' + i;
                    if (egg.once && _triggeredOnce[eggKey]) continue;

                    if (egg.once) _triggeredOnce[eggKey] = true;

                    return {
                        type: 'state_egg',
                        npcId: npcId,
                        npcName: dailyState.name,
                        dialogue: egg.dialogue,
                        effect: egg.effect,
                        tier: egg.tier
                    };
                }
            } catch (e) {
                if (window.Logger) Logger.warn('Encounter', '状态蛋条件判断异常', { npcId: npcId, index: i });
            }
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════
    //  经营彩蛋检测
    // ═══════════════════════════════════════════════════════════

    function checkBusinessEggs(businessStats) {
        if (!businessStats || typeof businessStats !== 'object') return [];

        var eggs = [];
        for (var i = 0; i < BUSINESS_EGGS.length; i++) {
            var be = BUSINESS_EGGS[i];

            // 一次性蛋检查
            if (be.once && _triggeredOnce['biz_' + be.id]) continue;

            try {
                if (be.condition(businessStats)) {
                    if (be.once) _triggeredOnce['biz_' + be.id] = true;

                    eggs.push({
                        type: 'business_egg',
                        id: be.id,
                        title: be.title,
                        desc: be.desc,
                        effect: be.effect,
                        tier: be.tier
                    });
                }
            } catch (e) {
                if (window.Logger) Logger.warn('Encounter', '经营蛋条件判断异常', { id: be.id });
            }
        }

        _todayBusinessEggs = eggs;
        return eggs;
    }

    // ═══════════════════════════════════════════════════════════
    //  公开接口
    // ═══════════════════════════════════════════════════════════

    function init() {
        _triggeredOnce = {};
        _todayPairEncounters = [];
        _todayStateEggs = [];
        _todayBusinessEggs = [];
        if (window.Logger) Logger.info('Encounter', '偶遇彩蛋系统初始化');
    }

    function newDay() {
        _todayPairEncounters = [];
        _todayStateEggs = [];
        _todayBusinessEggs = [];
    }

    function registerPairEncounter(encounter) {
        if (!encounter || !Array.isArray(encounter.pair) || encounter.pair.length !== 2) return false;
        if (!encounter.scenes || !Array.isArray(encounter.scenes)) return false;
        PAIR_ENCOUNTERS.push(encounter);
        return true;
    }

    function registerStateEgg(egg) {
        if (!egg || !egg.npcId || typeof egg.condition !== 'function') return false;
        STATE_EGGS.push(egg);
        return true;
    }

    function registerBusinessEgg(egg) {
        if (!egg || !egg.id || typeof egg.condition !== 'function') return false;
        BUSINESS_EGGS.push(egg);
        return true;
    }

    function getTodayPairEncounters() { return _todayPairEncounters.slice(); }
    function getTodayStateEggs() { return _todayStateEggs.slice(); }
    function getTodayBusinessEggs() { return _todayBusinessEggs.slice(); }

    return {
        init: init,
        newDay: newDay,
        checkPairEncounters: checkPairEncounters,
        checkStateEggs: checkStateEggs,
        checkBusinessEggs: checkBusinessEggs,
        generateRandomInteractions: generateRandomInteractions,
        applyInteractionEffects: applyInteractionEffects,
        getTodayPairEncounters: getTodayPairEncounters,
        getTodayStateEggs: getTodayStateEggs,
        getTodayBusinessEggs: getTodayBusinessEggs,
        registerPairEncounter: registerPairEncounter,
        registerStateEgg: registerStateEgg,
        registerBusinessEgg: registerBusinessEgg,
        // NPC关系系统
        getRelation: getRelation,
        getRelationType: getRelationType,
        updateRelation: updateRelation,
        decayRelations: decayRelations,
        getNpcRelations: getNpcRelations
    };
})();

window.EncounterSystem = EncounterSystem;
