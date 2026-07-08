import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { medicationList as initialMedicationList, Medication, MedicationRecord } from '@/data/medication';

const MedicationPage: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>(initialMedicationList);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
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
  }, [editingMedication, showModal]);

  const getToday = useCallback(() => {
    return currentTime.toISOString().split('T')[0];
  }, [currentTime]);

  const getMedicationStatus = useCallback((med: Medication, time: string): 'taken' | 'missed' | 'pending' => {
    const today = getToday();
    const record = med.records.find(r => r.date === today && r.time === time);
    if (record) {
      return record.status;
    }

    const now = currentTime.toTimeString().substring(0, 5);
    if (time < now) {
      return 'missed';
    }

    return 'pending';
  }, [currentTime, getToday]);

  const isTimeClose = useCallback((target: string, current: string) => {
    const [tH, tM] = target.split(':').map(Number);
    const [cH, cM] = current.split(':').map(Number);
    const diff = Math.abs((tH * 60 + tM) - (cH * 60 + cM));
    return diff <= 30;
  }, []);

  const getCurrentMedications = useMemo(() => {
    const now = currentTime.toTimeString().substring(0, 5);
    const result: Array<{ medication: Medication; time: string; status: 'taken' | 'missed' | 'pending' }> = [];

    medications.forEach(med => {
      med.times.forEach(time => {
        const status = getMedicationStatus(med, time);
        if (time <= now || isTimeClose(time, now)) {
          result.push({ medication: med, time, status });
        }
      });
    });

    return result.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, currentTime, getMedicationStatus, isTimeClose]);

  const handleTakeMedication = useCallback((medication: Medication, time: string) => {
    const today = getToday();
    const newRecord: MedicationRecord = {
      id: 'r' + Date.now(),
      date: today,
      time,
      status: 'taken',
      takenAt: currentTime.toTimeString().substring(0, 5)
    };

    setMedications(prev => prev.map(med => {
      if (med.id === medication.id) {
        return {
          ...med,
          records: [...med.records, newRecord]
        };
      }
      return med;
    }));

    Taro.showToast({
      title: '已记录服药',
      icon: 'success'
    });
  }, [getToday, currentTime]);

  const handleAddMedication = useCallback(() => {
    setEditingMedication(null);
    setShowModal(true);
  }, []);

  const handleEditMedication = useCallback((medication: Medication) => {
    setEditingMedication(medication);
    setShowModal(true);
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

  const handleSaveMedication = useCallback(() => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入药物名称', icon: 'none' });
      return;
    }

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
    setShowModal(false);
    setEditingMedication(null);
  }, [formData, editingMedication]);

  const getTodayStats = useMemo(() => {
    const today = getToday();
    let total = 0;
    let taken = 0;
    let missed = 0;

    medications.forEach(med => {
      med.times.forEach(time => {
        total++;
        const record = med.records.find(r => r.date === today && r.time === time);
        if (record) {
          if (record.status === 'taken') taken++;
          else if (record.status === 'missed') missed++;
        } else {
          const now = currentTime.toTimeString().substring(0, 5);
          if (time < now) missed++;
        }
      });
    });

    return { total, taken, missed, pending: total - taken - missed };
  }, [medications, currentTime, getToday]);

  const getUpcomingReminders = useMemo(() => {
    const now = currentTime.toTimeString().substring(0, 5);
    const result: Array<{ medication: Medication; time: string }> = [];

    medications.forEach(med => {
      med.times.forEach(time => {
        if (time > now) {
          result.push({ medication: med, time });
        }
      });
    });

    return result.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 3);
  }, [medications, currentTime]);

  const getHistoryRecords = useMemo(() => {
    const records: Array<{ medication: Medication; record: MedicationRecord }> = [];
    medications.forEach(med => {
      med.records.forEach(record => {
        records.push({ medication: med, record });
      });
    });
    return records.sort((a, b) => b.record.date.localeCompare(a.record.date)).slice(0, 5);
  }, [medications]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'taken': return '✓';
      case 'missed': return '✗';
      default: return '○';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'taken': return '已服用';
      case 'missed': return '未服用';
      default: return '待服用';
    }
  }, []);

  const stats = getTodayStats;
  const currentMeds = getCurrentMedications;
  const upcomingReminders = getUpcomingReminders;
  const historyRecords = getHistoryRecords;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>💊 用药提醒</Text>
        <View className={styles.addBtn} onClick={handleAddMedication}>
          <Text className={styles.addIcon}>+</Text>
          <Text className={styles.addText}>添加药物</Text>
        </View>
      </View>

      <View className={styles.todaySummary}>
        <Text className={styles.summaryTitle}>今日服药情况</Text>
        <View className={styles.summaryStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.taken}</Text>
            <Text className={styles.statLabel}>已服用</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.missed}</Text>
            <Text className={styles.statLabel}>未服用</Text>
          </View>
        </View>
      </View>

      {upcomingReminders.length > 0 && (
        <View className={styles.reminderCard}>
          <Text className={styles.reminderTitle}>
            <Text className={styles.reminderIcon}>⏰</Text>
            即将提醒
          </Text>
          <Text className={styles.reminderContent}>
            {upcomingReminders.map((item, index) => (
              <Text key={index}>
                {index > 0 ? '、' : ''}{item.medication.name}（{item.time}）
              </Text>
            ))}
          </Text>
        </View>
      )}

      {currentMeds.length > 0 && (
        <View className={styles.timeSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📋</Text>
            当前时段
          </Text>
          <View className={styles.medicationList}>
            {currentMeds.map((item, index) => (
              <View
                key={index}
                className={styles.medicationCard}
                style={{ borderLeftColor: item.medication.color }}
              >
                <View
                  className={styles.medicationIcon}
                  style={{ background: `${item.medication.color}20` }}
                >
                  💊
                </View>
                <View className={styles.medicationInfo}>
                  <Text className={styles.medicationName}>{item.medication.name}</Text>
                  <Text className={styles.medicationDosage}>
                    {item.medication.dosage}{item.medication.unit} · {item.time}
                  </Text>
                  <Text className={styles.medicationNotes}>
                    <Text className={styles.notesIcon}>🍽️</Text>
                    {item.medication.withFood ? '饭后服用' : '空腹服用'}
                    {item.medication.notes && ` · ${item.medication.notes}`}
                  </Text>
                </View>
                <View className={styles.actionArea}>
                  <View
                    className={`${styles.takenBtn} ${styles[item.status]}`}
                    onClick={() => item.status !== 'taken' && handleTakeMedication(item.medication, item.time)}
                  >
                    {getStatusIcon(item.status)}
                  </View>
                  <Text className={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.timeSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📦</Text>
          全部药物
        </Text>
        <View className={styles.medicationList}>
          {medications.map((medication) => (
            <View
              key={medication.id}
              className={styles.medicationCard}
              style={{ borderLeftColor: medication.color }}
            >
              <View
                className={styles.medicationIcon}
                style={{ background: `${medication.color}20` }}
              >
                💊
              </View>
              <View className={styles.medicationInfo}>
                <Text className={styles.medicationName}>{medication.name}</Text>
                <Text className={styles.medicationDosage}>
                  每次 {medication.dosage}{medication.unit}
                </Text>
                <Text className={styles.medicationNotes}>
                  <Text className={styles.notesIcon}>⏰</Text>
                  {medication.times.join('、')}
                </Text>
              </View>
              <View className={styles.medicationActions}>
                <View className={styles.editBtn} onClick={() => handleEditMedication(medication)}>
                  <Text>✏️</Text>
                </View>
                <View className={styles.deleteBtn} onClick={() => handleDeleteMedication(medication.id)}>
                  <Text>🗑️</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.historySection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📜</Text>
          服药记录
        </Text>
        <View className={styles.historyList}>
          {historyRecords.map((item, index) => (
            <View key={index} className={styles.historyItem}>
              <View
                className={styles.historyDot}
                style={{ background: item.record.status === 'taken' ? '#52c41a' : '#ff4d4f' }}
              />
              <Text className={styles.historyTime}>
                {item.record.date} {item.record.time}
              </Text>
              <Text className={styles.historyStatus}>
                {item.medication.name} - {item.record.status === 'taken' ? `已服用(${item.record.takenAt})` : '未服用'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {showModal && (
        <View className={styles.modal} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>{editingMedication ? '编辑药物' : '添加新药物'}</Text>
              <View className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</View>
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
              <View className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                <Text>取消</Text>
              </View>
              <View className={styles.submitBtn} onClick={handleSaveMedication}>
                <Text>{editingMedication ? '保存' : '添加'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default React.memo(MedicationPage);