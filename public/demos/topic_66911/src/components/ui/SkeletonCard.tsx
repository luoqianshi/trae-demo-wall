'use client'

import React from 'react'
import { Card } from './Card'

/* ------------------------------------------------------------------ */
/*  SkeletonCard - 单张卡片骨架（品牌色 shimmer）                        */
/* ------------------------------------------------------------------ */

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={`overflow-hidden ${className || ''}`}>
      {/* 顶部图片占位 - 使用 shimmer 动画 */}
      <div className="w-full h-40 rounded-lg animate-shimmer" />

      {/* 标题占位 */}
      <div className="h-5 w-3/4 rounded animate-shimmer mt-4" style={{ animationDelay: '0.1s' }} />

      {/* 描述行占位 */}
      <div className="space-y-2.5 mt-3">
        <div className="h-3.5 w-full rounded animate-shimmer" style={{ animationDelay: '0.2s' }} />
        <div className="h-3.5 w-5/6 rounded animate-shimmer" style={{ animationDelay: '0.3s' }} />
        <div className="h-3.5 w-2/3 rounded animate-shimmer" style={{ animationDelay: '0.4s' }} />
      </div>

      {/* 底部操作栏占位 */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-light">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full animate-shimmer" style={{ animationDelay: '0.5s' }} />
          <div className="h-3 w-20 rounded animate-shimmer" style={{ animationDelay: '0.6s' }} />
        </div>
        <div className="h-3.5 w-16 rounded animate-shimmer" style={{ animationDelay: '0.7s' }} />
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  SkeletonList - 列表骨架（品牌色 shimmer）                            */
/* ------------------------------------------------------------------ */

interface SkeletonListProps {
  /** 骨架条数 */
  count?: number
  className?: string
}

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-4 p-4 rounded-[10px] bg-white border border-border"
        >
          {/* 左侧图标占位 */}
          <div className="w-10 h-10 rounded-lg animate-shimmer shrink-0" style={{ animationDelay: `${idx * 0.15}s` }} />

          {/* 中间文字占位 */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded animate-shimmer" style={{ animationDelay: `${idx * 0.15 + 0.1}s` }} />
            <div className="h-3 w-3/4 rounded animate-shimmer" style={{ animationDelay: `${idx * 0.15 + 0.2}s` }} />
          </div>

          {/* 右侧操作占位 */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 rounded-full animate-shimmer" style={{ animationDelay: `${idx * 0.15 + 0.3}s` }} />
            <div className="h-8 w-8 rounded-full animate-shimmer" style={{ animationDelay: `${idx * 0.15 + 0.4}s` }} />
          </div>
        </div>
      ))}
    </div>
  )
}