import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Heart, History } from 'lucide-react';
import { getPlantById } from '@/data/plantsData';
import { Plant, TabType } from '@/types';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import PlantGallery from '@/components/detail/PlantGallery';
import TabContent from '@/components/detail/TabContent';
import AncientTab from '@/components/detail/AncientTab';
import RelatedPlants from '@/components/detail/RelatedPlants';
import FloatingActions from '@/components/detail/FloatingActions';
import Loading from '@/components/common/Loading';

const tabs: { id: TabType | 'ancient'; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: '概述', icon: BookOpen },
  { id: 'value', label: '价值', icon: Sparkles },
  { id: 'culture', label: '文化', icon: Heart },
  { id: 'ancient', label: '古籍', icon: History }
];

const Detail = () => {
  const { id } = useParams<{ id: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType | 'ancient'>('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const plantId = parseInt(id || '1');
    const foundPlant = getPlantById(plantId);
    
    if (foundPlant) {
      setPlant(foundPlant);
      document.title = `${foundPlant.name} - 草木志`;
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    return () => {
      document.title = '草木志 - 用AI探索自然之美';
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!plant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-medium mb-4">未找到该植物</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-cream">
      <Navbar />

      <button
        onClick={() => navigate(-1)}
        className="fixed top-20 left-4 z-40 p-3 glass rounded-full hover:bg-white/90 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-text-dark" />
      </button>

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="tag tag-green">{plant.category}</span>
                {plant.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="tag tag-amber">{tag}</span>
                ))}
              </div>
              <h1 className="text-4xl font-bold text-text-dark mb-2">{plant.name}</h1>
              <p className="text-text-medium italic">{plant.latinName}</p>
            </div>

            <PlantGallery plant={plant} />

            <div className="mt-8">
              <div className="flex border-b border-plant-green/20">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                      activeTab === tab.id
                        ? 'text-plant-green border-b-2 border-plant-green bg-plant-green/5'
                        : 'text-text-medium hover:text-text-dark hover:bg-plant-green/5'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 bg-white rounded-card mt-4">
                {activeTab === 'ancient' ? (
                  <AncientTab plant={plant} />
                ) : (
                  <TabContent plant={plant} activeTab={activeTab as TabType} />
                )}
              </div>
            </div>

            <RelatedPlants plant={plant} />
          </div>

          <div className="lg:col-span-1">
            <FloatingActions plant={plant} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Detail;
