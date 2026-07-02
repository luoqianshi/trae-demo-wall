interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  active?: boolean
  className?: string
}

export function Badge({ children, variant = 'default', active = false, className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-ochre-bg text-ochre',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-indigo-50 text-indigo-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${active ? 'badge-active' : ''} ${className || ''}`}
    >
      {children}
    </span>
  )
}
