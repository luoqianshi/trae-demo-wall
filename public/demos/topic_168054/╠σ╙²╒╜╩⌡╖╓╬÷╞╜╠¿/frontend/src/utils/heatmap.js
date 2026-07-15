import { fieldToCanvas } from './pitch.js'

/**
 * 热力图计算与绘制工具
 * 使用径向渐变，密度越高颜色越红（绿→黄→红）
 */

/**
 * 根据密度值（0-1）获取热力图颜色
 * 绿 → 黄 → 红 渐变
 * @param {number} density - 密度值 0-1
 * @returns {string} rgba颜色字符串
 */
function getHeatColor(density) {
  // 密度归一化到0-1
  const d = Math.min(1, Math.max(0, density))
  let r, g, b
  if (d < 0.5) {
    // 绿到黄
    const t = d * 2
    r = Math.round(34 + (255 - 34) * t)
    g = Math.round(221 + (221 - 221) * t)
    b = Math.round(85 + (34 - 85) * t)
  } else {
    // 黄到红
    const t = (d - 0.5) * 2
    r = Math.round(255 + (255 - 255) * t)
    g = Math.round(221 + (68 - 221) * t)
    b = Math.round(34 + (68 - 34) * t)
  }
  return `rgba(${r}, ${g}, ${b}, 0.6)`
}

/**
 * 在Canvas上绘制热力图
 * 使用网格密度统计 + 径向渐变叠加的方式
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {Array<{x: number, y: number}>} points - 坐标点列表（球场坐标0-100）
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @param {number} radius - 热力点半径（像素），默认30
 */
export function drawHeatmap(ctx, points, canvasWidth, canvasHeight, radius = 30) {
  if (!points || points.length === 0) return

  // 使用网格法计算密度
  // 将球场区域划分为网格，统计每个网格的点数
  const gridSize = 10 // 每个网格代表球场坐标10个单位
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
  ctx.globalCompositeOperation = 'lighter' // 叠加混合模式，使重叠区域更亮

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const count = grid[row * gridCols + col]
      if (count === 0) continue

      const density = count / maxDensity
      const xField = col * gridSize + gridSize / 2
      const yField = row * gridSize + gridSize / 2
      const { x, y } = fieldToCanvas(xField, yField, canvasWidth, canvasHeight)

      // 创建径向渐变
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      const color = getHeatColor(density)
      // 中心颜色
      gradient.addColorStop(0, color)
      // 边缘透明
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
 * 在Canvas上绘制热力图（高精度版本，逐点叠加）
 * 每个轨迹点都绘制一个径向渐变圆，通过叠加产生热力效果
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {Array<{x: number, y: number}>} points - 坐标点列表（球场坐标0-100）
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @param {number} radius - 单个热力点半径（像素），默认25
 * @param {number} alpha - 单个点的透明度，默认0.15
 */
export function drawHeatmapDetailed(ctx, points, canvasWidth, canvasHeight, radius = 25, alpha = 0.15) {
  if (!points || points.length === 0) return

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  for (const point of points) {
    const { x, y } = fieldToCanvas(point.x, point.y, canvasWidth, canvasHeight)

    // 径向渐变：中心偏红，边缘透明
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(255, 100, 0, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha * 0.6})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
