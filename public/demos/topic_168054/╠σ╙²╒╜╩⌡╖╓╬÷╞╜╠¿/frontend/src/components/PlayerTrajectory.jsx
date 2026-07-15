import { useEffect } from 'react'
import { useCanvas } from './PitchCanvas.jsx'
import { fieldToCanvas } from '../utils/pitch.js'
import { getPlayerColor } from '../utils/colors.js'
import { drawHeatmap } from '../utils/heatmap.js'

/**
 * 球员轨迹+热力图绘制组件
 * 在球场Canvas上绘制选中球员的热力图和轨迹线
 * @param {Array} players - 球员数据列表
 * @param {[number, number]} timeRange - 时间范围 [起始秒, 结束秒]
 * @param {boolean} drawHeatmap - 是否绘制热力图
 * @param {boolean} drawTrajectory - 是否绘制轨迹线
 */
function PlayerTrajectory({ players, timeRange, drawHeatmap: shouldDrawHeatmap, drawTrajectory: shouldDrawTrajectory }) {
  const canvasInfo = useCanvas()

  useEffect(() => {
    if (!canvasInfo || !players || players.length === 0) return

    const { ctx, width, height, redraw } = canvasInfo

    // 先重绘球场底图（清除之前的绘制）
    redraw()

    // 遍历每个选中的球员
    for (const player of players) {
      if (!player.trajectory || player.trajectory.length === 0) continue

      // 过滤时间范围内的轨迹点
      const filteredPoints = player.trajectory.filter(
        point => point.timestamp >= timeRange[0] && point.timestamp <= timeRange[1]
      )

      if (filteredPoints.length === 0) continue

      const color = getPlayerColor(player.player_id)

      // 绘制热力图
      if (shouldDrawHeatmap) {
        drawHeatmap(ctx, filteredPoints, width, height, 35)
      }

      // 绘制轨迹线
      if (shouldDrawTrajectory) {
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'

        ctx.beginPath()
        const firstPoint = fieldToCanvas(filteredPoints[0].x, filteredPoints[0].y, width, height)
        ctx.moveTo(firstPoint.x, firstPoint.y)

        for (let i = 1; i < filteredPoints.length; i++) {
          const point = fieldToCanvas(filteredPoints[i].x, filteredPoints[i].y, width, height)
          ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()

        // 绘制起点（圆圈标记）
        ctx.fillStyle = color
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(firstPoint.x, firstPoint.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // 绘制终点（方形标记）
        const lastPoint = fieldToCanvas(
          filteredPoints[filteredPoints.length - 1].x,
          filteredPoints[filteredPoints.length - 1].y,
          width, height
        )
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.rect(lastPoint.x - 5, lastPoint.y - 5, 10, 10)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // 绘制球员ID标签
        ctx.font = 'bold 12px Arial'
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        ctx.textAlign = 'center'
        const label = '#' + player.player_id
        ctx.strokeText(label, lastPoint.x, lastPoint.y - 10)
        ctx.fillText(label, lastPoint.x, lastPoint.y - 10)

        ctx.restore()
      }
    }
  }, [canvasInfo, players, timeRange, shouldDrawHeatmap, shouldDrawTrajectory])

  return null
}

export default PlayerTrajectory