import { Plant, TabType } from '@/types';

interface TabContentProps {
  plant: Plant;
  activeTab: TabType;
}

const TabContent = ({ plant, activeTab }: TabContentProps) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <p className="text-lg text-text-dark leading-relaxed">
              {plant.overview.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-bg-beige rounded-card">
                <p className="text-text-medium text-sm">科属</p>
                <p className="font-semibold text-text-dark">{plant.family}</p>
              </div>
              <div className="p-4 bg-bg-beige rounded-card">
                <p className="text-text-medium text-sm">属</p>
                <p className="font-semibold text-text-dark">{plant.genus}</p>
              </div>
              <div className="p-4 bg-bg-beige rounded-card">
                <p className="text-text-medium text-sm">花期</p>
                <p className="font-semibold text-text-dark">{plant.overview.floweringPeriod}</p>
              </div>
              <div className="p-4 bg-bg-beige rounded-card">
                <p className="text-text-medium text-sm">别名</p>
                <p className="font-semibold text-text-dark">{plant.aliases.join('、')}</p>
              </div>
            </div>

            <div className="p-4 bg-bg-beige rounded-card">
              <p className="text-text-medium text-sm mb-2">形态特征</p>
              <p className="text-text-dark">{plant.overview.features}</p>
            </div>

            <div className="p-4 bg-bg-beige rounded-card">
              <p className="text-text-medium text-sm mb-2">生长环境</p>
              <p className="text-text-dark">{plant.overview.habitat}</p>
            </div>

            <div className="p-4 bg-bg-beige rounded-card">
              <p className="text-text-medium text-sm mb-2">分布范围</p>
              <p className="text-text-dark">{plant.overview.distribution}</p>
            </div>
          </div>
        );

      case 'value':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-plant-green/10 rounded-card">
              <h4 className="font-semibold text-text-dark mb-2">药用价值</h4>
              <p className="text-text-dark">{plant.value.medicinal}</p>
            </div>

            <div className="p-4 bg-accent-amber/10 rounded-card">
              <h4 className="font-semibold text-text-dark mb-2">食用价值</h4>
              <p className="text-text-dark">{plant.value.edible}</p>
            </div>

            <div className="p-4 bg-emphasis-coral/10 rounded-card">
              <h4 className="font-semibold text-text-dark mb-2">观赏价值</h4>
              <p className="text-text-dark">{plant.value.ornamental}</p>
            </div>

            <div className="p-4 bg-plant-sage/10 rounded-card">
              <h4 className="font-semibold text-text-dark mb-2">生态价值</h4>
              <p className="text-text-dark">{plant.value.ecological}</p>
            </div>
          </div>
        );

      case 'culture':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-bg-beige rounded-card">
              <h4 className="font-semibold text-text-dark mb-2">文化寓意</h4>
              <p className="text-text-dark">{plant.culture.meaning}</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-plant-dark/5 to-plant-green/5 rounded-card border border-plant-green/10">
              <h4 className="font-semibold text-text-dark mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-plant-green rounded-full" />
                相关诗句
              </h4>
              <blockquote className="text-text-dark italic">
                {plant.culture.poem}
              </blockquote>
            </div>

            <div className="p-4 bg-bg-beige rounded-card">
              <h4 className="font-semibold text-text-dark mb-2">传说故事</h4>
              <p className="text-text-dark">{plant.culture.story}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="animate-fade-in">{renderContent()}</div>;
};

export default TabContent;
