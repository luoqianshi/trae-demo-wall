import type { FC } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import FamilyMember from '@/components/FamilyMember';
import { familyMembers } from '@/data/family';

const FamilyPage: FC = () => {
  return (
    <ScrollView className={styles.page} scrollY>
      <Text className={styles.sectionTitle}>我的家人</Text>
      {familyMembers.length > 0 ? (
        familyMembers.map((member) => (
          <FamilyMember key={member.id} member={member} />
        ))
      ) : (
        <View className={styles.emptyTip}>
          <Text className={styles.emptyIcon}>👨‍👩‍👧</Text>
          <Text className={styles.emptyText}>暂无家人信息</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default FamilyPage;