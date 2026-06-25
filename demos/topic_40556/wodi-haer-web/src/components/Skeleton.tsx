// 骨架屏组件

interface SkeletonProps {
  className?: string;
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return (
    <div className={`h-4 bg-cream rounded animate-pulse ${className}`}></div>
  );
}

export function SkeletonCircle({ size = 'w-12 h-12' }: SkeletonProps & { size?: string }) {
  return <div className={`${size} rounded-full bg-cream animate-pulse`}></div>;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-soft-blue">
      <SkeletonCircle size="w-10 h-10" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonText key={i} className={i === lines - 1 ? 'w-3/4' : 'w-full'} />
        ))}
      </div>
    </div>
  );
}

// 阶段卡片骨架
export function SkeletonStageGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-6 bg-white shadow-md animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-cream mx-auto mb-3"></div>
          <div className="h-5 w-16 bg-cream rounded mx-auto mb-2"></div>
          <div className="h-3 w-24 bg-cream rounded mx-auto"></div>
        </div>
      ))}
    </div>
  );
}
