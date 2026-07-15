// ===== 宠物档案模块（全局对象 PetPage） =====
const PetPage = {
  // 编辑表单临时状态
  editIcon: '🐱',
  editAlbum: [],
  editingPetId: null,

  // 写日记临时状态
  diaryMood: '😊',
  diaryImages: [],

  // 详情页相册轮播状态
  detailCarouselIndex: 0,
  detailCarouselTotal: 0,
  detailCarouselTimer: null,

  // ===== 宠物编辑/添加子页面 =====
  renderEdit(petId) {
    const isEdit = !!petId
    this.editingPetId = petId || null
    this.editAlbum = []
    this.editIcon = '🐱'

    // 编辑模式：加载已有数据填充表单
    if (isEdit) {
      setTimeout(() => this._loadForEdit(petId), 0)
    }

    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="PetPage._backFromEdit('${petId || ''}')">‹</span>
        <span class="nav-title">${isEdit ? '编辑宠物' : '添加宠物'}</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content">
        <div class="pet-edit-form" id="petEditForm">
          ${this._editFormHtml(isEdit)}
        </div>
      </div>
      <div class="bottom-action-bar">
        ${isEdit ? `<button class="btn btn-danger" style="flex:0 0 40%;" onclick="PetPage._delete('${petId}')">删除</button>` : ''}
        <button class="btn btn-primary" style="flex:1;" onclick="PetPage._save('${petId || ''}')">保存</button>
      </div>
    `
  },

  // 编辑表单 HTML
  _editFormHtml(isEdit) {
    const icons = ['🐱', '🐶', '🐰', '🐹', '🐦', '🐻', '🐼', '🐨', '🦊', '🐯', '🐸', '🐟', '🐢', '🐔', '🐧', '🦄', '🐾', '🦝']
    // 生日上限：禁止选择未来日期
    const todayStr = new Date().toISOString().split('T')[0]
    return `
      <div class="form-group">
        <label class="form-label">名字</label>
        <input class="form-input" id="petName" placeholder="给宠物起个名字" maxlength="20" />
      </div>
      <div class="form-group">
        <label class="form-label">类型</label>
        <div class="chips-row pet-type-chips" id="petTypeChips" style="padding:0;">
          <div class="chip active" data-val="cat" onclick="PetPage._pickChip(this,'petTypeChips')">猫</div>
          <div class="chip" data-val="dog" onclick="PetPage._pickChip(this,'petTypeChips')">狗</div>
          <div class="chip" data-val="other" onclick="PetPage._pickChip(this,'petTypeChips')">其他</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">品种</label>
        <input class="form-input" id="petBreed" placeholder="如：橘猫、柴犬" maxlength="20" />
      </div>
      <div class="form-group">
        <label class="form-label">性别</label>
        <div class="chips-row" id="petGenderChips" style="padding:0;">
          <div class="chip" data-val="male" onclick="PetPage._pickChip(this,'petGenderChips')">♂ 公</div>
          <div class="chip" data-val="female" onclick="PetPage._pickChip(this,'petGenderChips')">♀ 母</div>
          <div class="chip active" data-val="unknown" onclick="PetPage._pickChip(this,'petGenderChips')">? 未知</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">生日</label>
        <input type="date" class="form-input" id="petBirthday" max="${todayStr}" />
      </div>
      <div class="form-group">
        <label class="form-label">体重</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="number" class="form-input" id="petWeight" placeholder="0.0" style="flex:1;" />
          <span style="color:var(--text-3);font-size:14px;flex-shrink:0;">kg</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">性格描述</label>
        <textarea class="form-textarea" id="petPersonality" placeholder="描述宠物的性格..." maxlength="100"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">图标</label>
        <div class="pet-icon-picker" id="petIconPicker">
          ${icons.map((emo, i) => `<div class="pet-icon-item ${i === 0 ? 'active' : ''}" data-emoji="${emo}" onclick="PetPage._pickIcon(this)">${emo}</div>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">相册</label>
        <div class="upload-area" id="petAlbumArea"></div>
        <input type="file" id="petAlbumInput" accept="image/*" multiple style="display:none" onchange="PetPage._onAlbumPick(this)" />
      </div>
    `
  },

  // 加载已有宠物填充表单
  _loadForEdit(petId) {
    API.getPetById(petId).then(pet => {
      if (!pet) { Util.toast('宠物不存在'); App.closeSubPage(); return }
      const setVal = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v }
      setVal('petName', pet.name)
      setVal('petBreed', pet.breed)
      setVal('petWeight', pet.weight)
      setVal('petPersonality', pet.personality)
      if (pet.birthday) setVal('petBirthday', this._toDateInput(pet.birthday))
      // 类型
      this._setChip('petTypeChips', pet.type || 'cat')
      // 性别
      this._setChip('petGenderChips', pet.gender || 'unknown')
      // 图标
      if (pet.icon) {
        this.editIcon = pet.icon
        this._setIconActive(pet.icon)
      }
      // 相册
      this.editAlbum = (pet.album || []).slice()
      this._renderAlbum()
    })
  },

  // 渲染相册预览
  _renderAlbum() {
    const area = document.getElementById('petAlbumArea')
    if (!area) return
    const items = this.editAlbum.map((src, i) => `
      <div class="upload-item">
        <img src="${src}" onclick="PetPage._previewImage('${src}')" />
        <div class="remove-btn" onclick="PetPage._removeAlbum(${i})">✕</div>
      </div>
    `).join('')
    area.innerHTML = `
      ${items}
      <div class="upload-box" onclick="document.getElementById('petAlbumInput').click()">
        <span class="upload-icon">+</span><span>添加</span>
      </div>
    `
  },

  // 相册选图
  _onAlbumPick(input) {
    const files = Array.from(input.files || [])
    input.value = ''
    if (!files.length) return
    Util.showLoading('处理图片...')
    Promise.all(files.map(f => Util.compressImage(f))).then(list => {
      Util.hideLoading()
      this.editAlbum = this.editAlbum.concat(list)
      this._renderAlbum()
    }).catch(() => {
      Util.hideLoading()
      Util.toast('图片处理失败')
    })
  },

  // 删除相册图片
  _removeAlbum(idx) {
    this.editAlbum.splice(idx, 1)
    this._renderAlbum()
  },

  // chips 选中切换
  _pickChip(el, groupId) {
    const group = document.getElementById(groupId)
    if (!group) return
    group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
    el.classList.add('active')
  },

  // 设置某个 chip 选中
  _setChip(groupId, val) {
    const group = document.getElementById(groupId)
    if (!group) return
    group.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.val === val)
    })
  },

  // 读取某个 chip 组当前选中值
  _getChip(groupId) {
    const group = document.getElementById(groupId)
    if (!group) return ''
    const active = group.querySelector('.chip.active')
    return active ? active.dataset.val : ''
  },

  // 图标选择
  _pickIcon(el) {
    const picker = document.getElementById('petIconPicker')
    if (picker) picker.querySelectorAll('.pet-icon-item').forEach(c => c.classList.remove('active'))
    el.classList.add('active')
    this.editIcon = el.dataset.emoji
  },

  // 设置指定图标选中
  _setIconActive(emoji) {
    const picker = document.getElementById('petIconPicker')
    if (!picker) return
    picker.querySelectorAll('.pet-icon-item').forEach(c => {
      c.classList.toggle('active', c.dataset.emoji === emoji)
    })
  },

  // 保存宠物
  _save(petId) {
    const name = (document.getElementById('petName').value || '').trim()
    if (!name) { Util.toast('请输入名字'); return }
    const data = {
      name,
      type: this._getChip('petTypeChips') || 'cat',
      breed: (document.getElementById('petBreed').value || '').trim(),
      gender: this._getChip('petGenderChips') || 'unknown',
      birthday: this._fromDateInput(document.getElementById('petBirthday').value),
      weight: (document.getElementById('petWeight').value || '').trim(),
      personality: (document.getElementById('petPersonality').value || '').trim(),
      icon: this.editIcon,
      album: this.editAlbum.slice()
    }
    Util.showLoading('保存中...')
    if (petId) {
      API.updatePet(petId, data).then(() => {
        Util.hideLoading()
        Util.toast('已保存')
        // 返回详情页
        App.openSubPage(() => this.renderDetail(petId))
      })
    } else {
      API.createPet(data).then(pet => {
        Util.hideLoading()
        // 新建宠物 +10 积分
        App.showPointsReward(10, '创建宠物档案')
        // 关闭子页面回到列表
        setTimeout(() => App.closeSubPage(), 100)
      })
    }
  },

  // 删除宠物
  _delete(petId) {
    const html = `
      <div style="padding:20px;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">🗑️</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:6px;">确认删除该宠物档案？</div>
        <div style="font-size:13px;color:var(--text-3);margin-bottom:18px;">删除后相关日记将一并清除，且无法恢复</div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline" style="flex:1;" id="petDelCancel">取消</button>
          <button class="btn btn-danger" style="flex:1;" id="petDelOk">确认删除</button>
        </div>
      </div>
    `
    const { close } = this._openModal(html)
    document.getElementById('petDelCancel').addEventListener('click', close)
    document.getElementById('petDelOk').addEventListener('click', () => {
      close()
      Util.showLoading('删除中...')
      API.deletePet(petId).then(() => {
        Util.hideLoading()
        Util.toast('已删除')
        App.closeSubPage()
      })
    })
  },

  // 从编辑页返回：编辑时回详情，添加时回上一级
  _backFromEdit(petId) {
    if (petId) {
      App.openSubPage(() => this.renderDetail(petId))
    } else {
      App.closeSubPage()
    }
  },

  // ===== 宠物详情子页面 =====
  renderDetail(petId) {
    setTimeout(() => this._loadDetail(petId), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">宠物详情</span>
        <span class="nav-right" onclick="App.openSubPage(()=>PetPage.renderEdit('${petId}'))">编辑</span>
      </div>
      <div class="sub-page-content" id="petDetailWrap">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },

  // 加载详情
  _loadDetail(petId) {
    API.getPetById(petId).then(pet => {
      const wrap = document.getElementById('petDetailWrap')
      if (!wrap) return
      if (!pet) {
        wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">🐾</div><div class="empty-text">宠物不存在</div></div>`
        return
      }
      // 停止可能存在的上一轮轮播定时器
      this._stopCarouselAutoplay()
      const genderText = pet.gender === 'female' ? '♀ 母' : (pet.gender === 'unknown' ? '? 未知' : '♂ 公')
      const age = this._calcAge(pet.birthday)
      const days = Util.daysUntilBirthday(pet.birthday)
      const album = pet.album || []
      const safeName = this._escape(pet.name)

      let html = ''

      // 顶部封面：有相册显示轮播，无相册显示大 emoji + 类型渐变背景
      if (album.length > 0) {
        html += this._renderCarousel(album)
      } else {
        html += this._renderEmojiCover(pet)
      }

      html += `
        <div class="pet-detail-header">
          <div class="pet-detail-name">${safeName}</div>
          <div class="pet-detail-breed">${this._escape(pet.breed || '未设置品种')}</div>
        </div>
        <div class="pet-info-grid">
          <div class="pet-info-item">
            <div class="pet-info-label">性别</div>
            <div class="pet-info-value">${genderText}</div>
          </div>
          <div class="pet-info-item">
            <div class="pet-info-label">年龄</div>
            <div class="pet-info-value">${age}</div>
          </div>
          <div class="pet-info-item">
            <div class="pet-info-label">体重</div>
            <div class="pet-info-value">${this._escape(pet.weight || '未设置')}</div>
          </div>
          <div class="pet-info-item">
            <div class="pet-info-label">生日</div>
            <div class="pet-info-value">${pet.birthday ? Util.formatDate(pet.birthday) : '未设置'}</div>
          </div>
        </div>
      `

      // 性格卡片
      html += `
        <div class="pet-section">
          <div class="card">
            <div class="pet-info-label" style="margin-bottom:6px;">性格描述</div>
            <div style="font-size:14px;color:var(--text);line-height:1.5;">${this._escape(pet.personality || '暂无描述')}</div>
          </div>
        </div>
      `

      // 生日倒计时（3 段文案，与小程序对齐）
      if (days != null) {
        let birthdayTitle, birthdayDaysHtml
        if (days === 0) {
          birthdayTitle = `🎉 今天是 ${safeName} 的生日！`
          birthdayDaysHtml = ''
        } else if (days <= 7) {
          birthdayTitle = `⏰ 距 ${safeName} 的生日还有`
          birthdayDaysHtml = `<div class="pet-birthday-days">${days} 天</div>`
        } else {
          birthdayTitle = `距 ${safeName} 的生日还有`
          birthdayDaysHtml = `<div class="pet-birthday-days">${days} 天</div>`
        }
        html += `
          <div class="pet-birthday-card">
            <div class="pet-birthday-emoji">🎂</div>
            <div class="pet-birthday-info">
              <div class="pet-birthday-title">${birthdayTitle}</div>
              ${birthdayDaysHtml}
            </div>
          </div>
        `
      }

      // 日记预览
      html += `
        <div class="pet-section">
          <div class="pet-section-title">
            养宠日记
            <span class="pet-section-more" onclick="App.openSubPage(()=>PetPage.renderDiary('${petId}'))">查看全部 ›</span>
          </div>
          <div class="pet-diary-preview" id="petDiaryPreview">
            <div class="empty-state" style="padding:20px;"><div class="empty-text">加载中...</div></div>
          </div>
        </div>
      `

      // 写日记按钮
      html += `
        <div class="pet-section">
          <button class="btn btn-secondary btn-block" onclick="PetPage._openDiaryModal('${petId}', ()=>PetPage._loadDetail('${petId}'))">✍️ 写日记</button>
        </div>
      `

      wrap.innerHTML = html

      // 启动相册轮播自动播放（有相册时）
      if (album.length > 1) {
        this._startCarouselAutoplay(album.length)
      }

      // 异步加载日记预览（最近 3 条）
      API.getPetDiaries(petId, 1, 3).then(res => {
        const box = document.getElementById('petDiaryPreview')
        if (!box) return
        if (!res.list || res.list.length === 0) {
          box.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-text">还没有日记，快来记录吧</div></div>`
          return
        }
        box.innerHTML = res.list.map(d => this._diaryItemHtml(d, false)).join('')
      })
    })
  },

  // ===== 宠物日记子页面 =====
  renderDiary(petId) {
    setTimeout(() => this._loadDiary(petId), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="PetPage._backFromDiary('${petId}')">‹</span>
        <span class="nav-title">养宠日记</span>
        <span class="nav-right" onclick="PetPage._openDiaryModal('${petId}', ()=>PetPage._loadDiary('${petId}'))">写日记</span>
      </div>
      <div class="sub-page-content" id="petDiaryWrap">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },

  // 加载日记列表
  _loadDiary(petId) {
    API.getPetDiaries(petId, 1, 100).then(res => {
      const wrap = document.getElementById('petDiaryWrap')
      if (!wrap) return
      const list = (res && res.list) || []
      if (list.length === 0) {
        wrap.innerHTML = `
          <div class="empty-state" style="padding:80px 20px;">
            <div class="empty-icon">📖</div>
            <div class="empty-text">还没有日记</div>
            <button class="btn btn-primary" style="margin-top:16px;" onclick="PetPage._openDiaryModal('${petId}', ()=>PetPage._loadDiary('${petId}'))">写第一篇日记</button>
          </div>
        `
        return
      }
      wrap.innerHTML = `<div class="pet-diary-timeline">${list.map(d => this._diaryItemHtml(d, true)).join('')}</div>`
    })
  },

  // 单条日记 HTML
  _diaryItemHtml(d, canDelete) {
    const imgs = (d.images || []).map(src => `<img src="${src}" onclick="PetPage._previewImage('${src}')" />`).join('')
    return `
      <div class="pet-diary-item">
        ${canDelete ? `<div class="pet-diary-del" onclick="PetPage._deleteDiary('${d.id}','${d.petId}')">✕</div>` : ''}
        <div class="pet-diary-head">
          <div class="pet-diary-date">${Util.formatDate(d.date || d.createdAt)}</div>
          <div class="pet-diary-mood">${d.mood || '🐾'}</div>
        </div>
        ${d.content ? `<div class="pet-diary-content">${this._escape(d.content)}</div>` : ''}
        ${imgs ? `<div class="pet-diary-imgs">${imgs}</div>` : ''}
        <div class="pet-diary-meta">
          ${d.weight ? `<span>⚖️ ${this._escape(d.weight)}</span>` : ''}
        </div>
      </div>
    `
  },

  // 删除日记
  _deleteDiary(diaryId, petId) {
    const html = `
      <div style="padding:20px;text-align:center;">
        <div style="font-size:16px;font-weight:700;margin-bottom:14px;">确认删除该日记？</div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-outline" style="flex:1;" id="diaDelCancel">取消</button>
          <button class="btn btn-danger" style="flex:1;" id="diaDelOk">删除</button>
        </div>
      </div>
    `
    const { close } = this._openModal(html)
    document.getElementById('diaDelCancel').addEventListener('click', close)
    document.getElementById('diaDelOk').addEventListener('click', () => {
      close()
      API.deletePetDiary(diaryId).then(() => {
        Util.toast('已删除')
        this._loadDiary(petId)
      })
    })
  },

  // 写日记弹窗
  _openDiaryModal(petId, afterSave) {
    this.diaryMood = '😊'
    this.diaryImages = []
    const moods = ['😊', '😐', '😢', '🐶', '🐱', '🐾', '💤', '🤒', '🍖', '🎉', '❤️', '🌈']
    const today = this._toDateInput(Date.now())
    const html = `
      <div style="padding:20px;max-height:80vh;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="font-size:16px;font-weight:700;">写日记</div>
          <span class="modal-close" style="cursor:pointer;color:var(--text-3);font-size:18px;">✕</span>
        </div>
        <div class="form-group">
          <label class="form-label">日期</label>
          <input type="date" class="form-input" id="diaryDate" value="${today}" />
        </div>
        <div class="form-group">
          <label class="form-label">心情</label>
          <div class="mood-picker" id="diaryMoodPicker">
            ${moods.map((m, i) => `<div class="mood-item ${i === 0 ? 'active' : ''}" data-mood="${m}" onclick="PetPage._pickMood(this)">${m}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">内容</label>
          <textarea class="form-textarea" id="diaryContent" placeholder="今天发生了什么..." maxlength="500" oninput="PetPage._onDiaryContentInput(this)"></textarea>
          <div class="form-hint" id="diaryContentHint">0/500</div>
        </div>
        <div class="form-group">
          <label class="form-label">体重（可选）</label>
          <input class="form-input" id="diaryWeight" placeholder="如：4.6kg" />
        </div>
        <div class="form-group">
          <label class="form-label">图片（可选）</label>
          <div class="upload-area" id="diaryImgArea"></div>
          <input type="file" id="diaryImgInput" accept="image/*" multiple style="display:none" onchange="PetPage._onDiaryImgPick(this)" />
        </div>
        <button class="btn btn-primary btn-block" id="diarySubmitBtn">发布日记</button>
      </div>
    `
    const { close } = this._openModal(html)
    this._renderDiaryImgs()
    document.getElementById('diarySubmitBtn').addEventListener('click', () => {
      const content = (document.getElementById('diaryContent').value || '').trim()
      const dateStr = document.getElementById('diaryDate').value
      const weight = (document.getElementById('diaryWeight').value || '').trim()
      if (!content) {
        Util.toast('请输入日记内容')
        return
      }
      const data = {
        petId,
        date: this._fromDateInput(dateStr) || Date.now(),
        mood: this.diaryMood,
        content,
        weight,
        images: this.diaryImages.slice()
      }
      const btn = document.getElementById('diarySubmitBtn')
      btn.disabled = true
      btn.textContent = '发布中...'
      API.addPetDiary(data).then(() => {
        close()
        // +5 积分奖励
        App.showPointsReward(5, '添加宠物日记')
        if (typeof afterSave === 'function') afterSave()
      })
    })
  },

  // 心情选择
  _pickMood(el) {
    const picker = document.getElementById('diaryMoodPicker')
    if (picker) picker.querySelectorAll('.mood-item').forEach(c => c.classList.remove('active'))
    el.classList.add('active')
    this.diaryMood = el.dataset.mood
  },

  // 日记内容输入计数（maxlength=500）
  _onDiaryContentInput(input) {
    const hint = document.getElementById('diaryContentHint')
    if (hint) hint.textContent = (input.value || '').length + '/500'
  },

  // 渲染日记图片预览
  _renderDiaryImgs() {
    const area = document.getElementById('diaryImgArea')
    if (!area) return
    const items = this.diaryImages.map((src, i) => `
      <div class="upload-item">
        <img src="${src}" />
        <div class="remove-btn" onclick="PetPage._removeDiaryImg(${i})">✕</div>
      </div>
    `).join('')
    area.innerHTML = `
      ${items}
      <div class="upload-box" onclick="document.getElementById('diaryImgInput').click()">
        <span class="upload-icon">+</span><span>添加</span>
      </div>
    `
  },

  // 日记图片选图
  _onDiaryImgPick(input) {
    const files = Array.from(input.files || [])
    input.value = ''
    if (!files.length) return
    Util.showLoading('处理图片...')
    Promise.all(files.map(f => Util.compressImage(f))).then(list => {
      Util.hideLoading()
      this.diaryImages = this.diaryImages.concat(list)
      this._renderDiaryImgs()
    }).catch(() => {
      Util.hideLoading()
      Util.toast('图片处理失败')
    })
  },

  // 删除日记图片
  _removeDiaryImg(idx) {
    this.diaryImages.splice(idx, 1)
    this._renderDiaryImgs()
  },

  // 从日记页返回详情
  _backFromDiary(petId) {
    App.openSubPage(() => this.renderDetail(petId))
  },

  // ===== 相册轮播 =====

  // 渲染轮播 HTML（左右箭头 + 圆点指示器 + 自动播放）
  _renderCarousel(album) {
    this.detailCarouselIndex = 0
    this.detailCarouselTotal = album.length
    const slides = album.map(src =>
      `<div style="flex:0 0 100%;height:100%;"><img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block;cursor:pointer;" onclick="PetPage._previewImage('${src}')" /></div>`
    ).join('')
    const dots = album.length > 1
      ? `<div id="petCoverDots" style="position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:center;gap:6px;">
          ${album.map((_, i) => `<span data-idx="${i}" onclick="PetPage._carouselGoTo(${i})" style="width:7px;height:7px;border-radius:50%;background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.5)'};cursor:pointer;transition:background 0.3s;"></span>`).join('')}
        </div>`
      : ''
    const arrows = album.length > 1
      ? `<span onclick="PetPage._carouselPrev()" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.4);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;user-select:none;">‹</span>
         <span onclick="PetPage._carouselNext()" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.4);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;user-select:none;">›</span>`
      : ''
    return `
      <div style="position:relative;width:100%;height:240px;overflow:hidden;background:#000;">
        <div id="petCoverTrack" style="display:flex;height:100%;transition:transform 0.4s ease;">${slides}</div>
        ${arrows}
        ${dots}
      </div>
    `
  },

  // 无相册时：大 emoji + 类型渐变背景
  _renderEmojiCover(pet) {
    const gradients = {
      cat: 'linear-gradient(135deg, #FFB347 0%, #FFCC70 100%)',
      dog: 'linear-gradient(135deg, #6DD5FA 0%, #5B86E5 100%)',
      other: 'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)'
    }
    const gradient = gradients[pet.type] || gradients.other
    return `
      <div style="width:100%;height:240px;display:flex;align-items:center;justify-content:center;background:${gradient};">
        <span style="font-size:96px;line-height:1;">${pet.icon || '🐾'}</span>
      </div>
    `
  },

  // 跳转到指定轮播页
  _carouselGoTo(idx) {
    const track = document.getElementById('petCoverTrack')
    if (!track) return
    this.detailCarouselIndex = idx
    track.style.transform = `translateX(-${idx * 100}%)`
    document.querySelectorAll('#petCoverDots span').forEach((d, i) => {
      d.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.5)'
    })
  },

  // 上一张
  _carouselPrev() {
    const total = this.detailCarouselTotal
    if (total <= 1) return
    const idx = (this.detailCarouselIndex - 1 + total) % total
    this._carouselGoTo(idx)
  },

  // 下一张
  _carouselNext() {
    const total = this.detailCarouselTotal
    if (total <= 1) return
    const idx = (this.detailCarouselIndex + 1) % total
    this._carouselGoTo(idx)
  },

  // 启动自动播放（每 4 秒切换）
  _startCarouselAutoplay(total) {
    this._stopCarouselAutoplay()
    this.detailCarouselTotal = total
    if (total > 1) {
      this.detailCarouselTimer = setInterval(() => this._carouselNext(), 4000)
    }
  },

  // 停止自动播放
  _stopCarouselAutoplay() {
    if (this.detailCarouselTimer) {
      clearInterval(this.detailCarouselTimer)
      this.detailCarouselTimer = null
    }
  },

  // ===== 通用工具 =====

  // 时间戳 → date input 值（YYYY-MM-DD）
  _toDateInput(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  },

  // date input 值 → 时间戳
  _fromDateInput(str) {
    if (!str) return null
    const d = new Date(str + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d.getTime()
  },

  // 根据生日计算年龄
  _calcAge(birthday) {
    if (!birthday) return '未知'
    const now = new Date()
    const b = new Date(birthday)
    if (isNaN(b.getTime())) return '未知'
    let years = now.getFullYear() - b.getFullYear()
    let months = now.getMonth() - b.getMonth()
    if (now.getDate() < b.getDate()) months--
    if (months < 0) { years--; months += 12 }
    if (years <= 0 && months <= 0) return '未满月'
    if (years <= 0) return months + '个月'
    if (months <= 0) return years + '岁'
    return years + '岁' + months + '个月'
  },

  // 图片大图预览
  _previewImage(src) {
    const layer = document.createElement('div')
    layer.className = 'chat-img-preview'
    layer.innerHTML = `<img src="${src}" />`
    layer.addEventListener('click', () => layer.remove())
    document.body.appendChild(layer)
  },

  // 通用居中弹窗
  _openModal(innerHtml) {
    const mask = document.createElement('div')
    mask.className = 'bottom-sheet-mask show'
    mask.style.zIndex = '599'
    const modal = document.createElement('div')
    modal.className = 'center-modal show'
    modal.style.zIndex = '600'
    modal.innerHTML = innerHtml
    const close = () => { modal.remove(); mask.remove() }
    mask.addEventListener('click', close)
    modal.querySelectorAll('.modal-close').forEach(el => el.addEventListener('click', close))
    document.body.appendChild(mask)
    document.body.appendChild(modal)
    return { modal, mask, close }
  },

  // HTML 转义
  _escape(str) {
    if (str == null) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
