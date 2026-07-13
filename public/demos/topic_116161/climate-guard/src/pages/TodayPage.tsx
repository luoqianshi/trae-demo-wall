import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, ShieldAlert, UserPlus, Navigation, Phone,
  Droplets, Wind, Sun, Clock, ChevronRight, ChevronDown
} from 'lucide-react';
import { cn } from '../utils/cn';
import { CITIES } from '../data/mockData';
import { getCityWeather, calculateRisk } from '../utils/riskEngine';
import type { RiskProfile } from '../types';
import RiskBadge from '../components/RiskBadge';
import Card from '../components/Card';

export default function TodayPage() {
  const navigate = useNavigate();
  const [currentCity, setCurrentCity] = useState('重庆');
  const [showCityPicker, setShowCityPicker] = useState(false);
  
  const cityWeather = useMemo(() => getCityWeather(currentCity), [currentCity]);
  const { current, riskMode, riskLevel, dangerousTimeSlot, aiReminder } = cityWeather;
  
  const defaultProfile: RiskProfile = {
    identity: '普通居民',
    ageGroup: '中年',
    outdoorHours: '1-3小时',
    chronicDisease: '无',
    mainTimeSlot: '下午',
    city: currentCity,
    isAlone: false,
    hasAC: true,
  };
  
  const myRisk = useMemo(() => calculateRisk(current, defaultProfile), [current]);
  const isHighTemp = current.temperature >= 30;
  const isLowTemp = current.temperature <= 5;
  
  const riskGradient = {
    '低': 'from-safe/12 via-safe/5 to-transparent',
    '中': 'from-heat-low/12 via-heat-low/5 to-transparent',
    '高': 'from-heat-high/12 via-heat-high/5 to-transparent',
    '极高': 'from-heat-extreme/15 via-heat-extreme/5 to-transparent',
  }[riskLevel];

  return (
    <div className="min-h-full animate-fade-in">
      {/* 顶部 */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <button 
          onClick={() => setShowCityPicker(!showCityPicker)}
          className="flex items-center gap-1.5 text-lg font-bold"
        >
          <MapPin className="w-5 h-5 text-warm" />
          {currentCity}
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showCityPicker && "rotate-180")} />
        </button>
        <div className="text-xs text-gray-500">
          {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
        </div>
      </div>
      
      {/* 城市选择器 */}
      {showCityPicker && (
        <div className="px-5 pb-3 animate-slide-up">
          <div className="flex flex-wrap gap-2">
            {CITIES.map(city => (
              <button
                key={city}
                onClick={() => { setCurrentCity(city); setShowCityPicker(false); }}
                className={cn(
                  'px-4 py-2 rounded-full text-sm border transition-all',
                  city === currentCity 
                    ? 'bg-warm/15 border-warm/30 text-warm' 
                    : 'bg-card-bg border-rule/50 text-gray-400'
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="px-5 space-y-4 pb-8">
        {/* 主风险卡 */}
        <div className={cn(
          'relative overflow-hidden rounded-4xl p-6 bg-gradient-to-br border',
          riskGradient,
          riskLevel === '极高' ? 'border-heat-extreme/20' : 'border-rule/50'
        )}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/3 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-full translate-y-1/3 -translate-x-1/3" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div>
                <RiskBadge level={riskLevel} mode={riskMode} size="lg" pulse={riskLevel === '极高'} />
                <p className="text-sm text-ink-muted mt-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {dangerousTimeSlot}
                </p>
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold tracking-tighter leading-none">
                  {current.temperature}°
                </div>
                <div className="text-sm text-ink-muted mt-1.5">体感 {current.feelsLike}°</div>
              </div>
            </div>
            
            {/* 天气指标 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="flex flex-col items-center bg-rule/50 rounded-2xl py-3">
                <Droplets className="w-5 h-5 text-cold-medium mb-1.5" />
                <div className="text-lg font-bold">{current.humidity}%</div>
                <div className="text-[10px] text-gray-500">湿度</div>
              </div>
              <div className="flex flex-col items-center bg-rule/50 rounded-2xl py-3">
                <Wind className="w-5 h-5 text-ink-muted mb-1.5" />
                <div className="text-lg font-bold">{current.windSpeed}</div>
                <div className="text-[10px] text-gray-500">风速 km/h</div>
              </div>
              <div className="flex flex-col items-center bg-rule/50 rounded-2xl py-3">
                <Sun className="w-5 h-5 text-heat-low mb-1.5" />
                <div className="text-lg font-bold">{current.uvIndex || '-'}</div>
                <div className="text-[10px] text-gray-500">紫外线</div>
              </div>
            </div>
            
            {/* AI 提醒 */}
            <div className="bg-rule/50 rounded-2xl p-4 flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-warm/15 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4.5 h-4.5 text-warm" />
              </div>
              <p className="text-sm leading-relaxed pt-1">{aiReminder}</p>
            </div>
          </div>
        </div>
        
        {/* 个人建议卡 */}
        <Card>
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            今日建议
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                myRisk.level === '极高' ? 'bg-heat-extreme/15 text-heat-extreme' : 
                myRisk.level === '高' ? 'bg-heat-high/15 text-heat-high' :
                'bg-safe/15 text-safe'
              )}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {myRisk.level === '极高' ? '不建议长时间外出' : 
                   myRisk.level === '高' ? '减少外出，避开危险时段' : '可以正常外出'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {isHighTemp ? '穿透气轻薄衣物，注意防晒' : 
                   isLowTemp ? '穿保暖防寒衣物' : '根据温差适当增减衣物'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cold-medium/10 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5 text-cold-medium" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {isHighTemp ? '每小时至少饮水 500ml' : isLowTemp ? '饮用温热饮品' : '正常补水'}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {isHighTemp ? '可补充含电解质饮品' : isLowTemp ? '避免饮酒取暖' : '保持身体水分'}
                </div>
              </div>
            </div>
            
            {myRisk.level !== '低' && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-warm/15 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-warm" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">建议关注家中老人或孩子</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {myRisk.level === '极高' ? '务必确认安全状况' : '提醒注意防护'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {/* 快捷按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/assessment')}
            className="bg-card-bg rounded-3xl p-5 text-left border border-warm/10 active:scale-[0.97] transition-transform card-shadow"
          >
            <div className="w-11 h-11 rounded-2xl bg-warm/15 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5.5 h-5.5 text-warm" />
            </div>
            <div className="font-bold text-sm">评估我的风险</div>
            <div className="text-xs text-gray-500 mt-1">快速测算今日风险</div>
          </button>
          
          <button 
            onClick={() => navigate('/cared')}
            className="bg-card-bg rounded-3xl p-5 text-left border border-heat-high/10 active:scale-[0.97] transition-transform card-shadow"
          >
            <div className="w-11 h-11 rounded-2xl bg-heat-high/15 flex items-center justify-center mb-3">
              <UserPlus className="w-5.5 h-5.5 text-heat-high" />
            </div>
            <div className="font-bold text-sm">添加关心的人</div>
            <div className="text-xs text-gray-500 mt-1">关注家人冷热风险</div>
          </button>
          
          <button 
            onClick={() => navigate('/nearby')}
            className="bg-card-bg rounded-3xl p-5 text-left border border-safe/10 active:scale-[0.97] transition-transform card-shadow"
          >
            <div className="w-11 h-11 rounded-2xl bg-safe/15 flex items-center justify-center mb-3">
              <Navigation className="w-5.5 h-5.5 text-safe" />
            </div>
            <div className="font-bold text-sm">找附近安全点</div>
            <div className="text-xs text-gray-500 mt-1">清凉 / 暖心驿站</div>
          </button>
          
          <button 
            onClick={() => navigate('/emergency')}
            className="bg-card-bg rounded-3xl p-5 text-left border border-heat-extreme/10 active:scale-[0.97] transition-transform card-shadow"
          >
            <div className="w-11 h-11 rounded-2xl bg-heat-extreme/15 flex items-center justify-center mb-3">
              <Phone className="w-5.5 h-5.5 text-heat-extreme" />
            </div>
            <div className="font-bold text-sm">出现不适怎么办</div>
            <div className="text-xs text-gray-500 mt-1">应急处理指南</div>
          </button>
        </div>
        
        {/* 未来预报 */}
        <Card>
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-cold-medium rounded-full" />
            未来预报
          </h3>
          <div className="space-y-1">
            {cityWeather.forecast.map((day, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">{day.date}</span>
                  <span className="text-xs text-gray-500">{day.condition}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Droplets className="w-3 h-3" />
                    {day.humidity}%
                  </div>
                  <span className="text-sm font-medium">{day.highTemp}° / {day.lowTemp}°</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <div className="text-center text-xs text-gray-600 py-2">
          本应用仅作风险提示，不替代专业医疗诊断
        </div>
      </div>
    </div>
  );
}
