import { useNavigate } from "react-router-dom";
import { Plus, Shield, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";
import { familyMembers } from "@/data/mock";
import { useAppStore } from "@/store/appStore";

export default function Family() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部 */}
      <div className="gradient-teal px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold font-serif">家庭共享</h1>
            <p className="text-white/70 text-sm mt-1">3 位家庭成员 · 远程监护中</p>
          </div>
          <button className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            onClick={() => showToast("邀请码已复制：FAM2026", "success")}
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* 家庭成员卡片 */}
      <div className="px-5 mt-6 space-y-3">
        {familyMembers.map((m) => {
          const adherenceRate = m.todayReminders > 0 ? Math.round((m.takenCount / m.todayReminders) * 100) : 100;
          return (
            <div key={m.id} className="bg-white rounded-2xl p-4 card-shadow" onClick={() => navigate(`/family/member/${m.id}`)}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-teal-pale flex items-center justify-center text-2xl">
                    {m.avatar}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      m.status === "online" ? "bg-mint" : "bg-gray-300"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink text-sm">{m.name}</h3>
                    {m.status === "online" && (
                      <span className="text-[10px] text-mint bg-mint/10 px-2 py-0.5 rounded-full">
                        在线
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-light mt-0.5">{m.role}</p>
                </div>
                <button className="text-ink-light" onClick={(e) => { e.stopPropagation(); navigate(`/family/member/${m.id}`); }}>
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* 今日用药概况 */}
              {m.todayReminders > 0 ? (
                <div className="mt-3 flex items-center gap-3 bg-cream rounded-xl p-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-ink-mid">今日用药</span>
                      <span className={`text-xs font-medium ${adherenceRate >= 80 ? "text-mint" : "text-warn"}`}>
                        {adherenceRate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${adherenceRate >= 80 ? "bg-mint" : "bg-warn"}`}
                        style={{ width: `${adherenceRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-ink-light">已服/待服</p>
                    <p className="text-sm font-semibold text-ink">
                      {m.takenCount}/{m.todayReminders}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 bg-cream rounded-xl p-3 text-center">
                  <p className="text-xs text-ink-light">今日无用药提醒</p>
                </div>
              )}

              {/* 异常提醒 */}
              {m.missedCount > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} />
                  今日漏服 {m.missedCount} 次，请关注
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 远程监护功能 */}
      <div className="px-5 mt-6">
        <h2 className="font-serif font-bold text-ink mb-3">监护功能</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <div className="w-10 h-10 rounded-xl bg-teal-pale flex items-center justify-center text-teal mb-3">
              <Shield size={20} />
            </div>
            <h3 className="font-semibold text-ink text-sm">异常通知</h3>
            <p className="text-xs text-ink-light mt-1">漏服/误服风险即时推送</p>
          </div>
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-semibold text-ink text-sm">用药周报</h3>
            <p className="text-xs text-ink-light mt-1">每周依从性分析报告</p>
          </div>
        </div>
      </div>

      {/* 最近事件 */}
      <div className="px-5 mt-6">
        <h2 className="font-serif font-bold text-ink mb-3">最近事件</h2>
        <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
          <EventItem
            type="success"
            time="09:02"
            title="爷爷已服药"
            desc="阿司匹林肠溶片 1片 (100mg)"
          />
          <EventItem
            type="success"
            time="08:05"
            title="爷爷已服药"
            desc="苯磺酸氨氯地平片 1片 (5mg)"
          />
          <EventItem
            type="warning"
            time="昨天 21:15"
            title="奶奶漏服提醒"
            desc="阿托伐他汀钙片 · 已通知家属"
          />
        </div>
      </div>

      {/* 邀请成员 */}
      <div className="px-5 mt-6">
        <button
          onClick={() => showToast("邀请码已复制：FAM2026", "success")}
          className="w-full bg-teal-pale text-teal py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          邀请家庭成员
        </button>
      </div>
    </div>
  );
}

function EventItem({
  type,
  time,
  title,
  desc,
}: {
  type: "success" | "warning" | "danger";
  time: string;
  title: string;
  desc: string;
}) {
  const config = {
    success: { dot: "bg-mint", icon: "✅" },
    warning: { dot: "bg-warn", icon: "⚠️" },
    danger: { dot: "bg-danger", icon: "❌" },
  };
  const c = config[type];

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">{title}</p>
          <span className="text-xs text-ink-light">{time}</span>
        </div>
        <p className="text-xs text-ink-light mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
