/**
 * @fileoverview M1 会话管理模块
 * @description 负责接收用户粘贴的原始聊天文本，调用上下文解析模块将其结构化，
 *              以对话气泡形式展示在聊天面板，同时管理历史会话的创建、切换、重命名和删除。
 * @module conversation
 * @example
 *   import { ConversationModule } from './conversation.js';
 *   ConversationModule.init();
 *   ConversationModule.createSession();
 */

import { ContextParser } from './context-parser.js';
import { StorageAPI } from './storage.js';
import { EventBus } from './event-bus.js';

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成 UUID v4
 * @returns {string}
 */
function _uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 格式化相对时间显示
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string} 如 "刚刚"、"5分钟前"、"昨天"、"01-15"
 */
function _formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24 && days === 0) return `${hours}小时前`;

  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // 判断是否是昨天
  if (date.toDateString() === yesterday.toDateString()) return '昨天';

  // 判断是否是今年
  if (date.getFullYear() === today.getFullYear()) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}-${d}`;
  }

  // 其他情况显示完整日期
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 格式化时间戳为 HH:MM
 * @param {number} timestamp
 * @returns {string}
 */
function _formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ============================================================
// 会话管理模块
// ============================================================

/**
 * 会话管理模块
 * @namespace ConversationModule
 */
export const ConversationModule = {
  /** @type {Object|null} 当前活跃会话 */
  currentSession: null,

  /**
   * 创建新会话
   * @returns {Object} 新建的会话对象
   */
  createSession() {
    // 如果当前会话无内容，直接复用
    if (this.currentSession && (!this.currentSession.messages || this.currentSession.messages.length === 0)) {
      return this.currentSession;
    }

    const session = {
      id: _uuid(),
      title: '新会话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      settings: {
        myName: '',
        otherName: '',
      },
    };

    this.currentSession = session;

    // 清空聊天面板
    const chatPanel = document.getElementById('ycjs-chat-panel');
    if (chatPanel) {
      chatPanel.innerHTML = _renderEmptyState('聊天内容将显示在这里', '粘贴聊天记录即可开始分析');
    }

    // 触发事件
    EventBus.emit('session:created', { sessionId: session.id });

    // 保存并刷新列表
    this._saveCurrentSession();
    this.loadSessionList();

    return session;
  },

  /**
   * 解析并设置聊天内容
   * @param {string} rawText - 用户粘贴的原始聊天文本
   * @param {string} mode - 模式：'replace'（默认，替换所有消息）或 'append'（追加到末尾）
   */
  parseAndSet(rawText, mode = 'replace') {
    if (!rawText || !rawText.trim()) return;

    // 确保有活跃会话
    if (!this.currentSession) {
      this.createSession();
    }

    // 调用 M2 解析文本
    const result = ContextParser.parse(rawText);

    if (!result.success || result.messages.length === 0) {
      EventBus.emit('conversation:parse-error', { message: '无法识别聊天格式，请检查粘贴内容' });
      return;
    }

    // 自动识别 myName / otherName：取频率最高的两个发送者
    if (result.senders.length >= 2) {
      this.currentSession.settings.otherName = result.senders[0];
      this.currentSession.settings.myName = result.senders[1];
    } else if (result.senders.length === 1) {
      this.currentSession.settings.otherName = result.senders[0];
      this.currentSession.settings.myName = '我';
    }

    // 将解析结果转为内部消息格式
    const messages = result.messages.map((m, idx) => ({
      id: _uuid(),
      sender: m.sender,
      senderRole: m.sender === this.currentSession.settings.myName ? 'me' : 'other',
      content: m.content,
      timestamp: m.timestamp,
      parsed: true,
    }));

    // 根据 mode 决定替换还是追加
    if (mode === 'append' && this.currentSession.messages.length > 0) {
      this.currentSession.messages.push(...messages);
    } else {
      this.currentSession.messages = messages;
    }
    this.currentSession.updatedAt = Date.now();

    // 更新会话标题为对方名称
    if (this.currentSession.settings.otherName) {
      this.currentSession.title = this.currentSession.settings.otherName;
    }

    // 渲染气泡
    this.renderChatBubbles(messages);

    // 保存会话
    this._saveCurrentSession();
    this.loadSessionList();

    // 触发事件
    EventBus.emit('conversation:parsed', {
      sessionId: this.currentSession.id,
      messages,
    });
  },

  /**
   * 手动添加一条消息到当前会话
   * @param {string} sender - 发送者名称
   * @param {string} content - 消息内容
   * @param {string} senderRole - 角色：'me' 或 'other'（默认 'other'）
   */
  addSingleMessage(sender, content, senderRole = 'other') {
    if (!sender || !content) return;

    // 如果没有活跃会话，自动创建
    if (!this.currentSession) {
      this.createSession();
    }

    const msg = {
      id: _uuid(),
      sender,
      senderRole,
      content,
      timestamp: Date.now(),
      parsed: true,
    };

    // 追加到消息末尾
    this.currentSession.messages.push(msg);
    this.currentSession.updatedAt = Date.now();

    // 自动保存
    this._saveCurrentSession();

    // 重新渲染气泡
    this.renderChatBubbles(this.currentSession.messages);

    // 刷新会话列表
    this.loadSessionList();

    // 触发消息添加事件
    EventBus.emit('conversation:message-added', {
      sessionId: this.currentSession.id,
      message: msg,
    });
  },

  /**
   * 切换到指定会话
   * @param {string} sessionId - 目标会话 ID
   */
  async switchSession(sessionId) {
    if (this.currentSession && this.currentSession.id === sessionId) return;

    try {
      // 从 Storage 加载会话
      const session = await StorageAPI.getSession(sessionId);
      if (!session) {
        console.warn(`ConversationModule: 会话 ${sessionId} 不存在`);
        return;
      }

      // 加载消息
      const messages = await StorageAPI.getMessages(sessionId);
      session.messages = messages || [];

      this.currentSession = session;

      // 渲染气泡
      if (messages && messages.length > 0) {
        this.renderChatBubbles(messages);
      } else {
        const chatPanel = document.getElementById('ycjs-chat-panel');
        if (chatPanel) {
          chatPanel.innerHTML = _renderEmptyState('聊天内容将显示在这里', '粘贴聊天记录即可开始分析');
        }
      }

      // 更新列表高亮
      this._highlightActiveSession(sessionId);

      // 保存活跃会话 ID
      localStorage.setItem('ycjs_active_session', sessionId);

      // 触发事件
      EventBus.emit('conversation:switched', { sessionId });
    } catch (err) {
      console.error('ConversationModule.switchSession 出错:', err);
    }
  },

  /**
   * 删除指定会话
   * @param {string} sessionId - 目标会话 ID
   */
  async deleteSession(sessionId) {
    try {
      await StorageAPI.deleteSession(sessionId);

      // 如果删除的是当前会话，清空面板
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.currentSession = null;
        const chatPanel = document.getElementById('ycjs-chat-panel');
        if (chatPanel) {
          chatPanel.innerHTML = _renderEmptyState('暂无会话', '点击「新建会话」开始');
        }
      }

      // 触发事件
      EventBus.emit('conversation:deleted', { sessionId });

      // 重新加载列表
      this.loadSessionList();
    } catch (err) {
      console.error('ConversationModule.deleteSession 出错:', err);
    }
  },

  /**
   * 重命名会话
   * @param {string} sessionId - 目标会话 ID
   * @param {string} title - 新标题
   */
  async renameSession(sessionId, title) {
    if (!title || !title.trim()) return;

    const trimmedTitle = title.trim().substring(0, 50);
    try {
      // 如果是当前会话，更新内存
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.currentSession.title = trimmedTitle;
        this._saveCurrentSession();
      } else {
        // 从 Storage 加载、修改、保存
        const session = await StorageAPI.getSession(sessionId);
        if (session) {
          session.title = trimmedTitle;
          session.updatedAt = Date.now();
          await StorageAPI.saveSession(session);
        }
      }

      // 刷新列表
      this.loadSessionList();
    } catch (err) {
      console.error('ConversationModule.renameSession 出错:', err);
    }
  },

  /**
   * 设置发送者角色映射
   * @param {string} myName - 用户自己的昵称
   * @param {string} otherName - 对方昵称
   */
  setSenderMapping(myName, otherName) {
    if (!this.currentSession) return;

    this.currentSession.settings.myName = myName || '';
    this.currentSession.settings.otherName = otherName || '';

    // 重新标记消息角色
    if (this.currentSession.messages) {
      this.currentSession.messages.forEach((m) => {
        m.senderRole = m.sender === myName ? 'me' : 'other';
      });
    }

    // 重新渲染
    this.renderChatBubbles(this.currentSession.messages || []);
    this._saveCurrentSession();
  },

  /**
   * 获取当前会话消息用于 AI 生成
   * @returns {Array<{sender:string, senderRole:'me'|'other', content:string}>}
   */
  getMessagesForAI() {
    if (!this.currentSession || !this.currentSession.messages) return [];

    return this.currentSession.messages.map((m) => ({
      sender: m.sender,
      senderRole: m.senderRole,
      content: m.content,
    }));
  },

  /**
   * 在 #ycjs-chat-panel 中渲染对话气泡
   * @param {Array} messages - 消息数组
   */
  renderChatBubbles(messages) {
    const chatPanel = document.getElementById('ycjs-chat-panel');
    if (!chatPanel) return;

    if (!messages || messages.length === 0) {
      chatPanel.innerHTML = _renderEmptyState('聊天内容将显示在这里', '粘贴聊天记录即可开始分析');
      return;
    }

    // 合并同一发送者的连续消息
    const groups = this._groupConsecutiveMessages(messages);

    // 构建 HTML
    let html = '';
    // 消息计数提示
    html += `<div class="ycjs-chat-count">共 ${messages.length} 条消息</div>`;
    let animDelay = 0;

    for (const group of groups) {
      const isMe = group[0].senderRole === 'me';
      const senderName = group[0].sender;
      // 取第一条消息的时间作为显示时间
      const time = group[0].timestamp ? _formatTime(group[0].timestamp) : '';

      // 合并内容
      const contents = group.map((m) => _escapeHtml(m.content)).join('<br>');

      const animStyle = `animation: ycjsSlideUpFade 300ms ease-out ${animDelay}ms both;`;
      animDelay = Math.min(animDelay + 30, 600); // 限制最大延迟

      html += `
        <div class="ycjs-chat-bubble ${isMe ? 'ycjs-chat-bubble--me' : 'ycjs-chat-bubble--other'}" style="${animStyle}">
          <div class="ycjs-chat-bubble__avatar">${_escapeHtml(senderName.charAt(0))}</div>
          <div class="ycjs-chat-bubble__body">
            <div class="ycjs-chat-bubble__header">
              <span class="ycjs-chat-bubble__sender">${_escapeHtml(senderName)}</span>
              ${time ? `<span class="ycjs-chat-bubble__time">${time}</span>` : ''}
            </div>
            <div class="ycjs-chat-bubble__text">${contents}</div>
          </div>
        </div>`;
    }

    chatPanel.innerHTML = html;

    // 滚动到底部
    requestAnimationFrame(() => {
      chatPanel.scrollTop = chatPanel.scrollHeight;
    });
  },

  /**
   * 加载会话列表并渲染到 #ycjs-session-list
   */
  async loadSessionList() {
    const listEl = document.getElementById('ycjs-session-list');
    if (!listEl) return;

    try {
      const sessions = await StorageAPI.getAllSessions();

      // 按 updatedAt 倒序排列
      sessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      if (sessions.length === 0) {
        listEl.innerHTML = `
          <div class="ycjs-session-empty">
            <span>暂无历史会话</span>
          </div>`;
        return;
      }

      let html = '';
      for (const session of sessions) {
        const isActive = this.currentSession && this.currentSession.id === session.id;
        const title = _escapeHtml((session.title || '未命名').substring(0, 12));
        const time = _formatRelativeTime(session.updatedAt || session.createdAt);
        const msgCount = session.messageCount || 0;

        html += `
          <div class="ycjs-session-item ${isActive ? 'ycjs-session-item--active' : ''}"
               data-session-id="${session.id}"
               title="${_escapeHtml(session.title || '未命名')}">
            <div class="ycjs-session-item__content">
              <span class="ycjs-session-item__title">${title}</span>
              <span class="ycjs-session-item__time">${time}${msgCount ? ` · ${msgCount}条` : ''}</span>
            </div>
            <button class="ycjs-session-item__delete"
                    data-session-id="${session.id}"
                    title="删除会话">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>`;
      }

      listEl.innerHTML = html;

      // 绑定点击切换事件
      listEl.querySelectorAll('.ycjs-session-item__content').forEach((el) => {
        el.addEventListener('click', () => {
          const id = el.parentElement.dataset.sessionId;
          if (id) this.switchSession(id);
        });
      });

      // 绑定删除事件
      listEl.querySelectorAll('.ycjs-session-item__delete').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = el.dataset.sessionId;
          if (id && confirm('确定删除此会话？')) {
            this.deleteSession(id);
          }
        });
      });

      // 长按删除（移动端）
      let longPressTimer = null;
      listEl.querySelectorAll('.ycjs-session-item').forEach((el) => {
        el.addEventListener('touchstart', () => {
          longPressTimer = setTimeout(() => {
            const id = el.dataset.sessionId;
            if (id && confirm('确定删除此会话？')) {
              this.deleteSession(id);
            }
          }, 600);
        }, { passive: true });
        el.addEventListener('touchend', () => { clearTimeout(longPressTimer); }, { passive: true });
        el.addEventListener('touchmove', () => { clearTimeout(longPressTimer); }, { passive: true });
      });
    } catch (err) {
      console.error('ConversationModule.loadSessionList 出错:', err);
    }
  },

  /**
   * 初始化模块
   */
  async init() {
    try {
      // 1. 加载偏好设置
      // （偏好设置由 app.js 处理）

      // 2. 加载会话列表
      await this.loadSessionList();

      // 3. 恢复上次活跃会话
      const lastActiveId = localStorage.getItem('ycjs_active_session');
      if (lastActiveId) {
        await this.switchSession(lastActiveId);
      }

      // 4. 如果没有活跃会话，显示空状态
      if (!this.currentSession) {
        const chatPanel = document.getElementById('ycjs-chat-panel');
        if (chatPanel) {
          chatPanel.innerHTML = _renderEmptyState('暂无会话', '点击「新建会话」或粘贴聊天记录开始');
        }
      }
    } catch (err) {
      console.error('ConversationModule.init 出错:', err);
    }
  },

  // ============================================================
  // 内部方法
  // ============================================================

  /**
   * 保存当前会话到 Storage
   * @private
   */
  async _saveCurrentSession() {
    if (!this.currentSession) return;
    try {
      // 更新消息计数字段
      this.currentSession.messageCount = this.currentSession.messages ? this.currentSession.messages.length : 0;
      await StorageAPI.saveSession(this.currentSession);
      if (this.currentSession.messages && this.currentSession.messages.length > 0) {
        await StorageAPI.saveMessages(this.currentSession.id, this.currentSession.messages);
      }
    } catch (err) {
      console.error('ConversationModule._saveCurrentSession 出错:', err);
    }
  },

  /**
   * 高亮当前活跃会话
   * @param {string} sessionId
   * @private
   */
  _highlightActiveSession(sessionId) {
    const listEl = document.getElementById('ycjs-session-list');
    if (!listEl) return;

    listEl.querySelectorAll('.ycjs-session-item').forEach((el) => {
      el.classList.toggle('ycjs-session-item--active', el.dataset.sessionId === sessionId);
    });
  },

  /**
   * 合并同一发送者的连续消息
   * @param {Array} messages
   * @returns {Array<Array>}
   * @private
   */
  _groupConsecutiveMessages(messages) {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentGroup = [messages[0]];

    for (let i = 1; i < messages.length; i++) {
      const msg = messages[i];
      const prev = currentGroup[0];

      // 同一发送者且角色相同则合并
      if (msg.sender === prev.sender && msg.senderRole === prev.senderRole) {
        currentGroup.push(msg);
      } else {
        groups.push(currentGroup);
        currentGroup = [msg];
      }
    }
    groups.push(currentGroup);

    return groups;
  },
};

// ============================================================
// 辅助函数
// ============================================================

/**
 * HTML 转义
 * @param {string} str
 * @returns {string}
 * @private
 */
function _escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 渲染空状态
 * @param {string} title
 * @param {string} desc
 * @returns {string}
 * @private
 */
function _renderEmptyState(title, desc) {
  return `
    <div class="ycjs-empty-state">
      <div class="ycjs-empty-state__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ycjs-text-muted)" stroke-width="1.5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </div>
      <div class="ycjs-empty-state__title">${title}</div>
      <div class="ycjs-empty-state__desc">${desc}</div>
    </div>`;
}
