'use client';

import PixelCharacter, { SKINS, type SkinId } from './PixelCharacter';
import styles from './SkinSelector.module.css';

interface SkinSelectorProps {
  selectedSkin: SkinId;
  onSelect: (skinId: SkinId) => void;
  unlockedCount?: number;
}

export default function SkinSelector({
  selectedSkin,
  onSelect,
  unlockedCount = 4,
}: SkinSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {SKINS.map((skin) => {
          const isSelected = skin.id === selectedSkin;
          const isLocked = !skin.unlocked;

          return (
            <button
              key={skin.id}
              className={`${styles.card} ${isSelected ? styles.selected : ''} ${isLocked ? styles.locked : ''}`}
              onClick={() => !isLocked && onSelect(skin.id)}
              aria-pressed={isSelected}
              aria-label={isLocked ? `锁定皮肤：${skin.desc}` : skin.name}
              style={{ '--skin-bg': skin.bgGradient } as React.CSSProperties}
            >
              {/* 预览区 */}
              <div className={styles.preview}>
                <div className={styles.charWrapper}>
                  <PixelCharacter
                    skin={skin}
                    size={isLocked ? 4 : 6}
                    showBlink={!isLocked}
                  />
                </div>
                {isLocked && (
                  <div className={styles.lockOverlay}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* 名称 */}
              <div className={styles.info}>
                <span className={styles.name}>{skin.name}</span>
                {isLocked ? (
                  <span className={styles.hint}>{skin.unlockHint}</span>
                ) : (
                  <span className={styles.desc}>{skin.desc}</span>
                )}
              </div>

              {/* 选中标记 */}
              {isSelected && (
                <div className={styles.checkMark}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className={styles.progress}>
        已解锁 <strong>{unlockedCount}</strong> / {SKINS.length} 款装扮
        {unlockedCount < SKINS.length && ' · 继续闯关解锁更多 ✦'}
      </p>
    </div>
  );
}
