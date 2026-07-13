// Stats Cards Component
// The bordered 3-cell stat block shown in the HOME page head
// (总收藏 / AI 已处理 / 今日新增). Numbers use the mono face; the AI cell
// value is rendered in amber. Reads directly from the collection store.

import React, { useEffect } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import { formatBytes } from '../../utils/format';

interface StatCell {
  label: string;
  value: string;
  /** Optional accent color for the value (used for the AI cell). */
  color?: string;
  /** Title attribute, used to surface storage size on the total cell. */
  title?: string;
}

const StatsCards: React.FC = () => {
  const { stats, fetchStats } = useCollectionStore();

  // 确保统计数据已加载（列表加载时也会刷新）
  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const total = stats?.total ?? 0;
  const todayCount = stats?.todayCount ?? 0;
  const aiProcessedCount = stats?.aiProcessedCount ?? 0;
  const storageSize = stats ? formatBytes(stats.storageBytes) : '—';

  const cells: StatCell[] = [
    { label: '总收藏', value: total.toLocaleString(), title: `已用存储 ${storageSize}` },
    { label: 'AI 已处理', value: aiProcessedCount.toLocaleString(), color: 'var(--amber)' },
    { label: '今日新增', value: todayCount > 0 ? `+${todayCount}` : '0' },
  ];

  return (
    <div
      aria-label="数据概览"
      style={{
        display: 'flex',
        gap: 0,
        border: '1px solid var(--line)',
        borderRadius: 11,
        overflow: 'hidden',
      }}
    >
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          title={cell.title}
          style={{
            padding: '12px 20px',
            borderRight: index < cells.length - 1 ? '1px solid var(--line)' : 'none',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 22,
              fontWeight: 600,
              color: cell.color ?? 'var(--ink)',
              lineHeight: 1,
            }}
          >
            {cell.value}
          </div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9.5,
              letterSpacing: '0.12em',
              color: 'var(--ink-3)',
              marginTop: 6,
            }}
          >
            {cell.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
