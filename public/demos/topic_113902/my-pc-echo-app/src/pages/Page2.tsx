import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mockCharacters, type Character } from '../data/characters';
import { generatePostcardMessage } from '../data/postcards';

type ViewMode = 'archive' | 'gacha';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getFirstDate(character: Character): string {
  if (character.entries.length === 0) return '—';
  const dates = character.entries.map((e) => e.date).sort();
  return dates[0];
}

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.');
}

/* ------------------------------------------------------------------ */
/*  Toggle Icons                                                       */
/* ------------------------------------------------------------------ */
function FolderIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? 'var(--gold)' : 'var(--text-muted)'} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? 'var(--gold)' : 'var(--text-muted)'} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 5l10 9 10-9" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  ArchiveCard — minimalist file folder                                */
/*  Dark background + kraft paper folder with tab, tape, and handwriting */
/* ------------------------------------------------------------------ */
function ArchiveCard({
  character,
  index,
  onClick,
}: {
  character: Character;
  index: number;
  onClick: () => void;
}) {
  const firstDate = useMemo(() => formatDate(getFirstDate(character)), [character]);
  // each card gets a unique scatter offset for a casual layout
  const scatter = useMemo(() => ({
    rotate: ((index * 7 + 3) % 11) - 5,           // -5 to +5 deg
    x: ((index * 13 + 5) % 9) - 4,              // -4 to +4 px
    y: ((index * 11 + 2) % 7) - 3,             // -3 to +3 px
  }), [index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: 0, x: 0 }}
      animate={{ opacity: 1, y: scatter.y, rotate: scatter.rotate, x: scatter.x }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: scatter.y - 6, scale: 1.03, transition: { duration: 0.2 } }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* ---- file folder body ---- */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(170px, 20vw, 240px)',
          borderRadius: '2px 2px 4px 4px',
          background: 'linear-gradient(175deg, hsl(40, 42%, 82%) 0%, hsl(38, 38%, 78%) 100%)',
          border: '1px solid hsla(35, 30%, 62%, 0.35)',
          overflow: 'visible',
          transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = 'hsla(35, 35%, 55%, 0.5)';
          el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = 'hsla(35, 30%, 62%, 0.35)';
          el.style.boxShadow = 'none';
        }}
      >
        {/* ---- TAB ---- */}
        <div
          style={{
            position: 'absolute',
            top: -18,
            left: 14,
            width: 'clamp(46px, 5vw, 68px)',
            height: 'clamp(16px, 2vw, 24px)',
            background: 'linear-gradient(175deg, hsl(40, 44%, 78%) 0%, hsl(38, 40%, 74%) 100%)',
            borderRadius: '2px 2px 0 0',
            border: '1px solid hsla(35, 32%, 58%, 0.45)',
            borderBottom: 'none',
            zIndex: 2,
            boxShadow: '0 -2px 6px rgba(0,0,0,0.1)',
          }}
        />

        {/* ---- crease line ---- */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(to right, transparent, hsla(32, 25%, 55%, 0.35) 15%, hsla(32, 25%, 55%, 0.35) 85%, transparent)',
            zIndex: 1,
          }}
        />

        {/* ---- content area ---- */}
        <div style={{ padding: '14px 14px 16px', position: 'relative' }}>

          {/* ---- photo with tape ---- */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            {/* tape strip */}
            <div
              style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'clamp(38px, 4vw, 56px)',
                height: 14,
                background: 'rgba(210,195,160,0.4)',
                borderRadius: 1,
                zIndex: 3,
              }}
            />

            {/* photo */}
            <div
              style={{
                background: 'hsl(40, 15%, 90%)',
                padding: 'clamp(3px, 0.4vw, 6px)',
                borderRadius: 1,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
                {character.avatarImage ? (
                  <img
                    src={character.avatarImage}
                    alt={character.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    draggable={false}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'hsl(38, 10%, 82%)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '2rem',
                      fontWeight: 300, color: 'hsl(30, 25%, 40%)',
                    }}>
                      {character.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---- handwritten info ---- */}
          <div style={{ position: 'relative' }}>
            {/* date */}
            <p style={{
              fontFamily: 'var(--font-handwrite-en)', fontSize: 'clamp(0.6rem, 0.7vw, 0.8rem)',
              color: 'rgba(100,90,80,0.65)',
              textAlign: 'right', margin: '0 0 4px', letterSpacing: '0.02em',
            }}>
              {firstDate}
            </p>

            {/* name */}
            <p style={{
              fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(1rem, 1.2vw, 1.4rem)',
              color: 'rgba(20,15,5,0.88)',
              margin: '0 0 2px', letterSpacing: '0.06em',
            }}>
              {character.name}
            </p>

            {/* title */}
            {character.title && (
              <p style={{
                fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)',
                color: 'rgba(25,20,12,0.55)',
                margin: '0 0 4px', letterSpacing: '0.04em',
              }}>
                {character.title}
              </p>
            )}

            {/* game source */}
            <p style={{
              fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.5rem, 0.65vw, 0.72rem)',
              color: 'rgba(100,90,80,0.7)',
              margin: 0, letterSpacing: '0.03em',
            }}>
              来自 {character.game}
            </p>

            {/* records stamp */}
            <div style={{
              position: 'absolute', bottom: -2, right: 0,
              fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.7rem, 0.85vw, 0.95rem)',
              color: 'rgba(190,50,35,0.65)',
              border: '1.5px solid rgba(190,50,35,0.4)',
              borderRadius: 3, padding: '2px 7px',
              transform: 'rotate(-6deg)', letterSpacing: '0.04em',
              fontWeight: 600,
            }}>
              记 {character.entries.length}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Gacha Helpers & Types                                              */
/* ------------------------------------------------------------------ */

interface DrawnPostcard {
  characterId: string;
  characterName: string;
  characterGame: string;
  characterAvatar: string;
  characterAvatarImage?: string;
  message: {
    greeting: string;
    body: string;
    closing: string;
    location: string;
    weather: string;
    mood: string;
    scene: string;
  };
  date: string;
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getFormattedDate(): string {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function getWeatherEmoji(weather: string): string {
  const map: Record<string, string> = {
    '晴': '\u2600\uFE0F', '多云': '\u26C5', '微风': '\uD83C\uDF2C\uFE0F',
    '阴': '\u2601\uFE0F', '风沙': '\uD83C\uDF2A\uFE0F', '星辉': '\u2B50',
    '未知': '\u2728', '海风': '\uD83C\uDF0A',
  };
  return map[weather] || '\u2600\uFE0F';
}

function pickRandomCharacter(): Character {
  return mockCharacters[Math.floor(Math.random() * mockCharacters.length)];
}

/* ------------------------------------------------------------------ */
/*  Wax Seal (蜡封印章)                                               */
/* ------------------------------------------------------------------ */
function WaxSeal({ letter: _letter, broken }: { letter: string; broken: boolean }) {
  if (broken) return null;

  return (
    <motion.div
      initial={{ scale: 1, rotate: 0 }}
      exit={{ scale: 2, opacity: 0, rotate: 180 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 15 }}
      style={{
        width: 'clamp(48px, 6vw, 72px)',
        height: 'clamp(48px, 6vw, 72px)',
        borderRadius: '48% 52% 45% 55% / 50% 45% 55% 48%',
        background: 'radial-gradient(circle at 40% 35%, #d44, #a22 40%, #811 80%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 24px rgba(120,20,10,0.5), inset 0 3px 9px rgba(255,180,140,0.25)',
        border: '2px solid rgba(140,30,20,0.6)',
        cursor: 'pointer',
        zIndex: 10,
      }}
    >
      <div />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Postcard Front (明信片正面)                                        */
/* ------------------------------------------------------------------ */
function PostcardFront({
  character,
  postcard,
  onClick,
}: {
  character: Character;
  postcard: DrawnPostcard;
  onClick: () => void;
}) {
  const todayFormatted = getFormattedDate();

  return (
    <motion.div
      initial={{ y: 40, opacity: 0, rotateY: -15 }}
      animate={{ y: 0, opacity: 1, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div style={{
        width: 'clamp(300px, 60vw, 560px)',
        minHeight: 'clamp(220px, 40vw, 360px)',
        borderRadius: 4,
        background: '#FFF8F0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        /* paper texture */
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
      }}>
        {/* horizontal divider line */}
        <div style={{
          position: 'absolute', top: '38%', left: 20, right: 20,
          height: 1,
          background: 'rgba(120,100,80,0.25)',
        }} />

        {/* sender address area (top half) */}
        <div style={{ padding: 'clamp(12px, 1.5vw, 20px) clamp(14px, 1.5vw, 24px) 8px' }}>
          <p style={{
            fontFamily: 'var(--font-handwrite-en)', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)',
            color: 'rgba(80,60,40,0.4)', letterSpacing: '0.03em',
            margin: '0 0 2px',
          }}>
            {postcard.characterName} / {postcard.characterGame}
          </p>
          <p style={{
            fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.6rem, 0.8vw, 0.85rem)',
            color: 'rgba(80,60,40,0.3)', letterSpacing: '0.04em',
            margin: 0,
          }}>
            {postcard.message.location}
          </p>
        </div>

        {/* recipient area (bottom half) */}
        <div style={{ padding: '8px 20px 8px' }}>
          <p style={{
            fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.7rem, 0.9vw, 0.95rem)',
            color: 'rgba(40,25,10,0.75)', letterSpacing: '0.08em',
            margin: 0,
          }}>
            致：我的player
          </p>
        </div>

        {/* stamp (top-right corner) */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 'clamp(36px, 4vw, 56px)', height: 'clamp(42px, 5vw, 64px)',
          border: '1.5px solid rgba(180,60,50,0.5)',
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(255,245,235,0.9)',
        }}>
          {character.avatarImage ? (
            <img src={character.avatarImage} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} draggable={false} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `${character.avatar}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.8rem',
                color: 'rgba(100,80,60,0.5)',
              }}>{character.name.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* postmark (round red stamp, top-right below stamp) */}
        <div style={{
          position: 'absolute', top: 8, right: 60,
          width: 'clamp(42px, 5vw, 60px)', height: 'clamp(42px, 5vw, 60px)',
          borderRadius: '50%',
          border: '2px solid rgba(200,50,40,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          transform: 'rotate(-12deg)',
        }}>
          <span style={{
            fontFamily: 'var(--font-handwrite-en)', fontSize: '0.4rem',
            color: 'rgba(200,50,40,0.5)', letterSpacing: '0.02em',
          }}>
            {postcard.message.location.split('·')[1] || postcard.message.location}
          </span>
          <span style={{
            fontFamily: 'var(--font-handwrite-en)', fontSize: '0.38rem',
            color: 'rgba(200,50,40,0.45)',
          }}>
            {todayFormatted}
          </span>
        </div>

        {/* character signature (bottom) */}
        <div style={{
          position: 'absolute', bottom: 10, right: 20,
          fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.8rem, 1vw, 1.1rem)',
          color: 'rgba(40,25,10,0.65)', letterSpacing: '0.1em',
        }}>
          {postcard.message.closing.replace(/^——/, '')}
        </div>

        {/* flip hint */}
        <div style={{
          position: 'absolute', bottom: 10, left: 20,
          fontFamily: 'var(--font-handwrite-en)', fontSize: '0.52rem',
          color: 'rgba(120,100,80,0.3)', letterSpacing: '0.03em',
        }}>
          tap to flip
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Postcard Back (明信片背面)                                         */
/* ------------------------------------------------------------------ */
function PostcardBack({
  character,
  postcard,
  onCollect,
  collected,
  onClickBack,
}: {
  character: Character;
  postcard: DrawnPostcard;
  onCollect: () => void;
  collected: boolean;
  onClickBack: () => void;
}) {
  const todayFormatted = getFormattedDate();

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 0, opacity: 1 }}
      onClick={onClickBack}
      style={{ cursor: 'pointer' }}
    >
      <div style={{
        width: 'clamp(300px, 60vw, 560px)',
        minHeight: 'clamp(220px, 40vw, 360px)',
        borderRadius: 4,
        background: '#FFFDF8',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
      }}>
        {/* top: date + weather + temperature */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: 'clamp(14px, 1.5vw, 24px) clamp(14px, 1.5vw, 24px) 8px',
          borderBottom: '1px solid rgba(120,100,80,0.15)',
          marginBottom: 10,
        }}>
          <span style={{
            fontFamily: 'var(--font-handwrite-en)', fontSize: 'clamp(0.65rem, 0.8vw, 0.85rem)',
            color: 'rgba(80,60,40,0.5)', letterSpacing: '0.03em',
          }}>
            {todayFormatted}
          </span>
          <span style={{ fontSize: '0.8rem' }}>
            {getWeatherEmoji(postcard.message.weather)}
          </span>
          <span style={{
            fontFamily: 'var(--font-handwrite-en)', fontSize: 'clamp(0.65rem, 0.8vw, 0.85rem)',
            color: 'rgba(80,60,40,0.4)',
          }}>
            {postcard.message.weather}
          </span>
        </div>

        {/* greeting */}
        <div style={{ padding: '0 20px' }}>
          <p style={{
            fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.85rem, 1.1vw, 1.2rem)',
            color: 'rgba(40,25,10,0.8)', letterSpacing: '0.06em',
            margin: '0 0 8px',
          }}>
            {postcard.message.greeting}
          </p>

          {/* body */}
          <p style={{
            fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.75rem, 1vw, 1.05rem)',
            color: 'rgba(50,35,20,0.7)', letterSpacing: '0.05em',
            margin: '0 0 10px', lineHeight: 1.7,
          }}>
            {postcard.message.body}
          </p>

          {/* signature + red seal */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 12,
          }}>
            <span style={{
              fontFamily: 'var(--font-handwrite-zh)', fontSize: 'clamp(0.8rem, 1vw, 1.1rem)',
              color: 'rgba(40,25,10,0.6)', letterSpacing: '0.06em',
            }}>
              {postcard.message.closing}
            </span>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '1.5px solid rgba(200,50,40,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.55rem',
                color: 'rgba(200,50,40,0.5)',
              }}>
                {character.name.charAt(0)}
              </span>
            </div>
          </div>

          {/* location pin */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginBottom: 12,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(80,60,40,0.5)" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span style={{
              fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.68rem',
              color: 'rgba(80,60,40,0.5)', letterSpacing: '0.04em',
            }}>
              {postcard.message.location}
            </span>
          </div>

          {/* collect button — top right corner */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onCollect();
            }}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: collected
                ? 'rgba(200,50,40,0.12)'
                : 'rgba(200,168,96,0.1)',
              border: collected
                ? '1px solid rgba(200,50,40,0.3)'
                : '1px solid rgba(200,168,96,0.25)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              transition: 'all 0.3s',
            }}
            title={collected ? '已收藏' : '收藏此明信片'}
          >
            {collected ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(200,50,40,0.65)" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(200,168,96,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* flip hint */}
        <div style={{
          position: 'absolute', bottom: 10, right: 20,
          fontFamily: 'var(--font-handwrite-en)', fontSize: '0.52rem',
          color: 'rgba(120,100,80,0.3)', letterSpacing: '0.03em',
        }}>
          tap to flip
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  GachaMode — full gacha UI with envelope, postcard, daily draw      */
/* ------------------------------------------------------------------ */
function GachaMode() {
  /* state machine: 'envelope' -> 'opening' -> 'postcard' */
  const [phase, setPhase] = useState<'envelope' | 'opening' | 'postcard' | 'collection'>('envelope');
  const [drawn, setDrawn] = useState<DrawnPostcard | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [collected, setCollected] = useState(false);
  const [collectAnimating, setCollectAnimating] = useState(false);
  const [savedPostcards, setSavedPostcards] = useState<DrawnPostcard[]>(() => {
    try {
      const raw = localStorage.getItem('postcard_collection');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [expandedCard, setExpandedCard] = useState<DrawnPostcard | null>(null);

  /* check localStorage on mount */
  useEffect(() => {
    const key = `postcard_drawn_${getTodayKey()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data: DrawnPostcard = JSON.parse(saved);
        setDrawn(data);
        const ch = mockCharacters.find((c) => c.id === data.characterId) || null;
        setCharacter(ch);
        setPhase('postcard');

        /* check collected state */
        const colKey = `postcard_collected_${data.characterId}_${data.date}`;
        if (localStorage.getItem(colKey)) {
          setCollected(true);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }, []);

  const handleDraw = useCallback(() => {
    if (phase === 'opening' || phase === 'postcard') return;
    setPhase('opening');

    const ch = pickRandomCharacter();
    setCharacter(ch);

    const msg = generatePostcardMessage(ch.id);
    const card: DrawnPostcard = {
      characterId: ch.id,
      characterName: ch.name,
      characterGame: ch.game,
      characterAvatar: ch.avatar,
      characterAvatarImage: ch.avatarImage,
      message: msg,
      date: getTodayKey(),
    };

    /* persist */
    localStorage.setItem(`postcard_drawn_${getTodayKey()}`, JSON.stringify(card));
    setDrawn(card);

    /* after seal break + envelope split (~0.8s), show postcard */
    setTimeout(() => {
      setPhase('postcard');
    }, 1000);
  }, [phase]);

  const handleCollect = useCallback(() => {
    if (!drawn || collected || collectAnimating) return;
    setCollectAnimating(true);

    const colKey = `postcard_collected_${drawn.characterId}_${drawn.date}`;
    localStorage.setItem(colKey, '1');

    // save to permanent collection
    const updated = [...savedPostcards, drawn];
    setSavedPostcards(updated);
    localStorage.setItem('postcard_collection', JSON.stringify(updated));

    /* wait for fly-in animation to complete */
    setTimeout(() => {
      setCollected(true);
      setCollectAnimating(false);
    }, 800);
  }, [drawn, collected, collectAnimating, savedPostcards]);

  const handleFlip = useCallback(() => {
    setShowBack((prev) => !prev);
  }, []);

  const sealLetter = character ? character.name.charAt(0) : '?';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 'clamp(1.5rem, 5vw, 4rem)',
        paddingBottom: '5rem',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        padding: 'clamp(1.5rem, 5vw, 4rem) clamp(1rem, 5vw, 3rem) 5rem',
      }}
    >
      {/* ---- Envelope Phase ---- */}
      <AnimatePresence>
        {phase === 'envelope' || phase === 'opening' ? (
          <motion.div
            key="envelope-wrapper"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            style={{ position: 'relative' }}
          >
            {/* envelope bottom half */}
            <motion.div
              animate={
                phase === 'opening'
                  ? { y: -60, opacity: 0, transition: { duration: 0.5, delay: 0.4 } }
                  : {}
              }
              style={{
                width: 'clamp(280px, 55vw, 520px)',
                height: 'clamp(90px, 15vw, 150px)',
                background: 'linear-gradient(180deg, hsl(38, 35%, 65%) 0%, hsl(38, 32%, 60%) 100%)',
                borderRadius: '0 0 4px 4px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              {/* kraft paper texture lines */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 12px,
                  rgba(0,0,0,0.02) 12px,
                  rgba(0,0,0,0.02) 13px
                )`,
                pointerEvents: 'none',
              }} />
            </motion.div>

            {/* envelope top half (flap) */}
            <motion.div
              animate={
                phase === 'opening'
                  ? { y: 60, opacity: 0, transition: { duration: 0.5, delay: 0.4 } }
                  : {}
              }
              style={{
                width: 'clamp(280px, 55vw, 520px)',
                height: 'clamp(90px, 15vw, 150px)',
                background: 'linear-gradient(0deg, hsl(38, 35%, 62%) 0%, hsl(40, 38%, 68%) 100%)',
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
              }}
            >
              {/* triangular flap */}
              <div style={{
                position: 'absolute',
                bottom: -40,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '160px solid transparent',
                borderRight: '160px solid transparent',
                borderTop: '50px solid hsl(38, 35%, 62%)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              }} />

              {/* kraft paper texture */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 12px,
                  rgba(0,0,0,0.02) 12px,
                  rgba(0,0,0,0.02) 13px
                )`,
                pointerEvents: 'none',
              }} />

              {/* address lines */}
              <div style={{
                position: 'absolute', top: 18, left: 30, right: 80,
              }}>
                <div style={{
                  height: 1, width: '60%',
                  background: 'rgba(0,0,0,0.08)', marginBottom: 8,
                }} />
                <div style={{
                  height: 1, width: '45%',
                  background: 'rgba(0,0,0,0.06)', marginBottom: 8,
                }} />
                <div style={{
                  height: 1, width: '55%',
                  background: 'rgba(0,0,0,0.05)',
                }} />
              </div>
            </motion.div>

            {/* wax seal — centered on envelope */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
              onClick={phase === 'envelope' ? handleDraw : undefined}
            >
              <WaxSeal letter={sealLetter} broken={phase === 'opening'} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ---- Postcard Phase ---- */}
      <AnimatePresence mode="wait">
        {phase === 'postcard' && drawn && character && (
          <motion.div
            key={showBack ? 'postcard-back' : 'postcard-front'}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ perspective: 800 }}
          >
            {showBack ? (
              <PostcardBack
                character={character}
                postcard={drawn}
                onCollect={handleCollect}
                collected={collected}
                onClickBack={handleFlip}
              />
            ) : (
              <PostcardFront
                character={character}
                postcard={drawn}
                onClick={handleFlip}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Collect fly-in animation ---- */}
      <AnimatePresence>
        {collectAnimating && (
          <motion.div
            initial={{ scale: 1, x: 0, y: 0 }}
            animate={{ scale: 0.15, x: 140, y: -300, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.8 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: 'clamp(300px, 60vw, 560px)',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            <div style={{
              width: '100%', height: 180,
              borderRadius: 4,
              background: '#FFF8F0',
              boxShadow: '0 8px 32px rgba(200,168,96,0.4)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Hint text ---- */}
      {phase === 'envelope' && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: 'var(--font-handwrite-zh)',
            fontSize: 'clamp(0.75rem, 1vw, 1.05rem)',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            marginTop: 24,
          }}
        >
          点击蜡封，拆开今天的信封
        </motion.p>
      )}

      {phase === 'opening' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontFamily: 'var(--font-handwrite-zh)',
            fontSize: 'clamp(0.75rem, 1vw, 1.05rem)',
            color: 'rgba(200,168,96,0.6)',
            letterSpacing: '0.08em',
            marginTop: 24,
          }}
        >
          信封正在打开...
        </motion.p>
      )}

      {phase === 'postcard' && !showBack && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            fontFamily: 'var(--font-handwrite-zh)',
            fontSize: 'clamp(0.75rem, 1vw, 1.05rem)',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            marginTop: 20,
          }}
        >
          点击明信片翻转查看消息
        </motion.p>
      )}

      {phase === 'postcard' && showBack && (
        <>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: 'var(--font-handwrite-zh)',
            fontSize: 'clamp(0.75rem, 1vw, 1.05rem)',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            marginTop: 20,
          }}
        >
          {drawn?.characterName}的今日来信
        </motion.p>

        {/* action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: 8, marginTop: 12 }}
        >
          {/* close envelope — go back without clearing today's data */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowBack(false);
              setCollected(false);
              setPhase('envelope');
            }}
            style={{
              background: 'none',
              border: '1px solid rgba(200,168,96,0.15)',
              borderRadius: 4,
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-handwrite-zh)',
              fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)',
              color: 'rgba(200,168,96,0.35)',
              letterSpacing: '0.04em',
            }}
          >
            合上信封
          </motion.button>

          {/* view collection */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setPhase('collection');
            }}
            style={{
              background: 'none',
              border: '1px solid rgba(200,168,96,0.15)',
              borderRadius: 4,
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-handwrite-zh)',
              fontSize: 'clamp(0.6rem, 0.8vw, 0.8rem)',
              color: 'rgba(200,168,96,0.35)',
              letterSpacing: '0.04em',
            }}
          >
            珍藏明信片 ({savedPostcards.length})
          </motion.button>
        </motion.div>
        </>
      )}

      {/* ---- COLLECTION VIEW ---- */}
      {phase === 'collection' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            minHeight: '100%',
            padding: '1.5rem clamp(0.75rem, 3vw, 1.5rem) 4rem',
            boxSizing: 'border-box',
          }}
        >
          <h2 style={{
            fontFamily: 'var(--font-handwrite-zh)', fontSize: '1.2rem',
            color: 'var(--gold)', letterSpacing: '0.08em',
            fontWeight: 400, marginBottom: '1rem',
          }}>
            珍藏明信片
          </h2>

          {/* back button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setPhase(drawn ? 'postcard' : 'envelope');
            }}
            style={{
              background: 'none',
              border: '1px solid rgba(200,168,96,0.15)',
              borderRadius: 4,
              padding: '4px 12px',
              cursor: 'pointer',
              fontFamily: 'var(--font-handwrite-zh)',
              fontSize: '0.65rem',
              color: 'rgba(200,168,96,0.35)',
              letterSpacing: '0.04em',
              marginBottom: '1rem',
            }}
          >
            返回信件
          </motion.button>

          {savedPostcards.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.9rem',
              color: 'var(--text-muted)', letterSpacing: '0.04em',
              marginTop: '3rem',
            }}>
              还没有珍藏的明信片
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 85vw), 1fr))',
              gap: '1rem',
              width: '100%',
              maxWidth: 600,
            }}>
              {savedPostcards.map((pc, idx) => (
                <motion.div
                  key={`${pc.characterId}_${pc.date}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedCard(pc)}
                  style={{
                    cursor: 'pointer',
                    background: 'linear-gradient(175deg, #f8f5ef 0%, #f0ece4 100%)',
                    borderRadius: 4,
                    border: '1px solid rgba(200,180,140,0.3)',
                    padding: '12px 14px',
                    position: 'relative',
                  }}
                >
                  {/* date + location — top right */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8,
                    marginBottom: 6,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-handwrite-en)', fontSize: '0.55rem',
                      color: 'rgba(80,60,40,0.45)', letterSpacing: '0.03em',
                    }}>
                      {pc.date}
                    </span>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(80,60,40,0.4)" style={{ flexShrink: 0 }}>
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <span style={{
                        fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.55rem',
                        color: 'rgba(80,60,40,0.45)', letterSpacing: '0.03em',
                      }}>
                        {pc.message.location}
                      </span>
                    </div>
                  </div>

                  <p style={{
                    fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.95rem',
                    color: 'rgba(20,15,5,0.85)', letterSpacing: '0.06em',
                    margin: '0 0 4px',
                  }}>
                    {pc.characterName}
                  </p>

                  <p style={{
                    fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.6rem',
                    color: 'rgba(25,20,12,0.45)', letterSpacing: '0.04em',
                    margin: '0 0 8px',
                  }}>
                    {pc.characterGame}
                  </p>

                  <p style={{
                    fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.65rem',
                    color: 'rgba(25,20,12,0.55)', letterSpacing: '0.03em',
                    margin: 0,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}>
                    {pc.message.greeting}
                    {pc.message.body}
                    {'\n'}{pc.message.closing}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ---- EXPANDED CARD OVERLAY ---- */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div
            key="expanded-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setExpandedCard(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(5,5,5,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
              cursor: 'pointer',
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(175deg, #f8f5ef 0%, #f0ece4 100%)',
                borderRadius: 6,
                border: '1px solid rgba(200,180,140,0.4)',
                padding: 'clamp(16px, 2.5vw, 28px)',
                maxWidth: 'min(520px, 90vw)',
                width: '100%',
                cursor: 'default',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* close hint */}
              <p style={{
                fontFamily: 'var(--font-handwrite-en)', fontSize: '0.6rem',
                color: 'rgba(120,100,80,0.4)', textAlign: 'right',
                margin: '0 0 8px', letterSpacing: '0.03em',
              }}>
                click outside to close
              </p>

              {/* date + location */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 8,
              }}>
                <span style={{
                  fontFamily: 'var(--font-handwrite-en)', fontSize: '0.7rem',
                  color: 'rgba(80,60,40,0.5)', letterSpacing: '0.03em',
                }}>
                  {expandedCard.date}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(80,60,40,0.45)">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span style={{
                    fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.7rem',
                    color: 'rgba(80,60,40,0.5)', letterSpacing: '0.03em',
                  }}>
                    {expandedCard.message.location}
                  </span>
                </div>
              </div>

              {/* character name */}
              <p style={{
                fontFamily: 'var(--font-handwrite-zh)', fontSize: '1.3rem',
                color: 'rgba(20,15,5,0.9)', letterSpacing: '0.08em',
                margin: '0 0 4px',
              }}>
                {expandedCard.characterName}
              </p>

              {/* game */}
              <p style={{
                fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.75rem',
                color: 'rgba(25,20,12,0.45)', letterSpacing: '0.04em',
                margin: '0 0 14px',
              }}>
                {expandedCard.characterGame}
              </p>

              {/* divider */}
              <div style={{
                width: '40%', height: 1,
                background: 'rgba(180,160,130,0.3)',
                margin: '0 auto 14px',
              }} />

              {/* message */}
              <p style={{
                fontFamily: 'var(--font-handwrite-zh)', fontSize: '0.95rem',
                color: 'rgba(30,22,10,0.7)', letterSpacing: '0.04em',
                margin: 0, lineHeight: 1.8,
                whiteSpace: 'pre-line',
              }}>
                {expandedCard.message.greeting}
{'\n'}{expandedCard.message.body}
{'\n\n'}{expandedCard.message.closing}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page 2                                                              */
/* ------------------------------------------------------------------ */
export default function Page2() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>('archive');
  const [toast, setToast] = useState('');

  const handleSelectCharacter = (id: string) => {
    navigate(`/character/${id}`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(200,168,96,0.03) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* -------- top bar -------- */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        background: 'linear-gradient(to bottom, var(--bg) 60%, transparent)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.8rem',
              letterSpacing: '0.04em', padding: 0,
              fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回广场
          </button>

          <h1 style={{
            fontFamily: 'var(--font-handwrite-zh)', fontSize: '1.5rem',
            color: 'var(--gold)', letterSpacing: '0.08em', fontWeight: 400,
          }}>
            角色档案
          </h1>
        </div>

        <div style={{
          display: 'flex', gap: 6, background: 'var(--surface)',
          borderRadius: 6, padding: 4, border: '1px solid var(--surface-elevated)',
        }}>
          <button
            onClick={() => setMode('archive')}
            style={{
              background: mode === 'archive' ? 'rgba(200,168,96,0.15)' : 'transparent',
              border: `1px solid ${mode === 'archive' ? 'rgba(200,168,96,0.3)' : 'transparent'}`,
              cursor: 'pointer', borderRadius: 4, padding: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            aria-label="档案馆模式"
          >
            <FolderIcon active={mode === 'archive'} />
          </button>
          <button
            onClick={() => setMode('gacha')}
            style={{
              background: mode === 'gacha' ? 'rgba(200,168,96,0.15)' : 'transparent',
              border: `1px solid ${mode === 'gacha' ? 'rgba(200,168,96,0.3)' : 'transparent'}`,
              cursor: 'pointer', borderRadius: 4, padding: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            aria-label="抽卡模式"
          >
            <CardIcon active={mode === 'gacha'} />
          </button>
        </div>
      </div>

      {/* -------- content -------- */}
      <AnimatePresence mode="wait">
        {mode === 'archive' ? (
          <motion.div
            key="archive"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '1.5rem clamp(1rem, 4vw, 3rem) 5rem', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 45vw), 1fr))',
              gap: 'clamp(1rem, 2vw, 1.8rem) clamp(0.8rem, 1.5vw, 1.2rem)',
              justifyContent: 'center',
            }}>
              {mockCharacters.map((char, idx) => (
                <ArchiveCard
                  key={char.id}
                  character={char}
                  index={idx}
                  onClick={() => handleSelectCharacter(char.id)}
                />
              ))}

              {mockCharacters.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', paddingTop: '4rem',
                  }}
                >
                  <p style={{
                    fontFamily: 'var(--font-handwrite-zh)', fontSize: '1rem',
                    color: 'var(--text-muted)', letterSpacing: '0.04em',
                  }}>
                    还没有角色档案，快去添加吧
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="gacha"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GachaMode />
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------- FAB -------- */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.12, boxShadow: '0 6px 28px rgba(200,168,96,0.3)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => showToast('功能开发中，敬请期待')}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: '50%',
          border: '1px solid rgba(200,168,96,0.25)',
          background: 'rgba(200,168,96,0.12)',
          color: 'var(--gold)', fontSize: '1.6rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 20, lineHeight: 1,
        }}
        aria-label="新建角色"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
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
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
