import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, MapPin, User, Heart, Bell, Shield, 
  Building2, ChevronLeft, ToggleLeft, ToggleRight, ArrowRight,
  Sun, Moon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/cn';
import { defaultUserSettings, CITIES, IDENTITY_OPTIONS, AGE_OPTIONS } from '../data/mockData';
import type { UserSettings, IdentityType, AgeGroup } from '../types';
import Card from '../components/Card';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const menuItems = [
    { icon: MapPin, label: '我的城市', value: settings.city, field: 'city' },
    { icon: User, label: '我的身份', value: settings.identity, field: 'identity' },
    { icon: Heart, label: '我的年龄段', value: settings.ageGroup, field: 'ageGroup' },
    { icon: Heart, label: '健康标签', value: settings.healthTags.length > 0 ? settings.healthTags.join('、') : '无', field: 'healthTags' },
  ];
  
  const actionItems = [
    { icon: Bell, label: '提醒设置', onClick: () => alert('提醒设置：\n\n• 每日风险推送\n• 极端天气预警\n• 家人安全提醒\n• 休息提醒（户外工作者）\n\n(实际应用将接入系统通知)') },
    { icon: Shield, label: '隐私说明', onClick: () => alert('隐私说明：\n\n• 所有个人信息本地存储\n• 位置信息仅用于附近安全点查询\n• 健康信息不上传云端\n• 可随时删除所有数据\n• 家属关注需双方授权') },
    { icon: Building2, label: '天气服务来源', value: 'Mock数据', onClick: () => alert('天气服务来源：\n\n当前使用Mock数据。\n\n可接入：\n• 和风天气 API\n• Open-Meteo\n• 高德天气\n• 心知天气') },
  ];

  // 通用选择器页面头部
  const renderSelectorHeader = (title: string) => (
    <>
      <button
        onClick={() => setEditingField(null)}
        className="flex items-center gap-1 text-ink-muted mb-5 active:opacity-60"
      >
        <ChevronLeft className="w-5 h-5" />
        返回
      </button>
      <h1 className="text-xl font-bold mb-5 flex items-center gap-2">
        <span className="w-1 h-5 bg-warm rounded-full" />
        {title}
      </h1>
    </>
  );
  
  if (editingField === 'city') {
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        {renderSelectorHeader('选择城市')}
        <div className="space-y-3">
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => { updateSetting('city', city); setEditingField(null); }}
              className={cn(
                'w-full py-4 px-5 rounded-2xl text-left border transition-all active:scale-[0.98]',
                settings.city === city
                  ? 'bg-warm/15 border-warm/30 text-warm'
                  : 'bg-card-bg border-rule/40 text-ink-muted'
              )}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  if (editingField === 'identity') {
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        {renderSelectorHeader('选择身份')}
        <div className="flex flex-wrap gap-3">
          {IDENTITY_OPTIONS.map(idt => (
            <button
              key={idt}
              onClick={() => { updateSetting('identity', idt as IdentityType); setEditingField(null); }}
              className={cn(
                'px-5 py-3.5 rounded-2xl text-sm border transition-all active:scale-[0.98]',
                settings.identity === idt
                  ? 'bg-warm/15 border-warm/30 text-warm'
                  : 'bg-card-bg border-rule/40 text-ink-muted'
              )}
            >
              {idt}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  if (editingField === 'ageGroup') {
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        {renderSelectorHeader('选择年龄段')}
        <div className="flex flex-wrap gap-3">
          {AGE_OPTIONS.map(age => (
            <button
              key={age}
              onClick={() => { updateSetting('ageGroup', age as AgeGroup); setEditingField(null); }}
              className={cn(
                'px-5 py-3.5 rounded-2xl text-sm border transition-all active:scale-[0.98]',
                settings.ageGroup === age
                  ? 'bg-warm/15 border-warm/30 text-warm'
                  : 'bg-card-bg border-rule/40 text-ink-muted'
              )}
            >
              {age}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">我的</h1>
      
      <div className="space-y-4">
        {/* 用户信息 */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-warm to-warm-dark flex items-center justify-center text-xl font-bold shadow-glow">
              我
            </div>
            <div>
              <div className="font-bold text-base">{settings.identity}</div>
              <div className="text-sm text-ink-muted mt-0.5">{settings.city} · {settings.ageGroup}</div>
            </div>
          </div>
        </Card>
        
        {/* 基础设置 */}
        <div>
          <h3 className="font-bold text-base flex items-center gap-2 mb-3 px-1">
            <span className="w-1 h-5 bg-warm rounded-full" />
            基础信息
          </h3>
          <Card noPadding>
            {menuItems.map((item, i) => (
              <button
                key={item.field}
                onClick={() => setEditingField(item.field)}
                className={cn(
                  'w-full flex items-center justify-between p-[18px] text-left active:bg-white/5 transition-colors',
                  i !== menuItems.length - 1 && 'border-b border-rule/40'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-card-bg-light flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-warm" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-ink-muted">
                  <span>{item.value}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </Card>
        </div>
        
        {/* 功能开关 */}
        <div>
          <h3 className="font-bold text-base flex items-center gap-2 mb-3 px-1">
            <span className="w-1 h-5 bg-warm rounded-full" />
            功能开关
          </h3>
          <Card noPadding>
            {/* 主题切换 */}
            <div className="flex items-center justify-between p-[18px] border-b border-rule/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-card-bg-light flex items-center justify-center">
                  {theme === 'light' ? 
                    <Sun className="w-5 h-5 text-warm" /> : 
                    <Moon className="w-5 h-5 text-warm" />
                  }
                </div>
                <div>
                  <span className="text-sm">外观主题</span>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {theme === 'light' ? '浅色模式' : '深色模式'}
                  </div>
                </div>
              </div>
              <button onClick={toggleTheme}>
                <ToggleRight 
                  className={cn(
                    "w-7 h-7 transition-colors",
                    theme === 'light' ? "text-warm" : "text-ink-muted"
                  )} 
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-[18px] border-b border-rule/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-card-bg-light flex items-center justify-center">
                  <Bell className="w-5 h-5 text-warm" />
                </div>
                <span className="text-sm">接收提醒通知</span>
              </div>
              <button onClick={() => updateSetting('notifications', !settings.notifications)}>
                {settings.notifications ? 
                  <ToggleRight className="w-7 h-7 text-warm" /> : 
                  <ToggleLeft className="w-7 h-7 text-ink-muted" />
                }
              </button>
            </div>
            <div className="flex items-center justify-between p-[18px] border-b border-rule/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-card-bg-light flex items-center justify-center">
                  <Heart className="w-5 h-5 text-warm" />
                </div>
                <span className="text-sm">家属提醒授权</span>
              </div>
              <button onClick={() => updateSetting('familyAuth', !settings.familyAuth)}>
                {settings.familyAuth ? 
                  <ToggleRight className="w-7 h-7 text-warm" /> : 
                  <ToggleLeft className="w-7 h-7 text-ink-muted" />
                }
              </button>
            </div>
            {/* 站点负责人模式 — 更醒目入口 */}
            <button 
              onClick={() => navigate('/station')}
              className="w-full flex items-center justify-between p-[18px] text-left active:bg-warm/10 transition-colors bg-warm/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-warm/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-warm" />
                </div>
                <div>
                  <div className="text-sm font-bold text-warm">站点负责人模式</div>
                  <div className="text-xs text-ink-muted mt-0.5">管理班组、排班与安全提醒</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-warm" />
            </button>
          </Card>
        </div>
        
        {/* 其他选项 */}
        <div>
          <h3 className="font-bold text-base flex items-center gap-2 mb-3 px-1">
            <span className="w-1 h-5 bg-warm rounded-full" />
            其他
          </h3>
          <Card noPadding>
            {actionItems.map((item, i) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center justify-between p-[18px] text-left active:bg-white/5 transition-colors',
                  i !== actionItems.length - 1 && 'border-b border-rule/40'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-card-bg-light flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-warm" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-ink-muted">
                  {'value' in item && <span>{item.value}</span>}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </Card>
        </div>
      </div>
      
      {/* 版本信息 — 更柔和 */}
      <div className="text-center text-xs text-ink-faint py-8">
        <div>四季安 ClimateGuard v1.0.0</div>
        <div className="mt-1">本应用仅作风险提示，不替代专业医疗诊断</div>
      </div>
    </div>
  );
}
