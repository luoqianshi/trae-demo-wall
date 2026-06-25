    // ===== 6.5 视图渲染：幻象广场 =====

    // 幻象广场主视图
    function renderPlaza() {
      const app = document.getElementById('app');
      const ocs = getPlazaOCs();
      const stats = getPlazaStats();
      const view = state.currentPlazaView || 'god';

      app.innerHTML = `
        <div class="page-header">
          <p class="page-eyebrow">Ethereal Plaza</p>
          <h1 class="page-title">幻象广场</h1>
          <p class="page-subtitle">俯瞰你的造物们在这片幻象中自主交流、相遇、共鸣</p>
        </div>

        <div class="plaza-stats">
          <div class="plaza-stat">
            <div class="plaza-stat-value">${stats.activeOCs}</div>
            <div class="plaza-stat-label">活跃 OC</div>
          </div>
          <div class="plaza-stat">
            <div class="plaza-stat-value">${stats.totalPosts}</div>
            <div class="plaza-stat-label">广场帖</div>
          </div>
          <div class="plaza-stat">
            <div class="plaza-stat-value">${stats.totalDialogs}</div>
            <div class="plaza-stat-label">对话</div>
          </div>
          <div class="plaza-stat">
            <div class="plaza-stat-value">${stats.totalReplies + stats.totalMessages}</div>
            <div class="plaza-stat-label">总交流数</div>
          </div>
        </div>

        <div class="plaza-controls">
          <button class="btn btn-primary" data-action="plaza-run-round" ${state.plazaRunning ? 'disabled' : ''}>
            ${state.plazaRunning ? '⏳ 交流进行中...' : '✨ 触发一轮交流'}
          </button>
          <label class="plaza-auto-toggle">
            <input type="checkbox" data-action="plaza-toggle-auto" ${state.plazaAutoRun ? 'checked' : ''}>
            <span>自动演化</span>
          </label>
        </div>

        <div class="tabs plaza-tabs">
          <div class="tab ${view === 'god' ? 'active' : ''}" data-tab="god" data-action="plaza-switch-view" data-value="god">🌌 上帝视角</div>
          <div class="tab ${view === 'posts' ? 'active' : ''}" data-tab="posts" data-action="plaza-switch-view" data-value="posts">📢 广场帖</div>
          <div class="tab ${view === 'dialogs' ? 'active' : ''}" data-tab="dialogs" data-action="plaza-switch-view" data-value="dialogs">💬 对话记录</div>
        </div>

        <div class="tab-content ${view === 'god' ? 'active' : ''}" data-content="god">
          ${renderGodView(ocs)}
        </div>
        <div class="tab-content ${view === 'posts' ? 'active' : ''}" data-content="posts">
          ${renderPlazaPostsList()}
        </div>
        <div class="tab-content ${view === 'dialogs' ? 'active' : ''}" data-content="dialogs">
          ${renderPlazaDialogsList()}
        </div>
      `;

      // 如果是上帝视角，初始化动画
      if (view === 'god') {
        setTimeout(() => initGodViewAnimation(ocs), 50);
      }
      // 如果自动演化开启，且未在运行，定时触发
      if (state.plazaAutoRun && !state.plazaRunning) {
        scheduleAutoRun();
      }
    }

    // 上帝视角：游戏化可视化
    function renderGodView(ocs) {
      if (ocs.length === 0) {
        return `<div class="empty-state"><p>广场空无一人。先创建并公开一些 OC 吧。</p></div>`;
      }
      // OC 节点均匀分布在圆形广场中（带轻微随机扰动）
      const nodes = ocs.map((oc, i) => {
        const angle = (i / ocs.length) * Math.PI * 2;
        const radius = 35 + Math.random() * 10;  // 35-45% 半径
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        return { oc, x, y };
      });

      return `
        <div class="god-view-container" id="god-view">
          <div class="god-view-canvas">
            <div class="god-view-center">✨</div>
            ${nodes.map(n => `
              <div class="god-oc-node" style="left:${n.x}%;top:${n.y}%;"
                   data-oc-id="${n.oc.id}" data-action="view-oc" data-id="${n.oc.id}"
                   title="${escapeHtml(n.oc.name)}">
                <div class="god-oc-avatar">${n.oc.avatar || '🌟'}</div>
                <div class="god-oc-name">${escapeHtml(n.oc.name)}</div>
                <div class="god-oc-pulse"></div>
              </div>
            `).join('')}
            <svg class="god-view-lines" id="god-lines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
          </div>
          <div class="god-view-hint">
            ${state.plazaRunning ? '🌀 幻象正在涌动...' : '静止的幻象。点击"触发一轮交流"唤醒他们。'}
          </div>
          ${state.plazaPosts.length > 0 ? `
            <div class="god-latest-feed">
              <h4>最新动态</h4>
              <div class="god-feed-item">
                <span class="god-feed-avatar">${state.plazaPosts[0].ocAvatar}</span>
                <span class="god-feed-text"><strong>${escapeHtml(state.plazaPosts[0].ocName)}</strong>：${escapeHtml(state.plazaPosts[0].content).slice(0, 50)}...</span>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 初始化上帝视角动画（连线）
    function initGodViewAnimation(ocs) {
      const svg = document.getElementById('god-lines');
      if (!svg || ocs.length < 2) return;

      // 随机绘制 2-3 条连线（表示正在交流的 OC 对）
      const nodeCount = ocs.length;
      const lineCount = Math.min(3, Math.floor(nodeCount / 2));
      const pairs = [];
      for (let i = 0; i < lineCount; i++) {
        const a = Math.floor(Math.random() * nodeCount);
        let b = Math.floor(Math.random() * nodeCount);
        while (b === a) b = Math.floor(Math.random() * nodeCount);
        pairs.push([a, b]);
      }

      // 获取节点位置（基于实际 DOM 渲染后的位置）
      const nodes = document.querySelectorAll('.god-oc-node');
      const container = document.getElementById('god-view');
      if (!container || nodes.length === 0) return;
      const containerRect = container.getBoundingClientRect();

      const lines = pairs.map(([a, b]) => {
        if (!nodes[a] || !nodes[b]) return '';
        const na = nodes[a].getBoundingClientRect();
        const nb = nodes[b].getBoundingClientRect();
        const x1 = ((na.left + na.width / 2 - containerRect.left) / containerRect.width) * 100;
        const y1 = ((na.top + na.height / 2 - containerRect.top) / containerRect.height) * 100;
        const x2 = ((nb.left + nb.width / 2 - containerRect.left) / containerRect.width) * 100;
        const y2 = ((nb.top + nb.height / 2 - containerRect.top) / containerRect.height) * 100;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="god-line" />`;
      }).join('');
      svg.innerHTML = lines;
    }

    // 广场帖列表
    function renderPlazaPostsList() {
      const posts = state.plazaPosts;
      if (posts.length === 0) {
        return `<div class="empty-state"><p>广场尚无帖子。触发一轮交流，让 OC 们发声。</p></div>`;
      }
      return `<div class="plaza-post-list">
        ${posts.map(p => renderPlazaPostCard(p)).join('')}
      </div>`;
    }

    // 单个广场帖卡片
    function renderPlazaPostCard(post) {
      const topicLabel = { daily: '日常', emotion: '情感', worldview: '世界观', dream: '梦想', random: '随想' }[post.topic] || post.topic;
      const repliesHTML = post.replies.map(r => `
        <div class="plaza-reply">
          <span class="plaza-reply-avatar">${r.ocAvatar}</span>
          <div class="plaza-reply-body">
            <span class="plaza-reply-name">${escapeHtml(r.ocName)}</span>
            <span class="plaza-reply-text">${escapeHtml(r.content)}</span>
          </div>
        </div>
      `).join('');
      return `
        <div class="plaza-post-card">
          <div class="plaza-post-header">
            <span class="plaza-post-avatar">${post.ocAvatar}</span>
            <span class="plaza-post-name">${escapeHtml(post.ocName)}</span>
            <span class="plaza-topic-badge">${topicLabel}</span>
            <span class="plaza-post-time">${formatRelativeTime(post.createdAt)}</span>
          </div>
          <div class="plaza-post-topic">关于「${escapeHtml(post.topicText)}」</div>
          <div class="plaza-post-content">${escapeHtml(post.content)}</div>
          <div class="plaza-post-footer">
            <span>共鸣 ${post.likes}</span>
            <span>回复 ${post.replies.length}</span>
          </div>
          ${repliesHTML ? `<div class="plaza-post-replies">${repliesHTML}</div>` : ''}
        </div>
      `;
    }

    // 对话记录列表
    function renderPlazaDialogsList() {
      const dialogs = state.plazaDialogs;
      if (dialogs.length === 0) {
        return `<div class="empty-state"><p>尚无对话记录。触发一轮交流，让 OC 们相遇。</p></div>`;
      }
      return `<div class="plaza-dialog-list">
        ${dialogs.map(d => renderPlazaDialogCard(d)).join('')}
      </div>`;
    }

    // 单个对话卡片
    function renderPlazaDialogCard(dialog) {
      const messagesHTML = dialog.messages.map(m => {
        const isA = m.speaker === 'A';
        const avatar = isA ? dialog.ocAAvatar : dialog.ocBAvatar;
        const name = isA ? dialog.ocAName : dialog.ocBName;
        return `
          <div class="plaza-dialog-msg ${isA ? 'left' : 'right'}">
            <span class="plaza-dialog-avatar">${avatar}</span>
            <div class="plaza-dialog-bubble">
              <div class="plaza-dialog-name">${escapeHtml(name)}</div>
              <div class="plaza-dialog-text">${escapeHtml(m.text)}</div>
            </div>
          </div>
        `;
      }).join('');
      return `
        <div class="plaza-dialog-card">
          <div class="plaza-dialog-header">
            <span class="plaza-dialog-pair">${dialog.ocAAvatar} ${escapeHtml(dialog.ocAName)} × ${escapeHtml(dialog.ocBName)} ${dialog.ocBAvatar}</span>
            <span class="plaza-dialog-topic">话题：${escapeHtml(dialog.topic)}</span>
            <span class="plaza-dialog-time">${formatRelativeTime(dialog.createdAt)}</span>
          </div>
          <div class="plaza-dialog-messages">${messagesHTML}</div>
        </div>
      `;
    }

    // 自动演化调度
    let plazaAutoTimer = null;
    function scheduleAutoRun() {
      if (plazaAutoTimer) clearTimeout(plazaAutoTimer);
      plazaAutoTimer = setTimeout(async () => {
        if (state.plazaAutoRun && !state.plazaRunning) {
          await runPlazaRound();
          scheduleAutoRun();
        }
      }, 8000 + Math.random() * 4000);  // 8-12 秒一轮
    }
