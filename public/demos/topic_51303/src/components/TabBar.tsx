import { useLocation, useNavigate } from "react-router-dom";
import { Bot, FolderOpen, Home, User } from "lucide-react";

interface TabItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const tabs: TabItem[] = [
  { path: "/home", label: "首页", icon: Home },
  { path: "/ai", label: "AI助手", icon: Bot },
  { path: "/archive", label: "档案", icon: FolderOpen },
  { path: "/profile", label: "我的", icon: User },
];

/** 底部 Tab 栏，固定 4 个 */
export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = tabs.find((t) => location.pathname.startsWith(t.path))?.path ?? "/home";

  return (
    <>
      <nav
        className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[420px] -translate-x-1/2 items-center justify-around"
        style={{
          height: 50,
          background: "var(--color-bg-elevated)",
          borderTop: "1px solid var(--color-rule)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center"
              style={{ flex: 1, height: 50, minWidth: 44 }}
              aria-label={tab.label}
            >
              <Icon
                size={22}
                style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                  marginTop: 2,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
