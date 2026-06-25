/**
 * 裂痕系统测试
 * 验证：NPC自主意识驱动的事件（冲突/崩溃/触景生情/安慰）+ 关系网传播
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

// ── Mock EncounterSystem 关系网 ──
var _npcRelations = {};
global.EncounterSystem = {
    getRelation: function(npcA, npcB) {
        if (npcA === npcB) return 50;
        var key = npcA < npcB ? npcA + '+' + npcB : npcB + '+' + npcA;
        return _npcRelations[key] !== undefined ? _npcRelations[key] : 50;
    },
    updateRelation: function(npcA, npcB, delta, reason) {
        if (npcA === npcB) return;
        var key = npcA < npcB ? npcA + '+' + npcB : npcB + '+' + npcA;
        if (_npcRelations[key] === undefined) _npcRelations[key] = 50;
        _npcRelations[key] = Math.max(0, Math.min(100, _npcRelations[key] + delta));
    }
};

var fs = require('fs');
var path = require('path');
eval(fs.readFileSync(path.join(__dirname, 'daily_engine.js'), 'utf8'));

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  裂痕系统测试                                                        ║');
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

// ── 测试1：NPC崩溃——心情极低+社交需求高 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试1: NPC崩溃——心情<15 + 社交需求>70                               │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {}; _npcRelations = {};
var npcId = 'tie_zhao';
DailyEngine.generateDailyState(npcId);
var state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 10; // 极低
state.socialNeed = 80; // 高社交需求
state.angerLevel = 40; // 有愤怒更容易崩溃

var events = DailyEngine.detectRiftEvents();
var breakdownEvent = null;
for (var i = 0; i < events.length; i++) {
    if (events[i].type === 'npc_breakdown' && events[i].npcA === npcId) {
        breakdownEvent = events[i];
        break;
    }
}
console.log('  事件数量: ' + events.length);
if (breakdownEvent) console.log('  崩溃事件描述: ' + breakdownEvent.desc);

assert(breakdownEvent !== null, '应触发崩溃事件');
assert(breakdownEvent && breakdownEvent.desc.indexOf('铁匠赵') >= 0, '描述应包含NPC名字');

// 应用效果
if (breakdownEvent) {
    var result = DailyEngine.applyRiftEvent(breakdownEvent);
    console.log('  心情变化: ' + JSON.stringify(result.moodChanges));
    assert(result.applied === true, '应成功应用事件效果');
    assert(result.moodChanges.length > 0, '应有心情变化');
}

// ── 测试2：触景生情——在喜爱地点+心情低 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试2: 触景生情——在喜爱地点+心情<30                                  │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {}; _npcRelations = {};
npcId = 'tie_zhao';
var profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetState(npcId);
state.mood = 20;
state.decidedLocation = profile.favoriteLocation; // 在喜爱地点

// 多次尝试，因为有30%概率
var nostalgiaEvent = null;
for (var k = 0; k < 10; k++) {
    events = DailyEngine.detectRiftEvents();
    for (var j = 0; j < events.length; j++) {
        if (events[j].type === 'npc_nostalgia' && events[j].npcA === npcId) {
            nostalgiaEvent = events[j];
            break;
        }
    }
    if (nostalgiaEvent) break;
}
console.log('  触景生情事件: ' + (nostalgiaEvent ? nostalgiaEvent.desc : '未触发'));
assert(nostalgiaEvent !== null, '10次尝试应至少触发1次触景生情');

// ── 测试3：NPC冲突——关系差+某方愤怒+固执 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试3: NPC冲突——关系<30 + 愤怒>50 + 固执>60                          │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {}; _npcRelations = {};
// 铁匠赵（stubbornness=80）和独行客（stubbornness=85）
var npcA = 'tie_zhao';
var npcB = 'du_xing';
DailyEngine.generateDailyState(npcA);
DailyEngine.generateDailyState(npcB);
var stateA = DailyEngine.getDailyState(npcA);
var stateB = DailyEngine.getDailyState(npcB);
resetState(npcA); resetState(npcB);
stateA.mood = 30; stateA.angerLevel = 70; // 愤怒
stateB.mood = 30; stateB.angerLevel = 60;
// 同地点
stateA.decidedLocation = 'teahouse';
stateB.decidedLocation = 'teahouse';
// 关系差
var relKey = npcA < npcB ? npcA + '+' + npcB : npcB + '+' + npcA;
_npcRelations[relKey] = 15; // 关系很差

events = DailyEngine.detectRiftEvents();
var conflictEvent = null;
for (var c = 0; c < events.length; c++) {
    if (events[c].type === 'npc_conflict') {
        conflictEvent = events[c];
        break;
    }
}
console.log('  冲突事件: ' + (conflictEvent ? conflictEvent.desc : '未触发'));
assert(conflictEvent !== null, '应触发冲突事件');
assert(conflictEvent && (conflictEvent.npcA === npcA || conflictEvent.npcA === npcB), '应涉及两个NPC');

if (conflictEvent) {
    var conflictResult = DailyEngine.applyRiftEvent(conflictEvent);
    console.log('  关系变化: ' + JSON.stringify(conflictResult.relChanges));
    console.log('  传播效果数: ' + conflictResult.spreadEffects.length);
    assert(conflictResult.relChanges.length > 0, '应有关系变化（关系下降）');
    // 验证关系下降
    var newRel = EncounterSystem.getRelation(npcA, npcB);
    console.log('  冲突后关系: ' + newRel);
    assert(newRel < 15, '冲突后关系应下降');
}

// ── 测试4：NPC安慰——高热情NPC遇到低心情NPC ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试4: NPC安慰——高热情+低心情NPC+关系>40                             │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {}; _npcRelations = {};
// 厨娘刘（warmth=85）安慰铁匠赵（mood低）
npcA = 'chu_liu'; // 厨娘刘 warmth=85
npcB = 'tie_zhao';
DailyEngine.generateDailyState(npcA);
DailyEngine.generateDailyState(npcB);
stateA = DailyEngine.getDailyState(npcA);
stateB = DailyEngine.getDailyState(npcB);
resetState(npcA); resetState(npcB);
stateA.mood = 60;
stateB.mood = 20; // 心情低
stateA.decidedLocation = 'teahouse';
stateB.decidedLocation = 'teahouse';
relKey = npcA < npcB ? npcA + '+' + npcB : npcB + '+' + npcA;
_npcRelations[relKey] = 55; // 关系不错

// 多次尝试，25%概率
var comfortEvent = null;
for (var m = 0; m < 20; m++) {
    events = DailyEngine.detectRiftEvents();
    for (var n = 0; n < events.length; n++) {
        if (events[n].type === 'npc_comfort') {
            comfortEvent = events[n];
            break;
        }
    }
    if (comfortEvent) break;
}
console.log('  安慰事件: ' + (comfortEvent ? comfortEvent.desc : '未触发'));
assert(comfortEvent !== null, '20次尝试应至少触发1次安慰事件');

if (comfortEvent) {
    var comfortResult = DailyEngine.applyRiftEvent(comfortEvent);
    console.log('  心情变化: ' + JSON.stringify(comfortResult.moodChanges));
    // 被安慰的NPC（target）心情应上升
    var moodChanged = false;
    for (var mc = 0; mc < comfortResult.moodChanges.length; mc++) {
        if (comfortResult.moodChanges[mc].delta > 0) {
            moodChanged = true;
            break;
        }
    }
    assert(moodChanged, '被安慰的NPC心情应上升');
}

// ── 测试5：关系网传播——旁观者根据关系做出反应 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试5: 关系网传播——旁观者根据关系做出反应                            │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {}; _npcRelations = {};
// 铁匠赵和独行客冲突，阿福（warmth=80,patience=65）在同地点旁观
npcA = 'tie_zhao';
npcB = 'du_xing';
var bystander = 'a_fu';
DailyEngine.generateDailyState(npcA);
DailyEngine.generateDailyState(npcB);
DailyEngine.generateDailyState(bystander);
stateA = DailyEngine.getDailyState(npcA);
stateB = DailyEngine.getDailyState(npcB);
var stateBystander = DailyEngine.getDailyState(bystander);
resetState(npcA); resetState(npcB); resetState(bystander);
stateA.mood = 30; stateA.angerLevel = 70;
stateB.mood = 30; stateB.angerLevel = 60;
stateA.decidedLocation = 'teahouse';
stateB.decidedLocation = 'teahouse';
stateBystander.decidedLocation = 'teahouse'; // 旁观者同地点
relKey = npcA < npcB ? npcA + '+' + npcB : npcB + '+' + npcA;
_npcRelations[relKey] = 15;

events = DailyEngine.detectRiftEvents();
conflictEvent = null;
for (var ce = 0; ce < events.length; ce++) {
    if (events[ce].type === 'npc_conflict') {
        conflictEvent = events[ce];
        break;
    }
}

if (conflictEvent) {
    var spreadResult = DailyEngine.applyRiftEvent(conflictEvent);
    console.log('  传播效果数: ' + spreadResult.spreadEffects.length);
    for (var se = 0; se < spreadResult.spreadEffects.length; se++) {
        console.log('  旁观者' + spreadResult.spreadEffects[se].npcId + 
                    ': mood ' + spreadResult.spreadEffects[se].oldMood + '→' + spreadResult.spreadEffects[se].newMood +
                    ' (' + spreadResult.spreadEffects[se].reaction + ')');
    }
    assert(spreadResult.spreadEffects.length > 0, '应有旁观者被影响');
    // 阿福warmth=80,patience=65，应该想劝架
    var aFuAffected = false;
    for (var af = 0; af < spreadResult.spreadEffects.length; af++) {
        if (spreadResult.spreadEffects[af].npcId === bystander) {
            aFuAffected = true;
            break;
        }
    }
    assert(aFuAffected, '阿福（高热情高耐心）应被影响（想劝架）');
}

// ── 测试6：正常状态不触发事件 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试6: 正常状态不触发裂痕事件                                        │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {}; _npcRelations = {};
var allIds = DailyEngine.getAllNpcIds();
for (var ai = 0; ai < allIds.length; ai++) {
    DailyEngine.generateDailyState(allIds[ai]);
    var st = DailyEngine.getDailyState(allIds[ai]);
    resetState(allIds[ai]);
    st.mood = 60; // 正常心情
    st.socialNeed = 30; // 低社交需求
    st.angerLevel = 0;
}

events = DailyEngine.detectRiftEvents();
var hasNegativeEvent = false;
for (var ne = 0; ne < events.length; ne++) {
    if (events[ne].type === 'npc_breakdown' || events[ne].type === 'npc_conflict') {
        hasNegativeEvent = true;
        break;
    }
}
console.log('  事件数量: ' + events.length);
console.log('  有负面事件: ' + hasNegativeEvent);
assert(!hasNegativeEvent, '正常状态不应触发崩溃或冲突事件');

// ── 结果汇总 ──
console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + (passCount + failCount));
console.log('  失败: ' + failCount + '/' + (passCount + failCount));
