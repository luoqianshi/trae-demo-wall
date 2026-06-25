import { Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[300px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} aria-hidden="true" />
        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          加载中...
        </p>
      </div>
    </div>
  )
}
