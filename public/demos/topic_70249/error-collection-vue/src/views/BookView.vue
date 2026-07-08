<template>
  <div class="page-content">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">错题本</h1>
      <span class="text-xs text-slate-500">共 {{ filteredErrors.length }} 道</span>
    </div>

    <!-- Filter Bar -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-1">
      <el-select v-model="filter.subject" placeholder="科目" size="small" class="!w-20 shrink-0">
        <el-option label="全部" value="" />
        <el-option label="数学" value="数学" />
        <el-option label="物理" value="物理" />
        <el-option label="化学" value="化学" />
      </el-select>
      <el-select v-model="filter.status" placeholder="状态" size="small" class="!w-24 shrink-0">
        <el-option label="全部" value="" />
        <el-option label="未掌握" value="unmastered" />
        <el-option label="复习中" value="reviewing" />
        <el-option label="已掌握" value="mastered" />
      </el-select>
      <el-select v-model="filter.difficulty" placeholder="难度" size="small" class="!w-20 shrink-0">
        <el-option label="全部" value="" />
        <el-option label="简单" value="easy" />
        <el-option label="中等" value="medium" />
        <el-option label="困难" value="hard" />
      </el-select>
    </div>

    <!-- Error List -->
    <div class="space-y-3">
      <div
        v-for="err in filteredErrors"
        :key="err.id"
        class="bg-white rounded-xl p-4 border border-slate-100"
        :class="{ 'opacity-60': err.status === 'mastered' }"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="text-sm font-medium text-slate-800 leading-relaxed">
            {{ err.content.slice(0, 60) }}{{ err.content.length > 60 ? '...' : '' }}
          </div>
          <span class="text-xs px-2 py-0.5 rounded border shrink-0" :class="difficultyMap[err.difficulty].class">
            {{ difficultyMap[err.difficulty].label }}
          </span>
        </div>
        <div class="flex items-center flex-wrap gap-2 mb-2">
          <span class="text-xs px-2 py-0.5 rounded border" :class="subjectColors[err.subject]">{{ err.subject }}</span>
          <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{{ err.topic }} · {{ err.subTopic }}</span>
          <span
            v-for="r in err.reason"
            :key="r"
            class="text-xs px-2 py-0.5 rounded bg-primary-light text-primary"
          >{{ r }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-400">{{ err.createdAt }}</span>
          <div class="flex gap-2">
            <el-button
              v-if="err.status !== 'mastered'"
              text
              type="success"
              size="small"
              @click="markMastered(err.id)"
            >标记掌握</el-button>
            <el-button text type="primary" size="small">详情</el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredErrors.length === 0" class="text-center py-12">
      <el-icon size="40" class="text-slate-300 mb-2"><DocumentDelete /></el-icon>
      <p class="text-sm text-slate-400">暂无符合条件的错题</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { mockErrors, subjectColors, difficultyMap } from '../data/mock'
import { ElMessage } from 'element-plus'

const filter = ref({
  subject: '',
  status: '',
  difficulty: '',
})

const errors = ref([...mockErrors])

const filteredErrors = computed(() => {
  return errors.value.filter(e => {
    if (filter.value.subject && e.subject !== filter.value.subject) return false
    if (filter.value.status && e.status !== filter.value.status) return false
    if (filter.value.difficulty && e.difficulty !== filter.value.difficulty) return false
    return true
  })
})

function markMastered(id: number) {
  const err = errors.value.find(e => e.id === id)
  if (err) {
    err.status = 'mastered'
    ElMessage.success('已标记为掌握')
  }
}
</script>
