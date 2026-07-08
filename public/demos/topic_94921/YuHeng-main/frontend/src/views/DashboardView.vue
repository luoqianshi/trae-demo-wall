<script setup>
import { ref, onMounted, computed } from 'vue'
import { evaluateHedge, decideHedge, getPortfolioState, getHedgeEvents } from '../api'
import RadarChart from '../components/RadarChart.vue'
import LineChart from '../components/LineChart.vue'
import ParticleBurst from '../components/ParticleBurst.vue'

const amount = ref(1000)
const intention = ref('好累，想花 1000 块买个新耳机')
const loading = ref(false)
const currentEvent = ref(null)
const state = ref({
  coreCapital: 100000,
  cashFlowHealth: 95,
  emotionalROI: 8.5,
  riskExposure: 5000,
})
const events = ref([])
const flash = ref('')
const lastDecision = ref('')
const particleTrigger = ref('')

const fetchState = async () => {
  try {
    const res = await getPortfolioState()
    state.value = res.data
  } catch (e) {
    console.error('获取资产状态失败', e)
  }
}

const fetchEvents = async () => {
  try {
    const res = await getHedgeEvents()
    events.value = res.data
  } catch (e) {
    console.error('获取事件日志失败', e)
  }
}

const submitEvaluation = async () => {
  if (!amount.value || !intention.value.trim()) return
  loading.value = true
  try {
    const res = await evaluateHedge(amount.value, intention.value.trim())
    currentEvent.value = res.data
    lastDecision.value = ''
    flash.value = ''
    await fetchEvents()
  } catch (e) {
    alert('评估失败：' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const makeDecision = async (decision) => {
  if (!currentEvent.value) return
  try {
    await decideHedge(currentEvent.value.eventId, decision)
    lastDecision.value = decision
    particleTrigger.value = decision

    if (decision === 'REJECTED_HEDGE') {
      flash.value = 'red'
    } else {
      flash.value = 'green'
    }
    setTimeout(() => (flash.value = ''), 1500)
    setTimeout(() => (particleTrigger.value = ''), 2500)

    await fetchState()
    await fetchEvents()
    currentEvent.value = null
  } catch (e) {
    alert('决策提交失败：' + (e.response?.data?.message || e.message))
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value || 0)
}

const winRate = computed(() => {
  const decided = events.value.filter(e => e.decisionStatus !== 'PENDING')
  if (decided.length === 0) return 50
  const wins = decided.filter(e => e.decisionStatus === 'ACCEPTED_HEDGE').length
  return (wins / decided.length) * 100
})

onMounted(() => {
  fetchState()
  fetchEvents()
})
</script>

<template>
  <div class="min-h-screen w-full p-4 md:p-6 flex flex-col gap-4">
    <ParticleBurst :trigger="particleTrigger" />

    <!-- 顶部标题 -->
    <header class="glass-panel p-4 flex items-center justify-between shadow-glow">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full bg-terminal-cyan animate-pulse-fast" />
        <h1 class="text-lg md:text-2xl font-bold tracking-wider text-white">
          MindHedge <span class="text-terminal-cyan">|</span> 心智与资产对冲引擎
        </h1>
      </div>
      <div class="text-xs text-slate-400 font-mono hidden md:block">
        SYSTEM: ONLINE // H2:MEM // LANGCHAIN4J:READY
      </div>
    </header>

    <!-- 主体两栏 -->
    <main class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
      <!-- 左侧：交互终端 -->
      <section class="lg:col-span-5 flex flex-col gap-4 min-h-0">
        <!-- 输入区 -->
        <div class="glass-panel p-5 flex flex-col gap-4">
          <h2 class="text-terminal-cyan font-mono text-sm tracking-widest uppercase">
            // 输入你想花的钱
          </h2>
          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="text-xs text-slate-400 font-mono block mb-1">金额 (CNY)</label>
              <input
                v-model.number="amount"
                type="number"
                min="1"
                class="terminal-input w-full px-4 py-2 rounded-lg font-mono"
                placeholder="例如: 1000"
              />
            </div>
            <div>
              <label class="text-xs text-slate-400 font-mono block mb-1">为什么想买？</label>
              <textarea
                v-model="intention"
                rows="3"
                class="terminal-input w-full px-4 py-2 rounded-lg resize-none"
                placeholder="描述你的冲动消费念头..."
              />
            </div>
            <button
              @click="submitEvaluation"
              :disabled="loading"
              class="w-full py-2.5 rounded-lg bg-terminal-cyan/10 border border-terminal-cyan/40 text-terminal-cyan font-mono font-semibold hover:bg-terminal-cyan/20 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'AI 正在理性分析中...' : '执行对冲评估 // EVALUATE' }}
            </button>
          </div>
        </div>

        <!-- AI 分析结果 -->
        <div
          v-if="currentEvent"
          class="glass-panel p-5 flex flex-col gap-4 transition-all duration-500"
          :class="{ 'shadow-glow-red': flash === 'red', 'shadow-glow-green': flash === 'green' }"
        >
          <h2 class="text-terminal-amber font-mono text-sm tracking-widest uppercase">
            // AI 分析报告
          </h2>
          <div class="space-y-3 text-sm leading-relaxed">
            <div>
              <span class="text-slate-400 font-mono text-xs block mb-1">理性分析</span>
              <p class="text-slate-200">{{ currentEvent.analysisMessage }}</p>
            </div>
            <div>
              <span class="text-slate-400 font-mono text-xs block mb-1">推荐平替方案</span>
              <p class="text-terminal-green">{{ currentEvent.hedgeSuggestion }}</p>
            </div>
            <div v-if="currentEvent.estimatedMatrixImpact">
              <span class="text-slate-400 font-mono text-xs block mb-1">预估指标变化</span>
              <div class="grid grid-cols-2 gap-2 text-xs font-mono mt-1">
                <div class="metric-card p-2 text-center">
                  <div class="text-slate-400">长期净资产</div>
                  <div :class="currentEvent.estimatedMatrixImpact.coreCapitalDelta >= 0 ? 'text-terminal-green' : 'text-terminal-red'">
                    {{ currentEvent.estimatedMatrixImpact.coreCapitalDelta >= 0 ? '+' : '' }}{{ formatCurrency(currentEvent.estimatedMatrixImpact.coreCapitalDelta) }}
                  </div>
                </div>
                <div class="metric-card p-2 text-center">
                  <div class="text-slate-400">现金流健康度</div>
                  <div :class="currentEvent.estimatedMatrixImpact.cashFlowDelta >= 0 ? 'text-terminal-green' : 'text-terminal-red'">
                    {{ currentEvent.estimatedMatrixImpact.cashFlowDelta >= 0 ? '+' : '' }}{{ currentEvent.estimatedMatrixImpact.cashFlowDelta.toFixed(1) }}
                  </div>
                </div>
                <div class="metric-card p-2 text-center">
                  <div class="text-slate-400">情绪收益率</div>
                  <div :class="(currentEvent.estimatedMatrixImpact.emotionalROIDelta || 0) >= 0 ? 'text-terminal-green' : 'text-terminal-red'">
                    {{ (currentEvent.estimatedMatrixImpact.emotionalROIDelta || 0) >= 0 ? '+' : '' }}{{ (currentEvent.estimatedMatrixImpact.emotionalROIDelta || 0).toFixed(2) }}%
                  </div>
                </div>
                <div class="metric-card p-2 text-center">
                  <div class="text-slate-400">冲动蒸发资金</div>
                  <div :class="currentEvent.estimatedMatrixImpact.riskExposureDelta <= 0 ? 'text-terminal-green' : 'text-terminal-red'">
                    {{ currentEvent.estimatedMatrixImpact.riskExposureDelta >= 0 ? '+' : '' }}{{ formatCurrency(currentEvent.estimatedMatrixImpact.riskExposureDelta) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              @click="makeDecision('ACCEPTED_HEDGE')"
              class="btn-hedge py-3 rounded-lg font-mono font-semibold text-sm"
            >
              【执行对冲指令】
            </button>
            <button
              @click="makeDecision('REJECTED_HEDGE')"
              class="btn-expose py-3 rounded-lg font-mono font-semibold text-sm"
            >
              【无视预警，执意消费】
            </button>
          </div>
        </div>

        <!-- 事件日志 -->
        <div class="glass-panel p-4 flex-1 min-h-[200px] flex flex-col">
          <h2 class="text-slate-400 font-mono text-sm tracking-widest uppercase mb-3">
            // 近期冲动记录
          </h2>
          <div class="flex-1 overflow-y-auto space-y-2 pr-1">
            <div
              v-for="event in events"
              :key="event.id"
              class="metric-card p-3 text-xs font-mono"
            >
              <div class="flex justify-between items-start mb-1">
                <span class="text-terminal-cyan">¥{{ event.amount }}</span>
                <span
                  class="px-2 py-0.5 rounded text-[10px]"
                  :class="{
                    'bg-terminal-green/10 text-terminal-green': event.decisionStatus === 'ACCEPTED_HEDGE',
                    'bg-terminal-red/10 text-terminal-red': event.decisionStatus === 'REJECTED_HEDGE',
                    'bg-slate-700 text-slate-300': event.decisionStatus === 'PENDING',
                  }"
                >
                  {{ event.decisionStatus === 'ACCEPTED_HEDGE' ? '已对冲' : event.decisionStatus === 'REJECTED_HEDGE' ? '已消费' : '待决策' }}
                </span>
              </div>
              <div class="text-slate-300 truncate">{{ event.originalIntention }}</div>
              <div v-if="event.hedgeSuggestion" class="text-slate-500 mt-1 truncate">
                → {{ event.hedgeSuggestion }}
              </div>
            </div>
            <div v-if="events.length === 0" class="text-slate-500 text-xs font-mono text-center py-8">
              暂无冲动记录
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：数据可视化大屏 -->
      <section class="lg:col-span-7 flex flex-col gap-4 min-h-0">
        <!-- 指标卡片区 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            class="metric-card p-4 transition-all duration-500"
            :class="{ 'shadow-glow-green': flash === 'green', 'animate-flash-red': flash === 'red' }"
          >
            <div class="text-xs text-slate-400 font-mono mb-1">长期净资产 <span class="opacity-60">(Core Wealth)</span></div>
            <div class="text-lg md:text-xl font-bold font-mono text-terminal-cyan">
              {{ formatCurrency(state.coreCapital) }}
            </div>
          </div>
          <div
            class="metric-card p-4 transition-all duration-500"
            :class="{ 'shadow-glow-green': flash === 'green' }"
          >
            <div class="text-xs text-slate-400 font-mono mb-1">现金流健康度 <span class="opacity-60">(Cash Health)</span></div>
            <div class="text-lg md:text-xl font-bold font-mono text-terminal-green">
              {{ state.cashFlowHealth?.toFixed(1) }}%
            </div>
          </div>
          <div
            class="metric-card p-4 transition-all duration-500"
            :class="{ 'shadow-glow-green': flash === 'green' }"
          >
            <div class="text-xs text-slate-400 font-mono mb-1">情绪收益率 <span class="opacity-60">(Emo-ROI)</span></div>
            <div class="text-lg md:text-xl font-bold font-mono text-terminal-amber">
              {{ state.emotionalROI?.toFixed(2) }}%
            </div>
          </div>
          <div
            class="metric-card p-4 transition-all duration-500"
            :class="{
              'shadow-glow-red': lastDecision === 'REJECTED_HEDGE',
              'animate-flash-red': flash === 'red',
              'scale-105': lastDecision === 'REJECTED_HEDGE',
            }"
          >
            <div class="text-xs text-slate-400 font-mono mb-1">冲动蒸发资金 <span class="opacity-60">(Risk Exposure)</span></div>
            <div class="text-lg md:text-xl font-bold font-mono" :class="lastDecision === 'REJECTED_HEDGE' ? 'text-terminal-red animate-pulse-fast' : 'text-terminal-red'">
              {{ formatCurrency(state.riskExposure) }}
            </div>
          </div>
        </div>

        <!-- 累计战绩 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="metric-card p-3 flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-400 font-mono">累计省下 <span class="opacity-60">(Saved)</span></div>
              <div class="text-xl font-bold font-mono text-terminal-green">{{ formatCurrency(state.savedMoney) }}</div>
            </div>
            <div class="w-8 h-8 rounded-full bg-terminal-green/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-terminal-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="metric-card p-3 flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-400 font-mono">累计决策 <span class="opacity-60">(Decisions)</span></div>
              <div class="text-xl font-bold font-mono text-terminal-cyan">{{ state.totalDecisions || 0 }}</div>
            </div>
            <div class="w-8 h-8 rounded-full bg-terminal-cyan/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-terminal-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 雷达图 -->
        <div class="glass-panel p-4 flex-1 min-h-[320px] flex flex-col">
          <h2 class="text-terminal-cyan font-mono text-sm tracking-widest uppercase mb-2">
            // 多维资产网络雷达
          </h2>
          <div class="flex-1 relative">
            <RadarChart :state="state" :flash="flash" :win-rate="winRate" />
          </div>
        </div>

        <!-- 折线图 -->
        <div
          class="glass-panel p-4 flex-1 min-h-[280px] flex flex-col transition-all duration-500"
          :class="{ 'shadow-glow-red': lastDecision === 'REJECTED_HEDGE', 'shadow-glow-green': lastDecision === 'ACCEPTED_HEDGE' }"
        >
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-mono text-sm tracking-widest uppercase" :class="lastDecision === 'REJECTED_HEDGE' ? 'text-terminal-red' : 'text-terminal-cyan'">
              // 未来财富折损模拟 <span class="opacity-60">(NPV Model)</span>
            </h2>
            <div class="relative group">
              <button class="w-5 h-5 rounded-full border border-slate-500 text-slate-400 text-xs hover:border-terminal-cyan hover:text-terminal-cyan transition-colors flex items-center justify-center">
                ?
              </button>
              <div class="absolute right-0 top-7 w-72 p-3 rounded-lg glass-panel border-terminal-cyan/30 text-xs text-slate-300 leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 shadow-glow">
                <p class="mb-2"><span class="text-terminal-green font-bold">绿色曲线</span>：若你选择执行对冲，省下的钱按 7% 年化复利增长，展示未来 10 年的资产增值路径。</p>
                <p class="mb-2"><span class="text-terminal-red font-bold">红色曲线</span>：若你执意消费，这笔钱按每年 15% 贬值（沉没成本），展示资产缩水路径。</p>
                <p><span class="text-terminal-cyan font-bold">分析价值</span>：把"现在想买"的快感，换算成未来 10 年的真实财富差距，让冲动可见、可量化。</p>
              </div>
            </div>
          </div>
          <div class="flex-1 relative">
            <LineChart
              :state="state"
              :amount="currentEvent?.amount || 0"
              :decision="lastDecision"
            />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
