import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { RequireAuth } from './components/auth/RequireAuth'
import { PageLoader } from './components/ui/page-loader'
import { NotFound } from './pages/NotFound'

// 路由懒加载：按需加载页面组件，减小首屏 bundle 体积
const ModelConfig = lazy(() => import('./pages/ModelConfig').then(m => ({ default: m.ModelConfig })))
const BotConfig = lazy(() => import('./pages/BotConfig').then(m => ({ default: m.BotConfig })))
const Knowledge = lazy(() => import('./pages/Knowledge').then(m => ({ default: m.Knowledge })))
const Memory = lazy(() => import('./pages/Memory').then(m => ({ default: m.Memory })))
const LocalChat = lazy(() => import('./pages/LocalChat').then(m => ({ default: m.LocalChat })))

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<LocalChat />} />
          <Route path="model-config" element={<ModelConfig />} />
          <Route path="bot-config" element={<BotConfig />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="memory" element={<Memory />} />
          <Route path="local-chat" element={<LocalChat />} />
          {/* 404 兜底 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App