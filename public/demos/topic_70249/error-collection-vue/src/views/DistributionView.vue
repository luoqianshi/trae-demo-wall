<template>
  <div class="page-content">
    <h1 class="text-lg font-bold mb-4">知识点分布</h1>

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

    <!-- Time Filter -->
    <div class="flex gap-2 mb-4">
      <el-radio-group v-model="timeRange" size="small">
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="semester">本学期</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Heatmap Chart -->
    <div class="bg-white rounded-xl p-4 border border-slate-100 mb-4">
      <h2 class="text-sm font-bold text-slate-700 mb-2">错误密度热力图</h2>
      <div ref="heatmapChartRef" style="width:100%;height:380px"></div>
    </div>

    <!-- Knowledge Coverage -->
    <div class="bg-white rounded-xl p-4 border border-slate-100 mb-4">
      <h2 class="text-sm font-bold text-slate-700 mb-3">知识覆盖情况</h2>
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-slate-600">已覆盖知识点</span>
        <span class="text-sm font-bold text-primary">{{ coverage.current }} / {{ coverage.total }}</span>
      </div>
      <el-progress :percentage="coveragePercent" :color="'#0d9488'" :stroke-width="10" />
      <p class="text-xs text-slate-400 mt-2">还有 {{ coverage.total - coverage.current }} 个知识点尚未练习到</p>
    </div>

    <!-- Topic List -->
    <div class="bg-white rounded-xl p-4 border border-slate-100">
      <h2 class="text-sm font-bold text-slate-700 mb-3">知识点详情</h2>
      <div class="space-y-2">
        <div
          v-for="topic in topicDetails"
          :key="topic.name"
          class="flex items-center justify-between p-3 rounded-lg bg-slate-50"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-3 h-3 rounded-full"
              :class="topic.errorCount > 0 ? 'bg-red-400' : 'bg-green-400'"
            ></div>
            <span class="text-sm text-slate-700">{{ topic.name }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-500">{{ topic.errorCount }} 道错题</span>
            <span
              class="text-xs px-2 py-0.5 rounded"
              :class="topic.mastered ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'"
            >{{ topic.mastered ? '已掌握' : '需巩固' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const subjects = [
  { key: 'math', label: '数学' },
  { key: 'physics', label: '物理' },
  { key: 'chemistry', label: '化学' },
]

const activeSubject = ref('math')
const timeRange = ref('month')
const heatmapChartRef = ref<HTMLElement>()

const coverage = ref({ current: 42, total: 86 })
const coveragePercent = computed(() => Math.round((coverage.value.current / coverage.value.total) * 100))

const topicDetails = ref([
  { name: '函数单调性', errorCount: 5, mastered: false },
  { name: '三角函数诱导公式', errorCount: 8, mastered: false },
  { name: '等差数列', errorCount: 2, mastered: true },
  { name: '椭圆弦长', errorCount: 4, mastered: false },
  { name: '导数极值', errorCount: 6, mastered: false },
  { name: '概率分布', errorCount: 1, mastered: true },
  { name: '立体几何体积', errorCount: 3, mastered: false },
  { name: '解析几何直线', errorCount: 0, mastered: true },
])

let heatmapChart: echarts.ECharts | null = null

function initHeatmap() {
  if (!heatmapChart || !heatmapChartRef.value) return

  const xData = ['集合', '函数', '三角', '数列', '导数', '立体', '解析', '概率']
  const yData = ['基础', '应用', '计算', '证明', '综合']

  const data: [number, number, number][] = []
  for (let i = 0; i < xData.length; i++) {
    for (let j = 0; j < yData.length; j++) {
      const val = Math.round(Math.random() * 50)
      data.push([i, j, val])
    }
  }

  heatmapChart.setOption({
    animation: false,
    tooltip: {
      position: 'top',
      formatter: (p: any) => `${xData[p.value[0]]} · ${yData[p.value[1]]}<br/>错误密度: ${p.value[2]}`,
    },
    grid: { top: 10, bottom: 60, left: 60, right: 10 },
    xAxis: {
      type: 'category',
      data: xData,
      splitArea: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'category',
      data: yData,
      splitArea: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11 },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    visualMap: {
      min: 0,
      max: 50,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      itemWidth: 12,
      itemHeight: 80,
      inRange: { color: ['#f0fdfa', '#99f6e4', '#2dd4bf', '#0f766e', '#0d9488'] },
      textStyle: { color: '#64748b', fontSize: 10 },
    },
    series: [{
      type: 'heatmap',
      data: data,
      label: { show: true, fontSize: 10, color: '#1e293b' },
      itemStyle: { borderColor: '#e2e8f0', borderWidth: 1 },
    }]
  })
}

onMounted(() => {
  nextTick(() => {
    if (heatmapChartRef.value) {
      heatmapChart = echarts.init(heatmapChartRef.value)
      initHeatmap()
    }
  })
})

watch([activeSubject, timeRange], () => {
  nextTick(() => initHeatmap())
})

onUnmounted(() => {
  heatmapChart?.dispose()
})
</script>
