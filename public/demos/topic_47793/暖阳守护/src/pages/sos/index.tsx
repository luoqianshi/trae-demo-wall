import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import SOSButton from '@/components/SOSButton';
import { emergencyContacts as initialContacts } from '@/data/family';
import type { EmergencyContact } from '@/types';

interface LocationInfo {
  latitude: number;
  longitude: number;
  address: string;
  lastUpdate: string;
}

const SOSPage: React.FC = () => {
  const [location, setLocation] = useState<LocationInfo>({
    latitude: 39.9042,
    longitude: 116.4074,
    address: '正在获取位置...',
    lastUpdate: ''
  });
  const [contacts, setContacts] = useState<EmergencyContact[]>(initialContacts);

  const updateLocation = useCallback(() => {
    Taro.getLocation({
      type: 'gcj02',
      success: (res) => {
        const address = `北京市朝阳区建国路88号SOHO现代城A座`;
        setLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          address,
          lastUpdate: new Date().toLocaleTimeString()
        });
      },
      fail: () => {
        setLocation(prev => ({
          ...prev,
          address: '定位服务暂不可用'
        }));
      }
    });
  }, []);

  useEffect(() => {
    updateLocation();
    const timer = setInterval(updateLocation, 60000);
    return () => clearInterval(timer);
  }, [updateLocation]);

  const handleCall = useCallback((phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone });
  }, []);

  const handleRefreshLocation = useCallback(() => {
    Taro.getLocation({
      type: 'gcj02',
      success: (res) => {
        const address = `北京市朝阳区建国路88号SOHO现代城A座`;
        setLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          address,
          lastUpdate: new Date().toLocaleTimeString()
        });
        Taro.showToast({
          title: '位置已更新',
          icon: 'success',
          duration: 1500
        });
      },
      fail: () => {
        Taro.showToast({
          title: '定位失败',
          icon: 'none'
        });
      }
    });
  }, []);

  const handleUploadAvatar = useCallback((contactId: string) => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        setContacts(prev => prev.map(c => {
          if (c.id === contactId) {
            return { ...c, avatar: tempFilePath };
          }
          return c;
        }));
        Taro.showToast({
          title: '头像上传成功',
          icon: 'success'
        });
      },
      fail: () => {
        Taro.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  }, []);

  const renderContact = useCallback((contact: EmergencyContact) => (
    <View key={contact.id} className={styles.contactCard}>
      <View className={styles.contactAvatarWrapper}>
        {contact.avatar ? (
          <Image
            className={styles.contactAvatar}
            src={contact.avatar}
            mode='aspectFill'
          />
        ) : (
          <View className={styles.contactAvatarPlaceholder}>
            <Text className={styles.contactAvatarText}>{contact.name.charAt(0)}</Text>
          </View>
        )}
        <View className={styles.uploadAvatarBtn} onClick={() => handleUploadAvatar(contact.id)}>
          <Text className={styles.uploadAvatarIcon}>📷</Text>
        </View>
      </View>
      <View className={styles.contactInfo}>
        <Text className={styles.contactName}>{contact.name}</Text>
        <Text className={styles.contactRelationship}>{contact.relationship}</Text>
        <Text className={styles.contactPhone}>{contact.phone}</Text>
      </View>
      <View className={styles.callBtn} onClick={() => handleCall(contact.phone)}>
        <Text className={styles.callIcon}>📞</Text>
      </View>
    </View>
  ), [handleUploadAvatar, handleCall]);

  const renderedContacts = useMemo(() => contacts.map(renderContact), [contacts, renderContact]);

  return (
    <ScrollView className={styles.page} scrollY>
      <SOSButton />

      <Text className={styles.sectionTitle}>紧急联系人</Text>
      {renderedContacts}

      <View className={styles.locationCard}>
        <View className={styles.locationHeader}>
          <Text className={styles.locationTitle}>📍 实时位置</Text>
          <Text className={styles.refreshBtn} onClick={handleRefreshLocation}>🔄 刷新</Text>
        </View>
        <Text className={styles.locationInfo}>{location.address}</Text>
        <View className={styles.coordsRow}>
          <Text className={styles.coordsText}>经度: {location.latitude.toFixed(4)}</Text>
          <Text className={styles.coordsText}>纬度: {location.longitude.toFixed(4)}</Text>
        </View>
        {location.lastUpdate && (
          <Text className={styles.updateTime}>更新于 {location.lastUpdate}</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default React.memo(SOSPage);