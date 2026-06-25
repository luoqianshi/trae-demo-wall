import { create } from "zustand";

const useAppStore = create((set) => ({
	// 应用状态
	currentPhase: "planning", // planning, executing, completed
	currentScene: "home", // home, commuting, office, evening

	// AI规划结果
	aiPlan: null,
	isGeneratingPlan: false,
	planGenerationStep: 0,

	// 执行状态
	currentNode: null,
	completedNodes: [],
	pendingNodes: [],

	// 对话记录
	conversationHistory: [
		{
			id: 1,
			type: "ai",
			content: "晚上好，主人！明天有什么重要安排吗？",
			timestamp: new Date().toISOString(),
			phase: "planning",
		},
	],

	// 提炼后的数据
	extractedData: null,

	// 对话记录 - 预设的对话模板（用于随机生成）
	conversations: [
		{
			id: 1,
			userInput: "明天上午10点去税务局办业务，需要携带身份证和相关材料",
			aiResponse: "好的，已为您记录：明天上午10点去税务局办理业务，需要携带身份证和相关材料。",
			task: {
				id: 1,
				title: "税务局办业务",
				time: "明天 10:00 - 11:00",
				location: "税务局",
				priority: "high",
				subCards: {
					travel: { visible: false },
					items: { visible: true, list: ["身份证", "相关材料"] },
					notes: { visible: false, content: [] },
				},
			},
		},
		{
			id: 2,
			userInput: "下午3点有个项目会议，需要准备PPT和笔记本电脑",
			aiResponse: "收到！已为您创建会议提醒：下午3点参加项目会议。",
			task: {
				id: 2,
				title: "项目会议",
				time: "15:00 - 16:00",
				location: "",
				priority: "medium",
				subCards: {
					travel: { visible: false },
					items: { visible: true, list: ["PPT", "笔记本电脑"] },
					notes: { visible: false, content: [] },
				},
			},
		},
		{
			id: 3,
			userInput: "明天下午2点去科技园A座拜访客户，需要带上产品资料和合同",
			aiResponse: "好的，已为您安排：明天下午2点前往科技园A座拜访客户。",
			task: {
				id: 3,
				title: "拜访客户",
				time: "明天 14:00 - 15:30",
				location: "科技园A座",
				priority: "high",
				subCards: {
					travel: { visible: true, transit: "地铁1号线", duration: "30分钟", distance: "5公里", weather: "晴", temperature: "26°C", traffic: "畅通" },
					items: { visible: true, list: ["产品资料", "合同草案", "名片"] },
					notes: { visible: true, content: ["客户关注价格方案", "准备演示产品功能"] },
				},
			},
		},
		{
			id: 4,
			userInput: "今晚7点和朋友去看电影，在市中心影院",
			aiResponse: "已记录！今晚7点在市中心影院观看电影。",
			task: {
				id: 4,
				title: "观看电影",
				time: "今天 19:00 - 21:30",
				location: "市中心影院",
				priority: "low",
				subCards: {
					travel: { visible: true, transit: "地铁2号线", duration: "20分钟", distance: "3公里", weather: "多云", temperature: "24°C", traffic: "畅通" },
					items: { visible: false, list: [] },
					notes: { visible: false, content: [] },
				},
			},
		},
		{
			id: 5,
			userInput: "后天早上8点半要去医院体检，记得空腹",
			aiResponse: "好的，已为您设置提醒：后天早上8点半去医院体检，请记得空腹。",
			task: {
				id: 5,
				title: "医院体检",
				time: "后天 08:30 - 10:30",
				location: "市立医院",
				priority: "high",
				subCards: {
					travel: { visible: true, transit: "驾车", duration: "25分钟", distance: "6公里", weather: "晴", temperature: "22°C", traffic: "畅通" },
					items: { visible: true, list: ["身份证", "体检卡", "口罩"] },
					notes: { visible: true, content: ["请保持空腹状态", "建议提前15分钟到达"] },
				},
			},
		},
		{
			id: 6,
			userInput: "周五下午4点参加部门团建活动，地点在郊外农庄",
			aiResponse: "收到！周五下午4点参加部门团建活动，地点在郊外农庄。",
			task: {
				id: 6,
				title: "部门团建",
				time: "周五 16:00 - 20:00",
				location: "郊外农庄",
				priority: "medium",
				subCards: {
					travel: { visible: true, transit: "公司班车", duration: "40分钟", distance: "15公里", weather: "晴", temperature: "27°C", traffic: "畅通" },
					items: { visible: true, list: ["运动鞋", "防晒用品", "相机"] },
					notes: { visible: true, content: ["活动包含烧烤和户外游戏", "预计20:00返回"] },
				},
			},
		},
		{
			id: 7,
			userInput: "明天早上7点去健身房锻炼",
			aiResponse: "好的，已为您设置：明天早上7点去健身房锻炼。",
			task: {
				id: 7,
				title: "健身房锻炼",
				time: "明天 07:00 - 08:00",
				location: "小区健身房",
				priority: "low",
				subCards: {
					travel: { visible: false },
					items: { visible: true, list: ["运动服", "运动鞋", "水杯"] },
					notes: { visible: false, content: [] },
				},
			},
		},
		{
			id: 8,
			userInput: "周六上午10点参加技术分享会，需要准备演讲材料",
			aiResponse: "已记录！周六上午10点参加技术分享会，请提前准备演讲材料。",
			task: {
				id: 8,
				title: "技术分享会",
				time: "周六 10:00 - 12:00",
				location: "创新大厦B座会议室",
				priority: "high",
				subCards: {
					travel: { visible: true, transit: "地铁1号线", duration: "35分钟", distance: "8公里", weather: "多云", temperature: "25°C", traffic: "畅通" },
					items: { visible: true, list: ["笔记本电脑", "演示文稿", "投影设备"] },
					notes: { visible: true, content: ["演讲主题：React性能优化实践", "预计时长30分钟"] },
				},
			},
		},
	],

	// 设备状态
	devices: {
		bluetoothSpeaker: { connected: true, name: "智能音箱 Pro" },
		portableMic: { connected: true, name: "无线麦克风" },
	},

	// 设置
	settings: {
		voiceEnabled: true,
		bluetoothEnabled: true,
		reminderVolume: "medium",
		autoModeSwitch: true,
	},

	// 生成AI计划
	generateAIPlan: async (userInput) => {
		set({ isGeneratingPlan: true, planGenerationStep: 0 });

		// 模拟AI处理步骤
		await sleep(800);
		set({ planGenerationStep: 1 }); // 分析日程

		await sleep(800);
		set({ planGenerationStep: 2 }); // 推算节点

		await sleep(800);
		set({ planGenerationStep: 3 }); // 生成提醒

		await sleep(600);

		// 生成完整计划（这里模拟AI输出，实际应该调用AI API）
		const plan = generateMockPlan(userInput);

		set({
			aiPlan: plan,
			isGeneratingPlan: false,
			planGenerationStep: 0,
			currentPhase: "executing",
			currentNode: plan.nodes[0],
			pendingNodes: plan.nodes.slice(1),
			completedNodes: [],
		});

		// 添加AI回复到对话记录
		addAIMessage(`明白了！我已经为您生成了明天的完整计划，包含${plan.nodes.length}个关键节点。现在开始执行吧！`);
	},

	// 节点完成
	completeNode: (nodeId) => {
		set((state) => {
			const completedNode = state.pendingNodes.find((n) => n.id === nodeId) || state.currentNode;
			const newCompleted = [...state.completedNodes, completedNode];
			const newPending = state.pendingNodes.filter((n) => n.id !== nodeId);
			const nextNode = newPending[0] || null;

			return {
				completedNodes: newCompleted,
				pendingNodes: newPending,
				currentNode: nextNode,
				currentPhase: nextNode ? "executing" : "completed",
			};
		});
	},

	// 添加用户消息
	addUserMessage: (content) => {
		const message = {
			id: Date.now(),
			type: "user",
			content,
			timestamp: new Date().toISOString(),
			phase: useAppStore.getState().currentPhase,
		};
		set((state) => ({
			conversationHistory: [...state.conversationHistory, message],
		}));
	},

	// 添加AI消息
	addAIMessage: (content) => {
		const message = {
			id: Date.now(),
			type: "ai",
			content,
			timestamp: new Date().toISOString(),
			phase: useAppStore.getState().currentPhase,
		};
		set((state) => ({
			conversationHistory: [...state.conversationHistory, message],
		}));
	},

	// 添加新对话
	addConversation: (userInput, aiResponse, task) => {
		set((state) => {
			const newId = state.conversations.length + 1;
			return {
				conversations: [
					...state.conversations,
					{
						id: newId,
						userInput,
						aiResponse,
						task: {
							...task,
							id: newId,
						},
					},
				],
			};
		});
	},

	// 更新设备状态
	updateDevice: (deviceType, status) => {
		set((state) => ({
			devices: {
				...state.devices,
				[deviceType]: { ...state.devices[deviceType], ...status },
			},
		}));
	},

	// 更新设置
	updateSettings: (newSettings) => {
		set((state) => ({
			settings: { ...state.settings, ...newSettings },
		}));
	},

	// 切换场景
	switchScene: (scene) => {
		set({ currentScene: scene });
	},

	// 重置应用
	resetApp: () => {
		set({
			currentPhase: "planning",
			aiPlan: null,
			currentNode: null,
			completedNodes: [],
			pendingNodes: [],
			conversationHistory: [
				{
					id: 1,
					type: "ai",
					content: "晚上好，主人！明天有什么重要安排吗？",
					timestamp: new Date().toISOString(),
					phase: "planning",
				},
			],
		});
	},
}));

// 辅助函数
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// 模拟AI生成计划
function generateMockPlan(userInput) {
	// 根据用户输入生成不同的计划
	const basePlan = {
		date: new Date().toISOString().split("T")[0],
		weather: "晴",
		temperature: 18,
		nodes: [
			{
				id: 1,
				time: "07:30",
				title: "起床",
				type: "wake_up",
				icon: "AlarmClock",
				priority: "important",
				reminder: {
					voice: "早上好，主人！☀️ 今天天气晴，18°C，适合穿薄外套",
					display: "🌅 07:30 起床时间",
					actions: ["snooze", "dismiss", "prepare"],
				},
				checklist: [],
				status: "pending",
			},
			{
				id: 2,
				time: "07:45",
				title: "出门准备",
				type: "prepare",
				icon: "Package",
				priority: "normal",
				reminder: {
					voice: "主人，15分钟后出门，记得检查身份证和材料",
					display: "🚶 15分钟后出门",
					actions: ["confirm", "delay"],
				},
				checklist: ["身份证", "办理材料", "其他必需品"],
				status: "pending",
			},
			{
				id: 3,
				time: "08:00",
				title: "出门",
				type: "departure",
				icon: "DoorOpen",
				priority: "important",
				reminder: {
					voice: "该出门了，主人！今天推荐地铁出行，预计45分钟到达",
					display: "🚇 出门时间 - 推荐地铁",
					actions: ["depart", "delay"],
				},
				route: {
					recommended: "subway",
					options: [
						{ type: "subway", time: "45min", detail: "地铁1号线", recommend: true },
						{ type: "car", time: "55min", detail: "驾车（有拥堵）", recommend: false },
						{ type: "bike", time: "60min", detail: "骑行（小雨）", recommend: false },
					],
				},
				status: "pending",
			},
			{
				id: 4,
				time: "08:45",
				title: "到达附近",
				type: "arrival",
				icon: "MapPin",
				priority: "important",
				reminder: {
					voice: "主人，您已经到达税务局附近了！还有5分钟步行到办事大厅",
					display: "📍 已到达附近 - 步行5分钟",
					actions: ["navigate", "call"],
				},
				guidance: "进入大门后左转，3号窗口办理",
				status: "pending",
			},
			{
				id: 5,
				time: "09:50",
				title: "办理准备",
				type: "preparation",
				icon: "FileText",
				priority: "normal",
				reminder: {
					voice: "10分钟后开始办理业务，请准备好材料",
					display: "📋 10分钟后开始办理",
					actions: ["ready", "check"],
				},
				preparation: ["身份证", "办理材料", "排队号码"],
				status: "pending",
			},
			{
				id: 6,
				time: "10:00",
				title: "办理业务",
				type: "event",
				icon: "Building2",
				priority: "critical",
				reminder: {
					voice: "现在开始办理业务，请到3号窗口",
					display: "🏢 10:00 办理业务 - 3号窗口",
					actions: ["start", "reschedule"],
				},
				status: "pending",
			},
			{
				id: 7,
				time: "12:00",
				title: "午休",
				type: "break",
				icon: "Coffee",
				priority: "normal",
				reminder: {
					voice: "该午休了，主人！附近有几家不错的餐厅",
					display: "🍽️ 12:00 午休时间",
					actions: ["rest", "continue"],
				},
				status: "pending",
			},
			{
				id: 8,
				time: "14:50",
				title: "会议提醒",
				type: "meeting",
				icon: "Users",
				priority: "important",
				reminder: {
					voice: "主人，10分钟后有会议，记得带上PPT",
					display: "📅 15:00 会议 - 记得带PPT",
					actions: ["prepare", "remind"],
				},
				location: "3楼会议室A",
				materials: ["PPT", "笔记本", "笔"],
				status: "pending",
			},
			{
				id: 9,
				time: "15:00",
				title: "会议开始",
				type: "meeting",
				icon: "Presentation",
				priority: "important",
				reminder: {
					voice: "会议开始了，请到3楼会议室A",
					display: "📊 15:00 会议 - 3楼会议室A",
					actions: ["join", "late"],
				},
				status: "pending",
			},
			{
				id: 10,
				time: "18:00",
				title: "下班",
				type: "end_work",
				icon: "Home",
				priority: "normal",
				reminder: {
					voice: "下班时间到了，主人！今天辛苦了",
					display: "🏠 18:00 下班时间",
					actions: ["leave", "overtime"],
				},
				status: "pending",
			},
		],
		summary: {
			totalNodes: 10,
			criticalEvents: 1,
			importantReminders: 4,
			estimatedDuration: "10.5小时",
		},
	};

	return basePlan;
}

export default useAppStore;
