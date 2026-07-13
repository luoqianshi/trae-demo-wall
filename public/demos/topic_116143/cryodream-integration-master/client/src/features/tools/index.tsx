import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Brain,
  Eye,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  thinkingModelApi,
  toToolItem,
  type ToolItem,
  type ThinkingModel,
} from './api/tools-api'

const categoryColorMap: Record<string, string> = {
  '战略与商业': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  '诊断与分析': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  '流程与执行': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  '表达与沟通': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

const typeLabelMap: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  'thinking-model': { label: '思维模型', icon: Brain, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  'plugin': { label: '插件', icon: Wrench, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  'external-api': { label: '外部 API', icon: Wrench, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
}

function getCategoryClass(category: string) {
  return categoryColorMap[category] || 'bg-muted text-muted-foreground'
}

export function ToolsPage() {
  const queryClient = useQueryClient()

  // 列表查询
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['thinking-models'],
    queryFn: () => thinkingModelApi.list(),
    select: (data) => data.map(toToolItem),
  })

  // 选中工具
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null)

  // 左侧面板收缩
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // 切换启用状态
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      thinkingModelApi.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thinking-models'] })
      toast.success('状态已更新')
    },
    onError: () => toast.error('状态更新失败'),
  })

  // 删除
  const deleteMutation = useMutation({
    mutationFn: (id: string) => thinkingModelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thinking-models'] })
      toast.success('工具已删除')
      setDeleteTarget(null)
      if (selectedTool?.id === deleteTarget?.id) setSelectedTool(null)
    },
    onError: () => toast.error('删除失败'),
  })

  // 提取入库
  const extractMutation = useMutation({
    mutationFn: ({ rawText, modelConfigId }: { rawText: string; modelConfigId?: string }) =>
      thinkingModelApi.extract(rawText, modelConfigId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thinking-models'] })
      toast.success('提取入库成功')
      setImportDialogOpen(false)
      setRawText('')
      setModelConfigId('')
    },
    onError: () => toast.error('提取入库失败，请检查文本内容'),
  })

  // 导入对话框
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [rawText, setRawText] = useState('')
  const [modelConfigId, setModelConfigId] = useState('')

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<ToolItem | null>(null)

  const handleImport = () => {
    if (!rawText.trim()) {
      toast.error('请粘贴工具文本')
      return
    }
    extractMutation.mutate({
      rawText: rawText.trim(),
      modelConfigId: modelConfigId || undefined,
    })
  }

  // 按分类分组
  const groupedTools = models.reduce<Record<string, ToolItem[]>>((acc, tool) => {
    const cat = tool.category || '未分类'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(tool)
    return acc
  }, {})

  return (
    <>
      {/* ===== 紧凑顶栏 ===== */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <span className="truncate text-sm font-semibold">工具</span>
        <Badge variant="secondary">{models.length}</Badge>
        <div className="flex-1" />
        <Button size="sm" className="h-7 px-3 text-xs" onClick={() => setImportDialogOpen(true)}>
          <Plus className="mr-1.5 size-3.5" />
          导入工具
        </Button>
      </div>

      {/* ===== 左右分栏 ===== */}
      <div className="faded-bottom no-scrollbar flex flex-1 gap-0 overflow-hidden pb-16">
        {/* 左侧工具列表 */}
        <div
          className={`flex shrink-0 flex-col border-r transition-all ${
            sidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-72'
          }`}
        >
          {!sidebarCollapsed && (
            <ScrollArea className="flex-1 [&>div>div]:!block [&>div>div]:!w-full">
              <div className="w-full min-w-0 px-2 pb-4 pt-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : models.length === 0 ? (
                  <div className="py-8 text-center">
                    <Wrench className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">还没有工具</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1"
                      onClick={() => setImportDialogOpen(true)}
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      导入第一个工具
                    </Button>
                  </div>
                ) : (
                  Object.entries(groupedTools).map(([category, tools]) => (
                    <div key={category} className="mb-3">
                      <div className="mb-1.5 flex items-center gap-1.5 px-1">
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] font-medium', getCategoryClass(category))}
                        >
                          {category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{tools.length}</span>
                      </div>
                      <div className="space-y-0.5">
                        {tools.map((tool) => {
                          const typeInfo = typeLabelMap[tool.type]
                          const TypeIcon = typeInfo?.icon || Wrench
                          return (
                            <div
                              key={tool.id}
                              className={`group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted ${
                                selectedTool?.id === tool.id ? 'bg-muted font-medium' : ''
                              }`}
                              onClick={() => setSelectedTool(tool)}
                            >
                              <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs">{tool.name}</p>
                                <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                  {tool.description || '暂无描述'}
                                </p>
                              </div>
                              <Switch
                                checked={tool.isActive}
                                onCheckedChange={(checked) =>
                                  toggleMutation.mutate({ id: tool.id, isActive: checked })
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="scale-75"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* 右侧详情 */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {selectedTool ? (
            <ToolDetailPanel
              tool={selectedTool}
              onDelete={() => setDeleteTarget(selectedTool)}
              onToggle={(isActive) =>
                toggleMutation.mutate({ id: selectedTool.id, isActive })
              }
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <Wrench className="h-16 w-16 text-muted-foreground/20" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">选择工具查看详情</p>
              <p className="mt-1 text-sm text-muted-foreground/70">从左侧列表选择一个工具</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== 导入对话框 ===== */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              导入工具
            </DialogTitle>
            <DialogDescription>
              粘贴思维模型文本，系统将自动提取结构化信息并入库。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="raw-text">模型文本</Label>
              <Textarea
                id="raw-text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="粘贴思维模型描述文本..."
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model-config">推理模型（可选）</Label>
              <Input
                id="model-config"
                value={modelConfigId}
                onChange={(e) => setModelConfigId(e.target.value)}
                placeholder="模型配置 ID（留空使用默认）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={extractMutation.isPending || !rawText.trim()}
            >
              {extractMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  提取中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 size-3.5" />
                  提取入库
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 删除确认 ===== */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除工具</DialogTitle>
            <DialogDescription>
              确定要删除「{deleteTarget?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** 右侧工具详情面板 */
function ToolDetailPanel({
  tool,
  onDelete,
  onToggle,
}: {
  tool: ToolItem
  onDelete: () => void
  onToggle: (isActive: boolean) => void
}) {
  const model = tool.data
  const typeInfo = typeLabelMap[tool.type]
  const TypeIcon = typeInfo?.icon || Wrench

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <TypeIcon className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">{model.modelName}</span>
        <Badge variant="secondary" className={cn('text-[10px]', getCategoryClass(model.routingCategory))}>
          {model.routingCategory || '未分类'}
        </Badge>
        <Badge variant="outline" className={cn('text-[9px]', typeInfo?.color)}>
          {typeInfo?.label || '工具'}
        </Badge>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{model.isActive ? '启用' : '停用'}</span>
          <Switch checked={model.isActive} onCheckedChange={onToggle} className="scale-75" />
        </div>
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* 详情内容 */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* 工具定义 */}
          {model.toolSchema && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">工具定义</h4>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <code className="text-xs font-semibold">{model.toolSchema.name}</code>
                <p className="mt-1 text-xs text-muted-foreground">{model.toolSchema.description}</p>
              </div>
            </div>
          )}

          {/* 参数 */}
          {model.toolSchema?.parameters?.properties && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">参数</h4>
              <div className="space-y-1.5">
                {Object.entries(model.toolSchema.parameters.properties).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 rounded border bg-background px-2 py-1.5">
                    <code className="shrink-0 text-[11px] font-semibold text-primary">{key}</code>
                    <div className="text-[11px] text-muted-foreground">
                      <span className="rounded bg-muted px-1 font-mono text-[10px]">{value.type}</span>
                      {model.toolSchema?.parameters?.required?.includes(key) && (
                        <span className="ml-1 text-destructive text-[10px]">*必填</span>
                      )}
                      {value.description && <p className="mt-0.5">{value.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 执行提示词 */}
          {model.executionPrompt && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">执行提示词</h4>
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 px-3 py-2 text-xs leading-relaxed">
                {model.executionPrompt}
              </pre>
            </div>
          )}

          {/* 触发场景 */}
          {model.tags && model.tags.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">触发场景</h4>
              <div className="flex flex-wrap gap-1">
                {model.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 原始文本 */}
          {model.rawText && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">原始文本</h4>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                {model.rawText}
              </pre>
            </div>
          )}

          {/* 时间 */}
          <div className="flex gap-4 text-[10px] text-muted-foreground">
            {model.createTime && (
              <span>创建: {new Date(model.createTime).toLocaleString()}</span>
            )}
            {model.updateTime && (
              <span>更新: {new Date(model.updateTime).toLocaleString()}</span>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
