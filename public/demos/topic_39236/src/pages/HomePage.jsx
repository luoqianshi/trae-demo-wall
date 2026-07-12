import { useState, useEffect } from "react";
import { Sparkles, Play, Pause, RefreshCw, Calendar, Clock, MapPin } from "lucide-react";
import useAppStore from "../store/appStore";
import PlanNodeCard from "../components/PlanNodeCard";
import DeviceStatusBar from "../components/DeviceStatusBar";

export default function HomePage() {
	const { aiPlan, currentPhase, currentNode, completedNodes, pendingNodes, isGeneratingPlan, planGenerationStep, generateAIPlan, completeNode, resetApp } = useAppStore();

	const [currentTime, setCurrentTime] = useState(new Date());
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	// 自动播放演示模式
	useEffect(() => {
		if (isPlaying && currentNode && !isGeneratingPlan) {
			const timer = setTimeout(() => {
				completeNode(currentNode.id);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [isPlaying, currentNode, completeNode, isGeneratingPlan]);

	const handleGeneratePlan = () => {
		generateAIPlan("明天上午10点去税务局办业务，下午3点开会");
	};

	const handleReset = () => {
		resetApp();
		setIsPlaying(false);
	};

	const allNodes = [...completedNodes, currentNode, ...pendingNodes].filter(Boolean);

	return (
		<div className="min-h-screen bg-bg-primary pb-24">
			<DeviceStatusBar />

			<header className="p-4 pt-12">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h1 className="text-xl font-bold text-white">智能管家</h1>
						<div className="flex items-center gap-2 text-sm text-gray-400">
							<Calendar size={16} />
							<span>{currentTime.toLocaleDateString("zh-CN")}</span>
						</div>
					</div>
					<div className="text-right">
						<div className="text-2xl font-bold text-white font-tabular">{currentTime.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</div>
						<div className="flex items-center gap-1 text-xs text-gray-500">
							<Clock size={12} />
							<span>{currentTime.getSeconds()}s</span>
						</div>
					</div>
				</div>

				{/* 阶段状态 */}
				<div className="flex items-center gap-2">
					<span className={`px-3 py-1 rounded-full text-xs font-medium ${currentPhase === "planning" ? "bg-yellow-500/20 text-yellow-400" : currentPhase === "executing" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
						{currentPhase === "planning" ? "📝 规划中" : currentPhase === "executing" ? "▶️ 执行中" : "✅ 已完成"}
					</span>
					{aiPlan && <span className="text-xs text-gray-500">今日计划：{allNodes.length}个节点</span>}
				</div>
			</header>

			<main className="px-4 space-y-6">
				{/* 未生成计划时显示生成按钮 */}
				{!aiPlan && (
					<div className="flex items-center justify-center min-h-[60vh]">
						{isGeneratingPlan ? (
							<div className="text-center">
								<LoadingAnimation step={planGenerationStep} />
							</div>
						) : (
							<button
								onClick={handleGeneratePlan}
								className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white font-medium flex flex-col items-center justify-center gap-3 hover:scale-105 transition-all duration-300 active:scale-95 shadow-lg shadow-primary/30"
							>
								<Sparkles size={48} className="animate-pulse" />
								<span className="text-lg">生成明日计划</span>
								<span className="text-xs opacity-80">点击开始</span>
							</button>
						)}
					</div>
				)}

				{/* 已生成计划时显示时间轴 */}
				{aiPlan && (
					<>
						{/* 计划概览 */}
						<div className="p-4 bg-card rounded-card border border-card-border">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-white font-medium">明日计划概览</h3>
									<p className="text-sm text-gray-400">{aiPlan.date}</p>
								</div>
								<div className="flex items-center gap-4">
									<div className="text-center">
										<div className="text-lg font-bold text-primary font-tabular">{aiPlan.summary.totalNodes}</div>
										<div className="text-xs text-gray-500">节点</div>
									</div>
									<div className="text-center">
										<div className="text-lg font-bold text-danger font-tabular">{aiPlan.summary.criticalEvents}</div>
										<div className="text-xs text-gray-500">重要</div>
									</div>
									<div className="text-center">
										<div className="text-lg font-bold text-green-400 font-tabular">{completedNodes.length}</div>
										<div className="text-xs text-gray-500">已完成</div>
									</div>
								</div>
							</div>

							{/* 天气信息 */}
							<div className="flex items-center gap-4 mt-3 pt-3 border-t border-card-border">
								<span className="text-2xl">🌤️</span>
								<span className="text-white">{aiPlan.weather}</span>
								<span className="text-gray-400">{aiPlan.temperature}°C</span>
								<span className="text-xs text-gray-500 ml-auto">{aiPlan.summary.estimatedDuration}</span>
							</div>
						</div>

						{/* 当前节点高亮 */}
						{currentNode && (
							<div className="p-4 bg-gradient-to-r from-primary/30 to-primary/10 rounded-card border border-primary/50">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center animate-pulse-custom">
										<Clock size={24} className="text-primary" />
									</div>
									<div className="flex-1">
										<div className="text-xs text-primary">当前节点</div>
										<h3 className="text-white font-medium">
											{currentNode.time} {currentNode.title}
										</h3>
										<p className="text-sm text-gray-400">{currentNode.reminder?.display}</p>
									</div>
									<button onClick={() => completeNode(currentNode.id)} className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-all">
										完成
									</button>
								</div>
							</div>
						)}

						{/* 时间轴 */}
						<div className="space-y-3">
							<h3 className="text-white font-medium flex items-center gap-2">
								<MapPin size={18} className="text-primary" />
								今日时间轴
							</h3>
							{allNodes.map((node) => (
								<PlanNodeCard key={node.id} node={node} isCurrent={currentNode?.id === node.id} isCompleted={completedNodes.some((n) => n.id === node.id)} onComplete={completeNode} />
							))}
						</div>
					</>
				)}
			</main>
		</div>
	);
}

// 加载动画组件
function LoadingAnimation({ step }) {
	const steps = [
		{ text: "正在分析日程...", color: "text-primary" },
		{ text: "正在推算节点...", color: "text-green-400" },
		{ text: "正在生成提醒...", color: "text-yellow-400" },
		{ text: "计划生成完成！", color: "text-green-500" },
	];

	return (
		<div className="flex flex-col items-center">
			<div className="relative w-16 h-16 mb-4">
				<div className={`absolute inset-0 rounded-full ${step === 0 ? "bg-primary/20" : step === 1 ? "bg-green-500/20" : step === 2 ? "bg-yellow-500/20" : "bg-green-500/20"} animate-pulse-custom`} />
				<div className="absolute inset-0 flex items-center justify-center">
					<div className={`w-8 h-8 rounded-full ${step === 0 ? "bg-primary" : step === 1 ? "bg-green-500" : step === 2 ? "bg-yellow-500" : "bg-green-500"} flex items-center justify-center`}>
						<Sparkles size={16} className="text-white" />
					</div>
				</div>
			</div>
			<p className={`text-lg font-medium ${steps[step]?.color || "text-white"}`}>{steps[step]?.text}</p>
			<div className="flex gap-2 mt-4">
				{steps.map((_, i) => (
					<div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= step ? (i === 0 ? "bg-primary" : i === 1 ? "bg-green-500" : i === 2 ? "bg-yellow-500" : "bg-green-500") : "bg-gray-600"}`} />
				))}
			</div>
		</div>
	);
}
