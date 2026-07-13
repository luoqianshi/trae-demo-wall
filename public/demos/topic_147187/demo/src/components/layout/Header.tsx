import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export const Header = ({ title, subtitle, showBack }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label="返回"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base lg:text-2xl font-bold text-gray-800 dark:text-white truncate">{title}</h2>
          {subtitle && <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
};