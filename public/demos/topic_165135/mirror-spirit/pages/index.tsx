import { useState, useEffect, useRef } from "react";
import { Sparkles, Target, Heart, TrendingUp, AlertCircle, CheckCircle, Activity, ArrowUpRight, Zap, BarChart3, MessageCircle, MapPin, Flame, Award, Clock, Eye, TrendingDown, Minus, ArrowUp, ArrowDown, Play, BookOpen, Map } from "lucide-react";
import Navigation from "../components/Navigation";
import MiniRing from "../components/MiniRing";
import BarChart from "../components/BarChart";
import useCountUp from "../hooks/useCountUp";
import { analyzeSelf, generateSpatialPlan, healthCheck, getTrendData, getOverviewStats, AnalysisResponse, SpatialPlanResponse, TrendData, OverviewStats } from "../lib/api";
import { useDemo } from "../lib/useDemo";

function AnimatedNumber({ value, duration = 1500, prefix = "", suffix = "" }: { value: number; duration?: number; prefix?: string; suffix?: string }) {
  const count = useCountUp(value, duration);
  return <span className="tabular-nums">{prefix}{count}{suffix}</span>;
}

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [spatialPlan, setSpatialPlan] = useState<SpatialPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ status: string; service: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "emotions" | "trend">("overview");
  const [showContent, setShowContent] = useState(false);
  const hasAnimated = useRef(false);
  const { isDemoMode, toggleDemoMode, demoData } = useDemo();

  useEffect(() => {
    checkHealth();
    loadTrendData();
    loadStats();
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const checkHealth = async () => {
    try {
      const status = await healthCheck();
      setHealthStatus(status);
    } catch (error) {
      console.error("Health check failed:", error);
    }
  };

  const loadTrendData = async () => {
    try {
      const data = await getTrendData(7);
      setTrendData(data);
    } catch (error) {
      console.error("Failed to load trend:", error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getOverviewStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setIsAnalyzing(true);
    try {
      const mockDiary = "今天工作压力很大，感觉很焦虑，希望能找到内心的平静。";
      const result = await analyzeSelf(mockDiary);
      setAnalysis(result);

      const plan = await generateSpatialPlan(
        result.discrepancy_score,
        result.location_keyword,
        39.9042,
        116.4074
      );
      setSpatialPlan(plan);
      
      loadTrendData();
      loadStats();
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const getDiscrepancyColor = (score: number) => {
    if (score > 70) return "text-red-500";
    if (score > 40) return "text-yellow-500";
    return "text-green-500";
  };

  const getDiscrepancyGradient = (score: number) => {
    if (score > 70) return "#ef4444";
    if (score > 40) return "#eab308";
    return "#22c55e";
  };

  const getDiscrepancyLabel = (score: number) => {
    if (score > 70) return "需要关注";
    if (score > 40) return "正常范围";
    return "状态良好";
  };

  const getTrendInfo = (score: number) => {
    if (score > 70) return { icon: ArrowUp, color: "text-rose-500", bg: "bg-rose-50", label: "偏差较大" };
    if (score < 40) return { icon: ArrowDown, color: "text-emerald-500", bg: "bg-emerald-50", label: "状态良好" };
    return { icon: Minus, color: "text-amber-500", bg: "bg-amber-50", label: "状态平稳" };
  };

  const EmotionRadarChart = ({ emotions }: { emotions: any }) => {
    const labels = [
      { key: "energy", label: "能量", color: "#fbbf24" },
      { key: "anxiety", label: "焦虑", color: "#ef4444" },
      { key: "happiness", label: "幸福", color: "#22c55e" },
      { key: "calmness", label: "平静", color: "#06b6d4" },
      { key: "motivation", label: "动力", color: "#f97316" },
      { key: "confidence", label: "自信", color: "#a855f7" },
    ];

    const center = 100;
    const radius = 80;
    const angleStep = (Math.PI * 2) / labels.length;

    const getPoint = (index: number, value: number) => {
      const angle = angleStep * index - Math.PI / 2;
      const r = (value / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    };

    const getOuterPoint = (index: number) => {
      const angle = angleStep * index - Math.PI / 2;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    };

    const points = labels.map((l, i) => getPoint(i, emotions[l.key] || 50));
    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

    return (
      <svg viewBox="0 0 200 200" className="w-full h-56">
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e94560" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#ff6b9d" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
          </radialGradient>
          <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <polygon
            key={i}
            points={labels.map((_, idx) => {
              const p = getOuterPoint(idx);
              return `${center + (p.x - center) * scale},${center + (p.y - center) * scale}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray={i === 3 ? "0" : "2 3"}
          />
        ))}

        {labels.map((_, i) => {
          const p = getOuterPoint(i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        <path d={pathData} fill="url(#radarGradient)" stroke="#e94560" strokeWidth="2" filter="url(#radarGlow)" />

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={labels[i].color} stroke="white" strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 6px ${labels[i].color})` }} />
        ))}

        {labels.map((l, i) => {
          const p = getOuterPoint(i);
          const angle = angleStep * i - Math.PI / 2;
          const textR = radius + 20;
          const tx = center + textR * Math.cos(angle);
          const ty = center + textR * Math.sin(angle) + 4;
          return (
            <text
              key={i}
              x={tx}
              y={ty}
              textAnchor="middle"
              fill={l.color}
              fillOpacity="0.85"
              fontSize="11"
              fontWeight="600"
            >
              {l.label}
            </text>
          );
        })}
      </svg>
    );
  };

  const TrendChart = ({ data }: { data: TrendData }) => {
    const maxScore = 100;
    const width = 400;
    const height = 150;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const validScores = data.scores.filter(s => s !== null) as number[];
    if (validScores.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center">
          <p className="text-gray-400 text-sm">暂无趋势数据</p>
        </div>
      );
    }

    const xStep = chartWidth / (data.dates.length - 1 || 1);
    
    const points = data.scores.map((score, i) => {
      if (score === null) return null;
      return {
        x: padding + i * xStep,
        y: padding + chartHeight - (score / maxScore) * chartHeight,
      };
    });

    const validPoints = points.filter(p => p !== null) as { x: number; y: number }[];
    
    let pathData = "";
    validPoints.forEach((p, i) => {
      pathData += `${i === 0 ? "M" : "L"} ${p.x} ${p.y} `;
    });

    const areaPath = pathData + `L ${validPoints[validPoints.length - 1]?.x || 0} ${padding + chartHeight} L ${validPoints[0]?.x || 0} ${padding + chartHeight} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e94560" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#ff6b9d" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e94560" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + chartHeight * p}
            x2={width - padding}
            y2={padding + chartHeight * p}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 4"
          />
        ))}

        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={pathData} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(233, 69, 96, 0.5))" }} />

        {validPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="#e94560" stroke="white" strokeWidth="2" style={{ filter: "drop-shadow(0 0 6px rgba(233, 69, 96, 0.8))" }} />
        ))}

        {data.dates.map((date, i) => (
          <text
            key={i}
            x={padding + i * xStep}
            y={height - 5}
            textAnchor="middle"
            fill="rgba(255,255,255,0.45)"
            fontSize="10"
            fontWeight="500"
          >
            {date.slice(5)}
          </text>
        ))}
      </svg>
    );
  };

  const statCards = [
    {
      label: "分析次数",
      value: stats?.total_analyses || 0,
      icon: Activity,
      gradient: "from-blue-100 to-cyan-100",
      iconColor: "text-blue-500",
      glowColor: "shadow-blue-500/20",
      ringColor: "ring-blue-500/20",
      bgBlob: "bg-blue-50",
      trend: "+12%",
      trendUp: true,
      ringValue: Math.min((stats?.total_analyses || 0) * 5, 100),
      ringColorHex: "#3b82f6",
    },
    {
      label: "周均偏差值",
      value: stats?.avg_week_score || 0,
      icon: Flame,
      gradient: "from-primary-200 to-primary-100",
      iconColor: "text-primary-600",
      glowColor: "shadow-primary-500/20",
      ringColor: "ring-primary-200",
      bgBlob: "bg-primary-50",
      trend: "7日平均",
      trendUp: null,
      ringValue: stats?.avg_week_score || 0,
      ringColorHex: "#e94560",
    },
    {
      label: "对话次数",
      value: stats?.total_chats || 0,
      icon: MessageCircle,
      gradient: "from-purple-100 to-primary-100",
      iconColor: "text-purple-500",
      glowColor: "shadow-purple-500/20",
      ringColor: "ring-purple-500/20",
      bgBlob: "bg-purple-50",
      trend: "活跃",
      trendUp: true,
      ringValue: Math.min((stats?.total_chats || 0) * 2, 100),
      ringColorHex: "#a855f7",
    },
    {
      label: "成长空间",
      value: 0,
      icon: Award,
      gradient: "from-amber-200 to-yellow-100",
      iconColor: "text-amber-500",
      glowColor: "shadow-amber-500/20",
      ringColor: "ring-amber-200",
      bgBlob: "bg-amber-50",
      trend: "TOP",
      trendUp: null,
      ringValue: 85,
      ringColorHex: "#fbbf24",
      customLabel: stats?.top_locations?.[0]?.keyword || "书店",
    },
  ];

  return (
    <div className="min-h-screen pt-16">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 animate-slide-up">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 p-[1.5px] shadow-soft">
                  <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary-600 animate-float" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 rounded-full animate-pulse ring-2 ring-white" />
                <div className="absolute inset-0 rounded-2xl border border-primary-300 animate-ping opacity-20" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                  镜灵 · 镜面人生
                </h1>
                <p className="text-gray-500 text-sm md:text-base mt-1 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                  </span>
                  AI 驱动的个人成长与心理疗愈系统
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2.5 glass-card glass-card-hover ${isDemoMode ? "glow-cyan" : healthStatus?.status === "healthy" ? "glow-cyan" : "glow-accent"}`}>
              {isDemoMode ? (
                <span className="flex items-center gap-2 text-primary-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                  </span>
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">Demo 模式运行中</span>
                </span>
              ) : healthStatus?.status === "healthy" ? (
                <span className="flex items-center gap-2 text-green-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">系统在线</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">服务未连接</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {!isDemoMode && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="glass-card p-6 md:p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/50 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-50 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 border border-primary-100 rounded-full mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-xs font-medium text-primary-700">AI 驱动的个人成长镜像系统</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    一面会慢慢懂你的数字镜子
                  </h2>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-2xl">
                    镜灵不是那种「一用就哇塞」的产品。它更像真实的心理咨询——
                    你写的每一篇日记、说的每一句话、走过的每一条路，
                    都会让这面镜子更清晰一点。7天后，你会惊讶于它对你的理解。
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-gray-600">日记分析</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <BarChart3 className="w-4 h-4 text-primary-500" />
                      <span className="text-xs text-gray-600">偏差值系统</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <MessageCircle className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-gray-600">镜像对话</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <Map className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-gray-600">空间成长</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-xs text-gray-600">自动成长</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 w-full md:w-auto">
                  <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                    <button
                      onClick={toggleDemoMode}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25"
                    >
                      <Play className="w-4 h-4" />
                      快速体验 7 天成长
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:border-primary-300 hover:text-primary-600 transition-all"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      立即写日记分析
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isDemoMode && (
          <div className="mb-8 animate-scale-in">
            <div className="glass-card p-6 md:p-8 overflow-hidden relative bg-gradient-to-br from-white to-primary-50/30">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-100/40 rounded-full blur-3xl pointer-events-none animate-breathe" />
              
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30 animate-float">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      快速体验模式 · 第 {demoData.day} 天
                    </h3>
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      {demoData.title}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{demoData.description}</p>
                  <p className="text-gray-600 text-sm leading-relaxed italic">
                    「 {demoData.insight} 」
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {demoData.strengths.slice(0, 4).map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-green-50 text-green-600 text-xs rounded-lg border border-green-100">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    💡 拖动底部时间轴，查看第 1 / 3 / 7 / 30 天的不同成长阶段
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {analysis?.mirror_insight && (
          <div className="mb-8 relative animate-scale-in group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 via-primary-500 to-primary-600 rounded-2xl opacity-40 blur-sm group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative glass-card p-6 md:p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary-50 rounded-full blur-3xl pointer-events-none animate-breathe" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-50 rounded-full blur-3xl pointer-events-none animate-breathe" style={{ animationDelay: "1.5s" }} />
              <div className="relative flex items-start gap-4 md:gap-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-primary-200 blur-xl animate-pulse" />
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/40 animate-float relative">
                    <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-gray-900" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-sm mb-2 flex items-center gap-2 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>镜中洞察</span>
                    <span className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
                  </p>
                  <p className="text-gray-900 text-lg md:text-xl font-medium italic leading-relaxed">
                    <span className="text-primary-400 text-3xl leading-none align-top mr-1">&ldquo;</span>{analysis.mirror_insight}<span className="text-primary-400 text-3xl leading-none align-bottom ml-1">&rdquo;</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-enter">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const TrendIcon = card.trendUp === true ? ArrowUpRight : card.trendUp === false ? TrendingDown : Eye;
            return (
              <div key={index} className="glass-card glass-card-hover p-5 transition-all duration-300 card-float group relative overflow-hidden">
                <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.bgBlob} rounded-full blur-2xl group-hover:scale-125 transition-all duration-700 pointer-events-none`} />
                
                <div className="relative flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.glowColor} ring-1 ${card.ringColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <MiniRing
                    value={card.ringValue}
                    size={40}
                    strokeWidth={3}
                    color={card.ringColorHex}
                  />
                </div>

                <p className="relative text-2xl md:text-3xl font-bold text-gray-900 tabular-nums mb-1">
                  {card.customLabel || <AnimatedNumber value={card.value} />}
                </p>
                <div className="relative flex items-center justify-between">
                  <p className="text-gray-500 text-sm">{card.label}</p>
                  <span className={`text-xs flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                    card.trendUp === true ? "text-green-500 bg-green-50" :
                    card.trendUp === false ? "text-red-500 bg-red-50" :
                    "text-gray-500 bg-gray-50"
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    {card.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 card-enter relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary-50 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-200 to-blue-100 flex items-center justify-center shadow-lg shadow-primary-500/20 ring-1 ring-primary-200">
                    <Activity className="w-5 h-5 text-primary-500" />
                  </div>
                  自我偏差值
                </h2>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 group overflow-hidden"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  )}
                  {isLoading ? "分析中..." : "开始分析"}
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-100 to-primary-100 blur-3xl animate-pulse" />
                  <div className="relative">
                    <svg className="w-64 h-64" viewBox="0 0 256 256">
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#e94560" />
                          <stop offset="50%" stopColor="#ff6b9d" />
                          <stop offset="100%" stopColor="#00d4ff" />
                        </linearGradient>
                        <filter id="progressGlow">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="16"
                        fill="none"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="110"
                        stroke="url(#progressGradient)"
                        strokeWidth="16"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(analysis?.discrepancy_score || 0) * 6.91} 691`}
                        className="transition-all duration-1500 ease-out"
                        style={{ filter: "drop-shadow(0 0 12px rgba(233, 69, 96, 0.5))" }}
                        transform="rotate(-90 128 128)"
                      />
                      <circle cx="128" cy="128" r="92" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 5" fill="none" />
                      <circle cx="128" cy="128" r="70" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 5" fill="none" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-6xl font-bold tabular-nums ${getDiscrepancyColor(analysis?.discrepancy_score || 0)} transition-all duration-500`} style={{ textShadow: "0 0 24px currentColor" }}>
                        {analysis?.discrepancy_score || 0}
                      </span>
                      <span className="text-gray-500 text-sm mt-1 tracking-wider">偏差值</span>
                      <span className={`text-xs mt-2 px-3 py-1 rounded-full font-medium ${
                        analysis?.discrepancy_score && analysis.discrepancy_score > 70 ? "bg-red-50 text-red-500 ring-1 ring-red-100" :
                        analysis?.discrepancy_score && analysis.discrepancy_score > 40 ? "bg-yellow-50 text-yellow-500 ring-1 ring-yellow-100" :
                        "bg-green-50 text-green-500 ring-1 ring-green-100"
                      }`}>
                        {getDiscrepancyLabel(analysis?.discrepancy_score || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-4">
                  {[
                    { key: "energy", label: "情绪能量", gradient: "from-yellow-500 to-orange-500", color: "#f97316", value: analysis?.emotion_dimensions?.energy || 0 },
                    { key: "anxiety", label: "焦虑程度", gradient: "from-red-500 to-rose-500", color: "#ef4444", value: analysis?.emotion_dimensions?.anxiety || 0 },
                    { key: "happiness", label: "幸福指数", gradient: "from-green-500 to-emerald-500", color: "#22c55e", value: analysis?.emotion_dimensions?.happiness || 0 },
                    { key: "calmness", label: "内心平静", gradient: "from-cyan-500 to-blue-500", color: "#06b6d4", value: analysis?.emotion_dimensions?.calmness || 0 },
                    { key: "motivation", label: "动力水平", gradient: "from-orange-500 to-amber-500", color: "#f59e0b", value: analysis?.emotion_dimensions?.motivation || 0 },
                    { key: "confidence", label: "自信心", gradient: "from-purple-500 to-violet-500", color: "#a855f7", value: analysis?.emotion_dimensions?.confidence || 0 },
                  ].map((dim, i) => (
                    <div key={dim.key} className="flex items-center justify-between group">
                      <span className="text-gray-500 text-sm w-20 flex-shrink-0">{dim.label}</span>
                      <div className="flex-1 mx-3 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden ring-1 ring-gray-100">
                          <div
                            className={`h-full bg-gradient-to-r ${dim.gradient} transition-all duration-1000 ease-out rounded-full sweep-effect`}
                            style={{ width: `${dim.value}%`, boxShadow: `0 0 10px ${dim.color}50` }}
                          />
                        </div>
                        <MiniRing value={dim.value} size={28} strokeWidth={3} color={dim.color} />
                      </div>
                      <span className="text-gray-900 text-sm w-8 text-right tabular-nums">{dim.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card glass-card-hover p-6 transition-all duration-300 card-enter group card-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">理想自我</h3>
                    <p className="text-gray-400 text-xs">你渴望成为的样子</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">{analysis?.ideal_self || "点击分析，发现你内心深处的理想自我..."}</p>
              </div>

              <div className="glass-card glass-card-hover p-6 transition-all duration-300 card-enter group card-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center shadow-lg shadow-rose-500/20 ring-1 ring-rose-200 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">现实自我</h3>
                    <p className="text-gray-400 text-xs">你当前的真实状态</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">{analysis?.actual_self || "点击分析，看见当下最真实的你..."}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 card-enter">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    7日偏差值趋势
                  </h3>
                  <span className="text-gray-400 text-xs px-2 py-1 rounded-full bg-gray-50">近 7 天</span>
                </div>
                {trendData ? (
                  <TrendChart data={trendData} />
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <div className="animate-pulse w-full h-full bg-gray-50 rounded-lg" />
                  </div>
                )}
              </div>

              <div className="glass-card p-6 card-enter">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-500" />
                    每日分析统计
                  </h3>
                  <span className="text-gray-400 text-xs px-2 py-1 rounded-full bg-gray-50">本周</span>
                </div>
                <div className="h-40 flex items-end justify-around pb-4">
                  {[65, 48, 72, 55, 68, 42, stats?.avg_week_score || 55].map((val, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="relative w-8 flex items-end" style={{ height: "100px" }}>
                        <div
                          className="w-full rounded-t-lg bar-grow bg-gradient-to-t from-primary-500 to-primary-600"
                          style={{ height: `${val}%`, animationDelay: `${i * 0.08}s`, boxShadow: "0 0 8px rgba(233, 69, 96, 0.4)" }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {["一", "二", "三", "四", "五", "六", "日"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {analysis && (
              <div className="glass-card glass-card-hover p-6 transition-all duration-300 card-enter relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-all duration-700" />
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center shadow-lg shadow-primary-500/20 ring-1 ring-primary-200">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">行动建议</h3>
                    <p className="text-gray-400 text-xs">AI 为你推荐的成长路径</p>
                  </div>
                </div>
                <div className="relative flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-primary-200 blur-xl animate-pulse" />
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/40 animate-float relative">
                        <Zap className="w-8 h-8 text-gray-900" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary-100 to-primary-100 text-primary-600 text-sm font-medium ring-1 ring-primary-200">
                        {analysis.location_keyword}
                      </span>
                      {analysis.personality_traits?.slice(0, 3).map((trait, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-gradient-to-r from-primary-100 to-blue-50 text-primary-500 text-sm ring-1 ring-primary-200 transition-all duration-300 hover:scale-105 hover:bg-primary-100 cursor-default animate-pop-in" style={{ animationDelay: `${i * 0.1}s` }}>
                          {trait}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-900 text-base md:text-lg font-medium mb-2">{analysis.suggested_action}</p>
                    {analysis.strengths && analysis.strengths.length > 0 && (
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm mb-2 flex items-center gap-1.5">
                          <span className="text-green-500">✨</span> 你的优势
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.strengths.map((s, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-50 text-green-500 text-sm ring-1 ring-green-100 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 cursor-default">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.growth_areas && analysis.growth_areas.length > 0 && (
                      <div className="mt-3">
                        <p className="text-gray-500 text-sm mb-2 flex items-center gap-1.5">
                          <span className="text-yellow-500">🌱</span> 成长点
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.growth_areas.map((g, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-amber-50 text-yellow-500 text-sm ring-1 ring-yellow-100 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20 cursor-default">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-card glass-card-hover p-6 transition-all duration-300 card-enter card-float">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  今日推荐任务
                </h3>
                {spatialPlan && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-500 ring-1 ring-amber-200 font-medium">
                    {spatialPlan.total_tasks} 个任务
                  </span>
                )}
              </div>
              {spatialPlan?.tasks ? (
                <div className="space-y-3 stagger-enter">
                  {spatialPlan.tasks.slice(0, 3).map((task, index) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] group ${
                        task.priority === "high"
                          ? "bg-red-50 border-red-200 hover:shadow-lg hover:shadow-red-500/10"
                          : task.priority === "medium"
                          ? "bg-yellow-50 border-yellow-200 hover:shadow-lg hover:shadow-yellow-500/10"
                          : "bg-green-50 border-green-200 hover:shadow-lg hover:shadow-green-500/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            task.priority === "high" ? "bg-red-500 shadow-soft" :
                            task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                          } ${task.priority === "high" ? "animate-pulse" : ""}`} />
                          <span className="text-gray-900 font-medium text-sm">{task.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ring-1 ${
                          task.priority === "high"
                            ? "bg-red-50 text-red-500 ring-red-100"
                            : task.priority === "medium"
                            ? "bg-yellow-50 text-yellow-500 ring-yellow-100"
                            : "bg-green-50 text-green-500 ring-green-100"
                        }`}>
                          {task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{task.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.suggested_duration}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-50">{task.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-amber-100 blur-xl animate-pulse" />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-primary-50 flex items-center justify-center mx-auto ring-1 ring-gray-100 relative">
                      <Sparkles className="w-10 h-10 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-gray-500">点击&ldquo;开始分析&rdquo;生成任务</p>
                  <p className="text-gray-400 text-sm mt-2">系统将根据你的状态推荐成长任务</p>
                </div>
              )}
            </div>

            {analysis?.emotion_dimensions && (
              <div className="glass-card p-6 card-enter">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-500" />
                  情绪雷达
                </h3>
                <EmotionRadarChart emotions={analysis.emotion_dimensions} />
              </div>
            )}

            <div className="glass-card p-6 card-enter relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-full blur-2xl pointer-events-none" />
              <h3 className="relative font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                关于镜灵
              </h3>
              <div className="relative space-y-4 stagger-enter">
                <div className="flex items-start gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-200 to-primary-100 flex items-center justify-center flex-shrink-0 ring-1 ring-primary-200 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-primary-600 font-bold text-sm">01</span>
                  </div>
                  <div>
                    <h4 className="text-gray-900 text-sm font-medium">双轨人格模型</h4>
                    <p className="text-gray-400 text-xs mt-1">对比理想自我与现实自我，计算偏差值</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-200 to-blue-100 flex items-center justify-center flex-shrink-0 ring-1 ring-primary-200 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-primary-500 font-bold text-sm">02</span>
                  </div>
                  <div>
                    <h4 className="text-gray-900 text-sm font-medium">GIS 空间映射</h4>
                    <p className="text-gray-400 text-xs mt-1">将成长任务映射到现实地图中</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-200 to-yellow-100 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-200 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-amber-500 font-bold text-sm">03</span>
                  </div>
                  <div>
                    <h4 className="text-gray-900 text-sm font-medium">AI 智能分析</h4>
                    <p className="text-gray-400 text-xs mt-1">多维度分析你的心理状态和成长需求</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
