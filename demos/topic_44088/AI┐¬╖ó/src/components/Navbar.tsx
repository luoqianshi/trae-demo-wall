import { Link, useLocation } from "react-router-dom";
import { Camera, BookMarked, Home as HomeIcon, PenLine, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: HomeIcon },
  { to: "/organize", label: "拍照整理", icon: Camera },
  { to: "/collection", label: "错题集", icon: BookMarked },
  { to: "/analytics", label: "学情分析", icon: BarChart3 },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-paper-300/50 bg-paper-100/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-ink-700 shadow-ink transition-transform group-hover:-rotate-6">
            <PenLine className="h-5 w-5 text-highlight" strokeWidth={2.2} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-paper-100" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold text-ink-800">错题整理助手</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
              AI Error Book
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-ink-700 text-paper-100 shadow-ink"
                    : "text-ink-500 hover:bg-paper-200/60 hover:text-ink-800"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
