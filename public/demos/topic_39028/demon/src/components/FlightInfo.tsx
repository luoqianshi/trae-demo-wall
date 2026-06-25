import { Plane, ArrowRight, Clock, CreditCard } from 'lucide-react';
import type { Flight } from '../data/mockData';

interface FlightInfoProps {
  flights: Flight[];
}

export function FlightInfo({ flights }: FlightInfoProps) {
  return (
    <div className="space-y-4">
      {flights.map((flight, idx) => (
        <div
          key={idx}
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                <Plane size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800">{flight.airline}</p>
                <p className="text-xs text-gray-500">{flight.flightNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Price</p>
              <p className="text-xl font-bold text-orange-500">¥{flight.price.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">{flight.departureTime}</p>
              <p className="text-sm text-gray-500 mt-1">{flight.departure}</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center w-full">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <div className="flex-1 h-px bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 mx-2 relative">
                  <Plane size={14} className="text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <Clock size={12} />
                <span>Direct</span>
              </div>
            </div>

            <div className="col-start-2 text-right">
              <p className="text-2xl font-bold text-gray-800">{flight.arrivalTime}</p>
              <p className="text-sm text-gray-500 mt-1">{flight.arrival}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
