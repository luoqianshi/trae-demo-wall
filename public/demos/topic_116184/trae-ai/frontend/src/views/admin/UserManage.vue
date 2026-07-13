<template>
  <div class="user-manage">
    <div class="page-header"><h2>👤 用户管理</h2></div>
    <el-card>
      <div style="margin-bottom: 15px">
        <el-input v-model="keyword" placeholder="搜索手机号/姓名" style="width: 250px" clearable @clear="loadUsers" @keyup.enter="loadUsers" />
        <el-button type="primary" style="margin-left: 10px" @click="loadUsers">搜索</el-button>
      </div>
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80" />
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" :type="row.status === 1 ? 'danger' : 'success'" @click="handleToggle(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" :page-size="size" :total="total" layout="total, prev, pager, next" @current-change="loadUsers" style="margin-top: 15px; justify-content: flex-end;" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, toggleUserStatus, type UserAdminVO } from '@/api/admin'
import logger from '@/utils/logger'

const loading = ref(false)
const users = ref<UserAdminVO[]>([])
const keyword = ref('')
const page = ref(1)
const size = ref(10)
const total = ref(0)

const loadUsers = async () => {
  loading.value = true
  try {
    const data = await getUsers(page.value, size.value, keyword.value || undefined)
    users.value = data.records
    total.value = data.total
  } catch (e) {
    logger.error('加载用户列表失败', e)
  } finally {
    loading.value = false
  }
}

const handleToggle = async (row: UserAdminVO) => {
  try {
    await ElMessageBox.confirm(`确认${row.status === 1 ? '禁用' : '启用'}用户「${row.name}」？`, '提示', { type: 'warning' })
    await toggleUserStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success('操作成功')
    await loadUsers()
  } catch (e) {
    if (e !== 'cancel') { logger.error('操作失败', e) }
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.user-manage { padding: 20px; }
.page-header { margin-bottom: 20px; }
</style>
