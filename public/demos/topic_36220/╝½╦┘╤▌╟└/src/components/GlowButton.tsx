import { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'green' | 'purple' | 'red' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export default function GlowButton({
  children,
  variant = 'green',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...rest
}: GlowButtonProps) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  const variants = {
    green: 'btn-gradient-green',
    purple: 'btn-gradient-purple',
    red: 'bg-gradient-to-r from-neon-red to-neon-pink text-white font-bold shadow-neon-red hover:shadow-[0_0_50px_rgba(255,61,90,0.7)]',
    ghost: 'glass text-neon-green border border-neon-green/40 hover:border-neon-green hover:bg-neon-green/10',
  }

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`relative rounded-xl ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } transition-all duration-300 ${className}`}
      disabled={disabled}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  )
}
