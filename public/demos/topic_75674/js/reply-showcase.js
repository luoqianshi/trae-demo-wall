/**
 * @fileoverview M4 回复展示模块
 * @description 负责将 AI 生成的多版回复方案和情绪分析结果可视化呈现给用户。
 *              包含情绪分析卡片、回复方案 Tab 切换、快捷操作和一键复制功能。
 * @module reply-showcase
 * @example
 *   import { ReplyShowcase } from './reply-showcase.js';
 *   ReplyShowcase.init();
 *   ReplyShowcase.render(aiResponse);
 */

import { EventBus } from './event-bus.js';
import { AIGeneration } from './ai-generation.js';

// ============================================================
// 内部状态
// ============================================================

/** 当前选中的方案 ID */
let _selectedOptionId = null;
/** 当前回复方案列表 */
let _replyOptions = [];
/** 当前情绪分析结果 */
let _emotionAnalysis = null;

// ============================================================
// 快捷操作配置
// ============================================================

/**
 * 快捷操作预设
 * @private
 */
const QUICK_ACTIONS = [
  { id: 'shorter', label: '更简短', prompt: '请将当前回复压缩到30字以内，保留核心意思' },
  { id: 'polite', label: '更礼貌', prompt: '请在当前回复基础上增加礼貌用语和缓冲词，语气更加温和' },
  { id: 'direct', label: '更直接', prompt: '请去掉铺垫和客套，直达核心内容' },
  { id: 'emoji', label: '加表情', prompt: '请在合适位置添加合适的 emoji 表情，让回复更生动' },
  { id: 'question', label: '追问版', prompt: '请将回复改为提问形式，引导对方多说' },
];

// ============================================================
// 回复展示模块
// ============================================================

/**
 * 回复展示模块
 * @namespace ReplyShowcase
 */
export const ReplyShowcase = {
  /**
   * 在 #ycjs-ai-panel 中渲染 AI 生成结果
   * @param {Object} response - AI 生成结果
   * @param {boolean} response.success - 是否成功
   * @param {Array} response.replyOptions - 回复方案列表
   * @param {Object} [response.emotionAnalysis] - 情绪分析结果
   */
  render(response) {
    const panel = document.getElementById('ycjs-ai-panel');
    if (!panel) return;

    if (!response || !response.success) {
      this.showError(response?.error || '未生成有效回复，请重试');
      return;
    }

    // 保存到内部状态
    _replyOptions = response.replyOptions || [];
    _emotionAnalysis = response.emotionAnalysis || null;

    // 默认选中第一个方案
    _selectedOptionId = _replyOptions.length > 0 ? _replyOptions[0].id : null;

    let html = '';

    // ---- D 区：情绪分析卡片 ----
    if (_emotionAnalysis) {
      html += this._renderEmotionCard(_emotionAnalysis);
    }

    // ---- E 区：回复方案 Tab ----
    if (_replyOptions.length > 0) {
      html += this._renderReplyTabs(_replyOptions, _selectedOptionId);
    }

    // ---- F 区：快捷操作按钮 ----
    if (_replyOptions.length > 0) {
      html += this._renderQuickActions();
    }

    // 如果什么都没有
    if (!html) {
      html = `
        <div class="ycjs-empty-state">
          <div class="ycjs-empty-state__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ycjs-text-muted)" stroke-width="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div class="ycjs-empty-state__title">暂无结果</div>
          <div class="ycjs-empty-state__desc">请先粘贴聊天内容并点击生成</div>
        </div>`;
    }

    panel.innerHTML = html;

    // 绑定事件
    this._bindTabEvents();
    this._bindCopyEvents();
    this._bindQuickActionEvents();
  },

  /**
   * 切换到指定回复方案
   * @param {string} optionId - 方案 ID
   */
  selectOption(optionId) {
    if (!optionId || optionId === _selectedOptionId) return;

    _selectedOptionId = optionId;

    // 更新 Tab 高亮
    const tabGroup = document.querySelector('.ycjs-reply-tabs');
    if (tabGroup) {
      tabGroup.querySelectorAll('.ycjs-reply-tab').forEach((tab) => {
        tab.classList.toggle('ycjs-reply-tab--active', tab.dataset.optionId === optionId);
      });
    }

    // 更新内容区域（带淡入动画）
    const contentEl = document.querySelector('.ycjs-reply-content');
    if (contentEl) {
      contentEl.style.opacity = '0';
      setTimeout(() => {
        const option = _replyOptions.find((o) => o.id === optionId);
        if (option) {
          contentEl.innerHTML = this._renderReplyCardContent(option);
        }
        contentEl.style.opacity = '1';
      }, 150);
    }

    // 绑定复制按钮事件（重新渲染后需要重新绑定）
    this._bindCopyEvents();
  },

  /**
   * 复制指定方案内容到剪贴板
   * @param {string} optionId - 方案 ID
   */
  async copyOption(optionId) {
    const option = _replyOptions.find((o) => o.id === optionId);
    if (!option) return;

    try {
      // 优先使用 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(option.content);
      } else {
        // 降级到 execCommand
        const textarea = document.createElement('textarea');
        textarea.value = option.content;
        textarea.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      // 按钮变"已复制"
      const btn = document.querySelector(`.ycjs-copy-btn[data-option-id="${optionId}"]`);
      if (btn) {
        btn.classList.add('ycjs-copy-btn--copied');
        btn.textContent = '已复制';
        setTimeout(() => {
          btn.classList.remove('ycjs-copy-btn--copied');
          btn.textContent = '复制';
        }, 2000);
      }

      // 显示 Toast
      this._showToast('已复制到剪贴板', 'success');
    } catch (err) {
      console.error('ReplyShowcase.copyOption 出错:', err);
      this._showToast('复制失败，请手动复制', 'error');
    }
  },

  /**
   * 在 #ycjs-ai-panel 中展示/隐藏 loading 动画
   * @param {boolean} loading - 是否正在加载
   */
  setLoading(loading) {
    const panel = document.getElementById('ycjs-ai-panel');
    if (!panel) return;

    if (loading) {
      // 保留现有内容（不覆盖旧结果），只在面板顶部插入 loading
      // 如果面板已有 loading 则跳过
      if (panel.querySelector('.ycjs-loading')) return;

      const loadingHtml = `
        <div class="ycjs-loading">
          <div class="ycjs-loading__spinner"></div>
          <span class="ycjs-loading__text">AI 正在分析...</span>
        </div>`;

      // 如果面板是空的或只有空状态，直接设置
      if (!panel.querySelector('.ycjs-emotion-card') && !panel.querySelector('.ycjs-reply-section')) {
        panel.innerHTML = loadingHtml;
      } else {
        // 在顶部插入 loading 指示器
        panel.insertAdjacentHTML('afterbegin', loadingHtml);
      }
    } else {
      // 移除 loading
      const loadingEl = panel.querySelector('.ycjs-loading');
      if (loadingEl) {
        loadingEl.remove();
      }
    }
  },

  /**
   * 展示错误提示
   * @param {string} error - 错误信息
   */
  showError(error) {
    const panel = document.getElementById('ycjs-ai-panel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="ycjs-error-card">
        <div class="ycjs-error-card__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ycjs-error)" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
        </div>
        <div class="ycjs-error-card__message">${_escapeHtml(error || '发生未知错误')}</div>
        <button class="ycjs-btn ycjs-btn--secondary ycjs-btn--sm ycjs-error-card__retry" id="ycjs-btn-retry">
          重试
        </button>
      </div>`;

    // 绑定重试按钮
    const retryBtn = panel.querySelector('#ycjs-btn-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        EventBus.emit('ai:retry-request', {});
      });
    }
  },

  /**
   * 清空 AI 面板
   */
  clear() {
    const panel = document.getElementById('ycjs-ai-panel');
    if (!panel) return;

    _replyOptions = [];
    _emotionAnalysis = null;
    _selectedOptionId = null;

    panel.innerHTML = `
      <div class="ycjs-empty-state">
        <div class="ycjs-empty-state__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ycjs-text-muted)" stroke-width="1.5">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
        </div>
        <div class="ycjs-empty-state__title">AI 辅助面板</div>
        <div class="ycjs-empty-state__desc">粘贴聊天内容后，点击「生成回复」获取 AI 建议</div>
        <button class="ycjs-btn ycjs-btn--secondary ycjs-btn--sm" id="ycjs-btn-emotion-only">
          仅分析情绪
        </button>
      </div>`;

    // 绑定「仅分析情绪」按钮事件
    const emotionOnlyBtn = panel.querySelector('#ycjs-btn-emotion-only');
    if (emotionOnlyBtn) {
      emotionOnlyBtn.addEventListener('click', () => {
        EventBus.emit('ai:emotion-request', {});
      });
    }
  },

  /**
   * 快捷操作处理
   * @param {string} action - 操作标识
   */
  handleQuickAction(action) {
    const actionConfig = QUICK_ACTIONS.find((a) => a.id === action);
    if (!actionConfig) return;

    // 获取当前选中的回复内容
    const currentOption = _replyOptions.find((o) => o.id === _selectedOptionId);
    if (!currentOption) {
      this._showToast('请先生成回复方案', 'info');
      return;
    }

    // 设置 loading
    this.setLoading(true);

    // 构建请求：使用快捷操作的 prompt 对当前回复进行微调
    const messages = [
      { sender: 'user', senderRole: 'me', content: currentOption.content },
    ];

    const request = {
      messages,
      myName: '我',
      otherName: '对方',
      requestType: 'reply',
      context: actionConfig.prompt,
    };

    // 调用 AI 生成并覆盖当前显示
    if (AIGeneration && AIGeneration.generate) {
      AIGeneration.generate(request)
        .then((response) => {
          this.setLoading(false);
          if (response && response.success && response.replyOptions && response.replyOptions.length > 0) {
            // 将新方案插入并选中
            const newOption = {
              id: action + '_' + Date.now(),
              label: actionConfig.label,
              content: response.replyOptions[0].content,
              reasoning: response.replyOptions[0].reasoning || '',
            };
            _replyOptions.push(newOption);
            _selectedOptionId = newOption.id;

            // 重新渲染 Tab 和内容
            this._refreshReplySection();
          } else {
            this._showToast('快捷操作生成失败，请重试', 'error');
          }
        })
        .catch((err) => {
          this.setLoading(false);
          this._showToast('快捷操作出错: ' + (err.message || '未知错误'), 'error');
        });
    } else {
      this.setLoading(false);
      this._showToast('AI 生成模块未就绪', 'error');
    }
  },

  /**
   * 初始化模块：监听 AI 相关事件
   */
  init() {
    // 监听 AI 回复生成完成
    EventBus.on('ai:reply-generated', (data) => {
      this.setLoading(false);
      this.render(data.response);
    });

    // 监听 AI 生成开始
    EventBus.on('ai:generation-start', () => {
      this.setLoading(true);
    });

    // 监听 AI 生成错误
    EventBus.on('ai:generation-error', (data) => {
      this.setLoading(false);
      this.showError(data.error || 'AI 生成失败');
    });

    // 监听重试事件
    EventBus.on('ai:retry-request', () => {
      EventBus.emit('ai:generate-request', {});
    });

    // 监听情绪分析请求，转发为情绪生成请求
    EventBus.on('ai:emotion-request', () => {
      EventBus.emit('ai:emotion-generate-request', {});
    });

    // 初始渲染空状态
    this.clear();
  },

  // ============================================================
  // 渲染子方法
  // ============================================================

  /**
   * 渲染情绪分析卡片（D 区）
   * @param {Object} emotion - 情绪分析数据
   * @returns {string} HTML
   * @private
   */
  _renderEmotionCard(emotion) {
    const intensity = emotion.intensity || 5;
    const color = _getEmotionColor(intensity);
    const levelText = _getEmotionLevel(intensity);

    // 关键词标签
    const keywordsHtml = (emotion.keyPhrases || [])
      .map((kw) => `<span class="ycjs-emotion-keyword">${_escapeHtml(kw)}</span>`)
      .join('');

    return `
      <div class="ycjs-emotion-card">
        <div class="ycjs-emotion-card__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ycjs-accent)" stroke-width="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
          </svg>
          <span class="ycjs-emotion-card__title">情绪解读</span>
          <span class="ycjs-emotion-card__scope">基于最近 1-3 条消息分析</span>
        </div>
        <div class="ycjs-emotion-card__main">
          <div class="ycjs-emotion-row">
            <span class="ycjs-emotion-label">对方情绪</span>
            <span class="ycjs-emotion-value">
              <strong>${_escapeHtml(emotion.overallEmotion || '未知')}</strong>
              <span class="ycjs-emotion-level" style="color:${color}">${levelText}</span>
            </span>
          </div>
          <div class="ycjs-emotion-meter">
            <div class="ycjs-emotion-meter__bar">
              <div class="ycjs-emotion-meter__fill" style="width:${intensity * 10}%; background:${color}"></div>
            </div>
            <span class="ycjs-emotion-meter__number" style="color:${color}">${intensity}/10</span>
          </div>
          <div class="ycjs-emotion-detail">
            <div class="ycjs-emotion-detail__item">
              <span class="ycjs-emotion-detail__label">潜台词</span>
              <span class="ycjs-emotion-detail__text">${_escapeHtml(emotion.subtext || '-')}</span>
            </div>
            <div class="ycjs-emotion-detail__item">
              <span class="ycjs-emotion-detail__label">建议策略</span>
              <span class="ycjs-emotion-detail__text">${_escapeHtml(emotion.suggestedApproach || '-')}</span>
            </div>
          </div>
          ${keywordsHtml ? `<div class="ycjs-emotion-keywords">${keywordsHtml}</div>` : ''}
        </div>
      </div>`;
  },

  /**
   * 渲染回复方案 Tab（E 区）
   * @param {Array} options - 回复方案列表
   * @param {string} selectedId - 当前选中的方案 ID
   * @returns {string} HTML
   * @private
   */
  _renderReplyTabs(options, selectedId) {
    // Tab 按钮
    const tabsHtml = options
      .map((opt) => `
        <button class="ycjs-reply-tab ${opt.id === selectedId ? 'ycjs-reply-tab--active' : ''}"
                data-option-id="${opt.id}">
          ${_escapeHtml(opt.label)}
        </button>`)
      .join('');

    // 选中方案的内容
    const selectedOption = options.find((o) => o.id === selectedId) || options[0];
    const contentHtml = this._renderReplyCardContent(selectedOption);

    return `
      <div class="ycjs-reply-section">
        <div class="ycjs-reply-section__header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ycjs-accent)" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span class="ycjs-reply-section__title">回复方案</span>
        </div>
        <div class="ycjs-reply-tabs">${tabsHtml}</div>
        <div class="ycjs-reply-content" data-option-id="${selectedOption ? selectedOption.id : ''}">
          ${contentHtml}
        </div>
      </div>`;
  },

  /**
   * 渲染单个回复方案卡片内容
   * @param {Object} option - 回复方案
   * @returns {string} HTML
   * @private
   */
  _renderReplyCardContent(option) {
    if (!option) return '';
    return `
      <div class="ycjs-reply-card">
        <div class="ycjs-reply-card__content">${_escapeHtml(option.content)}</div>
        <div class="ycjs-reply-card__reasoning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ycjs-warning)" stroke-width="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span>${_escapeHtml(option.reasoning || '')}</span>
        </div>
        <div class="ycjs-reply-card__actions">
          <button class="ycjs-btn ycjs-btn--primary ycjs-btn--sm ycjs-copy-btn" data-option-id="${option.id}">
            复制
          </button>
        </div>
      </div>`;
  },

  /**
   * 渲染快捷操作按钮（F 区）
   * @returns {string} HTML
   * @private
   */
  _renderQuickActions() {
    const btnsHtml = QUICK_ACTIONS.map((action) => `
      <button class="ycjs-btn ycjs-btn--ghost ycjs-btn--sm ycjs-quick-btn" data-action="${action.id}">
        ${_escapeHtml(action.label)}
      </button>`).join('');

    return `
      <div class="ycjs-quick-actions">
        <div class="ycjs-quick-actions__header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ycjs-text-secondary)" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span class="ycjs-quick-actions__title">快捷操作</span>
        </div>
        <div class="ycjs-quick-actions__btns">${btnsHtml}</div>
      </div>`;
  },

  /**
   * 刷新回复方案区域
   * @private
   */
  _refreshReplySection() {
    const panel = document.getElementById('ycjs-ai-panel');
    if (!panel) return;

    // 移除旧回复区域
    const oldSection = panel.querySelector('.ycjs-reply-section');
    const oldQuick = panel.querySelector('.ycjs-quick-actions');
    if (oldSection) oldSection.remove();
    if (oldQuick) oldQuick.remove();

    // 重新渲染
    const replyHtml = this._renderReplyTabs(_replyOptions, _selectedOptionId);
    const quickHtml = this._renderQuickActions();

    // 找到情绪卡片后面插入
    const emotionCard = panel.querySelector('.ycjs-emotion-card');
    if (emotionCard) {
      emotionCard.insertAdjacentHTML('afterend', replyHtml + quickHtml);
    } else {
      panel.insertAdjacentHTML('beforeend', replyHtml + quickHtml);
    }

    // 重新绑定事件
    this._bindTabEvents();
    this._bindCopyEvents();
    this._bindQuickActionEvents();
  },

  // ============================================================
  // 事件绑定
  // ============================================================

  /**
   * 绑定 Tab 切换事件
   * @private
   */
  _bindTabEvents() {
    document.querySelectorAll('.ycjs-reply-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const optionId = tab.dataset.optionId;
        if (optionId) {
          this.selectOption(optionId);
        }
      });
    });
  },

  /**
   * 绑定复制按钮事件
   * @private
   */
  _bindCopyEvents() {
    document.querySelectorAll('.ycjs-copy-btn').forEach((btn) => {
      // 移除旧监听器（通过克隆节点）
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', () => {
        const optionId = newBtn.dataset.optionId;
        if (optionId) {
          this.copyOption(optionId);
        }
      });
    });
  },

  /**
   * 绑定快捷操作事件
   * @private
   */
  _bindQuickActionEvents() {
    document.querySelectorAll('.ycjs-quick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action) {
          this.handleQuickAction(action);
        }
      });
    });
  },

  // ============================================================
  // UI 工具
  // ============================================================

  /**
   * 显示 Toast 轻提示
   * @param {string} message - 提示文本
   * @param {string} type - 类型: 'success' | 'error' | 'info'
   * @private
   */
  _showToast(message, type = 'info') {
    // 移除旧 Toast
    const old = document.querySelector('.ycjs-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = `ycjs-toast ycjs-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发入场动画
    requestAnimationFrame(() => {
      toast.classList.add('ycjs-toast--visible');
    });

    // 自动消失
    setTimeout(() => {
      toast.classList.remove('ycjs-toast--visible');
      toast.classList.add('ycjs-toast--hidden');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },
};

// ============================================================
// 辅助函数
// ============================================================

/**
 * HTML 转义
 * @param {string} str
 * @returns {string}
 * @private
 */
function _escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 根据情绪强度返回对应颜色
 * @param {number} intensity - 1-10
 * @returns {string} CSS 颜色值
 * @private
 */
function _getEmotionColor(intensity) {
  if (intensity <= 3) return '#2A9D8F'; // 绿色 - 平静
  if (intensity <= 6) return '#F59E0B'; // 黄色 - 正常
  if (intensity <= 8) return '#F97316'; // 橙色 - 焦虑
  return '#EF4444'; // 红色 - 强烈
}

/**
 * 根据情绪强度返回等级文字
 * @param {number} intensity - 1-10
 * @returns {string}
 * @private
 */
function _getEmotionLevel(intensity) {
  if (intensity <= 3) return '平静/轻松';
  if (intensity <= 6) return '正常/积极';
  if (intensity <= 8) return '焦虑/期待';
  return '强烈/愤怒';
}
