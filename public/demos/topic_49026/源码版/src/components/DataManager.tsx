import { useState, useRef } from 'react'
import { Download, Upload, Trash2, AlertTriangle, MessageCircle } from 'lucide-react'
import { exportAllData, downloadExport, importData } from '../lib/dataManager'
import { importWeChatChat, type ChatImportProgress } from '../services/chatImportService'
import { dataSyncService } from '../services'
import { useDataStore } from '../stores/useDataStore'
import { useConversationStore } from '../stores/useConversationStore'
import { db } from '../lib/db'

export function DataManager() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [wechatImporting, setWechatImporting] = useState(false)
  const [wechatProgress, setWechatProgress] = useState<ChatImportProgress | null>(null)
  const [wechatResult, setWechatResult] = useState<string | null>(null)
  const wechatFileRef = useRef<HTMLInputElement>(null)

  const [clearingWeChatImports, setClearingWeChatImports] = useState(false)
  const [weChatClearResult, setWeChatClearResult] = useState<string | null>(null)

  const loadPersons = useDataStore((s) => s.loadPersons)
  const loadMemories = useDataStore((s) => s.loadMemories)
  const loadDiaries = useDataStore((s) => s.loadDiaries)

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await exportAllData()
      downloadExport(data)
    } catch (e) {
      console.error('Export error:', e)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    try {
      const result = await importData(file)
      const details = Object.entries(result.counts)
        .map(([k, v]) => `${k}: ${v}`)
        .join('，')
      setImportResult(`导入成功：${details || '无数据'}`)
      // 刷新所有数据
      await Promise.all([loadPersons(), loadMemories(), loadDiaries()])
    } catch (err: any) {
      setImportResult(`导入失败：${err.message}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleWeChatImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setWechatImporting(true)
    setWechatResult(null)
    setWechatProgress({ stage: 'parsing', current: 0, total: 1, detail: '准备导入' })

    try {
      const result = await importWeChatChat(
        file,
        { createPersonIfMissing: true },
        setWechatProgress
      )
      await Promise.all([loadPersons(), loadMemories(), loadDiaries()])
      setWechatResult(
        `导入完成：处理 ${result.chatsProcessed} 个聊天，${result.messagesProcessed} 条消息；匹配 ${result.personsMatched} 人、新建 ${result.personsCreated} 人；提取 ${result.memoriesCreated} 条记忆（更新 ${result.memoriesUpdated} 条）。`
      )
    } catch (err: any) {
      setWechatResult(`导入失败：${err.message}`)
    } finally {
      setWechatImporting(false)
      if (wechatFileRef.current) wechatFileRef.current.value = ''
    }
  }

  const handleClearAll = async () => {
    try {
      // Demo Guard: 演示模式下禁止清空
      const { guardWrite } = await import('../lib/demoGuard')
      guardWrite('清空所有数据')
      await Promise.all([
        db.persons.clear(),
        db.memories.clear(),
        db.diaries.clear(),
        db.conversations.clear(),
        db.embeddings.clear(),
        db.interactions.clear(),
        db.agentTasks.clear(),
        db.knowledgeGraph.clear(),
      ])
      // 清理 localStorage 中的缓存和状态（保留 API Key 配置）
      const preserveKeys = [
        'hengzhou-api-key', 'hengzhou-base-url', 'hengzhou-model',
        'hengzhou-doubao-api-key', 'hengzhou-doubao-api-keys',
        'hengzhou-doubao-base-url', 'hengzhou-doubao-model',
        'hengzhou-doubao-embedding-model', 'hengzhou-proxy-token',
        'hengzhou-response-style', 'hengzhou-theme-v2',
      ]
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('hengzhou-') && !preserveKeys.includes(key)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))
      await Promise.all([loadPersons(), loadMemories(), loadDiaries()])
      useConversationStore.getState().clearMessages()
      setShowClearConfirm(false)
    } catch (e) {
      console.error('Clear error:', e)
    }
  }

  const handleClearWeChatImports = async () => {
    setClearingWeChatImports(true)
    setWeChatClearResult(null)
    try {
      const all = await db.memories.toArray()
      const targets = all.filter((m) => m.source.startsWith('wechat-import:'))
      await Promise.all(targets.map((m) => dataSyncService.deleteMemory(m.id)))
      await Promise.all([loadPersons(), loadMemories(), loadDiaries()])
      setWeChatClearResult(`已删除 ${targets.length} 条微信导入的记忆`)
    } catch (e: any) {
      console.error('Clear WeChat imports error:', e)
      setWeChatClearResult(`删除失败：${e.message ?? '未知错误'}`)
    } finally {
      setClearingWeChatImports(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-ink-primary">数据管理</h3>

      {/* 导出 */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-ink-muted/20 text-sm text-ink-secondary hover:bg-canvas-warm transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4 text-zen-sage" />
        <span>{exporting ? '导出中...' : '导出所有数据'}</span>
      </button>

      {/* 导入 */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-ink-muted/20 text-sm text-ink-secondary hover:bg-canvas-warm transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4 text-zen-indigo" />
          <span>{importing ? '导入中...' : '导入备份数据'}</span>
        </button>
      </div>

      {importResult && (
        <p className="text-xs px-3 py-2 rounded-lg bg-canvas text-ink-secondary">{importResult}</p>
      )}

      {/* 导入微信聊天记录 */}
      <div className="space-y-2">
        <input
          ref={wechatFileRef}
          type="file"
          accept=".txt,.mht,.mhtml"
          onChange={handleWeChatImport}
          className="hidden"
        />
        <button
          onClick={() => wechatFileRef.current?.click()}
          disabled={wechatImporting}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-ink-muted/20 text-sm text-ink-secondary hover:bg-canvas-warm transition-colors disabled:opacity-50"
        >
          <MessageCircle className="w-4 h-4 text-zen-sage" />
          <span>{wechatImporting ? '导入中...' : '导入微信聊天记录'}</span>
        </button>

        {wechatProgress && wechatImporting && (
          <div className="px-3 py-2 rounded-lg bg-canvas border border-ink-muted/10 space-y-2">
            <div className="flex justify-between text-xs text-ink-secondary">
              <span>{wechatProgress.detail}</span>
              <span>{wechatProgress.current}/{wechatProgress.total}</span>
            </div>
            <div className="h-1.5 w-full bg-ink-muted/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-zen-sage transition-all duration-300"
                style={{
                  width: `${wechatProgress.total > 0 ? (wechatProgress.current / wechatProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-ink-muted capitalize">{wechatProgress.stage}</p>
          </div>
        )}

        {wechatResult && (
          <p className="text-xs px-3 py-2 rounded-lg bg-canvas text-ink-secondary">{wechatResult}</p>
        )}
      </div>

      {/* 删除微信导入的记忆 */}
      <button
        onClick={handleClearWeChatImports}
        disabled={clearingWeChatImports}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zen-rose/20 text-sm text-zen-rose hover:bg-zen-rose/5 transition-colors disabled:opacity-50"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{clearingWeChatImports ? '删除中...' : '删除微信导入的记忆'}</span>
      </button>
      {weChatClearResult && (
        <p className="text-xs px-3 py-2 rounded-lg bg-canvas text-ink-secondary">{weChatClearResult}</p>
      )}

      {/* 清除数据 */}
      {!showClearConfirm ? (
        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zen-rose/20 text-sm text-zen-rose hover:bg-zen-rose/5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>清除所有数据</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zen-rose/5 border border-zen-rose/20">
          <AlertTriangle className="w-4 h-4 text-zen-rose flex-shrink-0" />
          <span className="text-xs text-zen-rose flex-1">确定清除？不可恢复！</span>
          <button
            onClick={handleClearAll}
            className="text-xs px-2 py-1 rounded bg-zen-rose text-white hover:bg-zen-rose/90"
          >
            确定
          </button>
          <button
            onClick={() => setShowClearConfirm(false)}
            className="text-xs px-2 py-1 rounded bg-canvas text-ink-secondary hover:bg-canvas-warm"
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}
