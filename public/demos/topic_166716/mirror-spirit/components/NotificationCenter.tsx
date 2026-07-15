import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Sparkles, AlertCircle, Trophy, Sun, Moon, Calendar } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, PushNotification } from "../lib/api";

const typeConfig: Record<string, { icon: typeof Sun; color: string; bg: string; label: string }> = {
  morning_greeting: { icon: Sun, color: "text-amber-500", bg: "bg-amber-50", label: "晨间问候" },
  evening_summary: { icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50", label: "晚间总结" },
  crisis_alert: { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50", label: "关怀提醒" },
  milestone: { icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", label: "里程碑" },
  daily_summary: { icon: Calendar, color: "text-primary-600", bg: "bg-primary-50", label: "每日总结" },
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications(false, 30);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      if (minutes < 1) return "刚刚";
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 ${unreadCount > 0 ? "animate-ring-pulse" : ""}`}
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? "text-primary-600" : "text-gray-500"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-primary-600 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-3 w-80 sm:w-96 glass-card rounded-3xl overflow-hidden z-50 animate-scale-in origin-top-right shadow-mirror"
          style={{ maxHeight: "70vh" }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-600" />
              </div>
              <span className="font-semibold text-gray-900">消息中心</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full border border-primary-100">
                  {unreadCount} 条新消息
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-primary-600 bg-white hover:bg-primary-50 border border-gray-200 hover:border-primary-200 rounded-lg transition-all duration-300"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  全部已读
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 60px)" }}>
            {loading ? (
              <div className="p-3 space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-4">
                    <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-24 rounded" />
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-full rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100">
                  <Sparkles className="w-8 h-8 text-primary-400" />
                </div>
                <p className="text-gray-700 text-sm font-medium">暂无消息</p>
                <p className="text-gray-400 text-xs mt-1">镜灵会在合适的时间陪伴你</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif, index) => {
                  const config = typeConfig[notif.type] || {
                    icon: Sparkles,
                    color: "text-primary-600",
                    bg: "bg-primary-50",
                    label: "通知",
                  };
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`card-enter p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        notif.is_read ? "opacity-60" : ""
                      }`}
                      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                      onClick={() => {
                        if (!notif.is_read) handleMarkRead(notif.id);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center ${config.color} border border-gray-100`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{config.label}</span>
                              {notif.priority === "high" && (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-500 text-xs rounded border border-rose-100">
                                  重要
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatTime(notif.created_at)}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mt-0.5">{notif.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.content}</p>
                          {notif.insight && (
                            <div className="mt-2 px-3 py-2 bg-primary-50 rounded-lg border border-primary-100">
                              <p className="text-xs text-primary-600 italic">
                                「 {notif.insight} 」
                              </p>
                            </div>
                          )}
                        </div>
                        {!notif.is_read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-500 flex-shrink-0 mt-2 animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
