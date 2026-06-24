/**
 * 真实对话场景测试 — 模拟玩家实际体验
 * 不用预设语句，而是用daily_engine.js真实生成的开场白和话题
 * 验证"代码测试准但人工测试有问题"的根因
 */

// 模拟浏览器环境
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

// 所有NPC列表
var allNpcs = DailyEngine.getAllNpcIds();
console.log('NPC数量: ' + allNpcs.length);
console.log('NPC列表: ' + allNpcs.join(', '));

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  真实对话场景测试 — 用引擎生成的开场白测试选项贴合度              ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('NPC数量: ' + allNpcs.length);
console.log('');

var issues = [];
var totalTests = 0;
var passTests = 0;

allNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    if (!profile) return;
    // 跳过动物NPC
    if (profile.type === 'animal' || profile.isAnimal) return;

    DailyEngine.generateDailyState(npcId);
    var state = DailyEngine.getDailyState(npcId);

    // 模拟3种mood场景
    var moods = [
        { label: '低落', mood: 20 },
        { label: '正常', mood: 50 },
        { label: '高涨', mood: 85 }
    ];

    moods.forEach(function(moodCtx) {
        state.mood = moodCtx.mood;
        // 用引擎真实生成开场白（不是预设语句）
        var dlg = DailyEngine.generateContextDialogue(npcId, state, 50);
        if (!dlg) return;

        var npcText = dlg.fullDialogue || dlg.opening || dlg.topic || '';
        if (!npcText || npcText.length < 3) return;

        totalTests++;

        // 基于这个真实开场白生成玩家选项
        var options = DailyEngine.generateLiveOptions(npcId, npcText, state, 50);
        if (!options || options.length === 0) {
            issues.push({
                npc: profile.name || npcId,
                mood: moodCtx.label,
                npcText: npcText,
                problem: '无选项生成',
                options: []
            });
            return;
        }

        var optTexts = options.map(function(o) { return o.playerOption; });

        // 检查选项质量
        var problems = [];

        // 1. 选项数量不足
        if (optTexts.length < 3) {
            problems.push('选项不足(' + optTexts.length + '个)');
        }

        // 2. 选项与NPC语境明显不匹配（简单启发式）
        // NPC说累，选项却没有关心类
        if (npcText.indexOf('累') >= 0 || npcText.indexOf('困') >= 0) {
            var hasCare = optTexts.some(function(t) {
                return t.indexOf('歇') >= 0 || t.indexOf('睡') >= 0 || t.indexOf('休息') >= 0 || t.indexOf('身子') >= 0;
            });
            if (!hasCare) problems.push('NPC说累但无关心选项');
        }
        // NPC说闲/无聊，选项却没有陪伴类
        if (npcText.indexOf('闲') >= 0 || npcText.indexOf('无聊') >= 0 || npcText.indexOf('闷') >= 0) {
            var hasCompany = optTexts.some(function(t) {
                return t.indexOf('陪') >= 0 || t.indexOf('转转') >= 0 || t.indexOf('聊天') >= 0;
            });
            if (!hasCompany) problems.push('NPC说闲但无陪伴选项');
        }
        // NPC问问题，选项却没有回答类
        if (/[？?]/.test(npcText) || npcText.indexOf('吗') >= 0 || npcText.indexOf('呢') >= 0) {
            var hasAnswer = optTexts.some(function(t) {
                return t.indexOf('嗯') >= 0 || t.indexOf('是') >= 0 || t.indexOf('没') >= 0 || t.indexOf('有') >= 0 || t.indexOf('好') >= 0;
            });
            if (!hasAnswer) problems.push('NPC问问题但无回答选项');
        }
        // NPC邀请，选项却没有接受/拒绝类
        if (npcText.indexOf('来') >= 0 && (npcText.indexOf('坐') >= 0 || npcText.indexOf('喝') >= 0)) {
            var hasAccept = optTexts.some(function(t) {
                return t.indexOf('走') >= 0 || t.indexOf('好') >= 0 || t.indexOf('明天') >= 0 || t.indexOf('等会儿') >= 0;
            });
            if (!hasAccept) problems.push('NPC邀请但无接受/拒绝选项');
        }

        if (problems.length > 0) {
            issues.push({
                npc: profile.name || npcId,
                mood: moodCtx.label,
                npcText: npcText,
                problem: problems.join('；'),
                options: optTexts
            });
        } else {
            passTests++;
        }
    });
});

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('测试结果: ' + passTests + '/' + totalTests + ' 通过');
console.log('问题场景: ' + issues.length + ' 个');
console.log('═══════════════════════════════════════════════════════════════════════');

if (issues.length > 0) {
    console.log('\n── 问题场景详情（前20个）──');
    issues.slice(0, 20).forEach(function(iss, i) {
        console.log('\n[' + (i + 1) + '] ' + iss.npc + ' (心情' + iss.mood + ')');
        console.log('    NPC说: "' + iss.npcText + '"');
        console.log('    问题: ' + iss.problem);
        console.log('    选项: ' + iss.options.join(' / '));
    });

    if (issues.length > 20) {
        console.log('\n... 还有 ' + (issues.length - 20) + ' 个问题场景未显示');
    }

    // 统计问题类型
    console.log('\n── 问题类型统计 ──');
    var problemTypes = {};
    issues.forEach(function(iss) {
        iss.problem.split('；').forEach(function(p) {
            problemTypes[p] = (problemTypes[p] || 0) + 1;
        });
    });
    Object.keys(problemTypes).forEach(function(p) {
        console.log('  ' + p + ': ' + problemTypes[p] + '次');
    });
}
