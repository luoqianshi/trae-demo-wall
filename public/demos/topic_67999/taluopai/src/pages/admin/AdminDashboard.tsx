import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Hash, TrendingUp, ScrollText } from 'lucide-react';

interface Stats {
  totalDrawings: number;
  cardFrequency: Array<{ name: string; count: number }>;
  spreadDistribution: Array<{ spreadType: string; count: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
  reversedRatio: { reversed: number; total: number; ratio: number };
}

interface RecentDrawing {
  id: number;
  spreadType: string;
  cards: Array<{ card?: { name: string } }>;
  createdAt: string;
}

const spreadNames: Record<string, string> = {
  single: '单张牌', three: '三张牌', 'celtic-cross': '凯尔特十字',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDrawings, setRecentDrawings] = useState<RecentDrawing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch('/api/admin/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch('/api/admin/records?page=1&pageSize=10', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([statsData, recordsData]) => {
        setStats(statsData.data);
        setRecentDrawings(recordsData.data?.records || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayCount = stats?.dailyCounts?.find(
    (d) => d.date === new Date().toISOString().slice(0, 10)
  )?.count || 0;

  const popularSpread = stats?.spreadDistribution?.length
    ? spreadNames[stats.spreadDistribution[0].spreadType] || stats.spreadDistribution[0].spreadType
    : '-';

  const cards = [
    { label: '总抽取次数', value: stats?.totalDrawings ?? '-', icon: Sparkles, color: '#d4a853' },
    { label: '今日抽取', value: todayCount, icon: Calendar, color: '#7b2d8e' },
    { label: '涉及牌种', value: stats?.cardFrequency?.length ?? '-', icon: Hash, color: '#2980b9' },
    { label: '最热门牌阵', value: popularSpread, icon: TrendingUp, color: '#27ae60' },
  ];

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-display text-mystic-gold mb-6">仪表盘</h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="glass rounded-xl p-5 transition-all hover:scale-[1.02]"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  borderColor: `${item.color}33`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-mystic-silver/60">{item.label}</span>
                  <Icon size={20} style={{ color: item.color }} />
                </div>
                <div className="text-2xl font-display" style={{ color: item.color }}>
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent drawings */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display text-mystic-gold flex items-center gap-2">
            <ScrollText size={18} />
            最近抽取
          </h3>
          <button
            onClick={() => navigate('/admin/records')}
            className="text-xs text-mystic-gold/60 hover:text-mystic-gold transition-colors"
          >
            查看全部 →
          </button>
        </div>

        {recentDrawings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-mystic-silver/50 text-xs">
                  <th className="pb-2 font-normal">ID</th>
                  <th className="pb-2 font-normal">时间</th>
                  <th className="pb-2 font-normal">牌阵</th>
                  <th className="pb-2 font-normal">牌面</th>
                </tr>
              </thead>
              <tbody>
                {recentDrawings.slice(0, 10).map((drawing) => (
                  <tr key={drawing.id} className="border-t border-mystic-purple/10">
                    <td className="py-2 text-mystic-silver/50">#{drawing.id}</td>
                    <td className="py-2 text-mystic-silver/70">
                      {new Date(drawing.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-mystic-gold/10 text-mystic-gold">
                        {spreadNames[drawing.spreadType] || drawing.spreadType}
                      </span>
                    </td>
                    <td className="py-2 text-mystic-silver/60 text-xs">
                      {drawing.cards?.map((c) => c.card?.name).filter(Boolean).join('、') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-mystic-silver/40 text-center py-8">暂无数据</p>
        )}
      </div>
    </div>
  );
}