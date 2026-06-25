import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'onLoad'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  showLoading?: boolean;
  className?: string;
  containerClassName?: string;
}

const DEFAULT_FALLBACK = 'https://picsum.photos/seed/plant_fallback/800/600';

const SafeImage = ({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  showLoading = true,
  className,
  containerClassName,
  ...props
}: SafeImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackTried, setFallbackTried] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    if (!fallbackTried) {
      setFallbackTried(true);
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  return (
    <div className={cn('relative overflow-hidden border border-plant-green/20 hover:border-plant-green/40 transition-all duration-300', containerClassName)}>
      <div className="absolute inset-0 bg-gradient-to-br from-plant-green/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {showLoading && isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-plant-green/5 to-plant-medium/5 z-10">
          <div className="w-full h-full bg-[linear-gradient(to_right,#f0fdf4_8%,#ecfdf5_18%,#f0fdf4_33%)] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Leaf className="w-8 h-8 text-plant-green/30 animate-pulse" />
          </div>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-plant-green/10 to-plant-medium/10 text-plant-green/60">
          <div className="w-12 h-12 rounded-full bg-plant-green/10 flex items-center justify-center mb-2">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">图片加载失败</span>
        </div>
      ) : (
        <img
          {...props}
          src={currentSrc}
          alt={alt}
          className={cn(
            'transition-all duration-500',
            isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default SafeImage;
