import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { novelAiApi } from '../api/novel-api'
import { LoadingInline, ModelSelectRow } from './AiCommon'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentContent: string
  onInsert: (text: string) => void
}

export function AiContinueDialog({ open, onOpenChange, currentContent, onInsert }: Props) {
  const [modelId, setModelId] = useState('')
  const [instruction, setInstruction] = useState('自然衔接，保持人称和语气')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')

  const handleGenerate = async () => {
    if (!modelId) {
      toast.error('请先选择模型')
      return
    }
    // 取原文尾部 3000 字作为上下文
    const tail = currentContent.slice(-3000)
    if (!tail.trim()) {
      toast.error('原文为空，无法续写')
      return
    }
    setGenerating(true)
    setResult('')
    try {
      const text = await novelAiApi.continueWriting({
        action: 'continue',
        modelConfigId: modelId,
        text: tail,
        instruction,
      })
      setResult(text)
    } catch (e) {
      toast.error((e as Error).message || '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleInsert = () => {
    if (!result.trim()) return
    onInsert(result.trim())
    toast.success('已插入到章节末尾')
    onOpenChange(false)
    setResult('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            AI 续写
          </DialogTitle>
          <DialogDescription>基于当前章节末尾 3000 字，让 AI 续写下一段。</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ModelSelectRow modelId={modelId} onModelIdChange={setModelId} />
          <div className="flex flex-col gap-2">
            <Label>续写要求</Label>
            <Textarea
              rows={2}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="例如：延续悬疑基调、加强场景描写"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>生成结果</Label>
            {generating ? (
              <div className="rounded-md border bg-muted/20 p-3">
                <LoadingInline label="AI 正在续写..." />
              </div>
            ) : (
              <Textarea
                rows={8}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="点击「生成」后 AI 输出将展示在这里，可编辑后再插入"
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="outline" onClick={handleGenerate} disabled={generating}>
            {generating ? '生成中...' : result ? '重新生成' : '生成'}
          </Button>
          <Button onClick={handleInsert} disabled={!result.trim() || generating}>
            插入到章节末尾
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
