<template>
  <div class="register-page">
    <NavBar />
    <main class="register-main">
      <div class="register-card">
        <div class="register-header">
          <div class="register-avatar">
            <IconUsers :size="36" />
          </div>
          <h1 class="register-title">注册毕格修</h1>
          <p class="register-subtitle">创建你的账号，开始使用</p>
        </div>

        <form class="register-form" @submit.prevent="onRegister">
          <div class="form-group">
            <label class="form-label" for="username">用户名</label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="input"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">密码</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                placeholder="请输入密码"
                autocomplete="new-password"
              />
              <button type="button" class="input-toggle" @click="showPassword = !showPassword" :title="showPassword ? '隐藏密码' : '显示密码'">
                <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirm-password">确认密码</label>
            <div class="input-wrapper">
              <input
                id="confirm-password"
                v-model="confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                class="input"
                placeholder="请再次输入密码"
                autocomplete="new-password"
              />
              <button type="button" class="input-toggle" @click="showConfirm = !showConfirm" :title="showConfirm ? '隐藏密码' : '显示密码'">
                <svg v-if="showConfirm" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary register-submit">
            注册
          </button>

          <div class="register-footer">
            <span>已有账号？</span>
            <a href="#" class="form-link" @click.prevent="router.push('/login')">立即登录</a>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import IconUsers from '../components/icons/IconUsers.vue'

const router = useRouter()
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)

const onRegister = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: var(--bg-body);
}

.register-main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  min-height: calc(100vh - 64px);
}

.register-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  box-shadow: var(--shadow-card-hover);
  border: 1px solid var(--border-color-light);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  margin-bottom: 16px;
}

.register-title {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.register-subtitle {
  font-size: 14px;
  color: var(--text-light);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input {
  width: 100%;
  padding: 12px 14px;
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-body);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
  box-sizing: border-box;
}

.input::placeholder {
  color: var(--text-light);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.input-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-normal);
}

.input-toggle:hover {
  color: var(--color-primary);
}

.form-link {
  font-size: 14px;
  color: var(--color-accent);
  text-decoration: none;
  transition: color var(--transition-normal);
}

.form-link:hover {
  color: var(--color-primary);
}

.register-submit {
  width: auto;
  align-self: center;
  padding: 14px 64px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 4px;
}

.register-footer {
  text-align: center;
  font-size: 14px;
  color: var(--text-light);
}

.register-footer .form-link {
  margin-left: 4px;
  font-weight: 500;
}

@media (max-width: 640px) {
  .register-card {
    padding: 32px 24px;
    border-radius: var(--radius-lg);
  }
  .register-title {
    font-size: 24px;
  }
  .register-submit {
    width: 100%;
    padding: 14px;
  }
}
</style>
