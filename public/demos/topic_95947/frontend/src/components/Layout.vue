<template>
  <div class="app-layout" :class="{ 'nav-open': mobileNavOpen, 'sidebar-collapsed': sidebarCollapsed }">
    <aside class="sidebar" aria-label="主导航">
      <button class="logo logo-button" type="button" data-guide="layout-logo" @click="navigate('/dashboard')">
        <i class="fas fa-store"></i>
        <div>
          <h1>商家运营系统</h1>
          <p>AI 经营驾驶舱</p>
        </div>
      </button>
      <button class="sidebar-collapse-btn" type="button" :aria-label="sidebarCollapsed ? '展开菜单' : '折叠菜单'"
        :title="sidebarCollapsed ? '展开菜单' : '折叠菜单'" @click="sidebarCollapsed = !sidebarCollapsed">
        <i :class="sidebarCollapsed ? 'fas fa-angles-right' : 'fas fa-angles-left'"></i>
      </button>

      <nav class="sidebar-nav" aria-label="菜单分组">
        <section v-for="item in standaloneNavItems" :key="item.path"
          :class="['nav-group', 'nav-single', { active: activeMenu === item.path }]">
          <button class="nav-group-trigger nav-single-trigger" type="button" :data-guide="getNavGuideKey(item.path)"
            :aria-current="activeMenu === item.path ? 'page' : undefined" :title="sidebarCollapsed ? item.label : undefined"
            @click="navigate(item.path)">
            <span class="nav-group-icon"><i :class="item.icon"></i></span>
            <span class="nav-group-copy">
              <span class="nav-group-title">{{ item.label }}</span>
              <span class="nav-group-desc">{{ item.description }}</span>
            </span>
          </button>
        </section>

        <section v-for="group in navGroups" :key="group.title"
          :class="['nav-group', { open: isGroupOpen(group.title), active: groupHasActive(group) }]">
          <button class="nav-group-trigger" type="button" :aria-expanded="!sidebarCollapsed && isGroupOpen(group.title)"
            :aria-controls="`nav-panel-${group.key}`" :data-guide="`nav-group-${group.key}`"
            :title="sidebarCollapsed ? group.title : undefined"
            @click="toggleGroup(group.title)">
            <span class="nav-group-icon"><i :class="group.icon"></i></span>
            <span class="nav-group-copy">
              <span class="nav-group-title">{{ group.title }}</span>
              <span class="nav-group-desc">{{ group.description }} · {{ group.items.length }}项</span>
            </span>
            <i class="fas fa-chevron-down nav-group-arrow"></i>
          </button>

          <Transition name="nav-submenu">
            <div v-show="!sidebarCollapsed && isGroupOpen(group.title)" :id="`nav-panel-${group.key}`"
              class="nav-submenu">
              <button v-for="item in group.items" :key="item.path" type="button"
                :class="['sidebar-item', { active: activeMenu === item.path }]" :data-guide="getNavGuideKey(item.path)"
                :aria-current="activeMenu === item.path ? 'page' : undefined" @click="navigate(item.path)">
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </Transition>
        </section>
      </nav>

      <div class="sidebar-footer">
        <button class="user-info user-info-button" type="button" data-guide="layout-profile"
          @click="navigate(profilePath)">
          <div class="avatar"><i class="fas fa-user"></i></div>
          <div>
            <p>{{ merchantName }}</p>
            <p class="user-role">经营者</p>
          </div>
        </button>
      </div>
    </aside>

    <button class="mobile-mask" aria-label="关闭导航" @click="mobileNavOpen = false"></button>

    <main ref="mainContentRef" class="main-content" tabindex="-1">
      <header class="page-header">
        <button class="mobile-menu-btn" aria-label="打开导航" @click="mobileNavOpen = true">
          <i class="fas fa-bars"></i>
        </button>
        <div class="header-left">
          <el-breadcrumb class="page-breadcrumb" separator="/">
            <el-breadcrumb-item v-for="crumb in breadcrumbItems" :key="`${crumb.label}-${crumb.path || 'current'}`">
              <button v-if="crumb.path" class="breadcrumb-link" type="button" @click="navigate(crumb.path)">
                {{ crumb.label }}
              </button>
              <span v-else>{{ crumb.label }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
          <h2>{{ currentTitle }}</h2>
          <p>{{ currentSubtitle }}</p>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <i class="fas fa-user-circle"></i>
              <span>{{ merchantName }}</span>
              <i class="fas fa-chevron-down"></i>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">商家信息</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <div class="content-wrapper">
        <router-view v-slot="{ Component, route: viewRoute }">
          <Transition :name="viewRoute.meta.transition || 'page-fade-slide'" mode="out-in">
            <component :is="Component" :key="viewRoute.meta.viewKey || viewRoute.name || viewRoute.path" />
          </Transition>
        </router-view>
      </div>

      <nav class="bottom-nav" aria-label="移动端快捷导航">
        <button v-for="item in bottomNavItems" :key="item.path"
          :class="['bottom-nav-item', { active: activeMenu === item.path }]" @click="navigate(item.path)">
          <i :class="item.icon"></i>
          <span>{{ item.shortLabel || item.label }}</span>
        </button>
      </nav>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSpotlightGuide } from '@/composables/useSpotlightGuide'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { cleanupDriver } = useSpotlightGuide()
const mobileNavOpen = ref(false)
const sidebarCollapsed = ref(false)
const mainContentRef = ref(null)
const profilePath = '/profile'

const standaloneNavItems = [
  {
    path: '/dashboard',
    label: '经营首页',
    shortLabel: '首页',
    description: '经营总览',
    icon: 'fas fa-chart-pie',
    subtitle: '今日结论、风险和下一步行动'
  }
]

const navGroups = [
  {
    key: 'core',
    title: '核心经营',
    description: '高频看板',
    icon: 'fas fa-compass',
    items: [
      { path: '/ai-actions', label: 'AI任务中心', shortLabel: '任务', icon: 'fas fa-list-check', subtitle: '管理待执行、执行中、待复盘的行动卡' },
      { path: '/analytics', label: '数据看板', shortLabel: '看板', icon: 'fas fa-chart-line', subtitle: '查看经营趋势、指标和分析报告' }
    ]
  },
  {
    key: 'frontdesk',
    title: '前厅履约',
    description: '点单收银',
    icon: 'fas fa-cash-register',
    items: [
      { path: '/orders', label: '订单管理', icon: 'fas fa-shopping-bag', subtitle: '查看订单列表和订单状态' },
      { path: '/table-management', label: '桌台管理', icon: 'fas fa-chair', subtitle: '管理堂食区域、桌台状态和开台换台流程' },
      { path: '/pos-cashier', label: '堂食 POS 收银台', shortLabel: 'POS', icon: 'fas fa-cash-register', subtitle: '完成堂食点单、挂单、继续编辑和结账' },
      { path: '/payment-reconciliation', label: '支付对账', icon: 'fas fa-receipt', subtitle: '核对 POS 支付流水、渠道汇总、日对账和异常差异' },
      { path: '/kitchen-kds', label: '厨房/KDS', icon: 'fas fa-fire-burner', subtitle: '跟踪后厨待制、制作中、已出餐和催菜任务' }
    ]
  },
  {
    key: 'operations',
    title: '经营配置',
    description: '菜单门店',
    icon: 'fas fa-briefcase',
    items: [
      { path: '/data-input', label: '数据录入', icon: 'fas fa-file-alt', subtitle: '录入订单、销售和经营数据' },
      { path: '/operations', label: '运营方案', icon: 'fas fa-bullhorn', subtitle: '创建营销和经营方案' },
      { path: '/menu', label: '菜单管理', icon: 'fas fa-utensils', subtitle: '管理菜品、分类和图片' },
      { path: '/members', label: '会员中心', icon: 'fas fa-users', subtitle: '管理会员、等级和复购' },
      { path: '/stores', label: '门店管理', icon: 'fas fa-building', subtitle: '维护门店资料和营业信息' },
      { path: '/employee-permissions', label: '员工权限', icon: 'fas fa-user-shield', subtitle: '管理员工账号、门店授权和角色权限' }
    ]
  },
  {
    key: 'finance',
    title: '供应财务',
    description: '成本风控',
    icon: 'fas fa-scale-balanced',
    items: [
      { path: '/purchase-suppliers', label: '采购/供应商', icon: 'fas fa-truck-field', subtitle: '管理供应商、采购单、入库成本和收货状态' },
      { path: '/financial-reports', label: '财务报表', icon: 'fas fa-chart-column', subtitle: '汇总收款、退款、采购成本、毛利和客单价' },
      { path: '/coupon-redemption', label: '优惠券核销', icon: 'fas fa-ticket', subtitle: '维护券模板、发券试算和核销基础闭环' },
      { path: '/delivery-platforms', label: '外卖平台', icon: 'fas fa-motorcycle', subtitle: '记录平台店铺、平台订单和团购券码' },
      { path: '/audit-risk', label: '审计风控', icon: 'fas fa-shield-halved', subtitle: '查看敏感操作日志和经营风险提醒' }
    ]
  },
  {
    key: 'system',
    title: '系统设置',
    description: '配置洞察',
    icon: 'fas fa-sliders',
    items: [
      { path: '/ai-assistant', label: 'AI助手', icon: 'fas fa-robot', subtitle: '随时提问，获得经营建议' },
      { path: '/competitors', label: '市场洞察', icon: 'fas fa-search', subtitle: '分析竞品、趋势和机会' },
      { path: '/notifications', label: '通知中心', icon: 'fas fa-bell', subtitle: '查看系统和经营提醒' },
      { path: '/profile', label: '商家信息', icon: 'fas fa-user-circle', subtitle: '管理商家基础资料' },
      { path: '/ai-config', label: 'AI配置', icon: 'fas fa-cog', subtitle: '管理模型、Agent 和 AI 开关' }
    ]
  }
]

const routeGroup = computed(() => navGroups.find(group => group.items.some(item => item.path === route.path)))
const openGroupTitle = ref(routeGroup.value?.title || '')
const menuItems = computed(() => [...standaloneNavItems, ...navGroups.flatMap(group => group.items)])
const bottomNavItems = computed(() => [
  menuItems.value.find(item => item.path === '/dashboard'),
  menuItems.value.find(item => item.path === '/ai-actions'),
  menuItems.value.find(item => item.path === '/analytics'),
  menuItems.value.find(item => item.path === '/menu'),
  menuItems.value.find(item => item.path === '/ai-config')
].filter(Boolean))

const activeMenu = computed(() => route.path)
const currentMenu = computed(() => menuItems.value.find(item => item.path === route.path))
const currentTitle = computed(() => currentMenu.value?.label || route.meta.title || '商家运营系统')
const currentSubtitle = computed(() => currentMenu.value?.subtitle || '')
const merchantName = computed(() => localStorage.getItem('merchantName') || '测试商家')
const breadcrumbItems = computed(() => {
  const items = [{ label: '经营后台', path: route.path === '/dashboard' ? '' : '/dashboard' }]
  if (routeGroup.value?.title) {
    items.push({ label: routeGroup.value.title })
  }
  items.push({ label: currentTitle.value })
  return items
})

watch(
  () => route.path,
  async () => {
    cleanupDriver()
    openGroupTitle.value = routeGroup.value?.title || ''
    await nextTick()
    mainContentRef.value?.focus?.({ preventScroll: true })
  }
)

function isGroupOpen(title) {
  return openGroupTitle.value === title
}

function groupHasActive(group) {
  return group.items.some(item => item.path === route.path)
}

function toggleGroup(title) {
  if (sidebarCollapsed.value) {
    sidebarCollapsed.value = false
    openGroupTitle.value = title
    return
  }
  openGroupTitle.value = openGroupTitle.value === title ? '' : title
}

function getNavGuideKey(path) {
  const map = {
    '/dashboard': 'nav-dashboard',
    '/data-input': 'nav-data-input',
    '/ai-actions': 'nav-ai-actions',
    '/stores': 'nav-stores',
    '/menu': 'nav-menu'
  }
  return map[path]
}

function navigate(path) {
  mobileNavOpen.value = false
  if (route.path !== path) router.push(path)
}

function handleCommand(command) {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
    return
  }
  if (command === 'profile') router.push(profilePath)
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(180, 83, 9, 0.07), transparent 34%),
    var(--ds-bg);
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 268px;
  height: 100vh;
  color: white;
  background:
    linear-gradient(180deg, rgba(249, 115, 22, 0.08), transparent 28%),
    linear-gradient(180deg, var(--ds-sidebar) 0%, var(--ds-sidebar-2) 100%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 14px 0 36px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  transition: width 220ms cubic-bezier(.2, .8, .2, 1), transform 220ms cubic-bezier(.2, .8, .2, 1);
}

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.72), transparent 78%);
}

.logo {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 18px;
  border-bottom: 1px solid var(--ds-sidebar-border);
}

.sidebar-collapse-btn {
  position: absolute;
  top: 78px;
  right: -16px;
  z-index: 2;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  color: #fed7aa;
  background: #111827;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.24);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: transform var(--ds-motion-fast), background var(--ds-motion-fast);
}

.sidebar-collapse-btn:hover {
  background: #1f2937;
  transform: translateY(-1px);
}

.logo-button {
  width: 100%;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.logo-button:hover {
  background: rgba(255, 255, 255, 0.055);
}

.logo i {
  color: #fed7aa;
  font-size: 34px;
}

.logo h1 {
  font-size: 18px;
  font-weight: 850;
  margin: 0;
  white-space: nowrap;
}

.logo p {
  font-size: 12px;
  opacity: 0.82;
  margin: 4px 0 0;
}

.sidebar-nav {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-group {
  margin-bottom: 10px;
}

.nav-group-trigger {
  width: 100%;
  min-height: 60px;
  padding: 10px 11px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.045);
  display: grid;
  grid-template-columns: 42px 1fr 16px;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  transition: background var(--ds-motion-fast), border-color var(--ds-motion-fast), box-shadow var(--ds-motion-fast), transform var(--ds-motion-fast);
  overflow: hidden;
}

.nav-group-trigger:hover,
.nav-group.open .nav-group-trigger {
  background: rgba(255, 255, 255, 0.075);
  border-color: rgba(255, 255, 255, 0.16);
}

.nav-single-trigger {
  grid-template-columns: 42px 1fr;
}

.nav-group.active .nav-group-trigger {
  background: rgba(249, 115, 22, 0.11);
  border-color: rgba(251, 146, 60, 0.5);
  box-shadow: inset 3px 0 0 #f97316;
}

.nav-group-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  color: #fed7aa;
  background: rgba(255, 255, 255, 0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.nav-group.active .nav-group-icon {
  color: #fff7ed;
  background: rgba(249, 115, 22, 0.28);
}

.nav-group-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  opacity: 1;
  transform: translateX(0);
  transition: opacity 140ms ease, transform 180ms ease;
}

.nav-group-title {
  color: #fff;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.2;
  white-space: nowrap;
}

.nav-group-desc {
  color: rgba(255, 255, 255, 0.66);
  font-size: 12px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-group-arrow {
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  transition: transform 0.2s ease;
}

.nav-group.open .nav-group-arrow {
  transform: rotate(180deg);
}

.nav-submenu {
  position: relative;
  display: grid;
  gap: 3px;
  margin: 7px 0 0 18px;
  padding: 0 0 2px 13px;
  overflow: hidden;
}

.nav-submenu::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 8px;
  width: 1px;
  background: rgba(255, 255, 255, 0.16);
}

.sidebar-item {
  width: 100%;
  text-align: left;
  min-height: 38px;
  padding: 9px 12px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.9);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color var(--ds-motion-fast), background var(--ds-motion-fast), box-shadow var(--ds-motion-fast), transform var(--ds-motion-fast);
  font-size: 13px;
}

.sidebar-item:hover,
.sidebar-item.active {
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-item.active {
  color: #fff;
  background: rgba(249, 115, 22, 0.14);
  box-shadow: inset 3px 0 0 #fb923c;
  font-weight: 800;
}

.sidebar-item i {
  width: 20px;
  font-size: 16px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  position: relative;
  z-index: 1;
}

.user-info,
.user-dropdown,
.page-header {
  display: flex;
  align-items: center;
}

.user-info {
  gap: 12px;
}

.user-info-button {
  width: 100%;
  color: inherit;
  background: rgba(255, 255, 255, 0.06);
  border: 0;
  border-radius: 16px;
  padding: 8px;
  cursor: pointer;
  text-align: left;
  transition: background var(--ds-motion-fast), transform var(--ds-motion-fast);
}

.user-info-button:hover {
  background: rgba(255, 255, 255, 0.12);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info p {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.user-role {
  font-size: 12px !important;
  opacity: 0.75;
  font-weight: 400 !important;
}

.main-content {
  margin-left: 268px;
  min-height: 100vh;
  width: calc(100vw - 268px);
  background:
    radial-gradient(circle at 70% 0%, rgba(47, 111, 94, 0.045), transparent 32%),
    var(--ds-bg);
  display: flex;
  flex-direction: column;
  transition: margin-left var(--ds-motion-base), width var(--ds-motion-base);
}

.sidebar-collapsed .sidebar {
  width: 76px;
}

.sidebar-collapsed .main-content {
  margin-left: 76px;
  width: calc(100vw - 76px);
}

.sidebar-collapsed .logo {
  justify-content: center;
  padding: 18px 10px 16px;
}

.sidebar-collapsed .logo i {
  font-size: 28px;
}

.sidebar-collapsed .logo div,
.sidebar-collapsed .nav-group-copy,
.sidebar-collapsed .nav-group-arrow,
.sidebar-collapsed .sidebar-footer .user-info-button>div:not(.avatar) {
  width: 0;
  min-width: 0;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-6px);
  pointer-events: none;
}

.sidebar-collapsed .sidebar-nav {
  padding: 12px 10px;
}

.sidebar-collapsed .nav-group {
  margin-bottom: 8px;
}

.sidebar-collapsed .nav-group-trigger,
.sidebar-collapsed .nav-single-trigger {
  width: 48px;
  height: 48px;
  min-height: 48px;
  grid-template-columns: 1fr;
  justify-items: center;
  gap: 0;
  padding: 4px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
  box-shadow: none;
}

.sidebar-collapsed .nav-group-trigger:hover,
.sidebar-collapsed .nav-group.open .nav-group-trigger {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.16);
  transform: translateX(1px);
}

.sidebar-collapsed .nav-group.active .nav-group-trigger {
  background: rgba(249, 115, 22, 0.18);
  border-color: rgba(251, 146, 60, 0.42);
  box-shadow: inset 0 0 0 1px rgba(251, 146, 60, 0.2);
}

.sidebar-collapsed .nav-group-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  font-size: 14px;
}

.sidebar-collapsed .nav-submenu {
  display: none;
}

.sidebar-collapsed .sidebar-footer {
  display: flex;
  justify-content: center;
  padding: 12px 10px 14px;
}

.sidebar-collapsed .sidebar-collapse-btn {
  right: -16px;
}

.sidebar-collapsed .user-info {
  gap: 0;
}

.sidebar-collapsed .user-info-button {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 16px;
  overflow: hidden;
}

.sidebar-collapsed .avatar {
  width: 34px;
  height: 34px;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 60;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  background: rgba(255, 253, 250, 0.9);
  border-bottom: 1px solid var(--ds-border);
  backdrop-filter: blur(14px);
}

.header-left {
  flex: 1;
  min-width: 0;
}

.header-left h2 {
  font-size: 22px;
  font-weight: 850;
  color: var(--ds-text);
  margin: 0;
}

.header-left p {
  font-size: 13px;
  color: var(--ds-muted);
  margin: 4px 0 0;
}

.page-breadcrumb {
  margin-bottom: 7px;
  font-size: 12px;
}

.page-breadcrumb :deep(.el-breadcrumb__inner) {
  color: #8a6f57;
  font-weight: 650;
}

.page-breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--ds-text);
}

.page-breadcrumb :deep(.el-breadcrumb__separator) {
  color: #c7b9a8;
  font-weight: 500;
}

.breadcrumb-link {
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font: inherit;
  overflow: hidden;
}

.breadcrumb-link:hover {
  color: var(--ds-primary);
}

.user-dropdown {
  gap: 8px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
}

.mobile-menu-btn {
  display: none;
  border: 1px solid var(--ds-border);
  border-radius: 12px;
  background: white;
  width: 40px;
  height: 40px;
  color: var(--ds-primary);
}

.content-wrapper {
  flex: 1;
  padding: 24px;
  min-height: 0;
}

.nav-submenu-enter-active,
.nav-submenu-leave-active {
  transition:
    opacity var(--ds-motion-base),
    transform var(--ds-motion-base),
    max-height var(--ds-motion-base);
  transform-origin: top;
  max-height: 760px;
}

.nav-submenu-enter-from,
.nav-submenu-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.98);
  max-height: 0;
}

.page-fade-slide-enter-active,
.page-fade-slide-leave-active {
  transition: opacity 180ms cubic-bezier(.2, .8, .2, 1), transform 180ms cubic-bezier(.2, .8, .2, 1);
}

.page-fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.nav-group-trigger:focus-visible,
.sidebar-item:focus-visible,
.logo-button:focus-visible,
.user-info-button:focus-visible,
.mobile-menu-btn:focus-visible,
.breadcrumb-link:focus-visible {
  outline: 2px solid rgba(251, 146, 60, 0.88);
  outline-offset: 3px;
}

.bottom-nav,
.mobile-mask {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    width: 268px;
    transform: translateX(-100%);
    transition: transform var(--ds-motion-base);
  }

  .sidebar-collapsed .sidebar {
    width: 268px;
  }

  .sidebar-collapsed .logo div,
  .sidebar-collapsed .nav-group-copy,
  .sidebar-collapsed .nav-group-arrow,
  .sidebar-collapsed .sidebar-footer .user-info-button>div:not(.avatar) {
    display: flex;
  }

  .sidebar-collapsed .logo div,
  .sidebar-collapsed .sidebar-footer .user-info-button>div:not(.avatar) {
    display: block;
  }

  .sidebar-collapsed .nav-submenu {
    display: grid;
  }

  .sidebar-collapsed .nav-group-trigger,
  .sidebar-collapsed .nav-single-trigger {
    width: 100%;
    height: auto;
    grid-template-columns: 42px 1fr 16px;
    justify-items: stretch;
    min-height: 60px;
    padding: 10px 11px;
    gap: 10px;
    border-radius: 14px;
  }

  .sidebar-collapsed .nav-single-trigger {
    grid-template-columns: 42px 1fr;
  }

  .nav-open .sidebar {
    transform: translateX(0);
  }

  .mobile-mask {
    position: fixed;
    inset: 0;
    z-index: 90;
    border: 0;
    background: rgba(15, 23, 42, 0.36);
    animation: mask-fade 180ms ease-out;
  }

  .nav-open .mobile-mask {
    display: block;
  }

  .main-content {
    width: 100vw;
    margin-left: 0;
    padding-bottom: 70px;
  }

  .sidebar-collapse-btn {
    display: none;
  }

  .mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .content-wrapper {
    padding: 16px;
  }

  .header-right .user-dropdown span {
    display: none;
  }

  .bottom-nav {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: 10px;
    z-index: 80;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid var(--ds-border);
    border-radius: 20px;
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
  }

  .bottom-nav-item {
    border: 0;
    border-radius: 14px;
    padding: 7px 4px;
    color: var(--ds-muted);
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }

  .bottom-nav-item i {
    font-size: 16px;
  }

  .bottom-nav-item.active {
    color: var(--ds-primary);
    background: var(--ds-primary-soft);
    font-weight: 800;
  }
}

@keyframes mask-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {

  .nav-submenu-enter-active,
  .nav-submenu-leave-active,
  .page-fade-slide-enter-active,
  .page-fade-slide-leave-active,
  .sidebar,
  .mobile-mask {
    transition: none !important;
    animation: none !important;
  }
}
</style>
