/**
 * 陈述句选项语境测试 — 验证玩家选项是否贴合NPC陈述句语境
 * 测试方向：NPC说陈述句时，玩家选项是否自然、贴合语境
 * 这是真实游戏中99%的场景（NPC开场白和后续回复多为陈述句）
 */

// 模拟浏览器环境
// 注意：固定为白天(morning)，避免测试结果受真实时间影响
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

// 加载daily_engine.js
var fs = require('fs');
var code = fs.readFileSync('daily_engine.js', 'utf8');
eval(code);

// 测试用例：NPC陈述句 + 期望选项应包含的语义方向
var testCases = [
    // ── 场景1：NPC邀请类陈述句 ──
    {
        scene: 'NPC邀请坐',
        npcSpeech: '来来来，坐会儿！',
        expectOptionsContain: ['好', '行', '坐', '歇', '不', '忙'],  // 应接受/拒绝/回应邀请
        expectNotContain: ['然后呢', '后来呢', '咋了', '谁惹你']  // 不应问后续
    },
    {
        scene: 'NPC邀请喝茶',
        npcSpeech: '今天茶不错，来一壶？',
        expectOptionsContain: ['好', '行', '来', '喝', '不', '茶'],
        expectNotContain: ['然后呢', '后来呢', '谁惹你', '消消气']
    },
    // ── 场景2：NPC陈述事实 ──
    {
        scene: 'NPC说今天没客人',
        npcSpeech: '今天没来几个喝茶的，闲。',
        expectOptionsContain: ['咋', '怎么', '为啥', '别', '没事', '歇', '陪', '转', '聊'],
        expectNotContain: ['谁惹你', '消消气', '沾沾喜气']
    },
    {
        scene: 'NPC说任务完成',
        npcSpeech: '这次任务，不简单，差点没完成。',
        expectOptionsContain: ['咋', '怎么', '后来', '没事', '险', '歇'],
        expectNotContain: ['谁惹你', '消消气', '沾沾喜气', '搭把手']
    },
    // ── 场景3：NPC抱怨类陈述句 ──
    {
        scene: 'NPC说烦',
        npcSpeech: '师门的事，不好多说，反正挺烦的。',
        expectOptionsContain: ['咋', '怎么', '别', '消消', '说说'],
        expectNotContain: ['沾沾喜气', '教我两手', '搭把手', '一起吃']
    },
    {
        scene: 'NPC说生意不好',
        npcSpeech: '今天生意不好，亏了不少。',
        expectOptionsContain: ['咋', '怎么', '亏', '别', '没事'],
        expectNotContain: ['沾沾喜气', '教我两手', '一起吃', '搭把手']
    },
    // ── 场景4：NPC分享喜悦 ──
    {
        scene: 'NPC说悟了',
        npcSpeech: '今天悟了点东西！',
        expectOptionsContain: ['啥', '悟', '说说', '厉害', '恭喜'],
        expectNotContain: ['谁惹你', '消消气', '别太拼', '搭把手']
    },
    {
        scene: 'NPC说运气好',
        npcSpeech: '今天运气真好！',
        expectOptionsContain: ['啥', '运气', '说说', '厉害', '恭喜', '沾'],
        expectNotContain: ['谁惹你', '消消气', '别太拼']
    },
    // ── 场景5：NPC说累 ──
    {
        scene: 'NPC说累',
        npcSpeech: '今天干了不少活，累得慌。',
        expectOptionsContain: ['歇', '别', '累', '休息', '咋'],
        expectNotContain: ['沾沾喜气', '谁惹你', '教我两手', '一起吃']
    },
    // ── 场景6：NPC说孤独 ──
    {
        scene: 'NPC说无聊',
        npcSpeech: '最近都没怎么跟人说话，闷得慌。',
        expectOptionsContain: ['陪', '聊', '说', '咋', '没事'],
        expectNotContain: ['谁惹你', '消消气', '沾沾喜气', '教我两手']
    },
    // ── 场景7：NPC说过去的事 ──
    {
        scene: 'NPC说昨天的事',
        npcSpeech: '昨天碰到件有意思的事……',
        expectOptionsContain: ['啥', '说', '咋', '后来', '然后'],
        expectNotContain: ['谁惹你', '消消气', '沾沾喜气', '搭把手']
    },
    // ── 场景8：NPC说新鲜事 ──
    {
        scene: 'NPC说新鲜事',
        npcSpeech: '今天听到个新鲜事，镇东头开了家新店。',
        expectOptionsContain: ['啥', '说', '咋', '新', '店'],
        expectNotContain: ['谁惹你', '消消气', '沾沾喜气', '教我两手']
    },
    // ── 场景9：NPC说修炼 ──
    {
        scene: 'NPC说修炼瓶颈',
        npcSpeech: '修炼的事，今天卡在瓶颈上了。',
        expectOptionsContain: ['咋', '别', '没事', '歇', '咋整'],
        expectNotContain: ['沾沾喜气', '谁惹你', '一起吃', '教我两手']
    },
    // ── 场景10：NPC说八卦 ──
    {
        scene: 'NPC说八卦',
        npcSpeech: '茶馆的八卦，多着呢，听说老张家出事了！',
        expectOptionsContain: ['啥', '说', '咋', '老张', '出啥'],
        expectNotContain: ['谁惹你', '消消气', '沾沾喜气', '教我两手']
    }
];

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  陈述句选项语境测试 — 验证玩家选项是否贴合NPC陈述句语境              ║');
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

    var options = DailyEngine.generateLiveOptions(npcId, tc.npcSpeech, state, 50);

    console.log('  生成的玩家选项:');
    var hasExpected = false;
    var hasUnexpected = false;
    var unexpectedOpts = [];
    options.forEach(function(opt, i) {
        var optText = opt.playerOption || opt;
        var marks = [];
        // 检查是否包含期望语义
        tc.expectOptionsContain.forEach(function(exp) {
            if (optText.indexOf(exp) >= 0) {
                marks.push('✓含"' + exp + '"');
                hasExpected = true;
            }
        });
        // 检查是否包含不应出现的语义
        tc.expectNotContain.forEach(function(notExp) {
            if (optText.indexOf(notExp) >= 0) {
                marks.push('✗含"' + notExp + '"');
                hasUnexpected = true;
                unexpectedOpts.push(optText);
            }
        });
        var markStr = marks.length > 0 ? ' ' + marks.join(' ') : '';
        console.log('    [' + (i + 1) + '] ' + optText + ' (intent=' + opt.intent + ')' + markStr);
    });

    if (hasExpected && !hasUnexpected) {
        console.log('  ✅ 通过：选项贴合语境');
        passCount++;
    } else {
        var reasons = [];
        if (!hasExpected) reasons.push('未包含期望语义');
        if (hasUnexpected) reasons.push('包含不应出现的选项: ' + unexpectedOpts.join('/'));
        console.log('  ❌ 失败：' + reasons.join('；'));
        failCount++;
        issues.push({ scene: tc.scene, npcSpeech: tc.npcSpeech, options: options.map(function(o) { return o.playerOption; }), reasons: reasons });
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
        console.log('  [' + (i + 1) + '] ' + iss.scene + ' (NPC: "' + iss.npcSpeech + '")');
        console.log('      选项: ' + iss.options.join(' / '));
        console.log('      原因: ' + iss.reasons.join('；'));
    });
}
