import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Brain, Eye, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { thinkingModelApi, type ThinkingModel } from './api/thinking-model-api'

const categoryColorMap: Record<string, string> = {
  '战略与商业': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  '诊断与分析': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  '流程与执行': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  '表达与沟通': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

const defaultCategoryClass = 'bg-muted text-muted-foreground'

function getCategoryClass(category: string) {
  return categoryColorMap[category] || defaultCategoryClass
}

export function ThinkingModelsPage() {
  const queryClient = useQueryClient()

  // 列表查询
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['thinking-models'],
    queryFn: () => thinkingModelApi.list(),
  })

  // 切换启用状态
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      thinkingModelApi.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thinking-models'] })
      toast.success('状态已更新')
    },
    onError: () => {
      toast.error('状态更新失败')
    },
  })

  // 删除
  const deleteMutation = useMutation({
    mutationFn: (id: string) => thinkingModelApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thinking-models'] })
      toast.success('模型已删除')
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  // 提取入库
  const extractMutation = useMutation({
    mutationFn: ({ rawText, modelConfigId, kbId }: { rawText: string; modelConfigId?: string; kbId?: string }) =>
      thinkingModelApi.extract(rawText, modelConfigId, kbId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thinking-models'] })
      toast.success('提取入库成功')
      setImportDialogOpen(false)
      setRawText('')
      setModelConfigId('')
      setSelectedKbId('')
    },
    onError: () => {
      toast.error('提取入库失败，请检查文本内容')
    },
  })

  // 导入对话框状态
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [rawText, setRawText] = useState('')
  const [modelConfigId, setModelConfigId] = useState('')
  const [selectedKbId, setSelectedKbId] = useState('')

  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<ThinkingModel | null>(null)

  // 详情对话框状态
  const [detailTarget, setDetailTarget] = useState<ThinkingModel | null>(null)

  const handleImport = () => {
    if (!rawText.trim()) {
      toast.error('请粘贴思维模型文本')
      return
    }
    extractMutation.mutate({
      rawText: rawText.trim(),
      modelConfigId: modelConfigId || undefined,
      kbId: selectedKbId || undefined,
    })
  }

  return (
    <>
      {/* ===== 标题区域 ===== */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">思维模型</h1>
            <Badge variant="secondary">ThinkingModel</Badge>
          </div>
          <p className="text-muted-foreground">
            管理和导入思维模型，为智能体提供结构化的思考工具。
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setImportDialogOpen(true)}>
            <Plus className="mr-1.5 size-3.5" />
            导入模型
          </Button>
        </div>
      </div>

      <Separator className="my-4 shadow-sm" />

      {/* ===== 内容区域 ===== */}
      <div className="faded-bottom no-scrollbar overflow-auto pb-16">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Brain className="size-10" />
            <p className="text-sm">还没有思维模型</p>
            <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Sparkles className="mr-1.5 size-3.5" />
              导入第一个模型
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((model) => (
              <Card key={model.id} className="gap-0 overflow-hidden py-0">
                <CardHeader className="border-b px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm">
                        {model.modelName}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-1 text-xs">
                        {model.description || model.toolSchema?.description || '暂无描述'}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={model.isActive}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: model.id, isActive: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-3">
                  <div className="flex flex-col gap-2.5">
                    {/* 路由分类 */}
                    {model.routingCategory && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'w-fit text-[10px] font-medium',
                          getCategoryClass(model.routingCategory)
                        )}
                      >
                        {model.routingCategory}
                      </Badge>
                    )}

                    {/* Tool Schema 信息 */}
                    {model.toolSchema && (
                      <div className="rounded-md border bg-muted/30 px-2.5 py-1.5">
                        <p className="text-[11px] font-medium text-foreground">
                          {model.toolSchema.name}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                          {model.toolSchema.description}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {model.tags && model.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {model.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[9px] font-normal"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex items-center justify-end gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-primary"
                        onClick={() => setDetailTarget(model)}
                        title="查看详情"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(model)}
                        title="删除模型"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ===== 导入对话框 ===== */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              导入思维模型
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="kb-select">目标知识库（可选）</Label>
              <Input
                id="kb-select"
                value={selectedKbId}
                onChange={(e) => setSelectedKbId(e.target.value)}
                placeholder="知识库 ID（留空则不关联知识库）"
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

      {/* ===== 删除确认对话框 ===== */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除思维模型</DialogTitle>
            <DialogDescription>
              确定要删除「{deleteTarget?.modelName}」吗？此操作不可撤销。
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

      {/* ===== 详情对话框 ===== */}
      <Dialog
        open={!!detailTarget}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="size-4" />
              {detailTarget?.modelName}
            </DialogTitle>
            <DialogDescription>
              {detailTarget?.description || '暂无描述'}
            </DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <ScrollArea className="max-h-[60vh]">
              <div className="flex flex-col gap-4 pr-4">
                {/* 基本信息 */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-medium text-muted-foreground">基本信息</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border px-3 py-2">
                      <span className="text-[11px] text-muted-foreground">模型 ID</span>
                      <p className="truncate text-xs font-medium">{detailTarget.modelId}</p>
                    </div>
                    <div className="rounded-md border px-3 py-2">
                      <span className="text-[11px] text-muted-foreground">路由分类</span>
                      <p className="text-xs font-medium">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'mt-0.5 text-[10px]',
                            getCategoryClass(detailTarget.routingCategory)
                          )}
                        >
                          {detailTarget.routingCategory || '未分类'}
                        </Badge>
                      </p>
                    </div>
                    <div className="rounded-md border px-3 py-2">
                      <span className="text-[11px] text-muted-foreground">状态</span>
                      <p className="text-xs font-medium">
                        {detailTarget.isActive ? '启用' : '停用'}
                      </p>
                    </div>
                    <div className="rounded-md border px-3 py-2">
                      <span className="text-[11px] text-muted-foreground">标签</span>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {detailTarget.tags?.length > 0 ? (
                          detailTarget.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[9px]">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground">无</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 执行提示词 */}
                {detailTarget.executionPrompt && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-medium text-muted-foreground">执行提示词</h4>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                        {detailTarget.executionPrompt}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Tool Schema */}
                {detailTarget.toolSchema && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      工具定义（Tool Schema）
                    </h4>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <p className="text-xs font-medium">{detailTarget.toolSchema.name}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {detailTarget.toolSchema.description}
                      </p>
                      {detailTarget.toolSchema.parameters?.properties && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          <p className="text-[10px] font-medium text-muted-foreground">
                            参数列表：
                          </p>
                          {Object.entries(detailTarget.toolSchema.parameters.properties).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-start gap-2 rounded border bg-background px-2 py-1.5"
                              >
                                <code className="shrink-0 text-[10px] font-semibold text-primary">
                                  {key}
                                </code>
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="rounded bg-muted px-1 font-mono">
                                    {value.type}
                                  </span>
                                  {detailTarget.toolSchema.parameters.required.includes(key) && (
                                    <span className="ml-1 text-destructive">*必填</span>
                                  )}
                                  <p className="mt-0.5">{value.description}</p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 原始文本 */}
                {detailTarget.rawText && (
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-medium text-muted-foreground">原始文本</h4>
                    <div className="rounded-md border bg-muted/30 px-3 py-2">
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                        {detailTarget.rawText}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 时间信息 */}
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  {detailTarget.createTime && (
                    <span>创建: {new Date(detailTarget.createTime).toLocaleString()}</span>
                  )}
                  {detailTarget.updateTime && (
                    <span>更新: {new Date(detailTarget.updateTime).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
