// 蓝图风格缩略图 - 极简线稿

interface Props {
  type: string;
  className?: string;
}

export default function BlueprintThumbnail({ type, className = "" }: Props) {
  return (
    <div
      className={`relative bg-gray-50 rounded-xl overflow-hidden border border-gray-100 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="relative w-full h-full"
        fill="none"
        stroke="#FF3B30"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {renderByType(type)}
      </svg>
    </div>
  );
}

function renderByType(type: string) {
  switch (type) {
    case "thread":
      return (
        <>
          <circle cx="50" cy="50" r="30" stroke="#1D1D1F" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="22" stroke="#FF3B30" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="14" stroke="#86868B" strokeWidth="1" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="#D2D2D7" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="50" y1="20" x2="50" y2="80" stroke="#D2D2D7" strokeWidth="1" strokeDasharray="3 2" />
        </>
      );
    case "shaft":
      return (
        <>
          <line x1="10" y1="50" x2="90" y2="50" stroke="#D2D2D7" strokeDasharray="3 2" strokeWidth="1" />
          <rect x="15" y="40" width="20" height="20" stroke="#1D1D1F" strokeWidth="2" />
          <rect x="35" y="35" width="25" height="30" stroke="#1D1D1F" strokeWidth="2" />
          <rect x="60" y="42" width="25" height="16" stroke="#1D1D1F" strokeWidth="2" />
          <line x1="15" y1="62" x2="35" y2="62" stroke="#FF3B30" strokeWidth="1" />
        </>
      );
    case "gear":
      return (
        <>
          <circle cx="50" cy="50" r="32" stroke="#1D1D1F" strokeWidth="2" />
          <circle cx="50" cy="50" r="26" stroke="#D2D2D7" strokeDasharray="3 2" strokeWidth="1" />
          <circle cx="50" cy="50" r="8" stroke="#1D1D1F" strokeWidth="2" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 50 + Math.cos(angle) * 30;
            const y1 = 50 + Math.sin(angle) * 30;
            const x2 = 50 + Math.cos(angle) * 36;
            const y2 = 50 + Math.sin(angle) * 36;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF3B30" strokeWidth="2" />;
          })}
        </>
      );
    case "hole":
      return (
        <>
          <rect x="20" y="20" width="60" height="60" stroke="#1D1D1F" strokeWidth="2" />
          <circle cx="50" cy="50" r="20" stroke="#1D1D1F" strokeWidth="2" />
          <line x1="40" y1="50" x2="60" y2="50" stroke="#D2D2D7" />
          <line x1="50" y1="40" x2="50" y2="60" stroke="#D2D2D7" />
        </>
      );
    case "assembly":
      return (
        <>
          <rect x="20" y="30" width="60" height="15" stroke="#1D1D1F" strokeWidth="2" />
          <rect x="20" y="55" width="60" height="15" stroke="#1D1D1F" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" stroke="#FF3B30" strokeWidth="2" />
          <rect x="42" y="15" width="16" height="15" stroke="#1D1D1F" strokeWidth="2" />
        </>
      );
    default:
      return (
        <>
          <rect x="20" y="20" width="60" height="60" stroke="#1D1D1F" strokeWidth="2" />
          <line x1="20" y1="20" x2="80" y2="80" stroke="#D2D2D7" />
          <line x1="80" y1="20" x2="20" y2="80" stroke="#D2D2D7" />
        </>
      );
  }
}
