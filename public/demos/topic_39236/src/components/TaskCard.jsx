import { Clock, MapPin, AlertTriangle, Package, FileText, ChevronDown, ChevronUp, Car, Train, Bike, Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { useState } from 'react';

export default function TaskCard({ task, animateIn = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getWeatherIcon = (weather) => {
    switch (weather) {
      case '晴': return <Sun size={16} className="text-yellow-400" />;
      case '多云': return <Cloud size={16} className="text-gray-300" />;
      case '小雨': return <CloudRain size={16} className="text-blue-400" />;
      default: return <Sun size={16} className="text-yellow-400" />;
    }
  };

  const getTransitIcon = (transit) => {
    if (transit?.includes('地铁')) return <Train size={16} className="text-primary" />;
    if (transit?.includes('驾车') || transit?.includes('车')) return <Car size={16} className="text-green-400" />;
    if (transit?.includes('骑行')) return <Bike size={16} className="text-yellow-400" />;
    return <Train size={16} className="text-primary" />;
  };

  const getTrafficColor = (traffic) => {
    switch (traffic) {
      case '畅通': return 'text-green-400 bg-green-500/20';
      case '轻微拥堵': return 'text-yellow-400 bg-yellow-500/20';
      case '拥堵': return 'text-danger bg-danger/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // 检查是否有子卡片需要显示
  const hasSubCards = 
    (task.subCards?.items?.visible && task.subCards.items.list?.length > 0) ||
    (task.subCards?.travel?.visible) ||
    (task.subCards?.notes?.visible && task.subCards.notes.content?.length > 0);

  return (
    <div 
      className={`p-4 bg-card rounded-card border border-card-border transition-all duration-500 ${
        animateIn ? 'animate-slide-up' : ''
      }`}
    >
      {/* 主卡片 - 只显示需要干什么 */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-lg leading-tight">{task.title}</h3>
          
          {/* 时间和地点 - 只在有值时显示 */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {task.time && (
              <span className="flex items-center gap-1 text-sm text-gray-400 whitespace-nowrap">
                <Clock size={14} />
                {task.time}
              </span>
            )}
            {task.location && (
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <MapPin size={14} />
                <span className="truncate">{task.location}</span>
              </span>
            )}
          </div>
          
          {/* 简要信息标签 - 只显示有内容的 */}
          {hasSubCards && (
            <div className="flex flex-wrap gap-2 mt-3">
              {task.subCards?.items?.visible && task.subCards.items.list?.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                  <Package size={12} />
                  {task.subCards.items.list.length}件物品
                </span>
              )}
              {task.subCards?.travel?.visible && task.subCards.travel.duration && (
                <span className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                  {getTransitIcon(task.subCards.travel.transit)}
                  {task.subCards.travel.duration}
                </span>
              )}
              {task.subCards?.notes?.visible && task.subCards.notes.content?.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  <FileText size={12} />
                  {task.subCards.notes.content.length}条备注
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* 展开按钮 - 只有有子卡片时显示 */}
        {hasSubCards && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 hover:bg-bg-primary rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
        )}
      </div>

      {/* 展开后的详细信息 */}
      {hasSubCards && (
        <div className={`mt-4 space-y-3 overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {/* 出行信息 */}
          {task.subCards?.travel?.visible && (
            <div className="p-3 bg-bg-primary rounded-lg animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                {getTransitIcon(task.subCards.travel.transit)}
                <span className="text-sm text-white font-medium">出行信息</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {task.subCards.travel.duration && (
                  <div className="text-center">
                    <div className="text-white font-bold">{task.subCards.travel.duration}</div>
                    <div className="text-xs text-gray-500">时长</div>
                  </div>
                )}
                {task.subCards.travel.distance && (
                  <div className="text-center">
                    <div className="text-white font-bold">{task.subCards.travel.distance}</div>
                    <div className="text-xs text-gray-500">距离</div>
                  </div>
                )}
                {(task.subCards.travel.weather || task.subCards.travel.temperature) && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {task.subCards.travel.weather && getWeatherIcon(task.subCards.travel.weather)}
                      {task.subCards.travel.temperature && <span className="text-white font-bold">{task.subCards.travel.temperature}</span>}
                    </div>
                    <div className="text-xs text-gray-500">{task.subCards.travel.weather}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-card-border">
                {task.subCards.travel.transit && <span className="text-sm text-gray-400">{task.subCards.travel.transit}</span>}
                {task.subCards.travel.traffic && (
                  <span className={`px-2 py-1 rounded-full text-xs ${getTrafficColor(task.subCards.travel.traffic)}`}>
                    {task.subCards.travel.traffic}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 携带物品 */}
          {task.subCards?.items?.visible && task.subCards.items.list?.length > 0 && (
            <div className="p-3 bg-bg-primary rounded-lg animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-purple-400" />
                <span className="text-sm text-white font-medium">携带物品</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.subCards.items.list.map((item, index) => (
                  <div key={index} className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-sm text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 备注信息 */}
          {task.subCards?.notes?.visible && task.subCards.notes.content?.length > 0 && (
            <div className="p-3 bg-bg-primary rounded-lg animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-blue-400" />
                <span className="text-sm text-white font-medium">备注信息</span>
              </div>
              <ul className="space-y-2">
                {task.subCards.notes.content.map((note, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
