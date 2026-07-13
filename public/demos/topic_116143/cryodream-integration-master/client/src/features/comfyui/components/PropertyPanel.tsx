import { Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type ComfyParam } from '../api/comfyui-api'
import { ParamEditor } from './ParamEditor'

interface PropertyPanelProps {
  title: string
  params: ComfyParam[]
  values: Record<string, unknown>
  running: boolean
  onChange: (key: string, value: unknown) => void
  onRun: () => void
  onClose: () => void
}

/**
 * 右侧属性面板：点击节点后在此编辑该节点的全部参数。
 */
export function PropertyPanel({
  title,
  params,
  values,
  running,
  onChange,
  onRun,
  onClose,
}: PropertyPanelProps) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-neutral-200 bg-white">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <span className="flex-1 truncate text-sm font-semibold text-neutral-800">{title}</span>
        <button
          onClick={onClose}
          title="关闭"
          className="flex size-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X size={15} />
        </button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 py-4">
          <ParamEditor params={params} values={values} onChange={onChange} />
        </div>
      </ScrollArea>
      <div className="border-t border-neutral-200 p-3">
        <Button
          onClick={onRun}
          disabled={running}
          className="h-9 w-full rounded-lg bg-neutral-900 text-xs font-semibold hover:bg-black"
        >
          <Play size={14} className="mr-1.5" /> {running ? '生成中...' : '运行出图'}
        </Button>
      </div>
    </aside>
  )
}
