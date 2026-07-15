import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { usePingPongData } from '../hooks/usePingPongData.js'
import TableCanvas2D from '../components/TableCanvas2D.jsx'
import LandingHeatmap from '../components/LandingHeatmap.jsx'
import PlayerTrajectory2D from '../components/PlayerTrajectory2D.jsx'
import Trajectory3D from '../components/Trajectory3D.jsx'
import PlayerSelector from '../components/PlayerSelector.jsx'
import Timeline from '../components/Timeline.jsx'
import StatsPanel from '../components/StatsPanel.jsx'
import Report from '../components/Report.jsx'
import ViewToggle from '../components/ViewToggle.jsx'

/**
 * 回合选择器组件（内联在 AnalysisPage 中）
 * 支持多选、Shift范围选择、全选/清除
 * 选中不连续回合时弹出提示并撤销
 * @param {Array} rallies - 回合数据列表
 * @param {Array} selectedRallies - 选中的回合ID列表
 * @param {(rallyId: number, shiftKey: boolean) => void} onRallyClick - 回合点击回调
 * @param {() => void} onSelectAll - 全选回调
 * @param {() => void} onClear - 清除回调
 */
function RallySelector({ rallies, selectedRallies, onRallyClick, onSelectAll, onClear }) {
  if (!rallies || rallies.length === 0) return null

  return (
    <div className="pp-rally-selector">
      <div className="pp-rally-header">
        <span className="pp-rally-title">回合选择（共 {rallies.length} 个回合）</span>
        <div className="pp-rally-actions">
          <button className="pp-rally-action-btn" onClick={onSelectAll}>全选</button>
          <button className="pp-rally-action-btn" onClick={onClear}>清除</button>
        </div>
      </div>
      <div className="pp-rally-buttons">
        {rallies.map(rally => (
          <button
            key={rally.rally_id}
            className={"pp-rally-btn" + (selectedRallies.includes(rally.rally_id) ? " active" : "")}
            onClick={(e) => onRallyClick(rally.rally_id, e.shiftKey)}
          >
            R{rally.rally_id}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * 分析看板页
 * 布局：顶部导航栏 + 左侧主视图(2D/3D) + 右侧面板 + 底部时间轴 + 回合选择器 + 报告
 * 当taskId为'demo'时，使用内置模拟数据展示演示效果
 * @param {string} taskId - 任务ID
 * @param {() => void} onBack - 返回首页回调
 */
function AnalysisPage({ taskId, onBack }) {
  const { status, progress, data, error, retry } = usePingPongData(taskId)

  const isDemo = taskId === 'demo'

  // 视图模式：'2d' 或 '3d'
  const [view, setView] = useState('2d')
  // 选中的球员ID列表
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
  // 显示选项
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showTrajectory, setShowTrajectory] = useState(true)
  const [showLanding, setShowLanding] = useState(true)
  const [showLandingHeatmap, setShowLandingHeatmap] = useState(true)
  // 时间范围
  const [timeRange, setTimeRange] = useState([0, 0])
  // 当前播放时间
  const [currentTime, setCurrentTime] = useState(0)
  // 选中的回合ID列表
  const [selectedRallies, setSelectedRallies] = useState([])
  // 上一次点击的回合ID（用于Shift范围选择）
  const lastClickedRallyRef = useRef(null)
  // 不连续选择提示
  const [toast, setToast] = useState(null)

  // 提示自动消失（3秒后清除）
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // 数据加载后初始化
  const initialized = useMemo(() => {
    if (data && data.duration > 0 && timeRange[1] === 0) {
      setTimeRange([0, data.duration])
      setCurrentTime(0)
    }
    if (data && data.players && data.players.length > 0 && selectedPlayerIds.length === 0) {
      setSelectedPlayerIds(data.players.slice(0, 2).map(p => p.player_id))
    }
    return true
  }, [data])

  // 球员列表
  const players = useMemo(() => data?.players || [], [data])

  // 回合列表
  const rallies = useMemo(() => data?.rallies || [], [data])

  // 选中的球员数据
  const selectedPlayers = useMemo(() => {
    if (!players) return []
    return players.filter(p => selectedPlayerIds.includes(p.player_id))
  }, [players, selectedPlayerIds])

  // 3D球路轨迹（过滤时间范围）
  const ball3DTrajectory = useMemo(() => {
    if (!data?.ball_3d?.trajectory) return []
    return data.ball_3d.trajectory.filter(
      point => point.timestamp >= timeRange[0] && point.timestamp <= timeRange[1]
    )
  }, [data, timeRange])

  // 落点数据（过滤时间范围）
  const landingPoints = useMemo(() => {
    if (!data?.landing_points) return []
    return data.landing_points.filter(
      point => point.timestamp >= timeRange[0] && point.timestamp <= timeRange[1]
    )
  }, [data, timeRange])

  // 回调函数
  const handlePlayerSelect = useCallback((ids) => {
    setSelectedPlayerIds(ids)
  }, [])

  const handleTimeChange = useCallback((range) => {
    setTimeRange(range)
    // 时间范围变化后，当前时间如果超出范围则限制到范围内
    setCurrentTime(prev => {
      if (prev < range[0]) return range[0]
      if (prev > range[1]) return range[1]
      return prev
    })
  }, [])

  const handleCurrentTimeChange = useCallback((time) => {
    setCurrentTime(time)
  }, [])

  // 检查选中的回合是否连续
  const isContiguous = useCallback((sortedIds) => {
    if (sortedIds.length <= 1) return true
    for (let i = 1; i < sortedIds.length; i++) {
      if (sortedIds[i] - sortedIds[i - 1] !== 1) return false
    }
    return true
  }, [])

  // 根据选中的回合更新时间范围
  const updateRangeFromRallies = useCallback((rallyIds) => {
    if (rallyIds.length === 0 || rallies.length === 0) return
    const sorted = [...rallyIds].sort((a, b) => a - b)
    const firstRally = rallies.find(r => r.rally_id === sorted[0])
    const lastRally = rallies.find(r => r.rally_id === sorted[sorted.length - 1])
    if (firstRally && lastRally) {
      const newRange = [firstRally.start_time, lastRally.end_time]
      setTimeRange(newRange)
      // 当前时间限制到新范围内
      setCurrentTime(prev => {
        if (prev < newRange[0]) return newRange[0]
        if (prev > newRange[1]) return newRange[1]
        return prev
      })
    }
  }, [rallies])

  // 回合点击处理
  const handleRallyClick = useCallback((rallyId, shiftKey) => {
    if (rallies.length === 0) return

    let newSelected

    if (shiftKey && lastClickedRallyRef.current !== null) {
      // Shift+点击：选择从上次点击到当前点击的范围
      const startId = Math.min(lastClickedRallyRef.current, rallyId)
      const endId = Math.max(lastClickedRallyRef.current, rallyId)
      newSelected = []
      for (let i = startId; i <= endId; i++) {
        newSelected.push(i)
      }
    } else {
      // 普通点击：切换选中状态
      if (selectedRallies.includes(rallyId)) {
        newSelected = selectedRallies.filter(id => id !== rallyId)
      } else {
        newSelected = [...selectedRallies, rallyId]
      }
    }

    // 排序
    newSelected.sort((a, b) => a - b)

    // 检查连续性
    if (!isContiguous(newSelected)) {
      // 不连续：弹出提示，撤销本次选择
      setToast({ id: Date.now(), message: '不能选择不连续的回合范围' })
      return
    }

    setSelectedRallies(newSelected)
    lastClickedRallyRef.current = rallyId

    // 根据选中的回合更新时间范围
    if (newSelected.length > 0) {
      updateRangeFromRallies(newSelected)
    }
  }, [rallies, selectedRallies, isContiguous, updateRangeFromRallies])

  // 全选回合
  const handleSelectAllRallies = useCallback(() => {
    if (rallies.length === 0) return
    const allIds = rallies.map(r => r.rally_id)
    setSelectedRallies(allIds)
    lastClickedRallyRef.current = allIds[allIds.length - 1]
    updateRangeFromRallies(allIds)
  }, [rallies, updateRangeFromRallies])

  // 清除回合选择
  const handleClearRallies = useCallback(() => {
    setSelectedRallies([])
    lastClickedRallyRef.current = null
    // 清除后恢复完整时间范围
    if (data && data.duration > 0) {
      setTimeRange([0, data.duration])
    }
  }, [data])

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
      globalStats: data.stats,
      report: data.report,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pingpong_report_' + taskId + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [data, taskId, timeRange, selectedPlayers])

  // 分析进行中
  if (status === 'connecting' || status === 'analyzing') {
    return (
      <div className="pp-analysis-page">
        <div className="pp-analysis-navbar">
          <button className="pp-btn pp-btn-back" onClick={onBack}>
            ← 返回首页
          </button>
          <h2 className="pp-navbar-title">分析进行中</h2>
        </div>
        <div className="pp-analysis-progress-container">
          <div className="pp-analysis-progress-circle" style={{ '--progress': progress }}>
            <span className="pp-progress-percent">{progress}%</span>
          </div>
          <div className="pp-analysis-progress-bar-large">
            <div className="pp-analysis-progress-fill" style={{ width: progress + '%' }} />
          </div>
          <p className="pp-analysis-progress-status">
            {status === 'connecting' ? '正在连接分析服务...' : '正在分析视频，请稍候...'}
          </p>
        </div>
      </div>
    )
  }

  // 分析出错
  if (status === 'error') {
    return (
      <div className="pp-analysis-page">
        <div className="pp-analysis-navbar">
          <button className="pp-btn pp-btn-back" onClick={onBack}>
            ← 返回首页
          </button>
          <h2 className="pp-navbar-title">分析失败</h2>
        </div>
        <div className="pp-analysis-error-container">
          <div className="pp-error-icon-large">!</div>
          <p className="pp-error-message">{error || '分析过程中出现错误'}</p>
          <button className="pp-btn pp-btn-primary" onClick={retry}>
            重试
          </button>
        </div>
      </div>
    )
  }

  // 分析完成，显示看板
  return (
    <div className="pp-analysis-page">
      {/* 顶部导航栏 */}
      <div className="pp-analysis-navbar">
        <button className="pp-btn pp-btn-back" onClick={onBack}>
          ← 返回首页
        </button>
        <div className="pp-navbar-title-wrapper">
          <h2 className="pp-navbar-title">乒乓球分析看板</h2>
          {isDemo && <span className="pp-demo-badge">演示模式</span>}
        </div>
        <div className="pp-navbar-actions">
          <ViewToggle view={view} onChange={setView} />
          <button className="pp-btn pp-btn-export" onClick={handleExport}>
            导出报告
          </button>
        </div>
      </div>

      {/* 主体区域：左侧主视图 + 右侧面板 */}
      <div className="pp-analysis-main">
        <div className="pp-view-section">
          {/* 2D视图 */}
          {view === '2d' && (
            <>
              <div className="pp-view-controls">
                <label className="pp-toggle-label">
                  <input
                    type="checkbox"
                    checked={showLandingHeatmap}
                    onChange={(e) => setShowLandingHeatmap(e.target.checked)}
                  />
                  <span>落点热力图</span>
                </label>
                <label className="pp-toggle-label">
                  <input
                    type="checkbox"
                    checked={showLanding}
                    onChange={(e) => setShowLanding(e.target.checked)}
                  />
                  <span>落点标记</span>
                </label>
                <label className="pp-toggle-label">
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                  />
                  <span>站位热力图</span>
                </label>
                <label className="pp-toggle-label">
                  <input
                    type="checkbox"
                    checked={showTrajectory}
                    onChange={(e) => setShowTrajectory(e.target.checked)}
                  />
                  <span>移动轨迹</span>
                </label>
              </div>
              <TableCanvas2D>
                {showLandingHeatmap && (
                  <LandingHeatmap
                    landingPoints={landingPoints}
                    timeRange={timeRange}
                    showHeatmap={true}
                    showPoints={false}
                  />
                )}
                {showLanding && (
                  <LandingHeatmap
                    landingPoints={landingPoints}
                    timeRange={timeRange}
                    showHeatmap={false}
                    showPoints={true}
                  />
                )}
                {showHeatmap && (
                  <PlayerTrajectory2D
                    players={selectedPlayers}
                    timeRange={timeRange}
                    drawHeatmap={true}
                    drawTrajectory={false}
                  />
                )}
                {showTrajectory && (
                  <PlayerTrajectory2D
                    players={selectedPlayers}
                    timeRange={timeRange}
                    drawHeatmap={false}
                    drawTrajectory={true}
                  />
                )}
              </TableCanvas2D>
            </>
          )}

          {/* 3D视图 */}
          {view === '3d' && (
            <div className="pp-3d-view-section">
              <div className="pp-view-controls">
                <span className="pp-3d-hint">💡 拖拽旋转视角 · 滚轮缩放 · 右键平移</span>
              </div>
              <Trajectory3D
                trajectory={ball3DTrajectory}
                landingPoints={landingPoints}
              />
            </div>
          )}
        </div>

        <div className="pp-side-panel">
          <PlayerSelector
            players={players}
            selectedIds={selectedPlayerIds}
            onChange={handlePlayerSelect}
          />
          <StatsPanel
            players={selectedPlayers.length > 0 ? selectedPlayers : players}
            globalStats={data?.stats}
          />
        </div>
      </div>

      {/* 时间轴 */}
      <div className="pp-timeline-section">
        <Timeline
          duration={data?.duration || 0}
          timeRange={timeRange}
          onChange={handleTimeChange}
          currentTime={currentTime}
          onCurrentTimeChange={handleCurrentTimeChange}
        />
      </div>

      {/* 回合选择器 */}
      <RallySelector
        rallies={rallies}
        selectedRallies={selectedRallies}
        onRallyClick={handleRallyClick}
        onSelectAll={handleSelectAllRallies}
        onClear={handleClearRallies}
      />

      {/* 战术分析报告 */}
      <div className="pp-report-section">
        <Report report={data?.report || ''} />
      </div>

      {/* 不连续选择提示 */}
      {toast && (
        <div key={toast.id} className="pp-rally-toast">{toast.message}</div>
      )}
    </div>
  )
}

export default AnalysisPage
