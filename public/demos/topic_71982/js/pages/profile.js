/**
 * 个人中心/我的页面模块（Tab "我的"）
 * 展示用户信息、家庭组管理、设置等功能
 */
const ProfilePage = {

  /**
   * 渲染个人中心页面
   * @returns {string} HTML字符串
   */
  render() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#/login';
      return '';
    }

    const groups = Storage.getAll(Storage.KEYS.GROUPS) || [];
    const userGroups = groups.filter(
      (g) => g.members && g.members.includes(currentUser.id)
    );
    const currentGroup = Storage.getCurrentGroup();
    const currentGroupId = currentGroup ? currentGroup.id : null;
    const members = Storage.getAll(Storage.KEYS.MEMBERS) || [];

    // 构建用户信息区域
    const userInitial = currentUser.displayName
      ? currentUser.displayName.charAt(0)
      : currentUser.username.charAt(0);

    // 构建家庭组列表
    let groupsHtml = '';
    if (userGroups.length > 0) {
      groupsHtml = userGroups
        .map((group) => {
          const groupMemberCount = members.filter(
            (m) => m.groupId === group.id
          ).length;
          const isActive = group.id === currentGroupId;
          const isAdmin = group.adminId === currentUser.id;

          // 获取该组的有效邀请码
          const activeCodes = Storage.getActiveInviteCodes(group.id);
          const inviteCodeDisplay = activeCodes.length > 0
            ? `<div class="card--group__invite-code">邀请码: <span class="card--group__invite-code-value">${Utils.escapeHtml(activeCodes[0].code)}</span></div>`
            : '';

          return `
            <div class="card card--group card--group${isActive ? '--active' : ''}"
              data-group-id="${group.id}"
              title="点击切换到该家庭组">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-md">
                  <div class="card--group__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M17 20H7a2 2 0 01-2-2V9.5a2 2 0 012-2h1.5V5.5a2.5 2.5 0 015 0V7.5H17a2 2 0 012 2V18a2 2 0 01-2 2z"
                        stroke="${isActive ? 'var(--primary)' : 'var(--text-hint)'}" stroke-width="1.5" fill="${isActive ? 'var(--primary-lighter)' : 'none'}"/>
                    </svg>
                  </div>
                  <div>
                    <div class="card__title" style="margin-bottom: 2px;">${Utils.escapeHtml(group.name)}</div>
                    <small class="text-hint">${groupMemberCount} 位成员${isAdmin ? ' · 管理员' : ''}</small>
                    ${isAdmin ? inviteCodeDisplay : ''}
                  </div>
                </div>
                ${isActive ? '<span class="tag tag--relationship">当前</span>' : ''}
              </div>
            </div>
          `;
        })
        .join('');
    } else {
      groupsHtml = `
        <div class="empty-state" style="padding: var(--spacing-md);">
          <p class="empty-state__text">暂无家庭组</p>
        </div>
      `;
    }

    return `
      <div class="page">
        <!-- 顶部区域 -->
        <div class="header">
          <div class="header__nav">
            <div class="header__title">我的</div>
            <div class="header__back"></div>
          </div>
        </div>

        <div class="content">
          <!-- 用户信息卡片 -->
          <div class="card profile-user">
            <div class="flex items-center gap-md">
              <div class="profile-user__avatar">
                ${userInitial}
              </div>
              <div class="profile-user__info">
                <div class="profile-user__name">${Utils.escapeHtml(currentUser.displayName || currentUser.username)}</div>
                <div class="profile-user__username text-hint" style="font-size: var(--font-size-sm);">@${Utils.escapeHtml(currentUser.username)}</div>
              </div>
            </div>
          </div>

          <!-- 家庭组管理区域 -->
          <div class="section-header">
            <h3 class="section-header__title">我的家庭组</h3>
            <button class="section-header__action" id="btnCreateGroup">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              创建
            </button>
          </div>
          <div id="groupsList">
            ${groupsHtml}
          </div>

          <!-- 加入家庭组区域 -->
          <div class="section-header">
            <h3 class="section-header__title">加入家庭组</h3>
          </div>
          <div class="card">
            <div class="flex gap-sm">
              <input type="text" class="form-input flex-1" id="inviteCodeInput" 
                placeholder="请输入邀请码" maxlength="10" />
              <button class="btn btn--primary btn--sm" id="btnJoinGroup">加入</button>
            </div>
          </div>

          <!-- 设置区域（占位） -->
          <div class="section-header mt-lg">
            <h3 class="section-header__title">设置</h3>
          </div>
          <div class="card" style="padding: 0;">
            <div class="list-item">
              <div class="list-item__content">
                <span class="list-item__title">数据备份</span>
              </div>
              <div class="list-item__right">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="var(--text-hint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="list-item">
              <div class="list-item__content">
                <span class="list-item__title">清除缓存</span>
              </div>
              <div class="list-item__right">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="var(--text-hint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="list-item">
              <div class="list-item__content">
                <span class="list-item__title">关于</span>
              </div>
              <div class="list-item__right">
                <span class="text-hint" style="font-size: var(--font-size-xs);">v1.0.0</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="var(--text-hint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 退出登录按钮 -->
          <div class="mt-lg">
            <button class="btn btn--danger btn--block" id="btnLogout">
              退出登录
            </button>
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
          <a class="tab-bar__item" data-tab="records">
            <div class="tab-bar__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.8" fill="none"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.8" fill="none"/>
              </svg>
            </div>
            <span class="tab-bar__label">记录</span>
          </a>
          <a class="tab-bar__item tab-bar__item--active" data-tab="profile">
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
        /* 个人中心专属样式 */
        .profile-user {
          background: linear-gradient(135deg, var(--primary-lighter) 0%, var(--bg-primary) 100%);
        }
        .profile-user__avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background: var(--primary-gradient);
          color: var(--text-white);
          font-size: var(--font-size-xxl);
          font-weight: var(--font-weight-semibold);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .profile-user__info {
          flex: 1;
        }
        .profile-user__name {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
        }

        /* 家庭组卡片 */
        .card--group {
          cursor: pointer;
          transition: background var(--transition-fast), border-color var(--transition-fast);
          border: 1px solid transparent;
        }
        .card--group--active {
          border-color: var(--primary-light);
          background: linear-gradient(135deg, var(--primary-lighter) 0%, var(--bg-primary) 100%);
        }
        .card--group:active {
          background: var(--bg-tertiary);
        }
        .card--group__icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    `;
  },

  /**
   * 初始化个人中心页面事件绑定
   */
  init() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser) {
      window.location.hash = '#/login';
      return;
    }

    // 创建家庭组按钮
    const btnCreateGroup = document.getElementById('btnCreateGroup');
    if (btnCreateGroup) {
      btnCreateGroup.addEventListener('click', function () {
        // 使用自定义弹窗输入家庭组名称
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay modal-overlay--center';
        overlay.innerHTML = `
          <div class="modal">
            <div class="modal__header">
              <span class="modal__title">创建家庭组</span>
              <button class="modal__close modal-close-btn">&times;</button>
            </div>
            <div class="modal__body">
              <div class="form-group">
                <label class="form-label" for="newGroupName">家庭组名称</label>
                <input type="text" class="form-input" id="newGroupName" 
                  placeholder="请输入家庭组名称" maxlength="20" />
              </div>
              <div class="form-group">
                <label class="form-label" for="newGroupDesc">描述（选填）</label>
                <input type="text" class="form-input" id="newGroupDesc" 
                  placeholder="请输入描述" maxlength="50" />
              </div>
            </div>
            <div class="modal__footer">
              <button class="btn btn--secondary modal-cancel-btn">取消</button>
              <button class="btn btn--primary modal-confirm-btn">确定</button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);

        // 关闭弹窗
        const closeModal = () => {
          overlay.remove();
        };

        overlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        overlay.querySelector('.modal-cancel-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) closeModal();
        });

        // 确认创建
        overlay.querySelector('.modal-confirm-btn').addEventListener('click', function () {
          const groupName = overlay.querySelector('#newGroupName').value.trim();
          const groupDesc = overlay.querySelector('#newGroupDesc').value.trim();

          if (!groupName) {
            Toast.warning('请输入家庭组名称');
            return;
          }

          // 生成邀请码（6位随机大写字母+数字）
          const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const now = Utils.getToday();

          const newGroup = {
            id: Utils.generateId('group'),
            name: groupName,
            description: groupDesc,
            adminId: currentUser.id,
            members: [currentUser.id],
            inviteCode: inviteCode,
            createdAt: now,
            updatedAt: now
          };

          Storage.add(Storage.KEYS.GROUPS, newGroup);

          // 设置为当前家庭组
          Storage.setCurrentGroup(newGroup);

          closeModal();
          Toast.success('家庭组创建成功');
          // 重新渲染页面
          Utils.render(ProfilePage);
        });

        // 聚焦输入框
        setTimeout(() => {
          const nameInput = overlay.querySelector('#newGroupName');
          if (nameInput) nameInput.focus();
        }, 100);
      });
    }

    // 加入家庭组按钮
    const btnJoinGroup = document.getElementById('btnJoinGroup');
    if (btnJoinGroup) {
      btnJoinGroup.addEventListener('click', function () {
        const inviteCodeInput = document.getElementById('inviteCodeInput');
        const inviteCode = inviteCodeInput ? inviteCodeInput.value.trim().toUpperCase() : '';

        if (!inviteCode) {
          Toast.warning('请输入邀请码');
          return;
        }

        // 使用新的验证方法
        const validation = Storage.validateInviteCode(inviteCode);

        if (!validation.valid) {
          Toast.error(validation.reason || '邀请码无效');
          return;
        }

        const targetGroup = validation.group;
        const inviteCodeRecord = validation.inviteCode;

        // 检查是否已是该组成员
        if (targetGroup.members && targetGroup.members.includes(currentUser.id)) {
          Toast.warning('您已经是该家庭组的成员');
          return;
        }

        // 加入家庭组
        targetGroup.members.push(currentUser.id);
        targetGroup.updatedAt = Utils.getToday();
        Storage.update(Storage.KEYS.GROUPS, targetGroup.id, targetGroup);

        // 标记邀请码为已使用
        Storage.useInviteCode(inviteCodeRecord.id, currentUser.id);

        // 切换到该家庭组
        Storage.setCurrentGroup(targetGroup);

        Toast.success(`成功加入"${targetGroup.name}"`);
        // 重新渲染页面
        Utils.render(ProfilePage);
      });
    }

    // 家庭组卡片点击切换
    const groupsList = document.getElementById('groupsList');
    if (groupsList) {
      groupsList.addEventListener('click', function (e) {
        const card = e.target.closest('[data-group-id]');
        if (card) {
          const groupId = card.dataset.groupId;

          // 如果已经是当前组，不需要切换
          const currentGroup = Storage.getCurrentGroup();
          const currentGroupId = currentGroup ? currentGroup.id : null;
          if (groupId === currentGroupId) {
            // 跳转到首页
            window.location.hash = '#/home';
            return;
          }

          // 切换到选中的家庭组
          const allGroups = Storage.getAll(Storage.KEYS.GROUPS) || [];
          const selectedGroup = allGroups.find((g) => g.id === groupId);
          if (selectedGroup) {
            Storage.setCurrentGroup(selectedGroup);
          }
          Toast.success('已切换家庭组');
          window.location.hash = '#/home';
        }
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
            Storage.setCurrentGroup(null);
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
            window.location.hash = '#/home';
            break;
          case 'records':
            window.location.hash = '#/records';
            break;
          case 'profile':
            // 已经在个人中心，无需跳转
            break;
        }
      });
    }
  }
};
