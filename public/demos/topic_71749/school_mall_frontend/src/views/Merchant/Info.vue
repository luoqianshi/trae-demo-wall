<template>
  <div class="merchant-info">
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>商户基本信息</span>
          <el-button type="primary" link @click="isEditing = !isEditing">
            {{ isEditing ? '取消编辑' : '编辑资料' }}
          </el-button>
        </div>
      </template>

      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="120px"
        :disabled="!isEditing"
      >
        <el-form-item label="商户Logo">
          <el-upload
            class="logo-uploader"
            action="/api/common/upload/"
            :show-file-list="false"
            :on-success="handleLogoSuccess"
            :before-upload="beforeLogoUpload"
            :headers="uploadHeaders"
            :disabled="!isEditing"
          >
            <img v-if="form.merchant_logo" :src="form.merchant_logo" class="logo-preview" />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="商户名称" prop="merchant_name">
          <el-input v-model="form.merchant_name" />
        </el-form-item>

        <el-form-item label="联系人姓名" prop="contact_name">
          <el-input v-model="form.contact_name" />
        </el-form-item>

        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="form.contact_phone" />
        </el-form-item>

        <el-form-item label="经营地址" prop="merchant_address">
          <el-input v-model="form.merchant_address" />
        </el-form-item>

        <el-form-item label="商户描述" prop="merchant_desc">
          <el-input type="textarea" v-model="form.merchant_desc" :rows="4" />
        </el-form-item>

        <el-form-item label="审核状态">
          <el-tag :type="getStatusType(form.status)">
            {{ getStatusText(form.status) }}
          </el-tag>
        </el-form-item>

        <el-form-item v-if="isEditing">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存修改</el-button>
          <el-button @click="isEditing = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const isEditing = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  merchant_name: '',
  merchant_logo: '',
  contact_name: '',
  contact_phone: '',
  merchant_address: '',
  merchant_desc: '',
  status: 0
})

const rules = {
  merchant_name: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
  contact_name: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  merchant_address: [{ required: true, message: '请输入经营地址', trigger: 'blur' }]
}

const uploadHeaders = ref({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
})

const fetchInfo = async () => {
  try {
    const response = await axios.get('/api/merchant/info/')
    if (response.data.code === 200) {
      Object.assign(form, response.data.data)
    }
  } catch (error) {
    console.error('获取信息失败:', error)
  }
}

const handleLogoSuccess = (response) => {
  if (response.code === 200) {
    form.merchant_logo = response.data.url
    ElMessage.success('Logo上传成功')
  }
}

const beforeLogoUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  return isJPGorPNG && isLt2M
}

const getStatusType = (status) => {
  const types = { 0: 'info', 1: 'success', 2: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { 0: '审核中', 1: '已入驻', 2: '已拒绝' }
  return texts[status] || '未知'
}

const handleSubmit = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const response = await axios.put('/api/merchant/info/', form)
        if (response.data.code === 200) {
          ElMessage.success('修改成功')
          isEditing.value = false
          fetchInfo()
        }
      } catch (error) {
        ElMessage.error('修改失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(fetchInfo)
</script>

<style scoped>
.merchant-info {
  padding: 10px;
}

.info-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}
</style>
