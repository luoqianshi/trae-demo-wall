/**
 * AIChatPage.js - AI情绪分析页控制器
 * 管理AI对话交互，提供情绪分析、打字机效果、训练建议跳转
 * 原生 ES6+，严格模式
 */
'use strict';

const AIChatPage = {
  /** AIChatEngine 实例引用 */
  _engine: null,

  /** 当前情绪分析结果 { type, matchedKeywords, pattern } */
  _analysisResult: null,

  /** 是否正在分析中（防止重复发送） */
  _isAnalyzing: false,

  /** 当前正在打字的AI消息ID（用于实时更新打字机内容） */
  _typingBubbleId: null,

  // ============================================================
  // 生命周期
  // ============================================================

  /**
   * 渲染AI对话页 HTML
   * 包含消息列表区域和底部输入区域
   * @returns {string} 对话页面 HTML 字符串
   */
  render() {
    return `
      <div class="page ai-chat">
        <div id="chatMessages" class="ai-chat__messages"></div>
        <div class="ai-chat__input-area">
          <div class="ai-chat__input-wrapper">
            <input id="chatInput" class="ai-chat__input" placeholder="告诉我你现在感觉怎么样..." disabled />
            <button id="voiceBtn" class="ai-chat__voice-btn" onclick="AIChatPage.startVoice()">🎤</button>
          </div>
          <button id="sendBtn" class="ai-chat__send-btn" onclick="AIChatPage.sendMessage()" disabled>➤</button>
        </div>
      </div>
    `;
  },

  /**
   * 页面挂载：初始化对话引擎，设置事件绑定，播放AI问候语
   * @param {HTMLElement} pageView - 页面 DOM 元素
   * @param {Object} [params] - 路由参数
   */
  mount(pageView, params = {}) {
    // 显示导航栏
    if (typeof NavBar !== 'undefined' && typeof NavBar.show === 'function') {
      NavBar.show('ai-chat');
    }

    // 绑定输入框回车发送事件
    this._bindEnterKey();

    // 初始化对话引擎
    this._initEngine();

    // 播放AI问候语
    this._playGreeting();
  },

  // ============================================================
  // 引擎初始化
  // ============================================================

  /**
   * 初始化 AIChatEngine 实例
   * 注入情绪模式数据，设置消息、动作、打字机回调
   */
  _initEngine() {
    if (typeof AIChatEngine === 'undefined') {
      console.warn('[AIChatPage] AIChatEngine 不可用，对话功能将受限');
      return;
    }

    this._engine = new AIChatEngine({
      typingSpeed: 40,
      minTypingDelay: 500,
      maxTypingDelay: 3000,
    });

    // 注入情绪识别模式
    if (typeof EMOTION_PATTERNS !== 'undefined') {
      this._engine.setEmotionPatterns(EMOTION_PATTERNS);
    }

    // 设置回调
    this._engine.setCallbacks(
      (message) => this._onEngineMessage(message),
      (action) => this._onEngineAction(action),
      (progress) => this._onEngineTyping(progress)
    );
  },

  /**
   * 绑定输入框回车键发送
   */
  _bindEnterKey() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  },

  // ============================================================
  // 对话流程
  // ============================================================

  /**
   * 播放AI问候语流
   * 调用引擎的 greeting 对话流，逐字显示欢迎消息
   */
  async _playGreeting() {
    if (!this._engine) return;

    this._isAnalyzing = true;
    try {
      await this._engine.playFlow('greeting');
    } catch (error) {
      console.error('[AIChatPage] 问候语播放失败:', error);
      this.addMessage('你好，我是抱抱自己助手。有什么想聊的吗？', 'ai', { id: 'greeting-fallback' });
      this._focusInput();
    } finally {
      this._isAnalyzing = false;
    }
  },

  /**
   * 引擎消息回调：AI 消息完整输出完成时触发
   * 用于更新打字机气泡的最终内容
   * @param {Object} message - 消息对象 { id, text, typed, delay, action }
   */
  _onEngineMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // 更新正在打字的气泡为最终文本（移除光标）
    if (this._typingBubbleId) {
      const bubble = chatMessages.querySelector(
        `[data-message-id="${this._typingBubbleId}"]`
      );
      if (bubble) {
        bubble.textContent = message.typed || message.text;
      }
      this._typingBubbleId = null;
    }
  },

  /**
   * 引擎动作回调：消息中的 action 指令触发
   * @param {string} action - 动作指令标识
   *   'show-input'       - 显示并聚焦输入框
   *   'emotion-reveal'   - 显示情绪分析结果
   *   'open-cbt-form'    - 分析完成，显示 CBT 训练按钮
   *   'open-boundary-scissors' - 分析完成，显示课题分离训练按钮
   *   'open-breathing'   - 分析完成，显示呼吸练习按钮
   */
  _onEngineAction(action) {
    switch (action) {
      case 'show-input':
        this._focusInput();
        break;
      case 'emotion-reveal':
        this._showEmotionResult();
        break;
      case 'open-cbt-form':
        this._showTrainingButton('cbt-form');
        break;
      case 'open-boundary-scissors':
        this._showTrainingButton('boundary-scissors');
        break;
      case 'open-breathing':
        this._showTrainingButton('breathing');
        break;
      default:
        console.log('[AIChatPage] 未处理的动作指令:', action);
        break;
    }
  },

  /**
   * 引擎打字机逐字回调：每输出一个字符触发
   * 实时更新最后一条 AI 消息气泡的文本内容
   * @param {Object} progress - 打字进度 { char, index, total, typed }
   */
  _onEngineTyping(progress) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // 首次输出字符时创建消息气泡
    if (progress.index === 0) {
      this._typingBubbleId = 'typing-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      this.addMessage('', 'ai', { id: this._typingBubbleId });
    }

    // 更新气泡内容，非末尾字符显示光标
    if (this._typingBubbleId) {
      const bubble = chatMessages.querySelector(
        `[data-message-id="${this._typingBubbleId}"]`
      );
      if (bubble) {
        const cursor = progress.index < progress.total - 1 ? '\u258C' : '';
        bubble.textContent = progress.typed + cursor;
      }
    }
  },

  // ============================================================
  // 用户操作
  // ============================================================

  /**
   * 发送消息：获取输入内容，添加用户消息气泡，调用引擎分析
   * 分析流程：情绪检测 -> 分析中过渡 -> 情绪揭示 -> 响应流播放
   */
  async sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text || this._isAnalyzing) return;

    // 清空输入框
    input.value = '';

    // 添加用户消息气泡
    this.addMessage(text, 'user');

    this._isAnalyzing = true;

    try {
      if (!this._engine) {
        this.addMessage('抱歉，对话引擎暂不可用，请稍后再试。', 'ai', { id: 'engine-unavailable' });
        this._isAnalyzing = false;
        return;
      }

      // 分析用户输入，检测情绪类型
      const result = this._engine.analyzeUserInput(text);
      this._analysisResult = result;

      // 更新 Store 中的对话状态
      Store.setState('chatSession', {
        currentEmotion: result.type || null,
        isAnalyzing: true,
        messages: [
          ...(Store.getState('chatSession.messages') || []),
          { role: 'user', content: text, timestamp: Date.now() },
        ],
      });

      // 播放分析中的过渡提示（"让我想想…" 等）
      await this._engine.playFlow('analyzing');

      // 根据情绪类型播放对应的响应流
      if (result.type) {
        const flowKey = result.type + '_response';
        await this._engine.playFlow(flowKey);
      } else {
        // 未匹配到情绪模式，给出友好提示
        const fallbackMsg = {
          id: 'fallback-' + Date.now(),
          text: '谢谢你的分享。可以再多说一些你的感受吗？我会尽力帮你。',
          delay: 600,
        };
        await this._engine.typeMessage(fallbackMsg);
      }

      // 更新 Store 分析状态
      Store.setState('chatSession', {
        isAnalyzing: false,
        messages: [
          ...(Store.getState('chatSession.messages') || []),
          { role: 'ai', content: '分析完成', timestamp: Date.now() },
        ],
      });
    } catch (error) {
      console.error('[AIChatPage] 分析过程出错:', error);
      this.addMessage('抱歉，我遇到了一些问题。请再试一次。', 'ai', { id: 'error-response' });
    } finally {
      this._isAnalyzing = false;
    }
  },

  /**
   * 模拟语音输入
   * 从 DEMO_DATA.chatExamples 中随机选取一条预设文本填入输入框
   * 适用于演示模式，模拟真实语音识别效果
   */
  startVoice() {
    if (typeof DEMO_DATA === 'undefined' || !DEMO_DATA.chatExamples || DEMO_DATA.chatExamples.length === 0) {
      console.warn('[AIChatPage] 演示数据不可用，无法模拟语音输入');
      return;
    }

    const examples = DEMO_DATA.chatExamples;
    const randomIndex = Math.floor(Math.random() * examples.length);
    const example = examples[randomIndex];

    const input = document.getElementById('chatInput');
    if (!input) return;

    // 模拟语音识别填入选中的预设文本
    input.value = example.input || '';
    input.focus();

    // 视觉反馈：脉冲动画模拟语音识别中
    input.style.animation = 'pulse 1s ease';
    setTimeout(() => {
      input.style.animation = '';
    }, 1000);
  },

  // ============================================================
  // UI 辅助方法
  // ============================================================

  /**
   * 添加消息气泡到列表
   * @param {string} content - 消息文本内容
   * @param {'user'|'ai'} role - 消息角色
   * @param {Object} [options] - 可选配置
   * @param {string} [options.id] - 消息唯一标识，用于 data-message-id
   * @param {string} [options.style] - 额外样式字符串
   */
  addMessage(content, role, options = {}) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // 创建气泡容器
    const bubble = document.createElement('div');
    bubble.className = 'ai-chat__bubble--' + role + ' chat-bubble-enter';
    if (options.id) {
      bubble.dataset.messageId = options.id;
    }
    if (options.style) {
      bubble.style.cssText += options.style;
    }
    bubble.textContent = content;

    chatMessages.appendChild(bubble);

    // 自动滚动到底部
    this._scrollToBottom();
  },

  /**
   * 聚焦输入框并启用发送按钮
   */
  _focusInput() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    if (input) {
      input.disabled = false;
      input.focus();
    }
    if (sendBtn) {
      sendBtn.disabled = false;
    }
  },

  /**
   * 显示情绪分析结果
   * 在分析中过渡完成后，展示检测到的情绪类型名称
   */
  _showEmotionResult() {
    if (!this._analysisResult || !this._analysisResult.type) {
      this.addMessage('我暂时还没有完全理解你的感受，可以再说详细一些吗？', 'ai', {
        id: 'emotion-unknown',
      });
      return;
    }

    const pattern = this._analysisResult.pattern;
    if (pattern) {
      const emotionName = pattern.name || '某种情绪';
      const color = pattern.color || '#E8A87C';
      this.addMessage(
        '我感觉到你现在的情绪是\u300C' + emotionName + '\u300D，我能感受到这种状态。',
        'ai',
        { id: 'emotion-reveal', style: 'border-left: 4px solid ' + color + ';' }
      );
    }
  },

  /**
   * 显示"开始训练"按钮
   * 在分析完成后展示，点击跳转到对应训练模块
   * @param {string} targetPage - 目标页面路由名称
   */
  _showTrainingButton(targetPage) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'text-align: center; margin: 16px 0;';

    const btn = document.createElement('button');
    btn.className = 'btn ai-chat__action-btn';
    btn.textContent = '开始训练 \u2192';
    btn.addEventListener('click', () => {
      if (typeof App !== 'undefined' && typeof App.navigateTo === 'function') {
        App.navigateTo(targetPage);
      }
    });

    btnContainer.appendChild(btn);
    chatMessages.appendChild(btnContainer);

    this._scrollToBottom();
  },

  /**
   * 滚动聊天区域到底部
   * 使用 requestAnimationFrame 确保 DOM 更新后执行
   */
  _scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }
  },
};

// 注册页面到待处理队列（App初始化后自动注册）
window._pageRegistrations = window._pageRegistrations || [];
window._pageRegistrations.push({page: 'ai-chat', controller: AIChatPage});

// 暴露到全局，供 inline onclick 调用
window.AIChatPage = AIChatPage;