import type { ReactNode } from "react";

interface EmptyProps {
  icon?: string;
  title?: string;
  desc?: string;
  action?: ReactNode;
}

/** 空数据状态，老人友好的大字提示 */
export default function Empty({ icon = "🍄", title = "暂无数据", desc, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 text-6xl opacity-60">{icon}</div>
      <div className="mb-2 text-[18px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </div>
      {desc ? (
        <div className="mb-6 text-[14px]" style={{ color: "var(--color-text-muted)" }}>
          {desc}
        </div>
      ) : null}
      {action}
    </div>
  );
}
