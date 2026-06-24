/**
 * 时间感知测试 — 验证玩家选项是否根据时段变化
 * 测试方向：同一句NPC话，白天和晚上生成的选项应该不同
 */

// 模拟浏览器环境
var GameTime = { getWeather: function() { return { id: 'clear', name: '晴天' }; } };
var getRel = function() { return 50; };
var SoulTick = { getNpcState: function() { return { intent: { goalType: '' } }; } };
global.window = { GameTime: GameTime, getRel: getRel, SoulTick: SoulTick };
global.GameTime = GameTime;
global.getRel = getRel;
global.SoulTick = SoulTick;

// 加载daily_engine.js
var fs = require('fs');
var code = fs.readFileSync('daily_engine.js', 'utf8');
eval(code);

// 测试用例：同一句NPC话，白天和晚上应该生成不同选项
var testCases = [
    {
        scene: 'NPC说累',
        npcSpeech: '今天干了不少活，累得慌。',
        dayExpect: ['歇会儿', '身子骨'],
        nightExpect: ['早点睡', '别熬了']
    },
    {
        scene: 'NPC邀请',
        npcSpeech: '来来来，坐会儿！',
        dayExpect: ['走', '等会儿'],
        nightExpect: ['明天', '太晚']
    },
    {
        scene: 'NPC说闲',
        npcSpeech: '今天没来几个喝茶的，闲。',
        dayExpect: ['转转', '聊天'],
        nightExpect: ['休息', '明天再说']
    },
    {
        scene: 'NPC说无聊',
        npcSpeech: '最近都没怎么跟人说话，闷得慌。',
        dayExpect: ['转转'],
        nightExpect: ['别一个人']
    },
    {
        scene: 'NPC提到工作',
        npcSpeech: '今天活儿不少，忙得脚不沾地。',
        dayExpect: ['别太拼', '搭把手'],
        nightExpect: ['这么晚', '明天再说']
    }
];

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  时间感知测试 — 验证白天/晚上选项差异                              ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var passCount = 0;
var failCount = 0;
var issues = [];

testCases.forEach(function(tc, idx) {
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ 测试' + (idx + 1) + ': ' + tc.scene);
    console.log('│ NPC说: "' + tc.npcSpeech + '"');
    console.log('└─────────────────────────────────────────────────────────────────────┘');

    var npcId = 'wang_zhanggui';
    var profile = DailyEngine.getNpcProfile(npcId);
    DailyEngine.generateDailyState(npcId);
    var state = DailyEngine.getDailyState(npcId);

    // 模拟白天（morning）
    GameTime.getPeriod = function() { return { id: 'morning', name: '上午', hour: 8 }; };
    var dayOptions = DailyEngine.generateLiveOptions(npcId, tc.npcSpeech, state, 50);
    var dayTexts = dayOptions.map(function(o) { return o.playerOption; }).join(' / ');

    // 模拟晚上（night）
    GameTime.getPeriod = function() { return { id: 'night', name: '夜晚', hour: 20 }; };
    var nightOptions = DailyEngine.generateLiveOptions(npcId, tc.npcSpeech, state, 50);
    var nightTexts = nightOptions.map(function(o) { return o.playerOption; }).join(' / ');

    console.log('  白天选项: ' + dayTexts);
    console.log('  晚上选项: ' + nightTexts);
    // 调试：检查时段是否被正确读取
    if (typeof GameTime.getPeriod === 'function') {
        console.log('  [DEBUG] GameTime.getPeriod() = ' + JSON.stringify(GameTime.getPeriod()));
    }

    // 检查白天选项是否包含期望词
    var dayMatch = tc.dayExpect.some(function(exp) {
        return dayTexts.indexOf(exp) >= 0;
    });
    // 检查晚上选项是否包含期望词
    var nightMatch = tc.nightExpect.some(function(exp) {
        return nightTexts.indexOf(exp) >= 0;
    });

    if (dayMatch && nightMatch) {
        console.log('  ✅ 通过：白天/晚上选项有差异');
        passCount++;
    } else {
        var reasons = [];
        if (!dayMatch) reasons.push('白天选项未包含' + tc.dayExpect.join('/'));
        if (!nightMatch) reasons.push('晚上选项未包含' + tc.nightExpect.join('/'));
        console.log('  ❌ 失败：' + reasons.join('；'));
        failCount++;
        issues.push({ scene: tc.scene, dayTexts: dayTexts, nightTexts: nightTexts, reasons: reasons });
    }
});

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + testCases.length);
console.log('  失败: ' + failCount + '/' + testCases.length);

if (issues.length > 0) {
    console.log('\n── 失败场景汇总 ──');
    issues.forEach(function(iss, i) {
        console.log('  [' + (i + 1) + '] ' + iss.scene);
        console.log('      白天: ' + iss.dayTexts);
        console.log('      晚上: ' + iss.nightTexts);
        console.log('      原因: ' + iss.reasons.join('；'));
    });
}
