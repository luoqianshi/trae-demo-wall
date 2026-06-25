import { useState, useEffect } from 'react';
import { Search, Mic, ChevronDown, Leaf } from 'lucide-react';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const tags = ['银杏', '玫瑰', '薄荷', '竹子', '菊花', '桂花'];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const element = document.getElementById('hot-plants');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const leaves = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 7,
    size: 15 + Math.random() * 20
  }));

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-plant-dark via-plant-green to-plant-medium animate-gradient-flow" />
      
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute top-0 animate-leafFall opacity-60"
          style={{
            left: `${leaf.left}%`,
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.duration}s`
          }}
        >
          <Leaf
            className="text-accent-amber/40"
            style={{ width: leaf.size, height: leaf.size }}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-black/10" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 glass rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-plant-green" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-white via-accent-amber to-white bg-clip-text text-transparent">
              草木志
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
            用 AI 探索自然之美，传承千年古籍智慧
          </p>

          <div className="relative max-w-2xl mx-auto">
            <div
              className={`glass rounded-full px-6 py-4 flex items-center gap-4 transition-all duration-300 ${
                showSearch ? 'shadow-lg shadow-plant-green/20' : ''
              }`}
            >
              <Search className="w-6 h-6 text-plant-green" />
              <input
                type="text"
                placeholder="搜索植物名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-transparent border-none outline-none text-text-dark placeholder-text-light text-lg"
              />
              <button className="p-2 hover:bg-plant-green/10 rounded-full transition-colors">
                <Mic className="w-5 h-5 text-plant-green" />
              </button>
              <button
                onClick={handleSearch}
                className="btn-primary rounded-full px-6"
              >
                搜索
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    handleSearch();
                  }}
                  className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-tag text-sm hover:bg-white/30 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/60" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
