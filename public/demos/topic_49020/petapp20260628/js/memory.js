/* memory.js — 共享对话记忆（全局单例 Memory） */
/* 维护 messages[] + localStorage 持久化，提供快照供双 Agent 并行安全读取 */

const Memory = {
  STORAGE_KEY: 'petapp_memory',
  messages: [],

  init() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
    } catch (e) {
      saved = null;
    }
    if (saved && Array.isArray(saved) && saved.length > 0) {
      this.messages = saved;
    } else {
      this.messages = [{ role: 'system', content: Config.data.chatSystemPrompt }];
    }
  },

  /** 追加用户消息并持久化 */
  addUser(text) {
    this.messages.push({ role: 'user', content: text });
    this.persist();
  },

  /** 追加助手回复并持久化 */
  addAssistant(text) {
    if (text && text.trim()) {
      this.messages.push({ role: 'assistant', content: text });
      this.persist();
    }
  },

  /** 动作 Agent 决策写回：以 system 备注形式注入角色状态 */
  addActionNote(action, expression, bubble) {
    let note = '[角色状态] 动作:' + action + ' 表情:' + expression;
    if (bubble) note += ' 语气:"' + bubble + '"';
    this.messages.push({ role: 'system', content: note });
    this.persist();
  },

  /** 全量深拷贝快照（聊天 Agent 用，含 system+历史+动作备注） */
  snapshot() {
    return this.messages.map(m => ({ role: m.role, content: m.content }));
  },

  /** 最近 n 条 user/assistant 深拷贝（动作 Agent 用，省 token） */
  recentContext(n = 6) {
    return this.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-n)
      .map(m => ({ role: m.role, content: m.content }));
  },

  /** 同步顶部 system 提示词（设置面板保存后调用） */
  updateSystemPrompt(prompt) {
    if (this.messages[0] && this.messages[0].role === 'system') {
      this.messages[0].content = prompt;
    } else {
      this.messages.unshift({ role: 'system', content: prompt });
    }
    this.persist();
  },

  persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages));
    } catch (e) {
      // 存储满或隐私模式，静默忽略
    }
  },

  clear() {
    this.messages = [{ role: 'system', content: Config.data.chatSystemPrompt }];
    localStorage.removeItem(this.STORAGE_KEY);
  }
};
