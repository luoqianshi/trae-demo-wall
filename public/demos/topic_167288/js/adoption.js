// ===== 领养页逻辑（全局对象 AdoptionPage）=====

// 示例数据（demo 展示用，真实数据为空或加载失败时作为兜底显示）
const MOCK_PETS = [
  { id: 'mock1', name: '小橘', type: 'cat', icon: '🐱', gender: '♀', breed: '橘猫', age: '约1岁', weight: '3.5kg', tags: ['已绝育', '已疫苗', '已驱虫'], images: [], desc: '性格超亲人的橘猫，救助时瘦骨嶙峋，现在已恢复健康。会翻肚皮求摸摸，爱踩奶，不挑食。', requirements: ['有稳定住所', '科学喂养', '定期回访', '不弃养'], location: '位置待确认', urgent: false, applicants: 5, minPoints: 2000, status: 'available', ownerId: 'mock_owner_1', ownerName: '爱心救助站', ownerAvatar: '🏠', createdAt: Date.now() - 3 * 3600000, isMock: true },
  { id: 'mock2', name: '大黄', type: 'dog', icon: '🐶', gender: '♂', breed: '中华田园犬', age: '约2岁', weight: '15kg', tags: ['已绝育', '已疫苗', '需大运动量'], images: [], desc: '中华田园犬，被遗弃在公园。性格温顺，会和小孩玩耍。需要每天至少1小时户外运动。', requirements: ['有稳定住所', '每天1小时运动', '定期回访', '不弃养'], location: '位置待确认', urgent: false, applicants: 8, minPoints: 2000, status: 'available', ownerId: 'mock_owner_2', ownerName: '流浪动物之家', ownerAvatar: '🏠', createdAt: Date.now() - 5 * 3600000, isMock: true },
  { id: 'mock3', name: '球球', type: 'cat', icon: '🤍', gender: '♀', breed: '白猫', age: '约8个月', weight: '2.8kg', tags: ['已绝育', '已疫苗', '胆小需耐心'], images: [], desc: '白猫，救助时在下雨天躲在车底。比较胆小，需要耐心相处，熟悉后很黏人。', requirements: ['有稳定住所', '耐心相处', '定期回访', '不弃养'], location: '位置待确认', urgent: true, applicants: 3, minPoints: 1500, status: 'available', ownerId: 'mock_owner_3', ownerName: '喵星救援', ownerAvatar: '🏠', createdAt: Date.now() - 86400000, isMock: true },
  { id: 'mock4', name: '豆豆', type: 'dog', icon: '🐕', gender: '♂', breed: '柴犬混血', age: '约3岁', weight: '12kg', tags: ['已绝育', '已疫苗', '适合有院子'], images: [], desc: '柴犬混血，活泼好动。主人移居海外无法带走，希望找有院子的家庭。', requirements: ['有院子', '有养狗经验', '定期回访', '不弃养'], location: '位置待确认', urgent: false, applicants: 6, minPoints: 2000, status: 'available', ownerId: 'mock_owner_4', ownerName: '宠物转运站', ownerAvatar: '🏠', createdAt: Date.now() - 2 * 86400000, isMock: true },
  { id: 'mock5', name: '团子', type: 'other', icon: '🐰', gender: '♀', breed: '熊猫兔', age: '约1岁', weight: '1.5kg', tags: ['健康', '需要笼子'], images: [], desc: '被遗弃的兔子，黑白花色。已体检健康，需要准备合适笼子和干草。', requirements: ['有合适笼子', '科学喂养', '不弃养'], location: '位置待确认', urgent: false, applicants: 2, minPoints: 1000, status: 'available', ownerId: 'mock_owner_5', ownerName: '小动物救助', ownerAvatar: '🏠', createdAt: Date.now() - 3 * 86400000, isMock: true }
]

const AdoptionPage = {
  currentFilter: 'all',   // 当前筛选条件
  list: [],               // 当前列表数据
  currentDetail: null,    // 当前详情数据（预取缓存）

  // 类型对应 emoji
  ICON_MAP: { cat: '🐱', dog: '🐶', other: '🐰' },

  // 6 项申请确认项（key 用于提交 confirmations 对象，与小程序对齐）
  APPLY_CHECKS: [
    { key: 'adult', text: '我已年满18岁' },
    { key: 'housing', text: '我有稳定的住所' },
    { key: 'income', text: '我有稳定的经济来源' },
    { key: 'agreement', text: '我同意签订领养协议' },
    { key: 'revisit', text: '我同意定期回访' },
    { key: 'noAbandon', text: '我承诺不弃养、不虐待' }
  ],

  // 初始化：渲染列表页框架到 #page-adoption
  init() {
    this.renderListPage()
    this.bindListEvents()
  },

  // 页面显示时刷新列表
  onShow() {
    this.loadList()
  },

  // 渲染列表页静态框架
  renderListPage() {
    const el = document.getElementById('page-adoption')
    el.innerHTML = `
      <div class="adoption-header">
        <div class="adoption-title">领养中心</div>
        <div class="adoption-subtitle">每一只生命都值得被爱 · 积分越高优先领养</div>
      </div>
      <div class="chips-row" id="adoptionChips">
        <div class="chip active" data-filter="all">全部</div>
        <div class="chip" data-filter="cat">🐱 猫咪</div>
        <div class="chip" data-filter="dog">🐶 狗狗</div>
        <div class="chip" data-filter="other">🐰 其他</div>
        <div class="chip urgent" data-filter="urgent">🆘 紧急</div>
      </div>
      <div class="adoption-list" id="adoptionList"></div>
    `
  },

  // 绑定列表页事件
  bindListEvents() {
    const chips = document.getElementById('adoptionChips')
    if (!chips) return
    chips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip')
      if (!chip) return
      this.currentFilter = chip.dataset.filter
      chips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      this.loadList()
    })

    // 卡片点击委托
    const listEl = document.getElementById('adoptionList')
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const card = e.target.closest('.adoption-card')
        if (!card) return
        this.openDetail(card.dataset.id)
      })
    }
  },

  // 加载列表数据
  async loadList() {
    const listEl = document.getElementById('adoptionList')
    if (!listEl) return
    listEl.innerHTML = `
      <div class="adoption-loading">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    `
    const params = {}
    if (this.currentFilter === 'urgent') params.urgent = true
    else if (this.currentFilter !== 'all') params.type = this.currentFilter

    try {
      const realList = await API.getAdoptionList(params) || []
      // 真实数据在前，示例数据在后（按当前筛选条件过滤 mock）
      const filteredMock = this._filterMockData(MOCK_PETS, this.currentFilter)
      this.list = realList.concat(filteredMock)
      this.renderList()
    } catch (err) {
      console.error('加载领养列表失败', err)
      // 加载失败时仅显示示例数据
      this.list = this._filterMockData(MOCK_PETS, this.currentFilter)
      this.renderList()
    }
  },

  // 按筛选条件过滤示例数据
  _filterMockData(list, filter) {
    switch (filter) {
      case 'cat': return list.filter(p => p.type === 'cat')
      case 'dog': return list.filter(p => p.type === 'dog')
      case 'other': return list.filter(p => p.type === 'other')
      case 'urgent': return list.filter(p => p.urgent)
      default: return list.slice()
    }
  },

  // 渲染列表
  renderList() {
    const listEl = document.getElementById('adoptionList')
    if (!listEl) return
    if (!this.list.length) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🐾</div>
          <div class="empty-text">暂无领养信息</div>
        </div>
      `
      return
    }
    listEl.innerHTML = this.list.map(item => this.renderCard(item)).join('')
  },

  // 渲染单条卡片
  renderCard(item) {
    const icon = this.getIcon(item.type)
    const tagsHtml = (item.tags || []).map(t => `<span class="tag tag-gray">${t}</span>`).join('')
    const badgesHtml = []
    if (item.isMock) badgesHtml.push(`<span class="badge tag-gray">示例</span>`)
    const isUrgent = item.isUrgent || item.urgent
    if (isUrgent) badgesHtml.push(`<span class="badge tag-red">紧急</span>`)
    const genderTag = item.gender
      ? `<span class="tag ${item.gender === '♀' ? 'tag-red' : 'tag-blue'}">${item.gender}</span>`
      : ''
    // 积分要求标签（minPoints > 0 时显示）
    const pointsTag = item.minPoints > 0
      ? `<span class="tag tag-orange">⭐ 积分≥${item.minPoints}</span>`
      : ''
    const applicantCount = item.applicantCount || item.applicants || 0
    return `
      <div class="adoption-card ${isUrgent ? 'urgent' : ''}" data-id="${item.id}">
        ${badgesHtml.length ? `<div class="adoption-card-badge">${badgesHtml.join('')}</div>` : ''}
        <div class="adoption-card-icon ${isUrgent ? 'urgent' : ''}">${icon}</div>
        <div class="adoption-card-body">
          <div class="adoption-card-title">
            ${item.name}
            <span class="adoption-card-breed">${item.breed || ''}</span>
          </div>
          <div class="adoption-card-tags">
            ${genderTag}
            ${item.age ? `<span class="tag tag-primary">${item.age}</span>` : ''}
            ${tagsHtml}
            ${pointsTag}
          </div>
          ${item.desc ? `<div class="adoption-card-desc" style="font-size:13px;color:var(--text-3);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${item.desc}</div>` : ''}
          <div class="adoption-card-meta">
            ${item.location ? `<span class="adoption-card-meta-item">📍 ${item.location}</span>` : ''}
            <span class="adoption-card-meta-item">🕐 ${Util.timeAgo(item.createdAt)}</span>
            <span class="adoption-card-meta-item">👥 ${applicantCount} 人申请</span>
          </div>
        </div>
      </div>
    `
  },

  // 打开详情子页面（异步预取数据后渲染）
  async openDetail(id) {
    // mock 数据：直接使用本地示例数据
    if (id && typeof id === 'string' && id.startsWith('mock')) {
      const detail = MOCK_PETS.find(p => p.id === id)
      if (!detail) {
        Util.toast('该领养信息不存在')
        return
      }
      this.currentDetail = detail
      App.openSubPage(() => this.renderDetail(id))
      this.bindDetailEvents(detail)
      return
    }

    Util.showLoading()
    try {
      const detail = await API.getAdoptionById(id)
      Util.hideLoading()
      if (!detail) {
        Util.toast('该领养信息不存在')
        return
      }
      this.currentDetail = detail
      App.openSubPage(() => this.renderDetail(id))
      this.bindDetailEvents(detail)
    } catch (err) {
      Util.hideLoading()
      console.error('加载详情失败', err)
      Util.toast('加载详情失败')
    }
  },

  // 渲染详情子页面 HTML 字符串（使用预取的 currentDetail）
  renderDetail(id) {
    const item = this.currentDetail
    if (!item) return '<div class="empty-state"><div class="empty-text">信息不存在</div></div>'
    const icon = this.getIcon(item.type)
    const isAvailable = item.status === 'available'
    const isUrgent = item.isUrgent || item.urgent
    const hasImages = item.images && item.images.length > 0
    const applicantCount = item.applicantCount || item.applicants || 0

    // 图片区：有图片显示轮播，否则大 emoji 占位
    const galleryHtml = hasImages
      ? item.images.map(src => `<img class="gallery-img" src="${src}" alt="">`).join('')
      : icon
    const galleryClass = hasImages ? 'adoption-detail-gallery' : 'adoption-detail-gallery emoji-gallery'

    // 状态标记
    const statusHtml = !isAvailable
      ? `<span class="badge tag-red adoption-detail-status">已被领养</span>`
      : (isUrgent ? `<span class="badge tag-red adoption-detail-status">紧急</span>` : '')

    // 标签
    const tagsHtml = (item.tags || []).map(t => `<span class="tag tag-gray">${t}</span>`).join('')
    const genderTag = item.gender
      ? `<span class="tag ${item.gender === '♀' ? 'tag-red' : 'tag-blue'}">${item.gender}</span>`
      : ''

    // 领养要求
    const requirementsHtml = (item.requirements || []).map(r =>
      `<div class="requirement-item"><span class="requirement-check">✓</span><span>${r}</span></div>`
    ).join('')

    // 底部操作栏：不可领养时显示提示；可领养时含收藏/联系/申请按钮
    const actionBarHtml = isAvailable
      ? `
        <div class="detail-action-bar">
          <button class="btn btn-outline" id="favBtn" style="flex:0 0 auto;padding:12px 14px;"><span id="favIcon">♡</span> <span id="favText">收藏</span></button>
          <button class="btn btn-outline btn-contact" id="contactBtn" title="联系送养人">💬</button>
          <button class="btn btn-primary" id="applyBtn">申请领养</button>
        </div>
      `
      : `<div class="detail-adopted-tip">该宠物已被领养 🏠</div>`

    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">领养详情</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content">
        <div class="${galleryClass}">${galleryHtml}</div>
        ${statusHtml}
        <div class="adoption-detail-content">
          <!-- 宠物信息卡 -->
          <div class="card detail-info-card">
            <div class="detail-info-head">
              <span class="detail-info-name">${item.name}</span>
              ${item.breed ? `<span class="tag tag-primary">${item.breed}</span>` : ''}
              ${item.isMock ? `<span class="badge tag-gray">示例</span>` : ''}
            </div>
            <div class="detail-info-row">
              ${genderTag}
              ${item.age ? `<span class="tag tag-primary">${item.age}</span>` : ''}
              ${tagsHtml}
            </div>
            <div class="detail-meta-list">
              ${item.weight ? `<span class="meta-item"><span class="meta-label">体重:</span> ${item.weight}</span>` : ''}
              ${item.location ? `<span class="meta-item"><span class="meta-label">📍 位置:</span> ${item.location}</span>` : ''}
              <span class="meta-item"><span class="meta-label">发布:</span> ${Util.timeAgo(item.createdAt)}</span>
              <span class="meta-item"><span class="meta-label">👥 申请:</span> ${applicantCount} 人</span>
            </div>
            ${item.minPoints ? `<div class="detail-points">⭐ 需 ${item.minPoints} 友善积分</div>` : ''}
          </div>

          <!-- 领养要求 -->
          ${requirementsHtml ? `
            <div class="detail-section">
              <div class="detail-section-title">📋 领养要求</div>
              <div class="requirement-list">${requirementsHtml}</div>
            </div>
          ` : ''}

          <!-- 宠物故事 -->
          ${item.desc ? `
            <div class="detail-section">
              <div class="detail-section-title">📖 宠物故事</div>
              <div class="detail-story-text">${item.desc}</div>
            </div>
          ` : ''}

          <!-- 送养人信息 -->
          <div class="detail-section">
            <div class="detail-section-title">👤 送养人</div>
            <div class="detail-owner">
              <div class="detail-owner-avatar">${item.ownerAvatar || '🏠'}</div>
              <div class="detail-owner-info">
                <div class="detail-owner-name">${item.ownerName || '匿名送养人'}</div>
                <div class="detail-owner-desc">希望为它找到温暖的家</div>
                <div class="detail-owner-desc">发布于 ${Util.timeAgo(item.createdAt)}</div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏（position:relative 跟随滚动） -->
          ${actionBarHtml}
        </div>
      </div>
      ${this.renderApplyModal(item, icon)}
      <div class="bottom-sheet-mask" id="applyMask"></div>
    `
  },

  // 渲染申请领养弹窗
  renderApplyModal(item, icon) {
    const checksHtml = this.APPLY_CHECKS.map(c =>
      `<label class="apply-check-item">
        <input type="checkbox" class="apply-check-input" data-key="${c.key}">
        <span class="apply-check-box"></span>
        <span class="apply-check-text">${c.text}</span>
      </label>`
    ).join('')
    // 积分提示
    const pointsTip = item.minPoints > 0
      ? `<div class="detail-points" style="margin:0 0 14px;">⭐ 领养此宠物需要 ${item.minPoints} 积分</div>`
      : ''
    // 动态 placeholder
    const placeholder = `给${item.name}的送养人留个言吧...`
    return `
      <div class="center-modal apply-modal" id="applyModal">
        <div class="apply-modal-header">
          <span class="apply-modal-title">申请领养</span>
          <span class="sheet-close" id="applyCloseBtn">✕</span>
        </div>
        <div class="apply-modal-body">
          ${pointsTip}
          <div class="apply-pet-info">
            <div class="apply-pet-icon">${icon}</div>
            <div>
              <div class="apply-pet-name">${item.name}</div>
              <div class="apply-pet-desc">${item.breed || ''} · ${item.location || ''}</div>
            </div>
          </div>
          <div class="apply-check-list">${checksHtml}</div>
          <div class="form-group">
            <label class="form-label">给送养人的留言</label>
            <textarea class="form-textarea" id="applyMessage" maxlength="200" placeholder="${placeholder}"></textarea>
            <div id="applyMessageCounter" style="text-align:right;font-size:12px;color:var(--text-3);margin-top:4px;">0/200</div>
          </div>
        </div>
        <div class="apply-modal-footer">
          <button class="btn btn-primary btn-block" id="applySubmitBtn" disabled>提交申请</button>
        </div>
      </div>
    `
  },

  // 绑定详情页事件
  bindDetailEvents(item) {
    // 收藏按钮（底部操作栏内，图标+文字）
    const favBtn = document.getElementById('favBtn')
    if (favBtn) {
      let favorited = false
      favBtn.addEventListener('click', () => {
        favorited = !favorited
        const favIcon = document.getElementById('favIcon')
        const favText = document.getElementById('favText')
        if (favIcon) favIcon.textContent = favorited ? '❤️' : '♡'
        if (favText) favText.textContent = favorited ? '已收藏' : '收藏'
        Util.toast(favorited ? '已收藏' : '已取消收藏')
      })
    }

    // 联系送养人 -> 跳转聊天
    const contactBtn = document.getElementById('contactBtn')
    if (contactBtn) {
      contactBtn.addEventListener('click', () => {
        const otherId = item.ownerId
        if (typeof ChatPage === 'undefined' || !ChatPage.render) {
          Util.toast('聊天功能加载中')
          return
        }
        App.openSubPage(() => ChatPage.render(otherId))
      })
    }

    // 申请领养弹窗
    const applyBtn = document.getElementById('applyBtn')
    const applyModal = document.getElementById('applyModal')
    const applyMask = document.getElementById('applyMask')
    const applyCloseBtn = document.getElementById('applyCloseBtn')

    if (applyBtn && applyModal) {
      applyBtn.addEventListener('click', () => this.showApplyModal(applyModal, applyMask))
    }
    if (applyCloseBtn) {
      applyCloseBtn.addEventListener('click', () => this.hideApplyModal(applyModal, applyMask))
    }
    if (applyMask) {
      applyMask.addEventListener('click', () => this.hideApplyModal(applyModal, applyMask))
    }

    // 确认项勾选 -> 联动提交按钮 disabled 状态
    const checks = document.querySelectorAll('.apply-check-input')
    const submitBtn = document.getElementById('applySubmitBtn')
    const updateSubmitState = () => {
      let allChecked = true
      checks.forEach(c => { if (!c.checked) allChecked = false })
      if (submitBtn) submitBtn.disabled = !allChecked
    }
    checks.forEach(c => c.addEventListener('change', updateSubmitState))

    // 留言字数计数
    const msg = document.getElementById('applyMessage')
    const counter = document.getElementById('applyMessageCounter')
    if (msg && counter) {
      msg.addEventListener('input', () => {
        counter.textContent = msg.value.length + '/200'
      })
    }

    // 提交申请
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.submitApply(item, applyModal, applyMask))
    }
  },

  // 显示申请弹窗
  showApplyModal(modal, mask) {
    modal.classList.add('show')
    mask.classList.add('show')
  },

  // 隐藏申请弹窗
  hideApplyModal(modal, mask) {
    modal.classList.remove('show')
    mask.classList.remove('show')
  },

  // 提交领养申请
  async submitApply(item, modal, mask) {
    // 校验 6 项确认是否全部勾选
    const checks = document.querySelectorAll('.apply-check-input')
    const confirmations = {}
    let allChecked = true
    checks.forEach(c => {
      confirmations[c.dataset.key] = c.checked
      if (!c.checked) allChecked = false
    })
    if (!allChecked) {
      Util.toast('请先确认全部领养承诺')
      return
    }

    const message = (document.getElementById('applyMessage') || {}).value || ''
    const submitBtn = document.getElementById('applySubmitBtn')
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.textContent = '提交中...'
    }
    try {
      const res = await API.applyAdoption(item.id, message, confirmations)
      if (res && res.success) {
        this.hideApplyModal(modal, mask)
        Util.toast('申请已提交，等待送养人审核 🎉')
        // 刷新本地缓存数据中的申请人数
        this.currentDetail.applicantCount = (this.currentDetail.applicantCount || 0) + 1
      } else {
        // 重复申请等错误提示（如：您已申请过该领养）
        Util.toast((res && res.message) ? res.message : '提交失败，请重试')
      }
    } catch (err) {
      console.error('提交申请失败', err)
      Util.toast('提交失败，请重试')
    } finally {
      if (submitBtn) {
        // 恢复按钮：根据勾选情况决定是否可点击
        let allCheckedRestore = true
        checks.forEach(c => { if (!c.checked) allCheckedRestore = false })
        submitBtn.disabled = !allCheckedRestore
        submitBtn.textContent = '提交申请'
      }
    }
  },

  // 获取类型对应 emoji
  getIcon(type) {
    return this.ICON_MAP[type] || '🐾'
  }
}
