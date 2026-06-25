// ============ 心声树洞 - AI 情感陪伴（规则模拟） ============
(function(global){
  'use strict';

  const Lib = global.TH.Lib;
  const Store = global.TH.Store;

  // 针对用户输入生成一组回复（首句 + 追问 + 建议）
  function respond(userText){
    const emotion = Lib.detectEmotion(userText);
    const replies = Lib.AI_REPLIES;
    const out = [];

    // 问候
    if (/\b(你好|hi|hello|在吗|在么)\b/i.test(userText) || userText.trim().length < 3){
      out.push(Lib.randomPick(replies.greeting));
      return out;
    }

    // 主要情绪回应
    out.push(Lib.randomPick(replies[emotion] || replies.generic));

    // 追问（让用户多表达）
    const followUps = {
      anxiety: '能告诉我，这种感觉是什么时候开始的吗？',
      lonely:  '如果此刻有一个人可以说话，你最想对 TA 说什么？',
      anger:   '如果这份愤怒有颜色，它会是什么样的？',
      lost:    '如果不考虑"应该"，你真正想要的是什么？',
      heal:    '你愿意分享，是什么让你感觉好起来的吗？'
    };
    out.push(followUps[emotion] || '愿意再多说一点吗？');

    // 建议卡
    if (Math.random() < 0.55){
      const suggestions = {
        anxiety: ['呼吸 4-7-8 练习','写下此刻最担心的三件事','给一个信任的人发一条消息'],
        lonely:  ['去咖啡馆坐一会儿','给家里打个电话','写一封信给自己'],
        anger:   ['去空旷的地方走 15 分钟','把愤怒写在纸上','听一首节奏强烈的歌'],
        lost:    ['写下五年前的自己','做一个"最小可行选择"','画一张此刻的人生地图'],
        heal:    ['记录此刻的感受','把这份温柔分享给别人','给自己买一份小礼物']
      };
      out.push('我想邀请你试试：' + Lib.randomPick(suggestions[emotion] || suggestions.heal));
    }

    return out;
  }

  // 模拟"流式"打字，每条回复延时返回
  function simulateReply(userText, onReply, onDone){
    const lines = respond(userText);
    let i = 0;
    function next(){
      if (i >= lines.length){ onDone && onDone(); return; }
      const line = lines[i++];
      // 打字机效果：把 line 拆成字符逐步追加
      let j = 0;
      const tmp = { text: '' };
      const timer = setInterval(() => {
        tmp.text += line.charAt(j++);
        onReply(line, true); // 追加当前字符
        if (j >= line.length){
          clearInterval(timer);
          setTimeout(next, 450);
        }
      }, 28);
    }
    next();
  }

  global.TH = global.TH || {};
  global.TH.AI = { respond, simulateReply };

})(window);
