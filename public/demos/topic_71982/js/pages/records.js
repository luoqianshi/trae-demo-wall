/**
 * 看病记录汇总页面模块（Tab "记录"）
 * 展示当前家庭组所有成员的看病记录，支持按成员筛选
 */
const RecordsPage = {

  /**
   * 渲染看病记录汇总页面
   * @returns {string} HTML字符串
   */
  render() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#/login';
      return '';
    }

    const currentGroup = Storage.getCurrentGroup();
    const groups = Storage.getAll(Storage.KEYS.GROUPS) || [];

    // 获取当前组的所有家庭成员（用于筛选下拉）
    const members = Storage.getAll(Storage.KEYS.MEMBERS) || [];
    const groupMembers = members.filter(
      (m) => currentGroup && m.groupId === currentGroup.id
    );

    // 获取当前组的所有看病记录
    const records = Storage.getAll(Storage.KEYS.MEDICAL_RECORDS) || [];
    const groupRecords = records
      .filter((r) => currentGroup && r.groupId === currentGroup.id)
      .sort((a, b) => (b.visitDate || '').localeCompare(a.visitDate || ''));

    // 构建成员筛选下拉选项
    const memberFilterOptions = `
      <option value="">全部成员</option>
      ${groupMembers
        .map((m) => `<option value="${m.id}">${Utils.escapeHtml(m.name)}</option>`)
        .join('')}
    `;

    // 为每条记录查找成员名称
    const recordsWithMemberName = groupRecords.map((record) => {
      const member = members.find((m) => m.id === record.memberId);
      return {
        ...record,
        memberName: member ? member.name : '未知成员'
      };
    });

    // 构建记录卡片列表
    let recordsHtml = '';
    if (recordsWithMemberName.length > 0) {
      recordsHtml = recordsWithMemberName
        .map((record) => `
          <div class="card card--record-item" data-record-id="${record.id}" data-member-id="${record.memberId}">
            <div class="card__header">
              <div class="flex items-center gap-sm">
                <span class="tag tag--relationship">${Utils.escapeHtml(record.memberName)}</span>
                <span class="card__title">${Utils.escapeHtml(record.diagnosis || '未诊断')}</span>
              </div>
            </div>
            <div class="card__body">
              <div class="flex items-center gap-sm flex-wrap">
                <span class="text-hint" style="font-size: var(--font-size-xs);">${Utils.formatDate(record.visitDate)}</span>
                <span class="tag tag--muted">${Utils.escapeHtml(record.hospital || '--')}</span>
                <span class="tag tag--muted">${Utils.escapeHtml(record.department || '--')}</span>
              </div>
            </div>
          </div>
        `)
        .join('');
    } else {
      recordsHtml = `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d="M20 60V30l20-10 20 10v30H20z" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
              <path d="M32 60V42h16v18" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <p class="empty-state__text">暂无看病记录</p>
          <p class="empty-state__text">添加家庭成员并创建看病记录后，记录将显示在这里</p>
        </div>
      `;
    }

    return `
      <div class="page">
        <!-- 顶部导航 -->
        <div class="header">
          <div class="header__nav">
            <button class="header__back" id="btnBackHome" title="返回首页">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M9 21V14h6v7" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </button>
            <div class="header__title">看病记录</div>
            <div class="header__action"></div>
          </div>
        </div>

        <div class="content">
          <!-- 筛选区域 -->
          ${groupMembers.length > 0 ? `
            <div class="form-group">
              <select class="form-select" id="memberFilter">
                ${memberFilterOptions}
              </select>
            </div>
          ` : ''}

          <!-- 记录总数提示 -->
          <div class="records-count mb-md">
            <span class="text-hint" style="font-size: var(--font-size-xs);">共 ${recordsWithMemberName.length} 条记录</span>
          </div>

          <!-- 记录列表 -->
          <div id="recordsList">
            ${recordsHtml}
          </div>
        </div>

        <!-- 底部Tab栏 -->
        <nav class="tab-bar">
          <a class="tab-bar__item" data-tab="home">
            <div class="tab-bar__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="1.8" fill="none"/>
                <path d="M9 21V14h6v7" stroke="currentColor" stroke-width="1.8" fill="none"/>
              </svg>
            </div>
            <span class="tab-bar__label">首页</span>
          </a>
          <a class="tab-bar__item tab-bar__item--active" data-tab="records">
            <div class="tab-bar__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.8" fill="none"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.8" fill="none"/>
              </svg>
            </div>
            <span class="tab-bar__label">记录</span>
          </a>
          <a class="tab-bar__item" data-tab="profile">
            <div class="tab-bar__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" fill="none"/>
                <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" stroke-width="1.8" fill="none"/>
              </svg>
            </div>
            <span class="tab-bar__label">我的</span>
          </a>
        </nav>
      </div>

      <style>
        .card--record-item {
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .card--record-item:active {
          background: var(--bg-tertiary);
        }
        .card--record-item .card__header {
          margin-bottom: var(--spacing-xs);
        }
        .records-count {
          padding: 0 var(--spacing-xs);
        }
      </style>
    `;
  },

  /**
   * 初始化看病记录汇总页面事件绑定
   */
  init() {
    // 返回首页按钮
    const btnBackHome = document.getElementById('btnBackHome');
    if (btnBackHome) {
      btnBackHome.addEventListener('click', function () {
        window.location.hash = '#/home';
      });
    }

    // 成员筛选下拉
    const memberFilter = document.getElementById('memberFilter');
    if (memberFilter) {
      memberFilter.addEventListener('change', function () {
        const filterMemberId = this.value;
        const cards = document.querySelectorAll('[data-record-id]');
        let visibleCount = 0;

        cards.forEach((card) => {
          if (!filterMemberId) {
            // 全部成员：显示所有
            card.style.display = '';
            visibleCount++;
          } else {
            // 按成员筛选
            const cardMemberId = card.dataset.memberId;
            if (cardMemberId === filterMemberId) {
              card.style.display = '';
              visibleCount++;
            } else {
              card.style.display = 'none';
            }
          }
        });

        // 更新记录计数
        const countEl = document.querySelector('.records-count span');
        if (countEl) {
          countEl.textContent = `共 ${visibleCount} 条记录`;
        }
      });
    }

    // 记录卡片点击
    const recordsList = document.getElementById('recordsList');
    if (recordsList) {
      recordsList.addEventListener('click', function (e) {
        const card = e.target.closest('[data-record-id]');
        if (card) {
          const recordId = card.dataset.recordId;
          window.location.hash = `#/medical-record/detail?id=${recordId}`;
        }
      });
    }

    // 底部Tab栏导航
    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) {
      tabBar.addEventListener('click', function (e) {
        const tabItem = e.target.closest('.tab-bar__item');
        if (!tabItem) return;
        const tab = tabItem.dataset.tab;
        switch (tab) {
          case 'home':
            window.location.hash = '#/home';
            break;
          case 'records':
            // 已经在记录页，无需跳转
            break;
          case 'profile':
            window.location.hash = '#/profile';
            break;
        }
      });
    }
  }
};
