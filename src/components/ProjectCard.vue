<template>
  <router-link
    :to="`/project/${project.id}`"
    class="trae-card block no-underline group"
  >
    <div class="aspect-video relative overflow-hidden bg-gradient-to-br from-trae-card to-trae-bg">
      <img
        v-if="project.thumbnail"
        :src="project.thumbnail"
        :alt="project.title"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div v-else class="w-full h-full grid place-items-center">
        <div class="w-14 h-14 rounded-[14px] bg-trae-card border border-trae-accent grid place-items-center text-trae-accent text-2xl shadow-[0_0_24px_rgba(34,197,94,0.35)]">
          {{ project.title.charAt(0) }}
        </div>
      </div>
      <div v-if="project.type" class="absolute top-3 right-3 px-2.5 py-1 rounded-trae-pill text-[11px] font-medium"
        :class="project.type === 'external' ? 'bg-trae-accent/20 text-trae-accent' : 'bg-blue-500/20 text-blue-400'"
      >
        {{ project.type === 'external' ? '在线体验' : '本地预览' }}
      </div>
    </div>

    <div class="p-4">
      <h3 class="text-base font-semibold text-trae-text mb-1.5 line-clamp-1 group-hover:text-trae-accent transition-colors">
        {{ project.title }}
      </h3>
      <p class="text-[13px] text-trae-text-secondary line-clamp-2 mb-3 leading-relaxed">
        {{ project.description || '暂无描述' }}
      </p>
      <div class="flex items-center justify-between">
        <span class="tag-pill !py-1 !px-2.5 !text-[11px] cursor-default">
          {{ project.tags?.[0] || '未分类' }}
        </span>
        <div class="flex items-center gap-3 text-trae-text-muted text-xs font-mono">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {{ formatNumber(project.views) }}
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            {{ project.likes }}
          </span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup>
defineProps({
  project: {
    type: Object,
    required: true,
  },
})

function formatNumber(n) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
</script>
