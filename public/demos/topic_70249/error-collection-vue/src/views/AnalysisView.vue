<template>
  <div class="page-content">
    <h1 class="text-lg font-bold mb-4">知识点分析</h1>

    <!-- Subject Tabs -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="sub in subjects"
        :key="sub.key"
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="activeSubject === sub.key ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-200'"
        @click="activeSubject = sub.key"
      >
        {{ sub.label }}
      </button>
    </div>

    <!-- Radar Chart -->
    <div class="bg-white rounded-xl p-4 border border-slate-100 mb-4">
      <h2 class="text-sm font-bold text-slate-700 mb-2">错误率雷达图</h2>
      <div ref="radarChartRef" style="width:100%;height:320px"></div>
    </div>

    <!-- Weak Points Cards -->
    <div class="bg-white rounded-xl p-4 border border-slate-100 mb-4">
      <h2 class="text-sm font-bold text-slate-700 mb-3">薄弱知识点 TOP 5</h2>
      <div class="space-y-3">
        <div
          v-for="(item, i) in weakList"
          :key="i"
          class="flex items-center gap-3"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            :class="i < 3 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'"
          >{{ i + 1 }}</div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-slate-700">{{ item.name }}</span>
              <span class="text-xs font-semibold" :class="item.value >= 70 ? 'text-red-500' : 'text-amber-500'">
                {{ item.value }}%
              </span>
            </div>
            <el-progress
              :percentage="item.value"
              :color="item.value >= 70 ? '#ef4444' : item.value >= 50 ? '#f59e0b' : '#0d9488'"
              :show-text="false"
              :stroke-width="8"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Trend Chart -->
    <div class="bg-white rounded-xl p-4 border border-slate-100">
      <h2 class="text-sm font-bold text-slate-700 mb-2">错误趋势（近4周）</h2>
      <div ref="trendChartRef" style="width:100%;height:220px"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { knowledgeData } from '../data/mock'

const subjects = [
  { key: 'math', label: '数学' },
  { key: 'physics', label: '物理' },
  { key: 'chemistry', label: '化学' },
]

const activeSubject = ref('math')
const radarChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

const currentData = computed(() => knowledgeData[activeSubject.value as keyof typeof knowledgeData] || [])

const weakList = computed(() => {
  return [...currentData.value].sort((a, b) => b.value - a.value).slice(0, 5)
})

let radarChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

function initRadar() {
  if (!radarChart || !radarChartRef.value) return
  const data = currentData.value
  radarChart.setOption({
    animation: false,
    tooltip: { trigger: 'item' },
    radar: {
      indicator: data.map(d => ({ name: d.name, max: 100 })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: data.map(d => d.value),
        name: '错误率',
        lineStyle: { color: '#0d9488', width: 2 },
        itemStyle: { color: '#0d9488' },
        areaStyle: { color: 'rgba(13,148,136,0.2)' },
      }]
    }]
  })
}

function initTrend() {
  if (!trendChart || !trendChartRef.value) return
  const weeks = ['第1周', '第2周', '第3周', '第4周']
  const data = currentData.value.slice(0, 4)
  trendChart.setOption({
    animation: false,
    tooltip: { trigger: 'axis' },
    grid: { top: 20, bottom: 30, left: 40, right: 20 },
    xAxis: {
      type: 'category',
      data: weeks,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    series: [{
      type: 'line',
      data: data.map(d => Math.round(d.value * (0.8 + Math.random() * 0.4))),
      smooth: true,
      lineStyle: { color: '#0d9488', width: 2 },
      itemStyle: { color: '#0d9488' },
      areaStyle: { color: 'rgba(13,148,136,0.1)' },
      symbol: 'circle',
      symbolSize: 6,
    }]
  })
}

onMounted(() => {
  nextTick(() => {
    if (radarChartRef.value) {
      radarChart = echarts.init(radarChartRef.value)
      initRadar()
    }
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
      initTrend()
    }
  })
})

watch(activeSubject, () => {
  nextTick(() => {
    initRadar()
    initTrend()
  })
})

onUnmounted(() => {
  radarChart?.dispose()
  trendChart?.dispose()
})
</script>
