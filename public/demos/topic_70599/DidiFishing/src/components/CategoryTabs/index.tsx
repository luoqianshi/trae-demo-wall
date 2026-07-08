import React from 'react';
import { ScrollView, View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

export interface TabItem {
  value: string;
  label: string;
  color?: string;
}

interface CategoryTabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ tabs, value, onChange }) => {
  return (
    <View className={styles.wrap}>
      <ScrollView scrollX className={styles.scroll} enhanced showScrollbar={false}>
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <View
              key={tab.value}
              className={classnames(styles.tab, active && styles.active, active && tab.color && styles[`color_${tab.color}`])}
              onClick={() => onChange(tab.value)}
            >
              <Text className={classnames(styles.label, active && styles.activeLabel)}>{tab.label}</Text>
              {active && <View className={classnames(styles.indicator, tab.color && styles[`color_${tab.color}`])} />}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CategoryTabs;
