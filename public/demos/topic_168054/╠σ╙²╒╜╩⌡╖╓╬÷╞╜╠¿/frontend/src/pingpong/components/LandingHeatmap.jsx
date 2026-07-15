import { useEffect } from 'react'
import { useCanvas } from './TableCanvas2D.jsx'
import { drawHeatmap, drawLandingPoint } from '../utils/heatmap.js'
import { drawZones, tableToCanvas } from '../utils/table.js'

/**
 * 2D落点热力图组件
 * 在球桌底图上绘制落点热力图和落点标记
 * 绿→黄→红表示密度
 * @param {Array} landingPoints - 落点数据列表
 * @param {[number, number]} timeRange - 时间范围
 * @param {boolean} showHeatmap - 是否显示热力图
 * @param {boolean} showPoints - 是否显示落点标记
 */
function LandingHeatmap({ landingPoints, timeRange, showHeatmap = true, showPoints = true }) {
  const canvasInfo = useCanvas()

  useEffect(() => {
    if (!canvasInfo || !landingPoints || landingPoints.length === 0) return

    const { ctx, width, height, redraw } = canvasInfo

    // 先重绘球桌底图
    redraw()

    // 绘制分区线
    drawZones(ctx, width, height)

    // 过滤时间范围内的落点
    const filteredPoints = landingPoints.filter(
      point => point.timestamp >= timeRange[0] && point.timestamp <= timeRange[1]
    )

    if (filteredPoints.length === 0) return

    // 绘制热力图
    if (showHeatmap) {
      drawHeatmap(ctx, filteredPoints, width, height, 30)
    }

    // 绘制落点标记
    if (showPoints) {
      for (const point of filteredPoints) {
        const color = point.zone === 'left' ? '#3b82f6' :
                      point.zone === 'center' ? '#f59e0b' : '#ef4444'
        drawLandingPoint(ctx, point, width, height, color)
      }
    }

    // 标注分区
    ctx.save()
    ctx.font = 'bold 11px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.textAlign = 'center'
    const zones = [
      { label: '左路', x: 16.7, y: 95 },
      { label: '中路', x: 50, y: 95 },
      { label: '右路', x: 83.3, y: 95 },
    ]
    for (const zone of zones) {
      const pos = tableToCanvas(zone.x, zone.y, width, height)
      ctx.fillText(zone.label, pos.x, pos.y)
    }
    ctx.restore()
  }, [canvasInfo, landingPoints, timeRange, showHeatmap, showPoints])

  return null
}

export default LandingHeatmap
