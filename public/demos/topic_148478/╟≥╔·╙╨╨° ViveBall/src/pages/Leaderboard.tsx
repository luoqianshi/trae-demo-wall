import { useState } from 'react';
import { Trophy, Users, Globe, Star, Shield, Medal, Award, Share2 } from 'lucide-react';
import { friendLeaderboard, nationalLeaderboard, badges } from '@/data/mockData';
import { useStore } from '@/store/useStore';

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'friends' | 'national' | 'achievements'>('friends');
  const { user } = useStore();

  const tabs = [
    { id: 'friends' as const, label: '好友排行', icon: Users },
    { id: 'national' as const, label: '全国排行', icon: Globe },
    { id: 'achievements' as const, label: '个人成就', icon: Award },
  ];

  const userBadges = badges.filter(b => user.badges.includes(b.id));
  const lockedBadges = badges.filter(b => !user.badges.includes(b.id));

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Star': return <Star className="w-6 h-6" />;
      case 'Shield': return <Shield className="w-6 h-6" />;
      case 'Trophy': return <Trophy className="w-6 h-6" />;
      case 'Moon': return <Medal className="w-6 h-6" />;
      case 'Users': return <Users className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-accent-100 text-accent-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Trophy className="w-4 h-4" />
            <span>排行榜</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">环保英雄榜</h1>
          <p className="text-gray-500">与好友一起PK，成为环保冠军</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 shadow'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friendLeaderboard.map((entry, index) => {
              const isCurrentUser = entry.userId === user.id;
              return (
                <div
                  key={entry.userId}
                  className={`bg-white rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl ${
                    isCurrentUser ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      index < 3 ? 'bg-gradient-to-br from-accent-100 to-accent-200' : 'bg-gray-100'
                    }`}>
                      {getRankBadge(entry.rank)}
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                        src={entry.avatar}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-lg ${
                          isCurrentUser ? 'text-primary-600' : 'text-gray-800'
                        }`}>
                          {entry.name}
                          {isCurrentUser && <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">我</span>}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>🎾 {entry.totalTennis} 个网球</span>
                        <span>🎁 {entry.points} 积分</span>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Share2 className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  {index < 3 && (
                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                          'bg-gradient-to-r from-orange-300 to-orange-400'
                        }`}
                        style={{ width: `${(entry.totalTennis / friendLeaderboard[0].totalTennis) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'national' && (
          <div className="space-y-4">
            {nationalLeaderboard.map((entry, index) => {
              return (
                <div
                  key={entry.userId}
                  className="bg-white rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      index < 3 ? 'bg-gradient-to-br from-accent-100 to-accent-200' : 'bg-gray-100'
                    }`}>
                      {getRankBadge(entry.rank)}
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                        src={entry.avatar}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">{entry.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>🎾 {entry.totalTennis} 个网球</span>
                        <span>🎁 {entry.points} 积分</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
              <h2 className="text-xl font-bold mb-4">我的成就</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{user.totalTennis}</div>
                  <div className="text-white/80 text-sm">回收网球</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{user.points}</div>
                  <div className="text-white/80 text-sm">获得积分</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{user.badges.length}</div>
                  <div className="text-white/80 text-sm">获得勋章</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{user.badges.length === badges.length ? '全' : `${Math.round((user.badges.length / badges.length) * 100)}%`}</div>
                  <div className="text-white/80 text-sm">完成度</div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">已获得勋章</h2>
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {userBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 text-center border-2 border-accent-200"
                    >
                      <div className="w-14 h-14 mx-auto mb-2 bg-accent-200 rounded-full flex items-center justify-center text-accent-600">
                        {getBadgeIcon(badge.icon)}
                      </div>
                      <h3 className="font-bold text-accent-800 text-sm">{badge.name}</h3>
                      <p className="text-accent-600 text-xs mt-1">{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无获得勋章，继续努力回收网球吧！</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">待解锁勋章</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gray-50 rounded-xl p-4 text-center border-2 border-gray-200 opacity-60"
                  >
                    <div className="w-14 h-14 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                      {getBadgeIcon(badge.icon)}
                    </div>
                    <h3 className="font-bold text-gray-600 text-sm">{badge.name}</h3>
                    <p className="text-gray-400 text-xs mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
