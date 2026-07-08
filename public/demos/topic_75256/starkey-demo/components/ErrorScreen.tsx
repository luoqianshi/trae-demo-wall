import PrimaryButton from './PrimaryButton';
import styles from './ErrorScreen.module.css';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>😔</div>
      <h2 className={styles.title}>遇到一点小问题</h2>
      <p className={styles.message}>{message}</p>
      <PrimaryButton onClick={onRetry} fullWidth>
        再试一次
      </PrimaryButton>
    </div>
  );
}
