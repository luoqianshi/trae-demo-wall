// 快速调试：检查"今天没来几个喝茶的，闲。"的语境检测
var GameTime = { getWeather: function() { return { id: 'clear', name: '晴天' }; } };
var getRel = function() { return 50; };
var SoulTick = { getNpcState: function() { return { intent: { goalType: '' } }; } };
global.window = { GameTime: GameTime, getRel: getRel, SoulTick: SoulTick };
global.GameTime = GameTime;
global.getRel = getRel;
global.SoulTick = SoulTick;

var fs = require('fs');
var code = fs.readFileSync('daily_engine.js', 'utf8');
eval(code);

var npcId = 'wang_zhanggui';
var profile = DailyEngine.getNpcProfile(npcId);
DailyEngine.generateDailyState(npcId);
var state = DailyEngine.getDailyState(npcId);

var testText = '今天没来几个喝茶的，闲。';
var keywords = [];
// 模拟extractKeywords
try { keywords = DailyEngine.extractKeywords ? DailyEngine.extractKeywords(testText) : []; } catch(e) { keywords = []; }

console.log('测试文本: "' + testText + '"');
console.log('keywords:', JSON.stringify(keywords));

// 检查所有语境
var allWords = {
    complaint: ['烦', '讨厌', '受不了', '倒霉', '糟', '难', '苦', '不公', '凭什么', '别提了', '烦人', '气死', '混账', '岂有此理', '太过分', '欺负', '忍不了', '倒霉蛋', '命苦', '亏', '亏了', '赔', '赔了', '折了', '糟心', '闹心', '烦心', '倒霉事', '不顺', '不痛快', '憋屈', '委屈', '生气', '气呼呼'],
    question: ['？', '?', '吗', '呢', '什么', '怎么', '为什么', '哪', '谁', '咋'],
    joy: ['开心', '高兴', '哈哈', '太好了', '运气', '顺', '舒坦', '痛快', '乐', '喜庆', '热闹', '真好', '太棒', '不错', '喜事', '好事', '悟了', '突破', '成功', '搞定', '办成', '悟点'],
    worry: ['担心', '怕', '焦虑', '不安', '万一', '会不会', '危险', '小心', '愁', '愁人', '发愁', '犯愁', '忧心', '操心', '挂心', '揪心', '犯难', '没底', '忐忑', '吓', '吓死', '吓人', '吓死我', '后怕', '惊魂'],
    memory: ['以前', '记得', '那时候', '曾经', '上次', '昨天', '过去', '回忆'],
    suggest: ['要不', '不如', '一起', '走吧', '来吧', '试试', '要不要', '来来来', '坐会儿', '坐坐', '来杯', '来壶', '坐吧', '来一壶', '来一盏'],
    weather: ['雨', '雪', '风', '晴', '冷', '热', '晒', '天气', '刮风', '下雨', '下雪'],
    food: ['吃', '喝', '饿', '饭', '菜', '汤', '点心', '糕'],
    work: ['活', '工', '忙', '做', '打', '干', '活计', '生意', '买卖', '干活', '活儿'],
    tired: ['累', '困', '乏', '疲', '歇', '睡', '休息', '没劲', '身子骨', '不如从前', '老了', '撑不住', '吃不消', '腰', '腿'],
    lonely: ['无聊', '寂寞', '孤单', '没人', '一个人', '闷', '没人说话', '找个人', '聊聊天', '说说话'],
    idle: ['闲', '没事做', '没事干', '清闲', '空闲', '闲着', '闲得'],
    difficulty: ['卡在', '瓶颈', '难住', '棘手', '不顺', '卡住', '没头绪', '摸不着', '搞不定', '弄不懂', '不简单', '差点没']
};

console.log('\n=== 所有语境检测 ===');
Object.keys(allWords).forEach(function(key) {
    var triggered = [];
    allWords[key].forEach(function(w) {
        if (testText.indexOf(w) >= 0) {
            triggered.push(w);
        }
    });
    console.log('has' + key.charAt(0).toUpperCase() + key.slice(1) + ':', triggered.length > 0, triggered.length > 0 ? '触发词:' + triggered.join(',') : '');
});

// 生成选项
var options = DailyEngine.generateLiveOptions(npcId, testText, state, 50);
console.log('\n生成的选项:');
options.forEach(function(opt, i) {
    console.log('  [' + (i+1) + '] ' + opt.playerOption + ' (intent=' + opt.intent + ')');
});
