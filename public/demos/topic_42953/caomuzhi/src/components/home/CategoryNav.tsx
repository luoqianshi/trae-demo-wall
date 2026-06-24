import { useState } from 'react';
import { Flower2, TreeDeciduous, Leaf, Sun, Mountain, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categories = [
  { id: 'flower', name: '花卉', icon: Flower2, color: 'bg-rose-500', textColor: 'text-rose-500', count: 12 },
  { id: 'tree', name: '树木', icon: TreeDeciduous, color: 'bg-emerald-600', textColor: 'text-emerald-600', count: 8 },
  { id: 'grass', name: '草本', icon: Leaf, color: 'bg-green-500', textColor: 'text-green-500', count: 15 },
  { id: 'fruit', name: '果实', icon: Sun, color: 'bg-amber-500', textColor: 'text-amber-500', count: 6 },
  { id: 'wild', name: '野生', icon: Mountain, color: 'bg-teal-500', textColor: 'text-teal-500', count: 10 },
  { id: 'medicinal', name: '药用', icon: Sparkles, color: 'bg-indigo-500', textColor: 'text-indigo-500', count: 9 }
];

const CategoryNav = () => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-bg-cream">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-dark mb-3">探索分类</h2>
          <p className="text-text-medium">浏览不同类别的植物，发现自然之美</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((category) => {
            const Icon = category.icon;
            const isHovered = hoveredCategory === category.id;
            
            return (
              <button
                key={category.id}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => navigate(`/plants/${category.id}`)}
                className={`group relative flex flex-col items-center p-5 rounded-2xl transition-all duration-300 cursor-pointer ${
                  isHovered ? 'shadow-xl -translate-y-2' : 'shadow-md hover:shadow-lg'
                }`}
                style={{ backgroundColor: isHovered ? '#f0fdf4' : '#ffffff' }}
              >
                <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  isHovered ? 'scale-110 shadow-lg' : 'group-hover:scale-105'
                }`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-lg font-semibold text-text-dark mb-1">{category.name}</h3>
                
                <span className={`text-sm ${category.textColor} opacity-80`}>
                  {category.count} 种
                </span>
                
                <div className={`absolute bottom-2 left-0 right-0 flex justify-center transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                  <span className={`text-xs px-3 py-1 rounded-full ${category.color} text-white`}>
                    点击浏览
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryNav;
