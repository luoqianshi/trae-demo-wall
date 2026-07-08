'use client';

import styles from './MotionToggle.module.css';

interface MotionToggleProps {
  reduced: boolean;
  onToggle: () => void;
}

export default function MotionToggle({ reduced, onToggle }: MotionToggleProps) {
  return (
    <button
      className={`${styles.button} ${reduced ? styles.active : ''}`}
      onClick={onToggle}
      aria-label={reduced ? '开启温和动效模式' : '开启安静模式，减少动效'}
      title={reduced ? '开启温和动效' : '减少闪烁与动画'}
    >
      <span className={styles.icon} aria-hidden="true">🌀</span>
      {reduced ? '温和' : '安静'}
    </button>
  );
}
