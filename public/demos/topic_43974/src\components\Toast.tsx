import { useAppStore } from "@/store/appStore";
import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";

const iconMap = {
  success: { Icon: CheckCircle2, color: "text-mint", bg: "bg-mint" },
  warning: { Icon: AlertCircle, color: "text-warn", bg: "bg-warn" },
  error: { Icon: XCircle, color: "text-danger", bg: "bg-danger" },
  info: { Icon: Info, color: "text-teal", bg: "bg-teal" },
};

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none w-[390px] px-5">
      {toasts.map((toast) => {
        const { Icon, color } = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="bg-ink text-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5 animate-slide-up max-w-full pointer-events-auto cursor-pointer"
          >
            <Icon size={18} className={color} />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
