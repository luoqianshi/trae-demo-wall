import { useState } from "react";
import TabBar from "./components/TabBar";
import DeviceStatusBar from "./components/DeviceStatusBar";
import HomePage from "./pages/HomePage";
import ConversationPage from "./pages/ConversationPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
	const [activeTab, setActiveTab] = useState("conversation");
	const [tabHistory, setTabHistory] = useState(["conversation"]);

	const handleTabChange = (newTab) => {
		if (newTab === activeTab) return;

		setTabHistory((prev) => [...prev, newTab]);
		setActiveTab(newTab);
	};

	const renderPage = () => {
		switch (activeTab) {
			case "home":
				return <HomePage />;
			case "conversation":
				return <ConversationPage />;
			case "settings":
				return <SettingsPage />;
			default:
				return <ConversationPage />;
		}
	};

	const getTransitionClass = () => {
		if (tabHistory.length < 2) return "";

		const prevTabIndex = ["conversation", "home", "settings"].indexOf(tabHistory[tabHistory.length - 2]);
		const currTabIndex = ["conversation", "home", "settings"].indexOf(activeTab);

		return currTabIndex > prevTabIndex ? "slide-in-right" : "slide-in-left";
	};

	return (
		<div className="min-h-screen bg-bg-primary max-w-[428px] mx-auto relative overflow-hidden">
			<DeviceStatusBar />
			<div className={`transition-all duration-300 ease-out ${getTransitionClass()}`}>{renderPage()}</div>
			<TabBar activeTab={activeTab} onTabChange={handleTabChange} />
		</div>
	);
}
