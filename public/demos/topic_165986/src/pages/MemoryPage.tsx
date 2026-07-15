import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Hash, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { getState } from "@/services/api";
import type { Entry } from "@/types";
import { kindTemplates } from "@/data/examples";

export function MemoryPage() {
  const navigate = useNavigate();
  const {
    entries,
    state,
    setEntries,
    setState,
  } = useAppStore();

  useEffect(() => {
    getState().then(res => {
      if (res.success) {
        setEntries(res.data.entries);
        setState(res.data);
      }
    });
  }, []);

  const handleContinueWriting = (entry: Entry) => {
    navigate(`/write/${entry.id}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const moodColors: Record<string, string> = {
    "低落": "text-indigo-500 dark:text-indigo-400",
    "紧绷": "text-orange-500 dark:text-orange-400",
    "明亮": "text-yellow-500 dark:text-yellow-400",
    "柔软": "text-pink-500 dark:text-pink-400",
    "平静": "text-cyan-500 dark:text-cyan-400",
    "好奇": "text-emerald-500 dark:text-emerald-400",
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">记忆库</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            从最近记录回到长期问题，找到你的思考主线。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">继续写</h2>
              </div>
              <div className="space-y-3">
                {entries.slice(0, 3).map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => handleContinueWriting(entry)}
                    className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {kindTemplates[entry.kind as keyof typeof kindTemplates]?.label || entry.kind}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {entry.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {entry.nextPrompt}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </button>
                ))}
                {entries.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    还没有记录，开始写第一篇吧。
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">最近记录</h2>
                <button
                  onClick={() => navigate("/write")}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  新建记录
                </button>
              </div>
              <div className="space-y-2">
                {entries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => navigate(`/write/${entry.id}`)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <FileText size={14} className="text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {entry.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
                          <span className={`text-xs ${moodColors[entry.mood.key]}`}>{entry.mood.key}</span>
                          <span className="text-xs text-gray-400">{entry.wordCount}字</span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Hash size={16} className="text-indigo-500 dark:text-indigo-400" />
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">探索主题</h2>
              </div>
              <div className="space-y-3">
                {(state?.topics || []).map(topic => (
                  <button
                    key={topic.name}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{topic.name}</span>
                      <span className="text-xs text-gray-400">{topic.count}篇</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{topic.summary}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{topic.words}字</span>
                      <span className={`text-xs ${moodColors[topic.mainMood]}`}>{topic.mainMood}</span>
                    </div>
                  </button>
                ))}
                {(state?.topics || []).length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    暂无主题
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-indigo-500 dark:text-indigo-400" />
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">这个月</h2>
              </div>
              {(state?.monthly && state.monthly.count > 0) ? (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{state.monthly.note}</p>
                  <div className="space-y-2 mb-4">
                    {state.monthly.days.slice(0, 5).map(day => (
                      <div key={day.id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-8">{formatDate(day.createdAt)}</span>
                        <span className={`text-xs font-medium ${moodColors[day.mood.key]}`}>{day.mood.key[0]}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{day.title}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.monthly.topTopics.map(t => (
                      <span key={t.name} className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {t.name} ({t.count})
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  这个月还没有记录。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
