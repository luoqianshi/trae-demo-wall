import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, Textarea, Picker, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useUserStore } from '../../store/userStore';
import { updateProfile, getCurrentUser } from '../../services/api';
import { cities, hotTags } from '../../data/common';
import type { User } from '../../types/user';
import { getLevelLabel } from '../../utils/format';
import styles from './index.module.scss';

const GENDERS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' }
];

const ProfileEditPage: React.FC = () => {
  const { currentUser, setUser, fetchUser } = useUserStore();
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [locationIndex, setLocationIndex] = useState(0);
  const [years, setYears] = useState(currentUser?.years || 1);
  const [genderIndex, setGenderIndex] = useState(currentUser?.gender === 'female' ? 1 : 0);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentUser?.tags || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 初始数据已通过 zustand 获取
    if (currentUser) {
      setNickname(currentUser.nickname);
      setBio(currentUser.bio);
      setYears(currentUser.years);
      setGenderIndex(currentUser.gender === 'female' ? 1 : 0);
      setSelectedTags(currentUser.tags);
      const idx = cities.findIndex((c) => c.name === currentUser.location);
      setLocationIndex(idx >= 0 ? idx : 0);
    }
  }, [currentUser?.id]);

  const location = cities[locationIndex]?.name || '杭州';
  const gender = GENDERS[genderIndex].value as 'male' | 'female';

  const tagOptions = useMemo(() => hotTags.map((t) => t.name), []);

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 5) {
        Taro.showToast({ title: '最多选择 5 个标签', icon: 'none' });
        return prev;
      }
      return [...prev, t];
    });
  };

  const adjustYears = (delta: number) => {
    setYears((y) => Math.max(1, Math.min(50, y + delta)));
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    if (selectedTags.length === 0) {
      Taro.showToast({ title: '请至少选择一个擅长标签', icon: 'none' });
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<User> = {
        nickname: nickname.trim(),
        bio: bio.trim(),
        location,
        years,
        gender,
        tags: selectedTags
      };
      await updateProfile(payload);
      // 重新拉取以保证与后端一致
      const res = await getCurrentUser();
      setUser(res.data.user);
      await fetchUser();
      Taro.showToast({ title: '保存成功', icon: 'success' });
      Taro.vibrateShort({ type: 'light' });
      setTimeout(() => Taro.navigateBack(), 800);
    } catch (err) {
      console.error('[ProfileEdit] save failed:', err);
      Taro.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '200rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#86909c', fontSize: '28rpx' }}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.avatarSection}>
        <View className={styles.avatarWrap}>
          <Image className={styles.avatar} src={currentUser.avatar} mode="aspectFill" />
          <View className={styles.cameraBtn}>
            <Text className={styles.cameraIcon}>📷</Text>
          </View>
        </View>
        <Text className={styles.avatarTip}>点击更换头像</Text>
        <View className={styles.levelBadge}>
          <Text className={styles.levelBadgeText}>Lv{currentUser.level} · {getLevelLabel(currentUser.level)}</Text>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardBar} />
          <Text className={styles.cardTitleText}>基础信息</Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>昵称</Text>
          <Input
            className={styles.fieldInput}
            placeholder="请输入昵称"
            placeholderClass={styles.placeholder}
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
            maxlength={20}
          />
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>性别</Text>
          <View className={styles.genderRow}>
            {GENDERS.map((g, idx) => (
              <View
                key={g.value}
                className={classnames(styles.genderItem, genderIndex === idx && styles.genderItemActive)}
                onClick={() => setGenderIndex(idx)}
              >
                <Text className={styles.genderIcon}>{g.value === 'male' ? '👨' : '👩'}</Text>
                <Text className={classnames(styles.genderText, genderIndex === idx && styles.genderTextActive)}>
                  {g.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>所在城市</Text>
          <Picker
            mode="selector"
            range={cities.map((c) => c.name)}
            value={locationIndex}
            onChange={(e) => setLocationIndex(Number(e.detail.value))}
          >
            <View className={styles.pickerField}>
              <Text className={styles.pickerValue}>📍 {location}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>钓龄</Text>
          <View className={styles.stepper}>
            <View
              className={classnames(styles.stepperBtn, years <= 1 && styles.stepperBtnDisabled)}
              onClick={() => years > 1 && adjustYears(-1)}
            >
              <Text className={styles.stepperBtnText}>−</Text>
            </View>
            <Text className={styles.stepperValue}>{years} 年</Text>
            <View
              className={classnames(styles.stepperBtn, years >= 50 && styles.stepperBtnDisabled)}
              onClick={() => years < 50 && adjustYears(1)}
            >
              <Text className={styles.stepperBtnText}>＋</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardBar} />
          <Text className={styles.cardTitleText}>个人介绍</Text>
        </View>

        <View className={styles.field}>
          <Textarea
            className={styles.textarea}
            placeholder="介绍一下你自己吧，擅长的钓法、常去的钓点、钓友评价..."
            placeholderClass={styles.placeholder}
            value={bio}
            onInput={(e) => setBio(e.detail.value)}
            maxlength={100}
            autoHeight
          />
          <Text className={styles.fieldCounter}>{bio.length}/100</Text>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardBar} />
          <Text className={styles.cardTitleText}>擅长标签</Text>
        </View>
        <View className={styles.field}>
          <Text className={styles.fieldHint}>选择 1-5 个最擅长的标签，让其他钓友了解你</Text>
          <View className={styles.chipGrid}>
            {tagOptions.map((t) => (
              <View
                key={t}
                className={classnames(styles.chip, selectedTags.includes(t) && styles.chipActive)}
                onClick={() => toggleTag(t)}
              >
                <Text className={classnames(styles.chipText, selectedTags.includes(t) && styles.chipTextActive)}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
          {selectedTags.length > 0 && (
            <Text className={styles.tagHint}>已选 {selectedTags.length}/5</Text>
          )}
        </View>
      </View>

      <View className={styles.submitBar}>
        <View
          className={classnames(styles.submitBtn, saving && styles.submitBtnDisabled)}
          onClick={saving ? undefined : handleSave}
        >
          <Text className={styles.submitBtnText}>{saving ? '保存中...' : '保存修改'}</Text>
        </View>
      </View>
    </View>
  );
};

export default ProfileEditPage;
