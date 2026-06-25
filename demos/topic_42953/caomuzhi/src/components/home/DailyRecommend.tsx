import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Calendar } from 'lucide-react';
import { getRandomPlants } from '@/data/plantsData';
import { Plant } from '@/types';
import Card from '@/components/common/Card';
import SafeImage from '@/components/common/SafeImage';
import { getPlantImageUrl } from '@/utils/imageUtils';

const DailyRecommend = () => {
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const randomPlants = getRandomPlants(1);
    if (randomPlants.length > 0) {
      setPlant(randomPlants[0]);
    }
  }, []);

  const handleRefresh = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const randomPlants = getRandomPlants(1);
      if (randomPlants.length > 0) {
        setPlant(randomPlants[0]);
      }
      setIsFlipping(false);
    }, 300);
  };

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  if (!plant) return null;

  return (
    <section className="py-20 bg-bg-beige">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-plant-green" />
            <h2 className="text-3xl font-bold text-text-dark">今日草木</h2>
          </div>
          <span className="text-text-medium">{today}</span>
        </div>

        <Card className="overflow-hidden">
          <div className={`grid grid-cols-1 lg:grid-cols-2 transition-all duration-300 ${isFlipping ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="relative h-64 lg:h-auto aspect-video lg:aspect-auto overflow-hidden">
              <SafeImage
                src={getPlantImageUrl(plant.name, 1, 1200, 800)}
                alt={plant.name}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm opacity-80">{plant.category} · {plant.family}</p>
                <h3 className="text-2xl font-bold">{plant.name}</h3>
                <p className="text-sm italic opacity-80">{plant.latinName}</p>
              </div>
            </div>

            <div className="p-8 flex flex-col justify-center">
              <blockquote className="text-xl text-text-dark italic mb-6 border-l-4 border-plant-green pl-4">
                {plant.overview.description}
              </blockquote>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="tag tag-green">{plant.category}</span>
                  {plant.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag tag-amber">{tag}</span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-medium">科属</p>
                    <p className="font-medium">{plant.family} · {plant.genus}</p>
                  </div>
                  <div>
                    <p className="text-text-medium">花期</p>
                    <p className="font-medium">{plant.overview.floweringPeriod}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate(`/detail/${plant.id}`)}
                  className="btn-primary flex-1"
                >
                  查看详情
                </button>
                <button
                  onClick={handleRefresh}
                  className="btn-secondary p-4 rounded-button"
                >
                  <RefreshCw className={`w-5 h-5 transition-transform ${isFlipping ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default DailyRecommend;
