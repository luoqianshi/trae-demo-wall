import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api/doubao': {
          target: env.VITE_DOUBAO_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/doubao/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (env.VITE_DOUBAO_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${env.VITE_DOUBAO_API_KEY}`)
              }
            })
          }
        }
      }
    }
  }
})
