import { type ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button'
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-button transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-plant-green to-plant-medium text-white hover:shadow-lg hover:shadow-plant-green/30 hover:-translate-y-0.5 active:scale-95 focus:ring-plant-green',
    secondary: 'bg-white text-plant-green border-2 border-plant-green/20 hover:bg-plant-green/5 hover:border-plant-green/40 active:scale-95 focus:ring-plant-green',
    accent: 'bg-gradient-to-r from-accent-amber to-accent-bronze text-white hover:shadow-lg hover:shadow-accent-amber/30 hover:-translate-y-0.5 active:scale-95 focus:ring-accent-amber',
    ghost: 'bg-transparent text-plant-green hover:bg-plant-green/10 active:scale-95 focus:ring-plant-green'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
