import { useEffect } from 'react'
import DataSourceSelector from '../components/DataSourceSelector'
import DataPreview from '../components/DataPreview'
import ChatPanel from '../components/ChatPanel'
import AgentTimeline from '../components/AgentTimeline'
import ChartView from '../components/ChartView'
import ReportView from '../components/ReportView'
import { useAppStore } from '../store/appStore'

export default function AnalyzePage() {
  const { handleProgress, handleComplete, handleError } = useAppStore()

  // 注册 IPC 事件监听（仅注册一次）
  // 注意：在非 Electron 环境（如浏览器预览）下 window.datapilot 不存在，需做防御
  useEffect(() => {
    const api = window.datapilot
    if (!api?.agent) return

    const unsubProgress = api.agent.onProgress(handleProgress)
    const unsubComplete = api.agent.onComplete(handleComplete)
    const unsubError = api.agent.onError(handleError)
    return () => {
      unsubProgress?.()
      unsubComplete?.()
      unsubError?.()
    }
  }, [handleProgress, handleComplete, handleError])

  return (
    <div className="analyze-page">
      {/* 左栏：数据源 + 预览 */}
      <aside className="analyze-left">
        <DataSourceSelector />
        <DataPreview />
      </aside>

      {/* 中栏：目标输入 + 执行轨迹 */}
      <main className="analyze-center">
        <ChatPanel />
        <AgentTimeline />
      </main>

      {/* 右栏：图表 + 报告 */}
      <aside className="analyze-right">
        <ChartView />
        <ReportView />
      </aside>
    </div>
  )
}
