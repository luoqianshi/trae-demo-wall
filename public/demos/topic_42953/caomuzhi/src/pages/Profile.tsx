import { useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ProfileCard from '@/components/profile/ProfileCard';
import BadgeSystem from '@/components/profile/BadgeSystem';
import CollectionList from '@/components/profile/CollectionList';
import HistoryTimeline from '@/components/profile/HistoryTimeline';
import StatsChart from '@/components/profile/StatsChart';

type TabType = 'profile' | 'collection' | 'history' | 'stats';

const Profile = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'profile', label: '个人信息' },
    { id: 'collection', label: '我的收藏' },
    { id: 'history', label: '识别记录' },
    { id: 'stats', label: '数据统计' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <ProfileCard />
            <BadgeSystem />
          </div>
        );
      case 'collection':
        return <CollectionList />;
      case 'history':
        return <HistoryTimeline />;
      case 'stats':
        return <StatsChart />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-cream">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold text-text-dark mb-8">个人中心</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-card font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-plant-green text-white'
                  : 'bg-white text-text-dark hover:bg-plant-green/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderContent()}
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
