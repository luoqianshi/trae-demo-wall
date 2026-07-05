<template>
  <div class="welcome-page">
    <img 
      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20shopping%20mall%20welcome%20banner%2C%20orange%20gradient%20background%2C%20kawaii%20style%2C%203D%20render%2C%20white%20cute%20character%20with%20shopping%20bag%2C%20floating%20coupons%20stars%20hearts%2C%20store%20front%20curtain%2C%20minimalist%2C%20soft%20lighting%2C%20clean%20design%2C%20left%20side%20empty%20space%20for%20text&image_size=landscape_16_9"
      class="bg-image"
      alt="商城背景"
    />

    <div class="content-layer">
      <nav class="nav-bar">
        <span class="logo">CampusMall</span>
        
        <div class="nav-links">
          <a href="/home" class="nav-link">商城</a>
          <a href="/search" class="nav-link">分类</a>
          <a href="/profile" class="nav-link">我的</a>
        </div>

        <div class="nav-actions">
          <button class="btn-login" @click="goToLogin">登录</button>
          <button class="btn-enter" @click="goToHome">进入商城</button>
        </div>

        <button class="menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <Menu v-if="!mobileMenuOpen" class="text-gray-700" :size="24" />
          <Close v-else class="text-gray-700" :size="24" />
        </button>
      </nav>

      <div class="main-content">
        <h1 class="title">欢迎来到<br/><span class="highlight">校园商城</span></h1>
        <p class="subtitle">超多好物，天天惊喜</p>
        <button class="btn-primary" @click="goToHome">
          立即逛逛
          <ArrowRight :size="20" />
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-num">100+</div>
          <div class="stat-label">入驻商户</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">10000+</div>
          <div class="stat-label">在售商品</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">50000+</div>
          <div class="stat-label">注册用户</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">99%</div>
          <div class="stat-label">好评率</div>
        </div>
      </div>
    </div>

    <div class="mobile-menu" :class="{ show: mobileMenuOpen }">
      <div class="mobile-menu-content">
        <a href="/" @click="mobileMenuOpen = false" class="mobile-link">首页</a>
        <a href="/home" @click="mobileMenuOpen = false" class="mobile-link">商城</a>
        <a href="/search" @click="mobileMenuOpen = false" class="mobile-link">分类</a>
        <a href="/profile" @click="mobileMenuOpen = false" class="mobile-link">我的</a>
        <div class="mobile-actions">
          <button class="btn-mobile-login" @click="goToLogin; mobileMenuOpen = false">登录</button>
          <button class="btn-mobile-enter" @click="goToHome; mobileMenuOpen = false">开始购物</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, Close, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const mobileMenuOpen = ref(false)

const goToHome = () => {
  router.push('/home')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.welcome-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-layer {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #ea580c;
}

.nav-links {
  display: none;
}

@media (min-width: 768px) {
  .nav-links {
    display: flex;
    gap: 24px;
  }
  
  .nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    text-decoration: none;
    transition: color 0.3s;
  }
  
  .nav-link:hover {
    color: #ea580c;
  }
}

.nav-actions {
  display: none;
}

@media (min-width: 768px) {
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .btn-login {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.3s;
  }
  
  .btn-login:hover {
    color: #ea580c;
  }
  
  .btn-enter {
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    background: #ea580c;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .btn-enter:hover {
    background: #c2410c;
  }
}

.menu-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

@media (min-width: 768px) {
  .menu-btn {
    display: none;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 400px;
}

.title {
  font-size: 40px;
  font-weight: bold;
  color: #1f2937;
  line-height: 1.2;
  margin: 0 0 16px 0;
}

@media (min-width: 768px) {
  .title {
    font-size: 56px;
  }
}

.highlight {
  color: #ea580c;
}

.subtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

@media (min-width: 768px) {
  .subtitle {
    font-size: 20px;
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: rgba(234, 88, 12, 0.9);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.2);
}

.btn-primary:hover {
  transform: scale(1.02);
  background: rgba(194, 65, 12, 0.95);
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px 0;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #ea580c;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.mobile-menu.show {
  opacity: 1;
  pointer-events: auto;
}

.mobile-menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.mobile-link {
  font-size: 32px;
  font-weight: bold;
  color: #1f2937;
  text-decoration: none;
}

.mobile-actions {
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 300px;
  margin-top: 16px;
}

.btn-mobile-login {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #ea580c;
  background: transparent;
  border: 2px solid #ea580c;
  border-radius: 20px;
  cursor: pointer;
}

.btn-mobile-enter {
  flex: 1;
  padding: 12px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: #ea580c;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
</style>
