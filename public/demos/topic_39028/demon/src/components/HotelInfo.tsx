import { Hotel, Star, MapPin, Calendar, CreditCard } from 'lucide-react';
import type { Hotel as HotelType } from '../data/mockData';

interface HotelInfoProps {
  hotels: HotelType[];
}

export function HotelInfo({ hotels }: HotelInfoProps) {
  return (
    <div className="space-y-4">
      {hotels.map((hotel, idx) => (
        <div
          key={idx}
          className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex flex-col md:flex-row">
            <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
              <img
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Hotel size={18} className="text-orange-500" />
                    <span className="text-xs font-medium text-orange-500 uppercase tracking-wider">
                      Accommodation
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{hotel.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{hotel.address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{hotel.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Check-in</p>
                    <p className="font-medium text-gray-700">{hotel.checkIn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Check-out</p>
                    <p className="font-medium text-gray-700">{hotel.checkOut}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Total Price</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-orange-500">¥{hotel.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
