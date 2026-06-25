interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;      // 默认 "确认"
  cancelText?: string;       // 默认 "取消"
  type?: 'danger' | 'warning' | 'info';  // 默认 danger
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * 通用确认弹窗组件
 * 用于删除操作、危险操作等需要二次确认的场景
 *
 * 使用示例:
 * <ConfirmDialog
 *   open={showDelete}
 *   title="确认删除"
 *   message="删除后无法恢复，确定要继续吗？"
 *   type="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDelete(false)}
 * />
 */
function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const typeStyles = {
    danger: { bg: 'bg-red-500 hover:bg-red-600', ring: 'ring-red-100', border: 'border-red-200' },
    warning: { bg: 'bg-yellow-500 hover:bg-yellow-600', ring: 'ring-yellow-100', border: 'border-yellow-200' },
    info: { bg: 'bg-ice-blue hover:bg-sky-600', ring: 'ring-blue-100', border: 'border-blue-200' },
  };

  const style = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onCancel}>
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" />

      {/* 弹窗主体 */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fadeInUp ${style.border} border-2`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题区 */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">
            {type === 'danger' ? '⚠️' : type === 'warning' ? '💡' : 'ℹ️'}
          </span>
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        </div>

        {/* 消息内容 */}
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">{message}</p>

        {/* 按钮组 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-text-secondary hover:bg-gray-200 transition-all active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-[0.98] ${style.bg} ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </span>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
