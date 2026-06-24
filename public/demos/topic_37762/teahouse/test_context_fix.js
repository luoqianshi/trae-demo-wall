/**
 * 语境修复验证 — 验证5个关键误触发场景已修复
 * 场景1: "师门清闲，难得。" → 应走hasIdle，不走hasComplaint
 * 场景2: "正好你来了，一起喝杯茶？" → 应走hasSuggestion，不走hasFood
 * 场景3: "今天没来几个喝茶的，闲" → 应走hasIdle，不走hasFood
 * 场景4: "闲着就磨磨工具" → 应走hasIdle，不走hasWork
 * 场景5: "今日功课做完了" → 不应走hasWork（"功课"是学习不是工作）
 */

var GameTime = {
    getWeather: function() { return { id: 'clear', name: '晴天' }; },
    getPeriod: function() { return { id: 'morning', name: '上午', hour: 8 }; }
};
var getRel = function() { return 50; };
var SoulTick = { getNpcState: function() { return { intent: { goalType: '' } }; } };
global.window = { GameTime: GameTime, getRel: getRel, SoulTick: SoulTick };
global.GameTime = GameTime;
global.getRel = getRel;
global.SoulTick = SoulTick;

var fs = require('fs');
var code = fs.readFileSync('daily_engine.js', 'utf8');
eval(code);

var allNpcs = DailyEngine.getAllNpcIds();
var testNpc = allNpcs[0]; // 用第一个NPC测试
DailyEngine.generateDailyState(testNpc);
var state = DailyEngine.getDailyState(testNpc);
state.mood = 50;

var scenarios = [
    {
        name: '场景1: "师门清闲，难得。" → 应走hasIdle（陪伴/转转），不走hasComplaint（谁惹你了）',
        text: '师门清闲，难得。',
        badOptions: ['谁惹你了', '消消气', '太过分了'],
        goodKeywords: ['陪', '转转', '聊天', '休息', '明天再说']
    },
    {
        name: '场景2: "正好你来了，一起喝杯茶？" → 应走hasSuggestion（走/等会儿），不走hasFood（吃饭）',
        text: '正好你来了，一起喝杯茶？',
        badOptions: ['记得吃饭', '一起吃', '吃点夜宵'],
        goodKeywords: ['走', '等会儿', '明天吧', '改天']
    },
    {
        name: '场景3: "今天没来几个喝茶的，闲" → 应走hasIdle，不走hasFood',
        text: '今天没来几个喝茶的，闲',
        badOptions: ['记得吃饭', '一起吃', '吃点夜宵'],
        goodKeywords: ['陪', '转转', '聊天', '休息', '明天再说']
    },
    {
        name: '场景4: "闲着就磨磨工具" → 应走hasIdle，不走hasWork（搭把手）',
        text: '闲着就磨磨工具',
        badOptions: ['搭把手', '别太拼了', '这么晚还忙'],
        goodKeywords: ['陪', '转转', '聊天', '休息', '明天再说']
    },
    {
        name: '场景5: "今日功课做完了" → 不应走hasWork（搭把手/别太拼了）',
        text: '今日功课做完了',
        badOptions: ['搭把手', '别太拼了', '这么晚还忙'],
        goodKeywords: ['嗯', '然后呢', '歇', '陪', '转转']
    }
];

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  语境修复验证 — 5个关键误触发场景                                  ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('');

var passCount = 0;
scenarios.forEach(function(s, i) {
    var options = DailyEngine.generateLiveOptions(testNpc, s.text, state, 50);
    var optTexts = options ? options.map(function(o) { return o.playerOption; }) : [];

    console.log('[' + (i + 1) + '] ' + s.name);
    console.log('    NPC说: "' + s.text + '"');
    console.log('    选项: ' + optTexts.join(' / '));

    // 检查是否有坏选项
    var hasBad = optTexts.some(function(t) {
        return s.badOptions.some(function(b) { return t.indexOf(b) >= 0; });
    });

    // 检查是否有好选项
    var hasGood = optTexts.some(function(t) {
        return s.goodKeywords.some(function(g) { return t.indexOf(g) >= 0; });
    });

    if (hasBad) {
        console.log('    ❌ 失败：仍包含误触发选项');
    } else if (!hasGood) {
        console.log('    ⚠️ 警告：未包含预期好选项（但无误触发）');
    } else {
        console.log('    ✅ 通过：选项贴合语境');
        passCount++;
    }
    console.log('');
});

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('验证结果: ' + passCount + '/' + scenarios.length + ' 通过');
console.log('═══════════════════════════════════════════════════════════════════════');
