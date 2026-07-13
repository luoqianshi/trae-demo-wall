// Pagination Component
// Pagination controls for navigating through collection pages

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCollectionStore } from '../../store/collectionStore';

/**
 * Pagination Props 接口
 */
interface PaginationProps {
  maxVisiblePages?: number;
}

/**
 * 分页组件
 */
const Pagination: React.FC<PaginationProps> = ({ maxVisiblePages = 7 }) => {
  const { page, pageSize, total, setPage, fetchCollections } = useCollectionStore();

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);

  // 如果总页数为 0 或 1，不显示分页
  if (totalPages <= 1) {
    return null;
  }

  // 计算显示的页码范围
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= maxVisiblePages) {
      // 总页数少于最大可见页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总页数多于最大可见页数，显示部分页码
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, page - halfVisible);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      // 调整起始页，确保显示足够的页码
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      // 添加第一页和省略号
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('ellipsis');
        }
      }

      // 添加中间页码
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 添加省略号和最后一页
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('ellipsis');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // 处理页码点击
  const handlePageClick = (pageNum: number) => {
    setPage(pageNum);
    void fetchCollections(pageNum);
  };

  // 处理上一页
  const handlePrevPage = () => {
    if (page > 1) {
      handlePageClick(page - 1);
    }
  };

  // 处理下一页
  const handleNextPage = () => {
    if (page < totalPages) {
      handlePageClick(page + 1);
    }
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-8"
      aria-label="分页"
    >
      {/* 上一页按钮 */}
      <button
        className="px-3 py-1.5 text-sm rounded-lg border whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-tertiary)',
          background: 'var(--color-bg-surface)',
        }}
        disabled={page === 1}
        onClick={handlePrevPage}
        aria-label="上一页"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* 页码按钮 */}
      {visiblePages.map((pageNum, index) => {
        if (pageNum === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="text-sm px-1"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              ...
            </span>
          );
        }

        const isActive = pageNum === page;
        return (
          <button
            key={pageNum}
            className="px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors duration-150"
            style={{
              background: isActive
                ? 'var(--color-primary-500)'
                : 'var(--color-bg-surface)',
              color: isActive
                ? 'var(--color-text-inverse)'
                : 'var(--color-text-secondary)',
              border: isActive ? 'none' : '1px solid var(--color-border-default)',
            }}
            onClick={() => handlePageClick(pageNum)}
            aria-label={`第 ${pageNum} 页`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* 下一页按钮 */}
      <button
        className="px-3 py-1.5 text-sm rounded-lg border whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-tertiary)',
          background: 'var(--color-bg-surface)',
        }}
        disabled={page === totalPages}
        onClick={handleNextPage}
        aria-label="下一页"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

export default Pagination;