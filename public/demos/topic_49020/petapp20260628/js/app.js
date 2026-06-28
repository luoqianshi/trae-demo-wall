/* app.js — 主编排（接线、双 Agent 协调、事件绑定、Demo 模式、天气） */

(function () {
  // ===== 初始化 =====
  Config.load();
  Memory.init();
  Weather.init();
  Character.init();
  ChatUI.init();
  Settings.init();

  // 恢复历史消息到界面
  ChatUI.restoreHistory();

  let currentController = null;

  // ===== 天气切换按钮 =====
  const weatherBtn = document.getElementById('weather-cycle-btn');
  if (weatherBtn) {
    weatherBtn.addEventListener('click', () => Weather.cycle());
  }

  // ===== Demo 模式处理 =====
  async function handleDemo(text) {
    ChatUI.setGenerating(true);
    Character.setBusy(true);
    ChatUI.startAssistantMessage();

    try {
      await Demo.run({
        text: text,
        onToken: (t) => ChatUI.appendToken(t),
        onDone: (args) => {
          // 执行小人动作
          Character.perform(args);
          Memory.addActionNote(args.action, args.expression, args.bubble);
        }
      });
      // 保存到记忆（文本部分）
      const replyEl = ChatUI.currentAssistantEl;
      if (replyEl) {
        Memory.addAssistant(replyEl.textContent);
      }
    } catch (e) {
      ChatUI.addErrorMessage('Demo 出错：' + e.message);
    } finally {
      ChatUI.finalizeAssistantMessage();
      ChatUI.setGenerating(false);
      Character.setBusy(false);
    }
  }

  // ===== 发送处理 =====
  async function handleSend() {
    const text = ChatUI.input.value.trim();
    const pendingImage = ChatUI.pendingImage;

    // 没有文字也没有图片则不发送
    if (!text && !pendingImage) return;

    // ===== Demo 模式（未配置 API Key）=====
    if (!Config.isReady()) {
      // 渲染用户消息
      ChatUI.addUserMessage(text, pendingImage ? pendingImage.dataUrl : null);
      ChatUI.input.value = '';
      ChatUI.input.style.height = 'auto';
      ChatUI.clearPendingImage();
      Memory.addUser(text || '[图片]');

      ChatUI.addSystemMessage('🎭 Demo 模式：未配置 API Key，根据关键词模拟回复~');
      await handleDemo(text || '看看这张图');
      return;
    }

    // ===== 正常 AI 模式 =====
    // 构造图片消息（如果有图片）
    let imageMessage = null;
    if (pendingImage) {
      imageMessage = {
        role: 'user',
        content: [
          { type: 'text', text: text || '看看这张图片~' },
          { type: 'image_url', image_url: { url: pendingImage.dataUrl } }
        ]
      };
    }

    // 渲染用户消息
    ChatUI.addUserMessage(text, pendingImage ? pendingImage.dataUrl : null);
    ChatUI.input.value = '';
    ChatUI.input.style.height = 'auto';
    // 存记忆：图片消息只存文本标记（base64 太大不存 localStorage）
    Memory.addUser(text || '[图片]');
    ChatUI.clearPendingImage();

    // 进入生成状态
    ChatUI.setGenerating(true);
    Character.setBusy(true);
    ChatUI.startAssistantMessage();

    currentController = new AbortController();

    // 聊天 Agent：流式生成回复（支持图片）
    const runChat = async () => {
      try {
        await ChatAgent.reply({
          onToken: (t) => ChatUI.appendToken(t),
          signal: currentController.signal,
          imageMessage: imageMessage
        });
      } catch (e) {
        if (e.name === 'AbortError') {
          ChatUI.addSystemMessage('（已停止生成）');
        } else {
          // 图片相关错误特别提示
          const msg = e.message || '';
          if (msg.includes('image') || msg.includes('vision') || msg.includes('400') || msg.includes('unsupported')) {
            ChatUI.addErrorMessage('该模型可能不支持图片（vision）输入。错误：' + msg);
          } else {
            ChatUI.addErrorMessage('聊天出错：' + msg);
          }
        }
      } finally {
        ChatUI.finalizeAssistantMessage();
      }
    };

    // 动作 Agent：决定小人动作
    const runAction = async () => {
      try {
        const args = await ActionAgent.decide({ signal: currentController.signal });
        const a = args || { action: 'nod', expression: 'happy' };
        Character.perform(a);
        Memory.addActionNote(a.action, a.expression, a.bubble);
      } catch (e) {
        if (e.name !== 'AbortError') {
          Character.perform({ action: 'nod', expression: 'happy' });
        }
      }
    };

    // 协调执行
    try {
      if (Config.data.mode === 'sequential') {
        await runAction();
        if (!currentController.signal.aborted) await runChat();
      } else {
        await Promise.all([runChat(), runAction()]);
      }
    } finally {
      ChatUI.setGenerating(false);
      Character.setBusy(false);
      currentController = null;
    }
  }

  // ===== 停止生成 =====
  function handleStop() {
    if (currentController) {
      currentController.abort();
    }
  }

  // ===== 事件绑定 =====
  ChatUI.sendBtn.addEventListener('click', handleSend);
  ChatUI.stopBtn.addEventListener('click', handleStop);

  // 清空聊天窗口（只清 UI 显示，不清空记忆）
  const clearChatBtn = document.getElementById('clear-chat-btn');
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      ChatUI.clearAll();
      ChatUI.addSystemMessage('🧹 聊天窗口已清空（对话记忆仍保留）');
    });
  }

  // 点击其他区域关闭 emoji 面板
  document.addEventListener('click', (e) => {
    if (ChatUI.emojiPanel.style.display === 'none') return;
    if (e.target === ChatUI.emojiBtn || e.target.closest('.emoji-panel')) return;
    ChatUI.emojiPanel.style.display = 'none';
    ChatUI.emojiBtn.classList.remove('active');
  });

  // ===== 启动欢迎语 =====
  if (Memory.messages.length <= 1) {
    ChatUI.addSystemMessage('你好呀~ 我是屏幕上的小可爱，跟我聊聊天吧！✨');
    if (!Config.isReady()) {
      ChatUI.addSystemMessage('🎭 当前为 Demo 模式（未配置 API Key），输入"跳舞""你好"等试试~');
    }
  }
  // 小人挥手打招呼
  setTimeout(() => {
    Character.perform({ action: 'wave', expression: 'happy', bubble: '嗨~ 聊聊吧！', duration: 2200 });
  }, 600);
})();
