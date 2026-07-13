import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { GrowthReport } from '../components/records/GrowthReport';
import { RecordList } from '../components/records/RecordList';
import { BarChart3, List } from 'lucide-react';

type Tab = 'report' | 'list';

export const Records = () => {
  const [activeTab, setActiveTab] = useState<Tab>('report');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="学习记录" subtitle="追踪进度，见证成长" />

      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-[57px] lg:top-[73px] z-10">
        <div className="px-4 lg:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'report'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              成长报告
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'list'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              学习记录
            </button>
          </div>
        </div>
      </div>

      <main className="px-4 lg:px-6 py-4 pb-24 lg:pb-6 max-w-5xl mx-auto">
        {activeTab === 'report' ? <GrowthReport /> : <RecordList />}
      </main>
    </div>
  );
};