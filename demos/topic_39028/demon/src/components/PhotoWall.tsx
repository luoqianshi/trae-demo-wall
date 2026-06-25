import { useState } from 'react';
import { X } from 'lucide-react';
import type { Photo } from '../data/mockData';

interface PhotoWallProps {
  photos: Photo[];
}

export function PhotoWall({ photos }: PhotoWallProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="break-inside-avoid group relative overflow-hidden rounded-2xl cursor-pointer hover:shadow-lg transition-all"
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium">{photo.caption}</p>
                <p className="text-white/70 text-xs">{photo.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="max-w-3xl max-h-[90vh] flex flex-col items-center">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white text-lg font-medium">{selectedPhoto.caption}</p>
              <p className="text-white/60 text-sm mt-1">{selectedPhoto.date}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
