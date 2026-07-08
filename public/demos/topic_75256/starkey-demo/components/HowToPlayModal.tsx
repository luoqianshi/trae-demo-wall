'use client';

import { useEffect, useRef } from 'react';
import styles from './HowToPlayModal.module.css';

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // 点击遮罩关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="怎么玩">
      <div className={styles.modal}>
        {/* 关闭按钮 */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* 标题 */}
        <div className={styles.header}>
          <span className={styles.headerIcon}>❓</span>
          <h2 className={styles.title}>怎么玩？</h2>
        </div>

        {/* 玩法步骤 */}
        <div className={styles.steps}>
          {/* 步骤1 */}
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a1800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className={styles.stepContent}>
              <p className={styles.stepText}>选一个你喜欢的主题，读一个小故事</p>
            </div>
            <div className={styles.stepEmoji}>📖</div>
          </div>

          {/* 步骤2 */}
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a1800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div className={styles.stepContent}>
              <p className={styles.stepText}>想一想，你会怎么做？点一下选择</p>
            </div>
            <div className={styles.stepEmoji}>🤔</div>
          </div>

          {/* 步骤3 */}
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a1800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/>
                <path d="M13 6l6 6-6 6"/>
              </svg>
            </div>
            <div className={styles.stepContent}>
              <p className={styles.stepText}>每闯一关，小旅客就往前坐一站 🚇</p>
            </div>
            <div className={styles.stepEmoji}>🚇</div>
          </div>

          {/* 步骤4 */}
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a1800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div className={styles.stepContent}>
              <p className={styles.stepText}>攒够分数升级，解锁新装扮 ✨</p>
            </div>
            <div className={styles.stepEmoji}>⭐</div>
          </div>
        </div>

        {/* 小提示 */}
        <div className={styles.tip}>
          <span className={styles.tipIcon}>💡</span>
          <p className={styles.tipText}>坚持就有进步 ✦</p>
        </div>
      </div>
    </div>
  );
}
