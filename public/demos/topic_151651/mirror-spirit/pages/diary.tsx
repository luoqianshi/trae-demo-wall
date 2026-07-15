import { useState } from "react";
import { Send, Mic, Image, MapPin, Sparkles, Clock, CheckCircle, TrendingUp, Target, Heart, Activity, Zap, Award, Leaf } from "lucide-react";
import Navigation from "../components/Navigation";
import MiniRing from "../components/MiniRing";
import useCountUp from "../hooks/useCountUp";
import { analyzeSelf, AnalysisResponse } from "../lib/api";

function AnimatedNumber({ value, duration = 1500, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const count = useCountUp(value, duration);
  return <span className="tabular-nums">{decimals > 0 ? count.toFixed(decimals) : count}</span>;
}

export default function DiaryPage() {
  const [diaryText, setDiaryText] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [gpsCoordinates, setGpsCoordinates] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setIsSubmitted(false);
    
    try {
      const result = await analyzeSelf(
        diaryText,
        audioTranscript || undefined,
        imageDescription || undefined,
        gpsCoordinates || undefined
      );
      setAnalysis(result);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setDiaryText("");
    setAudioTranscript("");
    setImageDescription("");
    setGpsCoordinates("");
    setAnalysis(null);
    setIsSubmitted(false);
  };

  const getDiscrepancyColor = (score: number) => {
    if (score > 70) return "text-red-500";
    if (score > 40) return "text-yellow-500";
    return "text-green-500";
  };

  const getDiscrepancyBg = (score: number) => {
    if (score > 70) return "from-red-500/20 to-red-500/5";
    if (score > 40) return "from-yellow-500/20 to-yellow-500/5";
    return "from-green-500/20 to-green-500/5";
  };

  return (
    <div className="min-h-screen pt-16">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10 sm:mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 border border-primary-300 mb-4 glow-soft">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-primary-600 text-sm font-medium">记录你的心声</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-500 via-primary-500 to-primary-600 bg-clip-text text-transparent mb-3">
            日记记录
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            写下你的感受，让 AI 帮你解读理想与现实之间的距离
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass-card glass-card-hover p-6 sm:p-7 transition-all duration-300 card-enter">
                <label className="flex items-center gap-3 text-gray-900 font-medium mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center glow-accent">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <span>日记内容</span>
                    <span className="text-red-500 ml-1">*</span>
                    <p className="text-gray-400 text-xs mt-0.5">记录今天发生的事情和你的感受</p>
                  </div>
                </label>
                <textarea
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="今天发生了什么？你的感受如何？尽情倾诉，镜灵会用心倾听..."
                  className="w-full h-52 glass-input rounded-xl p-4 text-gray-900 placeholder-gray-400 resize-none text-base leading-relaxed"
                  required
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-400 text-xs flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${diaryText.length >= 10 ? "bg-green-400" : "bg-gray-300"}`} />
                    最少 10 个字符
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          diaryText.length >= 10
                            ? "bg-gradient-to-r from-green-500 to-emerald-400"
                            : "bg-gradient-to-r from-primary-500 to-primary-600"
                        }`}
                        style={{ width: `${Math.min((diaryText.length / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium tabular-nums ${diaryText.length >= 10 ? "text-green-400" : "text-gray-500"}`}>
                      {diaryText.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card glass-card-hover p-6 transition-all duration-300 card-enter">
                  <label className="flex items-center gap-3 text-gray-900 font-medium mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <span>语音转写</span>
                      <p className="text-gray-400 text-xs mt-0.5">可选，记录你的语音内容</p>
                    </div>
                  </label>
                  <textarea
                    value={audioTranscript}
                    onChange={(e) => setAudioTranscript(e.target.value)}
                    placeholder="输入语音转写内容..."
                    className="w-full h-24 glass-input rounded-xl p-4 text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>

                <div className="glass-card glass-card-hover p-6 transition-all duration-300 card-enter">
                  <label className="flex items-center gap-3 text-gray-900 font-medium mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Image className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <span>环境照片描述</span>
                      <p className="text-gray-400 text-xs mt-0.5">可选，描述你看到的环境</p>
                    </div>
                  </label>
                  <textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="描述你上传的环境照片，如：阳光明媚的公园..."
                    className="w-full h-24 glass-input rounded-xl p-4 text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>
              </div>

              <div className="glass-card glass-card-hover p-6 transition-all duration-300 card-enter">
                <label className="flex items-center gap-3 text-gray-900 font-medium mb-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <span>GPS 坐标</span>
                    <p className="text-gray-400 text-xs mt-0.5">可选，定位你的当前位置</p>
                  </div>
                </label>
                <input
                  type="text"
                  value={gpsCoordinates}
                  onChange={(e) => setGpsCoordinates(e.target.value)}
                  placeholder="格式：纬度,经度 如：39.9042,116.4074"
                  className="w-full glass-input rounded-xl p-4 text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isAnalyzing || diaryText.trim().length < 10}
                  className="flex-1 btn-primary px-6 py-4 rounded-xl flex items-center justify-center gap-2.5 text-base group"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>AI 分析中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      <span>提交分析</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-secondary px-6 py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <span>清空</span>
                </button>
              </div>
            </form>

            <div className="glass-card p-6 sm:p-7 card-enter">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                分析说明
              </h3>
              <div className="relative space-y-5">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary-200 via-primary-200 to-amber-200" />
                <div className="flex items-start gap-4 group relative">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 ring-4 ring-primary-100 group-hover:ring-primary-200 group-hover:bg-primary-200 transition-all duration-300 z-10">
                    <span className="text-primary-600 text-xs font-bold">1</span>
                  </div>
                  <p className="text-gray-500 text-sm group-hover:text-gray-600 transition-colors pt-0.5">系统会分析你的日记内容，提取"理想自我"与"现实自我"</p>
                </div>
                <div className="flex items-start gap-4 group relative">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 ring-4 ring-primary-100 group-hover:ring-primary-200 group-hover:bg-primary-200 transition-all duration-300 z-10">
                    <span className="text-primary-500 text-xs font-bold">2</span>
                  </div>
                  <p className="text-gray-500 text-sm group-hover:text-gray-600 transition-colors pt-0.5">偏差值越高，说明需要更多行动来缩小理想与现实的差距</p>
                </div>
                <div className="flex items-start gap-4 group relative">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 ring-4 ring-amber-100 group-hover:ring-amber-200 group-hover:bg-amber-200 transition-all duration-300 z-10">
                    <span className="text-amber-500 text-xs font-bold">3</span>
                  </div>
                  <p className="text-gray-500 text-sm group-hover:text-gray-600 transition-colors pt-0.5">建议前往的地点类型将用于生成地图上的成长任务</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 sm:p-7 card-enter lg:sticky lg:top-20">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center glow-accent">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">AI 分析结果</h3>
                    <p className="text-gray-400 text-xs">深度解读你的内心世界</p>
                  </div>
                </div>
                {isSubmitted && analysis && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-500 text-sm animate-scale-in">
                    <CheckCircle className="w-4 h-4" />
                    分析完成
                  </div>
                )}
              </div>
              
              {isAnalyzing ? (
                <div className="space-y-5">
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="skeleton w-4 h-4 rounded" />
                      <div className="skeleton h-3 w-20 rounded" />
                    </div>
                    <div className="skeleton h-5 w-full rounded mb-2" />
                    <div className="skeleton h-5 w-4/5 rounded" />
                  </div>
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="skeleton h-3 w-12 rounded mb-2" />
                        <div className="skeleton h-10 w-16 rounded" />
                      </div>
                      <div className="skeleton h-6 w-20 rounded-full" />
                    </div>
                    <div className="skeleton h-2 w-full rounded-full" />
                  </div>
                  <div className="glass-card p-5">
                    <div className="skeleton h-4 w-24 rounded mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <div className="skeleton h-3 w-10 rounded" />
                          <div className="skeleton h-3 w-6 rounded" />
                        </div>
                        <div className="skeleton h-2 w-full rounded-full" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <div className="skeleton h-3 w-10 rounded" />
                          <div className="skeleton h-3 w-6 rounded" />
                        </div>
                        <div className="skeleton h-2 w-full rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-5">
                    <div className="skeleton h-4 w-24 rounded mb-3" />
                    <div className="skeleton h-3 w-full rounded mb-2" />
                    <div className="skeleton h-3 w-5/6 rounded" />
                  </div>
                  <div className="glass-card p-5">
                    <div className="flex flex-wrap gap-2">
                      <div className="skeleton h-7 w-16 rounded-full" />
                      <div className="skeleton h-7 w-20 rounded-full" />
                      <div className="skeleton h-7 w-14 rounded-full" />
                    </div>
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  {analysis.mirror_insight && (
                    <div className="relative glass-card border border-amber-300 p-6 bg-gradient-to-br from-amber-50 via-amber-50 to-transparent animate-scale-in overflow-hidden">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -top-2 -left-2 text-6xl text-amber-200 font-serif select-none pointer-events-none">"</div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-500 text-sm font-medium tracking-wider uppercase">镜中洞察</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
                        </div>
                        <p className="text-gray-900 text-lg italic leading-relaxed font-light">{analysis.mirror_insight}</p>
                      </div>
                    </div>
                  )}

                  <div className={`glass-card p-5 sm:p-6 bg-gradient-to-br ${getDiscrepancyBg(analysis.discrepancy_score)} card-enter relative overflow-hidden group`}>
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary-50 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700 pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <span className="text-gray-500 text-sm font-medium">偏差值</span>
                        <h4 className="text-5xl font-bold mt-1 tabular-nums">
                          <span className={getDiscrepancyColor(analysis.discrepancy_score)}>
                            <AnimatedNumber value={analysis.discrepancy_score} />
                          </span>
                          <span className="text-gray-400 text-lg ml-1 font-normal">/ 100</span>
                        </h4>
                      </div>
                      <div className="relative">
                        <MiniRing
                          value={analysis.discrepancy_score}
                          size={64}
                          strokeWidth={5}
                          color={analysis.discrepancy_score > 70 ? "#ef4444" : analysis.discrepancy_score > 40 ? "#eab308" : "#22c55e"}
                          label={analysis.discrepancy_score.toString()}
                        />
                      </div>
                    </div>
                    <div className="mt-5 h-2.5 bg-gray-200 rounded-full overflow-hidden relative z-10">
                      <div
                        className={`h-full transition-all duration-1000 ease-out rounded-full sweep-effect ${
                          analysis.discrepancy_score > 70 ? "bg-gradient-to-r from-red-500 to-red-400" :
                          analysis.discrepancy_score > 40 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                          "bg-gradient-to-r from-green-500 to-green-400"
                        }`}
                        style={{ width: `${analysis.discrepancy_score}%` }}
                      />
                    </div>
                  </div>

                  {analysis.emotion_dimensions && (
                    <div className="glass-card p-5 sm:p-6 card-enter relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-full blur-2xl pointer-events-none" />
                      <h4 className="text-gray-900 font-medium mb-5 flex items-center gap-2 relative">
                        <Activity className="w-5 h-5 text-primary-500" />
                        情绪维度
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative stagger-enter">
                        {Object.entries(analysis.emotion_dimensions).map(([key, value]) => {
                          const val = value as number;
                          const labels: Record<string, string> = {
                            energy: "能量", anxiety: "焦虑", happiness: "幸福",
                            calmness: "平静", motivation: "动力", confidence: "自信"
                          };
                          const colors: Record<string, { gradient: string; color: string }> = {
                            energy: { gradient: "from-yellow-500 to-orange-500", color: "#f97316" },
                            anxiety: { gradient: "from-red-500 to-rose-500", color: "#ef4444" },
                            happiness: { gradient: "from-green-500 to-emerald-500", color: "#22c55e" },
                            calmness: { gradient: "from-cyan-500 to-blue-500", color: "#06b6d4" },
                            motivation: { gradient: "from-orange-500 to-amber-500", color: "#f59e0b" },
                            confidence: { gradient: "from-purple-500 to-violet-500", color: "#a855f7" }
                          };
                          const emotion = colors[key] || { gradient: "from-gray-500 to-gray-400", color: "#6b7280" };
                          return (
                            <div
                              key={key}
                              className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
                            >
                              <div className="flex items-center gap-2.5 mb-2.5">
                                <MiniRing
                                  value={val}
                                  size={40}
                                  strokeWidth={3.5}
                                  color={emotion.color}
                                  label={Math.round(val).toString()}
                                />
                                <div>
                                  <span className="text-sm text-gray-900 font-medium block">{labels[key] || key}</span>
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

                  <div className="glass-card glass-card-hover p-5 sm:p-6 transition-all duration-300 card-enter border-l-2 border-l-blue-500/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-500" />
                      </div>
                      <h4 className="text-blue-500 font-medium">理想自我</h4>
                    </div>
                    <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{analysis.ideal_self}</p>
                  </div>

                  <div className="glass-card glass-card-hover p-5 sm:p-6 transition-all duration-300 card-enter border-l-2 border-l-pink-500/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-500" />
                      </div>
                      <h4 className="text-pink-500 font-medium">现实自我</h4>
                    </div>
                    <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{analysis.actual_self}</p>
                  </div>

                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <div className="glass-card p-5 sm:p-6 card-enter">
                      <h4 className="text-gray-900 font-medium mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-500" />
                        你的优势
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.strengths.map((s, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full bg-green-50 text-green-500 text-sm border border-green-200 hover:bg-green-100 hover:border-green-300 hover:scale-105 transition-all duration-200 cursor-default">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.growth_areas && analysis.growth_areas.length > 0 && (
                    <div className="glass-card p-5 sm:p-6 card-enter">
                      <h4 className="text-gray-900 font-medium mb-3 flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-orange-500" />
                        成长点
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.growth_areas.map((g, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-500 text-sm border border-orange-200 hover:bg-orange-100 hover:border-orange-300 hover:scale-105 transition-all duration-200 cursor-default">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.personality_traits && analysis.personality_traits.length > 0 && (
                    <div className="glass-card p-5 sm:p-6 card-enter">
                      <h4 className="text-gray-900 font-medium mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        人格特质
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.personality_traits.map((t, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-500 text-sm border border-purple-200 hover:bg-purple-100 hover:border-purple-300 hover:scale-105 transition-all duration-200 cursor-default">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="glass-card glass-card-hover p-5 sm:p-6 transition-all duration-300 card-enter bg-gradient-to-br from-primary-50 to-transparent border-l-2 border-l-primary-500">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center glow-accent">
                        <TrendingUp className="w-5 h-5 text-primary-600" />
                      </div>
                      <h4 className="text-primary-600 font-medium">行动建议</h4>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center ring-2 ring-primary-200">
                        <span className="text-primary-600 font-bold text-sm">{analysis.location_keyword}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium mb-2 leading-relaxed">{analysis.suggested_action}</p>
                        <p className="text-gray-500 text-sm flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary-600/70" />
                          建议前往：{analysis.location_keyword}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 animate-fade-in">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-100 to-primary-100 animate-pulse-glow" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-200 to-primary-200 flex items-center justify-center animate-float">
                      <Sparkles className="w-10 h-10 text-primary-600/70" />
                    </div>
                  </div>
                  <h4 className="text-gray-900 text-lg font-medium mb-2">等待分析</h4>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">填写日记内容并提交，AI 将帮你分析理想与现实的差距</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
