import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Picker, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useOrderStore } from '../../store/orderStore';
import { useUserStore } from '../../store/userStore';
import { cities, fishingTypes, hotTags } from '../../data/common';
import type { Order, FishingType, FishType } from '../../types/order';
import styles from './index.module.scss';

const FISH_OPTIONS: FishType[] = ['鲫鱼', '鲤鱼', '草鱼', '青鱼', '黑鱼', '翘嘴', '鲈鱼', '罗非', '鳜鱼', '鲶鱼'];
const DURATION_OPTIONS = ['半天', '1天', '2天1晚', '3天2晚', '4天3晚'];

const OrderPublishPage: React.FC = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const addOrder = useOrderStore((s) => s.addOrder);

  const [title, setTitle] = useState('');
  const [spot, setSpot] = useState('');
  const [cityIndex, setCityIndex] = useState(0);
  const [date, setDate] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [durationIndex, setDurationIndex] = useState(1);
  const [fishingIndex, setFishingIndex] = useState(1);
  const [selectedFish, setSelectedFish] = useState<FishType[]>(['鲫鱼']);
  const [peopleNeeded, setPeopleNeeded] = useState(2);
  const [price, setPrice] = useState(200);
  const [isFree, setIsFree] = useState(false);
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  const city = cities[cityIndex].name;
  const duration = DURATION_OPTIONS[durationIndex];
  const fishingType = fishingTypes[fishingIndex + 1].value as FishingType;

  const toggleFish = (f: FishType) => {
    setSelectedFish((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const adjustPeople = (delta: number) => {
    setPeopleNeeded((n) => Math.max(1, Math.min(10, n + delta)));
  };

  const adjustPrice = (delta: number) => {
    setPrice((p) => Math.max(0, p + delta));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请填写订单标题', icon: 'none' });
      return;
    }
    if (!spot.trim()) {
      Taro.showToast({ title: '请填写钓点', icon: 'none' });
      return;
    }
    if (!description.trim()) {
      Taro.showToast({ title: '请填写详细说明', icon: 'none' });
      return;
    }
    if (selectedFish.length === 0) {
      Taro.showToast({ title: '请至少选择一种目标鱼', icon: 'none' });
      return;
    }

    const newOrder: Order = {
      id: `o_user_${Date.now()}`,
      publisherId: currentUser?.id || 'u_current',
      publisherName: currentUser?.nickname || '我',
      publisherAvatar: currentUser?.avatar || '',
      publisherLevel: currentUser?.level || 1,
      publisherYears: currentUser?.years || 1,
      title: title.trim(),
      spot: spot.trim(),
      city,
      spotImage: `https://picsum.photos/id/${1015 + (Date.now() % 5)}/750/500`,
      date,
      duration,
      fishTypes: selectedFish,
      fishingType,
      peopleNeeded,
      peopleJoined: 0,
      price: isFree ? 0 : price,
      description: description.trim(),
      requirements: requirements.trim() || undefined,
      status: 'recruiting',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
      invitationCount: 0
    };

    addOrder(newOrder);
    Taro.showToast({ title: '发布成功，等待钓友邀请', icon: 'success' });
    Taro.vibrateShort({ type: 'medium' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 800);
  };

  const previewTags = useMemo(() => hotTags.slice(0, 4), []);

  return (
    <View className={styles.page}>
      <View className={styles.tipBar}>
        <Text className={styles.tipIcon}>💡</Text>
        <Text className={styles.tipText}>填写越详细，越容易找到合适的搭子哦～</Text>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardBar} />
          <Text className={styles.cardTitleText}>基础信息</Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>订单标题</Text>
          <Input
            className={styles.fieldInput}
            placeholder="例：千岛湖路亚·翘嘴专场"
            placeholderClass={styles.placeholder}
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={30}
          />
          <Text className={styles.fieldCounter}>{title.length}/30</Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>详细说明</Text>
          <Textarea
            className={styles.textarea}
            placeholder="介绍一下钓点情况、饵料安排、集合时间地点等..."
            placeholderClass={styles.placeholder}
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={300}
            autoHeight
          />
          <Text className={styles.fieldCounter}>{description.length}/300</Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>招募要求（选填）</Text>
          <Textarea
            className={styles.textarea}
            placeholder="例：需 5 年以上钓龄，自带路亚装备"
            placeholderClass={styles.placeholder}
            value={requirements}
            onInput={(e) => setRequirements(e.detail.value)}
            maxlength={150}
            autoHeight
          />
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardBar} />
          <Text className={styles.cardTitleText}>钓点信息</Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>钓点名称</Text>
          <Input
            className={styles.fieldInput}
            placeholder="例：千岛湖中心湖区"
            placeholderClass={styles.placeholder}
            value={spot}
            onInput={(e) => setSpot(e.detail.value)}
            maxlength={40}
          />
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>所在城市</Text>
          <Picker
            mode="selector"
            range={cities.map((c) => c.name)}
            value={cityIndex}
            onChange={(e) => setCityIndex(Number(e.detail.value))}
          >
            <View className={styles.pickerField}>
              <Text className={styles.pickerValue}>📍 {city}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>出行日期</Text>
          <Picker
            mode="date"
            value={date}
            start={dayjs().format('YYYY-MM-DD')}
            onChange={(e) => setDate(e.detail.value)}
          >
            <View className={styles.pickerField}>
              <Text className={styles.pickerValue}>📅 {date}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>时长</Text>
          <Picker
            mode="selector"
            range={DURATION_OPTIONS}
            value={durationIndex}
            onChange={(e) => setDurationIndex(Number(e.detail.value))}
          >
            <View className={styles.pickerField}>
              <Text className={styles.pickerValue}>⏱ {duration}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardBar} />
          <Text className={styles.cardTitleText}>钓鱼信息</Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>钓法</Text>
          <Picker
            mode="selector"
            range={fishingTypes.slice(1).map((f) => f.label)}
            value={fishingIndex}
            onChange={(e) => setFishingIndex(Number(e.detail.value))}
          >
            <View className={styles.pickerField}>
              <Text className={styles.pickerValue}>🎣 {fishingType}</Text>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </Picker>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>目标鱼种（可多选）</Text>
          <View className={styles.chipGrid}>
            {FISH_OPTIONS.map((f) => (
              <View
                key={f}
                className={classnames(styles.chip, selectedFish.includes(f) && styles.chipActive)}
                onClick={() => toggleFish(f)}
              >
                <Text className={classnames(styles.chipText, selectedFish.includes(f) && styles.chipTextActive)}>
                  {f}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.cardTitle}>
          <View className={styles.cardBar} />
          <Text className={styles.cardTitleText}>招募信息</Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>招募人数</Text>
          <View className={styles.stepper}>
            <View
              className={classnames(styles.stepperBtn, peopleNeeded <= 1 && styles.stepperBtnDisabled)}
              onClick={() => peopleNeeded > 1 && adjustPeople(-1)}
            >
              <Text className={styles.stepperBtnText}>−</Text>
            </View>
            <Text className={styles.stepperValue}>{peopleNeeded} 人</Text>
            <View
              className={classnames(styles.stepperBtn, peopleNeeded >= 10 && styles.stepperBtnDisabled)}
              onClick={() => peopleNeeded < 10 && adjustPeople(1)}
            >
              <Text className={styles.stepperBtnText}>＋</Text>
            </View>
          </View>
        </View>

        <View className={styles.field}>
          <View className={styles.fieldLabelRow}>
            <Text className={styles.fieldLabel}>人均费用</Text>
            <View className={styles.freeToggle}>
              <Text className={styles.freeToggleText}>免费</Text>
              <Switch checked={isFree} onChange={(e) => setIsFree(e.detail.value)} color="#0e7c7b" />
            </View>
          </View>
          {isFree ? (
            <View className={styles.freePrice}>
              <Text className={styles.freePriceText}>🆓 钓友免费参与</Text>
            </View>
          ) : (
            <View className={styles.priceInputRow}>
              <Text className={styles.pricePrefix}>¥</Text>
              <Input
                className={styles.priceInput}
                type="number"
                value={String(price)}
                onInput={(e) => setPrice(Math.max(0, Number(e.detail.value) || 0))}
              />
              <Text className={styles.priceSuffix}>/人</Text>
            </View>
          )}
          <View className={styles.priceQuickRow}>
            {[100, 200, 380, 500, 800].map((v) => (
              <View
                key={v}
                className={classnames(styles.priceChip, !isFree && price === v && styles.priceChipActive)}
                onClick={() => {
                  setIsFree(false);
                  setPrice(v);
                }}
              >
                <Text className={classnames(styles.priceChipText, !isFree && price === v && styles.priceChipTextActive)}>
                  ¥{v}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.suggestionRow}>
        <Text className={styles.suggestionTitle}>热门标签</Text>
        <View className={styles.suggestionTags}>
          {previewTags.map((t) => (
            <View key={t.id} className={styles.suggestionTag}>
              <Text className={styles.suggestionTagText}>#{t.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.submitBar}>
        <View className={styles.submitBtn} onClick={handleSubmit}>
          <Text className={styles.submitBtnText}>立即发布</Text>
        </View>
      </View>
    </View>
  );
};

export default OrderPublishPage;
