<template>
  <div class="ai-warning-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>心理预警中心</span>
          <div class="header-actions">
            <el-button type="success" :icon="Download" @click="handleExport">
              导出名单
            </el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20" class="stat-cards">
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card stat-card-danger" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.highCount }}</div>
                <div class="stat-label">重度预警</div>
              </div>
              <div class="stat-icon">
                <el-icon :size="32"><Warning /></el-icon>
              </div>
            </div>
            <div class="stat-footer">
              <span>较昨日 <em class="up">+2</em></span>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card stat-card-warning" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.mediumCount }}</div>
                <div class="stat-label">中度预警</div>
              </div>
              <div class="stat-icon">
                <el-icon :size="32"><Bell /></el-icon>
              </div>
            </div>
            <div class="stat-footer">
              <span>较昨日 <em class="up">+3</em></span>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card stat-card-success" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.lowCount }}</div>
                <div class="stat-label">轻度预警</div>
              </div>
              <div class="stat-icon">
                <el-icon :size="32"><InfoFilled /></el-icon>
              </div>
            </div>
            <div class="stat-footer">
              <span>较昨日 <em class="down">-1</em></span>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card stat-card-primary" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.totalCount }}</div>
                <div class="stat-label">预警总数</div>
              </div>
              <div class="stat-icon">
                <el-icon :size="32"><DataLine /></el-icon>
              </div>
            </div>
            <div class="stat-footer">
              <span>处理率 <em class="up">{{ stats.handleRate }}%</em></span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="filter-section">
        <el-form :inline="true" :model="searchForm" class="filter-form">
          <el-form-item label="班级">
            <el-select v-model="searchForm.classId" placeholder="全部班级" clearable style="width: 160px;">
              <el-option label="计算机2301班" :value="1" />
              <el-option label="计算机2302班" :value="2" />
              <el-option label="软工2301班" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="预警等级">
            <el-select v-model="searchForm.level" placeholder="全部等级" clearable style="width: 140px;">
              <el-option label="重度" value="重度" />
              <el-option label="中度" value="中度" />
              <el-option label="轻度" value="轻度" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理状态">
            <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px;">
              <el-option label="待处理" value="待处理" />
              <el-option label="处理中" value="处理中" />
              <el-option label="已处理" value="已处理" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 260px;"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        @row-click="handleView"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学生姓名" min-width="100">
          <template #default="{ row }">
            <div class="student-cell">
              <el-avatar :size="32" class="student-avatar">{{ row.studentName.charAt(0) }}</el-avatar>
              <div class="student-info">
                <div class="student-name">{{ row.studentName }}</div>
                <div class="student-no">{{ row.studentNo }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="className" label="班级" min-width="140" />
        <el-table-column prop="level" label="预警等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" effect="dark" size="small">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warningType" label="预警类型" width="120" />
        <el-table-column prop="triggerReason" label="触发原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="预警时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="handleView(row)">查看</el-button>
            <el-button
              v-if="row.status !== '已处理'"
              type="success"
              link
              size="small"
              @click.stop="handleProcess(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailDrawerVisible" :title="'预警详情 - ' + (currentWarning?.studentName || '')" size="60%">
      <div v-if="currentWarning" class="warning-detail">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="预警详情" name="detail">
            <el-descriptions :column="2" border class="detail-desc">
              <el-descriptions-item label="学生姓名">{{ currentWarning.studentName }}</el-descriptions-item>
              <el-descriptions-item label="学号">{{ currentWarning.studentNo }}</el-descriptions-item>
              <el-descriptions-item label="班级">{{ currentWarning.className }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ currentWarning.gender || '男' }}</el-descriptions-item>
              <el-descriptions-item label="预警等级">
                <el-tag :type="getLevelType(currentWarning.level)" effect="dark">{{ currentWarning.level }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="预警类型">{{ currentWarning.warningType }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(currentWarning.status)">{{ currentWarning.status }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="预警时间">{{ currentWarning.createTime }}</el-descriptions-item>
            </el-descriptions>

            <el-divider content-position="left">
              <span class="divider-title"><el-icon><Warning /></el-icon> 触发原因</span>
            </el-divider>
            <div class="reason-content">
              <p>{{ currentWarning.triggerReason }}</p>
            </div>

            <el-divider content-position="left">
              <span class="divider-title"><el-icon><DataAnalysis /></el-icon> 触发规则</span>
            </el-divider>
            <div class="rules-content">
              <ul>
                <li v-for="(rule, index) in currentWarning.triggerRules" :key="index">
                  <el-icon class="rule-icon"><CircleCloseFilled /></el-icon>
                  {{ rule }}
                </li>
              </ul>
            </div>

            <el-divider content-position="left">
              <span class="divider-title"><el-icon><Document /></el-icon> 分析结果</span>
            </el-divider>
            <div class="analysis-content">
              <p>{{ currentWarning.analysis }}</p>
            </div>

            <el-divider v-if="currentWarning.handleRecords && currentWarning.handleRecords.length > 0" content-position="left">
              <span class="divider-title"><el-icon><Clock /></el-icon> 处理记录</span>
            </el-divider>
            <el-timeline v-if="currentWarning.handleRecords && currentWarning.handleRecords.length > 0" class="handle-records">
              <el-timeline-item
                v-for="(record, index) in currentWarning.handleRecords"
                :key="index"
                :timestamp="record.time"
                placement="top"
                :type="record.type"
              >
                <el-card shadow="never" class="record-card">
                  <h4>{{ record.title }}</h4>
                  <p>{{ record.content }}</p>
                  <div class="record-operator">处理人：{{ record.operator }}</div>
                </el-card>
              </el-timeline-item>
            </el-timeline>

            <div v-if="currentWarning.status !== '已处理'" class="handle-action">
              <el-button type="primary" size="large" @click="handleProcess(currentWarning)">
                {{ currentWarning.status === '处理中' ? '继续处理' : '立即处理' }}
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="学生画像" name="profile">
            <div class="student-profile">
              <el-row :gutter="20" class="profile-charts">
                <el-col :md="12">
                  <el-card class="chart-card" shadow="never">
                    <template #header>
                      <span class="chart-title">操行分趋势</span>
                    </template>
                    <div ref="scoreTrendRef" class="chart-container"></div>
                  </el-card>
                </el-col>
                <el-col :md="12">
                  <el-card class="chart-card" shadow="never">
                    <template #header>
                      <span class="chart-title">违纪类型分布</span>
                    </template>
                    <div ref="violationChartRef" class="chart-container"></div>
                  </el-card>
                </el-col>
              </el-row>

              <el-row :gutter="20" class="profile-charts">
                <el-col :md="12">
                  <el-card class="chart-card" shadow="never">
                    <template #header>
                      <span class="chart-title">情绪倾向分析</span>
                    </template>
                    <div ref="emotionChartRef" class="chart-container"></div>
                  </el-card>
                </el-col>
                <el-col :md="12">
                  <el-card class="chart-card" shadow="never">
                    <template #header>
                      <span class="chart-title">请假频次统计</span>
                    </template>
                    <div ref="leaveChartRef" class="chart-container"></div>
                  </el-card>
                </el-col>
              </el-row>

              <el-card class="detail-table-card" shadow="never">
                <template #header>
                  <span class="chart-title">近期操行分明细</span>
                </template>
                <el-table :data="scoreRecords" size="small">
                  <el-table-column prop="date" label="日期" width="120" />
                  <el-table-column prop="type" label="类型" width="100" />
                  <el-table-column prop="reason" label="原因" min-width="200" />
                  <el-table-column prop="score" label="分数" width="80" align="center">
                    <template #default="{ row }">
                      <span :class="row.score > 0 ? 'score-add' : 'score-minus'">
                        {{ row.score > 0 ? '+' : '' }}{{ row.score }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="operator" label="操作人" width="100" />
                </el-table>
              </el-card>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <el-dialog v-model="handleDialogVisible" title="处理预警" width="560px">
      <el-form :model="handleForm" :rules="handleRules" ref="handleFormRef" label-width="100px">
        <el-form-item label="处理状态" prop="status">
          <el-radio-group v-model="handleForm.status">
            <el-radio value="处理中">标记处理中</el-radio>
            <el-radio value="已处理">标记已处理</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理措施" prop="measures">
          <el-select v-model="handleForm.measures" multiple placeholder="请选择处理措施" style="width: 100%;">
            <el-option label="谈心谈话" value="谈心谈话" />
            <el-option label="心理辅导" value="心理辅导" />
            <el-option label="联系家长" value="联系家长" />
            <el-option label="持续观察" value="持续观察" />
            <el-option label="家校共育" value="家校共育" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果" prop="result">
          <el-input
            v-model="handleForm.result"
            type="textarea"
            :rows="5"
            placeholder="请详细描述处理过程和结果..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, Bell, InfoFilled, DataLine, Search, Refresh, Download, DataAnalysis, Document, Clock, CircleCloseFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const loading = ref(false)
const submitLoading = ref(false)
const detailDrawerVisible = ref(false)
const handleDialogVisible = ref(false)
const handleFormRef = ref(null)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const currentWarning = ref(null)
const activeTab = ref('detail')

const scoreTrendRef = ref(null)
const violationChartRef = ref(null)
const emotionChartRef = ref(null)
const leaveChartRef = ref(null)

const stats = ref({
  highCount: 3,
  mediumCount: 8,
  lowCount: 15,
  totalCount: 26,
  handleRate: 65
})

const scoreRecords = ref([])

const searchForm = reactive({
  classId: '',
  level: '',
  status: '',
  dateRange: []
})

const handleForm = reactive({
  status: '已处理',
  measures: [],
  result: ''
})

const handleRules = {
  status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  result: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
}

function getLevelType(level) {
  const map = { '重度': 'danger', '中度': 'warning', '轻度': 'success' }
  return map[level] || 'info'
}

function getStatusType(status) {
  const map = { '待处理': 'warning', '处理中': 'primary', '已处理': 'success' }
  return map[status] || 'info'
}

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, studentName: '李四', studentNo: '20230002', className: '计算机2301班', gender: '男', level: '重度', warningType: '情绪波动', triggerReason: '近期操行分连续下降，请假次数突增，聊天内容消极', status: '待处理', createTime: '2024-01-15 10:00:00' },
      { id: 2, studentName: '钱七', studentNo: '20230005', className: '软工2301班', gender: '女', level: '中度', warningType: '学业压力', triggerReason: '近期作业完成率下降，考试成绩下滑明显', status: '处理中', createTime: '2024-01-14 14:00:00' },
      { id: 3, studentName: '孙八', studentNo: '20230006', className: '软工2301班', gender: '男', level: '轻度', warningType: '人际关系', triggerReason: '与同学发生冲突次数增加', status: '已处理', createTime: '2024-01-13 09:00:00' },
      { id: 4, studentName: '周九', studentNo: '20230007', className: '计算机2301班', gender: '男', level: '中度', warningType: '睡眠问题', triggerReason: '上课频繁打瞌睡，精神状态不佳', status: '已处理', createTime: '2024-01-12 16:00:00' },
      { id: 5, studentName: '吴十', studentNo: '20230008', className: '计算机2302班', gender: '女', level: '重度', warningType: '抑郁倾向', triggerReason: '长期情绪低落，社交活动减少，有自我否定言论', status: '待处理', createTime: '2024-01-11 11:00:00' },
      { id: 6, studentName: '郑一', studentNo: '20230009', className: '计算机2302班', gender: '男', level: '轻度', warningType: '焦虑情绪', triggerReason: '考试前焦虑症状明显，影响正常发挥', status: '处理中', createTime: '2024-01-10 08:00:00' },
      { id: 7, studentName: '王二', studentNo: '20230010', className: '软工2301班', gender: '男', level: '中度', warningType: '行为异常', triggerReason: '近期行为反常，经常独处，不愿与人交流', status: '待处理', createTime: '2024-01-09 15:00:00' },
      { id: 8, studentName: '冯三', studentNo: '20230011', className: '计算机2301班', gender: '女', level: '轻度', warningType: '适应困难', triggerReason: '新环境适应不良，学习生活节奏跟不上', status: '已处理', createTime: '2024-01-08 10:00:00' }
    ]
    total.value = 26
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  getList()
}

function handleReset() {
  Object.assign(searchForm, {
    classId: '',
    level: '',
    status: '',
    dateRange: []
  })
  handleSearch()
}

function handlePageChange() {
  getList()
}

function handleView(row) {
  currentWarning.value = {
    ...row,
    triggerRules: [
      '操行分连续3周下降超过10分',
      '近一个月请假次数超过5次',
      'AI聊天情绪分析负面倾向超过70%',
      '课堂参与度下降超过30%'
    ],
    analysis: '综合分析结果显示，该生可能存在一定的心理压力和情绪问题。主要表现为：\n\n1. **学习方面**：操行分连续下降，课堂表现不如从前，作业完成质量有所下降\n2. **社交方面**：与同学交流减少，更倾向于独处\n3. **情绪方面**：情绪波动较大，容易出现烦躁、低落等情绪\n4. **生活方面**：作息不规律，精神状态欠佳\n\n建议及时进行干预，与学生进行深入沟通，了解其面临的困难，并提供必要的支持和帮助。',
    handleRecords: row.status !== '待处理' ? [
      { title: '初次谈话', content: '与学生进行了初步的谈心谈话，了解到近期学习压力较大，与室友有些小矛盾。已给予安抚和建议。', time: '2024-01-13 10:00', operator: '张老师', type: 'primary' },
      { title: '心理辅导', content: '安排了专业心理老师进行辅导，学生表示愿意配合。', time: '2024-01-14 14:00', operator: '李老师', type: 'success' }
    ] : []
  }

  scoreRecords.value = [
    { date: '2024-01-15', type: '纪律', reason: '上课迟到', score: -2, operator: '张老师' },
    { date: '2024-01-12', type: '学习', reason: '作业未按时完成', score: -3, operator: '王老师' },
    { date: '2024-01-10', type: '纪律', reason: '课堂讲话', score: -1, operator: '张老师' },
    { date: '2024-01-08', type: '卫生', reason: '宿舍卫生优秀', score: 2, operator: '李老师' },
    { date: '2024-01-05', type: '学习', reason: '课堂积极发言', score: 1, operator: '王老师' }
  ]

  detailDrawerVisible.value = true
  activeTab.value = 'detail'
}

function handleProcess(row) {
  Object.assign(handleForm, {
    status: row.status === '处理中' ? '已处理' : '已处理',
    measures: [],
    result: ''
  })
  handleDialogVisible.value = true
}

async function handleSubmit() {
  if (!handleFormRef.value) return
  await handleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('处理成功')
        handleDialogVisible.value = false
        if (detailDrawerVisible.value) {
          currentWarning.value.status = handleForm.status
        }
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

function handleExport() {
  ElMessage.success('导出成功，文件已下载')
}

function initCharts() {
  initScoreTrend()
  initViolationChart()
  initEmotionChart()
  initLeaveChart()
}

function initScoreTrend() {
  if (!scoreTrendRef.value) return
  const chart = echarts.init(scoreTrendRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周']
    },
    yAxis: {
      type: 'value',
      name: '分数',
      min: 60,
      max: 100
    },
    series: [
      {
        name: '操行分',
        data: [92, 90, 88, 85, 82, 78, 75, 72],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
          ])
        },
        lineStyle: { color: '#F56C6C', width: 2 },
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initViolationChart() {
  if (!violationChartRef.value) return
  const chart = echarts.init(violationChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [
      {
        name: '违纪类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: [
          { value: 8, name: '迟到早退', itemStyle: { color: '#F56C6C' } },
          { value: 5, name: '课堂纪律', itemStyle: { color: '#E6A23C' } },
          { value: 3, name: '作业完成', itemStyle: { color: '#409EFF' } },
          { value: 2, name: '卫生问题', itemStyle: { color: '#67C23A' } },
          { value: 4, name: '其他', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initEmotionChart() {
  if (!emotionChartRef.value) return
  const chart = echarts.init(emotionChartRef.value)
  const option = {
    tooltip: {},
    radar: {
      indicator: [
        { name: '积极', max: 100 },
        { name: '焦虑', max: 100 },
        { name: '低落', max: 100 },
        { name: '烦躁', max: 100 },
        { name: '平静', max: 100 },
        { name: '乐观', max: 100 }
      ],
      radius: '65%'
    },
    series: [
      {
        name: '情绪指数',
        type: 'radar',
        data: [
          {
            value: [45, 75, 70, 65, 50, 40],
            name: '当前情绪',
            areaStyle: { color: 'rgba(245, 108, 108, 0.3)' },
            lineStyle: { color: '#F56C6C' },
            itemStyle: { color: '#F56C6C' }
          }
        ]
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initLeaveChart() {
  if (!leaveChartRef.value) return
  const chart = echarts.init(leaveChartRef.value)
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['9月', '10月', '11月', '12月', '1月']
    },
    yAxis: {
      type: 'value',
      name: '次数'
    },
    series: [
      {
        name: '请假次数',
        type: 'bar',
        data: [2, 3, 4, 6, 8],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#E6A23C' },
            { offset: 1, color: '#F56C6C' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

watch(() => detailDrawerVisible.value, (val) => {
  if (val && activeTab.value === 'profile') {
    nextTick(() => {
      initCharts()
    })
  }
})

watch(activeTab, (val) => {
  if (val === 'profile' && detailDrawerVisible.value) {
    nextTick(() => {
      initCharts()
    })
  }
})

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.ai-warning-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .stat-cards {
    margin: 20px 0;
  }

  .stat-card {
    border: none;
    border-radius: 8px;
    overflow: hidden;

    &.stat-card-danger {
      .stat-number { color: #F56C6C; }
      .stat-icon { background: linear-gradient(135deg, #ff6b6b 0%, #f5576c 100%); }
    }

    &.stat-card-warning {
      .stat-number { color: #E6A23C; }
      .stat-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    }

    &.stat-card-success {
      .stat-number { color: #67C23A; }
      .stat-icon { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    }

    &.stat-card-primary {
      .stat-number { color: #409EFF; }
      .stat-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    }
  }

  .stat-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stat-info {
    .stat-number {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 8px;
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .stat-footer {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f2f5;
    font-size: 12px;
    color: #909399;

    em {
      font-style: normal;
      font-weight: 600;

      &.up { color: #F56C6C; }
      &.down { color: #67C23A; }
    }
  }

  .filter-section {
    margin-bottom: 16px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 8px;
  }

  .filter-form {
    margin: 0;
  }

  .student-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .student-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  .student-info {
    .student-name {
      font-weight: 500;
      color: #303133;
    }

    .student-no {
      font-size: 12px;
      color: #909399;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}

.warning-detail {
  .detail-desc {
    margin-bottom: 20px;
  }

  .divider-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 14px;
  }

  .reason-content,
  .analysis-content {
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 8px;
    line-height: 1.8;

    p {
      margin: 0;
    }
  }

  .rules-content {
    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 12px;
        margin-bottom: 6px;
        background-color: #fef0f0;
        border-radius: 4px;
        color: #F56C6C;
      }
    }
  }

  .rule-icon {
    margin-top: 3px;
  }

  .handle-records {
    padding: 10px 0;
  }

  .record-card {
    background-color: #f5f7fa;
    border: none;

    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #303133;
    }

    p {
      margin: 0 0 8px 0;
      color: #606266;
      line-height: 1.6;
    }

    .record-operator {
      font-size: 12px;
      color: #909399;
      text-align: right;
    }
  }

  .handle-action {
    margin-top: 24px;
    text-align: center;
  }

  .student-profile {
    .profile-charts {
      margin-bottom: 20px;
    }

    .chart-card {
      border: none;
      background-color: #fafafa;

      .chart-title {
        font-weight: 600;
        font-size: 14px;
      }
    }

    .chart-container {
      height: 240px;
      width: 100%;
    }

    .detail-table-card {
      border: none;
      background-color: #fafafa;

      .chart-title {
        font-weight: 600;
        font-size: 14px;
      }
    }
  }

  .score-add {
    color: #67C23A;
    font-weight: 600;
  }

  .score-minus {
    color: #F56C6C;
    font-weight: 600;
  }
}
</style>
