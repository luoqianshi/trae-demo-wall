/**
 * 专项测试：王掌柜 ask_trade 回复 + 上下文接不上问题
 * 运行方式: node test_wang_trade.js
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

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  专项测试1：王掌柜 ask_trade 回复（是否说出具体货物）                ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

// 测试王掌柜 ask_trade
setRelation('wang_zhanggui', 50);
DailyEngine.generateDailyState('wang_zhanggui');
var wangProfile = DailyEngine.getNpcProfile('wang_zhanggui');
console.log('\n王掌柜 type = ' + wangProfile.type);

// 模拟玩家问"最近啥好卖？"（intent = ask_trade）
console.log('\n--- 测试 ask_trade 回复（10次）---');
var tradeReplies = [];
for (var i = 0; i < 10; i++) {
    var reply = DailyEngine.generateFollowUpReply('wang_zhanggui', '最近啥好卖？', 'ask_trade', {
        turnCount: 1,
        lastNpcText: '客官里面请！今天新到了好货。',
        currentTopic: '',
        recentUtterances: [],
        sessionTurn: 1
    });
    tradeReplies.push(reply);
    console.log('  ' + (i+1) + '. ' + reply);
}

// 检查：回复里是否包含具体货物名
var goodsList = ['茶叶', '布匹', '盐', '糖', '瓷器', '药材', '丝绸', '香料', '铜器', '漆器', '米面', '腊肉'];
var hasGoods = tradeReplies.some(function(r) {
    return goodsList.some(function(g) { return r.indexOf(g) >= 0; });
});
console.log('\n  ✓ 含具体货物: ' + (hasGoods ? '是' : '否 ❌'));
if (!hasGoods) {
    console.log('  ❌ 问题：王掌柜 ask_trade 回复没有说出具体货物名');
}

// 测试其他商人的 ask_trade
console.log('\n\n--- 测试其他商人 ask_trade ---');
['bu_li', 'yu_fan_zhang'].forEach(function(npcId) {
    var p = DailyEngine.getNpcProfile(npcId);
    setRelation(npcId, 50);
    DailyEngine.generateDailyState(npcId);
    console.log('\n' + p.name + ' (type=' + p.type + '):');
    for (var i = 0; i < 3; i++) {
        var reply = DailyEngine.generateFollowUpReply(npcId, '最近啥好卖？', 'ask_trade', {
            turnCount: 1,
            lastNpcText: p.greeting,
            currentTopic: '',
            recentUtterances: [],
            sessionStart: 1
        });
        console.log('  ' + (i+1) + '. ' + reply);
    }
});

console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  专项测试2：上下文接不上问题（搭把手/进来坐坐 应识别为行动非提问）   ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

// 测试"搭把手？"是否被正确识别为行动（而非问问题）
// 修复后：hasAction 优先于 hasQuestion，带"？"的行动选项应识别为行动
var testOptions = ['搭把手？', '进来坐坐？', '出去转转？', '一起吃？', '走！', '啥好事！', '最近啥好卖？'];
testOptions.forEach(function(opt) {
    // 手动模拟修复后的逻辑：先检测行动，非行动才检测疑问
    var hasAction = /走|来|去|吃|喝|坐|歇|帮|搭把手|一起|进去|出去|转转|坐坐/.test(opt);
    var hasQuestion = false;
    if (!hasAction) {
        hasQuestion = /[？?吗呢啥什么怎么为什么哪谁咋]/.test(opt);
    }
    var status = '';
    if (hasAction && hasQuestion) status = ' ❌ 冲突';
    else if (hasAction) status = ' ✓ 行动';
    else if (hasQuestion) status = ' ✓ 疑问';
    console.log('  "' + opt + '" → hasAction=' + hasAction + ' hasQuestion=' + hasQuestion + status);
});

console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  专项测试3：对话上下文连贯性（多轮对话）                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

// 测试王掌柜完整对话流程
setRelation('wang_zhanggui', 50);
DailyEngine.generateDailyState('wang_zhanggui');
var dlg = DailyEngine.generateContextDialogue('wang_zhanggui', 'acquaintance');
var npcText = dlg.opening + (dlg.topic ? '，' + dlg.topic : '');
console.log('\n王掌柜开场: ' + npcText);

var state = DailyEngine.getDailyState('wang_zhanggui');
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
    var options = DailyEngine.generateLiveOptions('wang_zhanggui', utterances[utterances.length - 1], state, 'acquaintance',
        round > 1 ? utterances[utterances.length - 2] : undefined);
    var optTexts = options.map(function(o) { return o.playerOption; });
    console.log('\n  第' + round + '轮选项: ' + optTexts.join(' / '));

    // 选第一个选项
    var playerChoice = optTexts[0];
    var chosenOpt = options[0];
    console.log('  玩家: ' + playerChoice);

    dlgCtx.turnCount++;
    dlgCtx.topicTurnCount++;
    dlgCtx.recentUtterances.push(playerChoice);
    if (dlgCtx.recentUtterances.length > 6) dlgCtx.recentUtterances.shift();

    var reply = DailyEngine.generateFollowUpReply('wang_zhanggui', playerChoice, chosenOpt.intent, dlgCtx);
    console.log('  王掌柜: ' + reply);

    dlgCtx.lastNpcText = reply;
    utterances.push(reply);

    // 检查连贯性
    if (reply.indexOf(playerChoice) >= 0 && playerChoice.length >= 3) {
        console.log('  ⚠️ 循环污染: 回复包含玩家选项原文');
    }
}

console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  专项测试4：英文检查（对话内容是否含英文）                          ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

// 收集所有NPC的所有回复，检查是否有英文
var allReplies = [];
tradeReplies.forEach(function(r) { allReplies.push(r); });

DailyEngine.getAllNpcIds().forEach(function(npcId) {
    var p = DailyEngine.getNpcProfile(npcId);
    if (p.isAnimal) return;
    setRelation(npcId, 50);
    DailyEngine.generateDailyState(npcId);
    var d = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    allReplies.push(d.opening);
    allReplies.push(d.topic);
    allReplies.push(d.closing);

    // 测试各种 intent 的回复
    var intents = ['listen', 'confirm', 'care', 'accept', 'help', 'share_joy', 'ask_trade', 'ask_work', 'ask_news', 'agree', 'encourage'];
    intents.forEach(function(intent) {
        var r = DailyEngine.generateFollowUpReply(npcId, '测试选项', intent, {
            turnCount: 1,
            lastNpcText: d.opening,
            currentTopic: d.topic || '',
            recentUtterances: [],
            sessionStart: 1
        });
        allReplies.push(r);
    });
});

// 检查英文（排除标点、数字、常见缩写）
var englishPattern = /[a-zA-Z]{3,}/;  // 3个及以上连续英文字母
var englishIssues = [];
allReplies.forEach(function(r) {
    if (englishPattern.test(r)) {
        englishIssues.push(r);
    }
});

console.log('\n  检查 ' + allReplies.length + ' 条回复');
if (englishIssues.length === 0) {
    console.log('  ✓ 未发现英文');
} else {
    console.log('  ❌ 发现 ' + englishIssues.length + ' 条含英文的回复:');
    englishIssues.forEach(function(r, i) {
        console.log('    ' + (i+1) + '. ' + r);
    });
}

console.log('\n\n测试完成。');
