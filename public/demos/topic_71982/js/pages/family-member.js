/**
 * 家庭成员管理页面模块
 * 支持添加、编辑、查看家庭成员详情
 * 根据URL参数判断当前模式：add(添加)、edit(编辑)、detail(详情)
 * 支持编辑权限控制：创建者可设置其他成员的编辑权限
 */
const FamilyMemberPage = {

  /**
   * 解析当前URL，判断页面模式
   * @returns {string} 'add' | 'edit' | 'detail'
   */
  _getMode() {
    const hash = window.location.hash;
    if (hash.includes('/add')) return 'add';
    if (hash.includes('/edit')) return 'edit';
    return 'detail';
  },

  /**
   * 解析URL中的查询参数
   * @returns {URLSearchParams}
   */
  _getParams() {
    const hash = window.location.hash;
    const queryPart = hash.split('?')[1] || '';
    return new URLSearchParams(queryPart);
  },

  /**
   * 检查用户是否可以编辑该家庭成员
   * @param {Object} member - 家庭成员对象
   * @param {Object} user - 当前用户对象
   * @returns {boolean}
   */
  _canEdit(member, user) {
    if (!member || !user) return false;
    const editableBy = member.editableBy || [];
    // 向后兼容：如果没有 editableBy 字段，则允许创建者编辑
    if (editableBy.length === 0 && member.createdBy === user.id) return true;
    return editableBy.includes(user.id);
  },

  /**
   * 检查用户是否为该家庭成员的创建者
   * @param {Object} member - 家庭成员对象
   * @param {Object} user - 当前用户对象
   * @returns {boolean}
   */
  _isCreator(member, user) {
    if (!member || !user) return false;
    return member.createdBy === user.id;
  },

  /**
   * 获取当前家庭组中所有用户（用于权限设置）
   * @returns {Array} 用户对象数组
   */
  _getGroupUsers() {
    const currentGroup = Storage.getCurrentGroup();
    if (!currentGroup) return [];
    const allUsers = Storage.getAll(Storage.KEYS.USERS) || [];
    const memberIds = currentGroup.members || [];
    return allUsers.filter(u => memberIds.includes(u.id));
  },

  /**
   * 渲染家庭成员页面
   * @returns {string} HTML字符串
   */
  render() {
    const mode = this._getMode();

    if (mode === 'detail') {
      return this._renderDetail();
    } else {
      return this._renderForm(mode);
    }
  },

  /**
   * 渲染表单页面（添加/编辑）
   * @param {string} mode - 'add' 或 'edit'
   * @returns {string} 表单HTML字符串
   */
  _renderForm(mode) {
    const isEdit = mode === 'edit';
    const title = isEdit ? '编辑家庭成员' : '添加家庭成员';
    const currentUser = Storage.getCurrentUser();

    // 编辑模式：加载已有数据填充表单
    let member = {};
    if (isEdit) {
      const params = this._getParams();
      const memberId = params.get('id');
      if (memberId) {
        member = Storage.getById(Storage.KEYS.MEMBERS, memberId) || {};
      }
    }

    // 构建关系下拉选项
    const relationships = [
      { value: 'father', label: '父亲' },
      { value: 'mother', label: '母亲' },
      { value: 'spouse', label: '配偶' },
      { value: 'son', label: '儿子' },
      { value: 'daughter', label: '女儿' },
      { value: 'grandfather', label: '祖父' },
      { value: 'grandmother', label: '祖母' },
      { value: 'self', label: '本人' },
      { value: 'other', label: '其他' }
    ];
    const relationshipOptions = relationships
      .map(
        (r) =>
          `<option value="${r.value}" ${member.relationship === r.value ? 'selected' : ''}>${r.label}</option>`
      )
      .join('');

    // 构建血型下拉选项
    const bloodTypes = [
      { value: 'A', label: 'A型' },
      { value: 'B', label: 'B型' },
      { value: 'AB', label: 'AB型' },
      { value: 'O', label: 'O型' }
    ];
    const bloodTypeOptions = bloodTypes
      .map(
        (b) =>
          `<option value="${b.value}" ${member.bloodType === b.value ? 'selected' : ''}>${b.label}</option>`
      )
      .join('');

    // 性别显示
    const genderText = member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : '--';
    const ageText = member.age || '--';

    // 权限设置区域（仅创建者在编辑模式可见）
    let permissionHtml = '';
    if (isEdit && this._isCreator(member, currentUser)) {
      const groupUsers = this._getGroupUsers();
      const editableBy = member.editableBy || [currentUser.id];
      const checkboxesHtml = groupUsers
        .map(u => {
          const checked = editableBy.includes(u.id) ? 'checked' : '';
          const disabled = u.id === currentUser.id ? 'disabled' : '';
          const displayName = Utils.escapeHtml(u.displayName || u.username);
          return `
            <label class="permission-checkbox">
              <input type="checkbox" name="editableBy" value="${u.id}" ${checked} ${disabled} />
              <span>${displayName}${u.id === currentUser.id ? '（我）' : ''}</span>
            </label>
          `;
        })
        .join('');

      permissionHtml = `
        <div class="form-group">
          <label class="form-label">编辑权限设置</label>
          <div class="permission-list">
            ${checkboxesHtml}
          </div>
          <small class="text-hint">勾选的用户可以编辑此家庭成员信息</small>
        </div>
      `;
    }

    return `
      <div class="page">
        <!-- 顶部导航 -->
        <div class="header">
          <div class="header__nav">
            <button class="header__back" id="btnBack">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header__title">${title}</div>
            <div class="header__action"></div>
          </div>
        </div>

        <div class="content">
          <form id="memberForm">
            <input type="hidden" id="memberId" value="${member.id || ''}" />

            <!-- 姓名 -->
            <div class="form-group">
              <label class="form-label" for="memberName">
                姓名 <span class="text-danger">*</span>
              </label>
              <input type="text" class="form-input" id="memberName" 
                placeholder="请输入姓名" value="${Utils.escapeHtml(member.name || '')}" required />
            </div>

            <!-- 身份证号 -->
            <div class="form-group">
              <label class="form-label" for="memberIdCard">身份证号</label>
              <input type="text" class="form-input" id="memberIdCard" 
                placeholder="请输入18位身份证号（选填）" 
                value="${Utils.escapeHtml(member.idCard || '')}" 
                maxlength="18" />
              <small class="text-hint">输入身份证号可自动解析出生日期和性别</small>
            </div>

            <!-- 自动解析显示区域 -->
            <div class="form-group">
              <div class="flex gap-md">
                <div class="flex-1">
                  <label class="form-label">年龄（自动计算）</label>
                  <div class="form-input" style="background: var(--bg-tertiary); color: var(--text-secondary);" id="autoAge">${ageText}</div>
                </div>
                <div class="flex-1">
                  <label class="form-label">性别（自动解析）</label>
                  <div class="form-input" style="background: var(--bg-tertiary); color: var(--text-secondary);" id="autoGender">${genderText}</div>
                </div>
              </div>
            </div>

            <!-- 关系 -->
            <div class="form-group">
              <label class="form-label" for="memberRelationship">关系</label>
              <select class="form-select" id="memberRelationship">
                <option value="">请选择</option>
                ${relationshipOptions}
              </select>
            </div>

            <!-- 联系电话 -->
            <div class="form-group">
              <label class="form-label" for="memberPhone">联系电话</label>
              <input type="tel" class="form-input" id="memberPhone" 
                placeholder="请输入联系电话" 
                value="${Utils.escapeHtml(member.phone || '')}" />
            </div>

            <!-- 血型 -->
            <div class="form-group">
              <label class="form-label" for="memberBloodType">血型</label>
              <select class="form-select" id="memberBloodType">
                <option value="">请选择</option>
                ${bloodTypeOptions}
              </select>
            </div>

            <!-- 过敏史 -->
            <div class="form-group">
              <label class="form-label" for="memberAllergy">过敏史</label>
              <textarea class="form-textarea" id="memberAllergy"
                placeholder="请输入过敏药物或物质（选填）">${Utils.escapeHtml(member.allergies || '')}</textarea>
            </div>

            <!-- 既往病史 -->
            <div class="form-group">
              <label class="form-label" for="memberMedicalHistory">既往病史</label>
              <textarea class="form-textarea" id="memberMedicalHistory" 
                placeholder="请输入既往病史（选填）">${Utils.escapeHtml(member.medicalHistory || '')}</textarea>
            </div>

            <!-- 权限设置 -->
            ${permissionHtml}

            <!-- 操作按钮 -->
            <div class="flex gap-md mt-lg">
              <button type="button" class="btn btn--secondary flex-1" id="btnCancel">取消</button>
              <button type="submit" class="btn btn--primary flex-1" id="btnSave">保存</button>
            </div>
          </form>
        </div>
      </div>

      <style>
        .permission-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }
        .permission-checkbox {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
          font-size: var(--font-size-md);
          color: var(--text-primary);
        }
        .permission-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
          cursor: pointer;
        }
      </style>
    `;
  },

  /**
   * 渲染详情页面
   * @returns {string} 详情页HTML字符串
   */
  _renderDetail() {
    const params = this._getParams();
    const memberId = params.get('id');
    const member = Storage.getById(Storage.KEYS.MEMBERS, memberId);
    const currentUser = Storage.getCurrentUser();

    if (!member) {
      return `
        <div class="page">
          <div class="header">
            <div class="header__nav">
              <button class="header__back" id="btnBack">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="header__title">成员详情</div>
              <div class="header__action"></div>
            </div>
          </div>
          <div class="content">
            <div class="empty-state">
              <div class="empty-state__icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="30" r="12" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
                  <path d="M16 68c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="var(--text-hint)" stroke-width="2" fill="none"/>
                </svg>
              </div>
              <p class="empty-state__text">未找到该家庭成员</p>
            </div>
          </div>
        </div>
      `;
    }

    // 权限检查
    const canEdit = this._canEdit(member, currentUser);
    const isCreator = this._isCreator(member, currentUser);

    // 构建头部操作按钮
    let headerActions = '';
    if (isCreator) {
      headerActions += `
        <button class="header__action" id="btnPermission" title="权限设置">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 15v-2m-6 4h12M6.21 6.21C4.37 8.05 3.5 10.5 3.5 12c0 3.87 3.13 7 7 7h3c3.87 0 7-3.13 7-7 0-1.5-.87-3.95-2.71-5.79M12 3v4m0 0l-2-2m2 2l2-2" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="7" y="13" width="10" height="7" rx="1.5" stroke="var(--text-secondary)" stroke-width="1.5" fill="none"/>
            <path d="M10 13v-2a2 2 0 014 0v2" stroke="var(--text-secondary)" stroke-width="1.5" fill="none"/>
          </svg>
        </button>
      `;
    }
    if (canEdit) {
      headerActions += `
        <button class="header__action" id="btnEdit" title="编辑">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="var(--text-secondary)" stroke-width="2" fill="none"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="var(--text-secondary)" stroke-width="2" fill="none"/>
          </svg>
        </button>
      `;
    }

    // 构建详细信息
    const genderText = member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : '--';
    const relationshipText = member.relationship ? Utils.getRelationshipText(member.relationship) : '--';
    const bloodTypeText = member.bloodType ? Utils.getBloodTypeText(member.bloodType) : '--';

    // 获取关联的看病记录
    const records = Storage.getAll(Storage.KEYS.MEDICAL_RECORDS) || [];
    const memberRecords = records
      .filter((r) => r.memberId === member.id)
      .sort((a, b) => (b.visitDate || '').localeCompare(a.visitDate || ''));

    // 构建看病记录列表
    let recordsHtml = '';
    if (memberRecords.length > 0) {
      recordsHtml = memberRecords
        .map((record) => `
          <div class="card card--record" data-record-id="${record.id}">
            <div class="card__header">
              <span class="card__title">${Utils.escapeHtml(record.diagnosis || '未诊断')}</span>
              <small class="text-hint">${Utils.formatDate(record.visitDate)}</small>
            </div>
            <div class="card__body">
              <div class="flex gap-sm">
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
          <p class="empty-state__text">暂无看病记录</p>
        </div>
      `;
    }

    // 权限信息展示
    const editableBy = member.editableBy || [];
    const allUsers = Storage.getAll(Storage.KEYS.USERS) || [];
    const editorNames = editableBy
      .map(uid => {
        const u = allUsers.find(usr => usr.id === uid);
        return u ? (u.displayName || u.username) : uid;
      })
      .join('、');

    return `
      <div class="page">
        <!-- 顶部导航 -->
        <div class="header">
          <div class="header__nav">
            <button class="header__back" id="btnBack">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="header__title">${Utils.escapeHtml(member.name)}</div>
            <div class="flex items-center gap-sm">${headerActions}</div>
          </div>
        </div>

        <div class="content">
          <!-- 成员头像和基本信息概览 -->
          <div class="card member-detail-summary">
            <div class="flex items-center gap-md">
              <div class="list-item__avatar" style="width: 56px; height: 56px; font-size: var(--font-size-xl);">
                ${member.name ? member.name.charAt(0) : '?'}
              </div>
              <div class="member-detail-summary__info">
                <div class="flex items-center gap-sm flex-wrap">
                  <span class="tag tag--relationship">${relationshipText}</span>
                  <span class="text-secondary">${genderText}</span>
                  <span class="text-secondary">${member.age ? member.age + '岁' : '--'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 权限信息 -->
          <div class="card permission-info-card">
            <div class="info-row">
              <span class="info-row__label">可编辑人员</span>
              <span class="info-row__value">${Utils.escapeHtml(editorNames || '无')}</span>
            </div>
          </div>

          <!-- 详细信息区域 -->
          <div class="card">
            <div class="info-row">
              <span class="info-row__label">联系电话</span>
              <span class="info-row__value">${Utils.escapeHtml(member.phone || '--')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">血型</span>
              <span class="info-row__value">${bloodTypeText}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">过敏史</span>
              <span class="info-row__value">${Utils.escapeHtml(member.allergies || '无')}</span>
            </div>
            <div class="info-row">
              <span class="info-row__label">既往病史</span>
              <span class="info-row__value">${Utils.escapeHtml(member.medicalHistory || '无')}</span>
            </div>
          </div>

          <!-- 看病记录区域 -->
          <div class="section-header">
            <h3 class="section-header__title">看病记录</h3>
            <button class="section-header__action" id="btnAddRecord">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              添加
            </button>
          </div>
          <div id="memberRecordsList">
            ${recordsHtml}
          </div>
        </div>
      </div>

      <style>
        .member-detail-summary {
          background: linear-gradient(135deg, var(--primary-lighter) 0%, var(--bg-primary) 100%);
        }
        .member-detail-summary__info {
          flex: 1;
        }
        .card--record {
          cursor: pointer;
        }
        .card--record:active {
          background: var(--bg-tertiary);
        }
        .permission-info-card {
          background: var(--bg-secondary);
        }
        .permission-info-card .info-row__value {
          color: var(--primary);
          font-weight: var(--font-weight-medium);
        }
      </style>
    `;
  },

  /**
   * 初始化家庭成员页面事件绑定
   */
  init() {
    const mode = this._getMode();

    if (mode === 'detail') {
      this._initDetail();
    } else {
      this._initForm();
    }

    // 绑定返回按钮（通用）
    const btnBack = document.getElementById('btnBack');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        window.history.back();
      });
    }
  },

  /**
   * 初始化表单页面事件
   */
  _initForm() {
    const currentUser = Storage.getCurrentUser();
    const form = document.getElementById('memberForm');
    const idCardInput = document.getElementById('memberIdCard');
    const existingId = document.getElementById('memberId').value;

    // 编辑模式：检查权限
    if (existingId) {
      const member = Storage.getById(Storage.KEYS.MEMBERS, existingId);
      if (member && !this._canEdit(member, currentUser)) {
        Toast.warning('您没有编辑此家庭成员的权限');
        setTimeout(() => {
          window.location.hash = `#/family-member/detail?id=${existingId}`;
        }, 800);
        return;
      }
    }

    // 身份证号自动解析
    if (idCardInput) {
      idCardInput.addEventListener('blur', function () {
        const idCard = this.value.trim();
        if (idCard.length === 18 && Utils.isValidIdCard(idCard)) {
          const birthDate = Utils.extractBirthDate(idCard);
          const gender = Utils.extractGender(idCard);
          const age = Utils.calculateAge(birthDate);

          document.getElementById('autoAge').textContent = age || '--';
          document.getElementById('autoGender').textContent =
            gender === 'male' ? '男' : gender === 'female' ? '女' : '--';
        } else if (idCard.length > 0 && idCard.length !== 18) {
          Toast.warning('请输入18位有效身份证号');
        }
      });
    }

    // 表单提交保存
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('memberName').value.trim();
        if (!name) {
          Toast.warning('请输入姓名');
          return;
        }

        // 收集表单数据
        const idCard = document.getElementById('memberIdCard').value.trim();
        const relationship = document.getElementById('memberRelationship').value;
        const phone = document.getElementById('memberPhone').value.trim();
        const bloodType = document.getElementById('memberBloodType').value;
        const allergies = document.getElementById('memberAllergy').value.trim();
        const medicalHistory = document.getElementById('memberMedicalHistory').value.trim();

        // 解析身份证信息
        let age = null;
        let gender = null;
        let birthDate = null;
        if (idCard.length === 18 && Utils.isValidIdCard(idCard)) {
          birthDate = Utils.extractBirthDate(idCard);
          gender = Utils.extractGender(idCard);
          age = Utils.calculateAge(birthDate);
        }

        const currentGroup = Storage.getCurrentGroup();
        const currentGroupId = currentGroup ? currentGroup.id : '';
        const now = Utils.getToday();

        if (existingId) {
          // 编辑模式：更新已有记录
          const member = Storage.getById(Storage.KEYS.MEMBERS, existingId);
          if (member) {
            // 再次检查权限
            if (!this._canEdit(member, currentUser)) {
              Toast.warning('您没有编辑此家庭成员的权限');
              return;
            }

            const updatedMember = {
              ...member,
              name,
              idCard,
              age,
              gender,
              birthDate,
              relationship,
              phone,
              bloodType,
              allergies,
              medicalHistory,
              updatedAt: now
            };

            // 如果当前用户是创建者，更新权限设置
            if (this._isCreator(member, currentUser)) {
              const checkboxes = document.querySelectorAll('input[name="editableBy"]:checked');
              const editableBy = Array.from(checkboxes).map(cb => cb.value);
              // 确保创建者始终在列表中
              if (!editableBy.includes(currentUser.id)) {
                editableBy.push(currentUser.id);
              }
              updatedMember.editableBy = editableBy;
            }

            Storage.update(Storage.KEYS.MEMBERS, existingId, updatedMember);
            Toast.success('家庭成员信息已更新');
            window.location.hash = `#/family-member/detail?id=${existingId}`;
          }
        } else {
          // 添加模式：创建新记录
          const newMember = {
            id: Utils.generateId('member'),
            groupId: currentGroupId,
            name,
            idCard,
            age,
            gender,
            birthDate,
            relationship,
            phone,
            bloodType,
            allergies,
            medicalHistory,
            createdBy: currentUser.id,
            editableBy: [currentUser.id],
            createdAt: now,
            updatedAt: now
          };
          Storage.add(Storage.KEYS.MEMBERS, newMember);
          Toast.success('家庭成员添加成功');
          window.location.hash = '#/home';
        }
      });
    }

    // 取消按钮
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', function () {
        window.history.back();
      });
    }
  },

  /**
   * 初始化详情页面事件
   */
  _initDetail() {
    const params = this._getParams();
    const memberId = params.get('id');

    // 编辑按钮
    const btnEdit = document.getElementById('btnEdit');
    if (btnEdit) {
      btnEdit.addEventListener('click', function () {
        window.location.hash = `#/family-member/edit?id=${memberId}`;
      });
    }

    // 权限设置按钮
    const btnPermission = document.getElementById('btnPermission');
    if (btnPermission) {
      btnPermission.addEventListener('click', () => {
        this._showPermissionModal(memberId);
      });
    }

    // 添加看病记录按钮
    const btnAddRecord = document.getElementById('btnAddRecord');
    if (btnAddRecord) {
      btnAddRecord.addEventListener('click', function () {
        window.location.hash = `#/medical-record/add?memberId=${memberId}`;
      });
    }

    // 看病记录卡片点击
    const recordsList = document.getElementById('memberRecordsList');
    if (recordsList) {
      recordsList.addEventListener('click', function (e) {
        const card = e.target.closest('[data-record-id]');
        if (card) {
          const recordId = card.dataset.recordId;
          window.location.hash = `#/medical-record/detail?id=${recordId}`;
        }
      });
    }
  },

  /**
   * 显示权限设置弹窗
   * @param {string} memberId - 家庭成员ID
   */
  _showPermissionModal(memberId) {
    const member = Storage.getById(Storage.KEYS.MEMBERS, memberId);
    if (!member) return;

    const currentUser = Storage.getCurrentUser();
    if (!this._isCreator(member, currentUser)) {
      Toast.warning('只有创建者可以设置权限');
      return;
    }

    const groupUsers = this._getGroupUsers();
    const editableBy = member.editableBy || [currentUser.id];

    const checkboxesHtml = groupUsers
      .map(u => {
        const checked = editableBy.includes(u.id) ? 'checked' : '';
        const disabled = u.id === currentUser.id ? 'disabled' : '';
        const displayName = Utils.escapeHtml(u.displayName || u.username);
        return `
          <label style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 0;
            cursor: pointer;
            font-size: 15px;
            color: #333;
          ">
            <input type="checkbox" class="perm-checkbox" data-uid="${u.id}" 
              ${checked} ${disabled} 
              style="width: 18px; height: 18px; accent-color: #4a90d9; cursor: pointer;" />
            <span>${displayName}${u.id === currentUser.id ? '（我，不可取消）' : ''}</span>
          </label>
        `;
      })
      .join('');

    const content = `
      <div style="margin-bottom: 12px; font-size: 13px; color: #888;">
        勾选可以编辑此家庭成员的用户
      </div>
      <div style="max-height: 240px; overflow-y: auto;">
        ${checkboxesHtml}
      </div>
    `;

    Modal.custom({
      title: `权限设置 - ${Utils.escapeHtml(member.name)}`,
      content: content,
      confirmText: '保存',
      cancelText: '取消',
      onConfirm: () => {
        const checkboxes = document.querySelectorAll('.perm-checkbox:checked');
        const newEditableBy = Array.from(checkboxes).map(cb => cb.dataset.uid);
        // 确保创建者始终在列表中
        if (!newEditableBy.includes(currentUser.id)) {
          newEditableBy.push(currentUser.id);
        }
        Storage.update(Storage.KEYS.MEMBERS, memberId, {
          editableBy: newEditableBy
        });
        Toast.success('权限设置已保存');
        // 刷新详情页
        Utils.render(FamilyMemberPage);
      }
    });
  }
};
