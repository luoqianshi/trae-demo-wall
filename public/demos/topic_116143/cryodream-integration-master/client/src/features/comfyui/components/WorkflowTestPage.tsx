import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FlaskConical,
  List,
  Loader2,
  Music,
  Play,
  RefreshCw,
  Trash2,
  X,
  Image as ImageIcon,
  Video,
  FileOutput,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { cn } from '@/lib/utils'
import {
  comfyuiApi,
  parseParams,
  type ComfyParam,
  type ComfyWorkflow,
  type LocalWorkflow,
} from '../api/comfyui-api'
import { formatWorkflowName, randomSeed } from '../config/nodeMeta'
import { ParamEditor } from './ParamEditor'

type TestStatus = 'idle' | 'running' | 'done' | 'error'

interface TestResult {
  urls: string[]
  elapsedMs: number
  status: TestStatus
  errorMessage?: string
}

const PAGE_SIZE = 8

function getWorkflowOutputParams(workflow?: ComfyWorkflow) {
  if (!workflow) return []
  if (workflow.outputType === 'video') {
    return [{ name: '视频', type: 'video', icon: Video }]
  }
  if (workflow.outputType === 'audio') {
    return [{ name: '音频', type: 'audio', icon: Music }]
  }
  return [{ name: '图片', type: 'image', icon: ImageIcon }]
}

const ADVANCED_PARAM_NAMES = new Set([
  'seed',
  'noise_seed',
  'steps',
  'cfg',
  'cfg_scale',
  'guidance',
  'denoise',
  'strength',
  'sampler_name',
  'scheduler',
  'control_after_generate',
  'batch_size',
  'megapixels',
  'ratio_selected',
])

function isAdvancedParam(param: ComfyParam) {
  if (param.advanced === true) return true
  const name = param.paramName.toLowerCase()
  return ADVANCED_PARAM_NAMES.has(name) || name.includes('seed') || name.includes('sampler') || name.includes('scheduler')
}

function isVideoUrl(url: string) {
  const clean = url.split('?')[0].toLowerCase()
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/.test(clean)
}

export function WorkflowTestPage() {
  const { t } = useTranslation()
  const [localWorkflows, setLocalWorkflows] = useState<LocalWorkflow[]>([])
  const [importedWorkflows, setImportedWorkflows] = useState<ComfyWorkflow[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('')
  const [params, setParams] = useState<ComfyParam[]>([])
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [loadingScan, setLoadingScan] = useState(false)
  const [importing, setImporting] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [localDrawerOpen, setLocalDrawerOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [managePage, setManagePage] = useState(1)

  const selectedWorkflow = useMemo(
    () => importedWorkflows.find((w) => w.id === selectedWorkflowId),
    [importedWorkflows, selectedWorkflowId]
  )

  const outputParams = useMemo(() => getWorkflowOutputParams(selectedWorkflow), [selectedWorkflow])

  const { basicParams, advancedParams } = useMemo(
    () => ({
      basicParams: params.filter((param) => !isAdvancedParam(param)),
      advancedParams: params.filter(isAdvancedParam),
    }),
    [params]
  )

  const refreshWorkflows = useCallback(async () => {
    setLoadingScan(true)
    try {
      const [local, imported] = await Promise.all([comfyuiApi.scan(), comfyuiApi.list()])
      setLocalWorkflows(local)
      setImportedWorkflows(imported)
    } catch (e) {
      toast.error(t('workflowTest.loadFailed', { msg: e instanceof Error ? e.message : '' }))
    } finally {
      setLoadingScan(false)
    }
  }, [t])

  useEffect(() => {
    void refreshWorkflows()
  }, [refreshWorkflows])

  const handleImport = useCallback(
    async (local: LocalWorkflow) => {
      setImporting(true)
      try {
        const wf = await comfyuiApi.importWorkflow(local.path)
        const imported = await comfyuiApi.list()
        setImportedWorkflows(imported)
        setSelectedWorkflowId(wf.id)
        setTestResult(null)
        setTestStatus('idle')
        const p = parseParams(wf.paramSchema)
        setParams(p)
        let v: Record<string, unknown> = {}
        try {
          v = wf.paramValues ? JSON.parse(wf.paramValues) : {}
        } catch {
          v = {}
        }
        setValues(v)
        setAdvancedOpen(false)
        toast.success(t('workflowTest.importSuccess', { name: formatWorkflowName(wf.name) }))
      } catch (e) {
        toast.error(t('workflowTest.importFailed', { msg: e instanceof Error ? e.message : '' }))
      } finally {
        setImporting(false)
      }
    },
    [t]
  )

  const handleSelectWorkflow = useCallback(
    (id: string) => {
      setSelectedWorkflowId(id)
      setTestResult(null)
      setTestStatus('idle')
      const wf = importedWorkflows.find((w) => w.id === id)
      if (wf) {
        const p = parseParams(wf.paramSchema)
        setParams(p)
        let v: Record<string, unknown> = {}
        try {
          v = wf.paramValues ? JSON.parse(wf.paramValues) : {}
        } catch {
          v = {}
        }
        setValues(v)
        setAdvancedOpen(false)
      }
    },
    [importedWorkflows]
  )

  const handleChangeValue = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      const wf = importedWorkflows.find((w) => w.id === id)
      const name = wf ? formatWorkflowName(wf.name) : ''
      if (!window.confirm(t('workflowTest.confirmDelete', { name }))) return
      try {
        await comfyuiApi.delete(id)
        if (selectedWorkflowId === id) {
          setSelectedWorkflowId('')
          setParams([])
          setValues({})
          setTestResult(null)
          setTestStatus('idle')
        }
        const imported = await comfyuiApi.list()
        setImportedWorkflows(imported)
        toast.success(t('workflowTest.deleteSuccess', { name }))
      } catch (e) {
        toast.error(t('workflowTest.deleteFailed', { msg: e instanceof Error ? e.message : '' }))
      }
    },
    [importedWorkflows, selectedWorkflowId, t]
  )

  const handleRun = useCallback(async () => {
    if (!selectedWorkflowId) {
      toast.info(t('workflowTest.selectFirst'))
      return
    }
    setTestStatus('running')
    setTestResult(null)
    setProgress(0)
    setStage(t('workflowTest.stageQueuing'))
    const startTime = Date.now()
    try {
      const finalValues = { ...values }
      Object.keys(finalValues)
        .filter((k) => k.startsWith('__seedMode__.'))
        .forEach((modeKey) => {
          if (finalValues[modeKey] === 'randomize') {
            const seedNodeId = modeKey.replace('__seedMode__.', '')
            const newSeed = randomSeed()
            finalValues[`${seedNodeId}.seed`] = newSeed
            handleChangeValue(`${seedNodeId}.seed`, newSeed)
          }
        })

      const taskId = await comfyuiApi.submit(selectedWorkflowId, finalValues)
      let urls: string[] = []
      for (;;) {
        await new Promise((r) => setTimeout(r, 800))
        const p = await comfyuiApi.progress(taskId)
        if (p.status === 'running') {
          setStage(p.max > 0 ? t('workflowTest.stageGenerating') : t('workflowTest.stageLoading'))
          setProgress(p.percent)
        } else if (p.status === 'done') {
          urls = p.urls ?? []
          break
        } else {
          throw new Error(p.message || t('workflowTest.generateFailed'))
        }
      }
      const elapsedMs = Date.now() - startTime
      setTestResult({ urls, elapsedMs, status: 'done' })
      setTestStatus('done')
      toast.success(t(selectedWorkflow?.outputType === 'video' ? 'workflowTest.successVideoCount' : 'workflowTest.successCount', { count: urls.length }))
    } catch (e) {
      const elapsedMs = Date.now() - startTime
      setTestResult({
        urls: [],
        elapsedMs,
        status: 'error',
        errorMessage: e instanceof Error ? e.message : t('workflowTest.unknownError'),
      })
      setTestStatus('error')
      toast.error(t('workflowTest.generateFailed'))
    }
  }, [selectedWorkflowId, selectedWorkflow?.outputType, values, handleChangeValue, t])

  const importedPaths = useMemo(
    () => new Set(importedWorkflows.map((w) => w.sourcePath)),
    [importedWorkflows]
  )

  // 分页
  const totalPages = Math.max(1, Math.ceil(importedWorkflows.length / PAGE_SIZE))
  const pagedWorkflows = importedWorkflows.slice((managePage - 1) * PAGE_SIZE, managePage * PAGE_SIZE)

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
      </Header>

      {/* ===== Main Content ===== */}
      <Main fixed>
        {/* 标题区域 */}
        <div className='flex items-center justify-between gap-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>
                {t('workflowTest.title')}
              </h1>
              <Badge variant='secondary'>ComfyUI</Badge>
            </div>
            <p className='text-muted-foreground'>
              {t('workflowTest.description')}
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void refreshWorkflows()}
              disabled={loadingScan}
              className='space-x-1'
            >
              <RefreshCw size={18} className={cn(loadingScan && 'animate-spin')} />
              <span>{t('workflowTest.refresh')}</span>
            </Button>
          </div>
        </div>

        <Separator className='my-4 shadow-sm' />

        {/* 内容区域 - 左右分栏 */}
        <div className='faded-bottom no-scrollbar grid min-h-0 flex-1 gap-4 overflow-auto pb-16 lg:grid-cols-[380px_minmax(0,1fr)]'>
          {/* 左侧：工作流选择 + 参数配置 */}
          <Card className='flex min-h-0 flex-col'>
            <CardHeader className='shrink-0 pb-3'>
              <CardTitle className='flex items-center justify-between text-sm'>
                <span className='flex items-center gap-1.5'>
                  <FlaskConical size={16} className='text-primary' /> {t('workflowTest.configTitle')}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground'
                  onClick={() => { setManageOpen(true); setManagePage(1) }}
                >
                  <List size={12} />
                  {t('workflowTest.manageList')}
                </Button>
              </CardTitle>
              <CardDescription>{t('workflowTest.configDesc')}</CardDescription>
            </CardHeader>
            <CardContent className='min-h-0 flex-1 overflow-y-auto'>
              <div className='space-y-4'>
              {/* 已导入的工作流 */}
              <div className='space-y-1.5'>
                <Label className='text-xs'>{t('workflowTest.importedWorkflows')}</Label>
                <Select value={selectedWorkflowId} onValueChange={handleSelectWorkflow}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('workflowTest.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {importedWorkflows.map((wf) => (
                      <SelectItem key={wf.id} value={wf.id}>
                        {formatWorkflowName(wf.name)}
                        {wf.outputType === 'video'
                          ? ` (${t('workflowTest.videoType')})`
                          : wf.outputType === 'audio'
                          ? ' (音频)'
                          : ` (${t('workflowTest.imageType')})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 本地工作流 - 抽屉折叠 */}
              {localWorkflows.length > 0 && (
                <div className='rounded-md border'>
                  <button
                    className='flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30'
                    onClick={() => setLocalDrawerOpen(!localDrawerOpen)}
                  >
                    <span className='flex items-center gap-1.5'>
                      {localDrawerOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {t('workflowTest.localWorkflows')}
                    </span>
                    <Badge variant='secondary' className='text-[10px]'>{localWorkflows.length}</Badge>
                  </button>
                  {localDrawerOpen && (
                    <div className='space-y-1 border-t px-2 py-2'>
                      {localWorkflows.map((wf) => {
                        const isImported = importedPaths.has(wf.path)
                        return (
                          <button
                            key={wf.path}
                            onClick={() => void handleImport(wf)}
                            disabled={importing}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors disabled:opacity-50',
                              isImported
                                ? 'border-border bg-muted/20 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary'
                                : 'border-dashed border-border bg-muted/40 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary'
                            )}
                          >
                            <ChevronDown size={12} />
                            <span className='truncate'>{formatWorkflowName(wf.name)}</span>
                            {isImported && (
                              <span className='ml-auto shrink-0 text-[10px] text-primary/70'>重新导入</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 工作流信息 + 参数编辑 */}
              {selectedWorkflow && (
                <>
                  <Separator />
                  <div className='space-y-1.5'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold'>
                        {formatWorkflowName(selectedWorkflow.name)}
                      </span>
                      <Badge variant='outline' className='text-[10px]'>
                        {selectedWorkflow.outputType === 'video'
                          ? t('workflowTest.videoType')
                          : selectedWorkflow.outputType === 'audio'
                          ? '音频'
                          : t('workflowTest.imageType')}
                      </Badge>
                    </div>
                    {selectedWorkflow.description && (
                      <p className='text-xs text-muted-foreground'>{selectedWorkflow.description}</p>
                    )}
                    <p className='text-[10px] text-muted-foreground'>
                      {t('workflowTest.paramCount', { count: params.length })} · {t('workflowTest.outputType')}: {selectedWorkflow.outputType}
                    </p>
                    <div className='rounded-md border bg-muted/20 p-2'>
                      <div className='mb-2 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground'>
                        <FileOutput size={12} />
                        输出参数
                      </div>
                      <div className='flex flex-wrap gap-1.5'>
                        {outputParams.map((item) => {
                          const Icon = item.icon
                          return (
                            <Badge key={item.type} variant='secondary' className='gap-1 text-[10px]'>
                              <Icon size={11} />
                              {item.name} · {item.type}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    {basicParams.length > 0 && (
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <Label className='text-xs'>常用参数</Label>
                          <Badge variant='secondary' className='text-[10px]'>{basicParams.length}</Badge>
                        </div>
                        <ParamEditor params={basicParams} values={values} onChange={handleChangeValue} />
                      </div>
                    )}
                    {advancedParams.length > 0 && (
                      <div className='overflow-hidden rounded-md border'>
                        <button
                          className='flex w-full items-center justify-between bg-muted/20 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground'
                          onClick={() => setAdvancedOpen((v) => !v)}
                        >
                          <span className='flex items-center gap-1.5'>
                            {advancedOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            高级参数
                          </span>
                          <Badge variant='outline' className='text-[10px]'>{advancedParams.length}</Badge>
                        </button>
                        {advancedOpen && (
                          <div className='border-t p-3'>
                            <ParamEditor params={advancedParams} values={values} onChange={handleChangeValue} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 空状态 */}
              {!selectedWorkflow && importedWorkflows.length === 0 && !loadingScan && (
                <div className='flex flex-col items-center gap-2 py-8 text-muted-foreground'>
                  <FlaskConical size={32} />
                  <p className='text-xs'>{t('workflowTest.noWorkflows')}</p>
                  <p className='text-[10px]'>{t('workflowTest.importFirst')}</p>
                </div>
              )}
              </div>
            </CardContent>
            {/* 运行按钮固定在底部 */}
            {selectedWorkflow && (
              <div className='shrink-0 border-t px-6 py-4'>
                <Button
                  onClick={() => void handleRun()}
                  disabled={testStatus === 'running'}
                  className='w-full space-x-1'
                >
                  {testStatus === 'running' ? (
                    <>
                      <Loader2 size={18} className='animate-spin' />
                      <span>{stage} {progress}%</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      <span>{t('workflowTest.runTest')}</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* 右侧：测试结果 */}
          <Card className='flex min-h-0 flex-col'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center justify-between text-sm'>
                <span>{t('workflowTest.resultTitle')}</span>
                {testResult && (
                  <span className='text-xs font-normal text-muted-foreground'>
                    {t('workflowTest.elapsed', { sec: (testResult.elapsedMs / 1000).toFixed(1) })}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className='min-h-0 flex-1'>
              {/* 运行中进度 */}
              {testStatus === 'running' && (
                <div className='flex flex-col items-center gap-3 py-12'>
                  <Loader2 size={32} className='animate-spin text-primary' />
                  <p className='text-sm text-muted-foreground'>
                    {stage}... {progress}%
                  </p>
                  <div className='h-1.5 w-48 overflow-hidden rounded-full bg-primary/20'>
                    <div
                      className='h-full rounded-full bg-primary transition-all duration-300'
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 成功结果 */}
              {testResult?.status === 'done' && testResult.urls.length > 0 && (
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 size={16} className='text-green-500' />
                    <span className='text-xs font-medium text-green-700'>
                      {t(selectedWorkflow?.outputType === 'video' ? 'workflowTest.successVideoCount' : 'workflowTest.successCount', { count: testResult.urls.length })}
                    </span>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    {testResult.urls.map((url, idx) => (
                      <TestResultMedia key={url} url={url} index={idx + 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* 成功但无输出 */}
              {testResult?.status === 'done' && testResult.urls.length === 0 && (
                <div className='flex flex-col items-center gap-2 py-12 text-muted-foreground'>
                  <CheckCircle2 size={24} />
                  <p className='text-xs'>{t(selectedWorkflow?.outputType === 'video' ? 'workflowTest.noVideos' : 'workflowTest.noImages')}</p>
                </div>
              )}

              {/* 错误结果 */}
              {testResult?.status === 'error' && (
                <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                  <p className='text-xs font-medium text-red-700'>{t('workflowTest.executeFailed')}</p>
                  <p className='mt-1 text-xs text-red-600'>{testResult.errorMessage}</p>
                </div>
              )}

              {/* 空状态 */}
              {!testResult && testStatus !== 'running' && (
                <div className='flex flex-col items-center gap-2 py-16 text-muted-foreground'>
                  <FlaskConical size={32} />
                  <p className='text-xs'>{t('workflowTest.emptyResult')}</p>
                  <p className='text-[10px]'>{t('workflowTest.emptyResultDesc')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>

      {/* 管理弹窗 */}
      {manageOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm' onClick={() => setManageOpen(false)}>
          <div className='flex max-h-[70vh] w-[600px] flex-col rounded-xl border bg-background shadow-2xl' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between border-b px-6 py-4'>
              <h2 className='text-base font-semibold'>{t('workflowTest.manageTitle')}</h2>
              <button onClick={() => setManageOpen(false)} className='flex size-7 items-center justify-center rounded-md hover:bg-muted'>
                <X size={16} />
              </button>
            </div>
            <div className='flex-1 overflow-y-auto px-6 py-3'>
              <table className='w-full text-xs'>
                <thead>
                  <tr className='border-b text-left text-muted-foreground'>
                    <th className='pb-2 font-medium'>{t('workflowTest.colName')}</th>
                    <th className='pb-2 font-medium'>{t('workflowTest.colType')}</th>
                    <th className='pb-2 font-medium'>{t('workflowTest.colParams')}</th>
                    <th className='w-16 pb-2 font-medium text-right'>{t('workflowTest.colAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedWorkflows.map((wf) => (
                    <tr key={wf.id} className='border-b last:border-0'>
                      <td className='py-2.5 font-medium'>{formatWorkflowName(wf.name)}</td>
                      <td className='py-2.5 text-muted-foreground'>
                        {wf.outputType === 'video' ? t('workflowTest.videoType') : t('workflowTest.imageType')}
                      </td>
                      <td className='py-2.5 text-muted-foreground'>
                        {(() => { try { return JSON.parse(wf.paramSchema).length } catch { return 0 } })()}
                      </td>
                      <td className='py-2.5 text-right'>
                        <button
                          onClick={() => void handleDelete(wf.id)}
                          className='inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500'
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importedWorkflows.length === 0 && (
                <div className='py-8 text-center text-xs text-muted-foreground'>{t('workflowTest.noWorkflows')}</div>
              )}
            </div>
            {totalPages > 1 && (
              <div className='flex items-center justify-between border-t px-6 py-3'>
                <span className='text-[10px] text-muted-foreground'>
                  {t('workflowTest.pageInfo', { page: managePage, total: totalPages, count: importedWorkflows.length })}
                </span>
                <div className='flex gap-1'>
                  <Button variant='outline' size='sm' className='h-6 text-[10px]' disabled={managePage <= 1} onClick={() => setManagePage(managePage - 1)}>
                    {t('workflowTest.prevPage')}
                  </Button>
                  <Button variant='outline' size='sm' className='h-6 text-[10px]' disabled={managePage >= totalPages} onClick={() => setManagePage(managePage + 1)}>
                    {t('workflowTest.nextPage')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function TestResultMedia({ url, index }: { url: string; index: number }) {
  const [preview, setPreview] = useState(false)
  const video = isVideoUrl(url)
  const downloadName = `result_${index}.${video ? 'mp4' : 'png'}`

  return (
    <>
      <div
        className='group relative overflow-hidden rounded-lg border bg-muted/40'
        onClick={() => setPreview(true)}
      >
        {video ? (
          <video
            src={url}
            className='w-full object-contain transition-transform duration-200 group-hover:scale-105'
            muted
            playsInline
            controls
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={url}
            alt={`Result ${index}`}
            className='w-full object-contain transition-transform duration-200 group-hover:scale-105'
          />
        )}
        <div className='absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/40 to-transparent px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100'>
          <span className='text-[10px] font-medium text-white'>#{index}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              const a = document.createElement('a')
              a.href = url
              a.download = downloadName
              a.click()
            }}
            className='flex size-5 items-center justify-center rounded bg-white/20 text-white transition-colors hover:bg-white/40'
          >
            <Download size={11} />
          </button>
        </div>
      </div>

      {preview && (
        <div
          onClick={() => setPreview(false)}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm'
        >
          <button
            onClick={() => setPreview(false)}
            className='absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20'
          >
            <X size={18} />
          </button>
          {video ? (
            <video
              src={url}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              className='max-h-full max-w-full rounded-lg object-contain shadow-2xl'
            />
          ) : (
            <img
              src={url}
              alt={`Result ${index}`}
              onClick={(e) => e.stopPropagation()}
              className='max-h-full max-w-full rounded-lg object-contain shadow-2xl'
            />
          )}
        </div>
      )}
    </>
  )
}
