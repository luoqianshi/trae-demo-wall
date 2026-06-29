<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  traits: {
    aggressiveness: number
    sincerity: number
    predictability: number
    senseOfResponsibility: number
    shrewdness: number
    controlDesire: number
  }
}>()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance || !props.traits) return

  const option = {
    radar: {
      indicator: [
        { name: '攻击性', max: 10 },
        { name: '真诚度', max: 10 },
        { name: '可预测性', max: 10 },
        { name: '责任心', max: 10 },
        { name: '心机度', max: 10 },
        { name: '控制欲', max: 10 },
      ],
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#475569',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#f8fafc', '#f1f5f9', '#e2e8f0'],
        },
      },
      axisLine: {
        lineStyle: {
          color: '#cbd5e1',
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              props.traits.aggressiveness,
              props.traits.sincerity,
              props.traits.predictability,
              props.traits.senseOfResponsibility,
              props.traits.shrewdness,
              props.traits.controlDesire,
            ],
            name: '特质画像',
            areaStyle: {
              color: 'rgba(249, 115, 22, 0.2)',
            },
            lineStyle: {
              color: '#f97316',
              width: 2,
            },
            itemStyle: {
              color: '#f97316',
            },
            symbol: 'circle',
            symbolSize: 6,
          },
        ],
      },
    ],
  }

  chartInstance.setOption(option)
}

function handleResize() {
  chartInstance?.resize()
}

watch(() => props.traits, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div ref="chartRef" class="radar-chart"></div>
</template>

<style scoped>
.radar-chart {
  width: 100%;
  height: 320px;
}
</style>