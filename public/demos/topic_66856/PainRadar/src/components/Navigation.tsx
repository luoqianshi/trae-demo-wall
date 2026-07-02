import { Radar, TrendingUp, Lightbulb, FileText } from 'lucide-react';
import { useAppStore } from '../store';
import { TabType } from '../types';

const tabs: { id: TabType; label: string; icon: typeof Radar }[] = [
  { id: 'opportunities', label: '机会发现', icon: Radar },
  { id: 'trends', label: '趋势分析', icon: TrendingUp },
  { id: 'validator', label: '想法验证', icon: Lightbulb },
  { id: 'reports', label: '报告中心', icon: FileText },
];

export function Navigation() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
