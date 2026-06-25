// 加载组件

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function Loading({ text = '加载中...', size = 'md', fullScreen = false }: LoadingProps) {
  const sizeMap = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };

  const spinner = (
    <div className={`${sizeMap[size]} border-soft-blue border-t-transparent rounded-full animate-spin`}></div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {spinner}
          <p className="text-sm text-text-secondary mt-3">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8 gap-3">
      {spinner}
      <span className="text-sm text-text-secondary">{text}</span>
    </div>
  );
}
