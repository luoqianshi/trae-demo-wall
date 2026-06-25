import { Calendar, Clock, MapPin, Bell, FileText, CheckCircle, AlertCircle, Car, Train, Bike, Footprints, Repeat } from "lucide-react";

export default function ExtractedDataPanel({ extractedData }) {
	if (!extractedData) return null;

	const { events, reminders, routes, items, notes } = extractedData;

	const getTransportIcon = (type) => {
		switch (type) {
			case "car":
				return <Car size={16} />;
			case "subway":
				return <Train size={16} />;
			case "bike":
				return <Bike size={16} />;
			default:
				return <Footprints size={16} />;
		}
	};

	return (
		<div className="space-y-4">
			{/* 日程事件 */}
			{events && events.length > 0 && (
				<div className="p-4 bg-card rounded-card border border-card-border">
					<div className="flex items-center gap-2 mb-3">
						<Calendar size={18} className="text-primary" />
						<h3 className="text-white font-medium">日程安排</h3>
					</div>
					<div className="space-y-3">
						{events.map((event, index) => (
							<div key={index} className="flex items-start gap-3 p-3 bg-bg-primary rounded-lg">
								<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
									<Clock size={18} className="text-primary" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-white font-medium">{event.title}</span>
										{event.priority === "high" && <span className="px-2 py-0.5 bg-danger/20 text-danger text-xs rounded-full">重要</span>}
										{event.recurrence !== "once" && (
											<span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
												<Repeat size={12} />
												{event.recurrenceText}
											</span>
										)}
									</div>
									<div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
										<span>{event.time}</span>
										{event.location && (
											<>
												<span>•</span>
												<span className="truncate">{event.location}</span>
											</>
										)}
									</div>
									{event.notes && <p className="text-xs text-gray-500 mt-1">{event.notes}</p>}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* 出行路线 */}
			{routes && routes.length > 0 && (
				<div className="p-4 bg-card rounded-card border border-card-border">
					<div className="flex items-center gap-2 mb-3">
						<MapPin size={18} className="text-green-400" />
						<h3 className="text-white font-medium">出行路线</h3>
					</div>
					<div className="space-y-2">
						{routes.map((route, index) => (
							<div key={index} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">{getTransportIcon(route.type)}</div>
									<div>
										<div className="text-white text-sm">
											{route.from} → {route.to}
										</div>
										<div className="text-xs text-gray-400">
											{route.duration} · {route.distance}
										</div>
									</div>
								</div>
								{route.recommended && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">推荐</span>}
							</div>
						))}
					</div>
				</div>
			)}

			{/* 提醒事项 */}
			{reminders && reminders.length > 0 && (
				<div className="p-4 bg-card rounded-card border border-card-border">
					<div className="flex items-center gap-2 mb-3">
						<Bell size={18} className="text-yellow-400" />
						<h3 className="text-white font-medium">提醒事项</h3>
					</div>
					<div className="space-y-2">
						{reminders.map((reminder, index) => (
							<div key={index} className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg">
								<div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
									<Bell size={14} className="text-yellow-400" />
								</div>
								<div className="flex-1">
									<div className="text-white text-sm">{reminder.content}</div>
									<div className="text-xs text-gray-400">{reminder.time}</div>
								</div>
								<CheckCircle size={18} className="text-gray-500" />
							</div>
						))}
					</div>
				</div>
			)}

			{/* 携带物品 */}
			{items && items.length > 0 && (
				<div className="p-4 bg-card rounded-card border border-card-border">
					<div className="flex items-center gap-2 mb-3">
						<FileText size={18} className="text-purple-400" />
						<h3 className="text-white font-medium">携带物品</h3>
					</div>
					<div className="flex flex-wrap gap-2">
						{items.map((item, index) => (
							<div key={index} className="flex items-center gap-2 px-3 py-2 bg-bg-primary rounded-lg">
								<CheckCircle size={14} className="text-gray-500" />
								<span className="text-white text-sm">{item}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* 备注信息 */}
			{notes && notes.length > 0 && (
				<div className="p-4 bg-card rounded-card border border-card-border">
					<div className="flex items-center gap-2 mb-3">
						<AlertCircle size={18} className="text-blue-400" />
						<h3 className="text-white font-medium">备注信息</h3>
					</div>
					<div className="space-y-2">
						{notes.map((note, index) => (
							<div key={index} className="p-3 bg-bg-primary rounded-lg text-sm text-gray-300">
								{note}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
