/** 状态徽标组件。 */
import type { AssetStatus } from '../../types'

const STATUS_CONFIG: Record<AssetStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-gray-400' },
  generating: { label: '生成中', color: 'bg-yellow-400 animate-pulse' },
  done: { label: '完成', color: 'bg-green-500' },
  failed: { label: '失败', color: 'bg-red-500' },
  user_edited: { label: '已编辑', color: 'bg-blue-500' },
}

export function StatusBadge({ status, error }: { status: AssetStatus; error?: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span
      className={`${cfg.color} text-white text-xs px-2 py-0.5 rounded-full cursor-help`}
      title={error || cfg.label}
    >
      {cfg.label}
    </span>
  )
}
