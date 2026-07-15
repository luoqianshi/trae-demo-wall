<template>
  <div class="score-audit-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>操行分审核</span>
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <PageTable
        :columns="columns"
        :data="tableData"
        :total="total"
        :loading="loading"
        @selectionChange="handleSelectionChange"
        @pageChange="handlePageChange"
      >
        <template #score="{ row }">
          <span :style="{ color: row.score > 0 ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
            {{ row.score > 0 ? '+' : '' }}{{ row.score }}
          </span>
        </template>
        <template #status="{ row }">
          <el-tag type="warning">待审核</el-tag>
        </template>
        <template #action="{ row }">
          <el-button type="success" link v-permission="'score:audit'" @click="handleApprove(row)">通过</el-button>
          <el-button type="danger" link v-permission="'score:audit'" @click="handleReject(row)">驳回</el-button>
        </template>
      </PageTable>
    </el-card>

    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="400px">
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="80px">
        <el-form-item label="驳回意见" prop="rejectReason">
          <el-input v-model="rejectForm.rejectReason" type="textarea" :rows="4" placeholder="请输入驳回意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitLoading" @click="handleRejectSubmit">确定驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm.vue'
import PageTable from '@/components/PageTable.vue'

const loading = ref(false)
const submitLoading = ref(false)
const rejectDialogVisible = ref(false)
const rejectFormRef = ref(null)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])
const currentRecordId = ref(null)

const searchForm = reactive({
  keyword: '',
  classId: '',
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
  { prop: 'applicantName', label: '申请人', width: 100 },
  { slot: 'status', label: '状态', width: 90 },
  { prop: 'createTime', label: '申请时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 150, fixed: 'right' }
]

const rejectForm = reactive({
  rejectReason: ''
})

const rejectRules = {
  rejectReason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
}

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 5, studentName: '钱七', studentNo: '20230005', className: '软工2301班', ruleName: '值日优秀', type: '卫生', score: 2, reason: '本周值日非常认真', applicantName: '赵卫生委员', status: 0, createTime: '2024-01-15 17:00:00' },
      { id: 6, studentName: '孙八', studentNo: '20230006', className: '软工2301班', ruleName: '上课讲话', type: '纪律', score: -1, reason: '上课与同学讲话', applicantName: '李班长', status: 0, createTime: '2024-01-15 10:00:00' }
    ]
    total.value = 2
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

function handleSelectionChange(selection) {
  selectedRows.value = selection
}

function handleApprove(row) {
  ElMessageBox.confirm(`确定通过这条操行分记录吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('审核通过')
    getList()
  })
}

function handleReject(row) {
  currentRecordId.value = row.id
  rejectForm.rejectReason = ''
  rejectDialogVisible.value = true
}

async function handleRejectSubmit() {
  if (!rejectFormRef.value) return
  await rejectFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        ElMessage.success('已驳回')
        rejectDialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.score-audit-container {
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
