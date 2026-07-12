import { X, Calendar, MapPin, Users, Zap, Link2, BookOpen, Flame, Target } from 'lucide-react';
import useTimelineStore from '@/store/timelineStore';
import { categories } from '@/data/historicalEvents';

const DetailModal = () => {
  const { selectedEvent, setSelectedEvent, events } = useTimelineStore();
  
  if (!selectedEvent) return null;

  const category = categories.find((c) => c.id === selectedEvent.category);
  
  const relatedEvents = selectedEvent.relatedEvents
    .map((id) => events.find((e) => e.id === id))
    .filter((e): e is typeof e => e !== undefined);

  const formatDate = () => {
    const yearStr = selectedEvent.year < 0 ? `公元前${Math.abs(selectedEvent.year)}年` : `${selectedEvent.year}年`;
    if (selectedEvent.month && selectedEvent.day) {
      return `${yearStr}${selectedEvent.month}月${selectedEvent.day}日`;
    } else if (selectedEvent.month) {
      return `${yearStr}${selectedEvent.month}月`;
    }
    return yearStr;
  };

  const formatTimeRange = () => {
    const formatYear = (y: number | '至今') => {
      if (y === '至今') return '至今';
      return y < 0 ? `前${Math.abs(y)}` : y;
    };
    if (selectedEvent.startYear === selectedEvent.endYear) {
      return `${formatYear(selectedEvent.startYear)}年`;
    }
    return `${formatYear(selectedEvent.startYear)}-${formatYear(selectedEvent.endYear)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={() => setSelectedEvent(null)}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setSelectedEvent(null)}
          className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className="px-4 py-2 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: category?.color }}
            >
              {category?.name}
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-5 h-5" />
              <span className="font-serif text-lg">{formatDate()}</span>
            </div>
          </div>

          <h2 className="font-serif text-3xl font-bold text-white mb-4">
            {selectedEvent.title}
          </h2>

          <div className="flex items-center gap-6 mb-6 flex-wrap">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-5 h-5 text-history-gold" />
              <span>{selectedEvent.region}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-5 h-5 text-history-cyan" />
              <span className="text-history-gold">持续时间：{formatTimeRange()}</span>
            </div>
            
            {selectedEvent.keyFigures.length > 0 && (
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-5 h-5 text-history-blue" />
                <span>{selectedEvent.keyFigures.join('、')}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-history-gold" />
                事件概述
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-history-green" />
                  历史影响
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedEvent.impact}
                </p>
              </div>

              {selectedEvent.background && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-history-blue" />
                    历史背景
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedEvent.background}
                  </p>
                </div>
              )}

              {selectedEvent.cause && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-history-orange" />
                    导火索/起因
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedEvent.cause}
                  </p>
                </div>
              )}

              {selectedEvent.significance && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-history-purple" />
                    历史意义
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedEvent.significance}
                  </p>
                </div>
              )}

              {selectedEvent.keyFigures.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-history-purple" />
                  关键人物
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.keyFigures.map((figure, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-gray-300"
                    >
                      {figure}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {relatedEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-history-cyan" />
                  相关事件
                </h3>
                <div className="space-y-2">
                  {relatedEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-history-gold/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{event.title}</span>
                        <span className="text-gray-400 text-sm">
                          {event.year < 0 ? `公元前${Math.abs(event.year)}年` : `${event.year}年`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;