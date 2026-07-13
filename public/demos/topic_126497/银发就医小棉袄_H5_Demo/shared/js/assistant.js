/**
 * 银发就医小棉袄 · 浮动小棉袄助手
 * @trae-gen Assistant V1.0
 *
 * 形态：右下角浮动球 + 底部对话抽屉
 * 能力：快捷气泡对话、直接回答+建议、TTS 播报、安全护栏、紧急症状拦截
 *
 * 用法:
 *   SilverAssistant.mount(containerEl)  // 在指定容器挂载助手
 *   SilverAssistant.open()              // 展开抽屉
 *   SilverAssistant.close()             // 收起抽屉
 *
 * 注：本助手挂在 index.html 外层（非 iframe 内），通过 switchPhone 切换 iframe。
 *     状态保存在内存对象中，跨 iframe 切换天然持久。
 */
(function() {
  'use strict';

  // ===== 4 个快捷气泡配置（覆盖老人最高频需求） =====
  // 直接回答，不反问确认。先给答案，再附建议。
  var QUICK_CHIPS = [
    {
      id: 'med_remind',
      label: '今天吃什么药',
      intent: 'medication',
      answer: '今天该吃两种药：美托洛尔半片，早饭后和晚饭后各一次；阿托伐他汀一片，睡前吃。',
      action: { type: 'navigate_and_speak', page: 'html/me/me_medication.html' },
      suggestions: ['上次看病医生说啥', '我不舒服，记一下']
    },
    {
      id: 'last_visit',
      label: '上次看病医生说啥',
      intent: 'family_view',
      answer: '上次是6月27日心内科，李医生说您血压偏高，开了美托洛尔和阿托伐他汀两种药，两周后复查。',
      action: { type: 'navigate_and_speak', page: 'html/me/me_summary.html' },
      suggestions: ['今天吃什么药', '今天血压怎样']
    },
    {
      id: 'record_discomfort',
      label: '我不舒服，记一下',
      intent: 'record_health',
      answer: '好的，我帮您打开健康记录页面。您可以语音说出症状，比如「今天头有点晕，血压148」，我会自动帮您整理。',
      action: { type: 'navigate_and_speak', page: 'html/me/me_health_record.html' },
      suggestions: ['今天血压怎样', '今天吃什么药']
    },
    {
      id: 'today_brief',
      label: '今天血压怎样',
      intent: 'health_brief',
      answer: '最近一次记录血压148/85，偏高。今天还有2种药没吃，记得按时吃药。您可以在首页随时查看健康趋势。',
      action: { type: 'navigate_and_speak', page: 'html/me/me_home.html' },
      suggestions: ['今天吃什么药', '我不舒服，记一下']
    }
  ];

  // ===== 安全护栏话术（医学专家审核） =====
  var SAFETY_RESPONSES = {
    diagnosis: '小棉袄不能看病、不能下诊断。这句话我帮您记下来，建议尽快找医生当面看。',
    dosage: '药量只能听您主治医生的，我不能说加量还是减量。我把您的疑问转给子女，让他们带您去复诊。',
    lab_interpret: '化验单上的数字要医生结合您的情况看，我只读给您听，不作解释。',
    out_of_scope: '这个问题超出小棉袄的能力范围，建议您打 12320 卫生热线或去医院咨询。',
    privacy: '我们的对话不会保存，录音仅本地留存 7 天，您可以随时关闭。'
  };

  // ===== 紧急症状关键词（命中即触发红色阻断） =====
  // 与 safety-engine.js EMERGENCY_KEYWORDS 保持同步
  // 含医学专家审核补充的致命症状：黑便/急性腹痛/偏瘫/吞咽困难/晕厥等
  var EMERGENCY_KEYWORDS = [
    '胸痛', '胸闷', '心口痛', '心口闷', '心绞疼',
    '剧烈头痛', '炸裂样头痛', '脑袋要炸',
    '意识模糊', '说不出话', '半边身子不能动', '嘴歪了',
    '咯血', '吐血', '便血',
    '呼吸困难', '喘不上气', '憋气',
    '晕倒', '昏迷', '叫不醒',
    // —— 致命症状补充（医学专家审核，与 safety-engine.js 同步）——
    '黑便', '柏油样便', '大便发黑',           // 消化道出血
    '剧烈腹痛', '腹部剧痛', '急性腹痛',         // 急腹症
    '偏瘫', '单侧无力', '吞咽困难', '言语含糊', // 中风
    '晕厥', '突然晕倒', '短暂意识丧失',        // 脑供血不足/心律失常
    '持续呕吐', '喷射性呕吐'                    // 颅内压增高
  ];

  // ===== 关键词到安全护栏的映射（用于自由文本输入） =====
  var INTENT_KEYWORD_MAP = [
    { keywords: ['诊断', '是不是', '得了什么病', '什么病'], response: 'diagnosis' },
    { keywords: ['加量', '减量', '多吃', '少吃', '加药', '减药', '停药'], response: 'dosage' },
    { keywords: ['化验单', '检查结果', '这个数', '指标高', '指标低'], response: 'lab_interpret' }
  ];

  // ===== 助手状态 =====
  var state = {
    mounted: false,
    drawerOpen: false,
    listening: false,
    thinking: false,
    messages: [],          // 对话历史 {role: 'assistant'|'user'|'system', text}
    pendingAction: null,   // 待双步确认的动作
    container: null
  };

  // ===== 工具函数：转义 HTML 防注入 =====
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ===== TTS 调用：仅使用预生成优质音频，不播放机械合成音 =====
  function speak(text) {
    try {
      // 优先调用 iframe 内的 SilverTTS（预生成音频）
      var iframe = document.getElementById('phoneFrameIframe');
      if (iframe && iframe.contentWindow && iframe.contentWindow.SilverTTS) {
        iframe.contentWindow.SilverTTS.speak(text);
        return;
      }
    } catch (e) {
      // 跨域访问失败，尝试外层 SilverTTS
    }
    // 回退：外层 SilverTTS
    if (window.SilverTTS) {
      window.SilverTTS.speak(text);
    }
  }

  // ===== 切换 iframe 页面（外层调用，不依赖跨域访问） =====
  function navigateTo(page) {
    if (typeof window.switchPhone === 'function') {
      window.switchPhone(page);
    } else {
      var iframe = document.getElementById('phoneFrameIframe');
      if (iframe) iframe.src = page;
    }
  }

  // ===== 添加消息气泡到对话流 =====
  function addMessage(role, text, extra) {
    var messages = state.messages;
    messages.push({ role: role, text: text, extra: extra });
    renderMessages();
  }

  // ===== 渲染对话消息流 =====
  function renderMessages() {
    var box = document.getElementById('sa-messages');
    if (!box) return;
    var html = '';
    for (var i = 0; i < state.messages.length; i++) {
      var msg = state.messages[i];
      if (msg.role === 'system') {
        html += '<div class="sa-bubble system">' + escapeHtml(msg.text) + '</div>';
      } else {
        html += '<div class="sa-bubble ' + msg.role + '">' + escapeHtml(msg.text) + '</div>';
      }
    }
    box.innerHTML = html;
    // 滚动到底部
    box.scrollTop = box.scrollHeight;
  }

  // ===== 渲染"正在思考"动画 =====
  function showTyping() {
    var box = document.getElementById('sa-messages');
    if (!box) return;
    var div = document.createElement('div');
    div.className = 'sa-bubble assistant';
    div.id = 'sa-typing-indicator';
    div.innerHTML = '<div class="sa-typing"><span class="sa-typing-dot"></span><span class="sa-typing-dot"></span><span class="sa-typing-dot"></span></div>';
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('sa-typing-indicator');
    if (el) el.remove();
  }

  // ===== 检查紧急症状关键词 =====
  function checkEmergency(text) {
    if (!text) return null;
    var lower = text.toLowerCase();
    for (var i = 0; i < EMERGENCY_KEYWORDS.length; i++) {
      var kw = EMERGENCY_KEYWORDS[i];
      if (text.indexOf(kw) !== -1 || lower.indexOf(kw.toLowerCase()) !== -1) {
        return kw;
      }
    }
    return null;
  }

  // ===== 检查安全护栏（诊断/剂量/化验单解读） =====
  function checkSafetyGuard(text) {
    if (!text) return null;
    for (var i = 0; i < INTENT_KEYWORD_MAP.length; i++) {
      var rule = INTENT_KEYWORD_MAP[i];
      for (var j = 0; j < rule.keywords.length; j++) {
        if (text.indexOf(rule.keywords[j]) !== -1) {
          return rule.response;
        }
      }
    }
    return null;
  }

  // ===== 显示紧急症状红色阻断 =====
  function showEmergencyModal(keyword) {
    var modal = document.getElementById('sa-emergency-modal');
    if (!modal) return;
    var kwEl = document.getElementById('sa-emergency-keyword');
    if (kwEl) kwEl.textContent = keyword;
    modal.classList.add('show');

    // 同步通知子女端（通过 EventBridge 跨 iframe 通信，Demo 模式仅打 log）
    try {
      console.log('[紧急] 已推送子女端：检测到症状「' + keyword + '」，时间 ' + new Date().toLocaleString());
    } catch (e) {}

    // TTS 紧急播报
    speak('检测到紧急症状 ' + keyword + '。我已通知您的家人。如需急救请按红色按钮拨打 120。');
  }

  function closeEmergencyModal() {
    var modal = document.getElementById('sa-emergency-modal');
    if (modal) modal.classList.remove('show');
  }

  // ===== 模拟 120 拨号（Demo 模式仅显示提示，不真实拨打） =====
  // 老年用户代理反馈：拨 120 需二次确认，避免老人手抖误触
  function simulateDial120() {
    var modal = document.getElementById('sa-emergency-modal');
    if (!modal) return;
    var descEl = modal.querySelector('.sa-emergency-desc');
    var actionsEl = modal.querySelector('.sa-emergency-actions');
    if (!descEl || !actionsEl) return;
    // 替换为二次确认界面
    descEl.innerHTML = '<strong>确认拨打 120？</strong><br>您确定要立即拨打急救电话吗？';
    actionsEl.innerHTML =
      '<button class="sa-emergency-btn dial120" id="sa-emergency-final-dial" type="button">✅ 确认拨打</button>' +
      '<button class="sa-emergency-btn cancel" id="sa-emergency-final-cancel" type="button">⬅ 再想想</button>';
    modal.querySelector('#sa-emergency-final-dial').addEventListener('click', function() {
      addMessage('system', '⚠️ Demo 模式不真实拨打 120。生产环境将自动拨打急救电话并定位发送给子女端。');
      closeEmergencyModal();
    });
    modal.querySelector('#sa-emergency-final-cancel').addEventListener('click', closeEmergencyModal);
  }

  // ===== 处理快捷气泡点击 =====
  function handleQuickChip(chip) {
    if (state.thinking) return;
    // 1. 添加用户消息
    addMessage('user', chip.label);
    // 2. 模拟"正在思考"
    state.thinking = true;
    showTyping();
    // 3. 600ms 后直接给出答案和行动
    setTimeout(function() {
      hideTyping();
      state.thinking = false;
      // 直接回答，不反问
      addMessage('assistant', chip.answer);
      // 执行动作
      if (chip.action.type === 'navigate_and_speak') {
        navigateTo(chip.action.page);
        speak(chip.answer);
      } else if (chip.action.type === 'navigate') {
        navigateTo(chip.action.page);
        speak(chip.answer);
      }
      // 附上后续建议
      if (chip.suggestions && chip.suggestions.length > 0) {
        showSuggestions(chip.suggestions);
      }
    }, 600);
  }

  // ===== 显示后续建议入口（在对话流下方） =====
  function showSuggestions(labels) {
    var box = document.getElementById('sa-messages');
    if (!box) return;
    var html = '<div class="sa-suggestions" style="align-self: flex-start; display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0 8px;">';
    for (var i = 0; i < labels.length; i++) {
      html += '<button class="sa-chip sa-chip-followup" type="button" data-followup="' + escapeHtml(labels[i]) + '">' + escapeHtml(labels[i]) + '  →</button>';
    }
    html += '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    // 绑定后续建议点击
    var followupBtns = div.querySelectorAll('.sa-chip-followup');
    followupBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var label = this.getAttribute('data-followup');
        for (var k = 0; k < QUICK_CHIPS.length; k++) {
          if (QUICK_CHIPS[k].label === label) {
            handleQuickChip(QUICK_CHIPS[k]);
            return;
          }
        }
      });
    });
  }

  // ===== 处理自由文本/语音输入 =====
  function handleFreeInput(text) {
    if (!text || !text.trim()) return;
    addMessage('user', text.trim());

    // 1. 紧急症状优先拦截
    var emergencyKw = checkEmergency(text);
    if (emergencyKw) {
      addMessage('assistant', '您说的「' + emergencyKw + '」要紧，我已通知家人。如需急救请按红色按钮拨 120。');
      showEmergencyModal(emergencyKw);
      return;
    }

    // 2. 安全护栏拦截
    var guard = checkSafetyGuard(text);
    if (guard) {
      addMessage('assistant', SAFETY_RESPONSES[guard]);
      speak(SAFETY_RESPONSES[guard]);
      return;
    }

    // 3. 匹配快捷气泡意图（关键词模糊匹配）→ 直接回答
    var matched = matchQuickChipIntent(text);
    if (matched) {
      state.thinking = true;
      showTyping();
      setTimeout(function() {
        hideTyping();
        state.thinking = false;
        addMessage('assistant', matched.answer);
        if (matched.action.type === 'navigate_and_speak') {
          navigateTo(matched.action.page);
          speak(matched.answer);
        } else if (matched.action.type === 'navigate') {
          navigateTo(matched.action.page);
          speak(matched.answer);
        }
        if (matched.suggestions && matched.suggestions.length > 0) {
          showSuggestions(matched.suggestions);
        }
      }, 600);
      return;
    }

    // 4. 兜底：无法理解
    addMessage('assistant', '我没听懂您说的。您可以试试下面的快捷问句，或者点麦克风重新说一遍。');
  }

  // ===== 关键词模糊匹配快捷气泡意图 =====
  function matchQuickChipIntent(text) {
    var lower = (text || '').toLowerCase();
    var intents = [
      { keywords: ['药', '吃药', '服药', '用药', '吃什么药'], chip: QUICK_CHIPS[0] },
      { keywords: ['上次', '看病', '就诊', '医生说', '医院', '复诊'], chip: QUICK_CHIPS[1] },
      { keywords: ['不舒服', '记录', '头晕', '难受', '不好受'], chip: QUICK_CHIPS[2] },
      { keywords: ['血压', '今天', '身体', '感觉', '怎样', '怎么样'], chip: QUICK_CHIPS[3] }
    ];
    for (var i = 0; i < intents.length; i++) {
      for (var j = 0; j < intents[i].keywords.length; j++) {
        if (text.indexOf(intents[i].keywords[j]) !== -1) {
          return intents[i].chip;
        }
      }
    }
    return null;
  }

  // ===== 模拟麦克风"听"3 秒（Demo 不调真实 ASR） =====
  function startListening() {
    if (state.listening || state.thinking) return;
    state.listening = true;
    var micBtn = document.getElementById('sa-mic-btn');
    if (micBtn) micBtn.classList.add('listening');

    // 添加"正在听"系统提示
    addMessage('system', '🎤 正在听您说...（Demo 模式，请点击下方快捷问句代替）');

    // 3 秒后停止"听"
    setTimeout(function() {
      state.listening = false;
      if (micBtn) micBtn.classList.remove('listening');
      // 移除"正在听"提示
      var msgs = state.messages;
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'system' && msgs[msgs.length - 1].text.indexOf('正在听') !== -1) {
        msgs.pop();
        renderMessages();
      }
      // 提示用户用快捷气泡
      addMessage('assistant', '我没听清。请点下面的问题，或打字告诉我。');
    }, 3000);
  }

  // ===== 展开抽屉 =====
  function openDrawer() {
    var drawer = document.getElementById('sa-drawer');
    var fab = document.getElementById('sa-fab');
    if (!drawer || !fab) return;
    drawer.classList.add('show');
    fab.classList.add('active');
    state.drawerOpen = true;
    // 首次打开时显示欢迎语
    if (state.messages.length === 0) {
      addMessage('assistant', '您好，我是小棉袄。点下面的问题我直接回答，或点麦克风说话。');
    }
  }

  // ===== 收起抽屉 =====
  function closeDrawer() {
    var drawer = document.getElementById('sa-drawer');
    var fab = document.getElementById('sa-fab');
    if (!drawer || !fab) return;
    drawer.classList.remove('show');
    fab.classList.remove('active');
    state.drawerOpen = false;
  }

  // ===== 切换抽屉展开/收起 =====
  function toggleDrawer() {
    if (state.drawerOpen) closeDrawer();
    else openDrawer();
  }

  // ===== 渲染助手 DOM 到容器（用 append 追加，不覆盖容器原有内容） =====
  function renderAssistant(container) {
    // 创建助手专用容器，避免覆盖 phone-stage 内已有的 iframe/infoBar
    var saWrap = document.createElement('div');
    saWrap.className = 'sa-wrap';
    saWrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:30;';
    // 让 saWrap 不阻挡底层点击，但子元素仍可点击
    // 子元素需要显式设置 pointer-events: auto

    // SVG 魔法棒图标（替代原小棉袄形象，更简洁美观）
    var svg = ''
      + '<svg class="sa-fab-svg" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">'
      + '  <!-- 魔法棒棒身 -->'
      + '  <line x1="10" y1="30" x2="26" y2="14" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
      + '  <!-- 棒头星形 -->'
      + '  <path d="M26 6 L28 12 L34 14 L28 16 L26 22 L24 16 L18 14 L24 12 Z" fill="#FFFFFF"/>'
      + '  <!-- 小星星点缀 -->'
      + '  <circle cx="33" cy="7" r="1.5" fill="#FFFFFF" opacity="0.8"/>'
      + '  <circle cx="36" cy="11" r="1" fill="#FFFFFF" opacity="0.6"/>'
      + '</svg>';

    var html = ''
      // 浮动球
      + '<div id="sa-fab" class="sa-fab" role="button" aria-label="点击展开小棉袄助手" title="点击展开小棉袄助手" style="pointer-events:auto;">'
      +   svg
      +   '<span class="sa-fab-badge" id="sa-fab-badge"></span>'
      + '</div>'
      // 对话抽屉
      + '<div id="sa-drawer" class="sa-drawer" role="dialog" aria-label="小棉袄助手对话" style="pointer-events:auto;">'
      +   '<div class="sa-drawer-header">'
      +     '<div class="sa-drawer-title">'
      +       '<span class="sa-drawer-title-avatar">🧥</span>'
      +       '<span>小棉袄助手</span>'
      +     '</div>'
      +     '<button class="sa-drawer-close" id="sa-drawer-close" type="button" aria-label="收起对话">✕</button>'
      +   '</div>'
      +   '<div class="sa-messages" id="sa-messages"></div>'
      +   '<div class="sa-quick-chips" id="sa-quick-chips"></div>'
      +   '<div class="sa-input-bar">'
      +     '<button class="sa-mic-btn" id="sa-mic-btn" type="button" aria-label="语音输入">🎤</button>'
      +     '<input type="text" class="sa-text-input" id="sa-text-input" placeholder="或在这里打字告诉小棉袄..." maxlength="100">'
      +     '<button class="sa-send-btn" id="sa-send-btn" type="button">发送</button>'
      +   '</div>'
      + '</div>'
      // 紧急症状红色阻断
      + '<div id="sa-emergency-modal" class="sa-emergency-modal" role="alertdialog" aria-label="紧急症状警示" style="pointer-events:auto;">'
      +   '<div class="sa-emergency-icon">🚨</div>'
      +   '<div class="sa-emergency-title">检测到紧急症状</div>'
      +   '<div class="sa-emergency-desc">关键词：<strong id="sa-emergency-keyword"></strong><br>已通知您的家人。如需急救请立即拨打 120。</div>'
      +   '<div class="sa-emergency-actions">'
      +     '<button class="sa-emergency-btn dial120" id="sa-emergency-dial" type="button">📞 拨打 120</button>'
      +     '<button class="sa-emergency-btn notify-only" id="sa-emergency-notify-only" type="button">仅通知家人</button>'
      +     '<button class="sa-emergency-btn cancel" id="sa-emergency-cancel" type="button">取消（误识别）</button>'
      +   '</div>'
      + '</div>';

    saWrap.innerHTML = html;
    container.appendChild(saWrap);

    // 渲染快捷气泡
    var chipsBox = saWrap.querySelector('#sa-quick-chips');
    var chipsHtml = '';
    for (var i = 0; i < QUICK_CHIPS.length; i++) {
      chipsHtml += '<button class="sa-chip" type="button" data-chip-id="' + QUICK_CHIPS[i].id + '">' + QUICK_CHIPS[i].label + '</button>';
    }
    chipsBox.innerHTML = chipsHtml;

    // 绑定事件
    saWrap.querySelector('#sa-fab').addEventListener('click', toggleDrawer);
    saWrap.querySelector('#sa-drawer-close').addEventListener('click', closeDrawer);

    var chipEls = chipsBox.querySelectorAll('.sa-chip');
    chipEls.forEach(function(el) {
      el.addEventListener('click', function() {
        var chipId = this.getAttribute('data-chip-id');
        for (var k = 0; k < QUICK_CHIPS.length; k++) {
          if (QUICK_CHIPS[k].id === chipId) {
            handleQuickChip(QUICK_CHIPS[k]);
            break;
          }
        }
      });
    });

    saWrap.querySelector('#sa-mic-btn').addEventListener('click', startListening);
    saWrap.querySelector('#sa-send-btn').addEventListener('click', function() {
      var input = saWrap.querySelector('#sa-text-input');
      var text = input.value;
      if (text && text.trim()) {
        handleFreeInput(text);
        input.value = '';
      }
    });
    saWrap.querySelector('#sa-text-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        saWrap.querySelector('#sa-send-btn').click();
      }
    });

    // 紧急阻断按钮
    saWrap.querySelector('#sa-emergency-dial').addEventListener('click', simulateDial120);
    saWrap.querySelector('#sa-emergency-notify-only').addEventListener('click', function() {
      addMessage('system', '✅ 已通知您的家人。请保持电话畅通，家人会尽快联系您。');
      closeEmergencyModal();
    });
    saWrap.querySelector('#sa-emergency-cancel').addEventListener('click', function() {
      addMessage('system', '已取消。如果是误识别，请忽略本次提醒。');
      closeEmergencyModal();
    });

    state.mounted = true;
  }

  // ===== 挂载助手到容器 =====
  function mount(container) {
    if (state.mounted) return;
    if (!container) {
      container = document.querySelector('.phone-stage');
    }
    if (!container) {
      console.warn('[SilverAssistant] 找不到 .phone-stage 容器，助手未挂载');
      return;
    }
    state.container = container;
    // 容器需要相对定位（让助手绝对定位在容器内）
    var computedPos = window.getComputedStyle(container).position;
    if (computedPos === 'static') {
      container.style.position = 'relative';
    }
    renderAssistant(container);
  }

  // ===== 公开 API =====
  window.SilverAssistant = {
    mount: mount,
    open: openDrawer,
    close: closeDrawer,
    toggle: toggleDrawer,
    isMounted: function() { return state.mounted; },
    isOpen: function() { return state.drawerOpen; },
    version: '20260706a'
  };

  // ===== 自动挂载：DOM 就绪后挂载到 .phone-frame（手机外框内） =====
  // 优先挂载到 .phone-frame（确保画在手机里面），回退到 .phone-stage
  // 使用 setTimeout 兜底（DOMContentLoaded 已触发场景也能 work）
  function autoMount() {
    if (window.SilverAssistant && !SilverAssistant.isMounted()) {
      var target = document.querySelector('.phone-frame') || document.querySelector('.phone-stage');
      if (target) {
        SilverAssistant.mount(target);
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    setTimeout(autoMount, 50);
  }
})();
