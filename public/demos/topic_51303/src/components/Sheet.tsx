import type { ReactNode } from "react";
import { useEffect } from "react";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** 底部弹层（三级页面），点击遮罩关闭 */
export default function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/45 animate-toast" onClick={onClose} style={{ animation: "fadeInUp 200ms ease both" }} />
      {/* 面板 */}
      <div
        className="relative w-full max-w-[420px] rounded-t-2xl bg-[var(--color-bg-elevated)] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl"
        style={{ animation: "sheetUp 280ms cubic-bezier(.2,.8,.2,1) both" }}
      >
        {title ? (
          <div
            className="flex items-center justify-between"
            style={{ padding: "16px 16px 8px", borderBottom: "1px solid var(--color-rule)" }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>{title}</span>
            <button onClick={onClose} aria-label="关闭" className="flex h-9 w-9 items-center justify-center">
              <X size={18} color="var(--color-text-muted)" />
            </button>
          </div>
        ) : null}
        <div style={{ maxHeight: "60vh", overflowY: "auto" }} className="no-scrollbar">
          {children}
        </div>
      </div>
      <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}
