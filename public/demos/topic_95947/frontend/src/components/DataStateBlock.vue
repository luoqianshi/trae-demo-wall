<template>
  <div
    class="data-state"
    :class="[
      `tone-${tone}`,
      { compact, loading }
    ]"
    :style="stateStyle"
  >
    <el-skeleton v-if="loading" :rows="rows" animated />
    <template v-else>
      <span class="data-state-icon">
        <i :class="icon"></i>
      </span>
      <strong>{{ title }}</strong>
      <p>{{ description }}</p>
      <div v-if="$slots.actions" class="data-state-actions">
        <slot name="actions" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  rows: {
    type: Number,
    default: 4
  },
  title: {
    type: String,
    default: '暂无数据'
  },
  description: {
    type: String,
    default: '当前条件下还没有可展示的数据，请稍后重试或调整筛选条件。'
  },
  icon: {
    type: String,
    default: 'fas fa-inbox'
  },
  tone: {
    type: String,
    default: 'warm'
  },
  compact: {
    type: Boolean,
    default: false
  },
  minHeight: {
    type: [Number, String],
    default: ''
  }
})

const stateStyle = computed(() => {
  if (!props.minHeight) return {}
  return {
    minHeight: typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight
  }
})
</script>

<style scoped>
.data-state {
  min-height: 220px;
  padding: 22px 18px;
  border: 1px dashed rgba(180, 83, 9, 0.22);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 247, 237, 0.7), rgba(255, 253, 250, 0.94));
  color: var(--ds-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.data-state.compact {
  min-height: 140px;
}

.data-state.loading {
  align-items: stretch;
  text-align: left;
}

.data-state-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  color: var(--ds-primary);
  background: rgba(180, 83, 9, 0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.data-state-icon i {
  font-size: 20px;
}

.data-state strong {
  color: var(--ds-text);
  font-size: 16px;
}

.data-state p {
  max-width: 420px;
  margin: 8px 0 0;
  line-height: 1.7;
  font-size: 13px;
}

.data-state-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.tone-success {
  border-color: rgba(22, 163, 74, 0.24);
  background: linear-gradient(180deg, rgba(220, 252, 231, 0.45), rgba(255, 253, 250, 0.94));
}

.tone-success .data-state-icon {
  color: #15803d;
  background: rgba(22, 163, 74, 0.12);
}

.tone-danger {
  border-color: rgba(220, 38, 38, 0.22);
  background: linear-gradient(180deg, rgba(254, 226, 226, 0.5), rgba(255, 253, 250, 0.94));
}

.tone-danger .data-state-icon {
  color: #b91c1c;
  background: rgba(220, 38, 38, 0.1);
}
</style>
