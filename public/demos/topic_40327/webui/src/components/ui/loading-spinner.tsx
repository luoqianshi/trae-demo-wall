import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

/**
 * LoadingSpinner 统一加载状态 UI。
 * 用于页面级加载、表格加载、按钮内加载等场景。
 */
export function LoadingSpinner({ size = 'md', label, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2
        className={`${sizeMap[size]} animate-spin`}
        style={{ color: 'hsl(var(--primary))' }}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          {label}
        </span>
      )}
    </div>
  )
}
