<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="navbar-brand">
        <div class="navbar-logo">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="#3b352b"/>
            <path d="M14 8h14l8 8v24c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2z" fill="#fbfaf9" opacity="0.95"/>
            <path d="M28 8v8h8" fill="#eae6db"/>
            <path d="M18 26l4 4 8-9" stroke="#9b965f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>
        <div class="navbar-text">
          <span class="navbar-title">毕格修</span>
          <span class="navbar-subtitle">PaperFix AI</span>
        </div>
      </router-link>
      <div class="navbar-actions">
        <button class="btn btn-ghost navbar-btn" @click="$router.push('/login')">
          <IconUsers :size="18" />
          登录
        </button>
        <button class="btn btn-primary navbar-btn" @click="$router.push('/paper')">
          <IconDocument :size="18" />
          论文修改
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import IconUsers from './icons/IconUsers.vue'
import IconDocument from './icons/IconDocument.vue'
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(251, 250, 249, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color-light);
  height: 64px;
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.navbar-brand:hover {
  opacity: 0.85;
}

.navbar-logo {
  flex-shrink: 0;
}

.navbar-logo svg {
  width: 32px;
  height: 32px;
}

.navbar-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.navbar-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.navbar-subtitle {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-accent);
  letter-spacing: 2px;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar-btn {
  padding: 8px 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-ghost:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary-border);
}

@media (max-width: 640px) {
  .navbar-text {
    display: none;
  }
  .navbar-btn span {
    display: none;
  }
  .navbar-btn {
    padding: 8px 12px;
  }
}
</style>
