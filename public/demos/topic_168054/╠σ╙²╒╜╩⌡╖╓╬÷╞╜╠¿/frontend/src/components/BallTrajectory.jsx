import { useEffect } from 'react'
import { useCanvas } from './PitchCanvas.jsx'
import { fieldToCanvas } from '../utils/pitch.js'

/**
 * 足球轨迹绘制组件
 * 在球场Canvas上绘制足球轨迹（橙色虚线 + 方向箭头）
 * @param {Array} trajectory - 足球轨迹点列表
 */
function BallTrajectory({ trajectory }) {
  const canvasInfo = useCanvas()

  useEffect(() => {
    if (!canvasInfo || !trajectory || trajectory.length === 0) return

    const { ctx, width, height } = canvasInfo

    ctx.save()

    // 绘制虚线轨迹
    ctx.strokeStyle = '#FF8800'
    ctx.lineWidth = 2.5
    ctx.setLineDash([8, 5])
    ctx.globalAlpha = 0.85
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.beginPath()
    const firstPoint = fieldToCanvas(trajectory[0].x, trajectory[0].y, width, height)
    ctx.moveTo(firstPoint.x, firstPoint.y)

    for (let i = 1; i < trajectory.length; i++) {
      const point = fieldToCanvas(trajectory[i].x, trajectory[i].y, width, height)
      ctx.lineTo(point.x, point.y)
    }
    ctx.stroke()

    // 恢复实线
    ctx.setLineDash([])

    // 每隔一定间隔绘制方向箭头
    const arrowInterval = Math.max(1, Math.floor(trajectory.length / 15))
    for (let i = arrowInterval; i < trajectory.length; i += arrowInterval) {
      const prev = trajectory[i - arrowInterval]
      const curr = trajectory[i]
      const p1 = fieldToCanvas(prev.x, prev.y, width, height)
      const p2 = fieldToCanvas(curr.x, curr.y, width, height)

      drawArrow(ctx, p1.x, p1.y, p2.x, p2.y)
    }

    // 绘制足球起点（白色圆圈）
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#FF8800'
    ctx.lineWidth = 2
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.arc(firstPoint.x, firstPoint.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制足球当前位置（橙色圆圈）
    const lastPoint = fieldToCanvas(
      trajectory[trajectory.length - 1].x,
      trajectory[trajectory.length - 1].y,
      width, height
    )
    ctx.fillStyle = '#FF8800'
    ctx.beginPath()
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.restore()
  }, [canvasInfo, trajectory])

  return null
}

/**
 * 绘制方向箭头
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} fromX - 起点x
 * @param {number} fromY - 起点y
 * @param {number} toX - 终点x
 * @param {number} toY - 终点y
 */
function drawArrow(ctx, fromX, fromY, toX, toY) {
  const dx = toX - fromX
  const dy = toY - fromY
  const angle = Math.atan2(dy, dx)
  const headLen = 8

  ctx.save()
  ctx.fillStyle = '#FF8800'
  ctx.globalAlpha = 0.9

  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  )
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

export default BallTrajectory