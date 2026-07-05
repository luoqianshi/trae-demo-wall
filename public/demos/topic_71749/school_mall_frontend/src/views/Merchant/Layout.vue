<template>
  <div class="merchant-layout">
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside width="240px" class="aside">
        <div class="logo">
          <img src="@/assets/vue.svg" alt="logo" />
          <span>商家管理后台</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/merchant/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>控制台</span>
          </el-menu-item>
          
          <el-menu-item index="/merchant/products" :disabled="!isApproved">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          
          <el-menu-item index="/merchant/orders" :disabled="!isApproved">
            <el-icon><List /></el-icon>
            <span>订单管理</span>
          </el-menu-item>

          <el-menu-item index="/merchant/refunds" :disabled="!isApproved">
            <el-icon><Money /></el-icon>
            <span>退款审核</span>
          </el-menu-item>

          <el-menu-item index="/merchant/info">
            <el-icon><Shop /></el-icon>
            <span>商户信息</span>
          </el-menu-item>
          
          <el-menu-item index="/merchant/onboarding" v-if="!isApproved">
            <el-icon><Stamp /></el-icon>
            <span>商家认证</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container class="main-container">
        <!-- 顶栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>商家后台</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentRouteName }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-button type="warning" link @click="goToRecharge">
              <el-icon><Wallet /></el-icon> 充值
            </el-button>
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                {{ userInfo?.username }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="home">回商城首页</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 内容区 -->
        <el-main class="main">
          <div class="content-wrapper">
            <router-view v-slot="{ Component }">
              <transition name="fade-transform" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  DataLine, 
  Goods, 
  List, 
  Shop, 
  Stamp,
  ArrowDown,
  Money,
  Wallet
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const merchantInfo = ref(null)
const loading = ref(true)

const activeMenu = computed(() => route.path)
const currentRouteName = computed(() => route.meta.title || '控制台')

const isApproved = computed(() => merchantInfo.value?.status === 1)

const fetchMerchantStatus = async () => {
  try {
    const response = await axios.get('/api/merchant/info/')
    if (response.data.code === 200) {
      merchantInfo.value = response.data.data
      // 如果未认证且不在认证页面，重定向到认证页面
      if (merchantInfo.value.status !== 1 && route.path !== '/merchant/onboarding' && route.path !== '/merchant/info') {
        router.push('/merchant/onboarding')
      }
    } else if (response.data.code === 404) {
      merchantInfo.value = null
      if (route.path !== '/merchant/onboarding') {
        router.push('/merchant/onboarding')
      }
    }
  } catch (error) {
    console.error('获取商户状态失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      ElMessage.success('已退出登录')
      router.push('/login')
    })
  } else if (command === 'home') {
    router.push('/')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

const goToRecharge = () => {
  router.push('/recharge')
}

onMounted(() => {
  fetchMerchantStatus()
})

// 监听路由，如果尝试进入需要认证的页面但未认证，则拦截
watch(() => route.path, (newPath) => {
  if (merchantInfo.value?.status !== 1 && ['/merchant/products', '/merchant/orders'].includes(newPath)) {
    ElMessage.warning('请先完成商家认证并通过审核')
    router.push('/merchant/onboarding')
  }
})
</script>

<style scoped>
.merchant-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.aside {
  background-color: #304156;
  color: #fff;
  transition: width 0.3s;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: #2b2f3a;
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.logo span {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
}

.el-menu-vertical {
  border-right: none;
}

.main-container {
  background-color: #f0f2f5;
}

.header {
  background: #fff;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  z-index: 10;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
}

.main {
  padding: 20px;
  overflow-y: auto;
}

.content-wrapper {
  background: #fff;
  min-height: calc(100vh - 140px);
  padding: 20px;
  border-radius: 4px;
}

/* 动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all .3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
