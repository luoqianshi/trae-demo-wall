'use client';

interface SkeletonProps {
  type?: 'card' | 'list' | 'circle';
  count?: number;
  className?: string;
}

const Skeleton = ({ type = 'card', count = 1, className = '' }: SkeletonProps) => {
  const renderCard = () => (
    <div className="bg-white rounded-3xl shadow-lg p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded-2xl w-3/4 mb-4 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded-2xl w-full mb-3 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded-2xl w-1/2 animate-pulse"></div>
    </div>
  );

  const renderList = () => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded-2xl mb-3 animate-pulse"></div>
      ))}
    </>
  );

  const renderCircle = () => (
    <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
  );

  if (type === 'card') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderCard()}</div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return <div className={className}>{renderList()}</div>;
  }

  if (type === 'circle') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderCircle()}</div>
        ))}
      </div>
    );
  }

  return null;
};

export default Skeleton;
