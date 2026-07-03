import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

interface StatsData {
  cardFrequency?: Array<{ name: string; count: number }>;
  spreadDistribution?: Array<{ spreadType: string; count: number }>;
  dailyCounts?: Array<{ date: string; count: number }>;
  reversedRatio?: { reversed: number; total: number; ratio: number };
}

const COLORS = ['#d4a853', '#7b2d8e', '#2980b9', '#27ae60', '#c0392b', '#f1c40f'];

const spreadNames: Record<string, string> = {
  single: '单张牌', three: '三张牌', 'celtic-cross': '凯尔特十字',
};

function computeTypeDistribution(cardFreq: Array<{ name: string; count: number; type?: string; suit?: string }>) {
  const map: Record<string, number> = {};
  cardFreq.forEach((c) => {
    const key = c.type === 'major' ? '大阿尔卡纳' : (c.suit ? c.suit : '其他');
    map[key] = (map[key] || 0) + c.count;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}

const timeRanges = [
  { label: '7天', value: '7' },
  { label: '30天', value: '30' },
  { label: '90天', value: '90' },
  { label: '全部', value: 'all' },
];

export default function AdminStatistics() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (timeRange !== 'all') params.set('days', timeRange);

    fetch(`/api/admin/statistics?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => setData(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [timeRange]);

  const cardFreq = data?.cardFrequency || [];
  const spreadDist = (data?.spreadDistribution || []).map((d) => ({
    name: spreadNames[d.spreadType] || d.spreadType,
    count: d.count,
  }));
  const dailyData = data?.dailyCounts || [];
  const typeDist = computeTypeDistribution(cardFreq);

  if (loading) {
    return (
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-display text-mystic-gold mb-6">统计分析</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 h-72 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display text-mystic-gold">统计分析</h2>
        <div className="flex gap-2">
          {timeRanges.map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                timeRange === r.value
                  ? 'bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/30'
                  : 'text-mystic-silver/50 hover:text-mystic-silver/70 border border-transparent'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card frequency */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-display text-mystic-gold mb-4">牌面抽取频率 (Top 20)</h3>
          {cardFreq.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardFreq.slice(0, 20)} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(123,45,142,0.1)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#c0c0d0' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#c0c0d0' }} width={60} />
                <Tooltip
                  contentStyle={{ background: '#1a0a2e', border: '1px solid #d4a85344', borderRadius: '8px' }}
                  labelStyle={{ color: '#d4a853' }}
                />
                <Bar dataKey="count" fill="#d4a853" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-mystic-silver/40 text-center py-12">暂无数据</p>
          )}
        </div>

        {/* Spread distribution */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-display text-mystic-gold mb-4">牌阵使用分布</h3>
          {spreadDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spreadDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {spreadDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a0a2e', border: '1px solid #d4a85344', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-mystic-silver/40 text-center py-12">暂无数据</p>
          )}
        </div>

        {/* Daily trend */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-display text-mystic-gold mb-4">每日抽取趋势</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(123,45,142,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#c0c0d0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#c0c0d0' }} />
                <Tooltip
                  contentStyle={{ background: '#1a0a2e', border: '1px solid #d4a85344', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#d4a853" strokeWidth={2} dot={{ fill: '#d4a853', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-mystic-silver/40 text-center py-12">暂无数据</p>
          )}
        </div>

        {/* Type distribution */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-display text-mystic-gold mb-4">牌面类型分布</h3>
          {typeDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(123,45,142,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#c0c0d0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#c0c0d0' }} />
                <Tooltip
                  contentStyle={{ background: '#1a0a2e', border: '1px solid #d4a85344', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#7b2d8e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-mystic-silver/40 text-center py-12">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}