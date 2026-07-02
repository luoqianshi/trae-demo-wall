'use client'

import React from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChineseBorderProps {
  children: React.ReactNode
  /** 边框颜色，默认赭石色 */
  color?: string
  /** 内边距 */
  padding?: string
  /** 是否显示四角装饰 */
  showCorners?: boolean
  className?: string
}

/* ------------------------------------------------------------------ */
/*  回纹角装饰 SVG                                                      */
/* ------------------------------------------------------------------ */

function CornerDecoration({
  position,
  color,
  size = 24,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color: string
  size?: number
}) {
  const transforms: Record<string, string> = {
    'top-left': '',
    'top-right': `translate(${size}, 0) scale(-1, 1)`,
    'bottom-left': `translate(0, ${size}) scale(1, -1)`,
    'bottom-right': `translate(${size}, ${size}) scale(-1, -1)`,
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute"
      style={{
        [position === 'top-left'
          ? 'top'
          : position === 'top-right'
            ? 'top'
            : position === 'bottom-left'
              ? 'bottom'
              : 'bottom']: '-1px',
        [position === 'top-left'
          ? 'left'
          : position === 'top-right'
            ? 'right'
            : position === 'bottom-left'
              ? 'left'
              : 'right']: '-1px',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={transforms[position]}>
        {/* 外层回纹 */}
        <path
          d={`M${size} 0 L${size} ${size} L0 ${size}`}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
        {/* 内层回纹 */}
        <path
          d={`M${size} ${size * 0.25} L${size * 0.25} ${size * 0.25} L${size * 0.25} ${size}`}
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
        {/* 更内层回纹 */}
        <path
          d={`M${size * 0.75} ${size * 0.25} L${size * 0.75} ${size * 0.75} L${size * 0.25} ${size * 0.75}`}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
        />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ChineseBorder({
  children,
  color = '#8B5E3C',
  padding = 'p-6',
  showCorners = true,
  className,
}: ChineseBorderProps) {
  return (
    <div
      className={`relative border border-[${color}] rounded-[6px] ${padding} ${className || ''}`}
      style={{ borderColor: color }}
    >
      {/* 四角装饰 */}
      {showCorners && (
        <>
          <CornerDecoration position="top-left" color={color} />
          <CornerDecoration position="top-right" color={color} />
          <CornerDecoration position="bottom-left" color={color} />
          <CornerDecoration position="bottom-right" color={color} />
        </>
      )}

      {/* 内容 */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  )
}
