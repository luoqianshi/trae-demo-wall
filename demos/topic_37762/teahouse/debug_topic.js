// 快速验证_extractTopicObject
var GameTime = {
    getWeather: function() { return { id: 'clear' }; },
    getPeriod: function() { return { id: 'morning' }; }
};
global.window = { GameTime: GameTime };
global.GameTime = GameTime;
var fs = require('fs');
var code = fs.readFileSync('daily_engine.js', 'utf8');
eval(code);

// 测试_extractTopicObject
var testTexts = [
    '正好你来了，一起喝杯茶？',
    '一起喝杯茶？',
    '今天没来几个喝茶的，闲。',
    '师门清闲，难得。'
];

testTexts.forEach(function(t) {
    // _extractTopicObject是内部函数，通过DailyEngine访问不到
    // 但可以通过generateLiveOptions间接验证
    var state = { mood: 50 };
    var opts = DailyEngine.generateLiveOptions('lao_chen', t, state, 50);
    console.log('NPC说: "' + t + '"');
    console.log('选项: ' + opts.map(function(o){return o.playerOption}).join(' / '));
    console.log('');
});
