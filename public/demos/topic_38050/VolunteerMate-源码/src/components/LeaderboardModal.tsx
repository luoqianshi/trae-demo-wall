import { useState } from 'react';
import { Trophy, Medal, Crown, Flame, Target, ChevronRight, X } from 'lucide-react';
import { getLeaderboardWithUser, LeaderboardUser } from '../data/leaderboard';
import { useStore } from '../store/useStore';

interface LeaderboardModalProps {
  onClose: () => void;
}

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const { stats } = useStore();
  const [selectedTab, setSelectedTab] = useState<'time' | 'streak' | 'checkIns'>('time');
  const leaderboard = getLeaderboardWithUser(stats);

  const getSortedLeaderboard = (): LeaderboardUser[] => {
    switch (selectedTab) {
      case 'streak':
        return [...leaderboard].sort((a, b) => b.streak - a.streak);
      case 'checkIns':
        return [...leaderboard].sort((a, b) => b.totalCheckIns - a.totalCheckIns);
      default:
        return leaderboard;
    }
  };

  const sorted = getSortedLeaderboard();
  const userRank = sorted.findIndex(u => u.isCurrentUser) + 1;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-400">{rank}</span>;
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200';
    if (rank === 1) return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return 'bg-white border-gray-100';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-slideUp shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-5 pt-6 pb-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6" />
            <span className="text-lg font-bold">公益排行榜</span>
          </div>
          <p className="text-sm text-white/90">看看大家的公益成就，一起加油！</p>

          {/* User rank */}
          <div className="mt-4 bg-white/20 backdrop-blur rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center text-xl">
                😊
              </div>
              <div>
                <p className="font-semibold text-sm">我的排名</p>
                <p className="text-xs text-white/80">Lv.{stats.totalMinutes >= 100 ? 2 : 1} · {stats.totalMinutes}分钟</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold"># {userRank}</p>
              <p className="text-xs text-white/80">共 {leaderboard.length} 人</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 py-3 flex gap-2 border-b border-gray-100">
          {[
            { id: 'time', label: '公益时长', icon: Target },
            { id: 'streak', label: '连续天数', icon: Flame },
            { id: 'checkIns', label: '打卡次数', icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {sorted.map((user, idx) => {
            const rank = idx + 1;
            const value = selectedTab === 'time' ? user.totalMinutes :
                          selectedTab === 'streak' ? user.streak :
                          user.totalCheckIns;
            const unit = selectedTab === 'time' ? '分钟' :
                         selectedTab === 'streak' ? '天' : '次';

            return (
              <div
                key={user.id}
                className={`rounded-xl p-3 border ${getRankBg(rank, user.isCurrentUser || false)} ${
                  user.isCurrentUser ? 'ring-2 ring-indigo-300 ring-offset-1' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    {getRankIcon(rank)}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-white flex items-center justify-center text-lg">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="font-medium text-sm text-gray-800 truncate">
                        {user.name}
                      </h4>
                      {user.isCurrentUser && (
                        <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                          我
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>Lv.{user.level}</span>
                      <span className="text-gray-300">·</span>
                      <span>{user.levelName}</span>
                      {user.badges.length > 0 && (
                        <span className="ml-1">{user.badges.slice(0, 3).join('')}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-800">{value.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{unit}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            💡 每一次公益行动，都在让你离榜首更近一步
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.35s cubic-bezier(0.15, 1.15, 0.5, 1); }
      `}</style>
    </div>
  );
}