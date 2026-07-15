import { useCallback, useMemo } from 'react'
import { getPlayerColor, getSideName } from '../utils/colors.js'

/**
 * 球员多选列表组件（乒乓球版）
 * 显示2个选手（左侧/右侧），支持复选框选择
 * @param {Array} players - 球员列表
 * @param {Array} selectedIds - 选中的球员ID列表
 * @param {(ids: number[]) => void} onChange - 选择变化回调
 */
function PlayerSelector({ players, selectedIds, onChange }) {
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

  return (
    <div className="pp-player-selector">
      <div className="pp-selector-header">
        <h3 className="pp-selector-title">选手列表</h3>
        <label className="pp-select-all-label">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span>{allSelected ? '取消全选' : '全选'}</span>
        </label>
      </div>
      <div className="pp-player-list">
        {players.map(player => (
          <label
            key={player.player_id}
            className={"pp-player-item" + (selectedIds.includes(player.player_id) ? " selected" : "")}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(player.player_id)}
              onChange={() => togglePlayer(player.player_id)}
            />
            <span
              className="pp-player-color-dot"
              style={{ backgroundColor: getPlayerColor(player.team) }}
            ></span>
            <span className="pp-player-id">{player.player_id}号</span>
            <span className="pp-player-side">{getSideName(player.team)}</span>
            {player.stats?.hit_count != null && (
              <span className="pp-player-hits">{player.stats.hit_count}次击球</span>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

export default PlayerSelector
