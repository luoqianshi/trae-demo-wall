import React, { useEffect, useState } from 'react';

interface TagCloudProps {
  onSelect: (tag: string) => void;
}

interface TagCount {
  tag: string;
  count: number;
}

/**
 * Tag cloud: aggregates tags across all (non-deleted) collections and renders
 * them sized by frequency. Clicking a tag filters the collection list by it.
 * Styled to match the dark editorial tone (mono chips, amber on hover).
 */
const TagCloud: React.FC<TagCloudProps> = ({ onSelect }) => {
  const [tags, setTags] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await window.electronAPI.collection.list({ page: 1, pageSize: 10000, isDeleted: false });
        if (cancelled) return;
        const counts = new Map<string, number>();
        if (res.success && res.data) {
          for (const item of res.data.items) {
            for (const tag of item.tags ?? []) {
              counts.set(tag, (counts.get(tag) ?? 0) + 1);
            }
          }
        }
        setTags([...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.12em' }}>
        加载标签中...
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.12em' }}>
        暂无标签
      </div>
    );
  }

  const handleHover = (hovered: boolean) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.style.borderColor = hovered ? 'var(--amber-line)' : 'var(--line)';
    el.style.color = hovered ? 'var(--amber)' : 'var(--ink-2)';
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} aria-label="标签云">
      {tags.map(({ tag, count }) => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          onMouseEnter={handleHover(true)}
          onMouseLeave={handleHover(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '8px 14px',
            background: 'var(--bg-1)',
            color: 'var(--ink-2)',
            cursor: 'pointer',
            transition: 'border-color .14s, color .14s',
            fontFamily: 'var(--body)',
            fontSize: `${Math.min(13 + count * 1.2, 22)}px`,
            lineHeight: 1,
          }}
        >
          {tag}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{count}</span>
        </button>
      ))}
    </div>
  );
};

export default TagCloud;
