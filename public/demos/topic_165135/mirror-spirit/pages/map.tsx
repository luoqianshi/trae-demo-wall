import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Target, CheckCircle, Clock, Navigation, Sparkles, Activity, ChevronRight } from "lucide-react";
import Nav from "../components/Navigation";
import MiniRing from "../components/MiniRing";
import useCountUp from "../hooks/useCountUp";
import { generateSpatialPlan, uploadHardwareData, HardwareUploadRequest, SpatialPlanResponse } from "../lib/api";

// 动态导入 MapView，禁用 SSR 以避免 Leaflet window 未定义错误
const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">地图加载中...</span>
      </div>
    </div>
  ),
});

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const count = useCountUp(value, duration);
  return <span className="tabular-nums">{count}</span>;
}

export default function MapPage() {
  const [spatialPlan, setSpatialPlan] = useState<SpatialPlanResponse | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([39.9042, 116.4074]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    generateInitialPlan();
  }, []);

  const generateInitialPlan = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateSpatialPlan(55, "书店", userLocation[0], userLocation[1]);
      setSpatialPlan(plan);
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const simulateHardwareUpload = async () => {
    setIsUploading(true);
    try {
      const hardwareData: HardwareUploadRequest = {
        timestamp: new Date().toISOString(),
        gps_latitude: userLocation[0],
        gps_longitude: userLocation[1],
        audio_transcript: "我今天感觉压力很大，需要放松一下",
        description_text: "坐在办公室里，窗外是灰蒙蒙的天空",
      };

      const result = await uploadHardwareData(hardwareData);
      setSpatialPlan(result.spatial_plan);
    } catch (error) {
      console.error("Hardware upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-50 border-red-200";
      case "medium": return "bg-orange-50 border-orange-200";
      case "low": return "bg-green-50 border-green-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-orange-500";
      case "low": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  const calculateDistance = (lat: number, lng: number) => {
    const R = 6371;
    const dLat = (lat - userLocation[0]) * Math.PI / 180;
    const dLng = (lng - userLocation[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = R * c;
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  const renderSidebarContent = () => (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl p-4 card-enter border border-gray-200 bg-gradient-to-br from-blue-500/15 via-blue-500/20 to-blue-500/10">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/25 flex items-center justify-center ring-1 ring-blue-400/40">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <span className="text-gray-900 font-medium">当前位置</span>
              <p className="text-gray-500 text-xs mt-0.5 font-mono">{userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-3 h-3" />
              北京市
            </span>
            <span className="flex items-center gap-1.5 text-blue-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              定位中
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={simulateHardwareUpload}
        disabled={isUploading}
        className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 card-enter"
      >
        {isUploading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Navigation className="w-5 h-5" />
        )}
        {isUploading ? "同步中..." : "模拟硬件上传"}
      </button>

      {spatialPlan && (
        <>
          <div className="glass-card p-4 card-enter group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary-50 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700 pointer-events-none" />
            <div className="flex items-center justify-between relative">
              <div>
                <span className="text-gray-500 text-sm">偏差值</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-2xl font-bold tabular-nums ${
                    spatialPlan.discrepancy_score > 70 ? "text-red-500" :
                    spatialPlan.discrepancy_score > 40 ? "text-orange-500" : "text-green-500"
                  }`}>
                    <AnimatedNumber value={spatialPlan.discrepancy_score} />
                  </span>
                  <span className="text-gray-400 text-sm">/ 100</span>
                </div>
              </div>
              <MiniRing
                value={spatialPlan.discrepancy_score}
                size={48}
                strokeWidth={4}
                color={spatialPlan.discrepancy_score > 70 ? "#ef4444" : spatialPlan.discrepancy_score > 40 ? "#f97316" : "#22c55e"}
                label={spatialPlan.discrepancy_score.toString()}
              />
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out sweep-effect ${
                  spatialPlan.discrepancy_score > 70 ? "bg-gradient-to-r from-red-500 to-red-400" :
                  spatialPlan.discrepancy_score > 40 ? "bg-gradient-to-r from-orange-500 to-orange-400" :
                  "bg-gradient-to-r from-green-500 to-green-400"
                }`}
                style={{ width: `${spatialPlan.discrepancy_score}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-600" />
                任务列表
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary-100 text-primary-600 font-medium">
                {spatialPlan.tasks.length} 个任务
              </span>
            </div>

            {spatialPlan.tasks.map((task, index) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 card-enter glass-card-hover ${
                  selectedTask === task.id
                    ? "bg-primary-100 border-primary-500 shadow-lg shadow-primary-500/30 glow-accent"
                    : `${getPriorityBg(task.priority)} hover:scale-[1.02] hover:shadow-md`
                }`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex items-start justify-between mb-2.5 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ${
                      task.priority === "high" ? "bg-red-500/20 ring-red-500/40" :
                      task.priority === "medium" ? "bg-orange-500/20 ring-orange-500/40" :
                      "bg-green-500/20 ring-green-500/40"
                    }`}>
                      <MapPin className={`w-4 h-4 ${getPriorityTextColor(task.priority)}`} />
                    </div>
                    <span className="text-gray-900 font-semibold truncate">{task.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${selectedTask === task.id ? "rotate-90 text-primary-600" : "text-gray-400"}`} />
                </div>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 ${getPriorityTextColor(task.priority)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                    {task.priority === "high" ? "高优先" : task.priority === "medium" ? "中优先" : "低优先"}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-3 h-3" />
                    {task.suggested_duration}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Navigation className="w-3 h-3" />
                    {calculateDistance(task.latitude, task.longitude)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!spatialPlan && isGenerating && (
        <div className="space-y-3 animate-fade-in">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-12" />
            </div>
            <div className="skeleton h-2 w-full rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton h-4 w-28" />
              </div>
              <div className="skeleton h-3 w-full mb-2" />
              <div className="skeleton h-3 w-2/3 mb-3" />
              <div className="flex gap-2">
                <div className="skeleton h-5 w-14 rounded-md" />
                <div className="skeleton h-5 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!spatialPlan && !isGenerating && (
        <div className="text-center py-10 card-enter">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-4 ring-1 ring-gray-200">
            <Sparkles className="w-9 h-9 text-primary-600" />
          </div>
          <p className="text-gray-900 font-medium mb-1">暂无任务数据</p>
          <p className="text-gray-400 text-sm">点击上方按钮同步硬件数据</p>
        </div>
      )}

      {spatialPlan && spatialPlan.tasks.length === 0 && (
        <div className="text-center py-8 card-enter">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">暂无推荐任务</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      <Nav />

      <div className="flex-1 flex">
        {/* 桌面侧边栏 */}
        <div className="hidden lg:block w-80 glass-card m-4 ml-6 mr-2 p-6 overflow-y-auto h-[calc(100vh-8rem)]" style={{ overflowY: 'auto' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 flex items-center justify-center shadow-lg glow-accent">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">成长任务地图</h2>
              <p className="text-gray-400 text-xs">探索你的成长路径</p>
            </div>
          </div>
          {renderSidebarContent()}
        </div>

        {/* 地图区域 */}
        <div className="flex-1 relative">
          <div className="absolute top-4 left-4 z-[1000] glass-card px-3 py-3 flex flex-col gap-2 animate-fade-in">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-1 mb-0.5">图例</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span className="text-xs text-gray-900">我的位置</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="text-xs text-gray-900">高优先级</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <span className="text-xs text-gray-900">中优先级</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-xs text-gray-900">低优先级</span>
            </div>
          </div>

          <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 shadow-mirror ring-1 ring-gray-100">
            <MapView
              spatialPlan={spatialPlan}
              userLocation={userLocation}
              selectedTask={selectedTask}
              onSelectTask={(id) => setSelectedTask(id)}
            />
          </div>

          {/* 移动端打开侧边栏按钮 */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden fixed bottom-5 right-5 z-[1000] w-14 h-14 rounded-full btn-primary flex items-center justify-center shadow-xl"
            aria-label="打开任务列表"
          >
            <MapPin className="w-6 h-6" />
            {spatialPlan && spatialPlan.tasks.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                {spatialPlan.tasks.length}
              </span>
            )}
          </button>
        </div>

        {/* 移动端侧边栏抽屉 */}
        {isMobileSidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <aside className="lg:hidden fixed top-16 left-0 bottom-0 w-[85vw] max-w-sm z-50 glass-card rounded-none rounded-r-2xl p-5 overflow-y-auto animate-slide-left" style={{ overflowY: 'auto' }}>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                  aria-label="关闭"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 flex items-center justify-center shadow-lg glow-accent">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">成长任务地图</h2>
                  <p className="text-gray-400 text-xs">探索你的成长路径</p>
                </div>
              </div>
              {renderSidebarContent()}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
