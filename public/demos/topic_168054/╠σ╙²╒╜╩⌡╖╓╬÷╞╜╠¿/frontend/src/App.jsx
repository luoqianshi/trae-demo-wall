import { useState, useCallback } from 'react'
import UploadPage from './pages/UploadPage.jsx'
import AnalysisPage from './pages/AnalysisPage.jsx'
import PingPongApp from './pingpong/index.js'
import './pingpong/styles/pingpong.css'

/**
 * 应用根组件
 * 负责路由管理：上传页 → 分析看板页
 * 通过 currentTaskId 状态控制页面切换
 * 支持足球和乒乓球两种分析模式切换
 */
function App() {
  const [currentTaskId, setCurrentTaskId] = useState(null)
  // 页面类型：'upload' 上传页，'analysis' 分析页
  const [page, setPage] = useState('upload')
  // 分析模式：'football' 足球分析，'pingpong' 乒乓球分析（默认足球）
  const [mode, setMode] = useState('football')

  // 进入分析页面
  const goToAnalysis = useCallback((taskId) => {
    setCurrentTaskId(taskId)
    setPage('analysis')
  }, [])

  // 返回上传页面
  const goToUpload = useCallback(() => {
    setCurrentTaskId(null)
    setPage('upload')
  }, [])

  // 切换分析模式
  const switchMode = useCallback((newMode) => {
    setMode(newMode)
    setCurrentTaskId(null)
    setPage('upload')
  }, [])

  // 乒乓球模式：加载乒乓球应用
  if (mode === 'pingpong') {
    return (
      <div className="app-wrapper">
        <ModeSwitcher mode={mode} onSwitch={switchMode} />
        <PingPongApp />
      </div>
    )
  }

  // 足球模式：加载足球应用
  return (
    <div className="app-wrapper">
      <ModeSwitcher mode={mode} onSwitch={switchMode} />
      {page === 'analysis' && currentTaskId ? (
        <AnalysisPage taskId={currentTaskId} onBack={goToUpload} />
      ) : (
        <UploadPage onAnalyze={goToAnalysis} />
      )}
    </div>
  )
}

/**
 * 模式切换器组件
 * 在页面顶部显示乒乓球/足球分析模式切换按钮（乒乓球在前）
 */
function ModeSwitcher({ mode, onSwitch }) {
  return (
    <div className="mode-switcher">
      <button
        className={"mode-btn" + (mode === 'pingpong' ? " active" : "")}
        onClick={() => onSwitch('pingpong')}
      >
        🏓 乒乓球分析
      </button>
      <button
        className={"mode-btn" + (mode === 'football' ? " active" : "")}
        onClick={() => onSwitch('football')}
      >
        ⚽ 足球分析
      </button>
    </div>
  )
}

export default App
