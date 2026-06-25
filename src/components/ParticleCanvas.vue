<template>
  <canvas ref="canvasRef" class="fixed inset-0 w-full h-full pointer-events-none" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let animationId = null
let particles = []
let mouse = { x: -1000, y: -1000 }

const PARTICLE_COUNT = 80
const CONNECTION_DISTANCE = 150
const MOUSE_RADIUS = 200
const ACCENT = { r: 34, g: 197, b: 94 }

function init(canvas) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1

  function resize() {
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.scale(dpr, dpr)
  }
  resize()
  window.addEventListener('resize', resize)

  particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 2 + 1,
    opacity: Math.random() * 0.4 + 0.2,
  }))

  function onMouseMove(e) {
    mouse.x = e.clientX
    mouse.y = e.clientY
  }
  window.addEventListener('mousemove', onMouseMove)

  function animate() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1
      if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1

      const dx = mouse.x - p.x
      const dy = mouse.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < MOUSE_RADIUS) {
        p.x += dx * 0.005
        p.y += dy * 0.005
      }

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${p.opacity})`
      ctx.fill()
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECTION_DISTANCE) {
          const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${opacity})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  animate()
}

onMounted(() => {
  if (canvasRef.value) init(canvasRef.value)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>
