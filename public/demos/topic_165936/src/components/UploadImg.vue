<template>
  <div class="upload-img-container">
    <el-upload
      class="avatar-uploader"
      :action="uploadUrl"
      :show-file-list="false"
      :headers="uploadHeaders"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      accept="image/*"
    >
      <img v-if="imageUrl" :src="imageUrl" class="avatar" />
      <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
    </el-upload>
    <div v-if="tip" class="upload-tip">{{ tip }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  uploadUrl: {
    type: String,
    default: '/api/upload/image'
  },
  tip: {
    type: String,
    default: ''
  },
  maxSize: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'error'])

const imageUrl = ref('')

watch(
  () => props.modelValue,
  (val) => {
    imageUrl.value = val
  },
  { immediate: true }
)

const uploadHeaders = {
  Authorization: `Bearer ${getToken()}`
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLtMax = file.size / 1024 / 1024 < props.maxSize

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLtMax) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB!`)
    return false
  }
  return true
}

function handleSuccess(response) {
  if (response.code === 200 || response.code === 0) {
    imageUrl.value = response.data.url
    emit('update:modelValue', response.data.url)
    emit('success', response.data)
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
    emit('error', response)
  }
}

function handleError(err) {
  console.error('Upload error:', err)
  ElMessage.error('上传失败')
  emit('error', err)
}
</script>

<style scoped lang="scss">
.upload-img-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;

    &:hover {
      border-color: #409EFF;
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  object-fit: cover;
  display: block;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
