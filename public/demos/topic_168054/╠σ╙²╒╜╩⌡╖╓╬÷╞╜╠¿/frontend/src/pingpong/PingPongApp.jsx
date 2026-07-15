import { useState, useCallback } from 'react'
import HomePage from './pages/HomePage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'

/**
 * 乒乓球应用入口组件
 * 负责路由管理：首页 → 分析看板页
 * 通过 currentTaskId 状态控制页面切换
 * 与足球分支完全独立
 */
function PingPongApp() {
  const [currentTaskId, setCurrentTaskId] = useState(null)
  // 页面类型：'home' 首页，'analysis' 分析页
  const [page, setPage] = useState('home')

  // 进入分析页面
  const goToAnalysis = useCallback((taskId) => {
    setCurrentTaskId(taskId)
    setPage('analysis')
  }, [])

  // 返回首页
  const goToHome = useCallback(() => {
    setCurrentTaskId(null)
    setPage('home')
  }, [])

  if (page === 'analysis' && currentTaskId) {
    return <AnalysisPage taskId={currentTaskId} onBack={goToHome} />
  }

  return <HomePage onAnalyze={goToAnalysis} />
}

export default PingPongApp
