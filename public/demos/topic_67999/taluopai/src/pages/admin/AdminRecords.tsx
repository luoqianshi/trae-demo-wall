import { useEffect, useState, useCallback } from 'react';
import { Download, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DrawRecord {
  id: number;
  spreadType: string;
  sessionId: string;
  cards: Array<{
    id: number;
    cardId: number;
    position: number;
    isReversed: boolean;
    card?: { name: string; nameEn: string; meaningUpright: string; meaningReversed: string };
  }>;
  createdAt: string;
}

export default function AdminRecords() {
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [spreadFilter, setSpreadFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', '20');
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (spreadFilter) params.set('spreadType', spreadFilter);

    try {
      const res = await fetch(`/api/admin/records?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecords(data.data?.records || []);
      setTotalPages(data.data?.pagination?.totalPages || 1);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, spreadFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleExport = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (spreadFilter) params.set('spreadType', spreadFilter);

    try {
      const res = await fetch(`/api/admin/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarot-records-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const spreadNames: Record<string, string> = {
    single: '单张牌',
    three: '三张牌',
    'celtic-cross': '凯尔特十字',
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display text-mystic-gold">抽取记录</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-mystic-gold/10 text-mystic-gold gold-border hover:bg-mystic-gold/20 transition-all"
        >
          <Download size={16} />
          导出 CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-mystic-silver/50 mb-1">开始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg bg-mystic-deeper text-mystic-silver border border-mystic-purple/20 text-sm focus:border-mystic-gold/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-mystic-silver/50 mb-1">结束日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg bg-mystic-deeper text-mystic-silver border border-mystic-purple/20 text-sm focus:border-mystic-gold/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-mystic-silver/50 mb-1">牌阵类型</label>
          <select
            value={spreadFilter}
            onChange={(e) => { setSpreadFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg bg-mystic-deeper text-mystic-silver border border-mystic-purple/20 text-sm focus:border-mystic-gold/50 focus:outline-none"
          >
            <option value="">全部</option>
            <option value="single">单张牌</option>
            <option value="three">三张牌</option>
            <option value="celtic-cross">凯尔特十字</option>
          </select>
        </div>
      </div>

      {/* Records table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-lg h-12 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-mystic-silver/40">暂无抽取记录</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-mystic-silver/50 text-xs border-b border-mystic-purple/10">
                <th className="p-3 font-normal">ID</th>
                <th className="p-3 font-normal">时间</th>
                <th className="p-3 font-normal">牌阵</th>
                <th className="p-3 font-normal">牌面</th>
                <th className="p-3 font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <>
                  <tr
                    key={r.id}
                    className="border-b border-mystic-purple/5 hover:bg-mystic-purple/5 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <td className="p-3 text-mystic-silver/50">#{r.id}</td>
                    <td className="p-3 text-mystic-silver/70 text-xs">
                      {new Date(r.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-mystic-gold/10 text-mystic-gold">
                        {spreadNames[r.spreadType] || r.spreadType}
                      </span>
                    </td>
                    <td className="p-3 text-mystic-silver/60 text-xs max-w-xs truncate">
                      {r.cards?.map((c) => `${c.card?.name || '?'}${c.isReversed ? '(逆)' : ''}`).join('、')}
                    </td>
                    <td className="p-3">
                      <ChevronDown
                        size={16}
                        className={`text-mystic-silver/40 transition-transform ${expandedId === r.id ? 'rotate-180' : ''}`}
                      />
                    </td>
                  </tr>
                  {expandedId === r.id && r.cards && (
                    <tr key={`exp-${r.id}`} className="bg-mystic-deeper/50">
                      <td colSpan={5} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {r.cards.map((c, i) => (
                            <div key={c.id} className="glass rounded-lg p-3 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-mystic-gold font-medium">
                                  #{i + 1} {c.card?.name || '未知'}
                                </span>
                                {c.isReversed && (
                                  <span className="text-red-400 text-[10px]">逆位</span>
                                )}
                              </div>
                              <p className="text-mystic-silver/60">
                                {c.isReversed ? c.card?.meaningReversed?.slice(0, 60) : c.card?.meaningUpright?.slice(0, 60)}
                                {(c.isReversed ? c.card?.meaningReversed?.length : c.card?.meaningUpright?.length) && ((c.isReversed ? c.card?.meaningReversed?.length : c.card?.meaningUpright?.length) || 0) > 60 ? '...' : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg text-mystic-silver/60 hover:text-mystic-gold disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-mystic-silver/60">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg text-mystic-silver/60 hover:text-mystic-gold disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}