<script setup>
import { ref, watch } from 'vue'
import { photoIcons } from '@/mock/data'

// 老照片卡片：展示缩略图、年份、人物、描述，提供修复/上色按钮
const props = defineProps({
  photo: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['restore', 'color', 'view'])

// 本地状态：处理中的进度
const repairing = ref(false)
const coloring = ref(false)
const repairProg = ref(0)
const colorProg = ref(0)

// 监听 photo 变化重置进度
watch(
  () => props.photo,
  () => {
    repairing.value = false
    coloring.value = false
    repairProg.value = 0
    colorProg.value = 0
  }
)

// 触发修复：模拟进度条
const onRestore = () => {
  if (props.photo.isRestored || repairing.value) return
  repairing.value = true
  repairProg.value = 0
  const timer = setInterval(() => {
    repairProg.value += Math.random() * 15 + 8
    if (repairProg.value >= 100) {
      repairProg.value = 100
      repairing.value = false
      clearInterval(timer)
      emit('restore', props.photo.id)
    }
  }, 280)
}

// 触发上色
const onColor = () => {
  if (props.photo.isColored || coloring.value) return
  coloring.value = true
  colorProg.value = 0
  const timer = setInterval(() => {
    colorProg.value += Math.random() * 15 + 8
    if (colorProg.value >= 100) {
      colorProg.value = 100
      coloring.value = false
      clearInterval(timer)
      emit('color', props.photo.id)
    }
  }, 280)
}

// 占位 Lucide 图标
const icon = (idx) => photoIcons[idx % photoIcons.length]
</script>

<template>
  <div class="photo-card">
    <div
      class="photo-thumb"
      :class="{ colored: photo.isColored, restored: photo.isRestored }"
      @click="emit('view', photo)"
    >
      <span class="photo-badge" :class="{ done: photo.isRestored }">
        <AppIcon :icon="photo.isRestored ? 'lucide:check' : 'lucide:alert-circle'" :size="11" />
        {{ photo.isRestored ? '已修复' : '未修复' }}
      </span>
      <span v-if="photo.isColored" class="color-badge">
        <AppIcon icon="lucide:palette" :size="11" />
        彩色
      </span>
      <div class="thumb-icon">
        <AppIcon :icon="icon(index)" :size="46" />
      </div>
    </div>
    <div class="photo-body">
      <h5>{{ photo.fileName }}</h5>
      <div class="year">
        <AppIcon icon="lucide:calendar" :size="12" />
        {{ photo.photoYear }}年 · {{ photo.peopleNames }}
      </div>
      <p>{{ photo.description }}</p>
      <div class="photo-actions">
        <button
          :class="{ done: photo.isRestored }"
          @click="onRestore"
          :disabled="repairing"
        >
          <AppIcon :icon="repairing ? 'lucide:loader-circle' : photo.isRestored ? 'lucide:check' : 'lucide:wand-2'" :size="13" :class="{ spin: repairing }" />
          {{ repairing ? '修复中…' : photo.isRestored ? '已修复' : 'AI 修复' }}
        </button>
        <button
          :class="{ done: photo.isColored }"
          @click="onColor"
          :disabled="coloring"
        >
          <AppIcon :icon="coloring ? 'lucide:loader-circle' : photo.isColored ? 'lucide:check' : 'lucide:palette'" :size="13" :class="{ spin: coloring }" />
          {{ coloring ? '上色中…' : photo.isColored ? '已上色' : 'AI 上色' }}
        </button>
      </div>
      <div class="progress-bar" v-if="repairing || coloring">
        <div
          class="fill"
          :style="{ width: (repairing ? repairProg : colorProg) + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-card {
  background: var(--bg-warm);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  transition: all 0.35s ease;
  cursor: pointer;
  border: 1px solid rgba(139, 107, 80, 0.1);
}

.photo-card:hover {
  transform: translateY(-6px) rotate(-0.5deg);
  box-shadow: var(--shadow-lift);
}

.photo-thumb {
  height: 170px;
  background: linear-gradient(135deg, var(--earth-soft), var(--primary));
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease;
}

.photo-thumb.colored {
  background: linear-gradient(135deg, #9bb5a3, var(--primary-light), var(--primary));
}

.photo-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(94, 70, 50, 0.3));
}

.photo-thumb.restored::after {
  background: linear-gradient(180deg, transparent 70%, rgba(94, 70, 50, 0.15));
}

.thumb-icon {
  position: relative;
  z-index: 1;
  color: rgba(250, 246, 239, 0.85);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
}

.photo-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 11px;
  background: rgba(94, 70, 50, 0.7);
  color: var(--bg-warm);
  padding: 3px 8px;
  border-radius: 4px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.photo-badge.done {
  background: var(--moss);
}

.color-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11px;
  background: var(--seal);
  color: var(--bg-warm);
  padding: 3px 8px;
  border-radius: 4px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.photo-body {
  padding: 16px;
}

.photo-body h5 {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 4px;
}

.year {
  font-size: 12px;
  color: var(--seal);
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.photo-body p {
  font-size: 13px;
  color: var(--text-light);
  line-height: 1.5;
}

.photo-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  border-top: 1px dashed rgba(139, 107, 80, 0.2);
  padding-top: 12px;
}

.photo-actions button {
  flex: 1;
  border: 1px solid rgba(139, 107, 80, 0.3);
  background: transparent;
  color: var(--primary-deep);
  padding: 7px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-serif);
  transition: all 0.25s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

/* 加载图标旋转动画 */
.photo-actions button :deep(.spin) {
  animation: iconSpin 1s linear infinite;
}

@keyframes iconSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.photo-actions button:hover:not(:disabled) {
  background: var(--primary);
  color: var(--bg);
}

.photo-actions button.done {
  background: var(--moss);
  color: var(--bg);
  border-color: var(--moss);
}

.photo-actions button:disabled {
  cursor: progress;
}

.progress-bar {
  height: 5px;
  background: rgba(139, 107, 80, 0.15);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-light), var(--seal));
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
