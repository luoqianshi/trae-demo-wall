<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/userStore'
import { useUiStore } from '@/store/uiStore'

// 登录页：表单 + 校验 + 提交
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const uiStore = useUiStore()

const form = reactive({
  account: '',
  password: ''
})

const errors = reactive({})
const loading = ref(false)

// 表单校验
const validate = () => {
  let ok = true
  if (!form.account) {
    errors.account = '请输入账号'
    ok = false
  }
  if (!form.password) {
    errors.password = '请输入密码'
    ok = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少 6 位'
    ok = false
  }
  return ok
}

// 提交登录
const onSubmit = async () => {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!validate()) return

  loading.value = true
  try {
    await userStore.login({ ...form })
    uiStore.showToast('登录成功，欢迎回家')
    // 跳转到 redirect 或档案页
    const redirect = route.query.redirect || '/archive'
    router.push(redirect)
  } catch (e) {
    uiStore.showToast(e.message || '登录失败', 'err')
  } finally {
    loading.value = false
  }
}

// 跳转注册
const goRegister = () => router.push('/register')
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-head">
        <div class="seal-circle">乡</div>
        <h2>登录乡书</h2>
        <p>欢迎回家，继续保存您的家族记忆</p>
      </div>

      <form @submit.prevent="onSubmit" class="auth-form">
        <div class="field">
          <label>
            <AppIcon icon="lucide:user" :size="13" />
            账号
          </label>
          <input v-model="form.account" placeholder="手机号或邮箱" />
          <div class="field-error" v-if="errors.account">{{ errors.account }}</div>
        </div>
        <div class="field">
          <label>
            <AppIcon icon="lucide:lock" :size="13" />
            密码
          </label>
          <input v-model="form.password" type="password" placeholder="请输入密码" />
          <div class="field-error" v-if="errors.password">{{ errors.password }}</div>
        </div>

        <button class="btn btn-primary submit" type="submit" :disabled="loading">
          <AppIcon v-if="!loading" icon="lucide:log-in" :size="16" />
          <AppIcon v-else icon="lucide:loader-circle" :size="16" class="spin" />
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>

      <div class="auth-foot">
        还没有账号？<a @click="goRegister">立即注册</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.auth-card {
  background: var(--bg-warm);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lift);
  padding: 40px;
  max-width: 420px;
  width: 100%;
  border: 1px solid rgba(139, 107, 80, 0.1);
}

.auth-head {
  text-align: center;
  margin-bottom: 30px;
}

.seal-circle {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--seal), var(--seal-deep));
  color: var(--bg-warm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 32px;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 2px rgba(243, 234, 217, 0.5), 0 6px 16px rgba(168, 50, 50, 0.35);
}

.auth-head h2 {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 6px;
}

.auth-head p {
  font-size: 13px;
  color: var(--text-light);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-form label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.submit {
  width: 100%;
  margin-top: 12px;
  padding: 13px;
  font-size: 15px;
}

/* 加载图标旋转 */
.spin {
  animation: iconSpin 1s linear infinite;
}

@keyframes iconSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.auth-foot {
  text-align: center;
  margin-top: 22px;
  font-size: 14px;
  color: var(--text-light);
}

.auth-foot a {
  color: var(--seal);
  cursor: pointer;
  font-weight: 600;
  margin-left: 4px;
}

.auth-foot a:hover {
  text-decoration: underline;
}
</style>
