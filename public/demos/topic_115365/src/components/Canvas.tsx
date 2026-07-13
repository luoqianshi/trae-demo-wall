import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, AlertCircle } from "lucide-react";
import { useBuilderStore } from "@/store/useBuilderStore";
import { CONTROL_ICONS } from "@/constants/icons";
import { CONTROL_NAME_MAP } from "@/constants/controls";
import type { Control } from "@/types";

export default function Canvas() {
  const { controls, selectedId, selectControl, previewMode, config } = useBuilderStore();
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <main className="flex-1 flex flex-col min-w-0 relative">
      {/* 画布顶栏 */}
      <div className="h-10 shrink-0 flex items-center justify-between px-5 border-b border-cyan-glow/10 bg-ink-950/60 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-cyan-glow/60">CANVAS</span>
          <span className="text-ink-700">::</span>
          <span className="text-cyan-glow glow-text">{config.moduleName}</span>
          <span className="text-ink-700">/</span>
          <span className="text-ink-500">{config.frontendType === "pc" ? "PC" : "MOBILE"}</span>
          <span className="text-ink-700">/</span>
          <span className="text-ink-500">{config.pageType === "form" ? "FORM" : "LIST"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ink-600">
            <span className="blink-dot inline-block w-1.5 h-1.5 rounded-full bg-cyan-glow mr-1.5" />
            READY
          </span>
          <span className="text-[11px] font-mono text-cyan-glow/80">{controls.length} FIELDS</span>
        </div>
      </div>

      {/* 画布主体 */}
      <div className="flex-1 overflow-auto p-6 blueprint-bg relative">
        {/* 画布坐标刻度装饰 */}
        <div className="absolute top-2 left-2 font-mono text-[8px] text-cyan-glow/20 tracking-widest pointer-events-none select-none">
          X:0000 Y:0000
        </div>
        <div className="absolute top-2 right-2 font-mono text-[8px] text-cyan-glow/20 tracking-widest pointer-events-none select-none">
          GRID:24px
        </div>

        <div
          ref={setNodeRef}
          className={`min-h-full max-w-3xl mx-auto rounded-xl border transition-all relative hud-corners ${
            isOver ? "border-cyan-glow bg-cyan-glow/5 shadow-glow" : "border-cyan-glow/20"
          } ${previewMode ? "bg-ink-900/50" : "bg-ink-950/40 backdrop-blur-sm"}`}
        >
          {/* 拖入提示辉光 */}
          {isOver && <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse bg-cyan-glow/5" />}

          {/* 表单标题 */}
          <div className="px-6 pt-5 pb-3 border-b border-cyan-glow/10 flex items-center">
            <div className="w-1 h-5 bg-cyan-glow rounded-full shadow-glow-sm mr-3" />
            <h2 className="text-lg font-display font-bold text-white tracking-wide glow-text">
              {config.entityName || "表单"}
            </h2>
            <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-glow/60 border border-cyan-glow/20 bg-cyan-glow/5">
              {config.tableName}
            </span>
          </div>

          {controls.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="p-5 space-y-2.5">
              <SortableContext items={controls.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {controls.map((c) => (
                  <CanvasItem
                    key={c.id}
                    control={c}
                    selected={c.id === selectedId}
                    previewMode={previewMode}
                    onSelect={() => selectControl(c.id)}
                    onDelete={() => {
                      useBuilderStore.getState().removeControl(c.id);
                    }}
                  />
                ))}
              </SortableContext>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative w-20 h-20 mb-5">
        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-cyan-glow/30 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-cyan-glow/40" />
        </div>
        <div className="absolute inset-0 rounded-2xl border border-cyan-glow/20 animate-ping" />
      </div>
      <p className="text-sm text-ink-400 font-mono tracking-wide">// 等待控件注入</p>
      <p className="text-[11px] text-ink-600 mt-2 font-mono">DRAG FROM LIBRARY · OR USE AI DIALOG</p>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-glow/30 blink-dot" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
    </div>
  );
}

function CanvasItem({
  control,
  selected,
  previewMode,
  onSelect,
  onDelete,
}: {
  control: Control;
  selected: boolean;
  previewMode: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: control.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const Icon = CONTROL_ICONS[control.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative rounded-lg border transition-all overflow-hidden ${
        selected
          ? "border-cyan-glow bg-cyan-glow/8 shadow-glow-sm"
          : "border-cyan-glow/10 bg-ink-900/40 hover:border-cyan-glow/40 hover:bg-ink-850/60"
      }`}
    >
      {/* 选中态左侧光条 */}
      {selected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-glow shadow-glow" />}

      <div className="flex items-start gap-3 p-3.5">
        {/* 拖拽手柄 */}
        {!previewMode && (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 text-ink-700 hover:text-cyan-glow cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* 控件预览 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon className={`w-3.5 h-3.5 ${selected ? "text-cyan-glow" : "text-ink-600"}`} />
            <span className="text-[13px] text-white font-medium">{control.label}</span>
            {control.required && <span className="text-red-400 text-xs">*</span>}
            <span className="ml-auto text-[9px] font-mono text-ink-600 tracking-wider uppercase px-1.5 py-0.5 rounded border border-ink-700/50">
              {CONTROL_NAME_MAP[control.type]}
            </span>
          </div>
          <ControlPreview control={control} />
        </div>

        {/* 删除按钮 */}
        {!previewMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 字段名标签 */}
      {!previewMode && (
        <div className="absolute -bottom-2 right-3 px-1.5 py-0.5 rounded bg-ink-950 border border-cyan-glow/20 text-[9px] font-mono text-cyan-glow/50">
          <span className="text-emerald-code/60">{control.field}</span>
          <span className="text-ink-700 mx-1">::</span>
          <span className="text-amber-accent/60">{control.javaType}</span>
          <span className="text-ink-700 mx-1">::</span>
          <span className="text-pink-400/50">{control.dbType}</span>
        </div>
      )}
    </div>
  );
}

// 控件可视化预览（简化的真实表单外观）
function ControlPreview({ control }: { control: Control }) {
  const base = "w-full bg-ink-950/60 border border-cyan-glow/10 rounded-md px-3 py-2 text-[12px] text-ink-600 font-mono";

  switch (control.type) {
    case "input":
      return <div className={base}>{control.placeholder || "文本输入框"}</div>;
    case "textarea":
      return <div className={`${base} h-16 resize-none`}>{control.placeholder || "多行文本"}</div>;
    case "number":
      return <div className={`${base} flex items-center justify-between`}><span>{control.placeholder || "数字"}</span><span className="text-ink-700">−  +</span></div>;
    case "select":
      return <div className={`${base} flex items-center justify-between`}><span>{control.placeholder || "请选择"}</span><span className="text-ink-700">▾</span></div>;
    case "radio":
      return <div className="flex gap-3">{(control.options ?? []).map((o, i) => <label key={i} className="flex items-center gap-1 text-[12px] text-ink-500"><span className="w-3 h-3 rounded-full border border-ink-600" />{o.label}</label>)}</div>;
    case "checkbox":
      return <div className="flex gap-3">{(control.options ?? []).map((o, i) => <label key={i} className="flex items-center gap-1 text-[12px] text-ink-500"><span className="w-3 h-3 rounded border border-ink-600" />{o.label}</label>)}</div>;
    case "date":
      return <div className={`${base} flex items-center justify-between`}><span>YYYY-MM-DD</span><span className="text-ink-700">▦</span></div>;
    case "time":
      return <div className={`${base} flex items-center justify-between`}><span>HH:mm:ss</span><span className="text-ink-700">⏱</span></div>;
    case "datetime":
      return <div className={`${base} flex items-center justify-between`}><span>YYYY-MM-DD HH:mm</span><span className="text-ink-700">▦</span></div>;
    case "switch":
      return <div className="flex items-center"><span className="relative w-9 h-5 rounded-full bg-ink-700"><span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-ink-500" /></span></div>;
    case "upload":
      return <div className={`${base} h-14 flex flex-col items-center justify-center border-dashed`}><span className="text-ink-600">📎 点击或拖拽文件上传</span></div>;
    case "table":
      return <div className="border border-ink-700/50 rounded-lg overflow-hidden"><div className="grid grid-cols-3 bg-ink-800/60 text-[10px] text-ink-500 px-2 py-1">{["列1","列2","操作"]}</div><div className="grid grid-cols-3 px-2 py-1.5 text-[11px] text-ink-600 border-t border-ink-700/40">{["—","—","编辑 删除"]}</div></div>;
    default:
      return <div className={base}>控件</div>;
  }
}
