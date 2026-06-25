/**
 * NPC骗人系统测试
 * 验证：基于性格+身份+记忆+情绪判断是否骗人，被质疑反应
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
console.log('║  NPC骗人系统测试                                                     ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var passCount = 0;
var failCount = 0;
function assert(cond, msg) {
    if (cond) { console.log('  ✅ ' + msg); passCount++; }
    else { console.log('  ❌ ' + msg); failCount++; }
}

function resetState(npcId) {
    var st = DailyEngine.getDailyState(npcId);
    if (st) {
        st.angerLevel = 0; st.coldTurns = 0; st.angerHistory = [];
        st._lastReplyWasAnger = false; st._coldTurnsDecremented = false;
        st._lastReplyWasLie = false;
    }
}

// ── 测试1：商人被问到生意 → 夸大（骗人倾向高） ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试1: 商人王掌柜被问到生意 → 夸大                                   │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
var npcId = 'wang_zhanggui'; // 王掌柜，merchant，caution=65, loyalty=55
var profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
var state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 50;
_mockRelations[npcId] = 30; // 低好感，不阻碍骗人

var tendency = DailyEngine._calculateDeceitTendency ? DailyEngine._calculateDeceitTendency(profile, state, 30) : 0;
console.log('  王掌柜骗人倾向: ' + tendency);

var dlgCtx = { turnCount: 1, lastNpcText: '最近生意一般般。', currentTopic: '' };
var reply = DailyEngine.generateFollowUpReply(npcId, '生意咋样？赚了不少吧？', 'ask_trade', dlgCtx);
console.log('  NPC回复: ' + reply);

// 商人+低好感+被问生意，应该触发夸大
assert(state._lastReplyWasLie === true, '应标记为在骗人');
assert(reply.indexOf('还行') >= 0 || reply.indexOf('凑合') >= 0 || reply.indexOf('马马虎虎') >= 0 ||
       reply.indexOf('大主顾') >= 0 || reply.indexOf('大单子') >= 0,
       '应包含夸大话术（还行/凑合/马马虎虎/大主顾/大单子）');

// ── 测试2：散修被问到过去 → 编故事 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试2: 散修独行客被问到过去 → 编故事                                 │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'du_xing'; // 独行客，wanderer，caution=90, loyalty=15
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 50;
_mockRelations[npcId] = 20; // 低好感

tendency = DailyEngine._calculateDeceitTendency ? DailyEngine._calculateDeceitTendency(profile, state, 20) : 0;
console.log('  独行客骗人倾向: ' + tendency);

dlgCtx = { turnCount: 1, lastNpcText: '嗯。', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '你以前从哪来？', 'ask_travel', dlgCtx);
console.log('  NPC回复: ' + reply);

assert(state._lastReplyWasLie === true, '应标记为在骗人');
assert(reply.indexOf('记不太清') >= 0 || reply.indexOf('好像') >= 0 ||
       reply.indexOf('具体不说') >= 0 || reply.indexOf('最远到过') >= 0,
       '应包含编故事话术（记不太清/好像/具体不说/最远到过）');

// ── 测试3：高好感NPC不骗人 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试3: 高好感（≥70）NPC不骗人                                        │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'wang_zhanggui';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 50;
_mockRelations[npcId] = 80; // 高好感

tendency = DailyEngine._calculateDeceitTendency ? DailyEngine._calculateDeceitTendency(profile, state, 80) : 0;
console.log('  高好感时骗人倾向: ' + tendency);

assert(tendency < 45, '高好感时骗人倾向应<45（不触发骗人）');

// ── 测试4：手艺人（artisan）骗人倾向低 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试4: 手艺人铁匠赵骗人倾向低                                        │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao'; // 铁匠赵，artisan，caution=60, loyalty=50
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 50;
_mockRelations[npcId] = 30;

tendency = DailyEngine._calculateDeceitTendency ? DailyEngine._calculateDeceitTendency(profile, state, 30) : 0;
console.log('  铁匠赵骗人倾向: ' + tendency);

// artisan有-10修正，且caution=60不算太高
assert(tendency < 50, '手艺人骗人倾向应较低（<50）');

// ── 测试5：被质疑反应——在骗人被质疑，高自尊死撑 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试5: 在骗人被质疑，高自尊NPC死撑                                   │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao'; // 铁匠赵，pride=75（高自尊）
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 50;
state._lastReplyWasLie = true; // 模拟上一轮在骗人

dlgCtx = { turnCount: 2, lastNpcText: '没事，小意思，早处理好了。', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '真的假的？', 'doubt', dlgCtx);
console.log('  NPC回复: ' + reply);

assert(reply.indexOf('不信拉倒') >= 0 || reply.indexOf('骗你不成') >= 0 ||
       reply.indexOf('爱信不信') >= 0 || reply.indexOf('骗人的人') >= 0,
       '高自尊NPC被质疑应死撑（不信拉倒/骗你不成/爱信不信）');

// ── 测试6：被质疑反应——在骗人被质疑，低自尊承认 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试6: 在骗人被质疑，低自尊NPC承认                                   │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'yu_fan_zhang'; // 鱼贩张，pride=30（低自尊）
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 50;
state._lastReplyWasLie = true;

dlgCtx = { turnCount: 2, lastNpcText: '生意？还行吧。', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '真的假的？', 'doubt', dlgCtx);
console.log('  NPC回复: ' + reply);

assert(reply.indexOf('没那么回事') >= 0 || reply.indexOf('看出来了') >= 0 ||
       reply.indexOf('说实话') >= 0 || reply.indexOf('没那么好') >= 0,
       '低自尊NPC被质疑可能承认（没那么回事/看出来了/说实话）');

// ── 测试7：没骗人被质疑 → 委屈/生气 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试7: 没骗人被质疑 → 委屈/生气                                      │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'a_fu'; // 阿福，pride=20（低自尊，但没骗人）
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 60;
state._lastReplyWasLie = false; // 没骗人

dlgCtx = { turnCount: 2, lastNpcText: '今天茶馆客人挺多。', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '真的假的？', 'doubt', dlgCtx);
console.log('  NPC回复: ' + reply);

assert(reply.indexOf('怀疑我') >= 0 || reply.indexOf('不信') >= 0 ||
       reply.indexOf('骗你干啥') >= 0 || reply.indexOf('看不起人') >= 0,
       '没骗人被质疑应委屈/生气（怀疑我/不信/骗你干啥/看不起人）');

// ── 测试8：愤怒中 → 恶意误导 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试8: 愤怒中 → 恶意误导                                            │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'wang_zhanggui';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 30;
state.angerLevel = 70; // 高愤怒
_mockRelations[npcId] = 20;

dlgCtx = { turnCount: 1, lastNpcText: '哼。', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '生意咋样？', 'ask_trade', dlgCtx);
console.log('  NPC回复: ' + reply);

// 愤怒中可能触发愤怒回复或恶意误导
assert(state._lastReplyWasAnger === true || state._lastReplyWasLie === true,
       '愤怒中应触发愤怒回复或恶意误导');

// ── 测试9：质疑选项出现在骗人倾向高的NPC选项中 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试9: 骗人倾向高的NPC选项中应出现质疑选项                           │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'du_xing'; // 独行客，高骗人倾向
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 50;
_mockRelations[npcId] = 20;

var options = DailyEngine.generateLiveOptions(npcId);
var hasDoubtOption = false;
for (var i = 0; i < options.length; i++) {
    if (options[i].intent === 'doubt') {
        hasDoubtOption = true;
        break;
    }
}
console.log('  选项数量: ' + options.length);
console.log('  有质疑选项: ' + hasDoubtOption);
assert(hasDoubtOption, '高骗人倾向NPC应有质疑选项（真的假的？）');

// ── 测试10：低骗人倾向NPC选项中不出现质疑选项 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试10: 低骗人倾向NPC选项中不出现质疑选项                            │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'a_fu'; // 阿福，caution=30, loyalty=80，骗人倾向低
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 70; // 心情好
_mockRelations[npcId] = 70; // 高好感

tendency = DailyEngine._calculateDeceitTendency ? DailyEngine._calculateDeceitTendency(profile, state, 70) : 0;
console.log('  阿福骗人倾向: ' + tendency);

options = DailyEngine.generateLiveOptions(npcId);
hasDoubtOption = false;
for (var j = 0; j < options.length; j++) {
    if (options[j].intent === 'doubt') {
        hasDoubtOption = true;
        break;
    }
}
console.log('  有质疑选项: ' + hasDoubtOption);
assert(!hasDoubtOption, '低骗人倾向NPC不应有质疑选项');
assert(tendency < 45, '阿福高好感时骗人倾向应<45');

// ── 结果汇总 ──
console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + (passCount + failCount));
console.log('  失败: ' + failCount + '/' + (passCount + failCount));
