import { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export default function Card({ children, className, onClick, noPadding }: Props) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card-bg rounded-3xl border border-rule/40 overflow-hidden card-shadow',
        !noPadding && 'p-5',
        onClick && 'active:scale-[0.98] transition-transform cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
