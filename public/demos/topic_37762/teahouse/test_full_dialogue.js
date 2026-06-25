/**
 * 完整对话流程测试 — 模拟玩家选择选项后的完整对话
 * 重点检测：1.重复性 2.选项与回复是否对应 3.NPC重复度
 * 运行方式: node test_full_dialogue.js
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
console.log('║  完整对话流程测试 — 模拟玩家选择选项后的6轮对话                    ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

// 选几个代表性NPC测试
var testNpcs = ['wang_zhanggui', 'tie_zhao', 'a_fu', 'yunxi', 'shenmi_laoren', 'lao_chen'];

testNpcs.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    if (!profile || profile.isAnimal) return;

    var name = profile.name;
    setRelation(npcId, 50);
    DailyEngine.generateDailyState(npcId);
    var state = DailyEngine.getDailyState(npcId);

    console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ ' + name + ' (' + npcId + ')  type=' + profile.type + '  mood=' + state.mood + ' │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');

    // 开场
    var dlg = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    var npcText = dlg.opening + (dlg.topic ? '，' + dlg.topic : '');
    console.log('  NPC开场: ' + npcText);

    var utterances = [npcText];
    var dlgCtx = {
        turnCount: 0,
        lastNpcText: npcText,
        currentTopic: dlg.topic || '',
        topicTurnCount: 0,
        recentUtterances: [],
        sessionStart: Date.now()
    };

    var replies = [npcText];
    var optionRepeats = 0;
    var replyRepeats = 0;
    var contextBreaks = 0;

    for (var round = 1; round <= 6; round++) {
        var options = DailyEngine.generateLiveOptions(npcId, utterances[utterances.length - 1], state, 'acquaintance',
            round > 1 ? utterances[utterances.length - 2] : undefined);
        var optTexts = options.map(function(o) { return o.playerOption; });

        // 检查选项重复
        var prevOpts = utterances.filter(function(u, i) { return i % 2 === 1; }); // 奇数位是玩家选项
        optTexts.forEach(function(opt) {
            if (prevOpts.indexOf(opt) >= 0) optionRepeats++;
        });

        console.log('\n  第' + round + '轮选项: ' + optTexts.join(' | '));

        // 选第一个选项
        var chosenOpt = options[0];
        var playerChoice = chosenOpt.playerOption;
        console.log('  玩家: ' + playerChoice);

        dlgCtx.turnCount++;
        dlgCtx.topicTurnCount++;
        dlgCtx.recentUtterances.push(playerChoice);
        if (dlgCtx.recentUtterances.length > 6) dlgCtx.recentUtterances.shift();

        var reply = DailyEngine.generateFollowUpReply(npcId, playerChoice, chosenOpt.intent, dlgCtx);
        console.log('  NPC: ' + reply);

        // 检查回复重复
        if (replies.indexOf(reply) >= 0) replyRepeats++;

        // 检查上下文断裂：NPC回复是否引用了玩家选项或之前话题
        var hasContextLink = false;
        // 检查NPC回复是否包含玩家选项的关键词
        var playerKws = chosenOpt.playerOption.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
        if (playerKws.length > 0) {
            for (var k = 0; k < playerKws.length; k++) {
                if (playerKws[k].length >= 2 && reply.indexOf(playerKws[k]) >= 0) {
                    hasContextLink = true;
                    break;
                }
            }
        }
        // 检查NPC回复是否包含之前NPC话题
        if (!hasContextLink && dlgCtx.currentTopic && reply.indexOf(dlgCtx.currentTopic) >= 0) {
            hasContextLink = true;
        }
        if (!hasContextLink) contextBreaks++;

        replies.push(reply);
        dlgCtx.lastNpcText = reply;
        utterances.push(playerChoice);
        utterances.push(reply);
    }

    console.log('\n  ── 对话质量分析 ──');
    console.log('    选项重复次数: ' + optionRepeats);
    console.log('    回复重复次数: ' + replyRepeats);
    console.log('    上下文断裂次数: ' + contextBreaks + '/6');
    var quality = (optionRepeats === 0 && replyRepeats <= 1 && contextBreaks <= 2) ? '✓ 良好' : '⚠️ 需改进';
    console.log('    整体质量: ' + quality);
});

console.log('\n\n测试完成。');
