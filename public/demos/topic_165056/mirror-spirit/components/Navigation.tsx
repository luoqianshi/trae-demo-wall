import Link from "next/link";
import { useRouter } from "next/router";
import { Home, BookOpen, Map, Sparkles, Moon, Sun, MessageCircle, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import { useDemo } from "../lib/useDemo";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/diary", icon: BookOpen, label: "日记" },
  { href: "/daily", icon: Calendar, label: "日报" },
  { href: "/chat", icon: MessageCircle, label: "对话" },
  { href: "/map", icon: Map, label: "地图" },
];

export default function Navigation() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDemoMode, toggleDemoMode } = useDemo();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => router.pathname === href;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/60"
        : "bg-white/60 backdrop-blur-md"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">
                镜灵
              </span>
              <span className="hidden sm:block text-xs text-gray-400 ml-2">Mirror Spirit</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive(item.href)
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <span className="relative z-10">
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive(item.href) ? "scale-105" : ""}`} />
                  </span>
                  <span className="relative z-10 font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter />

            <button
              onClick={toggleDemoMode}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-medium text-sm ${
                isDemoMode
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600"
              }`}
            >
              <Zap className="w-4 h-4" />
              {isDemoMode ? "Demo模式" : "快速体验"}
            </button>

            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300">
              <Moon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 text-sm">浅色模式</span>
            </button>

            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className={`w-6 h-5 flex flex-col justify-between transition-all duration-300 ${isMobileMenuOpen ? "rotate-90" : ""}`}>
                <span className={`w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`} />
                <span className={`w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1" : ""}`} />
                <span className={`w-full h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive(item.href)
                      ? "bg-primary-50 text-primary-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
