import { MapPin, Calendar, Users } from 'lucide-react';
import { HistoricalEvent } from '@/data/historicalEvents';
import { categories } from '@/data/historicalEvents';
import useTimelineStore from '@/store/timelineStore';

interface EventCardProps {
  event: HistoricalEvent;
  index: number;
}

const EventCard = ({ event, index }: EventCardProps) => {
  const setSelectedEvent = useTimelineStore((state) => state.setSelectedEvent);
  const category = categories.find((c) => c.id === event.category);

  const formatDate = () => {
    const yearStr = event.year < 0 ? `公元前${Math.abs(event.year)}年` : `${event.year}年`;
    if (event.month && event.day) {
      return `${yearStr}${event.month}月${event.day}日`;
    } else if (event.month) {
      return `${yearStr}${event.month}月`;
    }
    return yearStr;
  };

  const formatTimeRange = () => {
    const formatYear = (y: number | '至今') => {
      if (y === '至今') return '至今';
      return y < 0 ? `前${Math.abs(y)}` : y;
    };
    if (event.startYear === event.endYear) {
      return `${formatYear(event.startYear)}年`;
    }
    return `${formatYear(event.startYear)}-${formatYear(event.endYear)}`;
  };

  return (
    <div
      onClick={() => setSelectedEvent(event)}
      className="event-card bg-gray-800/50 border border-gray-700 rounded-xl p-5 cursor-pointer hover:border-history-gold/50 hover:shadow-lg hover:shadow-history-gold/10 group"
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: category?.color }}
        >
          {category?.name}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formatDate()}</span>
          </div>
          <div className="text-xs text-history-gold mt-1">
            持续时间：{formatTimeRange()}
          </div>
        </div>
      </div>

      <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-history-gold transition-colors">
        {event.title}
      </h3>

      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {event.description}
      </p>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>{event.region}</span>
        </div>
        
        {event.keyFigures.length > 0 && (
          <div className="flex items-center gap-1 text-gray-400">
            <Users className="w-4 h-4" />
            <span className="truncate max-w-[120px]">
              {event.keyFigures.slice(0, 2).join('、')}
              {event.keyFigures.length > 2 && '...'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 line-clamp-1">
          <span className="text-history-gold">影响：</span>
          {event.impact}
        </p>
      </div>
    </div>
  );
};

export default EventCard;