<template>
  <div class="ai-model-config-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>模型配置</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card" class="config-tabs">
        <el-tab-pane label="模型列表" name="list">
          <div class="list-toolbar">
            <el-button type="primary" :icon="Plus" v-permission="'ai:modelConfig:add'" @click="handleAdd">
              新增配置
            </el-button>
          </div>

          <el-table :data="tableData" v-loading="loading" stripe>
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="modelName" label="模型名称" min-width="150" />
            <el-table-column prop="modelType" label="模型类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.modelType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="provider" label="服务商" width="120" />
            <el-table-column prop="apiEndpoint" label="API地址" min-width="200" show-overflow-tooltip />
            <el-table-column prop="temperature" label="温度" width="80" align="center" />
            <el-table-column prop="maxTokens" label="最大Token" width="110" align="center" />
            <el-table-column label="默认" width="80" align="center">
              <template #default="{ row }">
                <el-radio v-model="defaultModelId" :label="row.id" @change="handleSetDefault(row)">
                </el-radio>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  :active-value="true"
                  :inactive-value="false"
                  @change="handleToggle(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link v-permission="'ai:modelConfig:edit'" @click="handleEdit(row)">编辑</el-button>
                <el-button type="success" link @click="handleTest(row)">测试</el-button>
                <el-button type="danger" link v-permission="'ai:modelConfig:delete'" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="参数配置" name="params">
          <div class="params-config">
            <el-row :gutter="40">
              <el-col :md="12">
                <el-card class="config-card" shadow="never">
                  <template #header>
                    <div class="config-card-header">
                      <el-icon class="config-icon"><Setting /></el-icon>
                      <span>模型参数配置</span>
                    </div>
                  </template>
                  <el-form :model="paramsForm" :rules="paramsRules" ref="paramsFormRef" label-width="140px">
                    <el-form-item label="默认模型">
                      <el-select v-model="paramsForm.defaultModel" placeholder="请选择默认模型" style="width: 100%;">
                        <el-option v-for="model in tableData" :key="model.id" :label="model.modelName" :value="model.id" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="回答温度" prop="temperature">
                      <el-slider
                        v-model="paramsForm.temperature"
                        :min="0"
                        :max="2"
                        :step="0.1"
                        :marks="{ 0: '0', 0.7: '0.7', 1: '1', 1.5: '1.5', 2: '2' }"
                        show-input
                      />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        较低的值使输出更确定性，较高的值使输出更具创造性
                      </div>
                    </el-form-item>
                    <el-form-item label="最大输出长度" prop="maxTokens">
                      <el-input-number v-model="paramsForm.maxTokens" :min="100" :max="32000" :step="100" style="width: 100%;" />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        模型生成的最大Token数量，影响回复长度
                      </div>
                    </el-form-item>
                    <el-form-item label="上下文窗口大小" prop="contextWindow">
                      <el-input-number v-model="paramsForm.contextWindow" :min="1000" :max="128000" :step="1000" style="width: 100%;" />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        模型可处理的上下文Token数量，影响记忆长度
                      </div>
                    </el-form-item>
                    <el-form-item label="Top P" prop="topP">
                      <el-slider
                        v-model="paramsForm.topP"
                        :min="0"
                        :max="1"
                        :step="0.05"
                        :marks="{ 0: '0', 0.5: '0.5', 0.9: '0.9', 1: '1' }"
                        show-input
                      />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        核采样参数，控制输出多样性
                      </div>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" :icon="Check" :loading="paramsLoading" @click="handleSaveParams">
                        保存配置
                      </el-button>
                      <el-button :icon="RefreshLeft" @click="handleResetParams">重置</el-button>
                    </el-form-item>
                  </el-form>
                </el-card>
              </el-col>
              <el-col :md="12">
                <el-card class="config-card" shadow="never">
                  <template #header>
                    <div class="config-card-header">
                      <el-icon class="config-icon warning"><Promotion /></el-icon>
                      <span>安全配置</span>
                    </div>
                  </template>
                  <el-form :model="securityForm" :rules="securityRules" ref="securityFormRef" label-width="160px">
                    <el-form-item label="敏感字段脱敏">
                      <el-switch
                        v-model="securityForm.desensitizationEnabled"
                        active-text="开启"
                        inactive-text="关闭"
                      />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        开启后，输出中的敏感信息将自动脱敏
                      </div>
                    </el-form-item>
                    <el-form-item label="学生档案数据访问">
                      <el-switch
                        v-model="securityForm.studentDataAccess"
                        active-text="允许"
                        inactive-text="禁止"
                      />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        是否允许AI访问学生档案数据用于研判
                      </div>
                    </el-form-item>
                    <el-form-item label="内容审核">
                      <el-switch
                        v-model="securityForm.contentReview"
                        active-text="开启"
                        inactive-text="关闭"
                      />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        开启后，AI输出内容将经过安全审核
                      </div>
                    </el-form-item>
                    <el-form-item label="敏感词过滤">
                      <el-switch
                        v-model="securityForm.sensitiveWordFilter"
                        active-text="开启"
                        inactive-text="关闭"
                      />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        开启后，将过滤输入和输出中的敏感词
                      </div>
                    </el-form-item>
                    <el-form-item label="敏感词列表" prop="sensitiveWords">
                      <el-input
                        v-model="securityForm.sensitiveWords"
                        type="textarea"
                        :rows="6"
                        placeholder="请输入敏感词，每行一个"
                      />
                      <div class="param-desc">
                        <el-icon><InfoFilled /></el-icon>
                        自定义敏感词列表，每行一个词
                      </div>
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" :icon="Check" :loading="securityLoading" @click="handleSaveSecurity">
                        保存配置
                      </el-button>
                      <el-button :icon="RefreshLeft" @click="handleResetSecurity">重置</el-button>
                    </el-form-item>
                  </el-form>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="使用统计" name="stats">
          <div class="usage-stats">
            <el-row :gutter="20" class="stat-cards">
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ usageStats.totalCalls }}</div>
                      <div class="stat-label">总调用次数</div>
                    </div>
                    <div class="stat-icon blue">
                      <el-icon :size="28"><Histogram /></el-icon>
                    </div>
                  </div>
                  <div class="stat-footer">
                    <span>今日：<b>{{ usageStats.todayCalls }}</b> 次</span>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ usageStats.totalTokens }}</div>
                      <div class="stat-label">总Token消耗</div>
                    </div>
                    <div class="stat-icon green">
                      <el-icon :size="28"><DataAnalysis /></el-icon>
                    </div>
                  </div>
                  <div class="stat-footer">
                    <span>今日：<b>{{ usageStats.todayTokens }}</b></span>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ usageStats.avgResponseTime }}s</div>
                      <div class="stat-label">平均响应时间</div>
                    </div>
                    <div class="stat-icon orange">
                      <el-icon :size="28"><Clock /></el-icon>
                    </div>
                  </div>
                  <div class="stat-footer">
                    <span>成功率：<b>{{ usageStats.successRate }}%</b></span>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="stat-card" shadow="hover">
                  <div class="stat-content">
                    <div class="stat-info">
                      <div class="stat-number">{{ usageStats.activeUsers }}</div>
                      <div class="stat-label">活跃用户数</div>
                    </div>
                    <div class="stat-icon purple">
                      <el-icon :size="28"><User /></el-icon>
                    </div>
                  </div>
                  <div class="stat-footer">
                    <span>本月新增：<b>{{ usageStats.newUsers }}</b></span>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="chart-row">
              <el-col :md="16">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">调用量趋势</span>
                  </template>
                  <div ref="usageTrendChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :md="8">
                <el-card class="chart-card" shadow="hover">
                  <template #header>
                    <span class="chart-title">功能使用分布</span>
                  </template>
                  <div ref="functionUsageChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="120px">
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型类型" prop="modelType">
          <el-select v-model="form.modelType" placeholder="请选择类型" style="width: 100%;">
            <el-option label="对话模型" value="对话模型" />
            <el-option label="文本生成" value="文本生成" />
            <el-option label="图像生成" value="图像生成" />
            <el-option label="embedding" value="embedding" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务商" prop="provider">
          <el-select v-model="form.provider" placeholder="请选择服务商" style="width: 100%;">
            <el-option label="OpenAI" value="OpenAI" />
            <el-option label="DeepSeek" value="DeepSeek" />
            <el-option label="智谱AI" value="智谱AI" />
            <el-option label="通义千问" value="通义千问" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="API地址" prop="apiEndpoint">
          <el-input v-model="form.apiEndpoint" placeholder="请输入API地址" />
        </el-form-item>
        <el-form-item label="API密钥" prop="apiKey">
          <el-input v-model="form.apiKey" type="password" show-password placeholder="请输入API密钥" />
        </el-form-item>
        <el-form-item label="模型ID" prop="modelId">
          <el-input v-model="form.modelId" placeholder="请输入模型ID/名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :md="12">
            <el-form-item label="温度" prop="temperature">
              <el-slider v-model="form.temperature" :min="0" :max="2" :step="0.1" show-input />
            </el-form-item>
          </el-col>
          <el-col :md="12">
            <el-form-item label="最大Token" prop="maxTokens">
              <el-input-number v-model="form.maxTokens" :min="100" :max="32000" :step="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="启用状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  Plus, Setting, Promotion, InfoFilled, Check, RefreshLeft,
  Histogram, DataAnalysis, Clock, User
} from '@element-plus/icons-vue'

const activeTab = ref('list')
const loading = ref(false)
const submitLoading = ref(false)
const paramsLoading = ref(false)
const securityLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const paramsFormRef = ref(null)
const securityFormRef = ref(null)
const tableData = ref([])
const defaultModelId = ref(1)
const usageTrendChartRef = ref(null)
const functionUsageChartRef = ref(null)

const form = reactive({
  id: null,
  modelName: '',
  modelType: '',
  provider: '',
  apiEndpoint: '',
  apiKey: '',
  modelId: '',
  temperature: 0.7,
  maxTokens: 4096,
  enabled: true,
  description: ''
})

const paramsForm = reactive({
  defaultModel: 1,
  temperature: 0.7,
  maxTokens: 4096,
  contextWindow: 8192,
  topP: 0.9
})

const securityForm = reactive({
  desensitizationEnabled: true,
  studentDataAccess: true,
  contentReview: true,
  sensitiveWordFilter: true,
  sensitiveWords: '色情\n暴力\n赌博\n毒品\n诈骗\n恐怖主义\n反动\n迷信'
})

const defaultParams = {
  defaultModel: 1,
  temperature: 0.7,
  maxTokens: 4096,
  contextWindow: 8192,
  topP: 0.9
}

const defaultSecurity = {
  desensitizationEnabled: true,
  studentDataAccess: true,
  contentReview: true,
  sensitiveWordFilter: true,
  sensitiveWords: '色情\n暴力\n赌博\n毒品\n诈骗\n恐怖主义\n反动\n迷信'
}

const usageStats = ref({
  totalCalls: 12580,
  todayCalls: 256,
  totalTokens: '256万',
  todayTokens: '5.2万',
  avgResponseTime: 2.3,
  successRate: 99.2,
  activeUsers: 45,
  newUsers: 8
})

const formRules = {
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  modelType: [{ required: true, message: '请选择模型类型', trigger: 'change' }],
  provider: [{ required: true, message: '请选择服务商', trigger: 'change' }],
  apiEndpoint: [{ required: true, message: '请输入API地址', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API密钥', trigger: 'blur' }],
  modelId: [{ required: true, message: '请输入模型ID', trigger: 'blur' }]
}

const paramsRules = {
  temperature: [{ required: true, message: '请设置温度', trigger: 'change' }],
  maxTokens: [{ required: true, message: '请设置最大输出长度', trigger: 'blur' }],
  contextWindow: [{ required: true, message: '请设置上下文窗口大小', trigger: 'blur' }]
}

const securityRules = {}

async function getList() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    tableData.value = [
      { id: 1, modelName: 'GPT-4', modelType: '对话模型', provider: 'OpenAI', apiEndpoint: 'https://api.openai.com/v1', apiKey: '***', modelId: 'gpt-4', temperature: 0.7, maxTokens: 8192, enabled: true, description: 'OpenAI GPT-4 模型' },
      { id: 2, modelName: 'DeepSeek-V2', modelType: '对话模型', provider: 'DeepSeek', apiEndpoint: 'https://api.deepseek.com/v1', apiKey: '***', modelId: 'deepseek-chat', temperature: 0.7, maxTokens: 4096, enabled: true, description: '深度求索模型' },
      { id: 3, modelName: 'GLM-4', modelType: '对话模型', provider: '智谱AI', apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4', apiKey: '***', modelId: 'glm-4', temperature: 0.7, maxTokens: 4096, enabled: false, description: '智谱AI模型' }
    ]
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增配置'
  Object.assign(form, { id: null, modelName: '', modelType: '', provider: '', apiEndpoint: '', apiKey: '', modelId: '', temperature: 0.7, maxTokens: 4096, enabled: true, description: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑配置'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除配置 "${row.modelName}" 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  })
}

function handleToggle(row) {
  ElMessage.success(row.enabled ? '已启用' : '已禁用')
}

function handleSetDefault(row) {
  ElMessageBox.confirm(`确定将 "${row.modelName}" 设为默认模型吗？`, '提示', {
    type: 'info'
  }).then(() => {
    defaultModelId.value = row.id
    ElMessage.success('设置成功')
  }).catch(() => {
    getList()
  })
}

async function handleTest(row) {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('连接测试成功')
  } catch (error) {
    ElMessage.error('连接测试失败')
  } finally {
    loading.value = false
  }
}

async function handleSaveParams() {
  if (!paramsFormRef.value) return
  await paramsFormRef.value.validate(async (valid) => {
    if (valid) {
      paramsLoading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        ElMessage.success('参数配置保存成功')
      } finally {
        paramsLoading.value = false
      }
    }
  })
}

function handleResetParams() {
  ElMessageBox.confirm('确定要重置参数配置吗？', '提示', {
    type: 'warning'
  }).then(() => {
    Object.assign(paramsForm, defaultParams)
    ElMessage.success('已重置为默认值')
  })
}

async function handleSaveSecurity() {
  if (!securityFormRef.value) return
  securityLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('安全配置保存成功')
  } finally {
    securityLoading.value = false
  }
}

function handleResetSecurity() {
  ElMessageBox.confirm('确定要重置安全配置吗？', '提示', {
    type: 'warning'
  }).then(() => {
    Object.assign(securityForm, defaultSecurity)
    ElMessage.success('已重置为默认值')
  })
}

function initUsageTrendChart() {
  if (!usageTrendChartRef.value) return
  const chart = echarts.init(usageTrendChartRef.value)
  const days = ['1月1日', '1月2日', '1月3日', '1月4日', '1月5日', '1月6日', '1月7日']
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['调用次数', 'Token消耗'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: { type: 'category', data: days },
    yAxis: [
      { type: 'value', name: '调用次数' },
      { type: 'value', name: 'Token(万)' }
    ],
    series: [
      {
        name: '调用次数',
        type: 'bar',
        data: [180, 220, 195, 250, 280, 260, 256],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      },
      {
        name: 'Token消耗',
        type: 'line',
        yAxisIndex: 1,
        data: [3.2, 4.1, 3.8, 4.8, 5.5, 5.2, 5.2],
        smooth: true,
        itemStyle: { color: '#67C23A' },
        lineStyle: { width: 3 }
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initFunctionUsageChart() {
  if (!functionUsageChartRef.value) return
  const chart = echarts.init(functionUsageChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [{
      name: '功能使用',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: 3580, name: '智能研判', itemStyle: { color: '#409EFF' } },
        { value: 2850, name: 'AI聊天', itemStyle: { color: '#67C23A' } },
        { value: 2340, name: '心理预警', itemStyle: { color: '#E6A23C' } },
        { value: 1980, name: '班级分析', itemStyle: { color: '#F56C6C' } },
        { value: 1830, name: '场景咨询', itemStyle: { color: '#9C27B0' } }
      ]
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

watch(activeTab, (newVal) => {
  if (newVal === 'stats') {
    nextTick(() => {
      initUsageTrendChart()
      initFunctionUsageChart()
    })
  }
})

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.ai-model-config-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    font-size: 16px;
    font-weight: 600;
  }

  .config-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .list-toolbar {
    margin-bottom: 15px;
  }

  .params-config {
    .config-card {
      border: 1px solid #ebeef5;
      border-radius: 8px;

      .config-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 600;

        .config-icon {
          font-size: 18px;
          color: #409eff;

          &.warning {
            color: '#E6A23C';
          }
        }
      }

      .param-desc {
        display: flex;
        align-items: flex-start;
        gap: 5px;
        font-size: 12px;
        color: #909399;
        margin-top: 5px;
        line-height: 1.5;
      }
    }
  }

  .usage-stats {
    .stat-cards {
      margin-bottom: 20px;
    }

    .stat-card {
      border: none;
      border-radius: 8px;

      .stat-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .stat-info {
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        &.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        &.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        &.purple { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
      }

      .stat-footer {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f0f2f5;
        font-size: 12px;
        color: #606266;

        b {
          color: #409eff;
        }
      }
    }

    .chart-row {
      margin-bottom: 0;
    }

    .chart-card {
      border: none;
      border-radius: 8px;

      .chart-title {
        font-size: 14px;
        font-weight: 600;
      }
    }

    .chart-container {
      height: 300px;
      width: 100%;
    }
  }
}
</style>
