/**
 * 精准诊断：answer意图被误判为跑题的原因
 */
global.window = global;
global.GameTime = {
    getWeather: function() { return { id: 'sunny', name: '晴天' }; },
    getSeason: function() { return 'spring'; },
    getCurrentPeriod: function() { return 'morning'; }
};
global.getRel = function(npcId) { return 50; };

var fs = require('fs');
var path = require('path');
eval(fs.readFileSync(path.join(__dirname, 'daily_engine.js'), 'utf8'));

console.log('═════════════════════════════════════════════════════════════════════');
console.log('精准诊断：answer意图被误判为跑题');
console.log('═════════════════════════════════════════════════════════════════════');

var npcId = 'wang_zhanggui';
var profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);

var npcSpeech = '最近生意怎么样？';
var playerOption = '还行吧。';
var intent = 'answer';

console.log('NPC说: "' + npcSpeech + '"');
console.log('玩家选: "' + playerOption + '" (intent=' + intent + ')');
console.log('');

// 提取关键词
var playerKws = DailyEngine.extractKeywords(playerOption);
var npcKws = DailyEngine.extractKeywords(npcSpeech);
console.log('玩家选项关键词: ' + JSON.stringify(playerKws));
console.log('NPC原话关键词: ' + JSON.stringify(npcKws));

// 检查关键词交集
var hasOverlap = false;
for (var i = 0; i < playerKws.length; i++) {
    for (var j = 0; j < npcKws.length; j++) {
        if (playerKws[i] === npcKws[j] && playerKws[i].length >= 2) {
            hasOverlap = true;
            console.log('  交集: ' + playerKws[i]);
        }
    }
}
console.log('关键词交集: ' + (hasOverlap ? '有' : '无'));

// 检查是否简短回答
var isShortAnswer = playerOption.length <= 3;
var npcAskingQuestion = /[？?]/.test(npcSpeech);
console.log('玩家选项长度: ' + playerOption.length + ' (≤3为简短: ' + isShortAnswer + ')');
console.log('NPC在问问题: ' + npcAskingQuestion);

// 检查intent是否在weirdIntents
var weirdIntents = ['share_joy', 'celebrate', 'tease', 'resonate', 'downplay', 'accept_thanks', 'accept_refuse', 'arrange'];
var isWeirdIntent = weirdIntents.indexOf(intent) >= 0;
console.log('intent在weirdIntents中: ' + isWeirdIntent);

// 判定逻辑
console.log('');
console.log('── 判定逻辑追踪 ──');
if (isShortAnswer && npcAskingQuestion) {
    console.log('→ 简短回答问句，不算莫名（应返回空）');
} else if (hasOverlap) {
    console.log('→ 有关键词交集，不算莫名（应返回空）');
} else if (!isWeirdIntent && !npcAskingQuestion) {
    console.log('→ 非问句场景且intent正常，不算莫名（应返回空）');
} else {
    console.log('→ 触发莫名选项检测！会生成跑题回复');
}

// 实际调用
var dlgCtx = { turnCount: 1, lastNpcText: npcSpeech, currentTopic: '', relStr: 'stranger' };
var reply = DailyEngine.generateFollowUpReply(npcId, playerOption, intent, dlgCtx);
console.log('');
console.log('实际NPC回复: ' + reply);

// 直接调用_generateWeirdOptionReply看是否触发
// 注意：该函数未导出，需要通过DailyEngine访问
console.log('');
console.log('── 验证：answer意图应该走哪个分支 ──');
console.log('answer不在weirdIntents中，但npcAskingQuestion=true');
console.log('所以会进入: !isWeirdIntent && !npcAskingQuestion → false (因为npcAskingQuestion=true)');
console.log('即不会return空，会继续走莫名选项检测！这就是Bug！');

console.log('');
console.log('═════════════════════════════════════════════════════════════════════');
console.log('结论：当NPC问问题 + 玩家选answer意图 + 关键词无交集时，');
console.log('      answer意图不在weirdIntents，但因为npcAskingQuestion=true，');
console.log('      不会触发"非问句场景且intent正常"的return，继续走莫名检测。');
console.log('      修复：answer意图应加入豁免列表，或判定逻辑改为：');
console.log('      if (!isWeirdIntent) return空（不管是否问句）');
console.log('═════════════════════════════════════════════════════════════════════');
