<template>
  <div class="dashboard-container">
    <el-container class="dashboard-layout">
      <!-- 侧边栏 -->
      <el-aside width="260px" class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <el-icon class="logo-icon"><Monitor /></el-icon>
            <span class="logo-text">医疗咨询系统</span>
          </div>
          <div class="user-info">
            <el-avatar :size="40" :src="userAvatar" class="user-avatar" />
            <div class="user-details">
              <div class="username">{{ userStore.username }}</div>
              <div class="role">医生</div>
            </div>
          </div>
        

        </div>

        <el-menu
          :default-active="$route.path"
          class="sidebar-menu"
          router
          unique-opened
        >
          <el-menu-item index="/dashboard/consultation" class="menu-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>病症询问</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/practice" class="menu-item">
            <el-icon><Trophy /></el-icon>
            <span>日常练习</span>
          </el-menu-item>
        </el-menu>

        <div class="sidebar-footer">
          <el-button 
            @click="logout" 
            type="danger" 
            size="small" 
            class="logout-btn"
          >
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  ChatDotRound,
  Trophy,
  SwitchButton,
  Monitor
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const activeIndex = ref('/dashboard/consultation')
const userAvatar = ref('')

const userStore = computed(() => authStore)



const logout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  background: #f5f7fa;
}

.dashboard-layout {
  height: 100%;
}

.sidebar {
  background: linear-gradient(180deg, #2c5aa0 0%, #1e3d72 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(44, 90, 160, 0.15);
  position: relative;
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  pointer-events: none;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.logo-icon {
  font-size: 28px;
  color: #5dade2;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #5dade2, #3498db);
}

.user-details {
  flex: 1;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 2px;
}

.role {
  font-size: 12px;
  color: #bdc3c7;
}

.sidebar-menu {
  flex: 1;
  border: none;
  background: transparent;
  padding: 20px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 16px;
  border-radius: 8px;
  color: #bdc3c7;
  transition: all 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(93, 173, 226, 0.2);
  color: white;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #5dade2, #3498db);
  color: white;
  box-shadow: 0 4px 12px rgba(93, 173, 226, 0.3);
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  margin-right: 8px;
  font-size: 18px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.zoom-btn {
  width: 100%;
  margin-top: 15px;
  background: linear-gradient(135deg, #4fc3f7, #29b6f6);
  border: none;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(79, 195, 247, 0.3);
}

.zoom-btn:hover {
  background: linear-gradient(135deg, #29b6f6, #0288d1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4);
}

.logout-btn {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  border: none;
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.logout-btn:hover {
  background: linear-gradient(135deg, #ff5252, #e53935);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}



.main-content {
  padding: 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(44, 90, 160, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(93, 173, 226, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.content-wrapper {
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 200px !important;
  }
  
  .logo-text {
    font-size: 16px;
  }
  
  .sidebar-menu :deep(.el-menu-item) {
    margin: 4px 12px;
  }
}
</style>