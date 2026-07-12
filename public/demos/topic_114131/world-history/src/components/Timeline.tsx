import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useTimelineStore from '@/store/timelineStore';
import EventCard from './EventCard';

const Timeline = () => {
  const { filteredEvents } = useTimelineStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (timelineRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = timelineRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = timelineRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [filteredEvents]);

  const scroll = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = 200;
      timelineRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const eventsByYear = filteredEvents.reduce((acc, event) => {
    if (!acc[event.year]) {
      acc[event.year] = [];
    }
    acc[event.year].push(event);
    return acc;
  }, {} as Record<number, typeof filteredEvents>);

  const sortedYears = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="relative">
      <button
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 bg-history-dark/90 border border-gray-700 rounded-r-xl text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 bg-history-dark/90 border border-gray-700 rounded-l-xl text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div
        ref={timelineRef}
        className="timeline-container overflow-x-auto scrollbar-hide py-8 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-8 min-w-max">
          <div className="flex flex-col items-center">
            <div className="w-1 h-32 bg-gray-700" />
            <div className="w-3 h-3 rounded-full bg-history-gold animate-pulse" />
            <div className="w-1 h-32 bg-gray-700" />
          </div>

          {sortedYears.map((year) => (
            <div key={year} className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-history-gold/20 to-history-gold/5 border-2 border-history-gold/50 flex items-center justify-center">
                  <span className="font-serif text-lg font-bold text-history-gold text-center leading-tight">
                    {year < 0 ? `前${Math.abs(year)}` : year}
                  </span>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-600" />
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                {eventsByYear[year].map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </div>

              <div className="w-0.5 h-24 bg-gray-600 mt-4" />
            </div>
          ))}

          <div className="flex flex-col items-center">
            <div className="w-1 h-32 bg-gray-700" />
            <div className="w-3 h-3 rounded-full bg-history-gold" />
            <div className="w-1 h-32 bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;