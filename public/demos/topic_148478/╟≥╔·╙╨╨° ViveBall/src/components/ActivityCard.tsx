import { Calendar, Users, ArrowRight } from 'lucide-react';
import type { Activity } from '@/types';

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-40">
        <img
          src={activity.image}
          alt={activity.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{activity.title}</h3>
          <p className="text-white/80 text-sm line-clamp-2">{activity.description}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{activity.deadline}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Users className="w-4 h-4" />
              <span>{formatNumber(activity.participants)}人参与</span>
            </div>
          </div>
          <button className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700 transition-colors">
            参与 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
