    // ===== 4. 视图渲染函数：养成/聊天/约稿/设置 =====
    function renderNurture() {
      const app = document.getElementById('app');

      if (state.ocs.length === 0) {
        app.innerHTML = `
          <div class="page-header">
            <p class="page-eyebrow">Nurture & Bond</p>
            <h1 class="page-title">养成互动</h1>
            <p class="page-subtitle">陪伴你的 OC，让它茁壮成长</p>
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">🌧️</div>
            <h2 class="empty-state-title">还没有可以互动的 OC</h2>
            <p class="empty-state-desc">先去花园创建或加载一些 OC 吧</p>
            <button class="btn btn-primary" data-route="#/garden">前往花园</button>
          </div>
        `;
        return;
      }

      if (!state.currentOCId || !state.ocs.find(o => o.id === state.currentOCId)) {
        state.currentOCId = state.ocs[0].id;
      }

      state.ocs.forEach(oc => {
        const decayed = applyMoodDecay(oc);
        oc.nurturing.mood = decayed.nurturing.mood;
        oc.nurturing.lastInteract = decayed.nurturing.lastInteract;
      });
      saveState();

      renderNurtureContent();
    }

    function renderNurtureContent() {
      const app = document.getElementById('app');
      const oc = state.ocs.find(o => o.id === state.currentOCId);
      if (!oc) {
        state.currentOCId = state.ocs[0]?.id;
        if (!state.currentOCId) {
          renderNurture();
          return;
        }
      }

      const currentOC = state.ocs.find(o => o.id === state.currentOCId);
      const mood = currentOC.nurturing.mood;
      const moodEmoji = getMoodEmoji(mood);
      const moodText = getMoodText(mood);
      const exp = currentOC.nurturing.exp;
      const stage = currentOC.nurturing.stage;
      const expMax = stage === '幼年' ? 100 : (stage === '少年' ? 300 : 500);
      const expMin = stage === '幼年' ? 0 : (stage === '少年' ? 100 : 300);
      const expProgress = Math.min(100, ((exp - expMin) / (expMax - expMin)) * 100);

      const now = Date.now();
      const cooldowns = {
        checkin: currentOC.nurturing.lastCheckIn === new Date().toDateString(),
        feed: now - currentOC.nurturing.lastInteract < 2 * 3600000,
        talk: false,
        touch: now - currentOC.nurturing.lastInteract < 3600000
      };

      const cooldownTexts = {
        feed: cooldowns.feed ? formatCooldown(2 * 3600000 - (now - currentOC.nurturing.lastInteract)) : '',
        talk: '',
        touch: cooldowns.touch ? formatCooldown(3600000 - (now - currentOC.nurturing.lastInteract)) : ''
      };

      // 只在选择器变化时重建整个页面，否则只更新面板
      const hasSelector = document.querySelector('.oc-selector');
      if (!hasSelector) {
        app.innerHTML = `
          <div class="page-header">
            <p class="page-eyebrow">Nurture & Bond</p>
            <h1 class="page-title">养成互动</h1>
            <p class="page-subtitle">陪伴你的 OC，让它茁壮成长</p>
          </div>
          <div class="nurture-container">
            <div class="oc-selector">
              ${state.ocs.map(o => `
                <div class="oc-selector-item ${o.id === state.currentOCId ? 'active' : ''}" data-action="select-nurture-oc" data-id="${o.id}">
                  <div class="oc-selector-avatar">${renderAvatar(o, 'small')}</div>
                  <div class="oc-selector-name">${escapeHtml(o.name)}</div>
                </div>
              `).join('')}
            </div>
            <div id="nurture-panel-container"></div>
          </div>
        `;
      } else {
        // 更新选择器激活状态
        document.querySelectorAll('.oc-selector-item').forEach(item => {
          item.classList.toggle('active', item.dataset.id === state.currentOCId);
        });
      }

      const panelHTML = `
        <div class="nurture-stage">
          <div class="nurture-avatar">${renderAvatar(currentOC, 'large')}</div>
          <div class="nurture-name">${escapeHtml(currentOC.name)}</div>
          <div class="nurture-stage-label">${stage} · ${exp} EXP</div>

          <div class="mood-display">
            <span class="mood-emoji">${moodEmoji}</span>
            <div class="mood-value">${mood}</div>
            <div class="mood-text">${moodText}</div>
          </div>

          <div class="exp-display">
            <div class="exp-bar">
              <div class="exp-bar-fill" style="width:${expProgress}%"></div>
            </div>
            <div class="exp-label">
              <span>${stage}</span>
              <span>${exp}/${expMax}</span>
            </div>
          </div>

          <div class="interact-buttons">
            <button class="interact-btn" data-action="interact" data-type="checkin" ${cooldowns.checkin ? 'disabled' : ''}>
              <span class="interact-icon">🌅</span>
              <span class="interact-label">${cooldowns.checkin ? '已签到' : '签到'}</span>
            </button>
            <button class="interact-btn" data-action="interact" data-type="feed" ${cooldowns.feed ? 'disabled' : ''}>
              <span class="interact-icon">🍎</span>
              <span class="interact-label">喂食</span>
              ${cooldownTexts.feed ? `<div class="interact-cooldown">${cooldownTexts.feed}</div>` : ''}
            </button>
            <button class="interact-btn" data-route="#/chat/${currentOC.id}">
              <span class="interact-icon">💬</span>
              <span class="interact-label">对话</span>
            </button>
            <button class="interact-btn" data-action="interact" data-type="touch" ${cooldowns.touch ? 'disabled' : ''}>
              <span class="interact-icon">🎁</span>
              <span class="interact-label">抚摸</span>
              ${cooldownTexts.touch ? `<div class="interact-cooldown">${cooldownTexts.touch}</div>` : ''}
            </button>
          </div>

          <div class="achievements-row">
            ${Object.entries(ACHIEVEMENTS).map(([key, ach]) => {
              const unlocked = state.achievements.includes(key);
              return `
                <div class="achievement-badge ${unlocked ? 'unlocked' : ''}" title="${ach.desc}">
                  <span>${ach.icon}</span>
                  <span>${ach.name}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      const panelContainer = document.getElementById('nurture-panel-container');
      if (panelContainer) {
        panelContainer.innerHTML = panelHTML;
      }
    }

    // 视图：AI 智能体对话
    function renderChat(id) {
      const oc = state.ocs.find(o => o.id === id);
      const app = document.getElementById('app');

      if (!oc) {
        app.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h2 class="empty-state-title">未找到该 OC</h2>
            <p class="empty-state-desc">可能已被删除或链接有误</p>
            <button class="btn btn-primary" data-route="#/garden">返回花园</button>
          </div>
        `;
        return;
      }

      // 应用心情衰减
      const decayedOc = applyMoodDecay(oc);
      if (decayedOc.nurturing.mood !== oc.nurturing.mood) {
        oc.nurturing.mood = decayedOc.nurturing.mood;
        oc.nurturing.lastInteract = decayedOc.nurturing.lastInteract;
        saveState();
      }

      // 确保初始化 chatHistory
      if (!oc.chatHistory) oc.chatHistory = [];

      const moodEmoji = getMoodEmoji(oc.nurturing.mood);
      const moodText = getMoodText(oc.nurturing.mood);

      // 快捷话题建议
      const suggestions = ['你好', '你今天怎么样？', '讲讲你的故事', '想你了', '你喜欢什么？'];

      app.innerHTML = `
        <div class="chat-page" id="chat-page">
          <div class="chat-header">
            <div class="chat-header-back" data-route="#/nurture">←</div>
            <div class="chat-header-avatar">${renderAvatar(oc, 'small')}</div>
            <div class="chat-header-info">
              <div class="chat-header-name">${escapeHtml(oc.name)}</div>
              <div class="chat-header-status" id="chat-header-status">${moodEmoji} ${moodText} · ${oc.nurturing.stage}</div>
            </div>
            <div class="chat-header-actions">
              <button class="chat-header-btn" id="btn-clear-chat" title="清空对话">🗑️</button>
            </div>
          </div>

          <div class="chat-messages" id="chat-messages">
            ${oc.chatHistory.length === 0 ? `
              <div class="chat-welcome">
                <div class="chat-welcome-avatar">${renderAvatar(oc, 'large')}</div>
                <div class="chat-welcome-name">${escapeHtml(oc.name)}</div>
                <div class="chat-welcome-text">你好呀！我是 ${escapeHtml(oc.name)}，想和我聊些什么呢？</div>
                <div class="chat-suggestions">
                  ${suggestions.map(s => `<button class="chat-suggestion-btn" data-suggestion="${escapeAttr(s)}">${escapeHtml(s)}</button>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="chat-input-area">
            <textarea class="chat-input" id="chat-input" placeholder="输入消息，Enter 发送，Shift+Enter 换行" rows="1"></textarea>
            <button class="chat-send-btn" id="btn-send-chat">发送</button>
          </div>
        </div>
      `;

      // 渲染历史消息
      if (oc.chatHistory.length > 0) {
        renderChatMessages(oc);
      }

      initChatInteractions(oc);
    }

    // 渲染聊天消息列表
    function renderChatMessages(oc) {
      const container = document.getElementById('chat-messages');
      if (!container) return;

      // 清空欢迎语（如果存在）
      const welcome = container.querySelector('.chat-welcome');
      if (welcome) welcome.remove();

      // 如果是首次渲染（容器内无消息），渲染全部历史
      const existingMessages = container.querySelectorAll('.chat-message');
      if (existingMessages.length === 0) {
        container.innerHTML = '';
        oc.chatHistory.forEach(msg => {
          container.appendChild(createMessageElement(msg, oc));
        });
      }

      // 滚动到底部
      scrollToBottom();
    }

    // 追加单条消息（不重渲染全部）
    function appendChatMessage(msg, oc) {
      const container = document.getElementById('chat-messages');
      if (!container) return;
      // 移除欢迎语
      const welcome = container.querySelector('.chat-welcome');
      if (welcome) welcome.remove();
      container.appendChild(createMessageElement(msg, oc));
      scrollToBottom();
    }

    // 创建消息 DOM 元素
    function createMessageElement(msg, oc) {
      const div = document.createElement('div');
      div.className = `chat-message ${msg.role}`;
      const time = new Date(msg.timestamp);
      const timeStr = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`;

      if (msg.role === 'oc') {
        div.innerHTML = `
          <div class="chat-message-avatar">${renderAvatar(oc, 'small')}</div>
          <div class="chat-message-content">
            <div class="chat-message-bubble">${escapeHtml(msg.text)}</div>
            <div class="chat-message-time">${timeStr}</div>
          </div>
        `;
      } else {
        div.innerHTML = `
          <div class="chat-message-content">
            <div class="chat-message-bubble">${escapeHtml(msg.text)}</div>
            <div class="chat-message-time">${timeStr}</div>
          </div>
        `;
      }
      return div;
    }

    // 滚动到底部
    function scrollToBottom() {
      const container = document.getElementById('chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }

    // 显示"正在输入"指示器
    function showTypingIndicator(oc) {
      const container = document.getElementById('chat-messages');
      if (!container) return;
      const div = document.createElement('div');
      div.className = 'chat-message oc chat-typing-message';
      div.id = 'typing-indicator';
      div.innerHTML = `
        <div class="chat-message-avatar">${renderAvatar(oc, 'small')}</div>
        <div class="chat-message-content">
          <div class="chat-typing">
            <span class="chat-typing-dot"></span>
            <span class="chat-typing-dot"></span>
            <span class="chat-typing-dot"></span>
          </div>
        </div>
      `;
      container.appendChild(div);
      scrollToBottom();
    }

    // 隐藏"正在输入"指示器
    function hideTypingIndicator() {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) indicator.remove();
    }

    // 更新顶部心情状态
    function updateChatHeaderStatus(oc) {
      const statusEl = document.getElementById('chat-header-status');
      if (statusEl) {
        const moodEmoji = getMoodEmoji(oc.nurturing.mood);
        const moodText = getMoodText(oc.nurturing.mood);
        statusEl.textContent = `${moodEmoji} ${moodText} · ${oc.nurturing.stage}`;
      }
    }

    // 初始化聊天页交互
    function initChatInteractions(oc) {
      const input = document.getElementById('chat-input');
      const sendBtn = document.getElementById('btn-send-chat');
      const clearBtn = document.getElementById('btn-clear-chat');

      // 自适应高度
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });

      // Enter 发送，Shift+Enter 换行
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });

      sendBtn.addEventListener('click', handleSend);

      // 快捷话题
      document.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          input.value = btn.dataset.suggestion;
          handleSend();
        });
      });

      // 清空对话
      clearBtn.addEventListener('click', () => {
        confirmDialog(`确定要清空与 ${oc.name} 的所有对话记录吗？`, () => {
          oc.chatHistory = [];
          saveState();
          renderChat(oc.id);
          showToast('对话记录已清空', 'success');
        });
      });

      async function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        // 禁用输入，防止重复发送
        input.value = '';
        input.style.height = 'auto';
        sendBtn.disabled = true;
        input.disabled = true;

        await sendChatMessage(oc.id, text);

        // 恢复输入
        sendBtn.disabled = false;
        input.disabled = false;
        input.focus();
      }
    }

    // 发送消息核心逻辑
    async function sendChatMessage(ocId, text) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc) return;

      // 1. 添加用户消息
      if (!oc.chatHistory) oc.chatHistory = [];
      const userMsg = { role: 'user', text, timestamp: Date.now() };
      oc.chatHistory.push(userMsg);
      trimHistory(oc);
      appendChatMessage(userMsg, oc);

      // 2. 显示"正在输入"
      showTypingIndicator(oc);

      // 3. 模拟思考延迟
      await delay(800 + Math.random() * 700);

      // 4. 生成 OC 回复
      const reply = generateOCReply(oc, text);

      // 5. 移除"正在输入"，添加 OC 回复
      hideTypingIndicator();
      const ocMsg = { role: 'oc', text: reply, timestamp: Date.now() };
      oc.chatHistory.push(ocMsg);
      trimHistory(oc);
      appendChatMessage(ocMsg, oc);

      // 6. 养成系统联动
      oc.nurturing.mood = Math.min(100, oc.nurturing.mood + 2);
      oc.nurturing.exp += 2;
      oc.nurturing.lastInteract = Date.now();
      oc.nurturing.interactCount += 1;
      state.stats.totalInteractions = (state.stats.totalInteractions || 0) + 1;

      // 7. 检查阶段升级
      const oldStage = oc.nurturing.stage;
      const newStage = checkGrowthStage(oc);
      if (newStage !== oldStage) {
        oc.nurturing.stage = newStage;
        showCelebration('成长升级！', `${oc.name} 成长为 ${newStage}`, '💎');
      }

      // 8. 检查成就
      checkAchievements(oc);

      // 9. 持久化并更新 UI
      saveState();
      updateChatHeaderStatus(oc);
    }

    // 视图：约稿管理
    function renderCommissions() {
      const app = document.getElementById('app');
      const commissions = state.commissions || [];
      const artists = state.artists || [];

      // 统计概览
      const total = commissions.length;
      const inProgress = commissions.filter(c => ['待沟通','已下单','制作中'].includes(c.status)).length;
      const completed = commissions.filter(c => c.status === '已完成').length;
      const totalCost = commissions
        .filter(c => c.status !== '已取消' && c.price)
        .reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);

      const activeTab = state.currentCommissionTab || 'commissions';

      app.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">约稿管理</h1>
          <p class="page-desc">管理画师/写手通讯录、约稿记录与创作预算</p>
        </div>

        <div class="commission-stats">
          <div class="stat-card">
            <div class="stat-value">${total}</div>
            <div class="stat-label">总约稿</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${inProgress}</div>
            <div class="stat-label">进行中</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${completed}</div>
            <div class="stat-label">已完成</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">¥${totalCost.toFixed(0)}</div>
            <div class="stat-label">总花费</div>
          </div>
        </div>

        <div class="tabs commission-tabs">
          <div class="tab ${activeTab==='commissions'?'active':''}" data-tab="commissions-list">约稿记录 (${commissions.length})</div>
          <div class="tab ${activeTab==='artists'?'active':''}" data-tab="artists-list">画师列表 (${artists.length})</div>
        </div>

        <div class="tab-content ${activeTab==='commissions'?'active':''}" data-content="commissions-list">
          ${commissions.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📝</div>
              <h2 class="empty-state-title">还没有约稿记录</h2>
              <p class="empty-state-desc">点击下方按钮添加第一条约稿记录</p>
              <button class="btn btn-primary" data-action="add-commission">+ 新增约稿</button>
            </div>
          ` : `
            <div class="commission-toolbar">
              <button class="btn btn-primary" data-action="add-commission">+ 新增约稿</button>
            </div>
            <div class="commission-list">
              ${commissions.map(c => renderCommissionCard(c)).join('')}
            </div>
          `}
        </div>

        <div class="tab-content ${activeTab==='artists'?'active':''}" data-content="artists-list">
          ${artists.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">🎨</div>
              <h2 class="empty-state-title">还没有画师记录</h2>
              <p class="empty-state-desc">添加你联系过的画师/写手，或加载示例数据</p>
              <button class="btn btn-primary" data-action="add-artist">+ 添加画师</button>
              <button class="btn btn-ghost" data-action="load-sample" style="margin-left:8px;">加载示例画师</button>
            </div>
          ` : `
            <div class="commission-toolbar">
              <button class="btn btn-primary" data-action="add-artist">+ 添加画师</button>
            </div>
            <div class="artist-grid">
              ${artists.map(a => renderArtistCard(a)).join('')}
            </div>
          `}
        </div>
      `;
    }

    // 渲染单条约稿卡片
    function renderCommissionCard(c) {
      const oc = c.ocId ? state.ocs.find(o => o.id === c.ocId) : null;
      const ocName = oc ? oc.name : (c.ocId ? 'OC 已删除' : '未关联');
      const statusColors = {
        '待沟通': 'status-pending',
        '已下单': 'status-ordered',
        '制作中': 'status-progress',
        '已完成': 'status-done',
        '已取消': 'status-cancelled'
      };
      const statusClass = statusColors[c.status] || 'status-pending';
      const deadline = c.deadline ? new Date(c.deadline).toLocaleDateString('zh-CN') : '无';
      return `
        <div class="commission-card">
          <div class="commission-card-header">
            <div class="commission-card-title">${escapeHtml(c.type || '约稿')} · ${escapeHtml(c.artistName || '未知画师')}</div>
            <span class="commission-status-badge ${statusClass}">${c.status}</span>
          </div>
          <div class="commission-card-body">
            <div class="commission-info-row">
              <span class="commission-info-label">关联 OC</span>
              <span class="commission-info-value">${escapeHtml(ocName)}</span>
            </div>
            <div class="commission-info-row">
              <span class="commission-info-label">价格</span>
              <span class="commission-info-value">${c.currency || 'CNY'} ${c.price || 0}</span>
            </div>
            <div class="commission-info-row">
              <span class="commission-info-label">截止日期</span>
              <span class="commission-info-value">${deadline}</span>
            </div>
            ${c.description ? `<div class="commission-desc">${escapeHtml(c.description)}</div>` : ''}
          </div>
          <div class="commission-card-actions">
            <button class="btn btn-ghost btn-sm" data-action="edit-commission" data-id="${c.id}">编辑</button>
            <button class="btn btn-danger btn-sm" data-action="delete-commission" data-id="${c.id}">删除</button>
          </div>
        </div>
      `;
    }

    // 渲染单个画师卡片
    function renderArtistCard(a) {
      const typeIcon = a.type === '画师' ? '🎨' : (a.type === '写手' ? '✍️' : '🎭');
      const stars = '★'.repeat(a.rating || 0) + '☆'.repeat(5 - (a.rating || 0));
      return `
        <div class="artist-card">
          <div class="artist-card-header">
            <div class="artist-avatar">${typeIcon}</div>
            <div class="artist-info">
              <div class="artist-name">${escapeHtml(a.name)} ${a.isSample ? '<span class="sample-badge">示例</span>' : ''}</div>
              <div class="artist-type">${escapeHtml(a.type)}</div>
            </div>
          </div>
          <div class="artist-rating">${stars}</div>
          ${a.specialties && a.specialties.length ? `
            <div class="artist-specialties">
              ${a.specialties.map(s => `<span class="artist-specialty-tag">${escapeHtml(s)}</span>`).join('')}
            </div>
          ` : ''}
          <div class="artist-details">
            <div class="artist-detail-row"><span>报价</span><span>${escapeHtml(a.priceRange || '未标注')}</span></div>
            <div class="artist-detail-row"><span>平台</span><span>${escapeHtml(a.platform || '未标注')}</span></div>
            <div class="artist-detail-row"><span>联系</span><span>${escapeHtml(a.contact || '未标注')}</span></div>
          </div>
          ${a.notes ? `<div class="artist-notes">${escapeHtml(a.notes)}</div>` : ''}
          <div class="artist-card-actions">
            <button class="btn btn-primary btn-sm" data-action="commission-from-artist" data-id="${a.id}">发起约稿</button>
            <button class="btn btn-ghost btn-sm" data-action="edit-artist" data-id="${a.id}">编辑</button>
            <button class="btn btn-danger btn-sm" data-action="delete-artist" data-id="${a.id}">删除</button>
          </div>
        </div>
      `;
    }

    // 约稿表单
    function renderCommissionForm(commissionId, presetArtistId) {
      const isEdit = !!commissionId;
      const existing = isEdit ? state.commissions.find(c => c.id === commissionId) : null;
      const c = existing || {};
      const ocOptions = state.ocs.map(o => `<option value="${o.id}" ${c.ocId===o.id?'selected':''}>${escapeHtml(o.name)}</option>`).join('');
      const artistOptions = state.artists.map(a => `<option value="${a.id}" ${c.artistId===a.id || presetArtistId===a.id?'selected':''}>${escapeHtml(a.name)} (${escapeHtml(a.type)})</option>`).join('');

      const body = `
        <div class="modal-form">
          <div class="form-group">
            <label class="form-label">关联 OC（可选）</label>
            <select class="form-select" id="comm-ocId">
              <option value="">不关联</option>
              ${ocOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">画师/写手</label>
            <select class="form-select" id="comm-artistId">
              <option value="">请选择</option>
              ${artistOptions}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">约稿类型</label>
              <select class="form-select" id="comm-type">
                ${['立绘','头像','插画','文案','其他'].map(t => `<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select class="form-select" id="comm-status">
                ${['待沟通','已下单','制作中','已完成','已取消'].map(s => `<option value="${s}" ${c.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">价格</label>
              <input type="number" class="form-input" id="comm-price" value="${c.price || ''}" placeholder="0" step="0.01">
            </div>
            <div class="form-group">
              <label class="form-label">货币</label>
              <select class="form-select" id="comm-currency">
                <option value="CNY" ${c.currency==='CNY'?'selected':''}>CNY (¥)</option>
                <option value="USD" ${c.currency==='USD'?'selected':''}>USD ($)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">截止日期</label>
            <input type="date" class="form-input" id="comm-deadline" value="${c.deadline ? new Date(c.deadline).toISOString().slice(0,10) : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea class="form-textarea" id="comm-description" rows="3" placeholder="约稿要求、备注等">${escapeHtml(c.description || '')}</textarea>
          </div>
        </div>
      `;

      showModal(
        isEdit ? '编辑约稿记录' : '新增约稿记录',
        body,
        [
          { label: '取消', style: 'ghost', onClick: closeModal },
          { label: isEdit ? '保存' : '创建', style: 'primary', onClick: () => {
            const artistId = document.getElementById('comm-artistId').value;
            const artist = state.artists.find(a => a.id === artistId);
            const data = {
              id: isEdit ? commissionId : 'comm_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
              ocId: document.getElementById('comm-ocId').value,
              artistId: artistId,
              artistName: artist ? artist.name : '',
              type: document.getElementById('comm-type').value,
              status: document.getElementById('comm-status').value,
              price: parseFloat(document.getElementById('comm-price').value) || 0,
              currency: document.getElementById('comm-currency').value,
              deadline: document.getElementById('comm-deadline').value ? new Date(document.getElementById('comm-deadline').value).getTime() : null,
              description: document.getElementById('comm-description').value.trim(),
              createdAt: isEdit ? (existing.createdAt || Date.now()) : Date.now(),
              updatedAt: Date.now()
            };
            saveCommission(data, isEdit);
            closeModal();
          }}
        ]
      );
    }

    // 画师表单
    function renderArtistForm(artistId) {
      const isEdit = !!artistId;
      const existing = isEdit ? state.artists.find(a => a.id === artistId) : null;
      const a = existing || {};

      const body = `
        <div class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">姓名/昵称</label>
              <input type="text" class="form-input" id="artist-name" value="${escapeAttr(a.name || '')}" placeholder="画师/写手昵称">
            </div>
            <div class="form-group">
              <label class="form-label">类型</label>
              <select class="form-select" id="artist-type">
                ${['画师','写手','两者'].map(t => `<option value="${t}" ${a.type===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">擅长领域（逗号分隔）</label>
            <input type="text" class="form-input" id="artist-specialties" value="${escapeAttr((a.specialties || []).join(', '))}" placeholder="如 二次元立绘, Q版头像">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">报价区间</label>
              <input type="text" class="form-input" id="artist-priceRange" value="${escapeAttr(a.priceRange || '')}" placeholder="如 50-300元">
            </div>
            <div class="form-group">
              <label class="form-label">平台</label>
              <input type="text" class="form-input" id="artist-platform" value="${escapeAttr(a.platform || '')}" placeholder="如 微博/米画师">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">联系方式</label>
            <input type="text" class="form-input" id="artist-contact" value="${escapeAttr(a.contact || '')}" placeholder="如 微博@xxx / QQ 123456">
          </div>
          <div class="form-group">
            <label class="form-label">评分（1-5）</label>
            <div class="rating-input" id="artist-rating-input">
              ${[1,2,3,4,5].map(n => `<span class="rating-star ${n<=(a.rating||5)?'active':''}" data-rating="${n}">★</span>`).join('')}
            </div>
            <input type="hidden" id="artist-rating" value="${a.rating || 5}">
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea class="form-textarea" id="artist-notes" rows="2" placeholder="合作体验、画风特点等">${escapeHtml(a.notes || '')}</textarea>
          </div>
        </div>
      `;

      showModal(
        isEdit ? '编辑画师信息' : '添加画师',
        body,
        [
          { label: '取消', style: 'ghost', onClick: closeModal },
          { label: isEdit ? '保存' : '添加', style: 'primary', onClick: () => {
            const data = {
              id: isEdit ? artistId : 'artist_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
              name: document.getElementById('artist-name').value.trim(),
              type: document.getElementById('artist-type').value,
              specialties: document.getElementById('artist-specialties').value.split(',').map(s => s.trim()).filter(Boolean),
              priceRange: document.getElementById('artist-priceRange').value.trim(),
              platform: document.getElementById('artist-platform').value.trim(),
              contact: document.getElementById('artist-contact').value.trim(),
              rating: parseInt(document.getElementById('artist-rating').value) || 5,
              notes: document.getElementById('artist-notes').value.trim(),
              isSample: isEdit ? (existing.isSample || false) : false,
              createdAt: isEdit ? (existing.createdAt || Date.now()) : Date.now()
            };
            if (!data.name) {
              showToast('请填写画师姓名', 'error');
              return;
            }
            saveArtist(data, isEdit);
            closeModal();
          }}
        ]
      );

      // 评分点击交互
      document.querySelectorAll('.rating-star').forEach(star => {
        star.addEventListener('click', () => {
          const rating = parseInt(star.dataset.rating);
          document.getElementById('artist-rating').value = rating;
          document.querySelectorAll('.rating-star').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
          });
        });
      });
    }

    // CRUD：约稿记录
    function saveCommission(data, isEdit) {
      if (isEdit) {
        const idx = state.commissions.findIndex(c => c.id === data.id);
        if (idx >= 0) state.commissions[idx] = data;
      } else {
        state.commissions.push(data);
      }
      saveState();
      renderCommissions();
      showToast(isEdit ? '约稿记录已更新' : '约稿记录已创建', 'success');
    }

    function deleteCommission(id) {
      const c = state.commissions.find(c => c.id === id);
      confirmDialog(`确定要删除这条约稿记录吗？${c ? '(' + (c.type || '') + ' · ' + (c.artistName || '') + ')' : ''}`, () => {
        state.commissions = state.commissions.filter(c => c.id !== id);
        saveState();
        renderCommissions();
        showToast('约稿记录已删除', 'success');
      });
    }

    // CRUD：画师
    function saveArtist(data, isEdit) {
      if (isEdit) {
        const idx = state.artists.findIndex(a => a.id === data.id);
        if (idx >= 0) state.artists[idx] = data;
        // 同步更新约稿记录中的画师名
        state.commissions.forEach(c => {
          if (c.artistId === data.id) c.artistName = data.name;
        });
      } else {
        state.artists.push(data);
      }
      saveState();
      renderCommissions();
      showToast(isEdit ? '画师信息已更新' : '画师已添加', 'success');
    }

    function deleteArtist(id) {
      const a = state.artists.find(a => a.id === id);
      const relatedCommissions = state.commissions.filter(c => c.artistId === id);
      const msg = relatedCommissions.length > 0
        ? `该画师有 ${relatedCommissions.length} 条关联约稿记录，删除后记录将保留但画师名不再更新。确定删除？`
        : `确定要删除画师 ${a ? a.name : ''} 吗？`;
      confirmDialog(msg, () => {
        state.artists = state.artists.filter(a => a.id !== id);
        saveState();
        renderCommissions();
        showToast('画师已删除', 'success');
      });
    }

    // 视图：设置
    function renderSettings() {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="page-header">
          <p class="page-eyebrow">Data & Preferences</p>
          <h1 class="page-title">设置</h1>
          <p class="page-subtitle">管理你的数据与偏好</p>
        </div>

        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">加载示例数据</div>
              <div class="settings-item-desc">加载 3 个预设 OC（星野绫、赤焰凯、月见夜），快速体验全部功能</div>
            </div>
            <button class="btn btn-ghost" data-action="load-sample">加载</button>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">导出全部数据</div>
              <div class="settings-item-desc">将所有 OC 数据导出为 JSON 文件，便于备份或迁移</div>
            </div>
            <button class="btn btn-ghost" data-action="export-all">导出</button>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">导入数据</div>
              <div class="settings-item-desc">从 JSON 文件导入 OC 数据（会合并到现有数据中）</div>
            </div>
            <button class="btn btn-ghost" data-action="import-data">导入</button>
            <input type="file" id="import-file-input" accept=".json" style="display:none">
          </div>
        </div>

        <div class="settings-section-title">版权保护默认设置</div>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">默认作者名</div>
              <div class="settings-item-desc">新建 OC 时默认填入的作者名</div>
            </div>
            <input type="text" class="form-input" id="default-author" value="${escapeAttr(state.copyrightSettings.defaultAuthor || '')}" placeholder="你的笔名" style="width:180px;">
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">默认启用水印</div>
              <div class="settings-item-desc">新建 OC 时默认开启水印保护</div>
            </div>
            <label class="toggle-switch"><input type="checkbox" id="default-watermark" ${state.copyrightSettings.defaultWatermark?'checked':''}><span class="toggle-slider"></span></label>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">默认禁止下载</div>
              <div class="settings-item-desc">新建 OC 时默认禁止图片下载</div>
            </div>
            <label class="toggle-switch"><input type="checkbox" id="default-disable-download" ${state.copyrightSettings.defaultDisableDownload?'checked':''}><span class="toggle-slider"></span></label>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">默认版权协议</div>
              <div class="settings-item-desc">新建 OC 时默认使用的版权协议</div>
            </div>
            <select class="form-select" id="default-license" style="width:180px;">
              ${['CC-BY','CC-BY-NC','独家','商用授权','保留所有权利'].map(l => `<option value="${l}" ${state.copyrightSettings.defaultLicense===l?'selected':''}>${l}</option>`).join('')}
            </select>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">保存版权设置</div>
              <div class="settings-item-desc">将上述设置保存为新建 OC 的默认值</div>
            </div>
            <button class="btn btn-primary" data-action="save-copyright-settings">保存</button>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-title">清空所有数据</div>
              <div class="settings-item-desc">删除所有 OC、成就、约稿记录，此操作不可恢复</div>
            </div>
            <button class="btn btn-danger" data-action="clear-all">清空</button>
          </div>
        </div>

        <div class="about-box">
          <div class="about-logo">OC Garden</div>
          <div class="about-version">Demo v1.0 · Local First</div>
          <p class="about-desc">
            让每个热爱原创角色的玩家，能够方便地创建、维护、养成自己的 OC，并在社区中分享与互动。你的数据完全存储在本地，隐私由你掌控。
          </p>
        </div>
      `;
    }
