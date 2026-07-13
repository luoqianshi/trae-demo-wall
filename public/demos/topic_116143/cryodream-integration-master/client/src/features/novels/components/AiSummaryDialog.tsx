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
  onApply: (text: string) => void
}

export function AiSummaryDialog({ open, onOpenChange, currentContent, onApply }: Props) {
  const [modelId, setModelId] = useState('')
  const [instruction, setInstruction] = useState('用一到两句话客观概括本节剧情，不加评价，不要复述细节。')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState('')

  const handleGenerate = async () => {
    if (!modelId) {
      toast.error('请先选择模型')
      return
    }
    if (!currentContent.trim()) {
      toast.error('章节正文为空，无法生成概要')
      return
    }
    setGenerating(true)
    setResult('')
    try {
      const text = await novelAiApi.summarize({
        action: 'summarize',
        modelConfigId: modelId,
        text: currentContent,
        instruction,
      })
      setResult(text.trim())
    } catch (e) {
      toast.error((e as Error).message || '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleApply = () => {
    const value = result.trim()
    if (!value) return
    onApply(value)
    toast.success('已保存为本节概要')
    onOpenChange(false)
    setResult('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            AI 生成本节概要
          </DialogTitle>
          <DialogDescription>
            读取当前章节正文，用一到两句话客观概括，作为本节的概要。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ModelSelectRow modelId={modelId} onModelIdChange={setModelId} />
          <div className="flex flex-col gap-2">
            <Label>生成要求</Label>
            <Textarea
              rows={2}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="例如：突出人物冲突、只描述剧情不含评价"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>生成结果</Label>
            {generating ? (
              <div className="rounded-md border bg-muted/20 p-3">
                <LoadingInline label="AI 正在提炼概要..." />
              </div>
            ) : (
              <Textarea
                rows={4}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="点击「生成」后 AI 输出将展示在这里，可编辑后再应用"
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
          <Button onClick={handleApply} disabled={!result.trim() || generating}>
            应用为概要
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
