import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import EyeStatusCard from '@/components/EyeStatusCard';
import TaskCard from '@/components/TaskCard';
import { EyeStatus, EyeTask } from '@/types/eye';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const [eyeStatus, setEyeStatus] = useState<EyeStatus>({
    level: 'good',
    score: 85,
    continuousTime: 45,
    todayRestCount: 3,
    todayRestTime: 15
  });

  const [tasks, setTasks] = useState<EyeTask[]>([
    {
      id: '1',
      title: '眼部放松',
      description: '闭上眼睛，深呼吸，让眼睛得到休息',
      duration: 2,
      type: 'rest',
      completed: false,
      icon: '😴'
    },
    {
      id: '2',
      title: '远眺练习',
      description: '看向远处，缓解眼部疲劳',
      duration: 1,
      type: 'exercise',
      completed: false,
      icon: '🏃'
    },
    {
      id: '3',
      title: '眼保健操',
      description: '通过按摩眼部穴位，缓解疲劳',
      duration: 3,
      type: 'massage',
      completed: false,
      icon: '💆'
    }
  ]);

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      setTimerRunning(true);
      setTimerSeconds(0);

      // 模拟任务完成
      setTimeout(() => {
        setTimerRunning(false);
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, completed: true } : t
        ));
        setEyeStatus(prev => ({
          ...prev,
          todayRestCount: prev.todayRestCount + 1,
          todayRestTime: prev.todayRestTime + task.duration,
          score: Math.min(prev.score + 5, 100),
          continuousTime: 0
        }));

        Taro.showToast({
          title: '任务完成！积分+5',
          icon: 'success'
        });
      }, task.duration * 60 * 1000);
    }
  };

  const handleStartRest = () => {
    setTimerRunning(true);
    setTimerSeconds(0);
  };

  const handleStopRest = () => {
    setTimerRunning(false);
    const restMinutes = Math.ceil(timerSeconds / 60);
    if (restMinutes > 0) {
      setEyeStatus(prev => ({
        ...prev,
        todayRestCount: prev.todayRestCount + 1,
        todayRestTime: prev.todayRestTime + restMinutes,
        continuousTime: 0,
        score: Math.min(prev.score + restMinutes, 100)
      }));

      Taro.showToast({
        title: `休息${restMinutes}分钟，积分+${restMinutes}`,
        icon: 'success'
      });
    }
    setTimerSeconds(0);
  };

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[now.getDay()];
    return `${year}年${month}月${day}日 星期${weekDay}`;
  };

  return (
    <View className={styles.homePage}>
      <View className={styles.header}>
        <Text className={styles.welcomeText}>你好，护眼达人 👋</Text>
        <Text className={styles.dateText}>{getCurrentDate()}</Text>
      </View>

      <EyeStatusCard status={eyeStatus} />

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>快速开始</Text>
        <View className={styles.quickActions}>
          <Button className={styles.actionButton} onClick={handleStartRest}>
            <Text className={styles.actionIcon}>⏰</Text>
            <Text className={styles.actionText}>开始休息</Text>
          </Button>
          <Button
            className={styles.actionButton}
            onClick={() => handleStartTask('1')}
          >
            <Text className={styles.actionIcon}>😴</Text>
            <Text className={styles.actionText}>眼部放松</Text>
          </Button>
          <Button
            className={styles.actionButton}
            onClick={() => handleStartTask('2')}
          >
            <Text className={styles.actionIcon}>🏃</Text>
            <Text className={styles.actionText}>远眺练习</Text>
          </Button>
        </View>
      </View>

      {timerRunning && (
        <View className={styles.timerSection}>
          <Text className={styles.timerTitle}>正在休息中...</Text>
          <Text className={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
          <Button className={styles.timerButton} onClick={handleStopRest}>
            结束休息
          </Button>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>推荐任务</Text>
        <View className={styles.tasksList}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={handleStartTask}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default HomePage;