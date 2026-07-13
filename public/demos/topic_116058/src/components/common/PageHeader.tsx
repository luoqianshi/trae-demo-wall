import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, right, className }: PageHeaderProps) {
  return (
    <header className={cn('sticky top-0 z-20 glass border-b-2 border-corgi-yellow/20', className)}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="btn-press w-10 h-10 rounded-full flex items-center justify-center bg-warm-light shadow-soft text-text-primary hover:bg-corgi-yellow/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl text-text-primary">{title}</h1>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
