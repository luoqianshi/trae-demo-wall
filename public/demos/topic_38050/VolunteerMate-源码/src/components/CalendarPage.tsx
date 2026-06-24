import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, Calendar as CalendarIcon } from 'lucide-react';
import { events } from '../data/events';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const eventDates = useMemo(() => {
    return new Set(events.map(e => e.date));
  }, []);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => e.date === selectedDate);
  }, [selectedDate]);

  const upcomingEvents = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0];
    return events
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, []);

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const formatDateStr = (day: number) => {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${currentDate.getFullYear()}-${month}-${dayStr}`;
  };

  const isToday = (day: number) => {
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear() &&
      day === today.getDate()
    );
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <CalendarIcon className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-white text-2xl font-bold">活动日历</h1>
            <p className="text-amber-100 text-sm">发现身边的公益活动</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-6">
        {/* Calendar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-amber-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-800">
              {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
            </h3>
            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center hover:bg-amber-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-amber-600" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="aspect-square" />;
              }

              const dateStr = formatDateStr(day);
              const hasEvent = eventDates.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const todayClass = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${
                    isSelected
                      ? 'bg-amber-500 text-white'
                      : todayClass
                      ? 'bg-emerald-100 text-emerald-700 font-bold'
                      : 'hover:bg-amber-50'
                  }`}
                >
                  <span className={`text-sm ${isSelected || todayClass ? 'font-bold' : ''}`}>
                    {day}
                  </span>
                  {hasEvent && !isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                  )}
                  {hasEvent && isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        {selectedDate && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">
              {new Date(selectedDate).toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </h3>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="bg-amber-50 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{event.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{event.title}</h4>
                        <p className="text-sm text-gray-500 mb-2">{event.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.registered}/{event.participants}人
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <span className="text-4xl mb-2 block">📅</span>
                <p>暂无活动安排</p>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Events */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">即将到来</h3>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    event.category === '环保' ? 'bg-emerald-100' :
                    event.category === '捐赠' ? 'bg-rose-100' :
                    event.category === '帮扶' ? 'bg-violet-100' :
                    'bg-sky-100'
                  }`}>
                    {event.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-800">{event.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.category === '环保' ? 'bg-emerald-100 text-emerald-600' :
                        event.category === '捐赠' ? 'bg-rose-100 text-rose-600' :
                        event.category === '帮扶' ? 'bg-violet-100 text-violet-600' :
                        'bg-sky-100 text-sky-600'
                      }`}>
                        {event.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
