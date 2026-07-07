import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Users, Calendar, TrendingUp, Home, Briefcase, Award, GraduationCap, DollarSign, ArrowRight } from 'lucide-react';
import { nomadCommunities, cityPolicies, regionStats } from '@/data/nomadData';
import type { NomadCommunity, CityPolicy } from '@/data/nomadData';

type TabType = 'communities' | 'policies';
type RegionFilter = 'all' | 'yangtze' | 'hainan' | 'southwest' | 'shandong';

export default function DigitalNomadPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('communities');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [selectedPolicy, setSelectedPolicy] = useState<CityPolicy | null>(null);

  const filteredCommunities = regionFilter === 'all'
    ? nomadCommunities
    : nomadCommunities.filter(c => c.region === regionFilter);

  const sortedCommunities = [...filteredCommunities].sort((a, b) => b.rating - a.rating);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'housing': return <Home size={16} />;
      case 'business': return <Briefcase size={16} />;
      case 'tax': return <DollarSign size={16} />;
      case 'talent': return <GraduationCap size={16} />;
      case 'visa': return <ArrowRight size={16} />;
      default: return <Award size={16} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'housing': return 'bg-blue-100 text-blue-700';
      case 'business': return 'bg-green-100 text-green-700';
      case 'tax': return 'bg-amber-100 text-amber-700';
      case 'talent': return 'bg-purple-100 text-purple-700';
      case 'visa': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'housing': return '住房';
      case 'business': return '创业';
      case 'tax': return '税收';
      case 'talent': return '人才';
      case 'visa': return '签证';
      default: return '其他';
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16">
      {/* Hero区域 */}
      <div className="bg-gradient-hero pt-8 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">💻🌴</div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-800 font-display mb-2">
              数字游民地图
            </h1>
            <p className="text-primary-700/60 max-w-lg mx-auto">
              边工作边旅行，找到最适合你的数字游民社区和城市
            </p>
          </div>

          {/* 区域统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-3xl mx-auto">
            {regionStats.map((region) => (
              <div
                key={region.region}
                onClick={() => { setRegionFilter(region.region === '长三角' ? 'yangtze' : region.region === '海南' ? 'hainan' : region.region === '西南' ? 'southwest' : 'shandong'); setActiveTab('communities'); }}
                className={`p-4 rounded-2xl cursor-pointer transition-all hover:scale-105 ${
                  (regionFilter === 'yangtze' && region.region === '长三角') ||
                  (regionFilter === 'hainan' && region.region === '海南') ||
                  (regionFilter === 'southwest' && region.region === '西南') ||
                  (regionFilter === 'shandong' && region.region === '山东')
                    ? 'ring-2 ring-accent-400 ring-offset-2'
                    : ''
                }`}
              >
                <div className={`w-full h-24 rounded-xl bg-gradient-to-br ${region.color} flex items-center justify-center text-4xl mb-3`}>
                  {region.icon}
                </div>
                <div className="text-lg font-bold text-primary-800">{region.region}</div>
                <div className="text-xs text-primary-700/60">
                  {region.count}+ 个社区 · {region.label}
                </div>
              </div>
            ))}
          </div>

          {/* Tab切换 */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-1.5 shadow-card inline-flex">
              <button
                onClick={() => setActiveTab('communities')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'communities'
                    ? 'bg-accent-500 text-white shadow-md'
                    : 'text-primary-700 hover:bg-primary-50'
                }`}
              >
                <Home size={18} />
                社区大全
              </button>
              <button
                onClick={() => setActiveTab('policies')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'policies'
                    ? 'bg-accent-500 text-white shadow-md'
                    : 'text-primary-700 hover:bg-primary-50'
                }`}
              >
                <Award size={18} />
                政策对比
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        {/* 社区大全 */}
        {activeTab === 'communities' && (
          <div>
            {/* 筛选栏 */}
            <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-primary-700/50 mr-2">区域：</span>
                <button
                  onClick={() => setRegionFilter('all')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                    regionFilter === 'all'
                      ? 'bg-accent-500 text-white'
                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  全部
                </button>
                {[
                  { key: 'yangtze' as RegionFilter, label: '长三角' },
                  { key: 'hainan' as RegionFilter, label: '海南' },
                  { key: 'southwest' as RegionFilter, label: '西南' },
                  { key: 'shandong' as RegionFilter, label: '山东' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setRegionFilter(opt.key)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                      regionFilter === opt.key
                        ? 'bg-accent-500 text-white'
                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="ml-auto text-sm text-primary-700/50">
                  共 {sortedCommunities.length} 个社区
                </div>
              </div>
            </div>

            {/* 社区列表 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedCommunities.map((community, index) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  index={index}
                  onBookFlight={() => {
                    navigate(`/boomerang?to=${community.city}`);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 政策对比 */}
        {activeTab === 'policies' && (
          <div>
            {!selectedPolicy ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cityPolicies.map((policy, index) => (
                  <div
                    key={policy.id}
                    onClick={() => setSelectedPolicy(policy)}
                    className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden card-hover"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-32 bg-gradient-to-br from-accent-400 to-tealish-500 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-3xl font-bold font-display">{policy.city}</div>
                        <div className="text-sm opacity-80">{policy.province}</div>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-primary-700/70 mb-4 line-clamp-3">
                        {policy.overview}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {policy.highlights.slice(0, 3).map((h, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs bg-accent-50 text-accent-600 rounded-lg"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-primary-700/60">
                          <Briefcase size={14} />
                          {policy.policies.length} 项政策
                        </div>
                        <div className="text-sm text-accent-500 font-medium flex items-center gap-1">
                          查看详情
                          <TrendingUp size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="animate-fade-in">
                <button
                  onClick={() => setSelectedPolicy(null)}
                  className="mb-4 text-sm text-primary-700/60 hover:text-accent-500 flex items-center gap-1"
                >
                  ← 返回城市列表
                </button>
                <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-accent-500 to-tealish-500 flex items-center justify-center relative">
                    <div className="text-center text-white">
                      <div className="text-5xl font-bold font-display mb-2">{selectedPolicy.city}</div>
                      <div className="text-lg opacity-90">{selectedPolicy.province}</div>
                    </div>
                    <button
                      onClick={() => navigate(`/boomerang?to=${selectedPolicy.city}`)}
                      className="absolute bottom-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                      <ArrowRight size={16} />
                      飞过去工作
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-primary-700/80 mb-6">{selectedPolicy.overview}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedPolicy.policies.map((policy, index) => (
                        <div
                          key={index}
                          className="p-4 bg-primary-50/50 rounded-xl border border-gray-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(policy.category)}`}>
                              {getCategoryIcon(policy.category)}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(policy.category)}`}>
                              {getCategoryLabel(policy.category)}
                            </span>
                          </div>
                          <h4 className="font-bold text-primary-800 mb-1">{policy.title}</h4>
                          <p className="text-sm text-primary-700/60 mb-2">{policy.description}</p>
                          {policy.amount && (
                            <div className="text-sm font-bold text-accent-500">
                              {policy.amount}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityCard({ community, index, onBookFlight }: { community: NomadCommunity; index: number; onBookFlight: () => void }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden card-hover group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-40 bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center relative overflow-hidden">
        <div className="text-6xl animate-float">{community.image}</div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
          {community.regionLabel}
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
          <Star size={12} fill="white" />
          {community.rating}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-lg text-primary-800">{community.name}</h3>
            <div className="flex items-center gap-1 text-sm text-primary-700/60">
              <MapPin size={14} />
              {community.province} · {community.city}
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-700/70 mb-4 line-clamp-2">
          {community.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {community.highlights.map((h, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs bg-accent-50 text-accent-600 rounded-lg"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-accent-500">¥{community.rentStart}</div>
            <div className="text-xs text-primary-700/50">月租起</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-lg font-bold text-primary-700">{community.activities}</div>
            <div className="text-xs text-primary-700/50">活动数</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-tealish-500">{community.residents >= 1000 ? `${(community.residents/1000).toFixed(1)}k` : community.residents}</div>
            <div className="text-xs text-primary-700/50">累计入住</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onBookFlight(); }}
            className="flex-1 py-2 bg-gradient-to-r from-accent-500 to-accent-400 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-accent-500/30 transition-all"
          >
            找机票过去
          </button>
        </div>
      </div>
    </div>
  );
}
