/**
 * 语义对应性深度测试 — 逐轮分析对话链是否对应
 * 检测：1.NPC说→玩家选项是否对应 2.玩家选项→NPC回复是否对应 3.NPC回复→下一轮选项是否对应
 * 运行方式: node test_semantic_chain.js
 */

global.window = global;
var _mockWeather = { id: 'clear', name: '晴天' };
global.GameTime = {
    getWeather: function() { return _mockWeather; },
    getSeason: function() { return 'spring'; },
    getCurrentPeriod: function() { return 'morning'; }
};
var _mockRelations = {};
global.getRel = function(npcId) { return _mockRelations[npcId] || 50; };

var fs = require('fs');
var path = require('path');
eval(fs.readFileSync(path.join(__dirname, 'daily_engine.js'), 'utf8'));

function setRelation(npcId, val) { _mockRelations[npcId] = val; }

// 简易关键词提取（模拟 daily_engine.js 的 extractKeywords）
function extractKeywords(text) {
    if (!text) return [];
    // 去标点
    var clean = text.replace(/[，。！？、…""''（）()【】《》\s]/g, '');
    // 提取2-4字中文词
    var matches = clean.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    // 去重
    var seen = {};
    var result = [];
    for (var i = 0; i < matches.length; i++) {
        if (!seen[matches[i]]) {
            seen[matches[i]] = true;
            result.push(matches[i]);
        }
    }
    return result;
}

// 语义相关性检测：通过关键词交集判断两句话是否相关
function semanticLink(textA, textB) {
    if (!textA || !textB) return { linked: false, sharedKw: [] };
    var kwA = extractKeywords(textA);
    var kwB = extractKeywords(textB);
    var shared = [];
    for (var i = 0; i < kwA.length; i++) {
        for (var j = 0; j < kwB.length; j++) {
            if (kwA[i] === kwB[j] && kwA[i].length >= 2) {
                shared.push(kwA[i]);
            }
            // 部分匹配（如"货"和"新货"）
            if (kwA[i].length >= 2 && kwB[j].length >= 2 &&
                (kwA[i].indexOf(kwB[j]) >= 0 || kwB[j].indexOf(kwA[i]) >= 0)) {
                if (shared.indexOf(kwA[i]) < 0 && shared.indexOf(kwB[j]) < 0) {
                    shared.push(kwA[i].length >= kwB[j].length ? kwA[i] : kwB[j]);
                }
            }
        }
    }
    return { linked: shared.length > 0, sharedKw: shared };
}

// 意图与回复语义检测：玩家选项的意图是否被NPC回复"接住"
function intentMatch(playerOpt, intent, npcReply) {
    // 关心类：NPC应表达"不用关心/我没事/歇不了"等
    if (intent === 'care' || intent === 'encourage') {
        return /歇|没事|不用|撑得住|硬着|惯了|不能停|走不开|不拼|不干|放心/.test(npcReply);
    }
    // 帮助类：NPC应表达"帮我xx/行啊/好啊"
    if (intent === 'help') {
        return /帮我|帮我|行啊|好啊|那敢情好|正好/.test(npcReply);
    }
    // 分享喜悦：NPC应表达具体的好事
    if (intent === 'share_joy' || intent === 'celebrate') {
        return /今天|来了|碰到|大主顾|大活儿|突破|师傅夸|赢了|顺|喜事|出息|悟|破|机缘/.test(npcReply);
    }
    // ask_trade：NPC应说出具体货物
    if (intent === 'ask_trade') {
        return /茶叶|布匹|盐|糖|瓷器|药材|丝绸|香料|铜器|漆器|米面|腊肉|货|卖|紧俏|断货/.test(npcReply);
    }
    // ask_craft：NPC应说出手艺细节
    if (intent === 'ask_craft') {
        return /刀|榫卯|炉火|锤子|工序|料子|打铁|刨木|上釉|纺线|雕刻|淬火|活儿|手艺|火候/.test(npcReply);
    }
    // ask_work：NPC应说出工作内容
    if (intent === 'ask_work') {
        return /进货|算账|招呼|盘货|打铁|刨木|沏茶|擦桌|修炼|巡山|赶路|干活|家务|操持/.test(npcReply);
    }
    // listen：NPC应继续展开话题
    if (intent === 'listen') {
        return /说来话长|细说说|门道|跟你|那个|这活儿|这壶茶|这段|这局|家里|这档子|天机|命数/.test(npcReply);
    }
    // confirm/agree：NPC应认同
    if (intent === 'confirm' || intent === 'agree') {
        return /可不是嘛|你说得对|嗯|就是|天道|命数/.test(npcReply);
    }
    // comfort：NPC应接受安慰
    if (intent === 'comfort') {
        return /唉|行吧|算了|好受|没事|罢了|不必/.test(npcReply);
    }
    return true; // 其他意图不检测
}

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  语义对应性深度测试 — 逐轮分析对话链                                ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var testNpcs = ['wang_zhanggui', 'tie_zhao', 'a_fu', 'yunxi', 'lao_chen', 'shenmi_laoren'];
var totalIssues = { optionNotMatchNpc: 0, replyNotMatchOption: 0, nextOptNotMatchReply: 0, npcSayPlayerOpt: 0 };

testNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    if (!profile || profile.isAnimal) return;

    var name = profile.name;
    setRelation(npcId, 50);
    DailyEngine.generateDailyState(npcId);
    var state = DailyEngine.getDailyState(npcId);

    console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ ' + name + ' (' + npcId + ')  type=' + profile.type + '  mood=' + state.mood + ' │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');

    var dlg = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    var npcText = dlg.opening + (dlg.topic ? '，' + dlg.topic : '');
    console.log('  [NPC开场] ' + npcText);

    var utterances = [npcText];
    var dlgCtx = {
        turnCount: 0,
        lastNpcText: npcText,
        currentTopic: dlg.topic || '',
        topicTurnCount: 0,
        recentUtterances: [],
        sessionStart: Date.now()
    };

    for (var round = 1; round <= 5; round++) {
        var options = DailyEngine.generateLiveOptions(npcId, utterances[utterances.length - 1], state, 'acquaintance',
            round > 1 ? utterances[utterances.length - 2] : undefined);

        console.log('\n  ── 第' + round + '轮 ──');

        // 检测1：NPC开场/回复 → 玩家选项 是否对应
        var prevNpcText = utterances[utterances.length - 1];
        options.forEach(function(opt, idx) {
            var link = semanticLink(prevNpcText, opt.playerOption);
            var mark = link.linked ? '✓' : '✗';
            if (!link.linked) totalIssues.optionNotMatchNpc++;
            console.log('  [选项' + (idx+1) + '] ' + mark + ' ' + opt.playerOption + ' (intent=' + opt.intent + ', shared=' + link.sharedKw.join(',') + ')');
        });

        // 选第一个选项
        var chosenOpt = options[0];
        var playerChoice = chosenOpt.playerOption;
        console.log('  [玩家选] ' + playerChoice);

        dlgCtx.turnCount++;
        dlgCtx.topicTurnCount++;
        dlgCtx.recentUtterances.push(playerChoice);
        if (dlgCtx.recentUtterances.length > 6) dlgCtx.recentUtterances.shift();

        var reply = DailyEngine.generateFollowUpReply(npcId, playerChoice, chosenOpt.intent, dlgCtx);
        console.log('  [NPC回] ' + reply);

        // 检测2：玩家选项 → NPC回复 是否对应（语义+意图）
        var optReplyLink = semanticLink(playerChoice, reply);
        var intentOk = intentMatch(playerChoice, chosenOpt.intent, reply);
        // 检测NPC回复是否包含玩家选项原文（NPC说了玩家的话）
        var npcSayPlayer = reply.indexOf(playerChoice) >= 0 && playerChoice.length >= 3;
        if (npcSayPlayer) {
            totalIssues.npcSayPlayerOpt++;
            console.log('  ⚠️ NPC回复包含玩家选项原文！');
        }
        if (!intentOk) {
            totalIssues.replyNotMatchOption++;
            console.log('  ⚠️ NPC回复与玩家意图不匹配！(intent=' + chosenOpt.intent + ')');
        }

        dlgCtx.lastNpcText = reply;
        utterances.push(playerChoice);
        utterances.push(reply);
    }

    console.log('');
});

console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  问题汇总                                                          ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  NPC说→玩家选项不对应: ' + totalIssues.optionNotMatchNpc + '次');
console.log('  玩家选项→NPC回复不对应: ' + totalIssues.replyNotMatchOption + '次');
console.log('  NPC回复→下一轮选项不对应: ' + totalIssues.nextOptNotMatchReply + '次');
console.log('  NPC回复包含玩家选项原文: ' + totalIssues.npcSayPlayerOpt + '次');
