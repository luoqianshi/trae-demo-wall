    // ===== 4. 视图渲染函数：社区 =====
    function renderCommunity() {
      const app = document.getElementById('app');
      const totalLikes = state.topics.reduce((s, t) => s + (t.likes || 0), 0);
      const totalComments = state.topics.reduce((s, t) => s + (t.comments || 0), 0);
      const activeOCs = getPublicOCs().length;
      const activeTab = state.currentCommunityTab || 'topics';

      app.innerHTML = `
        <div class="page-header">
          <p class="page-eyebrow">Community</p>
          <h1 class="page-title">社区广场</h1>
          <p class="page-subtitle">分享你的 OC，参与话题讨论，加入创作活动</p>
        </div>

        <div class="community-stats">
          <div class="commission-stat">
            <div class="commission-stat-value">${state.topics.length}</div>
            <div class="commission-stat-label">话题</div>
          </div>
          <div class="commission-stat">
            <div class="commission-stat-value">${totalLikes}</div>
            <div class="commission-stat-label">总点赞</div>
          </div>
          <div class="commission-stat">
            <div class="commission-stat-value">${totalComments}</div>
            <div class="commission-stat-label">总评论</div>
          </div>
          <div class="commission-stat">
            <div class="commission-stat-value">${activeOCs}</div>
            <div class="commission-stat-label">公开 OC</div>
          </div>
        </div>

        <div class="tabs community-tabs">
          <div class="tab ${activeTab === 'topics' ? 'active' : ''}" data-tab="topics" data-action="switch-community-tab" data-value="topics">话题广场</div>
          <div class="tab ${activeTab === 'events' ? 'active' : ''}" data-tab="events" data-action="switch-community-tab" data-value="events">活动赛事</div>
        </div>

        <div class="tab-content ${activeTab === 'topics' ? 'active' : ''}" data-content="topics">
          ${renderTopicPlaza()}
        </div>
        <div class="tab-content ${activeTab === 'events' ? 'active' : ''}" data-content="events">
          ${renderEventList()}
        </div>
      `;
    }

    // 话题广场（筛选 + 排序 + 卡片列表）
    function renderTopicPlaza() {
      const filter = state.currentCommunityFilter || 'all';
      const sort = state.currentCommunitySort || 'latest';

      let topics = state.topics.slice();
      if (filter !== 'all') {
        topics = topics.filter(t => t.category === filter);
      }
      if (sort === 'latest') {
        topics.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } else if (sort === 'hot') {
        topics.sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)));
      }

      const categories = ['all', 'worldview', 'race', 'creation', 'showcase'];

      const filterTagsHTML = categories.map(cat => `
        <button class="filter-tag ${filter === cat ? 'active' : ''}" data-action="filter-community" data-value="${cat}">${getCategoryLabel(cat)}</button>
      `).join('');

      const topicsHTML = topics.length > 0
        ? topics.map(t => renderTopicCard(t)).join('')
        : `<div class="empty-state"><p>暂无话题，快来发布第一条吧！</p></div>`;

      return `
        <div class="community-toolbar">
          <div class="filter-tags">${filterTagsHTML}</div>
          <div class="toolbar-right">
            <select class="sort-select" data-action="sort-community">
              <option value="latest" ${sort === 'latest' ? 'selected' : ''}>最新</option>
              <option value="hot" ${sort === 'hot' ? 'selected' : ''}>热门</option>
            </select>
            <button class="btn btn-primary" data-action="publish-topic">✍️ 发布话题</button>
          </div>
        </div>
        <div class="topic-list">${topicsHTML}</div>
      `;
    }

    // 单个话题卡片
    function renderTopicCard(topic) {
      const liked = isLiked('topic', topic.id);
      const favorited = isFavorited('topic', topic.id);
      const relatedOC = topic.relatedOCId ? state.ocs.find(o => o.id === topic.relatedOCId) : null;
      const tagsHTML = (topic.tags || []).map(tag => `<span class="topic-tag">#${escapeHtml(tag)}</span>`).join('');
      const summary = (topic.content || '').replace(/\n/g, ' ').slice(0, 120) + ((topic.content || '').length > 120 ? '...' : '');

      return `
        <div class="topic-card">
          <div class="topic-card-header">
            <span class="topic-author-avatar">${topic.authorAvatar || '👤'}</span>
            <span class="topic-author-name">${escapeHtml(topic.author || '匿名')}</span>
            <span class="category-badge" style="background:${getCategoryColor(topic.category)}">${getCategoryLabel(topic.category)}</span>
            <span class="topic-time">${formatRelativeTime(topic.createdAt)}</span>
          </div>
          <h3 class="topic-card-title">${escapeHtml(topic.title)}</h3>
          <p class="topic-card-content">${escapeHtml(summary)}</p>
          ${tagsHTML ? `<div class="topic-card-tags">${tagsHTML}</div>` : ''}
          ${relatedOC ? `<div class="topic-related-oc">🔗 关联 OC：${escapeHtml(relatedOC.name)}</div>` : ''}
          <div class="topic-card-footer">
            <button class="like-btn ${liked ? 'liked' : ''}" data-action="like-topic" data-id="${topic.id}">
              ${liked ? '❤️' : '🤍'} ${topic.likes || 0}
            </button>
            <span class="topic-stat">💬 ${topic.comments || 0}</span>
            <button class="favorite-btn ${favorited ? 'favorited' : ''}" data-action="favorite-topic" data-id="${topic.id}">
              ${favorited ? '⭐' : '☆'}
            </button>
            <button class="btn btn-ghost btn-sm" data-action="view-topic" data-id="${topic.id}">查看详情 →</button>
          </div>
        </div>
      `;
    }

    // ===== 视图：话题详情 =====
    function renderTopicDetail(topicId) {
      const app = document.getElementById('app');
      const topic = state.topics.find(t => t.id === topicId);
      if (!topic) {
        app.innerHTML = `<div class="page-header"><h1 class="page-title">话题不存在</h1></div><div class="empty-state"><p>该话题可能已被删除</p><button class="btn btn-primary" data-route="#/community">返回社区</button></div>`;
        return;
      }

      const liked = isLiked('topic', topic.id);
      const favorited = isFavorited('topic', topic.id);
      const comments = getComments('topic', topic.id);
      const relatedOC = topic.relatedOCId ? state.ocs.find(o => o.id === topic.relatedOCId) : null;
      const tagsHTML = (topic.tags || []).map(tag => `<span class="topic-tag">#${escapeHtml(tag)}</span>`).join('');
      const isOwner = topic.author === '我';

      const commentsHTML = comments.length > 0
        ? comments.map(c => renderCommentItem(c)).join('')
        : `<div class="empty-state"><p>暂无评论，快来抢沙发！</p></div>`;

      app.innerHTML = `
        <div class="page-header">
          <button class="back-link" data-route="#/community">← 返回社区</button>
        </div>
        <div class="topic-detail">
          <div class="topic-detail-header">
            <span class="topic-author-avatar">${topic.authorAvatar || '👤'}</span>
            <span class="topic-author-name">${escapeHtml(topic.author || '匿名')}</span>
            <span class="category-badge" style="background:${getCategoryColor(topic.category)}">${getCategoryLabel(topic.category)}</span>
            <span class="topic-time">${formatRelativeTime(topic.createdAt)}</span>
            ${isOwner ? `<button class="btn btn-ghost btn-sm topic-delete-btn" data-action="delete-topic" data-id="${topic.id}">🗑️ 删除</button>` : ''}
          </div>
          <h1 class="topic-detail-title">${escapeHtml(topic.title)}</h1>
          <div class="topic-detail-content">${escapeHtml(topic.content || '').replace(/\n/g, '<br>')}</div>
          ${tagsHTML ? `<div class="topic-detail-tags">${tagsHTML}</div>` : ''}
          ${relatedOC ? `<div class="topic-related-oc">🔗 关联 OC：<a data-route="#/oc/${relatedOC.id}">${escapeHtml(relatedOC.name)}</a>${relatedOC.privacy !== 'public' ? ' <span class="private-hint">（该 OC 已设为私密）</span>' : ''}</div>` : ''}
          <div class="topic-detail-actions">
            <button class="like-btn ${liked ? 'liked' : ''}" data-action="like-topic" data-id="${topic.id}">
              ${liked ? '❤️ 已点赞' : '🤍 点赞'} · ${topic.likes || 0}
            </button>
            <button class="favorite-btn ${favorited ? 'favorited' : ''}" data-action="favorite-topic" data-id="${topic.id}">
              ${favorited ? '⭐ 已收藏' : '☆ 收藏'}
            </button>
          </div>
          <div class="topic-comments">
            <h3 class="comments-header">💬 评论 (${comments.length})</h3>
            <div class="comment-list">${commentsHTML}</div>
            <div class="comment-input-area">
              <textarea class="comment-input" placeholder="写下你的评论..." rows="3"></textarea>
              <button class="btn btn-primary" data-action="send-comment" data-target-type="topic" data-target-id="${topic.id}">发送</button>
            </div>
          </div>
        </div>
      `;
    }

    // 单条评论
    function renderCommentItem(comment) {
      const isOwner = comment.author === '我';
      return `
        <div class="comment-item">
          <span class="comment-avatar">${comment.authorAvatar || '👤'}</span>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-author">${escapeHtml(comment.author)}</span>
              <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
              ${isOwner ? `<button class="comment-delete-btn" data-action="delete-comment" data-id="${comment.id}">删除</button>` : ''}
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
          </div>
        </div>
      `;
    }

    // ===== 视图：活动赛事列表 =====
    function renderEventList() {
      const events = state.events.slice().sort((a, b) => {
        const order = { ongoing: 0, upcoming: 1, ended: 2 };
        return (order[a.status] || 3) - (order[b.status] || 3);
      });

      const eventsHTML = events.length > 0
        ? events.map(e => renderEventCard(e)).join('')
        : `<div class="empty-state"><p>暂无活动赛事</p></div>`;

      return `<div class="event-list">${eventsHTML}</div>`;
    }

    // 单个活动卡片
    function renderEventCard(event) {
      const joined = isJoinedEvent(event.id);
      const statusClass = `event-status-${event.status}`;
      let actionBtn = '';
      if (event.status === 'ended') {
        actionBtn = `<button class="btn btn-ghost btn-sm" data-action="view-event" data-id="${event.id}">查看结果</button>`;
      } else if (joined) {
        actionBtn = `<button class="btn btn-ghost btn-sm" data-action="join-event" data-id="${event.id}">✓ 已报名</button>`;
      } else {
        actionBtn = `<button class="btn btn-primary btn-sm" data-action="join-event" data-id="${event.id}">立即报名</button>`;
      }

      return `
        <div class="event-card">
          <div class="event-card-header">
            <span class="event-type-icon">${getEventTypeIcon(event.type)}</span>
            <span class="event-type-label">${getEventTypeLabel(event.type)}</span>
            <span class="event-status-badge ${statusClass}">${getEventStatusLabel(event.status)}</span>
          </div>
          <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
          <p class="event-card-desc">${escapeHtml(event.description || '')}</p>
          <div class="event-card-footer">
            <span class="event-time">📅 ${formatDateRange(event.startDate, event.endDate)}</span>
            <span class="event-participants">👥 ${event.participants || 0} 人参与</span>
            ${actionBtn}
          </div>
        </div>
      `;
    }

    // ===== 视图：独立活动赛事页 =====
    function renderEvents() {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="page-header">
          <p class="page-eyebrow">Events</p>
          <h1 class="page-title">活动赛事</h1>
          <p class="page-subtitle">参与官方与社区举办的 OC 创作活动</p>
        </div>
        ${renderEventList()}
      `;
    }

    // ===== 话题发布表单 =====
    function renderTopicForm(existingTopicId) {
      const editing = !!existingTopicId;
      const topic = editing ? state.topics.find(t => t.id === existingTopicId) : null;
      const publicOCs = getPublicOCs();
      const ocOptions = publicOCs.map(oc =>
        `<option value="${oc.id}" ${topic && topic.relatedOCId === oc.id ? 'selected' : ''}>${escapeHtml(oc.name)}</option>`
      ).join('');

      const body = `
        <form id="topic-form" class="modal-form">
          <div class="form-group">
            <label class="form-label">标题 *</label>
            <input type="text" name="title" class="form-input" required maxlength="50" value="${topic ? escapeAttr(topic.title) : ''}" placeholder="给话题起个标题">
          </div>
          <div class="form-group">
            <label class="form-label">分类 *</label>
            <select name="category" class="form-input" required>
              <option value="worldview" ${topic && topic.category === 'worldview' ? 'selected' : ''}>世界观</option>
              <option value="race" ${topic && topic.category === 'race' ? 'selected' : ''}>种族</option>
              <option value="creation" ${topic && topic.category === 'creation' ? 'selected' : ''}>创作形式</option>
              <option value="showcase" ${topic && topic.category === 'showcase' ? 'selected' : ''}>OC展示</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">关联 OC（可选）</label>
            <select name="relatedOCId" class="form-input">
              <option value="">不关联</option>
              ${ocOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">标签（逗号分隔）</label>
            <input type="text" name="tags" class="form-input" value="${topic ? (topic.tags || []).join(', ') : ''}" placeholder="如：科幻, 星际, 设定">
          </div>
          <div class="form-group">
            <label class="form-label">内容 *</label>
            <textarea name="content" class="form-input" rows="8" required placeholder="分享你的想法、设定或作品...">${topic ? escapeHtml(topic.content) : ''}</textarea>
          </div>
        </form>
      `;

      showModal(
        editing ? '编辑话题' : '发布话题',
        body,
        [
          { label: '取消', style: 'btn-ghost' },
          { label: editing ? '保存' : '发布', style: 'btn-primary', onClick: () => submitTopicForm(existingTopicId || '') }
        ]
      );
    }

    // ===== 分享 OC 到社区表单 =====
    function renderShareOCForm(ocId) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc) {
        showToast('OC 不存在', 'warning');
        return;
      }
      if (oc.privacy !== 'public') {
        showToast('请先将 OC 设为公开再分享', 'warning');
        return;
      }

      const body = `
        <form id="topic-form" class="modal-form">
          <div class="form-group">
            <label class="form-label">分享的 OC</label>
            <div class="share-oc-preview">
              <span class="topic-author-avatar">${oc.avatar || '🌟'}</span>
              <span>${escapeHtml(oc.name)}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">标题 *</label>
            <input type="text" name="title" class="form-input" required maxlength="50" placeholder="如：我家 OC 的故事" value="${escapeAttr(oc.name)}的展示">
          </div>
          <div class="form-group">
            <label class="form-label">标签（逗号分隔）</label>
            <input type="text" name="tags" class="form-input" placeholder="如：OC展示, 设定" value="OC展示, ${escapeAttr(oc.race || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">内容 *</label>
            <textarea name="content" class="form-input" rows="8" required placeholder="介绍一下你的 OC 吧...">${escapeHtml(oc.background || oc.description || '')}</textarea>
          </div>
          <input type="hidden" name="relatedOCId" value="${oc.id}">
          <input type="hidden" name="category" value="showcase">
        </form>
      `;

      showModal(
        `分享 ${escapeHtml(oc.name)} 到社区`,
        body,
        [
          { label: '取消', style: 'btn-ghost' },
          { label: '分享', style: 'btn-primary', onClick: () => submitTopicForm('') }
        ]
      );
    }

    // 提交话题表单
    function submitTopicForm(existingTopicId) {
      const form = document.getElementById('topic-form');
      if (!form) return;
      const formData = new FormData(form);
      const title = (formData.get('title') || '').trim();
      const content = (formData.get('content') || '').trim();
      if (!title || !content) {
        showToast('标题和内容不能为空', 'warning');
        return;
      }

      const tags = (formData.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean);
      const category = formData.get('category') || 'showcase';
      const relatedOCId = formData.get('relatedOCId') || null;

      if (existingTopicId) {
        // 编辑
        const topic = state.topics.find(t => t.id === existingTopicId);
        if (topic) {
          topic.title = title;
          topic.content = content;
          topic.tags = tags;
          topic.category = category;
          topic.relatedOCId = relatedOCId;
        }
        saveState();
        closeModal();
        showToast('话题已更新', 'success');
        navigate(`#/topic/${existingTopicId}`);
      } else {
        // 新建
        const topic = {
          id: 'topic_' + Date.now().toString(36),
          title, content, tags, category, relatedOCId,
          author: '我',
          authorAvatar: '🌙',
          likes: 0,
          comments: 0,
          createdAt: Date.now(),
          isSample: false
        };
        state.topics.push(topic);
        saveState();
        closeModal();
        showToast('话题已发布', 'success');
        navigate(`#/topic/${topic.id}`);
      }
    }

    // ===== 视图：领养市场 =====
    function renderAdoptMarket() {
      const app = document.getElementById('app');
      const allMarket = state.adoptMarket;
      const available = getAdoptableOCs();
      const myAdopted = getMyAdoptedOCs();
      const myListed = getMyListedOCs();
      const filter = state.currentAdoptFilter || 'all';

      let list = allMarket;
      if (filter === 'free') list = allMarket.filter(o => o.type === 'free' && !o.isAdopted);
      else if (filter === 'fixed') list = allMarket.filter(o => o.type === 'fixed' && !o.isAdopted);
      else if (filter === 'raffle') list = allMarket.filter(o => o.type === 'raffle' && !o.isAdopted);

      const filterLabels = { all: '全部', free: '无偿', fixed: '一口价', raffle: '抽奖', mine: '我上架的' };
      const filterTagsHTML = ['all', 'free', 'fixed', 'raffle', 'mine'].map(f =>
        `<button class="filter-tag ${filter === f ? 'active' : ''}" data-action="filter-adopt" data-value="${f}">${filterLabels[f]}</button>`
      ).join('');

      let gridHTML;
      if (filter === 'mine') {
        gridHTML = myListed.length > 0
          ? myListed.map(oc => renderMyListedCard(oc)).join('')
          : `<div class="empty-state"><p>你还没有上架 OC，去 OC 详情页上架吧</p></div>`;
      } else {
        gridHTML = list.length > 0
          ? list.map(o => renderAdoptCard(o)).join('')
          : `<div class="empty-state"><p>暂无可领养的 OC</p></div>`;
      }

      const myAdoptedHTML = myAdopted.length > 0
        ? `<h3 class="adopt-section-title">我领养的 OC</h3>
           <div class="adopt-grid">${myAdopted.map(r => renderMyAdoptedCard(r)).join('')}</div>`
        : '';

      app.innerHTML = `
        <div class="page-header">
          <p class="page-eyebrow">Adopt Market</p>
          <h1 class="page-title">领养市场</h1>
          <p class="page-subtitle">领养创作者设计的原创角色，成为TA的新家长</p>
        </div>
        <div class="community-stats">
          <div class="commission-stat"><div class="commission-stat-value">${available.length}</div><div class="commission-stat-label">可领养</div></div>
          <div class="commission-stat"><div class="commission-stat-value">${allMarket.filter(o => o.isAdopted).length}</div><div class="commission-stat-label">已领养</div></div>
          <div class="commission-stat"><div class="commission-stat-value">${myAdopted.length}</div><div class="commission-stat-label">我领养的</div></div>
          <div class="commission-stat"><div class="commission-stat-value">${myListed.length}</div><div class="commission-stat-label">我上架的</div></div>
        </div>
        <div class="community-toolbar">
          <div class="filter-tags">${filterTagsHTML}</div>
        </div>
        <div class="adopt-grid">${gridHTML}</div>
        ${myAdoptedHTML}
      `;
    }

    // 领养市场卡片
    function renderAdoptCard(marketOC) {
      const typeLabel = { free: '无偿', fixed: '一口价', raffle: '抽奖' }[marketOC.type] || marketOC.type;
      const typeIcon = { free: '🎁', fixed: '💰', raffle: '🎲' }[marketOC.type] || '🎁';
      let actionBtn;
      if (marketOC.isAdopted) {
        actionBtn = `<button class="btn btn-ghost" disabled>✓ 已被 ${escapeHtml(marketOC.adoptedBy || '他人')} 领养</button>`;
      } else if (marketOC.type === 'raffle') {
        actionBtn = `<button class="btn btn-primary" data-action="raffle-adopt" data-id="${marketOC.id}">🎲 参与抽奖</button>`;
      } else if (marketOC.type === 'fixed') {
        actionBtn = `<button class="btn btn-primary" data-action="adopt-market-oc" data-id="${marketOC.id}">💰 领养（¥${marketOC.price}）</button>`;
      } else {
        actionBtn = `<button class="btn btn-primary" data-action="adopt-market-oc" data-id="${marketOC.id}">🎁 立即领养</button>`;
      }
      const bg = marketOC.background || '';
      const desc = bg.length > 80 ? bg.slice(0, 80) + '...' : bg;
      return `
        <div class="adopt-card ${marketOC.isAdopted ? 'adopted' : ''}">
          <div class="adopt-card-header">
            <span class="adopt-avatar">${marketOC.avatar || '🌟'}</span>
            <div class="adopt-card-title-wrap">
              <h3 class="adopt-card-title">${escapeHtml(marketOC.name)}</h3>
              <span class="adopt-creator">by ${escapeHtml(marketOC.creator || '匿名')}</span>
            </div>
            <span class="adopt-type-badge adopt-type-${marketOC.type}">${typeIcon} ${typeLabel}</span>
          </div>
          <div class="adopt-card-body">
            <p class="adopt-card-desc">${escapeHtml(desc)}</p>
            ${marketOC.description ? `<div class="adopt-info-box">📝 ${escapeHtml(marketOC.description)}</div>` : ''}
            <div class="adopt-stats">
              <span>🏷️ ${escapeHtml(marketOC.license || 'CC-BY')}</span>
              <span>📅 ${formatRelativeTime(marketOC.listedAt)}</span>
            </div>
          </div>
          <div class="adopt-card-footer">${actionBtn}</div>
        </div>
      `;
    }

    // 我上架的 OC 卡片
    function renderMyListedCard(oc) {
      const typeLabel = { free: '无偿', fixed: '一口价', raffle: '抽奖' }[oc.adoptable.type] || oc.adoptable.type;
      return `
        <div class="adopt-card">
          <div class="adopt-card-header">
            <span class="adopt-avatar">${oc.avatar || '🌟'}</span>
            <div class="adopt-card-title-wrap">
              <h3 class="adopt-card-title">${escapeHtml(oc.name)}</h3>
              <span class="adopt-creator">${typeLabel}${oc.adoptable.type === 'fixed' ? ` · ¥${oc.adoptable.price}` : ''}</span>
            </div>
          </div>
          <div class="adopt-card-footer">
            <button class="btn btn-ghost btn-sm" data-action="view-oc" data-id="${oc.id}">查看</button>
            <button class="btn btn-ghost btn-sm" data-action="unlist-adopt" data-id="${oc.id}">下架</button>
          </div>
        </div>
      `;
    }

    // 我领养的 OC 卡片
    function renderMyAdoptedCard(record) {
      const oc = state.ocs.find(o => o.id === record.ocId);
      if (!oc) return '';
      const typeLabel = { free: '无偿', fixed: `¥${record.price}`, raffle: '抽奖' }[record.adoptionType] || record.adoptionType;
      return `
        <div class="adopt-card">
          <div class="adopt-card-header">
            <span class="adopt-avatar">${oc.avatar || '🌟'}</span>
            <div class="adopt-card-title-wrap">
              <h3 class="adopt-card-title">${escapeHtml(oc.name)}</h3>
              <span class="adopt-creator">原创建者：${escapeHtml(record.originalCreator || '未知')}</span>
            </div>
          </div>
          <div class="adopt-stats">
            <span>📜 ${escapeHtml(record.license)}</span>
            <span>${typeLabel}</span>
            <span>📅 ${formatRelativeTime(record.adoptedAt)}</span>
          </div>
          <div class="adopt-card-footer">
            <button class="btn btn-primary btn-sm" data-action="view-oc" data-id="${oc.id}">查看我的 OC</button>
          </div>
        </div>
      `;
    }

    // ===== 上架领养表单 =====
    function renderListAdoptForm(ocId) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc) { showToast('OC 不存在', 'warning'); return; }
      const a = oc.adoptable || {};
      const body = `
        <form id="adopt-list-form" class="modal-form">
          <div class="share-oc-preview"><span class="topic-author-avatar">${oc.avatar || '🌟'}</span><span>${escapeHtml(oc.name)}</span></div>
          <div class="form-group">
            <label class="form-label">领养形式 *</label>
            <select name="type" class="form-input" required>
              <option value="free" ${a.type === 'free' ? 'selected' : ''}>无偿领养</option>
              <option value="fixed" ${a.type === 'fixed' ? 'selected' : ''}>一口价</option>
              <option value="raffle" ${a.type === 'raffle' ? 'selected' : ''}>抽奖领养</option>
            </select>
          </div>
          <div class="form-group" id="price-group" style="${a.type === 'fixed' ? '' : 'display:none;'}">
            <label class="form-label">一口价金额（元）</label>
            <input type="number" name="price" class="form-input" min="0" value="${a.price || 0}" placeholder="如 88">
          </div>
          <div class="form-group">
            <label class="form-label">授权条款</label>
            <select name="license" class="form-input">
              ${['CC-BY', 'CC-BY-NC', '商用授权', '独家', '保留所有权利'].map(l => `<option value="${l}" ${a.license === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">领养说明</label>
            <textarea name="description" class="form-input" rows="3" placeholder="如：希望领养后多画日常向的图，不要转卖">${escapeHtml(a.description || '')}</textarea>
          </div>
        </form>
      `;
      showModal(`上架 ${escapeHtml(oc.name)} 到领养市场`, body, [
        { label: '取消', style: 'btn-ghost' },
        { label: '上架', style: 'btn-primary', onClick: () => submitListAdoptForm(ocId) }
      ]);
      // type 切换时显示/隐藏价格输入
      const typeSelect = document.querySelector('#adopt-list-form select[name="type"]');
      if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
          const priceGroup = document.getElementById('price-group');
          if (priceGroup) priceGroup.style.display = e.target.value === 'fixed' ? '' : 'none';
        });
      }
    }

    function submitListAdoptForm(ocId) {
      const form = document.getElementById('adopt-list-form');
      if (!form) return;
      const fd = new FormData(form);
      const type = fd.get('type');
      const price = type === 'fixed' ? (Number(fd.get('price')) || 0) : 0;
      if (type === 'fixed' && price <= 0) { showToast('一口价金额需大于 0', 'warning'); return; }
      listOCForAdoption(ocId, {
        type, price,
        license: fd.get('license') || 'CC-BY',
        description: (fd.get('description') || '').trim()
      });
      closeModal();
      navigate('#/adopt-market');
    }
