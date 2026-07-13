<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/userStore'
import { useUiStore } from '@/store/uiStore'

// 注册页：姓名/手机号/密码 + 校验
const router = useRouter()
const userStore = useUserStore()
const uiStore = useUiStore()

const form = reactive({
  name: '',
  phone: '',
  password: '',
  confirm: ''
})

const errors = reactive({})
const loading = ref(false)

// 校验
const validate = () => {
  let ok = true
  if (!form.name) {
    errors.name = '请输入姓名'
    ok = false
  }
  if (!form.phone) {
    errors.phone = '请输入手机号'
    ok = false
  } else if (!/^1\d{10}$/.test(form.phone)) {
    errors.phone = '手机号格式不正确'
    ok = false
  }
  if (!form.password) {
    errors.password = '请输入密码'
    ok = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少 6 位'
    ok = false
  }
  if (form.confirm !== form.password) {
    errors.confirm = '两次密码不一致'
    ok = false
  }
  return ok
}

const onSubmit = async () => {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!validate()) return
  loading.value = true
  try {
    await userStore.register({
      name: form.name,
      phone: form.phone,
      password: form.password
    })
    uiStore.showToast('注册成功，已自动登录')
    router.push('/archive')
  } catch (e) {
    uiStore.showToast(e.message || '注册失败', 'err')
  } finally {
    loading.value = false
  }
}

const goLogin = () => router.push('/login')
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-head">
        <div class="seal-circle">乡</div>
        <h2>注册乡书</h2>
        <p>为您的家庭建立第一份永久档案</p>
      </div>

      <form @submit.prevent="onSubmit" class="auth-form">
        <div class="field">
          <label>
            <AppIcon icon="lucide:user" :size="13" />
            姓名
          </label>
          <input v-model="form.name" placeholder="您的姓名" />
          <div class="field-error" v-if="errors.name">{{ errors.name }}</div>
        </div>
        <div class="field">
          <label>
            <AppIcon icon="lucide:smartphone" :size="13" />
            手机号
          </label>
          <input v-model="form.phone" placeholder="11 位手机号" maxlength="11" />
          <div class="field-error" v-if="errors.phone">{{ errors.phone }}</div>
        </div>
        <div class="field">
          <label>
            <AppIcon icon="lucide:lock" :size="13" />
            密码
          </label>
          <input v-model="form.password" type="password" placeholder="至少 6 位" />
          <div class="field-error" v-if="errors.password">{{ errors.password }}</div>
        </div>
        <div class="field">
          <label>
            <AppIcon icon="lucide:lock-keyhole" :size="13" />
            确认密码
          </label>
          <input v-model="form.confirm" type="password" placeholder="再次输入密码" />
          <div class="field-error" v-if="errors.confirm">{{ errors.confirm }}</div>
        </div>

        <button class="btn btn-seal submit" type="submit" :disabled="loading">
          <AppIcon v-if="!loading" icon="lucide:user-plus" :size="16" />
          <AppIcon v-else icon="lucide:loader-circle" :size="16" class="spin" />
          {{ loading ? '注册中…' : '注册' }}
        </button>
      </form>

      <div class="auth-foot">
        已有账号？<a @click="goLogin">直接登录</a>
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
