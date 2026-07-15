import { getTeamColor, getTeamName } from '../utils/colors.js'

/**
 * 数据统计面板组件
 * 每个被选中的球员单独显示一个统计卡片，不再汇总
 * @param {Array} players - 选中的球员数据列表
 */
function StatsPanel({ players }) {
  if (!players || players.length === 0) {
    return (
      <div className="stats-panel">
        <h3 className="panel-title">数据统计</h3>
        <p className="no-data">暂无数据</p>
      </div>
    )
  }

  return (
    <div className="stats-panel">
      <h3 className="panel-title">
        数据统计
        <span className="panel-subtitle">{players.length} 名球员</span>
      </h3>

      {/* 每个球员单独一个统计区块 */}
      {players.map(player => {
        const color = getTeamColor(player.team)
        const teamName = getTeamName(player.team)
        const s = player.stats || {}

        return (
          <div key={player.player_id} className="player-stats-section">
            <div className="player-stats-header">
              <span className="player-stats-dot" style={{ backgroundColor: color, color: color }}></span>
              <span>{player.player_id}号 · {player.position}</span>
              <span className="player-stats-team">{teamName}</span>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏃</div>
                <div className="stat-value accent">{(s.total_distance || 0).toFixed(0)}</div>
                <div className="stat-label">跑动(m)</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-value">{(s.max_speed || 0).toFixed(1)}</div>
                <div className="stat-label">最高速度</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-value">{s.pass_count || 0}</div>
                <div className="stat-label">传球次数</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value accent">{(s.pass_success_rate || 0).toFixed(0)}%</div>
                <div className="stat-label">传球成功率</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{s.shot_count || 0}</div>
                <div className="stat-label">射门次数</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚽</div>
                <div className="stat-value">{(s.possession_rate || 0).toFixed(1)}%</div>
                <div className="stat-label">持球率</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{(s.avg_speed || 0).toFixed(1)}</div>
                <div className="stat-label">平均速度</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📍</div>
                <div className="stat-value" style={{ fontSize: '12px' }}>{s.main_zone || '未知'}</div>
                <div className="stat-label">主要区域</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsPanel
