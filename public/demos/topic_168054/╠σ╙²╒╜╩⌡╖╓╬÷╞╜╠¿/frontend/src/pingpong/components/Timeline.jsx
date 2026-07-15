import { useRef, useCallback, useState, useEffect } from 'react'

/**
 * 双滑块时间轴组件
 * 两个独立的可拖拽滑块控制时间范围
 * 左滑块控制起始时间，右滑块控制结束时间
 * 可选支持当前时间播放指针（独立可拖拽）
 * @param {number} duration - 视频总时长（秒）
 * @param {[number, number]} timeRange - 当前时间范围 [起始, 结束]
 * @param {(range: [number, number]) => void} onChange - 时间变化回调
 * @param {number} [currentTime] - 当前播放时间（秒，可选）
 * @param {(time: number) => void} [onCurrentTimeChange] - 当前时间变化回调（可选）
 */
function Timeline({ duration, timeRange, onChange, currentTime, onCurrentTimeChange }) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(null)

  // 是否启用当前时间指针
  const hasCurrentTime = typeof currentTime === 'number' && typeof onCurrentTimeChange === 'function'

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
        const newStart = Math.min(time, timeRange[1] - 1)
        onChange([Math.max(0, newStart), timeRange[1]])
      } else if (dragging === 'end') {
        const newEnd = Math.max(time, timeRange[0] + 1)
        onChange([timeRange[0], Math.min(duration, newEnd)])
      } else if (dragging === 'current' && hasCurrentTime) {
        // 当前时间指针只能在 timeRange[0] 到 timeRange[1] 之间移动
        const clampedTime = Math.max(timeRange[0], Math.min(timeRange[1], time))
        onCurrentTimeChange(clampedTime)
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
  }, [dragging, mouseToTime, timeRange, duration, onChange, hasCurrentTime, onCurrentTimeChange])

  // 点击轨道定位最近的滑块
  const handleTrackClick = useCallback((e) => {
    const time = mouseToTime(e.clientX)
    const distToStart = Math.abs(time - timeRange[0])
    const distToEnd = Math.abs(time - timeRange[1])
    if (distToStart < distToEnd) {
      onChange([Math.max(0, Math.min(time, timeRange[1] - 1)), timeRange[1]])
    } else {
      onChange([timeRange[0], Math.min(duration, Math.max(time, timeRange[0] + 1))])
    }
  }, [mouseToTime, timeRange, duration, onChange])

  const startPercent = duration > 0 ? (timeRange[0] / duration) * 100 : 0
  const endPercent = duration > 0 ? (timeRange[1] / duration) * 100 : 100
  // 当前时间指针的百分比位置（限制在时间范围内）
  const currentPercent = hasCurrentTime && duration > 0
    ? Math.max(startPercent, Math.min(endPercent, (currentTime / duration) * 100))
    : 0

  return (
    <div className="pp-timeline">
      <div className="pp-timeline-labels">
        <span className="pp-timeline-time-label">{formatTime(timeRange[0])}</span>
        <span className="pp-timeline-duration-label">总时长 {formatTime(duration)}</span>
        <span className="pp-timeline-time-label">{formatTime(timeRange[1])}</span>
      </div>
      <div
        className="pp-timeline-track"
        ref={trackRef}
        onClick={handleTrackClick}
      >
        <div
          className="pp-timeline-selected"
          style={{
            left: startPercent + '%',
            width: (endPercent - startPercent) + '%',
          }}
        />
        <div
          className={"pp-timeline-handle pp-handle-start" + (dragging === 'start' ? " dragging" : "")}
          style={{ left: startPercent + '%' }}
          onMouseDown={handleMouseDown('start')}
        >
          <div className="pp-handle-inner" />
        </div>
        <div
          className={"pp-timeline-handle pp-handle-end" + (dragging === 'end' ? " dragging" : "")}
          style={{ left: endPercent + '%' }}
          onMouseDown={handleMouseDown('end')}
        >
          <div className="pp-handle-inner" />
        </div>
        {/* 当前时间播放指针 */}
        {hasCurrentTime && (
          <div
            className={"pp-timeline-current-handle" + (dragging === 'current' ? " dragging" : "")}
            style={{ left: currentPercent + '%' }}
            onMouseDown={handleMouseDown('current')}
          />
        )}
      </div>
      <div className="pp-timeline-range-display">
        <span>分析时段：{formatTime(timeRange[0])} — {formatTime(timeRange[1])}</span>
        {hasCurrentTime && (
          <span style={{ marginLeft: 16 }}>
            当前：<span className="pp-timeline-current-time">{formatTime(currentTime)}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default Timeline
