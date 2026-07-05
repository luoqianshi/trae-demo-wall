// 品牌 Logo - 苹果风简约

import { Link } from "react-router-dom";

export default function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: { box: "w-7 h-7", text: "text-base", sub: "text-[10px]" },
    md: { box: "w-8 h-8", text: "text-lg", sub: "text-xs" },
    lg: { box: "w-10 h-10", text: "text-2xl", sub: "text-sm" },
  };
  const s = sizeMap[size];

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`${s.box} relative flex items-center justify-center`}>
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <circle cx="20" cy="20" r="18" fill="#FF3B30" />
          <path
            d="M 14 22 Q 20 16 26 22 L 26 27 L 14 27 Z"
            fill="white"
            opacity="0.95"
          />
          <path
            d="M 17 20 Q 20 24 23 20"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <circle cx="20" cy="14" r="2" fill="white" opacity="0.9" />
        </svg>
      </div>
      <div className="leading-tight">
        <div
          className={`font-semibold text-gray-900 ${s.text} tracking-tight group-hover:text-apple-500 transition-colors`}
        >
          easy<span className="text-apple-500">图图</span>
        </div>
        {size !== "sm" && (
          <div className="text-gray-400 text-xs">
            AutoCAD 学习平台
          </div>
        )}
      </div>
    </Link>
  );
}
