import { Search, Plus, User, ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/travel/');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {isDetail ? (
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Moment
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!isDetail && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search travels..."
                className="bg-transparent border-none outline-none text-sm w-40"
              />
            </div>
          )}
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Plus size={20} className="text-gray-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <User size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </nav>
  );
}
