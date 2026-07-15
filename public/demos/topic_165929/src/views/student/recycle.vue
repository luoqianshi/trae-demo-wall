<template>
  <div class="student-recycle-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-page-header @back="goBack" content="学生回收站" />
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
  classId: ''
})

const searchFields = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '姓名/学号' },
  { prop: 'classId', label: '班级', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '计算机2301班', value: 1 },
    { label: '计算机2302班', value: 2 },
    { label: '软工2301班', value: 3 }
  ]}
]

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'studentNo', label: '学号', minWidth: 120 },
  { prop: 'name', label: '姓名', minWidth: 100 },
  { prop: 'gender', label: '性别', width: 60 },
  { prop: 'className', label: '班级', minWidth: 150 },
  { prop: 'phone', label: '手机号', minWidth: 120 },
  { prop: 'deleteTime', label: '删除时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 180, fixed: 'right' }
]

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 6, studentNo: '20230006', name: '孙八', gender: '男', className: '软工2301班', phone: '13800138006', deleteTime: '2024-01-10 10:00:00' }
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
  router.push('/student/index')
}

function handleRestore(row) {
  ElMessageBox.confirm(`确定要恢复学生 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('恢复成功')
    getList()
  })
}

function handlePermanentDelete(row) {
  ElMessageBox.confirm(`确定要永久删除学生 "${row.name}" 吗？此操作不可恢复！`, '警告', {
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
.student-recycle-container {
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
