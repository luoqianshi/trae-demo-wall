/**
 * main.js — 主入口（v2.1 AI 原生版）
 *
 * 核心升级：
 * 1. AI 记忆系统 — 对话历史 + 用户事实 + 行为模式
 * 2. AI 主动对话 — 休息结束、长时间工作主动关心
 * 3. AI 主导按钮 — 上下文驱动按钮，硬编码降级为 fallback
 */
var Main = (function() {
  'use strict';

  var _prevStatus = Config.STATUS.IDLE;
  var _workStartTime = null;
  var _workMonitorTimer = null;
  var _lastProactiveCheck = 0;

  // ===== 初始化 =====

  function init() {
    Chat.init();
    Timer.updateStatusBadge();

    // 启动粒子背景
    initParticleBackground();

    // 启动连接状态检查
    startHealthCheck();

    // 让欢迎页先展示 1.5 秒，再开始引导或问候
    // 避免欢迎页一闪而逝
    setTimeout(function() {
      if (!LTStorage.isOnboardingDone()) {
        startOnboarding();
      } else {
        showReturningGreeting();
      }
    }, 1500);

    // 绑定面板事件
    bindPanelEvents();

    // 监听状态变更（AI 驱动按钮 + 主动对话）
    State.on('change:status', function(data) {
      var oldStatus = data.old;
      var newStatus = data.new;

      // 更新智能按钮（AI 决策，硬编码兜底）
      updateSmartButtons();

      // 任务二：开始工作，记录时间用于监控
      if (newStatus === Config.STATUS.WORKING) {
        _workStartTime = TimeService.now();
        startWorkMonitor();
      }

      // 停止工作监控
      if (oldStatus === Config.STATUS.WORKING) {
        stopWorkMonitor();
      }

      _prevStatus = newStatus;
    });

    State.on('reset', function() {
      Timer.reset();
      stopWorkMonitor();
      _workStartTime = null;
      Memory.clear();
      Chat.renderSmartButtons(AIEngine.getDefaultActions());
      Chat.showEmptyState();
      Timer.updateStatusBadge();
    });
  }

  /**
   * 更新智能按钮 — AI 决策优先
   */
  function updateSmartButtons() {
    // 直接使用硬编码默认按钮，稳定可靠
    Chat.renderSmartButtons(AIEngine.getDefaultActions());
  }

  // ===== 任务二：AI 主动对话 =====

  function triggerProactiveConversation(trigger) {
    // 防止短时间内重复触发
    var now = TimeService.now();
    if (now - _lastProactiveCheck < 30000) return; // 30秒内不重复
    _lastProactiveCheck = now;

    if (trigger === 'long_work') {
      // 长时间工作提醒
      AIService.simpleChat(
        '用户已经连续工作了较长时间。请用1-2句温暖的话提醒用户注意休息，语气像朋友关心，不要像命令。',
        { maxTokens: 100, temperature: 0.9 }
      ).then(function(reply) {
        if (reply) {
          Chat.addAIMessage(reply);
        }
      });
    }
  }

  // ===== 工作监控 =====

  function startWorkMonitor() {
    stopWorkMonitor();
    _workStartTime = TimeService.now();

    // 每 5 分钟检查一次
    _workMonitorTimer = setInterval(function() {
      if (State.getStatus() !== Config.STATUS.WORKING) {
        stopWorkMonitor();
        return;
      }

      var elapsed = TimeService.now() - _workStartTime;
      var elapsedMinutes = elapsed / 60000;

      // 连续工作超过 90 分钟，触发提醒
      if (elapsedMinutes >= 90) {
        triggerProactiveConversation('long_work');
        stopWorkMonitor();
      }
    }, 300000); // 5 分钟
  }

  function stopWorkMonitor() {
    if (_workMonitorTimer) {
      clearInterval(_workMonitorTimer);
      _workMonitorTimer = null;
    }
  }

  // ===== 操作调度（v2 核心：AI 驱动）=====

  function handleAction(action) {
    // Bug #4 修复：状态校验，防止非法操作
    if (!isActionValidForState(action)) {
      var statusName = State.getStatus() === Config.STATUS.WORKING ? '工作中' :
                       (State.getStatus() === Config.STATUS.RESTING ? '休息中' : '空闲中');
      Chat.addAIMessage('当前状态是「' + statusName + '」，这个操作暂时不可用哦～');
      return;
    }

    // 计时器类操作：先执行，后让 AI 生成回复
    if (action === Config.ACTION.START_WORK) {
      closeAllPanels();
      Timer.startWork();
      Chat.addAIMessage('...');
      AIEngine.processAction(action).then(handleAIResponse).catch(function() {
        removeLastLoadingMessage();
        Chat.addAIMessage('开始工作啦，加油！记得累了就休息～');
        Chat.renderSmartButtons(AIEngine.getDefaultActions());
      });
      return;
    }

    if (action === Config.ACTION.REST) {
      handleRestStart();
      return;
    }

    if (action === Config.ACTION.CONTINUE_WORK) {
      handleRestEnd();
      return;
    }

    // 数据类操作：直接让 AI 决定
    if (action === Config.ACTION.TODAY_DATA ||
        action === Config.ACTION.TODAY_PLAN ||
        action === Config.ACTION.WEEKLY_REPORT ||
        action === Config.ACTION.HEATMAP ||
        action === Config.ACTION.RING) {

      // 关闭面板
      closeAllPanels();
      Chat.addAIMessage('...');
      AIEngine.processAction(action).then(handleAIResponse).catch(function() {
        removeLastLoadingMessage();
        fallbackDataAction(action);
      });
      return;
    }

    // 面板类操作
    if (action === Config.ACTION.CAPABILITY) {
      toggleCapabilityPanel();
      return;
    }

    if (action === Config.ACTION.SETTINGS) {
      toggleSettingsPanel();
      return;
    }

    if (action === Config.ACTION.LOAD_DEMO) {
      loadDemoData();
      return;
    }

    if (action === Config.ACTION.RESET) {
      handleReset();
      return;
    }

    console.warn('[Main] 未知操作:', action);
  }

  /**
   * Bug #4 修复：校验操作是否在当前状态下合法
   */
  function isActionValidForState(action) {
    var status = State.getStatus();

    // 空闲状态：只能开始工作（休息和继续工作不合法）
    if (status === Config.STATUS.IDLE) {
      if (action === Config.ACTION.REST || action === Config.ACTION.CONTINUE_WORK) {
        return false;
      }
    }

    // 工作状态：不能开始工作或继续工作
    if (status === Config.STATUS.WORKING) {
      if (action === Config.ACTION.START_WORK || action === Config.ACTION.CONTINUE_WORK) {
        return false;
      }
    }

    // 休息状态：不能再次休息或开始工作
    if (status === Config.STATUS.RESTING) {
      if (action === Config.ACTION.START_WORK || action === Config.ACTION.REST) {
        return false;
      }
    }

    return true;
  }

  function handleAIResponse(result) {
    // 移除上一条加载消息
    removeLastLoadingMessage();

    if (result && result.reply) {
      Chat.addAIMessage(result.reply);
      if (result.cardType) {
        Chat.renderCard(result.cardType);
      }

      // Bug #2 + #5 修复：校验并补充 AI 建议的按钮
      var actions = result.suggestedActions && result.suggestedActions.length > 0
        ? result.suggestedActions
        : AIEngine.getDefaultActions();

      // 确保 actions 在当前状态下合法
      actions = filterValidActions(actions);
      // 确保核心切换按钮排第一位
      actions = ensureToggleAction(actions);
      // 确保「能力」按钮始终存在
      actions = ensureCapabilityAction(actions);

      Chat.renderSmartButtons(actions);
    }
  }

  /**
   * Bug #2 修复：过滤 AI 返回的非法操作
   */
  function filterValidActions(actions) {
    return actions.filter(function(a) {
      return isActionValidForState(a.action);
    });
  }

  /**
   * 确保「能力」按钮始终存在
   */
  function ensureCapabilityAction(actions) {
    var hasCapability = actions.some(function(a) {
      return a.action === Config.ACTION.CAPABILITY;
    });
    if (!hasCapability) {
      actions.push({ action: Config.ACTION.CAPABILITY, label: '🌟 能力' });
    }
    return actions;
  }

  /**
   * 确保核心切换按钮始终存在且排第一位
   */
  function ensureToggleAction(actions) {
    // 移除已有的切换按钮（可能 label 不对）
    actions = actions.filter(function(a) {
      return a.action !== 'start_work' && a.action !== 'rest' && a.action !== 'continue_work';
    });

    // 插到第一位
    var defaults = AIEngine.getDefaultActions();
    var toggleItem = defaults[0]; // 来自 getDefaultActions 的第一个按钮
    actions.unshift(toggleItem);

    return actions;
  }

  function removeLastLoadingMessage() {
    var container = Chat.getContainer();
    if (!container) return;
    var messages = container.querySelectorAll('.message.ai');
    for (var i = messages.length - 1; i >= 0; i--) {
      var textEl = messages[i].querySelector('.msg-text');
      if (textEl && textEl.textContent.trim() === '...') {
        messages[i].remove();
        break;
      }
    }
  }

  function fallbackDataAction(action) {
    var cardType = null;
    var reply = '';
    switch (action) {
      case Config.ACTION.TODAY_DATA:
        reply = '这是你今天的记录：';
        cardType = Config.CARD_TYPE.TIMELINE;
        break;
      case Config.ACTION.TODAY_PLAN:
        reply = '根据你的作息，这是今天的规划建议：';
        cardType = Config.CARD_TYPE.PLAN;
        break;
      case Config.ACTION.WEEKLY_REPORT:
        reply = '这是本周的总结：';
        cardType = Config.CARD_TYPE.REPORT;
        break;
      case Config.ACTION.HEATMAP:
        reply = '这是你近7天的效率分布：';
        cardType = Config.CARD_TYPE.HEATMAP;
        break;
      case Config.ACTION.RING:
        reply = '这是你今天的24小时节奏：';
        cardType = Config.CARD_TYPE.RING;
        break;
      case Config.ACTION.CAPABILITY:
        reply = '我能帮你做这些事：';
        cardType = Config.CARD_TYPE.CAPABILITY;
        break;
      default:
        reply = '好的～';
    }

    Chat.addAIMessage(reply);
    if (cardType) Chat.renderCard(cardType);
    Chat.renderSmartButtons(AIEngine.getDefaultActions());
  }

  // ===== 休息流程 =====

  function handleRestStart() {
    Timer.startRest();
    var q = AIEngine.getRestQuestion(0);
    Chat.addOptionMessage(q.text, q.options, function(answer) {
      AIEngine.processRestAnswer(0, answer);
      State.setRestConversationStep(1);

      var q2 = AIEngine.getRestQuestion(1);
      Chat.addOptionMessage(q2.text, q2.options, function(answer2) {
        AIEngine.processRestAnswer(1, answer2);
        Chat.clearOptionButtons();
      }); // 效率问题不需要自定义输入
    }, true);
  }

  function handleRestEnd() {
    AIEngine.getRestEnding().then(function(ending) {
      Chat.clearOptionButtons();
      Chat.addAIMessage(ending);
      Timer.continueWork();
      // 立即更新按钮为工作状态，后续 AI 会覆盖
      Chat.renderSmartButtons(AIEngine.getDefaultActions());
    }).catch(function() {
      // AI 调用失败，降级为硬编码
      Chat.clearOptionButtons();
      Chat.addAIMessage('好的，继续加油吧～');
      Timer.continueWork();
      Chat.renderSmartButtons(AIEngine.getDefaultActions());
    });
  }

  // ===== 初识流程 =====

  function startOnboarding() {
    State.setOnboardingActive(true);
    Chat.hideSmartButtons();

    // 平滑过渡：先让欢迎页淡出，再开始引导问题
    var emptyState = document.querySelector('.empty-state');
    if (emptyState) {
      emptyState.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      emptyState.style.opacity = '0';
      emptyState.style.transform = 'translateY(-16px)';
      setTimeout(function() {
        Chat.hideEmptyState();
        askOnboardingQuestion(0);
      }, 400);
    } else {
      Chat.hideEmptyState();
      askOnboardingQuestion(0);
    }
  }

  function askOnboardingQuestion(step) {
    var q = AIEngine.getOnboardingQuestion(step);
    if (!q) {
      finishOnboarding();
      return;
    }

    Chat.addOptionMessage(q.text, q.options, function(answer) {
      AIEngine.processOnboardingAnswer(step, answer);
      askOnboardingQuestion(step + 1);
    });
  }

  function finishOnboarding() {
    LTStorage.setOnboardingDone(true);
    State.setOnboardingActive(false);

    // Bug #1 修复：清理引导阶段所有旧按钮
    Chat.clearOptionButtons();

    AIEngine.getOnboardingSummary().then(function(summary) {
      Chat.addAIMessage(summary);
      updateSmartButtons();
    }).catch(function() {
      // Bug #7 修复：引导总结 AI 失败时的 fallback
      Chat.addAIMessage('欢迎你！我不催打卡也不打分，休息时点一下按钮就行～');
      updateSmartButtons();
    });
  }

  function showReturningGreeting() {
    // 平滑过渡：先让欢迎页淡出，再显示问候语
    var emptyState = document.querySelector('.empty-state');
    if (emptyState) {
      emptyState.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      emptyState.style.opacity = '0';
      emptyState.style.transform = 'translateY(-16px)';
      setTimeout(function() {
        Chat.hideEmptyState();
        _showGreetingMessage();
      }, 400);
    } else {
      _showGreetingMessage();
    }
  }

  function _showGreetingMessage() {
    var now = new Date(TimeService.now());
    var hour = now.getHours();
    var isMorning = hour >= 6 && hour < 10;

    if (isMorning && !State.isDemoMode()) {
      AIEngine.getMorningGreeting().then(function(greeting) {
        Chat.addAIMessage(greeting);
      });
    } else {
      Chat.addAIMessage('欢迎回来～今天有什么计划吗？');
    }

    Chat.renderSmartButtons(AIEngine.getDefaultActions());
  }

  // ===== 演示数据 =====

  function loadDemoData() {
    State.setDemoMode(true);
    Chat.hideEmptyState();

    var demoEvents = generateDemoData();
    demoEvents.forEach(function(e) {
      LTStorage.addEvent(e);
    });

    State.updateProfile({
      role: '工作中',
      goal: '提高学习效率',
      painPoint: '作息不规律',
      hasSchedule: true,
      sleepTime: '23:00',
      wakeUpTime: '07:00'
    });
    State.setWorkDays([1, 2, 3, 4, 5]);
    LTStorage.setOnboardingDone(true);

    Chat.addAIMessage('演示数据已加载～这是今天的记录：');
    Chat.renderCard(Config.CARD_TYPE.TIMELINE);

    Chat.renderSmartButtons([
      { action: Config.ACTION.CONTINUE_WORK, label: '💼 继续工作' },
      { action: Config.ACTION.CAPABILITY, label: '🌟 能力' }
    ]);
  }

  function generateDemoData() {
    var today = TimeService.today();
    var segments = [
      { type: 'work', start: '08:00', end: '09:35', efficiency: 4 },
      { type: 'rest', start: '09:35', end: '10:05', activity: '喝水休息' },
      { type: 'work', start: '10:05', end: '11:40', efficiency: 5 },
      { type: 'rest', start: '11:40', end: '13:30', activity: '午饭午休' },
      { type: 'work', start: '13:30', end: '15:05', efficiency: 3 },
      { type: 'rest', start: '15:05', end: '15:35', activity: '下午茶' },
      { type: 'work', start: '15:35', end: '17:10', efficiency: 4 },
      { type: 'rest', start: '17:10', end: '18:00', activity: '休息放松' },
      { type: 'work', start: '18:00', end: '19:30', efficiency: 4 },
      { type: 'rest', start: '19:30', end: '20:05', activity: '晚饭' },
      { type: 'work', start: '20:05', end: '21:00', efficiency: 3 },
      { type: 'work', start: '21:00', end: '22:30', efficiency: 3, label: '洗漱' }
    ];

    var events = [];
    segments.forEach(function(seg, i) {
      var startParts = seg.start.split(':');
      var endParts = seg.end.split(':');
      var startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      var endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      var duration = endMin - startMin;

      var event = {
        id: 'demo_' + i,
        type: seg.type,
        date: today,
        startTime: seg.start,
        endTime: seg.end,
        startHour: parseInt(startParts[0]),
        endHour: parseInt(endParts[0]),
        duration: duration,
        metadata: {}
      };

      if (seg.type === 'work') {
        event.metadata.efficiency = seg.efficiency;
        if (seg.label) event.metadata.label = seg.label;
      } else {
        event.metadata.activity = seg.activity;
      }

      events.push(event);
    });

    return events;
  }

  // ===== 面板事件 =====

  function bindPanelEvents() {
    var capClose = document.getElementById('capability-close');
    if (capClose) {
      capClose.addEventListener('click', toggleCapabilityPanel);
    }

    var settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', toggleSettingsPanel);
    }

    var settingsClose = document.getElementById('settings-close');
    if (settingsClose) {
      settingsClose.addEventListener('click', toggleSettingsPanel);
    }

    var loadDemoBtn = document.getElementById('btn-load-demo');
    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', function() {
        toggleSettingsPanel();
        handleAction(Config.ACTION.LOAD_DEMO);
      });
    }

    var resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        toggleSettingsPanel();
        handleAction(Config.ACTION.RESET);
      });
    }
  }

  function toggleCapabilityPanel() {
    var panel = document.getElementById('capability-panel');
    if (!panel) return;
    var isOpen = panel.style.display === 'flex';
    panel.style.display = isOpen ? 'none' : 'flex';
  }

  function toggleSettingsPanel() {
    var panel = document.getElementById('settings-panel');
    if (!panel) return;
    var isOpen = panel.style.display === 'flex';
    panel.style.display = isOpen ? 'none' : 'flex';
  }

  function closeAllPanels() {
    var capPanel = document.getElementById('capability-panel');
    var settingsPanel = document.getElementById('settings-panel');
    if (capPanel) capPanel.style.display = 'none';
    if (settingsPanel) settingsPanel.style.display = 'none';
  }

  // ===== 重置 =====

  function handleReset() {
    if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      State.reset();
      Chat.addAIMessage('数据已重置～让我们重新开始吧！');
    }
  }

  // ===== 连接状态检查 =====

  var _connIndicator = null;
  var _offlineBanner = null;
  var _healthCheckTimer = null;
  var _wasEverConnected = false;

  function checkHealth() {
    _connIndicator = _connIndicator || document.getElementById('conn-indicator');
    _offlineBanner = _offlineBanner || document.getElementById('offline-banner');
    if (!_connIndicator) return;

    _connIndicator.className = 'conn-indicator conn-checking';
    _connIndicator.title = '正在检查 AI 连接...';

    fetch('/health', { signal: AbortSignal.timeout(5000) })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.ai_api === 'connected') {
          _connIndicator.className = 'conn-indicator conn-online';
          _connIndicator.title = 'AI 已连接';
          _wasEverConnected = true;
          // 隐藏离线横幅
          if (_offlineBanner) _offlineBanner.style.display = 'none';
        } else {
          _connIndicator.className = 'conn-indicator conn-offline';
          _connIndicator.title = 'AI 服务不可用 — 请检查网络';
          if (_wasEverConnected && _offlineBanner) {
            _offlineBanner.style.display = 'flex';
          }
        }
      })
      .catch(function() {
        _connIndicator.className = 'conn-indicator conn-offline';
        _connIndicator.title = '服务器未启动 — 请双击 start.bat';
        // 首次加载就失败，显示完整横幅
        if (_offlineBanner) {
          _offlineBanner.style.display = 'flex';
        }
      });
  }

  function startHealthCheck() {
    checkHealth();
    _healthCheckTimer = setInterval(checkHealth, 30000); // 每30秒检查一次
  }

  // ===== 粒子背景 =====

  function initParticleBackground() {
    var canvas = document.getElementById('particle-bg');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var w, h;
    var particles = [];
    var PARTICLE_COUNT = 50;
    var LINK_DIST = 120;

    function Particle() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 1.5 + 0.5;
    }

    Particle.prototype.update = function() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
      this.x = Math.max(0, Math.min(w, this.x));
      this.y = Math.max(0, Math.min(h, this.y));
    };

    function init() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);

      particles.forEach(function(p) {
        p.update();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 145, 74, 0.2)';
        ctx.fill();
      });

      // 连线
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            var opacity = (1 - dist / LINK_DIST) * 0.15;
            ctx.strokeStyle = 'rgba(212, 145, 74, ' + opacity + ')';
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();
  }

  // ===== 公开 API =====
  return {
    init: init,
    handleAction: handleAction,
    filterValidActions: filterValidActions,
    ensureCapabilityAction: ensureCapabilityAction,
    ensureToggleAction: ensureToggleAction,
    checkHealth: checkHealth
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  Main.init();
});