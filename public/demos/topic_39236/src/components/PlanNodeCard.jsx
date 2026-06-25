import { AlarmClock, Package, DoorOpen, MapPin, FileText, Building2, Coffee, Users, Presentation, Home, ChevronRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const iconMap = {
  AlarmClock,
  Package,
  DoorOpen,
  MapPin,
  FileText,
  Building2,
  Coffee,
  Users,
  Presentation,
  Home,
};

const priorityColors = {
  critical: { bg: 'bg-danger/20', text: 'text-danger', border: 'border-danger' },
  important: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary' },
  normal: { bg: 'bg-gray-700/50', text: 'text-gray-400', border: 'border-gray-600' },
};

export default function PlanNodeCard({ node, isCurrent, isCompleted, onComplete }) {
  const Icon = iconMap[node.icon] || Clock;
  const colors = priorityColors[node.priority];

  return (
    <div
      onClick={() => !isCompleted && onComplete && onComplete(node.id)}
      className={`relative p-4 rounded-card border transition-all duration-300 ${
        isCompleted
          ? 'bg-green-900/30 border-green-500/50'
          : isCurrent
          ? `${colors.bg} ${colors.border} border`
          : 'bg-card border-card-border hover:border-primary/50'
      } ${!isCompleted ? 'cursor-pointer' : ''}`}
    >
      {isCompleted && (
        <div className="absolute top-2 right-2">
          <CheckCircle size={16} className="text-green-500" />
        </div>
      )}
      
      {isCurrent && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs rounded-full">
          当前
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500/20' : colors.bg}`}>
          <Icon size={24} className={isCompleted ? 'text-green-500' : colors.text} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-tabular text-sm text-gray-400">{node.time}</span>
            {node.priority === 'critical' && (
              <AlertTriangle size={14} className="text-danger" />
            )}
          </div>
          <h3 className={`font-medium mt-1 ${isCompleted ? 'text-green-400' : 'text-white'}`}>
            {node.title}
          </h3>
          {node.reminder && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{node.reminder.display}</p>
          )}
          {node.checklist && node.checklist.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {node.checklist.map((item, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-700/50 text-xs text-gray-400 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isCompleted && (
          <ChevronRight size={20} className="text-gray-500" />
        )}
      </div>
    </div>
  );
}