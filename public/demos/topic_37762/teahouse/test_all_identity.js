/**
 * 全NPC身份特色回复测试 — 验证所有NPC的回复都符合身份/性格/心情
 * 运行方式: node test_all_identity.js
 */

global.window = global;
var _mockWeather = { id: 'clear', name: '晴天' };
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

function setRelation(npcId, val) { _mockRelations[npcId] = val; }

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  全NPC身份特色回复测试 — 验证身份/性格/心情三维影响                ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

var allIds = DailyEngine.getAllNpcIds();
var issues = [];
var stats = {
    totalReplies: 0,
    typeSpecificHits: 0,    // 命中身份特色词的回复数
    personalityHits: 0,     // 命中性格修饰的回复数
    moodHits: 0             // 命中心情修饰的回复数
};

// 各类型NPC的身份特色关键词（用于检测回复是否含身份特色）
var typeKeywords = {
    merchant: ['茶叶','布匹','盐','糖','瓷器','药材','丝绸','香料','铜器','漆器','米面','腊肉','买卖','生意','货','账','摊','商','客'],
    artisan: ['刀','榫卯','炉火','锤子','工序','料子','打铁','刨木','上釉','纺线','雕刻','淬火','活儿','手艺','家什','料'],
    sect_outer: ['吐纳','站桩','剑法','心法','步法','丹道','晨练','巡山','洒扫','抄经','值守','修炼','师门','师傅','师兄','功法'],
    wanderer: ['大漠','瘴气林','渔村','古道','集市','赶路','落脚','打探','江湖','走南闯北','盘缠','马','行李','结伴'],
    teahouse_staff: ['沏茶','擦桌子','招呼客人','算茶钱','添水','备茶点','茶馆','客官','茶具'],
    teahouse_regular: ['喝茶','听书','闲聊','下棋','茶馆','茶杯','茶客','八卦'],
    townsfolk: ['干活','家务','跑腿','日子','集市','井边','邻里','镇上','家里'],
    hidden: ['天道','因果','机缘','命数','心魔','道心','天机','劫数','凡人','命数','气运','虚空','禁地']
};

// 性格修饰关键词
var personalityKeywords = {
    warmth_high: ['！'],
    warmth_low: [],
    humor_high: ['哈哈','你说是不是','逗你的','别当真'],
    stubbornness_high: ['反正我是这么想的'],
    caution_high: ['不过也不好说'],
    pride_high: ['我可不是那种人','这事儿我说了算','我主意已定'],
    patience_low: ['行了行了'],
    curiosity_high: ['你知道吗'],
    adventure_high: ['改天一起去']
};

// 心情修饰关键词
var moodLowKeywords = ['算了','唉','不说了','没意思'];
var moodHighKeywords = ['哈哈','今天真顺','心情好着呢','真舒坦'];

allIds.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    if (!profile || profile.isAnimal) return;

    var name = profile.name;
    var type = profile.type || 'townsfolk';
    var p = profile.personality || {};
    setRelation(npcId, 50);
    DailyEngine.generateDailyState(npcId);
    var state = DailyEngine.getDailyState(npcId);
    var mood = state ? state.mood : 50;

    console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ ' + name + ' (' + npcId + ')  type=' + type + '  mood=' + mood + ' │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');

    // 测试所有 intent
    var testIntents = [
        { intent: 'listen', playerOpt: '嗯，你说。' },
        { intent: 'confirm', playerOpt: '是啊。' },
        { intent: 'care', playerOpt: '别太累了。' },
        { intent: 'ask_work', playerOpt: '最近忙啥？' },
        { intent: 'ask_news', playerOpt: '有啥新鲜事？' },
        { intent: 'ask_trade', playerOpt: '最近啥好卖？' },
        { intent: 'ask_craft', playerOpt: '手艺咋样？' },
        { intent: 'ask_cultivation', playerOpt: '修炼咋样？' },
        { intent: 'ask_travel', playerOpt: '外头咋样？' },
        { intent: 'share_joy', playerOpt: '沾沾喜气！' },
        { intent: 'help', playerOpt: '搭把手？' },
        { intent: 'encourage', playerOpt: '别灰心。' }
    ];

    testIntents.forEach(function(test) {
        var reply = DailyEngine.generateFollowUpReply(npcId, test.playerOpt, test.intent, {
            turnCount: 1,
            lastNpcText: profile.greeting || '',
            currentTopic: '',
            recentUtterances: [],
            sessionStart: 1
        });
        stats.totalReplies++;

        // 检查是否含身份特色词
        var typeKw = typeKeywords[type] || [];
        var hasTypeSpecific = typeKw.some(function(kw) { return reply.indexOf(kw) >= 0; });
        if (hasTypeSpecific) stats.typeSpecificHits++;

        // 检查是否含性格修饰
        var hasPersonality = false;
        if (p.humor >= 70 && personalityKeywords.humor_high.some(function(k){return reply.indexOf(k)>=0;})) hasPersonality = true;
        if (p.stubbornness >= 80 && personalityKeywords.stubbornness_high.some(function(k){return reply.indexOf(k)>=0;})) hasPersonality = true;
        if (p.caution >= 80 && personalityKeywords.caution_high.some(function(k){return reply.indexOf(k)>=0;})) hasPersonality = true;
        if (p.pride >= 80 && personalityKeywords.pride_high.some(function(k){return reply.indexOf(k)>=0;})) hasPersonality = true;
        if (p.patience <= 25 && personalityKeywords.patience_low.some(function(k){return reply.indexOf(k)>=0;})) hasPersonality = true;
        if (p.curiosity >= 80 && personalityKeywords.curiosity_high.some(function(k){return reply.indexOf(k)>=0;})) hasPersonality = true;
        if (hasPersonality) stats.personalityHits++;

        // 检查心情修饰
        var hasMood = false;
        if (mood < 30 && moodLowKeywords.some(function(k){return reply.indexOf(k)>=0;})) hasMood = true;
        if (mood > 70 && moodHighKeywords.some(function(k){return reply.indexOf(k)>=0;})) hasMood = true;
        if (hasMood) stats.moodHits++;

        // 英文检查
        if (/[a-zA-Z]{3,}/.test(reply)) {
            issues.push(name + ' ' + test.intent + ' 含英文: "' + reply + '"');
        }

        var typeMark = hasTypeSpecific ? '✓身份' : ' 通用';
        var persMark = hasPersonality ? '✓性格' : '';
        var moodMark = hasMood ? '✓心情' : '';
        console.log('  [' + test.intent + '] ' + typeMark + persMark + moodMark + ' | ' + reply);
    });
});

console.log('\n\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  统计与问题汇总                                                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

console.log('\n  统计：');
console.log('    总回复数: ' + stats.totalReplies);
console.log('    命中身份特色: ' + stats.typeSpecificHits + ' (' + Math.round(stats.typeSpecificHits/stats.totalReplies*100) + '%)');
console.log('    命中性格修饰: ' + stats.personalityHits + ' (' + Math.round(stats.personalityHits/stats.totalReplies*100) + '%)');
console.log('    命中心情修饰: ' + stats.moodHits + ' (' + Math.round(stats.moodHits/stats.totalReplies*100) + '%)');

if (issues.length === 0) {
    console.log('\n  ✓ 未发现英文或其他问题');
} else {
    console.log('\n  发现 ' + issues.length + ' 个问题：');
    issues.forEach(function(issue, i) {
        console.log('  ' + (i+1) + '. ' + issue);
    });
}
