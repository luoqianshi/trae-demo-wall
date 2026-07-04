import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface ColumnDef<T = any> {
  header: string;
  key: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

interface ActionDef<T = any> {
  icon?: React.ReactNode;
  label: string;
  onClick: (row: T) => void;
  className?: string;
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

interface DataTableProps<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  actions?: ActionDef<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  rowKey?: string;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  actions,
  onRowClick,
  emptyMessage = "暂无数据",
  className = "",
  rowKey = "id",
  pagination,
}: DataTableProps<T>) {
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0;

  return (
    <div className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_12px_32px_-4px_var(--shadow-color)] ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`
                    px-6 py-4 text-[11px] font-bold text-on-surface-variant 
                    uppercase tracking-[0.05em]
                    ${col.className || ""}
                  `}
                >
                  {col.header}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.05em] text-right">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-6"
                >
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="motion-row h-11 rounded-xl border border-border bg-card px-4 flex items-center gap-4"
                        style={{ animationDelay: `${Math.min(i * 24, 120)}ms` }}
                      >
                        <div className="h-3 w-24 motion-skeleton rounded-full" />
                        <div className="h-3 w-36 motion-skeleton rounded-full" />
                        <div className="h-3 w-20 motion-skeleton rounded-full" />
                        <div className="h-3 flex-1 motion-skeleton rounded-full" />
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                      <span className="text-3xl">📭</span>
                    </div>
                    <span className="text-on-surface-variant font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row[rowKey] || i}
                  className="motion-row group hover:bg-primary/5 transition-colors cursor-pointer"
                  style={{ animationDelay: `${Math.min(i * 20, 120)}ms` }}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, j) => (
                    <td key={j} className={`px-6 py-5 text-sm ${col.className || ""}`}>
                      {col.render
                        ? col.render(row[col.key], row, i)
                        : row[col.key] ?? "-"}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actions.map((action, k) => {
                          if (action.show && !action.show(row)) return null;
                          const isDisabled = action.disabled?.(row);
                          return (
                            <button
                              key={k}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isDisabled) action.onClick(row);
                              }}
                              disabled={isDisabled}
                              className={`
                                motion-press p-2 rounded-lg text-xs font-bold
                                ${isDisabled
                                  ? "text-on-surface-variant/30 cursor-not-allowed"
                                  : action.className || "text-primary hover:bg-primary/10"
                                }
                              `}
                              title={action.label}
                            >
                              {action.icon || action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30">
          <p className="text-xs text-on-surface-variant">
            显示第 {(pagination.current - 1) * pagination.pageSize + 1} 至 {Math.min(pagination.current * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onChange(1)}
              disabled={pagination.current === 1}
              className="motion-press p-2 rounded-lg hover:bg-surface-container disabled:opacity-30"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => pagination.onChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="motion-press p-2 rounded-lg hover:bg-surface-container disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.current <= 3) {
                pageNum = i + 1;
              } else if (pagination.current >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pagination.current - 2 + i;
              }
              return (
                <button
                  key={i}
                  onClick={() => pagination.onChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    pageNum === pagination.current
                      ? "bg-primary text-on-primary shadow-md"
                      : "hover:bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => pagination.onChange(pagination.current + 1)}
              disabled={pagination.current === totalPages}
              className="motion-press p-2 rounded-lg hover:bg-surface-container disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => pagination.onChange(totalPages)}
              disabled={pagination.current === totalPages}
              className="motion-press p-2 rounded-lg hover:bg-surface-container disabled:opacity-30"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
