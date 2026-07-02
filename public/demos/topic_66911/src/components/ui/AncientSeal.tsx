'use client'

import React from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AncientSealProps {
  /** 印章文字，最多4个字 */
  text?: string
  /** 印章尺寸 (px) */
  size?: number
  /** 是否显示斑驳效果 */
  distressed?: boolean
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AncientSeal({
  text = '墨韵',
  size = 80,
  distressed = true,
  className,
}: AncientSealProps) {
  const fontSize = size * 0.28
  const strokeWidth = size * 0.025
  const innerOffset = size * 0.1

  /* 斑驳纹理 - 用随机圆点模拟 */
  const distressDots = distressed
    ? Array.from({ length: 18 }).map((_, i) => {
        const angle = (i * 37 + 11) % 360
        const r = size * 0.15 + ((i * 13 + 7) % (size * 0.32))
        const cx = size / 2 + (r * Math.cos((angle * Math.PI) / 180))
        const cy = size / 2 + (r * Math.sin((angle * Math.PI) / 180))
        const dotR = size * 0.01 + ((i * 7 + 3) % 5) * size * 0.004
        return { cx, cy, r: dotR }
      })
    : []

  /* 将文字拆分为单字，2x2排列 */
  const chars = text.slice(0, 4).padEnd(4, ' ').split('')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 外框 */}
      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={size - strokeWidth}
        height={size - strokeWidth}
        rx={size * 0.02}
        ry={size * 0.02}
        fill="none"
        stroke="#C23B22"
        strokeWidth={strokeWidth}
      />

      {/* 内框 */}
      <rect
        x={innerOffset}
        y={innerOffset}
        width={size - innerOffset * 2}
        height={size - innerOffset * 2}
        rx={size * 0.01}
        ry={size * 0.01}
        fill="none"
        stroke="#C23B22"
        strokeWidth={strokeWidth * 0.6}
      />

      {/* 文字 - 2x2 竖排排列（从右到左，从上到下） */}
      {chars.map((char, idx) => {
        const col = 1 - Math.floor(idx / 2) // 右列 -> 左列
        const row = idx % 2
        const cellW = (size - innerOffset * 2) / 2
        const cellH = (size - innerOffset * 2) / 2
        const x = innerOffset + col * cellW + cellW / 2
        const y = innerOffset + row * cellH + cellH / 2

        return (
          <text
            key={idx}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#C23B22"
            fontSize={fontSize}
            fontWeight="bold"
            fontFamily="'SimSun', 'STSong', 'Noto Serif SC', serif"
          >
            {char}
          </text>
        )
      })}

      {/* 斑驳效果 */}
      {distressDots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill="#F5EDE3"
          opacity={0.6 + (i % 3) * 0.15}
        />
      ))}
    </svg>
  )
}
