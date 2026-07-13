import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, MapPin, Navigation, Phone, Clock, Users,
  ThermometerSnowflake, ThermometerSun, Store, Train, Pill, Stethoscope
} from 'lucide-react';
import { cn } from '../utils/cn';
import { safePoints } from '../data/mockData';
import type { SafePointType } from '../types';
import Card from '../components/Card';

const typeIcons: Record<SafePointType, React.ReactNode> = {
  '清凉驿站': <ThermometerSnowflake className="w-6 h-6 text-cold-medium" />,
  '暖心驿站': <ThermometerSun className="w-6 h-6 text-heat-medium" />,
  '社区服务中心': <Users className="w-6 h-6 text-safe" />,
  '地铁站': <Train className="w-6 h-6 text-blue-400" />,
  '商场': <Store className="w-6 h-6 text-purple-400" />,
  '便利店': <Store className="w-6 h-6 text-yellow-400" />,
  '药店': <Pill className="w-6 h-6 text-green-400" />,
  '医院': <Stethoscope className="w-6 h-6 text-red-400" />,
  '急救点': <Stethoscope className="w-6 h-6 text-heat-extreme" />,
};

const typeFilters: (SafePointType | '全部')[] = [
  '全部', '清凉驿站', '暖心驿站', '社区服务中心', '地铁站', '商场', '药店', '医院'
];

export default function NearbyPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SafePointType | '全部'>('全部');
  
  const filteredPoints = filter === '全部' 
    ? safePoints 
    : safePoints.filter(p => p.type === filter);
  
  return (
    <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-400 mb-4">
        <ChevronLeft className="w-5 h-5" />
        返回
      </button>
      
      <h1 className="text-2xl font-bold mb-1">附近安全点</h1>
      <p className="text-sm text-ink-muted mb-5">基于当前位置 · 显示 {filteredPoints.length} 个地点</p>
      
      {/* 类型筛选 */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {typeFilters.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'px-4 py-2 rounded-full text-sm border whitespace-nowrap transition-all shrink-0',
              filter === type
                ? 'bg-warm/15 border-warm/30 text-warm'
                : 'bg-card-bg border-rule/40 text-gray-400'
            )}
          >
            {type}
          </button>
        ))}
      </div>
      
      {/* 地点列表 */}
      <div className="space-y-4">
        {filteredPoints.map(point => (
          <Card key={point.id} noPadding>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-card-bg-light flex items-center justify-center">
                    {typeIcons[point.type]}
                  </div>
                  <div>
                    <div className="font-bold text-base">{point.name}</div>
                    <div className="flex items-center gap-2 text-xs text-ink-muted mt-1">
                      <span className="bg-card-bg-light px-2 py-0.5 rounded-md">{point.type}</span>
                      <span>{point.distance}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-ink-muted mb-3 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-500" />
                {point.address}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-ink-muted mb-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {point.openTime}
                </div>
                {point.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    {point.phone}
                  </div>
                )}
              </div>
              
              {/* 服务标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {point.services.map(service => (
                  <span key={service} className="text-xs bg-card-bg-light px-2.5 py-1 rounded-lg text-gray-300">
                    {service}
                  </span>
                ))}
              </div>
              
              {/* 适合人群 */}
              <div className="flex items-center gap-1.5 mb-4">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {point.suitableFor.map((who, idx) => (
                    <span key={who} className="text-xs text-ink-muted">
                      {who}{idx < point.suitableFor.length - 1 && '·'}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 导航按钮 */}
              <button 
                onClick={() => {
                  // 实际接入时调用地图API
                  alert(`导航至: ${point.name}\n地址: ${point.address}\n\n(实际应用将调用高德/百度地图导航)`);
                }}
                className="w-full bg-warm text-app-bg rounded-2xl py-4 flex items-center justify-center gap-2 text-base font-semibold active:scale-[0.98] transition-transform shadow-warm"
              >
                <Navigation className="w-5 h-5" />
                一键导航
              </button>
            </div>
          </Card>
        ))}
      </div>
      
      {filteredPoints.length === 0 && (
        <div className="text-center py-16 text-ink-muted">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>该类型暂无附近安全点</p>
        </div>
      )}
    </div>
  );
}
