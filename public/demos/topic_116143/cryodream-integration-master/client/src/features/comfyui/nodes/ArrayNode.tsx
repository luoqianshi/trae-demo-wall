import { memo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Brackets, Columns3, Maximize2, Plus, Table2, Trash2, Type, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useMultiSelect } from '../index'

export type ArrayMode = 'text' | 'table'

export interface ArrayNodeData {
  name: string
  itemsText: string
  arrayMode: ArrayMode
  tableColumns: string[]
  tableRows: Record<string, string>[]
  onChangeItems: (itemsText: string) => void
  onChangeArrayMode: (mode: ArrayMode) => void
  onChangeTableColumns: (columns: string[]) => void
  onChangeTableRows: (rows: Record<string, string>[]) => void
  [key: string]: unknown
}

/* ───── 弹窗编辑器（本地状态管理，关闭时同步回节点） ───── */
function ArrayEditorModal({
  initialMode,
  initialItemsText,
  initialTableColumns,
  initialTableRows,
  onCommit,
  onClose,
}: {
  initialMode: ArrayMode
  initialItemsText: string
  initialTableColumns: string[]
  initialTableRows: Record<string, string>[]
  onCommit: (data: { arrayMode: ArrayMode; itemsText: string; tableColumns: string[]; tableRows: Record<string, string>[] }) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<ArrayMode>(initialMode)
  const [itemsText, setItemsText] = useState(initialItemsText)
  const [tableColumns, setTableColumns] = useState<string[]>(initialTableColumns)
  const [tableRows, setTableRows] = useState<Record<string, string>[]>(initialTableRows)

  const handleAddColumn = () => {
    const name = `col_${tableColumns.length + 1}`
    setTableColumns([...tableColumns, name])
  }

  const handleRemoveColumn = (idx: number) => {
    if (tableColumns.length <= 1) return
    const newCols = tableColumns.filter((_, i) => i !== idx)
    const newRows = tableRows.map((row) => {
      const newRow: Record<string, string> = {}
      newCols.forEach((col) => { newRow[col] = row[col] ?? '' })
      return newRow
    })
    setTableColumns(newCols)
    setTableRows(newRows)
  }

  const handleRenameColumn = (idx: number, newName: string) => {
    const oldName = tableColumns[idx]
    const newCols = tableColumns.map((c, i) => (i === idx ? newName : c))
    const newRows = tableRows.map((row) => {
      const newRow: Record<string, string> = {}
      newCols.forEach((col) => {
        newRow[col] = col === newName ? (row[oldName] ?? '') : (row[col] ?? '')
      })
      return newRow
    })
    setTableColumns(newCols)
    setTableRows(newRows)
  }

  const handleCellChange = (rowIdx: number, colName: string, value: string) => {
    setTableRows(tableRows.map((row, i) => (i === rowIdx ? { ...row, [colName]: value } : row)))
  }

  const handleAddRow = () => {
    const newRow: Record<string, string> = {}
    tableColumns.forEach((col) => { newRow[col] = '' })
    setTableRows([...tableRows, newRow])
  }

  const handleRemoveRow = (idx: number) => {
    setTableRows(tableRows.filter((_, i) => i !== idx))
  }

  const handleDone = () => {
    onCommit({ arrayMode: mode, itemsText, tableColumns, tableRows })
    onClose()
  }

  const itemCount = mode === 'text'
    ? itemsText.split('\n').filter((l) => l.trim()).length
    : tableRows.length

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[85vh] w-[880px] max-w-[92vw] flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <Brackets size={16} className="text-neutral-500" />
            <span className="text-sm font-semibold text-neutral-800">编辑数组</span>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
            <X size={16} />
          </button>
        </div>

        {/* 模式切换 */}
        <div className="flex gap-1 border-b px-5 py-2.5">
          <button
            onClick={() => setMode('text')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors',
              mode === 'text' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            <Type size={13} />
            文本模式
          </button>
          <button
            onClick={() => setMode('table')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors',
              mode === 'table' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            <Table2 size={13} />
            表格模式
          </button>
        </div>

        {/* 编辑区 */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'text' ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                <span>每行一个数组元素</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px]">string[]</span>
              </div>
              <Textarea
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                rows={12}
                className="resize-none rounded-lg border-neutral-300 bg-neutral-50 text-sm leading-relaxed focus-visible:ring-neutral-900/15"
                placeholder="每行一个数组元素"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                <span>每行一个对象，字段可映射到循环参数</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px]">object[]</span>
              </div>

              {/* 列头 */}
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="w-8 shrink-0" />
                {tableColumns.map((col, idx) => (
                  <div key={idx} className="group relative flex-1">
                    <input
                      value={col}
                      onChange={(e) => handleRenameColumn(idx, e.target.value)}
                      className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-2 py-1.5 text-center text-xs font-medium text-neutral-700 outline-none focus:border-neutral-500"
                    />
                    {tableColumns.length > 1 && (
                      <button
                        onClick={() => handleRemoveColumn(idx)}
                        className="absolute -right-1 -top-1 hidden size-4 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
                      >
                        <Trash2 size={8} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddColumn}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-600"
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* 数据行 */}
              <div className="max-h-[400px] space-y-1 overflow-y-auto">
                {tableRows.map((row, rowIdx) => (
                  <div key={rowIdx} className="group flex items-center gap-1.5">
                    <span className="w-8 shrink-0 text-center text-[10px] text-neutral-400">{rowIdx + 1}</span>
                    {tableColumns.map((col) => (
                      <input
                        key={col}
                        value={row[col] ?? ''}
                        onChange={(e) => handleCellChange(rowIdx, col, e.target.value)}
                        placeholder={col}
                        className="flex-1 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 outline-none focus:border-neutral-400"
                      />
                    ))}
                    <button
                      onClick={() => handleRemoveRow(rowIdx)}
                      className="hidden size-6 shrink-0 items-center justify-center rounded text-neutral-300 hover:text-red-500 group-hover:flex"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddRow}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 py-2 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-600"
              >
                <Plus size={12} />
                添加行
              </button>

              {tableColumns.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral-400">
                  <Columns3 size={11} />
                  <span>字段：{tableColumns.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <div className="text-xs text-neutral-400">{itemCount} 项</div>
          <button
            onClick={handleDone}
            className="rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            完成
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ───── 紧凑节点 ───── */
function ArrayNodeComponent({ data, selected }: NodeProps) {
  const d = data as ArrayNodeData
  const isMultiSelect = useMultiSelect()
  const [editorOpen, setEditorOpen] = useState(false)

  const arrayMode = d.arrayMode ?? 'text'
  const textItems = d.itemsText.split('\n').map((l) => l.trim()).filter(Boolean)
  const tableColumns = d.tableColumns ?? ['prompt']
  const tableRows = d.tableRows ?? []
  const itemCount = arrayMode === 'text' ? textItems.length : tableRows.length

  const previewItems = arrayMode === 'text'
    ? textItems.slice(0, 2)
    : tableRows.slice(0, 2).map((row) => Object.entries(row).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', '))

  const handleCommit = (editData: { arrayMode: ArrayMode; itemsText: string; tableColumns: string[]; tableRows: Record<string, string>[] }) => {
    d.onChangeArrayMode(editData.arrayMode)
    d.onChangeItems(editData.itemsText)
    d.onChangeTableColumns(editData.tableColumns)
    d.onChangeTableRows(editData.tableRows)
  }

  return (
    <>
      <div
        className={cn(
          'relative w-[240px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.10)]',
          selected && isMultiSelect && 'ring-2 ring-neutral-900/70'
        )}
      >
        <Handle type="source" position={Position.Right} className="comfy-handle comfy-handle-center" />

        <div className="relative overflow-hidden bg-neutral-950 p-3.5 pb-2.5 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white">
              <Brackets size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{d.name}</div>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-white/80">
              {itemCount} 项
            </span>
          </div>
        </div>

        <div className="border-t border-neutral-200" />

        <div className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {arrayMode === 'text' ? (
                <Type size={11} className="text-neutral-400" />
              ) : (
                <Table2 size={11} className="text-violet-400" />
              )}
              <span className="text-[10px] text-neutral-500">
                {arrayMode === 'text' ? '文本' : '表格'}
              </span>
              <span className="rounded-full border bg-background px-1.5 py-0.5 text-[9px] text-neutral-500">
                {arrayMode === 'text' ? 'string[]' : 'object[]'}
              </span>
            </div>
            <button
              onClick={() => setEditorOpen(true)}
              className="nodrag flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[10px] text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            >
              <Maximize2 size={10} />
              编辑
            </button>
          </div>

          <div className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-2">
            {itemCount === 0 ? (
              <div className="py-2 text-center text-[10px] text-neutral-400">点击编辑添加数据</div>
            ) : (
              <div className="space-y-1">
                {previewItems.map((item, idx) => (
                  <div key={idx} className="truncate text-[10px] text-neutral-600">
                    {item || '—'}
                  </div>
                ))}
                {itemCount > 2 && (
                  <div className="text-[9px] text-neutral-400">... 还有 {itemCount - 2} 项</div>
                )}
              </div>
            )}
          </div>

          {arrayMode === 'table' && tableColumns.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[9px] text-neutral-400">
              <Columns3 size={9} />
              {tableColumns.join(', ')}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200" />

        <div className="bg-muted/30 px-3 py-2.5">
          <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
            <span>输出</span>
            <span className="rounded-full border bg-background px-1.5 py-0.5 text-[9px] normal-case text-neutral-500">
              {arrayMode === 'text' ? 'string[]' : 'object[]'}
            </span>
          </div>
        </div>
      </div>

      {editorOpen && (
        <ArrayEditorModal
          initialMode={arrayMode}
          initialItemsText={d.itemsText}
          initialTableColumns={tableColumns}
          initialTableRows={tableRows}
          onCommit={handleCommit}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>
  )
}

export const ArrayNode = memo(ArrayNodeComponent)
