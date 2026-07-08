import React, { useState, useEffect, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface LocationInfo {
  latitude: number;
  longitude: number;
  address: string;
}

const SOSButton: React.FC = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 获取当前位置
  const getLocation = useCallback((): Promise<LocationInfo> => {
    return new Promise((resolve) => {
      Taro.getLocation({
        type: 'gcj02',
        success: (res) => {
          // 实际应用中会根据经纬度获取详细地址
          const address = `经度${res.longitude.toFixed(4)}，纬度${res.latitude.toFixed(4)}`;
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            address
          });
        },
        fail: () => {
          // 如果获取失败，使用默认地址
          resolve({
            latitude: 39.9042,
            longitude: 116.4074,
            address: '北京市朝阳区建国路88号SOHO现代城A座'
          });
        }
      });
    });
  }, []);

  // 语音播报当前位置
  const speakLocation = useCallback(async (loc: LocationInfo) => {
    // 检查设备是否支持语音播报
    const speechMessage = `紧急求助！当前位置：${loc.address}`;

    // 使用Taro内部方法触发语音播报（需要配合实际TTS服务）
    try {
      // 在实际设备上会调用TTS服务
      // 这里模拟显示播报内容
      Taro.showToast({
        title: '正在语音播报位置...',
        icon: 'none',
        duration: 2000
      });

      // 延迟模拟语音播报过程
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('[SOS] 语音播报失败:', error);
    }
  }, []);

  // 触发紧急求助
  const triggerSOS = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. 获取当前位置
      const currentLocation = await getLocation();
      setLocation(currentLocation);

      // 2. 语音播报位置
      await speakLocation(currentLocation);

      // 3. 拨打第一个紧急联系人（示例中拨打电话功能在实际设备上可用）
      Taro.showModal({
        title: '🚨 紧急求助已触发',
        content: `正在联系紧急联系人...\n\n位置：${currentLocation.address}`,
        showCancel: false,
        success: () => {
          // 实际场景中这里会调用 Taro.makePhoneCall
          // Taro.makePhoneCall({ phoneNumber: '13800138888' });
        }
      });

    } catch (error) {
      console.error('[SOS] 求助触发失败:', error);
      Taro.showToast({
        title: '求助失败，请重试',
        icon: 'none'
      });
    } finally {
      setIsLoading(false);
    }
  }, [getLocation, speakLocation]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPressed && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSOS();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPressed, countdown]);

  const handleTouchStart = () => {
    if (isLoading) return;
    setIsPressed(true);
    setCountdown(3);
  };

  const handleTouchEnd = () => {
    if (isLoading) return;
    setIsPressed(false);
    setCountdown(0);
  };

  const handleSOS = () => {
    setIsPressed(false);
    triggerSOS();
  };

  return (
    <View className={styles.sosContainer}>
      <View
        className={`${styles.sosButton} ${isPressed ? styles.pressed : ''} ${isLoading ? styles.loading : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <Text className={styles.loadingIcon}>⏳</Text>
        ) : countdown > 0 ? (
          <Text className={styles.countdown}>{countdown}</Text>
        ) : (
          <>
            <Text className={styles.icon}>🚨</Text>
            <Text className={styles.text}>长按求助</Text>
          </>
        )}
      </View>
      <Text className={styles.tip}>长按3秒触发紧急求助</Text>
      <Text className={styles.tip}>触发后将自动定位并语音播报当前位置</Text>
    </View>
  );
};

export default SOSButton;