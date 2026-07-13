import { User as UserIcon, Settings, Bell, BookOpen, Award, ChevronRight, Calendar, Heart, HelpCircle, LogOut, Sparkles, MessageSquare, Search, Palette, Moon, Sun, Monitor, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useTheme, ACCENT_PALETTES, AccentColor } from '../hooks/useTheme';

const themeOptions = [
  { mode: 'light' as const, label: '浅色', icon: Sun, desc: '明亮清爽' },
  { mode: 'dark' as const, label: '深色', icon: Moon, desc: '护眼舒适' },
  { mode: 'system' as const, label: '跟随系统', icon: Monitor, desc: '系统决定' },
  { mode: 'time' as const, label: '跟随时间', icon: Clock, desc: '7-19点浅色' },
];

const accentList: AccentColor[] = ['indigo', 'emerald', 'rose', 'amber', 'sky'];

export const Profile = () => {
  const navigate = useNavigate();
  const { mode, accent, setLight, setDark, setSystem, setTime, setAccent } = useTheme();
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setShowThemeSheet(false);
      }
    };
    if (showThemeSheet) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeSheet]);

  const stats = [
    { icon: BookOpen, label: '已上课程', value: '24', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400' },
    { icon: Award, label: '获得徽章', value: '8', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-400' },
    { icon: Calendar, label: '学习天数', value: '42', color: 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-400' },
  ];

  const menuSections = [
    {
      title: '常用功能',
      items: [
        { icon: Search, label: '搜索', desc: '搜索课堂/课程/老师', color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/50 dark:text-sky-400', action: () => alert('搜索功能开发中') },
        { icon: Bell, label: '通知中心', desc: '3条未读', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400', badge: '3', action: () => alert('通知中心开发中') },
        { icon: MessageSquare, label: '消息', desc: '与老师聊天', color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/50 dark:text-pink-400', badge: '2', action: () => alert('消息功能开发中') },
      ],
    },
    {
      title: '我的内容',
      items: [
        { icon: BookOpen, label: '我的课程', desc: '查看已报名课程', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-400', action: () => navigate('/records') },
        { icon: Heart, label: '我的收藏', desc: '收藏的课程和资源', color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-400', action: () => alert('收藏功能开发中') },
        { icon: Sparkles, label: 'AI助手设置', desc: '选择AI模型/历史记录', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400', action: () => alert('AI设置开发中') },
      ],
    },
    {
      title: '偏好设置',
      items: [
        { icon: Palette, label: '主题外观', desc: '切换主题色和模式', color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/50 dark:text-cyan-400', action: () => setShowThemeSheet(true) },
        { icon: Settings, label: '账号设置', desc: '个人信息/密码', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400', action: () => alert('账号设置开发中') },
        { icon: HelpCircle, label: '帮助与反馈', desc: '常见问题/意见反馈', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400', action: () => alert('帮助中心开发中') },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 relative">
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4 pt-12 pb-16">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <UserIcon className="w-10 h-10 text-indigo-600" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-white">
            <h2 className="text-xl font-bold">王老师</h2>
            <p className="text-sm text-white/80 mt-1">ID: 13800138001</p>
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              <span className="text-white/90">在线 · 家长身份</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {menuSections.map((section) => (
          <div key={section.title} className="mb-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      index !== section.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    {(item as any).badge && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {(item as any).badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">远程辅导软件 v1.0.0</p>
      </div>

      {showThemeSheet && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowThemeSheet(false)}>
          <div
            ref={sheetRef}
            className="w-full bg-white dark:bg-gray-800 rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">主题外观</h3>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">主题模式</p>
              <div className="space-y-2">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = mode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      onClick={() => {
                        if (opt.mode === 'light') setLight();
                        if (opt.mode === 'dark') setDark();
                        if (opt.mode === 'system') setSystem();
                        if (opt.mode === 'time') setTime();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800'
                          : 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`} />
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-800 dark:text-white'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                      </div>
                      {isActive && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">主题色</p>
              <div className="grid grid-cols-5 gap-3">
                {accentList.map((acc) => {
                  const palette = ACCENT_PALETTES[acc];
                  const isActive = acc === accent;
                  return (
                    <button
                      key={acc}
                      onClick={() => setAccent(acc)}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${palette.gradient} shadow-md ${
                          isActive ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : ''
                        } transition-all`}
                      ></div>
                      <span className={`text-xs ${isActive ? 'text-indigo-600 dark:text-indigo-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                        {palette.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowThemeSheet(false)}
              className="w-full mt-5 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};