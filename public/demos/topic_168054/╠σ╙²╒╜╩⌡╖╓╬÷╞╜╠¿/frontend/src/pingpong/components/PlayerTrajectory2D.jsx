import { useEffect } from 'react'
import { useCanvas } from './TableCanvas2D.jsx'
import { tableToCanvas } from '../utils/table.js'
import { getPlayerColor, getSideName } from '../utils/colors.js'
import { drawHeatmap } from '../utils/heatmap.js'

/**
 * 2D球员轨迹+站位热力图组件
 * 在球桌Canvas上绘制选中球员的站位热力图和移动轨迹线
 * @param {Array} players - 球员数据列表
 * @param {[number, number]} timeRange - 时间范围
 * @param {boolean} drawHeatmapProp - 是否绘制热力图
 * @param {boolean} drawTrajectoryProp - 是否绘制轨迹线
 */
function PlayerTrajectory2D({ players, timeRange, drawHeatmap: drawHeatmapProp, drawTrajectory: drawTrajectoryProp }) {
  const canvasInfo = useCanvas()

  useEffect(() => {
    if (!canvasInfo || !players || players.length === 0) return

    const { ctx, width, height } = canvasInfo

    // 遍历每个选中的球员
    for (const player of players) {
      if (!player.trajectory || player.trajectory.length === 0) continue

      // 过滤时间范围内的轨迹点
      const filteredPoints = player.trajectory.filter(
        point => point.timestamp >= timeRange[0] && point.timestamp <= timeRange[1]
      )

      if (filteredPoints.length === 0) continue

      const color = getPlayerColor(player.team)

      // 绘制站位热力图
      if (drawHeatmapProp) {
        drawHeatmap(ctx, filteredPoints, width, height, 28)
      }

      // 绘制轨迹线
      if (drawTrajectoryProp) {
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'

        ctx.beginPath()
        const firstPoint = tableToCanvas(filteredPoints[0].x, filteredPoints[0].y, width, height)
        ctx.moveTo(firstPoint.x, firstPoint.y)

        for (let i = 1; i < filteredPoints.length; i++) {
          const point = tableToCanvas(filteredPoints[i].x, filteredPoints[i].y, width, height)
          ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()

        // 绘制起点
        ctx.fillStyle = color
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(firstPoint.x, firstPoint.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // 绘制终点
        const lastPoint = tableToCanvas(
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

        // 绘制球员标签
        ctx.font = 'bold 12px Arial'
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        ctx.textAlign = 'center'
        const label = getSideName(player.team)
        ctx.strokeText(label, lastPoint.x, lastPoint.y - 12)
        ctx.fillText(label, lastPoint.x, lastPoint.y - 12)

        ctx.restore()
      }
    }
  }, [canvasInfo, players, timeRange, drawHeatmapProp, drawTrajectoryProp])

  return null
}

export default PlayerTrajectory2D
