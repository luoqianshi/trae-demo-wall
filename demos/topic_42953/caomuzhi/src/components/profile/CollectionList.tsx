import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Filter, Search, Calendar, Leaf, Flower2, TreeDeciduous, Sun } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Card from '@/components/common/Card';
import SafeImage from '@/components/common/SafeImage';
import { plantsData } from '@/data/plantsData';

const categoryIcons: Record<string, any> = {
  '花卉': Flower2,
  '乔木': TreeDeciduous,
  '灌木': TreeDeciduous,
  '草本': Leaf,
  '果实': Sun,
};

const CollectionList = () => {
  const { collections, removeCollection } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const categories = [...new Set(collections.map((c) => c.category))];
  
  const categoryCounts: Record<string, number> = {};
  collections.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const sortedCollections = [...collections].sort((a, b) => 
    new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
  );

  const filteredCollections = sortedCollections.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !selectedCategory || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleRemove = (plantId: number) => {
    removeCollection(plantId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  if (collections.length === 0) {
    const recommendedPlants = plantsData.slice(0, 4);
    
    return (
      <div className="space-y-6">
        <div className="glass rounded-card p-8 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-plant-green/30" />
          <p className="text-text-medium text-lg">暂无收藏的草木</p>
          <p className="text-text-light text-sm mt-2">去首页探索更多草木吧</p>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-text-dark mb-4">推荐收藏</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendedPlants.map((plant) => (
              <Card
                key={plant.id}
                onClick={() => navigate(`/detail/${plant.id}`)}
                className="overflow-hidden cursor-pointer"
              >
                <div className="relative h-32 overflow-hidden">
                  <SafeImage
                    src={plant.image}
                    alt={plant.name}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-text-dark text-sm">{plant.name}</h4>
                  <span className="tag tag-green text-xs">{plant.category}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentCollection = sortedCollections[0];
  const oldestCollection = sortedCollections[sortedCollections.length - 1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-plant-green/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-plant-green" />
          </div>
          <p className="text-2xl font-bold text-text-dark">{collections.length}</p>
          <p className="text-text-medium text-sm">总收藏</p>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent-amber/10 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-accent-amber" />
          </div>
          <p className="text-2xl font-bold text-text-dark">{categories.length}</p>
          <p className="text-text-medium text-sm">分类数量</p>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-plant-medium/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-plant-medium" />
          </div>
          <p className="text-lg font-bold text-text-dark">{formatDate(recentCollection.collectedAt)}</p>
          <p className="text-text-medium text-sm">最近收藏</p>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emphasis-coral/10 flex items-center justify-center">
            <Sun className="w-6 h-6 text-emphasis-coral" />
          </div>
          <p className="text-lg font-bold text-text-dark">{formatDate(oldestCollection.collectedAt)}</p>
          <p className="text-text-medium text-sm">最早收藏</p>
        </Card>
      </div>

      <Card className="p-4">
        <h4 className="font-semibold text-text-dark mb-3">分类分布</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = categoryIcons[category] || Leaf;
            const count = categoryCounts[category];
            const percentage = Math.round((count / collections.length) * 100);
            return (
              <div 
                key={category}
                className="flex items-center gap-2 px-4 py-2 bg-bg-beige rounded-full"
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                <Icon className="w-4 h-4 text-plant-green" />
                <span className="text-sm font-medium text-text-dark">{category}</span>
                <span className="text-xs text-text-light">{count}种 ({percentage}%)</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="glass rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text-dark">我的收藏</h3>
          <span className="text-text-light text-sm">共 {filteredCollections.length} 种</span>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <input
              type="text"
              placeholder="搜索收藏的草木..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-bg-beige rounded-card outline-none focus:ring-2 focus:ring-plant-green/30"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="pl-12 pr-8 py-2 bg-bg-beige rounded-card outline-none focus:ring-2 focus:ring-plant-green/30 appearance-none cursor-pointer"
            >
              <option value="">全部分类</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCollections.map((item) => (
            <Card
              key={item.plantId}
              onClick={() => navigate(`/detail/${item.plantId}`)}
              className="overflow-hidden cursor-pointer relative group"
            >
              <div className="relative h-32 overflow-hidden">
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.plantId);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emphasis-coral z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-tag">
                  {formatDate(item.collectedAt)}
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-text-dark text-sm">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="tag tag-green text-xs">{item.category}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCollections.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto mb-3 text-plant-green/30" />
            <p className="text-text-medium">未找到匹配的收藏</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionList;
