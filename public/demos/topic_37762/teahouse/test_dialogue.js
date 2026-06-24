/**
 * 对话系统测试脚本 v2 - 验证性格偏移机制、9维personality、soul_tick加强
 * 运行方式: node test_dialogue.js
 */

// ── Mock 全局依赖 ──
global.window = global;

var _mockWeather = { id: 'clear', name: '晴天' };
var _mockSeason = 'spring';
var _mockPeriod = 'morning';

global.GameTime = {
    getWeather: function() { return _mockWeather; },
    getSeason: function() { return _mockSeason; },
    getCurrentPeriod: function() { return _mockPeriod; },
    _setWeather: function(w) { _mockWeather = w; }
};

var _mockRelations = {};
global.getRel = function(npcId) { return _mockRelations[npcId] || 30; };

var fs = require('fs');
var path = require('path');
var engineCode = fs.readFileSync(path.join(__dirname, 'daily_engine.js'), 'utf8');
eval(engineCode);

// ── 辅助 ──
function setWeather(id, name) { _mockWeather = { id: id, name: name || id }; }
function setRelation(npcId, val) { _mockRelations[npcId] = val; }
function sep(title) { console.log('\n' + '='.repeat(60) + '\n  ' + title + '\n' + '='.repeat(60)); }
function sub(title) { console.log('\n── ' + title + ' ──'); }

// ── 测试1: 同类型NPC差异化 - 性格偏移让同类型NPC说话不同 ──
sep('测试1: 同类型NPC差异化 - 性格偏移效果');

// 选3个teahouse_regular类型NPC
var teaNpcs = ['lao_chen', 'zhao_shen', 'xiao_liu'];
setRelation('lao_chen', 50);
setRelation('zhao_shen', 50);
setRelation('xiao_liu', 50);

teaNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    DailyEngine.generateDailyState(npcId);
    var dlg = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    var p = profile.personality;
    console.log(profile.name + ' (warmth:' + p.warmth + ' humor:' + p.humor + ' stubbornness:' + p.stubbornness + ' caution:' + p.caution + ')');
    console.log('  开场: ' + dlg.opening);
    console.log('  话题: ' + dlg.topic);
});

// ── 测试2: 同类型artisan差异化 ──
sep('测试2: artisan类型差异化 - 铁匠赵 vs 木匠孙 vs 厨娘刘');

var artisanNpcs = ['tie_zhao', 'mu_sun', 'chu_liu'];
setRelation('tie_zhao', 50);
setRelation('mu_sun', 50);
setRelation('chu_liu', 50);

artisanNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    DailyEngine.generateDailyState(npcId);
    var dlg = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    var p = profile.personality;
    console.log(profile.name + ' (warmth:' + p.warmth + ' humor:' + p.humor + ' stubbornness:' + p.stubbornness + ' caution:' + p.caution + ')');
    console.log('  开场: ' + dlg.opening);
    console.log('  话题: ' + dlg.topic);
});

// ── 测试3: 同类型merchant差异化 ──
sep('测试3: merchant类型差异化 - 王掌柜 vs 布匹李 vs 鱼贩张');

var merchantNpcs = ['wang_zhanggui', 'bu_li', 'yu_fan_zhang'];
setRelation('wang_zhanggui', 50);
setRelation('bu_li', 50);
setRelation('yu_fan_zhang', 50);

merchantNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    DailyEngine.generateDailyState(npcId);
    var dlg = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    var p = profile.personality;
    console.log(profile.name + ' (warmth:' + p.warmth + ' humor:' + p.humor + ' stubbornness:' + p.stubbornness + ' caution:' + p.caution + ')');
    console.log('  开场: ' + dlg.opening);
    console.log('  话题: ' + dlg.topic);
});

// ── 测试4: 性格偏移在回复中的体现 ──
sep('测试4: 回复中的性格偏移 - 高热情vs低热情vs高固执vs高谨慎');

// 赵婶(高热情) vs 独行客(低热情) vs 铁匠赵(高固执) vs 更夫老周(高谨慎) vs 苏师姐(高自尊) vs 私塾先生(高耐心)
var contrastNpcs = [
    { id: 'zhao_shen', label: '高热情(赵婶)', key: 'warmth:90' },
    { id: 'du_xing', label: '低热情+低耐心(独行客)', key: 'warmth:5 patience:20' },
    { id: 'tie_zhao', label: '高固执+高自尊(铁匠赵)', key: 'stubbornness:80 pride:75' },
    { id: 'gengfu_zhou', label: '高谨慎+高耐心(更夫老周)', key: 'caution:80 patience:80' },
    { id: 'su_shijie', label: '高自尊+低耐心(苏师姐)', key: 'pride:85 patience:30' },
    { id: 'si_shu_xiansheng', label: '高耐心+高自尊(私塾先生)', key: 'patience:85 pride:70' }
];

contrastNpcs.forEach(function(item) {
    var profile = DailyEngine.getNpcProfile(item.id);
    DailyEngine.generateDailyState(item.id);
    setRelation(item.id, 50);
    // 模拟连续对话，recentUtterances累积
    var replies = [];
    var utterances = ['今天天气不错。'];
    for (var i = 0; i < 3; i++) {
        var dlgCtx = {
            turnCount: i + 1,
            lastNpcText: utterances[utterances.length - 1],
            currentTopic: '天气',
            recentUtterances: utterances.slice(-3),
            sessionTurn: i + 1
        };
        var reply = DailyEngine.generateFollowUpReply(item.id, '嗯嗯', 'listen', dlgCtx);
        replies.push(reply);
        utterances.push(reply);
    }
    console.log(item.label + ' [' + item.key + ']:');
    replies.forEach(function(r, i) {
        console.log('  回复' + (i+1) + ': ' + r);
    });
});

// ── 测试5: 9维personality完整性检查 ──
sep('测试5: 12维personality完整性检查');

var allIds = DailyEngine.getAllNpcIds();
var requiredDims = ['social', 'curiosity', 'emotion', 'diligence', 'adventure', 'warmth', 'humor', 'stubbornness', 'caution', 'patience', 'pride', 'loyalty'];
var missingCount = 0;

allIds.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    if (!profile || !profile.personality) {
        console.log('  ⚠️ ' + npcId + ': 缺少personality');
        missingCount++;
        return;
    }
    var missing = [];
    requiredDims.forEach(function(dim) {
        if (profile.personality[dim] === undefined) {
            missing.push(dim);
        }
    });
    if (missing.length > 0) {
        console.log('  ⚠️ ' + profile.name + ': 缺少维度 ' + missing.join(', '));
        missingCount++;
    }
});
if (missingCount === 0) {
    console.log('  ✓ 所有NPC的12维personality完整');
}

// ── 测试6: 话题类别偏移 - 高社交vs高冒险 ──
sep('测试6: 话题类别偏移 - 高社交NPC偏向社交话题');

// 赵婶(social:90) vs 独行客(social:10)
setWeather('clear', '晴天');
setRelation('zhao_shen', 50);
setRelation('du_xing', 50);

var zhaoTopics = [];
var duTopics = [];
for (var t = 0; t < 5; t++) {
    DailyEngine.generateDailyState('zhao_shen');
    var dlg1 = DailyEngine.generateContextDialogue('zhao_shen', 'acquaintance');
    zhaoTopics.push(dlg1.topic);

    DailyEngine.generateDailyState('du_xing');
    var dlg2 = DailyEngine.generateContextDialogue('du_xing', 'acquaintance');
    duTopics.push(dlg2.topic);
}

console.log('赵婶(social:90)的话题:');
zhaoTopics.forEach(function(t, i) { console.log('  ' + (i+1) + ': ' + t); });
console.log('独行客(social:10)的话题:');
duTopics.forEach(function(t, i) { console.log('  ' + (i+1) + ': ' + t); });

// ── 测试7: 3轮对话 - 多个NPC对比 ──
sep('测试7: 3轮对话对比 - 赵婶(高热情) vs 独行客(低热情)');

var testNpcs = ['zhao_shen', 'du_xing'];
testNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    DailyEngine.generateDailyState(npcId);
    setRelation(npcId, 50);

    sub(profile.name);
    var dlg = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    var npcText = dlg.opening;
    if (dlg.topic) {
        // 智能拼接：避免！，或。，等不自然组合
        var last = npcText.charAt(npcText.length - 1);
        if (last === '。' || last === '！' || last === '？' || last === '……') {
            npcText = npcText + dlg.topic;
        } else {
            npcText = npcText + '，' + dlg.topic;
        }
    }
    console.log('  NPC: ' + npcText);

    var state = DailyEngine.getDailyState(npcId);
    var options = DailyEngine.generateLiveOptions(npcId, npcText, state, 50);
    var optTexts = options.map(function(o) { return o.playerOption || o; });
    console.log('  选项: ' + JSON.stringify(optTexts));

    var playerOption = optTexts[0] || '嗯。';
    console.log('  玩家: ' + playerOption);

    var dlgCtx = {
        turnCount: 1,
        lastNpcText: npcText,
        currentTopic: dlg.topic || '',
        recentUtterances: [npcText],
        sessionTurn: 1
    };
    var reply = DailyEngine.generateFollowUpReply(npcId, playerOption, 'listen', dlgCtx);
    console.log('  NPC回复: ' + reply);

    // 第2轮
    var options2 = DailyEngine.generateLiveOptions(npcId, reply, state, 50, playerOption);
    var optTexts2 = options2.map(function(o) { return o.playerOption || o; });
    var playerOption2 = optTexts2[0] || '然后呢？';
    console.log('  玩家: ' + playerOption2);

    dlgCtx.turnCount = 2;
    dlgCtx.lastNpcText = reply;
    dlgCtx.recentUtterances.push(reply);
    var reply2 = DailyEngine.generateFollowUpReply(npcId, playerOption2, 'listen', dlgCtx);
    console.log('  NPC回复: ' + reply2);
});

// ── 测试8: 天气感知 + 性格偏移组合 ──
sep('测试8: 天气+性格偏移组合 - 下雨时不同NPC的反应');

setWeather('rainy', '下雨');
var rainNpcs = ['zhao_shen', 'du_xing', 'wang_zhanggui', 'chu_liu'];
rainNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    DailyEngine.generateDailyState(npcId);
    setRelation(npcId, 50);
    var dlg = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    console.log(profile.name + ': ' + dlg.topic);
});

setWeather('clear', '晴天');

// ── 测试9: 忠诚度偏移 - 结束语差异 ──
sep('测试9: 忠诚度偏移 - 高忠诚vs低忠诚的结束语');

var loyaltyNpcs = [
    { id: 'a_fu', label: '阿福(高忠诚:80)' },
    { id: 'du_xing', label: '独行客(低忠诚:15)' },
    { id: 'zhao_shen', label: '赵婶(高忠诚:85)' },
    { id: 'yan_lord', label: '焰主(低忠诚:30)' }
];

loyaltyNpcs.forEach(function(item) {
    var profile = DailyEngine.getNpcProfile(item.id);
    DailyEngine.generateDailyState(item.id);
    setRelation(item.id, 60);
    var dlg = DailyEngine.generateContextDialogue(item.id, 'friend');
    console.log(item.label + ': ' + dlg.closing);
});

// ── 测试10: topicWord质量验证 ──
sep('测试10: topicWord质量验证 - 不自然词应被过滤');

var testTopicWords = [
    { word: '茶馆', expected: true, reason: '名词，适合造句' },
    { word: '打铁', expected: true, reason: '动名词，适合造句' },
    { word: '真舒坦', expected: false, reason: '形容词，不适合' },
    { word: '还行吧', expected: false, reason: '含语气词，不适合' },
    { word: '小路', expected: true, reason: '名词，适合造句' },
    { word: '闷', expected: false, reason: '单字情绪词，不适合' },
    { word: '其实', expected: false, reason: '连词，不适合' },
    { word: '下雨', expected: true, reason: '动名词，适合造句' },
    { word: '开心', expected: false, reason: '形容词，不适合' },
    { word: '客人', expected: true, reason: '名词，适合造句' }
];

var validFn = DailyEngine._isValidTopicWord;
var passCount = 0;
testTopicWords.forEach(function(item) {
    var result = validFn ? validFn(item.word) : 'N/A';
    var pass = result === item.expected;
    if (pass) passCount++;
    console.log('  ' + item.word + ' → ' + result + (pass ? ' ✓' : ' ✗') + ' (' + item.reason + ')');
});
console.log('  通过: ' + passCount + '/' + testTopicWords.length);

// ── 总结 ──
sep('测试完成');
console.log('以上测试覆盖:');
console.log('  1. 同类型NPC差异化 (teahouse_regular/artisan/merchant)');
console.log('  2. 回复中的性格偏移 (高热情/低热情/高固执/高谨慎)');
console.log('  3. 9维personality完整性检查');
console.log('  4. 话题类别偏移 (高社交vs低社交)');
console.log('  5. 3轮对话对比 (赵婶vs独行客)');
console.log('  6. 天气+性格偏移组合');
