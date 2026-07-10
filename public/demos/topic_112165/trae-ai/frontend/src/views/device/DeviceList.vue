<template>
  <div class="device-page">
    <div class="page-card">
      <div class="page-header">
        <h2 class="page-title">设备管理</h2>
        <el-button type="primary" @click="openBindDialog">绑定设备</el-button>
      </div>

      <el-table v-loading="loading" :data="devices" stripe>
        <el-table-column label="设备类型" prop="deviceType" min-width="120" />
        <el-table-column label="型号" prop="model" min-width="120" />
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">
              {{ row.status === 'ACTIVE' ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.boundAt) }}
          </template>
        </el-table-column>
        <el-table-column label="最近同步" min-width="160">
          <template #default="{ row }">
            {{ row.lastSyncAt ? formatTime(row.lastSyncAt) : '尚未同步' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleUnbind(row)">
              解绑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && devices.length === 0" class="empty-tip">暂无绑定设备</div>
    </div>

    <!-- 绑定设备弹窗 -->
    <el-dialog v-model="bindVisible" title="绑定设备" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="form.deviceType" placeholder="请选择设备类型" class="full-width">
            <el-option label="血压计" value="血压计" />
            <el-option label="血糖仪" value="血糖仪" />
            <el-option label="血氧仪" value="血氧仪" />
            <el-option label="体温计" value="体温计" />
            <el-option label="体脂秤" value="体脂秤" />
            <el-option label="智能手表" value="智能手表" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备型号" prop="model">
          <el-input v-model="form.model" placeholder="请输入设备型号" />
        </el-form-item>
        <el-form-item label="设备Token" prop="token">
          <el-input
            v-model="form.token"
            type="textarea"
            :rows="2"
            placeholder="设备鉴权Token（由设备厂商提供）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" :loading="binding" @click="handleBind">确认绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getMyDevices, bindDevice, unbindDevice, type DeviceVO } from '@/api/device'
import logger from '@/utils/logger'

const loading = ref(false)
const binding = ref(false)
const devices = ref<DeviceVO[]>([])

const formRef = ref<FormInstance>()
const bindVisible = ref(false)

const form = reactive({
  deviceType: '',
  model: '',
  token: ''
})

const rules: FormRules = {
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  token: [{ required: true, message: '请输入设备Token', trigger: 'blur' }]
}

// 格式化时间
const formatTime = (iso: string): string => {
  if (!iso) {
    return '-'
  }
  return iso.replace('T', ' ').substring(0, 16)
}

// 加载设备列表
const loadDevices = async (): Promise<void> => {
  loading.value = true
  try {
    devices.value = await getMyDevices()
  } catch (e) {
    logger.error('加载设备列表失败', e)
  } finally {
    loading.value = false
  }
}

// 打开绑定弹窗
const openBindDialog = (): void => {
  form.deviceType = ''
  form.model = ''
  form.token = ''
  bindVisible.value = true
}

// 确认绑定
const handleBind = async (): Promise<void> => {
  if (!formRef.value) {
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  binding.value = true
  try {
    await bindDevice({
      deviceType: form.deviceType,
      model: form.model || undefined,
      token: form.token
    })
    ElMessage.success('设备绑定成功')
    bindVisible.value = false
    await loadDevices()
  } catch (e) {
    logger.error('绑定设备失败', e)
  } finally {
    binding.value = false
  }
}

// 解绑设备
const handleUnbind = async (device: DeviceVO): Promise<void> => {
  try {
    await ElMessageBox.confirm(`确认解绑设备「${device.deviceType}」吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    await unbindDevice(device.id)
    ElMessage.success('设备已解绑')
    await loadDevices()
  } catch (e) {
    logger.error('解绑设备失败', e)
  }
}

onMounted(() => {
  loadDevices()
})
</script>

<style scoped lang="scss">
.device-page {
  max-width: 1100px;
  padding: 24px 32px 48px;
  margin: 0 auto;
}

.page-card {
  padding: 24px 28px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.full-width {
  width: 100%;
}

.empty-tip {
  padding: 32px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style>
