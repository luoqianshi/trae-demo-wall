import { useState } from 'react'
import { toast } from 'sonner'
import { FileSearch2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { novelAiApi } from '../api/novel-api'
import { LoadingInline, ModelSelectRow } from './AiCommon'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  novelId: string
  content: string
}

export function AiConsistencyDialog({ open, onOpenChange, novelId, content }: Props) {
  const [modelId, setModelId] = useState('')
  const [checking, setChecking] = useState(false)
  const [report, setReport] = useState('')

  const handleCheck = async () => {
    if (!modelId) {
      toast.error('请先选择模型')
      return
    }
    if (!content.trim()) {
      toast.error('章节内容为空，无法检查')
      return
    }
    setChecking(true)
    setReport('')
    try {
      const text = await novelAiApi.consistency({
        action: 'consistency',
        modelConfigId: modelId,
        text: content,
        novelId,
      })
      setReport(text)
    } catch (e) {
      toast.error((e as Error).message || '检查失败')
    } finally {
      setChecking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch2 className="size-4" />
            人物一致性检查
          </DialogTitle>
          <DialogDescription>
            AI 将对照该小说的所有人物卡，检查本章人物言行是否与设定一致。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ModelSelectRow modelId={modelId} onModelIdChange={setModelId} />
          <div className="max-h-[420px] overflow-auto rounded-md border bg-muted/10 p-3">
            {checking ? (
              <LoadingInline label="AI 正在分析..." />
            ) : report ? (
              <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">{report}</pre>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">点击「开始检查」生成报告</div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={handleCheck} disabled={checking}>
            {checking ? '检查中...' : report ? '重新检查' : '开始检查'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
