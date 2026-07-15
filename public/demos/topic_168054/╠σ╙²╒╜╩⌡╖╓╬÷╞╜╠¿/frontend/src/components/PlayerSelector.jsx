import { useCallback, useMemo, useState } from 'react'
import { getTeamColor, getTeamName } from '../utils/colors.js'

/**
 * 球员多选列表组件
 * 按球队分组，每组可折叠展开
 * 支持全选/取消全选
 * @param {Array} players - 球员列表
 * @param {Array} selectedIds - 选中的球员ID列表
 * @param {(ids: number[]) => void} onChange - 选择变化回调
 */
function PlayerSelector({ players, selectedIds, onChange }) {
  // 记录每个球队的折叠状态，默认展开
  const [collapsedTeams, setCollapsedTeams] = useState({})

  const allSelected = useMemo(() => {
    return players.length > 0 && selectedIds.length === players.length
  }, [players, selectedIds])

  // 切换单个球员选中状态
  const togglePlayer = useCallback((playerId) => {
    if (selectedIds.includes(playerId)) {
      onChange(selectedIds.filter(id => id !== playerId))
    } else {
      onChange([...selectedIds, playerId])
    }
  }, [selectedIds, onChange])

  // 全选/取消全选
  const toggleAll = useCallback(() => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(players.map(p => p.player_id))
    }
  }, [allSelected, players, onChange])

  // 切换球队折叠
  const toggleTeamCollapse = useCallback((team) => {
    setCollapsedTeams(prev => ({
      ...prev,
      [team]: !prev[team]
    }))
  }, [])

  // 按球队分组
  const groupedPlayers = useMemo(() => {
    const groups = {}
    for (const player of players) {
      const team = player.team || 'unknown'
      if (!groups[team]) {
        groups[team] = []
      }
      groups[team].push(player)
    }
    return groups
  }, [players])

  return (
    <div className="player-selector">
      <div className="selector-header">
        <h3 className="selector-title">球员列表</h3>
        <label className="select-all-label">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span>{allSelected ? '取消全选' : '全选'}</span>
        </label>
      </div>
      <div className="player-list">
        {Object.entries(groupedPlayers).map(([team, teamPlayers]) => {
          const isCollapsed = collapsedTeams[team]
          const selectedCount = teamPlayers.filter(p => selectedIds.includes(p.player_id)).length
          return (
            <div key={team} className={"team-group" + (isCollapsed ? " collapsed" : "")}>
              <div
                className="team-group-header"
                onClick={() => toggleTeamCollapse(team)}
              >
                <span
                  className="team-color-dot"
                  style={{ backgroundColor: getTeamColor(team) }}
                ></span>
                <span className="team-group-name">{getTeamName(team)}</span>
                <span className="team-player-count">
                  {selectedCount}/{teamPlayers.length}
                </span>
                <span className="team-toggle-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
              <div className="team-group-body">
                {teamPlayers.map(player => (
                  <label
                    key={player.player_id}
                    className={"player-item" + (selectedIds.includes(player.player_id) ? " selected" : "")}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(player.player_id)}
                      onChange={() => togglePlayer(player.player_id)}
                    />
                    <span
                      className="player-color-dot"
                      style={{ backgroundColor: getTeamColor(team) }}
                    ></span>
                    <span className="player-id">{player.player_id}号</span>
                    {player.position && (
                      <span className="player-position">· {player.position}</span>
                    )}
                    {player.stats?.main_zone && (
                      <span className="player-zone">{player.stats.main_zone}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PlayerSelector
