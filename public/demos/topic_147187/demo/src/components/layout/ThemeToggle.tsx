import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Clock, Check, Palette } from 'lucide-react';
import { useTheme, ACCENT_PALETTES, AccentColor } from '../../hooks/useTheme';

const modeOptions = [
  { mode: 'light' as const, label: '浅色', icon: Sun, desc: '明亮清爽' },
  { mode: 'dark' as const, label: '深色', icon: Moon, desc: '护眼舒适' },
  { mode: 'system' as const, label: '跟随系统', icon: Monitor, desc: '系统决定' },
  { mode: 'time' as const, label: '跟随时间', icon: Clock, desc: '7-19点浅色' },
];

const accentList: AccentColor[] = ['indigo', 'emerald', 'rose', 'amber', 'sky'];

export const ThemeToggle = () => {
  const { mode, theme, accent, setAccent, setLight, setDark, setSystem, setTime } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMode = (selected: typeof modeOptions[number]['mode']) => {
    if (selected === 'light') setLight();
    if (selected === 'dark') setDark();
    if (selected === 'system') setSystem();
    if (selected === 'time') setTime();
  };

  const currentModeOption = modeOptions.find((m) => m.mode === mode)!;
  const CurrentIcon = currentModeOption.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={`当前主题: ${currentModeOption.label}`}
      >
        <CurrentIcon className="w-5 h-5" />
        <span className="text-sm hidden lg:inline">{currentModeOption.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 z-50 animate-fadeIn">
          <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            主题模式
          </div>
          <div className="space-y-1">
            {modeOptions.map(({ mode: optionMode, label, icon: Icon, desc }) => {
              const isActive = optionMode === mode;
              return (
                <button
                  key={optionMode}
                  onClick={() => handleSelectMode(optionMode)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 mt-2 text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Palette className="w-3 h-3" />
            主题色
          </div>
          <div className="grid grid-cols-5 gap-2 px-3 pb-2">
            {accentList.map((acc) => {
              const palette = ACCENT_PALETTES[acc];
              const isActive = acc === accent;
              return (
                <button
                  key={acc}
                  onClick={() => setAccent(acc)}
                  className={`relative h-10 rounded-xl flex items-center justify-center text-white text-xs font-semibold transition-all bg-gradient-to-br ${palette.gradient} ${
                    isActive ? 'ring-2 ring-offset-2 ring-indigo-400 dark:ring-offset-gray-800 scale-105' : 'hover:scale-105'
                  }`}
                  title={palette.name}
                >
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400 leading-relaxed">
            💡 "跟随时间"会在晚7点-早7点自动切换深色模式
          </div>
        </div>
      )}
    </div>
  );
};
