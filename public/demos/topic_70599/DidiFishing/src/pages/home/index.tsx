import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import OrderCard from '../../components/OrderCard';
import Empty from '../../components/Empty';
import { getOrders, createInvitation } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { useOrderStore } from '../../store/orderStore';
import type { Order } from '../../types/order';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('杭州');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeHotTag, setActiveHotTag] = useState('all');

  const currentUser = useUserStore((s) => s.currentUser);

  const hotTags = useMemo(
    () => [
      { id: 'all', label: '全部', icon: '' },
      { id: '路亚', label: '路亚', icon: '🎣' },
      { id: '台钓', label: '台钓', icon: '🎏' },
      { id: '海钓', label: '海钓', icon: '🌊' },
      { id: '矶钓', label: '矶钓', icon: '🪨' },
      { id: '筏钓', label: '筏钓', icon: '🛶' },
      { id: '传统钓', label: '传统钓', icon: '🎋' },
      { id: '免费', label: '免费', icon: '🆓' }
    ],
    []
  );

  const filterOptions = [
    { value: 'all', label: '综合排序' },
    { value: 'date', label: '出发日期' },
    { value: 'price', label: '价格' },
    { value: 'distance', label: '距离' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: '不限时间' },
    { value: 'weekend', label: '本周末' },
    { value: 'week', label: '本周' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useDidShow(() => {
    fetchOrders();
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders();
      const userOrders = useOrderStore.getState().userOrders;
      const merged: Order[] = [...userOrders, ...res.data.list];
      // 仅展示招募中 + 当前用户的进行中订单
      const list = merged.filter(
        (o) => o.status === 'recruiting' || o.publisherId === 'u_current' || o.matchedUserId === 'u_current'
      );
      // 去重（按 id）
      const seen = new Set<string>();
      const dedup = list.filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
      setOrders(dedup);
    } catch (err) {
      console.error('[Home] fetchOrders failed:', err);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
      Taro.stopPullDownRefresh();
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => o.status === 'recruiting');
    if (activeHotTag !== 'all') {
      if (activeHotTag === '免费') {
        result = result.filter((o) => o.price === 0);
      } else {
        result = result.filter((o) => o.fishingType === activeHotTag || o.fishTypes.includes(activeHotTag as any));
      }
    }
    return result;
  }, [orders, activeHotTag]);

  const handleOrderClick = (order: Order) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` });
  };

  const handleInvite = async (order: Order) => {
    if (!currentUser) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (order.publisherId === currentUser.id) {
      Taro.showToast({ title: '不能邀请自己', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '发起邀请',
      content: `确认向「${order.publisherName}」发起带钓邀请吗？\n\n订单：${order.title}\n时间：${order.date}`,
      confirmText: '确认邀请',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await createInvitation({
            orderId: order.id,
            orderTitle: order.title,
            inviterId: currentUser.id,
            inviterName: currentUser.nickname,
            inviterAvatar: currentUser.avatar,
            inviterLevel: currentUser.level,
            inviterYears: currentUser.years,
            inviterBio: currentUser.bio,
            inviterTags: currentUser.tags,
            publisherId: order.publisherId,
            message: `${currentUser.nickname}：我是 ${currentUser.years} 年钓龄的钓友，希望能同行！`
          });
          Taro.showToast({ title: '邀请已发送', icon: 'success' });
          Taro.vibrateShort({ type: 'light' });
        } catch (err) {
          console.error('[Home] invite failed:', err);
          Taro.showToast({ title: '邀请失败', icon: 'none' });
        }
      }
    });
  };

  const handlePublish = () => {
    Taro.navigateTo({ url: '/pages/order-publish/index' });
  };

  const handleCityChange = () => {
    Taro.showActionSheet({
      itemList: ['杭州', '苏州', '宁波', '舟山', '湖州', '广州'],
      success: (res) => {
        const names = ['杭州', '苏州', '宁波', '舟山', '湖州', '广州'];
        setCity(names[res.tapIndex]);
        Taro.showToast({ title: `已切换到${names[res.tapIndex]}`, icon: 'none' });
      }
    });
  };

  const handleFilterTap = (val: string) => {
    setActiveFilter(val);
    Taro.showToast({ title: '排序已应用', icon: 'none' });
  };

  const handleDateRangeTap = () => {
    Taro.showActionSheet({
      itemList: dateRangeOptions.map((d) => d.label),
      success: () => {
        Taro.showToast({ title: '时间筛选已应用', icon: 'none' });
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.brand}>
            <View className={styles.brandIcon}>
              <Text>🎣</Text>
            </View>
            <View className={styles.brandText}>
              <Text className={styles.brandTitle}>滴滴带钓</Text>
              <Text className={styles.brandSubtitle}>找搭子，一起爆护</Text>
            </View>
          </View>
          <View className={styles.city} onClick={handleCityChange}>
            <Text className={styles.cityIcon}>📍</Text>
            <Text className={styles.cityText}>{city}</Text>
            <Text className={styles.cityArrow}>▾</Text>
          </View>
        </View>

        <View className={styles.searchBar} onClick={() => Taro.showToast({ title: '搜索功能开发中', icon: 'none' })}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Text className={styles.searchText}>搜索钓点、鱼种、钓友...</Text>
        </View>

        <View className={styles.featured} onClick={handlePublish}>
          <View className={styles.featuredIcon}>
            <Text>➕</Text>
          </View>
          <View className={styles.featuredInfo}>
            <Text className={styles.featuredTitle}>发布带钓订单</Text>
            <Text className={styles.featuredDesc}>找搭子同钓，开启爆护之旅</Text>
          </View>
          <Text className={styles.cityArrow}>›</Text>
        </View>
      </View>

      <View className={styles.filterBar}>
        {filterOptions.map((opt) => (
          <View
            key={opt.value}
            className={classnames(styles.filterItem, activeFilter === opt.value && styles.filterItemActive)}
            onClick={() => handleFilterTap(opt.value)}
          >
            <Text className={styles.filterText}>{opt.label}</Text>
            <Text className={styles.filterIcon}>▾</Text>
          </View>
        ))}
        <View className={styles.filterExtra} onClick={handleDateRangeTap}>
          <Text className={styles.filterExtraText}>📅 时间</Text>
        </View>
      </View>

      <View className={styles.hotSection}>
        <ScrollView scrollX className={styles.hotScroll} enhanced showScrollbar={false}>
          {hotTags.map((tag) => (
            <View
              key={tag.id}
              className={classnames(styles.hotTag, activeHotTag === tag.id && styles.hotTagActive)}
              onClick={() => setActiveHotTag(tag.id)}
            >
              {tag.icon && <Text className={styles.hotTagIcon}>{tag.icon}</Text>}
              <Text className={styles.hotTagText}>{tag.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.list}>
        <View className={styles.sectionTitle}>
          <View className={styles.sectionBar} />
          <Text className={styles.sectionTitleText}>附近订单</Text>
          <Text className={styles.sectionTitleSub}>共 {filteredOrders.length} 单</Text>
        </View>

        {!loading && filteredOrders.length === 0 ? (
          <Empty
            icon="🪝"
            title="暂时没有匹配的订单"
            desc="试试切换钓法，或者发布一个订单吧～"
            actionText="发布订单"
            onAction={handlePublish}
          />
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => handleOrderClick(order)}
              onInvite={() => handleInvite(order)}
              isOwner={currentUser?.id === order.publisherId}
            />
          ))
        )}
      </View>

      <View className={styles.publishBtn} onClick={handlePublish}>
        <Text className={styles.publishBtnIcon}>＋</Text>
        <Text className={styles.publishBtnText}>发单</Text>
      </View>
    </View>
  );
};

export default HomePage;
