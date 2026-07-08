import { useNavigate } from "react-router-dom";
import { Camera, Pill, Bell, Users, ChevronRight, AlertTriangle, Clock, CheckCircle2, Calculator, MessageCircle } from "lucide-react";
import { todayReminders, cabinetItems, familyMembers } from "@/data/mock";

export default function Home() {
  const navigate = useNavigate();

  const pendingReminders = todayReminders.filter((r) => r.status === "pending");
  const takenReminders = todayReminders.filter((r) => r.status === "taken");
  const expiringItems = cabinetItems.filter((i) => i.status === "expiring" || i.status === "low-stock");

  return (
    <div className="min-h-screen pb-24">
      {/* 顶部渐变区 */}
      <div className="gradient-teal px-5 pt-12 pb-20 rounded-b-[32px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm">早上好 👋</p>
              <h1 className="text-white text-2xl font-bold font-serif">AI 药管家</h1>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white text-xl">
              👨‍👩‍👧
            </div>
          </div>

          {/* 今日用药概览 */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">今日用药</span>
              <span className="text-white/70 text-sm">{takenReminders.length}/{todayReminders.length} 已完成</span>
            </div>
            <div className="flex gap-2">
              {todayReminders.map((r) => (
                <div
                  key={r.id}
                  className={`flex-1 h-2 rounded-full ${
                    r.status === "taken" ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl p-4 card-shadow-lg grid grid-cols-3 gap-3">
          {[
            { icon: Camera, label: "拍照识药", path: "/recognize", color: "bg-teal-pale text-teal" },
            { icon: Pill, label: "家庭药箱", path: "/cabinet", color: "bg-orange-50 text-warn" },
            { icon: Bell, label: "用药提醒", path: "/reminders", color: "bg-blue-50 text-blue-500" },
            { icon: Calculator, label: "儿童剂量", path: "/dosage", color: "bg-pink-50 text-pink-500" },
            { icon: MessageCircle, label: "用药问答", path: "/qa", color: "bg-green-50 text-green-600" },
            { icon: Users, label: "家庭共享", path: "/family", color: "bg-purple-50 text-purple-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <span className="text-xs text-ink-mid font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 待服药提醒 */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif font-bold text-lg text-ink">待服药</h2>
          <button onClick={() => navigate("/reminders")} className="text-teal text-sm flex items-center gap-0.5">
            全部 <ChevronRight size={14} />
          </button>
        </div>

        {pendingReminders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 card-shadow text-center">
            <CheckCircle2 size={32} className="mx-auto text-mint mb-2" />
            <p className="text-ink-mid text-sm">今日用药已全部完成 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReminders.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-pale flex items-center justify-center text-2xl">
                  {r.ownerAvatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-sm">{r.medicineName}</span>
                    <span className="text-xs text-ink-light">{r.owner}</span>
                  </div>
                  <p className="text-xs text-ink-light mt-0.5">{r.dosage}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-teal font-semibold">
                    <Clock size={14} />
                    <span className="text-sm">{r.time}</span>
                  </div>
                  <button onClick={() => navigate("/reminders")} className="text-xs text-mint mt-1 font-medium">打卡 →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 药箱预警 */}
      {expiringItems.length > 0 && (
        <div className="px-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-warn" />
            <h2 className="font-serif font-bold text-lg text-ink">药箱预警</h2>
          </div>
          <div className="space-y-2">
            {expiringItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-4 card-shadow flex items-center gap-3 ${
                  item.status === "expiring" ? "bg-orange-50" : "bg-red-50"
                }`}
              >
                <div className="text-2xl">{item.medicine.image}</div>
                <div className="flex-1">
                  <p className="font-semibold text-ink text-sm">{item.medicine.name}</p>
                  <p className={`text-xs mt-0.5 ${item.status === "expiring" ? "text-warn" : "text-danger"}`}>
                    {item.status === "expiring"
                      ? `即将过期 · 剩 ${item.daysToExpiry} 天`
                      : `库存不足 · 剩 ${item.quantity} 片`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 家庭成员状态 */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif font-bold text-lg text-ink">家庭成员</h2>
          <button onClick={() => navigate("/family")} className="text-teal text-sm flex items-center gap-0.5">
            管理 <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {familyMembers.map((m) => (
            <div key={m.id} onClick={() => navigate(`/family/member/${m.id}`)} className="bg-white rounded-2xl p-4 card-shadow min-w-[120px] text-center cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative inline-block mb-2">
                <div className="w-14 h-14 rounded-full bg-teal-pale flex items-center justify-center text-2xl">
                  {m.avatar}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    m.status === "online" ? "bg-mint" : "bg-gray-300"
                  }`}
                />
              </div>
              <p className="font-semibold text-ink text-sm">{m.name}</p>
              <p className="text-xs text-ink-light mt-0.5">
                {m.takenCount}/{m.todayReminders} 已服
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
