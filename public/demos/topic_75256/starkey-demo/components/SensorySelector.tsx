'use client';

import { SensoryLevel, SENSORY_LEVELS } from '@/types';
import styles from './SensorySelector.module.css';

interface SensorySelectorProps {
  level: SensoryLevel;
  soundOn: boolean;
  onChange: (level: SensoryLevel) => void;
  onToggleSound: () => void;
}

export default function SensorySelector({ level, soundOn, onChange, onToggleSound }: SensorySelectorProps) {
  return (
    <div className={styles.wrap} role="group" aria-label="感官强度选择">
      {/* 三档选择按钮 */}
      <div className={styles.buttons}>
        {SENSORY_LEVELS.map((opt) => {
          const isActive = opt.id === level;
          return (
            <button
              key={opt.id}
              className={`${styles.btn} ${isActive ? styles.btnActive : ''} ${styles[`btn-${opt.id}`]}`}
              onClick={() => onChange(opt.id)}
              aria-pressed={isActive}
              aria-label={opt.desc}
              title={opt.desc}
            >
              <span className={styles.btnIcon} aria-hidden="true">
                {opt.id === 'quiet' ? '🌙' : opt.id === 'gentle' ? '☀️' : '✨'}
              </span>
              <span className={styles.btnLabel}>{opt.label}</span>
            </button>
          );
        })}
      </div>
      {/* 仅在动感模式下显示音效开关（默认关闭） */}
      {level === 'lively' && (
        <button
          className={`${styles.soundBtn} ${soundOn ? styles.soundOn : ''}`}
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? '关闭音效' : '开启音效'}
          title={soundOn ? '关闭音效' : '开启音效'}
        >
          <span className={styles.soundIcon} aria-hidden="true">
            {soundOn ? '🔔' : '🔕'}
          </span>
          <span className={styles.soundLabel}>{soundOn ? '音效开' : '音效关'}</span>
        </button>
      )}
    </div>
  );
}
