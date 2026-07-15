<template>
  <div class="score-record-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>操行分记录</span>
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-permission="'score:record:add'" @click="handleQuickAdd">
            快捷录入
          </el-button>
          <el-button type="success" :icon="Edit" v-permission="'score:record:add'" @click="handleManualAdd">
            手动录入
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Delete" type="danger" plain v-permission="'score:recycle'" @click="goRecycle">
            回收站
          </el-button>
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
        <template #score="{ row }">
          <span :style="{ color: row.score > 0 ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
            {{ row.score > 0 ? '+' : '' }}{{ row.score }}
          </span>
        </template>
        <template #status="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
        <template #attachment="{ row }">
          <el-image
            v-if="row.attachment"
            :src="row.attachment"
            :preview-src-list="[row.attachment]"
            style="width: 40px; height: 40px; cursor: pointer;"
            fit="cover"
          />
          <span v-else>-</span>
        </template>
        <template #action="{ row }">
          <el-button type="primary" link v-if="row.status === 0" @click="handleView(row)">查看</el-button>
          <el-button type="danger" link v-permission="'score:record:delete'" @click="handleDelete(row)">删除</el-button>
        </template>
      </PageTable>
    </el-card>

    <el-dialog v-model="quickDialogVisible" title="快捷录入" width="600px">
      <el-form :model="quickForm" :rules="quickRules" ref="quickFormRef" label-width="80px">
        <el-form-item label="选择规则" prop="ruleId">
          <el-select v-model="quickForm.ruleId" placeholder="请选择规则" style="width: 100%;">
            <el-option v-for="rule in ruleList" :key="rule.id" :label="rule.name" :value="rule.id">
              <span>{{ rule.name }}</span>
              <span :style="{ float: 'right', color: rule.score > 0 ? '#67C23A' : '#F56C6C' }">
                {{ rule.score > 0 ? '+' : '' }}{{ rule.score }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="选择学生" prop="studentIds">
          <el-select v-model="quickForm.studentIds" multiple filterable placeholder="请选择学生" style="width: 100%;">
            <el-option v-for="stu in studentList" :key="stu.id" :label="`${stu.name} (${stu.studentNo})`" :value="stu.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="quickForm.reason" type="textarea" :rows="2" placeholder="请输入原因" />
        </el-form-item>
        <el-form-item label="附件图片">
          <UploadImg v-model="quickForm.attachment" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleQuickSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="manualDialogVisible" title="手动录入" width="600px">
      <el-form :model="manualForm" :rules="manualRules" ref="manualFormRef" label-width="80px">
        <el-form-item label="学生" prop="studentId">
          <el-select v-model="manualForm.studentId" filterable placeholder="请选择学生" style="width: 100%;">
            <el-option v-for="stu in studentList" :key="stu.id" :label="`${stu.name} (${stu.studentNo})`" :value="stu.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="manualForm.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="学习" value="学习" />
            <el-option label="纪律" value="纪律" />
            <el-option label="卫生" value="卫生" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="分值" prop="score">
          <el-input-number v-model="manualForm.score" :min="-10" :max="10" />
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="manualForm.reason" type="textarea" :rows="3" placeholder="请输入原因" />
        </el-form-item>
        <el-form-item label="附件图片">
          <UploadImg v-model="manualForm.attachment" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleManualSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Refresh, Delete } from '@element-plus/icons-vue'
import SearchForm from '@/components/SearchForm.vue'
import PageTable from '@/components/PageTable.vue'
import UploadImg from '@/components/UploadImg.vue'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const quickDialogVisible = ref(false)
const manualDialogVisible = ref(false)
const quickFormRef = ref(null)
const manualFormRef = ref(null)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const ruleList = ref([
  { id: 1, name: '按时交作业', score: 2, type: '学习' },
  { id: 2, name: '上课迟到', score: -1, type: '纪律' },
  { id: 3, name: '打扫卫生', score: 1, type: '卫生' },
  { id: 4, name: '上课积极回答问题', score: 2, type: '学习' },
  { id: 5, name: '宿舍卫生优秀', score: 3, type: '卫生' }
])

const studentList = ref([
  { id: 1, name: '张三', studentNo: '20230001' },
  { id: 2, name: '李四', studentNo: '20230002' },
  { id: 3, name: '王五', studentNo: '20230003' },
  { id: 4, name: '赵六', studentNo: '20230004' }
])

const searchForm = reactive({
  keyword: '',
  classId: '',
  type: '',
  status: '',
  dateRange: []
})

const searchFields = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '学生姓名/学号' },
  { prop: 'type', label: '类型', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '学习', value: '学习' },
    { label: '纪律', value: '纪律' },
    { label: '卫生', value: '卫生' },
    { label: '其他', value: '其他' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '待审核', value: 0 },
    { label: '已通过', value: 1 },
    { label: '已驳回', value: 2 }
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
  { slot: 'attachment', label: '附件', width: 80 },
  { prop: 'operatorName', label: '操作人', width: 100 },
  { slot: 'status', label: '状态', width: 90 },
  { prop: 'createTime', label: '时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 150, fixed: 'right' }
]

const quickForm = reactive({
  ruleId: null,
  studentIds: [],
  reason: '',
  attachment: ''
})

const quickRules = {
  ruleId: [{ required: true, message: '请选择规则', trigger: 'change' }],
  studentIds: [{ required: true, message: '请选择学生', trigger: 'change' }]
}

const manualForm = reactive({
  studentId: null,
  type: '',
  score: 0,
  reason: '',
  attachment: ''
})

const manualRules = {
  studentId: [{ required: true, message: '请选择学生', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  score: [{ required: true, message: '请输入分值', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入原因', trigger: 'blur' }]
}

function getStatusType(status) {
  const map = { 0: 'warning', 1: 'success', 2: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '待审核', 1: '已通过', 2: '已驳回' }
  return map[status] || '未知'
}

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, studentName: '张三', studentNo: '20230001', className: '计算机2301班', ruleName: '按时交作业', type: '学习', score: 2, reason: '按时完成作业', attachment: '', operatorName: '王老师', status: 1, createTime: '2024-01-15 10:00:00' },
      { id: 2, studentName: '李四', studentNo: '20230002', className: '计算机2301班', ruleName: '上课迟到', type: '纪律', score: -1, reason: '早自习迟到5分钟', attachment: '', operatorName: '李班长', status: 1, createTime: '2024-01-14 08:00:00' },
      { id: 3, studentName: '王五', studentNo: '20230003', className: '计算机2302班', ruleName: '打扫卫生', type: '卫生', score: 1, reason: '值日认真', attachment: '', operatorName: '赵卫生委员', status: 0, createTime: '2024-01-13 17:00:00' },
      { id: 4, studentName: '赵六', studentNo: '20230004', className: '计算机2302班', ruleName: '上课积极回答问题', type: '学习', score: 2, reason: '课堂表现积极', attachment: '', operatorName: '张老师', status: 1, createTime: '2024-01-12 14:00:00' }
    ]
    total.value = 50
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

function handleQuickAdd() {
  Object.assign(quickForm, { ruleId: null, studentIds: [], reason: '', attachment: '' })
  quickDialogVisible.value = true
}

function handleManualAdd() {
  Object.assign(manualForm, { studentId: null, type: '', score: 0, reason: '', attachment: '' })
  manualDialogVisible.value = true
}

async function handleQuickSubmit() {
  if (!quickFormRef.value) return
  await quickFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        ElMessage.success('录入成功，等待审核')
        quickDialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

async function handleManualSubmit() {
  if (!manualFormRef.value) return
  await manualFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        ElMessage.success('录入成功，等待审核')
        manualDialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

function handleView(row) {
  console.log('View record:', row)
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除这条记录吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功，已移入回收站')
    getList()
  })
}

function goRecycle() {
  router.push('/score/recycle')
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.score-record-container {
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

  .toolbar-left, .toolbar-right {
    display: flex;
    gap: 10px;
  }
}
</style>
