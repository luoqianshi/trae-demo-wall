import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Plant } from '@/types';
import SafeImage from '@/components/common/SafeImage';

interface PlantGalleryProps {
  plant: Plant;
}

const PlantGallery = ({ plant }: PlantGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [plant.image, ...plant.images];

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setSelectedImage(images[index]);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setSelectedImage(images[currentIndex === 0 ? images.length - 1 : currentIndex - 1]);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setSelectedImage(images[currentIndex === images.length - 1 ? 0 : currentIndex + 1]);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-card overflow-hidden">
        <SafeImage
          src={plant.image}
          alt={plant.name}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => openLightbox(0)}
        />
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-tag z-10">
          点击查看大图
        </div>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-300 group ${
                index === 0 
                  ? 'ring-2 ring-plant-green shadow-lg shadow-plant-green/20' 
                  : 'shadow-md hover:shadow-lg'
              }`}
            >
              <SafeImage
                src={img}
                alt={`${plant.name} ${index + 1}`}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2`}>
                <span className="text-white text-xs font-medium">{index + 1}</span>
              </div>
              {index === 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-plant-green rounded-full shadow-lg" />
              )}
            </button>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <img
            src={selectedImage}
            alt={plant.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://picsum.photos/seed/plant_fallback/1200/800';
            }}
          />

          <div className="absolute bottom-4 text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantGallery;
