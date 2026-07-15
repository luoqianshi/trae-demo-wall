<template>
  <div class="excel-import-container">
    <el-upload
      :action="importUrl"
      :headers="uploadHeaders"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      accept=".xls,.xlsx"
    >
      <el-button type="primary" :icon="Upload" :loading="loading">
        {{ buttonText }}
      </el-button>
    </el-upload>
    <div v-if="showTemplate" class="template-link">
      <el-link type="primary" @click="handleDownloadTemplate">
        <el-icon><Download /></el-icon>
        下载模板
      </el-link>
    </div>

    <el-dialog v-model="resultDialogVisible" title="导入结果" width="500px">
      <el-result
        :icon="importResult.success > 0 ? 'success' : 'warning'"
        :title="importResult.success > 0 ? '导入完成' : '导入失败'"
        :sub-title="`成功 ${importResult.success} 条，失败 ${importResult.fail} 条`"
      >
        <template v-if="importResult.errors && importResult.errors.length > 0" #extra>
          <div class="error-list">
            <div class="error-title">错误详情：</div>
            <el-scrollbar height="200px">
              <div v-for="(error, index) in importResult.errors" :key="index" class="error-item">
                第 {{ error.row }} 行：{{ error.message }}
              </div>
            </el-scrollbar>
          </div>
        </template>
      </el-result>
      <template #footer>
        <el-button type="primary" @click="resultDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Download } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'

const props = defineProps({
  importUrl: {
    type: String,
    default: '/api/import/excel'
  },
  templateUrl: {
    type: String,
    default: '/api/import/template'
  },
  buttonText: {
    type: String,
    default: 'Excel导入'
  },
  showTemplate: {
    type: Boolean,
    default: true
  },
  maxSize: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['success', 'error'])

const loading = ref(false)
const resultDialogVisible = ref(false)
const importResult = ref({
  success: 0,
  fail: 0,
  errors: []
})

const uploadHeaders = {
  Authorization: `Bearer ${getToken()}`
}

function beforeUpload(file) {
  const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx')
  const isLtMax = file.size / 1024 / 1024 < props.maxSize

  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件!')
    return false
  }
  if (!isLtMax) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB!`)
    return false
  }
  loading.value = true
  return true
}

function handleSuccess(response) {
  loading.value = false
  if (response.code === 200 || response.code === 0) {
    importResult.value = response.data
    resultDialogVisible.value = true
    emit('success', response.data)
  } else {
    ElMessage.error(response.message || '导入失败')
    emit('error', response)
  }
}

function handleError(err) {
  loading.value = false
  console.error('Import error:', err)
  ElMessage.error('导入失败')
  emit('error', err)
}

function handleDownloadTemplate() {
  window.open(props.templateUrl, '_blank')
}
</script>

<style scoped lang="scss">
.excel-import-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.template-link {
  font-size: 12px;
}

.error-list {
  text-align: left;
  padding: 0 20px;
}

.error-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #f56c6c;
}

.error-item {
  padding: 5px 0;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}
</style>
