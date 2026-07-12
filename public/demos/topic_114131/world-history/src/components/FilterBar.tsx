import { Search, X, Filter, Calendar } from 'lucide-react';
import useTimelineStore from '@/store/timelineStore';
import { categories } from '@/data/historicalEvents';

const FilterBar = () => {
  const { 
    eras, 
    selectedEra, 
    selectedCategory, 
    searchQuery,
    searchYear,
    setSelectedEra, 
    setSelectedCategory, 
    setSearchQuery,
    setSearchYear,
    clearFilters 
  } = useTimelineStore();

  const hasFilters = selectedEra || selectedCategory || searchQuery || searchYear !== null;

  return (
    <div className="bg-history-dark/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索历史事件、人物或地区..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-history-gold/50 focus:ring-1 focus:ring-history-gold/50 transition-all"
            />
          </div>

          <div className="relative w-full md:w-auto">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              placeholder="输入年份搜索..."
              value={searchYear || ''}
              onChange={(e) => setSearchYear(e.target.value ? Number(e.target.value) : null)}
              className="w-full md:w-48 pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-history-gold/50 focus:ring-1 focus:ring-history-gold/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearFilters}
              disabled={!hasFilters}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <X className="w-5 h-5" />
              <span className="hidden md:inline">清除筛选</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-history-gold" />
            <span className="text-sm text-gray-400">时代:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedEra(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedEra
                  ? 'bg-history-gold text-history-dark'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
              }`}
            >
              全部
            </button>
            {eras.map((era) => (
              <button
                key={era.id}
                onClick={() => setSelectedEra(era.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedEra === era.id
                    ? 'bg-history-gold text-history-dark'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                }`}
              >
                {era.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <span className="text-sm text-gray-400">类别:</span>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedCategory
                  ? 'bg-history-gold text-history-dark'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
              }`}
            >
              全部
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'text-white'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;