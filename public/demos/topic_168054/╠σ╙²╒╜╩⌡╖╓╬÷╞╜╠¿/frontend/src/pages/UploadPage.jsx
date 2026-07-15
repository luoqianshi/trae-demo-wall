import { useState, useRef, useCallback } from 'react'
import { uploadVideo } from '../api/client.js'

/**
 * 视频上传页面
 * 支持拖拽上传和点击选择文件
 * 上传完成后显示"开始分析"按钮
 * 下方提供"查看演示效果"入口，使用模拟数据展示完整分析流程
 */
function UploadPage({ onAnalyze }) {
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

  // 演示模式：传入特殊'demo'作为taskId，使用模拟数据
  const handleDemo = useCallback(() => {
    onAnalyze('demo')
  }, [onAnalyze])

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="upload-page">
      <div className="upload-header">
        <div className="brand-mark">
          <span className="brand-mark-dot"></span>
          <span>AI Tactical Analysis</span>
        </div>
        <h1 className="upload-title">
          足球<span className="upload-title-accent">战术</span>分析
        </h1>
        <p className="upload-subtitle">
          上传比赛视频，AI 自动追踪球员轨迹、绘制热力图并生成战术洞察报告
        </p>
      </div>

      <div
        className={"upload-area animate-fade-up stagger-1" + (dragging ? " dragging" : "") + (file ? " has-file" : "")}
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
          <div className="upload-placeholder">
            <div className="upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="upload-text">拖拽视频文件到此处，或点击选择文件</p>
            <p className="upload-hint">支持 MP4 / AVI / MOV / MKV / WMV / FLV 格式</p>
          </div>
        )}
        {file && (
          <div className="upload-file-info">
            <div className="file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div className="file-details">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{formatFileSize(file.size)}</p>
              <div className="file-meta">
                <span className="file-status ready">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  就绪
                </span>
                <span>等待上传至分析引擎</span>
              </div>
            </div>
            {!uploading && !taskId && (
              <button
                className="btn btn-change"
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
        <div className="upload-error">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      {uploading && (
        <div className="upload-progress-container animate-fade-up">
          <div className="upload-progress-bar">
            <div className="upload-progress-fill" style={{ width: uploadProgress + '%' }} />
          </div>
          <span className="upload-progress-text">{uploadProgress}%</span>
        </div>
      )}

      <div className="upload-actions">
        {file && !uploading && !taskId && (
          <button className="btn btn-primary btn-large animate-fade-up stagger-2" onClick={handleUpload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            上传视频
          </button>
        )}
        {taskId && (
          <button className="btn btn-success btn-large animate-fade-up" onClick={handleAnalyze}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            开始分析
          </button>
        )}
      </div>

      {taskId && (
        <div className="upload-success animate-fade-up">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          视频上传成功，点击"开始分析"进入战术看板
        </div>
      )}

      {/* 演示模式入口 */}
      <div className="demo-section animate-fade-up stagger-3">
        <div className="demo-divider">
          <span className="demo-divider-line"></span>
          <span className="demo-divider-text">快速体验</span>
          <span className="demo-divider-line"></span>
        </div>
        <button className="btn btn-demo btn-large" onClick={handleDemo}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          查看演示效果
        </button>
        <p className="demo-hint">使用模拟数据展示完整分析功能，无需上传视频</p>
      </div>
    </div>
  )
}

export default UploadPage
