/**
 * 成长印记 · 主控制器（app.js）
 * 负责初始化、事件绑定、视图切换，是整个 Demo 的入口
 */

'use strict';

// ============================================================
// App 主控制器
// ============================================================
const App = {
  // 当前选中的标签（演进脉络视图，默认使用频次最高的标签）
  currentTag: null,
  // 标签栏展开状态
  _routesTabsExpanded: false,

  // 搜索与筛选状态
  filterState: {
    keyword: '',
    tags: []       // 选中的标签列表（类型已合并到标签中）
  },

  // ============================================================
  // 初始化
  // ============================================================
  init() {
    try {
      // 0. 初始化 AI 服务（加载配置）
      AIService.init();

      // 1. 初始化 Store（加载预置数据）
      Store.init();

      // 1.5 重建所有记录的关联关系（确保预置数据有完整关联）
      Store.rebuildAllRelations();

      // 2. 设置默认标签（演进脉络视图默认选中使用频次最高的标签）
      const tagsInfo = Store.getAllTags();
      this.currentTag = tagsInfo.length > 0 ? tagsInfo[0].tag : null;

      // 3. 订阅 Store 变化（渲染层自动更新）
      Store.subscribe((state, hint) => {
        this._onStoreChange(state, hint);
      });

      // 4. 渲染初始视图
      this._renderAll();

      // 5. 渲染筛选器
      this._renderFilterChips();

      // 6. 绑定全局事件
      this._bindEvents();

      // 7. 触发动画（IntersectionObserver）
      // 新用户：先启动引导，完成后再触发动画（避免引导期间 fade-in 提前显示）
      // 老用户：直接触发动画
      const isNewUser = !localStorage.getItem('growthmark_onboarding_done');
      if (isNewUser) {
        Onboarding.startIfNew(() => { this._initAnimations(); });
      } else {
        this._initAnimations();
      }

      console.log('[成长印记] Demo 已就绪', {
        records: Store.records.length,
        tags: Store.getAllTags().length,
        review: !!Store.review
      });

    } catch (err) {
      console.error('[成长印记] 初始化失败', err);
    }
  },

  // ============================================================
  // 渲染所有视图
  // ============================================================
  _renderAll() {
    const state = Store.state;

    // 首页：卡片列表（使用搜索筛选结果）
    this._renderCardsWithFilter();

    // 时光回顾
    const reviewContainer = document.getElementById('review-container');
    if (reviewContainer) {
      Render.renderReview(reviewContainer, state.review, Store.getReviewWeekInfo());
    }

    // 演进脉络（按标签聚合的时间轴）
    this._renderRoutesView();
  },

  // ============================================================
  // 渲染演进脉络视图（标签 Tab + 标签时间轴）
  // 供 _renderAll / _onStoreChange / switchView 复用，避免重复代码
  // ============================================================
  _renderRoutesView() {
    const routesTabs = document.getElementById('routes-tabs');
    const routeContent = document.getElementById('route-content');
    if (!routesTabs || !routeContent) return;
    const tagsInfo = Store.getAllTags();
    // 若当前选中标签已不存在（被删除或初始为空），回退到频次最高的标签
    if (!this.currentTag || !tagsInfo.some(t => t.tag === this.currentTag)) {
      this.currentTag = tagsInfo.length > 0 ? tagsInfo[0].tag : null;
    }
    Render.renderTagTabs(routesTabs, tagsInfo, this.currentTag, this._routesTabsExpanded);
    if (this.currentTag) {
      const tagRecords = Store.getRecordsByTag(this.currentTag);
      Render.renderTagChain(routeContent, this.currentTag, tagRecords);
    } else {
      Render.renderTagChain(routeContent, null, []);
    }
  },

  // ============================================================
  // 渲染筛选器 chip 按钮（标签）
  // 注：类型已合并到标签中，主分类(工作/学习/项目/情绪/成长)作为第一个标签附加
  // ============================================================
  _renderFilterChips() {
    // 标签筛选（展示前 15 个，避免区域过长）
    const tagContainer = document.getElementById('filter-tag-chips');
    if (tagContainer) {
      const tags = Store.getAllTags();
      const displayTags = tags.slice(0, 15);
      tagContainer.innerHTML = displayTags.map(({ tag, count }) => `
        <button class="filter-chip ${this.filterState.tags.includes(tag) ? 'active' : ''}"
                onclick="App.toggleFilter('tags', '${this._escapeAttr(tag)}')">
          ${this._escapeHtml(tag)}<span class="filter-chip-count">${count}</span>
        </button>
      `).join('');
    }
  },

  // ============================================================
  // 切换筛选条件（多选 toggle）
  // ============================================================
  toggleFilter(category, value) {
    const list = this.filterState[category];
    const idx = list.indexOf(value);
    if (idx === -1) {
      list.push(value);
    } else {
      list.splice(idx, 1);
    }
    this._renderFilterChips();
    this._renderCardsWithFilter();
  },

  // ============================================================
  // 搜索输入处理（实时搜索）
  // ============================================================
  onSearchInput(value) {
    this.filterState.keyword = value;
    const clearBtn = document.getElementById('filter-search-clear');
    if (clearBtn) clearBtn.style.display = value ? 'flex' : 'none';
    this._renderCardsWithFilter();
  },

  // ============================================================
  // 清空搜索关键词
  // ============================================================
  clearSearch() {
    this.filterState.keyword = '';
    const input = document.getElementById('filter-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('filter-search-clear');
    if (clearBtn) clearBtn.style.display = 'none';
    this._renderCardsWithFilter();
  },

  // ============================================================
  // 清空所有筛选条件
  // ============================================================
  clearAllFilters() {
    this.filterState = { keyword: '', tags: [] };
    const input = document.getElementById('filter-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('filter-search-clear');
    if (clearBtn) clearBtn.style.display = 'none';
    this._renderFilterChips();
    this._renderCardsWithFilter();
  },

  // ============================================================
  // 判断当前是否有任何筛选条件激活
  // ============================================================
  _hasActiveFilter() {
    return this.filterState.keyword.trim() !== '' ||
           this.filterState.tags.length > 0;
  },

  // ============================================================
  // 根据筛选条件渲染卡片列表
  // 参数：highlightId - 可选，新增记录的高亮 ID
  // ============================================================
  _renderCardsWithFilter(highlightId) {
    const cardsGrid = document.getElementById('cards-grid');
    const emptyState = document.getElementById('filter-empty');
    const statsRow = document.getElementById('filter-stats-row');
    const statsText = document.getElementById('filter-stats-text');

    if (!cardsGrid) return;

    const hasFilter = this._hasActiveFilter();
    const totalCount = Store.records.length;

    // 有筛选条件时使用 searchRecords，否则展示全部（最新在前）
    let records;
    if (hasFilter) {
      records = Store.searchRecords(this.filterState);
    } else {
      records = [...Store.records].reverse();
    }

    // 渲染卡片（传入关键词用于高亮、highlightId 用于新卡片动画）
    Render.renderCards(cardsGrid, records, highlightId || null, this.filterState.keyword);

    // 显示筛选统计
    if (hasFilter) {
      if (statsRow) statsRow.style.display = 'flex';
      if (statsText) statsText.textContent = `共 ${totalCount} 条记录 · 筛选出 ${records.length} 条`;
    } else {
      if (statsRow) statsRow.style.display = 'none';
    }

    // 无结果时显示空状态
    if (emptyState) {
      emptyState.style.display = records.length === 0 ? 'block' : 'none';
      cardsGrid.style.display = records.length === 0 ? 'none' : 'grid';
    }
  },

  // ============================================================
  // 工具：HTML 转义（用于筛选器 chip 内容）
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
  // Store 变化回调
  // ============================================================
  _onStoreChange(state, hint) {
    if (!hint) return;

    if (hint.type === 'record_added') {
      // 新记录添加 → 刷新筛选器（标签/类型可能变化）和卡片列表
      this._renderFilterChips();
      this._renderCardsWithFilter(hint.record.id);

      // 刷新演进脉络（新记录可能引入新标签或改变标签频次）
      this._renderRoutesView();

      // review 的重新渲染由后续 review_regenerated 事件处理，避免重复渲染
    }

    if (hint.type === 'review_regenerated') {
      // 回顾重新生成（记录增删后）
      const reviewContainer = document.getElementById('review-container');
      if (reviewContainer) {
        Render.renderReview(reviewContainer, state.review, Store.getReviewWeekInfo());
      }
    }

    if (hint.type === 'review_week_changed') {
      // 翻页：当前展示周变化，重新渲染回顾
      const reviewContainer = document.getElementById('review-container');
      if (reviewContainer) {
        Render.renderReview(reviewContainer, state.review, Store.getReviewWeekInfo());
      }
    }

    if (hint.type === 'tags_updated') {
      // 标签更新 → 局部刷新该卡片的标签
      Render.updateCardTags(hint.recordId, hint.tags);
      // 标签变化后需重算关联（标签是关联计算的核心维度）
      Store.updateRecordRelations(hint.recordId);
      // 刷新演进脉络视图
      this._renderRoutesView();
    }

    if (hint.type === 'record_updated') {
      // 记录更新 → 刷新筛选器、卡片列表、演进脉络
      this._renderFilterChips();
      this._renderCardsWithFilter();
      this._renderRoutesView();
    }

    if (hint.type === 'record_removed') {
      // 1. 清理 filterState 中已不存在的幻影标签
      const existingTags = new Set(Store.getAllTags().map(t => t.tag));
      this.filterState.tags = this.filterState.tags.filter(t => existingTags.has(t));

      // 2. 从 DOM 移除该卡片（带动画）
      Render.removeCardFromDOM(hint.recordId);

      // 3. 刷新筛选器（标签/类型可能变化）和统计
      this._renderFilterChips();
      this._renderCardsWithFilter();

      // 4. 刷新演进脉络（删除记录可能改变标签频次或使当前标签消失）
      this._renderRoutesView();

      // 时光回顾的重新渲染由 regenerateReview 触发的 review_regenerated 事件处理，无需重复执行
    }
  },

  // ============================================================
  // 添加标签
  // ============================================================
  addTag(recordId, tagText) {
    Store.addTag(recordId, tagText);
  },

  // ============================================================
  // 删除标签
  // ============================================================
  removeTag(recordId, tagText) {
    Store.removeTag(recordId, tagText);
  },

  // ============================================================
  // 删除印记
  // ============================================================
  deleteRecord(recordId) {
    // 关闭确认对话框
    Render.hideDeleteConfirm();
    // 调用 Store 删除（会触发 _onStoreChange）
    Store.removeRecord(recordId);
  },

  // ============================================================
  // 保存编辑（从编辑弹窗读取表单数据）
  // 若原文变化 → 自动触发 AI 重解析
  // 用户手动编辑的标题/摘要优先级高于 AI 重解析结果
  // ============================================================
  async saveEdit(recordId) {
    const record = Store.getRecord(recordId);
    if (!record) return;

    const formData = Render.getEditFormData(recordId);
    if (!formData) return;

    // 比较原文是否变化（trim 后比较）
    const originalChanged = formData.originalContent.trim() !== record.originalContent.trim();

    // 判断用户是否手动编辑了标题/摘要（与旧记录对比）
    const userEditedTitle = formData.title !== record.understanding.title;
    const userEditedSummary = formData.summary !== record.understanding.summary;

    // 在调用 AI 前记录当前标签快照（用户可能在弹窗中已通过 addTag/removeTag 修改过）
    const preAiTags = [...(record.understanding.tags || [])];

    if (originalChanged) {
      // 原文变化 → 显示加载状态，调用 AI 重解析
      Render.setEditButtonLoading(recordId, true);
      var _editBtn = document.getElementById('edit-save-btn-' + recordId.replace('#', ''));
      var _editSteps = Render.startThinkingSteps(_editBtn);
      try {
        const aiResult = await AIService.processRecord(formData.originalContent);
        await _editSteps.done();
        if (aiResult) {
          // 判断 AI 返回后标签是否被用户手动改过（对比调用前的快照）
          const userEditedTags = JSON.stringify(preAiTags) !== JSON.stringify(record.understanding.tags);
          // 合并：AI 结果是基础，用户手动编辑的字段优先级更高
          Store.updateRecord(recordId, {
            originalContent: formData.originalContent,
            title: userEditedTitle ? formData.title : aiResult.understanding.title,
            summary: userEditedSummary ? formData.summary : aiResult.understanding.summary,
            understanding: {
              ...aiResult.understanding,
              tags: userEditedTags ? record.understanding.tags : aiResult.understanding.tags
            },
            milestone: aiResult.milestone,
            warmResponse: aiResult.warmResponse
          });
        } else {
          // AI 处理失败，仅更新原文和手动编辑的字段
          Store.updateRecord(recordId, {
            originalContent: formData.originalContent,
            title: userEditedTitle ? formData.title : record.understanding.title,
            summary: userEditedSummary ? formData.summary : record.understanding.summary
          });
        }
      } catch (err) {
        console.error('[成长印记] 编辑重解析失败', err);
        _editSteps.cancel();
        Render.setEditButtonLoading(recordId, false);
        return;
      }
    } else {
      // 原文未变 → 仅更新用户编辑的字段
      const updates = {};
      if (userEditedTitle) updates.title = formData.title;
      if (userEditedSummary) updates.summary = formData.summary;
      if (Object.keys(updates).length > 0) {
        Store.updateRecord(recordId, updates);
      }
    }

    Render.hideEditModal();
  },

  // ============================================================
  // 提交记录
  // ============================================================
  async submitRecord() {
    const textarea = document.getElementById('capture-input');
    if (!textarea) return;

    const input = textarea.value.trim();
    if (!input) {
      textarea.focus();
      textarea.style.borderColor = '#E8836A';
      setTimeout(() => { textarea.style.borderColor = ''; }, 1000);
      return;
    }

    // 长度验证：超出上限时拒绝提交
    const MAX_LEN = 5000;
    if (input.length > MAX_LEN) {
      textarea.focus();
      textarea.style.borderColor = '#E8836A';
      const countEl = document.getElementById('capture-count');
      if (countEl) countEl.classList.add('warning');
      return;
    }

    // 显示加载状态 + 启动思考步骤动画
    Render.setButtonLoading(true);
    const _submitSteps = Render.startThinkingSteps(document.getElementById('capture-btn'));

    try {
      // 调用 AI 服务（自动选择 API 或 MOCK）
      const processed = await AIService.processRecord(input);
      if (!processed) {
        _submitSteps.cancel();
        Render.setButtonLoading(false);
        return;
      }

      // 快进完成动画（如果 AI 已返回，说明处理完毕）
      await _submitSteps.done();

      // 添加到 Store
      const newRecord = Store.addRecord(processed);

      // 清空输入框
      textarea.value = '';

      // 短暂显示成功提示 + API 降级提示
      const btn = document.getElementById('capture-btn');
      if (btn) {
        const aiStatus = AIService.getStatus();
        let successText = `已保存为 ${newRecord.id}`;
        // 如果 API 失败但降级成功，提示用户
        if (aiStatus.lastApiFailed) {
          successText += '（API 调用失败，已使用本地分析）';
        }
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          ${successText}
        `;
        btn.style.background = aiStatus.lastApiFailed ? 'var(--gold)' : 'var(--green-dark)';
        setTimeout(() => {
          Render.setButtonLoading(false);
        }, 2000);
      }

      console.log('[成长印记] 新记录已添加', {
        id: newRecord.id,
        title: newRecord.understanding.title,
        milestone: newRecord.milestone,
        warmResponse: !!newRecord.warmResponse,
        usingAPI: AIService.getStatus().usingAPI
      });

    } catch (err) {
      console.error('[成长印记] 处理记录失败', err);
      _submitSteps.cancel();
      Render.setButtonLoading(false);
    }
  },

  // ============================================================
  // 输入框变化（输入时改变边框 + 实时字数统计）
  // ============================================================
  onInputChange() {
    const textarea = document.getElementById('capture-input');
    if (!textarea) return;
    const len = textarea.value.length;
    const max = 5000;

    // 边框颜色反馈
    if (len > 0) {
      textarea.style.borderColor = 'var(--green)';
    } else {
      textarea.style.borderColor = '';
    }

    // 实时字数统计，接近上限时高亮警告
    const countEl = document.getElementById('capture-count');
    if (countEl) {
      countEl.textContent = len > 0 ? `${len} / ${max}` : '';
      countEl.classList.toggle('warning', len > max * 0.9);
    }
  },

  // ============================================================
  // 切换视图
  // ============================================================
  switchView(viewName) {
    // 更新导航高亮
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // 切换视图显示
    document.querySelectorAll('.view').forEach(view => {
      const isActive = view.id === `view-${viewName}`;
      view.classList.toggle('active', isActive);
      if (isActive) {
        view.classList.add('view-enter');
        // 触发动画
        requestAnimationFrame(() => {
          view.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
        });
      }
    });

    // 时光回顾视图 → 定位到最近有数据的那一周并生成回顾
    if (viewName === 'review') {
      Store.resetReviewToNearestWeek();
    }

    // 演进脉络视图 → 重新渲染标签 Tab 与时间轴
    if (viewName === 'routes') {
      this._renderRoutesView();
    }

    // 平滑滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ============================================================
  // 时光回顾翻页：delta=-1 往本周方向，delta=1 往历史方向
  // ============================================================
  changeReviewWeek(delta) {
    Store.changeReviewWeek(delta);
  },

  // ============================================================
  // 展开/收起标签栏（演进脉络视图）
  // ============================================================
  toggleRoutesTabs() {
    this._routesTabsExpanded = !this._routesTabsExpanded;
    const routesTabs = document.getElementById('routes-tabs');
    const tagsInfo = Store.getAllTags();
    if (routesTabs) {
      Render.renderTagTabs(routesTabs, tagsInfo, this.currentTag, this._routesTabsExpanded);
    }
    // 展开后确保当前标签可见
    if (this._routesTabsExpanded && this.currentTag) {
      const activeBtn = routesTabs?.querySelector(`[data-tag="${CSS.escape(this.currentTag)}"]`);
      activeBtn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  },

  // ============================================================
  // 切换标签（演进脉络视图的 Tab 切换）
  // ============================================================
  switchTag(tag) {
    this.currentTag = tag;

    // 更新 Tab 高亮
    const tabs = document.getElementById('routes-tabs');
    tabs?.querySelectorAll('.route-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tag === tag);
    });

    // 将当前标签滚动到可见区域
    if (tabs) {
      const activeBtn = Array.from(tabs.querySelectorAll('.route-tab')).find(btn => btn.dataset.tag === tag);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    // 渲染该标签的时间轴
    const routeContent = document.getElementById('route-content');
    if (routeContent) {
      const tagRecords = Store.getRecordsByTag(tag);
      Render.renderTagChain(routeContent, tag, tagRecords);
    }
  },

  // ============================================================
  // 滚动到输入捕获区（填写成长印记入口）
  // ============================================================
  scrollToCapture() {
    const captureSection = document.querySelector('.capture-section');
    if (captureSection) {
      captureSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 滚动完成后聚焦输入框
      setTimeout(() => {
        const textarea = document.getElementById('capture-input');
        if (textarea) textarea.focus();
      }, 600);
    }
  },

  // ============================================================
  // 滚动到成长印记卡片列表（查看成长印记入口）
  // ============================================================
  scrollToCards() {
    const cardsSection = document.querySelector('.cards-section');
    if (cardsSection) {
      cardsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // ============================================================
  // 滚动到指定卡片
  // ============================================================
  scrollToCard(recordId) {
    // 切换到首页视图
    this.switchView('home');

    // 等待视图切换完成
    setTimeout(() => {
      const card = document.querySelector(`[data-record-id="${recordId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 展开卡片详情
        setTimeout(() => {
          Render.toggleCard(card, recordId);
          // 高亮效果
          card.style.boxShadow = '0 0 0 3px var(--green-pale)';
          setTimeout(() => { card.style.boxShadow = ''; }, 1500);
        }, 300);
      }
    }, 100);
  },

  // ============================================================
  // 绑定全局事件
  // ============================================================
  _bindEvents() {
    // Enter 键提交（Ctrl/Cmd + Enter 也可）
    const textarea = document.getElementById('capture-input');
    if (textarea) {
      textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          this.submitRecord();
        }
        // Shift + Enter 换行（默认行为）
      });
    }

    // 点击提交按钮
    const submitBtn = document.getElementById('capture-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitRecord());
    }
  },

  // ============================================================
  // 初始化滚动动画（IntersectionObserver）
  // ============================================================
  _initAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });
  }
};

// ============================================================
// DOM Ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // 全局错误捕获：展示友好的错误提示，避免白屏
  window.addEventListener('error', (event) => {
    console.error('[成长印记] 全局错误', event.error || event.message);
    _showGlobalError();
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[成长印记] 未捕获的 Promise 异常', event.reason);
    _showGlobalError();
  });

  App.init();
});

// ============================================================
// 全局错误提示 UI（轻量 toast，3秒后自动消失）
// ============================================================
function _showGlobalError() {
  // 防止重复创建
  if (document.getElementById('global-error-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'global-error-toast';
  toast.className = 'global-error-toast';
  toast.innerHTML = `
    <span class="global-error-icon">⚠</span>
    <span class="global-error-text">页面出现异常，部分功能可能受影响</span>
    <button class="global-error-close" onclick="this.parentElement.remove()">×</button>
  `;
  document.body.appendChild(toast);

  // 3秒后自动消失
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('global-error-fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}
