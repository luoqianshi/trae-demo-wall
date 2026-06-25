import { useState, useRef } from "react";
import { Bluetooth, Mic, Volume2, X, Check, RefreshCw } from "lucide-react";
import useAppStore from "../store/appStore";

const volumeLabels = {
	low: "低",
	medium: "中",
	high: "高",
};

export default function DeviceStatusBar() {
	const { devices, settings, updateSettings, updateDevice } = useAppStore();
	const [showDeviceModal, setShowDeviceModal] = useState(null); // 'speaker' | 'mic' | null
	const [showVolumeModal, setShowVolumeModal] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [volumePercent, setVolumePercent] = useState(settings.reminderVolume === "low" ? 33 : settings.reminderVolume === "medium" ? 66 : 100);
	const sliderRef = useRef(null);
	const isDragging = useRef(false);

	const handleConnect = (deviceType) => {
		setIsConnecting(true);
		setTimeout(() => {
			updateDevice(deviceType, { connected: true, name: deviceType === "bluetoothSpeaker" ? "智能音箱 Pro" : "无线麦克风" });
			setIsConnecting(false);
			setShowDeviceModal(null);
		}, 1500);
	};

	const handleDisconnect = (deviceType) => {
		updateDevice(deviceType, { connected: false, name: "" });
		setShowDeviceModal(null);
	};

	const handleVolumeChange = (volume) => {
		updateSettings({ reminderVolume: volume });
		setVolumePercent(volume === "low" ? 33 : volume === "medium" ? 66 : 100);
	};

	const handleSliderChange = (e) => {
		if (!sliderRef.current) return;

		const rect = sliderRef.current.getBoundingClientRect();
		const x = e.clientX || (e.touches && e.touches[0].clientX);
		const percent = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));

		setVolumePercent(Math.round(percent));

		// 根据百分比确定音量档位
		let volume = "low";
		if (percent > 66) volume = "high";
		else if (percent > 33) volume = "medium";

		updateSettings({ reminderVolume: volume });
	};

	const handleMouseDown = (e) => {
		isDragging.current = true;
		handleSliderChange(e);
	};

	const handleMouseMove = (e) => {
		if (!isDragging.current) return;
		handleSliderChange(e);
	};

	const handleMouseUp = () => {
		isDragging.current = false;
	};

	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-4 py-2 bg-bg-primary/95 backdrop-blur-sm border-b border-card-border max-w-[428px] mx-auto">
				<button onClick={() => setShowDeviceModal("speaker")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
					<div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
						<Bluetooth size={12} className="text-green-500" />
					</div>
					<span className="text-xs text-green-500 font-medium">音箱已连</span>
				</button>

				<button onClick={() => setShowDeviceModal("mic")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
					<div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
						<Mic size={12} className="text-green-500" />
					</div>
					<span className="text-xs text-green-500 font-medium">麦克风已连</span>
				</button>

				<button onClick={() => setShowVolumeModal(true)} className="flex items-center gap-2 ml-auto hover:opacity-80 transition-opacity">
					<Volume2 size={16} className="text-primary" />
					<span className="text-xs text-gray-400">{volumeLabels[settings.reminderVolume]}</span>
				</button>
			</div>

			{/* 设备连接弹窗 */}
			{showDeviceModal && (
				<div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setShowDeviceModal(null)}>
					<div className="w-full max-w-[428px] bg-card rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-white">{showDeviceModal === "speaker" ? "蓝牙音箱" : "便携麦克风"}</h3>
							<button onClick={() => setShowDeviceModal(null)} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
								<X size={18} className="text-gray-400" />
							</button>
						</div>

						<div className="space-y-4">
							{/* 当前设备 */}
							<div className="p-4 bg-bg-primary rounded-card border border-card-border">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
											{showDeviceModal === "speaker" ? <Bluetooth size={24} className="text-green-500" /> : <Mic size={24} className="text-green-500" />}
										</div>
										<div>
											<p className="text-white font-medium">{showDeviceModal === "speaker" ? devices.bluetoothSpeaker.name || "智能音箱 Pro" : devices.portableMic.name || "无线麦克风"}</p>
											<p className="text-xs text-green-500">已连接</p>
										</div>
									</div>
									<Check size={20} className="text-green-500" />
								</div>
							</div>

							{/* 可用设备列表 */}
							<div>
								<p className="text-sm text-gray-400 mb-3">可用设备</p>
								<div className="space-y-2">
									{["设备 1", "设备 2", "设备 3"].map((device, index) => (
										<button
											key={index}
											onClick={() => handleConnect(showDeviceModal === "speaker" ? "bluetoothSpeaker" : "portableMic")}
											disabled={isConnecting}
											className="w-full p-4 bg-bg-primary rounded-card border border-card-border flex items-center justify-between hover:border-primary/50 transition-colors"
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
													{showDeviceModal === "speaker" ? <Bluetooth size={20} className="text-gray-400" /> : <Mic size={20} className="text-gray-400" />}
												</div>
												<span className="text-white">{device}</span>
											</div>
											{isConnecting ? <RefreshCw size={18} className="text-primary animate-spin" /> : <span className="text-xs text-primary">连接</span>}
										</button>
									))}
								</div>
							</div>

							{/* 断开连接按钮 */}
							<button onClick={() => handleDisconnect(showDeviceModal === "speaker" ? "bluetoothSpeaker" : "portableMic")} className="w-full py-3 bg-danger/20 text-danger rounded-btn font-medium hover:bg-danger/30 transition-colors">
								断开连接
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 音量调节弹窗 */}
			{showVolumeModal && (
				<div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setShowVolumeModal(false)}>
					<div className="w-full max-w-[428px] bg-card rounded-t-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-bold text-white">音量调节</h3>
							<button onClick={() => setShowVolumeModal(false)} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
								<X size={18} className="text-gray-400" />
							</button>
						</div>

						{/* 音量滑块 */}
						<div className="mb-6">
							<div className="flex items-center justify-between mb-3">
								<span className="text-sm text-gray-400">当前音量</span>
								<span className="text-lg text-primary font-bold">{volumePercent}%</span>
							</div>

							<div
								ref={sliderRef}
								className="relative h-12 bg-bg-primary rounded-card cursor-pointer select-none"
								onMouseDown={handleMouseDown}
								onMouseMove={handleMouseMove}
								onMouseUp={handleMouseUp}
								onMouseLeave={handleMouseUp}
								onTouchStart={handleMouseDown}
								onTouchMove={handleMouseMove}
								onTouchEnd={handleMouseUp}
							>
								{/* 背景轨道 */}
								<div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-2 bg-gray-700 rounded-full">
									{/* 已填充部分 */}
									<div className="h-full bg-primary rounded-full transition-all duration-75" style={{ width: `${volumePercent}%` }} />
								</div>

								{/* 滑块手柄 */}
								<div
									className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-primary transition-all duration-75 flex items-center justify-center"
									style={{ left: `calc(16px + (100% - 32px) * ${volumePercent / 100} - 12px)` }}
								>
									<div className="w-2 h-2 bg-primary rounded-full" />
								</div>
							</div>

							{/* 音量刻度 */}
							<div className="flex justify-between px-4 mt-2">
								<span className="text-xs text-gray-500">静音</span>
								<span className="text-xs text-gray-500">最大</span>
							</div>
						</div>

						{/* 快捷档位 */}
						<div>
							<p className="text-sm text-gray-400 mb-3">快捷档位</p>
							<div className="grid grid-cols-3 gap-3">
								{["low", "medium", "high"].map((level) => (
									<button
										key={level}
										onClick={() => handleVolumeChange(level)}
										className={`p-3 rounded-card border flex flex-col items-center gap-2 transition-all ${
											settings.reminderVolume === level ? "bg-primary/20 border-primary" : "bg-bg-primary border-card-border hover:border-primary/50"
										}`}
									>
										<div className="flex gap-0.5">
											{[1, 2, 3].map((i) => (
												<div key={i} className={`w-1.5 rounded-full transition-all ${i <= (level === "low" ? 1 : level === "medium" ? 2 : 3) ? "bg-primary h-3" : "bg-gray-600 h-2"}`} />
											))}
										</div>
										<span className={`text-sm font-medium ${settings.reminderVolume === level ? "text-primary" : "text-white"}`}>{volumeLabels[level]}</span>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
