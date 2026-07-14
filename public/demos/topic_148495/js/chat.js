/**
 * chat.js — 聊天界面渲染
 * 消息显示、智能按钮、输入处理、动画效果
 */
var Chat = (function() {
  'use strict';

  var _container = null;
  var _smartButtons = null;
  var _input = null;
  var _sendBtn = null;
  var _isProcessing = false;

  // ===== 初始化 =====

  function init() {
    _container = document.getElementById('chat-messages');
    _smartButtons = document.getElementById('smart-buttons');
    _input = document.getElementById('chat-input');
    _sendBtn = document.getElementById('send-btn');

    _sendBtn.addEventListener('click', handleSend);
    _input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // 初始空状态
    showEmptyState();
  }

  // ===== 消息渲染 =====

  function addMessage(msg) {
    hideEmptyState();

    var messageEl = document.createElement('div');
    messageEl.className = 'message ' + (msg.role || 'ai');

    // 头像
    var avatar = msg.role === 'user'
      ? '<div class="msg-avatar user-avatar">👤</div>'
      : '<div class="msg-avatar ai-avatar">⏰</div>';

    // 内容
    var content = '<div class="msg-content">';
    if (msg.html) {
      content += msg.html;
    } else {
      content += '<div class="msg-text">' + escapeHtml(msg.text || '') + '</div>';
    }
    content += '</div>';

    messageEl.innerHTML = avatar + content;
    _container.appendChild(messageEl);

    // 滚动到底部
    scrollToBottom();

    // 入场动画
    requestAnimationFrame(function() {
      messageEl.classList.add('msg-visible');
    });

    return messageEl;
  }

  function addUserMessage(text) {
    return addMessage({ role: 'user', text: text });
  }

  function addAIMessage(text) {
    return addMessage({ role: 'ai', text: text });
  }

  function addCardMessage(cardElement) {
    var messageEl = document.createElement('div');
    messageEl.className = 'message ai message-card';

    var avatar = '<div class="msg-avatar ai-avatar">⏰</div>';
    var content = '<div class="msg-content"></div>';

    messageEl.innerHTML = avatar + content;
    messageEl.querySelector('.msg-content').appendChild(cardElement);

    _container.appendChild(messageEl);
    hideEmptyState();
    scrollToBottom();

    requestAnimationFrame(function() {
      messageEl.classList.add('msg-visible');
    });

    return messageEl;
  }

  function addOptionMessage(question, options, callback, allowCustom) {
    var messageEl = document.createElement('div');
    messageEl.className = 'message ai';

    var avatar = '<div class="msg-avatar ai-avatar">⏰</div>';
    var content = '<div class="msg-content">';
    content += '<div class="msg-text">' + escapeHtml(question) + '</div>';
    content += '<div class="msg-options">';

    options.forEach(function(opt) {
      content += '<button class="option-btn" data-value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>';
    });

    content += '</div>';

    // 自定义输入
    if (allowCustom) {
      content += '<div class="msg-custom-input" style="display:flex;gap:8px;margin-top:8px;">';
      content += '<input class="custom-input" placeholder="或输入自定义内容..." style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-input);color:var(--text-primary);font-size:13px;outline:none;transition:var(--transition);">';
      content += '<button class="custom-submit" style="padding:8px 14px;border:none;border-radius:var(--radius);background:linear-gradient(135deg,var(--rest-teal),var(--rest-teal-dark));color:#0F172A;font-size:13px;font-weight:600;cursor:pointer;transition:var(--transition);">确定</button>';
      content += '</div>';
    }

    content += '</div>';
    messageEl.innerHTML = avatar + content;

    _container.appendChild(messageEl);
    hideEmptyState();
    scrollToBottom();

    // 绑定选项点击
    var buttons = messageEl.querySelectorAll('.option-btn');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        buttons.forEach(function(b) { b.disabled = true; });
        btn.classList.add('selected');
        // 禁用自定义输入
        var customInput = messageEl.querySelector('.custom-input');
        var customSubmit = messageEl.querySelector('.custom-submit');
        if (customInput) { customInput.disabled = true; }
        if (customSubmit) { customSubmit.disabled = true; }

        if (callback) {
          callback(btn.getAttribute('data-value'));
        }
      });
    });

    // 绑定自定义输入
    if (allowCustom) {
      var customInput = messageEl.querySelector('.custom-input');
      var customSubmit = messageEl.querySelector('.custom-submit');

      function submitCustom() {
        var val = customInput.value.trim();
        if (!val) return;
        buttons.forEach(function(b) { b.disabled = true; });
        customInput.disabled = true;
        customSubmit.disabled = true;
        if (callback) {
          callback(val);
        }
      }

      customSubmit.addEventListener('click', submitCustom);
      customInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitCustom();
        }
      });
    }

    requestAnimationFrame(function() {
      messageEl.classList.add('msg-visible');
    });

    return messageEl;
  }

  // ===== 智能按钮 =====

  /**
   * 判断操作类型，返回对应的颜色类名
   */
  function getActionColorClass(actionId) {
    switch (actionId) {
      case 'rest':       return 'rest';
      case 'start_work': case 'continue_work': return 'work';
      default:           return 'work';
    }
  }

  /**
   * 只有工作/休息切换操作才能作为主按钮
   */
  function isPrimaryAction(actionId) {
    return actionId === 'start_work' || actionId === 'rest' || actionId === 'continue_work';
  }

  function renderSmartButtons(actions) {
    if (!_smartButtons) return;
    _smartButtons.innerHTML = '';

    // 始终显示按钮栏，不为空
    _smartButtons.style.display = 'flex';

    if (!actions || actions.length === 0) {
      // 兜底：显示默认空闲按钮
      var fallbackBtn = document.createElement('button');
      fallbackBtn.className = 'smart-btn primary work';
      fallbackBtn.textContent = '💼 开始工作';
      fallbackBtn.addEventListener('click', function() {
        Main.handleAction('start_work');
      });
      _smartButtons.appendChild(fallbackBtn);
      return;
    }

    actions.forEach(function(action, index) {
      var btn = document.createElement('button');
      var isPrimary = isPrimaryAction(action.action);

      btn.className = 'smart-btn';
      if (isPrimary) {
        btn.className += ' primary ' + getActionColorClass(action.action);
      }

      btn.textContent = action.label;
      btn.setAttribute('data-action', action.action);
      btn.addEventListener('click', function() {
        Main.handleAction(action.action);
      });
      _smartButtons.appendChild(btn);
    });
  }

  function hideSmartButtons() {
    // 不再完全隐藏，改为显示最简状态
    renderSmartButtons([]);
  }

  /**
   * 清理所有 disabled 的选项按钮（引导、休息问答等）
   * 防止旧按钮堆积在页面中
   */
  function clearOptionButtons() {
    if (!_container) return;
    var disabledBtns = _container.querySelectorAll('.option-btn:disabled');
    disabledBtns.forEach(function(btn) { btn.remove(); });
    // 同时清理空的选项容器
    var emptyOptions = _container.querySelectorAll('.msg-options');
    emptyOptions.forEach(function(opt) {
      if (opt.querySelectorAll('.option-btn').length === 0 && opt.children.length === 0) {
        opt.remove();
      }
    });
  }

  // ===== 空状态 =====

  function showEmptyState() {
    var existing = _container.querySelector('.empty-state');
    if (existing) return;

    var emptyEl = document.createElement('div');
    emptyEl.className = 'empty-state';
    emptyEl.innerHTML = [
      '<div class="empty-glow"></div>',
      '<div class="empty-logo">⏰</div>',
      '<h2 class="empty-title">轻时 LightTime</h2>',
      '<p class="empty-tagline">以休息为锚点，AI 陪伴你的时间</p>',
      '<div class="empty-capabilities">',
      '  <div class="empty-cap-item">',
      '    <span class="empty-cap-icon">☕</span>',
      '    <span>休息时点一下，自动记录</span>',
      '  </div>',
      '  <div class="empty-cap-item">',
      '    <span class="empty-cap-icon">📊</span>',
      '    <span>数据可视化，一目了然</span>',
      '  </div>',
      '  <div class="empty-cap-item">',
      '    <span class="empty-cap-icon">🤖</span>',
      '    <span>AI 根据数据给建议</span>',
      '  </div>',
      '</div>'
    ].join('');
    _container.appendChild(emptyEl);
  }

  function hideEmptyState() {
    var existing = _container.querySelector('.empty-state');
    if (existing) {
      existing.remove();
    }
  }

  // ===== 输入处理 =====

  function handleSend() {
    if (_isProcessing) return;
    var text = _input.value.trim();
    if (!text) return;

    _input.value = '';
    _isProcessing = true;

    // 显示用户消息
    addUserMessage(text);

    // 显示加载状态
    var loadingEl = addMessage({ role: 'ai', text: '...' });

    // 通过 AI 引擎处理
    AIEngine.processMessage(text).then(function(result) {
      // 移除加载消息
      if (loadingEl && loadingEl.parentNode) {
        loadingEl.remove();
      }

      // 显示 AI 回复
      addAIMessage(result.reply);

      // 显示卡片
      if (result.cardType) {
        renderCard(result.cardType);
      }

      // 更新智能按钮（过滤无效操作 + 确保能力按钮）
      var actions = result.suggestedActions && result.suggestedActions.length > 0
        ? result.suggestedActions
        : AIEngine.getDefaultActions();
      actions = Main.filterValidActions(actions);
      actions = Main.ensureToggleAction(actions);
      actions = Main.ensureCapabilityAction(actions);
      renderSmartButtons(actions);

      _isProcessing = false;
    }).catch(function(err) {
      if (loadingEl && loadingEl.parentNode) {
        loadingEl.remove();
      }
      addAIMessage('抱歉，我暂时无法回复，请稍后再试～');
      renderSmartButtons(AIEngine.getDefaultActions());
      _isProcessing = false;
    });
  }

  function renderCard(cardType) {
    var card;
    switch (cardType) {
      case Config.CARD_TYPE.TIMELINE:
        card = Cards.renderTimeline();
        break;
      case Config.CARD_TYPE.HEATMAP:
        card = Cards.renderHeatmap();
        break;
      case Config.CARD_TYPE.REPORT:
        card = Cards.renderReport();
        break;
      case Config.CARD_TYPE.PLAN:
        card = Cards.renderPlan();
        break;
      case Config.CARD_TYPE.CAPABILITY:
        card = Cards.renderCapability();
        break;
      case Config.CARD_TYPE.RING:
        card = Cards.renderRing();
        break;
      default:
        return;
    }
    if (card) {
      addCardMessage(card);
    }
  }

  // ===== 工具函数 =====

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function scrollToBottom() {
    if (_container) {
      setTimeout(function() {
        _container.scrollTop = _container.scrollHeight;
      }, 50);
    }
  }

  function setProcessing(state) {
    _isProcessing = state;
  }

  function isProcessing() {
    return _isProcessing;
  }

  // ===== 公开 API =====
  return {
    init: init,
    addMessage: addMessage,
    addUserMessage: addUserMessage,
    addAIMessage: addAIMessage,
    addCardMessage: addCardMessage,
    addOptionMessage: addOptionMessage,
    renderSmartButtons: renderSmartButtons,
    hideSmartButtons: hideSmartButtons,
    clearOptionButtons: clearOptionButtons,
    showEmptyState: showEmptyState,
    hideEmptyState: hideEmptyState,
    renderCard: renderCard,
    setProcessing: setProcessing,
    isProcessing: isProcessing,
    getContainer: function() { return _container; },
    getSmartButtons: function() { return _smartButtons; }
  };
})();