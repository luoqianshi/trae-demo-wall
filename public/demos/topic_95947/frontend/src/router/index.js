import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/components/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true, title: '仪表盘' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { requiresAuth: true, title: '商家信息' }
      },
      {
        path: 'stores',
        name: 'Stores',
        component: () => import('@/views/Stores.vue'),
        meta: { requiresAuth: true, title: '门店管理' }
      },
      {
        path: 'employee-permissions',
        name: 'EmployeePermissions',
        component: () => import('@/views/EmployeePermissions.vue'),
        meta: { requiresAuth: true, title: '员工权限' }
      },
      {
        path: 'table-management',
        name: 'TableManagement',
        component: () => import('@/views/TableManagement.vue'),
        meta: { requiresAuth: true, title: '桌台管理' }
      },
      {
        path: 'pos-cashier',
        name: 'POSCashier',
        component: () => import('@/views/POSCashier.vue'),
        meta: { requiresAuth: true, title: '堂食 POS 收银台' }
      },
      {
        path: 'payment-reconciliation',
        name: 'PaymentReconciliation',
        component: () => import('@/views/PaymentReconciliation.vue'),
        meta: { requiresAuth: true, title: '支付对账' }
      },
      {
        path: 'kitchen-kds',
        name: 'KitchenKDS',
        component: () => import('@/views/KitchenKDS.vue'),
        meta: { requiresAuth: true, title: '厨房/KDS' }
      },
      {
        path: 'purchase-suppliers',
        name: 'PurchaseSuppliers',
        component: () => import('@/views/PurchaseSuppliers.vue'),
        meta: { requiresAuth: true, title: '采购/供应商' }
      },
      {
        path: 'financial-reports',
        name: 'FinancialReports',
        component: () => import('@/views/FinancialReports.vue'),
        meta: { requiresAuth: true, title: '财务报表' }
      },
      {
        path: 'coupon-redemption',
        name: 'CouponRedemption',
        component: () => import('@/views/CouponRedemption.vue'),
        meta: { requiresAuth: true, title: '优惠券核销' }
      },
      {
        path: 'delivery-platforms',
        name: 'DeliveryPlatforms',
        component: () => import('@/views/DeliveryPlatforms.vue'),
        meta: { requiresAuth: true, title: '外卖平台' }
      },
      {
        path: 'audit-risk',
        name: 'AuditRisk',
        component: () => import('@/views/AuditRisk.vue'),
        meta: { requiresAuth: true, title: '审计风控' }
      },
      {
        path: 'ai-assistant',
        name: 'AIAssistant',
        component: () => import('@/views/AIAssistant.vue'),
        meta: { requiresAuth: true, title: 'AI助手' }
      },
      {
        path: 'ai-actions',
        name: 'AIActionCenter',
        component: () => import('@/views/AIActionCenter.vue'),
        meta: { requiresAuth: true, title: 'AI 任务中心' }
      },
      {
        path: 'operations',
        name: 'Operations',
        component: () => import('@/views/Operations.vue'),
        meta: { requiresAuth: true, title: '运营方案' }
      },
      {
        path: 'competitors',
        name: 'Competitors',
        component: () => import('@/views/Competitors.vue'),
        meta: { requiresAuth: true, title: '竞品分析' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue'),
        meta: { requiresAuth: true, title: '数据分析' }
      },
      {
        path: 'data-input',
        name: 'DataInput',
        component: () => import('@/views/DataInput.vue'),
        meta: { requiresAuth: true, title: '数据录入' }
      },
      {
        path: 'ai-config',
        name: 'AIConfig',
        component: () => import('@/views/AIConfig.vue'),
        meta: { requiresAuth: true, title: 'AI配置' }
      },
      {
        path: 'menu',
        name: 'Menu',
        component: () => import('@/views/Menu.vue'),
        meta: { requiresAuth: true, title: '菜单管理' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { requiresAuth: true, title: '订单管理' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { requiresAuth: true, title: '通知中心' }
      },
      {
        path: 'analytics-report',
        name: 'AnalyticsReport',
        component: () => import('@/views/AnalyticsReport.vue'),
        meta: { requiresAuth: true, title: '数据分析报告' }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/MemberCenter.vue'),
        meta: { requiresAuth: true, title: '会员中心' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (!to.meta.requiresAuth && userStore.isLoggedIn && to.path === '/login') {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
