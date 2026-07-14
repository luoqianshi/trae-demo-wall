import { useState } from 'react';
import { Gift, Award, History, ShoppingCart, Check } from 'lucide-react';
import { gifts, certificates } from '@/data/mockData';
import { useStore } from '@/store/useStore';
import { RedeemModal } from '@/components/RedeemModal';
import type { Gift as GiftType } from '@/types';

export function Shop() {
  const [activeTab, setActiveTab] = useState<'gifts' | 'certificates' | 'history'>('gifts');
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const { user, checkins } = useStore();

  const tabs = [
    { id: 'gifts' as const, label: '礼品兑换', icon: Gift },
    { id: 'certificates' as const, label: '证书中心', icon: Award },
    { id: 'history' as const, label: '积分记录', icon: History },
  ];

  const earnedCertificates = certificates.filter(c => user.points >= c.requiredPoints);
  const pendingCertificates = certificates.filter(c => user.points < c.requiredPoints);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">积分商城</h1>
          <p className="text-gray-500">用积分兑换精美礼品，获取专属证书</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <div className="flex items-center justify-center gap-2 bg-accent-50 rounded-xl px-6 py-3">
            <ShoppingCart className="w-6 h-6 text-accent-600" />
            <span className="text-gray-600">当前积分</span>
            <span className="text-2xl font-bold text-accent-600">🎁 {user.points}</span>
          </div>
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

        {activeTab === 'gifts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={gift.image}
                    alt={gift.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {gift.stock < 20 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      仅剩 {gift.stock} 件
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{gift.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{gift.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-accent-600">🎁 {gift.price}</span>
                    <button
                      onClick={() => setSelectedGift(gift)}
                      disabled={user.points < gift.price}
                      className={`px-6 py-2 rounded-xl font-medium transition-all ${
                        user.points >= gift.price
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {user.points >= gift.price ? '兑换' : '积分不足'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Check className="w-6 h-6 text-green-500" />
                已获得证书
              </h2>
              {earnedCertificates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {earnedCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center border-2 border-green-200"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 bg-green-200 rounded-full flex items-center justify-center">
                        <Award className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-green-800 mb-2">{cert.name}</h3>
                      <p className="text-green-600 text-sm mb-4">{cert.description}</p>
                      <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                        查看证书
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无获得证书，继续努力回收网球吧！</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">努力目标</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {pendingCertificates.map((cert) => {
                  const progress = Math.min(100, (user.points / cert.requiredPoints) * 100);
                  return (
                    <div
                      key={cert.id}
                      className="bg-white rounded-2xl shadow-lg p-6"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Award className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{cert.name}</h3>
                      <p className="text-gray-500 text-sm mb-4">{cert.description}</p>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-500">进度</span>
                          <span className="text-primary-600 font-medium">{user.points} / {cert.requiredPoints}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 text-center">还需 {cert.requiredPoints - user.points} 积分</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">积分记录</h2>
            </div>
            <div className="divide-y">
              {checkins.length > 0 ? (
                checkins.map((checkin) => (
                  <div key={checkin.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Gift className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">回收网球奖励</p>
                        <p className="text-sm text-gray-500">回收 {checkin.tennisCount} 个网球</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{checkin.pointsEarned}</p>
                      <p className="text-sm text-gray-400">{checkin.createdAt}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无积分记录，快去打卡回收吧！</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedGift && (
        <RedeemModal gift={selectedGift} onClose={() => setSelectedGift(null)} />
      )}
    </div>
  );
}
