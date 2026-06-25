import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // 路径别名配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // 开发服务器配置
    server: {
      port: 3000,
      open: true,
      // API 代理配置
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
        // ===== 政府官方渠道代理（解决CORS）=====
        // 1. 国家市场监督管理总局 — 产品召回
        '/api-official/samr/recall': {
          target: 'https://www.samr.gov.cn:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace('/api-official/samr/recall', '/zlfzj/qxcpzh/zhdt/index.html'),
          headers: {
            'Accept': 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9',
          },
          configure: (proxy) => {
            proxy.on('error', () => console.warn('[Official] 市场监管总局(SAMR) 连接失败'));
          },
        },
        // 2. 召回中心 — 消费品召回
        '/api-official/samrdprc/consumer': {
          target: 'https://www.samrdprc.org.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace('/api-official/samrdprc/consumer', '/xfpzh/xfpgnzh/index.html'),
          headers: { 'Accept': 'text/html' },
          configure: (proxy) => {
            proxy.on('error', () => console.warn('[Official] 召回中心连接失败'));
          },
        },
        // 3. 国家卫生健康委员会 — 新闻发布
        '/api-official/nhc/news': {
          target: 'http://www.nhc.gov.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace('/api-official/nhc/news', '/xcs/c100122/new_list.shtml'),
          headers: { 'Accept': 'text/html' },
          configure: (proxy) => {
            proxy.on('error', () => console.warn('[Official] 卫健委(NHC) 连接失败'));
          },
        },
        // 4. 中国疾病预防控制中心 — 中心要闻
        '/api-official/cdc/news': {
          target: 'https://www.chinacdc.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace('/api-official/cdc/news', '/zxyw/index.html'),
          headers: { 'Accept': 'text/html' },
          configure: (proxy) => {
            proxy.on('error', () => console.warn('[Official] 疾控中心(CDC) 连接失败'));
          },
        },
        // 5. 国家药品监督管理局 — 产品召回
        '/api-official/nmpa/recall': {
          target: 'https://www.nmpa.gov.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace('/api-official/nmpa/recall', '/xxgk/chpzhh/index.html'),
          headers: { 'Accept': 'text/html' },
          configure: (proxy) => {
            proxy.on('error', () => console.warn('[Official] 药监局(NMPA) 连接失败'));
          },
        },
      },
    },

    // 构建优化配置
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development', // 仅在开发环境生成 sourcemap
      // 代码分割策略
      rollupOptions: {
        output: {
          manualChunks: {
            // React 核心库单独打包
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // 工具库单独打包
            utils: ['axios', 'dayjs', 'echarts'],
          },
          // 文件名哈希
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      // 压缩配置（生产环境默认启用）
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // 生产环境移除 console
          drop_debugger: mode === 'production',
        },
      },
      // chunk 大小警告限制（KB）
      chunkSizeWarningLimit: 1000,
    },

    // CSS 配置
    css: {
      devSourcemap: true,
    },

    // 依赖优化配置
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios', 'dayjs'],
    },
  };
});