/**
 * 对话连贯性诊断脚本
 * 模拟真实游戏多轮对话，找出"前言不搭后语/各说各的"根本原因
 */

global.window = global;
var _mockWeather = { id: 'sunny', name: '晴天' };
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
console.log('║  对话连贯性诊断 - 模拟真实多轮对话                                   ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

// 测试3个NPC，每个跑3轮完整对话
var testNpcs = ['wang_zhanggui', 'tie_zhao', 'du_xing'];

testNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    if (!profile) { console.log('找不到NPC: ' + npcId); return; }

    DailyEngine.generateDailyState(npcId);
    var state = DailyEngine.getDailyState(npcId);

    console.log('\n═════════════════════════════════════════════════════════════════════');
    console.log('【' + profile.name + '】 性格: ' + JSON.stringify(profile.personality).substring(0, 80));
    console.log('═════════════════════════════════════════════════════════════════════');

    // 第1轮：开场白
    var dlgCtx = { turnCount: 0, lastNpcText: '', currentTopic: '', relStr: 'stranger' };
    var dlgObj = DailyEngine.generateContextDialogue(npcId, 'stranger');
    var opening = dlgObj ? dlgObj.fullDialogue : '……';
    console.log('\n[轮1-开场] NPC: ' + opening);
    dlgCtx.lastNpcText = opening;
    dlgCtx.currentTopic = dlgObj ? dlgObj.topic : '';
    dlgCtx.turnCount = 1;

    // 第1轮：生成选项
    var options1 = DailyEngine.generateLiveOptions(npcId, opening, dlgCtx, 'stranger');
    console.log('[轮1-玩家选项]');
    options1.forEach(function(opt, i) {
        console.log('  ' + (i + 1) + '. ' + opt.playerOption + ' (intent=' + opt.intent + ')');
    });

    // 选第1个选项
    if (options1.length > 0) {
        var chosen1 = options1[0];
        console.log('[轮1-玩家选] ' + chosen1.playerOption);
        var reply1 = DailyEngine.generateFollowUpReply(npcId, chosen1.playerOption, chosen1.intent, dlgCtx);
        console.log('[轮1-NPC回复] ' + reply1);
        dlgCtx.lastNpcText = reply1;
        dlgCtx.lastPlayerOption = chosen1.playerOption;
        dlgCtx.turnCount = 2;

        // 第2轮：生成选项
        var options2 = DailyEngine.generateLiveOptions(npcId, reply1, dlgCtx, 'stranger', chosen1.playerOption);
        console.log('\n[轮2-玩家选项] (基于NPC回复: "' + reply1.substring(0, 30) + '...")');
        options2.forEach(function(opt, i) {
            console.log('  ' + (i + 1) + '. ' + opt.playerOption + ' (intent=' + opt.intent + ')');
        });

        if (options2.length > 0) {
            var chosen2 = options2[0];
            console.log('[轮2-玩家选] ' + chosen2.playerOption);
            var reply2 = DailyEngine.generateFollowUpReply(npcId, chosen2.playerOption, chosen2.intent, dlgCtx);
            console.log('[轮2-NPC回复] ' + reply2);
            dlgCtx.lastNpcText = reply2;
            dlgCtx.lastPlayerOption = chosen2.playerOption;
            dlgCtx.turnCount = 3;

            // 第3轮
            var options3 = DailyEngine.generateLiveOptions(npcId, reply2, dlgCtx, 'stranger', chosen2.playerOption);
            console.log('\n[轮3-玩家选项] (基于NPC回复: "' + reply2.substring(0, 30) + '...")');
            options3.forEach(function(opt, i) {
                console.log('  ' + (i + 1) + '. ' + opt.playerOption + ' (intent=' + opt.intent + ')');
            });

            if (options3.length > 0) {
                var chosen3 = options3[0];
                console.log('[轮3-玩家选] ' + chosen3.playerOption);
                var reply3 = DailyEngine.generateFollowUpReply(npcId, chosen3.playerOption, chosen3.intent, dlgCtx);
                console.log('[轮3-NPC回复] ' + reply3);
            }
        }
    }
});

// ── 诊断2：检查选项与NPC上一句话的关联性 ──
console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  诊断2: 选项与NPC上一句话的关联性检查                                ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var testSpeeches = [
    '今天生意不好，亏了不少。',
    '我儿子要考书院了，愁人。',
    '昨天路上碰到狼了，吓死我了。'
];

testSpeeches.forEach(function(npcSpeech) {
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ NPC说: "' + npcSpeech + '"');
    console.log('└─────────────────────────────────────────────────────────────────────┘');

    ['wang_zhanggui', 'tie_zhao', 'du_xing'].forEach(function(npcId) {
        var profile = DailyEngine.getNpcProfile(npcId);
        if (!profile) { console.log('  找不到NPC: ' + npcId); return; }
        DailyEngine.generateDailyState(npcId);
        var dlgCtx = { turnCount: 1, lastNpcText: npcSpeech, currentTopic: '', relStr: 'stranger' };
        var options = DailyEngine.generateLiveOptions(npcId, npcSpeech, dlgCtx, 'stranger');
        console.log('  [' + profile.name + '] 选项:');
        options.forEach(function(opt, i) {
            // 检查选项是否与NPC话题相关
            var related = _checkRelated(opt.playerOption, npcSpeech);
            console.log('    ' + (i + 1) + '. ' + opt.playerOption + ' (intent=' + opt.intent + ') ' + (related ? '✓相关' : '✗无关'));
        });
    });
});

function _checkRelated(option, speech) {
    // 简单关键词匹配
    var speechWords = speech.replace(/[，。？！、]/g, '').split('');
    var optionWords = option.replace(/[，。？！、]/g, '').split('');
    var matchCount = 0;
    optionWords.forEach(function(w) {
        if (speechWords.indexOf(w) >= 0) matchCount++;
    });
    return matchCount >= 1;
}

// ── 诊断3：检查NPC回复与玩家选项的关联性 ──
console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  诊断3: NPC回复与玩家选项的关联性检查                                ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var testPairs = [
    { npcSpeech: '今天生意不好，亏了不少。', playerOption: '亏了多少？', intent: 'detail' },
    { npcSpeech: '我儿子要考书院了，愁人。', playerOption: '有把握吗？', intent: 'probe' },
    { npcSpeech: '昨天路上碰到狼了，吓死我了。', playerOption: '后来咋办的？', intent: 'detail' },
    { npcSpeech: '今天天气不错。', playerOption: '是啊，适合出门。', intent: 'agree' },
    { npcSpeech: '最近生意怎么样？', playerOption: '还行吧。', intent: 'answer' }
];

testPairs.forEach(function(tp) {
    console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
    console.log('│ NPC说: "' + tp.npcSpeech + '"');
    console.log('│ 玩家选: "' + tp.playerOption + '" (intent=' + tp.intent + ')');
    console.log('└─────────────────────────────────────────────────────────────────────┘');

    ['wang_zhanggui', 'tie_zhao', 'du_xing'].forEach(function(npcId) {
        var profile = DailyEngine.getNpcProfile(npcId);
        if (!profile) { console.log('  找不到NPC: ' + npcId); return; }
        DailyEngine.generateDailyState(npcId);
        var dlgCtx = { turnCount: 1, lastNpcText: tp.npcSpeech, currentTopic: '', relStr: 'stranger' };
        var reply = DailyEngine.generateFollowUpReply(npcId, tp.playerOption, tp.intent, dlgCtx);
        var related = _checkRelated(reply, tp.playerOption + tp.npcSpeech);
        console.log('  [' + profile.name + '] 回复: ' + reply + (related ? ' ✓相关' : ' ✗无关'));
    });
});

console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  诊断完成 - 请根据上方输出分析问题                                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
