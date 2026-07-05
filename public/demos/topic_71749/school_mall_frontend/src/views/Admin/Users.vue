<template>
  <div class="admin-users">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="用户名/邮箱">
          <el-input v-model="filters.keyword" placeholder="搜索用户名或邮箱" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="选择角色" clearable @change="handleSearch">
            <el-option label="学生" value="student" />
            <el-option label="商家" value="merchant" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt-20">
      <el-table :data="users" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" min-width="150" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="scope">
            <el-tag :type="getRoleTag(scope.row.role)">{{ getRoleText(scope.row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120">
          <template #default="scope">
            <span class="balance-text">¥{{ scope.row.balance.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
              {{ scope.row.is_active ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date_joined" label="注册时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="!scope.row.is_staff"
              :type="scope.row.is_active ? 'danger' : 'success'" 
              link 
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              v-if="!scope.row.is_staff"
              type="primary" 
              link 
              @click="openBalanceDialog(scope.row)"
            >
              余额管理
            </el-button>
            <span v-else class="tip-text">不可操作</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 余额管理弹窗 -->
    <el-dialog
      v-model="balanceDialogVisible"
      title="余额管理"
      width="500px"
    >
      <div v-if="selectedUser" class="balance-info">
        <p><strong>用户：</strong>{{ selectedUser.username }}</p>
        <p><strong>当前余额：</strong><span class="current-balance">¥{{ selectedUser.balance.toFixed(2) }}</span></p>
      </div>
      <el-form :model="balanceForm" label-width="100px" class="mt-20">
        <el-form-item label="操作类型">
          <el-radio-group v-model="balanceForm.action">
            <el-radio label="add">充值（增加）</el-radio>
            <el-radio label="subtract">扣减</el-radio>
            <el-radio label="set">设置为</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number 
            v-model="balanceForm.amount" 
            :min="0" 
            :precision="2" 
            :step="10"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="balanceForm.reason" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入操作备注（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="balanceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBalanceUpdate" :loading="balanceLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const users = ref([])
const loading = ref(false)
const balanceLoading = ref(false)
const balanceDialogVisible = ref(false)
const selectedUser = ref(null)

const filters = reactive({
  keyword: '',
  role: ''
})

const balanceForm = reactive({
  action: 'add',
  amount: 0,
  reason: ''
})

const getRoleText = (role) => {
  const roles = {
    'student': '学生',
    'merchant': '商家',
    'admin': '管理员'
  }
  return roles[role] || role
}

const getRoleTag = (role) => {
  const tags = {
    'student': 'info',
    'merchant': 'success',
    'admin': 'danger'
  }
  return tags[role] || ''
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/management/users/', {
      params: filters,
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      users.value = response.data.data
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchUsers()
}

const toggleStatus = (user) => {
  const action = user.is_active ? '禁用' : '启用'
  ElMessageBox.confirm(`确定要${action}用户 "${user.username}" 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/management/users/', {
        user_id: user.id,
        is_active: !user.is_active
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        ElMessage.success(`${action}成功`)
        fetchUsers()
      } else {
        ElMessage.error(response.data.message)
      }
    } catch (error) {
      ElMessage.error('操作失败')
    }
  })
}

// 打开余额管理弹窗
const openBalanceDialog = (user) => {
  selectedUser.value = user
  balanceForm.action = 'add'
  balanceForm.amount = 0
  balanceForm.reason = ''
  balanceDialogVisible.value = true
}

// 处理余额更新
const handleBalanceUpdate = async () => {
  if (!selectedUser.value) return
  
  if (balanceForm.amount <= 0) {
    ElMessage.warning('金额必须大于0')
    return
  }

  const actionText = {
    'add': '充值',
    'subtract': '扣减',
    'set': '设置'
  }[balanceForm.action]

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}用户 "${selectedUser.value.username}" 的余额 ¥${balanceForm.amount} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  balanceLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      `/api/management/users/${selectedUser.value.id}/balance/`,
      {
        action: balanceForm.action,
        amount: balanceForm.amount,
        reason: balanceForm.reason
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    if (response.data.code === 200) {
      ElMessage.success('余额修改成功')
      balanceDialogVisible.value = false
      fetchUsers() // 刷新列表
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    console.error('余额修改失败:', error)
    ElMessage.error(error.response?.data?.message || '余额修改失败')
  } finally {
    balanceLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.mt-20 { margin-top: 20px; }
.filter-card { margin-bottom: 0; }
.tip-text { font-size: 12px; color: #909399; }

.balance-text {
  color: #67c23a;
  font-weight: bold;
}

.balance-info {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.balance-info p {
  margin: 10px 0;
}

.current-balance {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}
</style>
