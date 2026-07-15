/**
 * 乒乓球桌绘制工具函数
 * 标准乒乓球桌比例：2.74:1.525（长:宽），约16:9
 * 球桌坐标系：x: 0-100（左到右，即球桌长度方向），y: 0-100（上到下，即球桌宽度方向）
 * 球网位于y=50（中线位置）
 */

// 球桌长宽比（2.74:1.525）
export const TABLE_RATIO = 2.74 / 1.525

// 球桌边距（像素），留给球桌外围标记的空间
const TABLE_PADDING = 24

/**
 * 将球桌坐标(0-100)转换为Canvas像素坐标
 * @param {number} xTable - 球桌x坐标(0-100)
 * @param {number} yTable - 球桌y坐标(0-100)
 * @param {number} canvasWidth - Canvas宽度
 * @param {number} canvasHeight - Canvas高度
 * @returns {{x: number, y: number}} Canvas像素坐标
 */
export function tableToCanvas(xTable, yTable, canvasWidth, canvasHeight) {
  const playWidth = canvasWidth - TABLE_PADDING * 2
  const playHeight = canvasHeight - TABLE_PADDING * 2
  const x = TABLE_PADDING + (xTable / 100) * playWidth
  const y = TABLE_PADDING + (yTable / 100) * playHeight
  return { x, y }
}

/**
 * 在Canvas上绘制标准乒乓球桌俯视图
 * 包含：深蓝色台面、白色边线、中线、球网位置标记
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {number} width - Canvas宽度
 * @param {number} height - Canvas高度
 */
export function drawTable(ctx, width, height) {
  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 绘制深色背景
  ctx.fillStyle = '#0a1628'
  ctx.fillRect(0, 0, width, height)

  // 计算球桌区域
  const tl = tableToCanvas(0, 0, width, height)
  const br = tableToCanvas(100, 100, width, height)
  const tableW = br.x - tl.x
  const tableH = br.y - tl.y

  // 绘制球桌阴影
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 6
  // 绘制深蓝色球桌台面
  const tableGradient = ctx.createLinearGradient(tl.x, tl.y, br.x, br.y)
  tableGradient.addColorStop(0, '#1a3a6e')
  tableGradient.addColorStop(0.5, '#1e4a8e')
  tableGradient.addColorStop(1, '#1a3a6e')
  ctx.fillStyle = tableGradient
  ctx.fillRect(tl.x, tl.y, tableW, tableH)
  ctx.restore()

  // 绘制白色边线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 2.5
  ctx.strokeRect(tl.x, tl.y, tableW, tableH)

  // 绘制中线（沿球桌长度方向的中线，分隔左右半区）
  const midTop = tableToCanvas(50, 0, width, height)
  const midBottom = tableToCanvas(50, 100, width, height)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(midTop.x, midTop.y)
  ctx.lineTo(midBottom.x, midBottom.y)
  ctx.stroke()

  // 绘制球网（在y=50位置，即球桌宽度的中线）
  const netLeft = tableToCanvas(0, 50, width, height)
  const netRight = tableToCanvas(100, 50, width, height)

  // 球网区域背景
  ctx.save()
  ctx.fillStyle = 'rgba(200, 200, 200, 0.15)'
  ctx.fillRect(tl.x, netLeft.y - 3, tableW, 6)
  ctx.restore()

  // 球网线条
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(netLeft.x, netLeft.y)
  ctx.lineTo(netRight.x, netRight.y)
  ctx.stroke()

  // 球网纹理（竖线模拟网孔）
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  const netStripeCount = 40
  for (let i = 0; i <= netStripeCount; i++) {
    const x = netLeft.x + (tableW / netStripeCount) * i
    ctx.beginPath()
    ctx.moveTo(x, netLeft.y - 3)
    ctx.lineTo(x, netLeft.y + 3)
    ctx.stroke()
  }

  // 标注左右半区文字
  ctx.save()
  ctx.font = 'bold 13px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const leftCenter = tableToCanvas(25, 25, width, height)
  ctx.fillText('左侧半区', leftCenter.x, leftCenter.y)
  const rightCenter = tableToCanvas(75, 25, width, height)
  ctx.fillText('右侧半区', rightCenter.x, rightCenter.y)
  const leftBottom = tableToCanvas(25, 75, width, height)
  ctx.fillText('左侧半区', leftBottom.x, leftBottom.y)
  const rightBottom = tableToCanvas(75, 75, width, height)
  ctx.fillText('右侧半区', rightBottom.x, rightBottom.y)
  ctx.restore()

  // 标注球网位置
  ctx.save()
  ctx.font = '11px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.textAlign = 'center'
  ctx.fillText('球网', (netLeft.x + netRight.x) / 2, netLeft.y - 12)
  ctx.restore()
}

/**
 * 在Canvas上绘制球桌分区标记（左/中/右）
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
 * @param {number} width - Canvas宽度
 * @param {number} height - Canvas高度
 */
export function drawZones(ctx, width, height) {
  ctx.save()
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])

  // 左中右分界线（x=33和x=67）
  const zone1Top = tableToCanvas(33.3, 0, width, height)
  const zone1Bottom = tableToCanvas(33.3, 100, width, height)
  ctx.beginPath()
  ctx.moveTo(zone1Top.x, zone1Top.y)
  ctx.lineTo(zone1Bottom.x, zone1Bottom.y)
  ctx.stroke()

  const zone2Top = tableToCanvas(66.7, 0, width, height)
  const zone2Bottom = tableToCanvas(66.7, 100, width, height)
  ctx.beginPath()
  ctx.moveTo(zone2Top.x, zone2Top.y)
  ctx.lineTo(zone2Bottom.x, zone2Bottom.y)
  ctx.stroke()

  ctx.restore()
}

/**
 * 获取球桌边距
 * @returns {number}
 */
export function getTablePadding() {
  return TABLE_PADDING
}
