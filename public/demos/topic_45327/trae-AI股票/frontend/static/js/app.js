/**
 * AI智股 - Vue 应用入口
 */
const app = Vue.createApp({
  data() {
    return {
      // 全局共享状态：数据路径与最近一次训练结果
      trainPath: null,
      testPath: null,
      lastResult: null,
    };
  },
});

// 注册全局组件
app.component("chart-panel", window.ChartPanel);
app.component("file-upload", window.FileUpload);
app.component("param-panel", window.ParamPanel);

// 注册路由
app.use(window.router);

app.mount("#app");
