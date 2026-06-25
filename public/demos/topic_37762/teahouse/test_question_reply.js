/**
 * 问题类型识别+针对性回答测试
 * 验证：NPC问"下雨带伞没" → 玩家选项是"带了/没带/你呢"
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

// 测试用例：NPC问各种问题，看玩家选项是否针对性
var testCases = [
    { npcSpeech: '下雨带伞没？', expectType: 'yesno', expectOptions: ['带了', '没带', '你呢'] },
    { npcSpeech: '你吃饭了吗？', expectType: 'yesno', expectOptions: ['吃了', '没吃', '你呢'] },
    { npcSpeech: '去没去茶馆？', expectType: 'yesno', expectOptions: ['去了', '没去', '你呢'] },
    { npcSpeech: '今天咋样？', expectType: 'special', expectOptions: ['还行', '老样子', '不太行'] },
    { npcSpeech: '你在想什么？', expectType: 'special', expectOptions: ['没什么', '你猜', '不想说'] },
    { npcSpeech: '喝茶还是喝酒？', expectType: 'choice', expectOptions: ['茶', '酒', '都行'] },
    { npcSpeech: '去茶馆还是去铁匠铺？', expectType: 'choice', expectOptions: ['茶馆', '铁匠铺', '都行'] },
    { npcSpeech: '最近生意怎么样？', expectType: 'special', expectOptions: ['还行', '老样子', '不太行'] }
];

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  问题类型识别+针对性回答测试（CoT思考方式）                          ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var passCount = 0;
var failCount = 0;

testCases.forEach(function(tc, idx) {
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 测试' + (idx + 1) + ': NPC问 "' + tc.npcSpeech + '"');
    console.log('│ 期望类型: ' + tc.expectType + '  期望选项包含: ' + tc.expectOptions.join('/'));
    console.log('└─────────────────────────────────────────────────────────────────────┘');

    // Step 1: 识别问题类型
    var qType = DailyEngine._identifyQuestionType ? DailyEngine._identifyQuestionType(tc.npcSpeech) : 'unknown';
    // 由于函数是私有的，我们通过 generateLiveOptions 间接测试
    // 先构造一个模拟的NPC上下文
    var npcId = 'wang_zhanggui';
    var profile = DailyEngine.getNpcProfile(npcId);
    DailyEngine.generateDailyState(npcId);
    var state = DailyEngine.getDailyState(npcId);

    // 模拟NPC说了这句话，生成玩家选项
    var options = DailyEngine.generateLiveOptions(npcId, tc.npcSpeech, state, 'acquaintance');

    console.log('  生成的玩家选项:');
    var foundExpected = false;
    options.forEach(function(opt, i) {
        var matchMark = ' ';
        tc.expectOptions.forEach(function(exp) {
            if (opt.playerOption.indexOf(exp) >= 0) {
                matchMark = '✓';
                foundExpected = true;
            }
        });
        console.log('    [' + (i + 1) + ']' + matchMark + ' ' + opt.playerOption + ' (intent=' + opt.intent + ')');
    });

    if (foundExpected) {
        console.log('  ✅ 通过：选项包含针对性回答');
        passCount++;
    } else {
        console.log('  ❌ 失败：选项未包含针对性回答');
        failCount++;
    }
});

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + testCases.length);
console.log('  失败: ' + failCount + '/' + testCases.length);
