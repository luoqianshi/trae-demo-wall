import { FolderTree, Package, FileCode2, Layers, Table2, Database } from "lucide-react";
import { useBuilderStore } from "@/store/useBuilderStore";
import type { FrontendType, PageType } from "@/types";

export default function LeftPanel() {
  const { config, setConfig, controls } = useBuilderStore();

  return (
    <aside className="w-72 shrink-0 bg-ink-950/60 backdrop-blur-xl border-r border-cyan-glow/10 flex flex-col">
      <div className="h-11 flex items-center gap-2 px-4 border-b border-cyan-glow/10 bg-ink-900/40">
        <Layers className="w-4 h-4 text-cyan-glow" />
        <span className="text-sm font-semibold text-white tracking-wide">项目配置</span>
        <span className="ml-auto font-mono text-[9px] text-ink-600 tracking-widest">CONFIG</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 项目信息 */}
        <Group title="项目信息" icon={<FolderTree className="w-3.5 h-3.5" />}>
          <Field label="项目名称">
            <input
              value={config.projectName}
              onChange={(e) => setConfig({ projectName: e.target.value })}
              className="ipt"
              placeholder="demo"
            />
          </Field>
          <Field label="输出路径">
            <input
              value={config.outputPath}
              onChange={(e) => setConfig({ outputPath: e.target.value })}
              className="ipt font-mono"
              placeholder="/output"
            />
          </Field>
        </Group>

        {/* 后端配置 */}
        <Group title="后端配置" icon={<Package className="w-3.5 h-3.5" />}>
          <Field label="Java 包名">
            <input
              value={config.packageName}
              onChange={(e) => setConfig({ packageName: e.target.value })}
              className="ipt font-mono"
              placeholder="com.example.demo"
            />
          </Field>
          <Field label="实体名 (Entity)">
            <input
              value={config.entityName}
              onChange={(e) => setConfig({ entityName: e.target.value })}
              className="ipt font-mono"
              placeholder="User"
            />
          </Field>
          <Field label="表名 (Table)">
            <input
              value={config.tableName}
              onChange={(e) => setConfig({ tableName: e.target.value })}
              className="ipt font-mono"
              placeholder="sys_user"
            />
          </Field>
        </Group>

        {/* 前端配置 */}
        <Group title="前端配置" icon={<FileCode2 className="w-3.5 h-3.5" />}>
          <Field label="模块名 (Module)">
            <input
              value={config.moduleName}
              onChange={(e) => setConfig({ moduleName: e.target.value })}
              className="ipt font-mono"
              placeholder="user"
            />
          </Field>
          <Field label="前端类型">
            <Segmented
              value={config.frontendType}
              onChange={(v) => setConfig({ frontendType: v as FrontendType })}
              options={[
                { label: "PC 端", value: "pc" },
                { label: "移动端", value: "mobile" },
              ]}
            />
          </Field>
          <Field label="页面类型">
            <Segmented
              value={config.pageType}
              onChange={(v) => setConfig({ pageType: v as PageType })}
              options={[
                { label: "表单", value: "form" },
                { label: "列表", value: "list" },
              ]}
            />
          </Field>
          <Field label="API 前缀">
            <input
              value={config.apiPrefix}
              onChange={(e) => setConfig({ apiPrefix: e.target.value })}
              className="ipt font-mono"
              placeholder="/api"
            />
          </Field>
        </Group>

        {/* 字段统计 */}
        <Group title="字段统计" icon={<Database className="w-3.5 h-3.5" />}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="控件数" value={controls.length} />
            <Stat label="必填项" value={controls.filter((c) => c.required).length} />
          </div>
        </Group>
      </div>

      <style>{`
        .ipt {
          width: 100%;
          background: rgba(7, 10, 15, 0.7);
          border: 1px solid rgba(34, 211, 238, 0.12);
          border-radius: 6px;
          padding: 7px 10px;
          font-size: 12.5px;
          color: #E5E7EB;
          outline: none;
          transition: all 0.15s;
        }
        .ipt:focus {
          border-color: #22D3EE;
          box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.15), 0 0 12px rgba(34, 211, 238, 0.1);
          background: rgba(7, 10, 15, 0.9);
        }
        .ipt:hover:not(:focus) {
          border-color: rgba(34, 211, 238, 0.25);
        }
        .ipt::placeholder { color: #4A5468; }
      `}</style>
    </aside>
  );
}

function Group({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-card hud-corners rounded-xl p-3.5 space-y-3">
      <div className="flex items-center gap-1.5 text-cyan-glow/70">
        {icon}
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest">{title}</span>
        <div className="ml-auto flex-1 h-px bg-gradient-to-r from-cyan-glow/20 to-transparent" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] text-ink-500 font-medium">{label}</span>
      {children}
    </label>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="flex bg-ink-950/70 border border-cyan-glow/10 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
            value === opt.value ? "bg-cyan-glow text-ink-950 shadow-glow-sm" : "text-ink-500 hover:text-cyan-glow"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink-950/50 rounded-lg p-2.5 border border-cyan-glow/10 relative overflow-hidden">
      <div className="text-[9px] text-ink-600 font-mono tracking-wider uppercase">{label}</div>
      <div className="text-2xl font-bold font-mono text-cyan-glow mt-0.5 glow-text">{value}</div>
      <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-glow/5 rounded-full blur-xl" />
    </div>
  );
}
