import { useNavigate, useLocation } from "react-router-dom";
import { Home, Camera, Pill, Bell, User } from "lucide-react";

const tabs = [
  { path: "/", label: "首页", icon: Home },
  { path: "/cabinet", label: "药箱", icon: Pill },
  { path: "/reminders", label: "提醒", icon: Bell },
  { path: "/profile", label: "我的", icon: User },
];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around py-2 pb-4 relative">
        {/* 左侧 2 个 tab */}
        {tabs.slice(0, 2).map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${
                isActive ? "text-teal" : "text-ink-light"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-normal"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* 中间识药 FAB */}
        <button
          onClick={() => navigate("/recognize")}
          className="flex flex-col items-center -mt-6"
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
              location.pathname === "/recognize"
                ? "gradient-teal scale-110"
                : "gradient-mint"
            }`}
          >
            <Camera size={26} className="text-white" strokeWidth={2.5} />
          </div>
          <span className={`text-[10px] mt-0.5 ${location.pathname === "/recognize" ? "text-teal font-semibold" : "text-ink-light"}`}>
            识药
          </span>
        </button>

        {/* 右侧 2 个 tab */}
        {tabs.slice(2).map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${
                isActive ? "text-teal" : "text-ink-light"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-normal"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
