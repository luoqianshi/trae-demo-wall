<template>
  <div class="score-rule-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>规则管理</span>
        </div>
      </template>

      <SearchForm v-model="searchForm" :fields="searchFields" @search="handleSearch" />

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-permission="'score:rule:add'" @click="handleAdd">新增规则</el-button>
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
        <template #score="{ row }">
          <span :style="{ color: row.score > 0 ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
            {{ row.score > 0 ? '+' : '' }}{{ row.score }}
          </span>
        </template>
        <template #status="{ row }">
          <el-switch
            v-model="row.enabled"
            :active-value="true"
            :inactive-value="false"
            @change="handleToggle(row)"
          />
        </template>
        <template #action="{ row }">
          <el-button type="primary" link v-permission="'score:rule:edit'" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link v-permission="'score:rule:delete'" @click="handleDelete(row)">删除</el-button>
        </template>
      </PageTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="学习" value="学习" />
            <el-option label="纪律" value="纪律" />
            <el-option label="卫生" value="卫生" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="分值" prop="score">
          <el-input-number v-model="form.score" :min="-10" :max="10" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">禁用</el-radio>
          </el-radio-group>
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

const searchForm = reactive({
  keyword: '',
  type: '',
  enabled: ''
})

const searchFields = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '规则名称' },
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
  { prop: 'name', label: '规则名称', minWidth: 180 },
  { prop: 'type', label: '类型', width: 80 },
  { slot: 'score', label: '分值', width: 80 },
  { prop: 'description', label: '描述', minWidth: 250 },
  { slot: 'status', label: '状态', width: 100 },
  { prop: 'createTime', label: '创建时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 150, fixed: 'right' }
]

const form = reactive({
  id: null,
  name: '',
  type: '学习',
  score: 0,
  description: '',
  enabled: true
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  score: [{ required: true, message: '请输入分值', trigger: 'blur' }]
}

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, name: '按时交作业', type: '学习', score: 2, description: '按时完成作业并提交', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 2, name: '上课迟到', type: '纪律', score: -1, description: '上课/自习迟到', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 3, name: '打扫卫生', type: '卫生', score: 1, description: '值日认真负责', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 4, name: '上课积极回答问题', type: '学习', score: 2, description: '课堂表现积极', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 5, name: '宿舍卫生优秀', type: '卫生', score: 3, description: '宿舍被评为优秀', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 6, name: '旷课', type: '纪律', score: -5, description: '无故旷课', enabled: true, createTime: '2024-01-01 00:00:00' }
    ]
    total.value = 6
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
  dialogTitle.value = '新增规则'
  Object.assign(form, { id: null, name: '', type: '学习', score: 0, description: '', enabled: true })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑规则'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

function handleToggle(row) {
  ElMessage.success(row.enabled ? '已启用' : '已禁用')
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除规则 "${row.name}" 吗？`, '提示', {
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
.score-rule-container {
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
