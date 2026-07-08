<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import echarts from '../utils/echarts.js'

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
  flash: {
    type: String,
    default: '',
  },
  winRate: {
    type: Number,
    default: 50,
  },
})

const chartRef = ref(null)
let chart = null
let pulseTimer = null

const normalize = (value, max) => Math.max(0, Math.min(100, (value / max) * 100))

const buildOption = (state, glow = false) => {
  const core = normalize(state.coreCapital, 150000)
  const cash = state.cashFlowHealth
  const roi = normalize(state.emotionalROI, 20)
  const risk = normalize(state.riskExposure, 50000)
  const win = Math.max(0, Math.min(100, props.winRate))

  const isRed = props.flash === 'red'
  const mainColor = isRed ? '#F87171' : '#22D3EE'
  const fillColor = isRed ? 'rgba(248, 113, 113, 0.28)' : 'rgba(34, 211, 238, 0.22)'

  const dataValue = [core, cash, roi, risk, win]

  const series = [
    {
      name: '资产状态',
      type: 'radar',
      data: [
        {
          value: dataValue,
          name: '当前投资组合',
          symbol: 'circle',
          symbolSize: glow && !isRed ? 10 : 6,
          lineStyle: {
            width: glow ? 4 : 2,
            color: mainColor,
            shadowBlur: glow ? 24 : 12,
            shadowColor: mainColor,
          },
          areaStyle: {
            color: fillColor,
            shadowBlur: glow ? 32 : 16,
            shadowColor: mainColor,
          },
          itemStyle: {
            color: mainColor,
            shadowBlur: glow ? 16 : 8,
            shadowColor: mainColor,
          },
        },
      ],
      animationDuration: glow ? 300 : 800,
      animationEasing: 'cubicOut',
    },
  ]

  if (glow) {
    series.push({
      name: '脉冲环',
      type: 'radar',
      data: [
        {
          value: dataValue,
          name: '脉冲',
          symbol: 'none',
          lineStyle: {
            width: 1,
            color: isRed ? 'rgba(248, 113, 113, 0.35)' : 'rgba(74, 222, 128, 0.35)',
          },
          areaStyle: {
            color: 'transparent',
          },
          itemStyle: { opacity: 0 },
        },
      ],
      animationDuration: 1200,
      animationEasing: 'elasticOut',
      z: 0,
    })
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(34, 211, 238, 0.3)',
      textStyle: { color: '#E2E8F0' },
      formatter: (params) => {
        const raw = {
          长期净资产: state.coreCapital.toFixed(0),
          现金流健康度: state.cashFlowHealth.toFixed(1),
          情绪收益率: state.emotionalROI.toFixed(2),
          冲动蒸发资金: state.riskExposure.toFixed(0),
          对冲胜率: win.toFixed(1) + '%',
        }
        return `<div style="font-weight:600">${params.name}</div>` +
          Object.entries(raw).map(([k, v]) => `${k}: ${v}`).join('<br>')
      },
    },
    radar: {
      indicator: [
        { name: '长期净资产', max: 100 },
        { name: '现金流健康度', max: 100 },
        { name: '情绪收益率', max: 100 },
        { name: '冲动蒸发资金', max: 100 },
        { name: '对冲胜率', max: 100 },
      ],
      center: ['50%', '52%'],
      radius: '62%',
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#94A3B8',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: isRed ? 'rgba(248, 113, 113, 0.18)' : 'rgba(56, 189, 248, 0.15)',
        },
      },
      splitArea: {
        areaStyle: {
          color: isRed
            ? ['rgba(248, 113, 113, 0.04)', 'rgba(248, 113, 113, 0.08)']
            : ['rgba(34, 211, 238, 0.02)', 'rgba(34, 211, 238, 0.05)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: isRed ? 'rgba(248, 113, 113, 0.22)' : 'rgba(56, 189, 248, 0.2)',
        },
      },
    },
    series,
  }
}

const render = (glow = false) => {
  if (!chart) return
  chart.setOption(buildOption(props.state, glow), true)
}

const triggerPulse = () => {
  render(true)
  if (pulseTimer) clearTimeout(pulseTimer)
  pulseTimer = setTimeout(() => {
    render(false)
  }, 1200)
}

onMounted(() => {
  nextTick(() => {
    chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
    render(false)
    window.addEventListener('resize', chart.resize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', chart?.resize)
  chart?.dispose()
  if (pulseTimer) clearTimeout(pulseTimer)
})

watch(() => props.state, () => render(false), { deep: true })
watch(() => props.winRate, () => render(false))
watch(() => props.flash, (val) => {
  if (val) triggerPulse()
})
</script>

<template>
  <div ref="chartRef" class="w-full h-full min-h-[320px]" />
</template>
