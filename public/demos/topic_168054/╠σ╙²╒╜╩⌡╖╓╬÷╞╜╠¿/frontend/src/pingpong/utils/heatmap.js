import { tableToCanvas } from './table.js'
import { getHeatColor } from './colors.js'

/**
 * 热力图计算与绘制工具
 * 使用网格密度统计 + 径向渐变叠加的方式
 * 颜色渐变：绿→黄→红表示密度
 */

/**
 * 在Canvas上绘制热力图
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {Array<{x: number, y: number}>} points - 坐标点列表（球桌坐标0-100）
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @param {number} radius - 热力点半径（像素），默认28
 */
export function drawHeatmap(ctx, points, canvasWidth, canvasHeight, radius = 28) {
  if (!points || points.length === 0) return

  // 使用网格法计算密度
  const gridSize = 8
  const gridCols = Math.ceil(100 / gridSize) + 1
  const gridRows = Math.ceil(100 / gridSize) + 1
  const grid = new Array(gridRows * gridCols).fill(0)

  // 统计每个网格的点数
  for (const point of points) {
    const col = Math.min(gridCols - 1, Math.floor(point.x / gridSize))
    const row = Math.min(gridRows - 1, Math.floor(point.y / gridSize))
    grid[row * gridCols + col]++
  }

  // 找到最大密度值
  let maxDensity = 0
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > maxDensity) maxDensity = grid[i]
  }

  if (maxDensity === 0) return

  // 使用径向渐变绘制每个有数据的网格中心
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const count = grid[row * gridCols + col]
      if (count === 0) continue

      const density = count / maxDensity
      const xField = col * gridSize + gridSize / 2
      const yField = row * gridSize + gridSize / 2
      const { x, y } = tableToCanvas(xField, yField, canvasWidth, canvasHeight)

      // 创建径向渐变
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      const color = getHeatColor(density)
      gradient.addColorStop(0, color)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}

/**
 * 在Canvas上绘制单个落点标记
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {{x: number, y: number, zone?: string}} point - 落点坐标
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @param {string} color - 标记颜色
 */
export function drawLandingPoint(ctx, point, canvasWidth, canvasHeight, color = '#f59e0b') {
  const { x, y } = tableToCanvas(point.x, point.y, canvasWidth, canvasHeight)

  ctx.save()
  // 外圈光晕
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8)
  gradient.addColorStop(0, color)
  gradient.addColorStop(0.5, color + '80')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, 8, 0, Math.PI * 2)
  ctx.fill()

  // 中心点
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 3, 0, Math.PI * 2)
  ctx.fill()

  // 白色边框
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}
