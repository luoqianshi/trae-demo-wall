import { useStore } from '@/store/useStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = () => {
  const { toast, hideToast } = useStore();

  if (!toast.show) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-plant-green',
    error: 'bg-emphasis-coral',
    info: 'bg-plant-medium'
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className={`${colors[toast.type]} text-white px-6 py-3 rounded-button shadow-lg flex items-center gap-3 min-w-[280px]`}>
        {icons[toast.type]}
        <span className="flex-1 font-medium">{toast.message}</span>
        <button
          onClick={hideToast}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
