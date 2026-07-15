<template>
  <div class="class-manage-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>班级管理</span>
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-permission="'class:add'" @click="handleAdd">新增班级</el-button>
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
        <template #status="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'danger'">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <el-button type="primary" link v-permission="'class:edit'" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link v-permission="'class:delete'" @click="handleDelete(row)">删除</el-button>
        </template>
      </PageTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="班级编号" prop="code">
          <el-input v-model="form.code" placeholder="请输入班级编号" />
        </el-form-item>
        <el-form-item label="班主任" prop="headTeacherId">
          <el-select v-model="form.headTeacherId" placeholder="请选择班主任" style="width: 100%;">
            <el-option v-for="teacher in teacherList" :key="teacher.id" :label="teacher.name" :value="teacher.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="form.grade" placeholder="请输入年级" />
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model="form.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="人数" prop="studentCount">
          <el-input-number v-model="form.studentCount" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">禁用</el-radio>
          </el-radio-group>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import SearchForm from '@/components/SearchForm.vue'
import PageTable from '@/components/PageTable.vue'
import { getClassList, createClass, updateClass, deleteClass } from '@/api/class'
import { getUserList } from '@/api/user'

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
const teacherList = ref([])

async function loadTeachers() {
  try {
    const res = await getUserList({ pageNum: 1, pageSize: 100 })
    teacherList.value = res.data.list || res.data.items || []
  } catch (e) {
    console.error('加载教师列表失败:', e)
  }
}

const searchForm = reactive({
  keyword: '',
  grade: ''
})

const searchFields = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '班级名称/编号' },
  { prop: 'grade', label: '年级', type: 'input', placeholder: '请输入年级' }
]

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'name', label: '班级名称', minWidth: 150 },
  { prop: 'code', label: '班级编号', minWidth: 120 },
  { prop: 'grade', label: '年级', width: 100 },
  { prop: 'major', label: '专业', minWidth: 150 },
  { prop: 'headTeacherName', label: '班主任', width: 100 },
  { prop: 'studentCount', label: '人数', width: 80 },
  { slot: 'status', label: '状态', width: 80 },
  { prop: 'createTime', label: '创建时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 150, fixed: 'right' }
]

const form = reactive({
  id: null,
  name: '',
  code: '',
  headTeacherId: null,
  grade: '',
  major: '',
  studentCount: 0,
  enabled: true,
  remark: ''
})

const formRules = {
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入班级编号', trigger: 'blur' }]
}

async function getList() {
  loading.value = true
  try {
    const res = await getClassList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchForm.keyword,
      grade: searchForm.grade
    })
    tableData.value = res.data.list || res.data.items || []
    total.value = res.data.totalCount || res.data.total || 0
  } catch (error) {
    console.error('获取班级列表失败:', error)
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
  dialogTitle.value = '新增班级'
  Object.assign(form, { id: null, name: '', code: '', headTeacherId: null, grade: '', major: '', studentCount: 0, enabled: true, remark: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑班级'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateClass(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await createClass(form)
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
  ElMessageBox.confirm(`确定要删除班级 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteClass(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

onMounted(async () => {
  await loadTeachers()
  getList()
})
</script>

<style scoped lang="scss">
.class-manage-container {
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
