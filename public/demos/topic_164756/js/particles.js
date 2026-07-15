const Particles = (function () {
  let container = null
  let running = false
  let config = {
    maxParticles: 18,
    spawnInterval: 2200,
    types: ['petal', 'sparkle', 'leaf'],
    petalRatio: 0.5,
    sparkleRatio: 0.3,
    leafRatio: 0.2,
    minDuration: 10,
    maxDuration: 20,
    minSize: 5,
    maxSize: 14,
    swayAmplitude: 60,
    swaySpeed: 0.8
  }
  let spawnTimer = null
  let particles = []
  let rafId = null
  let lastTime = 0

  function init(options = {}) {
    config = Object.assign(config, options)

    if (!container) {
      container = document.createElement('div')
      container.className = 'particles-container'
      document.body.appendChild(container)
    }

    if (!running) {
      start()
    }
  }

  function start() {
    running = true
    lastTime = performance.now()
    spawnBatch()
    scheduleSpawn()
    animate()
  }

  function stop() {
    running = false
    if (spawnTimer) {
      clearTimeout(spawnTimer)
      spawnTimer = null
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function scheduleSpawn() {
    if (!running) return
    const interval = config.spawnInterval + Math.random() * 2000
    spawnTimer = setTimeout(() => {
      if (running) {
        spawnParticle()
        scheduleSpawn()
      }
    }, interval)
  }

  function spawnBatch() {
    const count = Math.floor(config.maxParticles * 0.5)
    for (let i = 0; i < count; i++) {
      setTimeout(() => spawnParticle(true), i * 400)
    }
  }

  function getType() {
    const r = Math.random()
    if (r < config.petalRatio) return 'petal'
    if (r < config.petalRatio + config.sparkleRatio) return 'sparkle'
    return 'leaf'
  }

  function spawnParticle(randomStart = false) {
    if (!running || !container) return
    if (particles.length >= config.maxParticles) return

    const type = getType()
    const el = document.createElement('div')
    el.className = 'particle-item particle-' + type

    const size = config.minSize + Math.random() * (config.maxSize - config.minSize)
    const duration = config.minDuration + Math.random() * (config.maxDuration - config.minDuration)
    const startX = Math.random() * 100
    const startY = randomStart ? Math.random() * 100 : -5
    const swayAmp = config.swayAmplitude * (0.5 + Math.random())
    const swaySpd = config.swaySpeed * (0.7 + Math.random() * 0.6)
    const rotationSpeed = (Math.random() - 0.5) * 2
    const opacityBase = type === 'sparkle' ? 0.25 + Math.random() * 0.45 : 0.35 + Math.random() * 0.4
    const twinkle = type === 'sparkle' && Math.random() > 0.5
    const hueShift = Math.floor(Math.random() * 20 - 10)

    el.style.width = (type === 'sparkle' ? size * 0.5 : size) + 'px'
    el.style.height = (type === 'sparkle' ? size * 0.5 : size) + 'px'
    el.style.left = startX + '%'
    el.style.top = startY + '%'
    el.style.opacity = 0

    if (type === 'petal') {
      el.style.filter = `hue-rotate(${hueShift}deg) blur(0.3px)`
    }

    const p = {
      el,
      type,
      x: startX,
      y: startY,
      size,
      duration,
      startTime: performance.now() + Math.random() * 500,
      swayAmp,
      swaySpd,
      rotationSpeed,
      rotation: Math.random() * 360,
      opacityBase,
      twinkle,
      speed: 100 / duration,
      baseX: startX,
      alive: true
    }

    container.appendChild(el)
    particles.push(p)
  }

  function animate() {
    if (!running) return

    const now = performance.now()
    const dt = (now - lastTime) / 1000
    lastTime = now

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      const elapsed = (now - p.startTime) / 1000

      if (elapsed < 0) continue

      p.y += p.speed * dt
      p.rotation += p.rotationSpeed * dt * 60

      const sway = Math.sin(elapsed * p.swaySpd) * p.swayAmp
      const xPx = p.baseX + (sway / window.innerWidth) * 100

      let opacity = p.opacityBase
      if (p.y < 0) {
        opacity = p.opacityBase * (p.y + 5) / 5
      }
      if (p.y > 95) {
        opacity = p.opacityBase * (100 - p.y) / 5
      }

      if (p.twinkle) {
        const tw = 0.5 + 0.5 * Math.sin(elapsed * 3 + p.startTime)
        opacity *= tw
      }

      p.el.style.transform = `translate(${xPx - p.baseX}vw, 0) rotate(${p.rotation}deg)`
      p.el.style.top = p.y + '%'
      p.el.style.opacity = Math.max(0, opacity)

      if (p.y > 105) {
        p.el.parentNode && p.el.parentNode.removeChild(p.el)
        particles.splice(i, 1)
      }
    }

    rafId = requestAnimationFrame(animate)
  }

  function destroy() {
    stop()
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
    container = null
    particles = []
  }

  return {
    init,
    start,
    stop,
    destroy
  }
})()

window.Particles = Particles
