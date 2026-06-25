import { Sparkles, Check, Loader2, Image, MapPin, FileText, Plane, Hotel, Camera, Wallet, BookOpen } from 'lucide-react';

interface AIAnalysisStatusProps {
  progress: number;
  status: 'completed' | 'processing' | 'pending';
}

const analysisItems = [
  { icon: Image, label: 'Photo Analysis', count: 247 },
  { icon: MapPin, label: 'Location Tracking', count: 18 },
  { icon: Plane, label: 'Flight Records', count: 2 },
  { icon: Hotel, label: 'Hotel Bookings', count: 1 },
  { icon: FileText, label: 'Expense Reports', count: 35 },
  { icon: Camera, label: 'AI Diary', count: 1 },
];

export function AIAnalysisStatus({ progress, status }: AIAnalysisStatusProps) {
  const isComplete = status === 'completed';

  return (
    <div className="bg-gradient-to-br from-white to-orange-50/50 rounded-3xl p-6 md:p-8 shadow-sm border border-orange-100/50">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-orange-100"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="text-orange-500 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete ? (
              <Sparkles size={28} className="text-orange-500" />
            ) : (
              <Loader2 size={28} className="text-orange-500 animate-spin" />
            )}
            <span className="text-2xl font-bold text-gray-800 mt-1">{progress}%</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isComplete ? 'AI Analysis Complete' : 'AI Organizing Your Trip'}
          </h2>
          <p className="text-gray-500 mb-4">
            {isComplete
              ? 'All your travel data has been analyzed and organized into a beautiful journal.'
              : 'Our AI is analyzing your photos, locations, expenses and more...'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {analysisItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm"
                >
                  {isComplete ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-orange-200 animate-pulse" />
                  )}
                  <Icon size={14} className="text-gray-600" />
                  <span className="text-xs text-gray-700 truncate">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
