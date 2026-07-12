import HeroBanner from '@/components/HeroBanner';
import FilterBar from '@/components/FilterBar';
import Timeline from '@/components/Timeline';
import DetailModal from '@/components/DetailModal';
import useTimelineStore from '@/store/timelineStore';
import { FileText } from 'lucide-react';

function App() {
  const { filteredEvents } = useTimelineStore();

  return (
    <div className="min-h-screen bg-history-dark">
      <HeroBanner />
      <FilterBar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-bold text-white">
            历史事件
            <span className="text-history-gold ml-2">({filteredEvents.length})</span>
          </h2>
          
          {filteredEvents.length === 0 && (
            <div className="flex items-center gap-2 text-gray-400">
              <FileText className="w-5 h-5" />
              <span>没有找到匹配的事件</span>
            </div>
          )}
        </div>

        {filteredEvents.length > 0 ? (
          <Timeline />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <FileText className="w-12 h-12" />
            </div>
            <p className="text-lg">尝试调整筛选条件</p>
            <p className="text-sm mt-2">或搜索其他历史事件</p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            世界历史时间线 · 公元前3100年-2000年
          </p>
          <p className="text-gray-600 text-xs mt-2">
            探索人类文明的演进历程
          </p>
        </div>
      </footer>

      <DetailModal />
    </div>
  );
}

export default App;