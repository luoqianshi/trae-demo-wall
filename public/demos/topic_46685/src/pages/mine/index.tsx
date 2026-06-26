import React, { useState, useEffect } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { getAIService, AIConfig, DEFAULT_CONFIG } from '@/services/ai';
import { StorageUtil } from '@/utils/storage';

interface MenuItem {
  id: string;
  icon: string;
  text: string;
}

const menuItems: MenuItem[] = [
  { id: '1', icon: '⚙️', text: '设置' },
  { id: '2', icon: '🔔', text: '提醒管理' },
  { id: '3', icon: '👨‍👩‍👧‍👦', text: '家人管理' },
  { id: '4', icon: '📱', text: '使用帮助' },
  { id: '5', icon: '💬', text: '意见反馈' },
  { id: '6', icon: 'ℹ️', text: '关于我们' }
];

const MinePage: React.FC = () => {
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 加载配置
    const savedConfig = StorageUtil.getAIConfig();
    setConfig(savedConfig);
    setApiKey(savedConfig.apiKey);
  }, []);

  const handleMenuClick = (item: MenuItem) => {
    if (item.text === '设置') {
      setShowConfig(!showConfig);
    } else {
      Taro.showToast({
        title: `${item.text}功能开发中`,
        icon: 'none'
      });
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      Taro.showToast({
        title: '请输入API Key',
        icon: 'none'
      });
      return;
    }

    setSaving(true);
    try {
      await StorageUtil.saveAIConfig({ apiKey: apiKey.trim() });
      const newConfig = StorageUtil.getAIConfig();
      setConfig(newConfig);
      getAIService().setConfig(newConfig);
      
      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      });
      setShowConfig(false);
    } catch (error) {
      console.error('保存失败:', error);
      Taro.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    } finally {
      setSaving(false);
    }
  };

  const hasApiKey = !!config.apiKey?.trim();

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>李</Text>
          </View>
          <View className={styles.userDetail}>
            <Text className={styles.userName}>李叔叔</Text>
            <Text className={styles.userDesc}>欢迎使用银发陪伴</Text>
          </View>
        </View>
      </View>

      {/* AI配置区域 */}
      <View className={styles.aiSection}>
        <View className={styles.aiHeader} onClick={() => setShowConfig(!showConfig)}>
          <View className={styles.aiTitleRow}>
            <Text className={styles.aiIcon}>🤖</Text>
            <Text className={styles.aiTitle}>AI 配置</Text>
          </View>
          <View className={styles.aiStatus}>
            <Text className={hasApiKey ? styles.statusOn : styles.statusOff}>
              {hasApiKey ? '已配置' : '未配置'}
            </Text>
            <Text className={styles.arrow}>{showConfig ? '▼' : '▶'}</Text>
          </View>
        </View>

        {showConfig && (
          <View className={styles.aiConfig}>
            <Text className={styles.configLabel}>硅基流动 API Key</Text>
            <View className={styles.inputRow}>
              <Input
                className={styles.input}
                type='text'
                password
                placeholder='请输入您的 API Key'
                value={apiKey}
                onInput={(e) => setApiKey(e.detail.value)}
              />
            </View>
            <Text className={styles.configHint}>
              获取方式：访问 https://cloud.siliconflow.cn 注册并获取免费API Key
            </Text>
            <Button
              className={styles.saveBtn}
              onClick={handleSaveConfig}
              disabled={saving}
            >
              <Text className={styles.saveBtnText}>{saving ? '保存中...' : '保存配置'}</Text>
            </Button>
          </View>
        )}
      </View>

      <View className={styles.menuSection}>
        <View className={styles.menuList}>
          {menuItems.map(item => (
            <View
              key={item.id}
              className={styles.menuItem}
              onClick={() => handleMenuClick(item)}
            >
              <View className={styles.menuLeft}>
                <Text className={styles.menuIcon}>{item.icon}</Text>
                <Text className={styles.menuText}>{item.text}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.version}>版本 1.0.0</Text>
      </View>
    </View>
  );
};

export default MinePage;
