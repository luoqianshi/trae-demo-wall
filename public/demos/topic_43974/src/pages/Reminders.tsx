import { useState } from "react";
import { Check, Clock, AlertCircle, Volume2, VolumeX } from "lucide-react";
import { todayReminders, type Reminder } from "@/data/mock";
import { useAppStore } from "@/store/appStore";

export default function Reminders() {
  const showToast = useAppStore((s) => s.showToast);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const toggleVoice = useAppStore((s) => s.toggleVoice);
  const [reminders, setReminders] = useState<Reminder[]>(todayReminders);

  const handleCheckin = (id: number) => {
    const reminder = reminders.find((r) => r.id === id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "taken" as const } : r))
    );
    if (reminder) {
      showToast(`已记录服药：${reminder.medicineName}`, "success");
    }
  };

  const takenCount = reminders.filter((r) => r.status === "taken").length;
  const pendingCount = reminders.filter((r) => r.status === "pending").length;
  const adherenceRate = reminders.length > 0 ? Math.round((takenCount / reminders.length) * 100) : 0;

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 */}
      <div className="gradient-teal px-5 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-white text-xl font-bold font-serif">用药提醒</h1>
        <p className="text-white/70 text-sm mt-1">今日 {reminders.length} 条提醒</p>

        {/* 依从性进度环 */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mt-5 border border-white/20 flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeDasharray={`${(adherenceRate / 100) * 176} 176`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{adherenceRate}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">今日服药依从性</p>
            <p className="text-white/70 text-xs mt-0.5">
              已服 {takenCount} 次 · 待服 {pendingCount} 次
            </p>
          </div>
          <button
            onClick={toggleVoice}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
              voiceEnabled ? "bg-white/20" : "bg-white/10"
            }`}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      {/* 时间轴提醒 */}
      <div className="px-5 mt-6">
        <h2 className="font-serif font-bold text-ink mb-4">今日时间轴</h2>

        <div className="relative">
          {/* 竖线 */}
          <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {reminders.map((r) => (
              <div key={r.id} className="flex gap-4 items-start relative">
                {/* 时间节点 */}
                <div
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center flex-shrink-0 z-10 border-4 border-cream ${
                    r.status === "taken"
                      ? "bg-mint text-white"
                      : r.status === "missed"
                      ? "bg-danger text-white"
                      : "bg-white text-teal card-shadow"
                  }`}
                >
                  {r.status === "taken" ? (
                    <Check size={20} />
                  ) : (
                    <>
                      <span className="text-[10px] font-medium leading-none">
                        {r.time.split(":")[0]}
                      </span>
                      <span className="text-[10px] font-medium leading-none mt-0.5">
                        {r.time.split(":")[1]}
                      </span>
                    </>
                  )}
                </div>

                {/* 提醒卡片 */}
                <div
                  className={`flex-1 rounded-2xl p-4 card-shadow ${
                    r.status === "taken" ? "bg-cream" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{r.ownerAvatar}</span>
                      <div>
                        <p
                          className={`font-semibold text-sm ${
                            r.status === "taken" ? "text-ink-light line-through" : "text-ink"
                          }`}
                        >
                          {r.medicineName}
                        </p>
                        <p className="text-xs text-ink-light">{r.dosage}</p>
                      </div>
                    </div>
                    {r.status === "taken" ? (
                      <span className="text-xs text-mint font-medium flex items-center gap-1">
                        <Check size={12} /> 已服
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckin(r.id)}
                        className="text-xs text-white bg-mint px-3 py-1.5 rounded-full font-medium hover:bg-teal transition-colors"
                      >
                        打卡
                      </button>
                    )}
                  </div>

                  {r.status === "pending" && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-ink-light">
                      <Clock size={12} />
                      {r.time} 待服药 · {r.owner}
                    </div>
                  )}
                  {r.status === "taken" && (
                    <div className="mt-2 text-xs text-ink-light">
                      ✅ 已于 {r.time} 服药
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 漏服提醒提示 */}
        {pendingCount > 0 && (
          <div className="mt-6 bg-orange-50 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-warn mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-warn">漏服提醒</p>
              <p className="text-xs text-ink-mid mt-0.5">
                到点后 15 分钟未打卡将二次提醒，并通知家庭成员
              </p>
            </div>
          </div>
        )}

        {/* 本周报告 */}
        <div className="mt-6 bg-white rounded-2xl p-5 card-shadow">
          <h3 className="font-serif font-bold text-ink mb-3">本周用药报告</h3>
          <div className="grid grid-cols-7 gap-2">
            {["一", "二", "三", "四", "五", "六", "日"].map((day, i) => {
              const rate = [100, 100, 80, 100, 60, 100, adherenceRate][i];
              return (
                <div key={day} className="text-center">
                  <div className="text-xs text-ink-light mb-1">{day}</div>
                  <div className="h-20 bg-cream rounded-lg flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-lg transition-all ${
                        rate >= 80 ? "bg-mint" : rate >= 50 ? "bg-warn" : "bg-danger"
                      }`}
                      style={{ height: `${rate}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-ink-light mt-1">{rate}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
