<template>
  <div class="page-content">
    <h1 class="text-lg font-bold mb-4">今日复习</h1>

    <!-- Progress Header -->
    <div class="bg-white rounded-xl p-4 border border-slate-100 mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-slate-600">今日进度</span>
        <span class="text-sm font-bold text-primary">{{ completedCount }} / {{ reviewItems.length }}</span>
      </div>
      <el-progress
        :percentage="progressPercent"
        :color="'#0d9488'"
        :stroke-width="10"
        :show-text="false"
      />
      <p class="text-xs text-slate-400 mt-2">预计还需 {{ remainingTime }} 分钟</p>
    </div>

    <!-- Review Cards -->
    <div v-if="!currentReview" class="space-y-3">
      <div
        v-for="item in pendingItems"
        :key="item.id"
        class="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3"
      >
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          :class="item.priority === 'high' ? 'bg-red-50 text-red-500' : item.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'"
        >
          <el-icon size="20"><Warning /></el-icon>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-800 truncate">{{ item.title }}</div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs px-2 py-0.5 rounded border" :class="subjectColors[item.subject]">{{ item.subject }}</span>
            <span class="text-xs text-slate-400">{{ item.daysLeft === 0 ? '今天' : item.daysLeft + '天后' }}复习</span>
          </div>
        </div>
        <el-button
          type="primary"
          size="small"
          round
          class="!bg-primary !border-primary shrink-0"
          @click="startReview(item)"
        >
          开始
        </el-button>
      </div>
    </div>

    <!-- Review Mode -->
    <div v-else class="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <!-- Question Card -->
      <div class="p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs px-2 py-0.5 rounded border" :class="subjectColors[currentReview.subject]">{{ currentReview.subject }}</span>
          <span class="text-xs text-slate-400">第 {{ completedCount + 1 }} / {{ reviewItems.length }} 题</span>
        </div>
        <p class="text-base text-slate-800 leading-relaxed mb-4">
          {{ getErrorContent(currentReview.id) }}
        </p>

        <!-- Flip to see answer -->
        <div
          v-if="!showAnswer"
          class="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer active:bg-slate-50 transition-colors"
          @click="showAnswer = true"
        >
          <el-icon size="24" class="text-slate-300 mb-2"><View /></el-icon>
          <p class="text-sm text-slate-400">点击显示答案与解析</p>
        </div>

        <div v-else class="bg-emerald-50 rounded-xl p-4 mb-4">
          <div class="text-sm font-medium text-emerald-700 mb-1">正确答案</div>
          <p class="text-sm text-slate-700">{{ getCorrectAnswer(currentReview.id) }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="p-4 border-t border-slate-100 flex gap-3">
        <el-button class="flex-1" size="large" round @click="skipReview">
          <el-icon class="mr-1"><ArrowRight /></el-icon>
          跳过
        </el-button>
        <el-button
          v-if="showAnswer"
          type="danger"
          class="flex-1"
          size="large"
          round
          plain
          @click="markWrongAgain"
        >
          <el-icon class="mr-1"><CircleClose /></el-icon>
          再次做错
        </el-button>
        <el-button
          v-if="showAnswer"
          type="success"
          class="flex-1 !bg-emerald-500 !border-emerald-500"
          size="large"
          round
          @click="markMastered"
        >
          <el-icon class="mr-1"><CircleCheck /></el-icon>
          已掌握
        </el-button>
        <el-button
          v-else
          type="primary"
          class="flex-1 !bg-primary !border-primary"
          size="large"
          round
          @click="showAnswer = true"
        >
          查看答案
        </el-button>
      </div>
    </div>

    <!-- Completed State -->
    <div v-if="pendingItems.length === 0 && !currentReview" class="text-center py-16">
      <div class="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary mx-auto mb-4">
        <el-icon size="32"><Trophy /></el-icon>
      </div>
      <h2 class="text-lg font-bold text-slate-800 mb-2">今日复习完成！</h2>
      <p class="text-sm text-slate-500 mb-4">已完成全部 {{ reviewItems.length }} 道错题的复习</p>
      <el-button type="primary" round class="!bg-primary !border-primary" @click="$router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { reviewItems, mockErrors, subjectColors } from '../data/mock'
import { ElMessage } from 'element-plus'

interface ReviewItem {
  id: number
  title: string
  subject: string
  daysLeft: number
  priority: string
}

const items = ref<ReviewItem[]>([...reviewItems])
const completedIds = ref<number[]>([])
const currentReview = ref<ReviewItem | null>(null)
const showAnswer = ref(false)

const pendingItems = computed(() => items.value.filter(i => !completedIds.value.includes(i.id)))
const completedCount = computed(() => completedIds.value.length)
const progressPercent = computed(() => Math.round((completedCount.value / items.value.length) * 100))
const remainingTime = computed(() => pendingItems.value.length * 3)

function startReview(item: ReviewItem) {
  currentReview.value = item
  showAnswer.value = false
}

function getErrorContent(id: number) {
  const err = mockErrors.find(e => e.id === id)
  return err?.content || '题目内容...'
}

function getCorrectAnswer(id: number) {
  const err = mockErrors.find(e => e.id === id)
  return err?.correctAnswer || '详见解析...'
}

function markMastered() {
  if (currentReview.value) {
    completedIds.value.push(currentReview.value.id)
    ElMessage.success('已掌握，继续加油！')
    currentReview.value = null
  }
}

function markWrongAgain() {
  if (currentReview.value) {
    completedIds.value.push(currentReview.value.id)
    ElMessage.warning('已记录，该题将提高复习优先级')
    currentReview.value = null
  }
}

function skipReview() {
  if (currentReview.value) {
    currentReview.value = null
  }
}
</script>
