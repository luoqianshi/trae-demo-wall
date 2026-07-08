<template>
  <div class="page-content">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-slate-800">晚上好，小A</h1>
        <p class="text-sm text-slate-500 mt-1">今天是高考倒计时 {{ countdown }} 天</p>
      </div>
      <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
        A
      </div>
    </div>

    <!-- Today's Review Card -->
    <div class="bg-gradient-to-br from-primary to-teal-500 rounded-2xl p-5 text-white mb-5 shadow-lg shadow-teal-200">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm opacity-90">今日复习任务</span>
        <el-tag size="small" effect="dark" class="!bg-white/20 !border-0 !text-white">
          {{ reviewItems.length }} 道待复习
        </el-tag>
      </div>
      <div class="flex items-end gap-1 mb-3">
        <span class="text-4xl font-bold">{{ reviewItems.length }}</span>
        <span class="text-sm opacity-80 mb-1">道题</span>
      </div>
      <div class="w-full bg-white/20 rounded-full h-2 mb-4">
        <div class="bg-white rounded-full h-2" style="width: 40%"></div>
      </div>
      <el-button
        type="primary"
        class="w-full !bg-white !text-primary !border-0 font-semibold"
        size="large"
        round
        @click="$router.push('/review')"
      >
        开始今日复习
      </el-button>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="bg-white rounded-xl p-3 text-center border border-slate-100">
        <div class="text-xl font-bold text-primary">{{ totalErrors }}</div>
        <div class="text-xs text-slate-500 mt-1">累计错题</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center border border-slate-100">
        <div class="text-xl font-bold text-amber-500">{{ streakDays }}</div>
        <div class="text-xs text-slate-500 mt-1">连续打卡</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center border border-slate-100">
        <div class="text-xl font-bold text-emerald-500">{{ masteredCount }}</div>
        <div class="text-xs text-slate-500 mt-1">已掌握</div>
      </div>
    </div>

    <!-- Weak Points -->
    <div class="bg-white rounded-xl p-4 border border-slate-100 mb-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-slate-800">薄弱知识点 TOP 3</h2>
        <el-button text type="primary" size="small" @click="$router.push('/analysis')">查看全部</el-button>
      </div>
      <div class="space-y-3">
        <div v-for="(item, i) in weakPoints" :key="i" class="flex items-center gap-3">
          <div class="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-bold">{{ i + 1 }}</div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-slate-700">{{ item.name }}</span>
              <span class="text-xs text-red-500 font-semibold">{{ item.rate }}%</span>
            </div>
            <el-progress :percentage="item.rate" :color="'#ef4444'" :show-text="false" :stroke-width="6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div
        class="bg-white rounded-xl p-4 border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform"
        @click="$router.push('/record')"
      >
        <div class="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary">
          <el-icon size="24"><Camera /></el-icon>
        </div>
        <span class="text-sm font-medium text-slate-700">拍照录题</span>
      </div>
      <div
        class="bg-white rounded-xl p-4 border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform"
        @click="$router.push('/distribution')"
      >
        <div class="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
          <el-icon size="24"><PieChart /></el-icon>
        </div>
        <span class="text-sm font-medium text-slate-700">知识分布</span>
      </div>
    </div>

    <!-- Recent Errors -->
    <div class="bg-white rounded-xl p-4 border border-slate-100">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-slate-800">最近录入</h2>
        <el-button text type="primary" size="small" @click="$router.push('/book')">查看全部</el-button>
      </div>
      <div class="space-y-3">
        <div
          v-for="err in recentErrors"
          :key="err.id"
          class="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
        >
          <div class="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-400 shrink-0">
            <el-icon><Document /></el-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-800 truncate">{{ err.content.slice(0, 30) }}...</div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-2 py-0.5 rounded border" :class="subjectColors[err.subject]">{{ err.subject }}</span>
              <span class="text-xs text-slate-400">{{ err.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mockErrors, subjectColors, reviewItems } from '../data/mock'

const countdown = 340
const streakDays = 23

const totalErrors = mockErrors.length
const masteredCount = mockErrors.filter(e => e.status === 'mastered').length

const weakPoints = [
  { name: '三角函数', rate: 80 },
  { name: '电磁感应', rate: 75 },
  { name: '解析几何', rate: 70 },
]

const recentErrors = computed(() => mockErrors.slice(0, 3))
</script>
