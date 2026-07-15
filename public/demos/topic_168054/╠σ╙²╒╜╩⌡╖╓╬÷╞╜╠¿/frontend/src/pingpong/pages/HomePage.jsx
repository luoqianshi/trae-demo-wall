import { useState, useRef, useCallback, useEffect } from 'react'
import { uploadVideo } from '../api/client.js'
import { drawTable, tableToCanvas, drawZones } from '../utils/table.js'
import { drawHeatmap, drawLandingPoint } from '../utils/heatmap.js'

/**
 * 预览Canvas组件
 * 用Canvas绘制标准乒乓球桌俯视图 + 模拟落点热力图
 * 用户一进来就能看到分析效果预览
 */
function PreviewCanvas() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const render = () => {
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      if (containerWidth === 0 || containerHeight === 0) return

      const tableRatio = 2.74 / 1.525
      let canvasWidth, canvasHeight

      if (containerWidth / containerHeight > tableRatio) {
        canvasHeight = containerHeight
        canvasWidth = canvasHeight * tableRatio
      } else {
        canvasWidth = containerWidth
        canvasHeight = canvasWidth / tableRatio
      }

      const dpr = window.devicePixelRatio || 1
      canvas.width = canvasWidth * dpr
      canvas.height = canvasHeight * dpr
      canvas.style.width = canvasWidth + 'px'
      canvas.style.height = canvasHeight + 'px'

      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)

      // 绘制球桌底图
      drawTable(ctx, canvasWidth, canvasHeight)

      // 绘制分区线
      drawZones(ctx, canvasWidth, canvasHeight)

      // 生成模拟落点数据（用于预览展示）
      const mockLandingPoints = []
      const rng = ((seed) => () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      })(12345)

      for (let i = 0; i < 25; i++) {
        const isLeft = rng() < 0.5
        const x = isLeft ? 5 + rng() * 37 : 58 + rng() * 37
        const yRand = rng()
        let y, zone
        if (yRand < 0.3) {
          y = 10 + rng() * 25
          zone = 'left'
        } else if (yRand < 0.7) {
          y = 35 + rng() * 30
          zone = 'center'
        } else {
          y = 65 + rng() * 25
          zone = 'right'
        }
        mockLandingPoints.push({ x, y, zone })
      }

      // 绘制热力图
      drawHeatmap(ctx, mockLandingPoints, canvasWidth, canvasHeight, 30)

      // 绘制落点标记
      for (const point of mockLandingPoints) {
        const color = point.zone === 'left' ? '#3b82f6' :
                      point.zone === 'center' ? '#f59e0b' : '#ef4444'
        drawLandingPoint(ctx, point, canvasWidth, canvasHeight, color)
      }

      // 标注分区
      ctx.save()
      ctx.font = 'bold 12px Arial'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.textAlign = 'center'
      const zones = [
        { label: '左路', x: 16.7, y: 96 },
        { label: '中路', x: 50, y: 96 },
        { label: '右路', x: 83.3, y: 96 },
      ]
      for (const zone of zones) {
        const pos = tableToCanvas(zone.x, zone.y, canvasWidth, canvasHeight)
        ctx.fillText(zone.label, pos.x, pos.y)
      }

      // 标注球网
      ctx.font = '11px Arial'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      const netPos = tableToCanvas(50, 50, canvasWidth, canvasHeight)
      ctx.fillText('球网', netPos.x, netPos.y - 10)

      ctx.restore()
    }

    render()
    window.addEventListener('resize', render)
    return () => window.removeEventListener('resize', render)
  }, [])

  return (
    <div className="pp-preview-container" ref={containerRef}>
      <canvas ref={canvasRef} className="pp-preview-canvas" />
    </div>
  )
}

/**
 * 首页组件（核心改版！）
 * 左右分栏布局：
 * - 左侧40%：上传区域（拖拽/点击上传 + 上传进度 + 开始分析按钮）
 * - 右侧60%：预览展示区（Canvas绘制的球桌+热力图示意图）
 * 用户一进来就能看到"上传视频后能得到什么样的分析结果"
 * @param {(taskId: string) => void} onAnalyze - 进入分析页回调
 */
function HomePage({ onAnalyze }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [taskId, setTaskId] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  // 处理文件选择
  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return
    const ext = selectedFile.name.split('.').pop().toLowerCase()
    const validExts = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv']
    if (!validExts.includes(ext)) {
      setError('请选择视频文件（支持 MP4, AVI, MOV, MKV, WMV, FLV 格式）')
      return
    }
    setError(null)
    setFile(selectedFile)
    setTaskId(null)
    setUploadProgress(0)
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    if (uploading) return
    fileInputRef.current?.click()
  }, [uploading])

  const handleInputChange = useCallback((e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
    e.target.value = ''
  }, [handleFileSelect])

  const handleUpload = useCallback(async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setUploadProgress(0)
    try {
      const result = await uploadVideo(file, (progress) => {
        setUploadProgress(progress)
      })
      setTaskId(result.task_id)
    } catch (e) {
      console.error('上传失败:', e)
      setError('上传失败：' + (e.response?.data?.detail || e.message))
    } finally {
      setUploading(false)
    }
  }, [file])

  const handleAnalyze = useCallback(() => {
    if (taskId) {
      onAnalyze(taskId)
    }
  }, [taskId, onAnalyze])

  // 演示模式
  const handleDemo = useCallback(() => {
    onAnalyze('demo')
  }, [onAnalyze])

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="pp-home-page">
      {/* 顶部标题 */}
      <div className="pp-home-header">
        <h1 className="pp-home-title">🏓 乒乓球战术分析工具</h1>
        <p className="pp-home-subtitle">上传比赛视频，AI自动分析落点热力图、3D球路轨迹与击球数据</p>
      </div>

      {/* 左右分栏主体 */}
      <div className="pp-home-main">
        {/* 左侧：上传区域 */}
        <div className="pp-home-left">
          <div
            className={"pp-upload-area" + (dragging ? " dragging" : "") + (file ? " has-file" : "")}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
            {!file && (
              <div className="pp-upload-placeholder">
                <div className="pp-upload-icon">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="pp-upload-text">拖拽视频文件到此处</p>
                <p className="pp-upload-text">或点击选择文件</p>
                <p className="pp-upload-hint">支持 MP4, AVI, MOV, MKV, WMV, FLV 格式</p>
              </div>
            )}
            {file && (
              <div className="pp-upload-file-info">
                <div className="pp-file-icon">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div className="pp-file-details">
                  <p className="pp-file-name">{file.name}</p>
                  <p className="pp-file-size">{formatFileSize(file.size)}</p>
                </div>
                {!uploading && !taskId && (
                  <button
                    className="pp-btn pp-btn-change"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                  >
                    更换
                  </button>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="pp-upload-error">
              <span className="pp-error-icon">!</span>
              {error}
            </div>
          )}

          {uploading && (
            <div className="pp-upload-progress-container">
              <div className="pp-upload-progress-bar">
                <div className="pp-upload-progress-fill" style={{ width: uploadProgress + '%' }} />
              </div>
              <span className="pp-upload-progress-text">{uploadProgress}%</span>
            </div>
          )}

          <div className="pp-upload-actions">
            {file && !uploading && !taskId && (
              <button className="pp-btn pp-btn-primary pp-btn-large" onClick={handleUpload}>
                上传视频
              </button>
            )}
            {taskId && (
              <button className="pp-btn pp-btn-success pp-btn-large" onClick={handleAnalyze}>
                开始分析
              </button>
            )}
          </div>

          {taskId && (
            <div className="pp-upload-success">
              视频上传成功！点击"开始分析"进入分析看板。
            </div>
          )}

          {/* 演示模式入口 */}
          <div className="pp-demo-section">
            <div className="pp-demo-divider">
              <span className="pp-demo-divider-line"></span>
              <span className="pp-demo-divider-text">想先看看效果？</span>
              <span className="pp-demo-divider-line"></span>
            </div>
            <button className="pp-btn pp-btn-demo pp-btn-large" onClick={handleDemo}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              查看演示效果
            </button>
            <p className="pp-demo-hint">使用模拟数据展示完整分析功能，无需上传视频</p>
          </div>
        </div>

        {/* 右侧：预览展示区 */}
        <div className="pp-home-right">
          <div className="pp-preview-header">
            <h2 className="pp-preview-title">分析效果预览</h2>
            <p className="pp-preview-subtitle">上传视频后将获得以下分析结果</p>
          </div>

          {/* Canvas绘制的球桌+热力图预览 */}
          <PreviewCanvas />

          {/* 核心功能列表 */}
          <div className="pp-features-list">
            <div className="pp-feature-item">
              <div className="pp-feature-icon">🎯</div>
              <div className="pp-feature-text">
                <div className="pp-feature-name">落点热力图</div>
                <div className="pp-feature-desc">球桌落点分布密度分析</div>
              </div>
            </div>
            <div className="pp-feature-item">
              <div className="pp-feature-icon">🌐</div>
              <div className="pp-feature-text">
                <div className="pp-feature-name">3D球路轨迹</div>
                <div className="pp-feature-desc">可旋转的3D球路飞行轨迹</div>
              </div>
            </div>
            <div className="pp-feature-item">
              <div className="pp-feature-icon">🏓</div>
              <div className="pp-feature-text">
                <div className="pp-feature-name">击球数据</div>
                <div className="pp-feature-desc">正反手使用率、击球频率等</div>
              </div>
            </div>
            <div className="pp-feature-item">
              <div className="pp-feature-icon">📍</div>
              <div className="pp-feature-text">
                <div className="pp-feature-name">站位分析</div>
                <div className="pp-feature-desc">选手移动轨迹与站位热力图</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
