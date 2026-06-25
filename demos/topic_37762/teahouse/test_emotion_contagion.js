/**
 * 情绪传染+跨日继承测试
 * 验证：愤怒值跨日衰减、记忆影响次日心情、情绪传染
 */

global.window = global;
var _mockWeather = { id: 'clear', name: '晴天' };
global.GameTime = {
    getWeather: function() { return _mockWeather; },
    getSeason: function() { return 'spring'; },
    getCurrentPeriod: function() { return 'morning'; }
};

var _mockRelations = {};
global.getRel = function(npcId) { return _mockRelations[npcId] !== undefined ? _mockRelations[npcId] : 50; };
global.adjRel = function(npcId, delta) {
    if (_mockRelations[npcId] === undefined) _mockRelations[npcId] = 50;
    _mockRelations[npcId] = Math.max(0, Math.min(100, _mockRelations[npcId] + delta));
};

var _mockStates = {};
global.SoulTick = {
    getNpcState: function(npcId) {
        if (!_mockStates[npcId]) {
            _mockStates[npcId] = {
                npcId: npcId, mood: 60,
                memory: { shortTerm: [], longTerm: [], important: [] }
            };
        }
        return _mockStates[npcId];
    }
};
global.SoulBridge = {
    ensureSchedulerState: function(state, profile) {
        if (!state) return state;
        state.memory = state.memory || { shortTerm: [], longTerm: [], important: [] };
        state.cooldowns = state.cooldowns || { social: 0, location: {}, event: {} };
        return state;
    },
    addTaggedMemory: function(state, memoryType, category, content, meta) {
        if (!state || !state.memory) return;
        var memory = {
            id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: memoryType, category: category, content: content,
            timestamp: Date.now(),
            importance: meta.importance || 50,
            emotionValue: meta.emotionValue || 0,
            confidence: meta.confidence || 1.0,
            tags: meta.tags || []
        };
        if (memoryType === 'important') state.memory.important.push(memory);
        else if (memoryType === 'long_term') state.memory.longTerm.push(memory);
        else if (memoryType === 'short_term') state.memory.shortTerm.push(memory);
    },
    getTopMemories: function(state, tags, limit) {
        if (!state || !state.memory) return [];
        limit = limit || 3;
        var all = (state.memory.shortTerm || []).concat(state.memory.longTerm || []).concat(state.memory.important || []);
        all.sort(function(a, b) { return b.importance - a.importance; });
        if (!tags || tags.length === 0) return all.slice(0, limit);
        var result = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].tags && all[i].tags.length > 0) {
                for (var j = 0; j < tags.length; j++) {
                    if (all[i].tags.indexOf(tags[j]) >= 0) { result.push(all[i]); break; }
                }
            }
            if (result.length >= limit) break;
        }
        return result;
    },
    getGoalName: function(g) { return g || ''; }
};

var fs = require('fs');
var path = require('path');
eval(fs.readFileSync(path.join(__dirname, 'daily_engine.js'), 'utf8'));

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  情绪传染+跨日继承测试                                               ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var passCount = 0;
var failCount = 0;
function assert(cond, msg) {
    if (cond) { console.log('  ✅ ' + msg); passCount++; }
    else { console.log('  ❌ ' + msg); failCount++; }
}

function resetAngerState(npcId) {
    var st = DailyEngine.getDailyState(npcId);
    if (st) {
        st.angerLevel = 0; st.coldTurns = 0; st.angerHistory = [];
        st._lastReplyWasAnger = false; st._coldTurnsDecremented = false;
    }
}

// ── 测试1：愤怒值跨日衰减50% ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试1: 愤怒值跨日衰减50%                                            │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
var npcId = 'tie_zhao';
var profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
var state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 20;

// 触发愤怒（angerLevel达到约80）
var dlgCtx = { turnCount: 1, lastNpcText: '最近命苦啊，倒霉蛋一个。', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '沾沾喜气！', 'celebrate', dlgCtx);
dlgCtx = { turnCount: 2, lastNpcText: '你压根没把我说的当回事。', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '哈哈，吹吧你。', 'tease', dlgCtx);
var angerBeforeDayEnd = state.angerLevel;
console.log('  日终前 angerLevel=' + angerBeforeDayEnd);

// 日终保存
DailyEngine._dayEndSave();

// 次日重新生成state
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
var angerAfterNewDay = state.angerLevel;
console.log('  次日 angerLevel=' + angerAfterNewDay);

assert(angerAfterNewDay > 0, '次日应继承部分愤怒值（>0）');
assert(angerAfterNewDay < angerBeforeDayEnd, '次日愤怒值应衰减（<日终前）');
assert(angerAfterNewDay === Math.round(angerBeforeDayEnd * 0.5), '应衰减50%');

// ── 测试2：愤怒影响次日心情 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试2: 愤怒余波影响次日心情（每10点愤怒降1点心情）                    │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
// NPC A：有愤怒值
npcId = 'tie_zhao';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 50;
state.angerLevel = 60; // 手动设置高愤怒
var moodBeforeDayEnd = state.mood;

DailyEngine._dayEndSave();
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
console.log('  前日 mood=' + moodBeforeDayEnd + ', angerLevel=60');
console.log('  次日 mood=' + state.mood + ', angerLevel=' + state.angerLevel);

// 次日心情 = 昨日mood(50) + 波动 + 季节(+5) - 愤怒余波(60*0.5/10=3)
// 愤怒余波 = inheritedAnger(30) / 10 = 3
assert(state.angerLevel === 30, '次日愤怒值应为30（60*0.5）');

// ── 测试3：情绪传染——NPC心情向群体平均靠拢 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试3: 情绪传染——NPC心情向群体平均靠拢                               │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
// 为多个NPC生成state，设置差异大的心情
var allIds = DailyEngine.getAllNpcIds();
for (var i = 0; i < allIds.length; i++) {
    DailyEngine.generateDailyState(allIds[i]);
}

// 手动设置差异大的心情
var lowMoodNpc = allIds[0];
var highMoodNpc = allIds[1];
DailyEngine.getDailyState(lowMoodNpc).mood = 20; // 极低
DailyEngine.getDailyState(highMoodNpc).mood = 90; // 极高
var lowMoodBefore = DailyEngine.getDailyState(lowMoodNpc).mood;
var highMoodBefore = DailyEngine.getDailyState(highMoodNpc).mood;
console.log('  传染前: ' + lowMoodNpc + ' mood=' + lowMoodBefore + ', ' + highMoodNpc + ' mood=' + highMoodBefore);

// 应用情绪传染
var result = DailyEngine.applyEmotionContagion();
console.log('  群体平均mood=' + result.avgMood);
console.log('  调整数=' + result.adjustedCount);
var lowMoodAfter = DailyEngine.getDailyState(lowMoodNpc).mood;
var highMoodAfter = DailyEngine.getDailyState(highMoodNpc).mood;
console.log('  传染后: ' + lowMoodNpc + ' mood=' + lowMoodAfter + ', ' + highMoodNpc + ' mood=' + highMoodAfter);

assert(result.applied, '情绪传染应成功应用');
assert(result.adjustedCount > 0, '应有NPC被调整');
assert(lowMoodAfter > lowMoodBefore, '低心情NPC应向群体平均靠拢（mood上升）');
assert(highMoodAfter < highMoodBefore, '高心情NPC应向群体平均靠拢（mood下降）');

// ── 测试4：愤怒中的NPC不容易被传染 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试4: 愤怒中的NPC不容易被传染                                       │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
allIds = DailyEngine.getAllNpcIds();
for (var j = 0; j < allIds.length; j++) {
    DailyEngine.generateDailyState(allIds[j]);
}

// 设置一个NPC心情极低且愤怒
var angryNpc = allIds[0];
DailyEngine.getDailyState(angryNpc).mood = 20;
DailyEngine.getDailyState(angryNpc).angerLevel = 80; // 高愤怒
var angryMoodBefore = DailyEngine.getDailyState(angryNpc).mood;

// 其他NPC心情高
for (var k = 1; k < allIds.length; k++) {
    DailyEngine.getDailyState(allIds[k]).mood = 85;
}

result = DailyEngine.applyEmotionContagion();
var angryMoodAfter = DailyEngine.getDailyState(angryNpc).mood;
console.log('  愤怒NPC传染前 mood=' + angryMoodBefore + ', 传染后 mood=' + angryMoodAfter);
console.log('  群体平均mood=' + result.avgMood);

// 愤怒NPC的传染率降低70%，所以调整幅度应该很小
var adjustment = angryMoodAfter - angryMoodBefore;
console.log('  调整量=' + adjustment);
assert(Math.abs(adjustment) < 10, '愤怒NPC调整量应较小（<10）');

// ── 测试5：冷淡期跨日清零 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试5: 冷淡期跨日清零                                                │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao';
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 20;
state.coldTurns = 4; // 设置冷淡期
console.log('  日终前 coldTurns=' + state.coldTurns);

DailyEngine._dayEndSave();
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
console.log('  次日 coldTurns=' + state.coldTurns);

assert(state.coldTurns === 0, '次日冷淡期应清零');

// ── 测试6：NPC主动话题——心情极低时倾诉 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试6: NPC主动话题——心情极低时倾诉                                   │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao';
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 15; // 极低心情

var foundSadOpening = false;
var sampleOpening = '';
for (var m = 0; m < 10; m++) {
    var dlg = DailyEngine.generateContextDialogue(npcId, 50);
    sampleOpening = dlg.fullDialogue || '';
    if (sampleOpening.indexOf('不痛快') >= 0 || sampleOpening.indexOf('烦') >= 0 ||
        sampleOpening.indexOf('念叨') >= 0 || sampleOpening.indexOf('说说话') >= 0 ||
        sampleOpening.indexOf('不太好') >= 0 || sampleOpening.indexOf('也就你') >= 0) {
        foundSadOpening = true;
        break;
    }
}
console.log('  开场白样本: ' + sampleOpening);
assert(foundSadOpening, '心情极低时应出现倾诉类主动话题');

// ── 测试7：NPC主动话题——心情极高时分享喜悦 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试7: NPC主动话题——心情极高时分享喜悦                               │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'wang_zhanggui';
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 90; // 极高心情

var foundJoyOpening = false;
sampleOpening = '';
for (var n = 0; n < 10; n++) {
    var dlg2 = DailyEngine.generateContextDialogue(npcId, 50);
    sampleOpening = dlg2.fullDialogue || '';
    if (sampleOpening.indexOf('高兴') >= 0 || sampleOpening.indexOf('好事') >= 0 ||
        sampleOpening.indexOf('运气') >= 0 || sampleOpening.indexOf('分享') >= 0) {
        foundJoyOpening = true;
        break;
    }
}
console.log('  开场白样本: ' + sampleOpening);
assert(foundJoyOpening, '心情极高时应出现分享喜悦类主动话题');

// ── 测试8：NPC主动话题——愤怒余气时带刺 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试8: NPC主动话题——愤怒余气时带刺                                   │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao';
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 50;
state.angerLevel = 60; // 高愤怒
state.coldTurns = 2;

var foundAngryOpening = false;
sampleOpening = '';
for (var o = 0; o < 10; o++) {
    var dlg3 = DailyEngine.generateContextDialogue(npcId, 50);
    sampleOpening = dlg3.fullDialogue || '';
    if (sampleOpening.indexOf('没好气') >= 0 || sampleOpening.indexOf('哼') >= 0 ||
        sampleOpening.indexOf('爱理不理') >= 0 || sampleOpening.indexOf('不想说话') >= 0 ||
        sampleOpening.indexOf('又来了') >= 0 || sampleOpening.indexOf('记得来') >= 0) {
        foundAngryOpening = true;
        break;
    }
}
console.log('  开场白样本: ' + sampleOpening);
assert(foundAngryOpening, '愤怒余气时应出现带刺类主动话题');

// ── 结果汇总 ──
console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + (passCount + failCount));
console.log('  失败: ' + failCount + '/' + (passCount + failCount));
