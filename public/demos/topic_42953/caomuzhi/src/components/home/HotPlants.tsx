import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Heart, Eye } from 'lucide-react';
import { getRandomPlants } from '@/data/plantsData';
import { Plant } from '@/types';
import Card from '@/components/common/Card';
import SafeImage from '@/components/common/SafeImage';
import { useStore } from '@/store/useStore';

const HotPlants = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [visiblePlants, setVisiblePlants] = useState<number>(3);
  const navigate = useNavigate();
  const { collections, addCollection, removeCollection } = useStore();

  useEffect(() => {
    const randomPlants = getRandomPlants(12);
    setPlants(randomPlants);
  }, []);

  const handleShowMore = () => {
    setVisiblePlants((prev) => Math.min(prev + 3, plants.length));
  };

  const isCollected = (plantId: number) => {
    return collections.some((c) => c.plantId === plantId);
  };

  const handleToggleCollection = (e: React.MouseEvent, plant: Plant) => {
    e.stopPropagation();
    if (isCollected(plant.id)) {
      removeCollection(plant.id);
    } else {
      addCollection({
        plantId: plant.id,
        name: plant.name,
        image: plant.image,
        category: plant.category,
        collectedAt: new Date().toISOString()
      });
    }
  };

  return (
    <section id="hot-plants" className="py-20 bg-bg-beige">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-plant-green" />
            <h2 className="text-3xl font-bold text-text-dark">热门草木</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.slice(0, visiblePlants).map((plant) => (
            <Card
              key={plant.id}
              onClick={() => navigate(`/detail/${plant.id}`)}
              className="overflow-hidden group cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <SafeImage
                  src={plant.image}
                  alt={plant.name}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                <button
                  onClick={(e) => handleToggleCollection(e, plant)}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
                    isCollected(plant.id)
                      ? 'bg-emphasis-coral text-white'
                      : 'bg-white/80 text-text-dark hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isCollected(plant.id) ? 'fill-current' : ''}`} />
                </button>

                <div className="absolute bottom-4 left-4 text-white">
                  <span className="px-2 py-1 bg-plant-green/80 rounded-tag text-xs">
                    {plant.category}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-text-dark">{plant.name}</h3>
                  <span className="text-sm italic text-text-medium">{plant.latinName}</span>
                </div>
                
                <p className="text-text-medium text-sm mb-3 line-clamp-2">
                  {plant.overview.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-text-medium">
                    <Eye className="w-4 h-4" />
                    <span>{Math.floor(Math.random() * 1000) + 100} 浏览</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plant.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag tag-amber">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {visiblePlants < plants.length && (
          <div className="text-center mt-10">
            <button onClick={handleShowMore} className="btn-primary">
              加载更多
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HotPlants;
