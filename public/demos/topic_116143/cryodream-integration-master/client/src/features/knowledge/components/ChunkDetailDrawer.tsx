import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Braces, Calendar, Database, FileText, Gauge, Hash, Layers, Route, ShieldCheck, Tags, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { chunkApi, type Chunk } from '../api/knowledge-api'

interface ChunkDetailDrawerProps {
  open: boolean
  onClose: () => void
  chunkId: string | null
}

type MetadataValue = string | number | boolean | null | MetadataObject | MetadataValue[]
interface MetadataObject {
  [key: string]: MetadataValue
}

function parseMetadata(metadata: string | undefined): MetadataObject | null {
  if (!metadata) return null
  try {
    const parsed = JSON.parse(metadata) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as MetadataObject
    }
    return null
  } catch {
    return null
  }
}

function formatMetadata(metadata: string | undefined) {
  if (!metadata) return '{}'
  try {
    const parsed = JSON.parse(metadata)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return metadata
  }
}

function parseJsonValue(value: string | undefined): MetadataValue | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as MetadataValue
  } catch {
    return value
  }
}

function isMetadataObject(value: MetadataValue | undefined): value is MetadataObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getSection(metadata: MetadataObject | null, key: string): MetadataObject | null {
  if (!metadata) return null
  const value = metadata[key]
  return isMetadataObject(value) ? value : null
}

function stringifyValue(value: MetadataValue | undefined): string {
  if (value === undefined || value === null) return '—'
  if (typeof value === 'string') return value || '—'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value, null, 2)
}

function renderValue(value: MetadataValue | undefined): ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span className='text-muted-foreground'>—</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className='text-muted-foreground'>空</span>
    const primitiveItems = value.every(item => item === null || ['string', 'number', 'boolean'].includes(typeof item))
    if (primitiveItems) {
      return (
        <div className='flex flex-wrap gap-1.5'>
          {value.map((item, index) => (
            <Badge key={index} variant='secondary' className='font-normal'>
              {stringifyValue(item)}
            </Badge>
          ))}
        </div>
      )
    }
    return (
      <div className='space-y-2'>
        {value.map((item, index) => (
          <pre key={index} className='overflow-x-auto rounded-md bg-muted/60 p-2 text-xs'>
            {stringifyValue(item)}
          </pre>
        ))}
      </div>
    )
  }
  if (typeof value === 'object') {
    return (
      <div className='space-y-2'>
        {Object.entries(value).map(([key, nestedValue]) => (
          <div key={key} className='rounded-md border bg-background/70 p-2'>
            <div className='mb-1 text-xs font-medium text-muted-foreground'>{key}</div>
            <div className='text-sm'>{renderValue(nestedValue)}</div>
          </div>
        ))}
      </div>
    )
  }
  return <span className='break-words text-sm leading-6'>{String(value)}</span>
}

function MetadataField({ label, value, icon }: { label: string; value: MetadataValue | undefined; icon?: ReactNode }) {
  return (
    <div className='rounded-lg border bg-background p-3'>
      <div className='mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground'>
        {icon}
        {label}
      </div>
      {renderValue(value)}
    </div>
  )
}

function MetadataSection({ title, description, icon, data }: { title: string; description: string; icon: ReactNode; data: MetadataObject | null }) {
  return (
    <section className='rounded-xl border bg-muted/20 p-4'>
      <div className='mb-3 flex items-start gap-3'>
        <div className='rounded-lg bg-background p-2 text-primary shadow-sm'>{icon}</div>
        <div>
          <h3 className='text-sm font-semibold'>{title}</h3>
          <p className='text-xs text-muted-foreground'>{description}</p>
        </div>
      </div>
      {data ? (
        <div className='grid gap-3 md:grid-cols-2'>
          {Object.entries(data).map(([key, value]) => (
            <MetadataField key={key} label={key} value={value} icon={<Tags className='h-3.5 w-3.5' />} />
          ))}
        </div>
      ) : (
        <div className='rounded-lg border border-dashed bg-background/60 p-4 text-sm text-muted-foreground'>
          暂无该维度元数据
        </div>
      )}
    </section>
  )
}

export default function ChunkDetailDrawer({ open, onClose, chunkId }: ChunkDetailDrawerProps) {
  const [chunk, setChunk] = useState<Chunk | null>(null)
  const [loading, setLoading] = useState(false)

  const loadChunk = useCallback(async () => {
    if (!chunkId) return
    setLoading(true)
    try {
      const result = await chunkApi.get(chunkId)
      setChunk(result)
    } catch {
      setChunk(null)
    } finally {
      setLoading(false)
    }
  }, [chunkId])

  useEffect(() => {
    if (open && chunkId) {
      loadChunk()
    }
  }, [open, chunkId, loadChunk])

  const metadata = parseMetadata(chunk?.metadata)
  const chunkEvents = parseJsonValue(chunk?.events)
  const domainScope = getSection(metadata, '1_Domain_Scope')
  const ontologyRouting = getSection(metadata, '2_Ontology_Routing')
  const epistemologyTag = getSection(metadata, '3_Epistemology_Tag')

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='max-h-[86vh] max-w-5xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Hash className='h-5 w-5' />
            Chunk 详情
          </DialogTitle>
          <DialogDescription>
            文本片段的完整信息，包括原始内容、父子 Chunk、新版 metadata jsonb、events(SPO) 和向量内容
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-10'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        ) : chunk ? (
          <div className='space-y-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary'>
                <span className='flex items-center gap-1'>
                  <Hash className='h-3 w-3' />
                  索引: {chunk.chunkIndex}
                </span>
              </Badge>
              {chunk.chunkLevel && (
                <Badge variant='outline'>
                  <span className='flex items-center gap-1'>
                    <Layers className='h-3 w-3' />
                    {chunk.chunkLevel}
                  </span>
                </Badge>
              )}
              {chunk.parentId && (
                <Badge variant='outline'>
                  <span className='flex items-center gap-1'>
                    <Route className='h-3 w-3' />
                    父块 {chunk.parentId.slice(0, 8)}
                  </span>
                </Badge>
              )}
              {chunk.createTime && (
                <Badge variant='outline'>
                  <span className='flex items-center gap-1'>
                    <Calendar className='h-3 w-3' />
                    {new Date(chunk.createTime).toLocaleString()}
                  </span>
                </Badge>
              )}
              {epistemologyTag?.claim_type && (
                <Badge variant='outline'>
                  <span className='flex items-center gap-1'>
                    <ShieldCheck className='h-3 w-3' />
                    {stringifyValue(epistemologyTag.claim_type)}
                  </span>
                </Badge>
              )}
              {epistemologyTag?.confidence !== undefined && (
                <Badge variant='outline'>
                  <span className='flex items-center gap-1'>
                    <Gauge className='h-3 w-3' />
                    可信度 {stringifyValue(epistemologyTag.confidence)}
                  </span>
                </Badge>
              )}
            </div>

            <Tabs defaultValue='metadata'>
              <TabsList>
                <TabsTrigger value='metadata'>
                  <Braces className='mr-2 h-4 w-4' />
                  新版元数据
                </TabsTrigger>
                <TabsTrigger value='text'>
                  <FileText className='mr-2 h-4 w-4' />
                  文本内容
                </TabsTrigger>
                <TabsTrigger value='raw'>
                  <FileText className='mr-2 h-4 w-4' />
                  原始快照
                </TabsTrigger>
                <TabsTrigger value='embedding'>
                  <Database className='mr-2 h-4 w-4' />
                  向量
                </TabsTrigger>
              </TabsList>

              <TabsContent value='metadata' className='space-y-4'>
                <MetadataSection
                  title='1_Domain_Scope'
                  description='领域范围，通常来自文档全局语义，用于确定知识所属业务域和主题。'
                  icon={<Layers className='h-4 w-4' />}
                  data={domainScope}
                />
                <MetadataSection
                  title='2_Ontology_Routing'
                  description='本体路由，每个 chunk 独立判断层级、父块映射、事件、实体和概念，用于检索路由。'
                  icon={<Route className='h-4 w-4' />}
                  data={ontologyRouting}
                />
                <MetadataSection
                  title='3_Epistemology_Tag'
                  description='认识论标签，每个 chunk 独立判断论述类型、来源、可信度和摘要。'
                  icon={<ShieldCheck className='h-4 w-4' />}
                  data={epistemologyTag}
                />
                <section className='rounded-xl border bg-muted/20 p-4'>
                  <div className='mb-3 flex items-start gap-3'>
                    <div className='rounded-lg bg-background p-2 text-primary shadow-sm'>
                      <Route className='h-4 w-4' />
                    </div>
                    <div>
                      <h3 className='text-sm font-semibold'>knowledge_chunk.events</h3>
                      <p className='text-xs text-muted-foreground'>落库后的 SPO 事件数组，与 metadata.2_Ontology_Routing.events 保持一致。</p>
                    </div>
                  </div>
                  <MetadataField label='events' value={chunkEvents} icon={<Tags className='h-3.5 w-3.5' />} />
                </section>
                <details className='rounded-xl border bg-muted/20 p-4'>
                  <summary className='cursor-pointer text-sm font-medium'>查看原始 JSON</summary>
                  <pre className='mt-3 max-h-72 overflow-auto rounded-lg bg-background p-3 text-xs'>
                    {formatMetadata(chunk.metadata)}
                  </pre>
                </details>
              </TabsContent>

              <TabsContent value='text'>
                <div className='rounded-lg border bg-muted/20 p-4'>
                  <pre className='whitespace-pre-wrap break-words font-sans text-sm leading-relaxed'>
                    {chunk.chunkText || '无文本内容'}
                  </pre>
                </div>
                <p className='mt-2 text-xs text-muted-foreground'>
                  {(chunk.chunkText || '').length} 字符
                </p>
              </TabsContent>

              <TabsContent value='raw'>
                <div className='rounded-lg border bg-muted/20 p-4'>
                  <pre className='whitespace-pre-wrap break-words font-sans text-sm leading-relaxed'>
                    {chunk.rawText || '无原始快照'}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value='embedding'>
                <div className='rounded-lg border bg-muted/20 p-4'>
                  <pre className='break-all font-mono text-xs whitespace-pre-wrap'>
                    {chunk.embedding || '无向量数据'}
                  </pre>
                </div>
                {chunk.embedding && (
                  <p className='mt-2 text-xs text-muted-foreground'>
                    维度: {chunk.embedding.split(',').length}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className='py-8 text-center text-muted-foreground'>暂无数据</p>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            <X className='mr-2 h-4 w-4' />
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
