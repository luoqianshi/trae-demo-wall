import { useState } from 'react'
import { toast } from 'sonner'
import { Wand2 } from 'lucide-react'
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
import { POLISH_INSTRUCTION_OPTIONS } from '../constants'
import { novelAiApi } from '../api/novel-api'
import { LoadingInline, ModelSelectRow } from './AiCommon'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentContent: string
  onReplace: (text: string) => void
}

export function AiPolishDialog({ open, onOpenChange, currentContent, onReplace }: Props) {
  const [modelId, setModelId] = useState('')
  const [instruction, setInstruction] = useState(POLISH_INSTRUCTION_OPTIONS[0]!.value)
  const [generating, setGenerating] = useState(false)
  const [candidates, setCandidates] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleGenerate = async () => {
    if (!modelId) {
      toast.error('请先选择模型')
      return
    }
    if (!currentContent.trim()) {
      toast.error('章节内容为空，无法润色')
      return
    }
    setGenerating(true)
    setCandidates([])
    setSelectedIndex(null)
    try {
      const list = await novelAiApi.polish({
        action: 'polish',
        modelConfigId: modelId,
        text: currentContent,
        instruction,
        candidateCount: 3,
      })
      setCandidates(list)
    } catch (e) {
      toast.error((e as Error).message || '润色失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleApply = () => {
    if (selectedIndex === null) return
    const picked = candidates[selectedIndex]
    if (!picked) return
    onReplace(picked)
    toast.success('已应用润色结果')
    onOpenChange(false)
    setCandidates([])
    setSelectedIndex(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4" />
            AI 润色
          </DialogTitle>
          <DialogDescription>对整章正文进行润色，返回多个候选后由你决定采用哪一个。</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <ModelSelectRow modelId={modelId} onModelIdChange={setModelId} />
            <div className="flex flex-col gap-2">
              <Label>润色方向</Label>
              <Select value={instruction} onValueChange={setInstruction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLISH_INSTRUCTION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {generating ? (
            <div className="rounded-md border bg-muted/20 p-4">
              <LoadingInline label="AI 正在生成 3 个候选..." />
            </div>
          ) : candidates.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label>候选（点击选中，右下角「应用」将替换整章）</Label>
              <div className="grid gap-2">
                {candidates.map((c, i) => (
                  <div
                    key={i}
                    className={`cursor-pointer rounded-md border p-3 text-sm transition-colors ${
                      selectedIndex === i ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                    }`}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <div className="mb-1 text-xs text-muted-foreground">候选 #{i + 1}</div>
                    <Textarea
                      rows={5}
                      value={c}
                      onChange={(e) => {
                        const next = [...candidates]
                        next[i] = e.target.value
                        setCandidates(next)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
              点击「生成候选」开始润色
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="outline" onClick={handleGenerate} disabled={generating}>
            {generating ? '生成中...' : candidates.length > 0 ? '重新生成' : '生成候选'}
          </Button>
          <Button onClick={handleApply} disabled={selectedIndex === null || generating}>
            应用选中候选
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
