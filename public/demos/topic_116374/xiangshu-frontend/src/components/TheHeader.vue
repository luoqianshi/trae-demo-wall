<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/userStore'
import { useUiStore } from '@/store/uiStore'

// 顶部导航：Logo、菜单高亮、登录态切换、图标化
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const uiStore = useUiStore()

// 移动端菜单展开
const mobileOpen = ref(false)

// 导航菜单项：每项配 Lucide 图标
const menus = [
  { name: 'home', label: '首页', path: '/', icon: 'lucide:home' },
  { name: 'archive', label: '我的档案', path: '/archive', icon: 'lucide:archive' },
  { name: 'explore', label: '探索', path: '/explore', icon: 'lucide:compass' },
  { name: 'about', label: '关于', path: '/about', icon: 'lucide:scroll-text' }
]

// 判断当前菜单是否激活（档案子路由也高亮"我的档案"）
const isActive = (item) => {
  if (item.name === 'archive') return route.path.startsWith('/archive') || route.path === '/book'
  return route.path === item.path
}

// 点击菜单跳转
const go = (path) => {
  mobileOpen.value = false
  router.push(path)
}

// 退出登录
const logout = () => {
  userStore.logout()
  uiStore.showToast('已退出登录')
  router.push('/')
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-inner">
      <!-- Logo -->
      <div class="logo" @click="go('/')">
        <div class="logo-stamp">乡</div>
        <div class="logo-text">
          <b>乡书</b>
          <small>XIANG SHU</small>
        </div>
      </div>

      <!-- 桌面端导航 -->
      <ul class="nav-links">
        <li v-for="item in menus" :key="item.name">
          <a :class="{ active: isActive(item) }" @click="go(item.path)">
            <AppIcon :icon="item.icon" :size="16" />
            <span>{{ item.label }}</span>
          </a>
        </li>
      </ul>

      <!-- 右侧登录态 -->
      <div class="nav-right">
        <template v-if="userStore.isLoggedIn">
          <div class="user-chip" @click="go('/archive')">
            <div class="user-avatar">{{ userStore.displayName.charAt(0) }}</div>
            <span>{{ userStore.displayName }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" @click="logout">
            <AppIcon icon="lucide:log-out" :size="14" />
            退出
          </button>
        </template>
        <template v-else>
          <button class="btn btn-login" @click="go('/login')">
            <AppIcon icon="lucide:log-in" :size="15" />
            登录
          </button>
          <button class="btn btn-seal" @click="go('/register')">
            <AppIcon icon="lucide:user-plus" :size="15" />
            注册
          </button>
        </template>

        <!-- 移动端汉堡 -->
        <button class="hamburger" @click="mobileOpen = !mobileOpen" aria-label="菜单">
          <span :class="{ open: mobileOpen }"></span>
        </button>
      </div>
    </div>

    <!-- 移动端下拉菜单 -->
    <transition name="slide">
      <ul v-show="mobileOpen" class="mobile-menu">
        <li
          v-for="item in menus"
          :key="item.name"
          :class="{ active: isActive(item) }"
          @click="go(item.path)"
        >
          <AppIcon :icon="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </li>
      </ul>
    </transition>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px) saturate(180%);
  background: rgba(250, 246, 239, 0.85);
  border-bottom: 1px solid rgba(139, 107, 80, 0.15);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 2px 12px rgba(94, 70, 50, 0.04);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform var(--transition);
}

.logo:hover {
  transform: translateY(-1px);
}

.logo-stamp {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  background: var(--gradient-seal);
  color: var(--bg-warm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 30px;
  box-shadow:
    inset 0 0 0 2px rgba(243, 234, 217, 0.5),
    0 3px 8px rgba(168, 50, 50, 0.35),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
  transform: rotate(-3deg);
  transition: transform var(--transition-bounce);
}

.logo:hover .logo-stamp {
  transform: rotate(-6deg) scale(1.05);
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo-text b {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--primary-deep);
  letter-spacing: 2px;
}

.logo-text small {
  font-family: var(--font-sub);
  font-size: 11px;
  color: var(--text-light);
  letter-spacing: 3px;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-links a {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 30px;
  font-size: 15px;
  color: var(--text-light);
  cursor: pointer;
  transition: all var(--transition);
  font-weight: 500;
  position: relative;
}

.nav-links a:hover {
  color: var(--primary-deep);
  background: rgba(212, 165, 116, 0.18);
}

.nav-links a.active {
  color: var(--primary-deep);
  background: rgba(212, 165, 116, 0.28);
  box-shadow: inset 0 0 0 1px rgba(139, 107, 80, 0.2);
}

.nav-links a.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -2px;
  transform: translateX(-50%);
  width: 18px;
  height: 2px;
  background: var(--seal);
  border-radius: 2px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 14px 6px 6px;
  border-radius: 30px;
  background: rgba(90, 122, 107, 0.12);
  border: 1px solid rgba(90, 122, 107, 0.25);
  cursor: pointer;
  transition: all var(--transition);
}

.user-chip:hover {
  background: rgba(90, 122, 107, 0.22);
  box-shadow: 0 2px 8px rgba(90, 122, 107, 0.2);
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gradient-moss);
  color: var(--bg-warm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.user-chip span {
  font-size: 14px;
  color: var(--moss-deep);
  font-weight: 500;
}

/* 汉堡按钮 */
.hamburger {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
}

.hamburger span,
.hamburger span::before,
.hamburger span::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 22px;
  height: 2px;
  background: var(--primary-deep);
  border-radius: 2px;
  transform: translateX(-50%);
  transition: all var(--transition);
}

.hamburger span {
  top: 50%;
  transform: translate(-50%, -50%);
}

.hamburger span::before { top: -7px; }
.hamburger span::after { top: 7px; }

.hamburger span.open { background: transparent; }
.hamburger span.open::before { top: 0; transform: translateX(-50%) rotate(45deg); }
.hamburger span.open::after { top: 0; transform: translateX(-50%) rotate(-45deg); }

/* 移动端菜单 */
.mobile-menu {
  background: var(--bg);
  border-top: 1px solid rgba(139, 107, 80, 0.15);
  padding: 8px 18px;
}

.mobile-menu li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text);
  transition: all var(--transition);
}

.mobile-menu li.active {
  color: var(--seal);
  background: rgba(168, 50, 50, 0.06);
  font-weight: 600;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .nav-links { display: none; }
  .hamburger { display: block; }
  .nav-inner { padding: 12px 18px; }
  .btn-login, .btn-seal { padding: 8px 14px; font-size: 13px; }
  .btn-login span, .btn-seal span { display: none; }
  .user-chip span { display: none; }
}
</style>
