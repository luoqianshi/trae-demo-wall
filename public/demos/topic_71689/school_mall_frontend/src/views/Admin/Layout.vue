<template>
  <div class="admin-layout">
    <el-container class="layout-container">
      <el-aside width="240px" class="aside">
        <div class="logo">
          <el-icon class="logo-icon"><Shop /></el-icon>
          <span>校园商城管理后台</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>平台概况</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/merchants">
            <el-icon><Shop /></el-icon>
            <span>商家审核</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/categories">
            <el-icon><Menu /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/products">
            <el-icon><Goods /></el-icon>
            <span>商品管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/orders">
            <el-icon><List /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/coupons">
            <el-icon><Ticket /></el-icon>
            <span>营销管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/reviews">
            <el-icon><ChatDotRound /></el-icon>
            <span>评价管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                {{ username }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="home">返回商城</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main class="main">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { 
  DataBoard, 
  User, 
  Shop, 
  Menu, 
  Goods, 
  List, 
  Ticket, 
  ChatDotRound,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')
const username = ref(localStorage.getItem('username') || '管理员')

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('user_role')
      ElMessage.success('已退出登录')
      router.push('/login')
    })
  } else if (command === 'home') {
    router.push('/')
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  width: 100vw;
}

.layout-container {
  height: 100%;
}

.aside {
  background-color: #304156;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b2f3a;
  color: #fff;
}

.logo-icon {
  margin-right: 10px;
  font-size: 24px;
  color: #409EFF;
}

.el-menu-vertical {
  border-right: none;
  flex: 1;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}

/* transition */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
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
