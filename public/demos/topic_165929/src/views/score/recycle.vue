<template>
  <div class="score-recycle-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-page-header @back="goBack" content="操行分回收站" />
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <PageTable
        :columns="columns"
        :data="tableData"
        :total="total"
        :loading="loading"
        @pageChange="handlePageChange"
      >
        <template #score="{ row }">
          <span :style="{ color: row.score > 0 ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
            {{ row.score > 0 ? '+' : '' }}{{ row.score }}
          </span>
        </template>
        <template #action="{ row }">
          <el-button type="success" link @click="handleRestore(row)">恢复</el-button>
          <el-button type="danger" link @click="handlePermanentDelete(row)">永久删除</el-button>
        </template>
      </PageTable>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm.vue'
import PageTable from '@/components/PageTable.vue'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  keyword: '',
  type: ''
})

const searchFields = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '学生姓名/学号' },
  { prop: 'type', label: '类型', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '学习', value: '学习' },
    { label: '纪律', value: '纪律' },
    { label: '卫生', value: '卫生' },
    { label: '其他', value: '其他' }
  ]}
]

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'studentName', label: '学生', minWidth: 100 },
  { prop: 'studentNo', label: '学号', minWidth: 120 },
  { prop: 'className', label: '班级', minWidth: 150 },
  { prop: 'ruleName', label: '规则', minWidth: 150 },
  { prop: 'type', label: '类型', width: 80 },
  { slot: 'score', label: '分值', width: 80 },
  { prop: 'reason', label: '原因', minWidth: 200 },
  { prop: 'deleteTime', label: '删除时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 180, fixed: 'right' }
]

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 7, studentName: '周九', studentNo: '20230007', className: '计算机2301班', ruleName: '测试记录', type: '其他', score: 1, reason: '测试数据', deleteTime: '2024-01-10 10:00:00' }
    ]
    total.value = 1
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  getList()
}

function handlePageChange({ pageNum: pn, pageSize: ps }) {
  pageNum.value = pn
  pageSize.value = ps
  getList()
}

function goBack() {
  router.push('/score/record')
}

function handleRestore(row) {
  ElMessageBox.confirm(`确定要恢复这条记录吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('恢复成功')
    getList()
  })
}

function handlePermanentDelete(row) {
  ElMessageBox.confirm(`确定要永久删除这条记录吗？此操作不可恢复！`, '警告', {
    type: 'error',
    confirmButtonText: '确定删除'
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.score-recycle-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    font-size: 16px;
    font-weight: 600;
  }
}
</style>
