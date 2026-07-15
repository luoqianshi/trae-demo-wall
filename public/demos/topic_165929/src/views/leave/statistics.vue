<template>
  <div class="leave-statistics-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>请假统计</span>
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <el-row :gutter="20" class="stat-cards">
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.totalCount }}</div>
                <div class="stat-label">总请假次数</div>
              </div>
              <div class="stat-icon blue">
                <el-icon :size="32"><Document /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.sickCount }}</div>
                <div class="stat-label">病假</div>
              </div>
              <div class="stat-icon red">
                <el-icon :size="32"><FirstAidKit /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.personalCount }}</div>
                <div class="stat-label">事假</div>
              </div>
              <div class="stat-icon orange">
                <el-icon :size="32"><User /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.totalDays }}</div>
                <div class="stat-label">总请假天数</div>
              </div>
              <div class="stat-icon green">
                <el-icon :size="32"><Calendar /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-row">
        <el-col :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <span>请假类型分布</span>
            </template>
            <div ref="typeChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        <el-col :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <span>月度请假趋势</span>
            </template>
            <div ref="trendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="rank-card" shadow="hover">
        <template #header>
          <span>学生请假排行</span>
        </template>
        <PageTable
          :columns="rankColumns"
          :data="rankData"
          :total="rankTotal"
          :loading="loading"
          @pageChange="handleRankPageChange"
        >
          <template #count="{ row }">
            <el-tag :type="row.count >= 5 ? 'danger' : row.count >= 3 ? 'warning' : 'info'">
              {{ row.count }} 次
            </el-tag>
          </template>
        </PageTable>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import SearchForm from '@/components/SearchForm.vue'
import PageTable from '@/components/PageTable.vue'
import { Document, FirstAidKit, User, Calendar } from '@element-plus/icons-vue'

const loading = ref(false)
const typeChartRef = ref(null)
const trendChartRef = ref(null)
const rankData = ref([])
const rankTotal = ref(0)
const rankPageNum = ref(1)
const rankPageSize = ref(10)

const stats = ref({
  totalCount: 45,
  sickCount: 20,
  personalCount: 15,
  totalDays: 30
})

const searchForm = reactive({
  classId: '',
  dateRange: []
})

const searchFields = [
  { prop: 'classId', label: '班级', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '计算机2301班', value: 1 },
    { label: '计算机2302班', value: 2 },
    { label: '软工2301班', value: 3 }
  ]},
  { prop: 'dateRange', label: '时间范围', type: 'daterange' }
]

const rankColumns = [
  { type: 'index', label: '排名', width: 80 },
  { prop: 'studentNo', label: '学号', minWidth: 120 },
  { prop: 'studentName', label: '姓名', minWidth: 100 },
  { prop: 'className', label: '班级', minWidth: 150 },
  { slot: 'count', label: '请假次数', width: 120 },
  { prop: 'days', label: '请假天数', width: 100 }
]

function handleSearch() {
  console.log('Search:', searchForm)
}

function handleRankPageChange({ pageNum: pn, pageSize: ps }) {
  rankPageNum.value = pn
  rankPageSize.value = ps
}

function initTypeChart() {
  if (!typeChartRef.value) return
  const chart = echarts.init(typeChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      name: '请假类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      data: [
        { value: 20, name: '病假', itemStyle: { color: '#F56C6C' } },
        { value: 15, name: '事假', itemStyle: { color: '#E6A23C' } },
        { value: 8, name: '公假', itemStyle: { color: '#409EFF' } },
        { value: 2, name: '其他', itemStyle: { color: '#909399' } }
      ]
    }]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

function initTrendChart() {
  if (!trendChartRef.value) return
  const chart = echarts.init(trendChartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['病假', '事假', '公假'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: { type: 'value', name: '次数' },
    series: [
      { name: '病假', type: 'line', smooth: true, data: [5, 8, 6, 4, 3, 2, 1, 2, 3, 5, 7, 6], itemStyle: { color: '#F56C6C' } },
      { name: '事假', type: 'line', smooth: true, data: [3, 4, 5, 3, 2, 1, 2, 3, 4, 5, 4, 3], itemStyle: { color: '#E6A23C' } },
      { name: '公假', type: 'line', smooth: true, data: [1, 2, 1, 2, 1, 1, 0, 0, 1, 2, 1, 2], itemStyle: { color: '#409EFF' } }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

onMounted(() => {
  rankData.value = [
    { studentNo: '20230001', studentName: '张三', className: '计算机2301班', count: 8, days: 12 },
    { studentNo: '20230002', studentName: '李四', className: '计算机2301班', count: 6, days: 8 },
    { studentNo: '20230003', studentName: '王五', className: '计算机2302班', count: 5, days: 7 },
    { studentNo: '20230004', studentName: '赵六', className: '计算机2302班', count: 4, days: 5 },
    { studentNo: '20230005', studentName: '钱七', className: '软工2301班', count: 3, days: 4 }
  ]
  rankTotal.value = 20

  nextTick(() => {
    initTypeChart()
    initTrendChart()
  })
})
</script>

<style scoped lang="scss">
.leave-statistics-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    font-size: 16px;
    font-weight: 600;
  }

  .stat-cards {
    margin: 20px 0;
    padding: 0 20px;
  }

  .stat-card {
    border: none;
    border-radius: 8px;
  }

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
    }

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 5px;
    }
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

    &.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &.red { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    &.orange { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }
    &.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
  }

  .chart-row {
    margin-bottom: 20px;
    padding: 0 20px;
  }

  .chart-card {
    border: none;
    border-radius: 8px;
  }

  .chart-container {
    height: 300px;
    width: 100%;
  }

  .rank-card {
    border: none;
    border-radius: 8px;
    margin: 0 20px 20px;
  }
}
</style>
