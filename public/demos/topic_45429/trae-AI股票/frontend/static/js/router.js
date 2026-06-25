/**
 * Vue Router 路由配置
 */
const routes = [
  { path: "/", name: "home", component: window.HomeView },
  { path: "/data", name: "data", component: window.DataUploadView },
  { path: "/train", name: "train", component: window.ModelTrainingView },
  { path: "/visualize", name: "visualize", component: window.VisualizationView },
  { path: "/disclaimer", name: "disclaimer", component: window.DisclaimerView },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

window.router = router;
