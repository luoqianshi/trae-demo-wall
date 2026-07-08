import { ArrowRightLeft, CalendarDays, MapPin, Search as SearchIcon } from 'lucide-react';
import { useSearchStore } from '@/store/useSearchStore';
import { useNavigate } from 'react-router-dom';
import { hotCities } from '@/data/mockData';
import { allCityNames } from '@/data/cityDatabase';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
}

export default function SearchBar({ variant = 'hero' }: SearchBarProps) {
  const { from, to, date, setFrom, setTo, setDate, swapFromTo, search } = useSearchStore();
  const { addSearchHistory } = useAuthStore();
  const navigate = useNavigate();
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');

  const filteredFromCities = allCityNames.filter(c =>
    c.includes(fromQuery) || c === from
  );
  const filteredToCities = allCityNames.filter(c =>
    c.includes(toQuery) || c === to
  );

  const handleSearch = () => {
    search();
    addSearchHistory(from, to, date);
    navigate('/search');
  };

  const isHero = variant === 'hero';

  return (
    <div
      className={`${
        isHero
          ? 'bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8'
          : 'bg-white rounded-2xl shadow-card p-4'
      }`}
    >
      <div className={`flex ${isHero ? 'flex-col md:flex-row' : 'flex-col sm:flex-row'} items-stretch gap-3 md:gap-4`}>
        <div className="flex-1 relative">
          <label className={`text-xs text-primary-700/60 mb-1 block ${isHero ? '' : 'hidden'}`}>
            出发城市
          </label>
          <div
            className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-2xl border border-transparent focus-within:border-accent-400 focus-within:bg-white transition-all cursor-pointer"
            onClick={() => {
              setShowFromDropdown(!showFromDropdown);
              setShowToDropdown(false);
              setFromQuery('');
            }}
          >
            <MapPin size={18} className="text-accent-500" />
            <span className="font-semibold text-primary-800">{from}</span>
          </div>
          {showFromDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 max-h-64 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 px-2">
                <SearchIcon size={14} className="text-primary-300" />
                <input
                  type="text"
                  value={fromQuery}
                  onChange={(e) => setFromQuery(e.target.value)}
                  placeholder="搜索城市..."
                  className="flex-1 text-sm outline-none bg-transparent"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 mb-2 px-2">
                {fromQuery ? `搜索结果 (${filteredFromCities.length})` : '热门城市'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(fromQuery ? filteredFromCities : hotCities).map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setFrom(city);
                      setShowFromDropdown(false);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      city === from
                        ? 'bg-accent-500 text-white'
                        : 'bg-primary-50 hover:bg-accent-100 hover:text-accent-600'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
              {fromQuery && filteredFromCities.length === 0 && (
                <p className="text-center text-sm text-primary-700/40 py-4">
                  未找到「{fromQuery}」，暂不支持该城市
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={swapFromTo}
          className={`self-center flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-accent-100 text-accent-600 hover:bg-accent-200 transition-all ${
            isHero ? 'md:mx-0' : 'sm:mx-0'
          }`}
        >
          <ArrowRightLeft size={18} className="rotate-90 md:rotate-0" />
        </button>

        <div className="flex-1 relative">
          <label className={`text-xs text-primary-700/60 mb-1 block ${isHero ? '' : 'hidden'}`}>
            到达城市
          </label>
          <div
            className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-2xl border border-transparent focus-within:border-accent-400 focus-within:bg-white transition-all cursor-pointer"
            onClick={() => {
              setShowToDropdown(!showToDropdown);
              setShowFromDropdown(false);
              setToQuery('');
            }}
          >
            <MapPin size={18} className="text-tealish-500" />
            <span className="font-semibold text-primary-800">{to}</span>
          </div>
          {showToDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 max-h-64 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 px-2">
                <SearchIcon size={14} className="text-primary-300" />
                <input
                  type="text"
                  value={toQuery}
                  onChange={(e) => setToQuery(e.target.value)}
                  placeholder="搜索城市..."
                  className="flex-1 text-sm outline-none bg-transparent"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 mb-2 px-2">
                {toQuery ? `搜索结果 (${filteredToCities.length})` : '热门城市'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(toQuery ? filteredToCities : hotCities).map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setTo(city);
                      setShowToDropdown(false);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      city === to
                        ? 'bg-tealish-500 text-white'
                        : 'bg-primary-50 hover:bg-tealish-400/10 hover:text-tealish-600'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
              {toQuery && filteredToCities.length === 0 && (
                <p className="text-center text-sm text-primary-700/40 py-4">
                  未找到「{toQuery}」，暂不支持该城市
                </p>
              )}
            </div>
          )}
        </div>

        <div className={`flex-1 ${isHero ? 'md:max-w-[180px]' : 'sm:max-w-[160px]'}`}>
          <label className={`text-xs text-primary-700/60 mb-1 block ${isHero ? '' : 'hidden'}`}>
            出发日期
          </label>
          <div className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-2xl">
            <CalendarDays size={18} className="text-gold-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent flex-1 outline-none text-sm font-semibold text-primary-800 w-full"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className={`flex items-center justify-center gap-2 ${
            isHero
              ? 'px-8 py-3.5 text-base'
              : 'px-6 py-3 text-sm'
          } bg-gradient-to-r from-accent-500 to-accent-400 text-white font-semibold rounded-2xl hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5`}
        >
          搜索中转
        </button>
      </div>

      {isHero && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-primary-700/50">热门搜索：</span>
          {['北京→上海', '广州→成都', '上海→西安', '深圳→成都', '成都→北京', '杭州→重庆'].map((item) => (
            <button
              key={item}
              onClick={() => {
                const [f, t] = item.split('→');
                setFrom(f);
                setTo(t);
                handleSearch();
              }}
              className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full hover:bg-accent-100 hover:text-accent-600 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
