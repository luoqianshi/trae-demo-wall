import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingButtonProps {
  to?: string;
  onClick?: () => void;
  icon: LucideIcon;
  label: string;
  color?: 'yellow' | 'orange' | 'pink' | 'mint';
  className?: string;
}

const colorStyles = {
  yellow: 'bg-corgi-yellow text-text-primary hover:bg-corgi-orange hover:text-white',
  orange: 'bg-corgi-orange text-white hover:bg-corgi-dark',
  pink: 'bg-berry-pink text-white hover:bg-berry-rose',
  mint: 'bg-mint-fresh text-text-primary hover:bg-mint-deep hover:text-white',
};

export default function FloatingButton({
  to,
  onClick,
  icon: Icon,
  label,
  color = 'yellow',
  className,
}: FloatingButtonProps) {
  const content = (
    <div
      className={cn(
        'btn-press group flex flex-col items-center gap-1 transition-all duration-200',
        className
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-puffy border-4 border-warm-light/60 transition-all',
          colorStyles[color]
        )}
      >
        <Icon size={26} strokeWidth={2.5} className="transition-transform group-hover:scale-110" />
      </div>
      <span className="text-xs font-bold text-text-secondary bg-warm-light/80 px-2 py-0.5 rounded-full">
        {label}
      </span>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return <button onClick={onClick}>{content}</button>;
}
