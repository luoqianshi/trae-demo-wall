import { useDemo } from "../lib/useDemo";
import { demoDayList } from "../lib/demoData";
import { Sparkles, X, ChevronRight, TrendingDown } from "lucide-react";

export default function DemoTimeline() {
  const { isDemoMode, currentDay, demoData, setDemoDay, toggleDemoMode } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl">
      <div className="glass-card shadow-xl p-4 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">快速体验模式</span>
              <span className="text-xs text-gray-500 ml-2">第 {currentDay} 天 · {demoData.title}</span>
            </div>
          </div>
          <button
            onClick={toggleDemoMode}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
          <div
            className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 -z-10 transition-all duration-500"
            style={{
              width: `${(demoDayList.indexOf(currentDay) / (demoDayList.length - 1)) * 100}%`,
            }}
          />
          <div className="flex items-center justify-between">
            {demoDayList.map((day) => {
              const isActive = day === currentDay;
              const data = demoData;
              return (
                <button
                  key={day}
                  onClick={() => setDemoDay(day)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-110"
                        : "bg-white border-2 border-gray-200 text-gray-500 group-hover:border-primary-300 group-hover:text-primary-500"
                    }`}
                  >
                    {day}
                  </div>
                  <span className={`text-xs ${isActive ? "text-primary-600 font-medium" : "text-gray-400"}`}>
                    第{day}天
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">
                偏差值
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{demoData.discrepancy_score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100">
              ↓ {demoData.prev_score - demoData.discrepancy_score} 分
            </span>
          </div>
          <span className="text-xs text-gray-400 max-w-[200px] text-right line-clamp-2">
            {demoData.description}
          </span>
        </div>
      </div>
    </div>
  );
}
