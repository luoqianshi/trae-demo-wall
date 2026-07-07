/* ============================================================
 * App 入口 - Vue 应用、路由、根组件
 * ============================================================ */
const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// 根组件：顶栏 + 路由出口 + 设置抽屉 + Toast
const App = {
  name: 'App',
  computed: {
    statusText(){ return store.statusText; },
    statusClass(){ return store.statusClass; },
    toasts(){ return store.toasts; },
    loading(){ return store.loading; },
  },
  methods: {
    openDrawer(){ store.drawerOpen = true; },
    goLibrary(){ this.$router.push('/library'); },
    goHome(){ this.$router.push('/'); },
  },
  template: `
  <div>
    <!-- 加载遮罩：数据库加载完成前显示 -->
    <div v-if="loading" class="app-loading-overlay">
      <div class="app-loading-spinner"></div>
      <p>正在从数据库加载数据...</p>
    </div>

    <!-- 顶栏 -->
    <header class="topbar">
      <div class="brand" @click="goHome">
        <div class="logo">灵</div>
        <div>灵笔 <span>AI</span> 小说生成器</div>
      </div>
      <div class="top-actions">
        <div class="status-display">
          <div class="status-dot" :class="statusClass"></div>
          <span>{{ statusText }}</span>
        </div>
        <button class="btn btn-ghost btn-sm" @click="openDrawer">设置</button>
        <button class="btn btn-ghost btn-sm" @click="goLibrary">书架</button>
      </div>
    </header>

    <!-- 路由出口 -->
    <router-view v-slot="{ Component }">
      <transition name="page">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- 设置抽屉 -->
    <settings-drawer></settings-drawer>

    <!-- Toast -->
    <div class="toast-wrap">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">{{ t.msg }}</div>
    </div>
  </div>
  `,
};

// 路由配置
const routes = [
  { path: '/', component: HomePage },
  { path: '/create', component: CreatePage },
  { path: '/novel/:id', component: NovelPage },
  { path: '/chapter/:novelId/:chapIdx', component: ChapterPage },
  { path: '/reader/:novelId/:chapIdx?', component: ReaderPage },
  { path: '/library', component: LibraryPage },
  // 旧路由保留兼容
  { path: '/config', component: ConfigPage },
  { path: '/generate', component: GeneratePage },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 创建应用
const app = createApp(App);
app.component('app-icon', AppIcon);
app.component('settings-drawer', SettingsDrawer);
app.component('Workshop', Workshop);

// P2-5: 注册 v-click-outside 指令（用于导出下拉菜单外部点击关闭）
app.directive('click-outside', {
  beforeMount(el, binding){
    el._clickOutside = (event) => {
      if(!(el === event.target || el.contains(event.target))){
        if(typeof binding.value === 'function') binding.value(event);
      }
    };
    document.addEventListener('click', el._clickOutside, true);
  },
  unmounted(el){
    document.removeEventListener('click', el._clickOutside, true);
  },
});

app.use(router);

// 初始化 store：等待数据库加载完成后再挂载 Vue
// 为什么 await：确保组件挂载时 store 已有数据，避免空状态闪烁
store.init().then(() => {
  app.mount('#app');
});
