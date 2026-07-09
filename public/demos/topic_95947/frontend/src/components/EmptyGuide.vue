<template>
  <section v-if="isVisible" class="empty-guide ds-card">
    <div class="empty-icon" :class="`tone-${tone}`">
      <i :class="icon"></i>
    </div>
    <div class="empty-content">
      <span class="ds-tag ds-tag--primary">初始化引导</span>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      <div v-if="steps.length" class="guide-steps">
        <div v-for="(step, index) in steps" :key="`${step}-${index}`" class="guide-step">
          <span>{{ index + 1 }}</span>
          <p>{{ step }}</p>
        </div>
      </div>
      <div v-if="$slots.actions" class="guide-actions">
        <slot name="actions" />
      </div>
      <div v-if="hasGuideState" class="guide-state-actions" aria-label="引导状态操作">
        <el-button text @click="skip">跳过引导</el-button>
        <el-button type="primary" plain @click="complete">完成引导</el-button>
      </div>
    </div>
  </section>
  <section v-else-if="allowRecall" class="guide-recall ds-card">
    <div>
      <strong>{{ resolvedGuideLabel }}</strong>
      <p>{{ recallText }}</p>
    </div>
    <el-button type="primary" plain @click="review">重新查看</el-button>
  </section>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useGuideStore } from '@/stores/guide'

const props = defineProps({
  title: {
    type: String,
    default: '暂无数据，先完成基础配置'
  },
  description: {
    type: String,
    default: '补齐门店、菜品、员工、支付/打印、营业时间后，系统会生成更准确的经营建议。'
  },
  steps: {
    type: Array,
    default: () => []
  },
  icon: {
    type: String,
    default: 'fas fa-seedling'
  },
  tone: {
    type: String,
    default: 'primary'
  },
  guideId: {
    type: String,
    default: ''
  },
  guideLabel: {
    type: String,
    default: ''
  },
  allowRecall: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['skip', 'complete', 'review'])
const guideStore = useGuideStore()

const hasGuideState = computed(() => Boolean(props.guideId))
const guideState = computed(() => guideStore.getGuide(props.guideId))
const isVisible = computed(() => !hasGuideState.value || guideStore.isGuideVisible(props.guideId))
const resolvedGuideLabel = computed(() => props.guideLabel || props.title)
const recallText = computed(() => {
  if (guideState.value.status === 'completed') return '该引导已标记完成，可随时重新查看。'
  if (guideState.value.status === 'skipped') return '该引导已跳过，可按需重新查看。'
  return '该引导暂未展示，可按需重新查看。'
})

function eventMeta() {
  return {
    title: props.title,
    label: resolvedGuideLabel.value
  }
}

function recordExposureIfNeeded(visible) {
  if (hasGuideState.value && visible) {
    guideStore.recordExposure(props.guideId, eventMeta())
  }
}

function skip() {
  guideStore.skipGuide(props.guideId, eventMeta())
  emit('skip', props.guideId)
}

function complete() {
  guideStore.completeGuide(props.guideId, eventMeta())
  emit('complete', props.guideId)
}

function review() {
  guideStore.reviewGuide(props.guideId, eventMeta())
  emit('review', props.guideId)
}

onMounted(() => {
  recordExposureIfNeeded(isVisible.value)
})

watch(isVisible, recordExposureIfNeeded)
</script>

<style scoped>
.empty-guide {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 24px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
}

.tone-primary {
  color: var(--ds-primary);
  background: var(--ds-primary-soft);
}

.tone-food {
  color: var(--ds-food);
  background: var(--ds-food-soft);
}

.empty-content {
  min-width: 0;
}

.empty-content h3 {
  margin: 12px 0 8px;
  color: var(--ds-text);
  font-size: 20px;
}

.empty-content p {
  margin: 0;
  color: var(--ds-muted);
  line-height: 1.7;
}

.guide-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.guide-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border: 1px solid var(--ds-border);
  border-radius: 14px;
  padding: 12px;
  background: #f8fafc;
}

.guide-step span {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  color: white;
  background: var(--ds-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.guide-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.guide-state-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--ds-border);
}

.guide-recall {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  border-style: dashed;
}

.guide-recall strong {
  display: block;
  color: var(--ds-text);
  font-size: var(--ds-font-size-md);
}

.guide-recall p {
  margin: 4px 0 0;
  color: var(--ds-muted);
  line-height: var(--ds-line-height-base);
}

@media (max-width: 760px) {
  .empty-guide {
    flex-direction: column;
  }

  .guide-steps {
    grid-template-columns: 1fr;
  }

  .guide-recall {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
