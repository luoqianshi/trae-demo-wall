import { ButtonHTMLAttributes, forwardRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** 显示加载状态，按钮将自动变为 disabled */
  loading?: boolean
  /** 加载状态显示的文字，默认 "加载中..." */
  loadingText?: string
  /** 点击后显示的短暂成功反馈（毫秒），按钮会自动重置 */
  showSuccess?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      showSuccess = false,
      disabled,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    /* ------------------------------------------------------------------ */
    /*  Variant classes                                                     */
    /* ------------------------------------------------------------------ */
    const variantClasses: Record<string, string> = {
      primary:
        'bg-ochre text-white hover:bg-ink hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(44,36,32,0.08)] active:scale-[0.97] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 focus-visible:ring-offset-2',
      secondary:
        'bg-transparent text-ink-secondary border-[1.5px] border-border hover:border-ochre hover:text-ochre hover:bg-ochre-bg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 focus-visible:ring-offset-2',
      ghost:
        'bg-transparent text-ink-muted hover:text-ink hover:bg-paper-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300/40 focus-visible:ring-offset-2',
      danger:
        'bg-cinnabar text-white hover:bg-[#9A3D2F] active:scale-[0.97] active:bg-[#823226] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar/40 focus-visible:ring-offset-1',
    }

    /* ------------------------------------------------------------------ */
    /*  Size classes                                                        */
    /* ------------------------------------------------------------------ */
    const sizeClasses: Record<string, string> = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    }

    /* ------------------------------------------------------------------ */
    /*  Loading / disabled state                                            */
    /* ------------------------------------------------------------------ */
    const isDisabled = disabled || loading
    const disabledClasses = isDisabled
      ? 'opacity-50 cursor-not-allowed pointer-events-none select-none'
      : ''

    /* ------------------------------------------------------------------ */
    /*  Render                                                              */
    /* ------------------------------------------------------------------ */
    return (
      <button
        ref={ref}
        className={[
          // base
          'inline-flex items-center justify-center gap-2 rounded-full font-semibold btn-press',
          'transition-all duration-[150ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          variantClasses[variant],
          sizeClasses[size],
          disabledClasses,
          className || '',
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        onClick={loading ? undefined : onClick}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        )}

        {/* Success icon (短暂成功状态) */}
        {showSuccess && !loading && (
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}

        {/* Label — show loadingText when loading, children otherwise */}
        {loading && loadingText ? loadingText : children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button }