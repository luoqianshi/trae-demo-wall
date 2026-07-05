/**
 * 邀请管理页面模块
 * 管理员可以生成/查看邀请码，普通成员可以通过邀请码加入家庭组
 */
const InvitePage = {

  /**
   * 渲染邀请管理页面
   * @returns {string} HTML字符串
   */
  render() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#/login';
      return '';
    }

    const currentGroup = Storage.getCurrentGroup();
    if (!currentGroup) {
      return `
        <div class="page">
          <div class="header">
            <div class="header__nav">
              <button class="header__back" id="btnBack">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="header__title">邀请管理</div>
              <div class="header__action"></div>
            </div>
          </div>
          <div class="content">
            <div class="empty-state">
              <p class="empty-state__text">请先选择一个家庭组</p>
            </div>
          </div>
        </div>
      `;
    }

    const isAdmin = currentGroup.adminId === currentUser.id;
    const allInviteCodes = Storage.getInviteCodesByGroup(currentGroup.id);
    const activeCodes = Storage.getActiveInviteCodes(currentGroup.id);
    const users = Storage.getAll(Storage.KEYS.USERS) || [];

    // 构建活跃邀请码区域
    let activeCodesHtml = '';
    if (activeCodes.length > 0) {
      activeCodesHtml = activeCodes.map(code => {
        const expiresDate = new Date(code.expiresAt);
        const now = new Date();
        const daysLeft = Math.ceil((expiresDate - now) / (1000 * 60 * 60 * 24));
        const expiresStr = Utils.formatDate(code.expiresAt.substring(0, 10));
        return `
          <div class="card card--invite-code" data-code-id="${code.id}">
            <div class="card--invite-code__header">
              <div class="card--invite-code__code">${Utils.escapeHtml(code.code)}</div>
              <button class="btn btn--sm btn--outline card--invite-code__copy" data-copy-code="${code.code}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                复制
              </button>
            </div>
            <div class="card--invite-code__meta">
              <span class="tag tag--success">有效</span>
              <span class="text-hint text-sm">剩余 ${daysLeft} 天 · 有效期至 ${expiresStr}</span>
            </div>
          </div>
        `;
      }).join('');
    } else {
      activeCodesHtml = `
        <div class="empty-state" style="padding: var(--spacing-lg) 0;">
          <div class="empty-state__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="10" rx="2" stroke="var(--text-hint)" stroke-width="1.5" fill="none"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--text-hint)" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <p class="empty-state__text">暂无有效邀请码</p>
        </div>
      `;
    }

    // 构建邀请历史列表
    let historyHtml = '';
    if (allInviteCodes.length > 0) {
      historyHtml = allInviteCodes.map(code => {
        const now = new Date();
        const expires = new Date(code.expiresAt);
        let statusTag = '';
        let statusText = '';

        if (code.used) {
          const usedByUser = users.find(u => u.id === code.usedBy);
          const usedByName = usedByUser ? (usedByUser.displayName || usedByUser.username) : '未知用户';
          statusTag = `<span class="tag tag--muted">已使用</span>`;
          statusText = `<span class="text-hint text-sm">由 ${Utils.escapeHtml(usedByName)} 使用</span>`;
        } else if (now > expires) {
          statusTag = `<span class="tag tag--danger">已过期</span>`;
          statusText = `<span class="text-hint text-sm">过期于 ${Utils.formatDate(code.expiresAt.substring(0, 10))}</span>`;
        } else {
          statusTag = `<span class="tag tag--success">有效</span>`;
          const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
          statusText = `<span class="text-hint text-sm">剩余 ${daysLeft} 天</span>`;
        }

        const createdStr = Utils.formatDate(code.createdAt.substring(0, 10));

        return `
          <div class="list-item card--invite-history-item">
            <div class="list-item__content">
              <div class="card--invite-history-item__code">${Utils.escapeHtml(code.code)}</div>
              <div class="card--invite-history-item__meta">
                ${statusText}
                <span class="text-hint text-sm">· 创建于 ${createdStr}</span>
              </div>
            </div>
            <div class="list-item__right">
              ${statusTag}
            </div>
          </div>
        `;
      }).join('');
    } else {
      historyHtml = `
        <div class="empty-state" style="padding: var(--spacing-md) 0;">
          <p class="empty-state__text">暂无邀请记录</p>
        </div>
      `;
    }

    return `
      <div class="page page--invite">
        <!-- 顶部导航 -->
        <div class="header">
          <div class="header__nav">
            <button class="header__back" id="btnBack" title="返回">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header__title">邀请管理</div>
            <div class="header__action"></div>
          </div>
        </div>

        <div class="content">
          <!-- 家庭组信息 -->
          <div class="card card--invite-group-info">
            <div class="flex items-center gap-md">
              <div class="card--invite-group-info__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 20H7a2 2 0 01-2-2V9.5a2 2 0 012-2h1.5V5.5a2.5 2.5 0 015 0V7.5H17a2 2 0 012 2V18a2 2 0 01-2 2z" stroke="var(--primary)" stroke-width="1.5" fill="var(--primary-lighter)"/>
                </svg>
              </div>
              <div>
                <div class="card--invite-group-info__name">${Utils.escapeHtml(currentGroup.name)}</div>
                <div class="text-hint text-sm">${isAdmin ? '管理员' : '成员'} · 共 ${(currentGroup.members || []).length} 人</div>
              </div>
            </div>
          </div>

          <!-- 活跃邀请码区域 -->
          <div class="section-header">
            <h3 class="section-header__title">有效邀请码</h3>
            ${isAdmin ? `
              <button class="section-header__action" id="btnGenerateCode">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                生成新邀请码
              </button>
            ` : ''}
          </div>
          <div id="activeCodesList">
            ${activeCodesHtml}
          </div>

          ${!isAdmin ? `
            <!-- 非管理员：通过邀请码加入提示 -->
            <div class="card card--invite-notice">
              <div class="flex items-center gap-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="var(--info)" stroke-width="1.5" fill="none"/>
                  <path d="M12 16v-4M12 8h.01" stroke="var(--info)" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="text-sm">如需邀请新成员，请联系家庭组管理员生成邀请码</span>
              </div>
            </div>
          ` : ''}

          <!-- 邀请历史 -->
          <div class="section-header mt-lg">
            <h3 class="section-header__title">邀请记录</h3>
            <span class="text-hint text-sm">共 ${allInviteCodes.length} 条</span>
          </div>
          <div class="card" style="padding: 0;">
            <div id="historyList">
              ${historyHtml}
            </div>
          </div>
        </div>
      </div>

      <style>
        /* 邀请页面专属样式 */
        .card--invite-group-info {
          background: linear-gradient(135deg, var(--primary-lighter) 0%, var(--bg-primary) 100%);
        }
        .card--invite-group-info__icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card--invite-group-info__name {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
        }

        .card--invite-code {
          background: var(--bg-primary);
          border: 1px solid var(--border-light);
        }
        .card--invite-code__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-sm);
        }
        .card--invite-code__code {
          font-size: 24px;
          font-weight: var(--font-weight-bold);
          color: var(--primary-dark);
          letter-spacing: 3px;
          font-family: 'Courier New', monospace;
        }
        .card--invite-code__copy {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .card--invite-code__meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .tag--success {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .tag--danger {
          background: var(--danger-light);
          color: var(--danger);
        }

        .card--invite-history-item {
          padding: var(--spacing-sm) var(--spacing-md);
        }
        .card--invite-history-item:not(:last-child) {
          border-bottom: 1px solid var(--border-light);
        }
        .card--invite-history-item__code {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          letter-spacing: 2px;
          font-family: 'Courier New', monospace;
          margin-bottom: 2px;
        }
        .card--invite-history-item__meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .card--invite-notice {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
        }

        .btn--outline {
          background: transparent;
          border: 1px solid var(--primary);
          color: var(--primary);
        }
        .btn--outline:active {
          background: var(--primary-lighter);
        }
      </style>
    `;
  },

  /**
   * 初始化邀请管理页面事件绑定
   */
  init() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#/login';
      return;
    }

    // 返回按钮
    const btnBack = document.getElementById('btnBack');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        window.location.hash = '#/profile';
      });
    }

    // 生成新邀请码按钮
    const btnGenerateCode = document.getElementById('btnGenerateCode');
    if (btnGenerateCode) {
      btnGenerateCode.addEventListener('click', function () {
        const currentGroup = Storage.getCurrentGroup();
        if (!currentGroup) {
          Toast.warning('请先选择家庭组');
          return;
        }

        // 检查是否已有有效邀请码，避免重复生成
        const activeCodes = Storage.getActiveInviteCodes(currentGroup.id);
        if (activeCodes.length >= 3) {
          Toast.warning('最多同时保留3个有效邀请码，请等待现有邀请码过期或使用后再试');
          return;
        }

        Modal.confirm({
          title: '生成邀请码',
          message: '确定要生成新的邀请码吗？邀请码有效期为7天。',
          confirmText: '生成',
          cancelText: '取消',
          onConfirm: function () {
            const newCode = Storage.generateInviteCode(currentGroup.id);
            Toast.success(`邀请码已生成：${newCode.code}`);
            // 重新渲染页面
            Utils.render(InvitePage);
          }
        });
      });
    }

    // 复制邀请码按钮
    const copyButtons = document.querySelectorAll('[data-copy-code]');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const code = this.dataset.copyCode;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            Toast.success('邀请码已复制到剪贴板');
          }).catch(() => {
            // Fallback
            InvitePage._fallbackCopy(code);
          });
        } else {
          InvitePage._fallbackCopy(code);
        }
      });
    });
  },

  /**
   * 降级复制方案
   * @param {string} text - 要复制的文本
   */
  _fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      Toast.success('邀请码已复制到剪贴板');
    } catch (err) {
      Toast.error('复制失败，请手动复制');
    }
    document.body.removeChild(textarea);
  }
};
