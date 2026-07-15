import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { MessageSquare, Archive, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout() {
  const navigate = useNavigate();

  const navItems = [
    { path: "/", label: "项目部", icon: MessageSquare },
    { path: "/archive", label: "档案", icon: Archive },
    { path: "/settings", label: "设置", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50">
      <aside className="w-56 shrink-0 border-r border-zinc-800/80 bg-zinc-950 flex flex-col">
        <div
          className="px-5 py-6 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <span className="font-serif text-lg font-bold tracking-wide">
              项目部
            </span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
            把想法交办给团队，交付可落地方案
          </p>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-zinc-800 text-amber-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-zinc-800/80">
          <p className="text-xs text-zinc-600">
            TRAE AI 创造力大赛参赛作品
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
