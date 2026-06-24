import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import { EyeTask } from '../../types/eye';
import styles from './index.module.scss';

interface TaskCardProps {
  task: EyeTask;
  onStart: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onStart }) => {
  const getTaskIcon = (type: string) => {
    const iconMap = {
      rest: '😴',
      exercise: '🏃',
      massage: '💆'
    };
    return iconMap[type] || '👁️';
  };

  return (
    <View className={styles.taskCard}>
      <View className={styles.taskHeader}>
        <Text className={styles.taskIcon}>{getTaskIcon(task.type)}</Text>
        <View className={styles.taskInfo}>
          <Text className={styles.taskTitle}>{task.title}</Text>
          <Text className={styles.taskDesc}>{task.description}</Text>
        </View>
      </View>

      <View className={styles.taskFooter}>
        <Text className={styles.taskDuration}>
          建议时长: {task.duration} 分钟
        </Text>
        <Button
          className={styles.startButton}
          onClick={() => onStart(task.id)}
        >
          {task.completed ? '已完成' : '开始'}
        </Button>
      </View>
    </View>
  );
};

export default TaskCard;