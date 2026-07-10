<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">个人身体状况监控系统</h2>
      <p class="login-subtitle">登录以查看您的健康数据</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="登录方式">
          <el-radio-group v-model="form.loginType">
            <el-radio value="LOGIN_BY_SMS">短信验证码</el-radio>
            <el-radio value="LOGIN_BY_PASSWORD">密码</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            maxlength="11"
            clearable
          />
        </el-form-item>

        <el-form-item v-if="form.loginType === 'LOGIN_BY_SMS'" label="验证码" prop="code">
          <div class="code-row">
            <el-input
              v-model="form.code"
              placeholder="请输入验证码"
              maxlength="6"
            />
            <el-button :disabled="counting" @click="handleSendCode">
              {{ codeButtonText }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item v-else label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="submitting"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="login-footer">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElMessage,
  type FormInstance,
  type FormItemRule,
  type FormRules
} from 'element-plus'
import { loginBySms, loginByPassword, sendSms, toUserInfo } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import logger from '@/utils/logger'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const counting = ref(false)
// 验证码倒计时剩余秒数
const countdownSeconds = ref(0)
// 倒计时定时器句柄；使用 ref 避免变量重新赋值
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 验证码倒计时总时长（秒）
const COUNTDOWN_SECONDS = 60

const form = reactive({
  loginType: 'LOGIN_BY_SMS' as 'LOGIN_BY_SMS' | 'LOGIN_BY_PASSWORD',
  phone: '',
  code: '',
  password: ''
})

/** 匹配手机号：1 开头，11 位数字 */
const PHONE_PATTERN = /^1\d{10}$/

// 手机号字段校验器
const phoneValidator = (
  _rule: FormItemRule,
  value: string,
  callback: (error?: string | Error) => void
): void => {
  if (!value) {
    callback(new Error('请输入手机号'))
    return
  }
  if (!PHONE_PATTERN.test(value)) {
    callback(new Error('请输入正确的手机号'))
    return
  }
  callback()
}

const rules: FormRules = {
  phone: [{ validator: phoneValidator, trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 验证码按钮文案
const codeButtonText = computed(() => {
  if (counting.value) {
    return `${countdownSeconds.value}s 后重发`
  }
  return '获取验证码'
})

// 启动倒计时
const startCountdown = (): void => {
  counting.value = true
  countdownSeconds.value = COUNTDOWN_SECONDS
  countdownTimer.value = setInterval(() => {
    countdownSeconds.value -= 1
    if (countdownSeconds.value <= 0) {
      stopCountdown()
    }
  }, 1000)
}

// 停止倒计时并清理定时器
const stopCountdown = (): void => {
  counting.value = false
  countdownSeconds.value = 0
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

// 发送验证码
const handleSendCode = async (): Promise<void> => {
  if (!PHONE_PATTERN.test(form.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }
  try {
    await sendSms(form.phone)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (e) {
    logger.error('发送验证码失败', e)
  }
}

// 登录
const handleLogin = async (): Promise<void> => {
  if (!formRef.value) {
    return
  }
  // 必须顺序执行：先校验表单，通过后才发起登录
  try {
    await formRef.value.validate()
  } catch {
    // 校验未通过，Element Plus 已展示字段错误
    return
  }

  submitting.value = true
  try {
    // 根据登录方式调用不同接口
    const result = form.loginType === 'LOGIN_BY_SMS'
      ? await loginBySms({ phone: form.phone, code: form.code })
      : await loginByPassword({ phone: form.phone, password: form.password })
    userStore.setToken(result.token)
    userStore.setUserInfo(toUserInfo(result))
    ElMessage.success('登录成功')
    // 优先跳转 redirect 参数指向的页面，否则回首页
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e) {
    logger.error('登录失败', e)
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  stopCountdown()
})
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.login-title {
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  text-align: center;
}

.login-subtitle {
  margin-bottom: 28px;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

.code-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.code-row .el-input {
  flex: 1;
}

.login-btn {
  width: 100%;
}

.login-footer {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
  text-align: center;
}
</style>
