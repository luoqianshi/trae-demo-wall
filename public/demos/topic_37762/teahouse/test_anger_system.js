/**
 * 愤怒机制测试
 * 验证：NPC伤心+反面选项→生气，含好感度惩罚+冷淡期+多场景
 */

global.window = global;
var _mockWeather = { id: 'rainy', name: '雨天' };
global.GameTime = {
    getWeather: function() { return _mockWeather; },
    getSeason: function() { return 'spring'; },
    getCurrentPeriod: function() { return 'morning'; }
};

// ── Mock 好感度系统（模拟index.html中的playerRelations） ──
var _mockRelations = {};
global.getRel = function(npcId) { return _mockRelations[npcId] !== undefined ? _mockRelations[npcId] : 50; };
global.adjRel = function(npcId, delta) {
    if (_mockRelations[npcId] === undefined) _mockRelations[npcId] = 50;
    _mockRelations[npcId] = Math.max(0, Math.min(100, _mockRelations[npcId] + delta));
};

// ── Mock SoulTick 和 SoulBridge ──
var _mockStates = {};
global.SoulTick = {
    getNpcState: function(npcId) {
        if (!_mockStates[npcId]) {
            _mockStates[npcId] = {
                npcId: npcId,
                mood: 60,
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
console.log('║  愤怒机制测试                                                        ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var passCount = 0;
var failCount = 0;
function assert(cond, msg) {
    if (cond) { console.log('  ✅ ' + msg); passCount++; }
    else { console.log('  ❌ ' + msg); failCount++; }
}

// 辅助函数：重置NPC的愤怒相关状态
function resetAngerState(npcId) {
    var st = DailyEngine.getDailyState(npcId);
    if (st) {
        st.angerLevel = 0;
        st.coldTurns = 0;
        st.angerHistory = [];
        st._lastReplyWasAnger = false;
        st._coldTurnsDecremented = false;
    }
}

// ── 测试1：NPC伤心（mood<30）+ 玩家选celebrate（沾沾喜气）→ 触发愤怒 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试1: NPC伤心 + 玩家选celebrate → 触发愤怒，mood下降，rel下降       │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
var npcId = 'tie_zhao';
var profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
var state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
resetAngerState(npcId);
// 手动设置NPC心情为低落（伤心）
state.mood = 20;
state.moodLabel = '低落';
var oldMood = state.mood;
var oldRel = getRel(npcId);
console.log('  初始 mood=' + oldMood + ', rel=' + oldRel);

// NPC说一句伤心的话
var dlgCtx = { turnCount: 1, lastNpcText: '最近命苦啊，倒霉蛋一个，干啥都不顺。', currentTopic: '' };
var reply = DailyEngine.generateFollowUpReply(npcId, '沾沾喜气！', 'celebrate', dlgCtx);
console.log('  NPC回复: ' + reply);
console.log('  mood=' + state.mood + ', rel=' + getRel(npcId) + ', angerLevel=' + state.angerLevel);

assert(reply.indexOf('没心情') >= 0 || reply.indexOf('好笑') >= 0 || reply.indexOf('态度') >= 0 || reply.indexOf('当回事') >= 0 || reply.indexOf('不想说') >= 0,
       '愤怒回复应包含生气语气');
assert(state.mood < oldMood, 'mood应下降');
assert(getRel(npcId) < oldRel, 'rel应下降');
assert(state.angerLevel > 0, 'angerLevel应大于0');

// ── 测试2：NPC分享喜悦 + 玩家选tease（调侃）→ 触发轻度愤怒 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试2: NPC分享喜悦 + 玩家选tease → 触发轻度愤怒                      │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'wang_zhanggui';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 70; // 心情好
oldMood = state.mood;
oldRel = getRel(npcId);

dlgCtx = { turnCount: 1, lastNpcText: '今天太高兴了！生意特别好，运气真顺！', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '吹吧你。', 'tease', dlgCtx);
console.log('  NPC回复: ' + reply);
console.log('  mood=' + state.mood + ', rel=' + getRel(npcId) + ', angerLevel=' + state.angerLevel);

assert(reply.indexOf('高兴') >= 0 || reply.indexOf('替我') >= 0 || reply.indexOf('扫兴') >= 0 || reply.indexOf('随便') >= 0,
       '应包含被泼冷水的生气语气');
assert(state.angerLevel > 0, 'angerLevel应大于0');

// ── 测试3：NPC求助 + 玩家选delay → 触发轻度愤怒 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试3: NPC求助 + 玩家选delay → 触发轻度愤怒                          │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'yunxi';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 50;
oldRel = getRel(npcId);

dlgCtx = { turnCount: 1, lastNpcText: '要不一起去集市逛逛？', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '等会儿……', 'delay', dlgCtx);
console.log('  NPC回复: ' + reply);
console.log('  angerLevel=' + state.angerLevel + ', rel=' + getRel(npcId));

assert(reply.indexOf('当我没说') >= 0 || reply.indexOf('算了') >= 0 || reply.indexOf('你忙') >= 0 || reply.indexOf('自己想') >= 0,
       '应包含被无视的语气');
assert(state.angerLevel > 0, 'angerLevel应大于0');

// ── 测试4：连续反面选项 → 愤怒加重（1.5倍） ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试4: 连续反面选项 → 愤怒加重（1.5倍）                              │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 20;

// 第一次反面选项
dlgCtx = { turnCount: 1, lastNpcText: '最近命苦啊，倒霉蛋一个。', currentTopic: '' };
var reply1 = DailyEngine.generateFollowUpReply(npcId, '沾沾喜气！', 'celebrate', dlgCtx);
var angerAfter1 = state.angerLevel;
console.log('  第1次 angerLevel=' + angerAfter1);

// 第二次反面选项（连续）
dlgCtx = { turnCount: 2, lastNpcText: '你压根没把我说的当回事。', currentTopic: '' };
var reply2 = DailyEngine.generateFollowUpReply(npcId, '哈哈，吹吧你。', 'tease', dlgCtx);
var angerAfter2 = state.angerLevel;
console.log('  第2次 angerLevel=' + angerAfter2);

assert(angerAfter2 > angerAfter1, '连续反面选项应使愤怒值更高');
assert(state.coldTurns > 0, '应进入冷淡期');

// ── 测试5：冷淡期内选正面选项 → 缩短冷淡期，愤怒值下降 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试5: 冷淡期内选comfort → 缩短冷淡期，愤怒值下降                    │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 20;

// 先触发愤怒（连续2次反面选项，使angerLevel>50进入冷淡期）
dlgCtx = { turnCount: 1, lastNpcText: '最近命苦啊，倒霉蛋一个。', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '沾沾喜气！', 'celebrate', dlgCtx);
dlgCtx = { turnCount: 2, lastNpcText: '你压根没把我说的当回事。', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '哈哈，吹吧你。', 'tease', dlgCtx);
var coldTurnsAfterAnger = state.coldTurns;
var angerAfterAnger = state.angerLevel;
console.log('  愤怒后 coldTurns=' + coldTurnsAfterAnger + ', angerLevel=' + angerAfterAnger);

// 冷淡期内选comfort
dlgCtx = { turnCount: 3, lastNpcText: '行了，不想说了。', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '消消气，别这么说。', 'comfort', dlgCtx);
console.log('  安慰后回复: ' + reply);
console.log('  angerLevel=' + state.angerLevel);

assert(reply.indexOf('良心') >= 0 || reply.indexOf('关心') >= 0 || reply.indexOf('安慰') >= 0 || reply.indexOf('没事') >= 0,
       '冷淡期内选正面选项应得到缓和回复');
assert(state.angerLevel < angerAfterAnger, '安慰后愤怒值应下降');

// ── 测试6：NPC正常状态 + 玩家选celebrate → 不触发愤怒 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试6: NPC正常状态 + 玩家选celebrate → 不触发愤怒                    │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 60; // 正常心情
state.angerLevel = 0;

dlgCtx = { turnCount: 1, lastNpcText: '今天天气不错，活儿也干完了。', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '沾沾喜气！', 'celebrate', dlgCtx);
console.log('  NPC回复: ' + reply);
console.log('  angerLevel=' + state.angerLevel);

assert(state.angerLevel === 0, 'NPC正常状态不应触发愤怒');

// ── 测试7：愤怒衰减——每轮对话自然衰减 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试7: 愤怒衰减——每轮对话自然衰减3点                                │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; _mockRelations = {};
npcId = 'tie_zhao';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
state = DailyEngine.getDailyState(npcId);
resetAngerState(npcId);
state.mood = 20;

// 触发愤怒
dlgCtx = { turnCount: 1, lastNpcText: '最近命苦啊，倒霉蛋一个。', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '沾沾喜气！', 'celebrate', dlgCtx);
var angerAfterTrigger = state.angerLevel;
console.log('  触发后 angerLevel=' + angerAfterTrigger);

// 进行一轮正常对话（非反面选项）
dlgCtx = { turnCount: 2, lastNpcText: '你压根没把我说的当回事。', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '然后呢？', 'continue', dlgCtx);
console.log('  一轮后 angerLevel=' + state.angerLevel);

assert(state.angerLevel < angerAfterTrigger, '一轮对话后愤怒值应衰减');

// ── 结果汇总 ──
console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + (passCount + failCount));
console.log('  失败: ' + failCount + '/' + (passCount + failCount));
