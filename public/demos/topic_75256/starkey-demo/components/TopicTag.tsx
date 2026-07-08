import { TrainingTopic, TRAINING_TOPICS } from '@/types';
import styles from './TopicTag.module.css';

interface TopicTagProps {
  selected: TrainingTopic;
  onChange: (topic: TrainingTopic) => void;
}

export default function TopicTag({ selected, onChange }: TopicTagProps) {
  return (
    <div className={styles.wrapper}>
      {TRAINING_TOPICS.map((topic) => (
        <button
          key={topic}
          className={`${styles.tag} ${selected === topic ? styles.active : ''}`}
          onClick={() => onChange(topic)}
          aria-pressed={selected === topic}
        >
          {topic}
        </button>
      ))}
    </div>
  );
}
