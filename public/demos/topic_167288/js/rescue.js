// ===== 救助进度模块（全局对象 RescuePage） =====
const RescuePage = {
  currentMarkerId: null,
  // 进度更新时临时图片
  progressImages: [],

  // 标记类型名称映射（与小程序对齐）
  TYPE_NAMES: {
    rescue: '🐾 流浪标记',
    urgent: '🚨 紧急救助',
    adoption: '🏠 领养信息',
    place: '🌳 宠物友好场所',
    hospital: '🏥 宠物医院',
    service: '🛎️ 服务需求'
  },

  // 救助进度子页面
  render(markerId) {
    this.currentMarkerId = markerId
    this.progressImages = []
    setTimeout(() => this._load(markerId), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="App.closeSubPage()">‹</span>
        <span class="nav-title">救助进度</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content" id="rescueWrap">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },

  // 加载标记详情 + 救助记录（并行）
  _load(markerId) {
    Promise.all([
      API.getMarkerById(markerId),
      API.getRescueProgress(markerId)
    ]).then(([marker, record]) => {
      this._render(markerId, marker, record)
    })
  },

  // 状态信息映射：active 待救助 / rescuing 救助中 / resolved 已完成
  _statusInfo(status) {
    const map = {
      active: { label: '待救助', class: 'tag-red' },
      rescuing: { label: '救助中', class: 'tag-orange' },
      resolved: { label: '已完成', class: 'tag-green' }
    }
    return map[status] || map.active
  },

  // 渲染页面内容
  _render(markerId, marker, record) {
    const wrap = document.getElementById('rescueWrap')
    if (!wrap) return

    const me = API.getCurrentUser()
    // 状态判定：有记录用记录状态；否则用标记状态，默认 active
    let status = 'active'
    if (record) {
      status = record.status || 'active'
    } else if (marker) {
      status = marker.rescueStatus || marker.status || 'active'
    }
    const statusInfo = this._statusInfo(status)

    // 当前用户是否为该救助的响应者
    const isResponder = record && record.responderId === me.id

    let html = ''

    // 1. 标记信息卡片（类型标签 + 标题 + 状态标签 + 位置）
    if (marker) {
      const typeLabel = this.TYPE_NAMES[marker.type] || '🐾 标记'
      const location = marker.address || '未知位置'
      html += `
        <div class="card" style="margin:16px;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">
            <span class="tag tag-blue" style="font-size:13px;padding:4px 10px;">${typeLabel}</span>
            <span class="tag ${statusInfo.class}" style="font-size:13px;padding:4px 10px;">${statusInfo.label}</span>
          </div>
          <div style="font-size:17px;font-weight:700;margin-bottom:8px;line-height:1.4;">${this._escape(marker.title || '未命名标记')}</div>
          <div style="font-size:13px;color:var(--text-3);">📍 ${this._escape(location)}</div>
        </div>
      `
    } else {
      // 无标记信息时仍显示状态卡片
      html += `
        <div class="card" style="margin:16px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:13px;color:var(--text-3);margin-bottom:6px;">当前状态</div>
            <span class="tag ${statusInfo.class}" style="font-size:13px;padding:5px 12px;">${statusInfo.label}</span>
          </div>
          <div style="font-size:28px;">${status === 'resolved' ? '✅' : '⚠️'}</div>
        </div>
      `
    }

    // 2. 时间线 / 空状态
    if (record && record.progress && record.progress.length > 0) {
      html += `
        <div style="padding:0 16px 16px;">
          <div style="font-size:13px;font-weight:600;color:var(--text-2);margin:8px 4px;">救助进度</div>
          <div class="card" style="padding:16px;">
            ${this._renderTimeline(record.progress)}
          </div>
        </div>
      `
    } else if (status === 'active') {
      html += `
        <div class="empty-state" style="padding:40px 20px;">
          <div class="empty-icon">📭</div>
          <div class="empty-text">暂无救助进度，快来成为第一个救助者吧～</div>
        </div>
      `
    }

    // 3. 操作区（根据状态显示不同内容）
    if (status === 'active') {
      // 待救助：响应留言 + 我来救助
      html += `
        <div style="padding:0 16px 16px;">
          <div class="card">
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label">响应留言</label>
              <input type="text" class="form-input" id="rescueRespondInput" placeholder="如：我马上过去查看情况..." />
            </div>
            <button class="btn btn-primary btn-block" onclick="RescuePage._respond('${markerId}')">🤝 我来救助</button>
          </div>
        </div>
      `
    } else if (status === 'rescuing' && isResponder) {
      // 救助中（响应者）：更新进度（支持图片） + 完成救助
      html += `
        <div style="padding:0 16px 16px;">
          <div class="card">
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label">更新救助进度</label>
              <textarea class="form-textarea" id="rescueProgressInput" placeholder="如：已送往宠物医院检查..."></textarea>
            </div>
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label">图片（可选）</label>
              <div class="upload-area" id="rescueProgressImgArea"></div>
              <input type="file" id="rescueProgressImgInput" accept="image/*" multiple style="display:none" onchange="RescuePage._onProgressImgPick(this)" />
            </div>
            <button class="btn btn-secondary btn-block" style="margin-bottom:10px;" onclick="RescuePage._updateProgress('${markerId}')">提交进度</button>
            <button class="btn btn-primary btn-block" onclick="RescuePage._showCompleteModal('${markerId}')">完成救助</button>
          </div>
        </div>
      `
    } else if (status === 'rescuing' && !isResponder) {
      // 救助中（他人响应）
      html += `
        <div style="padding:0 16px 16px;">
          <div class="card" style="text-align:center;color:var(--text-3);font-size:13px;">
            ${this._escape((record && record.responderName) || '他人')} 正在救助中
          </div>
        </div>
      `
    } else if (status === 'resolved') {
      // 已完成
      html += `
        <div style="padding:0 16px 16px;">
          <div class="card" style="text-align:center;color:var(--green);font-size:15px;font-weight:600;">
            ✅ 救助已完成
          </div>
        </div>
      `
    }

    wrap.innerHTML = html

    // 渲染进度图片预览（救助中且为响应者时）
    if (status === 'rescuing' && isResponder) {
      this._renderProgressImgs()
    }
  },

  // 渲染时间线（含图片）
  _renderTimeline(progress) {
    return progress.map((p, idx) => {
      const isLast = idx === progress.length - 1
      const imgs = (p.images || []).map(src =>
        `<img src="${src}" style="width:100%;border-radius:8px;margin-top:8px;display:block;cursor:pointer;" onclick="RescuePage._previewImage('${src}')" />`
      ).join('')
      return `
        <div style="display:flex;gap:12px;">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
            <div style="width:10px;height:10px;border-radius:50%;background:${isLast ? 'var(--green)' : 'var(--primary)'};margin-top:4px;"></div>
            ${!isLast ? '<div style="width:2px;flex:1;background:var(--border);margin-top:2px;"></div>' : ''}
          </div>
          <div style="flex:1;padding-bottom:${isLast ? '0' : '16px'};">
            <div style="font-size:14px;color:var(--text);line-height:1.4;">${this._escape(p.content)}</div>
            ${imgs}
            <div style="font-size:12px;color:var(--text-3);margin-top:4px;">
              ${this._escape(p.author || '匿名')} · ${Util.formatDate(p.time)} ${this._formatHm(p.time)}
            </div>
          </div>
        </div>`
    }).join('')
  },

  // 参与救助（支持响应留言 message）
  _respond(markerId) {
    const input = document.getElementById('rescueRespondInput')
    const message = (input && input.value && input.value.trim()) || '已响应救助'
    API.respondRescue(markerId, message).then(res => {
      if (res.success) {
        Util.toast('已响应救助 +50 积分')
        // 重新加载
        this._load(markerId)
      } else {
        Util.toast(res.message || '操作失败')
      }
    })
  },

  // 提交进度更新（支持图片）
  _updateProgress(markerId) {
    const input = document.getElementById('rescueProgressInput')
    if (!input) return
    const content = input.value.trim()
    if (!content) {
      Util.toast('请输入进度内容')
      return
    }
    const images = this.progressImages.slice()
    API.updateRescueProgress(markerId, content, images).then(res => {
      if (res.success) {
        Util.toast('进度已更新')
        this.progressImages = []
        this._load(markerId)
      } else {
        Util.toast(res.message || '更新失败')
      }
    })
  },

  // 渲染进度图片预览
  _renderProgressImgs() {
    const area = document.getElementById('rescueProgressImgArea')
    if (!area) return
    const items = this.progressImages.map((src, i) => `
      <div class="upload-item">
        <img src="${src}" />
        <div class="remove-btn" onclick="RescuePage._removeProgressImg(${i})">✕</div>
      </div>
    `).join('')
    area.innerHTML = `
      ${items}
      <div class="upload-box" onclick="document.getElementById('rescueProgressImgInput').click()">
        <span class="upload-icon">+</span><span>添加</span>
      </div>
    `
  },

  // 进度图片选图
  _onProgressImgPick(input) {
    const files = Array.from(input.files || [])
    input.value = ''
    if (!files.length) return
    Util.showLoading('处理图片...')
    Promise.all(files.map(f => Util.compressImage(f))).then(list => {
      Util.hideLoading()
      this.progressImages = this.progressImages.concat(list)
      this._renderProgressImgs()
    }).catch(() => {
      Util.hideLoading()
      Util.toast('图片处理失败')
    })
  },

  // 删除进度图片
  _removeProgressImg(idx) {
    this.progressImages.splice(idx, 1)
    this._renderProgressImgs()
  },

  // 图片大图预览
  _previewImage(src) {
    const layer = document.createElement('div')
    layer.className = 'chat-img-preview'
    layer.innerHTML = `<img src="${src}" />`
    layer.addEventListener('click', () => layer.remove())
    document.body.appendChild(layer)
  },

  // 完成救助确认弹窗
  _showCompleteModal(markerId) {
    const html = `
      <div style="padding:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="font-size:16px;font-weight:700;">完成救助</div>
          <span class="modal-close" style="cursor:pointer;color:var(--text-3);font-size:18px;">✕</span>
        </div>
        <div style="font-size:13px;color:var(--text-3);margin-bottom:8px;">完成后将获得 +200 积分奖励</div>
        <div class="form-group">
          <label class="form-label">救助总结</label>
          <textarea class="form-textarea" id="rescueSummary" placeholder="请简要描述救助过程与结果..."></textarea>
        </div>
        <button class="btn btn-primary btn-block" id="rescueCompleteBtn">确认完成救助</button>
      </div>
    `
    const { close } = this._openModal(html)
    const btn = document.getElementById('rescueCompleteBtn')
    if (btn) {
      btn.addEventListener('click', () => {
        const summary = document.getElementById('rescueSummary').value.trim()
        if (!summary) { Util.toast('请输入救助总结'); return }
        close()
        this._complete(markerId, summary)
      })
    }
  },

  // 执行完成救助
  _complete(markerId, summary) {
    Util.showLoading('提交中...')
    API.completeRescue(markerId, summary).then(res => {
      Util.hideLoading()
      if (res.success) {
        // 重新加载页面内容
        this._load(markerId)
        // 弹出积分奖励
        App.showPointsReward(200, '完成救助')
      } else {
        Util.toast(res.message || '操作失败')
      }
    })
  },

  // 通用居中弹窗（带遮罩 + 关闭按钮 + 点击外部关闭）
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

  // 格式化时分
  _formatHm(ts) {
    const d = new Date(ts)
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
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
