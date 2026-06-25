/**
 * 完整对话流程测试 — 验证话题连贯性
 * 测试：玩家选"没带" → NPC回应伞 → 话题自然过渡
 */

global.window = global;
var _mockWeather = { id: 'rainy', name: '雨天' };
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

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  完整对话流程测试 — 验证话题连贯性                                  ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

// 测试场景：NPC问"下雨带伞没" → 玩家选"没带" → NPC应该回应伞
var npcId = 'wang_zhanggui';
var profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
var state = DailyEngine.getDailyState(npcId);

console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 场景：雨天，王掌柜问"下雨带伞没？"');
console.log('└─────────────────────────────────────────────────────────────────────┘');

var npcSpeech = '下雨带伞没？';
console.log('\nNPC: ' + npcSpeech);

// 生成玩家选项
var options = DailyEngine.generateLiveOptions(npcId, npcSpeech, state, 'acquaintance');
console.log('\n玩家选项:');
options.forEach(function(opt, i) {
    console.log('  [' + (i + 1) + '] ' + opt.playerOption + ' (intent=' + opt.intent + ')');
});

// 玩家选"没带"（deny）
var playerOption = '没带。';
console.log('\n玩家选择: ' + playerOption);

// 生成NPC回复
var dlgCtx = {
    turnCount: 1,
    lastNpcText: npcSpeech,
    currentTopic: '伞'
};
var npcReply = DailyEngine.generateFollowUpReply(npcId, playerOption, 'deny', dlgCtx);
console.log('\nNPC回复: ' + npcReply);

// 检查NPC回复是否和"伞/雨"相关
var replyRelated = (npcReply.indexOf('伞') >= 0 || npcReply.indexOf('雨') >= 0 || npcReply.indexOf('淋') >= 0 || npcReply.indexOf('擦') >= 0);
console.log('\n分析:');
console.log('  NPC回复是否和伞/雨相关: ' + (replyRelated ? '✅ 是' : '❌ 否'));

if (replyRelated) {
    console.log('  ✅ 通过：NPC回应了玩家的"没带"回答，话题连贯');
} else {
    console.log('  ❌ 失败：NPC没有回应伞/雨，话题断裂');
}

// 测试场景2：NPC问"你吃饭了吗" → 玩家选"没吃" → NPC应该回应饭
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 场景：王掌柜问"你吃饭了吗？"');
console.log('└─────────────────────────────────────────────────────────────────────┘');

var npcSpeech2 = '你吃饭了吗？';
console.log('\nNPC: ' + npcSpeech2);

var options2 = DailyEngine.generateLiveOptions(npcId, npcSpeech2, state, 'acquaintance');
console.log('\n玩家选项:');
options2.forEach(function(opt, i) {
    console.log('  [' + (i + 1) + '] ' + opt.playerOption + ' (intent=' + opt.intent + ')');
});

var playerOption2 = '没吃。';
console.log('\n玩家选择: ' + playerOption2);

var dlgCtx2 = {
    turnCount: 1,
    lastNpcText: npcSpeech2,
    currentTopic: '饭'
};
var npcReply2 = DailyEngine.generateFollowUpReply(npcId, playerOption2, 'deny', dlgCtx2);
console.log('\nNPC回复: ' + npcReply2);

var replyRelated2 = (npcReply2.indexOf('饿') >= 0 || npcReply2.indexOf('吃') >= 0 || npcReply2.indexOf('点心') >= 0 || npcReply2.indexOf('请') >= 0);
console.log('\n分析:');
console.log('  NPC回复是否和饭/吃相关: ' + (replyRelated2 ? '✅ 是' : '❌ 否'));

if (replyRelated2) {
    console.log('  ✅ 通过：NPC回应了玩家的"没吃"回答，话题连贯');
} else {
    console.log('  ❌ 失败：NPC没有回应饭/吃，话题断裂');
}

// 测试场景3：特殊问"今天咋样" → 玩家选"还行" → NPC应该回应状态
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 场景：王掌柜问"今天咋样？"');
console.log('└─────────────────────────────────────────────────────────────────────┘');

var npcSpeech3 = '今天咋样？';
console.log('\nNPC: ' + npcSpeech3);

var options3 = DailyEngine.generateLiveOptions(npcId, npcSpeech3, state, 'acquaintance');
console.log('\n玩家选项:');
options3.forEach(function(opt, i) {
    console.log('  [' + (i + 1) + '] ' + opt.playerOption + ' (intent=' + opt.intent + ')');
});

console.log('\n分析:');
var allNatural = options3.every(function(opt) {
    return ['还行', '老样子', '不太行', '不知道', '你说呢', '我想想', '没什么', '你猜', '不想说'].some(function(nat) {
        return opt.playerOption.indexOf(nat) >= 0;
    });
});
console.log('  选项是否都是自然回答: ' + (allNatural ? '✅ 是' : '❌ 否'));

if (allNatural) {
    console.log('  ✅ 通过：特殊问选项自然，不是千奇百怪');
} else {
    console.log('  ❌ 失败：选项不够自然');
}

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试总结                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
