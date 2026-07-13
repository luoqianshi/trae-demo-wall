/**
 * 饭泛之交 - Chat 聊天
 * 模块化拆分自单文件原型
 */

// ==================== CHAT ====================
function renderChatList() {
  const container = document.getElementById('chat-list');
  container.innerHTML = mockChats.map((c,i) => `
    <div class="chat-item" onclick="openChat(${i})">
      <div class="chat-avatar">${c.avatar}</div>
      <div class="chat-info">
        <div class="chat-name">${c.name} <span class="chat-time">${c.time}</span></div>
        <div class="chat-preview">${c.preview}</div>
      </div>
      ${c.unread ? `<div class="chat-badge">${c.unread}</div>` : ''}
    </div>
  `).join('');
}

function openChat(idx) {
  Store.data.currentChat = idx;
  Store.save();
  const chat = mockChats[idx];
  chat.unread = 0;
  Store.save();
  document.getElementById('chat-room-name').textContent = chat.name;
  document.getElementById('chat-room').classList.add('active');
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML = `
    <div class="msg"><div class="msg-avatar">${chat.avatar}</div><div class="msg-bubble">${chat.preview}</div></div>
    <div class="msg self"><div class="msg-avatar">${Store.user?.avatar || '😊'}</div><div class="msg-bubble">好的，期待见面！</div></div>
    <div class="msg"><div class="msg-avatar">${chat.avatar}</div><div class="msg-bubble">餐厅地址我发你啦 📍</div></div>
  `;
  renderChatList();
  setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 50);
}

function closeChat() {
  document.getElementById('chat-room').classList.remove('active');
  Store.data.currentChat = null;
  Store.save();
}

function sendMsg() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text) return;
  appendMsg('self', text);
  input.value = '';
  // Auto reply
  setTimeout(() => {
    const replies = ['收到！','哈哈哈','我也这么觉得','好呀好呀','👍👍','马上到~','听起来不错！','确实确实'];
    const reply = replies[Math.floor(Math.random()*replies.length)];
    appendMsg('other', reply);
  }, 800);
}

function appendMsg(type, text, extraHtml) {
  const msgs = document.getElementById('chat-messages');
  const avatar = type === 'self' ? (Store.user?.avatar || '😊') : mockChats[Store.data.currentChat]?.avatar || '😊';
  const html = `<div class="msg ${type}"><div class="msg-avatar">${avatar}</div><div class="msg-bubble">${text}${extraHtml || ''}</div></div>`;
  msgs.insertAdjacentHTML('beforeend', html);
  msgs.scrollTop = msgs.scrollHeight;
}

function sendIcebreaker(text) {
  appendMsg('self', text);
  setTimeout(() => {
    const replies = [
      '哈哈这个问题好！我最喜欢蜀大侠了，你呢？',
      '周末嘛，一般去三里屯那边逛逛吃吃～',
      '有有有！我知道一家超隐蔽的日料店，下次带你去！',
      '说到吃我就来劲了，你有什么推荐的吗？'
    ];
    appendMsg('other', replies[Math.floor(Math.random()*replies.length)]);
  }, 1000);
}

function toggleEmojiPicker() {
  document.getElementById('emoji-picker').classList.toggle('active');
}

function insertEmoji(emoji) {
  const input = document.getElementById('chat-input');
  input.value += emoji;
  input.focus();
}

function sendImage() {
  appendMsg('self', '', '<img class="msg-image" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'150\'%3E%3Crect width=\'200\' height=\'150\' fill=\'%23FFE4E1\' rx=\'14\'/%3E%3Ctext x=\'100\' y=\'80\' text-anchor=\'middle\' font-size=\'48\'%3E🍲%3C/text%3E%3C/svg%3E" alt="美食图片">');
  setTimeout(() => appendMsg('other', '哇看起来好诱人！😋'), 800);
}

function sendLocation() {
  appendMsg('self', '', '<div class="msg-location">📍 蜀大侠火锅（望京店）<br><span style="font-size:11px;opacity:.7;">朝阳区望京SOHO T1 · 距你1.2km</span></div>');
  setTimeout(() => appendMsg('other', '收到！我6点到 🚗'), 800);
}