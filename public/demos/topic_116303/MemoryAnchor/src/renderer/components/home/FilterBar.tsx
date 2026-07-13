// Filter Bar Component
// Source segmented control, sort button, grid/list view toggle and a
// "N 分钟前同步" status dot for the HOME page.

import React from 'react';
import { useCollectionStore } from '../../store/collectionStore';

/**
 * 来源类型定义
 */
type SourceType = 'all' | 'web' | 'wechat' | 'github' | 'local';

/**
 * 排序类型定义
 */
type SortType = 'recent' | 'earliest' | 'title';

/**
 * 视图类型定义
 */
type ViewType = 'grid' | 'list';

/**
 * FilterBar Props 接口
 */
interface FilterBarProps {
  viewType?: ViewType;
  onViewTypeChange?: (type: ViewType) => void;
}

/**
 * 筛选栏组件
 */
const FilterBar: React.FC<FilterBarProps> = ({
  viewType = 'grid',
  onViewTypeChange,
}) => {
  const { filter, setFilter, sort, setSort } = useCollectionStore();

  // 当前选中的来源类型
  const currentSourceType: SourceType =
    filter.sourceType === 'web'
      ? 'web'
      : filter.sourceType === 'wechat'
      ? 'wechat'
      : filter.sourceType === 'github'
      ? 'github'
      : filter.sourceType === 'local' || filter.sourceType === 'file'
      ? 'local'
      : 'all';

  // 当前排序方式
  const currentSort: SortType =
    sort.sortBy === 'createdAt' && sort.sortOrder === 'desc'
      ? 'recent'
      : sort.sortBy === 'createdAt' && sort.sortOrder === 'asc'
      ? 'earliest'
      : sort.sortBy === 'title'
      ? 'title'
      : 'recent';

  // 来源类型切换（'all' 清除筛选，其余按 source_type 精确匹配）
  const handleSourceTypeChange = (type: SourceType) => {
    setFilter({ sourceType: type === 'all' ? undefined : type });
  };

  // 排序切换（在最近/最早/标题之间循环）
  const handleSortCycle = () => {
    if (currentSort === 'recent') {
      setSort({ sortBy: 'createdAt', sortOrder: 'asc' });
    } else if (currentSort === 'earliest') {
      setSort({ sortBy: 'title', sortOrder: 'asc' });
    } else {
      setSort({ sortBy: 'createdAt', sortOrder: 'desc' });
    }
  };

  // 来源类型按钮配置
  const sourceTypeButtons: { type: SourceType; label: string }[] = [
    { type: 'all', label: '全部' },
    { type: 'web', label: 'Web' },
    { type: 'wechat', label: '微信' },
    { type: 'github', label: 'GitHub' },
    { type: 'local', label: '本地' },
  ];

  // 排序选项配置
  const sortOptions: { type: SortType; label: string }[] = [
    { type: 'recent', label: '最近收藏' },
    { type: 'earliest', label: '最早收藏' },
    { type: 'title', label: '标题排序' },
  ];

  const sortLabel = sortOptions.find((opt) => opt.type === currentSort)?.label ?? '最近收藏';

  return (
    <section
      aria-label="筛选与排序"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      {/* 来源类型分段控件 */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: 3,
          border: '1px solid var(--line)',
          borderRadius: 10,
          background: 'var(--bg-1)',
        }}
      >
        {sourceTypeButtons.map((btn) => {
          const active = currentSourceType === btn.type;
          return (
            <button
              key={btn.type}
              onClick={() => handleSourceTypeChange(btn.type)}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--body)',
                fontSize: 12.5,
                transition: 'background .14s, color .14s',
                background: active ? 'var(--amber-soft)' : 'transparent',
                color: active ? 'var(--amber)' : 'var(--ink-2)',
              }}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* 排序按钮 */}
      <button
        onClick={handleSortCycle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 13px',
          borderRadius: 9,
          border: '1px solid var(--line)',
          background: 'var(--bg-1)',
          color: 'var(--ink-2)',
          fontFamily: 'var(--body)',
          fontSize: 12.5,
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4v16M7 4 4 7M7 4l3 3" />
          <path d="M17 20V4M17 20l3-3M17 20l-3-3" />
        </svg>
        {sortLabel}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* 视图切换（网格 / 列表） */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: 3,
          border: '1px solid var(--line)',
          borderRadius: 9,
          background: 'var(--bg-1)',
        }}
      >
        <button
          onClick={() => onViewTypeChange?.('grid')}
          aria-label="网格视图"
          style={{
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            background: viewType === 'grid' ? 'var(--amber-soft)' : 'transparent',
            color: viewType === 'grid' ? 'var(--amber)' : 'var(--ink-3)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="4" y="4" width="7" height="7" rx="1" />
            <rect x="13" y="4" width="7" height="7" rx="1" />
            <rect x="4" y="13" width="7" height="7" rx="1" />
            <rect x="13" y="13" width="7" height="7" rx="1" />
          </svg>
        </button>
        <button
          onClick={() => onViewTypeChange?.('list')}
          aria-label="列表视图"
          style={{
            width: 30,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            background: viewType === 'list' ? 'var(--amber-soft)' : 'transparent',
            color: viewType === 'list' ? 'var(--amber)' : 'var(--ink-3)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M8 6h12M8 12h12M8 18h12" />
            <circle cx="4" cy="6" r="1" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="4" cy="18" r="1" />
          </svg>
        </button>
      </div>

      {/* 同步状态 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontFamily: 'var(--mono)',
          fontSize: 10.5,
          color: 'var(--ink-3)',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--ok)',
            animation: 'pulseDot 2.4s ease-in-out infinite',
          }}
        />
        3 分钟前同步
      </div>
    </section>
  );
};

export default FilterBar;
