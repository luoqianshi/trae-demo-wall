import { useState } from "react";
import { LayoutGrid, Settings2 } from "lucide-react";
import ControlLibrary from "./ControlLibrary";
import PropertyPanel from "./PropertyPanel";

export default function RightPanel() {
  const [tab, setTab] = useState<"library" | "property">("library");

  return (
    <aside className="w-72 shrink-0 bg-ink-950/60 backdrop-blur-xl border-l border-cyan-glow/10 flex flex-col">
      <div className="h-11 flex items-center gap-1 px-3 border-b border-cyan-glow/10 bg-ink-900/40">
        <TabBtn active={tab === "library"} onClick={() => setTab("library")} icon={<LayoutGrid className="w-4 h-4" />}>
          控件库
        </TabBtn>
        <TabBtn active={tab === "property"} onClick={() => setTab("property")} icon={<Settings2 className="w-4 h-4" />}>
          属性
        </TabBtn>
      </div>
      <div className="flex-1 overflow-y-auto">{tab === "library" ? <ControlLibrary /> : <PropertyPanel />}</div>
    </aside>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 h-8 rounded-md text-sm font-medium transition-all ${
        active ? "bg-ink-700/60 text-cyan-glow" : "text-ink-500 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
