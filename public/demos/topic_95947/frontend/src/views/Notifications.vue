<template>
  <div class="notifications-page">
    <div class="page-header">
      <div class="header-left">
        <h2>通知中心</h2>
        <p>管理系统通知和消息提醒</p>
      </div>
      <div class="header-right">
        <el-button @click="markAllRead">
          <i class="fas fa-check"></i> 全部已读
        </el-button>
        <el-button @click="clearAll">
          <i class="fas fa-trash"></i> 清空通知
        </el-button>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-number">{{ notifications.length }}</span>
        <span class="stat-label">全部通知</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ unreadCount }}</span>
        <span class="stat-label">未读通知</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ orderNotifications.length }}</span>
        <span class="stat-label">订单通知</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ inventoryNotifications.length }}</span>
        <span class="stat-label">库存预警</span>
      </div>
    </div>

    <div class="filter-tabs">
      <el-button :class="['filter-tab', { active: activeFilter === 'all' }]"
        @click="activeFilter = 'all'">全部</el-button>
      <el-button :class="['filter-tab', { active: activeFilter === 'unread' }]"
        @click="activeFilter = 'unread'">未读</el-button>
      <el-button :class="['filter-tab', { active: activeFilter === 'order' }]"
        @click="activeFilter = 'order'">订单通知</el-button>
      <el-button :class="['filter-tab', { active: activeFilter === 'inventory' }]"
        @click="activeFilter = 'inventory'">库存预警</el-button>
      <el-button :class="['filter-tab', { active: activeFilter === 'member' }]"
        @click="activeFilter = 'member'">会员提醒</el-button>
      <el-button :class="['filter-tab', { active: activeFilter === 'marketing' }]"
        @click="activeFilter = 'marketing'">营销提醒</el-button>
    </div>

    <div class="notifications-list">
      <div v-for="notification in filteredNotifications" :key="notification.id"
        :class="['notification-item', { unread: !notification.read }]" @click="markAsRead(notification)">
        <div class="notification-icon" :class="notification.type">
          <i :class="getIcon(notification.type)"></i>
        </div>
        <div class="notification-content">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.message }}</p>
          <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
        </div>
        <div class="notification-status">
          <span v-if="!notification.read" class="unread-dot"></span>
          <el-button size="small" @click.stop="markAsRead(notification)">标记已读</el-button>
        </div>
      </div>
    </div>

    <div v-if="filteredNotifications.length === 0" class="empty-state">
      <i class="fas fa-bell-slash"></i>
      <p>暂无通知</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const activeFilter = ref('all')

const notifications = ref([
  { id: 1, type: 'order', title: '新订单提醒', message: '订单 #20240115007 已创建，金额 ¥128.00', read: false, created_at: '2024-01-15 14:35:00' },
  { id: 2, type: 'order', title: '订单完成', message: '订单 #20240115001 已完成', read: false, created_at: '2024-01-15 14:32:00' },
  { id: 3, type: 'inventory', title: '库存预警', message: '招牌红烧肉原料库存不足，当前库存 5 份', read: true, created_at: '2024-01-15 14:30:00' },
  { id: 4, type: 'member', title: '会员生日提醒', message: '会员张三即将过生日，建议发送祝福', read: true, created_at: '2024-01-15 14:25:00' },
  { id: 5, type: 'marketing', title: '节日营销提醒', message: '春节即将到来，建议制定促销活动', read: false, created_at: '2024-01-15 14:20:00' },
  { id: 6, type: 'order', title: '订单取消', message: '订单 #20240115003 已取消', read: true, created_at: '2024-01-15 14:15:00' },
  { id: 7, type: 'inventory', title: '库存预警', message: '酸辣土豆丝原料库存不足，当前库存 10 份', read: true, created_at: '2024-01-15 14:10:00' },
  { id: 8, type: 'member', title: '高价值会员识别', message: '识别到新的高价值会员：李四', read: false, created_at: '2024-01-15 14:05:00' }
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const orderNotifications = computed(() => notifications.value.filter(n => n.type === 'order'))
const inventoryNotifications = computed(() => notifications.value.filter(n => n.type === 'inventory'))

const filteredNotifications = computed(() => {
  let result = notifications.value
  switch (activeFilter.value) {
    case 'unread':
      result = result.filter(n => !n.read)
      break
    case 'order':
      result = result.filter(n => n.type === 'order')
      break
    case 'inventory':
      result = result.filter(n => n.type === 'inventory')
      break
    case 'member':
      result = result.filter(n => n.type === 'member')
      break
    case 'marketing':
      result = result.filter(n => n.type === 'marketing')
      break
  }
  return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

function handleRealtimeNotification(event) {
  const notification = event.detail
  if (!notification?.title) return
  notifications.value.unshift({
    ...notification,
    id: notification.id || Date.now(),
    read: false,
    created_at: notification.created_at || new Date().toISOString()
  })
}

function getIcon(type) {
  const icons = {
    order: 'fas fa-shopping-bag',
    inventory: 'fas fa-box',
    member: 'fas fa-users',
    marketing: 'fas fa-bullhorn',
    system: 'fas fa-bell'
  }
  return icons[type] || 'fas fa-bell'
}

function formatTime(time) {
  const now = new Date()
  const date = new Date(time)
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return time.split(' ')[0]
}

function markAsRead(notification) {
  notification.read = true
}

function markAllRead() {
  notifications.value.forEach(n => n.read = true)
}

function clearAll() {
  notifications.value = []
}

onMounted(() => {
  window.addEventListener('app-notification', handleRealtimeNotification)
})

onUnmounted(() => {
  window.removeEventListener('app-notification', handleRealtimeNotification)
})
</script>

<style scoped>
.notifications-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.header-left p {
  color: #666;
  margin: 4px 0 0 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--ds-primary);
}

.stat-label {
  font-size: 13px;
  color: #888;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 10px 20px;
  border-radius: 20px;
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.filter-tab:hover {
  background: #e2e8f0;
}

.filter-tab.active {
  background: var(--ds-primary);
  color: white;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 4px solid transparent;
}

.notification-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.notification-item.unread {
  background: #f8fafc;
  border-left-color: var(--ds-primary);
}

.notification-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.notification-icon.order {
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-food));
}

.notification-icon.inventory {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.notification-icon.member {
  background: linear-gradient(135deg, #ec4899, #be185d);
}

.notification-icon.marketing {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.notification-icon.system {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.notification-content p {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>
