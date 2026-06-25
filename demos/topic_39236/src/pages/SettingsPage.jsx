import { Settings, Home, Building2, MapPin, Clock, Bell, Moon, Sun, Zap, Shield, HelpCircle, Info } from "lucide-react";
import useAppStore from "../store/appStore";

export default function SettingsPage() {
	const { settings, updateSettings } = useAppStore();

	const handleToggle = (key) => {
		updateSettings({ [key]: !settings[key] });
	};

	// 固定数据
	const fixedData = {
		homeAddress: {
			title: "家庭地址",
			address: "北京市朝阳区幸福小区3号楼1208室",
			icon: Home,
		},
		workAddress: {
			title: "公司地址",
			address: "北京市海淀区科技园区A座8层",
			icon: Building2,
		},
		workTime: {
			title: "工作时间",
			time: "周一至周五 09:00 - 18:00",
			icon: Clock,
		},
		emergencyContact: {
			title: "紧急联系人",
			name: "张经理",
			phone: "138-xxxx-xxxx",
			icon: Info,
		},
	};

	return (
		<div className="min-h-screen bg-bg-primary pt-14">
			{/* 头部 */}
			<header className="p-4 border-b border-card-border">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
						<Settings size={20} className="text-primary" />
					</div>
					<div>
						<h1 className="text-white font-medium">设置</h1>
						<p className="text-xs text-gray-500">个性化您的智能管家</p>
					</div>
				</div>
			</header>

			<main className="p-4 space-y-6">
				{/* 常用地址 */}
				<div className="bg-card rounded-card border border-card-border overflow-hidden">
					<div className="p-4 border-b border-card-border">
						<h3 className="text-white font-medium flex items-center gap-2">
							<MapPin size={18} className="text-primary" />
							常用地址
						</h3>
					</div>

					<div className="p-4 space-y-4">
						{[fixedData.homeAddress, fixedData.workAddress].map((item, index) => (
							<div key={index} className="flex items-start gap-3">
								<div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
									<item.icon size={18} className="text-primary" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-white font-medium">{item.title}</p>
									<p className="text-sm text-gray-400 truncate">{item.address}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* 个人信息 */}
				<div className="bg-card rounded-card border border-card-border overflow-hidden">
					<div className="p-4 border-b border-card-border">
						<h3 className="text-white font-medium flex items-center gap-2">
							<Info size={18} className="text-primary" />
							个人信息
						</h3>
					</div>

					<div className="p-4 space-y-4">
						{/* 工作时间 */}
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
								<fixedData.workTime.icon size={18} className="text-blue-400" />
							</div>
							<div>
								<p className="text-white font-medium">{fixedData.workTime.title}</p>
								<p className="text-sm text-gray-400">{fixedData.workTime.time}</p>
							</div>
						</div>

						{/* 紧急联系人 */}
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
								<fixedData.emergencyContact.icon size={18} className="text-green-400" />
							</div>
							<div>
								<p className="text-white font-medium">{fixedData.emergencyContact.title}</p>
								<p className="text-sm text-gray-400">
									{fixedData.emergencyContact.name} · {fixedData.emergencyContact.phone}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* 提醒设置 */}
				<div className="bg-card rounded-card border border-card-border overflow-hidden">
					<div className="p-4 border-b border-card-border">
						<h3 className="text-white font-medium flex items-center gap-2">
							<Bell size={18} className="text-primary" />
							提醒设置
						</h3>
					</div>

					<div className="p-4 space-y-4">
						{/* 语音提醒 */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
									<Bell size={18} className="text-primary" />
								</div>
								<div>
									<p className="text-white font-medium">语音提醒</p>
									<p className="text-xs text-gray-500">通过蓝牙音箱播放提醒</p>
								</div>
							</div>
							<button onClick={() => handleToggle("voiceEnabled")} className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.voiceEnabled ? "bg-primary" : "bg-gray-600"}`}>
								<div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.voiceEnabled ? "left-7" : "left-1"}`} />
							</button>
						</div>

						{/* 自动模式切换 */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
									<Zap size={18} className="text-yellow-500" />
								</div>
								<div>
									<p className="text-white font-medium">自动模式</p>
									<p className="text-xs text-gray-500">根据场景自动切换交互方式</p>
								</div>
							</div>
							<button onClick={() => handleToggle("autoModeSwitch")} className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.autoModeSwitch ? "bg-primary" : "bg-gray-600"}`}>
								<div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.autoModeSwitch ? "left-7" : "left-1"}`} />
							</button>
						</div>
					</div>
				</div>

				{/* 主题设置 */}
				<div className="bg-card rounded-card border border-card-border overflow-hidden">
					<div className="p-4 border-b border-card-border">
						<h3 className="text-white font-medium flex items-center gap-2">
							{settings.darkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
							主题设置
						</h3>
					</div>

					<div className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
									<Moon size={18} className="text-gray-400" />
								</div>
								<div>
									<p className="text-white font-medium">深色模式</p>
									<p className="text-xs text-gray-500">保护您的眼睛</p>
								</div>
							</div>
							<button onClick={() => handleToggle("darkMode")} className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.darkMode ? "bg-primary" : "bg-gray-600"}`}>
								<div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${settings.darkMode ? "left-7" : "left-1"}`} />
							</button>
						</div>
					</div>
				</div>

				{/* 关于 */}
				<div className="bg-card rounded-card border border-card-border overflow-hidden">
					<div className="p-4 border-b border-card-border">
						<h3 className="text-white font-medium flex items-center gap-2">
							<Shield size={18} className="text-primary" />
							关于
						</h3>
					</div>

					<div className="p-4 space-y-4">
						<button className="w-full flex items-center justify-between py-2">
							<div className="flex items-center gap-3">
								<HelpCircle size={18} className="text-gray-400" />
								<span className="text-white">帮助中心</span>
							</div>
							<span className="text-gray-500">→</span>
						</button>
						<button className="w-full flex items-center justify-between py-2">
							<div className="flex items-center gap-3">
								<Info size={18} className="text-gray-400" />
								<span className="text-white">版本信息</span>
							</div>
							<span className="text-gray-500">v1.0.0</span>
						</button>
					</div>
				</div>
			</main>
		</div>
	);
}
