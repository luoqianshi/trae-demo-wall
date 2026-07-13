import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { CollectionItem } from '../../../shared/types/collection';
import { useCollectionStore } from '../../store/collectionStore';

/** Source presentation: mono label + dot color for the card chip. */
const SOURCE_TYPE_CONFIG = {
  web: { label: 'WEB', color: 'var(--info)' },
  wechat: { label: '微信', color: 'var(--ok)' },
  github: { label: 'GITHUB', color: 'var(--ink-2)' },
  local: { label: '本地', color: 'var(--amber)' },
} as const;

type SourceKey = keyof typeof SOURCE_TYPE_CONFIG;

const getSourceKey = (url: string): SourceKey => {
  if (url.startsWith('本地文件') || !url.startsWith('http')) {
    return 'local';
  }
  if (url.includes('github.com')) {
    return 'github';
  }
  if (url.includes('mp.weixin.qq.com') || url.includes('weixin')) {
    return 'wechat';
  }
  return 'web';
};

const extractDomain = (url: string): string => {
  try {
    if (url.startsWith('本地文件') || !url.startsWith('http')) {
      return '本地文件';
    }
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

/** Short, stable card number derived from the item id. */
const shortNo = (id: string): string => {
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, '');
  return cleaned.slice(-4).toUpperCase() || id.slice(0, 4).toUpperCase();
};

/** Format a date as e.g. "7月1日". */
const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

interface CollectionCardProps {
  item: CollectionItem;
}

const CollectionCardComponent: React.FC<CollectionCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const deleteCollection = useCollectionStore((s) => s.deleteCollection);
  const [hovered, setHovered] = useState(false);

  const sourceKey = getSourceKey(item.url);
  const sourceConfig = SOURCE_TYPE_CONFIG[sourceKey];
  const domain = extractDomain(item.url);
  const displayTags = item.tags.slice(0, 3);

  const handleClick = () => {
    void navigate(`/collection/${item.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`将《${item.title || item.url}》移到回收站？`)) {
      void deleteCollection(item.id);
    }
  };

  const handleHover = (isHovered: boolean) => (e: React.MouseEvent<HTMLDivElement>) => {
    setHovered(isHovered);
    const el = e.currentTarget;
    el.style.borderColor = isHovered ? 'var(--amber-line)' : 'var(--line)';
    el.style.transform = isHovered ? 'translateY(-2px)' : 'none';
    el.style.background = isHovered ? 'var(--bg-2)' : 'var(--bg-1)';
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleHover(true)}
      onMouseLeave={handleHover(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: 18,
        borderRadius: 14,
        border: '1px solid var(--line)',
        background: 'var(--bg-1)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color .16s, transform .16s, background .16s',
      }}
    >
      {/* 移到回收站（悬停显示） */}
      <button
        onClick={handleDelete}
        title="移到回收站"
        aria-label="移到回收站"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          borderRadius: 7,
          border: '1px solid var(--line)',
          background: 'var(--bg-0)',
          color: 'var(--ink-3)',
          cursor: 'pointer',
          opacity: hovered ? 1 : 0,
          transition: 'opacity .16s',
        }}
      >
        <Trash2 size={13} />
      </button>

      {/* 来源 chip + 域名 + 编号 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--mono)',
            fontSize: 9.5,
            letterSpacing: '0.08em',
            padding: '3px 9px',
            borderRadius: 6,
            background: 'var(--bg-3)',
            color: sourceConfig.color,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
          {sourceConfig.label}
        </span>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--ink-3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {domain}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--mono)',
            fontSize: 9.5,
            color: 'var(--ink-3)',
          }}
        >
          #{shortNo(item.id)}
        </span>
      </div>

      {/* 标题（2 行截断） */}
      <h3
        style={{
          fontFamily: 'var(--disp)',
          fontWeight: 500,
          fontSize: 16,
          lineHeight: 1.35,
          margin: '0 0 9px',
          color: 'var(--ink)',
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.title}
      </h3>

      {/* 摘要（2 行截断） */}
      <p
        style={{
          fontSize: 12.5,
          lineHeight: 1.6,
          color: 'var(--ink-2)',
          margin: '0 0 15px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.description || '暂无摘要'}
      </p>

      {/* 标签 + 日期 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
        {displayTags.map((tag, index) => (
          <span
            key={index}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--bg-3)',
              color: 'var(--ink-2)',
            }}
          >
            {tag}
          </span>
        ))}
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--ink-3)',
            alignSelf: 'center',
          }}
        >
          {formatDate(item.createdAt)}
        </span>
      </div>
    </div>
  );
};

// Memoized: list item rendered many times; only re-render when `item` changes,
// so a parent re-render (filters, pagination) doesn't re-render every card.
const CollectionCard = React.memo(CollectionCardComponent);

export default CollectionCard;
