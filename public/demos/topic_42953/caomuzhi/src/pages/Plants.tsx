import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import Card from '@/components/common/Card';
import SafeImage from '@/components/common/SafeImage';
import { plantsData } from '@/data/plantsData';
import { getPlantImageUrl } from '@/utils/imageUtils';
import { Flower2, TreeDeciduous, Leaf, Sun, Mountain, Sparkles, Search, Filter, X, ArrowLeft } from 'lucide-react';

const categoryIcons: Record<string, any> = {
  'flower': Flower2,
  'tree': TreeDeciduous,
  'grass': Leaf,
  'fruit': Sun,
  'wild': Mountain,
  'medicinal': Sparkles
};

const categoryNames: Record<string, string> = {
  'flower': '花卉',
  'tree': '树木',
  'grass': '草本',
  'fruit': '果实',
  'wild': '野生',
  'medicinal': '药用'
};

const categoryFilters = [
  { id: 'all', name: '全部', displayName: '全部' },
  { id: 'flower', name: 'flower', displayName: '花卉' },
  { id: 'tree', name: 'tree', displayName: '树木' },
  { id: 'grass', name: 'grass', displayName: '草本' },
  { id: 'fruit', name: 'fruit', displayName: '果实' },
  { id: 'wild', name: 'wild', displayName: '野生' },
  { id: 'medicinal', name: 'medicinal', displayName: '药用' }
];

const Plants = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);

  const filteredPlants = useMemo(() => {
    let result = plantsData;
    
    if (selectedCategory !== 'all') {
      const categoryMap: Record<string, string[]> = {
        'flower': ['花卉'],
        'tree': ['乔木', '灌木'],
        'grass': ['草本'],
        'fruit': ['果实'],
        'wild': ['野生'],
        'medicinal': ['药用']
      };
      const targetCategories = categoryMap[selectedCategory] || [selectedCategory];
      result = result.filter(plant => targetCategories.includes(plant.category));
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(plant => 
        plant.name.toLowerCase().includes(query) ||
        plant.latinName.toLowerCase().includes(query) ||
        plant.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-bg-cream">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-text-dark mb-4">
            {category && categoryNames[category] ? `${categoryNames[category]}图鉴` : '植物图鉴'}
          </h1>
          <p className="text-text-medium text-lg">探索自然，发现草木之美</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              {category && (
                <button
                  onClick={() => window.location.href = '/plants'}
                  className="flex items-center gap-2 px-4 py-2 text-text-medium hover:text-plant-green transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>返回全部分类</span>
                </button>
              )}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                <input
                  type="text"
                  placeholder="搜索植物名称、拉丁名或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white rounded-xl border border-gray-200 focus:border-plant-green focus:ring-2 focus:ring-plant-green/20 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-text-light" />
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-plant-green transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>筛选</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex flex-wrap gap-3">
                {categoryFilters.map(filter => {
                  const Icon = filter.id !== 'all' ? categoryIcons[filter.id] : null;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setSelectedCategory(filter.id);
                        if (filter.id === 'all') {
                          window.location.href = '/plants';
                        } else {
                          window.location.href = `/plants/${filter.id}`;
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        selectedCategory === filter.id
                          ? 'bg-plant-green text-white'
                          : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{filter.displayName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 text-text-medium">
          共找到 <span className="font-semibold text-plant-green">{filteredPlants.length}</span> 种植物
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPlants.map((plant) => (
            <Card
              key={plant.id}
              className="overflow-hidden cursor-pointer group"
              onClick={() => window.location.href = `/detail/${plant.id}`}
            >
              <div className="relative h-48 overflow-hidden">
                <SafeImage
                  src={getPlantImageUrl(plant.name, 1, 600, 400)}
                  alt={plant.name}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {plant.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white/90 text-text-dark text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-text-dark text-lg">{plant.name}</h3>
                    <p className="text-sm text-text-light italic">{plant.latinName}</p>
                  </div>
                  <span className="px-2 py-1 bg-plant-green/10 text-plant-green text-xs rounded-full">
                    {plant.category}
                  </span>
                </div>
                <p className="text-sm text-text-medium line-clamp-2">{plant.overview.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {filteredPlants.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-text-medium text-lg">未找到匹配的植物</p>
            <p className="text-text-light text-sm mt-2">试试调整搜索条件或筛选分类</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Plants;