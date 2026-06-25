// 空状态组件

interface EmptyProps {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Empty({
  icon = '📭',
  title = '暂无数据',
  description = '这里还没有内容哦',
  actionLabel,
  onAction,
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary text-center max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
