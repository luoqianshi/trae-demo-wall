'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BreadcrumbItem {
  /** 显示文字 */
  label: string
  /** 链接地址，为空则当前项不可点击 */
  href?: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  /** 是否显示首页图标 */
  showHome?: boolean
  /** 首页链接 */
  homeHref?: string
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BreadcrumbNav({
  items,
  showHome = false,
  homeHref = '/',
  className,
}: BreadcrumbNavProps) {
  const allItems = showHome
    ? [{ label: '首页', href: homeHref }, ...items]
    : items

  return (
    <nav aria-label="面包屑导航" className={className}>
      <ol className="flex items-center gap-1.5 text-sm">
        {allItems.map((item, idx) => {
          const isLast = idx === allItems.length - 1

          return (
            <li key={idx} className="flex items-center gap-1.5">
              {/* 分隔符（非首项） */}
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-ink-light shrink-0" />
              )}

              {/* 首页图标 */}
              {showHome && idx === 0 && !isLast ? (
                <Link
                  href={item.href || '/'}
                  className="flex items-center gap-1 text-ink-muted hover:text-ochre transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ) : isLast ? (
                <span className="text-ink font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-ink-muted hover:text-ochre transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink-muted">{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
