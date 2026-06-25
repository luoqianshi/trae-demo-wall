import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, Image, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatDate, formatPercent } from '@/utils/helpers';
import SafeImage from '@/components/common/SafeImage';

const HistoryTimeline = () => {
  const { history, clearHistory, removeFromHistory } = useStore();
  const navigate = useNavigate();

  if (history.length === 0) {
    return (
      <div className="glass rounded-card p-8 text-center">
        <Clock className="w-16 h-16 mx-auto mb-4 text-plant-green/30" />
        <p className="text-text-medium">暂无识别记录</p>
        <p className="text-text-light text-sm mt-2">去首页体验拍照识草木吧</p>
      </div>
    );
  }

  const groupedHistory = history.reduce((groups, item) => {
    const date = formatDate(item.identifiedAt, 'date');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, typeof history>);

  return (
    <div className="glass rounded-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-text-dark">识别记录</h3>
        <button
          onClick={clearHistory}
          className="text-sm text-emphasis-coral hover:text-emphasis-coral/80 transition-colors"
        >
          清空记录
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedHistory).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-plant-green" />
              <span className="font-medium text-text-dark">{date}</span>
              <span className="text-text-medium text-sm">({items.length}次识别)</span>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-bg-beige rounded-card hover:bg-plant-green/5 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/detail/${item.plantId}`)}
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      containerClassName="w-16 h-16"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text-dark truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-medium">
                        {formatDate(item.identifiedAt, 'time')}
                      </span>
                      <span className="text-xs text-plant-green">
                        {formatPercent(item.confidence)} 匹配度
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.id);
                      }}
                      className="p-2 hover:bg-emphasis-coral/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-emphasis-coral" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-text-light" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTimeline;
