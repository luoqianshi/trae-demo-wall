<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  trigger: {
    type: String,
    default: '',
  },
})

const particles = ref([])
let idCounter = 0
let timers = []

const createParticle = (type) => {
  const isHedge = type === 'ACCEPTED_HEDGE'
  const id = idCounter++
  const startX = Math.random() * 100
  const startY = isHedge ? 100 : 0
  const endY = isHedge ? -20 : 120
  const size = Math.random() * 4 + 2
  const duration = Math.random() * 1.2 + 0.8
  const delay = Math.random() * 0.3

  return {
    id,
    left: `${startX}%`,
    top: `${startY}%`,
    '--end-y': `${endY}%`,
    width: `${size}px`,
    height: `${size}px`,
    background: isHedge
      ? `rgba(${74 + Math.random() * 60}, ${222}, ${128}, ${0.6 + Math.random() * 0.4})`
      : `rgba(${248}, ${113 + Math.random() * 40}, ${113}, ${0.6 + Math.random() * 0.4})`,
    boxShadow: isHedge
      ? `0 0 ${size * 3}px rgba(74, 222, 128, 0.8)`
      : `0 0 ${size * 3}px rgba(248, 113, 113, 0.8)`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  }
}

const burst = (type) => {
  if (!type) return
  const count = type === 'ACCEPTED_HEDGE' ? 64 : 96
  const newParticles = Array.from({ length: count }, () => createParticle(type))
  particles.value.push(...newParticles)

  const timer = setTimeout(() => {
    particles.value = particles.value.filter((p) => !newParticles.find((np) => np.id === p.id))
  }, 2200)
  timers.push(timer)
}

watch(() => props.trigger, burst)

onUnmounted(() => {
  timers.forEach(clearTimeout)
})
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="particle absolute rounded-full"
      :style="p"
    />
  </div>
</template>

<style scoped>
.particle {
  animation-name: floatUpDown;
  animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-fill-mode: forwards;
}

@keyframes floatUpDown {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translateY(calc(var(--end-y) * 0.15)) scale(1);
  }
  85% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(var(--end-y)) scale(0.2);
    opacity: 0;
  }
}
</style>
