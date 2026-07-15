import { useState, useEffect } from "react";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, CategoryScale, LinearScale, BarElement, ArcElement } from "chart.js";
import { Radar, Bar } from "react-chartjs-2";
import { Activity, Zap, Target, Clock, TrendingUp, Sparkles, Hash, MessageSquare, Brain, Heart, Layers, Eye } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { getState, getPsychAnalysis } from "@/services/api";
import type { PsychResult } from "@/services/api";
import { psychModels } from "@/data/psychModels";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, CategoryScale, LinearScale, BarElement, ArcElement);

type MainTabType = "insights" | "distribution" | "time" | "self";
type SubTabType = "mood" | "topic" | "kind";
type PsychModelKey = "bigFive" | "emotionWheel" | "maslow" | "cbt";

export function DashboardPage() {
  const { state, darkMode, setState } = useAppStore();
  const [mainTab, setMainTab] = useState<MainTabType>("insights");
  const [subTab, setSubTab] = useState<SubTabType>("mood");
  const [psychModel, setPsychModel] = useState<PsychModelKey>("bigFive");
  const [psychData, setPsychData] = useState<PsychResult[]>([]);
  const [psychLoading, setPsychLoading] = useState(false);

  useEffect(() => {
    getState().then(res => {
      if (res.success) {
        setState(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (mainTab !== "self") return;
    setPsychLoading(true);
    getPsychAnalysis(psychModel).then(res => {
      if (res.success) setPsychData(res.data);
      setPsychLoading(false);
    });
  }, [mainTab, psychModel]);

  const mainTabs: { value: MainTabType; label: string }[] = [
    { value: "insights", label: "洞察" },
    { value: "distribution", label: "分布" },
    { value: "time", label: "时间" },
    { value: "self", label: "自我认知" },
  ];

  const subTabs: { value: SubTabType; label: string }[] = [
    { value: "mood", label: "心情" },
    { value: "topic", label: "主题" },
    { value: "kind", label: "类型" },
  ];

  const moodColors: Record<string, string> = {
    "低落": "bg-indigo-500",
    "紧绷": "bg-orange-500",
    "明亮": "bg-yellow-500",
    "柔软": "bg-pink-500",
    "平静": "bg-cyan-500",
    "好奇": "bg-emerald-500",
  };

  const renderSignalConsole = () => (
    <div className="bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-indigo-900/50 rounded-2xl p-6 border border-indigo-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-indigo-400" />
        <h2 className="text-sm font-medium text-gray-100">AI Signal Console</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400">实时分析中</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-xs text-gray-400">核心信号</span>
          </div>
          <div className="text-2xl font-bold text-white">{state?.review?.overview?.totalEntries || 0}</div>
          <div className="text-xs text-gray-400 mt-1">活跃记录</div>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-purple-400" />
            <span className="text-xs text-gray-400">长期问题</span>
          </div>
          <div className="text-2xl font-bold text-white">{state?.topics?.length || 0}</div>
          <div className="text-xs text-gray-400 mt-1">探索主题</div>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-cyan-400" />
            <span className="text-xs text-gray-400">本月记录</span>
          </div>
          <div className="text-2xl font-bold text-white">{state?.monthly?.count || 0}</div>
          <div className="text-xs text-gray-400 mt-1">天数</div>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-xs text-gray-400">平均篇幅</span>
          </div>
          <div className="text-2xl font-bold text-white">{state?.review?.overview?.averageWords || 0}</div>
          <div className="text-xs text-gray-400 mt-1">字/篇</div>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => {
    if (!state?.review) return null;

    if (state.review.overview.totalEntries === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Activity size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">还没有写作数据</p>
          <p className="text-xs text-gray-400 mt-2">写第一篇内容后，这里会生成你的思考画像</p>
        </div>
      );
    }

    const radarData = {
      labels: ["记录", "字数", "活跃", "主题", "心情"],
      datasets: [{
        label: "数据概览",
        data: [
          Math.min((state.review.overview.totalEntries || 0) / 10, 1) * 100,
          Math.min((state.review.overview.totalWords || 0) / 5000, 1) * 100,
          Math.min((state.review.overview.activeDays || 0) / 30, 1) * 100,
          Math.min((state.review.topics.length || 0) / 10, 1) * 100,
          Math.min((state.review.moods.length || 0) / 6, 1) * 100,
        ],
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(99, 102, 241, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(99, 102, 241, 1)",
      }],
    };

    const radarOptions = {
      responsive: true,
      scales: {
        r: {
          angleLines: { color: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },
          grid: { color: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },
          pointLabels: { color: darkMode ? "#9CA3AF" : "#6B7280", font: { size: 12 } },
          ticks: { display: false },
        },
      },
      plugins: { legend: { display: false } },
    };

    const mainTopic = state.topics?.[0];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">能力雷达</h3>
          <div className="h-64">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">核心指标</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{state.review.overview.totalEntries}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">总记录数</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{state.review.overview.totalWords}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">总字数</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{state.review.overview.activeDays}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">活跃天数</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{state.review.overview.averageWords}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">平均篇幅</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">最长记录</h3>
            {state.review.overview.longest ? (
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{state.review.overview.longest.title}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min((state.review.overview.longest.words / 1000) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{state.review.overview.longest.words}字</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">暂无数据</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash size={16} className="text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">主线主题</h3>
          </div>
          {mainTopic ? (
            <div>
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">{mainTopic.name}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{mainTopic.summary}</p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">{mainTopic.count}篇记录</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{mainTopic.words}字</span>
                <span className={`text-xs ${moodColors[mainTopic.mainMood] || "bg-gray-500"} text-white px-2 py-0.5 rounded-full`}>
                  {mainTopic.mainMood}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">暂无主题</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-purple-500" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">情绪倾向</h3>
            </div>
            <div className="space-y-3">
              {state.review.moods.slice(0, 4).map(mood => (
                <div key={mood.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">{mood.label}</span>
                    <span className="text-gray-400 text-xs">{mood.count}次</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${moodColors[mood.label] || "bg-gray-500"}`} style={{ width: `${(mood.count / (state.review.moods[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-cyan-500" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">表达方式</h3>
            </div>
            <div className="space-y-3">
              {state.review.kinds.slice(0, 4).map(kind => (
                <div key={kind.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">{kind.label}</span>
                    <span className="text-gray-400 text-xs">{kind.count}次</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${(kind.count / (state.review.kinds[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDistribution = () => {
    if (!state?.review) return null;

    const renderMood = () => (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {state.review.moods.map(mood => (
            <div key={mood.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${moodColors[mood.label] || "bg-gray-500"}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{mood.label}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{mood.count}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{mood.words}字</div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">心情只是文字线索，不是诊断。</p>
          <div className="flex flex-wrap gap-3">
            {state.review.keywords.slice(0, 10).map(kw => (
              <span key={kw.label} className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300" style={{ fontSize: `${12 + kw.count * 1.5}px` }}>
                {kw.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );

    const renderTopic = () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {state.review.topics.slice(0, 6).map(topic => (
            <div key={topic.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{topic.label}</span>
                <span className={`text-xs ${moodColors[topic.mood] || "text-gray-500"}`}>{topic.mood}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{topic.count}篇</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{topic.words}字</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">主题用于连接长期问题。</p>
          <div className="flex flex-wrap gap-3">
            {state.review.keywords.slice(0, 10).map(kw => (
              <span key={kw.label} className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300" style={{ fontSize: `${12 + kw.count * 1.5}px` }}>
                {kw.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );

    const renderKind = () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {state.review.kinds.map(kind => (
            <div key={kind.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">{kind.label}</div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{kind.count}篇</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{kind.words}字</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">类型用于观察表达方式。</p>
          <div className="flex flex-wrap gap-3">
            {state.review.keywords.slice(0, 10).map(kw => (
              <span key={kw.label} className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300" style={{ fontSize: `${12 + kw.count * 1.5}px` }}>
                {kw.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <>
        <div className="flex gap-2 mb-6">
          {subTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setSubTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-150 ${
                subTab === tab.value
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {subTab === "mood" && renderMood()}
        {subTab === "topic" && renderTopic()}
        {subTab === "kind" && renderKind()}
      </>
    );
  };

  const renderTime = () => {
    if (!state?.review?.time) return null;

    const weekdayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const maxWeekdayWords = Math.max(...state.review.time.weekdays.map(w => w.words), 1);

    const barData = {
      labels: weekdayLabels,
      datasets: [{
        label: "写作字数",
        data: state.review.time.weekdays.map(w => w.words),
        backgroundColor: state.review.time.weekdays.map((_, i) => 
          i === (state.review.time.bestDay ? weekdayLabels.indexOf(state.review.time.bestDay.label) : -1)
            ? "rgba(99, 102, 241, 0.8)"
            : darkMode ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.5)"
        ),
        borderRadius: 6,
        barThickness: 24,
      }],
    };

    const barOptions = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: darkMode ? "#9CA3AF" : "#6B7280", font: { size: 11 } },
        },
        y: {
          grid: { color: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" },
          ticks: { color: darkMode ? "#9CA3AF" : "#6B7280", font: { size: 11 } },
        },
      },
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">写作节奏</h3>
          <div className="h-48">
            <Bar data={barData} options={barOptions} />
          </div>
          {state.review.time.bestDay && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3">最常写作：{state.review.time.bestDay.label}</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">近期时间轴</h3>
          <div className="space-y-3">
            {state.review.time.recentDays.slice(-7).map(day => (
              <div key={day.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-10">{day.label}</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${(day.words / maxWeekdayWords) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{day.count}篇</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSelf = () => {
    const currentModel = psychModels.find(m => m.key === psychModel);
    if (!currentModel) return null;

    const modelIcons: Record<string, typeof Brain> = {
      bigFive: Brain,
      emotionWheel: Heart,
      maslow: Layers,
      cbt: Eye,
    };
    const ModelIcon = modelIcons[psychModel] || Brain;

    const psychColors = [
      "rgba(99, 102, 241, 0.7)",
      "rgba(236, 72, 153, 0.7)",
      "rgba(34, 197, 94, 0.7)",
      "rgba(245, 158, 11, 0.7)",
      "rgba(6, 182, 212, 0.7)",
      "rgba(168, 85, 247, 0.7)",
      "rgba(239, 68, 68, 0.7)",
      "rgba(59, 130, 246, 0.7)",
    ];

    const radarData = psychData.length > 0 ? {
      labels: psychData.map(d => d.label),
      datasets: [{
        label: currentModel.name,
        data: psychData.map(d => d.score),
        backgroundColor: darkMode ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2,
        pointBackgroundColor: psychColors,
        pointBorderColor: "#fff",
        pointRadius: 4,
      }],
    } : null;

    const radarOptions = {
      responsive: true,
      scales: {
        r: {
          angleLines: { color: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },
          grid: { color: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },
          pointLabels: { color: darkMode ? "#9CA3AF" : "#6B7280", font: { size: 12 } },
          ticks: { display: false, max: 100, min: 0 },
        },
      },
      plugins: { legend: { display: false } },
    };

    return (
      <div className="space-y-6">
        {/* 模型选择 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={18} className="text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">选择观察视角</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {psychModels.map(model => {
              const Icon = modelIcons[model.key] || Brain;
              return (
                <button
                  key={model.key}
                  onClick={() => setPsychModel(model.key as PsychModelKey)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                    psychModel === model.key
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} className={
                      psychModel === model.key
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-gray-400"
                    } />
                    <span className={`text-sm font-medium ${
                      psychModel === model.key
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-gray-700 dark:text-gray-200"
                    }`}>{model.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{model.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 模型说明 */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30">
          <div className="flex items-start gap-3">
            <ModelIcon size={20} className="text-indigo-500 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">
                {currentModel.name} · {currentModel.subtitle}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentModel.description}
              </p>
            </div>
          </div>
        </div>

        {psychLoading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : psychData.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
            <p className="text-sm text-gray-400">还没有足够的写作数据进行分析</p>
            <p className="text-xs text-gray-400 mt-2">继续写作，数据会慢慢积累成你的自我画像</p>
          </div>
        ) : (
          <>
            {/* 雷达图 */}
            {radarData && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">维度分布</h3>
                <div className="h-72">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>
            )}

            {/* 维度详情 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {psychData.map((dim, index) => (
                <div key={dim.dimension} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: psychColors[index % psychColors.length] }} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{dim.label}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{dim.score}%</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{dim.description}</p>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dim.score}%`,
                        backgroundColor: psychColors[index % psychColors.length],
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">命中 {dim.count} 次</p>
                </div>
              ))}
            </div>

            {/* 温馨提示 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  这些维度只是从你的文字中提取的线索，不是心理诊断。它们的作用是帮助你从不同角度观察自己，发现可能的盲区。
                  如果你感到困扰，建议寻求专业心理咨询师的帮助。
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">AI 看板</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            通过数据洞察你的思考模式和写作习惯。
          </p>
        </div>

        {renderSignalConsole()}

        <div className="flex gap-2 mt-6 mb-6">
          {mainTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setMainTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-150 ${
                mainTab === tab.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mainTab === "insights" && renderInsights()}
        {mainTab === "distribution" && renderDistribution()}
        {mainTab === "time" && renderTime()}
        {mainTab === "self" && renderSelf()}
      </div>
    </div>
  );
}
