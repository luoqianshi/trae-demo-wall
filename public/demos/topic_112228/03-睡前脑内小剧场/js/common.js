/* ========================================
   公共工具函数
   ======================================== */

const App = {
  storageKey: 'sleep_theater_user',

  getUser() {
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : null
  },

  setUser(user) {
    localStorage.setItem(this.storageKey, JSON.stringify(user))
  },

  logout() {
    localStorage.removeItem(this.storageKey)
    window.location.href = '../login.html'
  },

  requireLogin() {
    const user = this.getUser()
    if (!user) {
      window.location.href = '../login.html'
      return false
    }
    return true
  },

  isLoggedIn() {
    return !!this.getUser()
  },

  goto(path) {
    window.location.href = path
  },

  formatDate(date) {
    const d = new Date(date)
    const mon = d.getMonth() + 1
    const day = d.getDate()
    return { mon: mon + '月', day: day.toString() }
  }
}

/* ========================================
   粒子背景
   ======================================== */

function initParticles() {
  const canvas = document.getElementById('particles')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  let W, H
  let rafId

  function resize() {
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
  }

  resize()
  window.addEventListener('resize', resize)

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3
  }))

  function draw() {
    ctx.clearRect(0, 0, W, H)
    particles.forEach(p => {
      p.x += p.dx
      p.y += p.dy
      if (p.x < 0 || p.x > W) p.dx *= -1
      if (p.y < 0 || p.y > H) p.dy *= -1
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(167, 139, 250, 0.4)'
      ctx.fill()
    })
    rafId = requestAnimationFrame(draw)
  }

  draw()

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId)
  })
}

/* ========================================
   鼠标光晕
   ======================================== */

function initCursorGlow() {
  const glow = document.getElementById('cursor-glow')
  if (!glow) return

  let mouseX = 0, mouseY = 0
  let glowX = 0, glowY = 0
  let rafId

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  })

  function animate() {
    glowX += (mouseX - glowX) * 0.1
    glowY += (mouseY - glowY) * 0.1
    glow.style.left = glowX + 'px'
    glow.style.top = glowY + 'px'
    rafId = requestAnimationFrame(animate)
  }

  animate()

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId)
  })
}

/* ========================================
   滚动入场动画
   ======================================== */

function initReveal() {
  const sections = document.querySelectorAll('.section')
  if (!sections.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          const bar = e.target.querySelector('.progress-bar__fill')
          if (bar) bar.style.width = '100%'
        }
      })
    },
    { threshold: 0.1 }
  )

  sections.forEach(s => observer.observe(s))

  window.addEventListener('beforeunload', () => observer.disconnect())
}

/* ========================================
   顶部导航栏
   ======================================== */

function renderTopNav() {
  const nav = document.getElementById('topNav')
  if (!nav) return

  const user = App.getUser()
  const isHome = location.pathname.endsWith('index.html') || location.pathname.endsWith('/')
  const prefix = isHome ? '' : '../'

  nav.innerHTML = `
    <div class="nav-top__inner">
      <div class="nav-top__logo" onclick="location.href='${prefix}index.html'">
        <span class="nav-top__logo-icon">🌙</span>
        <span class="text-gradient">睡前脑内小剧场</span>
      </div>
      <div class="nav-top__links">
        <span class="nav-top__link" onclick="location.href='${prefix}index.html#intro'">创意介绍</span>
        <span class="nav-top__link" onclick="location.href='${prefix}pages/player.html'">进入小剧场</span>
        ${user
          ? `<div class="nav-top__user">
              <div class="nav-top__avatar">${user.username.charAt(0).toUpperCase()}</div>
              <span>${user.username}</span>
            </div>`
          : `<span class="nav-top__link" onclick="location.href='${prefix}login.html'">登录</span>`
        }
      </div>
    </div>
  `
}
