<template>
  <div class="page-content">
    <!-- User Header -->
    <div class="bg-gradient-to-br from-primary to-teal-500 rounded-2xl p-5 text-white mb-5">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold border-2 border-white/30">
          小A
        </div>
        <div>
          <div class="text-lg font-bold">高一（3）班</div>
          <div class="text-sm opacity-80">目标：985 院校</div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="bg-white rounded-xl p-3 text-center border border-slate-100">
        <div class="text-2xl font-bold text-primary">{{ stats.totalErrors }}</div>
        <div class="text-xs text-slate-500 mt-1">累计错题</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center border border-slate-100">
        <div class="text-2xl font-bold text-amber-500">{{ stats.streak }}</div>
        <div class="text-xs text-slate-500 mt-1">连续打卡</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center border border-slate-100">
        <div class="text-2xl font-bold text-emerald-500">{{ stats.masteredRate }}%</div>
        <div class="text-xs text-slate-500 mt-1">掌握率</div>
      </div>
    </div>

    <!-- Weekly Activity -->
    <div class="bg-white rounded-xl p-4 border border-slate-100 mb-5">
      <h2 class="text-sm font-bold text-slate-700 mb-3">本周活跃</h2>
      <div class="flex items-end justify-between gap-2 h-24">
        <div
          v-for="(day, i) in weekActivity"
          :key="i"
          class="flex-1 flex flex-col items-center gap-1"
        >
          <div
            class="w-full rounded-t-md transition-all"
            :style="{
              height: day.count * 8 + 'px',
              backgroundColor: day.count > 0 ? '#0d9488' : '#e2e8f0',
              opacity: day.count > 0 ? 0.5 + day.count * 0.1 : 1
            }"
          ></div>
          <span class="text-xs text-slate-500">{{ day.label }}</span>
        </div>
      </div>
    </div>

    <!-- Settings List -->
    <div class="bg-white rounded-xl border border-slate-100 overflow-hidden mb-5">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between active:bg-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary">
            <el-icon><Bell /></el-icon>
          </div>
          <span class="text-sm text-slate-700">复习提醒</span>
        </div>
        <el-switch v-model="settings.reminder" />
      </div>
      <div class="p-4 border-b border-slate-100 flex items-center justify-between active:bg-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <el-icon><Download /></el-icon>
          </div>
          <span class="text-sm text-slate-700">数据导出</span>
        </div>
        <el-icon class="text-slate-400"><ArrowRight /></el-icon>
      </div>
      <div class="p-4 border-b border-slate-100 flex items-center justify-between active:bg-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <el-icon><Upload /></el-icon>
          </div>
          <span class="text-sm text-slate-700">数据导入</span>
        </div>
        <el-icon class="text-slate-400"><ArrowRight /></el-icon>
      </div>
      <div class="p-4 flex items-center justify-between active:bg-slate-50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <el-icon><Setting /></el-icon>
          </div>
          <span class="text-sm text-slate-700">通用设置</span>
        </div>
        <el-icon class="text-slate-400"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- App Info -->
    <div class="text-center">
      <p class="text-xs text-slate-400">高中错题集 v1.0.0</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mockErrors } from '../data/mock'

const stats = {
  totalErrors: mockErrors.length,
  streak: 23,
  masteredRate: Math.round((mockErrors.filter(e => e.status === 'mastered').length / mockErrors.length) * 100),
}

const weekActivity = [
  { label: '一', count: 3 },
  { label: '二', count: 5 },
  { label: '三', count: 2 },
  { label: '四', count: 4 },
  { label: '五', count: 6 },
  { label: '六', count: 1 },
  { label: '日', count: 3 },
]

const settings = ref({
  reminder: true,
})
</script>
