import { Calendar, MessageCircle, Settings } from "lucide-react";

const tabs = [
	{ id: "conversation", label: "对话", icon: MessageCircle },
	{ id: "home", label: "日程", icon: Calendar },
	{ id: "settings", label: "设置", icon: Settings },
];

export default function TabBar({ activeTab, onTabChange }) {
	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-card-border px-4 pb-6 pt-2 safe-area-bottom">
			<div className="flex items-center justify-around">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;

					return (
						<button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center gap-1 px-6 py-2 rounded-card transition-all duration-300 ${isActive ? "bg-primary/20" : "hover:bg-gray-700/50"}`}>
							<Icon size={22} className={`transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-gray-500"}`} />
							<span className={`text-xs font-medium transition-colors ${isActive ? "text-primary" : "text-gray-500"}`}>{tab.label}</span>
							{isActive && <div className="absolute -bottom-1 w-2 h-2 bg-primary rounded-full" />}
						</button>
					);
				})}
			</div>
		</nav>
	);
}
