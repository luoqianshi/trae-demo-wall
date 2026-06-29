<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings, Loader, Brain, Target, Lightbulb, Route, ChevronRight } from 'lucide-vue-next'
import CryptoJS from 'crypto-js'
import ConfigCard from '@/components/ConfigCard.vue'
import RadarChart from '@/components/RadarChart.vue'

interface AnalysisResult {
  personType: string
  confidence: number
  analysis: string
  traits: {
    aggressiveness: number
    sincerity: number
    predictability: number
    senseOfResponsibility: number
    shrewdness: number
    controlDesire: number
  }
  suggestions: string[]
  actionSteps: string[]
}

const description = ref('')
const isAnalyzing = ref(false)
const result = ref<AnalysisResult | null>(null)
const error = ref<string | null>(null)

const apiKey = ref('')
const baseUrl = ref('')
const model = ref('deepseek-v4-pro')
const showConfig = ref(false)
const apiConfigured = ref(false)

const secretKey = 'eqagent-2024-secret'

// 示例描述
const examples = [
  '有个同事平时跟我关系不错，但上次报销审批他突然死抠条款不给签字，我哭了一场他也不松口',
  '领导特别爱给我们讲大道理，但是他自己从来做不到，还总用道德绑架我们',
  '有个朋友每次有好处都第一个来蹭，出了事第一个跑，平时总说要跟我好好干',
  '婆婆总是干涉我们的生活，什么都要管，还总说为我们好',
  '舍友总是偷偷用我的东西，但当面又装作很客气',
  '导师布置任务总是很模糊，我做了他又说不是他想要的，还总说"你应该懂我的意思"',
  '女朋友总是要求我秒回消息，不回就生气，还说我不在乎她',
]

// 加载配置
onMounted(() => {
  loadConfig()
})

function loadConfig() {
  const savedKey = localStorage.getItem('eqagent_api_key')
  const savedUrl = localStorage.getItem('eqagent_base_url')
  const savedModel = localStorage.getItem('eqagent_model')
  
  if (savedKey) {
    try {
      const decrypted = CryptoJS.AES.decrypt(savedKey, secretKey).toString(CryptoJS.enc.Utf8)
      if (decrypted) {
        apiKey.value = decrypted
        apiConfigured.value = true
      }
    } catch {
      // 解密失败
    }
  }
  
  if (savedUrl) {
    baseUrl.value = savedUrl
  }
  
  if (savedModel) {
    model.value = savedModel
  }
}

function onConfigSave(newApiKey: string, newBaseUrl: string, newModel: string) {
  apiKey.value = newApiKey
  baseUrl.value = newBaseUrl
  model.value = newModel
  apiConfigured.value = true
  showConfig.value = false
}

async function analyze() {
  if (!description.value.trim()) {
    error.value = '请输入人物描述'
    return
  }

  if (!apiConfigured.value) {
    showConfig.value = true
    return
  }

  isAnalyzing.value = true
  error.value = null
  result.value = null

  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description.value,
        apiKey: apiKey.value,
        baseUrl: baseUrl.value,
        model: model.value,
      }),
    })

    const data = await response.json()

    if (data.success) {
      result.value = data.data
    } else {
      error.value = data.error || '分析失败'
    }
  } catch {
    error.value = '网络请求失败，请检查后端服务是否启动'
  } finally {
    isAnalyzing.value = false
  }
}

function useExample(text: string) {
  description.value = text
}

function resetAnalysis() {
  result.value = null
  description.value = ''
  error.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
    <!-- 顶部导航 -->
    <header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
      <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🧠</span>
          <div>
            <h1 class="text-xl font-bold text-slate-800">人际关系修炼助手</h1>
            <p class="text-xs text-slate-500">识人体系 · 人物分析</p>
          </div>
        </div>
        <button 
          @click="showConfig = true"
          class="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Settings class="w-4 h-4" />
          <span>{{ apiConfigured ? '已配置' : '配置 API' }}</span>
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-6 py-12">
      <!-- 欢迎区域 -->
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-slate-800 mb-3">
          识人体系
          <span class="text-orange-500">人物分析</span>
        </h2>
        <p class="text-slate-500 max-w-xl mx-auto">
          描述你遇到的人或场景，AI 将基于《识人攻略》《关系攻略》的理论框架，
          为你分析人物类型、特质画像及相处策略
        </p>
      </div>

      <!-- 输入区域 -->
      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
        <label class="block text-sm font-medium text-slate-700 mb-2">
          描述你想分析的人或场景
        </label>
        <textarea 
          v-model="description"
          placeholder="例如：有个同事平时跟我关系不错，但上次报销审批他突然死抠条款不给签字..."
          rows="4"
          class="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          :disabled="isAnalyzing"
        ></textarea>

        <!-- 示例快捷选择 -->
        <div class="mt-3">
          <p class="text-xs text-slate-400 mb-2">试试这些例子：</p>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="(example, index) in examples.slice(0, 3)" 
              :key="index"
              @click="useExample(example)"
              :disabled="isAnalyzing"
              class="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-colors disabled:opacity-50"
            >
              {{ example.slice(0, 20) }}...
            </button>
          </div>
        </div>

        <!-- 按钮区域 -->
        <div class="mt-6 flex gap-3">
          <button 
            @click="analyze"
            :disabled="isAnalyzing || !description.trim()"
            class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
          >
            <Loader v-if="isAnalyzing" class="w-5 h-5 animate-spin" />
            <Brain v-else class="w-5 h-5" />
            <span>{{ isAnalyzing ? '分析中...' : '开始分析' }}</span>
          </button>
          <button 
            v-if="result"
            @click="resetAnalysis"
            class="px-6 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors"
          >
            重新分析
          </button>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {{ error }}
        </div>
      </div>

      <!-- 分析结果 -->
      <div v-if="result" class="space-y-6">
        <!-- 人物类型判断 -->
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Target class="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-800">人物类型判断</h3>
              <p class="text-sm text-slate-500">基于行为模式的类型识别</p>
            </div>
          </div>
          
          <div class="flex items-center gap-4 mb-4">
            <div class="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-center">
              <p class="text-2xl font-bold">{{ result.personType }}</p>
              <p class="text-sm opacity-90">置信度 {{ result.confidence }}%</p>
            </div>
            <div class="flex-1">
              <p class="text-sm text-slate-600 leading-relaxed">{{ result.analysis }}</p>
            </div>
          </div>
        </div>

        <!-- 特质蛛网图 -->
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span class="text-xl">🕸️</span>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-800">特质蛛网图</h3>
              <p class="text-sm text-slate-500">六维人格特质画像</p>
            </div>
          </div>
          <RadarChart :traits="result.traits" />
        </div>

        <!-- 相处建议 -->
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Lightbulb class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-800">相处建议</h3>
              <p class="text-sm text-slate-500">针对这类人的应对策略</p>
            </div>
          </div>
          
          <div class="space-y-3">
            <div 
              v-for="(suggestion, index) in result.suggestions" 
              :key="index"
              class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
            >
              <div class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                {{ index + 1 }}
              </div>
              <p class="text-sm text-slate-700 pt-0.5">{{ suggestion }}</p>
            </div>
          </div>
        </div>

        <!-- 行动步骤 -->
        <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Route class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-800">行动建议</h3>
              <p class="text-sm text-slate-500">具体可执行的步骤</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <div 
              v-for="(step, index) in result.actionSteps" 
              :key="index"
              class="flex items-start gap-3"
            >
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {{ index + 1 }}
                </div>
                <div v-if="index < result.actionSteps.length - 1" class="w-0.5 flex-1 bg-blue-200 min-h-[24px]"></div>
              </div>
              <p class="text-sm text-slate-700 pt-1.5">{{ step }}</p>
            </div>
          </div>
        </div>

        <!-- 底部说明 -->
        <div class="text-center text-xs text-slate-400 py-4">
          <p>分析结果基于熊太行《识人攻略》《关系攻略》理论框架，仅供参考</p>
          <p class="mt-1">实际情况因人而异，建议结合具体情境判断</p>
        </div>
      </div>
    </main>

    <!-- 配置弹窗 -->
    <ConfigCard 
      v-if="showConfig"
      :onClose="() => showConfig = false"
      @save="onConfigSave"
    />
  </div>
</template>