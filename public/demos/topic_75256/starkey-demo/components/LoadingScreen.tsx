import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  interest: string;
  topic: string;
}

export default function LoadingScreen({ interest, topic }: LoadingScreenProps) {
  // 孩子端只展示兴趣主题，不展示技能分类标签（topic 保留供 API 调用使用）
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.spinnerRing} />
        <div className={styles.spinnerDot} />
      </div>
      <h2 className={styles.title}>正在为「{interest}」生成专属情景…</h2>
      <p className={styles.desc}>
        为你写一个与「{interest}」有关的小故事
      </p>
      <p className={styles.hint}>
        请稍等片刻，马上就好 ✨
      </p>
      <div className={styles.progress}>
        <div className={styles.progressBar} />
      </div>
    </div>
  );
}