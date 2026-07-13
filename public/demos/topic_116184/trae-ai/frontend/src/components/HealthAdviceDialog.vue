<template>
  <el-dialog
    :model-value="modelValue"
    title="健康建议"
    width="640px"
    destroy-on-close
    @update:model-value="handleVisibleChange"
  >
    <div v-loading="loading" class="advice-content">
      <template v-if="advice">
        <h3 class="advice-title">{{ advice.title }}</h3>
        <!-- 建议内容为后端富文本 HTML，使用 v-html 渲染 -->
        <div class="advice-body" v-html="advice.content"></div>
      </template>

      <el-empty v-else-if="!loading" description="暂无对应的健康建议" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdvice, type HealthAdvice } from '@/api/health'
import logger from '@/utils/logger'

const props = defineProps<{
  // 弹窗显隐（v-model）
  modelValue: boolean
  // 指标项ID
  metricId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const loading = ref(false)
// 健康建议数据，null 表示未加载或无数据
const advice = ref<HealthAdvice | null>(null)

// 加载健康建议
const loadAdvice = async (metricId: number): Promise<void> => {
  loading.value = true
  advice.value = null
  try {
    advice.value = await getAdvice(metricId)
  } catch (e) {
    logger.error('加载健康建议失败', e)
    ElMessage.error('健康建议加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 弹窗显隐变化处理
const handleVisibleChange = (value: boolean): void => {
  emit('update:modelValue', value)
}

// 监听弹窗打开与 metricId 变化，触发加载
watch(
  () => [props.modelValue, props.metricId] as const,
  ([visible, metricId]) => {
    if (visible && metricId !== null) {
      loadAdvice(metricId)
    }
    if (!visible) {
      advice.value = null
    }
  }
)
</script>

<style scoped lang="scss">
.advice-content {
  min-height: 200px;
  line-height: 1.8;
}

.advice-title {
  margin-bottom: 16px;
  padding-bottom: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #667eea;
  border-bottom: 2px solid #f0f0f0;
}

.advice-body {
  font-size: 14px;
  color: #333;

  :deep(h3) {
    margin: 16px 0 8px;
    color: #667eea;
    font-size: 15px;
    font-weight: 600;
  }

  :deep(ul) {
    margin: 8px 0 12px 20px;
  }

  :deep(li) {
    margin-bottom: 6px;
  }

  :deep(.tip) {
    padding: 12px;
    margin: 12px 0;
    background: #e7f3ff;
    border-left: 4px solid #667eea;
    border-radius: 8px;
  }
}
</style>
