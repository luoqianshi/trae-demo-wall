import { createRouter, createWebHistory } from 'vue-router'
import Welcome from '@/views/Welcome.vue'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue')
  },
  {
    path: '/my-shop',
    name: 'MyShop',
    component: () => import('@/views/MyShop.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import('@/views/Collections.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-coupons',
    name: 'MyCoupons',
    component: () => import('@/views/MyCoupons.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue')
  },
  {
    path: '/shop/:id',
    name: 'ShopDetail',
    component: () => import('@/views/ShopDetail.vue')
  },
  {
    path: '/merchant-onboarding',
    name: 'MerchantOnboarding',
    component: () => import('@/views/MerchantOnboarding.vue')
  },
  {
    path: '/student-certification',
    name: 'StudentCertification',
    component: () => import('@/views/StudentCertification.vue')
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/Chat.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/views/Checkout.vue')
  },
  {
    path: '/pay/success',
    name: 'PaySuccess',
    component: () => import('@/views/PaySuccess.vue')
  },
  {
    path: '/recharge',
    name: 'Recharge',
    component: () => import('@/views/Recharge.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/merchant',
    component: () => import('@/views/Merchant/Layout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'MerchantDashboard',
        component: () => import('@/views/Merchant/Dashboard.vue'),
        meta: { title: '控制台', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'products',
        name: 'MerchantProducts',
        component: () => import('@/views/Merchant/Products.vue'),
        meta: { title: '商品管理', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'product-edit/:id?',
        name: 'MerchantProductEdit',
        component: () => import('@/views/Merchant/ProductEdit.vue'),
        meta: { title: '编辑商品', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'orders',
        name: 'MerchantOrders',
        component: () => import('@/views/Merchant/Orders.vue'),
        meta: { title: '订单管理', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'refunds',
        name: 'MerchantRefunds',
        component: () => import('@/views/Merchant/Refunds.vue'),
        meta: { title: '退款审核', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'info',
        name: 'MerchantInfo',
        component: () => import('@/views/Merchant/Info.vue'),
        meta: { title: '商户信息', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'onboarding',
        name: 'MerchantOnboardingStatus',
        component: () => import('@/views/Merchant/Onboarding.vue'),
        meta: { title: '商家认证', requiresAuth: true, role: 'merchant' }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/views/Admin/Layout.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/Admin/Dashboard.vue'),
        meta: { title: '平台概况', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/Admin/Users.vue'),
        meta: { title: '用户管理', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'merchants',
        name: 'AdminMerchants',
        component: () => import('@/views/Admin/Merchants.vue'),
        meta: { title: '商家审核', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/Admin/Categories.vue'),
        meta: { title: '分类管理', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'products',
        name: 'AdminProducts',
        component: () => import('@/views/Admin/Products.vue'),
        meta: { title: '商品管理', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/Admin/Orders.vue'),
        meta: { title: '订单管理', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'coupons',
        name: 'AdminMarketing',
        component: () => import('@/views/Admin/Coupons.vue'),
        meta: { title: '营销管理', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'reviews',
        name: 'AdminReviews',
        component: () => import('@/views/Admin/Reviews.vue'),
        meta: { title: '评价管理', requiresAuth: true, role: 'admin' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userInfoStr = localStorage.getItem('userInfo')
  let userInfo = null
  try {
    userInfo = userInfoStr ? JSON.parse(userInfoStr) : null
  } catch (e) {
    userInfo = null
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  // 2. 角色校验
  if (to.meta.role) {
    if (!userInfo) return next('/login')
    
    // 管理员校验
    if (to.meta.role === 'admin') {
      if (userInfo.user_type !== 3) {
        return next('/')
      }
    }
    
    // 商家校验
    if (to.meta.role === 'merchant') {
      // 只要是商户类型，且商户信息中的状态为 1 (审核通过)，才允许进入
      if (userInfo.user_type === 2) {
        if (userInfo.merchant_info && userInfo.merchant_info.status == 1) {
          return next()
        } else {
          // 如果是商家但未通过审核，重定向到首页或提示页面
          return next('/')
        }
      } else {
        // 非商家账号尝试访问商家后台
        return next('/')
      }
    }
  }

  next()
})

export default router
