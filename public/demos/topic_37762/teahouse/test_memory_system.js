/**
 * 记忆系统MVP测试
 * 验证：玩家关键事件写入NPC记忆 + 开场白读取真实记忆
 */

global.window = global;
var _mockWeather = { id: 'rainy', name: '雨天' };
global.GameTime = {
    getWeather: function() { return _mockWeather; },
    getSeason: function() { return 'spring'; },
    getCurrentPeriod: function() { return 'morning'; }
};
var _mockRelations = {};
global.getRel = function(npcId) { return _mockRelations[npcId] || 50; };

// ── Mock SoulTick 和 SoulBridge ──
// 模拟记忆存储，每个NPC独立
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
            type: memoryType,
            category: category,
            content: content,
            timestamp: Date.now(),
            importance: meta.importance || 50,
            emotionValue: meta.emotionValue || 0,
            confidence: meta.confidence || 1.0,
            tags: meta.tags || []
        };
        if (memoryType === 'short_term') {
            state.memory.shortTerm.push(memory);
        } else if (memoryType === 'long_term') {
            state.memory.longTerm.push(memory);
        } else if (memoryType === 'important') {
            state.memory.important.push(memory);
        }
    },
    getTopMemories: function(state, tags, limit) {
        if (!state || !state.memory) return [];
        limit = limit || 3;
        var all = (state.memory.shortTerm || [])
            .concat(state.memory.longTerm || [])
            .concat(state.memory.important || []);
        all.sort(function(a, b) { return b.importance - a.importance; });
        if (!tags || tags.length === 0) return all.slice(0, limit);
        var result = [];
        for (var i = 0; i < all.length; i++) {
            var mem = all[i];
            if (mem.tags && mem.tags.length > 0) {
                for (var j = 0; j < tags.length; j++) {
                    if (mem.tags.indexOf(tags[j]) >= 0) {
                        result.push(mem);
                        break;
                    }
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
console.log('║  记忆系统MVP测试                                                     ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var passCount = 0;
var failCount = 0;

function assert(cond, msg) {
    if (cond) {
        console.log('  ✅ ' + msg);
        passCount++;
    } else {
        console.log('  ❌ ' + msg);
        failCount++;
    }
}

// ── 测试1：玩家选项包含"生病" → 写入health类记忆 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试1: 玩家选项"我最近生病了" → 写入health记忆                       │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; // 重置
var npcId = 'tie_zhao';
var profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);

var dlgCtx = { turnCount: 1, lastNpcText: '最近咋样？', currentTopic: '' };
var reply = DailyEngine.generateFollowUpReply(npcId, '我最近生病了，不太舒服。', 'share_status', dlgCtx);
console.log('  NPC回复: ' + reply);

var state = SoulTick.getNpcState(npcId);
var memories = SoulBridge.getTopMemories(state, ['player_event'], 5);
console.log('  记忆数量: ' + memories.length);
if (memories.length > 0) {
    console.log('  记忆内容: ' + memories[0].content);
    console.log('  记忆标签: ' + JSON.stringify(memories[0].tags));
}

assert(memories.length > 0, '应写入1条玩家事件记忆');
assert(memories.length > 0 && memories[0].content.indexOf('生病') >= 0, '记忆内容应包含"生病"');
assert(memories.length > 0 && memories[0].tags.indexOf('health') >= 0, '记忆标签应包含health');

// ── 测试2：读取health记忆 → 开场白应包含"生病"追忆 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试2: 读取health记忆 → 开场白应包含"生病"追忆                       │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

// 多次尝试开场白，因为有30%概率触发追忆
var foundMemoryInOpening = false;
var openingSample = '';
for (var i = 0; i < 20; i++) {
    var opening = DailyEngine.generateContextDialogue(npcId, 50);
    openingSample = opening.fullDialogue || '';
    if (openingSample.indexOf('生病') >= 0 || openingSample.indexOf('病') >= 0) {
        foundMemoryInOpening = true;
        break;
    }
}
console.log('  开场白样本: ' + openingSample);
assert(foundMemoryInOpening, '20次尝试中应至少有1次开场白包含生病追忆');

// ── 测试3：玩家选项包含"出远门" → 写入travel记忆 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试3: 玩家选项"我要出远门了" → 写入travel记忆                       │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {}; // 重置
npcId = 'wang_zhanggui';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);

dlgCtx = { turnCount: 1, lastNpcText: '最近咋样？', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '我要出远门了，过几天才回来。', 'share_status', dlgCtx);
console.log('  NPC回复: ' + reply);

state = SoulTick.getNpcState(npcId);
memories = SoulBridge.getTopMemories(state, ['player_event'], 5);
console.log('  记忆数量: ' + memories.length);
if (memories.length > 0) {
    console.log('  记忆内容: ' + memories[0].content);
}

assert(memories.length > 0, '应写入1条玩家事件记忆');
assert(memories.length > 0 && memories[0].tags.indexOf('travel') >= 0, '记忆标签应包含travel');

// ── 测试4：玩家选项包含"发财" → 写入good记忆 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试4: 玩家选项"我最近发财了！" → 写入good记忆                       │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {};
npcId = 'yunxi';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);

dlgCtx = { turnCount: 1, lastNpcText: '最近咋样？', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '我最近发财了！', 'share_joy', dlgCtx);
console.log('  NPC回复: ' + reply);

state = SoulTick.getNpcState(npcId);
memories = SoulBridge.getTopMemories(state, ['player_event'], 5);
console.log('  记忆数量: ' + memories.length);
if (memories.length > 0) {
    console.log('  记忆内容: ' + memories[0].content);
}

assert(memories.length > 0, '应写入1条玩家事件记忆');
assert(memories.length > 0 && memories[0].tags.indexOf('good') >= 0, '记忆标签应包含good');

// ── 测试5：玩家选项无关键事件 → 不写入记忆 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试5: 玩家选项"今天天气不错" → 不写入记忆                           │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {};
npcId = 'tie_zhao';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);

dlgCtx = { turnCount: 1, lastNpcText: '最近咋样？', currentTopic: '' };
reply = DailyEngine.generateFollowUpReply(npcId, '今天天气不错。', 'smalltalk', dlgCtx);
console.log('  NPC回复: ' + reply);

state = SoulTick.getNpcState(npcId);
memories = SoulBridge.getTopMemories(state, ['player_event'], 5);
console.log('  记忆数量: ' + memories.length);

assert(memories.length === 0, '无关键事件时不应写入记忆');

// ── 测试6：多类别记忆 → 读取importance最高的 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试6: 多类别记忆 → 读取importance最高的（health=80 > travel=60）    │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {};
npcId = 'tie_zhao';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);

// 先写入travel记忆
dlgCtx = { turnCount: 1, lastNpcText: '最近咋样？', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '我刚从远门回来。', 'share_status', dlgCtx);
// 再写入health记忆（importance更高）
dlgCtx = { turnCount: 2, lastNpcText: '然后呢？', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '最近生病了，很难受。', 'share_status', dlgCtx);

state = SoulTick.getNpcState(npcId);
memories = SoulBridge.getTopMemories(state, ['player_event'], 1);
console.log('  记忆数量: ' + memories.length);
if (memories.length > 0) {
    console.log('  最高优先级记忆: ' + memories[0].content);
    console.log('  importance: ' + memories[0].importance);
}

assert(memories.length > 0, '应有记忆');
assert(memories.length > 0 && memories[0].tags.indexOf('health') >= 0, '应返回health记忆（importance=80最高）');

// ── 测试7：完整流程——写入后读取开场白 ──
console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 测试7: 完整流程——写入"麻烦"记忆后，开场白应包含"麻烦"追忆            │');
console.log('└─────────────────────────────────────────────────────────────────────┘');

_mockStates = {};
npcId = 'wang_zhanggui';
profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);

// 写入trouble记忆
dlgCtx = { turnCount: 1, lastNpcText: '最近咋样？', currentTopic: '' };
DailyEngine.generateFollowUpReply(npcId, '最近遇到点麻烦，被人欺负了。', 'complain', dlgCtx);

// 验证记忆已写入
state = SoulTick.getNpcState(npcId);
memories = SoulBridge.getTopMemories(state, ['player_event'], 1);
console.log('  写入的记忆: ' + (memories.length > 0 ? memories[0].content : '无'));

// 读取开场白
var foundTroubleMemory = false;
var sampleOpening = '';
for (var k = 0; k < 30; k++) {
    var dlg = DailyEngine.generateContextDialogue(npcId, 50);
    sampleOpening = dlg.fullDialogue || '';
    if (sampleOpening.indexOf('麻烦') >= 0 || sampleOpening.indexOf('欺负') >= 0) {
        foundTroubleMemory = true;
        break;
    }
}
console.log('  开场白样本: ' + sampleOpening);
assert(foundTroubleMemory, '30次尝试中应至少有1次开场白包含麻烦追忆');

// ── 结果汇总 ──
console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  测试结果                                                            ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('  通过: ' + passCount + '/' + (passCount + failCount));
console.log('  失败: ' + failCount + '/' + (passCount + failCount));
