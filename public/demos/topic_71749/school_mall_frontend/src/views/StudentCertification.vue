<template>
  <div class="certification-page">
    <Header />
    <div class="container">
      <el-card class="certification-card">
        <div class="header">
          <h2>学生身份认证</h2>
          <p>认证后可享受学生专属优惠及更多功能</p>
        </div>

        <div class="info-alert">
          <el-alert
            title="认证说明"
            type="info"
            description="请确保填写的学校信息与学生证一致，审核通常在 1-2 个工作日内完成。"
            show-icon
            :closable="false"
          />
        </div>

        <div v-if="isCertified" class="certified-status">
          <el-result
            icon="success"
            title="您已完成学生认证"
            sub-title="现在您可以享受学生专属优惠，尽情购物吧！"
          >
            <template #extra>
              <el-button type="primary" @click="router.push('/')">回到首页</el-button>
            </template>
          </el-result>
        </div>

        <el-form 
          v-else
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="certification-form"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="真实姓名" prop="student_name">
                <el-input v-model="form.student_name" placeholder="请输入真实姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学号" prop="student_no">
                <el-input v-model="form.student_no" placeholder="请输入您的学号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="就读学校" prop="school_name">
            <el-input v-model="form.school_name" placeholder="请输入学校名称" />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="院系" prop="department">
                <el-input v-model="form.department" placeholder="如：计算机学院" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="年级" prop="grade">
                <el-input v-model="form.grade" placeholder="如：2021级" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="班级" prop="class_field">
                <el-input v-model="form.class_field" placeholder="如：1班" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入联系电话" />
          </el-form-item>

          <el-form-item label="学生证照片" prop="student_card_image">
            <el-upload
              class="avatar-uploader"
              action="/api/common/upload/"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload"
              :headers="uploadHeaders"
            >
              <img v-if="form.student_card_image" :src="form.student_card_image" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">请上传学生证正面照片，确保文字清晰可见</div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="handleSubmit" class="submit-btn">
              提交认证申请
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'
import axios from 'axios'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const isCertified = ref(false)

const checkCertificationStatus = async () => {
  try {
    const response = await axios.get('/api/user/info/')
    if (response.data.code === 200) {
      const user = response.data.data
      // 判断条件：学生用户 (user_type === 1) 且 已实名 (is_real_name === 1)
      if (user.user_type === 1 && user.is_real_name === 1) {
        isCertified.value = true
      }
    }
  } catch (error) {
    console.error('获取认证状态失败:', error)
  }
}

onMounted(() => {
  checkCertificationStatus()
})

const uploadHeaders = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}

const form = reactive({
  student_name: '',
  student_no: '',
  school_name: '',
  department: '',
  grade: '',
  class_field: '',
  phone: '',
  student_card_image: ''
})

const rules = {
  student_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  student_no: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  school_name: [{ required: true, message: '请输入学校名称', trigger: 'blur' }],
  department: [{ required: true, message: '请输入院系', trigger: 'blur' }],
  grade: [{ required: true, message: '请输入年级', trigger: 'blur' }],
  class_field: [{ required: true, message: '请输入班级', trigger: 'blur' }],
  student_card_image: [{ required: true, message: '请上传学生证照片', trigger: 'change' }]
}

const handleUploadSuccess = (response) => {
  form.student_card_image = response.data.url
  ElMessage.success('照片上传成功')
}

const beforeUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPGorPNG) {
    ElMessage.error('上传图片只能是 JPG 或 PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }
  return isJPGorPNG && isLt2M
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const response = await axios.post('/api/student/info/certify/', form)
        if (response.data.code === 200 || response.data.code === 201) {
          ElMessage.success('认证申请已提交')
          router.push('/')
        }
      } catch (error) {
        console.error('认证失败:', error)
        ElMessage.error(error.response?.data?.message || '提交失败，请重试')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped>
.certification-page {
  min-height: 100vh;
  background-color: #fff7ed;
}

.container {
  max-width: 700px;
  margin: 40px auto;
}

.certification-card {
  padding: 30px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.header p {
  color: #909399;
}

.info-alert {
  margin-bottom: 30px;
}

.certification-form {
  max-width: 500px;
  margin: 0 auto;
}

.certified-status {
  padding: 40px 0;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
}

.avatar-uploader:hover {
  border-color: #ea580c;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.4;
}

.submit-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
  margin-top: 20px;
}
</style>
