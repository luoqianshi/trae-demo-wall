/**
 * 全选项语境符合性测试
 * 验证：NPC问问题时，所有3个选项都应符合问题语境
 * 不再只测试其中一个，而是验证全部3个选项
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

// 测试用例：NPC问各种问题，验证所有3个选项都符合语境
var testCases = [
    {
        npcSpeech: '下雨带伞没？',
        context: '是非问（带伞）',
        validIntents: ['confirm', 'deny', 'bounce', 'think'],  // 带了/没带/你呢/我想想
        invalidExamples: ['可不是嘛', '进来坐坐', '进来避避雨', '搭把手', '一起吃']
    },
    {
        npcSpeech: '你吃饭了吗？',
        context: '是非问（吃饭）',
        validIntents: ['confirm', 'deny', 'bounce', 'think'],
        invalidExamples: ['可不是嘛', '进来坐坐', '搭把手', '别太拼了']
    },
    {
        npcSpeech: '去没去茶馆？',
        context: '是非问（去茶馆）',
        validIntents: ['confirm', 'deny', 'bounce', 'think'],
        invalidExamples: ['可不是嘛', '进来坐坐', '搭把手', '一起吃']
    },
    {
        npcSpeech: '今天咋样？',
        context: '特殊问（咋样）',
        validIntents: ['confirm', 'deny', 'bounce', 'think', 'listen'],
        invalidExamples: ['可不是嘛', '进来坐坐', '搭把手', '一起吃']
    },
    {
        npcSpeech: '喝茶还是喝酒？',
        context: '选择问（茶/酒）',
        validIntents: ['choose_a', 'choose_b', 'either', 'bounce'],
        invalidExamples: ['可不是嘛', '进来坐坐', '搭把手', '一起吃']
    },
    {
        npcSpeech: '去茶馆还是去铁匠铺？',
        context: '选择问（茶馆/铁匠铺）',
        validIntents: ['choose_a', 'choose_b', 'either', 'bounce'],
        invalidExamples: ['可不是嘛', '进来坐坐', '搭把手', '一起吃']
    }
];

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  全选项语境符合性测试 — 验证所有3个选项都符合NPC问题语境            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var passCount = 0;
var failCount = 0;
var issueDetails = [];

testCases.forEach(function(tc, idx) {
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 测试' + (idx + 1) + ': ' + tc.context);
    console.log('│ NPC问: "' + tc.npcSpeech + '"');
    console.log('│ 合法intent: ' + tc.validIntents.join('/'));
    console.log('└─────────────────────────────────────────────────────────────────────┘');

    var npcId = 'wang_zhanggui';
    var profile = DailyEngine.getNpcProfile(npcId);
    DailyEngine.generateDailyState(npcId);
    var state = DailyEngine.getDailyState(npcId);

    var options = DailyEngine.generateLiveOptions(npcId, tc.npcSpeech, state, 'acquaintance');

    console.log('  生成的玩家选项:');
    var allValid = true;
    options.forEach(function(opt, i) {
        var intentValid = tc.validIntents.indexOf(opt.intent) >= 0;
        var hasInvalidContent = false;
        var invalidMatch = '';
        tc.invalidExamples.forEach(function(bad) {
            if (opt.playerOption.indexOf(bad) >= 0) {
                hasInvalidContent = true;
                invalidMatch = bad;
            }
        });

        var mark = (intentValid && !hasInvalidContent) ? '✓' : '✗';
        var reason = '';
        if (!intentValid) reason = ' [intent不合法: ' + opt.intent + ']';
        if (hasInvalidContent) reason += ' [含无关内容: ' + invalidMatch + ']';

        console.log('    [' + (i + 1) + ']' + mark + ' ' + opt.playerOption + ' (intent=' + opt.intent + ')' + reason);

        if (!intentValid || hasInvalidContent) {
            allValid = false;
            issueDetails.push({
                test: idx + 1,
                context: tc.context,
                option: opt.playerOption,
                intent: opt.intent,
                reason: reason
            });
        }
    });

    if (allValid) {
        console.log('  ✅ 通过：所有选项符合语境');
        passCount++;
    } else {
        console.log('  ❌ 失败：存在不符合语境的选项');
        failCount++;
    }
});

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + testCases.length);
console.log('  失败: ' + failCount + '/' + testCases.length);

if (issueDetails.length > 0) {
    console.log('\n问题详情:');
    issueDetails.forEach(function(d, i) {
        console.log('  ' + (i + 1) + '. 测试' + d.test + ' (' + d.context + '): "' + d.option + '" intent=' + d.intent + d.reason);
    });
}
