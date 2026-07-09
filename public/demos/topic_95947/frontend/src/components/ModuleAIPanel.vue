<template>
  <section class="module-ai-panel">
    <div class="module-ai-header">
      <div>
        <p>{{ contextLabel }}</p>
        <h3>{{ title }}</h3>
      </div>
      <el-button type="primary" :loading="loading" @click="runAnalysis">AI 分析当前页面</el-button>
    </div>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      class="module-ai-alert"
    />

    <div v-if="diagnosis" class="module-ai-result">
      <div class="summary">
        <el-tag :type="confidenceType">{{ confidenceText }}</el-tag>
        <span>{{ diagnosis.data_range }}</span>
      </div>
      <p>{{ diagnosis.summary }}</p>
      <div class="mini-grid">
        <div>
          <strong>风险</strong>
          <span v-for="item in diagnosis.risks || []" :key="item">{{ item }}</span>
          <small v-if="!(diagnosis.risks || []).length">暂无明确风险</small>
        </div>
        <div>
          <strong>机会</strong>
          <span v-for="item in diagnosis.opportunities || []" :key="item">{{ item }}</span>
          <small v-if="!(diagnosis.opportunities || []).length">补充数据后可识别机会</small>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { aiApi } from '@/api'

const props = defineProps({
  module: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'AI 模块分析'
  }
})

const loading = ref(false)
const error = ref('')
const diagnosis = ref(null)

const contextLabel = computed(() => `当前上下文：${props.module}`)
const confidenceText = computed(() => {
  const map = { high: '高可信', medium: '中等可信', low: '数据不足' }
  return map[diagnosis.value?.confidence] || '待分析'
})
const confidenceType = computed(() => {
  const map = { high: 'success', medium: 'warning', low: 'info' }
  return map[diagnosis.value?.confidence] || 'info'
})

async function runAnalysis() {
  loading.value = true
  error.value = ''
  try {
    diagnosis.value = await aiApi.structuredDiagnosis({
      question: `请结合${props.module}页面上下文分析当前经营问题`,
      time_range: 'today',
      include_actions: true
    }, { silentError: true })
  } catch (err) {
    console.error('Module AI analysis failed:', err)
    error.value = 'AI 诊断暂不可用，请稍后重试或先继续处理当前页面数据。'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.module-ai-panel {
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.72) 0%, var(--ds-surface) 100%);
  border: 1px solid rgba(180, 83, 9, 0.16);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 20px;
}

.module-ai-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.module-ai-header p {
  margin: 0 0 6px;
  color: var(--ds-primary);
  font-size: 13px;
  font-weight: 700;
}

.module-ai-header h3 {
  margin: 0;
  color: #111827;
}

.module-ai-alert {
  margin-top: 14px;
}

.module-ai-result {
  margin-top: 16px;
  color: #334155;
}

.summary {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}

.module-ai-result p {
  line-height: 1.7;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mini-grid > div {
  background: white;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.mini-grid strong,
.mini-grid span,
.mini-grid small {
  display: block;
}

.mini-grid strong {
  color: #111827;
  margin-bottom: 8px;
}

.mini-grid span,
.mini-grid small {
  color: #64748b;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .module-ai-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .mini-grid {
    grid-template-columns: 1fr;
  }
}
</style>
