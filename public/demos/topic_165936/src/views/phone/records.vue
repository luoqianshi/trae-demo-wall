<template>
  <div class="phone-records-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-page-header @back="goBack" content="变动明细" />
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
        <template #type="{ row }">
          <el-tag :type="row.type === '收取' ? 'success' : 'warning'">
            {{ row.type }}
          </el-tag>
        </template>
      </PageTable>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
  classId: '',
  type: '',
  dateRange: []
})

const searchFields = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '学生姓名/学号' },
  { prop: 'classId', label: '班级', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '计算机2301班', value: 1 },
    { label: '计算机2302班', value: 2 },
    { label: '软工2301班', value: 3 }
  ]},
  { prop: 'type', label: '类型', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '收取', value: '收取' },
    { label: '发放', value: '发放' },
    { label: '调整', value: '调整' }
  ]}
]

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'studentName', label: '学生', minWidth: 100 },
  { prop: 'studentNo', label: '学号', minWidth: 120 },
  { prop: 'className', label: '班级', minWidth: 150 },
  { slot: 'type', label: '类型', width: 80 },
  { prop: 'days', label: '变动天数', width: 100 },
  { prop: 'operatorName', label: '操作人', width: 100 },
  { prop: 'remark', label: '备注', minWidth: 200 },
  { prop: 'createTime', label: '操作时间', type: 'time', width: 180 }
]

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, studentName: '张三', studentNo: '20230001', className: '计算机2301班', type: '收取', days: 1, operatorName: '李班长', remark: '周一收取', createTime: '2024-01-15 08:00:00' },
      { id: 2, studentName: '李四', studentNo: '20230002', className: '计算机2301班', type: '收取', days: 1, operatorName: '李班长', remark: '周一收取', createTime: '2024-01-15 08:00:00' },
      { id: 3, studentName: '王五', studentNo: '20230003', className: '计算机2302班', type: '发放', days: -1, operatorName: '张老师', remark: '生病请假', createTime: '2024-01-14 17:00:00' },
      { id: 4, studentName: '赵六', studentNo: '20230004', className: '计算机2302班', type: '调整', days: 2, operatorName: '张老师', remark: '补录上周', createTime: '2024-01-14 16:00:00' },
      { id: 5, studentName: '钱七', studentNo: '20230005', className: '软工2301班', type: '收取', days: 1, operatorName: '王班长', remark: '周一收取', createTime: '2024-01-15 08:00:00' }
    ]
    total.value = 100
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
  router.push('/phone/index')
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.phone-records-container {
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
