import { useState, useMemo, useCallback } from 'react'
import { useAnalysisData } from '../hooks/useAnalysisData.js'
import PitchCanvas from '../components/PitchCanvas.jsx'
import PlayerTrajectory from '../components/PlayerTrajectory.jsx'
import BallTrajectory from '../components/BallTrajectory.jsx'
import PlayerSelector from '../components/PlayerSelector.jsx'
import Timeline from '../components/Timeline.jsx'
import StatsPanel from '../components/StatsPanel.jsx'
import Report from '../components/Report.jsx'

/**
 * 分析看板页（核心页面）
 * 布局：顶部导航栏 + 左侧球场Canvas + 右侧球员列表/统计面板 + 底部时间轴 + 报告
 * 当taskId为'demo'时，使用内置模拟数据展示演示效果
 */
function AnalysisPage({ taskId, onBack }) {
  const { status, progress, data, error, retry } = useAnalysisData(taskId)

  // 演示模式标识
  const isDemo = taskId === 'demo'

  // 选中的球员ID列表
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
  // 是否显示足球轨迹
  const [showBall, setShowBall] = useState(true)
  // 是否显示热力图
  const [showHeatmap, setShowHeatmap] = useState(true)
  // 是否显示轨迹线
  const [showTrajectory, setShowTrajectory] = useState(true)
  // 时间范围 [起始秒, 结束秒]
  const [timeRange, setTimeRange] = useState([0, 0])

  // 数据加载后初始化时间范围和默认选中球员
  const initialized = useMemo(() => {
    if (data && data.duration > 0 && timeRange[1] === 0) {
      setTimeRange([0, data.duration])
    }
    if (data && data.players && data.players.length > 0 && selectedPlayerIds.length === 0) {
      // 默认选中前2个球员
      setSelectedPlayerIds(data.players.slice(0, 2).map(p => p.player_id))
    }
    return true
  }, [data])

  // 球员列表
  const players = useMemo(() => data?.players || [], [data])

  // 选中的球员数据
  const selectedPlayers = useMemo(() => {
    if (!players) return []
    return players.filter(p => selectedPlayerIds.includes(p.player_id))
  }, [players, selectedPlayerIds])

  // 足球轨迹（过滤时间范围）
  const ballTrajectory = useMemo(() => {
    if (!data?.ball?.trajectory) return []
    return data.ball.trajectory.filter(
      point => point.timestamp >= timeRange[0] && point.timestamp <= timeRange[1]
    )
  }, [data, timeRange])

  // 球员选择变化处理
  const handlePlayerSelect = useCallback((ids) => {
    setSelectedPlayerIds(ids)
  }, [])

  // 时间范围变化处理
  const handleTimeChange = useCallback((range) => {
    setTimeRange(range)
  }, [])

  // 导出报告
  const handleExport = useCallback(() => {
    if (!data) return
    const exportData = {
      taskId,
      timeRange,
      selectedPlayers: selectedPlayers.map(p => ({
        player_id: p.player_id,
        team: p.team,
        stats: p.stats,
      })),
      report: data.report,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tactics_report_' + taskId + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [data, taskId, timeRange, selectedPlayers])

  // 分析进行中
  if (status === 'connecting' || status === 'analyzing') {
    return (
      <div className="analysis-page">
        <div className="analysis-navbar">
          <button className="btn btn-back" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            返回上传
          </button>
          <div className="navbar-title-wrapper">
            <h2 className="navbar-title">分析引擎运行中</h2>
          </div>
          <div style={{ width: 90 }} />
        </div>
        <div className="analysis-progress-container">
          <div className="analysis-progress-circle" style={{ '--progress': progress }}>
            <span className="progress-percent">{progress}%</span>
          </div>
          <div className="analysis-progress-bar-large">
            <div className="analysis-progress-fill" style={{ width: progress + '%' }} />
          </div>
          <p className="analysis-progress-status">
            {status === 'connecting' ? '正在连接分析服务...' : 'AI 正在解析视频中的球员运动与战术模式...'}
          </p>
        </div>
      </div>
    )
  }

  // 分析出错
  if (status === 'error') {
    return (
      <div className="analysis-page">
        <div className="analysis-navbar">
          <button className="btn btn-back" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            返回上传
          </button>
          <div className="navbar-title-wrapper">
            <h2 className="navbar-title">分析失败</h2>
          </div>
          <div style={{ width: 90 }} />
        </div>
        <div className="analysis-error-container">
          <div className="error-icon-large">!</div>
          <p className="error-message">{error || '分析过程中出现错误'}</p>
          <button className="btn btn-primary" onClick={retry}>
            重试分析
          </button>
        </div>
      </div>
    )
  }

  // 分析完成，显示看板
  return (
    <div className="analysis-page">
      {/* 顶部导航栏 */}
      <div className="analysis-navbar">
        <button className="btn btn-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回上传
        </button>

        <div className="navbar-title-wrapper">
          <h2 className="navbar-title">战术分析看板</h2>
          <div className="match-badge">
            <span>HOME</span>
            <span className="match-badge-separator">VS</span>
            <span>AWAY</span>
          </div>
          {isDemo && <span className="demo-badge">演示模式</span>}
        </div>

        <div className="navbar-actions">
          <div className="navbar-controls">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
              />
              <span>热力图</span>
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showTrajectory}
                onChange={(e) => setShowTrajectory(e.target.checked)}
              />
              <span>轨迹</span>
            </label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showBall}
                onChange={(e) => setShowBall(e.target.checked)}
              />
              <span>足球</span>
            </label>
          </div>
          <button className="btn btn-export" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出报告
          </button>
        </div>
      </div>

      {/* 主体区域：左侧球场 + 右侧面板 */}
      <div className="analysis-main">
        <div className="pitch-section">
          <PitchCanvas>
            {showHeatmap && (
              <PlayerTrajectory
                players={selectedPlayers}
                timeRange={timeRange}
                drawHeatmap={true}
                drawTrajectory={false}
              />
            )}
            {showTrajectory && (
              <PlayerTrajectory
                players={selectedPlayers}
                timeRange={timeRange}
                drawHeatmap={false}
                drawTrajectory={true}
              />
            )}
            {showBall && ballTrajectory.length > 0 && (
              <BallTrajectory trajectory={ballTrajectory} />
            )}
          </PitchCanvas>
          <div className="pitch-overlay">
            {showHeatmap && <span className="pitch-tag">Heatmap</span>}
            {showTrajectory && <span className="pitch-tag">Trajectory</span>}
            {showBall && <span className="pitch-tag">Ball</span>}
          </div>
        </div>

        <div className="side-panel">
          <PlayerSelector
            players={players}
            selectedIds={selectedPlayerIds}
            onChange={handlePlayerSelect}
          />
          <StatsPanel players={selectedPlayers.length > 0 ? selectedPlayers : players} />
        </div>
      </div>

      {/* 时间轴 */}
      <div className="timeline-section">
        <Timeline
          duration={data?.duration || 0}
          timeRange={timeRange}
          onChange={handleTimeChange}
        />
      </div>

      {/* 战术分析报告 */}
      <div className="report-section">
        <Report report={data?.report || ''} />
      </div>
    </div>
  )
}

export default AnalysisPage
