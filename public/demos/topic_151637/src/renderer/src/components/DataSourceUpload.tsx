import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'

/* === Inline SVG icons === */
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
)

const DatabaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
  </svg>
)

const TextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/* === Constants === */
type TabKey = 'file' | 'sql' | 'text'

const SUPPORTED_FORMATS: string[] = ['CSV', 'TSV', 'Excel', 'JSON', 'Parquet']

const DB_TYPES = ['MySQL', 'PostgreSQL', 'SQLite'] as const
type DbType = (typeof DB_TYPES)[number]

interface UploadMessage {
  type: 'success' | 'error'
  text: string
}

/* === Component === */
export default function DataSourceUpload() {
  const { showUploadModal, setShowUploadModal, uploadFile, uploadText } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabKey>('file')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<UploadMessage | null>(null)

  // SQL form state
  const [dbType, setDbType] = useState<DbType>('MySQL')
  const [dbHost, setDbHost] = useState('localhost')
  const [dbPort, setDbPort] = useState('3306')
  const [dbName, setDbName] = useState('')
  const [dbUser, setDbUser] = useState('')
  const [dbPassword, setDbPassword] = useState('')
  const [dbQuery, setDbQuery] = useState('SELECT * FROM table LIMIT 100')

  // Text form state
  const [textData, setTextData] = useState('')
  const [textName, setTextName] = useState('')

  // Close on Escape
  useEffect(() => {
    if (!showUploadModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUploadModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showUploadModal, setShowUploadModal])

  if (!showUploadModal) return null

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab)
    setMessage(null)
  }

  const close = () => setShowUploadModal(false)

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowUploadModal(false)
    }
  }

  // The store swallows upload errors by setting `agentError`, so we detect
  // success by a change in `selectedDataset.id` and failure by a change in
  // `agentError`.
  const handleFileUpload = async () => {
    if (uploading) return
    setUploading(true)
    setMessage(null)
    const beforeId = useAppStore.getState().selectedDataset?.id
    const beforeError = useAppStore.getState().agentError
    try {
      await uploadFile()
      const after = useAppStore.getState()
      const afterId = after.selectedDataset?.id
      if (afterId && afterId !== beforeId) {
        setMessage({ type: 'success', text: `上传成功: ${after.selectedDataset!.name}` })
        window.setTimeout(() => {
          setShowUploadModal(false)
          setMessage(null)
        }, 1200)
      } else if (after.agentError && after.agentError !== beforeError) {
        setMessage({ type: 'error', text: after.agentError })
      }
      // Otherwise: user cancelled the native dialog — keep modal open.
    } catch (e) {
      setMessage({ type: 'error', text: `上传失败: ${String(e)}` })
    } finally {
      setUploading(false)
    }
  }

  const handleTextImport = async () => {
    if (uploading) return
    if (!textName.trim()) {
      setMessage({ type: 'error', text: '请输入数据名称' })
      return
    }
    if (!textData.trim()) {
      setMessage({ type: 'error', text: '请输入数据内容' })
      return
    }
    setUploading(true)
    setMessage(null)
    const beforeId = useAppStore.getState().selectedDataset?.id
    const beforeError = useAppStore.getState().agentError
    try {
      await uploadText(textData.trim(), textName.trim())
      const after = useAppStore.getState()
      const afterId = after.selectedDataset?.id
      if (afterId && afterId !== beforeId) {
        setMessage({ type: 'success', text: `导入成功: ${textName.trim()}` })
        window.setTimeout(() => {
          setShowUploadModal(false)
          setTextData('')
          setTextName('')
          setMessage(null)
        }, 1200)
      } else if (after.agentError && after.agentError !== beforeError) {
        setMessage({ type: 'error', text: after.agentError })
      } else {
        setMessage({ type: 'error', text: '导入失败，请检查数据格式' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: `导入失败: ${String(e)}` })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-overlay" onClick={handleOverlayClick}>
      <div className="upload-modal" role="dialog" aria-modal="true" aria-label="数据源上传">
        {/* Header */}
        <div className="upload-header">
          <h2>数据源上传</h2>
          <button className="upload-close" onClick={close} title="关闭" aria-label="关闭">
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="upload-tabs">
          <button
            className={`upload-tab ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => switchTab('file')}
          >
            <UploadIcon />
            <span>文件上传</span>
          </button>
          <button
            className={`upload-tab ${activeTab === 'sql' ? 'active' : ''}`}
            onClick={() => switchTab('sql')}
          >
            <DatabaseIcon />
            <span>SQL数据库</span>
          </button>
          <button
            className={`upload-tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => switchTab('text')}
          >
            <TextIcon />
            <span>文本数据</span>
          </button>
        </div>

        {/* Body */}
        <div className="upload-body">
          {message && (
            <div className={`upload-message ${message.type}`}>
              {message.type === 'success' ? <CheckIcon /> : <CloseIcon />}
              <span>{message.text}</span>
            </div>
          )}

          {/* === 文件上传 === */}
          {activeTab === 'file' && (
            <div className="upload-dropzone" onClick={handleFileUpload}>
              <div className="upload-dropzone-icon">
                <FileIcon />
              </div>
              <p className="upload-dropzone-title">
                {uploading ? '正在上传...' : '点击选择文件上传'}
              </p>
              <button className="upload-btn" type="button" disabled={uploading}>
                <UploadIcon />
                选择文件
              </button>
              <p className="upload-hint">支持的文件格式:</p>
              <div className="upload-formats">
                {SUPPORTED_FORMATS.map((fmt) => (
                  <span key={fmt} className="upload-format-tag">{fmt}</span>
                ))}
              </div>
            </div>
          )}

          {/* === SQL数据库 === */}
          {activeTab === 'sql' && (
            <>
              <div className="upload-field">
                <label className="upload-label">连接类型</label>
                <select
                  className="upload-select"
                  value={dbType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDbType(e.target.value as DbType)
                  }
                >
                  {DB_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="upload-field">
                <label className="upload-label">主机地址</label>
                <input
                  className="upload-input"
                  type="text"
                  value={dbHost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbHost(e.target.value)}
                  placeholder="localhost"
                />
              </div>

              <div className="upload-field">
                <label className="upload-label">端口</label>
                <input
                  className="upload-input"
                  type="text"
                  value={dbPort}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbPort(e.target.value)}
                  placeholder="3306"
                />
              </div>

              <div className="upload-field">
                <label className="upload-label">数据库名称</label>
                <input
                  className="upload-input"
                  type="text"
                  value={dbName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbName(e.target.value)}
                  placeholder="database_name"
                />
              </div>

              <div className="upload-field">
                <label className="upload-label">用户名</label>
                <input
                  className="upload-input"
                  type="text"
                  value={dbUser}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbUser(e.target.value)}
                  placeholder="username"
                />
              </div>

              <div className="upload-field">
                <label className="upload-label">密码</label>
                <input
                  className="upload-input"
                  type="password"
                  value={dbPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDbPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="upload-field">
                <label className="upload-label">SQL 查询</label>
                <textarea
                  className="upload-textarea"
                  value={dbQuery}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDbQuery(e.target.value)}
                  rows={4}
                  placeholder="SELECT * FROM table LIMIT 100"
                />
              </div>

              <div className="upload-actions">
                <span className="upload-coming-soon">即将支持</span>
                <button className="upload-btn" type="button" disabled>
                  测试连接
                </button>
                <button className="upload-btn" type="button" disabled>
                  连接并导入
                </button>
              </div>
            </>
          )}

          {/* === 文本数据 === */}
          {activeTab === 'text' && (
            <>
              <div className="upload-field">
                <label className="upload-label">数据名称</label>
                <input
                  className="upload-input"
                  type="text"
                  value={textName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextName(e.target.value)}
                  placeholder="为这份数据命名"
                />
              </div>

              <div className="upload-field">
                <label className="upload-label">数据内容 (CSV 格式)</label>
                <textarea
                  className="upload-textarea"
                  value={textData}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextData(e.target.value)}
                  rows={10}
                  placeholder={'name,value,date\nAlice,100,2024-01-01\nBob,200,2024-01-02'}
                />
              </div>

              <p className="upload-hint">请以 CSV 格式粘贴数据，首行建议为列名。</p>

              <div className="upload-actions">
                <button
                  className="upload-btn"
                  type="button"
                  onClick={handleTextImport}
                  disabled={uploading}
                >
                  {uploading ? '导入中...' : '导入'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
