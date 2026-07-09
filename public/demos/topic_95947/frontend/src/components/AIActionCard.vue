<template>
  <div class="ai-action-card" :class="priorityClass">
    <div class="card-top">
      <div>
        <div class="priority-row">
          <span class="priority-dot"></span>
          <span class="priority-text">{{ priorityText }}</span>
        </div>
        <h4>{{ action.title }}</h4>
      </div>
      <el-tag :type="tagType" effect="light">{{ priorityLabel }}</el-tag>
    </div>

    <p class="impact">{{ action.expected_impact || '预计改善当前经营问题' }}</p>

    <div v-if="action.steps?.length" class="steps">
      <div v-for="(step, index) in action.steps" :key="`${action.title}-${index}`" class="step-item">
        <span class="step-index">{{ index + 1 }}</span>
        <span>{{ step }}</span>
      </div>
    </div>

    <div class="card-actions">
      <el-button type="primary" size="small" :loading="saving" @click="$emit('create-task', action)">生成任务</el-button>
      <el-button size="small" @click="$emit('generate-material', action)">生成素材</el-button>
      <el-button link size="small" @click="$emit('ignore', action)">暂不处理</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  action: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

defineEmits(['create-task', 'generate-material', 'ignore'])

const priorityMap = {
  high: { label: '高优先级', text: '建议今天处理', tag: 'danger', className: 'priority-high' },
  medium: { label: '中优先级', text: '建议本周推进', tag: 'warning', className: 'priority-medium' },
  low: { label: '低优先级', text: '可排期优化', tag: 'info', className: 'priority-low' }
}

const priorityMeta = computed(() => priorityMap[props.action.priority] || priorityMap.medium)
const priorityLabel = computed(() => priorityMeta.value.label)
const priorityText = computed(() => priorityMeta.value.text)
const tagType = computed(() => priorityMeta.value.tag)
const priorityClass = computed(() => priorityMeta.value.className)
</script>

<style scoped>
.ai-action-card {
  background: #ffffff;
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ai-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
}

.priority-high { border-left: 4px solid var(--ds-danger); }
.priority-medium { border-left: 4px solid var(--ds-food); }
.priority-low { border-left: 4px solid var(--ds-info); }

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.priority-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ds-muted);
  font-size: 12px;
  margin-bottom: 8px;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--ds-primary);
}

.priority-high .priority-dot { background: var(--ds-danger); }
.priority-medium .priority-dot { background: var(--ds-food); }
.priority-low .priority-dot { background: var(--ds-info); }

h4 {
  margin: 0;
  color: var(--ds-text);
  font-size: 16px;
  font-weight: 750;
  line-height: 1.4;
}

.impact {
  margin: 12px 0 14px;
  color: #475569;
  line-height: 1.6;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #334155;
  font-size: 14px;
}

.step-index {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
