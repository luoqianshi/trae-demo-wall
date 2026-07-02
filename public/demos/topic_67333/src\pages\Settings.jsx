import { useState, useContext, useRef } from 'react'
import { AppContext } from '../App'
import './Settings.css'

export default function Settings() {
  const { theme, setTheme, clearAllData, exportData, importData, wrongQuestions } = useContext(AppContext)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wrong-questions-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (!data.wrongQuestions || !Array.isArray(data.wrongQuestions)) {
          setImportStatus({ type: 'error', message: '文件格式不正确，缺少 wrongQuestions 数组' })
          return
        }

        importData(data)
        setImportStatus({ type: 'success', message: `成功导入 ${data.wrongQuestions.length} 条错题记录` })

        setTimeout(() => setImportStatus(null), 3000)
      } catch (error) {
        setImportStatus({ type: 'error', message: '文件解析失败，请确保是有效的 JSON 文件' })
      }
    }
    reader.readAsText(file)

    e.target.value = ''
  }

  const handleClearAll = () => {
    clearAllData()
    setShowClearConfirm(false)
    window.location.reload()
  }

  return (
    <div className="settings-page fade-in">
      <div className="page-header">
        <h1 className="page-title">设置</h1>
        <p className="page-subtitle">管理你的学习数据</p>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">🎨 外观</h3>
        <div className="settings-card">
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>深色模式</h4>
              <p>切换深色/浅色主题</p>
            </div>
            <div
              className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
              onClick={handleThemeToggle}
            >
              <div className="toggle-knob" />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">💾 数据管理</h3>
        <div className="settings-card">
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>当前数据量</h4>
              <p>共 {wrongQuestions.length} 条错题记录</p>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h4>导出数据</h4>
              <p>将所有错题和复习计划导出为 JSON 文件</p>
            </div>
            <button className="btn btn-secondary" onClick={handleExport}>
              导出 JSON
            </button>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <h4>导入数据</h4>
              <p>从 JSON 文件导入错题数据</p>
            </div>
            <button className="btn btn-secondary" onClick={handleImportClick}>
              导入 JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="file-input-hidden"
              onChange={handleFileChange}
            />
          </div>

          {importStatus && (
            <div className={`import-status ${importStatus.type}`}>
              {importStatus.type === 'success' ? '✓ ' : '✕ '}
              {importStatus.message}
            </div>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">⚠️ 危险区域</h3>
        <div className="settings-card danger-zone">
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>清空所有数据</h4>
              <p>删除所有错题、复习计划和设置，此操作不可恢复</p>
            </div>
            <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
              清空数据
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">ℹ️ 数据说明</h3>
        <div className="settings-card">
          <div className="data-info">
            <p>
              <strong>存储位置：</strong>所有数据保存在浏览器的 localStorage 中。
            </p>
            <p>
              <strong>容量限制：</strong>localStorage 容量有限（约 5-10MB），建议定期导出重要数据。
            </p>
            <p>
              <strong>数据迁移：</strong>导出 JSON 文件后，可在任何时候导入恢复。
            </p>
            <p>
              <strong>云端备份：</strong>后续版本将支持云端同步功能。
            </p>
            <p>
              <strong>API 预留：</strong>当前版本使用 Mock AI，后续可接入真实豆包 API。
            </p>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">🔮 AI 接口预留</h3>
        <div className="settings-card">
          <div className="api-info">
            <div className="api-item">
              <span className="api-label">图片识别</span>
              <span className="api-status">Mock</span>
            </div>
            <div className="api-item">
              <span className="api-label">错因诊断</span>
              <span className="api-status">Mock</span>
            </div>
            <div className="api-item">
              <span className="api-label">变式题生成</span>
              <span className="api-status">Mock</span>
            </div>
            <div className="api-item">
              <span className="api-label">复习计划</span>
              <span className="api-status">Mock</span>
            </div>
          </div>
          <p className="api-note">
            当前使用本地 Mock 逻辑。后续接入真实 AI API 时，只需替换对应函数。
          </p>
        </div>
      </div>

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>确认清空所有数据</h3>
            <p>
              这将删除所有错题记录、复习计划和设置。<br />
              <strong>此操作不可恢复！</strong>
            </p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={handleClearAll}>
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
