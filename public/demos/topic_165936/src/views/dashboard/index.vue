<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalStudents }}</div>
              <div class="stat-label">班级总人数</div>
            </div>
            <div class="stat-icon blue">
              <el-icon :size="40"><User /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-number">{{ stats.avgScore }}</div>
              <div class="stat-label">操行分均值</div>
            </div>
            <div class="stat-icon green">
              <el-icon :size="40"><Medal /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-number">{{ stats.leaveCount }}</div>
              <div class="stat-label">今日请假</div>
            </div>
            <div class="stat-icon orange">
              <el-icon :size="40"><Calendar /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-number">{{ stats.phoneCount }}</div>
              <div class="stat-label">已收手机</div>
            </div>
            <div class="stat-icon purple">
              <el-icon :size="40"><Iphone /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :md="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>操行分趋势</span>
            </div>
          </template>
          <div ref="scoreChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :md="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>请假类型统计</span>
            </div>
          </template>
          <div ref="leaveChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :md="16">
        <el-card class="notice-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近通知</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(notice, index) in notices"
              :key="index"
              :timestamp="notice.time"
              placement="top"
              :type="notice.type"
            >
              <el-card>
                <h4>{{ notice.title }}</h4>
                <p>{{ notice.content }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :md="8">
        <el-card class="shortcut-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="shortcut-grid">
            <div v-for="item in shortcuts" :key="item.path" class="shortcut-item" @click="goTo(item.path)">
              <el-icon :size="28"><component :is="item.icon" /></el-icon>
              <span>{{ item.name }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { User, Medal, Calendar, Iphone, School, List, Document, ChatDotRound, DataLine, Warning, Tools } from '@element-plus/icons-vue'

const router = useRouter()
const scoreChartRef = ref(null)
const leaveChartRef = ref(null)

const stats = ref({
  totalStudents: 45,
  avgScore: 85.6,
  leaveCount: 3,
  phoneCount: 38
})

const notices = ref([
  { title: '本周操行分汇总', content: '本周共有12名学生获得加分，5名学生被扣分。', time: '2024-01-15 10:30', type: 'primary' },
  { title: '新学生注册审核', content: '有3名新学生提交了注册申请，请及时审核。', time: '2024-01-14 16:20', type: 'success' },
  { title: '心理预警提醒', content: '系统检测到2名学生可能存在心理问题，请关注。', time: '2024-01-14 09:15', type: 'warning' },
  { title: '周末放假通知', content: '本周五下午放学后学生可离校，周日晚返校。', time: '2024-01-13 14:00', type: 'info' }
])

const shortcuts = [
  { name: '学生管理', icon: 'School', path: '/student/index' },
  { name: '操行分录入', icon: 'List', path: '/score/record' },
  { name: '请假审批', icon: 'Document', path: '/leave/index' },
  { name: '收手机管理', icon: 'Iphone', path: '/phone/index' },
  { name: 'AI聊天', icon: 'ChatDotRound', path: '/ai/chat' },
  { name: '报表中心', icon: 'DataLine', path: '/report/index' }
]

function goTo(path) {
  router.push(path)
}

function initScoreChart() {
  if (!scoreChartRef.value) return
  const chart = echarts.init(scoreChartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value',
      name: '分数'
    },
    series: [
      {
        name: '操行分',
        data: [82, 85, 84, 88, 86, 83, 85],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: { color: '#409EFF', width: 2 },
        itemStyle: { color: '#409EFF' }
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
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [
      {
        name: '请假类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: [
          { value: 15, name: '病假', itemStyle: { color: '#F56C6C' } },
          { value: 10, name: '事假', itemStyle: { color: '#E6A23C' } },
          { value: 5, name: '公假', itemStyle: { color: '#409EFF' } },
          { value: 3, name: '其他', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

onMounted(() => {
  nextTick(() => {
    initScoreChart()
    initLeaveChart()
  })
})
</script>

<style scoped lang="scss">
.dashboard-container {
  padding: 0;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.stat-info {
  .stat-number {
    font-size: 32px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 8px;
  }
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &.blue {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.green {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }

  &.orange {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.purple {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  border: none;
  border-radius: 8px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.content-row {
  margin-bottom: 20px;
}

.notice-card {
  border: none;
  border-radius: 8px;
}

.shortcut-card {
  border: none;
  border-radius: 8px;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 10px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #606266;

  &:hover {
    background-color: #ecf5ff;
    color: #409EFF;
    transform: translateY(-2px);
  }

  span {
    margin-top: 8px;
    font-size: 13px;
  }
}
</style>
