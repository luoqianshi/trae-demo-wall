/**
 * 成长印记 · 渲染引擎（render.js）
 * 负责所有 DOM 渲染与更新，监听 Store 变化
 */

'use strict';

// ============================================================
// Render 对象
// ============================================================
const Render = {

  // ============================================================
  // 卡片分页状态（无限滚动 + DOM diff）
  // - records: 当前完整筛选结果（全部匹配记录，非仅可见部分）
  // - visibleCount: 已渲染到 DOM 的卡片数量
  // - keyword: 上次渲染使用的关键词（变化时需重建高亮）
  // - pageSize: 每页加载量
  // - needsRebuild: 是否需要全量重建可见页（keyword 变化或容器为空）
  // ============================================================
  _cardsState: {
    records: [],
    visibleCount: 0,
    keyword: null,
    pageSize: 20,
    needsRebuild: true
  },

  // IntersectionObserver 实例（懒加载，首次 _ensureSentinel 时创建）
  _scrollObserver: null,

  // ============================================================
  // 渲染卡片列表（首页）—— 增量渲染优化版
  // 参数：
  //   container  - 卡片容器
  //   records    - 记录数组（已是最终顺序，无需再 reverse）
  //   highlightId - 新增记录高亮 ID（可选）
  //   keyword    - 搜索关键词，用于高亮匹配（可选）
  // ============================================================
  renderCards(container, records, highlightId, keyword) {
    if (!container) return;

    try {
    // 空记录：清空容器，重置状态，不创建 sentinel
    if (!records || records.length === 0) {
      container.querySelectorAll('.record-card').forEach(c => c.remove());
      this._cardsState.records = [];
      this._cardsState.visibleCount = 0;
      this._cardsState.keyword = keyword;
      this._cardsState.needsRebuild = true;
      return;
    }

    // 路径 A — 新记录添加（增量插入顶部，不重建已有卡片）
    if (highlightId) {
      const newRecord = records.find(r => r.id === highlightId);
      if (newRecord) {
        const card = this._createCardElement(newRecord, true, keyword);
        // 插入到第一张卡片之前（兼容 sentinel 存在的情况）
        const firstCard = container.querySelector('.record-card');
        if (firstCard) {
          container.insertBefore(card, firstCard);
        } else {
          const sentinel = container.querySelector('.cards-scroll-sentinel');
          if (sentinel) {
            container.insertBefore(card, sentinel);
          } else {
            container.appendChild(card);
          }
        }
        // 更新分页状态
        this._cardsState.records = records;
        this._cardsState.keyword = keyword;
        this._cardsState.visibleCount = Math.min(
          this._cardsState.visibleCount + 1, records.length
        );
        this._ensureSentinel(container);
        return;
      }
    }

    // 路径 B — 全量渲染（初始化 / 搜索 / 筛选 / 删除）
    // 判断是否需要重建：关键词变化（高亮需重绘）或容器内无卡片（首次渲染）
    const hasExistingCards = container.querySelector('.record-card') !== null;
    const keywordChanged = (keyword !== this._cardsState.keyword);
    this._cardsState.needsRebuild = keywordChanged || !hasExistingCards;

    // 更新状态，重置到第一页
    this._cardsState.records = records;
    this._cardsState.keyword = keyword;
    this._cardsState.visibleCount = Math.min(this._cardsState.pageSize, records.length);

    // 渲染可视页（diff 或重建）
    this._renderVisibleCards(container, keyword);
    // 确保 sentinel 存在并绑定观察者
    this._ensureSentinel(container);

    } catch (err) {
      console.error('[成长印记] renderCards 渲染失败', err);
      // 整体渲染失败时在容器内显示错误提示，避免白屏
      container.innerHTML = '<div class="render-error">卡片列表渲染出错，请刷新页面重试</div>';
    }
  },

  // ============================================================
  // 渲染当前可视页（前 visibleCount 条）
  // 根据 needsRebuild 选择全量重建或 DOM diff 策略
  // ============================================================
  _renderVisibleCards(container, keyword) {
    try {
    const { records, visibleCount, needsRebuild } = this._cardsState;
    const visibleRecords = records.slice(0, visibleCount);

    // 查找已存在的 sentinel（diff 时需保留，不参与卡片重建）
    const sentinel = container.querySelector('.cards-scroll-sentinel');

    if (needsRebuild) {
      // 全量重建：关键词变化或容器为空
      // 移除所有旧卡片（保留 sentinel）
      container.querySelectorAll('.record-card').forEach(c => c.remove());

      // 创建前 visibleCount 条卡片
      const frag = document.createDocumentFragment();
      visibleRecords.forEach((record, idx) => {
        const card = this._createCardElement(record, false, keyword);
        card.style.animationDelay = `${idx * 0.05}s`;
        frag.appendChild(card);
      });
      // 插入到 sentinel 之前（若存在），否则直接 append
      if (sentinel) {
        container.insertBefore(frag, sentinel);
      } else {
        container.appendChild(frag);
      }
    } else {
      // DOM diff：关键词未变，仅筛选/排序变化，复用已有卡片
      // 构建已有卡片映射：recordId → cardElement
      const existing = new Map();
      container.querySelectorAll('.record-card').forEach(card => {
        existing.set(card.dataset.recordId, card);
      });
      const newIds = new Set(visibleRecords.map(r => r.id));

      // 移除不在新结果中的旧卡片
      existing.forEach((card, id) => {
        if (!newIds.has(id)) card.remove();
      });

      // 按新顺序重排 + 创建缺失卡片
      // 将已有卡片 moveTo fragment 会改变 DOM 位置，最终统一插入实现重排
      const frag = document.createDocumentFragment();
      visibleRecords.forEach((record, idx) => {
        let card = existing.get(record.id);
        if (card) {
          // 复用已有卡片（移动到 fragment 以重排顺序）
          frag.appendChild(card);
        } else {
          // 创建新卡片
          card = this._createCardElement(record, false, keyword);
          card.style.animationDelay = `${idx * 0.05}s`;
          frag.appendChild(card);
        }
      });
      if (sentinel) {
        container.insertBefore(frag, sentinel);
      } else {
        container.appendChild(frag);
      }
    }

    } catch (err) {
      console.error('[成长印记] _renderVisibleCards 渲染失败', err);
      // 降级：清空容器并重建所有可见卡片（不做 diff）
      container.querySelectorAll('.record-card').forEach(c => c.remove());
      const { records, visibleCount } = this._cardsState;
      const frag = document.createDocumentFragment();
      records.slice(0, visibleCount).forEach(record => {
        frag.appendChild(this._createCardElement(record, false, keyword));
      });
      container.appendChild(frag);
    }
  },

  // ============================================================
  // 滚动加载更多卡片（由 IntersectionObserver 触发）
  // ============================================================
  _loadMoreCards(container) {
    try {
    const { records, visibleCount, pageSize, keyword } = this._cardsState;
    // 全部已加载，无需操作
    if (visibleCount >= records.length) return;

    const newCount = Math.min(visibleCount + pageSize, records.length);
    const newRecords = records.slice(visibleCount, newCount);
    const sentinel = container.querySelector('.cards-scroll-sentinel');

    // 逐个创建卡片，插入到 sentinel 之前
    newRecords.forEach((record) => {
      const card = this._createCardElement(record, false, keyword);
      if (sentinel) {
        container.insertBefore(card, sentinel);
      } else {
        container.appendChild(card);
      }
    });

    this._cardsState.visibleCount = newCount;

    // 全部加载完毕 → 隐藏 sentinel
    if (newCount >= records.length && sentinel) {
      sentinel.style.display = 'none';
    }

    // 防级联：超长屏幕可能加载一页后 sentinel 仍在视口内
    // 用 rAF 等待布局更新后检查，若仍在视口则继续加载
    if (newCount < records.length) {
      requestAnimationFrame(() => {
        const s = container.querySelector('.cards-scroll-sentinel');
        if (!s || s.style.display === 'none') return;
        const rect = s.getBoundingClientRect();
        // sentinel 在视口 + 300px 预加载范围内 → 继续加载
        if (rect.top < window.innerHeight + 300) {
          this._loadMoreCards(container);
        }
      });
    }

    } catch (err) {
      console.error('[成长印记] _loadMoreCards 加载更多卡片失败', err);
    }
  },

  // ============================================================
  // 确保哨兵元素存在并绑定 IntersectionObserver
  // sentinel 是不可见的触发元素，放在卡片列表末尾
  // ============================================================
  _ensureSentinel(container) {
    const { records, visibleCount } = this._cardsState;
    const hasMore = visibleCount < records.length;

    let sentinel = container.querySelector('.cards-scroll-sentinel');

    if (!sentinel) {
      // 首次创建 sentinel
      sentinel = document.createElement('div');
      sentinel.className = 'cards-scroll-sentinel';

      // 首次创建 IntersectionObserver（懒加载）
      if (!this._scrollObserver) {
        this._scrollObserver = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            this._loadMoreCards(container);
          }
        }, { rootMargin: '300px 0px' });
      }
      this._scrollObserver.observe(sentinel);
    }

    // 确保 sentinel 在容器末尾
    container.appendChild(sentinel);
    // 有更多卡片可加载时显示 sentinel，否则隐藏
    sentinel.style.display = hasMore ? 'block' : 'none';
  },

  // ============================================================
  // 渲染卡片详情中的关联区块（上游关联 + 交叉关联）
  // ============================================================
  _renderRelationsBlock(record) {
    const relations = record.relations || {};
    const upstream = relations.upstream || [];
    const crossLinks = relations.crossLinks || [];

    // 无关联数据时不渲染
    if (upstream.length === 0 && crossLinks.length === 0) return '';

    let html = '<div class="detail-relations">';

    // --- 上游关联 ---
    if (upstream.length > 0) {
      html += '<div class="detail-label">关联节点</div>';
      html += '<div class="detail-relations-list">';
      upstream.forEach(u => {
        // 通过 Store 查找关联记录的标题
        const refRecord = Store.records.find(r => r.id === u.recordId);
        const refTitle = refRecord
          ? this._escapeHtml(refRecord.understanding.title)
          : this._escapeHtml(u.recordId);
        const typeLabel = (typeof RELATION_TYPE_LABELS !== 'undefined' && RELATION_TYPE_LABELS[u.type]) || '关联';
        const reason = u.reason ? this._escapeHtml(u.reason) : '';
        // 转义单引号，生成安全的 onclick
        const safeId = u.recordId.replace(/'/g, "\\'");
        html += `
          <div class="relation-item relation-item-upstream">
            <span class="relation-type-badge">${this._escapeHtml(typeLabel)}</span>
            <a class="relation-link" onclick="event.stopPropagation(); App.scrollToCard('${safeId}')">
              ${u.recordId} · ${refTitle}
            </a>
            ${reason ? `<div class="relation-reason">${reason}</div>` : ''}
          </div>
        `;
      });
      html += '</div>';
    }

    // --- 交叉关联（跨脉络） ---
    if (crossLinks.length > 0) {
      html += '<div class="detail-label" style="margin-top:12px;">跨脉络关联</div>';
      html += '<div class="detail-relations-list">';
      crossLinks.forEach(c => {
        const refRecord = Store.records.find(r => r.id === c.recordId);
        const refTitle = refRecord
          ? this._escapeHtml(refRecord.understanding.title)
          : this._escapeHtml(c.recordId);
        const safeId = c.recordId.replace(/'/g, "\\'");
        html += `
          <div class="relation-item relation-item-cross">
            <span class="relation-type-badge relation-type-badge-cross">跨脉络</span>
            <a class="relation-link" onclick="event.stopPropagation(); App.scrollToCard('${safeId}')">
              ${c.recordId} · ${refTitle}
            </a>
            <div class="relation-reason">
              共享「${this._escapeHtml(c.sharedTag)}」→ 也属于「${this._escapeHtml(c.otherTag)}」脉络
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  },

  // ============================================================
  // 创建单个卡片元素（第一层）
  // ============================================================
  _createCardElement(record, isNew, keyword) {
    try {
    const div = document.createElement('div');
    div.className = 'record-card' + (isNew ? ' card-slide-in highlight-new' : '');
    div.dataset.recordId = record.id;

    // 用第一个标签的颜色作为卡片主色点（标签即路线，颜色由 Store._tagColor 生成）
    const primaryTag = (record.understanding && record.understanding.tags && record.understanding.tags[0]) || '';
    const tagColor = primaryTag ? Store._tagColor(primaryTag) : 'var(--muted)';

    // 标题高亮：搜索关键词命中时加 <mark> 标签
    const titleHtml = keyword
      ? this._highlightKeyword(record.understanding.title, keyword)
      : this._escapeHtml(record.understanding.title);

    div.innerHTML = `
      <div class="record-card-header">
        <span class="record-id">${record.id}</span>
        <div class="record-card-header-right">
          <span class="record-date">${record.displayDate}</span>
          <span class="record-path-dot" style="--path-color:${tagColor};" title="${primaryTag}"></span>
        </div>
      </div>
      <div class="record-divider"></div>
      <div class="record-title">${titleHtml}</div>
      <div class="record-tags">
        ${record.understanding.tags.map(tag => {
          const tagHtml = keyword
            ? this._highlightKeyword(tag, keyword)
            : this._escapeHtml(tag);
          const tagColor = Store._tagColor(tag);
          return `<span class="record-tag" style="--tag-color:${tagColor};">${tagHtml}</span>`;
        }).join('')}
      </div>
      <div class="record-expand-hint">
        <span class="expand-hint-text">点击展开查看详情</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <!-- 第二层详情（点击展开） -->
      <div class="record-detail">
        <div class="record-detail-section">
          <div class="detail-label">理解</div>
          <div class="detail-text">${this._escapeHtml(record.understanding.summary)}</div>

          <div class="detail-expand-row">
            <button class="detail-expand-btn" onclick="Render.toggleOriginal(event)">
              <span class="expand-label">展开原文</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            ${record.rawApiResponse ? `
            <button class="detail-expand-btn" onclick="Render.toggleRawApiResponse(event)">
              <span class="expand-label">查看AI回复</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            ` : ''}
          </div>
          ${this._renderOriginal(record.originalContent)}
          ${record.rawApiResponse ? `
           <div class="record-raw-api">
            <pre>${this._escapeHtml(JSON.stringify(record.rawApiResponse, null, 2))}</pre>
          </div>
          ` : ''}

          ${record.warmResponse ? `
          <div class="detail-warm">
            <div class="detail-warm-text">${this._escapeHtml(record.warmResponse)}</div>
          </div>
          ` : ''}

          <div class="detail-actions-divider"></div>
          <div class="detail-actions">
            <button class="detail-edit-btn" onclick="Render.showEditModal('${record.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>编辑印记</span>
            </button>
            <button class="detail-delete-btn" onclick="Render.showDeleteConfirm('${record.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              <span>删除印记</span>
            </button>
          </div>

          ${this._renderRelationsBlock(record)}
        </div>
      </div>
    `;

    // 点击卡片空白处 → 展开详情
    div.addEventListener('click', function(e) {
      // 如果点击的是按钮/链接，不触发
      if (e.target.closest('button, a, .detail-expand-btn')) return;
      Render.toggleCard(this);
    });

    return div;

    } catch (err) {
      // 单卡片渲染失败：返回错误占位卡片，不影响其他卡片
      console.error('[成长印记] 单卡片渲染失败', record && record.id, err);
      const fallback = document.createElement('div');
      fallback.className = 'record-card render-error-card';
      fallback.dataset.recordId = (record && record.id) || 'unknown';
      fallback.innerHTML = '<div class="record-title">此卡片渲染出错</div>';
      return fallback;
    }
  },

  // ============================================================
  // 切换卡片详情展开
  // ============================================================
  toggleCard(cardEl) {
    const detail = cardEl.querySelector('.record-detail');
    if (!detail) return;
    const isExpanded = detail.classList.contains('expanded');

    if (isExpanded) {
      detail.classList.remove('expanded');
      cardEl.classList.remove('active');
    } else {
      // 关闭其他已展开的卡片
      document.querySelectorAll('.record-detail.expanded').forEach(d => d.classList.remove('expanded'));
      document.querySelectorAll('.record-card.active').forEach(c => c.classList.remove('active'));
      detail.classList.add('expanded');
      cardEl.classList.add('active');
    }
  },

  // ============================================================
  // 展开/收起原文
  // ============================================================
  toggleOriginal(event) {
    event.stopPropagation();
    const btn = event.currentTarget;
    const card = btn.closest('.record-card');
    if (!card) return;
    const original = card.querySelector('.record-original');
    if (!original) return;

    const isOpen = original.classList.contains('visible');
    if (isOpen) {
      original.classList.remove('visible');
      btn.classList.remove('open');
      const label = btn.querySelector('.expand-label');
      if (label) label.textContent = '展开原文';
    } else {
      original.classList.add('visible');
      btn.classList.add('open');
      const label = btn.querySelector('.expand-label');
      if (label) label.textContent = '收起原文';
    }
  },

  toggleRawApiResponse(event) {
    event.stopPropagation();
    const btn = event.currentTarget;
    const card = btn.closest('.record-card');
    if (!card) return;
    const el = card.querySelector('.record-raw-api');
    if (!el) return;

    const isOpen = el.classList.contains('visible');
    if (isOpen) {
      el.classList.remove('visible');
      btn.classList.remove('open');
      const label = btn.querySelector('.expand-label');
      if (label) label.textContent = '查看AI回复';
    } else {
      el.classList.add('visible');
      btn.classList.add('open');
      const label = btn.querySelector('.expand-label');
      if (label) label.textContent = '收起AI回复';
    }
  },

  // ============================================================
  // 显示删除确认对话框（二次确认防误删）
  // ============================================================
  showDeleteConfirm(recordId) {
    try {
    // 移除已存在的对话框（防重复）
    this.hideDeleteConfirm();

    const record = Store.getRecord(recordId);
    if (!record) return;

    const title = record.understanding ? record.understanding.title : '该印记';

    const overlay = document.createElement('div');
    overlay.className = 'delete-confirm-overlay';
    overlay.id = 'delete-confirm-overlay';
    overlay.innerHTML = `
      <div class="delete-confirm-dialog">
        <div class="delete-confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="delete-confirm-title">确认删除这条印记？</div>
        <div class="delete-confirm-text">「${this._escapeHtml(title)}」将被永久删除，时光回顾与演进路线中的相关数据也会同步更新。</div>
        <div class="delete-confirm-actions">
          <button class="delete-confirm-cancel" onclick="Render.hideDeleteConfirm()">取消</button>
          <button class="delete-confirm-ok" onclick="App.deleteRecord('${recordId}')">确认删除</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 触发淡入动画
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    // 点击遮罩层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideDeleteConfirm();
    });

    // ESC 键关闭
    this._deleteConfirmEscHandler = (e) => {
      if (e.key === 'Escape') this.hideDeleteConfirm();
    };
    document.addEventListener('keydown', this._deleteConfirmEscHandler);

    } catch (err) {
      console.error('[成长印记] showDeleteConfirm 失败', err);
    }
  },

  // ============================================================
  // 隐藏删除确认对话框
  // ============================================================
  hideDeleteConfirm() {
    const overlay = document.getElementById('delete-confirm-overlay');
    if (!overlay) return;

    // 移除 ESC 监听
    if (this._deleteConfirmEscHandler) {
      document.removeEventListener('keydown', this._deleteConfirmEscHandler);
      this._deleteConfirmEscHandler = null;
    }

    // 淡出后移除
    overlay.classList.remove('visible');
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 200);
  },

  // ============================================================
  // 从 DOM 移除卡片（带淡出动画）
  // ============================================================
  removeCardFromDOM(recordId) {
    const card = document.querySelector(`[data-record-id="${recordId}"]`);
    if (!card) return;

    card.classList.add('card-removing');
    setTimeout(() => {
      if (card.parentNode) card.parentNode.removeChild(card);
    }, 300);
  },

  // ============================================================
  // 渲染可编辑标签区域
  // ============================================================
  _renderEditableTags(recordId, tags) {
    const safeId = recordId.replace('#', '');
    const tagChips = (tags || []).map(tag => `
      <span class="tag-chip">
        ${this._escapeHtml(tag)}
        <button class="tag-chip-remove"
                onclick="event.stopPropagation(); App.removeTag('${recordId}', '${this._escapeHtml(tag).replace(/'/g, "\\'")}');"
                title="删除标签">×</button>
      </span>
    `).join('');

    const addBtn = `
      <button class="tag-add-btn"
              onclick="event.stopPropagation(); Render.showTagInput('${recordId}');"
              id="tag-add-btn-${safeId}"
              title="添加标签">
        + 添加标签
      </button>
      <div class="tag-input-wrap" id="tag-input-wrap-${safeId}" style="display:none;">
        <input type="text"
               class="tag-input"
               id="tag-input-${safeId}"
               maxlength="20"
               placeholder="输入标签，回车确认"
               onkeydown="event.stopPropagation(); Render.onTagInputKeydown(event, '${recordId}');"
               onblur="event.stopPropagation(); Render.onTagInputBlur('${recordId}');">
      </div>
    `;

    return tagChips + addBtn;
  },

  // ============================================================
  // 显示标签输入框
  // ============================================================
  showTagInput(recordId) {
    const safeId = recordId.replace('#', '');
    const btn = document.getElementById(`tag-add-btn-${safeId}`);
    const wrap = document.getElementById(`tag-input-wrap-${safeId}`);
    const input = document.getElementById(`tag-input-${safeId}`);
    if (!btn || !wrap || !input) return;

    btn.style.display = 'none';
    wrap.style.display = 'inline-flex';
    input.value = '';
    input.focus();
  },

  // ============================================================
  // 标签输入框键盘事件
  // ============================================================
  onTagInputKeydown(event, recordId) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this._submitTagInput(recordId);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this._hideTagInput(recordId);
    }
  },

  // ============================================================
  // 标签输入框失焦
  // ============================================================
  onTagInputBlur(recordId) {
    // 延迟一点，让点击按钮等交互有机会先触发
    setTimeout(() => {
      const safeId = recordId.replace('#', '');
      const input = document.getElementById(`tag-input-${safeId}`);
      if (input && document.activeElement !== input) {
        this._submitTagInput(recordId);
      }
    }, 150);
  },

  // ============================================================
  // 提交标签输入
  // ============================================================
  _submitTagInput(recordId) {
    const safeId = recordId.replace('#', '');
    const input = document.getElementById(`tag-input-${safeId}`);
    if (!input) return;

    const value = input.value.trim();
    if (value) {
      App.addTag(recordId, value);
    }
    this._hideTagInput(recordId);
  },

  // ============================================================
  // 隐藏标签输入框
  // ============================================================
  _hideTagInput(recordId) {
    const safeId = recordId.replace('#', '');
    const btn = document.getElementById(`tag-add-btn-${safeId}`);
    const wrap = document.getElementById(`tag-input-wrap-${safeId}`);
    if (btn) btn.style.display = '';
    if (wrap) wrap.style.display = 'none';
  },

  // ============================================================
  // 局部刷新卡片标签（第一层 + 详情层）
  // 注意：详情层编辑器不能整体 innerHTML 重建，否则会销毁输入框、
  // 导致 blur 链式触发卡片 click → toggleCard 折叠。改为局部更新标签 chip。
  // ============================================================
  updateCardTags(recordId, tags) {
    const safeId = recordId.replace('#', '');

    // 更新第一层标签展示
    const card = document.querySelector(`[data-record-id="${recordId}"]`);
    if (card) {
      const tagsContainer = card.querySelector('.record-tags');
      if (tagsContainer) {
        tagsContainer.innerHTML = (tags || []).map(tag => {
          const tagColor = Store._tagColor(tag);
          return `<span class="record-tag" style="--tag-color:${tagColor};">${this._escapeHtml(tag)}</span>`;
        }).join('');
      }
    }

    // 更新编辑弹窗内的标签（如果弹窗打开）
    const editTagsArea = document.getElementById(`edit-tags-${safeId}`);
    if (editTagsArea) {
      editTagsArea.innerHTML = this._renderEditableTags(recordId, tags);
    }

    // 详情层：仅更新标签 chip 部分，保留"添加标签"按钮和输入框不被销毁
    const editor = document.getElementById(`tag-editor-${safeId}`);
    if (editor) {
      // 移除旧的 tag-chip，保留 tag-add-btn 和 tag-input-wrap
      const oldChips = editor.querySelectorAll('.tag-chip');
      oldChips.forEach(chip => chip.remove());

      // 在"添加标签"按钮之前插入新的标签 chip
      const addBtn = editor.querySelector('.tag-add-btn');
      if (addBtn) {
        const chipHtml = (tags || []).map(tag => `
          <span class="tag-chip">
            ${this._escapeHtml(tag)}
            <button class="tag-chip-remove"
                    onclick="event.stopPropagation(); App.removeTag('${recordId}', '${this._escapeHtml(tag).replace(/'/g, "\\'")}');"
                    title="删除标签">×</button>
          </span>
        `).join('');
        addBtn.insertAdjacentHTML('beforebegin', chipHtml);
      }
    }
  },

  // ============================================================
  // 渲染时光回顾
  // 参数 weekInfo：{ offset, label, hasPrev, hasNext }，用于渲染翻页控件
  // ============================================================
  renderReview(container, review, weekInfo) {
    if (!container) return;

    try {
    // 完全无记录：显示空状态（无翻页控件）
    if (!review) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">暂无回顾数据</div><div class="empty-state-text">先记录一些内容，系统会在每周为你生成回顾</div></div>';
      return;
    }

    const r = review;
    // 翻页控件：左箭头往历史方向（offset+1），右箭头往本周方向（offset-1）
    const pager = weekInfo ? `
      <div class="review-pager">
        <button class="review-pager-btn" onclick="App.changeReviewWeek(1)"
                ${weekInfo.hasPrev ? '' : 'disabled'} aria-label="查看更早的一周">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="review-pager-label">
          <span class="review-pager-week">${this._escapeHtml(weekInfo.label)}</span>
          <span class="review-pager-date">${this._escapeHtml(r.timeRange.label)}</span>
        </div>
        <button class="review-pager-btn" onclick="App.changeReviewWeek(-1)"
                ${weekInfo.hasNext ? '' : 'disabled'} aria-label="查看更近的一周">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    ` : '';

    const headerTitle = (weekInfo && weekInfo.offset > 0) ? '那周你做了什么？' : '你这周做了什么？';

    // 空周
    if (r.totalRecords === 0) {
      container.innerHTML = `
        <div class="review-card review-card-enter">
          ${pager}
          <div class="review-empty-week">
            <div class="review-empty-week-icon">🗓️</div>
            <div class="review-empty-week-title">${headerTitle.replace('你做了什么？', '暂无记录')}</div>
            <div class="review-empty-week-text">这一周没有留下印记，翻看其他周吧</div>
          </div>
        </div>
      `;
      return;
    }

    // 根据对比数据确定方向 class
    let deltaClass = 'review-comparison-delta--neutral';
    if (r.comparison && r.comparison.recordsDelta) {
      if (r.comparison.recordsDelta > 0) deltaClass = 'review-comparison-delta--up';
      else if (r.comparison.recordsDelta < 0) deltaClass = 'review-comparison-delta--down';
    }

    // 区块入场辅助：依次延迟
    const blockDelay = function(idx) {
      return 'style="animation-delay:' + (0.1 + idx * 0.08) + 's"';
    };

    container.innerHTML = `
      <div class="review-card review-card-enter">
        ${pager}
        <div class="review-header">
          <div class="review-header-left">
            <h2>${headerTitle}</h2>
            <div class="review-date-range">${r.timeRange.label}</div>
          </div>
          <div class="review-stat">📝 ${r.totalRecords} 条 · 🏷️ ${r.activeTagCount} 个标签</div>
        </div>

        <!-- 温暖回应 -->
        ${r.warmResponse ? `
        <div class="review-warm-section review-block-enter" ${blockDelay(0)}>
          <div class="review-warm-quote">${this._escapeHtml(r.warmResponse).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        <!-- 高光时刻 -->
        <div class="review-block review-block-enter" ${blockDelay(1)}>
          <div class="review-block-title"><span class="review-block-title-icon">⭐</span>高光时刻</div>
          ${r.highlights.length > 0 ? r.highlights.map((h, i) => `
          <div class="review-highlight-item" data-record-id="${h.recordId}">
            <span class="review-highlight-index">${i + 1}</span>
            <div class="review-highlight-content" onclick="Render.showCardModal('${this._escapeAttr(h.recordId)}')">
              <div class="review-highlight-title">${this._escapeHtml(h.title)}</div>
              <div class="review-highlight-summary">${this._escapeHtml(h.summary)}</div>
            </div>
            <button class="review-highlight-view-btn" onclick="event.stopPropagation(); Render.showCardModal('${this._escapeAttr(h.recordId)}')" title="查看完整卡片" aria-label="查看完整卡片">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          `).join('') : '<div style="color:var(--muted);font-size:0.88rem;padding:4px 0;">本周暂无高光时刻，继续记录吧</div>'}
        </div>

        <!-- 对比上周 -->
        ${r.comparison ? `
        <div class="review-comparison review-block-enter" ${blockDelay(2)}>
          <div class="review-comparison-icon">📊</div>
          <span class="review-comparison-text">${this._escapeHtml(r.comparison.highlightsText || '暂无对比数据')}</span>
          <span class="review-comparison-delta ${deltaClass}">${r.comparison.recordsDelta > 0 ? '↑' : r.comparison.recordsDelta < 0 ? '↓' : '→'}</span>
        </div>
        ` : ''}

        <!-- 趋势分析 -->
        ${r.trend ? this._renderTrendSection(r.trend, 3) : ''}

        <!-- 个性化建议 -->
        ${r.suggestions && r.suggestions.length > 0 ? this._renderSuggestionsSection(r.suggestions, 4) : ''}

        ${r.suggestions && r.suggestions.length > 0 ? '<div class="review-block-divider">· · ·</div>' : ''}

        <!-- 持续深耕 -->
        ${r.tagProgress && r.tagProgress.length > 0 ? `
        <div class="review-block review-block-enter" ${blockDelay(5)}>
          <div class="review-block-title"><span class="review-block-title-icon">🌱</span>持续深耕</div>
          ${r.tagProgress.map(p => `
          <div class="review-path-item">
            <span class="review-path-dot" style="--path-color:${p.color};"></span>
            <span class="review-path-name">${p.tag}</span>
            <span class="review-path-count">新增 <strong style="color:var(--green-dark);">${p.newCount}</strong> 个节点（共 ${p.totalCount} 个）</span>
          </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    `;

    } catch (err) {
      console.error('[成长印记] renderReview 渲染失败', err);
      container.innerHTML = '<div class="render-error">时光回顾渲染出错，请刷新页面重试</div>';
    }
  },

  // ============================================================
  // 渲染趋势分析板块（记录数柱状图 + 标签活跃度）
  // ============================================================
  _renderTrendSection(trend, blockIndex) {
    const { recordTrend, tagTrends, sufficientData } = trend;
    const { weeks, direction, maxCount } = recordTrend;

    if (!weeks || weeks.length === 0) return '';

    const delay = blockIndex !== undefined ? 'style="animation-delay:' + (0.1 + blockIndex * 0.08) + 's"' : '';

    const barsHtml = weeks.map(w => {
      const heightPercent = maxCount > 0 ? Math.max(4, (w.count / maxCount) * 100) : 4;
      const isCurrentWeek = w.offset === 0;
      return `
        <div class="trend-bar-col">
          <div class="trend-bar-value">${w.count}</div>
          <div class="trend-bar-track">
            <div class="trend-bar-fill ${isCurrentWeek ? 'trend-bar-current' : ''}"
                 style="height:${heightPercent}%"></div>
          </div>
          <div class="trend-bar-label">${this._escapeHtml(w.label)}</div>
        </div>
      `;
    }).join('');

    let directionHtml = '';
    if (sufficientData && direction) {
      const directionMap = {
        up: { icon: '&#8599;', text: '记录节奏在加快', cls: 'trend-dir-up' },
        down: { icon: '&#8600;', text: '记录节奏在放缓', cls: 'trend-dir-down' },
        stable: { icon: '&#8594;', text: '记录节奏稳定', cls: 'trend-dir-stable' }
      };
      const d = directionMap[direction];
      directionHtml = '<div class="trend-direction ' + d.cls + '"><span class="trend-direction-indicator">' + d.icon + '</span> ' + d.text + '</div>';
    } else if (weeks.length < 3) {
      directionHtml = '<div class="trend-direction trend-dir-insufficient">数据积累中，坚持记录后即可看到趋势变化</div>';
    }

    let tagTrendsHtml = '';
    if (sufficientData && tagTrends.length > 0) {
      const tagMaxCount = Math.max(1, ...tagTrends.flatMap(t => t.counts));
      const tagRows = tagTrends.map(tt => {
        const bars = tt.counts.map(c => {
          const widthPercent = Math.max(4, (c / tagMaxCount) * 100);
          return '<div class="trend-tag-bar" style="width:' + widthPercent + '%;background:' + tt.color + '"></div>';
        }).join('');
        return `
          <div class="trend-tag-row">
            <span class="trend-tag-name" style="color:${tt.color}">${this._escapeHtml(tt.tag)}</span>
            <div class="trend-tag-bars">${bars}</div>
          </div>
        `;
      }).join('');
      tagTrendsHtml = `
        <div class="trend-tag-section">
          <div class="trend-tag-title">标签活跃度</div>
          ${tagRows}
        </div>
      `;
    }

    return `
      <div class="review-block review-block-enter" ${delay}>
        <div class="review-block-title"><span class="review-block-title-icon">📈</span>趋势分析</div>
        <div class="trend-chart-area">
          <div class="trend-bars-row">${barsHtml}</div>
          ${directionHtml}
        </div>
        ${tagTrendsHtml}
      </div>
    `;
  },

  // ============================================================
  // 渲染个性化建议板块
  // ============================================================
  _renderSuggestionsSection(suggestions, blockIndex) {
    const iconMap = {
      consistency: '&#128197;',
      review: '&#128218;',
      reactivate: '&#128293;',
      diversify: '&#127912;',
      challenge: '&#127942;'
    };

    const delay = blockIndex !== undefined ? 'style="animation-delay:' + (0.1 + blockIndex * 0.08) + 's"' : '';

    const items = suggestions.map(s => `
      <div class="suggestion-item">
        <span class="suggestion-icon" data-type="${s.type}">${iconMap[s.type] || '&#128161;'}</span>
        <span class="suggestion-text">${this._escapeHtml(s.text)}</span>
      </div>
    `).join('');

    return `
      <div class="review-suggestions-section review-block-enter" ${delay}>
        <div class="suggestions-title">${(() => { const titles = ['给你的小建议', '来自时光的一些建议', '这周的成长贴士', '给你的温柔提醒']; return titles[Math.floor(Math.random() * titles.length)]; })()}</div>
        ${items}
      </div>
    `;
  },

  // ============================================================
  // 渲染标签 Tab（演进路线视图切换）
  // 参数：tabsContainer = #routes-tabs 元素
  //       tagsInfo = [{ tag, count }]，按使用频次降序
  //       activeTag = 当前选中的标签
  //       showAll = 是否展示全部标签（展开状态）
  // 展开按钮在 wrapper (.routes-tabs-wrap) 内、.routes-tabs 外，用 absolute
  // 锚定 wrapper，不随标签横向滚动
  // ============================================================
  renderTagTabs(tabsContainer, tagsInfo, activeTag, showAll) {
    if (!tabsContainer) return;
    try {
    if (!tagsInfo || tagsInfo.length === 0) {
      tabsContainer.innerHTML = '';
      const wrap = tabsContainer.closest('.routes-tabs-wrap');
      if (wrap) {
        const btn = wrap.querySelector('.route-tab-expand');
        if (btn) btn.remove();
      }
      return;
    }

    // 确保外层有 routes-tabs-wrap（position: relative 锚点）
    let wrap = tabsContainer.closest('.routes-tabs-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'routes-tabs-wrap';
      tabsContainer.parentNode.insertBefore(wrap, tabsContainer);
      wrap.appendChild(tabsContainer);
    }

    // 展开时展示全部，收起时只展示高频前 8 个
    const displayTags = showAll ? tagsInfo : tagsInfo.slice(0, 8);
    const hasMore = tagsInfo.length > 8;

    tabsContainer.className = 'routes-tabs' + (showAll ? ' expanded' : '');
    tabsContainer.innerHTML = displayTags.map(({ tag, count }) => {
      const color = Store._tagColor(tag);
      return `
        <button class="route-tab ${tag === activeTag ? 'active' : ''}"
                data-tag="${this._escapeHtml(tag)}"
                style="--path-color:${color};"
                onclick="App.switchTag('${this._escapeAttr(tag)}')">
          <span class="route-tab-dot"></span>
          ${this._escapeHtml(tag)}
          <span class="route-tab-count">${count}</span>
        </button>
      `;
    }).join('');

    // 展开/收起按钮（挂到 wrap，absolute 锚定 wrapper，不随标签滚动）
    const existingBtn = wrap.querySelector(':scope > .route-tab-expand');
    if (hasMore) {
      const btnHtml = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${showAll
            ? '<polyline points="18 15 12 9 6 15"/>'
            : '<polyline points="6 9 12 15 18 9"/>'
          }
        </svg>
        ${showAll ? '收起' : `${tagsInfo.length}`}
      `;
      if (existingBtn) {
        existingBtn.innerHTML = btnHtml;
        existingBtn.title = showAll ? '收起' : '展开全部标签';
      } else {
        const btn = document.createElement('button');
        btn.className = 'route-tab-expand';
        btn.innerHTML = btnHtml;
        btn.title = showAll ? '收起' : '展开全部标签';
        btn.onclick = () => App.toggleRoutesTabs();
        wrap.appendChild(btn);
      }
    } else if (existingBtn) {
      existingBtn.remove();
    }

    } catch (err) {
      console.error('[成长印记] renderTagTabs 渲染失败', err);
      tabsContainer.innerHTML = '<span class="render-error">标签渲染出错</span>';
    }
  },

  // ============================================================
  // 渲染标签演进时间轴（双栏布局：左侧时间刻度 + 右侧节点卡片）
  // 参数：tag = 标签名，records = 该标签下的记录（按时间正序）
  // ============================================================
  renderTagChain(container, tag, records) {
    if (!container) return;
    try {
    if (!tag || !records || records.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛤️</div><div class="empty-state-title">暂无标签数据</div><div class="empty-state-text">记录更多内容，演进路线会自动生长</div></div>';
      return;
    }

    const color = Store._tagColor(tag);
    const sorted = [...records].sort((a, b) => a.createdAt - b.createdAt);
    const totalRecords = sorted.length;
    const idSet = new Set(sorted.map(s => s.id));

    // 阶段描述
    let stageDesc = '';
    if (totalRecords === 1) {
      stageDesc = '这条脉络刚刚开始，记录更多内容，演进会更加完整';
    } else if (totalRecords <= 3) {
      stageDesc = '脉络正在成形，继续记录，演进会更加完整';
    } else {
      stageDesc = `从起点到现在的完整演进，共 ${totalRecords} 个节点`;
    }

    // 统计关联段落数
    let linkedCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      const hasUpstreamInChain = (sorted[i].relations && sorted[i].relations.upstream || [])
        .some(u => idSet.has(u.recordId));
      if (hasUpstreamInChain) linkedCount++;
    }

    // 时间格式化
    const fmt = (ts) => {
      const d = new Date(ts);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        weekday: ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()],
        clock: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      };
    };

    // 里程碑图标配置
    const MS = {
      first_step: {
        cls: 'tl-milestone-badge-first',
        svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12c-3 0-6-2-6-6 3 0 6 2 6 6z"/><path d="M12 12c3 0 6-2 6-6-3 0-6 2-6 6z"/></svg>'
      },
      breakthrough: {
        cls: 'tl-milestone-badge-breakthrough',
        svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
      },
      cross_node: {
        cls: 'tl-milestone-badge-cross',
        svg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>'
      }
    };

    // 预构建所有节点与连接器 HTML
    const nodesHtml = [];
    const connectorsHtml = [];

    for (let idx = 0; idx < sorted.length; idx++) {
      const record = sorted[idx];
      const t = fmt(record.createdAt);
      const milestone = record.milestone && MS[record.milestone] ? record.milestone : null;
      const mc = milestone ? MS[milestone] : null;

      const otherTags = ((record.understanding && record.understanding.tags) || [])
        .filter(tg => tg !== tag);

      const upstreamInChain = (record.relations && record.relations.upstream || [])
        .filter(u => idSet.has(u.recordId));

      nodesHtml.push(`
        <div class="tl-node" data-record-id="${record.id}">
          <div class="tl-time">
            <div class="tl-time-date">${t.date}</div>
            <div class="tl-time-week">${t.weekday}</div>
            <div class="tl-time-clock">${t.clock}</div>
          </div>
          <div class="tl-mid">
            <div class="tl-dot${milestone ? ' tl-dot-milestone' : ''}"></div>
          </div>
          <div class="tl-card${milestone ? ' tl-card-milestone' : ''}${idx === sorted.length - 1 ? ' tl-card-latest' : ''}" onclick="Render.showCardModal('${this._escapeAttr(record.id)}')">
            ${mc ? `<div class="tl-milestone-badge ${mc.cls}">${mc.svg}</div>` : ''}
            <div class="tl-card-meta">
              <span class="tl-card-id">${record.id}</span>
            </div>
            <div class="tl-card-title">${this._escapeHtml(record.understanding.title)}</div>
            <div class="tl-card-tags">
              ${upstreamInChain.map(u => {
                const tl = (typeof RELATION_TYPE_LABELS !== 'undefined' && RELATION_TYPE_LABELS[u.type]) || '关联';
                return `<span class="tl-card-tag tl-card-tag-upstream">承接 ${this._escapeHtml(u.recordId)} ${this._escapeHtml(tl)}</span>`;
              }).join('')}
              ${otherTags.map(ot => {
                return `<span class="tl-card-tag tl-card-tag-cross" onclick="event.stopPropagation(); App.switchTag('${this._escapeAttr(ot)}')">↗ ${this._escapeHtml(ot)}</span>`;
              }).join('')}
            </div>
            <div class="tl-card-actions">
              <button class="tl-card-view" onclick="event.stopPropagation(); Render.showCardModal('${this._escapeAttr(record.id)}')" style="--path-color:${color};" title="查看完整卡片" aria-label="查看完整卡片">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                查看卡片
              </button>
            </div>
          </div>
        </div>
      `);

      // 连接器（非最后一个节点）
      if (idx < sorted.length - 1) {
        const nextRecord = sorted[idx + 1];
        const relationToNext = (nextRecord.relations && nextRecord.relations.upstream || [])
          .find(u => u.recordId === record.id);
        if (relationToNext) {
          const tl = (typeof RELATION_TYPE_LABELS !== 'undefined' && RELATION_TYPE_LABELS[relationToNext.type]) || '关联';
          connectorsHtml.push(`
            <div class="tl-line-ext">
              <div></div>
              <div></div>
              <div><span class="tl-line-label" title="${this._escapeHtml(relationToNext.reason || '')}">${this._escapeHtml(tl)}</span></div>
            </div>
          `);
        } else {
          connectorsHtml.push(`
            <div class="tl-line-ext">
              <div></div>
              <div></div>
              <div><span class="tl-line-label tl-line-label-weak">○</span></div>
            </div>
          `);
        }
      }
    }

    // 交错拼接节点与连接器
    let chainHtml = '';
    for (let i = 0; i < nodesHtml.length; i++) {
      chainHtml += nodesHtml[i];
      if (i < connectorsHtml.length) {
        chainHtml += connectorsHtml[i];
      }
    }

    // 关联脉络数据（跨标签连接）
    const relatedTags = Store.getRelatedTags(tag);

    container.innerHTML = `
      <div class="tl-header">
        <div class="tl-header-title">
          <span class="tl-header-swatch" style="--path-color:${color};"></span>
          ${this._escapeHtml(tag)}
        </div>
        <div class="tl-header-meta">${totalRecords} 个节点${linkedCount > 0 ? ` · ${linkedCount} 段前后关联` : ''}</div>
      </div>
      ${relatedTags.length > 0 ? `
      <div class="tl-rel">
        <span class="tl-rel-label">关联脉络</span>
        <div class="tl-rel-tags">
          ${relatedTags.slice(0, 8).map(rt => {
            const rc = Store._tagColor(rt.tag);
            return `<button class="tl-rel-tag" onclick="App.switchTag('${this._escapeAttr(rt.tag)}')" style="--rel-color:${rc};">
              <span class="tl-rel-dot" style="background:${rc};"></span>
              ${this._escapeHtml(rt.tag)}
              <span class="tl-rel-count">${rt.count}</span>
            </button>`;
          }).join('')}
        </div>
      </div>
      ` : ''}
      <div class="tl-chain" id="route-chain" style="--path-color:${color};">
        ${chainHtml}
      </div>
      <div class="tl-stage" style="--path-color:${color};">
        ${stageDesc}
      </div>
    `;

    // 滚动触发动画：使用 IntersectionObserver 实现视口可见时播放
    const startAnimation = (chain) => {
      const nodes = chain.querySelectorAll('.tl-node');
      const exts = chain.querySelectorAll('.tl-line-ext');
      // 触发时间轴竖线绘制
      requestAnimationFrame(() => { chain.classList.add('tl-chain-drawn'); });
      // 节点依次点亮
      nodes.forEach((node, idx) => {
        setTimeout(() => {
          node.classList.add('tl-node-visible');
          if (idx < exts.length) {
            setTimeout(() => { exts[idx].classList.add('tl-line-ext-visible'); }, 250);
          }
        }, 100 + idx * 200);
      });
    };

    const chainEl = container.querySelector('#route-chain');
    if (chainEl) {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              startAnimation(entry.target);
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });
        observer.observe(chainEl);
      } else {
        // 降级：直接播放
        startAnimation(chainEl);
      }
    }

    } catch (err) {
      console.error('[成长印记] renderTagChain 渲染失败', err);
      container.innerHTML = '<div class="render-error">演进路线渲染出错，请刷新页面重试</div>';
    }
  },

  // ============================================================
  // 显示成长卡片弹窗
  // 在时光回顾 / 脉络演进中查看对应的完整成长卡片
  // ============================================================
  showCardModal(recordId) {
    // 防止重复打开
    if (document.querySelector('.card-modal-overlay')) return;

    const record = Store.getRecord(recordId);
    if (!record) return;

    const overlay = document.createElement('div');
    overlay.className = 'card-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'card-modal';

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-modal-close';
    closeBtn.setAttribute('aria-label', '关闭卡片');
    closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideCardModal();
    });

    // 内容区
    const body = document.createElement('div');
    body.className = 'card-modal-body';

    // 复用首页卡片的创建逻辑，生成完整卡片 DOM
    const card = this._createCardElement(record, false, null);
    card.style.animationDelay = '0s';
    body.appendChild(card);

    // 默认展开卡片详情
    this.toggleCard(card);

    modal.appendChild(closeBtn);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 锁定背景滚动
    document.body.style.overflow = 'hidden';

    // ESC 关闭
    this._cardModalKeydown = (e) => {
      if (e.key === 'Escape') this.hideCardModal();
    };
    document.addEventListener('keydown', this._cardModalKeydown);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideCardModal();
    });

    // 入场动画
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      modal.classList.add('visible');
    });
  },

  // ============================================================
  // 关闭成长卡片弹窗
  // ============================================================
  hideCardModal() {
    // 恢复背景滚动
    document.body.style.overflow = '';

    document.removeEventListener('keydown', this._cardModalKeydown);
    this._cardModalKeydown = null;

    const overlay = document.querySelector('.card-modal-overlay');
    if (!overlay) return;

    overlay.classList.remove('visible');
    const modal = overlay.querySelector('.card-modal');
    if (modal) modal.classList.remove('visible');

    // 动画结束后移除 DOM
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 300);
  },

  // ============================================================
  // 更新按钮加载状态
  // ============================================================
  setButtonLoading(isLoading) {
    const btn = document.getElementById('capture-btn');
    if (!btn) return;
    const LOADING_PHRASES = [
      '在为你梳理思路…',
      '正在倾听你的成长…',
      '帮你记录每一步…',
      '让我慢慢理解你…',
      '整理你的思考中…',
      '为你提炼要点…'
    ];
    if (isLoading) {
      btn.classList.add('loading');
      const phrase = LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 0.8s linear infinite;">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3"/>
          <path d="M12 3a9 9 0 019 9"/>
        </svg>
        ${phrase}
      `;
    } else {
      btn.classList.remove('loading');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
        提交记录
      `;
    }
  },

  // ============================================================
  // 检测内容类型：代码 / 表格 / 纯文本
  // ============================================================
  _detectContentType(text) {
    if (!text) return 'text';
    // Markdown 代码块标记
    if (/```/.test(text)) return 'code';
    // Markdown 表格语法（含分隔行）
    if (/\|.*\|.*\n\|[\s-:]+\|/.test(text)) return 'table';
    // 编程语言特征关键词 + 多行内容
    var codePatterns = /function\s|const\s|let\s|var\s|class\s|import\s|def\s|return\s|=>\s*\{|;\s*$|public\s|private\s/m;
    if (codePatterns.test(text) && text.split('\n').length > 2) return 'code';
    return 'text';
  },

  // ============================================================
  // 渲染原文展示区（带格式类型标签）
  // ============================================================
  _renderOriginal(content) {
    var type = this._detectContentType(content);
    var escaped = this._escapeHtml(content.trim());
    return `
      <div class="record-original record-original-${type}">
        <div class="original-content">${escaped}</div>
      </div>
    `;
  },

  // ============================================================
  // 工具：HTML 转义
  // ============================================================
  _escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // ============================================================
  // 工具：属性转义（用于 onclick 参数中的单引号转义）
  // ============================================================
  _escapeAttr(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
  },

  // ============================================================
  // 工具：关键词高亮
  // 先转义 HTML，再用 <mark> 包裹匹配的关键词（不区分大小写）
  // ============================================================
  _highlightKeyword(text, keyword) {
    if (!text || !keyword) return this._escapeHtml(text);
    const escaped = this._escapeHtml(text);
    // 转义正则特殊字符，避免关键词含特殊符号时出错
    const kw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${kw})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  // ============================================================
  // 显示编辑弹窗
  // ============================================================
  showEditModal(recordId) {
    if (document.querySelector('.edit-modal-overlay')) return;

    const record = Store.getRecord(recordId);
    if (!record) return;

    const safeId = recordId.replace('#', '');
    const tags = (record.understanding && record.understanding.tags) || [];

    const overlay = document.createElement('div');
    overlay.className = 'edit-modal-overlay';
    overlay.innerHTML = `
      <div class="edit-modal">
        <div class="edit-modal-header">
          <h3 class="edit-modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            编辑印记
          </h3>
          <button class="edit-modal-close" onclick="Render.hideEditModal()" aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="edit-modal-body">
          <div class="edit-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>修改原文将自动重新理解内容，生成新的标题、摘要和标签。手动编辑的内容会优先保留。</span>
          </div>
          <div class="edit-form-group">
            <label class="edit-form-label">原始内容</label>
            <textarea class="edit-form-textarea" id="edit-original-${safeId}" rows="5">${this._escapeHtml(record.originalContent)}</textarea>
          </div>
          <div class="edit-form-row">
            <div class="edit-form-group" style="flex:1;">
              <label class="edit-form-label">标题</label>
              <input type="text" class="edit-form-input" id="edit-title-${safeId}" value="${this._escapeHtml(record.understanding.title)}" maxlength="50">
            </div>
          </div>
          <div class="edit-form-group">
            <label class="edit-form-label">摘要</label>
            <textarea class="edit-form-textarea" id="edit-summary-${safeId}" rows="3">${this._escapeHtml(record.understanding.summary)}</textarea>
          </div>
          <div class="edit-form-group">
            <label class="edit-form-label">标签 <span class="edit-form-hint">（可在卡片详情中管理）</span></label>
            <div class="edit-tags-area" id="edit-tags-${safeId}">
              ${this._renderEditableTags(recordId, tags)}
            </div>
          </div>
        </div>
        <div class="edit-modal-footer">
          <button class="edit-btn edit-btn-cancel" onclick="Render.hideEditModal()">取消</button>
          <button class="edit-btn edit-btn-save" id="edit-save-btn-${safeId}" onclick="App.saveEdit('${recordId}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            保存修改
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // ESC 关闭
    this._editModalKeydown = (e) => {
      if (e.key === 'Escape') this.hideEditModal();
    };
    document.addEventListener('keydown', this._editModalKeydown);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideEditModal();
    });

    // 入场动画
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });
  },

  // ============================================================
  // 关闭编辑弹窗
  // ============================================================
  hideEditModal() {
    document.removeEventListener('keydown', this._editModalKeydown);
    this._editModalKeydown = null;

    const overlay = document.querySelector('.edit-modal-overlay');
    if (!overlay) return;

    overlay.classList.remove('visible');
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 200);
  },

  // ============================================================
  // 读取编辑表单数据
  // ============================================================
  getEditFormData(recordId) {
    const safeId = recordId.replace('#', '');
    const originalEl = document.getElementById(`edit-original-${safeId}`);
    const titleEl = document.getElementById(`edit-title-${safeId}`);
    const summaryEl = document.getElementById(`edit-summary-${safeId}`);
    if (!originalEl || !titleEl || !summaryEl) return null;

    return {
      originalContent: originalEl.value,
      title: titleEl.value.trim(),
      summary: summaryEl.value.trim()
    };
  },

  // ============================================================
  // 设置编辑保存按钮加载状态
  // ============================================================
  setEditButtonLoading(recordId, isLoading) {
    const safeId = recordId.replace('#', '');
    const btn = document.getElementById(`edit-save-btn-${safeId}`);
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 0.8s linear infinite;">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3"/>
          <path d="M12 3a9 9 0 019 9"/>
        </svg>
        处理中…
      `;
    } else {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        保存修改
      `;
    }
  },

  // ============================================================
  // 思考步骤打字动画
  // 在按钮内逐字展示 AI 处理步骤，提升感知智能度
  // 返回 { done: function → Promise, cancel: function }
  // ============================================================
  startThinkingSteps(btn) {
    if (!btn) return { done() { return Promise.resolve(); }, cancel() {} };

    var STEP_SETS = [
       ['倾听你的记录', '抓住重点', '发现连接', '见证进步', '印记生成'],
       ['理解你的思考', '提炼核心', '寻找脉络', '发现突破', '记录完成'],
       ['感受你的成长', '发现闪光点', '串联轨迹', '记录时刻', '成长存档']
    ];
    var WAITING_PHRASES = [
      '正在为你仔细梳理…',
      '让我再想想…',
      '整理中，请稍候…',
      '这个想法很特别，我在深入理解…',
      '正在帮你串联成长线索…',
      '细细品味你的记录…'
    ];
    var STEPS = STEP_SETS[Math.floor(Math.random() * STEP_SETS.length)];
    var alive = true;
    var timers = [];
    var stepIdx = 0;

    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 0.8s linear infinite;">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3"/>' +
        '<path d="M12 3a9 9 0 019 9"/>' +
      '</svg>' +
      '<span class="thinking-step"></span>';

    var stepEl = btn.querySelector('.thinking-step');
    if (!stepEl) return { done() { return Promise.resolve(); }, cancel() {} };

    function clearTimers() {
      timers.forEach(function(t) { clearTimeout(t); });
      timers = [];
    }

    function typeText(text, callback) {
      if (!alive) return;
      var ci = 0;

      stepEl.removeAttribute('data-state');

      function typeNext() {
        if (!alive) return;
        stepEl.textContent = text.slice(0, ci + 1);
        ci++;
        if (ci < text.length) {
          timers.push(setTimeout(typeNext, 55 + Math.random() * 30));
        } else {
          if (callback) callback();
        }
      }

      typeNext();
    }

    function typeStep() {
      if (!alive) return;
      var text = STEPS[stepIdx];
      var fullText = stepIdx < 4 ? text + '…' : text + ' ✓';

      typeText(fullText, function() {
        if (!alive) return;
        if (stepIdx < 3) {
          timers.push(setTimeout(function() { stepIdx++; typeStep(); }, 400));
        } else {
          stepEl.dataset.state = 'done';
          timers.push(setTimeout(startWaitingLoop, 800));
        }
      });
    }

    function startWaitingLoop() {
      if (!alive) return;
      var waitIdx = 0;

      function loop() {
        if (!alive) return;
        var phrase = WAITING_PHRASES[waitIdx];
        waitIdx = (waitIdx + 1) % WAITING_PHRASES.length;

        typeText(phrase, function() {
          if (!alive) return;
          timers.push(setTimeout(loop, 2000));
        });
      }

      loop();
    }

    typeStep();

    return {
      done: function() {
        alive = false;
        clearTimers();
        var completeTexts = ['印记生成 ✓', '记录完成 ✓', '成长已存档 ✓'];
        var completeText = completeTexts[Math.floor(Math.random() * completeTexts.length)];
        stepEl.textContent = completeText;
        stepEl.dataset.state = 'done';
        return new Promise(function(resolve) { setTimeout(resolve, 300); });
      },
      cancel: function() {
        alive = false;
        clearTimers();
      }
    };
  }
};

// ============================================================
// CSS: 旋转动画（按钮加载状态）
// ============================================================
(function injectLoadingStyle() {
  if (document.getElementById('loading-style')) return;
  const style = document.createElement('style');
  style.id = 'loading-style';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .thinking-step {
      display: inline-block;
    }
    .thinking-step::after {
      content: '|';
      animation: think-blink 0.7s steps(1) infinite;
      opacity: 0.6;
      margin-left: 1px;
      color: currentColor;
    }
    .thinking-step[data-state="done"]::after {
      content: none;
    }
    @keyframes think-blink {
      50% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();
