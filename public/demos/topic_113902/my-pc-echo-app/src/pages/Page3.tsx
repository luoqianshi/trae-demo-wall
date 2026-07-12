import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mockCharacters, type Character, type Entry } from '../data/characters';

/* ---------- entry meta (labels + CSS var colors) ---------- */
const entryMeta: Record<Entry['type'], { label: string; color: string }> = {
  highlight: { label: '高光时刻', color: 'var(--gold)' },
  journal: { label: '冒险日志', color: 'var(--green)' },
  bond: { label: '羁绊与收藏', color: 'var(--caramel)' },
};

/* glow colors for box-shadow / radial gradient (rgba, since CSS vars can't be concatenated in JS) */
const entryGlow: Record<Entry['type'], string> = {
  highlight: 'rgba(200,168,96,0.13)',
  journal: 'rgba(122,158,136,0.13)',
  bond: 'rgba(212,165,116,0.13)',
};

const entryGlowSoft: Record<Entry['type'], string> = {
  highlight: 'rgba(200,168,96,0.05)',
  journal: 'rgba(122,158,136,0.05)',
  bond: 'rgba(212,165,116,0.05)',
};

/* ---------- tiny helpers ---------- */
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- sub-components ---------- */

function PolaroidCard({ character }: { character: Character }) {
  return (
    <motion.div
      initial={{ x: -60, opacity: 0, rotate: 0 }}
      animate={{ x: 0, opacity: 1, rotate: -0.5 }}
      transition={{ type: 'spring', stiffness: 80, damping: 14 }}
      style={{
        background: '#F8F5F0',
        padding: '8px 8px 24px 8px',
        borderRadius: 4,
        transformOrigin: 'center center',
        boxShadow: '4px 6px 24px rgba(0,0,0,0.5)',
        width: '100%',
        maxWidth: 320,
      }}
    >
      {/* Avatar area */}
      <div
        style={{
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: 2,
          overflow: 'hidden',
          marginBottom: 14,
          position: 'relative',
          background: character.avatar,
        }}
      >
        {character.avatarImage ? (
          <img
            src={character.avatarImage}
            alt={character.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '4rem',
                fontWeight: 700,
                color: '#fff',
                opacity: 0.9,
                fontFamily: 'var(--font-display, serif)',
                textShadow: '0 2px 12px rgba(0,0,0,0.35)',
              }}
            >
              {character.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Name & Title */}
      <p
        style={{
          fontFamily: 'var(--font-display, serif)',
          fontSize: '1.15rem',
          fontWeight: 600,
          color: '#222',
          margin: 0,
          letterSpacing: '0.04em',
        }}
      >
        {character.name}
      </p>
      {character.title && (
        <p
          style={{
            fontSize: '0.72rem',
            color: '#9A8568',
            margin: '3px 0 0',
            fontStyle: 'italic',
            letterSpacing: '0.06em',
          }}
        >
          {character.title}
        </p>
      )}
      <p
        style={{
          fontSize: '0.7rem',
          color: '#999',
          margin: '4px 0 0',
        }}
      >
        {character.game}
      </p>
    </motion.div>
  );
}

function TimelineEntry({
  entry,
  index,
  onShare,
  onToast,
}: {
  entry: Entry;
  index: number;
  onShare: (entry: Entry) => void;
  onToast: (msg: string) => void;
}) {
  const meta = entryMeta[entry.type];
  const isBond = entry.type === 'bond';
  const isHighlight = entry.type === 'highlight';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'relative',
        paddingLeft: 20,
        marginBottom: 28,
      }}
    >
      {/* Timeline dot */}
      <span
        style={{
          position: 'absolute',
          left: -20,
          top: 8,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: meta.color,
          border: '2px solid #080808',
          zIndex: 1,
        }}
      />

      {/* Card — clickable */}
      <div
        onClick={() => onToast('功能开发中，敬请期待')}
        style={{
          background: isBond
            ? 'rgba(212,165,116,0.06)'
            : 'rgba(255,255,255,0.04)',
          borderLeft: `3px solid ${meta.color}`,
          borderRadius: 6,
          padding: '16px 18px',
          transform: isBond ? 'rotate(-1deg)' : 'none',
          boxShadow: isBond
            ? '2px 3px 14px rgba(0,0,0,0.35)'
            : isHighlight
              ? `0 0 18px ${entryGlow[entry.type]}`
              : '0 1px 8px rgba(0,0,0,0.25)',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {/* Bond sticky-note tape decoration */}
        {isBond && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: 12,
              width: 40,
              height: 14,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 1,
              transform: 'rotate(-3deg)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}

        {/* Highlight glow overlay */}
        {isHighlight && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: `radial-gradient(ellipse at top left, ${entryGlowSoft[entry.type]}, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Share button — top right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(entry);
          }}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            opacity: 0.5,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 4,
            cursor: 'pointer',
            color: 'var(--gold)',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,168,96,0.1)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,168,96,0.25)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.5';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
          }}
          title="分享此条目"
        >
          <svg
            viewBox="0 0 24 24"
            width={14}
            height={14}
            fill="currentColor"
          >
            <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5Z" />
          </svg>
        </button>

        {/* Date — diary style, top of card */}
        <div
          style={{
            fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)',
            fontFamily: 'var(--font-handwrite-en)',
            color: 'rgba(200,168,96,0.5)',
            marginBottom: 4,
            letterSpacing: '0.06em',
          }}
        >
          {formatDate(entry.date)}
        </div>

        {/* Image placeholder */}
        {entry.image && (
          <div
            style={{
              width: '100%',
              height: 140,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 4,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
            }}
          >
            截图
          </div>
        )}

        {/* Type label */}
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.68rem',
            fontWeight: 600,
            color: meta.color,
            letterSpacing: '0.06em',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          {meta.label}
        </span>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'var(--font-display, serif)',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 6px',
            lineHeight: 1.4,
          }}
        >
          {entry.title}
        </h3>

        {/* Content */}
        <p
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            margin: '0 0 10px',
          }}
        >
          {entry.content}
        </p>

        {/* Meta row: location + tags on same line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
          }}
        >
          {entry.location && (
            <span>&#9656; {entry.location}</span>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <>
              {entry.location && <span style={{ opacity: 0.3 }}>&middot;</span>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 10px',
                      borderRadius: 20,
                      background: 'var(--gold-soft)',
                      color: 'var(--gold)',
                      border: '1px solid var(--gold-soft)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- main page ---------- */

export default function Page3() {
  const navigate = useNavigate();
  const { id } = useParams();

  const character = id ? mockCharacters.find(c => c.id === id) : undefined;

  // Share toast state
  const [shareToast, setShareToast] = useState(false);
  const [shareToastMsg, setShareToastMsg] = useState('');

  // Share to echo-square
  const shareToEchoSquare = (entry?: Entry) => {
    if (entry) {
      // Share single entry: store in sessionStorage, navigate to echo-square
      const payload = JSON.stringify({
        characterId: character!.id,
        characterName: character!.name,
        characterGame: character!.game,
        avatarImage: character!.avatarImage,
        avatar: character!.avatar,
        entryTitle: entry.title,
        entryContent: entry.content,
        entryDate: entry.date,
        entryLocation: entry.location,
        entryType: entry.type,
      });
      sessionStorage.setItem('echo-share', payload);
      setShareToastMsg('已分享到回声星空');
    } else {
      // Share entire character archive
      const payload = JSON.stringify({
        characterId: character!.id,
        characterName: character!.name,
        characterGame: character!.game,
        avatarImage: character!.avatarImage,
        avatar: character!.avatar,
        entryTitle: character!.description || character!.title,
        entryContent: `${character!.name}的档案 — 来自${character!.game}，共${character!.entries.length}条记录`,
        entryDate: new Date().toISOString().slice(0, 10),
      });
      sessionStorage.setItem('echo-share', payload);
      setShareToastMsg('角色档案已分享到回声星空');
    }
    setShareToast(true);
    setTimeout(() => navigate('/echo-square'), 600);
  };

  // Auto-hide toast after 2s
  useEffect(() => {
    if (!shareToast) return;
    const timer = setTimeout(() => setShareToast(false), 2000);
    return () => clearTimeout(timer);
  }, [shareToast]);

  // Sort entries by date descending
  const sortedEntries = useMemo(() => {
    if (!character) return [];
    return [...character.entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [character]);

  // Inject responsive styles via useEffect (avoid inline <style> in JSX)
  useEffect(() => {
    const id = 'page3-responsive-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @media (max-width: 768px) {
        .page3-body {
          flex-direction: column !important;
          padding: 20px 16px !important;
        }
        .page3-polaroid-aside {
          width: 100% !important;
          min-width: unset !important;
          max-width: unset !important;
          position: static !important;
          margin-bottom: 24px !important;
          align-items: center !important;
        }
        .page3-polaroid-aside > div {
          max-width: 260px !important;
        }
        .page3-timeline-main {
          width: 100% !important;
          padding-left: 32px !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  /* ---- empty state ---- */
  if (!character) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080808',
          color: 'var(--text-muted)',
          gap: 16,
        }}
      >
        <p style={{ fontSize: '0.85rem' }}>未找到该角色的手账</p>
        <button
          onClick={() => navigate('/gallery')}
          style={{
            color: 'var(--gold)',
            background: 'none',
            border: '1px solid rgba(200,168,96,0.27)',
            padding: '8px 20px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          返回档案馆
        </button>
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#080808',
        paddingBottom: 72, // space for bottom bar
      }}
    >
      {/* ====== Top Bar ====== */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 24px',
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={() => navigate('/gallery')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gold)',
            cursor: 'pointer',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'inherit',
          }}
        >
          <span>&larr;</span>
          <span>返回档案馆</span>
        </button>

        <div style={{ flex: 1 }} />

        <span
          style={{
            fontFamily: 'var(--font-display, serif)',
            fontSize: '0.92rem',
            color: 'var(--text-primary)',
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
        >
          {character.name}
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {character.game}
        </span>
      </motion.header>

      {/* ====== Body: Polaroid + Timeline ====== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 0,
          padding: '32px 24px',
          maxWidth: 1200,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
        className="page3-body"
      >
        {/* Left — Polaroid (sticky) */}
        <aside
          style={{
            width: '35%',
            minWidth: 220,
            maxWidth: 360,
            position: 'sticky',
            top: 72,
            alignSelf: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
          className="page3-polaroid-aside"
        >
          <PolaroidCard character={character} />
        </aside>

        {/* Right — Timeline */}
        <main
          style={{
            width: '65%',
            paddingLeft: 32,
            position: 'relative',
          }}
          className="page3-timeline-main"
        >
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: 15,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'rgba(200,168,96,0.15)',
            }}
          />

          {sortedEntries.map((entry, i) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              index={i}
              onShare={(entry) => {
                shareToEchoSquare(entry);
              }}
              onToast={(msg) => {
                setShareToastMsg(msg);
                setShareToast(true);
              }}
            />
          ))}
        </main>
      </div>

      {/* ====== Bottom Sticky Bar ====== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          style={{
            background: 'var(--gold)',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: 6,
            padding: '8px 20px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onClick={() => {
            setShareToastMsg('功能开发中，敬请期待');
            setShareToast(true);
          }}
        >
          + 新建条目
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* AI assistant placeholder */}
          <button
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--gold)',
              border: '1px solid rgba(200,168,96,0.2)',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
            title="AI 助手"
            onClick={() => {
              setShareToastMsg('AI 助手即将上线');
              setShareToast(true);
            }}
          >
            &#10022;
          </button>

          {/* Share */}
          <button
            onClick={() => shareToEchoSquare()}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '8px 18px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            分享到星空
          </button>
        </div>
      </motion.div>

      {/* ====== Share Toast ====== */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(200,168,96,0.9)',
              color: '#0a0a0a',
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontFamily: 'inherit',
              zIndex: 200,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {shareToastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
