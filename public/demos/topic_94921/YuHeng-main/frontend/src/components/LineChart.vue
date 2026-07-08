<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import echarts from '../utils/echarts.js'

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  decision: {
    type: String,
    default: '',
  },
})

const chartRef = ref(null)
let chart = null

const years = 10
const rate = 0.07
const depreciation = 0.15

const yearsLabel = computed(() => {
  return Array.from({ length: years + 1 }, (_, i) => `T+${i}年`)
})

const buildSeries = (state, amount, decision) => {
  const base = state.coreCapital
  const isRejected = decision === 'REJECTED_HEDGE'
  const isAccepted = decision === 'ACCEPTED_HEDGE'

  const investLine = Array.from({ length: years + 1 }, (_, i) =>
    Math.round((base + amount * Math.pow(1 + rate, i)) * 100) / 100
  )
  const consumeLine = Array.from({ length: years + 1 }, (_, i) => {
    const depreciated = i === 0 ? amount : amount * Math.pow(1 - depreciation, i)
    return Math.round((base - depreciated) * 100) / 100
  })

  const investColor = isRejected ? '#64748B' : '#4ADE80'
  const consumeColor = isRejected ? '#F87171' : '#94A3B8'
  const investWidth = isAccepted ? 4 : 3
  const consumeWidth = isRejected ? 5 : 3

  const series = [
    {
      name: '对冲/投资路径',
      type: 'line',
      smooth: true,
      data: investLine,
      lineStyle: {
        width: investWidth,
        color: investColor,
        shadowBlur: isAccepted ? 20 : 0,
        shadowColor: investColor,
      },
      itemStyle: { color: investColor },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: isAccepted ? 'rgba(74, 222, 128, 0.45)' : 'rgba(74, 222, 128, 0.3)' },
            { offset: 1, color: 'rgba(74, 222, 128, 0)' },
          ],
        },
      },
      symbolSize: isAccepted ? 8 : 6,
      animationDuration: 1200,
      animationEasing: 'cubicOut',
    },
    {
      name: '消费/贬值路径',
      type: 'line',
      smooth: true,
      data: consumeLine,
      lineStyle: {
        width: consumeWidth,
        color: consumeColor,
        type: isRejected ? 'solid' : 'dashed',
        shadowBlur: isRejected ? 24 : 0,
        shadowColor: consumeColor,
      },
      itemStyle: { color: consumeColor },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: isRejected ? 'rgba(248, 113, 113, 0.55)' : 'rgba(148, 163, 184, 0.15)' },
            { offset: 1, color: 'rgba(148, 163, 184, 0)' },
          ],
        },
      },
      symbolSize: isRejected ? 8 : 6,
      animationDuration: 1200,
      animationEasing: 'cubicOut',
      markArea: isRejected ? {
        silent: true,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(248, 113, 113, 0.28)' },
              { offset: 1, color: 'rgba(248, 113, 113, 0.02)' },
            ],
          },
        },
        data: [[
          { name: '价值蒸发区', xAxis: 'T+1年', yAxis: investLine[1] },
          { xAxis: `T+${years}年`, yAxis: consumeLine[years] },
        ]],
      } : undefined,
    },
  ]

  return series
}

const buildOption = (state, amount, decision) => {
  const isRejected = decision === 'REJECTED_HEDGE'
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: isRejected ? 'rgba(248, 113, 113, 0.4)' : 'rgba(34, 211, 238, 0.3)',
      textStyle: { color: '#E2E8F0' },
      formatter: (params) => {
        let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`
        params.forEach(p => {
          html += `<div style="display:flex;align-items:center;gap:6px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            <span>${p.seriesName}: ¥${Number(p.value).toLocaleString()}</span>
          </div>`
        })
        return html
      },
    },
    legend: {
      data: ['对冲/投资路径', '消费/贬值路径'],
      textStyle: { color: '#94A3B8' },
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: yearsLabel.value,
      axisLine: { lineStyle: { color: isRejected ? 'rgba(248, 113, 113, 0.25)' : 'rgba(148, 163, 184, 0.3)' } },
      axisLabel: { color: '#94A3B8' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isRejected ? 'rgba(248, 113, 113, 0.08)' : 'rgba(148, 163, 184, 0.12)' } },
      axisLabel: {
        color: '#94A3B8',
        formatter: (value) => `¥${(value / 1000).toFixed(0)}k`,
      },
    },
    series: buildSeries(state, amount, decision),
  }
}

const render = () => {
  if (!chart) return
  chart.setOption(buildOption(props.state, props.amount, props.decision), true)
}

onMounted(() => {
  nextTick(() => {
    chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
    render()
    window.addEventListener('resize', chart.resize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', chart?.resize)
  chart?.dispose()
})

watch(() => [props.state, props.amount, props.decision], render, { deep: true })
</script>

<template>
  <div ref="chartRef" class="w-full h-full min-h-[280px]" />
</template>
