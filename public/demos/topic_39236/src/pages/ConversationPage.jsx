import { useState, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";
import useAppStore from "../store/appStore";
import TaskCard from "../components/TaskCard";

// 随机任务模板生成器
const generateRandomTask = (id) => {
	const titles = ["超市购物", "图书馆借书", "银行办理业务", "朋友聚会", "咖啡馆工作", "公园散步", "医院复诊", "快递取件", "洗车保养", "理发", "参加培训", "购买车票", "参观展览", "宠物看病", "整理房间"];

	const locations = ["", "附近超市", "市图书馆", "工商银行", "步行街餐厅", "星巴克", "中央公园", "社区医院", "快递柜", "洗车店", "理发店", "培训中心", "展览馆", "宠物医院", "家中"];

	const times = ["今天 10:00 - 11:00", "今天 15:00 - 16:30", "明天 09:00 - 10:30", "明天 14:00 - 15:00", "后天 11:00 - 12:00", "周五 16:00 - 17:30", "周六 09:30 - 11:00", "周日 14:00 - 16:00"];

	const itemLists = [[], ["钱包", "手机"], ["笔记本", "笔", "资料"], ["购物清单", "环保袋"], ["银行卡", "身份证"], ["雨伞", "充电宝"]];

	const travelOptions = [
		{ visible: false },
		{ visible: true, transit: "步行", duration: "15分钟", distance: "1公里", weather: "晴", temperature: "25°C", traffic: "畅通" },
		{ visible: true, transit: "地铁", duration: "25分钟", distance: "4公里", weather: "多云", temperature: "23°C", traffic: "畅通" },
		{ visible: true, transit: "驾车", duration: "20分钟", distance: "5公里", weather: "晴", temperature: "26°C", traffic: "轻微拥堵" },
	];

	const priorityOptions = ["high", "medium", "low"];

	const randomIndex = (arr) => arr[Math.floor(Math.random() * arr.length)];

	const title = randomIndex(titles);
	const location = randomIndex(locations);
	const time = randomIndex(times);
	const items = randomIndex(itemLists);
	const travel = randomIndex(travelOptions);
	const priority = randomIndex(priorityOptions);

	return {
		id: id,
		title: title,
		time: time,
		location: location,
		priority: priority,
		subCards: {
			travel: travel,
			items: { visible: items.length > 0, list: items },
			notes: { visible: false, content: [] },
		},
	};
};

export default function ConversationPage() {
	const { conversations } = useAppStore();
	const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
	const [isRecording, setIsRecording] = useState(false);
	const [recordedText, setRecordedText] = useState("");
	const [generatedCards, setGeneratedCards] = useState([]);
	const [showCards, setShowCards] = useState(false);
	const [taskIdCounter, setTaskIdCounter] = useState(100); // 从100开始，避免与预设对话冲突
	const recordingInterval = useRef(null);
	const recordedTextRef = useRef("");

	// 获取当前对话，支持循环使用预设对话并随机生成新对话
	const getCurrentConversation = () => {
		if (currentConversationIndex < conversations.length) {
			return conversations[currentConversationIndex];
		}
		// 超出预设对话范围时，随机生成新对话
		const randomTask = generateRandomTask(taskIdCounter);
		return {
			id: taskIdCounter,
			userInput: generateRandomUserInput(randomTask),
			aiResponse: `好的，已为您记录：${randomTask.title}。`,
			task: randomTask,
		};
	};

	// 根据任务生成随机用户输入
	const generateRandomUserInput = (task) => {
		const inputTemplates = [
			`${task.time.split(" ")[0]}${task.time.split(" ")[1]}去${task.location || "办事"}`,
			`${task.time.split(" ")[0]}${task.time.split(" ")[1]}${task.location ? "在" + task.location : ""}${task.title}`,
			`${task.title}，${task.time.split(" ")[0]}${task.time.split(" ")[1]}`,
			`${task.time.split(" ")[0]}${task.time.split(" ")[1]}需要${task.title}`,
		];
		return randomIndex(inputTemplates);
	};

	const randomIndex = (arr) => arr[Math.floor(Math.random() * arr.length)];

	const currentConversation = getCurrentConversation();

	const handleVoiceInput = () => {
		setIsRecording(!isRecording);

		if (!isRecording) {
			setRecordedText("");
			recordedTextRef.current = "";
			let chars = currentConversation.userInput;
			let index = 0;

			recordingInterval.current = setInterval(() => {
				if (index < chars.length) {
					const newChar = chars[index];
					setRecordedText((prev) => {
						const updated = prev + newChar;
						recordedTextRef.current = updated;
						return updated;
					});
					index++;
				} else {
					clearInterval(recordingInterval.current);
				}
			}, 80);

			setTimeout(
				() => {
					if (recordingInterval.current) {
						clearInterval(recordingInterval.current);
					}
					setIsRecording(false);
					setShowCards(true);
					setGeneratedCards((prev) => [...prev, currentConversation.task]);
					setCurrentConversationIndex((prev) => prev + 1);
					// 如果超出预设对话范围，增加任务ID计数器
					if (currentConversationIndex >= conversations.length - 1) {
						setTaskIdCounter((prev) => prev + 1);
					}
				},
				chars.length * 80 + 500,
			);
		} else {
			if (recordingInterval.current) {
				clearInterval(recordingInterval.current);
			}
			setIsRecording(false);
			setShowCards(true);
			setGeneratedCards((prev) => [...prev, currentConversation.task]);
			setCurrentConversationIndex((prev) => prev + 1);
			if (currentConversationIndex >= conversations.length - 1) {
				setTaskIdCounter((prev) => prev + 1);
			}
		}
	};

	// 是否显示底部固定录音按钮（添加第一个后始终显示）
	const showBottomButton = generatedCards.length > 0;

	return (
		<div className="min-h-screen bg-bg-primary">
			{/* 顶部标题栏 */}
			<header className="p-4 pt-12">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold text-white">智能管家</h1>
						<p className="text-sm text-gray-400 mt-1">语音对话 · 智能规划</p>
					</div>
					<button className="w-10 h-10 rounded-full bg-card border border-card-border flex items-center justify-center">
						<Volume2 size={18} className="text-primary" />
					</button>
				</div>
			</header>

			<main className={`px-4 space-y-4 ${showBottomButton ? "pb-36" : "pb-32"}`}>
				{/* 第一个对话的大麦克风 */}
				{!isRecording && generatedCards.length === 0 && (
					<div className="flex flex-col items-center justify-center py-20">
						<button
							onClick={handleVoiceInput}
							className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isRecording ? "bg-danger scale-110 shadow-danger/40" : "bg-primary hover:scale-105 shadow-primary/40"}`}
						>
							<Mic size={56} className="text-white" />
						</button>
						<h2 className="text-white text-lg font-medium mt-6">开始语音规划</h2>
						<p className="text-gray-400 text-sm mt-2">点击麦克风开始录音</p>
					</div>
				)}

				{/* 已生成的任务卡片 - 放在录音组件上方 */}
				{showCards && generatedCards.length > 0 && (
					<div className="space-y-4">
						{generatedCards.map((task, index) => (
							<TaskCard key={task.id} task={task} animateIn={true} style={{ animationDelay: `${index * 200}ms` }} />
						))}
					</div>
				)}

				{/* 录音内容显示 - 放在卡片下方 */}
				{isRecording && (
					<div className="p-4 bg-card rounded-card border border-primary/50 animate-pulse">
						<div className="flex items-center gap-2 mb-2">
							<div className="w-2 h-2 rounded-full bg-danger animate-ping" />
							<span className="text-sm text-danger">正在录音...</span>
						</div>
						<div className="text-white text-lg min-h-[60px] bg-bg-primary p-3 rounded-lg">{recordedText || "正在识别语音..."}</div>
						<div className="flex justify-center gap-1 mt-3">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<div
									key={i}
									className="w-1.5 bg-primary rounded-full animate-wave"
									style={{
										height: `${12 + Math.sin(Date.now() / 200 + i) * 8}px`,
									}}
								/>
							))}
						</div>
					</div>
				)}
			</main>

			{/* 底部固定录音按钮 - 添加第一个任务后始终显示 */}
			{showBottomButton && (
				<div className="fixed bottom-20 left-0 right-0 max-w-[428px] mx-auto z-40">
					<div className="flex items-center justify-center">
						<button
							onClick={handleVoiceInput}
							className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isRecording ? "bg-danger scale-110 shadow-danger/40" : "bg-primary hover:scale-105 shadow-primary/40"}`}
						>
							<Mic size={28} className="text-white" />
						</button>
					</div>
					<p className="text-center text-gray-500 text-xs mt-2">{isRecording ? "正在录音..." : "继续添加任务"}</p>
				</div>
			)}
		</div>
	);
}
