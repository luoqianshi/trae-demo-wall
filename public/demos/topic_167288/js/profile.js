// ===== 个人中心页（全局对象 ProfilePage） =====
const ProfilePage = {
  // 头像备选列表（10 个动物 emoji，与小程序对齐：有 🐹 无 🐧）
  AVATARS: ['🐱', '🐶', '🐰', '🐹', '🐻', '🐼', '🦊', '🐯', '🐨', '🐸'],

  // 当前选中的头像（编辑资料时使用）
  _selectedAvatar: null,

  // 初始化（一次性，由 App.init 调用）
  init() {
    // 静态事件目前都通过 onclick 绑定，无需额外处理
  },

  // 页面显示时调用（重新渲染）
  onShow() {
    this.render()
  },

  // 渲染整个页面
  render() {
    const user = API.getCurrentUser()
    const points = user.points || { base: 0, friendly: 0 }
    const totalPoints = (points.base || 0) + (points.friendly || 0)
    const level = Util.getLevel(points.friendly || 0)
    const verifiedTag = user.verified
      ? '<span class="profile-verified-tag">已认证 ✓</span>'
      : '<span class="profile-unverified-tag">未认证</span>'

    // ID 截取后 8 位
    const shortId = (user.id || '').slice(-8)

    const html = `
      <!-- 头部紫色渐变区 -->
      <div class="profile-header">
        <div class="profile-avatar-wrap" onclick="ProfilePage.openEditModal()">
          <div class="profile-avatar">${user.avatar || '🐱'}</div>
          <div class="profile-avatar-edit">✎</div>
        </div>
        <div class="profile-user-info" onclick="ProfilePage.openEditModal()">
          <div class="profile-nickname-row">
            <span class="profile-nickname">${this._escape(user.nickname || '未命名')}</span>
            ${verifiedTag}
          </div>
          <div class="profile-meta">
            <span class="profile-id">ID: ${shortId}</span>
            <span class="profile-level">${level}</span>
          </div>
        </div>
      </div>

      <!-- 积分概览卡片 -->
      <div class="profile-points-card card" onclick="ProfilePage.togglePointsDetail()">
        <div class="profile-points-main">
          <div class="profile-points-label">我的积分</div>
          <div class="profile-points-value">${totalPoints}</div>
          <span class="profile-points-expand" id="pointsExpandIcon">▾</span>
        </div>
        <div class="profile-points-detail" id="pointsDetail" style="display:none;">
          <div class="profile-points-row">
            <span>基础积分</span>
            <span class="profile-points-base">${points.base || 0}</span>
          </div>
          <div class="profile-points-row">
            <span>友善积分</span>
            <span class="profile-points-friendly">${points.friendly || 0}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-block" style="margin-top:12px;" onclick="event.stopPropagation(); App.openSubPage(() => PointsPage.render())">查看明细</button>
      </div>

      <!-- 爱心时间卡片（含社区排名，点击进入排行榜） -->
      <div class="profile-love-card card card-tap" onclick="App.openSubPage(() => LeaderboardPage.render())">
        <div class="profile-love-icon">❤️</div>
        <div class="profile-love-info">
          <div class="profile-love-title">爱心时间</div>
          <div class="profile-love-desc">点击查看排行榜</div>
        </div>
        <div class="profile-love-value" id="loveHoursValue">- h · 社区排名 #-</div>
      </div>

      <!-- 我的宠物 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">我的宠物</span>
          <span class="section-action" onclick="ProfilePage.openPetEditor()">+ 添加</span>
        </div>
        <div class="profile-pets-scroll" id="petsScroll">
          <div class="profile-pets-loading">加载中...</div>
        </div>
      </div>

      <!-- 我的追踪（内嵌列表，前 3 条） -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">📍 我的追踪</span>
          <span class="section-action" id="tracksMore" style="display:none;" onclick="ProfilePage.openTracks()">查看全部 ›</span>
        </div>
        <div id="tracksList"><div class="profile-pets-loading">加载中...</div></div>
      </div>

      <!-- 我的收藏（内嵌列表，前 3 条） -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">⭐ 我的收藏</span>
          <span class="section-action" id="favoritesMore" style="display:none;" onclick="ProfilePage.openFavorites()">查看全部 ›</span>
        </div>
        <div id="favoritesList"><div class="profile-pets-loading">加载中...</div></div>
      </div>

      <!-- 贡献统计 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">贡献统计</span>
        </div>
        <div class="card profile-contribution">
          <div class="profile-contribution-item">
            <div class="profile-contribution-num" id="contribMarks">-</div>
            <div class="profile-contribution-label">救助标记</div>
          </div>
          <div class="profile-contribution-item">
            <div class="profile-contribution-num" id="contribAdoptions">-</div>
            <div class="profile-contribution-label">成功领养</div>
          </div>
          <div class="profile-contribution-item">
            <div class="profile-contribution-num" id="contribPosts">-</div>
            <div class="profile-contribution-label">社区动态</div>
          </div>
          <div class="profile-contribution-item">
            <div class="profile-contribution-num" id="contribReviews">-</div>
            <div class="profile-contribution-label">服务评价</div>
          </div>
        </div>
      </div>

      <!-- 功能菜单列表 -->
      <div class="section">
        <div class="profile-menu">
          <div class="list-item" onclick="App.openSubPage(() => ApplicationsPage.render())">
            <div class="list-item-icon">📋</div>
            <div class="list-item-content">
              <div class="list-item-title">我的领养申请</div>
            </div>
            <span class="list-item-arrow">›</span>
          </div>
          <div class="list-item" onclick="App.openSubPage(() => RescueRecordsPage.render())">
            <div class="list-item-icon">🚑</div>
            <div class="list-item-content">
              <div class="list-item-title">我的救助记录</div>
            </div>
            <span class="list-item-arrow">›</span>
          </div>
          <div class="list-item" onclick="App.openSubPage(() => ExchangePage.render())">
            <div class="list-item-icon">🎁</div>
            <div class="list-item-content">
              <div class="list-item-title">积分兑换</div>
            </div>
            <span class="list-item-arrow">›</span>
          </div>
          <div class="list-item" onclick="App.openSubPage(() => VerifyPage.render())">
            <div class="list-item-icon">🪪</div>
            <div class="list-item-content">
              <div class="list-item-title">实名认证</div>
            </div>
            <span class="list-item-arrow">›</span>
          </div>
          <div class="list-item" onclick="ProfilePage.openSettings()">
            <div class="list-item-icon">⚙️</div>
            <div class="list-item-content">
              <div class="list-item-title">设置</div>
            </div>
            <span class="list-item-arrow">›</span>
          </div>
        </div>
      </div>

      <div style="height:24px;"></div>
    `

    const el = document.getElementById('page-profile')
    if (el) el.innerHTML = html

    // 加载异步数据
    this.loadAsyncData()
  },

  // 加载异步数据（爱心小时+排名、宠物、追踪/收藏内嵌列表、贡献统计）
  loadAsyncData() {
    // 爱心小时 + 社区排名
    Promise.all([API.getLoveHours(), API.getRank()]).then(([loveData, rankData]) => {
      const el = document.getElementById('loveHoursValue')
      if (!el) return
      const hours = loveData.hours || 0
      const rank = (rankData && rankData.rank) || 0
      const rankText = rank > 0 ? '#' + rank : '#-'
      el.textContent = hours + ' h · 社区排名 ' + rankText
    })

    // 宠物列表
    API.getPetList().then(pets => {
      this.renderPets(pets)
    })

    // 追踪列表（内嵌前 3 条）
    API.getTracks().then(list => {
      this.renderTracksInline(list || [])
    })
    // 收藏列表（内嵌前 3 条）
    API.getFavorites().then(list => {
      this.renderFavoritesInline(list || [])
    })

    // 贡献统计
    API.getContributions().then(data => {
      const setVal = (id, v) => {
        const el = document.getElementById(id)
        if (el) el.textContent = v
      }
      setVal('contribMarks', data.marks || 0)
      setVal('contribAdoptions', data.adoptions || 0)
      setVal('contribPosts', data.posts || 0)
      setVal('contribReviews', data.reviews || 0)
    })
  },

  // 标记类型 → emoji 图标
  _typeIcon(type) {
    const map = { rescue: '🆘', adoption: '🏠', place: '🌳', hospital: '🏥', service: '🛎️' }
    return map[type] || '🐾'
  },

  // 标记状态 → {label, class}
  _trackStatus(status) {
    const map = {
      active: { label: '待救助', class: 'tag-red' },
      rescuing: { label: '救助中', class: 'tag-orange' },
      resolved: { label: '已完成', class: 'tag-green' }
    }
    return map[status] || { label: '进行中', class: 'tag-gray' }
  },

  // 渲染追踪内嵌列表（前 3 条）
  renderTracksInline(list) {
    const el = document.getElementById('tracksList')
    const moreEl = document.getElementById('tracksMore')
    if (!el) return
    if (moreEl) moreEl.style.display = list.length > 3 ? '' : 'none'
    if (!list || list.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-text">暂无追踪记录</div></div>`
      return
    }
    const top = list.slice(0, 3)
    el.innerHTML = top.map(m => {
      const st = this._trackStatus(m.status)
      const icon = m.icon || this._typeIcon(m.type)
      const desc = this._escape(m.desc || m.address || '')
      return `
        <div class="list-item" onclick="App.openSubPage(()=>RescuePage.render('${m.id}'))">
          <div class="list-item-icon">${icon}</div>
          <div class="list-item-content">
            <div class="list-item-title">${this._escape(m.title || '未命名标记')}</div>
            <div class="list-item-desc">${desc}</div>
          </div>
          <span class="tag ${st.class}">${st.label}</span>
        </div>
      `
    }).join('')
  },

  // 渲染收藏内嵌列表（前 3 条）
  renderFavoritesInline(list) {
    const el = document.getElementById('favoritesList')
    const moreEl = document.getElementById('favoritesMore')
    if (!el) return
    if (moreEl) moreEl.style.display = list.length > 3 ? '' : 'none'
    if (!list || list.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-text">暂无收藏记录</div></div>`
      return
    }
    const top = list.slice(0, 3)
    el.innerHTML = top.map(m => {
      const icon = m.icon || this._typeIcon(m.type)
      const desc = this._escape(m.desc || m.address || '')
      const adoptionId = m.adoptionId || ''
      const click = adoptionId
        ? `AdoptionPage.openDetail('${adoptionId}')`
        : `Util.toast('该标记无领养信息')`
      return `
        <div class="list-item" onclick="${click}">
          <div class="list-item-icon">${icon}</div>
          <div class="list-item-content">
            <div class="list-item-title">${this._escape(m.title || '未命名标记')}</div>
            <div class="list-item-desc">${desc}</div>
          </div>
          <span class="list-item-arrow">›</span>
        </div>
      `
    }).join('')
  },

  // 渲染宠物列表（横向滚动）
  renderPets(pets) {
    const el = document.getElementById('petsScroll')
    if (!el) return
    if (!pets || pets.length === 0) {
      el.innerHTML = `<div class="profile-pets-empty" onclick="ProfilePage.openPetEditor()">还没有宠物档案，点击 + 添加</div>`
      return
    }
    let html = ''
    pets.forEach(pet => {
      html += `
        <div class="profile-pet-item" onclick="ProfilePage.openPetDetail('${pet.id}')">
          <div class="profile-pet-icon">${pet.icon || '🐾'}</div>
          <div class="profile-pet-name">${this._escape(pet.name || '未命名')}</div>
          <div class="profile-pet-breed">${this._escape(pet.breed || '')}</div>
        </div>
      `
    })
    // 末尾的 + 添加按钮
    html += `
      <div class="profile-pet-add" onclick="ProfilePage.openPetEditor()">
        <div class="profile-pet-add-icon">+</div>
        <div class="profile-pet-add-text">添加</div>
      </div>
    `
    el.innerHTML = html
  },

  // 展开/收起积分明细
  togglePointsDetail() {
    const detail = document.getElementById('pointsDetail')
    const icon = document.getElementById('pointsExpandIcon')
    if (!detail) return
    const isHidden = detail.style.display === 'none'
    detail.style.display = isHidden ? 'block' : 'none'
    if (icon) icon.textContent = isHidden ? '▴' : '▾'
  },

  // ===== 编辑资料弹窗 =====
  openEditModal() {
    const user = API.getCurrentUser()
    this._selectedAvatar = user.avatar || '🐱'

    const avatarsHtml = this.AVATARS.map(a =>
      `<div class="avatar-option ${a === this._selectedAvatar ? 'selected' : ''}" data-avatar="${a}" onclick="ProfilePage.selectAvatar('${a}')">${a}</div>`
    ).join('')

    // 遮罩（点击外部关闭）
    const mask = document.createElement('div')
    mask.className = 'bottom-sheet-mask show'
    mask.id = 'profileEditMask'
    mask.addEventListener('click', () => this.closeEditModal())

    // 底部弹窗
    const sheet = document.createElement('div')
    sheet.className = 'bottom-sheet show'
    sheet.id = 'profileEditSheet'
    sheet.innerHTML = `
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <span class="sheet-title">编辑资料</span>
        <span class="sheet-close" onclick="ProfilePage.closeEditModal()">✕</span>
      </div>
      <div class="sheet-body">
        <div class="form-group">
          <label class="form-label">选择头像</label>
          <div class="avatar-grid" id="avatarGrid">${avatarsHtml}</div>
        </div>
        <div class="form-group">
          <label class="form-label">昵称（最多 12 字）</label>
          <input type="text" class="form-input" id="nicknameInput"
                 value="${this._escape(user.nickname || '')}"
                 oninput="ProfilePage.onNicknameInput(this)"
                 placeholder="请输入昵称" />
          <div class="form-hint" id="nicknameHint">${Array.from(user.nickname || '').length}/12</div>
        </div>
      </div>
      <div class="sheet-footer">
        <button class="btn btn-primary btn-block" onclick="ProfilePage.saveProfile()">保存</button>
      </div>
    `

    document.body.appendChild(mask)
    document.body.appendChild(sheet)
  },

  // 选择头像
  selectAvatar(avatar) {
    this._selectedAvatar = avatar
    document.querySelectorAll('#avatarGrid .avatar-option').forEach(el => {
      el.classList.toggle('selected', el.dataset.avatar === avatar)
    })
  },

  // 昵称输入处理（使用 Array.from 处理多字节字符）
  onNicknameInput(input) {
    const chars = Array.from(input.value)
    if (chars.length > 12) {
      input.value = chars.slice(0, 12).join('')
    }
    const hint = document.getElementById('nicknameHint')
    if (hint) hint.textContent = Array.from(input.value).length + '/12'
  },

  // 保存资料
  saveProfile() {
    const nicknameInput = document.getElementById('nicknameInput')
    const nickname = (nicknameInput.value || '').trim()
    const avatar = this._selectedAvatar || '🐱'
    if (!nickname) {
      Util.toast('请输入昵称')
      return
    }
    // 限制昵称长度（处理 emoji 等多字节字符）
    const safeNickname = Array.from(nickname).slice(0, 12).join('')
    Util.showLoading('保存中...')
    API.updateCurrentUser(safeNickname, avatar).then(() => {
      Util.hideLoading()
      Util.toast('保存成功')
      this.closeEditModal()
      this.render()
    }).catch(err => {
      Util.hideLoading()
      Util.toast('保存失败：' + (err && err.message ? err.message : ''))
    })
  },

  // 关闭编辑弹窗
  closeEditModal() {
    const sheet = document.getElementById('profileEditSheet')
    const mask = document.getElementById('profileEditMask')
    if (sheet) sheet.remove()
    if (mask) mask.remove()
    this._selectedAvatar = null
  },

  // ===== 跳转到宠物相关页面 =====
  openPetDetail(id) {
    if (typeof PetPage !== 'undefined' && PetPage.renderDetail) {
      App.openSubPage(() => PetPage.renderDetail(id))
    } else {
      Util.toast('宠物详情开发中')
    }
  },

  openPetEditor() {
    if (typeof PetPage !== 'undefined' && PetPage.renderEdit) {
      App.openSubPage(() => PetPage.renderEdit())
    } else {
      Util.toast('宠物编辑开发中')
    }
  },

  // ===== 跳转到追踪/收藏列表 =====
  openTracks() {
    if (typeof TracksPage !== 'undefined') {
      App.openSubPage(() => TracksPage.render())
    } else {
      Util.toast('追踪列表开发中')
    }
  },

  openFavorites() {
    if (typeof FavoritesPage !== 'undefined') {
      App.openSubPage(() => FavoritesPage.render())
    } else {
      Util.toast('收藏列表开发中')
    }
  },

  // ===== 设置（重置数据）=====
  openSettings() {
    // 遮罩
    const mask = document.createElement('div')
    mask.className = 'bottom-sheet-mask show'
    mask.id = 'settingsMask'
    mask.addEventListener('click', () => this.closeSettings())

    // 居中确认弹窗
    const modal = document.createElement('div')
    modal.className = 'center-modal show'
    modal.id = 'settingsModal'
    modal.innerHTML = `
      <div style="padding:24px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;text-align:center;">重置数据</div>
        <div style="font-size:14px;color:var(--text-2);margin-bottom:20px;text-align:center;line-height:1.5;">将清空所有本地数据并恢复到初始状态，确定继续吗？</div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline" style="flex:1;" onclick="ProfilePage.closeSettings()">取消</button>
          <button class="btn btn-danger" style="flex:1;" onclick="ProfilePage.resetData()">确定重置</button>
        </div>
      </div>
    `
    document.body.appendChild(mask)
    document.body.appendChild(modal)
  },

  closeSettings() {
    const modal = document.getElementById('settingsModal')
    const mask = document.getElementById('settingsMask')
    if (modal) modal.remove()
    if (mask) mask.remove()
  },

  // 执行数据重置
  resetData() {
    this.closeSettings()
    Store.clearAll()
    Util.toast('数据已重置')
    setTimeout(() => location.reload(), 800)
  },

  // HTML 转义工具
  _escape(text) {
    if (text == null) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
}
