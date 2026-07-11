/* ===== Tab 切换 ===== */
const tabs = document.querySelectorAll('.login-tab')
const formTitle = document.querySelector('.login-logo__title')
const submitBtn = document.querySelector('.btn-login')
const footerText = document.querySelector('.login-footer')
let currentMode = 'login'

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'))
    tab.classList.add('active')
    currentMode = tab.dataset.mode
    updateForm()
  })
})

function updateForm() {
  const registerGroup = document.getElementById('registerGroup')
  const confirmGroup = document.getElementById('confirmGroup')
  if (currentMode === 'login') {
    formTitle.textContent = '欢迎回来'
    submitBtn.textContent = '登录'
    registerGroup.style.display = 'none'
    confirmGroup.style.display = 'none'
    footerText.innerHTML = '还没有账号？<a href="#" onclick="switchMode(\'register\');return false;">立即注册</a>'
  } else {
    formTitle.textContent = '创建账号'
    submitBtn.textContent = '注册'
    registerGroup.style.display = 'block'
    confirmGroup.style.display = 'block'
    footerText.innerHTML = '已有账号？<a href="#" onclick="switchMode(\'login\');return false;">去登录</a>'
  }
  clearErrors()
}

function switchMode(mode) {
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode)
  })
  currentMode = mode
  updateForm()
}

/* ===== 表单验证 ===== */
function clearErrors() {
  document.querySelectorAll('.form-input').forEach(i => i.classList.remove('error'))
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'))
}

function showError(inputId, msg) {
  const input = document.getElementById(inputId)
  const error = input.nextElementSibling
  input.classList.add('error')
  error.textContent = msg
  error.classList.add('show')
}

function validateForm() {
  clearErrors()
  let valid = true
  const phone = document.getElementById('phone').value.trim()
  const password = document.getElementById('password').value

  if (!phone) {
    showError('phone', '请输入手机号')
    valid = false
  } else if (!/^1\d{10}$/.test(phone)) {
    showError('phone', '请输入正确的手机号')
    valid = false
  }

  if (!password) {
    showError('password', '请输入密码')
    valid = false
  } else if (password.length < 6) {
    showError('password', '密码至少6位')
    valid = false
  }

  if (currentMode === 'register') {
    const nickname = document.getElementById('nickname').value.trim()
    const confirm = document.getElementById('confirm').value
    if (!nickname) {
      showError('nickname', '请输入昵称')
      valid = false
    }
    if (!confirm) {
      showError('confirm', '请确认密码')
      valid = false
    } else if (confirm !== password) {
      showError('confirm', '两次密码不一致')
      valid = false
    }
  }

  return valid
}

/* ===== 提交登录 ===== */
document.querySelector('.login-form').addEventListener('submit', (e) => {
  e.preventDefault()
  if (!validateForm()) return

  const btn = document.querySelector('.btn-login')
  btn.disabled = true
  btn.textContent = currentMode === 'login' ? '登录中...' : '注册中...'

  setTimeout(() => {
    btn.disabled = false
    btn.textContent = currentMode === 'login' ? '登录成功！' : '注册成功！'
    setTimeout(() => {
      alert(currentMode === 'login' ? '登录成功，即将进入应用...' : '注册成功，即将进入应用...')
      window.location.href = 'app.html'
    }, 500)
  }, 1200)
})

/* ===== 粒子背景 ===== */
const canvas = document.getElementById('particles')
const ctx = canvas.getContext('2d')
let W, H
function resize() {
  W = canvas.width = window.innerWidth
  H = canvas.height = window.innerHeight
}
resize()
window.addEventListener('resize', resize)
const particles = Array.from({ length: 50 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: Math.random() * 1.5 + 0.5,
  dx: (Math.random() - 0.5) * 0.3,
  dy: (Math.random() - 0.5) * 0.3
}))
function drawParticles() {
  ctx.clearRect(0, 0, W, H)
  particles.forEach(p => {
    p.x += p.dx
    p.y += p.dy
    if (p.x < 0 || p.x > W) p.dx *= -1
    if (p.y < 0 || p.y > H) p.dy *= -1
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(167,139,250,0.4)'
    ctx.fill()
  })
  requestAnimationFrame(drawParticles)
}
drawParticles()
