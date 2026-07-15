/**
 * Data IPC — 数据源管理。
 *
 * - listSamples: 纯 Node fs 读 schema.json（快，无需 Python）
 * - loadSample: 读 schema + CSV 前 10 行，构造 DatasetContext
 * - upload: 起短命沙箱 describe（xlsx/parquet 必须 Python）
 * - loadDatasetForSandbox: 把样例 CSV 喂给沙箱
 */

import { ipcMain, dialog, app } from 'electron'
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { IPC, SampleSchema } from '../../types/ipc'
import type { DatasetContext, DatasetSummary } from '../../types/shared'
import { SandboxManager } from '../../sandbox/SandboxManager'
import { PATHS } from '../config'

export function registerDataIPC() {
  ipcMain.handle(IPC.DATA_LIST_SAMPLES, async (): Promise<DatasetSummary[]> => {
    const dir = PATHS.samples
    if (!existsSync(dir)) return []

    const files = readdirSync(dir).filter((f) => f.endsWith('.schema.json'))
    const summaries: DatasetSummary[] = []

    for (const file of files) {
      try {
        const raw = readFileSync(join(dir, file), 'utf-8')
        const schema: SampleSchema = JSON.parse(raw)
        const id = file.replace('.schema.json', '')
        summaries.push({
          id,
          name: schema.name,
          description: schema.description,
          source: 'sample' as const,
          columns: Object.keys(schema.columns)
        })
      } catch {
        // 跳过损坏的 schema 文件
      }
    }

    return summaries
  })

  ipcMain.handle(
    IPC.DATA_LOAD_SAMPLE,
    async (_e, id: string): Promise<DatasetContext | null> => {
      return loadSampleData(id)
    }
  )

  ipcMain.handle(
    IPC.DATA_UPLOAD,
    async (_e, filePath: string): Promise<DatasetContext | null> => {
      return uploadFile(filePath)
    }
  )

  ipcMain.handle(
    IPC.DATA_PREVIEW,
    async (_e, id: string): Promise<DatasetContext | null> => {
      return loadSampleData(id)
    }
  )

  // === 文件选择对话框 ===
  ipcMain.handle(
    IPC.DIALOG_OPEN_FILE,
    async (): Promise<string | null> => {
      const result = await dialog.showOpenDialog({
        title: '选择数据文件',
        properties: ['openFile'],
        filters: [
          { name: '数据文件', extensions: ['csv', 'tsv', 'xlsx', 'xls', 'json', 'parquet', 'txt'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      })
      return result.canceled ? null : result.filePaths[0]
    }
  )

  // === 文本数据上传 ===
  ipcMain.handle(
    IPC.DATA_UPLOAD_TEXT,
    async (_e, { text, name }: { text: string; name: string }): Promise<DatasetContext | null> => {
      return uploadText(text, name)
    }
  )
}

/** 加载样例数据 — Node fs 读 CSV 前 10 行 */
function loadSampleData(id: string): DatasetContext | null {
  const schemaPath = join(PATHS.samples, `${id}.schema.json`)
  const csvPath = join(PATHS.samples, `${id}.csv`)

  if (!existsSync(schemaPath) || !existsSync(csvPath)) return null

  const schema: SampleSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'))
  const csvContent = readFileSync(csvPath, 'utf-8')
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',')
  const head: Record<string, unknown>[] = []

  for (let i = 1; i < Math.min(lines.length, 11); i++) {
    const values = lines[i].split(',')
    const row: Record<string, unknown> = {}
    headers.forEach((h, idx) => {
      const val = values[idx]?.trim() ?? ''
      const colType = schema.columns[h]?.type
      if (colType === 'number') {
        const num = parseFloat(val)
        row[h] = isNaN(num) ? val : num
      } else {
        row[h] = val
      }
    })
    head.push(row)
  }

  const dtypes: Record<string, string> = {}
  for (const [col, info] of Object.entries(schema.columns)) {
    dtypes[col] = info.type === 'number' ? 'float64' : 'object'
  }

  return {
    id,
    name: schema.name,
    source: 'sample',
    schema: {
      columns: Object.keys(schema.columns),
      dtypes,
      shape: [lines.length - 1, headers.length]
    },
    head,
    samplePath: csvPath
  }
}

/** 上传文件 — CSV/TSV 用纯 Node.js 解析（快），xlsx/parquet 起沙箱（慢） */
async function uploadFile(filePath: string): Promise<DatasetContext | null> {
  const ext = filePath.split('.').pop()?.toLowerCase() || 'csv'

  // CSV / TSV 用 Node.js 纯解析，无需启动 Python（从 3-5s 降到 <200ms）
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    return parseCsvWithNode(filePath, ext)
  }

  // xlsx / parquet 必须用 Python 沙箱
  const format = ext === 'xlsx' ? 'excel' : ext
  const sandbox = new SandboxManager()
  const sessionId = `upload-${Date.now()}`

  try {
    await sandbox.start(sessionId)
    const desc = await sandbox.loadData(sessionId, filePath, format)

    return {
      id: basename(filePath, `.${ext}`),
      name: basename(filePath),
      source: 'upload',
      schema: {
        columns: desc.columns,
        dtypes: desc.dtypes,
        shape: desc.shape as [number, number]
      },
      head: desc.head as Record<string, unknown>[],
      samplePath: filePath
    }
  } finally {
    await sandbox.stop(sessionId)
  }
}

/** 用 Node.js 纯解析 CSV/TSV 文件（无需 Python） */
function parseCsvWithNode(filePath: string, ext: string): DatasetContext | null {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')
  if (lines.length < 1) return null

  const delimiter = ext === 'tsv' ? '\t' : ','
  const headers = lines[0].split(delimiter).map((h) => h.trim())
  const rows = lines.slice(1).map((line) => line.split(delimiter).map((v) => v.trim()))

  // 推断列类型（采样前 100 行）
  const dtypes: Record<string, string> = {}
  const sampleRows = rows.slice(0, Math.min(rows.length, 100))
  for (let ci = 0; ci < headers.length; ci++) {
    const allNumeric = sampleRows.every((r) => {
      const v = r[ci]
      if (v === '' || v === undefined) return true // 空值算通过
      return !isNaN(Number(v))
    })
    dtypes[headers[ci]] = allNumeric && sampleRows.some((r) => r[ci] !== '' && r[ci] !== undefined) ? 'float64' : 'object'
  }

  // 前 10 行预览
  const head: Record<string, unknown>[] = rows.slice(0, Math.min(rows.length, 10)).map((row) => {
    const obj: Record<string, unknown> = {}
    headers.forEach((h, ci) => {
      const val = row[ci] ?? ''
      obj[h] = dtypes[h] === 'float64' && val !== '' ? Number(val) : val
    })
    return obj
  })

  return {
    id: basename(filePath, `.${ext}`),
    name: basename(filePath),
    source: 'upload',
    schema: {
      columns: headers,
      dtypes,
      shape: [rows.length, headers.length]
    },
    head,
    samplePath: filePath
  }
}

/** 把样例 CSV 加载到沙箱供 Agent 使用 */
export async function loadDatasetForSandbox(
  sandbox: SandboxManager,
  sessionId: string,
  datasetId: string,
  /** 上传数据集的文件路径（非 samples 目录） */
  filePath?: string
): Promise<DatasetContext | undefined> {
  // 优先使用 filePath（上传数据集），回退到 samples 目录
  if (filePath && existsSync(filePath)) {
    const ext = filePath.split('.').pop()?.toLowerCase() || 'csv'
    const format = ext === 'xlsx' ? 'excel' : 'csv'
    await sandbox.loadData(sessionId, filePath, format)
    // 用 Node 解析返回 DatasetContext
    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      return parseCsvWithNode(filePath, ext)
    }
    // xlsx/parquet 已由 sandbox.loadData 加载，返回基础 context
    return {
      id: basename(filePath, `.${ext}`),
      name: basename(filePath),
      source: 'upload',
      schema: { columns: [], dtypes: {}, shape: [0, 0] },
      head: [],
      samplePath: filePath
    }
  }

  const dataset = loadSampleData(datasetId)
  if (!dataset?.samplePath) return undefined

  await sandbox.loadData(sessionId, dataset.samplePath, 'csv')

  return dataset
}

/** 上传文本数据 — 保存为临时 CSV 并用沙箱 describe */
async function uploadText(text: string, name: string): Promise<DatasetContext | null> {
  const tempDir = join(app.getPath('temp'), 'datapilot-uploads')
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true })

  const safeName = name.replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '_') || 'text_data'
  const filePath = join(tempDir, `${safeName}-${Date.now()}.csv`)
  writeFileSync(filePath, text, 'utf-8')

  const sandbox = new SandboxManager()
  const sessionId = `text-${Date.now()}`

  try {
    await sandbox.start(sessionId)
    const desc = await sandbox.loadData(sessionId, filePath, 'csv')

    return {
      id: safeName,
      name,
      source: 'upload',
      schema: {
        columns: desc.columns,
        dtypes: desc.dtypes,
        shape: desc.shape as [number, number]
      },
      head: desc.head as Record<string, unknown>[],
      samplePath: filePath
    }
  } finally {
    await sandbox.stop(sessionId)
  }
}
