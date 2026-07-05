<template>
  <div class="top-bar">
    <div class="container">
      <div class="left">
        <span class="home-link" @click="router.push('/')">校园商城</span>
        <template v-if="isLoggedIn && userInfo.user_type === 2">
          <span class="separator">|</span>
          <el-link type="primary" @click="enterMerchantBackend">商家后台</el-link>
        </template>
        <template v-if="isLoggedIn && userInfo.user_type === 3">
          <span class="separator">|</span>
          <el-link type="primary" @click="enterAdminBackend">管理后台</el-link>
        </template>
      </div>
      <div class="right">
        <template v-if="isLoggedIn">
          <span class="welcome">你好，{{ userInfo.nickname || userInfo.username }}</span>
          <el-link type="warning" @click="goToRecharge">
            <el-icon><Wallet /></el-icon> 充值
          </el-link>
          <el-link type="danger" @click="handleLogout">退出</el-link>
        </template>
        <template v-else>
          <el-link type="primary" @click="handleLogin">登录</el-link>
          <el-link type="danger" @click="handleRegister">注册</el-link>
        </template>
        <span class="separator">|</span>
        <el-link @click="goToCart">购物车</el-link>
        <el-link @click="goToOrders">订单</el-link>
        <el-link @click="goToCollections">收藏</el-link>
        <el-link @click="goToMyCoupons">优惠券</el-link>
        <el-link @click="goToChat">消息</el-link>
        <el-link @click="goToProfile">个人中心</el-link>
       
        <span class="separator">|</span>
        <el-link 
          v-if="!isLoggedIn || userInfo.user_type === 2" 
          type="warning" 
          @click="goToMerchantOnboarding"
        >商户入驻</el-link>
        <el-link 
          v-if="!isLoggedIn || userInfo.user_type === 1" 
          type="success" 
          @click="goToStudentCertification"
        >学生认证</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Wallet } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()

const userInfo = ref({})
const isLoggedIn = ref(false)

const updateUserInfo = () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
  try {
    const user = localStorage.getItem('userInfo')
    userInfo.value = user ? JSON.parse(user) : {}
  } catch (e) {
    userInfo.value = {}
  }
}

onMounted(() => {
  updateUserInfo()
})

const handleLogin = () => {
  router.push('/login')
}

const handleRegister = () => {
  router.push('/register')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  updateUserInfo()
  router.push('/login')
}

const goToCart = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/cart')
}

const goToOrders = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/orders')
}

const goToCollections = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/collections')
}

const goToMyCoupons = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/my-coupons')
}

const goToChat = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/chat')
}

const goToProfile = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/profile')
}

const goToRecharge = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
    return
  }
  router.push('/recharge')
}

const enterMerchantBackend = async () => {
  try {
    const response = await axios.get('/api/user/info/')
    if (response.data.code === 200) {
      const user = response.data.data
      localStorage.setItem('userInfo', JSON.stringify(user))
      userInfo.value = user
      
      const merchantInfo = user.merchant_info
      if (user.user_type === 2 && merchantInfo && merchantInfo.status == 1) {
        router.push('/merchant/dashboard')
      } else {
        ElMessage.warning('您的商家账号还未认证通过，无法进入后台')
      }
    } else {
      throw new Error(response.data.message || '获取信息失败')
    }
  } catch (error) {
    console.error('进入商家后台校验失败:', error)
    const merchantInfo = userInfo.value.merchant_info
    if (merchantInfo && merchantInfo.status == 1) {
      router.push('/merchant/dashboard')
    } else {
      ElMessage.warning('校验身份失败，请重新登录尝试')
    }
  }
}

const enterAdminBackend = async () => {
  try {
    const response = await axios.get('/api/user/info/')
    if (response.data.code === 200) {
      const user = response.data.data
      localStorage.setItem('userInfo', JSON.stringify(user))
      userInfo.value = user
      
      if (user.user_type === 3) {
        router.push('/admin/dashboard')
      } else {
        ElMessage.warning('您的管理员账号还未认证通过，无法进入后台')
      }
    } else {
      throw new Error(response.data.message || '获取信息失败')
    }
  } catch (error) {
    console.error('进入管理后台校验失败:', error)
    ElMessage.warning('校验身份失败，请重新登录尝试')
  }
}

const goToMerchantOnboarding = () => {
  router.push('/merchant-onboarding')
}

const goToStudentCertification = () => {
  router.push('/student-certification')
}
</script>

<style scoped>
.top-bar {
  background-color: #fff;
  border-bottom: 1px solid #fed7aa;
  font-size: 12px;
  color: #6b7280;
  height: 36px;
  line-height: 36px;
}

.home-link {
  color: #ea580c;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.home-link:hover {
  color: #c2410c;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.left {
  display: flex;
  align-items: center;
}

.right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome {
  margin-right: 8px;
  color: #374151;
}

.separator {
  color: #e5e7eb;
}
</style>
