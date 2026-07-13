import { Plus, X, MousePointer2 } from "lucide-react";
import { useBuilderStore } from "@/store/useBuilderStore";
import { CONTROL_NAME_MAP } from "@/constants/controls";
import { CONTROL_ICONS } from "@/constants/icons";

const JAVA_TYPES = ["String", "Integer", "Long", "BigDecimal", "LocalDate", "LocalTime", "LocalDateTime"];
const DB_TYPES = ["VARCHAR", "TEXT", "INT", "BIGINT", "DECIMAL", "TINYINT", "DATE", "TIME", "DATETIME"];

export default function PropertyPanel() {
  const { controls, selectedId, updateControl } = useBuilderStore();
  const selected = controls.find((c) => c.id === selectedId);

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <MousePointer2 className="w-8 h-8 text-ink-700 mb-3" />
        <p className="text-sm text-ink-500">未选中控件</p>
        <p className="text-[11px] text-ink-600 mt-1">在画布中点击控件即可配置属性</p>
      </div>
    );
  }

  const Icon = CONTROL_ICONS[selected.type];

  return (
    <div className="p-3 space-y-4">
      {/* 控件头 */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-950/40 border border-cyan-glow/30">
        <Icon className="w-4 h-4 text-cyan-glow" />
        <span className="text-sm font-semibold text-white">{CONTROL_NAME_MAP[selected.type]}</span>
        <span className="ml-auto text-[10px] font-mono text-ink-600">{selected.id.slice(-6)}</span>
      </div>

      <PropGroup title="基础属性">
        <PropField label="字段名 (field)">
          <input value={selected.field} onChange={(e) => updateControl(selected.id, { field: e.target.value })} className="ipt font-mono" />
        </PropField>
        <PropField label="标签 (label)">
          <input value={selected.label} onChange={(e) => updateControl(selected.id, { label: e.target.value })} className="ipt" />
        </PropField>
        <PropField label="占位提示 (placeholder)">
          <input value={selected.placeholder ?? ""} onChange={(e) => updateControl(selected.id, { placeholder: e.target.value })} className="ipt" />
        </PropField>
        <PropField label="默认值">
          <input value={selected.defaultValue ?? ""} onChange={(e) => updateControl(selected.id, { defaultValue: e.target.value })} className="ipt font-mono" />
        </PropField>
        <Toggle label="是否必填" checked={selected.required} onChange={(v) => updateControl(selected.id, { required: v })} />
      </PropGroup>

      <PropGroup title="类型映射">
        <PropField label="Java 类型">
          <select value={selected.javaType} onChange={(e) => updateControl(selected.id, { javaType: e.target.value })} className="ipt font-mono">
            {JAVA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </PropField>
        <PropField label="数据库类型">
          <select value={selected.dbType} onChange={(e) => updateControl(selected.id, { dbType: e.target.value })} className="ipt font-mono">
            {DB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </PropField>
        <PropField label="字段长度">
          <input
            type="number"
            value={selected.length ?? ""}
            onChange={(e) => updateControl(selected.id, { length: Number(e.target.value) || undefined })}
            className="ipt font-mono"
          />
        </PropField>
        <PropField label={`列宽 (${selected.width ?? 24}/24)`}>
          <input
            type="range"
            min={6}
            max={24}
            step={2}
            value={selected.width ?? 24}
            onChange={(e) => updateControl(selected.id, { width: Number(e.target.value) })}
            className="w-full accent-cyan-glow"
          />
        </PropField>
      </PropGroup>

      {/* 选项配置 */}
      {selected.options && (
        <PropGroup title="选项配置">
          <div className="space-y-1.5">
            {selected.options.map((opt, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={opt.label}
                  onChange={(e) => {
                    const options = [...selected.options!];
                    options[i] = { ...options[i], label: e.target.value };
                    updateControl(selected.id, { options });
                  }}
                  className="ipt flex-1"
                  placeholder="标签"
                />
                <input
                  value={opt.value}
                  onChange={(e) => {
                    const options = [...selected.options!];
                    options[i] = { ...options[i], value: e.target.value };
                    updateControl(selected.id, { options });
                  }}
                  className="ipt w-20 font-mono"
                  placeholder="值"
                />
                <button
                  onClick={() => updateControl(selected.id, { options: selected.options!.filter((_, idx) => idx !== i) })}
                  className="shrink-0 w-8 rounded-md border border-ink-700 text-ink-500 hover:text-red-400 hover:border-red-400/50 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => updateControl(selected.id, { options: [...(selected.options ?? []), { label: "新选项", value: String(selected.options!.length + 1) }] })}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md border border-dashed border-ink-600 text-ink-500 hover:text-cyan-glow hover:border-cyan-glow/50 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> 添加选项
          </button>
        </PropGroup>
      )}

      <style>{`
        .ipt {
          width: 100%;
          background: rgba(7, 10, 15, 0.6);
          border: 1px solid rgba(74, 84, 104, 0.5);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 12.5px;
          color: #E5E7EB;
          outline: none;
          transition: all 0.15s;
        }
        .ipt:focus { border-color: #22D3EE; box-shadow: 0 0 0 2px rgba(34,211,238,0.15); }
        .ipt option { background: #131721; }
      `}</style>
    </div>
  );
}

function PropGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-3 space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{title}</div>
      {children}
    </div>
  );
}

function PropField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-ink-500 font-medium">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-ink-500 font-medium">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-cyan-glow" : "bg-ink-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}
