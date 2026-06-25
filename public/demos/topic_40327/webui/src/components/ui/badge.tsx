import { type HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'destructive'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'badge badge-primary',
  primary: 'badge badge-primary',
  accent: 'badge badge-accent',
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  destructive: 'badge badge-error',
}

export function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  return <span className={`${variantClasses[variant]} ${className}`} {...props} />
}