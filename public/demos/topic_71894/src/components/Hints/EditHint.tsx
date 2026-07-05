import { X, Move, PlusCircle, Trash2 } from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';

export function EditHint() {
  const { isEditHintVisible, hideEditHint } = useRouteStore();

  if (!isEditHintVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[900] animate-slide-up">
      <div className="glass-panel rounded-2xl px-5 py-4 flex items-start gap-4 max-w-xl">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
          <Move size={20} className="text-violet-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">编辑模式</h3>
            <button
              onClick={hideEditHint}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ActionItem icon={<Move size={14} />} label="拖拽圆点" desc="调整点位置" color="text-blue-400" />
            <ActionItem icon={<PlusCircle size={14} />} label="点击线段" desc="插入新控制点" color="text-emerald-400" />
            <ActionItem icon={<Trash2 size={14} />} label="右键点" desc="删除控制点" color="text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ icon, label, desc, color }: { icon: React.ReactNode; label: string; desc: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/40">
      <span className={color}>{icon}</span>
      <span className="text-xs font-medium text-white">{label}</span>
      <span className="text-[10px] text-slate-500 text-center leading-tight">{desc}</span>
    </div>
  );
}
