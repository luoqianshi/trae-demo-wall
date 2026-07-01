import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { db } from './lib/db.ts'
import { seedDemoData, validateDataIntegrity } from './lib/demoData.ts'
import { startSummaryScheduler } from './lib/summaryScheduler'
import { warmupLLMConnection, probeBackendAvailable } from './lib/ai'

const root = document.getElementById('root')!

// 初始化期间显示加载提示，避免白屏
root.innerHTML = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#faf9f7;color:#4a4a4a;">
    <div style="text-align:center;">
      <div style="width:40px;height:40px;border:3px solid #e5e5e5;border-top-color:#c17c5b;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
      <p style="font-size:14px;">衡舟正在唤醒记忆…</p>
      <p style="font-size:12px;color:#888;margin-top:8px;">首次启动正在准备示例数据</p>
    </div>
  </div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
`

async function isDatabaseEmpty(): Promise<boolean> {
  const [personCount, memoryCount, diaryCount, interactionCount] = await Promise.all([
    db.persons.count(),
    db.memories.count(),
    db.diaries.count(),
    db.interactions.count(),
  ])
  return personCount === 0 && memoryCount === 0 && diaryCount === 0 && interactionCount === 0
}

function hasUserCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  return (
    localStorage.getItem('hengzhou-onboarding-done') === 'true' ||
    !!localStorage.getItem('hengzhou-user-profile')
  )
}

let bootstrapPromise: Promise<void> | null = null

async function bootstrapApp() {
  // StrictMode 守卫：防止开发环境下重复执行初始化
  // 使用 Promise 共享：如果第一次执行仍在进行中，第二次执行等待同一 Promise
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    try {
      // FIX: 启动时探测后端是否可用，HTML 体验版无后端时自动切换到离线 Demo 模式
      await probeBackendAvailable()

      const empty = await isDatabaseEmpty()
      const onboardingDone = hasUserCompletedOnboarding()

      if (empty) {
        // 数据库为空：无论 onboarding 状态如何，都需要重新初始化数据
        // （防止数据库被清空但 onboarding 标记残留导致数据丢失）
        if (onboardingDone) {
          console.warn('[Bootstrap] 数据库为空但 onboarding 标记存在（可能数据被意外清空），正在重新初始化 Demo 数据...')
        } else {
          console.log('[Bootstrap] 数据库为空且未完成作业，正在初始化 Demo 数据...')
        }
        await seedDemoData((current, total) => {
          console.log(`[Init] 正在构建记忆索引... ${current}/${total}`)
        })
      } else {
        console.log('[Bootstrap] 检测到已有用户数据，跳过 Demo 数据初始化')
        // 数据完整性校验：防止极端情况下数据不完整
        const { ok, missing } = await validateDataIntegrity()
        if (!ok) {
          console.warn('[Bootstrap] 数据不完整，重新播种:', missing)
          await seedDemoData((current, total) => {
            console.log(`[Init] 正在重建记忆索引... ${current}/${total}`)
          })
        } else {
          // 如果之前向量索引构建失败，尝试重新构建
          const { retryIndexIfNeeded } = await import('./lib/vectorStore')
          retryIndexIfNeeded().catch(e => console.warn('[Bootstrap] 向量索引重试失败:', e))
        }
      }
    } catch (err) {
      console.error('[Bootstrap] 应用初始化失败:', err)
      // 重置状态，允许下次重试
      bootstrapPromise = null
    } finally {
      // OPT-3: 预热 LLM 连接（不阻塞渲染，后台并行执行）
      warmupLLMConnection().catch(() => {})
      // P2: 启动数据生命周期管理（定时清理过期数据）
      import('./lib/dataLifecycle')
        .then(({ startDataLifecycleManager }) => startDataLifecycleManager())
        .catch(() => {})
      createRoot(root).render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
    }
  })()

  return bootstrapPromise
}

bootstrapApp().finally(() => {
  // 应用初始化完成后启动总结定时器（每 5 分钟检查一次）
  startSummaryScheduler()
})
