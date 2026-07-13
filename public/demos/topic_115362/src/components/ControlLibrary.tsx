import { useDraggable } from "@dnd-kit/core";
import { CONTROL_LIBRARY } from "@/constants/controls";
import { CONTROL_ICONS } from "@/constants/icons";
import { useBuilderStore } from "@/store/useBuilderStore";
import type { ControlType } from "@/types";

const CATEGORIES = ["基础", "选择", "时间", "高级"] as const;

export default function ControlLibrary() {
  const addControl = useBuilderStore((s) => s.addControl);

  return (
    <div className="p-3 space-y-4">
      {CATEGORIES.map((cat) => {
        const items = CONTROL_LIBRARY.filter((c) => c.category === cat);
        return (
          <div key={cat} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-cyan-glow/60">{cat}控件</span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-glow/20 to-transparent" />
              <span className="text-[9px] font-mono text-ink-700">{items.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((meta) => (
                <DraggableControl
                  key={meta.type}
                  type={meta.type}
                  name={meta.name}
                  onAdd={() => addControl(meta.type)}
                />
              ))}
            </div>
          </div>
        );
      })}
      <div className="text-[10px] text-ink-600 px-1 pt-3 border-t border-cyan-glow/10 leading-relaxed font-mono">
        <span className="text-cyan-glow/50">TIP:</span> 拖拽到画布或点击添加 · 选中后切到「属性」配置
      </div>
    </div>
  );
}

function DraggableControl({
  type,
  name,
  onAdd,
}: {
  type: ControlType;
  name: string;
  onAdd: () => void;
}) {
  const Icon = CONTROL_ICONS[type];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lib-${type}`,
    data: { source: "library", type },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onAdd}
      className={`group relative flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all select-none overflow-hidden ${
        isDragging
          ? "border-cyan-glow bg-cyan-glow/10 opacity-50 shadow-glow"
          : "border-cyan-glow/10 bg-ink-900/50 hover:border-cyan-glow/60 hover:bg-ink-800/60 hover:shadow-glow-sm cursor-grab active:cursor-grabbing"
      }`}
    >
      {/* 悬停扫描光 */}
      <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-700 bg-gradient-to-b from-transparent via-cyan-glow/10 to-transparent pointer-events-none" />
      <Icon className="w-5 h-5 text-ink-500 group-hover:text-cyan-glow transition-colors relative z-10" />
      <span className="text-[11px] text-ink-500 group-hover:text-white transition-colors relative z-10">{name}</span>
    </button>
  );
}
