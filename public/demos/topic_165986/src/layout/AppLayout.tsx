import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { FileText, MessageCircle, BarChart3, Library, Sun, Moon } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { getAIStatus } from "@/services/api";

export function AppLayout() {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useAppStore();
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    getAIStatus().then(res => {
      if (res.success) setAiEnabled(res.enabled);
    });
  }, []);

  const navGroups = [
    {
      title: "工作区",
      items: [
        { path: "/write", label: "写作", icon: FileText },
        { path: "/chat", label: "跟 AI 聊聊", icon: MessageCircle },
      ],
    },
    {
      title: "智能整理",
      items: [
        { path: "/dashboard", label: "AI 看板", icon: BarChart3 },
        { path: "/memory", label: "记忆库", icon: Library },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`flex min-h-screen ${darkMode ? "dark" : ""}`}>
      <aside className="w-56 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">写点啥</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map(group => (
            <div key={group.title}>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive(item.path)
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${aiEnabled ? "bg-emerald-500" : "bg-gray-400"}`} />
            <span className="text-gray-500 dark:text-gray-400">
              {aiEnabled ? "AI 已连接" : "AI 未连接"}
            </span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
          >
            {darkMode ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
            {darkMode ? "日间" : "深夜"}
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-100 dark:bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
