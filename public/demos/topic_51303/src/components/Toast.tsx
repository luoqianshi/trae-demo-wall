import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  id: number;
}

/** 全局 Toast 提示，2 秒自动消失 */
export default function Toast({ message, visible, id }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 2200);
      return () => clearTimeout(t);
    }
  }, [visible, id]);

  if (!show || !message) return null;

  return (
    <div
      key={id}
      className="animate-toast pointer-events-none fixed left-1/2 top-[42%] z-[100] max-w-[80%] -translate-x-1/2 rounded-xl bg-black/80 px-5 py-3 text-center text-[15px] font-medium text-white shadow-lg"
      style={{ backdropFilter: "blur(6px)" }}
    >
      {message}
    </div>
  );
}
