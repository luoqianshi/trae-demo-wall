/**
 * 首页/仪表盘页面模块
 * 展示当前家庭组信息、家庭成员列表，支持家庭组切换
 */
const HomePage = {
  /**
   * 渲染首页HTML
   * @returns {string} 首页HTML字符串
   */
  render() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#/login';
      return '';
    }

    const currentGroup = Storage.getCurrentGroup();
    const groups = Storage.getAll(Storage.KEYS.GROUPS) || [];
    const userGroups = groups.filter(
      (g) => g.members && g.members.includes(currentUser.id)
    );
    const activeGroup = currentGroup || userGroups[0];
    const isAdmin = activeGroup && activeGroup.adminId === currentUser.id;

    // 获取当前组的家庭成员
    const members = Storage.getAll(Storage.KEYS.MEMBERS) || [];
    const groupMembers = members.filter(
      (m) => activeGroup && m.groupId === activeGroup.id
    );

    // 构建家庭组下拉选项
    const groupOptions = userGroups
      .map(
        (g) =>
          `<option value="${g.id}" ${g.id === activeGroup?.id ? 'selected' : ''}>${g.name}</option>`
      )
      .join('');

    // 构建家庭成员卡片列表
    let memberCardsHtml = '';
    if (groupMembers.length > 0) {
      memberCardsHtml = groupMembers
        .map((member) => {
          const initial = member.name ? member.name.charAt(0) : '?';
          const relationship = member.relationship
            ? Utils.getRelationshipText(member.relationship)
            : '未设置';
          const age = member.age ? `${member.age}岁` : '未知';
          return `
            <div class="card card--member" data-member-id="${member.id}">
              <div class="card--member__inner">
                <div class="list-item__avatar">${initial}</div>
                <div class="card--member__info">
                  <div class="card--member__name">${Utils.escapeHtml(member.name)}</div>
                  <div class="card--member__meta">
                    <span class="tag tag--relationship">${relationship}</span>
                    <span class="text-hint">${age}</span>
                  </div>
                </div>
                <div class="card--member__arrow">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="var(--text-hint)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    } else {
      memberCardsHtml = `
        <div class="empty-state">
          <div class="empty-state__icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="30" r="12" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
              <path d="M16 68c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <p class="empty-state__text">暂无家庭成员</p>
          <p class="empty-state__text">点击下方按钮添加第一位家庭成员</p>
        </div>
      `;
    }

    return `
      <div class="page page--home">
        <!-- 顶部导航栏 -->
        <div class="header">
          <div class="header__nav">
            <div class="header__title">家护手记</div>
            <div class="flex items-center gap-sm">
              ${isAdmin ? `
                <button class="header__action" id="btnInvite" title="邀请管理">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="8.5" cy="7" r="4" stroke="var(--text-secondary)" stroke-width="2" fill="none"/>
                    <path d="M20 8v6M23 11h-6" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              ` : ''}
              <span class="text-hint text-sm" style="font-size: var(--font-size-xs);">${Utils.escapeHtml(currentUser.displayName || currentUser.username)}</span>
              <button class="header__action" id="btnLogout" title="退出登录">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="content">
          <!-- 家庭组信息区域 -->
          <div class="card home-group-info">
            <div class="home-group-info__header">
              <div class="home-group-info__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M17 20H7a2 2 0 01-2-2V9.5a2 2 0 012-2h1.5V5.5a2.5 2.5 0 015 0V7.5H17a2 2 0 012 2V18a2 2 0 01-2 2z" stroke="var(--primary)" stroke-width="1.5" fill="var(--primary-lighter)"/>
                </svg>
              </div>
              <div class="home-group-info__content">
                <select class="home-group-info__select form-select" id="groupSwitcher">
                  ${groupOptions}
                </select>
                <div class="home-group-info__meta">
                  <span class="text-hint">${groupMembers.length} 位成员</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 家庭成员列表区域 -->
          <div class="section-header">
            <h3 class="section-header__title">家庭成员</h3>
          </div>
          <div class="home-members" id="membersList">
            ${memberCardsHtml}
          </div>
        </div>

        <!-- 浮动添加按钮 -->
        <button class="fab" id="btnAddMember" title="添加家庭成员">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- 底部Tab栏 -->
        <nav class="tab-bar">
          <a class="tab-bar__item tab-bar__item--active" data-tab="home">
            <div class="tab-bar__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="1.8" fill="none"/>
                <path d="M9 21V14h6v7" stroke="currentColor" stroke-width="1.8" fill="none"/>
              </svg>
            </div>
            <span class="tab-bar__label">首页</span>
          </a>
          <a class="tab-bar__item" data-tab="records">
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
        /* 首页专属样式 */
        .home-group-info {
          background: linear-gradient(135deg, var(--primary-lighter) 0%, var(--bg-primary) 100%);
        }
        .home-group-info__header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        .home-group-info__icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .home-group-info__content {
          flex: 1;
          min-width: 0;
        }
        .home-group-info__select {
          width: 100%;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--primary-dark);
          padding: 0;
          border: none;
          background: transparent;
          margin-bottom: var(--spacing-xs);
        }
        .home-group-info__select:focus {
          box-shadow: none;
          border: none;
        }

        /* 成员卡片 */
        .card--member {
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .card--member:active {
          background: var(--bg-tertiary);
        }
        .card--member__inner {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        .card--member__info {
          flex: 1;
          min-width: 0;
        }
        .card--member__name {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }
        .card--member__meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .card--member__arrow {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
      </style>
    `;
  },

  /**
   * 初始化首页事件绑定
   */
  init() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#/login';
      return;
    }

    // 家庭组切换
    const groupSwitcher = document.getElementById('groupSwitcher');
    if (groupSwitcher) {
      groupSwitcher.addEventListener('change', function () {
        const groupId = this.value;
        const groups = Storage.getAll(Storage.KEYS.GROUPS) || [];
        const selectedGroup = groups.find((g) => g.id === groupId);
        if (selectedGroup) {
          Storage.setCurrentGroup(selectedGroup);
          // 切换家庭组后重新渲染首页
          Utils.render(HomePage);
        }
      });
    }

    // 家庭成员卡片点击
    const membersList = document.getElementById('membersList');
    if (membersList) {
      membersList.addEventListener('click', function (e) {
        const card = e.target.closest('[data-member-id]');
        if (card) {
          const memberId = card.dataset.memberId;
          window.location.hash = `#/family-member/detail?id=${memberId}`;
        }
      });
    }

    // 添加家庭成员按钮
    const btnAddMember = document.getElementById('btnAddMember');
    if (btnAddMember) {
      btnAddMember.addEventListener('click', function () {
        window.location.hash = '#/family-member/add';
      });
    }

    // 邀请管理按钮（仅管理员可见）
    const btnInvite = document.getElementById('btnInvite');
    if (btnInvite) {
      btnInvite.addEventListener('click', function () {
        window.location.hash = '#/invite';
      });
    }

    // 退出登录按钮
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function () {
        Modal.confirm({
          title: '退出登录',
          message: '确定要退出登录吗？',
          confirmText: '退出',
          cancelText: '取消',
          danger: true,
          onConfirm: function () {
            Storage.setCurrentUser(null);
            Toast.success('已退出登录');
            window.location.hash = '#/login';
          }
        });
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
            // 已经在首页，无需跳转
            break;
          case 'records':
            window.location.hash = '#/records';
            break;
          case 'profile':
            window.location.hash = '#/profile';
            break;
        }
      });
    }
  }
};
