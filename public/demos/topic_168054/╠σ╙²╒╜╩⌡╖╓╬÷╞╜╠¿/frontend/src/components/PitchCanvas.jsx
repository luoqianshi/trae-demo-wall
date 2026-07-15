import { useRef, useEffect, useState, createContext, useContext, useCallback } from 'react'
import { drawPitch, getPitchPadding } from '../utils/pitch.js'

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
 * 球场底图Canvas组件
 * 绘制标准足球场，并提供Canvas引用给子组件在同一Canvas上绘制
 * 球场比例：105:68（长:宽）
 */
function PitchCanvas({ children }) {
  const canvasRef = useRef(null)
  const [canvasInfo, setCanvasInfo] = useState(null)
  const containerRef = useRef(null)

  // 绘制球场底图
  const renderPitch = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // 根据容器尺寸设置Canvas大小
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // 球场比例 105:68
    const pitchRatio = 105 / 68
    let canvasWidth, canvasHeight

    if (containerWidth / containerHeight > pitchRatio) {
      // 容器更宽，以高度为基准
      canvasHeight = containerHeight
      canvasWidth = canvasHeight * pitchRatio
    } else {
      // 容器更高，以宽度为基准
      canvasWidth = containerWidth
      canvasHeight = canvasWidth / pitchRatio
    }

    // 设置Canvas实际像素尺寸（考虑设备像素比，保证清晰度）
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    canvas.style.width = canvasWidth + 'px'
    canvas.style.height = canvasHeight + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // 绘制球场底图
    drawPitch(ctx, canvasWidth, canvasHeight)

    // 更新Canvas信息，通知子组件
    setCanvasInfo({
      ctx,
      width: canvasWidth,
      height: canvasHeight,
      redraw: () => {
        drawPitch(ctx, canvasWidth, canvasHeight)
      },
    })
  }, [])

  // 初始化和窗口大小变化时重绘
  useEffect(() => {
    renderPitch()

    const handleResize = () => {
      renderPitch()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [renderPitch])

  // canvasInfo变化时重绘子组件
  useEffect(() => {
    if (canvasInfo) {
      // 强制子组件重绘：canvasInfo变化会触发useEffect
    }
  }, [canvasInfo])

  return (
    <div className="pitch-container" ref={containerRef}>
      <canvas ref={canvasRef} className="pitch-canvas" />
      {canvasInfo && (
        <CanvasContext.Provider value={canvasInfo}>
          {children}
        </CanvasContext.Provider>
      )}
    </div>
  )
}

export default PitchCanvas