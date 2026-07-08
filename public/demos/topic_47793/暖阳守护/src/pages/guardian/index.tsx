import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { healthDataList } from '@/data/health';
import { medicationList as initialMedicationList, Medication } from '@/data/medication';

interface ElderInfo {
  name: string;
  status: 'online' | 'offline' | 'sos';
  lastLocation: string;
  bindTime: string;
}

const GuardianPage: React.FC = () => {
  const [elderInfo] = useState<ElderInfo>({
    name: '王奶奶',
    status: 'online',
    lastLocation: '北京市朝阳区建国路88号SOHO现代城A座',
    bindTime: '2026-06-15 14:30'
  });

  const [hasSOSAlert, setHasSOSAlert] = useState(false);
  const [sosData, setSOSData] = useState({
    time: '',
    location: '',
    heartRate: 0
  });

  const [medications, setMedications] = useState<Medication[]>(initialMedicationList);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  useEffect(() => {
    const checkSOS = () => {};
    const timer = setInterval(checkSOS, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleCallElder = useCallback(() => {
    Taro.makePhoneCall({ phoneNumber: '01012345678' });
  }, []);

  const handleViewLocation = useCallback(() => {
    Taro.showToast({
      title: `位置：${elderInfo.lastLocation}`,
      icon: 'none',
      duration: 3000
    });
  }, [elderInfo.lastLocation]);

  const handleDismissSOS = useCallback(() => {
    setHasSOSAlert(false);
  }, []);

  const handleSimulateSOS = useCallback(() => {
    setHasSOSAlert(true);
    setSOSData({
      time: new Date().toLocaleTimeString(),
      location: elderInfo.lastLocation,
      heartRate: healthDataList.find(h => h.type === 'heartRate')?.value || 0
    });

    Taro.showModal({
      title: '🚨 紧急求助警报',
      content: `检测到老人触发SOS求助！\n\n位置：${elderInfo.lastLocation}\n\n请立即联系老人确认情况！`,
      showCancel: true,
      cancelText: '已联系',
      confirmText: '查看详情',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '正在定位...', icon: 'loading' });
        }
      }
    });
  }, [elderInfo.lastLocation]);

  const handleAddMedication = useCallback(() => {
    setEditingMedication(null);
    setShowAddModal(true);
  }, []);

  const handleEditMedication = useCallback((medication: Medication) => {
    setEditingMedication(medication);
    setShowAddModal(true);
  }, []);

  const handleDeleteMedication = useCallback((id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个药物吗？',
      success: (res) => {
        if (res.confirm) {
          setMedications(prev => prev.filter(m => m.id !== id));
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }, []);

  const handleSaveMedication = useCallback((formData: {
    name: string;
    dosage: string;
    unit: string;
    times: string[];
    withFood: boolean;
    notes: string;
  }) => {
    if (editingMedication) {
      setMedications(prev => prev.map(m => {
        if (m.id === editingMedication.id) {
          return { ...m, ...formData };
        }
        return m;
      }));
      Taro.showToast({ title: '修改成功', icon: 'success' });
    } else {
      const newMedication: Medication = {
        id: 'm' + Date.now(),
        name: formData.name,
        dosage: formData.dosage,
        unit: formData.unit,
        times: formData.times,
        reminderEnabled: true,
        withFood: formData.withFood,
        notes: formData.notes,
        color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'][Math.floor(Math.random() * 5)],
        records: []
      };
      setMedications(prev => [...prev, newMedication]);
      Taro.showToast({ title: '添加成功', icon: 'success' });
    }
    setShowAddModal(false);
    setEditingMedication(null);
  }, [editingMedication]);

  const getHealthIcon = useCallback((type: string) => {
    switch (type) {
      case 'heartRate': return '❤️';
      case 'bloodPressure': return '🩸';
      case 'sleep': return '😴';
      default: return '⚕️';
    }
  }, []);

  const getHealthUnit = useCallback((type: string) => {
    switch (type) {
      case 'heartRate': return '次/分';
      case 'bloodPressure': return 'mmHg';
      case 'sleep': return '小时';
      default: return '';
    }
  }, []);

  const getHealthLabel = useCallback((type: string) => {
    switch (type) {
      case 'heartRate': return '心率';
      case 'bloodPressure': return '血压';
      case 'sleep': return '睡眠';
      default: return '';
    }
  }, []);

  const getHealthStatus = useCallback((status: string) => {
    switch (status) {
      case 'normal': return '✓ 正常';
      case 'warning': return '⚠ 偏高';
      default: return '✗ 异常';
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '1',
    unit: '片',
    times: ['08:00'],
    withFood: false,
    notes: ''
  });

  useEffect(() => {
    if (editingMedication) {
      setFormData({
        name: editingMedication.name,
        dosage: editingMedication.dosage,
        unit: editingMedication.unit,
        times: [...editingMedication.times],
        withFood: editingMedication.withFood,
        notes: editingMedication.notes
      });
    } else {
      setFormData({
        name: '',
        dosage: '1',
        unit: '片',
        times: ['08:00'],
        withFood: false,
        notes: ''
      });
    }
  }, [editingMedication, showAddModal]);

  const renderedHealthData = useMemo(() => healthDataList.map(item => (
    <View key={item.id} className={styles.healthItem}>
      <Text className={styles.healthIcon}>{getHealthIcon(item.type)}</Text>
      <Text className={styles.healthValue}>
        {item.value}
        <Text className={styles.healthUnit}>{getHealthUnit(item.type)}</Text>
      </Text>
      <Text className={styles.healthLabel}>{getHealthLabel(item.type)}</Text>
      <Text className={styles.healthStatus}>{getHealthStatus(item.status)}</Text>
    </View>
  )), [healthDataList, getHealthIcon, getHealthUnit, getHealthLabel, getHealthStatus]);

  const renderedMedications = useMemo(() => medications.map(medication => (
    <View key={medication.id} className={styles.medicationCard} style={{ borderLeftColor: medication.color }}>
      <View className={styles.medicationIcon} style={{ background: `${medication.color}20` }}>💊</View>
      <View className={styles.medicationInfo}>
        <Text className={styles.medicationName}>{medication.name}</Text>
        <Text className={styles.medicationDosage}>每次 {medication.dosage}{medication.unit}</Text>
        <Text className={styles.medicationTimes}>⏰ {medication.times.join('、')}</Text>
      </View>
      <View className={styles.medicationActions}>
        <Text className={styles.editBtn} onClick={() => handleEditMedication(medication)}>✏️</Text>
        <Text className={styles.deleteBtn} onClick={() => handleDeleteMedication(medication.id)}>🗑️</Text>
      </View>
    </View>
  )), [medications, handleEditMedication, handleDeleteMedication]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.backBtn} onClick={() => Taro.navigateBack()}>
          <Text className={styles.backIcon}>‹</Text>
          <Text className={styles.backText}>返回</Text>
        </View>
        <View className={styles.elderName}>👵 监护对象：王奶奶</View>
        <View className={styles.elderInfo}>
          <View className={styles.elderAvatar}>👵</View>
          <View>
            <View className={styles.elderStatus}>
              <Text className={styles.onlineDot} />
              {elderInfo.status === 'online' ? '在线' : elderInfo.status === 'sos' ? '紧急求助中' : '离线'}
            </View>
            <Text className={styles.lastUpdate}>绑定时间：{elderInfo.bindTime}</Text>
          </View>
        </View>
      </View>

      {hasSOSAlert && (
        <View className={`${styles.alertCard} ${styles.active}`}>
          <Text className={styles.alertBadge}>🚨 紧急</Text>
          <Text className={styles.alertTitle}>紧急求助警报</Text>
          <Text className={styles.alertDesc}>
            检测到王奶奶触发SOS求助！\n
            位置：{sosData.location}\n
            当时心率：{sosData.heartRate}次/分
          </Text>
          <Text className={styles.alertTime}>触发时间：{sosData.time}</Text>
          <View className={styles.alertActions}>
            <Text className={styles.alertCallBtn} onClick={handleCallElder}>
              📞 立即联系
            </Text>
            <Text className={styles.alertDismissBtn} onClick={handleDismissSOS}>
              已收到
            </Text>
          </View>
        </View>
      )}

      <View className={styles.sectionTitle}>
        <Text>📊 实时健康数据</Text>
        <Text className={styles.sectionBadge}>🟢 实时同步</Text>
      </View>

      <View className={styles.healthGrid}>
        {renderedHealthData}
      </View>

      <View className={styles.sectionTitle}>
        <Text>💊 用药管理</Text>
        <Text className={styles.addMedBtn} onClick={handleAddMedication}>+ 添加药物</Text>
      </View>

      <View className={styles.medicationList}>
        {renderedMedications}
      </View>

      <View className={styles.sectionTitle}>
        <Text>⚡ 快捷操作</Text>
      </View>

      <View className={styles.actionBtns}>
        <View className={styles.actionBtn} onClick={handleCallElder}>
          <Text className={styles.actionIcon}>📞</Text>
          <Text className={styles.actionName}>拨打电话</Text>
        </View>
        <View className={styles.actionBtn} onClick={handleViewLocation}>
          <Text className={styles.actionIcon}>📍</Text>
          <Text className={styles.actionName}>查看位置</Text>
        </View>
      </View>

      <View className={styles.simulateSection}>
        <Text className={styles.simulateTip}>⚠️ 演示功能：点击下方按钮模拟老人触发SOS</Text>
        <View className={styles.simulateBtn} onClick={handleSimulateSOS}>
          <Text className={styles.simulateBtnText}>🚨 模拟SOS求助</Text>
        </View>
      </View>

      {showAddModal && (
        <View className={styles.modal} onClick={() => setShowAddModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>{editingMedication ? '编辑药物' : '添加药物'}</Text>
              <Text className={styles.closeBtn} onClick={() => setShowAddModal(false)}>✕</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>药物名称</Text>
              <Input
                className={styles.formInput}
                value={formData.name}
                placeholder='请输入药物名称'
                onInput={(e: any) => setFormData(prev => ({ ...prev, name: e.detail.value }))}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>剂量</Text>
              <View className={styles.formRow}>
                <Input
                  className={styles.formInput}
                  value={formData.dosage}
                  placeholder='请输入剂量'
                  type='digit'
                  onInput={(e: any) => setFormData(prev => ({ ...prev, dosage: e.detail.value }))}
                />
                <View className={styles.unitSelector}>
                  {['片', '粒', '胶囊', '毫升', '克'].map((unit) => (
                    <View
                      key={unit}
                      className={`${styles.unitOption} ${formData.unit === unit ? styles.selected : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, unit }))}
                    >
                      {unit}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>服药时间</Text>
              <View className={styles.timeSlots}>
                {['06:00', '08:00', '10:00', '12:00', '14:00', '18:00', '20:00', '22:00'].map((time) => (
                  <View
                    key={time}
                    className={`${styles.timeSlot} ${formData.times.includes(time) ? styles.selected : ''}`}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        times: prev.times.includes(time)
                          ? prev.times.filter(t => t !== time)
                          : [...prev.times, time].sort()
                      }));
                    }}
                  >
                    {time}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>服用方式</Text>
              <View className={styles.formRow}>
                <View
                  className={`${styles.dosageOption} ${formData.withFood ? styles.selected : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, withFood: true }))}
                >
                  🍽️ 饭后
                </View>
                <View
                  className={`${styles.dosageOption} ${!formData.withFood ? styles.selected : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, withFood: false }))}
                >
                  ☀️ 空腹
                </View>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注</Text>
              <Input
                className={styles.formInput}
                value={formData.notes}
                placeholder='选填'
                onInput={(e: any) => setFormData(prev => ({ ...prev, notes: e.detail.value }))}
              />
            </View>

            <View className={styles.formActions}>
              <View className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                <Text>取消</Text>
              </View>
              <View className={styles.submitBtn} onClick={() => handleSaveMedication(formData)}>
                <Text>{editingMedication ? '保存' : '添加'}</Text>
              </View>
            </View>

            <View className={styles.syncTip}>
              ✨ 设置完成后，会自动同步到王奶奶的设备上，并在指定时间提醒她服药。
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default React.memo(GuardianPage);