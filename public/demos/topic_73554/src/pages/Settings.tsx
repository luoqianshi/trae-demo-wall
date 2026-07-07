import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Download, Upload, BarChart3, Check } from 'lucide-react';
import { useFoodStore, type ThemeMode } from '@/store/useFoodStore';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

interface OptionProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function Option({ label, active, onClick, icon }: OptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-between w-full p-4 rounded-xl transition-all',
        active
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          active ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-600'
        )}>
          {icon}
        </div>
        <span className={cn(
          'font-medium',
          active ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
        )}>
          {label}
        </span>
      </div>
      {active && (
        <div className="p-1.5 rounded-full bg-green-500 dark:bg-green-600">
          <Check size={14} className="text-white" />
        </div>
      )}
    </button>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  color: string;
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
      <div className={cn('text-2xl font-bold', color)}>{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme, exportBackup, importBackup, getAllDataStats } = useFoodStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const stats = getAllDataStats();

  const handleExport = () => {
    const backupData = exportBackup();
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const success = importBackup(result);
      if (success) {
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 2000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 2000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: '浅色模式', icon: <Sun size={18} className="text-amber-500" /> },
    { value: 'dark', label: '深色模式', icon: <Moon size={18} className="text-blue-500" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-xl mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">设置</h1>
        </header>

        <main className="space-y-4">
          <Section title="外观" icon={<Sun size={18} className="text-amber-500" />}>
            <div className="space-y-2">
              {themes.map((t) => (
                <Option
                  key={t.value}
                  label={t.label}
                  active={theme === t.value}
                  onClick={() => setTheme(t.value)}
                  icon={t.icon}
                />
              ))}
            </div>
          </Section>

          <Section title="备份" icon={<Download size={18} className="text-blue-500" />}>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Download size={18} />
                导出备份
              </button>
              <div className="relative">
                <button
                  onClick={handleImportClick}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors',
                    importStatus === 'success'
                      ? 'bg-green-50 text-green-600'
                      : importStatus === 'error'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                  )}
                >
                  <Upload size={18} />
                  {importStatus === 'success' ? '导入成功' : importStatus === 'error' ? '导入失败' : '导入备份'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                支持导入 .json 格式的备份文件
              </p>
            </div>
          </Section>

          <Section title="数据概览" icon={<BarChart3 size={18} className="text-purple-500" />}>
            <div className="grid grid-cols-3 gap-3">
              <StatItem label="总数" value={stats.total} color="text-gray-700 dark:text-gray-300" />
              <StatItem label="未过期" value={stats.notExpired} color="text-green-600 dark:text-green-400" />
              <StatItem label="临期" value={stats.warning} color="text-orange-500" />
              <StatItem label="已过期" value={stats.expired} color="text-red-500" />
              <StatItem label="已使用" value={stats.used} color="text-blue-500" />
              <StatItem label="已浪费" value={stats.wasted} color="text-rose-500" />
            </div>
          </Section>
        </main>

        <footer className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            食品保质期管理 v1.0
          </p>
        </footer>
      </div>
    </div>
  );
}
