// ===== 实名认证模块（全局对象 VerifyPage） =====
const VerifyPage = {
  codeTimer: null,    // 验证码倒计时定时器
  idFront: '',        // 身份证正面（base64）
  idBack: '',         // 身份证反面（base64）

  // 实名认证子页面
  render() {
    this.idFront = ''
    this.idBack = ''
    this._clearCodeTimer()
    setTimeout(() => this._load(), 0)
    return `
      <div class="nav-bar">
        <span class="nav-back" onclick="VerifyPage._back()">‹</span>
        <span class="nav-title">实名认证</span>
        <span class="nav-right"></span>
      </div>
      <div class="sub-page-content" id="verifyWrap">
        <div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">加载中...</div></div>
      </div>
    `
  },

  // 加载认证状态
  _load() {
    API.getVerificationStatus().then(res => {
      const wrap = document.getElementById('verifyWrap')
      if (!wrap) return
      // status: unverified（未认证）/ pending（审核中）/ approved（已认证）
      const status = (res && res.status) || (res && res.verified ? 'approved' : 'unverified')
      if (status === 'approved') {
        wrap.innerHTML = this._verifiedHtml()
      } else if (status === 'pending') {
        wrap.innerHTML = this._pendingHtml()
      } else {
        wrap.innerHTML = this._formHtml()
      }
    })
  },

  // 已认证状态
  _verifiedHtml() {
    return `
      <div class="verify-done-card">
        <div class="verify-done-icon">✅</div>
        <div class="verify-done-title">已完成实名认证</div>
        <div class="verify-done-desc">感谢您支持流浪动物救助，已获得 500 基础积分</div>
      </div>
      <div class="verify-reward-card">
        <div class="verify-reward-emoji">🎉</div>
        <div class="verify-reward-text">
          实名认证奖励<br/><strong>+500 基础积分</strong>
        </div>
      </div>
      <div style="padding:0 16px;">
        <div class="card" style="font-size:13px;color:var(--text-2);line-height:1.6;">
          <div style="font-weight:600;color:var(--text);margin-bottom:6px;">💡 认证说明</div>
          实名认证用于保障平台安全，您的信息将加密存储，仅用于救助与领养场景的身份核验，不会公开展示。
        </div>
      </div>
    `
  },

  // 审核中状态（资料已提交，等待审核）
  _pendingHtml() {
    return `
      <div class="verify-done-card">
        <div class="verify-done-icon">⏳</div>
        <div class="verify-done-title">资料已提交，等待审核</div>
        <div class="verify-done-desc">审核通常需要 1-3 个工作日，请耐心等待。审核通过后将获得 500 基础积分奖励。</div>
      </div>
      <div style="padding:0 16px;">
        <div class="card" style="font-size:13px;color:var(--text-2);line-height:1.6;">
          <div style="font-weight:600;color:var(--text);margin-bottom:6px;">💡 审核说明</div>
          您的认证资料已提交，工作人员将在 1-3 个工作日内完成审核。审核期间请保持手机畅通，如有问题会与您联系。审核通过后积分将自动发放到账。
        </div>
      </div>
    `
  },

  // 认证表单
  _formHtml() {
    return `
      <div class="verify-reward-card">
        <div class="verify-reward-emoji">🎁</div>
        <div class="verify-reward-text">
          完成实名认证即可获得<br/><strong>+500 基础积分</strong>
        </div>
      </div>
      <div class="verify-form">
        <div class="form-group">
          <label class="form-label">手机号</label>
          <div class="verify-input-wrap">
            <input class="form-input" id="vfPhone" type="tel" maxlength="11" placeholder="请输入手机号" inputmode="numeric" />
            <button class="code-btn" id="vfCodeBtn" onclick="VerifyPage._sendCode()">获取验证码</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">验证码</label>
          <input class="form-input" id="vfCode" type="tel" maxlength="6" placeholder="请输入验证码" inputmode="numeric" />
        </div>
        <div class="form-group">
          <label class="form-label">真实姓名</label>
          <input class="form-input" id="vfName" placeholder="请输入真实姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">身份证号</label>
          <input class="form-input" id="vfIdNo" placeholder="请输入身份证号" maxlength="18" />
        </div>
        <div class="form-group">
          <label class="form-label">身份证正面</label>
          <div class="id-card-upload" id="vfFrontBox" onclick="document.getElementById('vfFrontInput').click()">
            <span class="upload-icon">🪪</span>
            <span class="upload-text">点击上传正面（人像面）</span>
          </div>
          <input type="file" id="vfFrontInput" accept="image/*" style="display:none" onchange="VerifyPage._onIdPick(this,'front')" />
        </div>
        <div class="form-group">
          <label class="form-label">身份证反面</label>
          <div class="id-card-upload" id="vfBackBox" onclick="document.getElementById('vfBackInput').click()">
            <span class="upload-icon">🪪</span>
            <span class="upload-text">点击上传反面（国徽面）</span>
          </div>
          <input type="file" id="vfBackInput" accept="image/*" style="display:none" onchange="VerifyPage._onIdPick(this,'back')" />
        </div>
        <button class="btn btn-primary btn-block" id="vfSubmitBtn" style="margin-top:8px;" onclick="VerifyPage._submit(this)">提交认证</button>
      </div>
      <div style="padding:0 16px 24px;">
        <div class="card" style="font-size:12px;color:var(--text-3);line-height:1.6;">
          🔒 您的信息将加密存储，仅用于救助与领养场景的身份核验，不会公开展示。
        </div>
      </div>
    `
  },

  // 发送验证码（模拟，60 秒倒计时）
  _sendCode() {
    const phone = (document.getElementById('vfPhone').value || '').trim()
    if (!/^1\d{10}$/.test(phone)) {
      Util.toast('请输入正确的手机号')
      return
    }
    const btn = document.getElementById('vfCodeBtn')
    if (!btn || btn.disabled) return
    // 模拟发送验证码
    Util.toast('验证码已发送')
    let count = 60
    btn.disabled = true
    btn.textContent = count + '秒后重试'
    this._clearCodeTimer()
    this.codeTimer = setInterval(() => {
      count--
      if (count <= 0) {
        this._clearCodeTimer()
        btn.disabled = false
        btn.textContent = '获取验证码'
      } else {
        btn.textContent = count + '秒后重试'
      }
    }, 1000)
  },

  // 清理验证码倒计时
  _clearCodeTimer() {
    if (this.codeTimer) {
      clearInterval(this.codeTimer)
      this.codeTimer = null
    }
  },

  // 身份证图片上传
  _onIdPick(input, side) {
    const file = input.files && input.files[0]
    input.value = ''
    if (!file) return
    Util.showLoading('处理图片...')
    Util.compressImage(file).then(dataUrl => {
      Util.hideLoading()
      const boxId = side === 'front' ? 'vfFrontBox' : 'vfBackBox'
      const box = document.getElementById(boxId)
      if (box) {
        box.innerHTML = `<img src="${dataUrl}" />`
      }
      if (side === 'front') this.idFront = dataUrl
      else this.idBack = dataUrl
    }).catch(() => {
      Util.hideLoading()
      Util.toast('图片处理失败')
    })
  },

  // 提交认证
  _submit(btn) {
    const phone = (document.getElementById('vfPhone').value || '').trim()
    const code = (document.getElementById('vfCode').value || '').trim()
    const name = (document.getElementById('vfName').value || '').trim()
    const idNo = (document.getElementById('vfIdNo').value || '').trim()

    if (!/^1\d{10}$/.test(phone)) { Util.toast('请输入正确的手机号'); return }
    if (!/^\d{4,6}$/.test(code)) { Util.toast('请输入验证码'); return }
    if (!name) { Util.toast('请输入真实姓名'); return }
    if (!/^\d{17}[\dXx]$/.test(idNo)) { Util.toast('请输入正确的身份证号'); return }
    if (!this.idFront) { Util.toast('请上传身份证正面'); return }
    if (!this.idBack) { Util.toast('请上传身份证反面'); return }

    btn.disabled = true
    btn.textContent = '提交中...'
    API.submitVerification({
      phone,
      name,
      idNo,
      idFront: this.idFront,
      idBack: this.idBack
    }).then(res => {
      if (res && res.success) {
        this._clearCodeTimer()
        // 提交后进入审核中状态（本地状态置为 pending，重新进入页面时 _load 也会读到 pending）
        const wrap = document.getElementById('verifyWrap')
        if (wrap) wrap.innerHTML = this._pendingHtml()
        Util.toast('资料已提交，等待审核')
      } else {
        btn.disabled = false
        btn.textContent = '提交认证'
        Util.toast((res && res.message) || '提交失败')
      }
    })
  },

  // 返回（清理倒计时定时器）
  _back() {
    this._clearCodeTimer()
    App.closeSubPage()
  }
}
