import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const BindingPage: FC = () => {
  const [bindCode, setBindCode] = useState('NUANYANG2026');
  const [qrImageUrl, setQrImageUrl] = useState('');

  useEffect(() => {
    // 生成绑定码
    const code = 'NY' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setBindCode(code);

    // 生成二维码图片URL（使用API生成）
    // 实际应用中，后端会生成真实的二维码图片
    // 这里使用占位图
    setQrImageUrl('https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=' + encodeURIComponent(`nuanyang://bind?code=${code}`));
  }, []);

  const handleGuardianDemo = () => {
    // 跳转到监护人演示页面
    Taro.navigateTo({ url: '/pages/guardian/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
          <Text className={styles.backIcon}>‹</Text>
          <Text className={styles.backText}>返回</Text>
        </View>
        <Text className={styles.title}>📱 家庭绑定</Text>
        <Text className={styles.subtitle}>让家人实时守护您的安全</Text>
      </View>

      {/* 二维码卡片 */}
      <View className={styles.qrCard}>
        <View className={styles.qrContainer}>
          {qrImageUrl ? (
            <View className={styles.qrCode}>
              <Image src={qrImageUrl} mode="aspectFit" style={{ width: '320rpx', height: '320rpx' }} />
            </View>
          ) : (
            <View className={styles.qrPlaceholder} />
          )}
        </View>
        <Text className={styles.qrInfo}>
          请家人用微信扫描上方二维码
        </Text>
        <Text className={styles.bindCode}>{bindCode}</Text>
        <Text className={styles.qrInfo}>
          或让家人输入绑定码：{bindCode}
        </Text>
      </View>

      {/* 绑定说明 */}
      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>
          <Text className={styles.tipIcon}>💡</Text>
          绑定说明
        </Text>
        <Text className={styles.tipItem}>1. 让您的家人打开微信扫描上方二维码</Text>
        <Text className={styles.tipItem}>2. 或者让家人下载"暖阳守护"子女版App</Text>
        <Text className={styles.tipItem}>3. 绑定成功后，家人可实时查看您的健康数据</Text>
        <Text className={styles.tipItem}>4. 当您触发SOS求助时，家人会第一时间收到警报</Text>
      </View>

      {/* 监护人入口（演示用） */}
      <View className={styles.guardianLink} onClick={handleGuardianDemo}>
        <View className={styles.linkText}>
          <Text className={styles.linkTitle}>👨‍👩‍👧 监护人演示</Text>
          <Text className={styles.linkDesc}>点击体验子女端监护界面</Text>
        </View>
        <Text className={styles.linkArrow}>›</Text>
      </View>
    </View>
  );
};

export default BindingPage;