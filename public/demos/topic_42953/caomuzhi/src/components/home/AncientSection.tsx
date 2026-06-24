import { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Quote, Scroll } from 'lucide-react';
import { getPlantsWithAncient, getRandomPlants } from '@/data/plantsData';
import { Plant } from '@/types';
import Card from '@/components/common/Card';
import SafeImage from '@/components/common/SafeImage';

const AncientSection = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const ancientPlants = getPlantsWithAncient();
    const source = ancientPlants.length > 0 ? ancientPlants : getRandomPlants(10);
    const selected = [...source].sort(() => Math.random() - 0.5).slice(0, Math.min(5, source.length));
    setPlants(selected);
  }, []);

  const currentPlant = plants[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? plants.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === plants.length - 1 ? 0 : prev + 1));
  };

  if (!currentPlant) return null;

  const ancient = currentPlant.ancient;
  const hasBenCaoGangMu = ancient.benCaoGangMu;
  const hasShenNongBenCao = ancient.shenNongBenCao;

  return (
    <section id="ancient" className="py-20 bg-gradient-to-br from-plant-dark/10 via-plant-green/5 to-plant-medium/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-6 h-6 text-plant-green" />
          <h2 className="text-3xl font-bold text-text-dark">古籍智慧</h2>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative h-64 lg:h-auto overflow-hidden">
              <SafeImage
                src={currentPlant.image}
                alt={currentPlant.name}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
            </div>

            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <span className="tag tag-green">{currentPlant.name}</span>
                {hasBenCaoGangMu && (
                  <span className="tag tag-amber">《本草纲目》</span>
                )}
                {hasShenNongBenCao && (
                  <span className="tag tag-amber">《神农本草经》</span>
                )}
              </div>

              {hasBenCaoGangMu && (
                <blockquote className="relative">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-plant-green/20" />
                  <p className="text-xl text-text-dark italic pl-6 border-l-4 border-plant-green">
                    {hasBenCaoGangMu.original}
                  </p>
                </blockquote>
              )}

              <div className="mt-6 space-y-3">
                {hasShenNongBenCao && (
                  <>
                    {hasShenNongBenCao.property && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-text-medium text-sm">性味：</span>
                        <span className="tag tag-sage">{hasShenNongBenCao.property}</span>
                      </div>
                    )}
                    
                    {hasShenNongBenCao.efficacy && (
                      <div>
                        <span className="text-text-medium text-sm">功效主治：</span>
                        <p className="text-text-dark text-sm">{hasShenNongBenCao.efficacy}</p>
                      </div>
                    )}
                  </>
                )}

                {hasBenCaoGangMu && hasBenCaoGangMu.translation && (
                  <div>
                    <span className="text-text-medium text-sm">译文：</span>
                    <p className="text-text-dark text-sm">{hasBenCaoGangMu.translation}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-8">
                <div className="flex gap-2">
                  {plants.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? 'w-6 bg-plant-green'
                          : 'bg-plant-green/30 hover:bg-plant-green/50'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    className="p-2 hover:bg-plant-green/10 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-text-dark" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-2 hover:bg-plant-green/10 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-text-dark" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default AncientSection;
