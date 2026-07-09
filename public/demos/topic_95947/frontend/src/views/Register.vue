<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <el-icon class="logo-icon">
          <Shop />
        </el-icon>
        <h2>商家注册</h2>
        <p>开启智能运营之旅</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" class="register-form" label-position="top">
        <div class="form-grid">
          <el-form-item label="商家名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入商家名称" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
          </el-form-item>
          <el-form-item label="验证码" prop="verification_code">
            <div class="code-field">
              <el-input v-model="form.verification_code" placeholder="请输入邮箱验证码" maxlength="6" />
              <el-button class="code-btn" :loading="codeLoading" :disabled="codeCountdown > 0" @click="sendEmailCode">
                {{ codeCountdown > 0 ? `${codeCountdown}s 后重试` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="业态类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择业态类型">
              <el-option label="正餐" value="正餐" />
              <el-option label="快餐" value="快餐" />
              <el-option label="小吃" value="小吃" />
              <el-option label="饮品" value="饮品" />
              <el-option label="火锅" value="火锅" />
              <el-option label="烧烤" value="烧烤" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="行业分类" prop="industry">
            <el-select v-model="form.industry" placeholder="请选择行业分类">
              <el-option label="餐饮" value="餐饮" />
              <el-option label="零售" value="零售" />
              <el-option label="服务" value="服务" />
              <el-option label="娱乐" value="娱乐" />
            </el-select>
          </el-form-item>
          <el-form-item label="所在地区" prop="region">
            <el-input v-model="form.region" placeholder="请输入所在地区" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="form.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item class="full-span" label="商家描述">
            <el-input v-model="form.description" type="textarea" placeholder="请简单描述您的商家" />
          </el-form-item>
        </div>
        <el-form-item class="full-span">
          <el-button type="primary" class="register-btn" @click="handleRegister" :loading="loading">
            注册
          </el-button>
        </el-form-item>
        <div class="register-links">
          <span>已有账号？</span>
          <el-button link @click="goToLogin">立即登录</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api'
import { Shop } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const codeLoading = ref(false)
const codeCountdown = ref(0)
let codeTimer = null
let codeMessage = null

const form = reactive({
  name: '',
  email: '',
  password: '',
  verification_code: '',
  type: '',
  industry: '',
  region: '',
  phone: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入商家名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度在2-100之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  verification_code: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择业态类型', trigger: 'change' }
  ],
  industry: [
    { required: true, message: '请选择行业分类', trigger: 'change' }
  ],
  region: [
    { required: true, message: '请输入所在地区', trigger: 'blur' }
  ]
}

function closeCodeMessage() {
  if (codeMessage?.close) {
    codeMessage.close()
    codeMessage = null
  }
}

function startCountdown() {
  codeCountdown.value = 60
  if (codeTimer) clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) {
      clearInterval(codeTimer)
      codeTimer = null
    }
  }, 1000)
}

async function sendEmailCode() {
  if (!formRef.value) return

  try {
    await formRef.value.validateField('email')
  } catch {
    return
  }

  codeLoading.value = true
  try {
    const result = await authApi.sendEmailCode({
      email: form.email,
      scene: 'register'
    })
    closeCodeMessage()
    codeMessage = ElMessage({
      type: 'success',
      showClose: true,
      duration: 0,
      message: `注册邮箱验证码：${result.code}，5分钟内有效`
    })
    startCountdown()
  } finally {
    codeLoading.value = false
  }
}

async function handleRegister() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.register(form)
        closeCodeMessage()
        router.push('/dashboard')
      } finally {
        loading.value = false
      }
    }
  })
}

function goToLogin() {
  router.push('/login')
}

onUnmounted(() => {
  if (codeTimer) clearInterval(codeTimer)
  closeCodeMessage()
})
</script>

<style scoped>
.register-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  padding: 24px 32px;
  background:
    radial-gradient(circle at 14% 18%, rgba(249, 115, 22, 0.26), transparent 30%),
    radial-gradient(circle at 88% 12%, rgba(180, 83, 9, 0.18), transparent 28%),
    radial-gradient(circle at 76% 86%, rgba(47, 111, 94, 0.15), transparent 34%),
    linear-gradient(135deg, #fff7ed 0%, #f6ead8 44%, #efe2ce 100%);
  color: var(--ds-text);
  overflow: hidden;
}

.register-container::before,
.register-container::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.register-container::before {
  inset: 8% auto auto 7%;
  width: 250px;
  height: 250px;
  border: 1px solid rgba(180, 83, 9, 0.14);
  border-radius: 42% 58% 54% 46%;
  background: rgba(255, 253, 250, 0.32);
}

.register-container::after {
  right: 8%;
  bottom: 9%;
  width: 320px;
  height: 130px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(180, 83, 9, 0.15), rgba(47, 111, 94, 0.08));
  transform: rotate(-9deg);
}

.register-box {
  position: relative;
  z-index: 1;
  width: min(760px, 100%);
  padding: 32px 38px 26px;
  background: rgba(255, 253, 250, 0.94);
  border: 1px solid rgba(180, 83, 9, 0.18);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(120, 53, 15, 0.16), 0 1px 2px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.register-box::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, var(--ds-primary), #f97316, #2f6f5e);
}

.register-box::after {
  content: '开通经营空间';
  position: absolute;
  top: 18px;
  right: 20px;
  color: #f97316;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.register-header {
  text-align: center;
  margin-bottom: 18px;
}

.logo-icon {
  width: 56px;
  height: 56px;
  padding: 12px;
  color: var(--ds-primary);
  background: linear-gradient(145deg, #fff7ed, #edf7f2);
  border: 1px solid rgba(47, 111, 94, 0.14);
  border-radius: 16px;
  font-size: 30px;
  margin-bottom: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.register-header h2 {
  margin: 0 0 8px 0;
  color: var(--ds-text);
  font-size: 25px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.register-header p {
  margin: 0;
  color: var(--ds-muted);
  font-size: 14px;
}

.register-form {
  width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}

.full-span {
  grid-column: 1 / -1;
}

.register-form :deep(.el-form-item__label) {
  color: #5f5142;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 7px;
}

.register-form :deep(.el-input__wrapper),
.register-form :deep(.el-select__wrapper),
.register-form :deep(.el-textarea__inner) {
  min-height: 44px;
  border-radius: 12px;
  background: #fffefa;
  box-shadow: 0 0 0 1px var(--ds-border) inset;
}

.register-form :deep(.el-input__inner),
.register-form :deep(.el-textarea__inner) {
  color: var(--ds-text);
  font-weight: 600;
}

.register-form :deep(.el-input__inner::placeholder),
.register-form :deep(.el-textarea__inner::placeholder) {
  color: #9a8b7c;
  font-weight: 500;
}

.register-form :deep(.el-input__wrapper.is-focus),
.register-form :deep(.el-select__wrapper.is-focused),
.register-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--ds-primary) inset, 0 0 0 3px rgba(180, 83, 9, 0.12);
}

.code-field {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  gap: 10px;
}

.code-btn {
  height: 44px;
  border-radius: 12px;
  color: var(--ds-primary-700);
  background: #fff7ed;
  border-color: #f3d4ae;
  font-weight: 800;
}

.code-btn:hover:not(.is-disabled) {
  color: #fff;
  background: var(--ds-primary);
  border-color: var(--ds-primary);
}

.register-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 800;
  border-radius: 12px;
}

.register-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px dashed rgba(180, 83, 9, 0.18);
  color: var(--ds-muted);
  font-size: 14px;
}

@media (max-width: 640px) {
  .register-container {
    padding: 16px;
  }

  .register-box {
    padding: 34px 22px;
  }

  .form-grid,
  .code-field {
    grid-template-columns: 1fr;
  }
}
</style>
