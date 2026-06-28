/* chat-ui.js — 聊天 UI 渲染（全局单例 ChatUI） */
/* 渲染消息列表、流式追加、输入交互、emoji 选择器、图片上传 */

const ChatUI = {
  list: null,
  input: null,
  sendBtn: null,
  stopBtn: null,
  emojiBtn: null,
  imageBtn: null,
  imageFile: null,
  emojiPanel: null,
  imagePreview: null,
  currentAssistantEl: null,
  pendingImage: null, // { dataUrl, name } 待发送的图片

  // 常用 emoji 列表
  emojis: [
    '😀','😁','😂','🤣','😊','😍','🥰','😘','😜','🤪','😎','🤩',
    '🥳','😇','🤔','🤨','😐','😴','🤤','😪','😭','😢','😡','🤬',
    '😱','😨','😰','🤗','🤭','🤫','😶','🙄','😏','😬','😌','😔',
    '💪','👍','👎','👏','🙏','🤝','✌️','🤞','🤟','🤘','👌','🙌',
    '👋','✨','💫','⭐','🌟','⚡','🔥','💖','💕','💝','❤️','🧡',
    '💛','💚','💙','💜','🌹','🌸','🌻','🌈','☀️','🌧️','❄️','🌙',
    '🎶','🎵','♪','♫','🎉','🎊','🎈','🎁','🐱','🐶','🐰','🐻'
  ],

  init() {
    this.list = document.getElementById('message-list');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');
    this.stopBtn = document.getElementById('stop-btn');
    this.emojiBtn = document.getElementById('emoji-btn');
    this.imageBtn = document.getElementById('image-btn');
    this.imageFile = document.getElementById('image-file');
    this.emojiPanel = document.getElementById('emoji-panel');
    this.imagePreview = document.getElementById('image-preview');

    // 自适应高度
    this.input.addEventListener('input', () => this._autoResize());

    // 回车发送 / Shift+回车换行
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendBtn.click();
      }
    });

    // emoji 选择器
    this._initEmojiPanel();
    this.emojiBtn.addEventListener('click', () => this._toggleEmojiPanel());

    // 图片上传
    this.imageBtn.addEventListener('click', () => this.imageFile.click());
    this.imageFile.addEventListener('change', (e) => this._handleImageSelect(e));
  },

  // ===== Emoji 面板 =====
  _initEmojiPanel() {
    this.emojis.forEach(em => {
      const span = document.createElement('span');
      span.className = 'emoji-item';
      span.textContent = em;
      span.addEventListener('click', () => {
        this._insertAtCursor(em);
        this.input.focus();
      });
      this.emojiPanel.appendChild(span);
    });
  },

  _toggleEmojiPanel() {
    const show = this.emojiPanel.style.display === 'none';
    this.emojiPanel.style.display = show ? 'grid' : 'none';
    this.emojiBtn.classList.toggle('active', show);
  },

  _insertAtCursor(text) {
    const inp = this.input;
    const start = inp.selectionStart;
    const end = inp.selectionEnd;
    inp.value = inp.value.slice(0, start) + text + inp.value.slice(end);
    inp.selectionStart = inp.selectionEnd = start + text.length;
    this._autoResize();
  },

  // ===== 图片上传 =====
  _handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.addErrorMessage('只能发送图片文件哦~');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.addErrorMessage('图片太大了，请发送 5MB 以内的图片~');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      this.pendingImage = { dataUrl: ev.target.result, name: file.name };
      this._renderImagePreview();
    };
    reader.readAsDataURL(file);
    // 重置 input 以便重复选同一文件
    e.target.value = '';
  },

  _renderImagePreview() {
    if (!this.pendingImage) {
      this.imagePreview.style.display = 'none';
      this.imagePreview.innerHTML = '';
      return;
    }
    this.imagePreview.style.display = 'flex';
    this.imagePreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = this.pendingImage.dataUrl;
    const name = document.createElement('span');
    name.className = 'img-name';
    name.textContent = this.pendingImage.name;
    const remove = document.createElement('button');
    remove.className = 'img-remove';
    remove.textContent = '✕';
    remove.title = '移除图片';
    remove.addEventListener('click', () => this.clearPendingImage());
    this.imagePreview.appendChild(img);
    this.imagePreview.appendChild(name);
    this.imagePreview.appendChild(remove);
  },

  clearPendingImage() {
    this.pendingImage = null;
    this._renderImagePreview();
  },

  _autoResize() {
    this.input.style.height = 'auto';
    this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
  },

  // ===== 消息渲染 =====
  addUserMessage(text, imageDataUrl) {
    const div = document.createElement('div');
    div.className = 'msg user';
    if (imageDataUrl) {
      const img = document.createElement('img');
      img.className = 'msg-image';
      img.src = imageDataUrl;
      img.addEventListener('click', () => window.open(imageDataUrl, '_blank'));
      div.appendChild(img);
    }
    if (text) {
      const span = document.createElement('span');
      span.textContent = text;
      div.appendChild(span);
    }
    this.list.appendChild(div);
    this.scrollBottom();
  },

  startAssistantMessage() {
    const div = document.createElement('div');
    div.className = 'msg assistant cursor';
    this.list.appendChild(div);
    this.currentAssistantEl = div;
    this.scrollBottom();
    return div;
  },

  appendToken(token) {
    if (!this.currentAssistantEl) return;
    this.currentAssistantEl.textContent += token;
    this.scrollBottom();
  },

  finalizeAssistantMessage() {
    if (this.currentAssistantEl) {
      this.currentAssistantEl.classList.remove('cursor');
      this.currentAssistantEl = null;
    }
  },

  addErrorMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg error';
    div.textContent = text;
    this.list.appendChild(div);
    this.scrollBottom();
  },

  addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg system';
    div.textContent = text;
    this.list.appendChild(div);
    this.scrollBottom();
  },

  setGenerating(isGen) {
    if (isGen) {
      this.sendBtn.style.display = 'none';
      this.stopBtn.style.display = '';
      this.input.disabled = false;
    } else {
      this.sendBtn.style.display = '';
      this.stopBtn.style.display = 'none';
      this.input.disabled = false;
      this._autoResize();
    }
  },

  scrollBottom() {
    requestAnimationFrame(() => {
      this.list.scrollTop = this.list.scrollHeight;
    });
  },

  clearAll() {
    this.list.innerHTML = '';
    this.currentAssistantEl = null;
  },

  /** 从 Memory 恢复历史消息到界面 */
  restoreHistory() {
    this.clearAll();
    Memory.messages.forEach(m => {
      if (m.role === 'user') {
        // 兼容 content 为字符串或数组（图片消息）
        const text = typeof m.content === 'string' ? m.content : '';
        this.addUserMessage(text);
      } else if (m.role === 'assistant') {
        const div = document.createElement('div');
        div.className = 'msg assistant';
        div.textContent = typeof m.content === 'string' ? m.content : '';
        this.list.appendChild(div);
      }
      // system 角色备注不显示
    });
    this.scrollBottom();
  }
};
