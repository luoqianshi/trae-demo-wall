<template>
  <div class="phone-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>收手机总览</span>
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <el-row :gutter="20" class="stat-cards">
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.totalStudents }}</div>
                <div class="stat-label">总人数</div>
              </div>
              <div class="stat-icon blue">
                <el-icon :size="32"><User /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.collected }}</div>
                <div class="stat-label">已收取</div>
              </div>
              <div class="stat-icon green">
                <el-icon :size="32"><CircleCheck /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.notCollected }}</div>
                <div class="stat-label">未收取</div>
              </div>
              <div class="stat-icon red">
                <el-icon :size="32"><Warning /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-info">
                <div class="stat-number">{{ stats.collectionRate }}%</div>
                <div class="stat-label">收取率</div>
              </div>
              <div class="stat-icon purple">
                <el-icon :size="32"><DataLine /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="success" :icon="Upload" v-permission="'phone:collect'" @click="handleBatchCollect">
            批量收取
          </el-button>
          <el-button type="warning" :icon="Download" v-permission="'phone:return'" @click="handleBatchReturn">
            批量发放
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="List" @click="goRecords">变动明细</el-button>
          <el-button :icon="Refresh" @click="getList">刷新</el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="className" label="班级" min-width="150" />
        <el-table-column prop="totalCount" label="总人数" width="100" align="center" />
        <el-table-column prop="collectedCount" label="已收取" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.collectedCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notCollectedCount" label="未收取" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.notCollectedCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="collectionRate" label="收取率" width="120" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.collectionRate" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="班级收手机详情" width="800px">
      <div class="detail-header">
        <span class="class-name">{{ currentClassName }}</span>
        <div class="detail-actions">
          <el-button type="success" size="small" @click="handleCollectAll">全部收取</el-button>
          <el-button type="warning" size="small" @click="handleReturnAll">全部发放</el-button>
        </div>
      </div>
      <el-table :data="studentPhoneData" stripe height="400">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="studentNo" label="学号" min-width="120" />
        <el-table-column prop="studentName" label="姓名" min-width="100" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '已收取' : '未收取' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="days" label="已收天数" width="100" align="center" />
        <el-table-column prop="lastCollectTime" label="上次收取" type="time" width="170" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status !== 1" type="success" link size="small" @click="handleCollectOne(row)">收取</el-button>
            <el-button v-else type="warning" link size="small" @click="handleReturnOne(row)">发放</el-button>
            <el-button type="primary" link size="small" @click="handleAdjustDays(row)">调整天数</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="adjustDialogVisible" title="调整天数" width="400px">
      <el-form :model="adjustForm" label-width="80px">
        <el-form-item label="调整天数">
          <el-input-number v-model="adjustForm.days" :min="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="adjustForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdjustSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Download, List, Refresh, User, CircleCheck, Warning, DataLine } from '@element-plus/icons-vue'
import SearchForm from '@/components/SearchForm.vue'

const router = useRouter()
const loading = ref(false)
const detailDialogVisible = ref(false)
const adjustDialogVisible = ref(false)
const tableData = ref([])
const studentPhoneData = ref([])
const currentClassName = ref('')
const currentStudentId = ref(null)

const stats = ref({
  totalStudents: 130,
  collected: 110,
  notCollected: 20,
  collectionRate: 84.6
})

const searchForm = reactive({
  classId: ''
})

const searchFields = [
  { prop: 'classId', label: '班级', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '计算机2301班', value: 1 },
    { label: '计算机2302班', value: 2 },
    { label: '软工2301班', value: 3 }
  ]}
]

const adjustForm = reactive({
  days: 0,
  remark: ''
})

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, className: '计算机2301班', totalCount: 45, collectedCount: 40, notCollectedCount: 5, collectionRate: 89 },
      { id: 2, className: '计算机2302班', totalCount: 43, collectedCount: 38, notCollectedCount: 5, collectionRate: 88 },
      { id: 3, className: '软工2301班', totalCount: 42, collectedCount: 32, notCollectedCount: 10, collectionRate: 76 }
    ]
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  getList()
}

function handleViewDetail(row) {
  currentClassName.value = row.className
  studentPhoneData.value = [
    { id: 1, studentNo: '20230001', studentName: '张三', status: 1, days: 30, lastCollectTime: '2024-01-15 08:00:00' },
    { id: 2, studentNo: '20230002', studentName: '李四', status: 1, days: 28, lastCollectTime: '2024-01-15 08:00:00' },
    { id: 3, studentNo: '20230003', studentName: '王五', status: 0, days: 25, lastCollectTime: '2024-01-12 08:00:00' },
    { id: 4, studentNo: '20230004', studentName: '赵六', status: 1, days: 30, lastCollectTime: '2024-01-15 08:00:00' },
    { id: 5, studentNo: '20230005', studentName: '钱七', status: 0, days: 20, lastCollectTime: '2024-01-10 08:00:00' }
  ]
  detailDialogVisible.value = true
}

function handleBatchCollect() {
  ElMessageBox.confirm('确定要批量收取选中班级的手机吗？', '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量收取成功')
    getList()
  })
}

function handleBatchReturn() {
  ElMessageBox.confirm('确定要批量发放选中班级的手机吗？', '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量发放成功')
    getList()
  })
}

function handleCollectAll() {
  ElMessage.success('全部收取成功')
}

function handleReturnAll() {
  ElMessage.success('全部发放成功')
}

function handleCollectOne(row) {
  row.status = 1
  row.days += 1
  row.lastCollectTime = new Date().toLocaleString('zh-CN')
  ElMessage.success('收取成功')
}

function handleReturnOne(row) {
  row.status = 0
  ElMessage.success('发放成功')
}

function handleAdjustDays(row) {
  currentStudentId.value = row.id
  adjustForm.days = row.days
  adjustForm.remark = ''
  adjustDialogVisible.value = true
}

function handleAdjustSubmit() {
  ElMessage.success('调整成功')
  adjustDialogVisible.value = false
}

function goRecords() {
  router.push('/phone/records')
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.phone-container {
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
    &.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    &.red { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    &.purple { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 0 20px;
  }

  .toolbar-left, .toolbar-right {
    display: flex;
    gap: 10px;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .class-name {
      font-size: 16px;
      font-weight: 600;
    }
  }
}
</style>
