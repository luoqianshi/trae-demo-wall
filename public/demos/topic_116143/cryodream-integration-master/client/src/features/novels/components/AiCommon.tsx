import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  listEnabledModelConfigs,
  type ModelConfig,
} from '@/features/model-config/model-config-store'

export interface ChatModelOption {
  id: string
  name: string
}

export function useChatModels() {
  const [models, setModels] = useState<ChatModelOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    listEnabledModelConfigs()
      .then((configs: ModelConfig[]) => {
        if (cancelled) return
        const chatModels = configs
          .filter((c) => c.modelType === 'chat' || c.modelType === 'text')
          .map((c) => ({ id: c.id, name: c.name }))
        setModels(chatModels)
      })
      .catch(() => {
        if (!cancelled) toast.error('模型列表加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { models, loading }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelId: string
  onModelIdChange: (id: string) => void
  instruction: string
  onInstructionChange: (v: string) => void
  instructionLabel?: string
  instructionPlaceholder?: string
  extra?: React.ReactNode
}

export function ModelSelectRow({
  modelId,
  onModelIdChange,
}: {
  modelId: string
  onModelIdChange: (id: string) => void
}) {
  const { models, loading } = useChatModels()
  return (
    <div className="flex flex-col gap-2">
      <Label>使用的模型</Label>
      <Select value={modelId} onValueChange={onModelIdChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? '加载中...' : '选择模型'} />
        </SelectTrigger>
        <SelectContent>
          {models.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              还未配置对话模型，请先前往「模型设置」添加
            </div>
          ) : (
            models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

export function AiPromptDialog(props: Props) {
  const {
    open,
    onOpenChange,
    modelId,
    onModelIdChange,
    instruction,
    onInstructionChange,
    instructionLabel = '要求',
    instructionPlaceholder = '例如：延续悬疑基调',
    extra,
  } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI 参数</DialogTitle>
          <DialogDescription>选择模型并填写指令</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ModelSelectRow modelId={modelId} onModelIdChange={onModelIdChange} />
          <div className="flex flex-col gap-2">
            <Label>{instructionLabel}</Label>
            <Textarea
              rows={3}
              value={instruction}
              onChange={(e) => onInstructionChange(e.target.value)}
              placeholder={instructionPlaceholder}
            />
          </div>
          {extra}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function LoadingInline({ label = '生成中...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  )
}
