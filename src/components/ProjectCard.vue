<template>
  <router-link
    :to="`/project/${project.id}`"
    class="trae-card block no-underline group"
  >
    <div class="aspect-video relative overflow-hidden bg-gradient-to-br from-trae-bg-elevated to-trae-bg">
      <img
        v-if="project.thumbnail"
        :src="project.thumbnail"
        :alt="project.title"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <img
        v-else
        :src="getDefaultIllustration(project.tags)"
        :alt="project.title"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <div v-if="project.type" class="absolute top-3 right-3 px-2.5 py-1 rounded-trae-pill text-[11px] font-medium glass-panel"
        :class="typeBadgeClass"
      >
        {{ typeBadgeText }}
      </div>
    </div>

    <div class="p-4">
      <h3 class="text-base font-semibold text-trae-text mb-3 line-clamp-1 group-hover:text-trae-accent-glow transition-colors">
        {{ project.title }}
      </h3>
      <div class="flex items-center justify-between">
        <span class="tag-pill !py-1 !px-2.5 !text-[11px] cursor-default">
          {{ project.tags?.[0] || '未分类' }}
        </span>
        <div class="flex items-center gap-3 text-trae-text-muted text-xs font-mono">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <span class="text-trae-accent-glow/80">{{ formatNumber(project.views) }}</span>
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span class="text-trae-accent-glow/80">{{ project.likes }}</span>
          </span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import studyImg from '@/assets/default-illustrations/study.svg'
import entertainmentImg from '@/assets/default-illustrations/entertainment.svg'
import serviceImg from '@/assets/default-illustrations/service.svg'
import charityImg from '@/assets/default-illustrations/charity.svg'
import hardwareImg from '@/assets/default-illustrations/hardware.svg'
import generalImg from '@/assets/default-illustrations/general.svg'
import { categorizeTag } from '@/utils/categoryMapper'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const typeBadgeText = computed(() => {
  const t = props.project.type
  if (t === 'external') return '在线体验'
  if (t === 'local') return '本地预览'
  if (t === 'miniprogram') return '小程序'
  return t
})

const typeBadgeClass = computed(() => {
  const t = props.project.type
  if (t === 'external') return 'text-trae-accent-glow'
  if (t === 'miniprogram') return 'text-green-400'
  return 'text-blue-400'
})

const illustrationMap = {
  study: studyImg,
  entertainment: entertainmentImg,
  service: serviceImg,
  charity: charityImg,
  hardware: hardwareImg,
  general: generalImg,
}

function getDefaultIllustration(tags) {
  const category = categorizeTag(tags)
  return illustrationMap[category] || illustrationMap.general
}

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
</script>
