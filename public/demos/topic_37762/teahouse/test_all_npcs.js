/**
 * 全NPC对话测试 - 逐个NPC测试开场/话题/回复/选项/结束语
 * 运行方式: node test_all_npcs.js
 */

// ── Mock ──
global.window = global;
var _mockWeather = { id: 'clear', name: '晴天' };
var _mockSeason = 'spring';
var _mockPeriod = 'morning';
global.GameTime = {
    getWeather: function() { return _mockWeather; },
    getSeason: function() { return _mockSeason; },
    getCurrentPeriod: function() { return _mockPeriod; },
    _setWeather: function(w) { _mockWeather = w; }
};
var _mockRelations = {};
global.getRel = function(npcId) { return _mockRelations[npcId] || 40; };

var fs = require('fs');
var path = require('path');
eval(fs.readFileSync(path.join(__dirname, 'daily_engine.js'), 'utf8'));

// ── 辅助 ──
function setWeather(id, name) { _mockWeather = { id: id, name: name || id }; }
function setRelation(npcId, val) { _mockRelations[npcId] = val; }

var allIds = DailyEngine.getAllNpcIds();
var issues = [];

// ── 逐个NPC测试 ──
console.log('╔' + '═'.repeat(78) + '╗');
console.log('║  云落镇 全NPC对话测试 - 26个NPC × 3轮对话 + 天气/性格偏移            ║');
console.log('╚' + '═'.repeat(78) + '╝');

allIds.forEach(function(npcId) {
    var profile = DailyEngine.getNpcProfile(npcId);
    if (!profile) {
        console.log('\n⚠️ ' + npcId + ': 缺少profile，跳过');
        issues.push(npcId + ': 缺少profile');
        return;
    }

    var name = profile.name;
    var isAnimal = profile.isAnimal || false;
    var p = profile.personality || {};
    setRelation(npcId, 50);
    DailyEngine.generateDailyState(npcId);

    // ── 性格摘要 ──
    var traits = [];
    if (isAnimal) {
        traits.push('动物');
    } else {
        if (p.warmth >= 70) traits.push('热情');
        if (p.warmth <= 25) traits.push('冷淡');
        if (p.humor >= 70) traits.push('幽默');
        if (p.stubbornness >= 70) traits.push('固执');
        if (p.caution >= 70) traits.push('谨慎');
        if (p.patience <= 25) traits.push('急躁');
        if (p.patience >= 80) traits.push('耐心');
        if (p.pride >= 80) traits.push('自尊强');
        if (p.pride <= 20) traits.push('谦虚');
        if (p.loyalty >= 80) traits.push('忠诚');
        if (p.loyalty <= 20) traits.push('疏离');
        if (p.social >= 70) traits.push('社交');
        if (p.curiosity >= 80) traits.push('好奇');
        if (p.diligence >= 80) traits.push('勤劳');
        if (p.adventure >= 70) traits.push('冒险');
    }

    console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ ' + name + ' (' + npcId + ')  ' + (isAnimal ? '🐾 动物NPC' : '性格: ' + (traits.join('、') || '普通')) + ' │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');

    // ── 动物NPC专用测试 ──
    if (isAnimal) {
        // 1. 陌生人叫声
        setRelation(npcId, 10);
        DailyEngine.generateDailyState(npcId);
        var dlgStranger = DailyEngine.generateContextDialogue(npcId, 'stranger');
        console.log('  【陌生人(10)】');
        console.log('    开场: ' + dlgStranger.opening);
        console.log('    话题: ' + dlgStranger.topic);
        console.log('    结尾: ' + dlgStranger.closing);
        // 检查：动物不应有人类语言
        if (/。|，|！|？/.test(dlgStranger.opening) && !/喵|咪|呼噜|嘶/.test(dlgStranger.opening)) {
            issues.push(name + ' 陌生人开场含人类语言: "' + dlgStranger.opening + '"');
        }

        // 2. 熟人叫声
        setRelation(npcId, 45);
        DailyEngine.generateDailyState(npcId);
        var dlgAcq = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
        console.log('  【熟人(45)】');
        console.log('    开场: ' + dlgAcq.opening);

        // 3. 好友叫声
        setRelation(npcId, 80);
        DailyEngine.generateDailyState(npcId);
        var dlgFriend = DailyEngine.generateContextDialogue(npcId, 'friend');
        console.log('  【好友(80)】');
        console.log('    开场: ' + dlgFriend.opening);

        // 4. 下雨叫声
        setWeather('rainy', '下雨');
        setRelation(npcId, 50);
        DailyEngine.generateDailyState(npcId);
        var dlgRain = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
        console.log('  【下雨】');
        console.log('    话题: ' + dlgRain.topic);

        // 5. 3轮互动
        setWeather('clear', '晴天');
        setRelation(npcId, 50);
        DailyEngine.generateDailyState(npcId);
        var dlgTalk = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
        var npcText = dlgTalk.fullDialogue || dlgTalk.opening || dlgTalk.topic || '嗯，今天天气不错。';
        console.log('  【3轮互动】');
        console.log('    猫: ' + npcText);

        var state = DailyEngine.getDailyState(npcId);
        var utterances = [npcText];

        for (var round = 1; round <= 3; round++) {
            var options = DailyEngine.generateLiveOptions(npcId, utterances[utterances.length - 1], state, 50,
                round > 1 ? utterances[utterances.length - 2] : undefined);
            var optTexts = options.map(function(o) { return o.playerOption || o; });
            console.log('    玩家: ' + optTexts.join(' / '));

            var playerChoice = optTexts[0] || '远远看着';
            var dlgCtx = {
                turnCount: round,
                lastNpcText: utterances[utterances.length - 1],
                currentTopic: '',
                recentUtterances: utterances.slice(-3),
                sessionTurn: round
            };

            var reply = DailyEngine.generateFollowUpReply(npcId, playerChoice, 'approach', dlgCtx);
            console.log('    猫: ' + reply);
            utterances.push(reply);

            // 检查：动物回复不应有人类语言
            if (reply.length > 0 && /[你我他她它这那什么为什么怎么因为所以如果虽然但是]/.test(reply) && !/喵|咪|呼噜|嘶/.test(reply)) {
                issues.push(name + ' 第' + round + '轮回复含人类语言: "' + reply + '"');
            }
        }

        // 6. 温柔互动测试
        setRelation(npcId, 60);
        DailyEngine.generateDailyState(npcId);
        var gentleReply = DailyEngine.generateFollowUpReply(npcId, '摸摸头', 'care', {
            turnCount: 1, lastNpcText: '喵~', recentUtterances: ['喵~'], sessionTurn: 1
        });
        console.log('  【温柔互动】摸摸头 → ' + gentleReply);

        // 7. 大声互动测试
        var loudReply = DailyEngine.generateFollowUpReply(npcId, '走开！', 'reject', {
            turnCount: 1, lastNpcText: '喵~', recentUtterances: ['喵~'], sessionTurn: 1
        });
        console.log('  【大声互动】走开！ → ' + loudReply);

        setRelation(npcId, 50); // 恢复
        return; // 动物NPC测试结束
    }

    // ── 人类NPC测试（原有逻辑）──
    setWeather('clear', '晴天');
    DailyEngine.generateDailyState(npcId);
    var dlg = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    console.log('  【晴天】');
    console.log('    开场: ' + dlg.opening);
    console.log('    话题: ' + dlg.topic);
    console.log('    结尾: ' + dlg.closing);

    // ── 2. 下雨开场 ──
    setWeather('rainy', '下雨');
    DailyEngine.generateDailyState(npcId);
    var dlgRain = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    console.log('  【下雨】');
    console.log('    话题: ' + dlgRain.topic);

    // ── 3. 3轮对话 ──
    setWeather('clear', '晴天');
    DailyEngine.generateDailyState(npcId);
    var dlgTalk = DailyEngine.generateContextDialogue(npcId, 'acquaintance');
    // 用fullDialogue（已是opening/topic二选一），不硬拼
    var npcText = dlgTalk.fullDialogue || dlgTalk.opening || dlgTalk.topic || '嗯，今天天气不错。';
    console.log('  【3轮对话】');
    console.log('    NPC: ' + npcText);

    var state = DailyEngine.getDailyState(npcId);
    var utterances = [npcText];

    for (var round = 1; round <= 3; round++) {
        var options = DailyEngine.generateLiveOptions(npcId, utterances[utterances.length - 1], state, 50,
            round > 1 ? utterances[utterances.length - 2] : undefined);
        var optTexts = options.map(function(o) { return o.playerOption || o; });

        // 检查选项质量
        optTexts.forEach(function(opt, i) {
            if (/阿福|云溪|铁匠|赵|兴奋地|笑着说|叹了口气/.test(opt)) {
                issues.push(name + ' 选项含NPC描述词: "' + opt + '"');
            }
        });

        var playerChoice = optTexts[0] || '嗯。';
        console.log('    玩家: ' + playerChoice);

        var dlgCtx = {
            turnCount: round,
            lastNpcText: utterances[utterances.length - 1],
            currentTopic: dlgTalk.topic || '',
            recentUtterances: utterances.slice(-3),
            sessionTurn: round
        };

        var reply = DailyEngine.generateFollowUpReply(npcId, playerChoice, 'listen', dlgCtx);
        console.log('    NPC: ' + reply);
        utterances.push(reply);

        // 检查回复质量
        if (reply.length < 3) {
            issues.push(name + ' 第' + round + '轮回复太短: "' + reply + '"');
        }
        // 检查循环污染
        if (playerChoice.length >= 2 && reply.indexOf(playerChoice) >= 0) {
            var shortWords = ['嗯', '啊', '哦', '好', '行', '是', '对', '吧', '呢', '嘛', '嗯嗯'];
            if (shortWords.indexOf(playerChoice) < 0) {
                issues.push(name + ' 第' + round + '轮循环污染: NPC回复包含玩家选项"' + playerChoice + '"');
            }
        }
        // 检查后缀堆叠（超过3个句号/感叹号结尾的连续后缀才算问题）
        var suffixPattern = /[。！][^。！]*[。！][^。！]*[。！][^。！]*[。！]/;
        if (suffixPattern.test(reply) && reply.length > 30) {
            issues.push(name + ' 第' + round + '轮可能后缀堆叠: "' + reply.substring(reply.length - 30) + '"');
        }
    }

    // ── 4. 高好感度对比 ──
    setRelation(npcId, 80);
    DailyEngine.generateDailyState(npcId);
    var dlgHigh = DailyEngine.generateContextDialogue(npcId, 'friend');
    setRelation(npcId, 50); // 恢复
    console.log('  【高好感(80)】');
    console.log('    开场: ' + dlgHigh.opening);
    console.log('    结尾: ' + dlgHigh.closing);
});

// ── 问题汇总 ──
console.log('\n\n╔' + '═'.repeat(78) + '╗');
console.log('║  问题汇总                                                              ║');
console.log('╚' + '═'.repeat(78) + '╝');

if (issues.length === 0) {
    console.log('\n  ✓ 未发现明显问题，所有NPC对话测试通过！');
} else {
    console.log('\n  发现 ' + issues.length + ' 个问题：\n');
    issues.forEach(function(issue, i) {
        console.log('  ' + (i + 1) + '. ' + issue);
    });
}

console.log('\n  测试NPC数: ' + allIds.length);
console.log('  问题数: ' + issues.length);
