<template>
  <div class="leave-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>请假列表</span>
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-permission="'leave:add'" @click="handleAdd">新增请假</el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Refresh" @click="getList">刷新</el-button>
        </div>
      </div>

      <PageTable
        :columns="columns"
        :data="tableData"
        :total="total"
        :loading="loading"
        @pageChange="handlePageChange"
      >
        <template #type="{ row }">
          <el-tag :type="getLeaveTypeColor(row.type)">
            {{ row.type }}
          </el-tag>
        </template>
        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <el-button type="primary" link @click="handleView(row)">查看</el-button>
          <el-button v-if="row.status === 0" type="success" link v-permission="'leave:approve'" @click="handleApprove(row)">通过</el-button>
          <el-button v-if="row.status === 0" type="danger" link v-permission="'leave:approve'" @click="handleReject(row)">驳回</el-button>
          <el-button v-if="row.status !== 1" type="primary" link v-permission="'leave:edit'" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link v-permission="'leave:delete'" @click="handleDelete(row)">删除</el-button>
        </template>
      </PageTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="学生" prop="studentId">
          <el-select v-model="form.studentId" filterable placeholder="请选择学生" style="width: 100%;">
            <el-option v-for="stu in studentList" :key="stu.id" :label="`${stu.name} (${stu.studentNo})`" :value="stu.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="请假类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="病假" value="病假" />
            <el-option label="事假" value="事假" />
            <el-option label="公假" value="公假" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择开始时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择结束时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="请假事由" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="请输入请假事由" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

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
import { Plus, Refresh } from '@element-plus/icons-vue'
import SearchForm from '@/components/SearchForm.vue'
import PageTable from '@/components/PageTable.vue'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const rejectFormRef = ref(null)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const currentLeaveId = ref(null)

const studentList = ref([
  { id: 1, name: '张三', studentNo: '20230001' },
  { id: 2, name: '李四', studentNo: '20230002' },
  { id: 3, name: '王五', studentNo: '20230003' }
])

const searchForm = reactive({
  keyword: '',
  type: '',
  status: '',
  dateRange: []
})

const searchFields = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '学生姓名/学号' },
  { prop: 'type', label: '类型', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '病假', value: '病假' },
    { label: '事假', value: '事假' },
    { label: '公假', value: '公假' },
    { label: '其他', value: '其他' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '待审批', value: 0 },
    { label: '已通过', value: 1 },
    { label: '已驳回', value: 2 },
    { label: '已销假', value: 3 }
  ]}
]

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'studentName', label: '学生', minWidth: 100 },
  { prop: 'studentNo', label: '学号', minWidth: 120 },
  { prop: 'className', label: '班级', minWidth: 150 },
  { slot: 'type', label: '类型', width: 80 },
  { prop: 'startTime', label: '开始时间', type: 'time', width: 170 },
  { prop: 'endTime', label: '结束时间', type: 'time', width: 170 },
  { prop: 'reason', label: '事由', minWidth: 200 },
  { slot: 'status', label: '状态', width: 90 },
  { prop: 'approverName', label: '审批人', width: 100 },
  { slot: 'action', label: '操作', width: 220, fixed: 'right' }
]

const form = reactive({
  id: null,
  studentId: null,
  type: '',
  startTime: '',
  endTime: '',
  reason: '',
  remark: ''
})

const formRules = {
  studentId: [{ required: true, message: '请选择学生', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  reason: [{ required: true, message: '请输入请假事由', trigger: 'blur' }]
}

const rejectForm = reactive({
  rejectReason: ''
})

const rejectRules = {
  rejectReason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
}

function getLeaveTypeColor(type) {
  const map = { '病假': 'danger', '事假': 'warning', '公假': 'primary', '其他': 'info' }
  return map[type] || 'info'
}

function getStatusType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审批', 1: '已通过', 2: '已驳回', 3: '已销假' }
  return map[status] || '未知'
}

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, studentName: '张三', studentNo: '20230001', className: '计算机2301班', type: '病假', startTime: '2024-01-15 08:00:00', endTime: '2024-01-16 18:00:00', reason: '感冒发烧', status: 1, approverName: '张老师', remark: '' },
      { id: 2, studentName: '李四', studentNo: '20230002', className: '计算机2301班', type: '事假', startTime: '2024-01-14 14:00:00', endTime: '2024-01-14 17:00:00', reason: '家中有事', status: 0, approverName: '', remark: '' },
      { id: 3, studentName: '王五', studentNo: '20230003', className: '计算机2302班', type: '公假', startTime: '2024-01-13 08:00:00', endTime: '2024-01-13 18:00:00', reason: '参加比赛', status: 1, approverName: '李主任', remark: '' }
    ]
    total.value = 15
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

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增请假'
  Object.assign(form, { id: null, studentId: null, type: '', startTime: '', endTime: '', reason: '', remark: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑请假'
  Object.assign(form, { ...row, studentId: row.studentId || row.id })
  dialogVisible.value = true
}

function handleView(row) {
  console.log('View leave:', row)
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        ElMessage.success(isEdit.value ? '更新成功' : '提交成功')
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

function handleApprove(row) {
  ElMessageBox.confirm(`确定通过这条请假申请吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('审批通过')
    getList()
  })
}

function handleReject(row) {
  currentLeaveId.value = row.id
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

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除这条请假记录吗？`, '提示', {
    type: 'warning'
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
.leave-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    font-size: 16px;
    font-weight: 600;
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 0 20px;
  }
}
</style>
