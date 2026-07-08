import PixelCharacter, { getSkinById, type SkinId } from './PixelCharacter';
import styles from './CornerCharacter.module.css';

interface CornerCharacterProps {
  skinId: SkinId;
  position?: 'bottom-left' | 'bottom-right';
  size?: number;  // px per pixel
  mood?: 'normal' | 'happy' | 'thinking';
}

/**
 * 屏幕角落的陪伴角色，存在感轻、不干扰主流程
 * 仅用于非 loading 状态的屏
 */
export default function CornerCharacter({
  skinId,
  position = 'bottom-right',
  size = 5,
  mood = 'normal',
}: CornerCharacterProps) {
  const skin = getSkinById(skinId);

  return (
    <div
      className={`${styles.wrapper} ${styles[position]} ${styles[mood]}`}
      aria-hidden="true"
    >
      <PixelCharacter
        skin={skin}
        size={size}
        showBlink={mood === 'thinking'}
      />
      {/* 轻量的氛围脚底光晕 */}
      <div className={styles.shadow} />
    </div>
  );
}
