import { useState, useEffect } from "react";
import Head from "next/head";
import Navigation from "../components/Navigation";
import MiniRing from "../components/MiniRing";
import BarChart from "../components/BarChart";
import useCountUp from "../hooks/useCountUp";
import {
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  MessageCircle,
  MapPin,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Target,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import { getDailySummaries, generateDailySummary, DailySummary } from "../lib/api";

function AnimatedNumber({ value, duration = 1500, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const count = useCountUp(value, duration);
  return <span className="tabular-nums">{decimals > 0 ? count.toFixed(decimals) : count}</span>;
}

export default function DailyReportPage() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const data = await getDailySummaries(30);
      setSummaries(data);
    } catch (e) {
      console.error("Failed to fetch summaries:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateDailySummary();
      if (result && !("error" in result)) {
        await fetchSummaries();
        setSelectedIndex(0);
      }
    } catch (e) {
      console.error("Failed to generate summary:", e);
    } finally {
      setGenerating(false);
    }
  };

  const current = summaries[selectedIndex];
  const prev = summaries[selectedIndex + 1];

  const getScoreTrend = (score: number) => {
    if (score > 70) return { icon: TrendingUp, color: "text-rose-500", label: "偏差较大", bg: "bg-rose-50", ring: "ring-rose-500/20" };
    if (score < 40) return { icon: TrendingDown, color: "text-emerald-500", label: "状态良好", bg: "bg-emerald-50", ring: "ring-emerald-500/20" };
    return { icon: Minus, color: "text-amber-500", label: "状态平稳", bg: "bg-amber-50", ring: "ring-amber-500/20" };
  };

  const emotionColors: Record<string, { gradient: string; color: string }> = {
    energy: { gradient: "from-amber-500 to-orange-500", color: "#f97316" },
    anxiety: { gradient: "from-rose-500 to-pink-500", color: "#f43f5e" },
    happiness: { gradient: "from-yellow-400 to-amber-500", color: "#facc15" },
    calmness: { gradient: "from-cyan-400 to-blue-500", color: "#06b6d4" },
    motivation: { gradient: "from-violet-500 to-purple-500", color: "#a855f7" },
    confidence: { gradient: "from-emerald-400 to-teal-500", color: "#10b981" },
  };

  const emotionLabels: Record<string, string> = {
    energy: "能量",
    anxiety: "焦虑",
    happiness: "幸福",
    calmness: "平静",
    motivation: "动力",
    confidence: "自信",
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    } catch {
      return dateStr;
    }
  };

  const getLast7DaysScores = () => {
    const scores: number[] = [];
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
      const s = summaries[i];
      if (s) {
        scores.push(s.avg_discrepancy_score || 0);
        const d = new Date(s.date + "T00:00:00");
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      } else {
        scores.push(0);
        labels.push("");
      }
    }
    return { scores: scores.reverse(), labels: labels.reverse() };
  };

  const weekData = getLast7DaysScores();

  const calculateChange = (current: number, prev: number | undefined) => {
    if (!prev) return null;
    const diff = current - prev;
    const percent = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "0";
    return { diff, percent };
  };

  return (
    <div className="min-h-screen">
      <Head>
        <title>每日总结 - 镜灵</title>
        <meta name="description" content="每日成长总结" />
      </Head>

      <Navigation />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary-200 blur-xl animate-pulse" />
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 flex items-center justify-center relative">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">每日总结</h1>
              <p className="text-sm text-gray-500">回顾每一天的成长旅程</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="skeleton w-10 h-10 rounded-2xl" />
              <div className="skeleton h-8 w-56 sm:w-72 rounded-2xl" />
              <div className="skeleton w-10 h-10 rounded-2xl" />
            </div>
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="skeleton h-10 w-32 rounded-xl" />
                  <div className="skeleton h-14 w-44 rounded-lg" />
                </div>
                <div className="flex gap-4">
                  <div className="skeleton h-12 w-16 rounded-lg" />
                  <div className="skeleton h-12 w-16 rounded-lg" />
                </div>
              </div>
              <div className="skeleton h-28 rounded-2xl" />
            </div>
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="skeleton h-6 w-28 rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-24 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        ) : summaries.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center animate-scale-in relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-transparent to-primary-50 pointer-events-none" />
            <div className="relative">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-3xl bg-primary-100 blur-xl animate-pulse" />
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-100 via-primary-50 to-primary-100 flex items-center justify-center border border-gray-200 relative">
                  <Calendar className="w-10 h-10 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有每日总结</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                镜灵会在每天晚上自动生成当日的成长总结。你也可以立即生成一份。
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl group overflow-hidden"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                {generating ? "生成中..." : "生成今日总结"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 animate-fade-in">
              <button
                onClick={() => setSelectedIndex(Math.min(selectedIndex + 1, summaries.length - 1))}
                disabled={selectedIndex >= summaries.length - 1}
                className="group p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-primary-400 disabled:opacity-30 disabled:hover:border-gray-200 transition-all duration-300 hover:shadow-soft"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-primary-600 group-hover:-translate-x-0.5 transition-all" />
              </button>

              <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200">
                <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-base sm:text-lg font-semibold text-gray-900 whitespace-nowrap">
                  {formatDate(current.date)}
                </span>
                {current.emotion_label && (
                  <span className="px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-100 text-primary-600 text-sm rounded-full border border-primary-300 whitespace-nowrap">
                    {current.emotion_label}
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedIndex(Math.max(selectedIndex - 1, 0))}
                disabled={selectedIndex <= 0}
                className="group p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-primary-400 disabled:opacity-30 disabled:hover:border-gray-200 transition-all duration-300 hover:shadow-soft"
              >
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 glass-card rounded-3xl p-6 sm:p-8 card-enter relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-50 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {(() => {
                        const t = getScoreTrend(current.avg_discrepancy_score);
                        const Icon = t.icon;
                        return (
                          <>
                            <div className={`w-12 h-12 rounded-xl ${t.bg} flex items-center justify-center ring-1 ${t.ring}`}>
                              <Icon className={`w-6 h-6 ${t.color}`} />
                            </div>
                            <div>
                              <span className={`text-sm font-medium ${t.color}`}>{t.label}</span>
                              <p className="text-gray-400 text-xs">平均偏差值</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary-500 via-primary-500 to-primary-600 bg-clip-text text-transparent leading-none drop-shadow-[0_0_30px_rgba(233,69,96,0.35)] tabular-nums">
                        <AnimatedNumber value={current.avg_discrepancy_score || 0} />
                      </span>
                      <span className="text-gray-400 text-base">/ 100</span>
                    </div>
                    {prev && (
                      <div className="mt-3 flex items-center gap-2">
                        {(() => {
                          const change = calculateChange(current.avg_discrepancy_score || 0, prev.avg_discrepancy_score);
                          if (!change) return null;
                          const isUp = change.diff > 0;
                          const Icon = isUp ? ArrowUpRight : ArrowDownRight;
                          return (
                            <span className={`text-sm flex items-center gap-1 px-2 py-1 rounded-lg ${
                              isUp ? "text-rose-500 bg-rose-50" : "text-emerald-500 bg-emerald-50"
                            }`}>
                              <Icon className="w-4 h-4" />
                              较昨日 {isUp ? "+" : ""}{change.diff} ({isUp ? "+" : ""}{change.percent}%)
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <svg className="w-32 h-32" viewBox="0 0 128 128">
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e94560" />
                            <stop offset="50%" stopColor="#ff6b9d" />
                            <stop offset="100%" stopColor="#00d4ff" />
                          </linearGradient>
                        </defs>
                        <circle cx="64" cy="64" r="56" stroke="rgba(0,0,0,0.06)" strokeWidth="10" fill="none" />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="url(#scoreGradient)"
                          strokeWidth="10"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${(current.avg_discrepancy_score || 0) * 3.52} 352`}
                          transform="rotate(-90 64 64)"
                          style={{ filter: "drop-shadow(0 0 8px rgba(233, 69, 96, 0.5))" }}
                          className="transition-all duration-1500 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900 tabular-nums">
                          {current.avg_discrepancy_score}
                        </span>
                        <span className="text-[10px] text-gray-400">偏差值</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-semibold text-lg tabular-nums">
                        <AnimatedNumber value={current.analysis_count || 0} />
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">分析次数</span>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-semibold text-lg tabular-nums">
                        <AnimatedNumber value={current.chat_count || 0} />
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">对话次数</span>
                  </div>
                  {current.top_location_keyword && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold text-sm truncate max-w-[80px]">{current.top_location_keyword}</span>
                      </div>
                      <span className="text-xs text-gray-400">高频场景</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 card-enter">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-500" />
                  近7日趋势
                </h3>
                <div className="h-40 -mx-2">
                  <BarChart
                    data={weekData.scores}
                    labels={weekData.labels}
                    height={140}
                    color="#e94560"
                    secondaryData={weekData.scores.map(s => s * 0.7)}
                    secondaryColor="rgba(0, 212, 255, 0.15)"
                  />
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-primary-500 to-primary-600" />
                    偏差值
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-primary-200" />
                    平均线
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 sm:p-8 mb-6 card-enter relative overflow-hidden">
              <div className="relative p-6 bg-gradient-to-br from-primary-50 via-primary-50 to-primary-50 rounded-2xl border border-primary-200 mb-6 overflow-hidden">
                <span className="absolute top-0 left-3 text-7xl text-primary-600/15 font-serif leading-none select-none pointer-events-none">&ldquo;</span>
                <span className="absolute bottom-0 right-3 text-7xl text-primary-500/15 font-serif leading-none select-none pointer-events-none">&rdquo;</span>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-gray-900">今日总结</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base">{current.summary_text}</p>
                </div>
              </div>

              {current.mirror_insight && (
                <div className="relative p-5 pl-6 rounded-2xl bg-gradient-to-r from-primary-50 via-primary-50 to-primary-50 border border-primary-200 overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 via-primary-500 to-primary-600" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all duration-700" />
                  <div className="relative flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded-xl bg-amber-100 blur-md animate-pulse" />
                      <Zap className="w-5 h-5 text-amber-500 relative" />
                    </div>
                    <p className="text-center italic font-medium text-base">
                      <span className="text-primary-600/60 text-lg mr-1">&laquo;</span>
                      <span className="bg-gradient-to-r from-primary-500 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                        {current.mirror_insight}
                      </span>
                      <span className="text-primary-500/60 text-lg ml-1">&raquo;</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {current.avg_emotion_dimensions && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 mb-6 card-enter">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  情绪维度
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger-enter">
                  {Object.entries(current.avg_emotion_dimensions).map(([key, value]) => {
                    const val = value as number;
                    const emotion = emotionColors[key] || { gradient: "from-primary-500 to-primary-600", color: "#e94560" };
                    return (
                      <div
                        key={key}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <MiniRing
                            value={val}
                            size={48}
                            strokeWidth={4}
                            color={emotion.color}
                            label={Math.round(val).toString()}
                          />
                          <div>
                            <span className="text-sm text-gray-900 font-medium block">{emotionLabels[key] || key}</span>
                            <span className="text-[10px] text-gray-400">情绪指数</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${emotion.gradient} rounded-full sweep-effect`}
                            style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {current.suggestions && current.suggestions.length > 0 && (
              <div className="glass-card rounded-3xl p-6 sm:p-8 card-enter relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2 relative">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  明日建议
                </h3>
                <div className="space-y-3 stagger-enter relative">
                  {current.suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 hover:border-amber-400/30 transition-all duration-300 hover:translate-x-1"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 rounded-xl bg-amber-100 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform relative">
                          {i + 1}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed pt-1.5">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-secondary inline-flex items-center gap-2 group"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            {generating ? "生成中..." : "重新生成今日总结"}
          </button>
        </div>
      </main>
    </div>
  );
}
