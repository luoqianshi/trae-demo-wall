import styles from './SceneIllustration.module.css';

interface SceneIllustrationProps {
  scene: string;
}

export default function SceneIllustration({ scene }: SceneIllustrationProps) {
  return (
    <div className={styles.illustration} aria-hidden="true">
      <span className={styles.emoji}>{scene}</span>
      <div className={styles.overlay}>
        <div className={styles.line1} />
        <div className={styles.line2} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}
