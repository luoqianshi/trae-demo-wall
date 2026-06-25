import React, { useState, useEffect } from "react";
import { Bell, Search, LogOut, Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const ROLE_NAMES: Record<string, string> = {
  ADMIN: "信息科管理员", DOCTOR: "医生", PATIENT: "患者",
  admin: "系统管理员", doctor: "医生", nurse: "护士",
  cashier: "收费员", pharmacist: "药师", patient: "访客",
};

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationCount] = useState(Math.floor(Math.random() * 5) + 1);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("zh-CN", { hour12: false }));
      setCurrentDate(
        now.toLocaleDateString("zh-CN", {
          year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 right-0 left-56 z-40 flex items-center justify-between px-6 h-14 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className={`relative transition-all duration-300 ${searchFocused ? "w-80" : "w-72"}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary transition-colors" size={15} />
          <input
            type="text"
            placeholder="搜索患者、药品、功能..."
            className="w-full pl-9 pr-10 py-1.5 text-sm bg-primary/5 border border-border rounded-xl focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/70"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-primary bg-card border border-border rounded-md px-1.5 py-0.5 font-mono transition-opacity ${searchFocused ? "opacity-0" : "opacity-100"}`}>
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="motion-press relative p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl">
          <Bell size={17} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="motion-press p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-primary/10"
          title="切换主题"
        >
          <Palette size={16} className="text-primary" />
          <span className="hidden sm:inline">{theme === "hello-kitty" ? "粉色主题" : "蓝色主题"}</span>
        </button>

        <div className="h-5 w-px bg-border" />

        {/* Clock */}
        <div className="text-right">
          <div className="text-[10px] text-on-surface-variant">{currentDate}</div>
          <div className="text-xs text-primary font-mono font-medium tabular-nums">{currentTime}</div>
        </div>

        {isAuthenticated && user ? (
          <>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
                {(user.doctorInfo?.name || user.patientInfo?.name || user.loginName || "U").charAt(0)}
              </div>
              <div>
                <div className="text-xs text-on-surface font-medium">{user.doctorInfo?.name || user.patientInfo?.name || user.loginName}</div>
                <div className="text-[10px] text-on-surface-variant">{ROLE_NAMES[user.userType] || ROLE_NAMES[user.role] || "访客"}{user.department ? ` · ${user.department.name}` : user.doctorInfo?.dept ? ` · ${user.doctorInfo.dept}` : ""}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="motion-press p-2 text-on-surface-variant hover:text-destructive hover:bg-destructive/10 rounded-xl"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="motion-press px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:opacity-90 shadow-sm"
          >
            登录
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
