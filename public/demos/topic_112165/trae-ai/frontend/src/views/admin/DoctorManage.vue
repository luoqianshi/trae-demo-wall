<template>
  <div class="doctor-manage">
    <div class="page-header"><h2>👨‍⚕️ 医生管理</h2></div>
    <el-card>
      <el-table :data="doctors" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="title" label="职称" width="100" />
        <el-table-column prop="department" label="科室" width="100" />
        <el-table-column prop="specialties" label="擅长领域" show-overflow-tooltip />
        <el-table-column prop="rating" label="评分" width="80" />
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="auditTagType(row.auditStatus)">{{ auditText(row.auditStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <template v-if="row.auditStatus === 'PENDING'">
              <el-button size="small" type="success" @click="handleAudit(row, 'APPROVED')">通过</el-button>
              <el-button size="small" type="danger" @click="handleAudit(row, 'REJECTED')">拒绝</el-button>
            </template>
            <span v-else style="color: #999">已处理</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDoctors, auditDoctor, type DoctorAdminVO } from '@/api/admin'
import logger from '@/utils/logger'

const loading = ref(false)
const doctors = ref<DoctorAdminVO[]>([])

const auditTagType = (status: string) => {
  if (status === 'APPROVED') { return 'success' }
  if (status === 'REJECTED') { return 'danger' }
  return 'warning'
}

const auditText = (status: string) => {
  if (status === 'APPROVED') { return '已通过' }
  if (status === 'REJECTED') { return '已拒绝' }
  return '待审核'
}

const loadDoctors = async () => {
  loading.value = true
  try {
    doctors.value = await getDoctors()
  } catch (e) {
    logger.error('加载医生列表失败', e)
  } finally {
    loading.value = false
  }
}

const handleAudit = async (row: DoctorAdminVO, status: string) => {
  try {
    await auditDoctor(row.id, status)
    ElMessage.success(status === 'APPROVED' ? '已通过审核' : '已拒绝')
    await loadDoctors()
  } catch (e) {
    logger.error('审核操作失败', e)
  }
}

onMounted(loadDoctors)
</script>

<style scoped>
.doctor-manage { padding: 20px; }
.page-header { margin-bottom: 20px; }
</style>
