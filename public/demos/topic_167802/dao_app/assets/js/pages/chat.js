/* 问道 · AI 修行助手 */
(function (App) {
  'use strict';
  var h = App.h, Store = App.Store;

  // 从模块带上下文进入时的开场提示
  var HINTS = {
    bazi: '我看到你刚排了八字。想了解哪方面？比如五行如何补益、日主性情，或事业与人际的相处之道。',
    face: '刚做完面相观察。想聊聊如何通过作息与情志调养气色吗？',
    divination: '关于刚才那一卦，你可以问我卦象的含义，或如何把它的启发落到具体的选择上。'
  };

  function render(params) {
    var wrap = h('div');
    var st = Store.get();

    var scroll = h('.chat-scroll', { id: 'chatScroll' });
    wrap.appendChild(scroll);

    // 历史消息
    if (!st.chatHistory.length) {
      addBubble(scroll, 'ai', '道友有礼。我是你的 AI 修行助手，可为你讲解山、医、命、相、卜五术。想从哪里开始？', false);
    } else {
      st.chatHistory.forEach(function (m) { addBubble(scroll, m.role, m.text, false); });
    }

    // 带上下文开场
    if (params && params.hint && HINTS[params.hint]) {
      addBubble(scroll, 'ai', HINTS[params.hint], false);
    }

    // 建议问题
    var suggest = h('.chat-suggest');
    App.Mock.AI_SUGGEST.forEach(function (s) {
      suggest.appendChild(h('.sg', { text: s, onclick: function () { sendMsg(s); } }));
    });
    wrap.appendChild(suggest);

    // 输入栏（绝对定位于手机屏幕底部、Tab 之上）
    var input = h('input', { type: 'text', placeholder: '向修行助手提问…' });
    var sendBtn = h('button.send', { text: '➤' });
    var bar = h('.chat-input-bar', {}, [ input, sendBtn ]);
    wrap.appendChild(bar);

    function sendMsg(text) {
      text = (text || input.value || '').trim();
      if (!text) return;
      input.value = '';
      addBubble(scroll, 'me', text, true);
      Store.pushLog('chatHistory', { role: 'me', text: text });
      scrollDown(scroll);

      // 思考中气泡
      var typing = h('.bubble.ai', {}, [ h('.dot-typing', { html: '<span>●</span><span>●</span><span>●</span>' }) ]);
      scroll.appendChild(typing);
      scrollDown(scroll);

      var ctx = params && params.hint ? { hint: HINTS[params.hint] } : null;
      App.Mock.chatWithAI(text, ctx).then(function (reply) {
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        typewriter(scroll, reply);
        Store.pushLog('chatHistory', { role: 'ai', text: reply });
      });
    }

    sendBtn.onclick = function () { sendMsg(); };
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMsg(); });

    setTimeout(function () { scrollDown(); }, 100);
    return wrap;
  }

  function addBubble(scroll, role, text, scrolldown) {
    scroll.appendChild(h('.bubble.' + role, { text: text }));
    if (scrolldown) scrollDown();
  }

  // 打字机效果
  function typewriter(scroll, text) {
    var bubble = h('.bubble.ai', { text: '' });
    scroll.appendChild(bubble);
    var i = 0;
    var timer = setInterval(function () {
      bubble.textContent = text.slice(0, i);
      i++;
      scrollDown();
      if (i > text.length) clearInterval(timer);
    }, 22);
  }

  function scrollDown() {
    var view = document.getElementById('view');
    if (view) view.scrollTop = view.scrollHeight;
  }

  App.Pages = App.Pages || {};
  App.Pages.chat = { title: '问道 · AI 修行助手', tab: 'home', back: 'home', render: render };
})(window.App);
