import { useRef, useCallback, useState, useEffect } from 'react'

/**
 * 双滑块时间轴组件
 * 两个独立的可拖拽滑块控制时间范围
 * 左滑块控制起始时间，右滑块控制结束时间
 * 两个滑块不能交叉
 * @param {number} duration - 视频总时长（秒）
 * @param {[number, number]} timeRange - 当前时间范围 [起始, 结束]
 * @param {(range: [number, number]) => void} onChange - 时间变化回调
 */
function Timeline({ duration, timeRange, onChange }) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(null) // 'start' | 'end' | null

  // 格式化时间为 mm:ss
  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return m + ':' + String(s).padStart(2, '0')
  }, [])

  // 将鼠标位置转换为时间值
  const mouseToTime = useCallback((clientX) => {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return percent * duration
  }, [duration])

  // 开始拖拽
  const handleMouseDown = useCallback((which) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(which)
  }, [])

  // 拖拽中
  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e) => {
      const time = mouseToTime(e.clientX)
      if (dragging === 'start') {
        // 起始时间不能大于结束时间（至少留1秒间隔）
        const newStart = Math.min(time, timeRange[1] - 1)
        onChange([Math.max(0, newStart), timeRange[1]])
      } else if (dragging === 'end') {
        // 结束时间不能小于起始时间
        const newEnd = Math.max(time, timeRange[0] + 1)
        onChange([timeRange[0], Math.min(duration, newEnd)])
      }
    }

    const handleMouseUp = () => {
      setDragging(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, mouseToTime, timeRange, duration, onChange])

  // 点击轨道定位最近的滑块
  const handleTrackClick = useCallback((e) => {
    const time = mouseToTime(e.clientX)
    // 判断点击位置更靠近哪个滑块
    const distToStart = Math.abs(time - timeRange[0])
    const distToEnd = Math.abs(time - timeRange[1])
    if (distToStart < distToEnd) {
      onChange([Math.max(0, Math.min(time, timeRange[1] - 1)), timeRange[1]])
    } else {
      onChange([timeRange[0], Math.min(duration, Math.max(time, timeRange[0] + 1))])
    }
  }, [mouseToTime, timeRange, duration, onChange])

  // 计算滑块位置百分比
  const startPercent = duration > 0 ? (timeRange[0] / duration) * 100 : 0
  const endPercent = duration > 0 ? (timeRange[1] / duration) * 100 : 100

  return (
    <div className="timeline">
      <div className="timeline-labels">
        <span className="timeline-time-label">{formatTime(timeRange[0])}</span>
        <span className="timeline-duration-label">总时长 {formatTime(duration)}</span>
        <span className="timeline-time-label">{formatTime(timeRange[1])}</span>
      </div>
      <div
        className="timeline-track"
        ref={trackRef}
        onClick={handleTrackClick}
      >
        {/* 选中区域 */}
        <div
          className="timeline-selected"
          style={{
            left: startPercent + '%',
            width: (endPercent - startPercent) + '%',
          }}
        />
        {/* 左滑块 */}
        <div
          className={"timeline-handle handle-start" + (dragging === 'start' ? " dragging" : "")}
          style={{ left: startPercent + '%' }}
          onMouseDown={handleMouseDown('start')}
        >
          <div className="handle-inner" />
        </div>
        {/* 右滑块 */}
        <div
          className={"timeline-handle handle-end" + (dragging === 'end' ? " dragging" : "")}
          style={{ left: endPercent + '%' }}
          onMouseDown={handleMouseDown('end')}
        >
          <div className="handle-inner" />
        </div>
      </div>
      <div className="timeline-range-display">
        <span>分析时段：{formatTime(timeRange[0])} — {formatTime(timeRange[1])}</span>
      </div>
    </div>
  )
}

export default Timeline