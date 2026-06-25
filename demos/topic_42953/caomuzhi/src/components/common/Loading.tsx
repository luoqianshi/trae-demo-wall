import { Leaf } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
}

const Loading = ({ text = '加载中...', size = 'md', overlay = false }: LoadingProps) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-[100]">
        <div className="relative">
          <Leaf className={`${sizes[size]} text-plant-green animate-rotate`} />
          <div className="absolute inset-0 animate-pulse-ring">
            <Leaf className={`${sizes[size]} text-plant-green opacity-50`} />
          </div>
        </div>
        <p className="mt-4 text-white text-lg font-medium">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <Leaf className={`${sizes[size]} text-plant-green animate-rotate`} />
        <div className="absolute inset-0 animate-pulse-ring">
          <Leaf className={`${sizes[size]} text-plant-green opacity-50`} />
        </div>
      </div>
      <p className="mt-4 text-text-medium">{text}</p>
    </div>
  );
};

export default Loading;
