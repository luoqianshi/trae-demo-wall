<template>
  <div class="student-manage-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>学生列表</span>
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-permission="'student:add'" @click="handleAdd">新增学生</el-button>
          <ExcelImport v-permission="'student:import'" :import-url="'/api/student/import'" @success="handleImportSuccess" />
          <el-button :icon="Download" v-permission="'student:export'" @click="handleExport">导出</el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Delete" type="danger" plain v-permission="'student:recycle'" @click="goRecycle">
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
        @selectionChange="handleSelectionChange"
        @pageChange="handlePageChange"
      >
        <template #avatar="{ row }">
          <el-avatar :size="36" :src="row.avatar || ''">
            {{ row.name?.charAt(0) }}
          </el-avatar>
        </template>
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '在读' : '休学' }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
          <el-button type="primary" link v-permission="'student:edit'" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link v-permission="'student:delete'" @click="handleDelete(row)">删除</el-button>
        </template>
      </PageTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学号" prop="studentNo">
              <el-input v-model="form.studentNo" :disabled="isEdit" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="form.gender">
                <el-radio value="男">男</el-radio>
                <el-radio value="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班级" prop="classId">
              <el-select v-model="form.classId" placeholder="请选择班级" style="width: 100%;">
                <el-option v-for="cls in classList" :key="cls.id" :label="cls.name" :value="cls.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="form.idCard" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">在读</el-radio>
                <el-radio :value="0">休学</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="头像">
              <UploadImg v-model="form.avatar" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="家庭住址" prop="address">
              <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入家庭住址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, Delete } from '@element-plus/icons-vue'
import SearchForm from '@/components/SearchForm.vue'
import PageTable from '@/components/PageTable.vue'
import ExcelImport from '@/components/ExcelImport.vue'
import UploadImg from '@/components/UploadImg.vue'
import { getStudentList, createStudent, updateStudent, deleteStudent, exportStudents } from '@/api/student'
import { getClassList } from '@/api/class'

const router = useRouter()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])
const classList = ref([])

async function loadClasses() {
  try {
    const res = await getClassList({ pageNum: 1, pageSize: 100 })
    classList.value = res.data.list || res.data.items || []
  } catch (e) {
    console.error('加载班级列表失败:', e)
  }
}

const searchForm = reactive({
  keyword: '',
  classId: '',
  status: ''
})

const searchFields = computed(() => [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '姓名/学号' },
  { prop: 'classId', label: '班级', type: 'select', options: [
    { label: '全部', value: '' },
    ...(classList.value.map(c => ({ label: c.className || c.name, value: c.id })))
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '在读', value: 1 },
    { label: '休学', value: 0 }
  ]}
])

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { slot: 'avatar', label: '头像', width: 80 },
  { prop: 'studentNo', label: '学号', minWidth: 120 },
  { prop: 'name', label: '姓名', minWidth: 100 },
  { prop: 'gender', label: '性别', width: 60 },
  { prop: 'className', label: '班级', minWidth: 150 },
  { prop: 'phone', label: '手机号', minWidth: 120 },
  { slot: 'status', label: '状态', width: 80 },
  { prop: 'createTime', label: '入学时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 180, fixed: 'right' }
]

const form = reactive({
  id: null,
  studentNo: '',
  name: '',
  gender: '男',
  classId: null,
  phone: '',
  idCard: '',
  email: '',
  avatar: '',
  address: '',
  status: 1,
  remark: ''
})

const formRules = {
  studentNo: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }]
}

async function getList() {
  loading.value = true
  try {
    const res = await getStudentList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchForm.keyword,
      classId: searchForm.classId,
      status: searchForm.status
    })
    tableData.value = res.data.list || res.data.items || []
    total.value = res.data.totalCount || res.data.total || 0
  } catch (error) {
    console.error('获取学生列表失败:', error)
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

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增学生'
  Object.assign(form, { id: null, studentNo: '', name: '', gender: '男', classId: null, phone: '', idCard: '', email: '', avatar: '', address: '', status: 1, remark: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑学生'
  Object.assign(form, { ...row, classId: row.classId ?? null })
  dialogVisible.value = true
}

function handleDetail(row) {
  router.push(`/student/detail/${row.id}`)
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateStudent(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await createStudent(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        getList()
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除学生 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteStudent(row.id)
      ElMessage.success('删除成功，已移入回收站')
      getList()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

function goRecycle() {
  router.push('/student/recycle')
}

function handleImportSuccess() {
  getList()
}

async function handleExport() {
  try {
    const res = await exportStudents({
      keyword: searchForm.keyword,
      classId: searchForm.classId,
      status: searchForm.status
    })
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `学生列表_${Date.now()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export error:', error)
  }
}

onMounted(async () => {
  await loadClasses()
  getList()
})
</script>

<style scoped lang="scss">
.student-manage-container {
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
