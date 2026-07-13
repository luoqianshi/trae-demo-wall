import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import TopBar from "@/components/TopBar";
import LeftPanel from "@/components/LeftPanel";
import RightPanel from "@/components/RightPanel";
import Canvas from "@/components/Canvas";
import AiDrawer from "@/components/AiDrawer";
import CodePreview from "@/components/CodePreview";
import { useBuilderStore } from "@/store/useBuilderStore";
import { CONTROL_ICONS } from "@/constants/icons";
import { CONTROL_NAME_MAP } from "@/constants/controls";
import type { ControlType } from "@/types";

export default function Designer() {
  const { addControl, reorderControls, controls } = useBuilderStore();
  const [activeType, setActiveType] = useState<ControlType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith("lib-")) {
      setActiveType(id.replace("lib-", "") as ControlType);
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveType(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = String(active.id);

    // 从控件库拖入画布
    if (activeId.startsWith("lib-")) {
      const type = activeId.replace("lib-", "") as ControlType;
      addControl(type);
      return;
    }

    // 画布内排序
    const overId = String(over.id);
    if (overId !== "canvas" && activeId !== overId) {
      const fromIndex = controls.findIndex((c) => c.id === activeId);
      const toIndex = controls.findIndex((c) => c.id === overId);
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderControls(fromIndex, toIndex);
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        <TopBar />
        <div className="flex-1 flex min-h-0">
          <LeftPanel />
          <Canvas />
          <RightPanel />
        </div>
      </div>
      <AiDrawer />
      <CodePreview />
      <DragOverlay>
        {activeType ? <DragPreview type={activeType} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function DragPreview({ type }: { type: ControlType }) {
  const Icon = CONTROL_ICONS[type];
  return (
    <div className="flex flex-col items-center gap-1.5 py-3 px-6 rounded-lg border border-cyan-glow bg-ink-800 shadow-glow">
      <Icon className="w-5 h-5 text-cyan-glow" />
      <span className="text-[11px] text-white">{CONTROL_NAME_MAP[type]}</span>
    </div>
  );
}
