'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimelineEvent {
  date: string;           // ISO date string
  type: 'record' | 'stage_change' | 'achievement' | 'challenge';
  title: string;
  description: string;
  emoji: string;
  metadata?: Record<string, any>;
}

interface GrowthTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

// ─── Event type visual config ────────────────────────────────────────────────

const EVENT_CONFIG: Record<TimelineEvent['type'], {
  icon: string;
  borderColor: string;
  dotColor: string;
  bgColor: string;
  tagBg: string;
  tagText: string;
}> = {
  record: {
    icon: '\u2744\uFE0F',
    borderColor: 'border-l-[#FFB6C1]',
    dotColor: 'bg-[#FFB6C1]',
    bgColor: 'from-[#FFB6C1]/5 to-transparent',
    tagBg: 'bg-[#FFB6C1]/10',
    tagText: 'text-[#E8929E]',
  },
  stage_change: {
    icon: '\uD83C\uDF89',
    borderColor: 'border-l-[#87CEEB]',
    dotColor: 'bg-[#87CEEB]',
    bgColor: 'from-[#87CEEB]/5 to-transparent',
    tagBg: 'bg-[#87CEEB]/10',
    tagText: 'text-[#5BA8D4]',
  },
  achievement: {
    icon: '\uD83C\uDFC6',
    borderColor: 'border-l-[#FFD700]',
    dotColor: 'bg-[#FFD700]',
    bgColor: 'from-[#FFD700]/5 to-transparent',
    tagBg: 'bg-[#FFD700]/10',
    tagText: 'text-[#D4A800]',
  },
  challenge: {
    icon: '🎮',
    borderColor: 'border-l-[#9B8EC4]',
    dotColor: 'bg-[#9B8EC4]',
    bgColor: 'from-[#9B8EC4]/5 to-transparent',
    tagBg: 'bg-[#9B8EC4]/10',
    tagText: 'text-[#7B6FA3]',
  },
};

const TYPE_LABELS: Record<TimelineEvent['type'], string> = {
  record: '记录',
  stage_change: '阶段变化',
  achievement: '成就',
  challenge: '挑战',
};

// ─── Date formatting ─────────────────────────────────────────────────────────

function formatDateHeader(isoDate: string): string {
  const date = new Date(isoDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `\uD83D\uDCC5 ${month}\u6708${day}\u65E5`;
}

function groupEventsByDate(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const dateKey = event.date.split('T')[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(event);
  }
  return groups;
}

// ─── Animation variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

const dateHeaderVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-200" />

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mb-6">
          {/* Date header skeleton */}
          <div className="h-5 w-24 bg-gray-200 rounded-2xl mb-3 animate-pulse" />

          {/* Event card skeleton */}
          <div className="relative pl-6 pb-4">
            {/* Dot skeleton */}
            <div className="absolute left-[-21px] top-2 w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
            <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                <div className="h-4 w-16 bg-gray-200 rounded-2xl" />
              </div>
              <div className="h-4 w-3/4 bg-gray-200 rounded-2xl mb-2" />
              <div className="h-3 w-1/2 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stage change description helper ─────────────────────────────────────────

function renderStageChangeDescription(event: TimelineEvent) {
  const { from_stage, to_stage } = event.metadata || {};
  if (from_stage && to_stage) {
    return (
      <span>
        <span className="inline-block animate-pulse">
          \u2744\uFE0F {from_stage}
        </span>
        <span className="mx-1.5 text-gray-400">&rarr;</span>
        <span className="inline-block font-bold text-[#87CEEB]">
          {to_stage} \u2744\uFE0F
        </span>
      </span>
    );
  }
  return <span>{event.description}</span>;
}

// ─── Main Component ──────────────────────────────────────────────────────────

const GrowthTimeline = ({ events, loading = false }: GrowthTimelineProps) => {
  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return groupEventsByDate(sorted);
  }, [events]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-6 bg-[#87CEEB] rounded-full" />
          <h2 className="text-lg font-bold text-[#87CEEB]">成长时间线</h2>
        </div>
        <TimelineSkeleton />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-6 bg-[#87CEEB] rounded-full" />
          <h2 className="text-lg font-bold text-[#87CEEB]">成长时间线</h2>
        </div>
        <div className="text-center py-12">
          <span className="text-4xl block mb-3">\u2744\uFE0F</span>
          <p className="text-gray-300 text-sm">还没有成长记录，开始记录你的第一步吧</p>
        </div>
      </div>
    );
  }

  const dateEntries = Array.from(groupedEvents.entries());

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-6 bg-[#87CEEB] rounded-full" />
        <h2 className="text-lg font-bold text-[#87CEEB]">成长时间线</h2>
      </div>

      <motion.div
        className="relative pl-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Vertical timeline line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FFB6C1]/40 via-[#87CEEB]/40 to-[#FFD700]/40" />

        {dateEntries.map(([dateKey, dateEvents], dateIndex) => (
          <div key={dateKey} className="mb-6 last:mb-0">
            {/* Sticky date header */}
            <motion.div
              className="sticky top-0 z-10 py-1.5 mb-2"
              variants={dateHeaderVariants}
            >
              <span className="inline-block bg-[#FFF8F0] text-sm font-medium text-gray-500 px-3 py-1 rounded-full border border-[#FFE4D6] shadow-sm">
                {formatDateHeader(dateKey)}
              </span>
            </motion.div>

            {/* Events for this date */}
            {dateEvents.map((event, eventIndex) => {
              const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.record;
              const globalIndex = dateIndex * 10 + eventIndex;

              return (
                <motion.div
                  key={`${dateKey}-${eventIndex}`}
                  className="relative pl-6 pb-4 last:pb-0"
                  variants={itemVariants}
                  custom={globalIndex}
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-[-21px] top-3 w-3 h-3 ${config.dotColor} rounded-full border-2 border-white shadow-sm z-[1]`}
                  />

                  {/* Event card */}
                  <div
                    className={`bg-gradient-to-r ${config.bgColor} rounded-2xl shadow-sm border border-white/80 p-4 border-l-4 ${config.borderColor} hover:shadow-md transition-shadow`}
                  >
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{config.icon}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.tagBg} ${config.tagText}`}>
                        {TYPE_LABELS[event.type]}
                      </span>
                      <span className="text-xs text-gray-300 ml-auto">
                        {new Date(event.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-gray-800 mb-1">
                      {event.emoji && <span className="mr-1">{event.emoji}</span>}
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {event.type === 'stage_change'
                        ? renderStageChangeDescription(event)
                        : event.description}
                    </p>

                    {/* Record content preview */}
                    {event.type === 'record' && event.metadata?.content && (
                      <p className="mt-2 text-xs text-gray-400 bg-white/60 rounded-xl p-2.5 line-clamp-2">
                        &ldquo;{event.metadata.content}&rdquo;
                      </p>
                    )}

                    {/* Achievement icon display */}
                    {event.type === 'achievement' && event.metadata?.achievement_icon && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-xl">{event.metadata.achievement_icon}</span>
                        <span className="text-xs text-[#FFD700] font-medium">
                          {event.metadata.achievement_level === 'micro' ? '微里程碑' :
                           event.metadata.achievement_level === 'growth' ? '成长里程碑' :
                           event.metadata.achievement_level === 'transformation' ? '蜕变里程碑' : ''}
                        </span>
                      </div>
                    )}

                    {event.type === 'challenge' && (event.metadata?.difficulty || event.metadata?.badge_name) && (
                      <div className="mt-2 flex items-center gap-2">
                        {event.metadata.difficulty && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#9B8EC4]/10 text-[#7B6FA3]">
                            {event.metadata.difficulty === 'bronze' ? '⭐青铜' :
                             event.metadata.difficulty === 'silver' ? '💎白银' :
                             event.metadata.difficulty === 'gold' ? '👑黄金' : event.metadata.difficulty}
                          </span>
                        )}
                        {event.metadata.badge_name && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FFD700]/10 text-[#D4A800]">
                            🏅 {event.metadata.badge_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default GrowthTimeline;
