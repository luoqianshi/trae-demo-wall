import { useMemo } from 'react'
import { getPlayerColor, getSideName } from '../utils/colors.js'

/**
 * 单个选手的统计卡片区块
 * @param {Object} player - 球员数据
 * @param {number} index - 选手序号（1号/2号）
 */
function PlayerStatsBlock({ player, index }) {
  const stats = player.stats || {}
  const color = getPlayerColor(player.team)

  return (
    <div className="pp-player-stats-section">
      <div className="pp-player-stats-header">
        <span
          className="pp-player-stats-dot"
          style={{ backgroundColor: color }}
        ></span>
        <span>{index}号 {getSideName(player.team)}</span>
      </div>
      <div className="pp-stats-grid">
        <div className="pp-stat-card">
          <div className="pp-stat-icon">🏓</div>
          <div className="pp-stat-value">{stats.hit_count || 0}</div>
          <div className="pp-stat-label">击球次数</div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon">🔄</div>
          <div className="pp-stat-value">{stats.rally_count || 0}</div>
          <div className="pp-stat-label">回合数</div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon">✋</div>
          <div className="pp-stat-value">{(stats.forehand_rate || 0).toFixed(0)}%</div>
          <div className="pp-stat-label">正手率</div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon">🤚</div>
          <div className="pp-stat-value">{(stats.backhand_rate || 0).toFixed(0)}%</div>
          <div className="pp-stat-label">反手率</div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon">🏃</div>
          <div className="pp-stat-value">{(stats.total_distance || 0).toFixed(1)}m</div>
          <div className="pp-stat-label">跑动距离</div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon">⚡</div>
          <div className="pp-stat-value">{(stats.avg_speed || 0).toFixed(2)}</div>
          <div className="pp-stat-label">平均速度(m/s)</div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon">🚀</div>
          <div className="pp-stat-value">{(stats.max_speed || 0).toFixed(1)}</div>
          <div className="pp-stat-label">最高速度(m/s)</div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon">📍</div>
          <div className="pp-stat-value">{(stats.near_table_rate || 0).toFixed(0)}%</div>
          <div className="pp-stat-label">近台率</div>
        </div>
      </div>
    </div>
  )
}

/**
 * 数据统计面板组件（乒乓球版）
 * 每个选手单独显示一个统计区块，不再汇总
 * @param {Array} players - 球员数据列表
 * @param {Object} globalStats - 全局统计数据
 */
function StatsPanel({ players, globalStats }) {
  // 选手列表为空时显示暂无数据
  const hasPlayers = useMemo(() => players && players.length > 0, [players])

  if (!hasPlayers) {
    return (
      <div className="pp-stats-panel">
        <h3 className="pp-panel-title">数据统计</h3>
        <p className="pp-no-data">暂无数据</p>
      </div>
    )
  }

  return (
    <div className="pp-stats-panel">
      <h3 className="pp-panel-title">数据统计</h3>

      {/* 每个选手单独显示统计区块 */}
      {players.map((player, idx) => (
        <PlayerStatsBlock
          key={player.player_id}
          player={player}
          index={idx + 1}
        />
      ))}

      {/* 全局球路统计 */}
      {globalStats && (
        <div className="pp-global-stats">
          <h4 className="pp-global-title">球路统计</h4>
          <div className="pp-global-row">
            <span className="pp-global-label">平均球速</span>
            <span className="pp-global-value">{globalStats.avg_ball_speed} m/s</span>
          </div>
          <div className="pp-global-row">
            <span className="pp-global-label">最高球速</span>
            <span className="pp-global-value">{globalStats.max_ball_speed} m/s</span>
          </div>
          <div className="pp-global-row">
            <span className="pp-global-label">平均过网高度</span>
            <span className="pp-global-value">{globalStats.avg_net_height} cm</span>
          </div>
          <div className="pp-global-row">
            <span className="pp-global-label">弧圈球率</span>
            <span className="pp-global-value">{globalStats.loop_rate}%</span>
          </div>
          <div className="pp-global-row">
            <span className="pp-global-label">快攻率</span>
            <span className="pp-global-value">{globalStats.drive_rate}%</span>
          </div>
          <div className="pp-global-row">
            <span className="pp-global-label">扣杀率</span>
            <span className="pp-global-value">{globalStats.smash_rate}%</span>
          </div>
          <div className="pp-global-row">
            <span className="pp-global-label">变线次数</span>
            <span className="pp-global-value">{globalStats.line_change_count}</span>
          </div>
          <div className="pp-global-row">
            <span className="pp-global-label">斜线率</span>
            <span className="pp-global-value">{globalStats.crossline_rate}%</span>
          </div>
          <div className="pp-global-row">
            <span className="pp-global-label">直线率</span>
            <span className="pp-global-value">{globalStats.straightline_rate}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsPanel
