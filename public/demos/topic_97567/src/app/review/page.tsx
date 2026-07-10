'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../../hooks/useAuth';
import { useRecordsContext } from '../../contexts/RecordsContext';
import { useTasks } from '../../hooks/useTasks';
import { usePageView } from '../../hooks/usePageView';
import Skeleton from '../components/Skeleton';
import GrowthTimeline, { type TimelineEvent } from '../components/GrowthTimeline';
import { useSnowball } from '../../contexts/SnowballContext';

const SnowballAnimation = dynamic(() => import('../components/SnowballAnimation'), { ssr: false });
const GrowthChart = dynamic(() => import('../components/GrowthChart'), { ssr: false });

interface DataItem {
  id: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

const ReviewPage = () => {
  const { token } = useAuth();
  const { records } = useRecordsContext();
  const { tasks } = useTasks();
  const [report, setReport] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [error, setError] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);

  usePageView('review');

  const { stats, stageLabel } = useSnowball();

  const fetchTimeline = useCallback(async () => {
    if (!token) return;
    setIsLoadingTimeline(true);
    try {
      const response = await fetch('/api/growth/timeline?limit=30', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTimelineEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const generateReport = async () => {
    if (!token) return;
    setIsLoadingReport(true);
    try {
      const response = await fetch('/api/ai/growth-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ time_range: timeRange }),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      console.error(err);
      setError('生成报告失败');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'completed'), [tasks]);
  const progress = useMemo(() => tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0, [tasks, completedTasks.length]);

  const getChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayRecords = records.filter((r: DataItem) => r.created_at && r.created_at.startsWith(date));
      const dayTasks = completedTasks.filter((t) => t.updated_at && t.updated_at.startsWith(date));
      return {
        date: date.slice(5),
        snowball_size: (dayRecords.length * 2 + dayTasks.length * 5) + 10,
        tasks_completed: dayTasks.length,
        records_count: dayRecords.length,
      };
    });
  }, [records, completedTasks]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] rounded-3xl p-6 mb-6 shadow-lg animate-pulse">
            <div className="h-7 w-28 bg-white/30 rounded-2xl mb-2"></div>
            <div className="h-4 w-40 bg-white/20 rounded-2xl"></div>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded-2xl mb-4"></div>
            <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto"></div>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 rounded-2xl mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-200 rounded-3xl p-5 animate-pulse">
              <div className="h-8 w-12 bg-gray-300 rounded-2xl mx-auto mb-2"></div>
              <div className="h-4 w-16 bg-gray-300 rounded-2xl mx-auto"></div>
            </div>
            <div className="bg-gray-200 rounded-3xl p-5 animate-pulse">
              <div className="h-8 w-12 bg-gray-300 rounded-2xl mx-auto mb-2"></div>
              <div className="h-4 w-16 bg-gray-300 rounded-2xl mx-auto"></div>
            </div>
            <div className="bg-gray-200 rounded-3xl p-5 animate-pulse">
              <div className="h-8 w-12 bg-gray-300 rounded-2xl mx-auto mb-2"></div>
              <div className="h-4 w-16 bg-gray-300 rounded-2xl mx-auto"></div>
            </div>
          </div>
          <Skeleton type="card" count={1} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 relative overflow-hidden">
      <div className="absolute top-[-40px] left-[-40px] w-56 h-56 bg-[#FFB6C1]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-30px] right-[-30px] w-48 h-48 bg-[#87CEEB]/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-[#FFD700]/5 rounded-full blur-2xl"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-gradient-to-r from-[#87CEEB] to-[#FFB6C1] rounded-3xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-8 bg-white/80 rounded-full"></span>
            <h1 className="text-2xl font-bold text-white">成长回顾</h1>
          </div>
          <p className="text-white/80 text-sm mt-1 ml-4">回望来路，每一步都算数</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl mb-4 text-sm border border-red-100">{error}</div>
        )}

        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-6 bg-[#87CEEB] rounded-full"></span>
            <h2 className="text-lg font-bold text-[#87CEEB]">雪球状态</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex justify-center">
              <SnowballAnimation progress={progress} />
            </div>

            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="bg-gradient-to-br from-[#FFB6C1]/20 to-[#FFB6C1]/5 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-[#FFB6C1]">{stats.totalScore}</p>
                <p className="text-sm text-gray-400 mt-1">雪球体积 · {stageLabel}</p>
              </div>

              <div className="bg-gradient-to-br from-[#87CEEB]/20 to-[#87CEEB]/5 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-[#87CEEB]">{stats.todayStreak}</p>
                <p className="text-sm text-gray-400 mt-1">连续滚雪球 · 天</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-6 bg-[#FFD700] rounded-full"></span>
            <h2 className="text-lg font-bold text-[#FFD700]">成长轨迹</h2>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <GrowthChart data={getChartData} />
          </div>
        </div>

        <div className="mb-4">
          <GrowthTimeline events={timelineEvents} loading={isLoadingTimeline} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-br from-[#FFB6C1]/20 to-[#FFB6C1]/5 rounded-3xl shadow-lg border border-white/80 p-5 text-center">
            <p className="text-3xl font-bold text-[#FFB6C1]">{records.length}</p>
            <p className="text-sm text-gray-400 mt-1">总记录数</p>
          </div>
          <div className="bg-gradient-to-br from-[#87CEEB]/20 to-[#87CEEB]/5 rounded-3xl shadow-lg border border-white/80 p-5 text-center">
            <p className="text-3xl font-bold text-[#87CEEB]">{completedTasks.length}</p>
            <p className="text-sm text-gray-400 mt-1">已完成任务</p>
          </div>
          <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 rounded-3xl shadow-lg border border-white/80 p-5 text-center">
            <p className="text-3xl font-bold text-[#FFD700]">{progress}%</p>
            <p className="text-sm text-gray-400 mt-1">总进度</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FFB6C1] rounded-full"></span>
              <h2 className="text-lg font-bold text-[#FFB6C1]">AI 成长报告</h2>
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 bg-[#FFF8F0]/50"
              >
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="all">全部</option>
              </select>
              <button
                onClick={generateReport}
                disabled={isLoadingReport}
                className="px-4 py-1.5 bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl hover:from-[#FF99AA] hover:to-[#6BB6E8] transition-all disabled:opacity-50 text-sm shadow-sm font-medium"
              >
                {isLoadingReport ? '生成中...' : '生成报告'}
              </button>
            </div>
          </div>
          {report ? (
            <div className="bg-gradient-to-r from-[#FFB6C1]/5 to-[#87CEEB]/5 rounded-2xl p-5 border border-[#FFB6C1]/10">
              <div className="prose prose-sm max-w-none">
                {report.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h2 key={i} className="text-lg font-bold text-[#87CEEB] mt-4 mb-2">{line.slice(2)}</h2>;
                  }
                  if (line.startsWith('## ')) {
                    return <h3 key={i} className="text-base font-semibold text-[#FFB6C1] mt-3 mb-1">{line.slice(3)}</h3>;
                  }
                  if (line.startsWith('- ')) {
                    return <p key={i} className="text-sm text-gray-600 ml-4">• {line.slice(2)}</p>;
                  }
                  if (line.trim()) {
                    return <p key={i} className="text-sm text-gray-600 leading-relaxed">{line}</p>;
                  }
                  return null;
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-300 text-center py-8">点击&ldquo;生成报告&rdquo;获取 AI 成长分析</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
