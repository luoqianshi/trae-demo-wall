/* ========================================
   登录页脚本
   ======================================== */

let currentTab = 'login'
let currentMode = 'code'
let currentCode = ''
let countdownTimer = null
let countdown = 0

const usersKey = 'sleep_theater_users'

document.addEventListener('DOMContentLoaded', () => {
  initParticles()
  initCursorGlow()
  initTabs()
  initSubtabs()
  initForm()

  if (App.isLoggedIn()) {
    window.location.href = 'pages/player.html'
  }
})

function initTabs() {
  const tabs = document.querySelectorAll('.login-tab')
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      currentTab = tab.dataset.tab
      updateFormUI()
      clearError()
    })
  })
}

function initSubtabs() {
  const subtabs = document.querySelectorAll('.login-subtab')
  subtabs.forEach(tab => {
    tab.addEventListener('click', () => {
      subtabs.forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      currentMode = tab.dataset.mode
      updateFormUI()
      clearError()
    })
  })
}

function updateFormUI() {
  const submitBtn = document.getElementById('submitBtn')
  const codeGroup = document.getElementById('codeGroup')
  const passwordGroup = document.getElementById('passwordGroup')
  const confirmGroup = document.getElementById('confirmGroup')
  const codeTip = document.getElementById('codeTip')
  const subtabs = document.getElementById('loginSubtabs')

  if (currentTab === 'login') {
    subtabs.style.display = 'flex'
    submitBtn.textContent = '登 录'
    if (currentMode === 'code') {
      codeGroup.style.display = 'flex'
      passwordGroup.style.display = 'none'
      confirmGroup.style.display = 'none'
      codeTip.style.display = currentCode ? 'block' : 'none'
    } else {
      codeGroup.style.display = 'none'
      passwordGroup.style.display = 'flex'
      confirmGroup.style.display = 'none'
      codeTip.style.display = 'none'
    }
  } else {
    subtabs.style.display = 'none'
    submitBtn.textContent = '注 册'
    codeGroup.style.display = 'flex'
    passwordGroup.style.display = 'flex'
    confirmGroup.style.display = 'flex'
    codeTip.style.display = currentCode ? 'block' : 'none'
  }

  passwordGroup.style.flexDirection = 'column'
  confirmGroup.style.flexDirection = 'column'
  codeGroup.style.flexDirection = 'column'
}

function initForm() {
  const form = document.getElementById('loginForm')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    handleSubmit()
  })
}

function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

function sendCode() {
  const phone = document.getElementById('phone').value.trim()
  const btn = document.getElementById('codeBtn')

  if (!phone) {
    showError('请输入手机号')
    return
  }
  if (!validatePhone(phone)) {
    showError('请输入正确的手机号')
    return
  }

  clearError()
  currentCode = Math.floor(100000 + Math.random() * 900000).toString()
  document.getElementById('mockCode').textContent = currentCode
  document.getElementById('codeTip').style.display = 'block'

  countdown = 60
  btn.disabled = true
  btn.textContent = `${countdown}s 后重发`
  countdownTimer = setInterval(() => {
    countdown--
    btn.textContent = `${countdown}s 后重发`
    if (countdown <= 0) {
      clearInterval(countdownTimer)
      btn.disabled = false
      btn.textContent = '获取验证码'
    }
  }, 1000)
}

function getUsers() {
  const data = localStorage.getItem(usersKey)
  return data ? JSON.parse(data) : []
}

function saveUsers(users) {
  localStorage.setItem(usersKey, JSON.stringify(users))
}

function findUserByPhone(phone) {
  return getUsers().find(u => u.phone === phone)
}

function handleSubmit() {
  const phone = document.getElementById('phone').value.trim()
  const code = document.getElementById('code').value.trim()
  const password = document.getElementById('password').value
  const confirmPassword = document.getElementById('confirmPassword').value

  if (!phone) {
    showError('请输入手机号')
    return
  }
  if (!validatePhone(phone)) {
    showError('请输入正确的手机号')
    return
  }

  if (currentTab === 'login') {
    if (currentMode === 'code') {
      handleCodeLogin(phone, code)
    } else {
      handlePasswordLogin(phone, password)
    }
  } else {
    handleRegister(phone, code, password, confirmPassword)
  }
}

function handleCodeLogin(phone, code) {
  if (!code) {
    showError('请输入验证码')
    return
  }
  if (code.length !== 6) {
    showError('验证码为 6 位数字')
    return
  }
  if (code !== currentCode) {
    showError('验证码不正确')
    return
  }

  const user = findUserByPhone(phone)
  if (!user) {
    showError('该手机号未注册，请先注册')
    return
  }

  doLogin(user)
}

function handlePasswordLogin(phone, password) {
  if (!password) {
    showError('请输入密码')
    return
  }
  if (password.length < 6) {
    showError('密码至少 6 位')
    return
  }

  const user = findUserByPhone(phone)
  if (!user) {
    showError('该手机号未注册，请先注册')
    return
  }
  if (user.password !== password) {
    showError('密码不正确')
    return
  }

  doLogin(user)
}

function handleRegister(phone, code, password, confirmPassword) {
  if (!code) {
    showError('请输入验证码')
    return
  }
  if (code.length !== 6) {
    showError('验证码为 6 位数字')
    return
  }
  if (code !== currentCode) {
    showError('验证码不正确')
    return
  }
  if (!password) {
    showError('请设置密码')
    return
  }
  if (password.length < 6) {
    showError('密码至少 6 位')
    return
  }
  if (password !== confirmPassword) {
    showError('两次密码输入不一致')
    return
  }

  const existing = findUserByPhone(phone)
  if (existing) {
    showError('该手机号已注册，请直接登录')
    return
  }

  const btn = document.getElementById('submitBtn')
  btn.disabled = true
  btn.textContent = '注册中...'

  setTimeout(() => {
    const user = {
      phone: phone,
      username: '用户' + phone.slice(-4),
      password: password,
      createdAt: Date.now()
    }

    const users = getUsers()
    users.push(user)
    saveUsers(users)

    btn.textContent = '注册成功！'
    setTimeout(() => {
      doLogin(user)
    }, 600)
  }, 800)
}

function doLogin(user) {
  const btn = document.getElementById('submitBtn')
  btn.disabled = true
  btn.textContent = '登录中...'

  setTimeout(() => {
    const userData = {
      phone: user.phone,
      username: user.username,
      loginAt: Date.now()
    }
    App.setUser(userData)

    btn.textContent = '成功！'
    setTimeout(() => {
      window.location.href = 'pages/player.html'
    }, 600)
  }, 500)
}

function showError(msg) {
  const errorEl = document.getElementById('formError')
  errorEl.textContent = msg
  errorEl.style.animation = 'none'
  errorEl.offsetHeight
  errorEl.style.animation = 'fadeInUp 0.3s ease'
}

function clearError() {
  document.getElementById('formError').textContent = ''
}

window.addEventListener('beforeunload', () => {
  if (countdownTimer) clearInterval(countdownTimer)
})
