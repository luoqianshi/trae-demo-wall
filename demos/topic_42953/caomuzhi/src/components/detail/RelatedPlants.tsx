import { useNavigate } from 'react-router-dom';
import { getRelatedPlants } from '@/data/plantsData';
import { Plant } from '@/types';
import Card from '@/components/common/Card';
import SafeImage from '@/components/common/SafeImage';

interface RelatedPlantsProps {
  plant: Plant;
}

const RelatedPlants = ({ plant }: RelatedPlantsProps) => {
  const relatedPlants = getRelatedPlants(plant.id, plant.category, 4);
  const navigate = useNavigate();

  if (relatedPlants.length === 0) return null;

  return (
    <section className="mt-12">
      <h3 className="text-2xl font-bold text-text-dark mb-6">相关草木</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {relatedPlants.map((relatedPlant) => (
          <Card
            key={relatedPlant.id}
            onClick={() => navigate(`/detail/${relatedPlant.id}`)}
            className="overflow-hidden cursor-pointer"
          >
            <div className="relative h-32 overflow-hidden">
              <SafeImage
                src={relatedPlant.image}
                alt={relatedPlant.name}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-text-dark text-sm">{relatedPlant.name}</h4>
              <p className="text-xs text-text-medium italic">{relatedPlant.latinName}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default RelatedPlants;
