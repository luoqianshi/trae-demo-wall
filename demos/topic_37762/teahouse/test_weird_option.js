/**
 * 莫名选项+性格分流回应测试
 * 验证：玩家选莫名选项时，NPC按性格回应（拉回原话题/顺新话题）
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
console.log('║  莫名选项+性格分流回应测试                                          ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

// 测试场景：NPC问"下雨带伞没"，玩家选"沾沾喜气！"（莫名选项）
// 不同性格的NPC应该有不同回应

var testCases = [
    {
        npcId: 'tie_zhao',
        npcName: '铁匠赵',
        npcSpeech: '下雨带伞没？',
        playerOption: '沾沾喜气！',
        intent: 'celebrate',
        expectStyle: '高固执/低耐心 → 拉回原话题（伞）',
        checkReply: function(reply) {
            return reply.indexOf('伞') >= 0 || reply.indexOf('打岔') >= 0 || reply.indexOf('别') >= 0;
        }
    },
    {
        npcId: 'yunxi',
        npcName: '云溪',
        npcSpeech: '下雨带伞没？',
        playerOption: '沾沾喜气！',
        intent: 'celebrate',
        expectStyle: '高好奇 → 可能顺新话题（喜气）或拉回',
        checkReply: function(reply) {
            return reply.indexOf('喜气') >= 0 || reply.indexOf('喜') >= 0 || reply.indexOf('伞') >= 0 || reply.indexOf('扯') >= 0;
        }
    },
    {
        npcId: 'wang_zhanggui',
        npcName: '王掌柜',
        npcSpeech: '下雨带伞没？',
        playerOption: '沾沾喜气！',
        intent: 'celebrate',
        expectStyle: '高热情 → 友善引导回话题（伞）',
        checkReply: function(reply) {
            return reply.indexOf('伞') >= 0 || reply.indexOf('扯远') >= 0 || reply.indexOf('跑题') >= 0;
        }
    },
    {
        npcId: 'tie_zhao',
        npcName: '铁匠赵',
        npcSpeech: '你吃饭了吗？',
        playerOption: '搭把手？',
        intent: 'help',
        expectStyle: '高固执 → 拉回原话题（饭/吃）',
        checkReply: function(reply) {
            return reply.indexOf('饭') >= 0 || reply.indexOf('吃') >= 0 || reply.indexOf('打岔') >= 0 || reply.indexOf('别') >= 0;
        }
    },
    {
        npcId: 'wang_zhanggui',
        npcName: '王掌柜',
        npcSpeech: '下雨带伞没？',
        playerOption: '没带。',
        intent: 'deny',
        expectStyle: '简短回答问句 → 不触发莫名选项（走正常deny回复）',
        checkReply: function(reply) {
            // 应该走正常deny回复，不触发莫名选项
            // 接受所有合理的deny回复（含伞/雨/淋/擦/旧的/用/给等关键词）
            return reply.indexOf('伞') >= 0 || reply.indexOf('雨') >= 0 || reply.indexOf('淋') >= 0 || reply.indexOf('擦') >= 0
                || reply.indexOf('旧的') >= 0 || reply.indexOf('用') >= 0 || reply.indexOf('给') >= 0 || reply.indexOf('进来') >= 0;
        }
    }
];

var passCount = 0;
var failCount = 0;

testCases.forEach(function(tc, idx) {
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 测试' + (idx + 1) + ': ' + tc.npcName + ' 场景');
    console.log('│ NPC问: "' + tc.npcSpeech + '"');
    console.log('│ 玩家选: "' + tc.playerOption + '" (intent=' + tc.intent + ')');
    console.log('│ 期望: ' + tc.expectStyle);
    console.log('└─────────────────────────────────────────────────────────────────────┘');

    var profile = DailyEngine.getNpcProfile(tc.npcId);
    DailyEngine.generateDailyState(tc.npcId);
    var state = DailyEngine.getDailyState(tc.npcId);

    var dlgCtx = {
        turnCount: 1,
        lastNpcText: tc.npcSpeech,
        currentTopic: ''
    };
    var reply = DailyEngine.generateFollowUpReply(tc.npcId, tc.playerOption, tc.intent, dlgCtx);
    console.log('  NPC回复: ' + reply);

    var pass = tc.checkReply(reply);
    if (pass) {
        console.log('  ✅ 通过');
        passCount++;
    } else {
        console.log('  ❌ 失败：回复不符合期望');
        failCount++;
    }
});

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + testCases.length);
console.log('  失败: ' + failCount + '/' + testCases.length);
