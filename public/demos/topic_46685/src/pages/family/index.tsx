import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { ReminderManager, Reminder } from '@/utils/reminder';
import { StorageUtil, STORAGE_KEYS } from '@/utils/storage';

// 这是一个空注释，用来强制 Webpack 重新构建该页面

interface Contact {
  id: string;
  name: string;
  relation: string;
  avatar: string;
  phone: string;
}

const contacts: Contact[] = [
  { id: '1', name: '儿子', relation: '儿子 - 紧急联系人', avatar: '儿', phone: '138****8888' },
  { id: '2', name: '女儿', relation: '女儿', avatar: '女', phone: '139****9999' },
  { id: '3', name: '社区医生', relation: '社区家庭医生', avatar: '医', phone: '120' }
];

const albumImages = [
  'https://picsum.photos/id/1027/300/300',
  'https://picsum.photos/id/1012/300/300',
  'https://picsum.photos/id/1035/300/300',
  'https://picsum.photos/id/1083/300/300',
  'https://picsum.photos/id/1084/300/300',
  'https://picsum.photos/id/1080/300/300'
];

const FamilyPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // 加载提醒
  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = () => {
    const savedReminders = ReminderManager.getAll();
    
    // 检查是否有旧数据（可能有重复ID），如果有就清理并重新初始化
    if (savedReminders.length === 0 || ReminderManager.hasDuplicateIds()) {
      ReminderManager.resetReminders();
      setReminders(ReminderManager.getAll());
    } else {
      setReminders(savedReminders);
    }
  };

  const handleSOS = () => {
    Taro.showModal({
      title: '紧急呼救',
      content: '确定要发送紧急求救信号吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '已发送求救信号！',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  };

  const handleCall = (contact: Contact) => {
    Taro.showToast({
      title: `正在拨打 ${contact.name} 的电话...`,
      icon: 'none'
    });
  };

  const handleAlbumClick = () => {
    Taro.showToast({
      title: '查看更多照片',
      icon: 'none'
    });
  };

  const toggleReminder = (reminder: Reminder) => {
    ReminderManager.update(reminder.id, { enabled: !reminder.enabled });
    loadReminders();
    Taro.showToast({
      title: reminder.enabled ? '已关闭' : '已开启',
      icon: 'success'
    });
  };

  const addReminder = () => {
    Taro.showToast({
      title: '添加提醒功能开发中',
      icon: 'none'
    });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.sosSection}>
        <Text className={styles.sosTitle}>紧急求助</Text>
        <Button className={styles.sosBtn} onClick={handleSOS}>
          <Text className={styles.sosIcon}>🆘</Text>
          <Text className={styles.sosText}>一键呼救</Text>
        </Button>
        <Text className={styles.sosDesc}>遇到紧急情况时，快速联系家人和社区</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>健康提醒</Text>
          <Button className={styles.addBtn} onClick={addReminder}>
            <Text>+ 添加</Text>
          </Button>
        </View>
        <View className={styles.remindersList}>
          {reminders.map(reminder => (
            <View key={reminder.id} className={styles.reminderItem}>
              <View className={styles.reminderInfo}>
                <Text className={styles.reminderTitle}>{reminder.title}</Text>
                <Text className={styles.reminderTime}>{reminder.time}</Text>
              </View>
              <Switch
                className={styles.reminderSwitch}
                checked={reminder.enabled}
                onChange={() => toggleReminder(reminder)}
                color='#FF6B35'
              />
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>家庭相册</Text>
        <View className={styles.albumSection}>
          <View className={styles.albumGrid}>
            {albumImages.map((img, index) => (
              <View
                key={index}
                className={styles.albumItem}
                onClick={handleAlbumClick}
              >
                <Image
                  src={img}
                  mode="aspectFill"
                  className={styles.albumImg}
                />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>紧急联系人</Text>
        <View className={styles.contactsList}>
          {contacts.map(contact => (
            <View key={contact.id} className={styles.contactItem}>
              <View className={styles.contactAvatar}>
                <Text className={styles.contactAvatarText}>{contact.avatar}</Text>
              </View>
              <View className={styles.contactInfo}>
                <Text className={styles.contactName}>{contact.name}</Text>
                <Text className={styles.contactRelation}>{contact.relation}</Text>
              </View>
              <Button
                className={styles.contactPhone}
                onClick={() => handleCall(contact)}
              >
                <Text>📞</Text>
              </Button>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default FamilyPage;
