<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <AiFloatingButton v-if="showBusinessAssistant" />
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AiFloatingButton from './components/AiFloatingButton.vue';
import { useUserStore } from './stores/user';
import websocketService from './utils/websocket';

const route = useRoute();
const userStore = useUserStore();
const publicPaths = new Set(['/login', '/register']);
const showBusinessAssistant = computed(() => userStore.isLoggedIn && !publicPaths.has(route.path));

function pushNotification(type, title, message) {
  window.dispatchEvent(new CustomEvent('app-notification', {
    detail: {
      id: Date.now(),
      type,
      title,
      message,
      read: false,
      created_at: new Date().toISOString()
    }
  }));
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    websocketService.connect();
  }

  websocketService.on('order_created', (data) => {
    console.log('新订单通知:', data);
    pushNotification('order', '新订单提醒', `订单 ${data?.order_no || ''} 已创建`);
  });

  websocketService.on('order_status_changed', (data) => {
    console.log('订单状态变更:', data);
    pushNotification('order', '订单状态变更', `订单 ${data?.order_no || ''} 状态已更新`);
  });

  websocketService.on('inventory_alert', (data) => {
    console.log('库存预警:', data);
    pushNotification('inventory', '库存预警', data?.message || '存在低库存商品，请及时补货');
  });

  websocketService.on('member_warning', (data) => {
    console.log('会员提醒:', data);
    pushNotification('member', '会员提醒', data?.message || '存在需要关注的会员运营事项');
  });

  websocketService.on('marketing_reminder', (data) => {
    console.log('营销提醒:', data);
    pushNotification('marketing', '营销提醒', data?.message || '建议查看近期营销机会');
  });
});

watch(
  () => userStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      websocketService.connect();
      return;
    }
    websocketService.disconnect();
  },
  { immediate: false }
);

onUnmounted(() => {
  websocketService.disconnect();
});
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, sans-serif;
  background-color: var(--ds-bg);
  min-height: 100vh;
}

#app {
  min-height: 100vh;

}

button .fas {
  margin-right: 4px;
}

.driver-overlay {
  cursor: not-allowed;
}

.driver-active-element {
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2), 0 18px 45px rgba(15, 23, 42, 0.24) !important;
}

.business-spotlight-popover {
  max-width: 360px;
  border-radius: 18px;
  padding: 4px;
  color: #0f172a;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}

.business-spotlight-popover .driver-popover-title {
  font-size: 17px;
  font-weight: 850;
  line-height: 1.4;
}

.business-spotlight-popover .driver-popover-description {
  color: #475569;
  font-size: 14px;
  line-height: 1.7;
}

.business-spotlight-popover .driver-popover-progress-text {
  color: #94a3b8;
  font-size: 12px;
}

.business-spotlight-popover .driver-popover-footer {
  gap: 8px;
}

.business-spotlight-popover .driver-popover-prev-btn,
.business-spotlight-popover .driver-popover-next-btn {
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  text-shadow: none;
}

.business-spotlight-popover .driver-popover-next-btn {
  border-color: #f97316;
  color: white;
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.business-spotlight-popover .driver-popover-prev-btn {
  color: #475569;
  background: #f8fafc;
}
</style>
