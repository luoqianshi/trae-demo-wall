import { type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'btn btn-primary',
  destructive: 'btn text-white',
  outline: 'btn btn-outline',
  ghost: 'btn btn-ghost',
  link: 'btn bg-transparent text-primary underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: '',
  sm: 'btn-sm',
  lg: 'btn-lg',
  icon: 'btn-sm',
}

export function Button({
  variant = 'default',
  size = 'default',
  className = '',
  style,
  ...props
}: ButtonProps) {
  const destructiveStyle: React.CSSProperties =
    variant === 'destructive'
      ? { background: 'hsl(var(--destructive) / 0.9)', color: 'white' }
      : {}

  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{ ...destructiveStyle, ...style }}
      {...props}
    />
  )
}