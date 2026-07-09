<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon class="logo-icon">
          <Shop />
        </el-icon>
        <h2>商家自动化运营系统</h2>
        <p>让AI帮您轻松运营门店</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item prop="verification_code">
          <div class="code-field">
            <el-input v-model="form.verification_code" placeholder="请输入邮箱验证码" maxlength="6" />
            <el-button class="code-btn" :loading="codeLoading" :disabled="codeCountdown > 0" @click="sendEmailCode">
              {{ codeCountdown > 0 ? `${codeCountdown}s 后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
        <div class="login-links">
          <span>还没有账号？</span>
          <el-button link @click="goToRegister">立即注册</el-button>
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
  email: '',
  password: '',
  verification_code: ''
})

const rules = {
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
      scene: 'login'
    })
    closeCodeMessage()
    codeMessage = ElMessage({
      type: 'success',
      showClose: true,
      duration: 0,
      message: `登录邮箱验证码：${result.code}，5分钟内有效`
    })
    startCountdown()
  } finally {
    codeLoading.value = false
  }
}

async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(form)
        closeCodeMessage()
        router.push('/dashboard')
      } finally {
        loading.value = false
      }
    }
  })
}

function goToRegister() {
  router.push('/register')
}

onUnmounted(() => {
  if (codeTimer) clearInterval(codeTimer)
  closeCodeMessage()
})
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  padding: 24px;
  background:
    radial-gradient(circle at 18% 20%, rgba(249, 115, 22, 0.28), transparent 30%),
    radial-gradient(circle at 82% 16%, rgba(180, 83, 9, 0.2), transparent 28%),
    radial-gradient(circle at 72% 86%, rgba(47, 111, 94, 0.16), transparent 34%),
    linear-gradient(135deg, #fff7ed 0%, #f6ead8 44%, #efe2ce 100%);
  color: var(--ds-text);
  overflow: hidden;
}

.login-container::before,
.login-container::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.login-container::before {
  inset: 7% auto auto 8%;
  width: 220px;
  height: 220px;
  border: 1px solid rgba(180, 83, 9, 0.14);
  border-radius: 38% 62% 54% 46%;
  background: rgba(255, 253, 250, 0.32);
  filter: blur(0.2px);
}

.login-container::after {
  right: 9%;
  bottom: 10%;
  width: 280px;
  height: 120px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(180, 83, 9, 0.16), rgba(47, 111, 94, 0.08));
  transform: rotate(-10deg);
}

.login-box {
  position: relative;
  z-index: 1;
  width: min(440px, 100%);
  padding: 36px;
  background: rgba(255, 253, 250, 0.94);
  border: 1px solid rgba(180, 83, 9, 0.18);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(120, 53, 15, 0.16), 0 1px 2px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.login-box::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, var(--ds-primary), #f97316, #2f6f5e);
}

.login-box::after {
  content: 'AI 经营驾驶舱';
  position: absolute;
  top: 18px;
  right: 20px;
  color: #f97316;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
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

.login-header h2 {
  margin: 0 0 8px 0;
  color: var(--ds-text);
  font-size: 25px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.login-header p {
  margin: 0;
  color: var(--ds-muted);
  font-size: 14px;
}

.login-form {
  width: 100%;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 12px;
  background: #fffefa;
  box-shadow: 0 0 0 1px var(--ds-border) inset;
}

.login-form :deep(.el-input__inner) {
  color: var(--ds-text);
  font-weight: 600;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #9a8b7c;
  font-weight: 500;
}

.login-form :deep(.el-input__wrapper.is-focus) {
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

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 800;
  border-radius: 12px;
}

.login-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(180, 83, 9, 0.18);
  color: var(--ds-muted);
  font-size: 14px;
}

@media (max-width: 520px) {
  .login-container {
    padding: 16px;
    align-items: stretch;
  }

  .login-box {
    margin: auto 0;
    padding: 34px 22px;
  }

  .code-field {
    grid-template-columns: 1fr;
  }
}
</style>
