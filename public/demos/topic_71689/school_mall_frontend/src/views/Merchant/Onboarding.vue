<template>
  <div class="onboarding-container">
    <div class="header">
      <h2>商家入驻申请</h2>
      <p>欢迎加入校园商城，开启您的创业之旅</p>
    </div>

    <el-steps :active="activeStep" finish-status="success" align-center class="steps">
      <el-step title="基本信息" />
      <el-step title="详细描述" />
      <el-step title="提交申请" />
    </el-steps>

    <div class="form-content" v-loading="loading">
      <!-- 审核状态提示 -->
      <div v-if="merchantInfo && merchantInfo.status !== undefined" class="status-notice">
        <el-result
          :icon="getStatusIcon(merchantInfo.status)"
          :title="getStatusTitle(merchantInfo.status)"
          :sub-title="getStatusMessage(merchantInfo.status)"
        >
          <template #extra>
            <el-button v-if="merchantInfo.status === 2" type="warning" @click="resetForm">重新填写</el-button>
            <el-button v-if="merchantInfo.status === 1" type="success" @click="router.push('/merchant/dashboard')">前往控制台</el-button>
          </template>
        </el-result>
      </div>

      <!-- 填写表单 -->
      <el-form 
        v-else-if="activeStep === 0"
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="店铺Logo" prop="merchant_logo">
          <el-upload
            class="logo-uploader"
            action="/api/common/upload/"
            :show-file-list="false"
            :on-success="handleLogoSuccess"
            :before-upload="beforeLogoUpload"
            :headers="uploadHeaders"
          >
            <img v-if="form.merchant_logo" :src="form.merchant_logo" class="logo-preview" />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸 200x200，支持 jpg、png 格式</div>
        </el-form-item>
        <el-form-item label="商户名称" prop="merchant_name">
          <el-input v-model="form.merchant_name" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="联系人姓名" prop="contact_name">
          <el-input v-model="form.contact_name" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="经营地址" prop="merchant_address">
          <el-input v-model="form.merchant_address" placeholder="请输入校园内详细经营地址" />
        </el-form-item>
        <div class="actions">
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </el-form>

      <el-form 
        ref="descFormRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        v-if="activeStep === 1"
      >
        <el-form-item label="商户描述" prop="merchant_desc">
          <el-input 
            v-model="form.merchant_desc" 
            type="textarea" 
            placeholder="请介绍您的主营业务、特色服务等信息"
            :rows="6"
          />
        </el-form-item>
        <div class="actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </el-form>

      <div v-if="activeStep === 2" class="submit-confirm">
        <el-result
          icon="success"
          title="信息已填写完整"
          sub-title="请确认以上信息无误后点击提交，管理员将在1-3个工作日内完成审核"
        >
          <template #extra>
            <div class="actions">
              <el-button @click="prevStep">上一步</el-button>
              <el-button type="success" :loading="submitting" @click="handleSubmit">立即提交申请</el-button>
            </div>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const activeStep = ref(0)
const merchantInfo = ref(null)
const formRef = ref(null)
const descFormRef = ref(null)

const uploadHeaders = ref({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
})

const fetchMerchantStatus = async () => {
  try {
    const response = await axios.get('/api/merchant/info/')
    if (response.data.code === 200) {
      merchantInfo.value = response.data.data
      // 如果已经认证成功，跳转到控制台
      if (merchantInfo.value.status === 1) {
        ElMessage.success('您已入驻成功')
        router.push('/merchant/dashboard')
      }
    } else if (response.data.code === 404) {
      merchantInfo.value = null
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('获取商户状态失败:', error)
    }
  } finally {
    loading.value = false
  }
}

const getStatusIcon = (status) => {
  const icons = { 0: 'info', 1: 'success', 2: 'error' }
  return icons[status] || 'info'
}

const getStatusTitle = (status) => {
  const titles = { 0: '审核中', 1: '入驻成功', 2: '申请被拒绝' }
  return titles[status] || '未知状态'
}

const getStatusMessage = (status) => {
  const messages = {
    0: '您的入驻申请正在审核中，请耐心等待 1-3 个工作日',
    1: '恭喜您已成功入驻，现在可以去发布商品了',
    2: '很抱歉，您的入驻申请未通过审核。您可以查看原因并修改后重新提交'
  }
  return messages[status] || ''
}

const resetForm = () => {
  merchantInfo.value = null
  activeStep.value = 0
}

onMounted(() => {
  fetchMerchantStatus()
})

const form = reactive({
  merchant_name: '',
  merchant_logo: '',
  contact_name: '',
  contact_phone: '',
  merchant_address: '',
  merchant_desc: ''
})

const rules = {
  merchant_name: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
  contact_name: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  merchant_address: [{ required: true, message: '请输入经营地址', trigger: 'blur' }],
  merchant_desc: [{ required: true, message: '请输入商户描述', trigger: 'blur' }]
}

const handleLogoSuccess = (response) => {
  if (response.code === 200) {
    form.merchant_logo = response.data.url
    ElMessage.success('Logo上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const beforeLogoUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isJPGorPNG) ElMessage.error('上传图片只能是 JPG 或 PNG 格式!')
  if (!isLt2M) ElMessage.error('上传图片大小不能超过 2MB!')
  return isJPGorPNG && isLt2M
}

const nextStep = () => {
  if (activeStep.value === 0) {
    formRef.value.validate((valid) => {
      if (valid) activeStep.value++
    })
  } else if (activeStep.value === 1) {
    descFormRef.value.validate((valid) => {
      if (valid) activeStep.value++
    })
  } else {
    activeStep.value++
  }
}

const prevStep = () => activeStep.value--

const handleSubmit = async () => {
  submitting.value = true
  try {
    const response = await axios.post('/api/merchant/info/', form)
    if (response.data.code === 200 || response.data.code === 201) {
      ElMessage.success('申请提交成功，请等待管理员审核')
      fetchMerchantStatus()
    }
  } catch (error) {
    console.error('申请失败:', error)
    ElMessage.error(error.response?.data?.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.onboarding-container {
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.header p {
  color: #909399;
}

.steps {
  margin-bottom: 40px;
}

.form-content {
  max-width: 600px;
  margin: 0 auto;
}

.logo-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
}

.logo-uploader:hover {
  border-color: #409eff;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.logo-preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}
</style>
