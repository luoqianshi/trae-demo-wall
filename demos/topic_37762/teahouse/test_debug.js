// 快速debug _generateWeirdOptionReply
global.window = global;
var _mockWeather = { id: 'rainy', name: '雨天' };
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

console.log('=== Debug _generateWeirdOptionReply ===');
console.log('playerOption: "沾沾喜气！"');
console.log('lastNpcText: "下雨带伞没？"');
console.log('intent: celebrate');

var playerKws = DailyEngine.extractKeywords ? DailyEngine.extractKeywords('沾沾喜气！') : 'no extractKeywords export';
console.log('playerKws:', playerKws);

var npcKws = DailyEngine.extractKeywords ? DailyEngine.extractKeywords('下雨带伞没？') : 'no extractKeywords export';
console.log('npcKws:', npcKws);

// 检查交集
var hasOverlap = false;
if (Array.isArray(playerKws) && Array.isArray(npcKws)) {
    for (var i = 0; i < playerKws.length; i++) {
        for (var j = 0; j < npcKws.length; j++) {
            if (playerKws[i] === npcKws[j] && playerKws[i].length >= 2) {
                hasOverlap = true;
                console.log('交集命中:', playerKws[i]);
                break;
            }
        }
        if (hasOverlap) break;
    }
}
console.log('hasOverlap:', hasOverlap);

var isShortAnswer = '沾沾喜气！'.length <= 3;
console.log('isShortAnswer:', isShortAnswer);

var npcAskingQuestion = /[？?]/.test('下雨带伞没？');
console.log('npcAskingQuestion:', npcAskingQuestion);

var weirdIntents = ['share_joy', 'celebrate', 'tease', 'resonate', 'downplay', 'accept_thanks', 'accept_refuse', 'arrange'];
var isWeirdIntent = weirdIntents.indexOf('celebrate') >= 0;
console.log('isWeirdIntent:', isWeirdIntent);

// 检查铁匠赵的personality
var profile = DailyEngine.getNpcProfile('tiejiang_zhao');
console.log('铁匠赵 personality:', profile.personality);
console.log('stubbornness:', profile.personality.stubbornness);
