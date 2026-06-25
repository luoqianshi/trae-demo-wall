import { useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import CollectionList from '@/components/profile/CollectionList';
import HistoryTimeline from '@/components/profile/HistoryTimeline';

type TabType = 'collection' | 'history';

const Collection = () => {
  const [activeTab, setActiveTab] = useState<TabType>('collection');

  return (
    <div className="min-h-screen bg-bg-cream">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold text-text-dark mb-8">我的草木</h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-6 py-3 rounded-card font-medium transition-all ${
              activeTab === 'collection'
                ? 'bg-plant-green text-white'
                : 'bg-white text-text-dark hover:bg-plant-green/10'
            }`}
          >
            收藏列表
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-card font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-plant-green text-white'
                : 'bg-white text-text-dark hover:bg-plant-green/10'
            }`}
          >
            识别记录
          </button>
        </div>

        {activeTab === 'collection' ? <CollectionList /> : <HistoryTimeline />}
      </main>

      <Footer />
    </div>
  );
};

export default Collection;
