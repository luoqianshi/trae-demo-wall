<template>
  <div class="competitors">
    <div class="page-header">
      <h2>竞品分析</h2>
      <el-button type="primary" @click="openAddDialog"><el-icon>
          <Plus />
        </el-icon> 添加竞品</el-button>
    </div>

    <div class="competitor-grid">
      <el-card v-for="competitor in competitors" :key="competitor.id" class="competitor-card">
        <template #header>
          <div class="card-header">
            <span>{{ competitor.name }}</span>
            <el-tag>{{ competitor.type }}</el-tag>
          </div>
        </template>
        <div class="competitor-info">
          <p><strong>平台：</strong>{{ competitor.platform }}</p>
          <p><strong>地区：</strong>{{ competitor.region }}</p>
          <p><strong>链接：</strong><a :href="competitor.url" target="_blank">{{ competitor.url }}</a></p>
        </div>
        <div class="card-actions">
          <el-button link @click="analyzeCompetitor(competitor)">AI分析</el-button>
          <el-button link @click="deleteCompetitor(competitor)">删除</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog title="添加竞品" v-model="dialogVisible" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="竞品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入竞品名称" />
        </el-form-item>
        <el-form-item label="业态类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择业态类型">
            <el-option label="正餐" value="正餐" />
            <el-option label="快餐" value="快餐" />
            <el-option label="小吃" value="小吃" />
            <el-option label="饮品" value="饮品" />
            <el-option label="火锅" value="火锅" />
            <el-option label="烧烤" value="烧烤" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" placeholder="请选择平台">
            <el-option label="美团" value="美团" />
            <el-option label="大众点评" value="大众点评" />
            <el-option label="抖音" value="抖音" />
            <el-option label="小红书" value="小红书" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="地区">
          <el-input v-model="form.region" placeholder="请输入地区" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="form.url" placeholder="请输入竞品链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCompetitor">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog :title="`AI竞品分析 - ${analysisCompetitor?.name}`" v-model="analysisVisible" width="800px">
      <div class="analysis-content">
        <div v-if="analysisLoading" class="loading-state">
          <el-icon class="loading-icon">
            <Loading />
          </el-icon>
          <span>AI正在分析中，请稍候...</span>
        </div>
        <div v-else class="analysis-result">
          <div class="analysis-text">{{ analysisResult }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="analysisVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-card class="market-insights">
      <template #header>
        <div class="insights-header">
          <span>市场洞察</span>
          <el-button type="primary" size="small" @click="fetchMarketInsights"
            :loading="insightsLoading">AI获取洞察</el-button>
        </div>
      </template>
      <div v-if="insightsLoading" class="loading-state">
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
        <span>AI正在获取市场洞察...</span>
      </div>
      <div v-else class="insights-content">
        <div class="insight-item">
          <h4>🔥 热门菜品</h4>
          <ul>
            <li v-for="item in hotDishes" :key="item.name">{{ item.name }} - {{ item.reason }} - 销量 {{ item.sales }}
            </li>
          </ul>
        </div>
        <div class="insight-item">
          <h4>📈 新销售模式</h4>
          <ul>
            <li v-for="item in salesModels" :key="item.name">{{ item.name }} - {{ item.growth }} - {{ item.description
            }}
            </li>
          </ul>
        </div>
        <div class="insight-item">
          <h4>💡 营销玩法</h4>
          <ul>
            <li v-for="item in marketingTactics" :key="item.name">{{ item.name }} - {{ item.scene }} - {{ item.effect }}
            </li>
          </ul>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { operationApi, aiApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import { authFetch } from '@/utils/request'

const competitors = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)
const analysisVisible = ref(false)
const analysisLoading = ref(false)
const analysisResult = ref('')
const analysisCompetitor = ref(null)

const hotDishes = ref([
  { name: '番茄牛腩饭', reason: '热度 95 - 口感丰富', sales: 0 }
])

const salesModels = ref([
  { name: '直播带货', growth: '增长 120%', description: '' }
])

const marketingTactics = ref([
  { name: '限时秒杀活动', scene: '', effect: '' }
])

const insightsLoading = ref(false)

const form = reactive({
  name: '',
  type: '',
  platform: '',
  region: '',
  url: ''
})

const rules = {
  name: [
    { required: true, message: '请输入竞品名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择业态类型', trigger: 'change' }
  ],
  platform: [
    { required: true, message: '请选择平台', trigger: 'change' }
  ]
}

async function fetchCompetitors() {
  competitors.value = await operationApi.getCompetitors()
}

function openAddDialog() {
  form.name = ''
  form.type = ''
  form.platform = ''
  form.region = ''
  form.url = ''
  dialogVisible.value = true
}

async function saveCompetitor() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      await operationApi.addCompetitor(form)
      ElMessage.success('添加成功')
      dialogVisible.value = false
      await fetchCompetitors()
    }
  })
}

async function analyzeCompetitor(competitor) {
  analysisCompetitor.value = competitor
  analysisResult.value = ''
  analysisLoading.value = true
  analysisVisible.value = true

  try {
    const response = await authFetch('/api/ai/analyze-competitor/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: competitor.name,
        info: {
          type: competitor.type,
          platform: competitor.platform,
          region: competitor.region,
          url: competitor.url
        }
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          analysisResult.value += data
        }
      }
    }
  } catch (error) {
    console.error('Analysis error:', error)
    analysisResult.value = 'AI分析失败，请稍后重试'
  } finally {
    analysisLoading.value = false
  }
}

async function fetchMarketInsights() {
  insightsLoading.value = true

  try {
    const response = await authFetch('/api/ai/market-insights/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            try {
              const parsed = JSON.parse(fullResponse)
              const resultData = {}
              if (parsed.hot_dishes) {
                hotDishes.value = parsed.hot_dishes
                resultData.hot_dishes = parsed.hot_dishes
              }
              if (parsed.sales_models) {
                salesModels.value = parsed.sales_models
                resultData.sales_models = parsed.sales_models
              }
              if (parsed.marketing_tactics) {
                marketingTactics.value = parsed.marketing_tactics
                resultData.marketing_tactics = parsed.marketing_tactics
              }
              await saveMarketInsights(resultData)
              ElMessage.success('市场洞察已更新')
            } catch (e) {
              console.error('JSON parse error:', e)
              ElMessage.error('获取市场洞察失败')
            }
            return
          }
          fullResponse += data
        }
      }
    }
  } catch (error) {
    console.error('Market insights error:', error)
    ElMessage.error('获取市场洞察失败')
  } finally {
    insightsLoading.value = false
  }
}

async function deleteCompetitor(competitor) {
  await ElMessageBox.confirm('确定删除该竞品？', '提示', {
    type: 'warning'
  })
  ElMessage.success('删除成功')
  await fetchCompetitors()
}

onMounted(() => {
  fetchCompetitors()
  loadSavedMarketInsights()
})

onActivated(() => {
  fetchCompetitors()
  loadSavedMarketInsights()
})

async function loadSavedMarketInsights() {
  try {
    const response = await authFetch('/api/ai/analysis-result?analysis_type=market_insights')
    const data = await response.json()
    if (data.success && data.result_data) {
      const result = data.result_data
      if (result.hot_dishes) hotDishes.value = result.hot_dishes
      if (result.sales_models) salesModels.value = result.sales_models
      if (result.marketing_tactics) marketingTactics.value = result.marketing_tactics
    }
  } catch (error) {
    console.error('Failed to load market insights:', error)
  }
}

async function saveMarketInsights(data) {
  try {
    await authFetch('/api/ai/analysis-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        analysis_type: 'market_insights',
        result_data: data
      })
    })
  } catch (error) {
    console.error('Failed to save market insights:', error)
  }
}
</script>

<style scoped>
.competitors {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  box-shadow: var(--ds-shadow-card);
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, var(--ds-primary), var(--ds-food));
  border-radius: 2px;
}

.competitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

:deep(.competitor-card) {
  border-radius: 18px;
  border: 1px solid var(--ds-border);
  box-shadow: var(--ds-shadow-card);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: var(--ds-surface);
}

:deep(.competitor-card:hover) {
  box-shadow: 0 14px 32px rgba(180, 83, 9, 0.14);
  transform: translateY(-3px);
}

:deep(.competitor-card .el-card__header) {
  padding: 18px;
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.92), rgba(255, 253, 250, 0.98));
  border-bottom: 1px solid var(--ds-border);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

:deep(.card-header .el-tag) {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  background: var(--ds-primary-soft);
  color: var(--ds-primary-700);
  border: 1px solid rgba(180, 83, 9, 0.16);
  box-shadow: none;
}

.competitor-info {
  padding: 18px;
}

.competitor-info p {
  margin: 14px 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.7;
  display: flex;
  align-items: center;
  gap: 10px;
}

.competitor-info strong {
  color: #374151;
  font-weight: 600;
}

.competitor-info a {
  color: var(--ds-primary);
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 500;
}

.competitor-info a:hover {
  color: var(--ds-primary-700);
  text-decoration: underline;
}

.card-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 14px 18px;
  background: rgba(255, 247, 237, 0.55);
  border-top: 1px solid var(--ds-border);
}

:deep(.card-actions .el-button) {
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 10px;
}

:deep(.card-actions .el-button:hover) {
  transform: translateY(-1px);
}

:deep(.market-insights) {
  border-radius: 18px;
  border: none;
  box-shadow: 0 4px 16px rgba(180, 83, 9, 0.14);
  overflow: hidden;
}

:deep(.market-insights .el-card__header) {
  padding: 24px;
  background: linear-gradient(135deg, var(--ds-primary), #2f6f5e);
  border-bottom: none;
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.insights-header span {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

:deep(.insights-header .el-button) {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

:deep(.insights-header .el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

:deep(.market-insights .el-card__body) {
  padding: 18px;
}

.insights-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.insight-item {
  padding: 18px;
  background: #fffefa;
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e2e8f0;
}

.insight-item:hover {
  background: #fff7ed;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(180, 83, 9, 0.1);
}

.insight-item h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.insight-item ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.insight-item li {
  margin: 14px 0;
  padding: 13px 14px;
  background: var(--ds-surface);
  border-radius: 12px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.7;
  border-left: 4px solid var(--ds-primary);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.insight-item li:hover {
  background: var(--ds-primary-soft);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px;
  color: #6b7280;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
  color: var(--ds-primary);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.analysis-content {
  max-height: 450px;
  overflow-y: auto;
}

.analysis-text {
  font-size: 14px;
  line-height: 1.9;
  color: #374151;
  white-space: pre-wrap;
  padding: 20px;
}
</style>
