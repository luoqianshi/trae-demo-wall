import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { FamilyMember as FamilyMemberType } from '@/types';

interface FamilyMemberProps {
  member: FamilyMemberType;
}

const FamilyMember: React.FC<FamilyMemberProps> = ({ member }) => {
  const handleCall = () => {
    Taro.makePhoneCall({ phoneNumber: member.phone.replace(/\*/g, '') });
  };

  const handleVideo = () => {
    Taro.showToast({ title: '正在发起视频通话...', icon: 'none' });
  };

  return (
    <View className={styles.memberCard}>
      <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
      <View className={styles.info}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{member.name}</Text>
          <Text className={styles.relationship}>{member.relationship}</Text>
          {member.isOnline && <View className={styles.onlineDot} />}
        </View>
        <Text className={styles.phone}>{member.phone}</Text>
        <Text className={styles.lastContact}>{member.lastContact}</Text>
      </View>
      <View className={styles.actions}>
        <View className={styles.actionBtn} onClick={handleCall}>
          <Text className={styles.actionIcon}>📞</Text>
        </View>
        <View className={styles.actionBtn} onClick={handleVideo}>
          <Text className={styles.actionIcon}>📹</Text>
        </View>
      </View>
    </View>
  );
};

export default FamilyMember;