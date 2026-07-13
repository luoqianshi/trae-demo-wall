// Home Page
// Main page component for displaying collections. The `?view=` query param
// (home | today | unread | trash | tags) selects which filter is applied.

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useCollectionStore } from '../store/collectionStore';
import type { CollectionFilter } from '../../shared/types/collection';
import StatsCards from '../components/home/StatsCards';
import FilterBar from '../components/home/FilterBar';
import CollectionCard from '../components/home/CollectionCard';
import TagCloud from '../components/home/TagCloud';
import Pagination from '../components/common/Pagination';

type ViewType = 'grid' | 'list';

/** Map a sidebar view to the collection filter fields it controls. */
function viewToFilter(view: string): Partial<CollectionFilter> {
  switch (view) {
    case 'today': {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { isDeleted: false, isRead: undefined, dateRange: { start: start.toISOString(), end: new Date().toISOString() }, tags: undefined };
    }
    case 'unread':
      return { isDeleted: false, isRead: false, dateRange: undefined, tags: undefined };
    case 'trash':
      return { isDeleted: true, isRead: undefined, dateRange: undefined, tags: undefined };
    case 'tags':
    case 'home':
    default:
      return { isDeleted: false, isRead: undefined, dateRange: undefined, tags: undefined };
  }
}

const VIEW_META: Record<string, { eyebrow: string; title: string; empty: string }> = {
  home: { eyebrow: 'ARCHIVE · 永久保存', title: '全部收藏', empty: '暂无收藏内容' },
  today: { eyebrow: 'TODAY · 今日新增', title: '今日新增', empty: '今天还没有新增收藏' },
  unread: { eyebrow: 'UNREAD · 未读', title: '未读', empty: '没有未读收藏' },
  trash: { eyebrow: 'TRASH · 回收站', title: '回收站', empty: '回收站是空的' },
  tags: { eyebrow: 'TAGS · 标签管理', title: '标签管理', empty: '暂无标签' },
};

const mono = (extra?: React.CSSProperties): React.CSSProperties => ({ fontFamily: 'var(--mono)', ...extra });

const HomePage: React.FC = () => {
  const { items, loading, error, fetchCollections, filter, sort, setFilter, restoreCollection, deletePermanently } =
    useCollectionStore();
  const [, setViewType] = useState<ViewType>('grid');
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') ?? 'home';
  const meta = VIEW_META[view] ?? VIEW_META.home;
  const isTrash = view === 'trash';
  const isTags = view === 'tags';
  const selectedTag = filter.tags?.[0] ?? null;
  const showTagCloud = isTags && !selectedTag;

  useEffect(() => {
    setFilter(viewToFilter(view));
  }, [view, setFilter]);

  useEffect(() => {
    void fetchCollections(1);
  }, [filter, sort, fetchCollections]);

  const handleRestore = async (id: string) => {
    if (await restoreCollection(id)) {
      void fetchCollections(1);
    }
  };

  const handleDeleteForever = async (id: string) => {
    if (window.confirm('确定要永久删除吗？此操作不可恢复。')) {
      await deletePermanently(id);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '34px 40px 60px', maxWidth: '1240px' }}>
        {/* Page head */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', marginBottom: '26px' }}>
          <div>
            <div style={mono({ fontSize: '11px', letterSpacing: '0.18em', color: 'var(--amber)', marginBottom: '10px' })}>{meta.eyebrow}</div>
            <h1 style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: '34px', letterSpacing: '-0.02em', margin: 0, lineHeight: 1, color: 'var(--ink)' }}>{meta.title}</h1>
          </div>
          {view === 'home' && <StatsCards />}
        </div>

        {/* Filter row */}
        {!isTrash && !isTags && (
          <div style={{ marginBottom: '22px' }}>
            <FilterBar onViewTypeChange={setViewType} />
          </div>
        )}

        {/* Selected-tag chip */}
        {isTags && selectedTag && (
          <button
            onClick={() => setFilter({ tags: undefined })}
            style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '20px', padding: '5px 12px', fontSize: '13px', background: 'var(--amber-soft)', color: 'var(--amber)', border: '1px solid var(--amber-line)', cursor: 'pointer' }}
          >
            标签：{selectedTag} ✕
          </button>
        )}

        {loading && items.length === 0 ? (
          <div style={{ ...mono({ fontSize: '12px', letterSpacing: '0.12em', color: 'var(--ink-3)', padding: '40px 0' }) }}>加载中…</div>
        ) : error ? (
          <div style={{ fontSize: '13px', color: 'var(--err)', padding: '40px 0' }}>{error}</div>
        ) : showTagCloud ? (
          <TagCloud onSelect={(tag) => setFilter({ tags: [tag] })} />
        ) : isTrash ? (
          <section className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-label="回收站">
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '13px', border: '1px solid var(--line)', background: 'var(--bg-1)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontFamily: 'var(--disp)', fontSize: '14px', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{item.title || item.url}</p>
                  <p style={mono({ fontSize: '11px', color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '4px 0 0' })}>{item.url}</p>
                </div>
                <button onClick={() => void handleRestore(item.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '9px', padding: '7px 13px', fontSize: '12px', border: '1px solid var(--amber-line)', background: 'var(--amber-soft)', color: 'var(--amber)', cursor: 'pointer' }}>
                  <RotateCcw size={13} /> 恢复
                </button>
                <button onClick={() => void handleDeleteForever(item.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '9px', padding: '7px 13px', fontSize: '12px', border: '1px solid rgba(224,112,94,0.28)', background: 'var(--state-error-bg)', color: 'var(--err)', cursor: 'pointer' }}>
                  <Trash2 size={13} /> 永久删除
                </button>
              </div>
            ))}
          </section>
        ) : (
          <section className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: '16px' }} aria-label="收藏列表">
            {items.map((item) => (
              <CollectionCard key={item.id} item={item} />
            ))}
          </section>
        )}

        {!showTagCloud && !loading && !error && items.length === 0 && (
          <div style={mono({ fontSize: '13px', color: 'var(--ink-3)', letterSpacing: '0.08em', padding: '48px 0', textAlign: 'center' })}>{meta.empty}</div>
        )}

        {!isTrash && !showTagCloud && <div style={{ marginTop: '24px' }}><Pagination /></div>}
      </div>
    </div>
  );
};

export default HomePage;
