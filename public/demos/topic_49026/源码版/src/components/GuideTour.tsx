/**
 * 衡舟 分步导览 — 使用 driver.js 实现
 *
 * 首次访问自动触发，高亮关键 UI 元素，引导评委快速理解核心功能。
 * 通过 localStorage 'hengzhou-guide-tour-done' 防止重复触发。
 */

import { useEffect, useState } from 'react'

const GUIDE_TOUR_KEY = 'hengzhou-guide-tour-done'

// 等待元素渲染（React 异步场景）
// 返回 null 表示超时未找到，而非 reject，让调用方决定是否跳过该步骤
function waitForElement(selector: string, maxRetries = 30, interval = 200): Promise<HTMLElement | null> {
  let retries = 0
  return new Promise((resolve) => {
    const check = () => {
      const el = document.querySelector(selector) as HTMLElement | null
      if (el) {
        resolve(el)
      } else if (retries < maxRetries) {
        retries++
        setTimeout(check, interval)
      } else {
        resolve(null)
      }
    }
    check()
  })
}

// 动态导入 driver.js，避免影响首屏
async function loadDriver() {
  const { driver } = await import('driver.js')
  await import('driver.js/dist/driver.css')
  return driver
}

// 引导步骤定义
const GUIDE_STEPS = [
  {
    element: '[data-guide="scenario-cards"]',
    popover: {
      title: '试试这些场景',
      description: '衡舟已经记住了一个完整用户的生活。点击任意场景，感受"被记住"的力量。',
      side: 'bottom' as const,
      align: 'center' as const,
    },
  },
  {
    element: '[data-guide="chat-input"]',
    popover: {
      title: '和衡舟对话',
      description: '在这里输入任何问题，衡舟会结合记忆中的人物、事件和关系来回答你。',
      side: 'top' as const,
      align: 'center' as const,
    },
  },
  {
    element: '[data-guide="context-sidebar"]',
    popover: {
      title: '上下文面板',
      description: '对话时，这里会实时显示相关人物、记忆星图和本次对话的洞察。',
      side: 'left' as const,
      align: 'center' as const,
    },
  },
  {
    element: '[data-guide="nav-memory"]',
    popover: {
      title: '记忆库',
      description: '衡舟自动从对话中提取记忆，在这里查看和管理所有被记住的事。',
      side: 'right' as const,
      align: 'center' as const,
    },
  },
  {
    element: '[data-guide="nav-relations"]',
    popover: {
      title: '关系图谱',
      description: 'GraphRAG 技术构建的人物关系网络，发现隐藏的人脉连接。',
      side: 'right' as const,
      align: 'center' as const,
    },
  },
]

export function GuideTour() {
  const [shouldStart, setShouldStart] = useState(false)

  // 检查是否需要启动引导
  useEffect(() => {
    const done = localStorage.getItem(GUIDE_TOUR_KEY)
    if (done) return

    // 不再依赖 OnboardingWizard（该组件未集成到当前流程中）
    // 直接延迟启动，等待 CinematicOpening（3.2s）和 UI 渲染完成
    // waitForElement 会进一步确保目标元素已就绪
    const timer = setTimeout(() => setShouldStart(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  // 启动引导
  useEffect(() => {
    if (!shouldStart) return

    let cancelled = false

    const start = async () => {
      try {
        const driver = await loadDriver()

        // 等待所有目标元素，跳过未找到的步骤（如已有对话时 scenario-cards 不渲染）
        const results = await Promise.all(
          GUIDE_STEPS.map(async (s) => {
            const el = await waitForElement(s.element)
            return el ? s : null
          })
        )

        if (cancelled) return

        // 过滤掉未找到的步骤
        const availableSteps = results.filter((s): s is NonNullable<typeof s> => s !== null)

        if (availableSteps.length === 0) {
          console.warn('[GuideTour] Skipped: no target elements found')
          localStorage.setItem(GUIDE_TOUR_KEY, 'true')
          return
        }

        if (availableSteps.length < GUIDE_STEPS.length) {
          console.info(`[GuideTour] ${GUIDE_STEPS.length - availableSteps.length} step(s) skipped (element not in DOM)`)
        }

        const driverObj = driver({
          showProgress: true,
          animate: true,
          opacity: 0.65,
          allowClose: true,
          disableActiveInteraction: false,
          nextBtnText: '下一步',
          prevBtnText: '上一步',
          doneBtnText: '开始体验 ✓',
          progressText: '{{current}} / {{total}}',
          steps: availableSteps,
          onDestroyed: () => {
            localStorage.setItem(GUIDE_TOUR_KEY, 'true')
            // 通知其他组件恢复横幅
            window.dispatchEvent(new CustomEvent('hengzhou-guide-active', { detail: false }))
            delete document.body.dataset.guideActive
            // 清理可能残留的 driver.js overlay 元素
            document.querySelectorAll('.driver-overlay, .driver-popover, [class*="driver-"]').forEach(el => {
              if (el instanceof HTMLElement) el.remove()
            })
          },
        })

        // 通知其他组件隐藏横幅
        window.dispatchEvent(new CustomEvent('hengzhou-guide-active', { detail: true }))
        document.body.dataset.guideActive = 'true'
        driverObj.drive()
      } catch (err) {
        // 其他异常，静默跳过引导
        console.warn('[GuideTour] Skipped:', err)
        localStorage.setItem(GUIDE_TOUR_KEY, 'true')
      }
    }

    start()

    return () => {
      cancelled = true
    }
  }, [shouldStart])

  return null
}

// 手动触发引导（供设置页"重新查看引导"按钮调用）
export async function replayGuideTour() {
  localStorage.removeItem(GUIDE_TOUR_KEY)
  // 刷新页面以重新触发
  window.location.reload()
}
