import { AlertTriangle, X } from 'lucide-react';
import { ReactNode } from 'react';
import SoftButton from './SoftButton';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/30 animate-pop-in" onClick={onCancel} />

      {/* 弹窗 */}
      <div className="relative bg-warm-light rounded-puffy shadow-puffy p-6 max-w-sm w-full animate-pop-in border-4 border-corgi-yellow/30">
        {/* 关闭按钮 */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <X size={16} />
        </button>

        {/* 图标 */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-berry-pink/15 flex items-center justify-center">
            <AlertTriangle size={32} className="text-berry-rose" />
          </div>
        </div>

        {/* 标题 */}
        <h3 className="font-display text-xl text-text-primary text-center mb-2">{title}</h3>

        {/* 内容 */}
        <div className="text-sm text-text-secondary text-center mb-6 leading-relaxed">
          {message}
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <SoftButton variant="secondary" size="md" className="flex-1" onClick={onCancel}>
            {cancelText}
          </SoftButton>
          <SoftButton variant="danger" size="md" className="flex-1" onClick={onConfirm}>
            {confirmText}
          </SoftButton>
        </div>
      </div>
    </div>
  );
}
