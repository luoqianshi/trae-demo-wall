import { useRef, useEffect, useState, createContext, useContext, useCallback } from 'react'
import { drawTable } from '../utils/table.js'

// 创建Canvas上下文，用于子组件获取Canvas引用
const CanvasContext = createContext(null)

/**
 * 获取Canvas上下文的Hook
 * 子组件使用此Hook获取Canvas的2D渲染上下文和尺寸
 */
export function useCanvas() {
  return useContext(CanvasContext)
}

/**
 * 2D球桌底图Canvas组件
 * 绘制标准乒乓球桌俯视图，并提供Canvas引用给子组件在同一Canvas上绘制
 * 球桌比例：2.74:1.525（长:宽）
 */
function TableCanvas2D({ children }) {
  const canvasRef = useRef(null)
  const [canvasInfo, setCanvasInfo] = useState(null)
  const containerRef = useRef(null)

  // 绘制球桌底图
  const renderTable = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // 球桌比例 2.74:1.525
    const tableRatio = 2.74 / 1.525
    let canvasWidth, canvasHeight

    if (containerWidth / containerHeight > tableRatio) {
      canvasHeight = containerHeight
      canvasWidth = canvasHeight * tableRatio
    } else {
      canvasWidth = containerWidth
      canvasHeight = canvasWidth / tableRatio
    }

    // 设置Canvas实际像素尺寸（考虑设备像素比）
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    canvas.style.width = canvasWidth + 'px'
    canvas.style.height = canvasHeight + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // 绘制球桌底图
    drawTable(ctx, canvasWidth, canvasHeight)

    // 更新Canvas信息
    setCanvasInfo({
      ctx,
      width: canvasWidth,
      height: canvasHeight,
      redraw: () => {
        drawTable(ctx, canvasWidth, canvasHeight)
      },
    })
  }, [])

  // 初始化和窗口大小变化时重绘
  useEffect(() => {
    renderTable()

    const handleResize = () => {
      renderTable()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [renderTable])

  return (
    <div className="pp-table-container" ref={containerRef}>
      <canvas ref={canvasRef} className="pp-table-canvas" />
      {canvasInfo && (
        <CanvasContext.Provider value={canvasInfo}>
          {children}
        </CanvasContext.Provider>
      )}
    </div>
  )
}

export default TableCanvas2D
