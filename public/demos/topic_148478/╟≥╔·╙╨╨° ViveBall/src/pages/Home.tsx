import { Link } from 'react-router-dom';
import { Tennis, Users, Gift, Leaf, ArrowRight, Sparkles } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { KnowledgeCard } from '@/components/KnowledgeCard';
import { ActivityCard } from '@/components/ActivityCard';
import { stats, knowledgeList, activities } from '@/data/mockData';

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>2026 Trae AI 创造力大赛 · 社会公益赛道</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
              让每一个网球<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
                重获新生
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              每年全球约有1.2亿个网球被丢弃，降解需要400-500年。
              加入我们，一起回收旧网球，守护绿色家园！
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/checkin"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                立即打卡回收
              </Link>
              <Link
                to="/knowledge"
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-xl font-bold text-lg shadow-md hover:shadow-lg border border-gray-100 transition-all"
              >
                了解更多
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Tennis className="w-6 h-6 text-primary-600" />}
              value={stats.totalTennis}
              label="累计回收网球"
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-primary-600" />}
              value={stats.totalUsers}
              label="参与用户"
            />
            <StatCard
              icon={<Gift className="w-6 h-6 text-primary-600" />}
              value={stats.totalPoints}
              label="发放积分"
            />
            <StatCard
              icon={<Leaf className="w-6 h-6 text-primary-600" />}
              value={stats.savedResources.carbonReduction}
              label="减少碳排放(g)"
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                环保知识
              </h2>
              <p className="text-gray-500">了解旧网球的环境危害，成为环保达人</p>
            </div>
            <Link
              to="/knowledge"
              className="flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              查看全部 <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {knowledgeList.slice(0, 2).map((knowledge) => (
              <KnowledgeCard key={knowledge.id} knowledge={knowledge} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                热门活动
              </h2>
              <p className="text-gray-500">参与环保活动，赢取丰厚奖励</p>
            </div>
            <Link
              to="/activities"
              className="flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
            >
              查看全部 <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              加入我们，一起守护地球
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              每回收一个网球，就相当于节约了30克橡胶和20克塑料。
              让我们一起行动，为地球做出贡献！
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/checkin"
                className="w-full sm:w-auto px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                开始回收之旅
              </Link>
              <Link
                to="/leaderboard"
                className="w-full sm:w-auto px-8 py-4 bg-white/20 text-white rounded-xl font-bold text-lg border border-white/30 hover:bg-white/30 transition-all"
              >
                查看排行榜
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
