<template>
  <div class="role-manage-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
        </div>
      </template>

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-permission="'role:add'" @click="handleAdd">新增角色</el-button>
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
          <el-button type="primary" link v-permission="'role:edit'" @click="handleEdit(row)">编辑</el-button>
          <el-button type="warning" link v-permission="'role:permission'" @click="handlePermission(row)">权限分配</el-button>
          <el-button type="danger" link v-permission="'role:delete'" @click="handleDelete(row)">删除</el-button>
        </template>
      </PageTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入角色编码" />
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

    <el-dialog v-model="permDialogVisible" title="权限分配" width="600px">
      <el-tree
        ref="treeRef"
        :data="permissionTree"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedPermIds"
        :props="{ label: 'name', children: 'children' }"
      />
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="permLoading" @click="handlePermSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import PageTable from '@/components/PageTable.vue'

const loading = ref(false)
const submitLoading = ref(false)
const permLoading = ref(false)
const dialogVisible = ref(false)
const permDialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const treeRef = ref(null)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const permissionTree = ref([])
const checkedPermIds = ref([])
const currentRoleId = ref(null)

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'name', label: '角色名称', minWidth: 150 },
  { prop: 'code', label: '角色编码', minWidth: 150 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { slot: 'status', label: '状态', width: 80 },
  { prop: 'createTime', label: '创建时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 220, fixed: 'right' }
]

const form = reactive({
  id: null,
  name: '',
  code: '',
  description: '',
  enabled: true
})

const formRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}

async function getList() {
  loading.value = true
  try {
    tableData.value = [
      { id: 1, name: '系统管理员', code: 'admin', description: '拥有系统全部权限', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 2, name: '班主任', code: 'head_teacher', description: '班级管理权限', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 3, name: '班长', code: 'monitor', description: '学生干部权限', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 4, name: '纪检委员', code: 'discipline_committee', description: '操行分审核权限', enabled: true, createTime: '2024-01-01 00:00:00' },
      { id: 5, name: '普通学生', code: 'student', description: '基础权限', enabled: true, createTime: '2024-01-01 00:00:00' }
    ]
    total.value = 5
  } finally {
    loading.value = false
  }
}

function handlePageChange({ pageNum: pn, pageSize: ps }) {
  pageNum.value = pn
  pageSize.value = ps
  getList()
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  Object.assign(form, { id: null, name: '', code: '', description: '', enabled: true })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
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

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  })
}

function handlePermission(row) {
  currentRoleId.value = row.id
  checkedPermIds.value = [1, 2, 3, 4, 5]
  permissionTree.value = [
    {
      id: 1, name: '系统管理', children: [
        { id: 11, name: '用户管理', children: [
          { id: 111, name: '查看用户' },
          { id: 112, name: '新增用户' },
          { id: 113, name: '编辑用户' },
          { id: 114, name: '删除用户' }
        ]},
        { id: 12, name: '角色管理', children: [
          { id: 121, name: '查看角色' },
          { id: 122, name: '新增角色' },
          { id: 123, name: '编辑角色' },
          { id: 124, name: '删除角色' }
        ]}
      ]
    },
    {
      id: 2, name: '学生管理', children: [
        { id: 21, name: '学生列表' },
        { id: 22, name: '学生详情' },
        { id: 23, name: '新增学生' },
        { id: 24, name: '编辑学生' },
        { id: 25, name: '删除学生' }
      ]
    },
    {
      id: 3, name: '操行分管理', children: [
        { id: 31, name: '操行分记录' },
        { id: 32, name: '规则管理' },
        { id: 33, name: '操行分审核' }
      ]
    },
    {
      id: 4, name: '请假管理', children: [
        { id: 41, name: '请假列表' },
        { id: 42, name: '请假审批' }
      ]
    },
    {
      id: 5, name: '收手机管理', children: [
        { id: 51, name: '收手机总览' },
        { id: 52, name: '变动明细' }
      ]
    }
  ]
  permDialogVisible.value = true
}

async function handlePermSubmit() {
  permLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('权限分配成功')
    permDialogVisible.value = false
  } finally {
    permLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.role-manage-container {
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
