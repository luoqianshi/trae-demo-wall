<template>
  <div class="stores">
    <div class="page-header">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">门店管理</h2>
        <p class="text-gray-500">管理您的门店信息和门店</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">
        <i class="fas fa-plus"></i> 添加门店
      </el-button>
    </div>

    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon bg-blue-100">
          <i class="fas fa-store text-blue-600"></i>
        </div>
        <div class="stat-info">
          <p class="text-gray-500 text-sm">门店总数</p>
          <p class="text-2xl font-bold text-gray-800">{{ stores.length }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-green-100">
          <i class="fas fa-clock text-green-600"></i>
        </div>
        <div class="stat-info">
          <p class="text-gray-500 text-sm">营业中</p>
          <p class="text-2xl font-bold text-green-600">{{ operatingStores }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-orange-100">
          <i class="fas fa-pause text-orange-600"></i>
        </div>
        <div class="stat-info">
          <p class="text-gray-500 text-sm">休息中</p>
          <p class="text-2xl font-bold text-orange-600">{{ closedStores }}</p>
        </div>
      </div>
    </div>

    <div class="table-card">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">门店列表</h3>
      <div class="table-wrapper">
        <el-table :data="stores" border class="store-table">
          <el-table-column prop="name" label="门店名称" />
          <el-table-column prop="address" label="地址" />
          <el-table-column prop="phone" label="电话" />
          <el-table-column prop="business_hours" label="营业时间" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
                {{ scope.row.status === 1 ? '营业中' : '休息中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间">
            <template #default="scope">
              {{ new Date(scope.row.created_at).toLocaleDateString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button link type="primary" @click="editStore(scope.row)">编辑</el-button>
              <el-button link type="danger" @click="deleteStore(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog :title="isEditing ? '编辑门店' : '添加门店'" v-model="dialogVisible" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入门店名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入门店地址" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="营业时间">
          <el-input v-model="form.business_hours" placeholder="如：10:00-22:00" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStore">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { merchantApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const stores = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const editingId = ref(null)

const form = reactive({
  name: '',
  address: '',
  phone: '',
  business_hours: ''
})

const rules = {
  name: [
    { required: true, message: '请输入门店名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度在2-100之间', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入门店地址', trigger: 'blur' }
  ]
}

const operatingStores = computed(() => stores.value.filter(s => s.status === 1).length)
const closedStores = computed(() => stores.value.filter(s => s.status === 0).length)

async function fetchStores() {
  try {
    stores.value = await merchantApi.getStores({ silentError: true })
  } catch (error) {
    console.error('Failed to load stores:', error)
    ElMessage.error('门店列表加载失败，请稍后重试')
  }
}

function openCreateDialog() {
  isEditing.value = false
  editingId.value = null
  form.name = ''
  form.address = ''
  form.phone = ''
  form.business_hours = ''
  dialogVisible.value = true
}

function editStore(row) {
  isEditing.value = true
  editingId.value = row.id
  form.name = row.name
  form.address = row.address
  form.phone = row.phone
  form.business_hours = row.business_hours
  dialogVisible.value = true
}

async function saveStore() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEditing.value) {
          await merchantApi.updateStore(editingId.value, form, { silentError: true })
          ElMessage.success('更新成功')
        } else {
          await merchantApi.createStore(form, { silentError: true })
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        await fetchStores()
      } catch (error) {
        console.error('Failed to save store:', error)
        ElMessage.error('操作失败')
      }
    }
  })
}

async function deleteStore(row) {
  try {
    await ElMessageBox.confirm('确定删除该门店？', '提示', {
      type: 'warning'
    })
    await merchantApi.deleteStore(row.id, { silentError: true })
    ElMessage.success('删除成功')
    await fetchStores()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    console.error('Failed to delete store:', error)
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchStores()
})
</script>

<style scoped>
.stores {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
}

.page-header p {
  margin: 4px 0 0 0;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon i {
  font-size: 24px;
}

.stat-info p {
  margin: 0;
}

.table-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.table-wrapper {
  overflow-x: auto;
}

.store-table {
  width: 100%;
}

.store-table :deep(.el-table__row:hover) {
  background-color: #f9fafb;
}
</style>
