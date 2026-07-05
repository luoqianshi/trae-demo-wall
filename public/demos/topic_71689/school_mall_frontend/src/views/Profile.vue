<template>
  <div class="profile-page">
    <Header />
    <div class="container">
         <div class="profile-card" v-loading="loading">
        <el-tabs v-model="activeTab" class="profile-tabs">
          <el-tab-pane label="个人资料" name="info">
            <!-- 原有的资料展示部分 -->
            <div class="user-header">
              <div class="avatar-wrapper" @click="openAvatarDialog">
                <el-avatar :size="100" :src="profile.avatar || defaultAvatar" />
                <div class="avatar-hover">
                  <el-icon><Camera /></el-icon>
                  <span>修改头像</span>
                </div>
              </div>
              <div class="user-info-basic">
                <div class="username-row">
                  <h2>{{ profile.username }}</h2>
                  <el-button type="primary" link @click="openEditDialog">
                    <el-icon><Edit /></el-icon>修改资料
                  </el-button>
                </div>
                <div class="tags-row">
                  <el-tag :type="userTypeTag.type">{{ userTypeTag.label }}</el-tag>
                  <el-button type="warning" link @click="passwordDialogVisible = true">
                    <el-icon><Lock /></el-icon>修改密码
                  </el-button>
                  <el-button type="success" link @click="goToRecharge">
                    <el-icon><Wallet /></el-icon>余额充值
                  </el-button>
                  <el-button type="primary" link @click="contactAdminDialogVisible = true">
                    <el-icon><ChatDotRound /></el-icon>联系管理员
                  </el-button>
                </div>
              </div>
            </div>

            <el-divider content-position="left">详细信息</el-divider>

            <!-- 学生信息展示 -->
            <div v-if="profile.user_type === 1" class="info-section">
              <el-descriptions title="学生基本信息" :column="2" border>
                <el-descriptions-item label="真实姓名">{{ profile.student_info?.student_name || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="学号">{{ profile.student_info?.student_no || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="学校">{{ profile.student_info?.school_name || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="院系">{{ profile.student_info?.department || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="年级">{{ profile.student_info?.grade || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="班级">{{ profile.student_info?.class_field || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ profile.student_info?.phone || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="实名状态">
                  <el-tag :type="profile.is_real_name ? 'success' : 'info'">
                    {{ profile.is_real_name ? '已实名' : '未实名' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
              <div v-if="!profile.student_info" class="empty-tip">
                <p>暂无详细学生信息，请前往学生认证</p>
                <el-button type="primary" @click="$router.push('/student-certification')">前往认证</el-button>
              </div>
            </div>

            <!-- 商户信息展示 -->
            <div v-else-if="profile.user_type === 2" class="info-section">
              <el-descriptions title="商户基本信息" :column="2" border>
                <el-descriptions-item label="商户名称">{{ profile.merchant_info?.merchant_name || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系人">{{ profile.merchant_info?.contact_name || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ profile.merchant_info?.contact_phone || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="商户地址">{{ profile.merchant_info?.merchant_address || '未填写' }}</el-descriptions-item>
                <el-descriptions-item label="商户状态">
                  <el-tag :type="merchantStatusTag(profile.merchant_info?.status)">
                    {{ merchantStatusLabel(profile.merchant_info?.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDate(profile.merchant_info?.create_time) }}</el-descriptions-item>
              </el-descriptions>
              <div class="merchant-desc" v-if="profile.merchant_info?.merchant_desc">
                <h4>商户描述</h4>
                <p>{{ profile.merchant_info.merchant_desc }}</p>
              </div>
              <div v-if="!profile.merchant_info" class="empty-tip">
                <p>暂无商户信息，请前往商家入住</p>
                <el-button type="primary" @click="$router.push('/merchant-onboarding')">申请入住</el-button>
              </div>
            </div>

            <el-divider />
            
            <div class="account-stats">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="stat-item">
                    <span class="label">注册时间：</span>
                    <span class="value">{{ formatDate(profile.register_time) }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="stat-item">
                    <span class="label">最后登录：</span>
                    <span class="value">{{ formatDate(profile.last_login_time) }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 收货地址管理 -->
          <el-tab-pane label="收货地址" name="address">
            <div class="address-header">
              <h3>我的收货地址</h3>
              <el-button type="primary" @click="openAddressDialog()">
                <el-icon><Plus /></el-icon>添加新地址
              </el-button>
            </div>
            
            <div v-if="addresses.length > 0" class="address-grid">
              <div v-for="addr in addresses" :key="addr.id" class="address-card" :class="{ 'is-default': addr.is_default }">
                <div class="addr-tag" v-if="addr.is_default">默认</div>
                <div class="addr-main">
                  <div class="receiver-row">
                    <span class="name">{{ addr.receiver }}</span>
                    <span class="phone">{{ addr.phone }}</span>
                  </div>
                  <div class="detail-row">{{ addr.address }}</div>
                </div>
                <div class="addr-actions">
                  <el-button type="primary" link @click="openAddressDialog(addr)">编辑</el-button>
                  <el-button type="danger" link @click="handleDeleteAddress(addr.id)">删除</el-button>
                  <el-button v-if="!addr.is_default" type="success" link @click="handleSetDefaultAddress(addr.id)">设为默认</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无收货地址" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 修改资料弹窗 -->
    <el-dialog v-model="editDialogVisible" title="修改基本资料" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdateProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordDialogVisible" title="修改登录密码" width="400px">
      <el-form :model="passwordForm" label-width="80px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="原密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleChangePassword">提交修改</el-button>
      </template>
    </el-dialog>

    <!-- 头像上传弹窗 -->
    <el-dialog v-model="avatarDialogVisible" title="修改头像" width="400px" center>
      <div class="avatar-upload-container">
        <el-upload
          class="avatar-uploader"
          action="http://localhost:8000/api/common/upload/"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload"
          name="file"
        >
          <img v-if="tempAvatar" :src="tempAvatar" class="avatar-preview" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <p class="upload-tip">支持 jpg/png 格式，且不超过 2MB</p>
      </div>
      <template #footer>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveAvatar" :disabled="!tempAvatar">保存头像</el-button>
      </template>
    </el-dialog>

    <!-- 地址编辑弹窗 -->
    <el-dialog v-model="addressDialogVisible" :title="addressForm.id ? '编辑地址' : '新增地址'" width="500px">
      <el-form :model="addressForm" :rules="addressRules" ref="addressFormRef" label-width="100px">
        <el-form-item label="收货人" prop="receiver">
          <el-input v-model="addressForm.receiver" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入收货人手机号" />
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="addressForm.address" type="textarea" :rows="3" placeholder="请输入详细地址（如：XX宿舍X栋X室）" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="addressForm.is_default" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSaveAddress">确定</el-button>
      </template>
    </el-dialog>

    <!-- 联系管理员弹窗 -->
    <el-dialog v-model="contactAdminDialogVisible" title="联系管理员" width="500px">
      <el-form :model="contactAdminForm" :rules="contactAdminRules" ref="contactAdminFormRef" label-width="80px">
        <el-form-item label="主题" prop="subject">
          <el-input v-model="contactAdminForm.subject" placeholder="请输入联系主题（如：账户问题、订单问题等）" />
        </el-form-item>
        <el-form-item label="消息内容" prop="content">
          <el-input v-model="contactAdminForm.content" type="textarea" :rows="6" placeholder="请输入您想要联系管理员的内容..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contactAdminDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleContactAdmin">发送消息</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Header from '@/components/Header.vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Camera, Edit, Lock, Plus, Wallet, ChatDotRound } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const profile = ref({})
const activeTab = ref('info')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 地址管理相关
const addresses = ref([])
const addressDialogVisible = ref(false)
const addressFormRef = ref(null)
const addressForm = reactive({
  id: null,
  receiver: '',
  phone: '',
  address: '',
  is_default: 0
})

const addressRules = {
  receiver: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入收货人手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

// 修改资料相关
const editDialogVisible = ref(false)
const editForm = reactive({
  username: '',
  email: ''
})

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const passwordRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.new_password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 头像修改相关
const avatarDialogVisible = ref(false)
const tempAvatar = ref('')
const uploadUrl = ref('')

// 联系管理员相关
const contactAdminDialogVisible = ref(false)
const contactAdminFormRef = ref(null)
const contactAdminForm = reactive({
  subject: '',
  content: ''
})

const contactAdminRules = {
  subject: [{ required: true, message: '请输入联系主题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }]
}

const userTypeTag = computed(() => {
  const types = {
    1: { label: '学生', type: 'success' },
    2: { label: '商户', type: 'warning' },
    3: { label: '管理员', type: 'danger' }
  }
  return types[profile.value.user_type] || { label: '未知', type: 'info' }
})

const merchantStatusTag = (status) => {
  const tags = { 0: 'info', 1: 'success', 2: 'danger' }
  return tags[status] || 'info'
}

const merchantStatusLabel = (status) => {
  const labels = { 0: '待审核', 1: '审核通过', 2: '审核驳回' }
  return labels[status] || '未知'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '无'
  const date = new Date(dateStr)
  return date.toLocaleString()
}

const goToRecharge = () => {
  router.push('/recharge')
}

const fetchProfile = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return
  }

  try {
    const response = await axios.get('http://localhost:8000/api/user/info/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.data.code === 200) {
      profile.value = response.data.data
      editForm.username = profile.value.username
      editForm.email = profile.value.email
      // 获取地址列表
      fetchAddresses()
    } else {
      ElMessage.error(response.data.message || '获取用户信息失败')
    }
  } catch (error) {
    handleApiError(error)
  } finally {
    loading.value = false
  }
}

// 地址管理逻辑
const fetchAddresses = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await axios.get('http://localhost:8000/api/student/address/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.data.code === 200) {
      addresses.value = res.data.data
    }
  } catch (error) {
    console.error('获取地址失败:', error)
  }
}

const openAddressDialog = (addr = null) => {
  if (addr) {
    addressForm.id = addr.id
    addressForm.receiver = addr.receiver
    addressForm.phone = addr.phone
    addressForm.address = addr.address
    addressForm.is_default = addr.is_default
  } else {
    addressForm.id = null
    addressForm.receiver = ''
    addressForm.phone = ''
    addressForm.address = ''
    addressForm.is_default = addresses.value.length === 0 ? 1 : 0
  }
  addressDialogVisible.value = true
}

const handleSaveAddress = async () => {
  if (!addressFormRef.value) return
  
  await addressFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      const token = localStorage.getItem('token')
      try {
        let res
        if (addressForm.id) {
          res = await axios.put(`http://localhost:8000/api/student/address/detail/`, addressForm, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { id: addressForm.id }
          })
        } else {
          res = await axios.post('http://localhost:8000/api/student/address/', addressForm, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        }

        if (res.data.code === 200 || res.data.code === 201) {
          ElMessage.success(addressForm.id ? '更新成功' : '添加成功')
          addressDialogVisible.value = false
          fetchAddresses()
        }
      } catch (error) {
        ElMessage.error('保存失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDeleteAddress = (id) => {
  const token = localStorage.getItem('token')
  axios.delete(`http://localhost:8000/api/student/address/detail/`, {
    headers: { 'Authorization': `Bearer ${token}` },
    params: { id }
  }).then(res => {
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchAddresses()
    }
  })
}

const handleSetDefaultAddress = (id) => {
  const token = localStorage.getItem('token')
  axios.put(`http://localhost:8000/api/student/address/detail/`, { is_default: 1 }, {
    headers: { 'Authorization': `Bearer ${token}` },
    params: { id }
  }).then(res => {
    if (res.data.code === 200) {
      ElMessage.success('设置成功')
      fetchAddresses()
    }
  })
}

const handleApiError = (error) => {
  console.error('API Error:', error)
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  } else {
    const msg = error.response?.data?.message || '操作失败，请检查输入'
    ElMessage.error(msg)
  }
}

// 修改资料逻辑
const openEditDialog = () => {
  editForm.username = profile.value.username
  editForm.email = profile.value.email
  editDialogVisible.value = true
}

const handleUpdateProfile = async () => {
  const token = localStorage.getItem('token')
  submitting.value = true
  try {
    const response = await axios.put('http://localhost:8000/api/user/info/', editForm, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      ElMessage.success('资料更新成功')
      profile.value = response.data.data
      editDialogVisible.value = false
    }
  } catch (error) {
    handleApiError(error)
  } finally {
    submitting.value = false
  }
}

// 修改密码逻辑
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      const token = localStorage.getItem('token')
      submitting.value = true
      try {
        const response = await axios.put('http://localhost:8000/api/user/password/', {
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.data.code === 200) {
          ElMessage.success('密码修改成功，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
        }
      } catch (error) {
        handleApiError(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 头像修改逻辑
const openAvatarDialog = () => {
  tempAvatar.value = profile.value.avatar || ''
  avatarDialogVisible.value = true
}

const beforeAvatarUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPGorPNG) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
  }
  return isJPGorPNG && isLt2M
}

const handleAvatarSuccess = (response) => {
  if (response.code === 200) {
    tempAvatar.value = response.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '图片上传失败')
  }
}

const saveAvatar = async () => {
  const token = localStorage.getItem('token')
  submitting.value = true
  try {
    const response = await axios.put('http://localhost:8000/api/user/info/', {
      avatar: tempAvatar.value
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      ElMessage.success('头像保存成功')
      profile.value = response.data.data
      avatarDialogVisible.value = false
    }
  } catch (error) {
    handleApiError(error)
  } finally {
    submitting.value = false
  }
}

// 联系管理员逻辑
const handleContactAdmin = async () => {
  if (!contactAdminFormRef.value) return
  
  await contactAdminFormRef.value.validate(async (valid) => {
    if (valid) {
      const token = localStorage.getItem('token')
      submitting.value = true
      try {
        const response = await axios.post('http://localhost:8000/api/user/contact-admin/', {
          subject: contactAdminForm.subject,
          content: contactAdminForm.content
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.data.code === 200) {
          ElMessage.success('消息已发送给管理员')
          contactAdminDialogVisible.value = false
          contactAdminForm.subject = ''
          contactAdminForm.content = ''
        }
      } catch (error) {
        handleApiError(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-page {
  padding-top: 80px;
  min-height: 100vh;
  background-color: #fff7ed;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 16px rgba(234, 88, 12, 0.1);
}

.profile-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  height: 50px;
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  color: #ea580c;
}

.profile-tabs :deep(.el-tabs__active-bar) {
  background-color: #ea580c;
}

/* 个人资料样式 */
.user-header {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 30px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-hover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
}

.avatar-wrapper:hover .avatar-hover {
  opacity: 1;
}

.user-info-basic h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.username-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.info-section {
  margin: 20px 0;
}

.merchant-desc {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fb;
  border-radius: 8px;
}

.merchant-desc h4 {
  margin: 0 0 10px 0;
  color: #606266;
}

.merchant-desc p {
  margin: 0;
  color: #909399;
  line-height: 1.6;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.account-stats {
  color: #909399;
  font-size: 14px;
}

/* 地址管理样式 */
.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.address-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.address-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  transition: all 0.3s;
}

.address-card:hover {
  border-color: #ea580c;
  box-shadow: 0 2px 12px rgba(234, 88, 12, 0.1);
}

.address-card.is-default {
  border-color: #ea580c;
  background-color: #fff7ed;
}

.addr-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: #ea580c;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-bottom-left-radius: 8px;
  border-top-right-radius: 8px;
}

.addr-main {
  margin-bottom: 15px;
}

.receiver-row {
  margin-bottom: 8px;
}

.receiver-row .name {
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
}

.receiver-row .phone {
  color: #606266;
}

.detail-row {
  color: #909399;
  font-size: 14px;
  line-height: 1.4;
}

.addr-actions {
  display: flex;
  gap: 10px;
  border-top: 1px solid #f2f6fc;
  padding-top: 10px;
}

/* 弹窗样式 */
.avatar-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
