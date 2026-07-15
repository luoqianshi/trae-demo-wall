/**
 * 球场绘制工具函数
 * 标准足球场比例：105:68（长:宽）
 * 球场坐标系：x: 0-100（左到右），y: 0-100（上到下）
 */

// 球场长宽比（105:68）
export const PITCH_RATIO = 105 / 68

// 球场边距（像素），留给球场外围标记的空间
const PITCH_PADDING = 20

/**
 * 将球场坐标(0-100)转换为Canvas像素坐标
 * @param {number} xField - 球场x坐标(0-100)
 * @param {number} yField - 球场y坐标(0-100)
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @returns {{x: number, y: number}} Canvas像素坐标
 */
export function fieldToCanvas(xField, yField, canvasWidth, canvasHeight) {
  const playWidth = canvasWidth - PITCH_PADDING * 2
  const playHeight = canvasHeight - PITCH_PADDING * 2
  const x = PITCH_PADDING + (xField / 100) * playWidth
  const y = PITCH_PADDING + (yField / 100) * playHeight
  return { x, y }
}

/**
 * 在Canvas上绘制标准足球场
 * 包含：边线、底线、中线、中圈、两个禁区、两个球门
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {number} width - Canvas宽度
 * @param {number} height - Canvas高度
 */
export function drawPitch(ctx, width, height) {
  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 绘制深绿色背景（球场草地）—— 转播级深草绿
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
  bgGradient.addColorStop(0, '#0f4d28')
  bgGradient.addColorStop(0.5, '#146b36')
  bgGradient.addColorStop(1, '#0f4d28')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)

  // 绘制条纹草地效果
  const stripeCount = 10
  const stripeWidth = width / stripeCount
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)'
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillRect(i * stripeWidth, 0, stripeWidth, height)
  }

  // 绘制球场暗角，增强电影感
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.4, width / 2, height / 2, height * 0.85)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.25)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)

  // 设置线条样式
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 2

  const tl = fieldToCanvas(0, 0, width, height)        // 左上角
  const tr = fieldToCanvas(100, 0, width, height)       // 右上角
  const bl = fieldToCanvas(0, 100, width, height)       // 左下角
  const br = fieldToCanvas(100, 100, width, height)     // 右下角
  const ct = fieldToCanvas(50, 0, width, height)        // 中线上端
  const cb = fieldToCanvas(50, 100, width, height)      // 中线下端
  const center = fieldToCanvas(50, 50, width, height)   // 中点

  // 绘制外边线
  ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y)

  // 绘制中线
  ctx.beginPath()
  ctx.moveTo(ct.x, ct.y)
  ctx.lineTo(cb.x, cb.y)
  ctx.stroke()

  // 绘制中圈
  const centerRadius = ((width - PITCH_PADDING * 2) / 100) * 9.15 // 中圈半径9.15m
  ctx.beginPath()
  ctx.arc(center.x, center.y, centerRadius, 0, Math.PI * 2)
  ctx.stroke()

  // 绘制中点
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.beginPath()
  ctx.arc(center.x, center.y, 3, 0, Math.PI * 2)
  ctx.fill()

  // 绘制左禁区（16.5m深，40.32m宽）
  drawPenaltyBox(ctx, width, height, 'left')
  // 绘制右禁区
  drawPenaltyBox(ctx, width, height, 'right')

  // 绘制左小禁区（5.5m深，18.32m宽）
  drawGoalArea(ctx, width, height, 'left')
  // 绘制右小禁区
  drawGoalArea(ctx, width, height, 'right')

  // 绘制球门
  drawGoal(ctx, width, height, 'left')
  drawGoal(ctx, width, height, 'right')

  // 绘制角球弧
  drawCornerArcs(ctx, width, height)
}

/**
 * 绘制禁区（大禁区）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {'left'|'right'} side
 */
function drawPenaltyBox(ctx, width, height, side) {
  // 禁区尺寸：深16.5m，宽40.32m
  // 球场宽68m，所以禁区在y方向居中：(68-40.32)/2 = 13.84m → 13.84/68*100 ≈ 20.35
  const boxDepth = 16.5 // 深度16.5m
  const boxDepthPercent = (boxDepth / 105) * 100 // 转为百分比
  const yTop = 20.35
  const yBottom = 79.65

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 2

  ctx.beginPath()
  if (side === 'left') {
    const p1 = fieldToCanvas(0, yTop, width, height)
    const p2 = fieldToCanvas(boxDepthPercent, yTop, width, height)
    const p3 = fieldToCanvas(boxDepthPercent, yBottom, width, height)
    const p4 = fieldToCanvas(0, yBottom, width, height)
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p3.x, p3.y)
    ctx.lineTo(p4.x, p4.y)
  } else {
    const p1 = fieldToCanvas(100, yTop, width, height)
    const p2 = fieldToCanvas(100 - boxDepthPercent, yTop, width, height)
    const p3 = fieldToCanvas(100 - boxDepthPercent, yBottom, width, height)
    const p4 = fieldToCanvas(100, yBottom, width, height)
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p3.x, p3.y)
    ctx.lineTo(p4.x, p4.y)
  }
  ctx.stroke()

  // 绘制点球点
  const penaltySpotX = side === 'left' ? 11 / 105 * 100 : 100 - 11 / 105 * 100
  const penaltySpot = fieldToCanvas(penaltySpotX, 50, width, height)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.beginPath()
  ctx.arc(penaltySpot.x, penaltySpot.y, 3, 0, Math.PI * 2)
  ctx.fill()

  // 绘制罚球弧（以点球点为圆心，半径9.15m）
  const arcRadius = ((width - PITCH_PADDING * 2) / 100) * (9.15 / 105 * 100)
  ctx.beginPath()
  if (side === 'left') {
    // 左侧弧线从约53度到127度
    ctx.arc(penaltySpot.x, penaltySpot.y, arcRadius, -0.92, 0.92)
  } else {
    // 右侧弧线
    ctx.arc(penaltySpot.x, penaltySpot.y, arcRadius, Math.PI - 0.92, Math.PI + 0.92)
  }
  ctx.stroke()
}

/**
 * 绘制小禁区（球门区）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {'left'|'right'} side
 */
function drawGoalArea(ctx, width, height, side) {
  // 小禁区尺寸：深5.5m，宽18.32m
  const boxDepth = 5.5
  const boxDepthPercent = (boxDepth / 105) * 100
  const yTop = 36.06 // (68-18.32)/2/68*100
  const yBottom = 63.94

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 2

  ctx.beginPath()
  if (side === 'left') {
    const p1 = fieldToCanvas(0, yTop, width, height)
    const p2 = fieldToCanvas(boxDepthPercent, yTop, width, height)
    const p3 = fieldToCanvas(boxDepthPercent, yBottom, width, height)
    const p4 = fieldToCanvas(0, yBottom, width, height)
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p3.x, p3.y)
    ctx.lineTo(p4.x, p4.y)
  } else {
    const p1 = fieldToCanvas(100, yTop, width, height)
    const p2 = fieldToCanvas(100 - boxDepthPercent, yTop, width, height)
    const p3 = fieldToCanvas(100 - boxDepthPercent, yBottom, width, height)
    const p4 = fieldToCanvas(100, yBottom, width, height)
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p3.x, p3.y)
    ctx.lineTo(p4.x, p4.y)
  }
  ctx.stroke()
}

/**
 * 绘制球门
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {'left'|'right'} side
 */
function drawGoal(ctx, width, height, side) {
  // 球门宽7.32m
  const yTop = 44.65 // (68-7.32)/2/68*100
  const yBottom = 55.35

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 3

  const goalDepth = 6 // 球门在画布外的深度（像素）
  ctx.beginPath()
  if (side === 'left') {
    const p1 = fieldToCanvas(0, yTop, width, height)
    const p2 = fieldToCanvas(0, yBottom, width, height)
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p1.x - goalDepth, p1.y)
    ctx.lineTo(p2.x - goalDepth, p2.y)
    ctx.lineTo(p2.x, p2.y)
  } else {
    const p1 = fieldToCanvas(100, yTop, width, height)
    const p2 = fieldToCanvas(100, yBottom, width, height)
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p1.x + goalDepth, p1.y)
    ctx.lineTo(p2.x + goalDepth, p2.y)
    ctx.lineTo(p2.x, p2.y)
  }
  ctx.stroke()
}

/**
 * 绘制四个角球弧
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
function drawCornerArcs(ctx, width, height) {
  const arcRadius = 8
  const corners = [
    { pos: fieldToCanvas(0, 0, width, height), startAngle: 0, endAngle: Math.PI / 2 },
    { pos: fieldToCanvas(100, 0, width, height), startAngle: Math.PI / 2, endAngle: Math.PI },
    { pos: fieldToCanvas(100, 100, width, height), startAngle: Math.PI, endAngle: Math.PI * 1.5 },
    { pos: fieldToCanvas(0, 100, width, height), startAngle: Math.PI * 1.5, endAngle: Math.PI * 2 },
  ]

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 2

  corners.forEach(({ pos, startAngle, endAngle }) => {
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, arcRadius, startAngle, endAngle)
    ctx.stroke()
  })
}

/**
 * 获取球场边距
 * @returns {number}
 */
export function getPitchPadding() {
  return PITCH_PADDING
}
