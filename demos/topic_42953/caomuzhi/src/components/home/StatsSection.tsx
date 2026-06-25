import { useEffect, useState } from 'react';
import { Leaf, Users, BookOpen, Camera } from 'lucide-react';

const stats = [
  { icon: Leaf, value: 200, label: '收录草木', suffix: '+', color: 'text-plant-green' },
  { icon: Users, value: 50000, label: '注册用户', suffix: '+', color: 'text-plant-medium' },
  { icon: BookOpen, value: 50, label: '古籍文献', suffix: '+', color: 'text-accent-amber' },
  { icon: Camera, value: 100000, label: '识别次数', suffix: '+', color: 'text-emphasis-coral' }
];

const StatsSection = () => {
  const [animatedValues, setAnimatedValues] = useState<number[]>(stats.map(() => 0));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    stats.forEach((stat, index) => {
      let current = 0;
      const increment = stat.value / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.value) {
          setAnimatedValues((prev) => {
            const newValues = [...prev];
            newValues[index] = stat.value;
            return newValues;
          });
          clearInterval(timer);
        } else {
          setAnimatedValues((prev) => {
            const newValues = [...prev];
            newValues[index] = Math.floor(current);
            return newValues;
          });
        }
      }, interval);
    });
  }, [isVisible]);

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  return (
    <section id="stats-section" className="py-16 bg-bg-cream">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-card bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-plant-green/10 flex items-center justify-center`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                {formatNumber(animatedValues[index])}{stat.suffix}
              </div>
              <div className="text-text-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
