/* ===== 打字机效果 ===== */
const tw = document.getElementById('typewriter')
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

/* ===== 滚动入场动画 ===== */
const sections = document.querySelectorAll('.section')
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible')
      const bar = e.target.querySelector('.progress-bar__fill')
      if (bar) bar.style.width = '100%'
    }
  })
}, { threshold: 0.1 })
sections.forEach(s => observer.observe(s))

/* ===== 鼠标光晕 ===== */
const glow = document.getElementById('cursor-glow')
document.addEventListener('mousemove', (e) => {
  glow.style.left = e.clientX + 'px'
  glow.style.top = e.clientY + 'px'
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
const particles = Array.from({ length: 60 }, () => ({
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
