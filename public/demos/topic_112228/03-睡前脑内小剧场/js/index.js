/* ========================================
   首页脚本
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderTopNav()
  initParticles()
  initCursorGlow()
  initTypewriter()
  initReveal()
})

function initTypewriter() {
  const tw = document.getElementById('typewriter')
  if (!tw) return
  const text = tw.dataset.text
  let i = 0
  function type() {
    if (i < text.length) {
      tw.textContent += text.charAt(i)
      i++
      setTimeout(type, 50)
    }
  }
  setTimeout(type, 800)
}

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

function goToPlayer() {
  if (App.isLoggedIn()) {
    window.location.href = 'pages/player.html'
  } else {
    window.location.href = 'login.html'
  }
}
