import { Clock, MapPin, Sparkles } from 'lucide-react';
import type { TimelineItem as TimelineItemType } from '../data/mockData';

interface TimelineProps {
  items: TimelineItemType[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-8">
      {items.map((dayItem, dayIdx) => {
        const aiCount = dayItem.activities.filter((a) => a.aiAdded).length;
        return (
          <div key={dayItem.date} className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200">
                {dayIdx + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-800">{dayItem.day}</h3>
                  {aiCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-semibold">
                      <Sparkles size={10} />
                      AI 新增 {aiCount} 项
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{dayItem.date}</p>
              </div>
            </div>

            <div className="ml-6 border-l-2 border-dashed border-orange-200 pl-6 space-y-4">
              {dayItem.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="relative group"
                >
                  <div className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 transition-colors ${
                    activity.aiAdded
                      ? 'bg-orange-400 border-orange-400'
                      : 'bg-white border-orange-400 group-hover:bg-orange-400'
                  }`} />

                  <div className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border ${
                    activity.aiAdded ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'
                  }`}>
                    <div className="flex items-start gap-4">
                      {activity.image && (
                        <img
                          src={activity.image}
                          alt={activity.title}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={14} className="text-orange-500" />
                          <span className="text-sm font-medium text-orange-500">{activity.time}</span>
                          {activity.aiAdded && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-medium">
                              <Sparkles size={8} />
                              AI 新增
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-800 mb-1">{activity.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <MapPin size={12} />
                          <span>{activity.location}</span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
